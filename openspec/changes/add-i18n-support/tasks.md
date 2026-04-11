## 1. i18n Core Module

- [ ] 1.1 Create `scripts/i18n/en.js` with all ~57 English strings as a default-exported object
- [ ] 1.2 Create `scripts/i18n/pt-BR.js` with all Portuguese (PT-BR) strings
- [ ] 1.3 Create `scripts/i18n/es.js` with all Spanish strings
- [ ] 1.4 Create `scripts/i18n/index.js` exporting `t(key, vars?)`, `setLocale(locale)`, and `detectLocale()`
- [ ] 1.5 Implement `detectLocale()` — check `localStorage`, then `navigator.language`, fallback to `en`
- [ ] 1.6 Implement `setLocale()` — update active locale, persist to `localStorage`, dispatch `localechange` CustomEvent on `window`
- [ ] 1.7 Implement `t()` — look up key in active locale, apply `{var}` template substitution, log warning and return key on miss

## 2. HTML Static Strings

- [ ] 2.1 Add `data-i18n` attributes to all toolbar buttons and labels in `index.html`
- [ ] 2.2 Add `data-i18n-placeholder` to all `<input>` elements (Zotero search, quick-open)
- [ ] 2.3 Add `data-i18n` to modal titles and body text (log modal, restore session modal)
- [ ] 2.4 Add `data-i18n` to file tree header, Zotero panel toggle label, and empty states
- [ ] 2.5 Add `data-i18n` to PDF viewer empty state and editor header elements
- [ ] 2.6 Add language `<select id="locale-select">` to the toolbar right section (before compile button)

## 3. i18n DOM Application

- [ ] 3.1 Implement `applyLocale()` in `scripts/i18n/index.js` — walk all `[data-i18n]` and `[data-i18n-placeholder]` nodes and update `textContent` / `placeholder`
- [ ] 3.2 Call `applyLocale()` inside `setLocale()` so DOM updates happen automatically
- [ ] 3.3 In `app.js`, call `setLocale(detectLocale())` at the very top (before any other init) to prevent FOUC

## 4. JS Component Updates

- [ ] 4.1 Update `app.js` — replace all hardcoded toast strings with `t()` calls
- [ ] 4.2 Update `scripts/ui/ZoteroPanel.js` — use `t()` for status labels (`connecting`, `connected`, `offline`, count string); listen to `localechange` and re-render current status
- [ ] 4.3 Update `scripts/ui/FileTree.js` — use `t()` for context menu items (`Set as root`, `Remove file`) and empty state message
- [ ] 4.4 Update `scripts/ui/LogModal.js` — use `t()` for modal title (normal vs error variant) and "no log" fallback text
- [ ] 4.5 Update `scripts/ui/QuickOpen.js` — use `t()` for input placeholder

## 5. Language Selector Wiring

- [ ] 5.1 In `app.js`, wire the `locale-select` change event to call `setLocale()`
- [ ] 5.2 On page load, set `locale-select.value` to the detected locale so the selector reflects the current state

## 6. Verification

- [ ] 6.1 Manually test all three locales — verify no visible PT-BR strings remain when EN or ES is active
- [ ] 6.2 Verify locale persists after page reload (with project state intact via existing auto-save)
- [ ] 6.3 Verify `navigator.language` detection — test with browser set to `pt-BR`, `es`, and `fr`
- [ ] 6.4 Verify template interpolation strings (reference count, file count) display correctly in all locales
- [ ] 6.5 Verify no page reload happens when switching locale with a project loaded
