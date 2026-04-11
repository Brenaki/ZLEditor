import en   from './en.js';
import ptBR from './pt-BR.js';
import es   from './es.js';

const LOCALES   = { en, 'pt-BR': ptBR, es };
const SUPPORTED = Object.keys(LOCALES);
const LS_KEY    = 'zleditor-locale';

let _locale = 'en';

/** Detect locale from localStorage, then navigator.language, fallback to 'en'. */
export function detectLocale() {
  const saved = localStorage.getItem(LS_KEY);
  if (saved && SUPPORTED.includes(saved)) return saved;
  const lang = (navigator.language ?? '').toLowerCase();
  if (lang.startsWith('pt')) return 'pt-BR';
  if (lang.startsWith('es')) return 'es';
  return 'en';
}

/** Return the currently active locale code. */
export function getLocale() {
  return _locale;
}

/**
 * Translate a key with optional {var} template substitution.
 * Falls back to English, then returns the key itself with a console warning.
 */
export function t(key, vars = {}) {
  const dict = LOCALES[_locale] ?? LOCALES.en;
  let str = dict[key] ?? LOCALES.en[key];
  if (str === undefined) {
    console.warn(`[i18n] Missing translation key: "${key}"`);
    return key;
  }
  for (const [k, v] of Object.entries(vars)) {
    str = str.replaceAll(`{${k}}`, v);
  }
  return str;
}

/**
 * Set the active locale, persist to localStorage, update the DOM,
 * and dispatch a 'localechange' event on window.
 */
export function setLocale(locale) {
  if (!SUPPORTED.includes(locale)) return;
  _locale = locale;
  localStorage.setItem(LS_KEY, locale);
  document.documentElement.lang = locale;
  _applyLocale();
  window.dispatchEvent(new CustomEvent('localechange', { detail: { locale } }));
}

/** Walk the DOM and update all elements with i18n data attributes. */
function _applyLocale() {
  document.querySelectorAll('[data-i18n]').forEach(el => {
    el.textContent = t(el.dataset.i18n);
  });
  document.querySelectorAll('[data-i18n-html]').forEach(el => {
    el.innerHTML = t(el.dataset.i18nHtml);
  });
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    el.placeholder = t(el.dataset.i18nPlaceholder);
  });
  document.querySelectorAll('[data-i18n-title]').forEach(el => {
    el.title = t(el.dataset.i18nTitle);
  });
}
