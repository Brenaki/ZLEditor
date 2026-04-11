## ADDED Requirements

### Requirement: Locale dictionary module
The system SHALL provide a `scripts/i18n/index.js` module that exports `t(key, vars?)`, `setLocale(locale)`, and `detectLocale()`. Dictionaries for `en`, `pt-BR`, and `es` SHALL be imported statically at module load time.

#### Scenario: Translate a static key
- **WHEN** `t('btn.compile')` is called with locale set to `en`
- **THEN** the function returns `"Compile"`

#### Scenario: Translate a static key in Portuguese
- **WHEN** `t('btn.compile')` is called with locale set to `pt-BR`
- **THEN** the function returns `"Compilar"`

#### Scenario: Template interpolation
- **WHEN** `t('status.refs', { count: 5 })` is called with locale set to `en`
- **THEN** the function returns `"5 references"`

#### Scenario: Missing key fallback
- **WHEN** `t('nonexistent.key')` is called
- **THEN** the function returns `"nonexistent.key"` as a visible fallback string
- **THEN** a warning is logged to the console

### Requirement: Locale detection on first load
The system SHALL detect the user's preferred locale automatically on first load.

#### Scenario: Saved preference takes priority
- **WHEN** `localStorage` contains `zleditor-locale: "es"`
- **THEN** `detectLocale()` returns `"es"` regardless of `navigator.language`

#### Scenario: Detect Portuguese from browser
- **WHEN** `localStorage` has no saved locale and `navigator.language` starts with `"pt"`
- **THEN** `detectLocale()` returns `"pt-BR"`

#### Scenario: Detect Spanish from browser
- **WHEN** `localStorage` has no saved locale and `navigator.language` starts with `"es"`
- **THEN** `detectLocale()` returns `"es"`

#### Scenario: Fallback to English for unsupported languages
- **WHEN** `localStorage` has no saved locale and `navigator.language` is `"fr"` or any unsupported value
- **THEN** `detectLocale()` returns `"en"`

#### Scenario: Fallback on missing navigator.language
- **WHEN** `navigator.language` is `undefined` or empty
- **THEN** `detectLocale()` returns `"en"`

### Requirement: Locale persistence
The system SHALL persist the user's locale choice across sessions.

#### Scenario: Locale saved on change
- **WHEN** `setLocale('es')` is called
- **THEN** `localStorage` item `zleditor-locale` is set to `"es"`

#### Scenario: Locale restored on next load
- **WHEN** the page loads and `localStorage` item `zleditor-locale` is `"pt-BR"`
- **THEN** `detectLocale()` returns `"pt-BR"` and the UI renders in PT-BR

### Requirement: Locale change event
The system SHALL dispatch a `localechange` CustomEvent on `window` when the active locale changes.

#### Scenario: Event dispatched on setLocale
- **WHEN** `setLocale('en')` is called
- **THEN** a `localechange` CustomEvent is dispatched on `window`
- **THEN** the event's `detail.locale` equals `"en"`

#### Scenario: Components can subscribe
- **WHEN** a component listens to `window` for the `localechange` event
- **THEN** the component's handler is called with the new locale and can re-render dynamic strings
