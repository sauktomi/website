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