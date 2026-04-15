# ZLEditor

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)
[![Release](https://github.com/Brenaki/ZLEditor/actions/workflows/release.yml/badge.svg?branch=main)](https://github.com/Brenaki/ZLEditor/actions/workflows/release.yml)

ZLEditor is a local-first LaTeX workspace for academic writing. It combines a browser-based editor, PDF preview, bibliography workflows, optional Zotero integration, and an AI assistant in a self-hosted app that runs on your machine.

The goal is simple: make writing, compiling, and iterating on LaTeX projects feel closer to a modern code editor without depending on a hosted platform.

## Highlights

- Browser-based LaTeX editor with CodeMirror 6
- Inline PDF preview with local compilation
- Import/export full projects as `.zip`
- `.bib` parsing and `\cite{}` autocomplete
- Optional Zotero Better BibTeX integration
- AI assistant with streaming responses and compile-log explanation
- Multi-language UI: Portuguese, English, and Spanish
- Docker workflow and desktop launcher support

## Features

- **Modern editor experience**
  - LaTeX syntax highlighting
  - Command autocomplete
  - Citation autocomplete from local `.bib` files and Zotero
  - Quick Open with `Ctrl+P` for file search and in-project text search

- **Project management**
  - Import complete LaTeX projects from `.zip`
  - Preserve nested folders, binary assets, fonts, and images
  - Create and delete files directly from the app
  - Set any `.tex` file as the compilation root
  - Export the current project back to `.zip`

- **Compilation workflow**
  - Compile with `pdflatex`, `xelatex`, or `lualatex`
  - Automatic `bibtex` pass when bibliography data is required
  - Inline PDF rendering after successful compilation
  - Detailed compilation log modal with copy-to-clipboard support
  - Optional auto-compile while editing

- **Bibliography workflow**
  - Parse local `.bib` files automatically
  - Update citation suggestions immediately after `.bib` edits
  - Search Zotero through Better BibTeX
  - Insert `\cite{key}` directly from the Zotero panel
  - Optionally write Zotero entries into a project `.bib` file

- **AI assistant**
  - Sidebar chat panel with streaming responses
  - Support for OpenAI, Anthropic, Gemini, Ollama, and DeepSeek
  - Configurable context mode: none, current file, or full project
  - "Explain log with AI" flow for LaTeX compilation failures
  - Conversation memory via MemPalace integration

- **Quality-of-life**
  - Autosave to local storage
  - Restore previous session on reload
  - Runtime language switcher (`PT`, `EN`, `ES`)
  - Desktop launcher with tray icon for packaged builds

## Tech Stack

- **Backend:** FastAPI, Uvicorn, Python
- **Frontend:** Vanilla JavaScript, CodeMirror 6, modular CSS
- **AI layer:** LiteLLM-based provider adapters
- **Bibliography:** Zotero Better BibTeX proxy + local `.bib` parsing
- **Packaging:** Docker, PyInstaller

## Getting Started

### Option 1: Docker

This is the easiest way to run ZLEditor with LaTeX available inside the container.

```bash
git clone https://github.com/brenaki/ZLEditor.git
cd ZLEditor
docker compose up --build
```

Open `http://localhost:8765`.

Notes:

- The Docker image includes TeX Live and the backend runtime.
- The provided `docker-compose.yml` uses `network_mode: host`, which is especially useful on Linux for reaching Zotero Better BibTeX at `localhost:23119`.

### Option 2: Local development

Requirements:

- Python 3.11+
- A LaTeX distribution with `pdflatex` available
- Node.js 20+ and npm for rebuilding frontend bundles

Setup:

```bash
git clone https://github.com/brenaki/ZLEditor.git
cd ZLEditor
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
npm install
npm run build
uvicorn app.main:app --reload --host 127.0.0.1 --port 8765
```

Open `http://127.0.0.1:8765`.

## AI Configuration

ZLEditor ships with an optional AI assistant. You can configure providers directly from the in-app settings modal.

Supported providers:

- OpenAI
- Anthropic
- Google Gemini
- Ollama
- DeepSeek

The app stores non-secret AI settings in `config.json` and provider secrets in `config.secrets.json`.

## Zotero Integration

Zotero support is optional.

To enable it:

1. Install [Zotero](https://www.zotero.org/download/).
2. Install [Better BibTeX](https://github.com/retorquere/zotero-better-bibtex).
3. Keep Zotero running while using ZLEditor.

ZLEditor proxies approved Better BibTeX JSON-RPC methods through `/bbt-proxy`, so the browser UI can query your local library safely.

## Releases

Desktop binaries are intended to be distributed through GitHub Releases:

- Repository: `https://github.com/brenaki/ZLEditor`
- Releases: `https://github.com/brenaki/ZLEditor/releases`

The packaged app launches the local server in the background, opens the browser automatically, and keeps a tray icon available while running.

## Project Structure

```text
app/        FastAPI app, routers, services, providers
scripts/    Frontend app, UI modules, services, i18n
styles/     Layout and component styles
tests/      Backend and integration tests
openspec/   Product/spec documentation
```

## Testing

```bash
pytest
```

For coverage-focused runs:

```bash
pytest --cov=app --cov-fail-under=90 -v
```

## Contributing

Issues, bug reports, feature requests, and pull requests are welcome.

Good contribution areas:

- LaTeX authoring UX
- bibliography and Zotero workflows
- AI-assisted editing flows
- test coverage
- packaging and cross-platform improvements
- UI polish and accessibility

## Contributors

- Victor Cerqueira ([@brenaki](https://github.com/brenaki)) - creator and maintainer

## Maintainer

- Maintained by Victor Cerqueira ([@brenaki](https://github.com/brenaki))
- Email: [victor.legat.cerqueira@gmail.com](mailto:victor.legat.cerqueira@gmail.com)

## License

This project is licensed under the MIT License. See [LICENSE](/home/bnk/Documents/github/ZLEditor/LICENSE).
