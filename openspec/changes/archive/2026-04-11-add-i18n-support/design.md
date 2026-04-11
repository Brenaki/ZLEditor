## Context

ZLEditor is a vanilla JS (no framework, no build tool) web app using ES modules. All UI strings are currently hardcoded in Portuguese (PT-BR) across `index.html` and several JS components. The app stores project state in `localStorage`, making page reloads undesirable — locale switching must happen in-place without reloading.

## Goals / Non-Goals

**Goals:**
- Support PT-BR, English, and Spanish at runtime with zero page reload
- Auto-detect locale from `navigator.language` on first visit; fall back to English if unsupported
- Persist locale preference in `localStorage`
- Support template-style string interpolation (`{count}` placeholders)
- Keep the solution zero-dependency (no i18next or similar)

**Non-Goals:**
- Right-to-left language support
- Pluralization rules (all dynamic counts use simple `{n} items` form)
- Translation of user content (filenames, LaTeX source, bibliography)
- Server-side locale negotiation

## Decisions

### Decision 1: Key-based `t()` function + `data-i18n` HTML attributes

**Chosen:** A `scripts/i18n/index.js` module exports `t(key, vars?)` and `setLocale(locale)`. Static HTML nodes carry `data-i18n="key"` (for `textContent`) and `data-i18n-placeholder="key"` (for `placeholder` attribute). On `setLocale()`, the module walks all attributed nodes and updates them in-place, then dispatches a `localechange` CustomEvent on `window` for JS components to re-render their dynamic strings.

**Alternatives considered:**
- *Full reload on change*: Simpler, but destroys in-memory project state.
- *i18next library*: More features (pluralization, namespaces) but adds a dependency for ~57 strings.
- *Template literals in JS only (no data-i18n)*: Requires each component to imperatively re-bind every string on locale change — more coupling, harder to maintain.

### Decision 2: Locale dictionaries as plain JS objects (one file per locale)

```
scripts/i18n/
  index.js    ← t(), setLocale(), detectLocale()
  en.js       ← export default { 'btn.compile': 'Compile', ... }
  pt-BR.js    ← export default { 'btn.compile': 'Compilar', ... }
  es.js       ← export default { 'btn.compile': 'Compilar', ... }
```

Static imports keep everything synchronous — no async loading, no FOUC.

**Alternative:** JSON files fetched dynamically — adds async complexity and a loading state for a trivial payload.

### Decision 3: Language selector as a `<select>` in the toolbar right section

Consistent with the existing `engine-select` already in the toolbar. Placed before the compile button.

```html
<select id="locale-select" class="engine-select" title="Language">
  <option value="en">EN</option>
  <option value="pt-BR">PT</option>
  <option value="es">ES</option>
</select>
```

### Decision 4: `navigator.language` detection with English fallback

```js
function detectLocale() {
  const saved = localStorage.getItem('zleditor-locale');
  if (saved && SUPPORTED.includes(saved)) return saved;
  const lang = navigator.language ?? '';
  if (lang.startsWith('pt')) return 'pt-BR';
  if (lang.startsWith('es')) return 'es';
  return 'en';
}
```

`localStorage` key `zleditor-locale` takes priority over browser detection.

### Decision 5: Template interpolation via simple `{key}` replacement

```js
t('status.refs', { count: 5 })
// en.js: 'status.refs': '{count} references'
// → "5 references"
```

Implemented as a single `replace` loop over `Object.entries(vars)`. No eval, no regex complexity.

## Risks / Trade-offs

- **FOUC on first load**: Because `data-i18n` nodes start with their PT-BR text baked into HTML, a non-PT user may briefly see Portuguese before JS runs. Mitigation: call `applyLocale()` at the top of `app.js` before any other initialization.
- **String key drift**: If a key is used in JS but missing from a locale file, `t()` should return the key itself as a visible fallback (not silently empty). Mitigation: `t()` logs a warning and returns the key string.
- **Component re-render coupling**: JS components (ZoteroPanel, FileTree, LogModal) must listen to `localechange` and re-render. Missing a listener causes stale strings. Mitigation: each component registers its own handler in its constructor.

## Migration Plan

1. Create `scripts/i18n/` with all locale files
2. Update `index.html` — add `data-i18n` attributes to all static strings, add locale select
3. Update JS components one by one to use `t()` and listen to `localechange`
4. Wire locale select and initial detection in `app.js`
5. Verify all ~57 strings are covered across the three locales

No server changes required. No rollback complexity — the change is purely additive to the HTML/JS layer.
