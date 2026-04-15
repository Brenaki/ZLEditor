## Context

ZLEditor's backend is a 180-line `server.py` using Python's `http.server.SimpleHTTPRequestHandler`. It handles three endpoints synchronously: static file serving, LaTeX compilation, and a Zotero BBT proxy. Adding streaming AI responses requires async I/O — `SimpleHTTPRequestHandler` blocks the process for the duration of each request, making it impossible to compile and stream AI responses concurrently without a thread-per-connection approach that is fragile under load.

The frontend is a vanilla JS SPA. Styles and scripts are served as static files. No bundler runtime dependency.

## Goals / Non-Goals

**Goals:**
- Replace `server.py` with a FastAPI + uvicorn application that preserves all existing endpoints
- Add `/ai/chat` (SSE streaming) and `/ai/config` (key management) endpoints
- Integrate MemPalace for token-efficient cross-session memory, persisted in `./.zlepalace`
- Support Anthropic, OpenAI, Gemini, Ollama, DeepSeek via litellm behind a common Protocol
- Keep API keys strictly server-side — never returned to the browser
- Achieve ≥90% test coverage on routes and services using pytest-asyncio + httpx
- Add AI panel to the sidebar and "Explain" button to the LogModal

**Non-Goals:**
- True RAG with vector embeddings of the document (full-context injection is sufficient for LaTeX project sizes)
- Authentication / multi-user support
- Persisting chat history across browser sessions in the UI (MemPalace handles server-side memory; UI history is in-memory)
- LSP integration (separate change)

## Decisions

### D1 — FastAPI over Flask or keeping http.server with threads

**Choice**: FastAPI + uvicorn

**Rationale**: SSE streaming requires keeping connections open while yielding chunks. FastAPI's `StreamingResponse` with async generators is the idiomatic fit. litellm's async API (`acompletion`) maps directly. Flask could work but requires gevent/eventlet hacks; http.server threads are fragile under concurrent compile + stream. FastAPI also provides free Pydantic validation and OpenAPI docs.

**Alternative considered**: Starlette directly — FastAPI is a thin wrapper over Starlette with less boilerplate.

---

### D2 — litellm as the single provider abstraction

**Choice**: litellm

**Rationale**: litellm provides a unified `acompletion` interface across Anthropic, OpenAI, Gemini, Ollama, and DeepSeek. Adding a new provider requires only a config entry, not new code. The alternative — thin per-provider adapters — would need maintenance as APIs evolve.

**Model string format**: `anthropic/claude-sonnet-4-6`, `openai/gpt-4o`, `ollama/llama3`, etc.

---

### D3 — Provider Protocol + Factory (OCP / LSP)

**Choice**: Define `AIProvider` as a `typing.Protocol`, implement per-provider classes, resolve via `ProviderFactory`

**Rationale**: Routes and `ChatService` depend on the abstraction, not concrete classes. Adding a new provider means creating a new file and registering it in the factory — zero changes to existing code.

```
AIProvider (Protocol)
├── AnthropicProvider
├── OpenAIProvider
├── GeminiProvider
├── OllamaProvider  (no key — uses base_url)
└── DeepSeekProvider
```

`ProviderFactory.create(config) → AIProvider` is the single resolution point.

---

### D4 — MemPalace integration strategy

**Choice**: `wake-up` summary + `search_memories` injected into system prompt; `mine` called after each exchange

**Rationale**: MemPalace's L1 layer (`wake-up`, ~170 tokens) provides compressed session context at minimal token cost. Semantic search (`search_memories`) retrieves relevant past exchanges for the current query. Together they avoid re-sending full chat history on every message.

**Flow per request**:
1. `wake-up(project_id)` → ~170 token summary
2. `search_memories(query, palace_path)` → top-k relevant memories
3. Build `messages`: `[system: summary + memories + doc_context] + [last N turns] + [user msg]`
4. `litellm.acompletion(stream=True)` → yield SSE chunks
5. `mine(exchange)` → index the exchange into the palace

**Project scoping**: each ZLEditor project maps to a MemPalace Wing named after the project root file (e.g., `main-tex`). Prevents cross-project memory bleed.

---

### D5 — Key storage: `config.secrets.json` (gitignored), separate from `config.json`

**Choice**: Split config into `config.json` (provider selection, model names, context mode — safe to inspect) and `config.secrets.json` (API keys — gitignored, file permissions 600)

**Rationale**: Keeps non-sensitive config readable without risk of accidentally committing keys. GET `/ai/config` returns `config.json` + `hasKey: bool` per provider, never the key values.

**Write path**: POST `/ai/config` with `{"provider": "anthropic", "key": "sk-..."}` → server writes only to `config.secrets.json`.

---

### D6 — SSE transport for streaming

**Choice**: Server-Sent Events via `StreamingResponse(media_type="text/event-stream")`

**Rationale**: SSE is unidirectional (server → client), which is all streaming chat needs. The browser uses `EventSource` or `fetch` with `ReadableStream`. No WebSocket handshake overhead. litellm's async streaming maps cleanly to an async generator.

**Chunk format**:
```
data: {"delta": "Hello", "done": false}\n\n
data: {"delta": " world", "done": false}\n\n
data: {"delta": "", "done": true}\n\n
```

---

### D7 — SOLID structure for the app

```
app/
├── main.py                  # FastAPI app init, router registration
├── config.py                # pydantic-settings: reads env vars + config files
├── dependencies.py          # FastAPI Depends() factories (DI)
│
├── routers/                 # HTTP layer — validate input, call service, return response
│   ├── compile.py           # POST /compile, GET /compile/log
│   ├── ai.py                # POST /ai/chat, GET /ai/config, PUT /ai/config
│   └── proxy.py             # POST /bbt-proxy
│
├── services/                # Business logic (SRP — one job each)
│   ├── compile_service.py   # Writes files, runs pdflatex/bibtex, returns PDF/log
│   ├── chat_service.py      # Orchestrates memory + provider + context injection
│   ├── memory_service.py    # MemPalace wrapper (wake-up, mine, search)
│   └── config_service.py    # Reads/writes config.json and config.secrets.json
│
├── providers/               # AI provider implementations
│   ├── base.py              # AIProvider Protocol
│   ├── factory.py           # ProviderFactory
│   ├── anthropic.py
│   ├── openai.py
│   ├── gemini.py
│   ├── ollama.py
│   └── deepseek.py
│
└── models/                  # Pydantic request/response schemas
    ├── chat.py              # ChatRequest, ChatConfig, ProviderConfig
    ├── compile.py           # CompileRequest, CompileResult
    └── config.py            # AppConfig, SecretsConfig
```

---

### D8 — Test strategy

- **Route tests**: `httpx.AsyncClient` + `app.dependency_overrides` to inject mock services. Tests cover happy path, error cases, and SSE stream correctness.
- **Service tests**: pytest-asyncio, mock litellm/MemPalace with `unittest.mock.AsyncMock`.
- **Provider tests**: mock `litellm.acompletion`; assert correct model string and message format passed.
- **Coverage**: `pytest-cov` with `--cov=app --cov-fail-under=90`.
- **No real API calls in tests**: all external I/O (litellm, MemPalace, subprocess) is mocked.

```
tests/
├── conftest.py              # shared fixtures: async client, mock services
├── routers/
│   ├── test_compile.py
│   ├── test_ai.py
│   └── test_proxy.py
├── services/
│   ├── test_compile_service.py
│   ├── test_chat_service.py
│   ├── test_memory_service.py
│   └── test_config_service.py
└── providers/
    ├── test_factory.py
    └── test_providers.py
```

## Risks / Trade-offs

**[ChromaDB binary size]** → MemPalace pulls ChromaDB which is ~400MB. The Docker image will grow significantly.
Mitigation: use `mempalace` extras carefully; document expected image size; consider making MemPalace optional via config flag.

**[MemPalace cold start on empty palace]** → `wake-up` on a fresh palace returns empty/minimal context. This is expected behavior, not an error.
Mitigation: handle empty wake-up gracefully in `MemoryService`; fall back to no memory context.

**[litellm version drift]** → litellm releases frequently; provider APIs change.
Mitigation: pin `litellm` version in `requirements.txt`; upgrade explicitly.

**[SSE and buffering]** → Some reverse proxies (nginx) buffer responses and break SSE.
Mitigation: document that users behind nginx need `proxy_buffering off` and `X-Accel-Buffering: no`.

**[config.secrets.json world-readable]** → On a VPS with multiple users, another user could read the file.
Mitigation: `ConfigService` sets file permissions to `0o600` on write; document this in README.

## Migration Plan

1. Move `server.py` logic into `app/` (no behavior change on existing endpoints)
2. Add `/ai/chat` and `/ai/config` endpoints
3. Update `Dockerfile` CMD from `python3 server.py` to `uvicorn app.main:app --host 0.0.0.0 --port 8765`
4. Update `docker-compose.yml` with MemPalace volume
5. Add `.zlepalace/` and `config.secrets.json` to `.gitignore`
6. Frontend changes (AI panel, LogModal button) are additive — no breaking changes to existing UI

**Rollback**: keep `server.py` until FastAPI migration is validated; revert CMD in Dockerfile.

## Open Questions

- MemPalace Wing naming: use the Docker container hostname, a user-set project name, or hash of the root file path? Current decision: root file basename (e.g., `main-tex`). Can be made configurable later.
- Should Ollama `base_url` be configurable via the settings modal or only via env var? Current decision: settings modal, same as other providers.
