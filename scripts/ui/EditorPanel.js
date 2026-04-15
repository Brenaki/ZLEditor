import { escapeHtml } from '../utils/escape.js';

/**
 * LaTeX editor panel — textarea, cite chips, copy and clear actions.
 *
 * @param {{
 *   editorEl: HTMLTextAreaElement,
 *   chipsEl: HTMLElement,
 *   copyBtnEl: HTMLElement,
 *   clearBtnEl: HTMLElement,
 *   onToast: (msg: string) => void,
 * }} opts
 */
export class EditorPanel {
  constructor({ editorEl, chipsEl, copyBtnEl, clearBtnEl, onToast }) {
    this._editor  = editorEl;
    this._chips   = chipsEl;
    this._onToast = onToast;
    this._keys    = [];

    copyBtnEl.addEventListener('click',  () => this.copyLatex());
    clearBtnEl.addEventListener('click', () => this.clearEditor());
  }

  /**
   * Inserts \cite{key} at the current cursor position in the editor.
   * Also adds a chip if not already present.
   * @param {string} key
   */
  insertCite(key) {
    const ta  = this._editor;
    const ins = `\\cite{${key}}`;
    const pos = ta.selectionStart;

    ta.value = ta.value.slice(0, pos) + ins + ta.value.slice(pos);
    ta.selectionStart = ta.selectionEnd = pos + ins.length;
    ta.focus();

    if (!this._keys.includes(key)) {
      this._keys.push(key);
      this._renderChips();
    }
  }

  copyLatex() {
    const val = this._editor.value.trim();
    if (!val) { this._onToast('Editor vazio'); return; }
    navigator.clipboard.writeText(val).then(() => this._onToast('LaTeX copiado!'));
  }

  clearEditor() {
    this._editor.value = '';
    this._keys = [];
    this._renderChips();
  }

  _renderChips() {
    // Escape cite keys before injecting into innerHTML to prevent stored XSS
    this._chips.innerHTML = this._keys.map(k => {
      const safeKey = escapeHtml(k);
      return `<span class="cite-chip" data-key="${safeKey}">\\cite{${safeKey}}</span>`;
    }).join('');

    this._chips.querySelectorAll('.cite-chip').forEach(el => {
      el.addEventListener('click', () => this.insertCite(el.dataset.key));
    });
  }
}
