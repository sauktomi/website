# Recipe Content Format Guide

This guide defines the standardized format for recipe content in the unified recipe data system. Follow this structure to ensure consistency and proper integration with the JSON metadata system.

## File Structure

### Frontmatter (Required)
```yaml
---
recipeId: "001"                    # 3-digit numeric ID (001, 002, 003, etc.)
status: "published"                # published, draft, template-update, final
luotu: "2024-11-25"               # Creation date (YYYY-MM-DD)
muokattu: "2024-12-10"            # Last modified date (YYYY-MM-DD)
title: "Recipe Title"              # Main recipe title
subtitle: "Recipe Subtitle"        # Optional subtitle
description: [                     # Array of description paragraphs
  "First paragraph of description...",
  "Second paragraph of description...",
  "Third paragraph of description..."
]
image: "/placeholder-recipe.svg"   # Image path
imageCaption: "Image caption text" # Image caption
imageAlt: "Image alt text"         # Alt text for accessibility
mise_en_place: [                  # Preparation steps array
  "First preparation step",
  "Second preparation step",
  "Third preparation step"
]
ingredients: [                     # Ingredients array (see format below)
  # ... ingredient objects
]
---
```

### Content Structure

#### Main Content Sections
```markdown
### Ohje

#### [Section Name]

[Step-by-step instructions]

#### [Another Section]

[More instructions]

### Tarjoilu

[Serving instructions]

### Vinkkejä

- [Tip 1]
- [Tip 2]
- [Tip 3]
```

## Ingredient Formats

### Flat Format (Simple Ingredients)
```yaml
ingredients: [
  {
    "name": "Ingredient Name",
    "amount": "2-3",
    "unit": "rkl",
    "notes": "Optional notes"
  },
  {
    "name": "Another Ingredient",
    "amount": "1",
    "unit": "kpl",
    "notes": "Preparation notes"
  }
]
```

### Sectioned Format (Complex Recipes)
```yaml
ingredients: [
  {
    "section": "Section Name",
    "items": [
      {
        "name": "Ingredient Name",
        "amount": "200",
        "unit": "g",
        "notes": "Notes"
      },
      {
        "name": "Another Ingredient",
        "amount": "2",
        "unit": "dl",
        "notes": "More notes"
      }
    ]
  },
  {
    "section": "Another Section",
    "items": [
      {
        "name": "Section Ingredient",
        "amount": "1-2",
        "unit": "rkl",
        "notes": "Section notes"
      }
    ]
  }
]
```

## Content Guidelines

### Recipe ID System
- Use 3-digit numeric IDs: 001, 002, 003, etc.
- IDs are unique across all categories
- New recipes should use the next available number
- IDs are used for URL routing: `/reseptit/001`

### Status Values
- `published`: Ready for public viewing
- `draft`: Work in progress
- `template-update`: Template being updated
- `final`: Final version

### Description Structure
- Use 3 paragraphs for comprehensive descriptions
- First paragraph: Overview and appeal
- Second paragraph: Technical approach and methodology
- Third paragraph: Sensory experience (visual, olfactory, texture, taste)

### Mise en Place
- List preparation steps in logical order
- Be specific about measurements and preparations
- Include equipment preparation if needed
- Keep steps concise but clear

### Instructions Format
- Use `### Ohje` as the main instruction header
- Use `#### [Section Name]` for subsections
- Number steps within sections when appropriate
- Use bullet points for simple lists
- Keep language clear and actionable

### Serving and Tips
- Use `### Tarjoilu` for serving instructions
- Use `### Vinkkejä` for tips and advice
- Keep tips practical and helpful
- Use bullet points for easy scanning

## Examples

### Simple Recipe Structure
```markdown
---
recipeId: "001"
status: "published"
luotu: "2024-11-25"
muokattu: "2024-12-10"
title: "Recipe Title"
subtitle: "Recipe Subtitle"
description: [
  "First paragraph...",
  "Second paragraph...",
  "Third paragraph..."
]
image: "/placeholder-recipe.svg"
imageCaption: "Image caption"
imageAlt: "Alt text"
mise_en_place: [
  "Step 1",
  "Step 2"
]
ingredients: [
  {
    "name": "Ingredient",
    "amount": "1",
    "unit": "kpl",
    "notes": "Notes"
  }
]
---

### Ohje

#### Preparation

1. First step
2. Second step

#### Cooking

1. Cooking step 1
2. Cooking step 2

### Tarjoilu

Serve hot with accompaniments.

### Vinkkejä

- Tip 1
- Tip 2
```

### Complex Recipe Structure
```markdown
---
# ... frontmatter with sectioned ingredients
ingredients: [
  {
    "section": "Main Ingredients",
    "items": [
      {
        "name": "Main Ingredient",
        "amount": "200",
        "unit": "g",
        "notes": "Preparation notes"
      }
    ]
  },
  {
    "section": "Additional Ingredients",
    "items": [
      {
        "name": "Additional Ingredient",
        "amount": "1-2",
        "unit": "rkl",
        "notes": "Optional"
      }
    ]
  }
]
---

### Ohje

#### Main Preparation

- Step 1
- Step 2

#### Additional Steps

- Additional step 1
- Additional step 2

### Tarjoilu

Serving instructions.

### Vinkkejä

- Practical tip 1
- Practical tip 2
```

## JSON Integration

### What Goes in Frontmatter
- **Content-specific data**: title, subtitle, description, ingredients, mise_en_place
- **Frequently edited fields**: status, muokattu dates
- **Recipe identification**: recipeId, luotu date
- **Visual content**: image, imageCaption, imageAlt

### What Goes in JSON (src/data/recipes/recipes.json)
- **Supporting metadata**: tags, cuisine, category, collections
- **Technical specifications**: vaikeustaso, time, annokset, säilyvyys
- **Categorization data**: dietary info, cost_level, season, occasion
- **Equipment and techniques**: equipment, techniques arrays
- **Flavor profiles**: flavor_profile, nutrient_profile
- **References**: teoria, lähde

### Title Duplication
- Title appears in both frontmatter and JSON
- JSON title is for human readability and search
- Frontmatter title is the primary source for display
- Keep titles consistent between both locations

### Ingredient References

#### Frontmatter (Plain Names)
```yaml
ingredients: [
  {
    "name": "Suola",           # ✅ Correct - plain name
    "amount": "1",
    "unit": "tl",
    "notes": "hienoa merisuolaa"
  },
  {
    "name": "Voi",             # ✅ Correct - plain name
    "amount": "10-15",
    "unit": "g",
    "notes": "kirkastettua"
  }
]
```

#### Content (Wiki-Style Links Optional)
```markdown
# In recipe instructions
Lisää [[suolaa|suola]] ja [[voita|voi]] pannuun.  # ✅ Optional explicit linking
Tai yksinkertaisesti:
Lisää suolaa ja voita pannuun.                 # ✅ Automatic linking works too
```

**Key Points:**
- **Frontmatter**: Always use plain ingredient names
- **Content**: Can use wiki-style links for explicit control, or rely on automatic linking
- **Automatic linking**: The site converts ingredient names to links when they match ingredient IDs

## Best Practices

1. **Consistency**: Follow the exact structure shown above
2. **Clarity**: Use clear, actionable language
3. **Completeness**: Include all required frontmatter fields
4. **Organization**: Group related steps logically
5. **Accessibility**: Provide alt text for images
6. **Maintenance**: Update modification dates when editing

## Validation

The system validates:
- Recipe ID format (3-digit numbers)
- Required frontmatter fields
- Date format consistency
- Ingredient structure
- Content hierarchy

## File Naming

- Use descriptive filenames
- Use hyphens for spaces
- Include category in path: `/Kokkaus/`, `/Leivonta/`, `/Juomat/`
- Example: `Tomaattikastike pastalle.md`

## Naming Conventions for Data Integration

### Ingredient Naming

When referencing ingredients in your content, use the exact `name` values from the category JSON files to ensure proper integration with the popover system and data processing. The site automatically converts ingredient names to links when they match the ingredient IDs.

#### Finding Correct Ingredient Names

1. **Check Category Files**: Look in `src/content/data/categories/` for the appropriate category:
   - `hedelmät.json` - Fruits
   - `jauhot.json` - Flours
   - `juustot.json` - Cheeses
   - `kasvikset.json` - Vegetables
   - `maitotuotteet.json` - Dairy products
   - `mausteet.json` - Spices
   - `rasva.json` - Fats and oils
   - `sokeri.json` - Sugars

2. **Use the `name` Field**: Each ingredient has a `name` field that should be used in references:
   ```json
   {
     "id": "appelsiini",
     "name": "Appelsiini",
     // ... other fields
   }
   ```

3. **Example Ingredient References**:
   ```markdown
   - Use "Appelsiini" (not "appelsiini" or "Appelsiini")
   - Use "Sitruuna" (not "sitruuna" or "sitruuna")
   - Use "Vehnäjauho" (not "vehnäjauho" or "vehnäjauho")
   ```

#### Finding Available IDs

Use the provided script to list all available ingredient IDs:

```bash
# List all ingredient IDs
./scripts/list-ids.sh ingredients

# Search for specific ingredients
./scripts/list-ids.sh appelsiini
./scripts/list-ids.sh vehnäjauho
```

### Equipment Naming

Equipment references should use the exact `name` values from `src/content/data/equipment.json`. The site automatically converts equipment names to links when they match the equipment IDs.

#### Finding Correct Equipment Names

1. **Check Equipment Categories**:
   - `vuoat` - Molds and pans
   - `työkalut` - Tools
   - `mittausvälineet` - Measuring tools
   - `sähkölaitteet` - Electrical appliances
   - `paistaminen` - Frying equipment
   - `erikoisvälineet` - Specialized equipment

2. **Use the `name` Field**: Each equipment item has a `name` field:
   ```json
   {
     "id": "kaulin",
     "name": "Kaulin",
     // ... other fields
   }
   ```

3. **Example Equipment References**:
   ```markdown
   - Use "Kaulin" (not "kaulin" or "Kaulin")
   - Use "Paistinpannu" (not "paistinpannu" or "paistinpannu")
   - Use "Digitaalivaaka" (not "digitaalivaaka" or "digitaalivaaka")
   ```

#### Finding Available Equipment IDs

Use the provided script to list all available equipment IDs:

```bash
# List all equipment IDs
./scripts/list-ids.sh equipment

# Search for specific equipment
./scripts/list-ids.sh paistinpannu
./scripts/list-ids.sh kaulin
```

### Technique Naming

Technique references should use the exact `name` values from `src/content/data/techniques.json`. The site automatically converts technique names to links when they match the technique IDs.

#### Finding Correct Technique Names

1. **Check Technique Categories**:
   - `kuumakypsentäminen` - Hot cooking
   - `kylmävalmistus` - Cold preparation
   - `säilöntä` - Preservation
   - `maustaminen` - Seasoning
   - `tekstuuritekniikat` - Texture techniques
   - `leipominen` - Baking
   - `italialainen` - Italian techniques
   - `perustekniikat` - Basic techniques

2. **Use the `name` Field**: Each technique has a `name` field:
   ```json
   {
     "id": "veitsentaidot",
     "name": "Veitsentaidot",
     // ... other fields
   }
   ```

3. **Example Technique References**:
   ```markdown
   - Use "Veitsentaidot" (not "veitsentaidot" or "Veitsentaidot")
   - Use "Mise en place" (not "mise-en-place" or "mise en place")
   - Use "Paistaminen" (not "paistaminen" or "Paistaminen")
   ```

#### Finding Available Technique IDs

Use the provided script to list all available technique IDs:

```bash
# List all technique IDs
./scripts/list-ids.sh techniques

# Search for specific techniques
./scripts/list-ids.sh paistaminen
./scripts/list-ids.sh veitsentaidot
```

### Wiki-Style Links (Content Only)

When referencing ingredients, equipment, or techniques in your **content** (not frontmatter), you can use wiki-style links for explicit linking:

```markdown
# Correct format
[[Ingredient Name|ingredient-id]]
[[Equipment Name|equipment-id]]
[[Technique Name|technique-id]]

# Examples
[[Appelsiini|appelsiini]]
[[Kaulin|kaulin]]
[[Veitsentaidot|veitsentaidot]]
```

**Note**: In frontmatter, use plain ingredient names. The site automatically converts them to links when they match the ingredient IDs.

### Validation

Run the validation script to check for proper naming:

```bash
# Validate all recipe content
./scripts/validate-names.sh
```

The validation script will:
- Check all wiki-style links for valid IDs
- Validate recipe ID format (3-digit numbers)
- Check for duplicate recipe IDs
- Provide detailed error reporting with file and line numbers
- Show a summary of validations passed/failed

### Best Practices for Naming

1. **Consistency**: Always use the exact `id` values from data files
2. **Case Sensitivity**: IDs are case-sensitive
3. **Hyphens**: Use hyphens in IDs (e.g., `mise-en-place`)
4. **Validation**: Run validation scripts before committing
5. **Documentation**: Keep a reference list of commonly used IDs

### Common ID Patterns

#### Ingredients
- Fruits: `appelsiini`, `sitruuna`, `vadelma`
- Flours: `vehnäjauho`, `ruisjauho`, `ohrajauho`
- Dairy: `maito`, `voi`, `kerma`
- Spices: `suola`, `pippuri`, `kaneli`

#### Equipment
- Tools: `kaulin`, `veitsi`, `lasta`
- Appliances: `yleiskone`, `uuni`, `digitaalivaaka`
- Pans: `paistinpannu`, `kattila`, `piirakkavuoka`

#### Techniques
- Basic: `veitsentaidot`, `mise-en-place`, `paistaminen`
- Cooking: `haudutus`, `poaching`, `sous-vide`
- Baking: `leipominen`, `vaivaus`, `taikinanteko`

## Content Creation Workflow

### Step-by-Step Process

1. **Find Available IDs**:
   ```bash
   # List all available IDs
   ./scripts/list-ids.sh
   
   # Search for specific items
   ./scripts/list-ids.sh appelsiini
   ./scripts/list-ids.sh paistinpannu
   ./scripts/list-ids.sh veitsentaidot
   ```

2. **Create Content**:
   - Follow the frontmatter structure above
   - Use correct recipe IDs (3-digit numbers)
   - Reference ingredients, equipment, and techniques using wiki-style links
   - Use the exact `id` values from data files

3. **Validate Content**:
   ```bash
   # Run validation before committing
   ./scripts/validate-names.sh
   ```

4. **Fix Issues**:
   - Address any validation errors
   - Update invalid IDs to match data files
   - Ensure recipe IDs are unique and properly formatted

### Quick Reference Commands

```bash
# List all available IDs for reference
./scripts/list-ids.sh

# Validate your content
./scripts/validate-names.sh

# Search for specific items
./scripts/list-ids.sh [search-term]

# Get help
./scripts/list-ids.sh help
```

This format ensures consistency across all recipe content and proper integration with the unified recipe data system.
