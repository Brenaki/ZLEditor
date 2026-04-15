## ADDED Requirements

### Requirement: AI chat panel in the sidebar
The system SHALL display a retractable AI chat panel in the left sidebar, stacked below the Zotero panel, following the same toggle/open/close pattern as `ZoteroPanel`.

#### Scenario: Panel is collapsed by default
- **WHEN** the application loads
- **THEN** the AI panel header is visible but the chat area is collapsed

#### Scenario: User expands the panel
- **WHEN** the user clicks the AI panel toggle button
- **THEN** the panel expands to show the chat history and input area

#### Scenario: User collapses the panel
- **WHEN** the panel is open and the user clicks the toggle button
- **THEN** the panel collapses, hiding the chat history and input area

---

### Requirement: Streaming chat response display
The system SHALL display AI responses character-by-character as SSE chunks arrive, with a visible streaming indicator while the response is in progress.

#### Scenario: User sends a message
- **WHEN** the user types a message and submits it (button click or Enter key)
- **THEN** the message appears in the chat history and the input is cleared

#### Scenario: AI response streams in
- **WHEN** the server begins sending SSE chunks
- **THEN** the AI response appears in the chat history and grows in real time as chunks arrive; a loading indicator is visible during streaming

#### Scenario: Stream completes
- **WHEN** the server sends `{"done": true}`
- **THEN** the loading indicator is removed and the input is re-enabled

#### Scenario: Provider error during stream
- **WHEN** the server sends `{"error": "<message>", "done": true}`
- **THEN** the error message is displayed inline in the chat history with an error style

---

### Requirement: Settings icon opens AI config modal
The system SHALL display a settings icon (⚙) in the AI panel header that opens the AI configuration modal.

#### Scenario: Settings icon clicked
- **WHEN** the user clicks the ⚙ icon in the AI panel header
- **THEN** the AI configuration modal opens

---

### Requirement: AI configuration modal
The system SHALL provide a modal for configuring the active provider, API keys, model selection, and context mode.

#### Scenario: Modal loads current config
- **WHEN** the AI config modal is opened
- **THEN** it fetches `GET /ai/config` and populates the form with current values; configured providers show "● Configurado", unconfigured show "○ Não configurado"

#### Scenario: User saves an API key
- **WHEN** the user enters a key in the provider key field and clicks "Salvar"
- **THEN** a PUT request is sent to `/ai/config` with the provider and key; on success the field clears and the status badge updates to "● Configurado"

#### Scenario: User changes active provider
- **WHEN** the user selects a different provider from the dropdown and saves
- **THEN** a PUT request updates `activeProvider` in config

#### Scenario: User changes context mode
- **WHEN** the user selects a context mode radio button and saves
- **THEN** a PUT request updates `contextMode` in config

---

### Requirement: "Explain with AI" button in LogModal
The system SHALL add an "Explicar com IA" button to the LogModal that appears only when a compilation error is present.

#### Scenario: Error log present and AI configured
- **WHEN** the LogModal is opened with `isError: true` and an active AI provider is configured
- **THEN** an "✨ Explicar" button is visible alongside the existing "Copiar" button

#### Scenario: User clicks Explain
- **WHEN** the user clicks "✨ Explicar"
- **THEN** the AI panel opens (if closed), and a chat message is automatically sent with `mode: "explain-error"` and the compilation log as context; the response streams into the AI panel

#### Scenario: AI not configured
- **WHEN** the LogModal is opened with `isError: true` but no active provider is configured
- **THEN** the "✨ Explicar" button is not shown

---

### Requirement: No AI messages sent while provider is unconfigured
The system SHALL prevent sending chat messages when no active provider with a valid key is configured.

#### Scenario: Submit with no provider
- **WHEN** the user attempts to submit a message and `hasKey` is false for the active provider
- **THEN** the send action is blocked and a toast notification informs the user to configure an AI provider in settings
