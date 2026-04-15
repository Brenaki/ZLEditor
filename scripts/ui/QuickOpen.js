import { t } from '../i18n/index.js';
import { escapeHtml } from '../utils/escape.js';

/**
 * Quick-open overlay (Ctrl+P).
 * Supports two modes:
 *   - File mode (no prefix): substring filter on file names
 *   - Content mode (% prefix): full-text search across all text files
 */
export class QuickOpen {
  /**
   * @param {{
   *   overlayEl: HTMLElement,
   *   inputEl: HTMLInputElement,
   *   listEl: HTMLElement,
   *   getFiles: () => [string, object][],
   *   openFile: (name: string, line?: number) => void,
   * }} opts
   */
  constructor({ overlayEl, inputEl, listEl, getFiles, openFile }) {
    this._overlay  = overlayEl;
    this._input    = inputEl;
    this._list     = listEl;
    this._getFiles = getFiles;
    this._openFile = openFile;
    this._results  = [];
    this._selectedIdx = -1;

    this._input.addEventListener('input', () => this._onInput());
    this._input.addEventListener('keydown', e => this._onKeydown(e));
    this._overlay.addEventListener('click', e => {
      if (e.target === this._overlay) this.close();
    });
  }

  open() {
    this._overlay.classList.add('qo-overlay--open');
    this._input.value = '';
    this._list.innerHTML = '';
    this._results = [];
    this._selectedIdx = -1;
    this._input.focus();
    this._searchFiles('');
  }

  close() {
    this._overlay.classList.remove('qo-overlay--open');
  }

  _onInput() {
    const query = this._input.value;
    if (query.startsWith('%')) {
      this._searchContent(query.slice(1));
    } else {
      this._searchFiles(query);
    }
  }

  _searchFiles(query) {
    const lq = query.toLowerCase();
    const files = this._getFiles();
    this._results = (lq
      ? files.filter(([name]) => name.toLowerCase().includes(lq))
      : files
    ).map(([name]) => ({ name, line: null, context: null }));
    this._render();
  }

  _searchContent(query) {
    if (!query) {
      this._results = [];
      this._render();
      return;
    }
    const lq = query.toLowerCase();
    const results = [];
    for (const [name, file] of this._getFiles()) {
      if (!file.content) continue;
      const lines = file.content.split('\n');
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].toLowerCase().includes(lq)) {
          results.push({ name, line: i + 1, context: lines[i].trim() });
        }
      }
    }
    this._results = results;
    this._render();
  }

  _render() {
    this._selectedIdx = this._results.length > 0 ? 0 : -1;

    if (this._results.length === 0) {
      this._list.innerHTML = `<div class="qo-empty">${t('quickopen.empty')}</div>`;
      return;
    }

    // VULN-013: Escape file names before injecting into innerHTML to prevent stored XSS
    this._list.innerHTML = this._results.map((r, i) => {
      const safeName = escapeHtml(r.name);
      const label = r.line !== null
        ? `<span class="qo-file">${safeName}:${r.line}</span><span class="qo-context"> — ${this._escape(r.context)}</span>`
        : `<span class="qo-file">${safeName}</span>`;
      return `<div class="qo-item${i === 0 ? ' qo-item--selected' : ''}" data-idx="${i}">${label}</div>`;
    }).join('');

    this._list.querySelectorAll('.qo-item').forEach(el => {
      el.addEventListener('click', () => this._select(Number(el.dataset.idx)));
      el.addEventListener('mouseenter', () => this._highlight(Number(el.dataset.idx)));
    });
  }

  _onKeydown(e) {
    if (e.key === 'Escape') {
      e.preventDefault();
      this.close();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      this._highlight(Math.min(this._selectedIdx + 1, this._results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      this._highlight(Math.max(this._selectedIdx - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (this._selectedIdx >= 0) this._select(this._selectedIdx);
    }
  }

  _highlight(idx) {
    this._selectedIdx = idx;
    this._list.querySelectorAll('.qo-item').forEach((el, i) => {
      el.classList.toggle('qo-item--selected', i === idx);
    });
    this._list.querySelector('.qo-item--selected')?.scrollIntoView({ block: 'nearest' });
  }

  _select(idx) {
    const r = this._results[idx];
    if (!r) return;
    this.close();
    this._openFile(r.name, r.line ?? undefined);
  }

  _escape(s) {
    return s
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }
}
