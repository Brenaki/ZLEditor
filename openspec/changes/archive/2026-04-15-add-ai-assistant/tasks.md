## 1. Project scaffolding and dependencies

- [x] 1.1 Create `app/` directory with `__init__.py`, `main.py`, `config.py`, `dependencies.py`
- [x] 1.2 Create `app/routers/`, `app/services/`, `app/providers/`, `app/models/` packages (each with `__init__.py`)
- [x] 1.3 Create `tests/` directory with `conftest.py`, `tests/routers/`, `tests/services/`, `tests/providers/` packages
- [x] 1.4 Create `requirements.txt` with `fastapi`, `uvicorn[standard]`, `litellm`, `mempalace`, `pydantic-settings`, `httpx`
- [x] 1.5 Create `requirements-dev.txt` with `pytest`, `pytest-asyncio`, `pytest-cov`
- [x] 1.6 Add `.zlepalace/` and `config.secrets.json` to `.gitignore`

## 2. Pydantic models

- [x] 2.1 Create `app/models/compile.py` — `CompileRequest`, `CompileResult`
- [x] 2.2 Create `app/models/config.py` — `AppConfig`, `SecretsConfig`, `ProviderConfig`, `ConfigResponse`
- [x] 2.3 Create `app/models/chat.py` — `ChatRequest` (messages, projectId, currentFile, files, mode, compilationLog), `ChatChunk`

## 3. Config service

- [x] 3.1 Implement `app/services/config_service.py` — `ConfigService` class with `get_config()` and `save_config()` methods
- [x] 3.2 Implement `save_key(provider, key)` — writes only to `config.secrets.json` with `chmod 0o600`
- [x] 3.3 Implement `get_config_response()` — merges `config.json` + secrets presence flags; never returns raw key values
- [x] 3.4 Write `tests/services/test_config_service.py` — covers read, write, key presence, missing file defaults

## 4. Compile service

- [x] 4.1 Extract compile logic from `server.py` into `app/services/compile_service.py` — `CompileService` with `compile(request)` and `get_log()` methods
- [x] 4.2 Write `tests/services/test_compile_service.py` — mocks `subprocess.run`; covers success, bibtex run, timeout, engine not found, directory traversal prevention

## 5. AI providers

- [x] 5.1 Define `AIProvider` Protocol in `app/providers/base.py` with `async def stream(messages, model) -> AsyncIterator[str]`
- [x] 5.2 Implement `app/providers/anthropic.py` — reads key from secrets, calls `litellm.acompletion` with model `"anthropic/<model>"`
- [x] 5.3 Implement `app/providers/openai.py` — model `"openai/<model>"`
- [x] 5.4 Implement `app/providers/gemini.py` — model `"gemini/<model>"`
- [x] 5.5 Implement `app/providers/ollama.py` — uses `base_url`, model `"ollama/<model>"`, no key required
- [x] 5.6 Implement `app/providers/deepseek.py` — model `"deepseek/<model>"`
- [x] 5.7 Implement `app/providers/factory.py` — `ProviderFactory.create(config) -> AIProvider` resolving by `activeProvider`
- [x] 5.8 Write `tests/providers/test_factory.py` — asserts correct provider class returned for each provider name
- [x] 5.9 Write `tests/providers/test_providers.py` — mocks `litellm.acompletion`; asserts correct model string and message format per provider

## 6. Memory service

- [x] 6.1 Implement `app/services/memory_service.py` — `MemoryService` with `wake_up(project_id)`, `mine(project_id, exchange)`, `search(project_id, query)` wrapping MemPalace
- [x] 6.2 Handle empty/missing palace gracefully — return empty string from `wake_up` without raising
- [x] 6.3 Write `tests/services/test_memory_service.py` — mocks MemPalace calls; covers wake-up with data, wake-up empty, mine, search

## 7. Chat service

- [x] 7.1 Implement `app/services/chat_service.py` — `ChatService` with `chat_stream(request) -> AsyncIterator[str]`
- [x] 7.2 Implement context injection logic — selects file content based on `contextMode` (`none`, `current-file`, `project`)
- [x] 7.3 Implement error-explanation mode — builds system prompt with compilation log when `mode == "explain-error"`
- [x] 7.4 Integrate `MemoryService` — call `wake_up` and `search` before streaming, call `mine` after stream completes
- [x] 7.5 Implement SSE chunk format — `{"delta": "<text>", "done": false}` and terminal `{"delta": "", "done": true}`
- [x] 7.6 Handle upstream provider exceptions — yield `{"error": "<msg>", "done": true}` and close
- [x] 7.7 Write `tests/services/test_chat_service.py` — mocks provider and memory service; covers all context modes, error-explanation mode, memory injection, error handling

## 8. FastAPI routers

- [x] 8.1 Implement `app/routers/compile.py` — `POST /compile`, `GET /compile/log`; delegates to `CompileService`
- [x] 8.2 Implement `app/routers/proxy.py` — `POST /bbt-proxy`; replaces `_bbt_proxy` from `server.py` using `httpx.AsyncClient`
- [x] 8.3 Implement `app/routers/ai.py` — `POST /ai/chat` (SSE via `StreamingResponse`), `GET /ai/config`, `PUT /ai/config`
- [x] 8.4 Implement `app/main.py` — registers all routers, mounts static files, sets up `StaticFiles` fallback for SPA
- [x] 8.5 Implement `app/dependencies.py` — `Depends()` factories for `CompileService`, `ChatService`, `ConfigService`
- [x] 8.6 Write `tests/routers/test_compile.py` — mocks `CompileService`; covers success PDF, error JSON, timeout, log endpoint
- [x] 8.7 Write `tests/routers/test_proxy.py` — mocks `httpx.AsyncClient`; covers proxy success and upstream error
- [x] 8.8 Write `tests/routers/test_ai.py` — mocks `ChatService` and `ConfigService`; covers SSE stream format, missing provider 400, config GET, config PUT valid and invalid
- [x] 8.9 Write `tests/conftest.py` — shared `async_client` fixture using `httpx.AsyncClient` + `app.dependency_overrides`

## 9. Docker and infrastructure

- [x] 9.1 Update `Dockerfile` — add `pip install -r requirements.txt` in runtime stage; change CMD to `uvicorn app.main:app --host 0.0.0.0 --port 8765`
- [x] 9.2 Update `docker-compose.yml` — add `volumes: - ./.zlepalace:/app/.mempalace`
- [x] 9.3 Add `Dockerfile` test stage (or `run_tests.sh`) — installs dev deps, runs `pytest --cov=app --cov-fail-under=90`

## 10. Frontend — AI panel

- [x] 10.1 Create `scripts/ui/AiPanel.js` — retractable panel class following `ZoteroPanel` structure; toggle, chat history, input area, streaming display
- [x] 10.2 Implement SSE consumption in `AiPanel` — `fetch` POST to `/ai/chat`, read `ReadableStream`, parse `data:` lines, append delta text
- [x] 10.3 Add settings (⚙) icon to panel header; wire click to open AI config modal
- [x] 10.4 Create AI config modal HTML in `index.html` — provider dropdown, key input per provider, model dropdown, context mode radio group
- [x] 10.5 Implement config modal JS — `GET /ai/config` on open, show `hasKey` status badges, `PUT /ai/config` on save
- [x] 10.6 Add AI panel HTML to `index.html` sidebar, stacked below Zotero panel
- [x] 10.7 Add AI panel CSS to `styles/` — chat bubbles, streaming cursor indicator, error style
- [x] 10.8 Wire `AiPanel` into `scripts/app.js` — instantiate, pass `projectStore` for context files

## 11. Frontend — LogModal "Explain" button

- [x] 11.1 Add "✨ Explicar" button to LogModal HTML in `index.html` (hidden by default)
- [x] 11.2 Update `LogModal.js` — show/hide "Explicar" button based on `isError` and AI config `hasKey`
- [x] 11.3 Wire "Explicar" click in `app.js` — open AI panel, send `{mode: "explain-error", compilationLog: log}` message

## 12. Validation

- [x] 12.1 Run `pytest --cov=app --cov-fail-under=90` and confirm all tests pass with ≥90% coverage
- [ ] 12.2 Run `docker compose up --build` and verify all existing features work (compile, Zotero BBT proxy, static files)
- [ ] 12.3 Configure a provider in the settings modal and verify SSE streaming works end-to-end in the browser
- [ ] 12.4 Trigger a compilation error and verify "✨ Explicar" button sends the log to the AI panel
- [ ] 12.5 Restart the Docker container and verify MemPalace memories persist across restarts
- [ ] 12.6 Confirm `config.secrets.json` and `.zlepalace/` do not appear in `git status`
