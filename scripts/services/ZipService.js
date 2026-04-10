import JSZip from 'https://esm.sh/jszip@3';

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

    const tasks = [];

    zip.forEach((relativePath, zipEntry) => {
      if (zipEntry.dir) return;
      // Strip leading directory if zip wraps everything in one folder
      const name = relativePath.includes('/')
        ? relativePath.slice(relativePath.indexOf('/') + 1) || relativePath
        : relativePath;
      if (!name) return;

      tasks.push(
        isText(name)
          ? zipEntry.async('string').then(content => store.setText(name, content))
          : zipEntry.async('base64').then(b64 => store.setBinary(name, b64))
      );
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
