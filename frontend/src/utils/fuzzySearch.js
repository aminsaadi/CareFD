/**
 * Hebrew-aware fuzzy search utility.
 * Handles common Hebrew typos and character substitutions.
 */

// Common Hebrew character confusions / substitutions
const HEBREW_SUBSTITUTIONS = [
  ['ו', 'וו'],      // single vav vs double vav
  ['י', 'יי'],      // single yod vs double yod
  ['כ', 'ח'],       // kaf vs chet
  ['ת', 'ט'],       // tav vs tet
  ['ש', 'ס'],       // shin vs samech
  ['ב', 'ו'],       // bet vs vav (in some pronunciations)
  ['א', 'ע'],       // alef vs ayin
  ['ק', 'כ'],       // qof vs kaf
  ['צ', 'ץ'],       // tsadi vs final tsadi
  ['מ', 'ם'],       // mem vs final mem
  ['נ', 'ן'],       // nun vs final nun
  ['פ', 'ף'],       // pe vs final pe
  ['כ', 'ך'],       // kaf vs final kaf
];

/**
 * Normalize a Hebrew string for fuzzy matching.
 * Replaces final-form letters with normal forms and removes niqqud.
 */
function normalizeHebrew(str) {
  if (!str) return '';
  return str
    .replace(/ם/g, 'מ')
    .replace(/ן/g, 'נ')
    .replace(/ף/g, 'פ')
    .replace(/ך/g, 'כ')
    .replace(/ץ/g, 'צ')
    .replace(/[\u0591-\u05C7]/g, '') // remove niqqud
    .replace(/['"־]/g, '')           // remove quotes, maqaf
    .trim()
    .toLowerCase();
}

/**
 * Calculate similarity score between two strings (0-1).
 * Uses a combination of containment check and character-level matching.
 */
function similarity(a, b) {
  const normA = normalizeHebrew(a);
  const normB = normalizeHebrew(b);

  if (!normA || !normB) return 0;
  if (normA === normB) return 1;
  if (normB.includes(normA) || normA.includes(normB)) return 0.9;

  // Check with common substitutions
  for (const [char1, char2] of HEBREW_SUBSTITUTIONS) {
    const altA = normA.replace(new RegExp(char1, 'g'), char2);
    const altB = normA.replace(new RegExp(char2, 'g'), char1);
    if (normB.includes(altA) || normB.includes(altB)) return 0.8;
  }

  // Levenshtein-based similarity for short strings
  if (normA.length <= 15 && normB.length <= 15) {
    const dist = levenshtein(normA, normB);
    const maxLen = Math.max(normA.length, normB.length);
    const score = 1 - dist / maxLen;
    return score;
  }

  return 0;
}

/**
 * Simple Levenshtein distance.
 */
function levenshtein(a, b) {
  const m = a.length, n = b.length;
  const d = Array.from({ length: m + 1 }, (_, i) => [i]);
  for (let j = 1; j <= n; j++) d[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      d[i][j] = Math.min(
        d[i - 1][j] + 1,     // deletion
        d[i][j - 1] + 1,     // insertion
        d[i - 1][j - 1] + cost // substitution
      );
    }
  }
  return d[m][n];
}

/**
 * Fuzzy search through a list of items.
 * @param {string} query - Search query
 * @param {Array} items - Items to search
 * @param {Function} getSearchText - Function to extract searchable text from an item (returns string or array of strings)
 * @param {number} threshold - Minimum similarity score (0-1), default 0.5
 * @returns {Array} Matched items sorted by relevance
 */
export function fuzzySearch(query, items, getSearchText, threshold = 0.5) {
  if (!query || !query.trim()) return items;

  const normQuery = normalizeHebrew(query);
  if (!normQuery) return items;

  const scored = items.map(item => {
    const texts = getSearchText(item);
    const searchTexts = Array.isArray(texts) ? texts : [texts];

    let bestScore = 0;
    for (const text of searchTexts) {
      if (!text) continue;
      const score = similarity(normQuery, text);
      if (score > bestScore) bestScore = score;
    }

    return { item, score: bestScore };
  });

  return scored
    .filter(s => s.score >= threshold)
    .sort((a, b) => b.score - a.score)
    .map(s => s.item);
}

/**
 * Check if a query fuzzy-matches any of the provided texts.
 */
export function fuzzyMatch(query, ...texts) {
  const normQuery = normalizeHebrew(query);
  if (!normQuery) return false;

  for (const text of texts) {
    if (!text) continue;
    if (similarity(normQuery, text) >= 0.5) return true;
  }
  return false;
}

export { normalizeHebrew, similarity };
