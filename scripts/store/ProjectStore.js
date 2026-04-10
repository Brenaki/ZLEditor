/**
 * In-memory store for all project files.
 * Files are stored as { content: string } for text
 * or { binary: true, base64: string } for binary assets.
 */
export class ProjectStore {
  constructor() {
    /** @type {Map<string, {content?: string, binary?: boolean, base64?: string}>} */
    this.files    = new Map();
    this.rootFile = 'main.tex';
    this.name     = 'projeto';
    this._onChange = null;
  }

  /** @param {(store: ProjectStore) => void} fn */
  setOnChange(fn) { this._onChange = fn; }

  /** Add or update a text file. */
  setText(name, content) {
    this.files.set(name, { content });
    this._notify();
  }

  /** Add or update a binary file. */
  setBinary(name, base64) {
    this.files.set(name, { binary: true, base64 });
    this._notify();
  }

  /** @param {string} name */
  get(name) { return this.files.get(name) ?? null; }

  /** @param {string} name */
  delete(name) {
    this.files.delete(name);
    if (this.rootFile === name) {
      this.rootFile = this._firstTex() ?? 'main.tex';
    }
    this._notify();
  }

  /** @returns {[string, object][]} */
  entries() { return [...this.files.entries()]; }

  isEmpty() { return this.files.size === 0; }

  /** @param {string} name */
  setRootFile(name) {
    this.rootFile = name;
    this._notify();
  }

  /** Serialize to plain object for JSON storage. */
  toJSON() {
    const files = {};
    for (const [name, file] of this.files) {
      files[name] = file;
    }
    return { files, rootFile: this.rootFile, name: this.name };
  }

  /** Restore from serialized object. */
  fromJSON(data) {
    this.files    = new Map(Object.entries(data.files ?? {}));
    this.rootFile = data.rootFile ?? 'main.tex';
    this.name     = data.name ?? 'projeto';
  }

  /** Build the payload array for POST /compile. */
  toCompilePayload() {
    return this.entries().map(([name, file]) =>
      file.binary
        ? { name, binary: true, base64: file.base64 }
        : { name, content: file.content ?? '' }
    );
  }

  _firstTex() {
    for (const [name] of this.files) {
      if (name.endsWith('.tex')) return name;
    }
    return null;
  }

  _notify() { this._onChange?.(this); }
}
