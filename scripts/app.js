import { t, setLocale, detectLocale } from './i18n/index.js';
import { ZoteroService }  from './services/ZoteroService.js';
import { BibService }     from './services/BibService.js';
import { CompileService } from './services/CompileService.js';
import { ZipService }     from './services/ZipService.js';
import { StorageService } from './services/StorageService.js';
import { ProjectStore }   from './store/ProjectStore.js';
import { Toast }          from './ui/Toast.js';
import { FileTree }       from './ui/FileTree.js';
import { Editor }         from './ui/Editor.js';
import { PdfViewer }      from './ui/PdfViewer.js';
import { LogModal }       from './ui/LogModal.js';
import { ZoteroPanel }    from './ui/ZoteroPanel.js';
import { QuickOpen }      from './ui/QuickOpen.js';
import { generateBibtex } from './utils/bibtex.js';

// ── i18n: apply locale before any rendering ──────────────────────────────────
setLocale(detectLocale());

// ── Services & State ──────────────────────────────────────────────────────
const store   = new ProjectStore();
const zotero  = new ZoteroService();
const bib     = new BibService();
const compile = new CompileService();
const zip     = new ZipService();
const storage = new StorageService('zotero-latex-autosave', {
  onSave: () => toast.show(t('toast.autosave')),
});

// ── UI Components ─────────────────────────────────────────────────────────
const toast = new Toast(document.getElementById('toast'));

const fileTree = new FileTree({
  listEl:    document.getElementById('file-tree-list'),
  onSelect:  handleFileSelect,
  onDelete:  handleFileDelete,
  onSetRoot: name => { store.setRootFile(name); refreshFileTree(); },
  onNewFile: handleNewFile,
});

const editor = new Editor({
  containerEl:  document.getElementById('editor-container'),
  filenameEl:   document.getElementById('active-filename'),
  onQuickOpen:  () => quickOpen.open(),
  onChange:     content => {
    if (_activeFile) store.setText(_activeFile, content);
    if (_activeFile?.endsWith('.bib')) bib.ingest(_activeFile, content);
    storage.scheduleSave(store);
    if (_autoCompileEnabled && !_activeFile?.endsWith('.bib')) {
      const compileBtn = document.getElementById('btn-compile');
      if (!compileBtn.disabled) {
        clearTimeout(_autoCompileTimer);
        _autoCompileTimer = setTimeout(() => handleCompile(), 2000);
      }
    }
  },
  getCitekeys: () => [...new Set([
    ...zoteroPanel?.getCitekeys() ?? [],
    ...bib.getCitekeys(),
  ])],
});

const pdfViewer = new PdfViewer({
  containerEl: document.getElementById('pdf-container'),
  timestampEl: document.getElementById('compile-timestamp'),
});

const logModal = new LogModal(document.getElementById('log-modal'));

// ── Zotero bib helpers ────────────────────────────────────────────────────

/**
 * Detects the target .bib file for the project.
 * 1. Reads \bibliography{} from root file
 * 2. Falls back to the single .bib in the project
 * 3. Falls back to creating zotero-refs.bib
 * @param {ProjectStore} store
 * @returns {{ bibName: string, created: boolean }}
 */
function findTargetBib(store) {
  const rootContent = store.get(store.rootFile)?.content ?? '';
  const match = rootContent.match(/\\bibliography\{([^}]+)\}/);
  if (match) {
    const bibName = match[1].trim() + '.bib';
    const existed = !!store.get(bibName);
    if (!existed) store.setText(bibName, '');
    return { bibName, created: !existed };
  }

  const bibFiles = store.entries().filter(([name]) => name.endsWith('.bib'));
  if (bibFiles.length === 1) return { bibName: bibFiles[0][0], created: false };

  const newName = 'zotero-refs.bib';
  if (!store.get(newName)) store.setText(newName, '');
  return { bibName: newName, created: true };
}

/**
 * Appends a BibTeX entry to the target .bib file if not already present.
 * @param {ProjectStore} store
 * @param {string} bibName
 * @param {Object} ref
 * @returns {'written' | 'duplicate'}
 */
function appendToBib(store, bibName, ref) {
  const file = store.get(bibName);
  const content = file?.content ?? '';
  if (new RegExp(`@\\w+\\{${ref.key}[,\\s]`).test(content)) return 'duplicate';
  const entry = generateBibtex(ref);
  store.setText(bibName, content ? content + '\n\n' + entry : entry);
  return 'written';
}

const zoteroPanel = new ZoteroPanel({
  panelEl:      document.getElementById('zotero-panel'),
  toggleEl:     document.getElementById('zotero-toggle'),
  toggleIconEl: document.getElementById('zotero-toggle-icon'),
  dotEl:        document.getElementById('status-dot'),
  statusEl:     document.getElementById('status-text'),
  connectBtnEl: document.getElementById('connect-btn'),
  searchEl:     document.getElementById('search-input'),
  listEl:       document.getElementById('ref-list'),
  onConnect:    handleZoteroConnect,
  onInsert:     (key, ref) => {
    editor.insertAtCursor(`\\cite{${key}}`);
    const { bibName, created } = findTargetBib(store);
    if (ref) {
      const result = appendToBib(store, bibName, ref);
      if (created) {
        refreshFileTree();
        toast.show(t('toast.cite.created', { key, bib: bibName }));
      } else if (result === 'duplicate') {
        toast.show(t('toast.cite.duplicate', { key }));
      } else {
        toast.show(t('toast.cite.updated', { key, bib: bibName }));
      }
    } else {
      toast.show(t('toast.cite.inserted', { key }));
    }
  },
});

const quickOpen = new QuickOpen({
  overlayEl: document.getElementById('quick-open-overlay'),
  inputEl:   document.getElementById('quick-open-input'),
  listEl:    document.getElementById('quick-open-list'),
  getFiles:  () => store.entries().filter(([, f]) => !f.binary),
  openFile:  (name, line) => {
    openFile(name);
    if (line != null) editor.goToLine(line);
  },
});

// ── Active file tracking ──────────────────────────────────────────────────
let _activeFile = null;

// ── Auto-compile state ────────────────────────────────────────────────────
let _autoCompileEnabled = localStorage.getItem('auto-compile') === 'true';
let _autoCompileTimer   = null;

function _updateAutoCompileBtn() {
  const btn = document.getElementById('btn-auto-compile');
  btn.classList.toggle('btn--active', _autoCompileEnabled);
}
_updateAutoCompileBtn();

// ── Toolbar wiring ────────────────────────────────────────────────────────
document.getElementById('btn-compile')
  .addEventListener('click', handleCompile);

document.getElementById('btn-auto-compile')
  .addEventListener('click', () => {
    _autoCompileEnabled = !_autoCompileEnabled;
    localStorage.setItem('auto-compile', _autoCompileEnabled);
    _updateAutoCompileBtn();
  });

document.addEventListener('keydown', e => {
  if (e.key === 'p' && e.ctrlKey && !e.shiftKey && !e.altKey) {
    e.preventDefault();
    quickOpen.open();
  }
});

document.getElementById('btn-save')
  .addEventListener('click', () => zip.exportZip(store));

document.getElementById('btn-log')
  .addEventListener('click', () => logModal.open(logModal._lastLog || ''));

document.getElementById('btn-new-file')
  .addEventListener('click', () => fileTree.showNewFileInput());

document.getElementById('btn-import')
  .addEventListener('click', () => document.getElementById('input-import').click());

const localeSelect = document.getElementById('locale-select');
localeSelect.value = detectLocale();
localeSelect.addEventListener('change', () => setLocale(localeSelect.value));

document.getElementById('input-import')
  .addEventListener('change', async e => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      await zip.importZip(file, store);
      ingestBibFiles();
      refreshFileTree();
      openFile(store.rootFile);
      document.getElementById('project-name').textContent = store.name;
      toast.show(t('toast.import.success', { count: store.files.size }));
    } catch (err) {
      toast.show(t('toast.import.error', { msg: err.message }));
    }
    e.target.value = '';
  });

// ── Restore modal ─────────────────────────────────────────────────────────
document.getElementById('btn-restore')
  .addEventListener('click', () => {
    const saved = storage.load();
    if (saved) {
      store.fromJSON(saved.data);
      ingestBibFiles();
      refreshFileTree();
      openFile(store.rootFile);
      document.getElementById('project-name').textContent = store.name;
      toast.show(t('toast.session.restored'));
    }
    document.getElementById('restore-modal').close();
  });

document.getElementById('btn-discard')
  .addEventListener('click', () => {
    storage.clear();
    document.getElementById('restore-modal').close();
  });

// ── Handlers ──────────────────────────────────────────────────────────────
function handleFileSelect(name) {
  // Save current editor content before switching
  if (_activeFile) {
    store.setText(_activeFile, editor.getContent());
  }
  openFile(name);
}

function handleFileDelete(name) {
  if (name.endsWith('.bib')) bib.remove(name);
  store.delete(name);
  if (_activeFile === name) {
    const first = store.entries()[0]?.[0] ?? null;
    if (first) openFile(first); else _activeFile = null;
  }
  refreshFileTree();
}

function handleNewFile(name) {
  store.setText(name, '');
  refreshFileTree();
  openFile(name);
}

async function handleCompile() {
  if (store.isEmpty()) { toast.show(t('toast.compile.empty')); return; }

  // Save current editor content
  if (_activeFile) store.setText(_activeFile, editor.getContent());

  const btn = document.getElementById('btn-compile');
  const statusEl = document.getElementById('compile-status');
  const engine = document.getElementById('engine-select').value;
  btn.disabled = true;
  statusEl.innerHTML = '<span class="spinner"></span>';

  try {
    const result = await compile.compile(store, { engine });
    logModal.setLog(result.log ?? '');

    if (result.success) {
      pdfViewer.show(result.pdf);
      toast.show(t('toast.compile.success'));
    } else {
      logModal.open(result.log, true);
      toast.show(t('toast.compile.error'));
    }
  } catch (err) {
    toast.show(t('toast.compile.fail', { msg: err.message }));
  } finally {
    btn.disabled = false;
    statusEl.innerHTML = '';
  }
}

async function handleZoteroConnect() {
  zoteroPanel.setStatus('connecting');
  try {
    const { refs, source } = await zotero.fetchAll();
    if (source === 'mock') {
      zoteroPanel.setStatus('offline');
      zoteroPanel.setRefs(refs);
      toast.show(t('toast.zotero.offline'));
    } else {
      zoteroPanel.setCount(refs.length);
      zoteroPanel.setRefs(refs);
    }
  } catch {
    zoteroPanel.setStatus('offline');
    zoteroPanel.showEmpty(t('toast.zotero.error'));
    toast.show(t('toast.zotero.error'));
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────
function ingestBibFiles() {
  for (const [name, file] of store.entries()) {
    if (name.endsWith('.bib') && !file.binary) {
      bib.ingest(name, file.content ?? '');
    }
  }
}

function openFile(name) {
  const file = store.get(name);
  if (!file || file.binary) return;
  _activeFile = name;
  editor.open(name, file.content ?? '');
  refreshFileTree();
}

function refreshFileTree() {
  const names = store.entries().map(([n]) => n).sort();
  fileTree.render(names, _activeFile, store.rootFile);
}

// ── Init: check for saved session ─────────────────────────────────────────
(function init() {
  // Keep project-name translated when no project is loaded
  const projectNameEl = document.getElementById('project-name');
  if (store.isEmpty()) projectNameEl.textContent = t('project.noName');
  window.addEventListener('localechange', () => {
    if (store.isEmpty()) projectNameEl.textContent = t('project.noName');
  });

  const saved = storage.load();
  if (saved) {
    const d = new Date(saved.savedAt);
    const fmt = `${d.toLocaleDateString()} ${d.getHours()}:${String(d.getMinutes()).padStart(2,'0')}`;
    document.getElementById('restore-date').textContent = fmt;
    document.getElementById('restore-modal').showModal();
  }
})();
