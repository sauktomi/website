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
// (assuming this already exists in some form)
const reseptitCollection = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    subtitle: z.string().optional(),
    description: z.union([z.string(), z.array(z.string())]).optional(),
    tags: z.array(z.string()).optional(),
    cuisine: z.string().optional(),
    category: z.string().optional(),
    vaikeustaso: z.string().optional(),
    time: z.record(z.string(), z.union([z.string(), z.number()])).optional(),
    annokset: z.union([z.string(), z.number()]).optional(),
    säilyvyys: z.string().optional(),
    lähde: z.string().optional(),
    luotu: z.date().optional(),
    muokattu: z.date().optional(),
    nutrient_profile: z.union([
      z.record(z.string(), z.union([z.string(), z.number()])),
      z.null()
    ]).optional(),
    season: z.array(z.string()).optional(),
    occasion: z.array(z.string()).optional(),
    techniques: z.array(z.string()).optional(),
    equipment: z.array(z.string()).optional(),
    dietary: z.union([
      z.array(z.string()),
      z.object({
        type: z.array(z.string()).optional(),
        allergens: z.array(z.string()).optional(),
      }),
      z.null()
    ]).optional(),
    cost_level: z.string().optional(),
    flavor_profile: z.union([
      z.array(z.string()),
      z.object({
        primary: z.array(z.string()).optional(),
        secondary: z.array(z.string()).optional(),
        texture: z.array(z.string()).optional(),
      }),
      z.null()
    ]).optional(),
    mise_en_place: z.array(z.string()).optional(),
    image: z.string().optional(),
    imageCaption: z.string().optional(),
    imageAlt: z.string().optional(),
  }),
});

// Export the collections
export const collections = {
  'Reseptit': reseptitCollection,
};