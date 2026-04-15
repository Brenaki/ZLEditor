# ZLEditor

A self-hosted, browser-based LaTeX editor with Zotero integration. Think of it as a local Overleaf: import a project, write LaTeX with syntax highlighting and autocomplete, search your Zotero library for references, compile, and see the PDF — all in one place, without any cloud service.

```
┌─────────────────┬──────────────────────┬──────────────────────┐
│   File Tree     │       Editor         │     PDF Viewer       │
│                 │                      │                      │
│  main.tex       │  \documentclass...   │  [compiled PDF]      │
│  refs.bib       │  \cite{smith2023}    │                      │
│  fig.png        │                      │                      │
├─────────────────┤                      │                      │
│  Zotero  ▼      │                      │                      │
│  Search: ____   │                      │                      │
│  > Smith 2023   │                      │                      │
│  > Jones 2022   │                      │                      │
└─────────────────┴──────────────────────┴──────────────────────┘
```

## Features

- **CodeMirror 6 editor** with LaTeX syntax highlighting
- **Autocomplete** — type `\` for LaTeX commands, `\cite{` for your Zotero citekeys
- **LaTeX compilation** via `pdflatex`, `xelatex`, or `lualatex` with inline PDF preview
- **Compilation log modal** with copy button for debugging errors
- **Project import/export** as `.zip` (supports images and binary files)
- **File tree** — create new files or import an existing project
- **Zotero panel** — search your library and click any reference to insert `\cite{key}` at the cursor
- **Autosave** to localStorage with restore prompt on reload
- **Configurable root file** (defaults to `main.tex`)

---

## Download

Prebuilt desktop binaries are published in **GitHub Releases**:

- Download the latest release from `https://github.com/Brenaki/ZLEditor/releases`
- Windows: `ZLEditor-windows.exe`
- Linux: `ZLEditor-linux`
- macOS: `ZLEditor-macos`

The desktop binary includes the local web app and opens it in your default browser, but **LaTeX is still a separate system dependency**:

- Windows: install [MiKTeX](https://miktex.org/download)
- Linux: install TeX Live, for example `sudo apt install texlive-full`
- macOS: install [MacTeX](https://www.tug.org/mactex/)

Platform notes:

- macOS Gatekeeper may block the unsigned binary on first launch. If that happens, run `xattr -cr ZLEditor-macos` or allow it in `System Settings -> Privacy & Security`.
- Windows Defender or other antivirus tools may flag PyInstaller binaries with a false positive. This is a common unsigned-binary behavior, not a known ZLEditor-specific infection.

---

## Prerequisites

### 1. Zotero + Better BibTeX

ZLEditor connects to your local Zotero library to pull citation keys.

1. Install [Zotero](https://www.zotero.org/download/)
2. Install the **Better BibTeX** plugin from:
   **https://github.com/retorquere/zotero-better-bibtex**
   (download the `.xpi` file from Releases, then in Zotero: `Tools → Add-ons → gear icon → Install Add-on From File`)
3. Keep Zotero **open and running** while using ZLEditor

> The Zotero panel is optional — you can still edit and compile LaTeX without it.

### 2. Docker

- [Docker](https://docs.docker.com/get-docker/) and [Docker Compose](https://docs.docker.com/compose/) installed

That's it. Docker handles Python, TeX Live, and all compilation dependencies.

---

## Running with Docker (recommended)

```bash
git clone https://github.com/Brenaki/ZLEditor.git
cd ZLEditor
docker compose up --build
```

Then open your browser at **http://localhost:8765**.

> **Linux note:** `docker-compose.yml` uses `network_mode: host`, which lets the container reach Zotero Better BibTeX at `localhost:23119` on your machine. This works automatically on Linux. On macOS or Windows, host networking behaves differently — you may need to adjust the Zotero endpoint.

To stop the server: `Ctrl+C`, then `docker compose down`.

---

## Running without Docker

If you prefer to run directly on your machine, you need:

- Python 3
- TeX Live with `pdflatex` (e.g. `sudo pacman -S texlive-basic texlive-latex texlive-latexrecommended` on Arch, or `sudo apt install texlive` on Debian/Ubuntu)
- Firefox

```bash
./launch.sh
```

This starts the server at `http://localhost:8765` and opens Firefox automatically. Press `Ctrl+C` to stop.

---

## Usage

### Starting a project

You have two options:

- **Create files** directly in the file tree using the new file button
- **Import a `.zip`** to load an existing LaTeX project — the zip can contain `.tex` files, `.bib` files, images, and other resources

### Writing LaTeX

The editor provides:
- Syntax highlighting for LaTeX
- **`\` autocomplete** — a list of common LaTeX commands
- **`\cite{` autocomplete** — populated from your Zotero library (requires Zotero + BBT running)

### Searching Zotero references

Open the **Zotero** panel in the left sidebar. Type to search your library. Click any result to insert `\cite{citekey}` at the current cursor position.

### Compiling

Click **Compile** in the toolbar. You can choose the engine: `pdflatex` (default), `xelatex`, or `lualatex`.

- On success, the PDF appears in the right panel
- On error, the compilation log opens automatically — use the **Copy log** button to paste it elsewhere for debugging

### Saving / exporting

- The project **autosaves** to your browser's localStorage as you work
- Click **Export (.zip)** to download the full project as a zip file

---

## Architecture

```
Browser (http://localhost:8765)
        │
        ▼
  server.py  (Python HTTP server)
  ├── GET  /*              → static files (HTML, CSS, JS)
  ├── POST /compile        → runs pdflatex in a temp dir, returns PDF
  ├── GET  /compile/log    → returns the last compilation log
  └── POST /bbt-proxy      → proxies to Zotero BBT at localhost:23119
```

The server acts as a local proxy for Zotero's Better BibTeX API because browsers block direct requests from `localhost` to `localhost` across ports. All requests go through `server.py`.
