from __future__ import annotations

import atexit
import importlib.util
import shutil
import socket
import sys
import threading
import time
import urllib.error
import urllib.request
import webbrowser
from dataclasses import dataclass, field
from pathlib import Path
from types import ModuleType

APP_NAME = "ZLEditor"
DEFAULT_PORT = 8765


def get_runtime_root() -> Path:
    meipass = getattr(sys, "_MEIPASS", None)
    if meipass:
        return Path(meipass)
    return Path(__file__).resolve().parent


def detect_platform() -> str:
    if sys.platform.startswith("win"):
        return "windows"
    if sys.platform == "darwin":
        return "macos"
    return "linux"


def build_latex_warning() -> str:
    platform = detect_platform()
    install_hint = {
        "windows": "Windows -> instale MiKTeX em https://miktex.org/download",
        "linux": "Linux -> instale com: sudo apt install texlive-full",
        "macos": "macOS -> instale MacTeX em https://www.tug.org/mactex/",
    }[platform]

    return (
        "O ZLEditor precisa do LaTeX para compilar documentos.\n\n"
        f"{install_hint}\n\n"
        "Voce pode continuar e usar o editor, mas a compilacao nao funcionara "
        "ate o LaTeX ser instalado."
    )


def _show_dialog(kind: str, title: str, message: str, default: bool = False) -> bool:
    root = None
    try:
        import tkinter as tk
        from tkinter import messagebox

        root = tk.Tk()
        root.withdraw()
        try:
            root.attributes("-topmost", True)
        except Exception:
            pass

        if kind == "askokcancel":
            return bool(messagebox.askokcancel(title, message, parent=root))

        messagebox.showerror(title, message, parent=root)
        return True
    except Exception:
        print(f"{title}\n\n{message}", file=sys.stderr)
        return default
    finally:
        if root is not None:
            try:
                root.destroy()
            except Exception:
                pass


def show_error_dialog(title: str, message: str) -> None:
    _show_dialog("showerror", title, message, default=True)


def check_latex() -> bool:
    if shutil.which("pdflatex"):
        return True

    return _show_dialog(
        "askokcancel",
        "LaTeX nao encontrado",
        build_latex_warning(),
        default=False,
    )


def is_port_in_use(port: int, host: str = "127.0.0.1") -> bool:
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as sock:
        sock.settimeout(0.2)
        return sock.connect_ex((host, port)) == 0


def load_server_module(runtime_root: Path | None = None) -> ModuleType:
    runtime_root = runtime_root or get_runtime_root()
    server_path = runtime_root / "server.py"
    if not server_path.exists():
        raise FileNotFoundError(f"server.py nao encontrado em {runtime_root}")

    spec = importlib.util.spec_from_file_location("zleditor_server", server_path)
    if spec is None or spec.loader is None:
        raise RuntimeError(f"Nao foi possivel carregar {server_path}")

    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


@dataclass
class ServerHandle:
    server: object
    thread: threading.Thread
    url: str
    _stopped: bool = field(default=False, init=False)
    _lock: threading.Lock = field(default_factory=threading.Lock, init=False)

    def shutdown(self) -> None:
        with self._lock:
            if self._stopped:
                return
            self._stopped = True
            self.server.shutdown()
            self.server.server_close()
        self.thread.join(timeout=2)


def start_server(server_module: ModuleType) -> ServerHandle:
    host = "127.0.0.1"
    port = int(getattr(server_module, "PORT", DEFAULT_PORT))
    if is_port_in_use(port, host):
        raise RuntimeError(f"Porta {port} ja esta em uso")

    server_cls = getattr(server_module.http.server, "ThreadingHTTPServer", server_module.http.server.HTTPServer)
    httpd = server_cls((host, port), server_module.Handler)
    thread = threading.Thread(
        target=httpd.serve_forever,
        name="zleditor-server",
        daemon=True,
    )
    thread.start()
    return ServerHandle(server=httpd, thread=thread, url=f"http://localhost:{port}")


def wait_for_server(url: str, timeout: float = 10.0, interval: float = 0.25) -> bool:
    deadline = time.monotonic() + timeout
    while time.monotonic() < deadline:
        try:
            with urllib.request.urlopen(url, timeout=1) as response:
                if response.status == 200:
                    return True
        except urllib.error.URLError:
            pass
        except Exception:
            pass
        time.sleep(interval)
    return False


def open_browser(url: str) -> None:
    webbrowser.open(url)


def generate_icon(size: int = 64):
    from PIL import Image, ImageDraw

    image = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(image)

    margin = size // 8
    page_left = margin
    page_top = margin
    page_right = size - margin - 6
    page_bottom = size - margin
    fold = size // 6

    draw.rounded_rectangle(
        (page_left, page_top, page_right, page_bottom),
        radius=8,
        fill=(248, 250, 252, 255),
        outline=(71, 85, 105, 255),
        width=3,
    )
    draw.polygon(
        (
            page_right - fold,
            page_top,
            page_right,
            page_top,
            page_right,
            page_top + fold,
        ),
        fill=(226, 232, 240, 255),
        outline=(71, 85, 105, 255),
    )

    pencil = [
        (size * 0.26, size * 0.70),
        (size * 0.37, size * 0.81),
        (size * 0.78, size * 0.40),
        (size * 0.67, size * 0.29),
    ]
    draw.polygon(pencil, fill=(245, 196, 64, 255), outline=(146, 64, 14, 255))
    draw.polygon(
        (
            size * 0.78,
            size * 0.40,
            size * 0.86,
            size * 0.32,
            size * 0.75,
            size * 0.22,
            size * 0.67,
            size * 0.29,
        ),
        fill=(252, 211, 170, 255),
        outline=(120, 53, 15, 255),
    )
    draw.polygon(
        (
            size * 0.86,
            size * 0.32,
            size * 0.90,
            size * 0.27,
            size * 0.80,
            size * 0.17,
            size * 0.75,
            size * 0.22,
        ),
        fill=(31, 41, 55, 255),
    )
    draw.polygon(
        (
            size * 0.26,
            size * 0.70,
            size * 0.20,
            size * 0.76,
            size * 0.31,
            size * 0.87,
            size * 0.37,
            size * 0.81,
        ),
        fill=(244, 114, 182, 255),
        outline=(131, 24, 67, 255),
    )

    return image


def create_tray(server_handle: ServerHandle):
    import pystray

    def on_open(_icon, _item) -> None:
        open_browser(server_handle.url)

    def on_quit(icon, _item) -> None:
        server_handle.shutdown()
        icon.stop()

    return pystray.Icon(
        "zleditor",
        generate_icon(),
        APP_NAME,
        menu=pystray.Menu(
            pystray.MenuItem("Abrir ZLEditor", on_open),
            pystray.MenuItem("Sair", on_quit),
        ),
    )


def main() -> int:
    try:
        server_module = load_server_module()
    except Exception as exc:
        show_error_dialog("Falha ao iniciar", str(exc))
        return 1

    port = int(getattr(server_module, "PORT", DEFAULT_PORT))
    if is_port_in_use(port):
        show_error_dialog(
            "Porta em uso",
            f"A porta {port} ja esta ocupada. Encerre o outro processo e tente novamente.",
        )
        return 1

    if not check_latex():
        return 0

    try:
        server_handle = start_server(server_module)
    except Exception as exc:
        show_error_dialog("Falha ao iniciar o servidor", str(exc))
        return 1

    atexit.register(server_handle.shutdown)

    if not wait_for_server(server_handle.url):
        server_handle.shutdown()
        show_error_dialog(
            "Servidor indisponivel",
            "O servidor nao respondeu em http://localhost:8765 apos 10 segundos.",
        )
        return 1

    open_browser(server_handle.url)

    try:
        tray = create_tray(server_handle)
        tray.run()
    except Exception as exc:
        server_handle.shutdown()
        show_error_dialog("Falha ao iniciar a bandeja do sistema", str(exc))
        return 1

    server_handle.shutdown()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
