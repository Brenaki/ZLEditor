## ADDED Requirements

### Requirement: Read provider configuration without exposing keys
The system SHALL expose a `GET /ai/config` endpoint that returns the current provider configuration with key presence indicated as a boolean, never as the actual key value.

#### Scenario: Config exists with configured providers
- **WHEN** a GET request is sent to `/ai/config`
- **THEN** the server responds with HTTP 200 and a JSON body containing `activeProvider`, `contextMode`, and a `providers` map where each entry includes `model`, `hasKey: true/false`, and (for Ollama) `baseUrl` — but never the raw key string

#### Scenario: No config file exists
- **WHEN** a GET request is sent to `/ai/config` and neither `config.json` nor `config.secrets.json` exists
- **THEN** the server responds with HTTP 200 and default config values with `hasKey: false` for all providers

---

### Requirement: Save provider API key server-side
The system SHALL expose a `PUT /ai/config` endpoint that writes provider settings to server-side files, keeping keys in `config.secrets.json` (permissions 0o600) and non-sensitive config in `config.json`.

#### Scenario: Save API key for a provider
- **WHEN** a PUT request is sent with `{"provider": "anthropic", "key": "sk-ant-..."}` 
- **THEN** the key is written only to `config.secrets.json`, the response returns updated config with `hasKey: true`, and the raw key is never included in the response

#### Scenario: Save model selection
- **WHEN** a PUT request is sent with `{"provider": "openai", "model": "gpt-4o"}`
- **THEN** the model is written to `config.json` and the response confirms the update

#### Scenario: Save active provider
- **WHEN** a PUT request is sent with `{"activeProvider": "gemini"}`
- **THEN** `config.json` is updated with the new active provider

#### Scenario: Save context mode
- **WHEN** a PUT request is sent with `{"contextMode": "project"}`
- **THEN** `config.json` is updated; valid values are `"none"`, `"current-file"`, and `"project"`

#### Scenario: Invalid context mode value
- **WHEN** a PUT request is sent with an unrecognized `contextMode` value
- **THEN** the server responds with HTTP 422 and a validation error

---

### Requirement: Ollama uses base URL instead of API key
The system SHALL treat Ollama as a keyless provider configured via a `baseUrl` field.

#### Scenario: Configure Ollama base URL
- **WHEN** a PUT request is sent with `{"provider": "ollama", "baseUrl": "http://localhost:11434"}`
- **THEN** the base URL is saved to `config.json` (not `config.secrets.json`) and `hasKey` is always `true` for Ollama when a `baseUrl` is set

#### Scenario: Ollama with no base URL
- **WHEN** no `baseUrl` is configured for Ollama
- **THEN** `GET /ai/config` returns `hasKey: false` for Ollama
