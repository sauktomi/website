/**
 * Normalize text for ingredient ID matching
 * Works in both browser and Node.js environments
 * @param {string} str The string to normalize
 * @returns {string} The normalized string
 */
export function normalizeForIngredientId(str) {
  return str.toLowerCase()
    .trim()
    .replace(/[äÄ]/g, 'a')
    .replace(/[öÖ]/g, 'o')
    .replace(/[åÅ]/g, 'a')
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9\-]+/g, '')
    .replace(/\-\-+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
} 