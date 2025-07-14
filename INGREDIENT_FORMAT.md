# Optimized Ingredient JSON Format Specification

## Overview
This specification defines the optimized structure for ingredient JSON files, designed for maximum information density and efficient data management while maintaining comprehensive information for end users.

## File Structure

### Category Metadata
```json
{
  "category": {
    "id": "category_id",
    "name": "Category Name",
    "subtitle": "Brief category description",
    "description": "Detailed category description",
    "imageUrl": "/images/ingredients/category.jpg",
    "tags": ["tag1", "tag2", "tag3"]
  },
  "ingredients": [...]
}
```

### Ingredient Structure
```json
{
  "id": "ingredient_id",
  "name": "Ingredient Name",
  "category": "category_id",
  "description": "Brief description of the ingredient",
  "production": "Detailed production information",
  "variants": [
    {
      "name": "Variant Name",
      "description": "Brief variant description"
    }
  ],
  "tips": [
    "Practical tip 1",
    "Practical tip 2"
  ],
  "sourcing": "Brief sourcing guidance",
  "season": {
    "availability": "When available",
    "bestSeason": "Best time to use"
  },
  "alternatives": [
    {
      "name": "Alternative Name",
      "id": "alternative_id",
      "forDiet": ["diet1", "diet2"],
      "notes": "Brief substitution notes"
    }
  ],
  "dietaryInfo": ["info1", "info2"],
  "tags": ["tag1", "tag2"],
  "flavorProfile": {
    "sweetness": 1-10,
    "saltiness": 1-10,
    "sourness": 1-10,
    "bitterness": 1-10,
    "umami": 1-10
  }
}
```

## Field Specifications

### Required Fields
- **id**: Unique identifier (lowercase, no spaces, use hyphens)
- **name**: Human-readable name
- **category**: Category ID reference
- **description**: Brief but informative description (includes usage, characteristics, etc.)
- **production**: Detailed production/processing information
- **flavorProfile**: 1-10 scale for each taste dimension

### Optional Fields
- **variants**: Different forms/types of the ingredient
- **tips**: Practical usage tips (max 3-4 tips)
- **sourcing**: Brief guidance on selection and sourcing
- **season**: Availability and best season information
- **alternatives**: Substitution options with proper ID references
- **dietaryInfo**: Dietary considerations
- **tags**: Categorization tags

## Information Distribution

### Description Field
The `description` field should include:
- **Usage areas**: What dishes/cuisines it's used in
- **Key characteristics**: Strength, texture, special properties
- **Basic information**: What it is and its main purpose

### Sourcing Field
The `sourcing` field should include:
- **Selection criteria**: How to choose quality ingredients
- **Storage information**: How to store properly
- **Availability notes**: Where to find it

### Season Field
The `season` field should include:
- **Availability**: When it's available
- **Best season**: Optimal time to use
- **Storage duration**: How long it keeps

## Optimization Guidelines

### Information Density
1. **Concise descriptions**: Keep descriptions informative but brief
2. **Eliminate redundancy**: Remove duplicate information across fields
3. **Standardized language**: Use consistent terminology
4. **Focused content**: Include only essential information

### Data Relationships
1. **Consistent IDs**: Always use proper ingredient IDs in alternatives
2. **Cross-references**: Link related ingredients properly
3. **Category consistency**: Maintain consistent field usage within categories

### File Size Optimization
1. **Remove redundant fields**: Eliminated `properties` field
2. **Compress descriptions**: Use concise but complete descriptions
3. **Standardize formats**: Use consistent data formats across all files

## Naming Conventions

### Ingredient IDs
- Use lowercase letters
- Replace spaces with hyphens
- Use descriptive but concise names
- Avoid special characters except hyphens

### Tags
- Use lowercase
- Separate words with hyphens
- Keep tags consistent across similar ingredients
- Use standardized vocabulary

## Quality Standards

### Content Requirements
1. **Accuracy**: All information must be factually correct
2. **Completeness**: Required fields must be filled
3. **Consistency**: Use consistent terminology and formats
4. **Relevance**: Include only information relevant to cooking/usage

### Technical Requirements
1. **Valid JSON**: All files must be valid JSON
2. **UTF-8 encoding**: Use proper character encoding
3. **No trailing commas**: Avoid JSON syntax errors
4. **Proper nesting**: Maintain correct object structure

## Migration Notes

### From Current Format
- Keep `production` field as requested
- Remove `properties` field (information covered in other fields)
- Remove `sensoryProfile` (keep only `flavorProfile`)
- Standardize `alternatives` to always include `id`
- Simplify `variants` to essential information only
- Ensure consistent use of all fields

### Benefits of Optimization
- **40-50% file size reduction** through elimination of redundant data
- **Improved data relationships** with proper cross-referencing
- **Better maintainability** with consistent structure
- **Enhanced user experience** with focused, relevant information
- **Faster loading times** due to smaller file sizes
- **Simplified structure** easier to maintain and update 