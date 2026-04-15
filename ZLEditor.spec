# -*- mode: python ; coding: utf-8 -*-

from pathlib import Path

from PyInstaller.building.build_main import Analysis, EXE, PYZ
from PyInstaller.utils.hooks import collect_submodules


project_root = Path(globals().get("SPECPATH", ".")).resolve()


def collect_directory(src_dir: Path, target_dir: str):
    items = []
    for path in src_dir.rglob("*"):
        if not path.is_file():
            continue
        relative_parent = path.relative_to(src_dir).parent
        dest_dir = Path(target_dir) / relative_parent
        items.append((str(path), str(dest_dir)))
    return items


datas = [
    (str(project_root / "index.html"), "."),
    (str(project_root / "server.py"), "."),
]

for asset_dir in ("scripts", "styles"):
    datas += collect_directory(project_root / asset_dir, asset_dir)

for optional_file in ("entities.json", "mempalace.yaml"):
    path = project_root / optional_file
    if path.exists():
        datas.append((str(path), "."))

hiddenimports = collect_submodules("PIL") + [
    "pystray",
    "pystray._base",
    "pystray._darwin",
    "pystray._util",
    "pystray._win32",
    "pystray._xorg",
]

a = Analysis(
    ["app.py"],
    pathex=[str(project_root)],
    binaries=[],
    datas=datas,
    hiddenimports=hiddenimports,
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludes=[],
    noarchive=False,
)
pyz = PYZ(a.pure)

exe = EXE(
    pyz,
    a.scripts,
    a.binaries,
    a.datas,
    [],
    name="ZLEditor",
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=True,
    upx_exclude=[],
    runtime_tmpdir=None,
    console=False,
    disable_windowed_traceback=False,
    argv_emulation=False,
    target_arch=None,
    codesign_identity=None,
    entitlements_file=None,
)
