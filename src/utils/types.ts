/**
 * TypeScript Type Definitions
 * 
 * This module contains all TypeScript type definitions and interfaces used
 * throughout the website. It provides centralized type safety and ensures
 * consistency across all components and utilities.
 * 
 * Key Features:
 * - Global type definitions for the application
 * - Interface definitions for data structures
 * - Custom window object extensions
 * - Type-safe event handling
 * - Component prop type definitions
 * 
 * Type Categories:
 * - Data structure interfaces (ingredients, recipes, equipment)
 * - UI state interfaces (theme, settings, interactions)
 * - Event handling types
 * - Global window extensions
 * - Component prop definitions
 * 
 * Usage:
 * - Import types: import type { IngredientData } from './types.ts'
 * - Extend global objects: declare global { ... }
 * - Ensure type safety across modules
 * 
 * Dependencies:
 * - TypeScript compiler
 * - Astro framework types
 * - Browser API types
 * 
 * @author Tomi
 * @version 1.0.0
 */

// Shared type definitions for the project

export interface IngredientData {
  ingredients: any[];
  categories: any[];
  [key: string]: any;
}

export interface ThemeState {
  current?: string;
  isDark?: boolean;
  apply?: () => void;
  toggle?: () => boolean;
}

export interface IngredientDataLoader {
  loadIngredientData(): Promise<IngredientData>;
  preload?: () => void;
  getCachedData?: () => any;
}

export type CustomWindow = Window & {
  ThemeManager?: any;
  __THEME_STATE__?: ThemeState;
  ingredientsData?: IngredientData;
  equipmentData?: any;
  settingsManager?: any;
  smartIngredientPreloader?: any;
  applyRecipeUrlFilters?: () => void;
} 