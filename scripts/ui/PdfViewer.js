import { t } from '../i18n/index.js';

/**
 * Displays a compiled PDF via blob URL inside an <embed> element.
 */
export class PdfViewer {
  /**
   * @param {{
   *   containerEl: HTMLElement,
   *   timestampEl: HTMLElement,
   * }} opts
   */
  constructor({ containerEl, timestampEl }) {
    this._container  = containerEl;
    this._timestamp  = timestampEl;
    this._blobUrl    = null;
  }

  /**
   * Renders a PDF from an ArrayBuffer.
   * @param {ArrayBuffer} buffer
   */
  show(buffer) {
    if (this._blobUrl) URL.revokeObjectURL(this._blobUrl);

    this._blobUrl = URL.createObjectURL(
      new Blob([buffer], { type: 'application/pdf' })
    );

    this._container.innerHTML = `<embed src="${this._blobUrl}" type="application/pdf">`;

    const now  = new Date();
    const time = `${now.getHours().toString().padStart(2,'0')}:${now.getMinutes().toString().padStart(2,'0')}`;
    this._timestamp.textContent = t('pdf.compiled.at', { time });
  }

  showEmpty() {
    if (this._blobUrl) { URL.revokeObjectURL(this._blobUrl); this._blobUrl = null; }
    this._container.innerHTML = `<div class="empty-state" data-i18n-html="pdf.empty">${t('pdf.empty')}</div>`;
    this._timestamp.textContent = '';
  }
}
