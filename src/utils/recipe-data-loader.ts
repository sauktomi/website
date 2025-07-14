/**
 * Recipe Data Loader
 * 
 * This module provides utilities for loading recipe frontmatter data from
 * a unified JSON file containing all recipes organized by recipe ID.
 * 
 * Key Features:
 * - Load recipe data by ID from unified file
 * - Cache loaded data for performance
 * - Handle missing recipes gracefully
 * - Support for all recipe metadata fields
 * 
 * Usage:
 * - getRecipeData(recipeId) - Get specific recipe data
 * - getAllRecipeData() - Get all recipe data
 * - clearCache() - Clear the data cache
 * 
 * @author Tomi
 * @version 2.0.0
 */

// Cache for loaded recipe data
const recipeDataCache = new Map<string, any>();

export interface RecipeData {
  title: string;
  subtitle?: string;
  description?: string | string[];
  tags?: string[];
  cuisine?: string;
  category?: string;
  vaikeustaso?: string;
  time?: Record<string, string | number>;
  annokset?: string | number;
  säilyvyys?: string;
  lähde?: string;
  luotu?: string;
  muokattu?: string;
  nutrient_profile?: Record<string, any> | null;
  season?: string[];
  occasion?: string[];
  techniques?: string[];
  equipment?: string[];
  dietary?: {
    type?: string[];
    allergens?: string[];
  } | string[] | null;
  cost_level?: string;
  flavor_profile?: {
    primary?: string[];
    secondary?: string[];
    texture?: string[];
  } | string[] | null;
  mise_en_place?: string[];
  ingredients?: Array<{
    name: string;
    amount?: string;
    unit?: string;
    notes?: string;
  } | {
    section: string;
    items: Array<{
      name: string;
      amount?: string;
      unit?: string;
      notes?: string;
    }>;
  }>;
  image?: string;
  imageCaption?: string;
  imageAlt?: string;
  status?: string;
  collections?: Array<{
    collection: string;
    order?: number;
  } | string>;
  testing_iterations?: number;
  teoria?: string[];
}

/**
 * Load all recipe data from unified JSON file
 */
async function loadAllRecipeData(): Promise<Record<string, RecipeData> | null> {
  const cacheKey = 'all_recipes';
  
  // Check cache first
  if (recipeDataCache.has(cacheKey)) {
    return recipeDataCache.get(cacheKey);
  }
  
  try {
    // Load from unified recipes.json file
    const module = await import(`../data/recipes/recipes.json`);
    const data = module.default;
    
    // Cache the data
    recipeDataCache.set(cacheKey, data.recipes);
    
    return data.recipes;
  } catch (error) {
    console.warn(`Could not load recipe data:`, error);
    return null;
  }
}

/**
 * Get recipe data by recipe ID
 */
export async function getRecipeData(recipeId: string): Promise<RecipeData | null> {
  const allData = await loadAllRecipeData();
  
  if (!allData) {
    return null;
  }
  
  return allData[recipeId] || null;
}

/**
 * Get all recipe data
 */
export async function getAllRecipeData(): Promise<Record<string, RecipeData>> {
  const allData = await loadAllRecipeData();
  return allData || {};
}

/**
 * Get recipe data by slug (extracts ID from slug)
 */
export async function getRecipeDataBySlug(slug: string): Promise<RecipeData | null> {
  // Extract recipe ID from slug
  // Format: "recipe-name" or "category/recipe-name"
  const parts = slug.split('/');
  const recipeId = parts[parts.length - 1]; // Take the last part as recipe ID
  
  return await getRecipeData(recipeId);
}

/**
 * Clear the recipe data cache
 */
export function clearRecipeDataCache(): void {
  recipeDataCache.clear();
}

/**
 * Get all available recipe IDs
 */
export async function getAllRecipeIds(): Promise<string[]> {
  const allData = await loadAllRecipeData();
  
  if (!allData) {
    return [];
  }
  
  return Object.keys(allData);
}

/**
 * Get recipes by category
 */
export async function getRecipesByCategory(category: string): Promise<Record<string, RecipeData>> {
  const allData = await loadAllRecipeData();
  
  if (!allData) {
    return {};
  }
  
  const categoryRecipes: Record<string, RecipeData> = {};
  
  for (const [recipeId, recipe] of Object.entries(allData)) {
    if (recipe.category === category) {
      categoryRecipes[recipeId] = recipe;
    }
  }
  
  return categoryRecipes;
}

/**
 * Get all available categories
 */
export async function getAllCategories(): Promise<string[]> {
  const allData = await loadAllRecipeData();
  
  if (!allData) {
    return [];
  }
  
  const categories = new Set<string>();
  
  for (const recipe of Object.values(allData)) {
    if (recipe.category) {
      categories.add(recipe.category);
    }
  }
  
  return Array.from(categories);
} 