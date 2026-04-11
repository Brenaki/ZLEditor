## Why

ZLEditor is currently hardcoded in Portuguese (PT-BR), limiting adoption by English and Spanish-speaking users. Adding runtime locale switching enables the editor to serve a broader international audience without requiring a page reload (which would lose unsaved project state).

## What Changes

- Introduce a lightweight i18n module (`scripts/i18n/`) with locale dictionaries for PT-BR, English, and Spanish
- Add a `t(key, vars?)` function for translating strings with optional template interpolation
- Add locale detection from `navigator.language` on first load, with fallback to English
- Persist user locale preference to `localStorage`
- Add a language selector `<select>` in the toolbar
- Replace all hardcoded UI strings in `index.html` with `data-i18n` / `data-i18n-placeholder` attributes
- Update all JS components to use `t()` for dynamic strings and re-render on locale change

## Capabilities

### New Capabilities

- `i18n-core`: i18n module — `t()`, `setLocale()`, `detectLocale()`, locale dictionaries (PT-BR, EN, ES), `localechange` event, localStorage persistence
- `i18n-ui`: Locale switcher in the toolbar and real-time DOM re-translation via `data-i18n` attributes

### Modified Capabilities

- `codemirror-editor`: Editor UI strings (placeholder, status) must use `t()` and respond to `localechange`

## Impact

- `index.html`: All static UI strings replaced with `data-i18n` attributes; language selector added to toolbar
- `scripts/app.js`: All toast messages and dynamic status strings replaced with `t()`
- `scripts/ui/ZoteroPanel.js`: Status and count strings use `t()`
- `scripts/ui/FileTree.js`: Context menu and empty state strings use `t()`
- `scripts/ui/LogModal.js`: Modal titles use `t()`
- `scripts/ui/QuickOpen.js`: Placeholder uses `t()`
- No external dependencies added
