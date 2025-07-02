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