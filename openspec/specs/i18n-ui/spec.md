## ADDED Requirements

### Requirement: data-i18n attribute-based static translation
The system SHALL translate all static UI strings in `index.html` by replacing hardcoded text with `data-i18n` attributes and applying translations via JavaScript on load and on locale change.

#### Scenario: Static button text translated on load
- **WHEN** the page loads with locale `en`
- **THEN** all elements with `data-i18n` attributes display text in English
- **THEN** no Portuguese text is visible in the translated elements

#### Scenario: Placeholder inputs translated on load
- **WHEN** the page loads with locale `pt-BR`
- **THEN** all `<input>` elements with `data-i18n-placeholder` attributes show their Portuguese placeholder text

#### Scenario: Real-time re-translation without page reload
- **WHEN** the user changes the locale via the language selector
- **THEN** all `data-i18n` text nodes update immediately in place
- **THEN** all `data-i18n-placeholder` inputs update their placeholder immediately
- **THEN** no page reload occurs
- **THEN** the open project and editor state are preserved

### Requirement: Language selector in the toolbar
The system SHALL display a `<select>` element in the toolbar's right section that allows the user to switch between supported locales.

#### Scenario: Selector shows current locale
- **WHEN** the page loads
- **THEN** the locale selector shows the currently active locale

#### Scenario: Switching locale via selector
- **WHEN** the user selects a different locale in the selector
- **THEN** `setLocale()` is called with the selected value
- **THEN** the entire UI re-translates in real time

#### Scenario: Three locales available
- **WHEN** the user opens the language selector
- **THEN** three options are shown: `EN`, `PT`, `ES`

### Requirement: JS component dynamic string translation
The system SHALL ensure all dynamic strings produced by JS components (toasts, status labels, modal titles, context menus, empty states) are translated via `t()` and updated when the locale changes.

#### Scenario: Toast messages in active locale
- **WHEN** a toast is shown (e.g., compilation success)
- **THEN** the message text is in the currently active locale

#### Scenario: ZoteroPanel status text in active locale
- **WHEN** the Zotero panel shows connection status or reference count
- **THEN** the status text is in the currently active locale

#### Scenario: FileTree context menu in active locale
- **WHEN** the user right-clicks a file in the file tree
- **THEN** context menu items ("Set as root file", "Remove file") are in the active locale

#### Scenario: Dynamic strings update after locale change
- **WHEN** the user changes locale while the Zotero panel is connected and showing a count
- **THEN** the count string re-renders in the new locale on the next status update or immediately if the component re-renders on `localechange`
