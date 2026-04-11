/**
 * Parses and caches citekeys from .bib files in the project.
 *
 * Supports multiple files: each filename has its own citekey list.
 * getCitekeys() returns a flat deduplicated array across all files.
 */
export class BibService {
  /** @type {Map<string, string[]>} */
  #cache = new Map();

  /**
   * Parses citekeys from a .bib file content and stores them.
   * Replaces any previously stored citekeys for this filename.
   * @param {string} filename
   * @param {string} text
   */
  ingest(filename, text) {
    const keys = [];
    const re = /@\w+\{([^,\s]+)/g;
    let match;
    while ((match = re.exec(text)) !== null) {
      keys.push(match[1]);
    }
    this.#cache.set(filename, keys);
  }

  /**
   * Removes the citekeys associated with a deleted file.
   * @param {string} filename
   */
  remove(filename) {
    this.#cache.delete(filename);
  }

  /**
   * Returns a deduplicated flat array of all citekeys across all ingested files.
   * @returns {string[]}
   */
  getCitekeys() {
    const all = [];
    for (const keys of this.#cache.values()) {
      all.push(...keys);
    }
    return [...new Set(all)];
  }
}
