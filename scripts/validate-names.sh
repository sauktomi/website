#!/bin/bash
# validate-names.sh
# 
# Validation script for recipe content naming conventions
# Checks that all wiki-style links reference valid IDs in data files
#
# Usage: ./scripts/validate-names.sh
# 
# @author Tomi
# @version 1.0.0

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Directories to check
RECIPE_DIR="src/content/Reseptit"
CATEGORY_DIR="src/content/data/categories"
EQUIPMENT_FILE="src/content/data/equipment.json"
TECHNIQUES_FILE="src/content/data/techniques.json"

# Counters
total_links=0
valid_links=0
invalid_links=0
warnings=0

echo "🔍 Validating recipe content naming conventions..."
echo "=================================================="

# Function to check if ID exists in data files
check_id_exists() {
    local id="$1"
    local found=false
    
    # Check category files
    if grep -q "\"id\": \"$id\"" "$CATEGORY_DIR"/*.json 2>/dev/null; then
        found=true
    fi
    
    # Check equipment file
    if grep -q "\"id\": \"$id\"" "$EQUIPMENT_FILE" 2>/dev/null; then
        found=true
    fi
    
    # Check techniques file
    if grep -q "\"id\": \"$id\"" "$TECHNIQUES_FILE" 2>/dev/null; then
        found=true
    fi
    
    echo "$found"
}

# Function to get the display name for an ID
get_display_name() {
    local id="$1"
    local name=""
    
    # Try to find name in category files
    name=$(grep -A1 "\"id\": \"$id\"" "$CATEGORY_DIR"/*.json 2>/dev/null | grep '"name":' | head -1 | sed 's/.*"name": "\([^"]*\)".*/\1/')
    
    # If not found in categories, try equipment
    if [ -z "$name" ]; then
        name=$(grep -A1 "\"id\": \"$id\"" "$EQUIPMENT_FILE" 2>/dev/null | grep '"name":' | head -1 | sed 's/.*"name": "\([^"]*\)".*/\1/')
    fi
    
    # If not found in equipment, try techniques
    if [ -z "$name" ]; then
        name=$(grep -A1 "\"id\": \"$id\"" "$TECHNIQUES_FILE" 2>/dev/null | grep '"name":' | head -1 | sed 's/.*"name": "\([^"]*\)".*/\1/')
    fi
    
    echo "$name"
}

# Function to validate wiki-style links
validate_wiki_links() {
    local file="$1"
    local line_number=0
    
    while IFS= read -r line; do
        ((line_number++))
        
        # Find all wiki-style links [[Display Name|id]]
        echo "$line" | grep -o '\[\[[^]]*\]\]' | while read -r link; do
            ((total_links++))
            
            # Extract the ID part (after the |)
            local id=$(echo "$link" | sed 's/.*\[\[.*|\([^]]*\)\]\].*/\1/')
            
            # Skip if no ID found (simple [[name]] links)
            if [ "$id" = "$link" ]; then
                echo -e "${YELLOW}⚠️  WARNING:${NC} Simple wiki link found (no ID) in $file:$line_number"
                echo "   Link: $link"
                echo "   Consider using [[Display Name|id]] format for better integration"
                echo ""
                ((warnings++))
                continue
            fi
            
            # Check if ID exists in data files
            if [ "$(check_id_exists "$id")" = "true" ]; then
                local display_name=$(get_display_name "$id")
                echo -e "${GREEN}✅ VALID:${NC} $file:$line_number - $link"
                if [ -n "$display_name" ]; then
                    echo "   ID: $id -> $display_name"
                fi
                ((valid_links++))
            else
                echo -e "${RED}❌ INVALID:${NC} $file:$line_number - $link"
                echo "   ID '$id' not found in data files"
                echo "   Available IDs can be found with: ./scripts/list-ids.sh"
                echo ""
                ((invalid_links++))
            fi
        done
    done < "$file"
}

# Function to validate recipe IDs
validate_recipe_ids() {
    echo "🔢 Validating recipe IDs..."
    echo "---------------------------"
    
    local recipe_files=$(find "$RECIPE_DIR" -name "*.md" -type f)
    local recipe_ids=()
    local duplicates=()
    
    for file in $recipe_files; do
        local recipe_id=$(grep '^recipeId:' "$file" | head -1 | sed 's/.*recipeId: *"\([^"]*\)".*/\1/')
        
        if [ -n "$recipe_id" ]; then
            # Check if ID is already in use
            if [[ " ${recipe_ids[@]} " =~ " ${recipe_id} " ]]; then
                duplicates+=("$recipe_id")
            else
                recipe_ids+=("$recipe_id")
            fi
            
            # Validate ID format (3-digit number)
            if [[ ! "$recipe_id" =~ ^[0-9]{3}$ ]]; then
                echo -e "${RED}❌ INVALID RECIPE ID:${NC} $file"
                echo "   ID '$recipe_id' is not a 3-digit number"
                echo ""
                ((invalid_links++))
            fi
        fi
    done
    
    # Check for duplicates
    if [ ${#duplicates[@]} -gt 0 ]; then
        echo -e "${RED}❌ DUPLICATE RECIPE IDS:${NC}"
        printf '%s\n' "${duplicates[@]}" | sort | uniq -d | while read -r dup_id; do
            echo "   ID '$dup_id' is used multiple times"
        done
        echo ""
    fi
}

# Main validation
echo "📝 Checking wiki-style links in recipe content..."
echo "------------------------------------------------"

# Find all markdown files in recipe directory
recipe_files=$(find "$RECIPE_DIR" -name "*.md" -type f)

if [ -z "$recipe_files" ]; then
    echo -e "${YELLOW}⚠️  No recipe files found in $RECIPE_DIR${NC}"
    exit 1
fi

# Validate each file
for file in $recipe_files; do
    if [ -f "$file" ]; then
        validate_wiki_links "$file"
    fi
done

# Validate recipe IDs
validate_recipe_ids

# Summary
echo "=================================================="
echo "📊 VALIDATION SUMMARY:"
echo "   Total wiki links found: $total_links"
echo "   Valid links: $valid_links"
echo "   Invalid links: $invalid_links"
echo "   Warnings: $warnings"

if [ $invalid_links -eq 0 ] && [ $warnings -eq 0 ]; then
    echo -e "${GREEN}🎉 All validations passed!${NC}"
    exit 0
elif [ $invalid_links -eq 0 ]; then
    echo -e "${YELLOW}⚠️  Validation passed with warnings${NC}"
    exit 0
else
    echo -e "${RED}❌ Validation failed with $invalid_links errors${NC}"
    exit 1
fi 