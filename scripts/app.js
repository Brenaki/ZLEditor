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
import { AiPanel }        from './ui/AiPanel.js';
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

const logModal = new LogModal(document.getElementById('log-modal'), {
  onExplain: (log) => {
    const active = _aiConfig?.activeProvider;
    const hasKey = active && _aiConfig?.providers?.[active]?.hasKey;
    if (!hasKey) {
      return;
    }
    aiPanel.sendMessage({ mode: 'explain-error', compilationLog: log });
  },
});

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

// ── AI panel ─────────────────────────────────────────────────────────────────
let _aiConfig = null;

async function loadAiConfig() {
  try {
    const resp = await fetch('/ai/config');
    if (resp.ok) {
      _aiConfig = await resp.json();
      const active = _aiConfig.activeProvider;
      const hasKey = active && _aiConfig.providers?.[active]?.hasKey;
      logModal.setAiAvailable(!!hasKey);
    }
  } catch (_) {
    _aiConfig = null;
  }
}

const aiPanel = new AiPanel({
  panelEl:      document.getElementById('ai-panel'),
  toggleEl:     document.getElementById('ai-toggle'),
  toggleIconEl: document.getElementById('ai-toggle-icon'),
  settingsBtnEl: document.getElementById('ai-settings-btn'),
  historyEl:    document.getElementById('ai-chat-history'),
  inputEl:      document.getElementById('ai-chat-input'),
  sendBtnEl:    document.getElementById('ai-send-btn'),
  onOpenSettings: () => openAiConfigModal(),
  getContext: () => {
    const files = store.entries()
      .filter(([, f]) => !f.binary)
      .map(([name, f]) => ({ name, content: f.content ?? '' }));
    const currentFile = _activeFile
      ? { name: _activeFile, content: store.get(_activeFile)?.content ?? '' }
      : null;
    return { projectId: store.name || 'default', files, currentFile };
  },
});

// ── AI config modal ───────────────────────────────────────────────────────────
const aiConfigModal = document.getElementById('ai-config-modal');

function openAiConfigModal() {
  aiConfigModal.showModal();
  _populateAiConfigModal();
}

async function _populateAiConfigModal() {
  try {
    const resp = await fetch('/ai/config');
    if (!resp.ok) return;
    const cfg = await resp.json();
    _aiConfig = cfg;

    // Active provider
    const providerSelect = document.getElementById('ai-provider-select');
    if (providerSelect) providerSelect.value = cfg.activeProvider || '';

    // Context mode
    const modeVal = cfg.contextMode || 'none';
    document.querySelectorAll('input[name="ai-context-mode"]').forEach(radio => {
      radio.checked = radio.value === modeVal;
    });

    // Provider statuses and models
    const providerMap = {
      anthropic: { statusId: 'ai-anthropic-status', modelId: 'ai-anthropic-model' },
      openai:    { statusId: 'ai-openai-status',    modelId: 'ai-openai-model' },
      gemini:    { statusId: 'ai-gemini-status',    modelId: 'ai-gemini-model' },
      ollama:    { statusId: 'ai-ollama-status',    modelId: 'ai-ollama-model' },
      deepseek:  { statusId: 'ai-deepseek-status',  modelId: 'ai-deepseek-model' },
    };

    for (const [name, ids] of Object.entries(providerMap)) {
      const provCfg = cfg.providers?.[name];
      const statusEl = document.getElementById(ids.statusId);
      const modelEl  = document.getElementById(ids.modelId);
      if (statusEl) {
        statusEl.textContent = provCfg?.hasKey ? '● Configurado' : '○ Não configurado';
        statusEl.className = `ai-provider-status ${provCfg?.hasKey
          ? 'ai-provider-status--configured' : 'ai-provider-status--unconfigured'}`;
      }
      if (modelEl && provCfg?.model) modelEl.value = provCfg.model;
    }

    // Ollama base URL
    const ollamaBaseUrlEl = document.getElementById('ai-ollama-baseurl');
    if (ollamaBaseUrlEl && cfg.providers?.ollama?.baseUrl) {
      ollamaBaseUrlEl.value = cfg.providers.ollama.baseUrl;
    }
  } catch (_) {}
}

async function _saveAiProviderKey(provider, field = 'key') {
  const keyInput = field === 'baseUrl'
    ? document.getElementById('ai-ollama-baseurl')
    : document.getElementById(`ai-${provider}-key`);
  const modelInput = document.getElementById(`ai-${provider}-model`);
  if (!keyInput) return;

  const update = { provider };
  if (keyInput.value.trim()) {
    update[field] = keyInput.value.trim();
    keyInput.value = '';
  }
  if (modelInput?.value.trim()) {
    update.model = modelInput.value.trim();
  }

  try {
    const resp = await fetch('/ai/config', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(update),
    });
    if (resp.ok) {
      _aiConfig = await resp.json();
      _populateAiConfigModal();
      toast.show('Configuração salva.');
    }
  } catch (err) {
    toast.show(`Erro: ${err.message}`);
  }
}

document.getElementById('btn-save-ai-config')
  ?.addEventListener('click', async () => {
    const providerSelect = document.getElementById('ai-provider-select');
    const contextMode = document.querySelector('input[name="ai-context-mode"]:checked')?.value;

    const update = {};
    if (providerSelect) update.activeProvider = providerSelect.value;
    if (contextMode) update.contextMode = contextMode;

    try {
      const resp = await fetch('/ai/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(update),
      });
      if (resp.ok) {
        _aiConfig = await resp.json();
        const active = _aiConfig.activeProvider;
        const hasKey = active && _aiConfig.providers?.[active]?.hasKey;
        logModal.setAiAvailable(!!hasKey);
        toast.show('Configuração salva.');
      }
    } catch (err) {
      toast.show(`Erro: ${err.message}`);
    }
  });

document.getElementById('btn-close-ai-config')
  ?.addEventListener('click', () => aiConfigModal.close());

aiConfigModal?.addEventListener('click', e => {
  if (e.target === aiConfigModal) aiConfigModal.close();
});

// Wire per-provider save buttons
document.querySelectorAll('[data-provider]').forEach(btn => {
  btn.addEventListener('click', () => {
    const provider = btn.dataset.provider;
    const field = btn.dataset.field || 'key';
    _saveAiProviderKey(provider, field);
  });
});

// Load AI config on start
loadAiConfig();

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
    if (source === 'offline') {
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
