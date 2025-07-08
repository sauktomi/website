/**
 * Ingredient Data Management
 * 
 * This module centralizes all ingredient data from various category JSON files
 * and provides a unified interface for accessing ingredient information across
 * the website. It consolidates data from multiple category files into a single
 * exportable structure.
 * 
 * Key Features:
 * - Centralized ingredient data consolidation
 * - Category-based data organization
 * - Type-safe ingredient data access
 * - Helper functions for category-specific data retrieval
 * - Integration with the main recipe data system
 * 
 * Data Structure:
 * - Individual category files (hedelmät, jauhot, juustot, etc.)
 * - Consolidated ingredients data object
 * - Category-specific access functions
 * 
 * Usage:
 * - Import consolidated data: import { ingredientsData } from './ingredient-data.ts'
 * - Get category data: import { getCategoryData } from './ingredient-data.ts'
 * - Used by popover system and recipe processing
 * 
 * Dependencies:
 * - Category JSON files in content/data/categories/
 * - ruoanlaitto-data.ts for consolidation functions
 * 
 * @author Tomi
 * @version 1.0.0
 */

// Centralized ingredient data management
import hedelmätData from '../content/data/categories/hedelmät.json';
import jauhot from '../content/data/categories/jauhot.json';
import juustot from '../content/data/categories/juustot.json';
import kasvikset from '../content/data/categories/kasvikset.json';
import maitotuotteet from '../content/data/categories/maitotuotteet.json';
import mausteet from '../content/data/categories/mausteet.json';
import rasva from '../content/data/categories/rasva.json';
import sokeri from '../content/data/categories/sokeri.json';
import { consolidateIngredientCategories, type IngredientsData } from './ruoanlaitto-data.ts';

// Export consolidated ingredient categories
export const ingredientCategories = {
  'hedelmät': hedelmätData,
  'jauhot': jauhot,
  'juustot': juustot,
  'kasvikset': kasvikset,
  'maitotuotteet': maitotuotteet,
  'mausteet': mausteet,
  'rasva': rasva,
  'sokeri': sokeri,
} as const;

// Export consolidated ingredients data
export const ingredientsData: IngredientsData = consolidateIngredientCategories(ingredientCategories);

// Export helper function to get specific category data
export function getCategoryData(categoryId: keyof typeof ingredientCategories) {
  return ingredientCategories[categoryId];
} 