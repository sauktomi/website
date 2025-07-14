#!/bin/bash
# list-ids.sh
# 
# Helper script to list all available ingredient, equipment, and technique IDs
# Useful for content writers to find correct IDs for wiki-style links
#
# Usage: ./scripts/list-ids.sh [category]
#        ./scripts/list-ids.sh ingredients
#        ./scripts/list-ids.sh equipment
#        ./scripts/list-ids.sh techniques
# 
# @author Tomi
# @version 1.0.0

set -e

# Colors for output
BLUE='\033[0;34m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Directories and files
CATEGORY_DIR="src/content/data/categories"
EQUIPMENT_FILE="src/content/data/equipment.json"
TECHNIQUES_FILE="src/content/data/techniques.json"

# Function to list ingredient IDs
list_ingredients() {
    echo -e "${BLUE}🍎 INGREDIENT IDS:${NC}"
    echo "=================="
    
    for file in "$CATEGORY_DIR"/*.json; do
        if [ -f "$file" ]; then
            category_name=$(basename "$file" .json)
            echo -e "${YELLOW}$category_name:${NC}"
            
            # Extract ID and name pairs
            awk -F'"' '
            /"id":/ && !/category/ {
                id=$4
                getline
                if($0 ~ /"name":/) {
                    name=$4
                    printf "  %-20s -> %s\n", id, name
                }
            }' "$file" | sort
            echo ""
        fi
    done
}

# Function to list equipment IDs
list_equipment() {
    echo -e "${BLUE}🔧 EQUIPMENT IDS:${NC}"
    echo "=================="
    
    # Extract equipment categories and their items
    awk -F'"' '
    /"id":/ && /category/ {
        category_id=$4
        getline
        if($0 ~ /"name":/) {
            category_name=$4
            printf "\n%s (%s):\n", category_name, category_id
        }
    }
    /"id":/ && !/category/ {
        id=$4
        getline
        if($0 ~ /"name":/) {
            name=$4
            printf "  %-25s -> %s\n", id, name
        }
    }' "$EQUIPMENT_FILE" | sort
}

# Function to list technique IDs
list_techniques() {
    echo -e "${BLUE}👨‍🍳 TECHNIQUE IDS:${NC}"
    echo "=================="
    
    # Extract technique categories and their items
    awk -F'"' '
    /"id":/ && /category/ {
        category_id=$4
        getline
        if($0 ~ /"name":/) {
            category_name=$4
            printf "\n%s (%s):\n", category_name, category_id
        }
    }
    /"id":/ && !/category/ {
        id=$4
        getline
        if($0 ~ /"name":/) {
            name=$4
            printf "  %-25s -> %s\n", id, name
        }
    }' "$TECHNIQUES_FILE" | sort
}

# Function to list all IDs
list_all() {
    list_ingredients
    echo ""
    list_equipment
    echo ""
    list_techniques
}

# Function to search for specific ID
search_id() {
    local search_term="$1"
    echo -e "${BLUE}🔍 SEARCHING FOR: '$search_term'${NC}"
    echo "================================"
    
    # Search in ingredients
    echo -e "${YELLOW}Ingredients:${NC}"
    for file in "$CATEGORY_DIR"/*.json; do
        if [ -f "$file" ]; then
            awk -F'"' -v search="$search_term" '
            /"id":/ && !/category/ && $4 ~ search {
                id=$4
                getline
                if($0 ~ /"name":/) {
                    name=$4
                    printf "  %-20s -> %s\n", id, name
                }
            }' "$file"
        fi
    done
    
    # Search in equipment
    echo -e "${YELLOW}Equipment:${NC}"
    awk -F'"' -v search="$search_term" '
    /"id":/ && !/category/ && $4 ~ search {
        id=$4
        getline
        if($0 ~ /"name":/) {
            name=$4
            printf "  %-20s -> %s\n", id, name
        }
    }' "$EQUIPMENT_FILE"
    
    # Search in techniques
    echo -e "${YELLOW}Techniques:${NC}"
    awk -F'"' -v search="$search_term" '
    /"id":/ && !/category/ && $4 ~ search {
        id=$4
        getline
        if($0 ~ /"name":/) {
            name=$4
            printf "  %-20s -> %s\n", id, name
        }
    }' "$TECHNIQUES_FILE"
}

# Function to show usage
show_usage() {
    echo "Usage: $0 [category|search_term]"
    echo ""
    echo "Categories:"
    echo "  ingredients  - List all ingredient IDs"
    echo "  equipment    - List all equipment IDs"
    echo "  techniques   - List all technique IDs"
    echo "  all          - List all IDs (default)"
    echo ""
    echo "Search:"
    echo "  Any term     - Search for IDs containing the term"
    echo ""
    echo "Examples:"
    echo "  $0                    # List all IDs"
    echo "  $0 ingredients        # List only ingredient IDs"
    echo "  $0 paistin            # Search for IDs containing 'paistin'"
    echo "  $0 appelsiini         # Search for 'appelsiini'"
}

# Main script logic
case "${1:-all}" in
    "ingredients"|"ingredient"|"i")
        list_ingredients
        ;;
    "equipment"|"equip"|"e")
        list_equipment
        ;;
    "techniques"|"technique"|"t")
        list_techniques
        ;;
    "all"|"a")
        list_all
        ;;
    "help"|"h"|"-h"|"--help")
        show_usage
        ;;
    *)
        # Check if it's a search term
        if [ -n "$1" ]; then
            search_id "$1"
        else
            list_all
        fi
        ;;
esac

echo ""
echo -e "${GREEN}💡 Tip: Use these IDs in wiki-style links like [[Display Name|id]]${NC}"
echo -e "${GREEN}💡 Run './scripts/validate-names.sh' to check your content for valid IDs${NC}" 