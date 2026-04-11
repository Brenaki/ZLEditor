const DEBOUNCE_MS = 2000;

export class StorageService {
  /**
   * @param {string} key - localStorage key
   * @param {{ onSave?: () => void }} [opts]
   */
  constructor(key, { onSave } = {}) {
    this._key    = key;
    this._timer  = null;
    this._onSave = onSave ?? null;
  }

  /** Save store to localStorage (debounced). */
  scheduleSave(store) {
    clearTimeout(this._timer);
    this._timer = setTimeout(() => this._save(store), DEBOUNCE_MS);
  }

  /** @returns {{ data: object, savedAt: number } | null} */
  load() {
    try {
      const raw = localStorage.getItem(this._key);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  clear() {
    localStorage.removeItem(this._key);
  }

  _save(store) {
    try {
      localStorage.setItem(this._key, JSON.stringify({
        data:    store.toJSON(),
        savedAt: Date.now(),
      }));
      this._onSave?.();
    } catch {
      // localStorage full or unavailable — silently ignore
    }
  }
}
