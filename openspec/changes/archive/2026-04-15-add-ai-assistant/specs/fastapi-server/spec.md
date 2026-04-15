## ADDED Requirements

### Requirement: FastAPI application replaces server.py
The system SHALL run as a FastAPI + uvicorn application with all existing endpoints preserved at the same paths and with the same behavior.

#### Scenario: Static files served at root
- **WHEN** a GET request is made to any path not matching an API route
- **THEN** the server serves the corresponding static file from the app directory, with `index.html` as the default for `/`

#### Scenario: Compile endpoint preserved
- **WHEN** a POST request is made to `/compile` with the same payload format as the original `server.py`
- **THEN** the response is identical in format (PDF bytes on success, JSON error on failure)

#### Scenario: Compile log endpoint preserved
- **WHEN** a GET request is made to `/compile/log`
- **THEN** the server returns `{"log": "<last compilation log>"}` as before

#### Scenario: BBT proxy endpoint preserved
- **WHEN** a POST request is made to `/bbt-proxy`
- **THEN** the server proxies the request to Zotero Better BibTeX at `http://localhost:23119/better-bibtex/json-rpc` and returns the response

---

### Requirement: SOLID architecture with thin routers and injected services
The system SHALL organize server code so that routers contain only HTTP handling logic, with all business logic in dedicated service classes injected via FastAPI's dependency injection.

#### Scenario: Service injected into route via Depends
- **WHEN** a route handler is invoked
- **THEN** it receives its service dependencies through FastAPI `Depends()`, not by importing and instantiating services directly

#### Scenario: Business logic not in router
- **WHEN** any route handler is examined
- **THEN** it contains no subprocess calls, file I/O, or AI provider calls — those are delegated to service methods

---

### Requirement: All routes have test coverage ≥90%
The system SHALL include a pytest test suite that covers all route handlers, service methods, and provider implementations with no real external calls.

#### Scenario: Test suite runs without API keys or external services
- **WHEN** `pytest` is run in a clean environment with no API keys set
- **THEN** all tests pass; litellm, MemPalace, and subprocess calls are mocked

#### Scenario: Coverage threshold enforced
- **WHEN** `pytest --cov=app --cov-fail-under=90` is run
- **THEN** the command exits with code 0 only if coverage is ≥90%

#### Scenario: SSE streaming tested
- **WHEN** the `/ai/chat` route test runs
- **THEN** the test asserts that chunks are yielded in the correct SSE format and that `done: true` terminates the stream

---

### Requirement: MemPalace data persisted via Docker bind mount
The system SHALL persist MemPalace data to `./.zlepalace` on the host, mapped to `/app/.mempalace` inside the container.

#### Scenario: Palace survives container restart
- **WHEN** the Docker container is stopped and restarted
- **THEN** previously indexed memories are still accessible because the bind mount preserves the `.zlepalace` directory on the host

#### Scenario: Gitignore prevents committing palace data
- **WHEN** `git status` is run after using the AI chat
- **THEN** the `.zlepalace/` directory does not appear as a tracked or untracked file

---

### Requirement: API keys never committed or logged
The system SHALL ensure `config.secrets.json` is gitignored and that key values are never written to application logs or returned in any HTTP response.

#### Scenario: Secrets file is gitignored
- **WHEN** `git status` is run after saving an API key via the settings modal
- **THEN** `config.secrets.json` does not appear in the git status output

#### Scenario: Key value absent from all responses
- **WHEN** `GET /ai/config` is called after a key has been saved
- **THEN** the response body contains no string that matches the saved key — only `"hasKey": true`
