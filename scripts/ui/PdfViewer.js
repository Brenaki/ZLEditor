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

    const now = new Date();
    this._timestamp.textContent =
      `Compilado às ${now.getHours().toString().padStart(2,'0')}:${now.getMinutes().toString().padStart(2,'0')}`;
  }

  showEmpty() {
    if (this._blobUrl) { URL.revokeObjectURL(this._blobUrl); this._blobUrl = null; }
    this._container.innerHTML = '<div class="empty-state">Clique em <strong>▶ Compilar</strong> para ver o PDF</div>';
    this._timestamp.textContent = '';
  }
}
