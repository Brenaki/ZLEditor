/**
 * Generates a citation key from a CSL-JSON item.
 * Pattern: lowercased-family-name + year (e.g. huang2023)
 * Deduplication is handled by the caller.
 * @param {Object} item - CSL-JSON item
 * @returns {string}
 */
export function makeCiteKey(item) {
  const family = item.author?.[0]?.family ?? 'unknown';
  const year = item.issued?.['date-parts']?.[0]?.[0] ?? '';
  const slug = family.toLowerCase().replace(/[^a-z0-9]/g, '');
  return slug + year;
}

/**
 * Generates a BibTeX entry string from a ref object.
 * @param {{ key: string, type: string, title: string, author: string,
 *           year: string, publisher: string, journal: string, edition?: string }} ref
 * @returns {string}
 */
export function generateBibtex(ref) {
  const lines = [`@${ref.type}{${ref.key},`];
  if (ref.title)     lines.push(`  title     = {${ref.title}},`);
  if (ref.author)    lines.push(`  author    = {${ref.author}},`);
  if (ref.year)      lines.push(`  year      = {${ref.year}},`);
  if (ref.publisher) lines.push(`  publisher = {${ref.publisher}},`);
  if (ref.edition)   lines.push(`  edition   = {${ref.edition}},`);
  if (ref.journal)   lines.push(`  journal   = {${ref.journal}},`);
  lines.push(`}`);
  return lines.join('\n');
}

/**
 * Escapes HTML special characters.
 * @param {string} s
 * @returns {string}
 */
export function escapeHtml(s) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}
