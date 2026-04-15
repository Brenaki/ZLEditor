export class CompileService {
  /**
   * Sends project files to POST /compile and returns the result.
   * @param {import('../store/ProjectStore.js').ProjectStore} store
   * @param {{ engine?: 'pdflatex'|'xelatex'|'lualatex' }} [opts]
   * @returns {Promise<{ success: boolean, pdf?: ArrayBuffer, log?: string }>}
   */
  async compile(store, { engine = 'pdflatex' } = {}) {
    const payload = {
      files:    store.toCompilePayload(),
      rootFile: store.rootFile,
      engine,
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
    return { success: false, log: this._formatErrorLog(data, resp.status) };
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

  _formatErrorLog(data, status) {
    if (data?.log) return data.log;

    if (Array.isArray(data?.detail) && data.detail.length) {
      const lines = data.detail.map(item => {
        const loc = Array.isArray(item.loc) ? item.loc.join('.') : 'request';
        return `${loc}: ${item.msg}`;
      });
      return [`Falha de validação da requisição de compilação (HTTP ${status}).`, ...lines].join('\n');
    }

    if (typeof data?.detail === 'string' && data.detail.trim()) {
      return data.detail;
    }

    return `Erro HTTP ${status}`;
  }
}
