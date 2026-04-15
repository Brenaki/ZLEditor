## ADDED Requirements

### Requirement: Stream AI response via SSE
The system SHALL expose a `POST /ai/chat` endpoint that streams AI responses as Server-Sent Events using the active provider configured in `config.json`.

#### Scenario: Successful stream with active provider
- **WHEN** a POST request is sent to `/ai/chat` with valid `messages` and `projectId`
- **THEN** the server responds with `Content-Type: text/event-stream` and streams chunks in the format `data: {"delta": "<text>", "done": false}` until the response is complete, ending with `data: {"delta": "", "done": true}`

#### Scenario: No provider configured
- **WHEN** a POST request is sent to `/ai/chat` and no active provider is set in config
- **THEN** the server responds with HTTP 400 and `{"error": "No AI provider configured"}`

#### Scenario: Provider key missing
- **WHEN** a POST request is sent to `/ai/chat` and the active provider has no API key in `config.secrets.json`
- **THEN** the server responds with HTTP 400 and `{"error": "API key not configured for provider <name>"}`

#### Scenario: Upstream provider error
- **WHEN** litellm raises an exception during streaming (e.g., invalid key, quota exceeded)
- **THEN** the server streams `data: {"error": "<message>", "done": true}` and closes the connection

---

### Requirement: Inject document context into AI prompt
The system SHALL inject document content into the AI system prompt according to the `contextMode` setting.

#### Scenario: Context mode is "current-file"
- **WHEN** the request includes `currentFile` with name and content, and `contextMode` is `"current-file"`
- **THEN** the system prompt includes only that file's content under a labelled section

#### Scenario: Context mode is "project"
- **WHEN** the request includes a `files` array and `contextMode` is `"project"`
- **THEN** the system prompt includes all files concatenated with `=== <filename> ===` separators

#### Scenario: Context mode is "none"
- **WHEN** `contextMode` is `"none"`
- **THEN** no document content is injected into the system prompt

---

### Requirement: Use MemPalace for token-efficient memory
The system SHALL use MemPalace to maintain cross-session context without sending full chat history on every request.

#### Scenario: Memory injected on each request
- **WHEN** a chat request is processed and a MemPalace palace exists for the project
- **THEN** `wake-up` summary (~170 tokens) and top-k semantically relevant memories are prepended to the system prompt

#### Scenario: Empty palace on first use
- **WHEN** a chat request is processed and the palace directory does not yet exist or is empty
- **THEN** no memory context is injected; the request proceeds without error

#### Scenario: Exchange indexed after response
- **WHEN** the AI response stream completes successfully
- **THEN** the user message and full AI response are indexed into MemPalace via `mine`

---

### Requirement: Support error-explanation mode
The system SHALL accept a `mode` field in the chat request to provide compilation-error-specific context.

#### Scenario: Error explanation request
- **WHEN** the request includes `"mode": "explain-error"` and a `compilationLog` string
- **THEN** the system prompt includes the compilation log and instructs the AI to explain the error in plain language and suggest a fix

#### Scenario: General chat request
- **WHEN** the request omits `mode` or sets `"mode": "chat"`
- **THEN** the system prompt uses the standard paper-writing assistant persona
