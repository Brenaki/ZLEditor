import { generateBibtex, escapeHtml } from '../utils/bibtex.js';

/**
 * BibTeX panel — displays and copies BibTeX entries.
 *
 * @param {{
 *   areaEl: HTMLElement,
 *   onToast: (msg: string) => void,
 *   getAllRefs: () => Array,
 * }} opts
 */
export class BibtexPanel {
  constructor({ areaEl, copyBtnEl, copyKeyBtnEl, exportBtnEl, onToast, getAllRefs }) {
    this._area      = areaEl;
    this._onToast   = onToast;
    this._getAllRefs = getAllRefs;
    this._current   = null;

    copyBtnEl.addEventListener('click',    () => this.copyBibtex());
    copyKeyBtnEl.addEventListener('click', () => this.copyKey());
    exportBtnEl.addEventListener('click',  () => this.exportAll());
  }

  /** @param {{ key: string, type: string, title: string, author: string, year: string }} ref */
  show(ref) {
    this._current = ref;
    this._area.innerHTML = `<div class="bibtex-code">${escapeHtml(generateBibtex(ref))}</div>`;
  }

  showEmpty() {
    this._area.innerHTML = '<div class="empty-state">Selecione uma referência na lista para ver o BibTeX gerado.</div>';
  }

  copyBibtex() {
    if (!this._current) { this._onToast('Selecione uma referência primeiro'); return; }
    navigator.clipboard.writeText(generateBibtex(this._current))
      .then(() => this._onToast('BibTeX copiado!'));
  }

  copyKey() {
    if (!this._current) { this._onToast('Selecione uma referência primeiro'); return; }
    navigator.clipboard.writeText(`\\cite{${this._current.key}}`)
      .then(() => this._onToast('Chave copiada!'));
  }

  exportAll() {
    const refs = this._getAllRefs();
    if (refs.length === 0) { this._onToast('Nenhuma referência carregada'); return; }
    const all = refs.map(generateBibtex).join('\n\n');
    navigator.clipboard.writeText(all)
      .then(() => this._onToast(`${refs.length} referências copiadas!`));
  }
}
