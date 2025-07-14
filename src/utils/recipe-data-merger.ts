/**
 * Recipe Data Merger
 * 
 * This module provides utilities for merging recipe frontmatter data with
 * JSON data from unified files, with frontmatter taking priority for overrides.
 * 
 * Key Features:
 * - Merge frontmatter and JSON data
 * - Frontmatter overrides JSON data
 * - Handle missing data gracefully
 * - Support for all recipe metadata fields
 * 
 * Usage:
 * - mergeRecipeData(frontmatter, jsonData) - Merge two data sources
 * - enhanceRecipeEntry(entry) - Enhance an Astro content entry with JSON data
 * 
 * @author Tomi
 * @version 2.0.0
 */

import type { CollectionEntry } from 'astro:content';
import { getRecipeData, type RecipeData } from './recipe-data-loader.js';

export interface MergedRecipeData extends RecipeData {
  // Additional fields that might be computed or enhanced
  _source: 'json' | 'frontmatter' | 'merged';
  _hasJsonData: boolean;
  _hasFrontmatterOverrides: boolean;
}

/**
 * Merge frontmatter data with JSON data, giving priority to frontmatter
 */
export function mergeRecipeData(
  frontmatter: Record<string, any>,
  jsonData: RecipeData | null
): MergedRecipeData {
  // Start with JSON data as base
  const merged: MergedRecipeData = {
    title: '', // Will be overridden by JSON or frontmatter
    _source: 'merged',
    _hasJsonData: !!jsonData,
    _hasFrontmatterOverrides: false,
  };

  // Start with JSON data as base
  if (jsonData) {
    Object.assign(merged, jsonData);
  }

  // Override with frontmatter data (frontmatter takes priority)
  const frontmatterOverrides: string[] = [];
  
  for (const [key, value] of Object.entries(frontmatter)) {
    if (value !== undefined && value !== null) {
      // Skip internal fields
      if (key.startsWith('_')) continue;
      
      (merged as any)[key] = value;
      frontmatterOverrides.push(key);
    }
  }

  merged._hasFrontmatterOverrides = frontmatterOverrides.length > 0;

  return merged;
}

/**
 * Enhance a recipe content entry with JSON data
 */
export async function enhanceRecipeEntry(
  entry: CollectionEntry<'Reseptit'>
): Promise<MergedRecipeData> {
  // Determine recipe ID (use frontmatter override or default to filename)
  const recipeId = entry.data.recipeId || entry.slug.split('/').pop() || entry.slug;
  
  // Load JSON data using the recipe ID (no category needed with unified file)
  const jsonData = await getRecipeData(recipeId);
  
  // Merge with frontmatter
  const mergedData = mergeRecipeData(entry.data, jsonData);
  
  // Ensure we have at least a title
  if (!mergedData.title) {
    mergedData.title = entry.data.title || recipeId;
  }
  
  return mergedData;
}

/**
 * Enhance multiple recipe entries with JSON data
 */
export async function enhanceRecipeEntries(
  entries: CollectionEntry<'Reseptit'>[]
): Promise<Array<{ entry: CollectionEntry<'Reseptit'>; data: MergedRecipeData }>> {
  const enhanced = await Promise.all(
    entries.map(async (entry) => {
      const data = await enhanceRecipeEntry(entry);
      return { entry, data };
    })
  );
  
  return enhanced;
}

/**
 * Get recipe data by slug with automatic JSON loading
 */
export async function getRecipeDataBySlug(slug: string): Promise<MergedRecipeData | null> {
  // Extract recipe ID from slug
  const parts = slug.split('/');
  const recipeId = parts[parts.length - 1]; // Take the last part as recipe ID
  
  // Load JSON data
  const jsonData = await getRecipeData(recipeId);
  
  if (!jsonData) {
    return null;
  }
  
  // Return as merged data (no frontmatter to merge in this case)
  return {
    ...jsonData,
    _source: 'json',
    _hasJsonData: true,
    _hasFrontmatterOverrides: false,
  };
}

/**
 * Validate that a recipe has all required data
 */
export function validateRecipeData(data: MergedRecipeData): {
  isValid: boolean;
  missingFields: string[];
  warnings: string[];
} {
  const requiredFields = ['title'];
  const missingFields: string[] = [];
  const warnings: string[] = [];
  
  // Check required fields
  for (const field of requiredFields) {
    if (!data[field as keyof MergedRecipeData]) {
      missingFields.push(field);
    }
  }
  
  // Check for common issues
  if (!data.ingredients || data.ingredients.length === 0) {
    warnings.push('No ingredients specified');
  }
  
  if (!data.time || Object.keys(data.time).length === 0) {
    warnings.push('No time information specified');
  }
  
  if (!data.vaikeustaso) {
    warnings.push('No difficulty level specified');
  }
  
  return {
    isValid: missingFields.length === 0,
    missingFields,
    warnings
  };
} 