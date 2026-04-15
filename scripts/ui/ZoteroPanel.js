import { t } from '../i18n/index.js';
import { escapeHtml } from '../utils/escape.js';

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
   *   onInsert: (key: string, ref: Object) => void,
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

    // Track current state for re-render on locale change
    this._currentState = null;
    this._currentCount = null;

    toggleEl.addEventListener('click', () => this.toggle());
    connectBtnEl.addEventListener('click', onConnect);
    searchEl.addEventListener('input', () => this._filter(searchEl.value));

    window.addEventListener('localechange', () => this._rerender());
  }

  toggle() {
    this._isOpen = !this._isOpen;
    this._panel.classList.toggle('zotero-panel--open', this._isOpen);
  }

  /** @param {'connecting' | 'connected' | 'offline'} state */
  setStatus(state) {
    this._currentState = state;
    this._currentCount = null;

    const cfg = {
      connecting: { dot: 'status-dot--pending',   text: t('zotero.status.connecting'), btn: null,                        disabled: true  },
      connected:  { dot: 'status-dot--connected', text: null,                           btn: t('zotero.btn.update'),      disabled: false },
      offline:    { dot: 'status-dot--offline',   text: t('zotero.status.offline'),    btn: t('zotero.btn.reconnect'),   disabled: false },
    }[state];

    this._dot.className = `status-dot ${cfg.dot}`;
    if (cfg.text) this._statusEl.textContent = cfg.text;
    if (cfg.btn)  this._connectBtn.textContent = cfg.btn;
    this._connectBtn.disabled = cfg.disabled;
  }

  /** @param {number} count */
  setCount(count) {
    this._currentCount = count;
    this._currentState = null;

    this._dot.className = 'status-dot status-dot--connected';
    this._statusEl.textContent = t('zotero.refs.count', { count });
    this._connectBtn.textContent = t('zotero.btn.update');
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

  _rerender() {
    if (this._currentCount !== null) {
      this.setCount(this._currentCount);
    } else if (this._currentState) {
      this.setStatus(this._currentState);
    }
    if (this._allRefs.length > 0) {
      this._render(this._allRefs);
    }
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
      this._listEl.innerHTML = `<div class="empty-state" style="padding:0.75rem;font-size:12px;">${t('zotero.refs.none')}</div>`;
      return;
    }

    // VULN-004: Escape all reference fields before injecting into innerHTML to prevent stored XSS
    this._listEl.innerHTML = refs.map(r => {
      const safeKey    = escapeHtml(r.key);
      const safeTitle  = escapeHtml(r.title);
      const safeYear   = escapeHtml(r.year);
      const authorFirst = r.author ? r.author.split(' and ')[0] + (r.author.includes(' and ') ? ' et al.' : '') : '';
      const safeAuthor = escapeHtml(authorFirst);
      return `
      <div class="ref-item" data-key="${safeKey}" title="Inserir \\cite{${safeKey}}">
        <div class="ref-item__title">${safeTitle}</div>
        <div class="ref-item__meta">
          ${safeAuthor}
          ${safeYear ? '· ' + safeYear : ''}
        </div>
        <div class="ref-citekey">\\cite{${safeKey}}</div>
      </div>
    `;
    }).join('');

    this._listEl.querySelectorAll('.ref-item').forEach(el => {
      const ref = refs.find(r => r.key === el.dataset.key);
      el.addEventListener('click', () => this._onInsert(el.dataset.key, ref));
    });
  }
}
