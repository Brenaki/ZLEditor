const VISIBLE_CLASS = 'toast--visible';
const DURATION_MS = 2200;

export class Toast {
  /** @param {HTMLElement} el */
  constructor(el) {
    this.el = el;
    this._timer = null;
  }

  /** @param {string} message */
  show(message) {
    this.el.textContent = message;
    this.el.classList.add(VISIBLE_CLASS);
    clearTimeout(this._timer);
    this._timer = setTimeout(() => this.el.classList.remove(VISIBLE_CLASS), DURATION_MS);
  }
}
