/**
 * Editor wrapper — loads the locally-bundled CodeMirror 6 (editor-bundle.js)
 * and delegates to window.initEditor once the script is ready.
 *
 * Public interface (same as the old textarea editor):
 *   open(name, content), getContent(), insertAtCursor(text)
 */
export class Editor {
  /**
   * @param {{
   *   containerEl: HTMLElement,
   *   filenameEl: HTMLElement,
   *   onChange: (content: string) => void,
   *   getCitekeys: () => string[],
   * }} opts
   */
  constructor({ containerEl, filenameEl, onChange, getCitekeys }) {
    this._filenameEl  = filenameEl;
    this._onChange    = onChange;
    this._getCitekeys = getCitekeys;
    this._containerEl = containerEl;
    this._cm          = null;
    this._pendingOpen = null;

    const script  = document.createElement('script');
    script.src    = '/scripts/editor-bundle.js';
    script.onload = () => this._init();
    script.onerror = () => this._fallback();
    document.head.appendChild(script);
  }

  // ── Public API ────────────────────────────────────────────────────────────

  open(name, content) {
    if (this._cm) {
      this._cm.open(name, content);
    } else {
      this._pendingOpen = { name, content };
      this._filenameEl.textContent = name;
    }
  }

  getContent() {
    return this._cm ? this._cm.getContent() : (this._pendingOpen?.content ?? '');
  }

  insertAtCursor(text) {
    this._cm?.insertAtCursor(text);
  }

  // ── Private ───────────────────────────────────────────────────────────────

  _init() {
    this._cm = window.initEditor({
      containerEl: this._containerEl,
      filenameEl:  this._filenameEl,
      onChange:    this._onChange,
      getCitekeys: this._getCitekeys,
    });

    if (this._pendingOpen) {
      this._cm.open(this._pendingOpen.name, this._pendingOpen.content);
      this._pendingOpen = null;
    }
  }

  /** Graceful fallback to plain textarea if the bundle fails to load. */
  _fallback() {
    console.warn('[Editor] editor-bundle.js failed to load — falling back to textarea');
    const ta = document.createElement('textarea');
    ta.className      = 'editor-textarea';
    ta.spellcheck     = false;
    ta.autocomplete   = 'off';
    ta.autocorrect    = 'off';
    ta.autocapitalize = 'off';
    this._containerEl.appendChild(ta);

    ta.addEventListener('input', () => this._onChange?.(ta.value));
    ta.addEventListener('keydown', e => {
      if (e.key !== 'Tab') return;
      e.preventDefault();
      const s = ta.selectionStart;
      ta.value = ta.value.slice(0, s) + '  ' + ta.value.slice(ta.selectionEnd);
      ta.selectionStart = ta.selectionEnd = s + 2;
      this._onChange?.(ta.value);
    });

    this._cm = {
      open: (name, content) => {
        this._filenameEl.textContent = name;
        ta.value = content ?? '';
      },
      getContent: () => ta.value,
      insertAtCursor: (text) => {
        const s = ta.selectionStart;
        ta.value = ta.value.slice(0, s) + text + ta.value.slice(ta.selectionEnd);
        ta.selectionStart = ta.selectionEnd = s + text.length;
        ta.focus();
        this._onChange?.(ta.value);
      },
    };

    if (this._pendingOpen) {
      this._cm.open(this._pendingOpen.name, this._pendingOpen.content);
      this._pendingOpen = null;
    }
  }
}
