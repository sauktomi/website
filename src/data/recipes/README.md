# Unified Recipe Data System

This directory contains the unified recipe data system that centralizes all recipe metadata in a single JSON file for easier management and to prevent misidentification of recipe IDs.

## File Structure

```
src/data/recipes/
├── recipes.json          # Unified recipe data file
└── README.md            # This documentation
```

## recipes.json

The `recipes.json` file contains all recipe metadata organized by numeric recipe ID. This unified approach eliminates the need for separate category files and prevents duplicate recipe IDs across categories.

### Structure

```json
{
  "recipes": {
    "001": {
      "title": "Recipe Title",
      "subtitle": "Recipe Subtitle",
      "category": "kokkaus|leivonta|juomat",
      // ... other metadata
    },
    "002": {
      // ... recipe data
    }
  }
}
```

### Recipe ID System

- **Numeric IDs**: All recipes use 3-digit numeric IDs (e.g., "001", "002", "003")
- **Sequential**: IDs are assigned sequentially as recipes are added
- **Cross-category**: IDs are unique across all categories
- **URL-friendly**: IDs can be used in URLs (e.g., `/reseptit/001`)

### Supported Categories

- `kokkaus` - Cooking recipes
- `leivonta` - Baking recipes  
- `juomat` - Beverage recipes

### Metadata Fields

Each recipe can include the following metadata fields:

#### Required Fields
- `title` - Recipe title
- `category` - Recipe category (kokkaus|leivonta|juomat)

#### Optional Fields
- `subtitle` - Recipe subtitle
- `description` - Recipe description (string or array of strings)
- `tags` - Array of tags
- `cuisine` - Cuisine type
- `vaikeustaso` - Difficulty level
- `time` - Time information object
- `annokset` - Number of servings
- `säilyvyys` - Storage information
- `lähde` - Source information
- `luotu` - Creation date
- `muokattu` - Last modified date
- `status` - Recipe status
- `collections` - Recipe collections
- `equipment` - Required equipment
- `mise_en_place` - Preparation steps
- `ingredients` - Recipe ingredients
- `techniques` - Cooking techniques
- `dietary` - Dietary information
- `cost_level` - Cost level
- `flavor_profile` - Flavor profile
- `season` - Seasonal availability
- `occasion` - Suitable occasions
- `teoria` - Theory references
- `testing_iterations` - Number of testing iterations
- `nutrient_profile` - Nutritional information
- `image` - Recipe image path
- `imageCaption` - Image caption
- `imageAlt` - Image alt text

## Integration with Markdown Files

Recipe markdown files in `src/content/Reseptit/` use a simplified frontmatter structure that references the JSON data by recipe ID:

```yaml
---
recipeId: "001"
title: "Recipe Title"
subtitle: "Recipe Subtitle"
image: "/path/to/image.jpg"
status: "final"
luotu: "2024-11-25"
---

# Recipe content here...
```

### Frontmatter Fields

#### Required
- `recipeId` - References the recipe ID in recipes.json

#### Optional (Override JSON data)
- `title` - Override JSON title
- `subtitle` - Override JSON subtitle
- `image` - Override JSON image
- `status` - Override JSON status
- `luotu` - Override JSON creation date
- Any other field can override JSON data

## Adding New Recipes

1. **Assign Recipe ID**: Use the next available numeric ID in recipes.json
2. **Add JSON Data**: Add recipe metadata to recipes.json under the new ID
3. **Create Markdown File**: Create a markdown file with minimal frontmatter referencing the recipe ID
4. **Add Content**: Write the recipe content in the markdown file

### Example: Adding Recipe "005"

1. Add to `recipes.json`:
```json
"005": {
  "title": "New Recipe",
  "category": "kokkaus",
  // ... other metadata
}
```

2. Create `src/content/Reseptit/Kokkaus/New Recipe.md`:
```yaml
---
recipeId: "005"
title: "New Recipe"
---

# Recipe content...
```

## Benefits of Unified System

- **No Duplicate IDs**: Prevents misidentification across categories
- **Easier Management**: Single file to manage all recipe metadata
- **Better Organization**: Clear separation of metadata (JSON) and content (markdown)
- **Simplified Workflow**: Add recipes by incrementing numeric IDs
- **Consistent URLs**: Numeric IDs work well in URLs
- **Reduced Complexity**: No need to manage multiple category files

## Migration from Category Files

The system has been migrated from separate category files (`kokkaus.json`, `leivonta.json`, `juomat.json`) to the unified `recipes.json` file. All recipe IDs have been updated to use numeric IDs across all categories.

## Technical Implementation

The unified system is implemented through:

- `src/utils/recipe-data-loader.ts` - Loads data from unified JSON file
- `src/utils/recipe-data-merger.ts` - Merges JSON data with markdown frontmatter
- `src/pages/reseptit.astro` - Uses merged data for recipe listing
- `src/pages/reseptit/[...slug].astro` - Uses merged data for individual recipes

## Version History

- **v2.0.0** - Unified JSON system with numeric IDs
- **v1.0.0** - Separate category files with filename-based IDs 