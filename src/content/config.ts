/**
 * Astro Content Collection Configuration
 * 
 * This module defines the content collection schema and configuration for
 * the Astro content management system. It specifies the structure and
 * validation rules for recipe content and metadata.
 * 
 * Key Features:
 * - Recipe collection schema definition
 * - Frontmatter validation and type checking
 * - Metadata field specifications
 * - Optional and required field definitions
 * - Union type support for flexible data
 * 
 * Schema Fields:
 * - Basic metadata (title, description, tags)
 * - Recipe details (category, difficulty, servings)
 * - Time information (prep, cook, total time)
 * - Dietary and allergen information
 * - Technique and equipment requirements
 * - Image and media specifications
 * - Seasonal and occasion data
 * 
 * Usage:
 * - Used by Astro for content validation
 * - Provides TypeScript types for content entries
 * - Ensures data consistency across recipes
 * - Enables IntelliSense for content authors
 * 
 * Dependencies:
 * - Astro Content Collections
 * - Zod schema validation
 * - TypeScript for type generation
 * 
 * @author Tomi
 * @version 1.0.0
 */

// src/content/config.ts
import { defineCollection, z } from 'astro:content';

// Define the schema for the Reseptit collection
// Simplified to only include frequently edited fields, with supporting data in JSON files
const reseptitCollection = defineCollection({
  type: 'content',
  schema: z.object({
    // Basic required metadata
    title: z.string(),
    
    // Optional basic metadata (frequently edited)
    subtitle: z.string().optional(),
    description: z.union([z.string(), z.array(z.string())]).optional(),
    image: z.string().optional(),
    imageCaption: z.string().optional(),
    imageAlt: z.string().optional(),
    
    // Recipe ID for JSON data lookup (numeric ID like "001", "002", etc.)
    recipeId: z.string().regex(/^\d{3}$/, "Recipe ID must be a 3-digit number like '001', '002', etc.").optional(),
    
    // Status and versioning (frequently edited)
    status: z.string().optional(),
    luotu: z.string().optional(),
    muokattu: z.string().optional(),
    
    // Content-specific overrides (can override JSON data)
    ingredients: z.array(z.union([
      // Flat format (legacy)
      z.object({
        name: z.string(),
        amount: z.string().optional(),
        unit: z.string().optional(),
        notes: z.string().optional(),
      }),
      // Sectioned format (new)
      z.object({
        section: z.string(),
        items: z.array(z.object({
          name: z.string(),
          amount: z.string().optional(),
          unit: z.string().optional(),
          notes: z.string().optional(),
        })),
      }),
    ])).optional(),
    mise_en_place: z.array(z.string()).optional(),
    
    // Legacy support - these can override JSON data if needed
    tags: z.array(z.string()).optional(),
    cuisine: z.string().optional(),
    category: z.string().optional(),
    vaikeustaso: z.string().optional(),
    time: z.record(z.string(), z.union([z.string(), z.number()])).optional(),
    annokset: z.union([z.string(), z.number()]).optional(),
    säilyvyys: z.string().optional(),
    lähde: z.string().optional(),
  }),
});

// Export the collections
export const collections = {
  'Reseptit': reseptitCollection,
};