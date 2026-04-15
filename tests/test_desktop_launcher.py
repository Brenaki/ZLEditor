from __future__ import annotations

import importlib.util
import sys
from pathlib import Path
from urllib.error import URLError


def load_launcher_module():
    root = Path(__file__).resolve().parents[1]
    spec = importlib.util.spec_from_file_location("desktop_launcher", root / "app.py")
    module = importlib.util.module_from_spec(spec)
    assert spec.loader is not None
    sys.modules[spec.name] = module
    spec.loader.exec_module(module)
    return module


def test_build_latex_warning_is_platform_specific(monkeypatch):
    launcher = load_launcher_module()

    monkeypatch.setattr(launcher.sys, "platform", "win32")
    assert "MiKTeX" in launcher.build_latex_warning()

    monkeypatch.setattr(launcher.sys, "platform", "linux")
    assert "texlive-full" in launcher.build_latex_warning()

    monkeypatch.setattr(launcher.sys, "platform", "darwin")
    assert "MacTeX" in launcher.build_latex_warning()


def test_wait_for_server_returns_true_when_http_server_is_ready(monkeypatch):
    launcher = load_launcher_module()

    class Response:
        status = 200

        def __enter__(self):
            return self

        def __exit__(self, exc_type, exc, tb):
            return False

    monkeypatch.setattr(launcher.urllib.request, "urlopen", lambda *_args, **_kwargs: Response())
    assert launcher.wait_for_server("http://127.0.0.1:8765", timeout=0.2, interval=0.01) is True


def test_wait_for_server_returns_false_when_nothing_is_listening(monkeypatch):
    launcher = load_launcher_module()
    monkeypatch.setattr(
        launcher.urllib.request,
        "urlopen",
        lambda *_args, **_kwargs: (_ for _ in ()).throw(URLError("offline")),
    )
    assert launcher.wait_for_server("http://127.0.0.1:8765", timeout=0.2, interval=0.01) is False
