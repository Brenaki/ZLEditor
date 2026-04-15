/**
 * Retractable AI chat panel in the left sidebar.
 * Stacked below the Zotero panel, follows the same toggle pattern.
 */
export class AiPanel {
  /**
   * @param {{
   *   panelEl: HTMLElement,
   *   toggleEl: HTMLButtonElement,
   *   toggleIconEl: HTMLElement,
   *   settingsBtnEl: HTMLButtonElement,
   *   historyEl: HTMLElement,
   *   inputEl: HTMLTextAreaElement,
   *   sendBtnEl: HTMLButtonElement,
   *   onOpenSettings: () => void,
   *   getContext: () => { currentFile?: {name:string,content:string}, files?: Array },
   * }} opts
   */
  constructor({ panelEl, toggleEl, toggleIconEl, settingsBtnEl,
                historyEl, inputEl, sendBtnEl, onOpenSettings, getContext }) {
    this._panel       = panelEl;
    this._historyEl   = historyEl;
    this._inputEl     = inputEl;
    this._sendBtnEl   = sendBtnEl;
    this._onOpenSettings = onOpenSettings;
    this._getContext  = getContext;
    this._isOpen      = false;
    this._isStreaming = false;

    toggleEl.addEventListener('click', () => this.toggle());
    settingsBtnEl.addEventListener('click', (e) => {
      e.stopPropagation();
      this._onOpenSettings();
    });
    sendBtnEl.addEventListener('click', () => this._handleSend());
    inputEl.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        this._handleSend();
      }
    });
  }

  toggle() {
    this._isOpen = !this._isOpen;
    this._panel.classList.toggle('ai-panel--open', this._isOpen);
    if (this._isOpen) {
      this._inputEl.focus();
    }
  }

  open() {
    if (!this._isOpen) this.toggle();
  }

  /**
   * Send a message programmatically (e.g., from the "Explain" button).
   * @param {{ mode?: string, compilationLog?: string, userMessage?: string }} opts
   */
  async sendMessage({ mode = 'chat', compilationLog = null, userMessage = null } = {}) {
    this.open();

    const msg = userMessage || (compilationLog
      ? 'Por favor, explique este erro de compilação e sugira uma correção.'
      : '');

    if (msg) {
      this._inputEl.value = msg;
    }

    await this._handleSend({ mode, compilationLog });
  }

  async _handleSend({ mode = 'chat', compilationLog = null } = {}) {
    const text = this._inputEl.value.trim();
    if (!text || this._isStreaming) return;

    this._inputEl.value = '';
    this._setStreaming(true);

    // Append user bubble
    this._appendBubble(text, 'user');

    // Build request
    const context = this._getContext ? this._getContext() : {};
    const body = {
      messages: [{ role: 'user', content: text }],
      projectId: context.projectId || 'default',
      mode,
    };
    if (compilationLog) body.compilationLog = compilationLog;
    if (context.currentFile) body.currentFile = context.currentFile;
    if (context.files) body.files = context.files;

    // Create assistant bubble for streaming
    const assistantBubble = this._appendBubble('', 'assistant');
    assistantBubble.classList.add('ai-bubble--streaming');

    try {
      const resp = await fetch('/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!resp.ok) {
        const err = await resp.json().catch(() => ({ detail: resp.statusText }));
        assistantBubble.classList.remove('ai-bubble--streaming');
        assistantBubble.classList.add('ai-bubble--error');
        assistantBubble.textContent = err.detail || 'Erro ao conectar ao assistente de IA.';
        return;
      }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop();

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          try {
            const chunk = JSON.parse(line.slice(6));
            if (chunk.error) {
              assistantBubble.classList.remove('ai-bubble--streaming');
              assistantBubble.classList.add('ai-bubble--error');
              assistantBubble.textContent = chunk.error;
              break;
            }
            if (chunk.delta) {
              assistantBubble.textContent += chunk.delta;
              this._scrollToBottom();
            }
            if (chunk.done) {
              assistantBubble.classList.remove('ai-bubble--streaming');
            }
          } catch (_) {
            // ignore parse errors
          }
        }
      }

      assistantBubble.classList.remove('ai-bubble--streaming');

    } catch (err) {
      assistantBubble.classList.remove('ai-bubble--streaming');
      assistantBubble.classList.add('ai-bubble--error');
      assistantBubble.textContent = `Erro: ${err.message}`;
    } finally {
      this._setStreaming(false);
    }
  }

  _appendBubble(text, role) {
    const bubble = document.createElement('div');
    bubble.className = `ai-bubble ai-bubble--${role}`;
    bubble.textContent = text;
    this._historyEl.appendChild(bubble);
    this._scrollToBottom();
    return bubble;
  }

  _scrollToBottom() {
    this._historyEl.scrollTop = this._historyEl.scrollHeight;
  }

  _setStreaming(active) {
    this._isStreaming = active;
    this._inputEl.disabled = active;
    this._sendBtnEl.disabled = active;
  }
}
