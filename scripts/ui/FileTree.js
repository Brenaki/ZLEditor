import { t } from '../i18n/index.js';

const FILE_ICONS = {
  '.tex': '📄',
  '.bib': '📚',
  '.sty': '🎨',
  '.cls': '📋',
  '.pdf': '📕',
  '.png': '🖼️',
  '.jpg': '🖼️',
  '.jpeg':'🖼️',
};

function icon(name) {
  const ext = name.slice(name.lastIndexOf('.')).toLowerCase();
  return FILE_ICONS[ext] ?? '📎';
}

/**
 * File tree panel — lists project files, handles selection and root file.
 */
export class FileTree {
  /**
   * @param {{
   *   listEl: HTMLElement,
   *   onSelect: (name: string) => void,
   *   onDelete: (name: string) => void,
   *   onSetRoot: (name: string) => void,
   *   onNewFile: (name: string) => void,
   * }} opts
   */
  constructor({ listEl, onSelect, onDelete, onSetRoot, onNewFile }) {
    this._list      = listEl;
    this._onSelect  = onSelect;
    this._onDelete  = onDelete;
    this._onSetRoot = onSetRoot;
    this._onNewFile = onNewFile;
    this._active    = null;
    this._root      = 'main.tex';
    this._names     = [];
    this._contextMenu = null;

    document.addEventListener('click', () => this._closeMenu());
    document.addEventListener('keydown', e => { if (e.key === 'Escape') this._closeMenu(); });
    window.addEventListener('localechange', () => this.render(this._names, this._active, this._root));
  }

  /**
   * @param {string[]} names - sorted file names
   * @param {string} activeName
   * @param {string} rootName
   */
  render(names, activeName, rootName) {
    this._names  = names;
    this._active = activeName;
    this._root   = rootName;

    if (names.length === 0) {
      this._list.innerHTML = `<div class="empty-state" style="padding:1rem;font-size:12px;">${t('filetree.empty')}</div>`;
      return;
    }

    this._list.innerHTML = names.map(name => `
      <div class="file-tree__item
           ${name === activeName ? ' file-tree__item--active' : ''}
           ${name === rootName   ? ' file-tree__item--root'   : ''}"
           data-name="${name}">
        <span>
          <span class="file-tree__icon">${icon(name)}</span>${name}
        </span>
        <span class="file-tree__item-actions">
          <button class="btn btn--sm btn--ghost" data-action="delete" data-name="${name}" title="Remover">✕</button>
        </span>
      </div>
    `).join('');

    this._list.querySelectorAll('.file-tree__item').forEach(el => {
      el.addEventListener('click', e => {
        if (e.target.dataset.action === 'delete') return;
        this._onSelect(el.dataset.name);
      });

      el.addEventListener('contextmenu', e => {
        e.preventDefault();
        this._showMenu(e.clientX, e.clientY, el.dataset.name);
      });
    });

    this._list.querySelectorAll('[data-action="delete"]').forEach(btn => {
      btn.addEventListener('click', e => {
        e.stopPropagation();
        this._onDelete(btn.dataset.name);
      });
    });
  }

  /** Shows the inline new-file input at the bottom of the list. */
  showNewFileInput() {
    const existing = this._list.querySelector('.file-tree__new-input');
    if (existing) { existing.focus(); return; }

    const input = document.createElement('input');
    input.className = 'file-tree__new-input';
    input.placeholder = 'nome-do-arquivo.tex';
    this._list.appendChild(input);
    input.focus();

    const commit = () => {
      const name = input.value.trim();
      input.remove();
      if (name) this._onNewFile(name);
    };

    input.addEventListener('keydown', e => {
      if (e.key === 'Enter')  commit();
      if (e.key === 'Escape') input.remove();
    });
    input.addEventListener('blur', commit);
  }

  _showMenu(x, y, name) {
    this._closeMenu();
    const menu = document.createElement('div');
    menu.className = 'context-menu';

    if (name.endsWith('.tex')) {
      const setRoot = document.createElement('div');
      setRoot.className = 'context-menu__item';
      setRoot.textContent = t('filetree.ctx.setroot');
      setRoot.addEventListener('click', () => { this._onSetRoot(name); this._closeMenu(); });
      menu.appendChild(setRoot);
    }

    const del = document.createElement('div');
    del.className = 'context-menu__item';
    del.style.color = 'var(--color-danger)';
    del.textContent = t('filetree.ctx.delete');
    del.addEventListener('click', () => { this._onDelete(name); this._closeMenu(); });
    menu.appendChild(del);

    menu.style.left = `${x}px`;
    menu.style.top  = `${y}px`;
    document.body.appendChild(menu);
    this._contextMenu = menu;
  }

  _closeMenu() {
    this._contextMenu?.remove();
    this._contextMenu = null;
  }
}
