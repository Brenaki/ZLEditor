/**
 * Textarea-based code editor — no external dependencies.
 * Implements the same interface as the CodeMirror wrapper:
 *   open(name, content), getContent(), insertAtCursor(text)
 */
export class Editor {
  /**
   * @param {{
   *   containerEl: HTMLElement,
   *   filenameEl: HTMLElement,
   *   onChange: (content: string) => void,
   * }} opts
   */
  constructor({ containerEl, filenameEl, onChange }) {
    this._filenameEl = filenameEl;
    this._onChange   = onChange;

    this._ta = document.createElement('textarea');
    this._ta.className    = 'editor-textarea';
    this._ta.spellcheck   = false;
    this._ta.autocomplete = 'off';
    this._ta.autocorrect  = 'off';
    this._ta.autocapitalize = 'off';
    containerEl.appendChild(this._ta);

    this._ta.addEventListener('input', () => this._onChange?.(this._ta.value));
    this._ta.addEventListener('keydown', e => this._handleKey(e));
  }

  /** @param {string} name  @param {string} content */
  open(name, content) {
    this._filenameEl.textContent = name;
    this._ta.value = content ?? '';
  }

  getContent() { return this._ta.value; }

  /** @param {string} text */
  insertAtCursor(text) {
    const start = this._ta.selectionStart;
    const end   = this._ta.selectionEnd;
    this._ta.value =
      this._ta.value.slice(0, start) + text + this._ta.value.slice(end);
    this._ta.selectionStart = this._ta.selectionEnd = start + text.length;
    this._ta.focus();
    this._onChange?.(this._ta.value);
  }

  /** Tab → insert 2 spaces instead of losing focus. */
  _handleKey(e) {
    if (e.key !== 'Tab') return;
    e.preventDefault();
    this.insertAtCursor('  ');
  }
}
