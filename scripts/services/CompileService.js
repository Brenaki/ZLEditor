export class CompileService {
  /**
   * Sends project files to POST /compile and returns the result.
   * @param {import('../store/ProjectStore.js').ProjectStore} store
   * @returns {Promise<{ success: boolean, pdf?: ArrayBuffer, log?: string }>}
   */
  async compile(store) {
    const payload = {
      files:    store.toCompilePayload(),
      rootFile: store.rootFile,
    };

    const resp = await fetch('/compile', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(payload),
    });

    if (resp.ok && resp.headers.get('Content-Type')?.includes('application/pdf')) {
      const pdf = await resp.arrayBuffer();
      const log = await this._fetchLog();
      return { success: true, pdf, log };
    }

    const data = await resp.json().catch(() => ({ log: `HTTP ${resp.status}` }));
    return { success: false, log: data.log ?? 'Erro desconhecido' };
  }

  async _fetchLog() {
    try {
      const r = await fetch('/compile/log');
      const d = await r.json();
      return d.log ?? '';
    } catch {
      return '';
    }
  }
}
