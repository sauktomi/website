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