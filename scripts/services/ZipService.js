import JSZip from '../vendor/jszip.js';

/**
 * Returns the common root folder prefix to strip, or '' if none.
 * A common root exists only when every path starts with the same first segment.
 * @param {string[]} paths
 * @returns {string}
 */
function _detectRootFolder(paths) {
  if (paths.length === 0) return '';
  const firstSlash = paths[0].indexOf('/');
  if (firstSlash === -1) return '';
  const candidate = paths[0].slice(0, firstSlash + 1); // e.g. "project/"
  return paths.every(p => p.startsWith(candidate)) ? candidate : '';
}

const TEXT_EXTENSIONS = new Set([
  '.tex', '.bib', '.sty', '.cls', '.bst', '.txt', '.md',
  '.cfg', '.def', '.lco', '.ist', '.mst',
]);

function isText(name) {
  const ext = name.slice(name.lastIndexOf('.')).toLowerCase();
  return TEXT_EXTENSIONS.has(ext);
}

export class ZipService {
  /**
   * Reads a .zip File and populates the ProjectStore.
   * @param {File} file
   * @param {import('../store/ProjectStore.js').ProjectStore} store
   */
  async importZip(file, store) {
    const zip = await JSZip.loadAsync(file);
    store.name = file.name.replace(/\.zip$/i, '');

    // Collect file entries (skip directories)
    const entries = [];
    zip.forEach((relativePath, zipEntry) => {
      if (!zipEntry.dir) entries.push({ relativePath, zipEntry });
    });

    // Only strip a common root folder if ALL files share the exact same one.
    // e.g. "project/main.tex" + "project/Fonts/Asap.ttf" → strip "project/"
    // But "main.tex" + "Fonts/Asap.ttf" → keep paths as-is.
    const rootFolder = _detectRootFolder(entries.map(e => e.relativePath));

    const tasks = entries.map(({ relativePath, zipEntry }) => {
      const name = rootFolder ? relativePath.slice(rootFolder.length) : relativePath;
      if (!name) return Promise.resolve();

      return isText(name)
        ? zipEntry.async('string').then(content => store.setText(name, content))
        : zipEntry.async('base64').then(b64 => store.setBinary(name, b64));
    });

    await Promise.all(tasks);

    // Set root file
    if (store.files.has('main.tex')) {
      store.setRootFile('main.tex');
    } else {
      const firstTex = [...store.files.keys()].find(n => n.endsWith('.tex'));
      if (firstTex) store.setRootFile(firstTex);
    }
  }

  /**
   * Exports the ProjectStore as a downloadable .zip.
   * @param {import('../store/ProjectStore.js').ProjectStore} store
   */
  async exportZip(store) {
    const zip = new JSZip();

    for (const [name, file] of store.entries()) {
      if (file.binary) {
        zip.file(name, file.base64, { base64: true });
      } else {
        zip.file(name, file.content ?? '');
      }
    }

    const blob = await zip.generateAsync({ type: 'blob' });
    const url  = URL.createObjectURL(blob);
    const a    = Object.assign(document.createElement('a'), {
      href: url,
      download: `${store.name}.zip`,
    });
    a.click();
    URL.revokeObjectURL(url);
  }
}
