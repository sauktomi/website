/**
 * Recipe Data Processing and Management
 * 
 * This module handles all recipe data processing, transformation, and management
 * functions for the website. It provides utilities for processing recipe metadata,
 * organizing content, and generating structured data for the frontend.
 * 
 * Key Features:
 * - Recipe data enhancement and processing
 * - Time data formatting and calculation
 * - Difficulty level processing
 * - Heading organization and TOC generation
 * - Recipe numbering system management
 * - Search and filtering utilities
 * - Category and tag processing
 * - Author and source data handling
 * 
 * Data Processing:
 * - Frontmatter parsing and validation
 * - Content structure analysis
 * - Metadata extraction and formatting
 * - Search index generation
 * - Filter option creation
 * 
 * Usage:
 * - Process recipe collections: processRecipeData(entries)
 * - Enhance individual recipes: enhanceRecipeData(entry)
 * - Generate filter options: getUniqueFilterValues(entries, field)
 * - Format time data: formatTimeDisplay(minutes)
 * 
 * Dependencies:
 * - Astro Content Collections
 * - TypeScript for type safety
 * - Normalization utilities
 * 
 * @author Tomi
 * @version 2.0.0
 */

// Shared utilities for ruoanlaitto data processing
import type { CollectionEntry } from 'astro:content';

// Common type definitions
export interface IngredientItem {
  id: string;
  name: string;
  category: string;
  description?: string;
  properties?: Record<string, string>;
  tags?: string[];
  dietaryInfo?: string[];
  [key: string]: any;
}

export interface CategoryInfo {
  id: string;
  name: string;
  subtitle?: string;
  description?: string;
  propertyOrder?: string[];
  properties?: string[];
  [key: string]: any;
}

export interface IngredientsData {
  categories: CategoryInfo[];
  ingredients: IngredientItem[];
}

export interface TechniqueItem {
  id: string;
  name: string;
  description?: string;
  category: string;
  difficulty?: string;
  timeRequired?: string;
  equipment?: string[];
  relatedTechniques?: string[];
  tips?: string[];
  tags?: string[];
  variants?: Array<{
    name: string;
    description: string;
    temp?: string;
    time?: string;
    use?: string;
    examples?: string;
    duration?: string;
    result?: string;
  }>;
  [key: string]: any;
}

export interface EquipmentItem {
  id: string;
  name: string;
  category: string;
  description?: string;
  properties?: Record<string, string>;
  variants?: Array<{ name: string; description: string }>;
  tips?: string[];
  sourcing?: string;
  alternatives?: string;
  techniques?: string[];
  care?: string;
  tags?: string[];
}

// New types for enhanced recipe processing
export interface ProcessedTimeData {
  prepTime?: number;
  cookTime?: number;
  totalTime?: number;
  [key: string]: number | undefined;
}

export interface ProcessedHeading {
  text: string;
  level: number;
  id: string;
}

export interface ProcessedHeadingWithChildren extends ProcessedHeading {
  children: ProcessedHeading[];
}

export interface ProcessedDifficulty {
  text: string;
  color: string;
}

export interface ProcessedAuthor {
  name: string;
  url: string;
}

export interface EnhancedRecipeData {
  // Basic data
  title: string;
  tags?: string[];
  cuisine?: string;
  category?: string;
  annokset?: string | number;
  säilyvyys?: string;
  luotu?: Date;
  muokattu?: Date;
  nutrient_profile?: any;
  season?: string[];
  occasion?: string[];
  techniques?: string[];
  dietary?: any;
  cost_level?: string;
  flavor_profile?: any;
  equipment?: string[];
  mise_en_place?: string[];
  ingredients?: Array<{
    name: string;
    amount?: string;
    unit?: string;
    notes?: string;
  }>;
  image?: string;
  description?: string | string[];
  
  // Recipe numbering
  recipeNumber?: number;
  formattedRecipeNumber?: string;
  canonicalUrl?: string;
  
  // Processed data
  processedTime?: ProcessedTimeData;
  formattedTime?: {
    prepTime?: string;
    cookTime?: string;
    totalTime?: string;
    [key: string]: string | undefined;
  };
  difficulty?: ProcessedDifficulty;
  author?: ProcessedAuthor;
  extractedHeadings: ProcessedHeading[];
  groupedHeadings: (ProcessedHeadingWithChildren | ProcessedHeading)[];
  instructionSections: ProcessedHeading[];
  hasTocHeadings: boolean;
  tocId: string;
  metadataProps: any;
  
  // Content
  Content: any;
  headings: any[];
}

// Constants
export const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZÅÄÖ'.split('');

export const MAX_TOP_TAGS = 8;
export const MIN_SEARCH_LENGTH = 3;

// Enhanced recipe processing functions
export function processTimeData(timeData: any): ProcessedTimeData | undefined {
  if (!timeData) return undefined;
  
  const processedTime: ProcessedTimeData = {};
  
  if (timeData.valmisteluaika) processedTime.prepTime = parseInt(timeData.valmisteluaika, 10) || 0;
  if (timeData.paistoaika) processedTime.cookTime = parseInt(timeData.paistoaika, 10) || 0;
  if (timeData.kokonaisaika) processedTime.totalTime = parseInt(timeData.kokonaisaika, 10) || 0;
  
  Object.entries(timeData).forEach(([key, value]) => {
    if (!['valmisteluaika', 'paistoaika', 'kokonaisaika'].includes(key)) {
      processedTime[key] = typeof value === 'string' ? parseInt(value, 10) || 0 : (value as number);
    }
  });
  
  return processedTime;
}

export function formatTimeDisplay(minutes?: number): string {
  if (!minutes) return "";
  
  if (minutes < 60) {
    return `${minutes} min`;
  } else {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins === 0 ? `${hours} h` : `${hours} h ${mins} min`;
  }
}

export function formatAllTimeData(processedTime: ProcessedTimeData | undefined): Record<string, string> {
  if (!processedTime) return {};
  
  const formatted: Record<string, string> = {};
  
  Object.entries(processedTime).forEach(([key, value]) => {
    if (value !== undefined) {
      formatted[key] = formatTimeDisplay(value);
    }
  });
  
  return formatted;
}

export function getDifficultyDisplay(level?: string): ProcessedDifficulty {
  const levels: Record<string, ProcessedDifficulty> = {
    'helppo': { text: 'Helppo', color: 'text-green' },
    'keskitaso': { text: 'Keskitaso', color: 'text-amber' },
    'haastava': { text: 'Haastava', color: 'text-red' }
  };
  
  const normalized = level?.toLowerCase() || 'keskitaso';
  return levels[normalized] || levels['keskitaso'];
}

export function processAuthorData(lähde?: string): ProcessedAuthor {
  let authorName = lähde || '';
  let authorUrl = '';

  if (lähde && typeof lähde === 'string') {
    const linkMatch = lähde.match(/\[([^\]]+)\]\(([^)]+)\)/);
    if (linkMatch) {
      authorName = linkMatch[1];
      authorUrl = linkMatch[2];
    }
  }

  return { name: authorName, url: authorUrl };
}

export function organizeHeadings(headings: ProcessedHeading[]): (ProcessedHeadingWithChildren | ProcessedHeading)[] {
  const result: (ProcessedHeadingWithChildren | ProcessedHeading)[] = [];
  let currentH2: ProcessedHeadingWithChildren | null = null;

  headings.filter(h => h.level > 1 && h.level <= 3).forEach(heading => {
    if (heading.level === 2) {
      currentH2 = {
        ...heading,
        children: []
      };
      result.push(currentH2);
    } else if (heading.level === 3 && currentH2) {
      currentH2.children.push(heading);
    } else {
      result.push(heading);
    }
  });

  return result;
}

export function extractInstructionSections(headings: ProcessedHeading[]): ProcessedHeading[] {
  const instructionSections: ProcessedHeading[] = [];
  let foundOhje = false;
  
  for (const heading of headings) {
    if (heading.id === 'ohje' || heading.text.toLowerCase().includes('ohje')) {
      foundOhje = true;
      continue;
    }
    
    if (foundOhje && heading.level === 4) {
      instructionSections.push(heading);
    } else if (foundOhje && heading.level <= 3) {
      // Stop when we hit another major section
      break;
    }
  }
  
  return instructionSections;
}

export function generateTocId(): string {
  return `toc-${Math.random().toString(36).substring(2, 11)}`;
}

// Recipe numbering system
interface RecipeNumberEntry {
  slug: string;
  number: number;
  luotu: Date;
}

// Global recipe registry for numbering (will be populated at build time)
let recipeNumberRegistry: Map<string, RecipeNumberEntry> | null = null;

export function createRecipeNumberRegistry(allRecipes: CollectionEntry<'Reseptit'>[]): Map<string, RecipeNumberEntry> {
  // Sort recipes by creation date (luotu), then by slug for consistent ordering
  const sortedRecipes = [...allRecipes].sort((a, b) => {
    const dateA = a.data.luotu ? new Date(a.data.luotu) : new Date(0);
    const dateB = b.data.luotu ? new Date(b.data.luotu) : new Date(0);
    
    if (dateA.getTime() !== dateB.getTime()) {
      return dateA.getTime() - dateB.getTime();
    }
    
    // If dates are the same, sort by slug for consistency
    return a.slug.localeCompare(b.slug);
  });

  const registry = new Map<string, RecipeNumberEntry>();
  
  sortedRecipes.forEach((recipe, index) => {
    const number = index + 1;
    const luotu = recipe.data.luotu ? new Date(recipe.data.luotu) : new Date(0);
    
    registry.set(recipe.slug, {
      slug: recipe.slug,
      number,
      luotu
    });
  });

  return registry;
}

export function getRecipeNumberRegistry(): Map<string, RecipeNumberEntry> | null {
  return recipeNumberRegistry;
}

export function setRecipeNumberRegistry(registry: Map<string, RecipeNumberEntry>): void {
  recipeNumberRegistry = registry;
}

export function getRecipeByNumber(number: number): RecipeNumberEntry | null {
  if (!recipeNumberRegistry) return null;
  
  for (const entry of recipeNumberRegistry.values()) {
    if (entry.number === number) {
      return entry;
    }
  }
  
  return null;
}

export function getRecipeNumber(slug: string): number | null {
  if (!recipeNumberRegistry) return null;
  
  const entry = recipeNumberRegistry.get(slug);
  return entry ? entry.number : null;
}

export function formatRecipeNumber(number: number): string {
  return number.toString().padStart(3, '0');
}

export function generateNumberVariations(number: number): string[] {
  const unpadded = number.toString();              // "1", "10", "25"
  const threeDigit = number.toString().padStart(3, '0'); // "001", "010", "025"  
  const twoDigit = number.toString().padStart(2, '0');   // "01", "10", "25"
  
  const variations = [unpadded, threeDigit];
  
  // Only add 2-digit format if it's different from unpadded (for numbers 1-9)
  if (twoDigit !== unpadded) {
    variations.push(twoDigit);
  }
  
  // Remove duplicates and return unique variations
  return [...new Set(variations)];
}

export async function enhanceRecipeData(entry: CollectionEntry<'Reseptit'>): Promise<EnhancedRecipeData> {
  const { Content, headings } = await entry.render();
  
  // Extract headings data
  const extractedHeadings: ProcessedHeading[] = headings.map(heading => ({
    text: heading.text,
    level: heading.depth,
    id: heading.slug
  }));
  
  // Process all dynamic data
  const processedTime = processTimeData(entry.data.time);
  const formattedTime = formatAllTimeData(processedTime);
  const difficulty = getDifficultyDisplay(entry.data.vaikeustaso);
  const author = processAuthorData(entry.data.lähde);
  const groupedHeadings = organizeHeadings(extractedHeadings);
  const instructionSections = extractInstructionSections(extractedHeadings);
  const hasTocHeadings = groupedHeadings.length > 2;
  const tocId = generateTocId();
  
  // Calculate recipe number from registry
  const recipeNumber = getRecipeNumber(entry.slug) ?? undefined;
  const formattedRecipeNumber = recipeNumber ? formatRecipeNumber(recipeNumber) : undefined;
  
  // Generate canonical URL without category - just use the base slug name
  const baseSlug = entry.slug.includes('/') ? entry.slug.split('/').pop() || entry.slug : entry.slug;
  const canonicalUrl = `/reseptit/${baseSlug}`;
  
  // Build metadata props
  const metadataProps = {
    title: entry.data.title,
    tags: entry.data.tags,
    cuisine: entry.data.cuisine,
    category: entry.data.category,
    difficulty: entry.data.vaikeustaso,
    time: processedTime,
    servings: entry.data.annokset,
    source: entry.data.lähde,
    created: entry.data.luotu,
    modified: entry.data.muokattu,
    nutrientProfile: entry.data.nutrient_profile,
    season: entry.data.season,
    occasions: entry.data.occasion,
    techniques: entry.data.techniques,
    dietary: entry.data.dietary,
    costLevel: entry.data.cost_level,
    flavorProfile: entry.data.flavor_profile,
    equipment: entry.data.equipment,
    image: (entry.data as any).image,
    headings: extractedHeadings
  };
  
  return {
    // Basic data
    title: entry.data.title,
    tags: entry.data.tags,
    cuisine: entry.data.cuisine,
    category: entry.data.category,
    annokset: entry.data.annokset,
    säilyvyys: entry.data.säilyvyys,
    luotu: entry.data.luotu,
    muokattu: entry.data.muokattu,
    nutrient_profile: entry.data.nutrient_profile,
    season: entry.data.season,
    occasion: entry.data.occasion,
    techniques: entry.data.techniques,
    dietary: entry.data.dietary,
    cost_level: entry.data.cost_level,
    flavor_profile: entry.data.flavor_profile,
    equipment: entry.data.equipment,
    mise_en_place: entry.data.mise_en_place,
    ingredients: (entry.data as any).ingredients,
    image: (entry.data as any).image,
    description: entry.data.description,
    
    // Recipe numbering
    recipeNumber,
    formattedRecipeNumber,
    canonicalUrl,
    
    // Processed data
    processedTime,
    formattedTime,
    difficulty,
    author,
    extractedHeadings,
    groupedHeadings,
    instructionSections,
    hasTocHeadings,
    tocId,
    metadataProps,
    
    // Content
    Content,
    headings
  };
}

// Utility functions
export function createAlphabeticalGroups<T extends { name: string }>(items: T[]): {
  groups: Record<string, T[]>;
  activeLetters: string[];
} {
  const groups: Record<string, T[]> = {};
  
  // Initialize alphabet groups
  ALPHABET.forEach(letter => {
    groups[letter] = [];
  });
  
  // Categorize items by first letter
  items.forEach(item => {
    const firstLetter = item.name.charAt(0).toUpperCase();
    const targetLetter = ALPHABET.includes(firstLetter) ? firstLetter : '#';
    
    if (!groups[targetLetter]) {
      groups[targetLetter] = [];
    }
    groups[targetLetter].push(item);
  });
  
  // Find letters that have items
  const activeLetters = ALPHABET.filter(letter => groups[letter]?.length > 0);
  if (groups['#']?.length > 0) {
    activeLetters.push('#');
  }
  
  // Sort items within each letter group
  Object.keys(groups).forEach(letter => {
    groups[letter].sort((a, b) => a.name.localeCompare(b.name, 'fi'));
  });
  
  return { groups, activeLetters };
}

export function createSearchableData<T extends { name: string; tags?: string[]; category: string }>(
  items: T[],
  additionalFields: Record<string, (item: T) => string[]> = {}
): Array<{
  name: string;
  tags: string[];
  category: string;
  letterGroup: string;
  [key: string]: any;
}> {
  return items.map(item => {
    const baseData = {
      name: item.name.toLowerCase(),
      tags: (item.tags || []).map(t => String(t).toLowerCase()),
      category: String(item.category).toLowerCase(),
      letterGroup: item.name.charAt(0).toUpperCase()
    };
    
    // Add additional searchable fields
    Object.entries(additionalFields).forEach(([key, extractor]) => {
      baseData[key] = extractor(item).map(v => String(v).toLowerCase());
    });
    
    return baseData;
  });
}

export function createSafeCategories(categories: CategoryInfo[]): Array<{
  id: string;
  name: string;
  subtitle?: string;
  description?: string;
}> {
  return categories.map(cat => ({
    id: String(cat.id),
    name: String(cat.name),
    subtitle: cat.subtitle ? String(cat.subtitle) : undefined,
    description: cat.description ? String(cat.description) : undefined
  }));
}

export function consolidateIngredientCategories(ingredientCategories: Record<string, any>): IngredientsData {
  return {
    categories: Object.values(ingredientCategories).map(cat => cat.category as CategoryInfo),
    ingredients: Object.values(ingredientCategories).flatMap(cat => cat.ingredients as IngredientItem[])
  };
}

export function extractUniqueDietaryTags(ingredients: IngredientItem[]): string[] {
  const allDietaryTags = new Set<string>();
  ingredients.forEach(ingredient => {
    ingredient.dietaryInfo?.forEach(diet => allDietaryTags.add(diet));
  });
  return Array.from(allDietaryTags).sort();
}

export function calculateTopTags(items: Array<{ tags?: string[] }>, maxTags: number = MAX_TOP_TAGS): string[] {
  const tagCount = items.reduce((acc: Record<string, number>, item) => {
    item.tags?.forEach(tag => {
      acc[tag] = (acc[tag] || 0) + 1;
    });
    return acc;
  }, {});

  return Object.entries(tagCount)
    .sort(([,a], [,b]) => b - a)
    .slice(0, maxTags)
    .map(([tag]) => tag);
}

export function processRecipeData(allRecipeEntries: CollectionEntry<'Reseptit'>[]) {
  const recipesByCategory: Record<string, CollectionEntry<'Reseptit'>[]> = {};
  
  const displayedRecipes = allRecipeEntries.map(entry => {
    const pathParts = entry.id.split('/');
    const categoryName = pathParts.length > 1 
      ? pathParts[0].charAt(0).toUpperCase() + pathParts[0].slice(1)
      : 'Muut';

    if (!recipesByCategory[categoryName]) {
      recipesByCategory[categoryName] = [];
    }
    recipesByCategory[categoryName].push(entry);

    const getExcerpt = (description: any) => {
      if (Array.isArray(description) && description.length > 0) return description[0];
      if (typeof description === 'string') return description;
      return 'Katso reseptin tiedot napsauttamalla.';
    };

    return {
      title: entry.data.title,
      slug: entry.slug,
      excerpt: getExcerpt(entry.data.description),
      image: (entry.data as any).image || '/placeholder-recipe.svg',
      category: categoryName,
      id: entry.id,
      techniques: entry.data.techniques || [],
      vaikeustaso: entry.data.vaikeustaso || null,
      dietaryType: Array.isArray(entry.data.dietary) ? [] : (entry.data.dietary?.type || []),
      costLevel: entry.data.cost_level || null,
      tags: entry.data.tags || [],
      kokonaisaika: entry.data.time?.kokonaisaika || null,
    };
  }).sort((a, b) => b.id.localeCompare(a.id)); // Sort by newest first

  return { displayedRecipes, recipesByCategory };
}

export function getUniqueFilterValues(allRecipeEntries: CollectionEntry<'Reseptit'>[], field: string): string[] {
  return [...new Set(allRecipeEntries.flatMap(entry => {
    if (field === 'techniques') return entry.data.techniques || [];
    if (field === 'dietaryTypes') {
      const dietary = entry.data.dietary;
      return Array.isArray(dietary) ? [] : dietary?.type || [];
    }
    if (field === 'tags') return entry.data.tags || [];
    const value = entry.data[field as keyof typeof entry.data];
    return value && typeof value === 'string' ? [value] : [];
  }).filter(Boolean))];
}
