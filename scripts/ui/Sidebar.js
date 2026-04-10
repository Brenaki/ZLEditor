/**
 * Sidebar — connection status, search, and reference list.
 *
 * @param {{
 *   onConnect: () => void,
 *   onSelect: (key: string) => void,
 *   onFilter: (query: string) => void,
 *   dotEl: HTMLElement,
 *   statusEl: HTMLElement,
 *   connectBtnEl: HTMLElement,
 *   searchEl: HTMLInputElement,
 *   listEl: HTMLElement,
 * }} opts
 */
export class Sidebar {
  constructor({ onConnect, onSelect, onFilter, dotEl, statusEl, connectBtnEl, searchEl, listEl }) {
    this._onSelect = onSelect;
    this._onFilter = onFilter;
    this._selectedKey = null;

    this._dot        = dotEl;
    this._statusText = statusEl;
    this._connectBtn = connectBtnEl;
    this._searchEl   = searchEl;
    this._listEl     = listEl;

    this._connectBtn.addEventListener('click', onConnect);
    this._searchEl.addEventListener('input', () => onFilter(this._searchEl.value));
  }

  /** @param {'connecting' | 'connected' | 'offline'} state */
  setStatus(state) {
    const map = {
      connecting: { dot: 'status-dot--pending',   text: 'Conectando…', btnText: null,         disabled: true  },
      connected:  { dot: 'status-dot--connected', text: null,          btnText: 'Atualizar',   disabled: false },
      offline:    { dot: 'status-dot--offline',   text: 'Demo (Zotero offline)', btnText: 'Reconectar', disabled: false },
    };

    const cfg = map[state];
    this._dot.className = `status-dot ${cfg.dot}`;
    if (cfg.text)    this._statusText.textContent = cfg.text;
    if (cfg.btnText) this._connectBtn.textContent = cfg.btnText;
    this._connectBtn.disabled = cfg.disabled;
  }

  /**
   * Updates the status text to show count.
   * @param {number} count
   */
  setCount(count) {
    this._dot.className = 'status-dot status-dot--connected';
    this._statusText.textContent = `${count} referências`;
    this._connectBtn.textContent = 'Atualizar';
    this._connectBtn.disabled = false;
  }

  /**
   * Renders the reference list.
   * @param {Array} refs
   * @param {string} selectedKey
   */
  render(refs, selectedKey) {
    this._selectedKey = selectedKey;

    if (refs.length === 0) {
      this._listEl.innerHTML = '<div class="empty-state">Nenhuma referência encontrada.</div>';
      return;
    }

    this._listEl.innerHTML = refs.map(r => `
      <div class="ref-item ${r.key === selectedKey ? 'ref-item--selected' : ''}"
           data-key="${r.key}">
        <div class="ref-item__title">${r.title}</div>
        <div class="ref-item__meta">
          ${r.author ? r.author.split(' and ')[0] + (r.author.includes(' and ') ? ' et al.' : '') : ''}
          ${r.year ? '· ' + r.year : ''}
        </div>
        <div class="ref-citekey">\\cite{${r.key}}</div>
      </div>
    `).join('');

    this._listEl.querySelectorAll('.ref-item').forEach(el => {
      el.addEventListener('click', () => this._onSelect(el.dataset.key));
    });
  }

  showEmpty(message) {
    this._listEl.innerHTML = `<div class="empty-state">${message}</div>`;
  }
}
