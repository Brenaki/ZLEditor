import { makeCiteKey } from '../utils/bibtex.js';

const BBT_PROXY = '/bbt-proxy';

const MOCK_REFS = [
  { key: 'bussab2017estatistica', type: 'book', title: 'Estatística Básica', author: 'Bussab, Wilton O. and Morettin, Pedro A.', year: '2017', publisher: 'Saraiva', edition: '9', journal: '' },
  { key: 'knuth1984texbook',      type: 'book', title: 'The TeXbook',          author: 'Knuth, Donald E.',                          year: '1984', publisher: 'Addison-Wesley',  journal: '' },
  { key: 'lamport1994latex',      type: 'book', title: 'LaTeX: A Document Preparation System', author: 'Lamport, Leslie',           year: '1994', publisher: 'Addison-Wesley',  journal: '' },
  { key: 'cormen2009algorithms',  type: 'book', title: 'Introduction to Algorithms',           author: 'Cormen, Thomas H. and Leiserson, Charles E.', year: '2009', publisher: 'MIT Press', journal: '' },
];

/**
 * Communicates with Zotero via Better BibTeX JSON-RPC proxy.
 */
export class ZoteroService {
  /**
   * Fetches all items from the Zotero library.
   * Returns mock data if Zotero is unreachable.
   * @returns {Promise<{ refs: Array, source: 'zotero' | 'mock' }>}
   */
  async fetchAll() {
    const response = await fetch(BBT_PROXY, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jsonrpc: '2.0', method: 'item.search', params: [' '], id: 1 }),
    });

    const data = await response.json();
    const items = data.result ?? [];

    if (items.length === 0) {
      return { refs: MOCK_REFS, source: 'mock' };
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
