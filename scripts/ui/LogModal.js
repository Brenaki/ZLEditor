import { t } from '../i18n/index.js';

/**
 * Modal dialog that displays the LaTeX compilation log.
 * Uses the native <dialog> element.
 */
export class LogModal {
  /**
   * @param {HTMLDialogElement} dialogEl
   * @param {{ onExplain?: (log: string) => void }} [opts]
   */
  constructor(dialogEl, { onExplain } = {}) {
    this._dialog    = dialogEl;
    this._logEl     = dialogEl.querySelector('#log-output');
    this._explainBtn = dialogEl.querySelector('#btn-explain-log');
    this._lastLog   = '';
    this._isError   = false;
    this._hasAi     = false;

    dialogEl.querySelector('#btn-close-log')
      .addEventListener('click', () => this.close());

    dialogEl.querySelector('#btn-copy-log')
      .addEventListener('click', () => {
        navigator.clipboard.writeText(this._lastLog)
          .then(() => { /* toast handled externally */ });
      });

    if (this._explainBtn && onExplain) {
      this._explainBtn.addEventListener('click', () => {
        this.close();
        onExplain(this._lastLog);
      });
    }

    // Close on backdrop click
    dialogEl.addEventListener('click', e => {
      if (e.target === dialogEl) this.close();
    });

    window.addEventListener('localechange', () => {
      if (this._dialog.open) {
        this._dialog.querySelector('.modal__title').textContent =
          t(this._isError ? 'log.title.error' : 'log.title.normal');
      }
    });
  }

  /** Set whether an AI provider is currently configured. */
  setAiAvailable(hasAi) {
    this._hasAi = hasAi;
    this._updateExplainBtn();
  }

  _updateExplainBtn() {
    if (this._explainBtn) {
      this._explainBtn.style.display =
        this._isError && this._hasAi ? '' : 'none';
    }
  }

  /**
   * Opens the modal and displays the log.
   * @param {string} log
   * @param {boolean} [isError=false]
   */
  open(log = '', isError = false) {
    this._lastLog = log;
    this._isError = isError;
    this._logEl.textContent = log || t('log.empty');
    this._dialog.querySelector('.modal__title').textContent =
      t(isError ? 'log.title.error' : 'log.title.normal');
    this._updateExplainBtn();
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
