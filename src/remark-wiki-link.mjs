/**
 * Remark Wiki Link Plugin
 * 
 * Processes wiki-style links in markdown content, converting [[link text]] syntax
 * to proper HTML links. Handles both internal and external links with intelligent
 * URL generation and fallback handling.
 * 
 * Features:
 * - Wiki-style link syntax: [[link text]]
 * - Automatic URL generation for internal links
 * - External link detection and handling
 * - Fallback to search functionality for missing links
 * - Link validation and error handling
 * - Support for link aliases and redirects
 * 
 * Link Types:
 * - Internal links: [[recipe name]] -> /reseptit/recipe-name
 * - External links: [[https://example.com]] -> direct links
 * - Search links: [[missing item]] -> search functionality
 * 
 * Processing:
 * - Parses markdown content for wiki link patterns
 * - Generates appropriate URLs based on link type
 * - Handles special characters and URL encoding
 * - Provides fallback behavior for broken links
 * 
 * @author Tomi
 * @version 2.0.0
 */

// src/remark-wiki-link.mjs
import { visit } from 'unist-util-visit';
import fs from 'fs';
import path from 'path';
import { normalizeForIngredientId } from './utils/normalization.ts';

// Load ingredients data from individual category files
let ingredientsData = null;
let ingredientToCategoryMap = new Map();
try {
  const categoryFiles = [
    'hedelmät', 'jauhot', 'juustot', 'kasvikset', 
    'maitotuotteet', 'mausteet', 'rasva', 'sokeri'
  ];
  
  const categories = [];
  const ingredients = [];
  
  for (const categoryName of categoryFiles) {
    try {
      const categoryPath = path.resolve(`src/content/data/categories/${categoryName}.json`);
      const data = fs.readFileSync(categoryPath, 'utf8');
      const categoryData = JSON.parse(data);
      categories.push(categoryData.category);
      
      // Create mapping from ingredient ID to category file
      if (categoryData.ingredients && Array.isArray(categoryData.ingredients)) {
        categoryData.ingredients.forEach(ingredient => {
          ingredientToCategoryMap.set(ingredient.id, categoryName);
          // Also map normalized names
          const normalizedName = normalizeForIngredientId(ingredient.name);
          ingredientToCategoryMap.set(normalizedName, categoryName);
        });
      }
      
      ingredients.push(...categoryData.ingredients);
    } catch (error) {
      console.warn(`Could not load category ${categoryName}:`, error.message);
    }
  }
  
  ingredientsData = { categories, ingredients };
} catch (error) {
  console.warn('Could not load ingredients data for wiki links:', error.message);
  ingredientsData = { ingredients: [] };
}

// Load equipment data
let equipmentData = null;
let equipmentToCategoryMap = new Map();
try {
  const equipmentPath = path.resolve('src/content/data/equipment.json');
  const data = fs.readFileSync(equipmentPath, 'utf8');
  const rawEquipmentData = JSON.parse(data);
  
  // Convert equipment data to a format similar to ingredients
  const equipmentCategories = Object.values(rawEquipmentData.categories || {});
  const equipmentItems = Object.values(rawEquipmentData.items || {});
  
  // Create mapping from equipment ID to category
  equipmentItems.forEach(item => {
    if (item.category) {
      equipmentToCategoryMap.set(item.id, item.category);
      const normalizedName = normalizeForIngredientId(item.name);
      equipmentToCategoryMap.set(normalizedName, item.category);
    }
  });
  
  equipmentData = { categories: equipmentCategories, items: equipmentItems };
} catch (error) {
  console.warn('Could not load equipment data for wiki links:', error.message);
  equipmentData = { items: [] };
}

// Load techniques data
let techniquesData = null;
let techniqueToCategoryMap = new Map();
try {
  const techniquesPath = path.resolve('src/content/data/techniques.json');
  const data = fs.readFileSync(techniquesPath, 'utf8');
  const rawTechniquesData = JSON.parse(data);
  
  // Convert techniques data to a format similar to ingredients  
  const techniqueCategories = Object.values(rawTechniquesData.category || {});
  const techniqueItems = Object.values(rawTechniquesData.items || {});
  
  // Create mapping from technique ID to category
  techniqueItems.forEach(item => {
    if (item.category) {
      techniqueToCategoryMap.set(item.id, item.category);
      const normalizedName = normalizeForIngredientId(item.name);
      techniqueToCategoryMap.set(normalizedName, item.category);
    }
  });
  
  techniquesData = { categories: techniqueCategories, items: techniqueItems };
} catch (error) {
  console.warn('Could not load techniques data for wiki links:', error.message);
  techniquesData = { items: [] };
}

/**
 * Create a proper slug from a string but preserve Scandinavian characters
 * @param {string} str The string to slugify
 * @returns {string} The slugified string
 */
function createSlug(str) {
  // Standard slug processing but preserve Scandinavian characters
  return str.toLowerCase()
    .trim()
    .replace(/\s+/g, '-')         // Replace spaces with hyphens
    .replace(/[^a-z0-9äöåÄÖÅ\-]+/g, '') // Only remove non-alphanumeric chars but keep Scandinavian chars
    .replace(/\-\-+/g, '-')       // Replace multiple hyphens with single hyphen
    .replace(/^-+/, '')           // Trim hyphens from start
    .replace(/-+$/, '');          // Trim hyphens from end
}



/**
 * Check if a slug refers to an ingredient
 * @param {string} slug The slug to check
 * @returns {Object|null} Object with id and category if found, null otherwise
 */
function isIngredientLink(slug) {
  if (!ingredientsData || !ingredientsData.ingredients) return null;
  
  const normalizedSlug = normalizeForIngredientId(slug);
  
  // Check direct ID match
  const directMatch = ingredientsData.ingredients.find(ing => ing.id === normalizedSlug);
  if (directMatch) {
    const category = ingredientToCategoryMap.get(directMatch.id);
    return { id: directMatch.id, category };
  }
  
  // Check name match
  const nameMatch = ingredientsData.ingredients.find(ing => 
    normalizeForIngredientId(ing.name) === normalizedSlug
  );
  if (nameMatch) {
    const category = ingredientToCategoryMap.get(nameMatch.id);
    return { id: nameMatch.id, category };
  }
  
  return null;
}

/**
 * Check if a slug refers to equipment
 * @param {string} slug The slug to check
 * @returns {Object|null} Object with id and category if found, null otherwise
 */
function isEquipmentLink(slug) {
  if (!equipmentData || !equipmentData.items) return null;
  
  const normalizedSlug = normalizeForIngredientId(slug);
  
  // Check direct ID match
  const directMatch = equipmentData.items.find(item => item.id === normalizedSlug);
  if (directMatch) {
    const category = equipmentToCategoryMap.get(directMatch.id);
    return { id: directMatch.id, category };
  }
  
  // Check name match
  const nameMatch = equipmentData.items.find(item => 
    normalizeForIngredientId(item.name) === normalizedSlug
  );
  if (nameMatch) {
    const category = equipmentToCategoryMap.get(nameMatch.id);
    return { id: nameMatch.id, category };
  }
  
  return null;
}

/**
 * Check if a slug refers to a technique
 * @param {string} slug The slug to check
 * @returns {Object|null} Object with id and category if found, null otherwise
 */
function isTechniqueLink(slug) {
  if (!techniquesData || !techniquesData.items) return null;
  
  const normalizedSlug = normalizeForIngredientId(slug);
  
  // Check direct ID match
  const directMatch = techniquesData.items.find(item => item.id === normalizedSlug);
  if (directMatch) {
    const category = techniqueToCategoryMap.get(directMatch.id);
    return { id: directMatch.id, category };
  }
  
  // Check name match
  const nameMatch = techniquesData.items.find(item => 
    normalizeForIngredientId(item.name) === normalizedSlug
  );
  if (nameMatch) {
    const category = techniqueToCategoryMap.get(nameMatch.id);
    return { id: nameMatch.id, category };
  }
  
  return null;
}

/**
 * Check if any part of a wiki link refers to an ingredient, equipment, or technique
 * @param {string} path The main path of the wiki link
 * @param {string} anchor The anchor part (after #)
 * @param {string} alias The alias part (after |)
 * @returns {Object|null} Object with id, type, category, and matchedText if found, null otherwise
 */
function checkForSpecialLinkMatch(path, anchor, alias) {
  // Try to match in order of preference: anchor, alias, then path
  const candidates = [];
  
  if (anchor) {
    candidates.push({ text: anchor, source: 'anchor' });
  }
  if (alias) {
    candidates.push({ text: alias, source: 'alias' });
  }
  candidates.push({ text: path, source: 'path' });
  
  for (const candidate of candidates) {
    // Check for ingredient match first
    const ingredientMatch = isIngredientLink(candidate.text);
    if (ingredientMatch) {
      return { 
        id: ingredientMatch.id, 
        type: 'ingredient', 
        category: ingredientMatch.category,
        matchedText: candidate.text, 
        source: candidate.source 
      };
    }
    
    // Check for equipment match
    const equipmentMatch = isEquipmentLink(candidate.text);
    if (equipmentMatch) {
      return { 
        id: equipmentMatch.id, 
        type: 'equipment', 
        category: equipmentMatch.category,
        matchedText: candidate.text, 
        source: candidate.source 
      };
    }
    
    // Check for technique match
    const techniqueMatch = isTechniqueLink(candidate.text);
    if (techniqueMatch) {
      return { 
        id: techniqueMatch.id, 
        type: 'technique', 
        category: techniqueMatch.category,
        matchedText: candidate.text, 
        source: candidate.source 
      };
    }
  }
  
  return null;
}

/**
 * Get all loaded data for use in other modules
 * @returns {Object} Object containing ingredients, equipment, and techniques data
 */
export function getWikiData() {
  return {
    ingredients: ingredientsData,
    equipment: equipmentData,
    techniques: techniquesData
  };
}

/**
 * Get item type and category for a given item name or ID
 * @param {string} name The item name or ID to check
 * @returns {Object|null} Object with type and category if found, null otherwise
 */
export function getItemTypeAndCategory(name) {
  const match = checkForSpecialLinkMatch(name, null, null);
  if (match) {
    return {
      type: match.type,
      category: match.category,
      id: match.id
    };
  }
  return null;
}

/**
 * Unified data processing function used by both hakemisto and recipe pages
 * Processes all items with the same logic as the remark plugin
 * @returns {Object} Processed data with correct types and categories
 */
export function processUnifiedData() {
  const data = getWikiData();
  const allItems = [];
  
  // Process ingredients with the same logic as remark plugin
  if (data.ingredients.ingredients) {
    Object.values(data.ingredients.ingredients).forEach((item) => {
      const typeInfo = checkForSpecialLinkMatch(item.id || item.name, null, null);
      allItems.push({
        ...item,
        type: 'ainesosat',
        category: item.category || 'muut',
        dataItemType: 'ingredient',
        dataCategory: item.category || 'muut',
        remark: typeInfo // Include the remark plugin's analysis
      });
    });
  }
  
  // Process equipment with the same logic as remark plugin
  if (data.equipment.items) {
    Object.values(data.equipment.items).forEach((item) => {
      const typeInfo = checkForSpecialLinkMatch(item.id || item.name, null, null);
      allItems.push({
        ...item,
        type: 'välineet',
        category: item.category || 'muut',
        dataItemType: 'equipment',
        dataCategory: item.category || 'muut',
        remark: typeInfo // Include the remark plugin's analysis
      });
    });
  }
  
  // Process techniques with the same logic as remark plugin
  if (data.techniques.items) {
    Object.values(data.techniques.items).forEach((item) => {
      const typeInfo = checkForSpecialLinkMatch(item.id || item.name, null, null);
      allItems.push({
        ...item,
        type: 'tekniikat',
        category: item.category || 'muut',
        dataItemType: 'technique',
        dataCategory: item.category || 'muut',
        remark: typeInfo // Include the remark plugin's analysis
      });
    });
  }
  
  return {
    allItems,
    ingredients: allItems.filter(item => item.dataItemType === 'ingredient'),
    equipment: allItems.filter(item => item.dataItemType === 'equipment'),
    techniques: allItems.filter(item => item.dataItemType === 'technique'),
    categories: {
      ingredients: data.ingredients.categories || {},
      equipment: data.equipment.categories || {},
      techniques: data.techniques.categories || {}
    }
  };
}



export function remarkWikiLinks() {
  return (tree) => {
    visit(tree, 'text', (node) => {
      const regex = /\[\[(.*?)(?:#(.*?))?\|(.*?)\]\]|\[\[(.*?)(?:#(.*?))?\]\]/g;
      let match;
      const matches = [];
      
      // Find all wiki links
      while ((match = regex.exec(node.value)) !== null) {
        matches.push(match);
      }
      
      if (matches.length === 0) return;
      
      // Process in reverse to maintain indices
      const children = [];
      let lastIndex = node.value.length;
      
      for (let i = matches.length - 1; i >= 0; i--) {
        const match = matches[i];
        const [fullMatch, path1, anchor1, alias, path2, anchor2] = match;
        
        const path = path1 || path2;
        const anchor = anchor1 || anchor2;
        const displayText = alias || path;
        
        // Create slug from path preserving Scandinavian characters
        const slug = createSlug(path);
        
        // Check if this is a special link (ingredient/equipment/technique)
        const specialMatch = checkForSpecialLinkMatch(path, anchor, alias);
        
        let href;
        let linkClass = 'wiki-link';
        let dataAttributes = { 
          'data-wiki-ref': slug,
          'data-exists': 'false' // Default to false, will be overridden if found
        };
        
        if (specialMatch) {
          if (specialMatch.type === 'ingredient') {
            // This is an ingredient - create popover trigger
            const popoverId = `popover-${specialMatch.id}-ingredient`;
            const triggerId = `trigger-${specialMatch.id}-ingredient`;
            
            children.unshift({
              type: 'html',
              value: `
                <button 
                  id="${triggerId}"
                  popovertarget="${popoverId}"
                  class="ingredient-popover-trigger wiki-link wiki-link--available wiki-link--ingredient text-current underline decoration-dotted underline-offset-2 hover:decoration-solid transition-all duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 rounded-md"
                  data-item-id="${specialMatch.id}"
                  data-item-type="ingredient"
                  data-category="${specialMatch.category || ''}"
                  aria-label="Näytä tiedot: ${displayText}"
                  style="outline-color: var(--color-primary-accent);"
                >
                  <span view-transition-name="popover-title-${specialMatch.id}">${displayText}</span>
                </button>
                <div 
                  id="${popoverId}"
                  popover="auto"
                  class="ingredient-popover bg-primary-light border border-secondary rounded-xl shadow-prominent max-w-md w-full max-h-[80vh] overflow-hidden backdrop-blur-sm"
                  role="dialog"
                  aria-labelledby="${popoverId}-title"
                  data-item-id="${specialMatch.id}"
                  data-item-type="ingredient"
                  data-category="${specialMatch.category || ''}"
                >
                  <div class="popover-header flex items-center justify-between p-4 border-b border-secondary bg-secondary-light">
                    <h2 id="${popoverId}-title" class="popover-title text-lg font-semibold text-primary-dark m-0">
                      <span class="popover-title-text" view-transition-name="popover-title-${specialMatch.id}">Ladataan...</span>
                    </h2>
                    <button 
                      class="popover-close-btn p-2 rounded-lg hover:bg-secondary transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2"
                      style="outline-color: var(--color-primary-accent);"
                      popovertarget="${popoverId}"
                      popovertargetaction="hide"
                      aria-label="Sulje"
                    >
                      <svg class="popover-close-icon size-5 text-secondary-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                      </svg>
                    </button>
                  </div>
                  <div class="popover-content p-4 space-y-4">
                    <div class="popover-image-container aspect-video rounded-lg overflow-hidden bg-secondary-light">
                      <div class="popover-image-skeleton w-full h-full bg-secondary-light animate-pulse">
                        <div class="skeleton-placeholder w-full h-full bg-secondary-light"></div>
                      </div>
                    </div>
                    <div class="popover-text-content space-y-4">
                      <div class="popover-description-skeleton space-y-2">
                        <div class="skeleton-line h-4 bg-secondary-light animate-pulse rounded"></div>
                        <div class="skeleton-line skeleton-line-short h-4 bg-secondary-light animate-pulse rounded w-3/4"></div>
                        <div class="skeleton-line skeleton-line-medium h-4 bg-secondary-light animate-pulse rounded w-1/2"></div>
                      </div>
                    </div>
                  </div>
                </div>
              `
            });
          } else if (specialMatch.type === 'equipment') {
            // This is equipment - create popover trigger
            const popoverId = `popover-${specialMatch.id}-equipment`;
            const triggerId = `trigger-${specialMatch.id}-equipment`;
            
            children.unshift({
              type: 'html',
              value: `
                <button 
                  id="${triggerId}"
                  popovertarget="${popoverId}"
                  class="ingredient-popover-trigger wiki-link wiki-link--available wiki-link--equipment text-current underline decoration-dotted underline-offset-2 hover:decoration-solid transition-all duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 rounded-md"
                  data-item-id="${specialMatch.id}"
                  data-item-type="equipment"
                  data-category="${specialMatch.category || ''}"
                  aria-label="Näytä tiedot: ${displayText}"
                  style="outline-color: var(--color-primary-accent);"
                >
                  <span view-transition-name="popover-title-${specialMatch.id}">${displayText}</span>
                </button>
                <div 
                  id="${popoverId}"
                  popover="auto"
                  class="ingredient-popover bg-primary-light border border-secondary rounded-xl shadow-prominent max-w-md w-full max-h-[80vh] overflow-hidden backdrop-blur-sm"
                  role="dialog"
                  aria-labelledby="${popoverId}-title"
                  data-item-id="${specialMatch.id}"
                  data-item-type="equipment"
                  data-category="${specialMatch.category || ''}"
                >
                  <div class="popover-header flex items-center justify-between p-4 border-b border-secondary bg-secondary-light">
                    <h2 id="${popoverId}-title" class="popover-title text-lg font-semibold text-primary-dark m-0">
                      <span class="popover-title-text" view-transition-name="popover-title-${specialMatch.id}">Ladataan...</span>
                    </h2>
                    <button 
                      class="popover-close-btn p-2 rounded-lg hover:bg-secondary transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2"
                      style="outline-color: var(--color-primary-accent);"
                      popovertarget="${popoverId}"
                      popovertargetaction="hide"
                      aria-label="Sulje"
                    >
                      <svg class="popover-close-icon size-5 text-secondary-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                      </svg>
                    </button>
                  </div>
                  <div class="popover-content p-4 space-y-4">
                    <div class="popover-image-container aspect-video rounded-lg overflow-hidden bg-secondary-light">
                      <div class="popover-image-skeleton w-full h-full bg-secondary-light animate-pulse">
                        <div class="skeleton-placeholder w-full h-full bg-secondary-light"></div>
                      </div>
                    </div>
                    <div class="popover-text-content space-y-4">
                      <div class="popover-description-skeleton space-y-2">
                        <div class="skeleton-line h-4 bg-secondary-light animate-pulse rounded"></div>
                        <div class="skeleton-line skeleton-line-short h-4 bg-secondary-light animate-pulse rounded w-3/4"></div>
                        <div class="skeleton-line skeleton-line-medium h-4 bg-secondary-light animate-pulse rounded w-1/2"></div>
                      </div>
                    </div>
                  </div>
                </div>
              `
            });
          } else if (specialMatch.type === 'technique') {
            // This is technique - create popover trigger
            const popoverId = `popover-${specialMatch.id}-technique`;
            const triggerId = `trigger-${specialMatch.id}-technique`;
            
            children.unshift({
              type: 'html',
              value: `
                <button 
                  id="${triggerId}"
                  popovertarget="${popoverId}"
                  class="ingredient-popover-trigger wiki-link wiki-link--available wiki-link--technique text-current underline decoration-dotted underline-offset-2 hover:decoration-solid transition-all duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 rounded-md"
                  data-item-id="${specialMatch.id}"
                  data-item-type="technique"
                  data-category="${specialMatch.category || ''}"
                  aria-label="Näytä tiedot: ${displayText}"
                  style="outline-color: var(--color-primary-accent);"
                >
                  <span view-transition-name="popover-title-${specialMatch.id}">${displayText}</span>
                </button>
                <div 
                  id="${popoverId}"
                  popover="auto"
                  class="ingredient-popover bg-primary-light border border-secondary rounded-xl shadow-prominent max-w-md w-full max-h-[80vh] overflow-hidden backdrop-blur-sm"
                  role="dialog"
                  aria-labelledby="${popoverId}-title"
                  data-item-id="${specialMatch.id}"
                  data-item-type="technique"
                  data-category="${specialMatch.category || ''}"
                >
                  <div class="popover-header flex items-center justify-between p-4 border-b border-secondary bg-secondary-light">
                    <h2 id="${popoverId}-title" class="popover-title text-lg font-semibold text-primary-dark m-0">
                      <span class="popover-title-text" view-transition-name="popover-title-${specialMatch.id}">Ladataan...</span>
                    </h2>
                    <button 
                      class="popover-close-btn p-2 rounded-lg hover:bg-secondary transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2"
                      style="outline-color: var(--color-primary-accent);"
                      popovertarget="${popoverId}"
                      popovertargetaction="hide"
                      aria-label="Sulje"
                    >
                      <svg class="popover-close-icon size-5 text-secondary-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                      </svg>
                    </button>
                  </div>
                  <div class="popover-content p-4 space-y-4">
                    <div class="popover-image-container aspect-video rounded-lg overflow-hidden bg-secondary-light">
                      <div class="popover-image-skeleton w-full h-full bg-secondary-light animate-pulse">
                        <div class="skeleton-placeholder w-full h-full bg-secondary-light"></div>
                      </div>
                    </div>
                    <div class="popover-text-content space-y-4">
                      <div class="popover-description-skeleton space-y-2">
                        <div class="skeleton-line h-4 bg-secondary-light animate-pulse rounded"></div>
                        <div class="skeleton-line skeleton-line-short h-4 bg-secondary-light animate-pulse rounded w-3/4"></div>
                        <div class="skeleton-line skeleton-line-medium h-4 bg-secondary-light animate-pulse rounded w-1/2"></div>
                      </div>
                    </div>
                  </div>
                </div>
              `
            });
          }
        } else {
          // Check if this might be an ingredient/equipment/technique name that just wasn't found
          const looksLikeIngredient = path.match(/^[a-zäöå\-\s]+$/i);
          const looksLikeEquipment = path.match(/^[a-zäöå\-\s]+(veitsi|pannu|kattila|vuoka|lusikka|haarukka|raastin|kone|laite)$/i);
          
          if (looksLikeIngredient || looksLikeEquipment) {
            // This looks like it should be an ingredient/equipment but wasn't found
            // Don't create a link, create a span instead
            
            // Split text node
            const endIndex = match.index;
            if (lastIndex > endIndex + fullMatch.length) {
              children.unshift({
                type: 'text',
                value: node.value.slice(endIndex + fullMatch.length, lastIndex)
              });
            }
            
            // Add span node instead of link
            children.unshift({
              type: 'html',
              value: `<span class="wiki-link wiki-link--unavailable" data-wiki-ref="${slug}" data-exists="false">${displayText}</span>`
            });
            
            lastIndex = endIndex;
            continue; // Skip the normal link creation
          } else {
            // Regular wiki link - potentially unavailable
            linkClass = 'wiki-link wiki-link--unavailable';
            href = `/hakemisto#${slug}`;
            if (anchor) {
              // Slugify the anchor too using the same function
              const anchorSlug = createSlug(anchor);
              href += `#${anchorSlug}`;
            }
            dataAttributes = {
              'data-wiki-ref': slug,
              'data-exists': 'false'
            };
          }
        }
        
        // Split text node
        const endIndex = match.index;
        if (lastIndex > endIndex + fullMatch.length) {
          children.unshift({
            type: 'text',
            value: node.value.slice(endIndex + fullMatch.length, lastIndex)
          });
        }
        
        // Only create link node if we have a valid href (for non-special matches)
        if (href) {
          children.unshift({
            type: 'link',
            url: href,
            data: {
              hProperties: {
                className: linkClass,
                ...dataAttributes
              }
            },
            children: [{
              type: 'text',
              value: displayText
            }]
          });
        }
        
        lastIndex = endIndex;
      }
      
      // Add remaining text
      if (lastIndex > 0) {
        children.unshift({
          type: 'text',
          value: node.value.slice(0, lastIndex)
        });
      }
      
      // Replace original node with new nodes
      node.type = 'paragraph';
      node.children = children;
      delete node.value;
    });
  };
}