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
    this._summaryEl = dialogEl.querySelector('#log-summary');
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
        this._renderSummary();
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
      this._explainBtn.title = 'Interpretar log com IA';
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
    this._renderSummary();
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

  _renderSummary() {
    if (!this._summaryEl) return;

    const summary = this._summarize(this._lastLog, this._isError);
    if (!summary) {
      this._summaryEl.hidden = true;
      this._summaryEl.textContent = '';
      this._summaryEl.classList.toggle('log-summary--error', this._isError);
      return;
    }

    this._summaryEl.hidden = false;
    this._summaryEl.textContent = summary;
    this._summaryEl.classList.toggle('log-summary--error', this._isError);
  }

  _summarize(log, isError) {
    if (!log?.trim()) return '';

    const lines = log
      .split('\n')
      .map(line => line.trim())
      .filter(Boolean);

    const warningCount = new Set(
      lines.filter(line =>
        line.startsWith('LaTeX Warning:')
        || line.startsWith('Package ')
        || line.startsWith('Warning--')
      ),
    ).size;

    const overfullCount = new Set(
      lines.filter(line => line.startsWith('Overfull \\hbox')),
    ).size;

    const underfullCount = new Set(
      lines.filter(line => line.startsWith('Underfull \\hbox')),
    ).size;

    const issues = [];
    if (warningCount > 0) {
      issues.push(t(
        warningCount === 1 ? 'log.metric.warnings.one' : 'log.metric.warnings.other',
        { count: warningCount },
      ));
    }
    if (overfullCount > 0) {
      issues.push(t(
        overfullCount === 1 ? 'log.metric.overfull.one' : 'log.metric.overfull.other',
        { count: overfullCount },
      ));
    }
    if (underfullCount > 0) {
      issues.push(t(
        underfullCount === 1 ? 'log.metric.underfull.one' : 'log.metric.underfull.other',
        { count: underfullCount },
      ));
    }

    if (issues.length === 0) {
      return t(isError ? 'log.summary.error.plain' : 'log.summary.success.clean');
    }

    return t(
      isError ? 'log.summary.error.issues' : 'log.summary.success.issues',
      { issues: issues.join(', ') },
    );
  }
}
