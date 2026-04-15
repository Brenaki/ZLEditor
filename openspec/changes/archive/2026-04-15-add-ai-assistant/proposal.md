## Why

ZLEditor currently has no way to help users understand compilation errors or assist with writing LaTeX papers. Adding an AI assistant — backed by multiple cloud providers and local models via Ollama — turns the editor into a real writing partner while keeping API keys secure on the server side, never exposed to the browser.

## What Changes

- Migrate `server.py` from `http.server` to **FastAPI + uvicorn** (async, required for streaming)
- Add **`/ai/chat`** endpoint: streaming SSE response via litellm, context-aware (current file or full project)
- Add **`/ai/config`** endpoint: read/write provider config; keys stored server-side in `config.secrets.json` (gitignored), never returned to the browser
- Add **MemPalace** integration for token-efficient memory across chat sessions, persisted at `./.zlepalace` (bind mount into Docker)
- Refactor server code following **SOLID** principles: thin routers, service classes, provider Protocol + Factory
- Add **full test coverage** for all routes and services (pytest-asyncio + httpx, 90%+ coverage target)
- Add **AI panel** to the left sidebar (stacked below Zotero), with streaming chat for paper writing assistance
- Add **"Explain with AI"** button to the `LogModal` for contextual compilation error explanations

## Capabilities

### New Capabilities

- `ai-chat`: Streaming AI chat endpoint — multi-provider (Anthropic, OpenAI, Gemini, Ollama, DeepSeek) via litellm, with MemPalace memory and configurable document context injection
- `ai-config`: Server-side API key management — settings modal to configure providers and models; keys never leave the server, GET returns `hasKey: true/false` only
- `ai-panel`: Left sidebar AI chat panel (retractable, stacked with Zotero) with streaming response display
- `fastapi-server`: FastAPI + uvicorn replacing `http.server`; SOLID architecture with routers, services, providers, and full test suite

### Modified Capabilities

- `latex-compile`: The compile route migrates to FastAPI but behavior is unchanged; the `LogModal` gains an "Explain with AI" button that sends the error log to the AI chat

## Impact

- **Replaced**: `server.py` (rewritten as FastAPI app under `app/`)
- **New**: `app/routers/`, `app/services/`, `app/providers/`, `app/models/`
- **New**: `tests/` directory with pytest suite
- **New**: `.zlepalace/` (runtime data, gitignored)
- **New**: `config.secrets.json` (runtime secrets, gitignored)
- **Modified**: `docker-compose.yml` — adds `./.zlepalace:/app/.mempalace` volume
- **Modified**: `Dockerfile` — adds fastapi, uvicorn, litellm, mempalace, pytest deps
- **Modified**: `.gitignore` — adds `.zlepalace/` and `config.secrets.json`
- **Modified**: `scripts/ui/LogModal.js` — adds "Explain with AI" button
- **New**: `scripts/ui/AiPanel.js` — retractable AI chat panel
- **New dependencies**: `fastapi`, `uvicorn[standard]`, `litellm`, `mempalace`, `pydantic-settings`, `httpx`, `pytest`, `pytest-asyncio`, `pytest-cov`
