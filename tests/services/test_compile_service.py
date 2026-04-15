import subprocess
from unittest.mock import MagicMock, patch

import pytest

from app.models.compile import CompileRequest, FileEntry
from app.services.compile_service import CompileService


@pytest.fixture
def service():
    return CompileService()


def _run_result(returncode=0, stdout=""):
    r = MagicMock()
    r.returncode = returncode
    r.stdout = stdout
    return r


def test_compile_success(service, tmp_path):
    with patch("shutil.which", return_value="/usr/bin/pdflatex"), \
         patch("tempfile.mkdtemp", return_value=str(tmp_path)), \
         patch("subprocess.run") as mock_run, \
         patch("os.path.exists", return_value=True), \
         patch("builtins.open", MagicMock()), \
         patch("shutil.rmtree"):
        mock_run.return_value = _run_result(0, "Success log")
        # Patch open to return pdf bytes
        with patch.object(service, "_run_latex", return_value=("log output", b"%PDF-1.4")):
            req = CompileRequest(rootFile="main.tex", files=[])
            result = service.compile(req)
    assert result.success is True
    assert result.pdf == b"%PDF-1.4"


def test_compile_failure_non_zero(service, tmp_path):
    with patch("shutil.which", return_value="/usr/bin/pdflatex"), \
         patch("tempfile.mkdtemp", return_value=str(tmp_path)), \
         patch("shutil.rmtree"):
        with patch.object(service, "_run_latex", return_value=("error log", None)):
            req = CompileRequest(rootFile="main.tex", files=[])
            result = service.compile(req)
    assert result.success is False
    assert result.pdf is None
    assert "error log" in result.log


def test_compile_engine_not_found(service):
    with patch("shutil.which", return_value=None):
        req = CompileRequest(engine="pdflatex", files=[], rootFile="main.tex")
        result = service.compile(req)
    assert result.success is False
    assert "não encontrado" in result.log


def test_compile_timeout(service, tmp_path):
    with patch("shutil.which", return_value="/usr/bin/pdflatex"), \
         patch("tempfile.mkdtemp", return_value=str(tmp_path)), \
         patch("shutil.rmtree"):
        with patch.object(service, "_run_latex", side_effect=subprocess.TimeoutExpired("pdflatex", 60)):
            req = CompileRequest(rootFile="main.tex", files=[])
            result = service.compile(req)
    assert result.success is False
    assert "tempo limite" in result.log


def test_compile_invalid_engine_defaults_to_pdflatex(service, tmp_path):
    with patch("shutil.which", return_value=None) as mock_which:
        req = CompileRequest(engine="invalid-engine", files=[], rootFile="main.tex")
        service.compile(req)
        mock_which.assert_called_with("pdflatex")


def test_get_log_after_compile(service, tmp_path):
    with patch("shutil.which", return_value="/usr/bin/pdflatex"), \
         patch("tempfile.mkdtemp", return_value=str(tmp_path)), \
         patch("shutil.rmtree"):
        with patch.object(service, "_run_latex", return_value=("my log", None)):
            req = CompileRequest(rootFile="main.tex", files=[])
            service.compile(req)
    assert service.get_log() == "my log"


def test_write_files_directory_traversal(tmp_path):
    files = [FileEntry(name="../../../etc/passwd", content="evil")]
    # Should not raise, just skip the malicious file
    result = CompileService._write_files(files, str(tmp_path))
    assert not (tmp_path / "etc" / "passwd").exists()


def test_write_files_bib_detection(tmp_path):
    files = [
        FileEntry(name="refs.bib", content="@article{key, title={Test}}"),
        FileEntry(name="main.tex", content=r"\documentclass{article}"),
    ]
    has_bib = CompileService._write_files(files, str(tmp_path))
    assert has_bib is True


def test_write_files_no_bib(tmp_path):
    files = [FileEntry(name="main.tex", content=r"\documentclass{article}")]
    has_bib = CompileService._write_files(files, str(tmp_path))
    assert has_bib is False


def test_run_latex_bibtex_called_when_has_bib():
    with patch("subprocess.run") as mock_run:
        mock_run.return_value = _run_result(0, "ok")
        with patch("os.path.exists", return_value=False):
            CompileService._run_latex("main.tex", "/tmp/test", has_bib=True)
        calls = [str(c) for c in mock_run.call_args_list]
        assert any("bibtex" in c for c in calls)


def test_run_latex_bibtex_not_called_when_no_bib():
    with patch("subprocess.run") as mock_run:
        mock_run.return_value = _run_result(0, "ok")
        with patch("os.path.exists", return_value=False):
            CompileService._run_latex("main.tex", "/tmp/test", has_bib=False)
        calls = [str(c) for c in mock_run.call_args_list]
        assert not any("bibtex" in c for c in calls)


# ── Path traversal via realpath bypass ───────────────────────────────────────

def test_write_files_symlink_traversal_blocked(tmp_path):
    """realpath-based check must catch symlinks that escape tmpdir."""
    import os
    outside = tmp_path / "outside"
    outside.mkdir()
    target = outside / "secret.txt"
    target.write_text("secret")

    link_dir = tmp_path / "work"
    link_dir.mkdir()
    link = link_dir / "escape"
    os.symlink(str(outside), str(link))

    # Attempt to write through the symlink
    files = [FileEntry(name="escape/secret.txt", content="evil")]
    CompileService._write_files(files, str(link_dir))
    # The original secret must be untouched (symlink write blocked)
    assert target.read_text() == "secret"


# ── Unvalidated rootFile ─────────────────────────────────────────────────────

def test_compile_invalid_rootfile_with_slash(service):
    """rootFile with path separator must be rejected."""
    with patch("shutil.which", return_value="/usr/bin/pdflatex"):
        req = CompileRequest(rootFile="../etc/passwd", files=[])
        result = service.compile(req)
    assert result.success is False
    assert "inválido" in result.log


def test_compile_invalid_rootfile_with_dotdot(service):
    """rootFile with '..' must be rejected."""
    with patch("shutil.which", return_value="/usr/bin/pdflatex"):
        req = CompileRequest(rootFile="..\\main.tex", files=[])
        result = service.compile(req)
    assert result.success is False


# ── File count / size limits ─────────────────────────────────────────────────

def test_compile_request_too_many_files():
    """More than 50 files must raise a validation error."""
    from pydantic import ValidationError
    files = [FileEntry(name=f"f{i}.tex", content="x") for i in range(51)]
    with pytest.raises(ValidationError, match="Too many files"):
        CompileRequest(rootFile="main.tex", files=files)


def test_compile_request_within_file_limit():
    """Exactly 50 files must be accepted."""
    files = [FileEntry(name=f"f{i}.tex", content="x") for i in range(50)]
    req = CompileRequest(rootFile="main.tex", files=files)
    assert len(req.files) == 50
