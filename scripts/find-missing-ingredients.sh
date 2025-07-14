#!/bin/bash
# find-missing-ingredients.sh
#
# Lists missing ingredients from recipe frontmatter that are not present in the JSON category files.
# Outputs the ingredient name, which recipe(s) use it, suggested JSON file, and a JSON snippet for manual addition.
#
# Usage: ./scripts/find-missing-ingredients.sh
#
# @author Tomi
# @version 1.0.0

set -e

RECIPE_DIR="src/content/Reseptit"
CATEGORY_DIR="src/content/data/categories"

# Colors
BLUE='\033[0;34m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Temporary files
TEMP_JSON_INGREDIENTS="temp_json_ingredients.txt"
TEMP_RECIPE_INGREDIENTS="temp_recipe_ingredients.txt"
TEMP_MISSING="temp_missing.txt"

# Cleanup function
cleanup() {
    rm -f "$TEMP_JSON_INGREDIENTS" "$TEMP_RECIPE_INGREDIENTS" "$TEMP_MISSING"
}

# 1. Extract all ingredient names from JSON files
echo -e "${BLUE}Scanning ingredient JSON files...${NC}"
for file in "$CATEGORY_DIR"/*.json; do
    if [ -f "$file" ]; then
        awk -F'"' '/"name":/ && !/category/ {print $4}' "$file" >> "$TEMP_JSON_INGREDIENTS"
    fi
done

# 2. Extract all ingredient names from recipe frontmatter
echo -e "${BLUE}Scanning recipe files...${NC}"
find "$RECIPE_DIR" -name "*.md" -type f | while read -r file; do
    echo -e "${YELLOW}Processing: $(basename "$file")${NC}"
    awk -F'"' '/^ingredients: \[$/ {in_ingredients=1; next} in_ingredients && /^\]$/ {in_ingredients=0; next} in_ingredients && /"name":/ {print $4}' "$file" >> "$TEMP_RECIPE_INGREDIENTS"
done

# 3. Find missing ingredients
echo -e "${BLUE}Finding missing ingredients...${NC}"
if [ -f "$TEMP_JSON_INGREDIENTS" ] && [ -f "$TEMP_RECIPE_INGREDIENTS" ]; then
    # Sort and remove duplicates
    sort -u "$TEMP_JSON_INGREDIENTS" -o "$TEMP_JSON_INGREDIENTS"
    sort -u "$TEMP_RECIPE_INGREDIENTS" -o "$TEMP_RECIPE_INGREDIENTS"
    
    # Find ingredients in recipes but not in JSON
    comm -23 "$TEMP_RECIPE_INGREDIENTS" "$TEMP_JSON_INGREDIENTS" > "$TEMP_MISSING"
fi

# 4. Display results
echo -e "${BLUE}📊 RESULTS:${NC}"
echo "=================="

if [ -f "$TEMP_MISSING" ]; then
    missing_count=$(wc -l < "$TEMP_MISSING")
    if [ "$missing_count" -gt 0 ]; then
        echo -e "${RED}Missing ingredients ($missing_count):${NC}"
        echo "------------------------"
        while IFS= read -r ingredient; do
            echo -e "${RED}  - $ingredient${NC}"
            
            # Find which recipes use this ingredient
            recipes_using=""
            find "$RECIPE_DIR" -name "*.md" -type f | while read -r file; do
                if grep -q "\"name\": \"$ingredient\"" "$file"; then
                    recipes_using+="$(basename "$file") "
                fi
            done
            echo -e "    Used in: $recipes_using"
            
            # Suggest category
            suggest=""
            if [[ "$ingredient" =~ selleri|porkkana|sipuli|valkosipuli|tomaattimurska ]]; then
                suggest="kasvikset.json"
            elif [[ "$ingredient" =~ voi|maito|kerma|kananmuna ]]; then
                suggest="maitotuotteet.json"
            elif [[ "$ingredient" =~ suola|mustapippuri|basilika|laakerinlehti|sokeri ]]; then
                suggest="mausteet.json"
            elif [[ "$ingredient" =~ vehnäjauho|leivinjauhe ]]; then
                suggest="jauhot.json"
            elif [[ "$ingredient" =~ vadelma|appelsiini|sitruuna ]]; then
                suggest="hedelmät.json"
            else
                suggest="(choose category)"
            fi
            echo -e "    Suggested JSON file: $suggest"
            
            # Generate JSON entry
            id=$(echo "$ingredient" | tr '[:upper:]' '[:lower:]' | tr ' ' '-' | tr -cd '[:alnum:]-')
            echo -e "    JSON entry:"
            echo -e "      {\"id\": \"$id\", \"name\": \"$ingredient\"}"
            echo
        done < "$TEMP_MISSING"
    else
        echo -e "${GREEN}✅ All ingredients in recipes exist in the JSON category files!${NC}"
    fi
else
    echo -e "${YELLOW}No recipe ingredients found.${NC}"
fi

# Show summary
if [ -f "$TEMP_JSON_INGREDIENTS" ]; then
    json_count=$(wc -l < "$TEMP_JSON_INGREDIENTS")
    echo -e "${GREEN}Total ingredients in JSON files: $json_count${NC}"
fi

if [ -f "$TEMP_RECIPE_INGREDIENTS" ]; then
    recipe_count=$(wc -l < "$TEMP_RECIPE_INGREDIENTS")
    echo -e "${GREEN}Total unique ingredients in recipes: $recipe_count${NC}"
fi

# Cleanup
cleanup

echo ""
echo -e "${GREEN}💡 Run './scripts/list-ids.sh ingredients' to see all available ingredient IDs${NC}" 