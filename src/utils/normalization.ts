/**
 * Normalize ingredient ID for consistent matching
 * 
 * This function normalizes ingredient names to create consistent IDs
 * for matching across different data sources.
 * 
 * @param str The string to normalize
 * @returns Normalized string suitable for ID matching
 */
export function normalizeForIngredientId(str: string) {
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