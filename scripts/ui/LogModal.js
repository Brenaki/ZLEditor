/**
 * Modal dialog that displays the LaTeX compilation log.
 * Uses the native <dialog> element.
 */
export class LogModal {
  /** @param {HTMLDialogElement} dialogEl */
  constructor(dialogEl) {
    this._dialog  = dialogEl;
    this._logEl   = dialogEl.querySelector('#log-output');
    this._lastLog = '';

    dialogEl.querySelector('#btn-close-log')
      .addEventListener('click', () => this.close());

    dialogEl.querySelector('#btn-copy-log')
      .addEventListener('click', () => {
        navigator.clipboard.writeText(this._lastLog)
          .then(() => { /* toast handled externally */ });
      });

    // Close on backdrop click
    dialogEl.addEventListener('click', e => {
      if (e.target === dialogEl) this.close();
    });
  }

  /**
   * Opens the modal and displays the log.
   * @param {string} log
   * @param {boolean} [isError=false]
   */
  open(log = '', isError = false) {
    this._lastLog = log;
    this._logEl.textContent = log || '(sem log disponível)';
    this._dialog.querySelector('.modal__title').textContent =
      isError ? '⚠ Erro de compilação' : 'Log de compilação';
    this._dialog.showModal();
  }

  close() {
    this._dialog.close();
  }

  /** Sets the last log without opening. */
  setLog(log) {
    this._lastLog = log;
  }
}
