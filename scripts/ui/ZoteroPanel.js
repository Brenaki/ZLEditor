/**
 * Retractable Zotero panel in the left column.
 * Handles connection, search, and ref insertion.
 */
export class ZoteroPanel {
  /**
   * @param {{
   *   panelEl: HTMLElement,
   *   toggleEl: HTMLButtonElement,
   *   toggleIconEl: HTMLElement,
   *   dotEl: HTMLElement,
   *   statusEl: HTMLElement,
   *   connectBtnEl: HTMLButtonElement,
   *   searchEl: HTMLInputElement,
   *   listEl: HTMLElement,
   *   onConnect: () => void,
   *   onInsert: (key: string) => void,
   * }} opts
   */
  constructor({ panelEl, toggleEl, toggleIconEl, dotEl, statusEl,
                connectBtnEl, searchEl, listEl, onConnect, onInsert }) {
    this._panel      = panelEl;
    this._dot        = dotEl;
    this._statusEl   = statusEl;
    this._connectBtn = connectBtnEl;
    this._searchEl   = searchEl;
    this._listEl     = listEl;
    this._onInsert   = onInsert;
    this._allRefs    = [];
    this._isOpen     = false;

    toggleEl.addEventListener('click', () => this.toggle());
    connectBtnEl.addEventListener('click', onConnect);
    searchEl.addEventListener('input', () => this._filter(searchEl.value));
  }

  toggle() {
    this._isOpen = !this._isOpen;
    this._panel.classList.toggle('zotero-panel--open', this._isOpen);
  }

  /** @param {'connecting' | 'connected' | 'offline'} state */
  setStatus(state) {
    const cfg = {
      connecting: { dot: 'status-dot--pending',   text: 'Conectando…',           btn: null,         disabled: true  },
      connected:  { dot: 'status-dot--connected', text: null,                    btn: 'Atualizar',   disabled: false },
      offline:    { dot: 'status-dot--offline',   text: 'Demo (Zotero offline)', btn: 'Reconectar', disabled: false },
    }[state];

    this._dot.className = `status-dot ${cfg.dot}`;
    if (cfg.text) this._statusEl.textContent = cfg.text;
    if (cfg.btn)  this._connectBtn.textContent = cfg.btn;
    this._connectBtn.disabled = cfg.disabled;
  }

  /** @param {number} count */
  setCount(count) {
    this._dot.className = 'status-dot status-dot--connected';
    this._statusEl.textContent = `${count} referências`;
    this._connectBtn.textContent = 'Atualizar';
    this._connectBtn.disabled = false;
  }

  /** @param {Array} refs */
  setRefs(refs) {
    this._allRefs = refs;
    this._render(refs);
  }

  /** Returns array of citekey strings currently loaded in the panel. */
  getCitekeys() {
    return this._allRefs.map(r => r.key);
  }

  showEmpty(msg) {
    this._listEl.innerHTML = `<div class="empty-state" style="padding:0.75rem;font-size:12px;">${msg}</div>`;
  }

  _filter(query) {
    const lq = query.toLowerCase();
    const filtered = this._allRefs.filter(r =>
      r.title.toLowerCase().includes(lq) ||
      r.author.toLowerCase().includes(lq) ||
      r.key.toLowerCase().includes(lq) ||
      r.year.includes(lq)
    );
    this._render(filtered);
  }

  _render(refs) {
    if (refs.length === 0) {
      this._listEl.innerHTML = '<div class="empty-state" style="padding:0.75rem;font-size:12px;">Nenhuma referência encontrada.</div>';
      return;
    }

    this._listEl.innerHTML = refs.map(r => `
      <div class="ref-item" data-key="${r.key}" title="Inserir \\cite{${r.key}}">
        <div class="ref-item__title">${r.title}</div>
        <div class="ref-item__meta">
          ${r.author ? r.author.split(' and ')[0] + (r.author.includes(' and ') ? ' et al.' : '') : ''}
          ${r.year ? '· ' + r.year : ''}
        </div>
        <div class="ref-citekey">\\cite{${r.key}}</div>
      </div>
    `).join('');

    this._listEl.querySelectorAll('.ref-item').forEach(el => {
      el.addEventListener('click', () => this._onInsert(el.dataset.key));
    });
  }
}
