import { makeCiteKey } from '../utils/bibtex.js';

const BBT_PROXY = '/bbt-proxy';

/**
 * Communicates with Zotero via Better BibTeX JSON-RPC proxy.
 */
export class ZoteroService {
  /**
   * Fetches all items from the Zotero library.
   * Returns an empty list if Zotero is unreachable or has no results.
   * @returns {Promise<{ refs: Array, source: 'zotero' | 'offline' }>}
   */
  async fetchAll() {
    let response;
    try {
      response = await fetch(BBT_PROXY, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jsonrpc: '2.0', method: 'item.search', params: [' '], id: 1 }),
      });
    } catch {
      return { refs: [], source: 'offline' };
    }

    if (!response.ok) {
      return { refs: [], source: 'offline' };
    }

    const data = await response.json();
    const items = data.result ?? [];

    if (items.length === 0) {
      return { refs: [], source: 'offline' };
    }

    return { refs: this.#mapItems(items), source: 'zotero' };
  }

  /**
   * Maps CSL-JSON items from BBT to ref objects, deduplicating citekeys.
   * @param {Array} items
   * @returns {Array}
   */
  #mapItems(items) {
    const keyCounts = {};

    return items.map((item) => {
      const year = String(item.issued?.['date-parts']?.[0]?.[0] ?? '');
      const baseKey = item.citekey || makeCiteKey(item);

      keyCounts[baseKey] = (keyCounts[baseKey] ?? 0) + 1;
      const key = keyCounts[baseKey] > 1
        ? baseKey + String.fromCharCode(96 + keyCounts[baseKey])
        : baseKey;

      return {
        key,
        type:      item.type      ?? 'article',
        title:     item.title     ?? '(sem título)',
        author:    (item.author ?? [])
          .map(a => `${a.family ?? ''}, ${a.given ?? ''}`.trim())
          .join(' and '),
        year,
        publisher: item.publisher ?? '',
        journal:   item['container-title'] ?? '',
      };
    });
  }
}
