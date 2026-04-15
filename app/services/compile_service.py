import base64
import os
import re
import shutil
import subprocess
import tempfile
from pathlib import Path

from app.models.compile import CompileRequest, CompileResult

_SAFE_FILENAME_RE = re.compile(r'^[A-Za-z0-9._\-][A-Za-z0-9._\-/ ]*$')


class CompileService:
    def __init__(self):
        self._last_log = ""

    def compile(self, request: CompileRequest) -> CompileResult:
        engine = request.engine
        if engine not in ("pdflatex", "xelatex", "lualatex"):
            engine = "pdflatex"

        if not shutil.which(engine):
            log = (
                f"{engine} não encontrado.\n"
                "Instale com: sudo pacman -S texlive-basic texlive-latex texlive-latexrecommended"
            )
            self._last_log = log
            return CompileResult(success=False, log=log)

        # Validate rootFile - must be a plain filename with no path separators or traversal
        root_file = request.rootFile
        if '/' in root_file or '..' in root_file or not root_file.strip():
            self._last_log = "rootFile inválido."
            return CompileResult(success=False, log=self._last_log)

        tmpdir = tempfile.mkdtemp(prefix="zle-latex-")
        try:
            has_bib = self._write_files(request.files, tmpdir)
            log, pdf_bytes = self._run_latex(root_file, tmpdir, has_bib, engine)
            self._last_log = log

            if pdf_bytes is None:
                return CompileResult(success=False, log=log)
            return CompileResult(success=True, log=log, pdf=pdf_bytes)

        except subprocess.TimeoutExpired:
            self._last_log = "Compilação excedeu o tempo limite (60 s)."
            return CompileResult(success=False, log=self._last_log)
        finally:
            shutil.rmtree(tmpdir, ignore_errors=True)

    def get_log(self) -> str:
        return self._last_log

    @staticmethod
    def _write_files(files, tmpdir: str) -> bool:
        has_bib = False
        # Use realpath to prevent symlink/normpath bypass in traversal check
        real_tmpdir = os.path.realpath(tmpdir) + os.sep
        for f in files:
            name = os.path.normpath(f.name)
            dest = os.path.join(tmpdir, name)
            real_dest = os.path.realpath(dest)
            # Prevent directory traversal via symlinks or normpath bypass
            if not real_dest.startswith(real_tmpdir):
                continue
            os.makedirs(os.path.dirname(dest), exist_ok=True)
            if f.binary:
                with open(dest, "wb") as fh:
                    fh.write(base64.b64decode(f.base64 or ""))
            else:
                with open(dest, "w", encoding="utf-8") as fh:
                    fh.write(f.content or "")
            if name.endswith(".bib"):
                has_bib = True
        return has_bib

    @staticmethod
    def _run_latex(root_file: str, tmpdir: str, has_bib: bool, engine: str = "pdflatex"):
        root_base = os.path.splitext(root_file)[0]
        log_parts = []
        cache_dir = Path(tmpdir) / ".cache"
        cache_dir.mkdir(parents=True, exist_ok=True)
        run_env = os.environ.copy()
        run_env.setdefault("HOME", tmpdir)
        run_env.setdefault("XDG_CACHE_HOME", str(cache_dir))

        def run(*cmd):
            r = subprocess.run(
                list(cmd), cwd=tmpdir,
                capture_output=True, text=True, timeout=60, env=run_env,
            )
            label = " ".join(cmd)
            sections = [f"$ {label}", f"[exit {r.returncode}]"]
            if r.stdout:
                sections.append("stdout:")
                sections.append(r.stdout.rstrip())
            if r.stderr:
                sections.append("stderr:")
                sections.append(r.stderr.rstrip())
            log_parts.append("\n".join(sections).rstrip())
            return r

        def append_tex_log():
            tex_log_path = Path(tmpdir) / f"{root_base}.log"
            if not tex_log_path.exists():
                return
            try:
                tex_log = tex_log_path.read_text(encoding="utf-8", errors="replace").rstrip()
            except OSError:
                return
            if not tex_log:
                return
            log_parts.append(f"===== {root_base}.log =====\n{tex_log}")

        latex_args = [engine, "-interaction=nonstopmode", "-halt-on-error", root_file]

        r = run(*latex_args)
        if r.returncode != 0:
            append_tex_log()
            return "\n".join(log_parts), None

        if has_bib and CompileService._aux_requests_bibliography(root_base, tmpdir):
            bib = run("bibtex", root_base)
            if bib.returncode != 0:
                append_tex_log()
                return "\n".join(log_parts), None

        r = run(*latex_args)
        if r.returncode != 0:
            append_tex_log()
            return "\n".join(log_parts), None

        r = run(*latex_args)
        append_tex_log()
        if r.returncode != 0:
            return "\n".join(log_parts), None

        pdf_path = os.path.join(tmpdir, root_base + ".pdf")
        if not os.path.exists(pdf_path):
            return "\n".join(log_parts), None

        with open(pdf_path, "rb") as f:
            return "\n".join(log_parts), f.read()

    @staticmethod
    def _aux_requests_bibliography(root_base: str, tmpdir: str) -> bool:
        aux_path = Path(tmpdir) / f"{root_base}.aux"
        if not aux_path.exists():
            return False
        try:
            aux_text = aux_path.read_text(encoding="utf-8", errors="replace")
        except OSError:
            return False
        return "\\bibdata" in aux_text
