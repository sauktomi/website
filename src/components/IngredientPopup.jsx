import { useEffect, useRef, useState } from 'preact/hooks';
import { normalizeForIngredientId } from '../utils/normalization.js';

// Get optimized image URL from item data
const getOptimizedImageUrl = (item, size = 'large') => {
  // Check if the item has optimized images embedded
  if (item && item.optimizedImages && item.optimizedImages[size]) {
    return item.optimizedImages[size];
  }
  
  // Fallback: construct URL from original imageUrl
  if (item && item.imageUrl) {
    const lastDotIndex = item.imageUrl.lastIndexOf('.');
    if (lastDotIndex > 0) {
      const basePath = item.imageUrl.substring(0, lastDotIndex);
      return `${basePath}-${size}.webp`;
    }
  }
  
  return null;
};

// Dynamic imports for better performance - only load data when needed

export default function EnhancedPopup() {
  const popupRef = useRef(null);
  const closeButtonRef = useRef(null);
  const imageContainerRef = useRef(null);
  const contentRef = useRef(null);

  const [isOpen, setIsOpen] = useState(false);
  const [currentItem, setCurrentItem] = useState(null);
  const [currentItemType, setCurrentItemType] = useState(null);
  const [isInitialized, setIsInitialized] = useState(false);

  const FLAVOR_NAMES = {
    sweetness: "Makeus",
    saltiness: "Suolaisuus", 
    sourness: "Happamuus",
    bitterness: "Karvaus",
    umami: "Umami"
  };

  // Use the same normalization function as remark-wiki-link.mjs
  const normalizeNordicChars = (str) => {
    if (!str) return '';
    return normalizeForIngredientId(str);
  };

  const createCard = (title, content) => {
    return `<div class="popup-card"><h2>${title}</h2>${content}</div>`;
  };

  const createSection = (header, content, className = '') => {
    return `<div class="${className}"><h3 class="popup-section-header">${header}</h3>${content}</div>`;
  };

  const showPopupSkeleton = () => {
    if (!popupRef.current) return;
    
    // Show popup immediately
    setIsOpen(true);
    document.body.classList.add('overflow-hidden');
    
    // Show loading skeleton in image container
    if (imageContainerRef.current) {
      imageContainerRef.current.innerHTML = `
        <div class="relative w-full h-full bg-gray-200 animate-pulse rounded-lg">
          <div class="w-full aspect-[16/9] md:aspect-none md:h-full flex items-center justify-center">
            <div class="text-gray-400">Loading...</div>
          </div>
        </div>
      `;
    }
    
    // Show loading skeleton in content
    if (contentRef.current) {
      contentRef.current.innerHTML = `
        <div class="popup-card">
          <div class="h-6 bg-gray-200 animate-pulse rounded mb-4"></div>
          <div class="space-y-3">
            <div class="h-4 bg-gray-200 animate-pulse rounded"></div>
            <div class="h-4 bg-gray-200 animate-pulse rounded w-3/4"></div>
            <div class="h-4 bg-gray-200 animate-pulse rounded w-1/2"></div>
          </div>
        </div>
      `;
    }
  };

  const showPopupError = (message) => {
    if (imageContainerRef.current) {
      imageContainerRef.current.innerHTML = `
        <div class="relative w-full h-full bg-red-50 rounded-lg flex items-center justify-center">
          <div class="text-center text-red-600">
            <h1 class="text-xl font-bold mb-2">Ei löytynyt</h1>
            <p class="text-sm">${message}</p>
          </div>
        </div>
      `;
    }
    
    if (contentRef.current) {
      contentRef.current.innerHTML = `
        <div class="popup-card">
          <h2>Ei löytynyt</h2>
          <p class="text-red-600 mb-4">${message}</p>
          <p class="text-gray-600">
            Löydät kaikki ainesosat, välineet ja tekniikat 
            <a href="/hakemisto" class="text-blue-600 hover:text-blue-800 underline">hakemistosta</a>.
          </p>
        </div>
      `;
    }
  };

  /**
   * Simplified popup opening - load data and show result
   * @param {string} itemId - The item ID
   * @param {string} itemType - The item type (ingredient/equipment/technique)  
   * @param {string} category - The category name
   */
  const openPopupWithSmartLoading = async (itemId, itemType, category) => {
    if (!itemId) return;
    
    // Show skeleton immediately
    showPopupSkeleton();
    
    try {
      let data = null;
      if (itemType === 'ingredient' && category) {
        const categoryModule = await import(`../content/data/categories/${category}.json`);
        data = categoryModule.default;
      } else if (itemType === 'equipment') {
        const equipmentModule = await import('../content/data/equipment.json');
        data = equipmentModule.default;
      } else if (itemType === 'technique') {
        const techniquesModule = await import('../content/data/techniques.json');
        data = techniquesModule.default;
      }
      
      // Find the item in the loaded data
      let item = null;
      const normalizedSearchId = normalizeNordicChars(itemId);
      
      if (itemType === 'ingredient' && data?.ingredients) {
        item = data.ingredients.find(ing => 
          ing.id === itemId || 
          ing.id === normalizedSearchId ||
          normalizeNordicChars(ing.id) === normalizedSearchId
        );
      } else if (itemType === 'equipment' && data?.items) {
        const items = Object.values(data.items);
        item = items.find(eq => 
          eq.id === itemId || 
          eq.id === normalizedSearchId ||
          normalizeNordicChars(eq.id) === normalizedSearchId
        );
      } else if (itemType === 'technique' && data?.items) {
        const items = Object.values(data.items);
        item = items.find(tech => 
          tech.id === itemId || 
          tech.id === normalizedSearchId ||
          normalizeNordicChars(tech.id) === normalizedSearchId
        );
      }
      
      if (item) {
        // Found it - show the content
        populatePopupContent(item, itemType);
      } else {
        // Not found - show error
        showPopupError(`Item "${itemId}" not found`);
      }
      
    } catch (error) {
      console.error('Failed to load popup data:', error);
      showPopupError(`Failed to load data for "${itemId}"`);
    }
  };

  const populatePopupContent = (item, itemType) => {
    if (!item) return;
    
    setCurrentItem(item);
    setCurrentItemType(itemType);
    
    // Update image using the renderImage function
    if (imageContainerRef.current) {
      imageContainerRef.current.innerHTML = renderImage(item, itemType);
    }
    
    // Update content using the generateTemplate function
    if (contentRef.current) {
      contentRef.current.innerHTML = generateTemplate(item, itemType);
    }
    
    // Update URL hash
    const normalizedId = normalizeNordicChars(item.id);
    history.replaceState(null, null, `#${normalizedId}`);
  };

  const generateIngredientProfile = (item) => {
    let content = '<div class="popup-profile-content">';
    let description = `<span class="popup-profile-main">${item.description || 'Ei kuvausta saatavilla.'}</span>`;
    if (item.production) description += `<span class="popup-profile-secondary">${item.production}</span>`;
    if (item.science) description += `<span class="popup-profile-secondary">${item.science}</span>`;
    content += `<div class="popup-profile-description">${description}</div>`;
    
    let gridContent = '';
    if (item.flavorProfile) {
      const flavorEntries = Object.entries(item.flavorProfile).filter(([_, value]) => Number(value) > 0);
      if (flavorEntries.length > 0) {
        const flavorBars = flavorEntries.map(([key, value]) => 
          `<div class="popup-flavor-bar">
            <div class="popup-flavor-header">
              <h4 class="popup-flavor-label">${FLAVOR_NAMES[key] || key}</h4>
              <span class="popup-flavor-score">${Number(value)}/10</span>
            </div>
          </div>`
        ).join('');
        gridContent += createSection('Makuprofiili', `<div class="popup-flavor-bars">${flavorBars}</div>`, 'popup-flavor-section');
      }
    }
    
    if (item.sensoryProfile) {
      const sensoryItems = ['aroma', 'texture', 'taste']
        .filter(key => item.sensoryProfile[key])
        .map(key => {
          const labels = { aroma: 'Tuoksu', texture: 'Rakenne', taste: 'Maku' };
          return `<div class="popup-sensory-item">
            <span class="popup-sensory-label">${labels[key]}</span>
            <p class="popup-sensory-value">${item.sensoryProfile[key]}</p>
          </div>`;
        }).join('');
      if (sensoryItems) {
        gridContent += createSection('Aistihavainnot', `<div class="popup-sensory-grid">${sensoryItems}</div>`);
      }
    }
    
    if (gridContent) {
      content += `<div class="popup-profile-grid">${gridContent}</div>`;
    }
    return content + '</div>';
  };

  const generateEquipmentProfile = (item) => {
    let content = '<div class="popup-profile-content">';
    let description = `<span class="popup-profile-main">${item.description || 'Ei kuvausta saatavilla.'}</span>`;
    content += `<div class="popup-profile-description">${description}</div>`;
    
    let gridContent = '';
    if (item.properties) {
      const propertyItems = Object.entries(item.properties)
        .map(([key, value]) => `<dl class="popup-property-item"><dt>${key}</dt><dd>${String(value)}</dd></dl>`)
        .join('');
      if (propertyItems) {
        gridContent += `<div class="popup-properties-list">${propertyItems}</div>`;
      }
    }
    
    if (item.care) {
      gridContent += `<dl class="popup-property-item"><dt>Hoito</dt><dd>${item.care}</dd></dl>`;
    }
    if (item.difficulty) {
      gridContent += `<dl class="popup-property-item"><dt>Vaikeustaso</dt><dd>${item.difficulty}</dd></dl>`;
    }
    if (item.timeRequired) {
      gridContent += `<dl class="popup-property-item"><dt>Aika</dt><dd>${item.timeRequired}</dd></dl>`;
    }
    
    if (gridContent) {
      content += `<div class="popup-profile-grid">${gridContent}</div>`;
    }
    return content + '</div>';
  };

  const generateTechniqueProfile = (item) => {
    let content = '<div class="popup-profile-content">';
    let description = `<span class="popup-profile-main">${item.description || 'Ei kuvausta saatavilla.'}</span>`;
    if (item.science) description += `<span class="popup-profile-secondary"><strong>Tiede:</strong> ${item.science}</span>`;
    content += `<div class="popup-profile-description">${description}</div>`;
    
    let gridContent = '';
    if (item.properties) {
      const propertyItems = Object.entries(item.properties)
        .map(([key, value]) => `<dl class="popup-property-item"><dt>${key}</dt><dd>${String(value)}</dd></dl>`)
        .join('');
      if (propertyItems) {
        gridContent += `<div class="popup-properties-list">${propertyItems}</div>`;
      }
    }
    
    if (item.difficulty) {
      gridContent += `<dl class="popup-property-item"><dt>Vaikeustaso</dt><dd>${item.difficulty}</dd></dl>`;
    }
    if (item.timeRequired) {
      gridContent += `<dl class="popup-property-item"><dt>Aika</dt><dd>${item.timeRequired}</dd></dl>`;
    }
    
    if (gridContent) {
      content += `<div class="popup-profile-grid">${gridContent}</div>`;
    }
    return content + '</div>';
  };

  const generateKitchenSection = (item, itemType) => {
    if (itemType === 'technique') {
      let content = '';
      
      if (item.equipment && Array.isArray(item.equipment) && item.equipment.length > 0) {
        const equipmentList = item.equipment.map(eq => `<li class="popup-equipment-item">${eq}</li>`).join('');
        content += createSection('Tarvittavat välineet', `<ul class="popup-equipment-list">${equipmentList}</ul>`);
      }
      
      if (item.techniques && Array.isArray(item.techniques) && item.techniques.length > 0) {
        const techniquesList = item.techniques.map(tech => `<li class="popup-technique-item">${tech}</li>`).join('');
        content += createSection('Liittyvät tekniikat', `<ul class="popup-techniques-list">${techniquesList}</ul>`);
      }
      
      return content;
    }
    
    // Original kitchen content for ingredients and equipment
    const hasKitchenInfo = (item.properties && Object.keys(item.properties).length > 0) || 
                          (item.alternatives && ((Array.isArray(item.alternatives) && item.alternatives.length > 0) || typeof item.alternatives === 'string')) ||
                          (item.techniques && Array.isArray(item.techniques) && item.techniques.length > 0) ||
                          (item.equipment && Array.isArray(item.equipment) && item.equipment.length > 0) ||
                          (item.relatedTechniques && Array.isArray(item.relatedTechniques) && item.relatedTechniques.length > 0) ||
                          item.care || item.difficulty || item.timeRequired;
    if (!hasKitchenInfo) return '';
    
    let content = '';
    if (item.techniques && Array.isArray(item.techniques) && item.techniques.length > 0) {
      const techniquesList = item.techniques.map(tech => `<li class="popup-technique-item">${tech}</li>`).join('');
      content += createSection('Tekniikat', `<ul class="popup-techniques-list">${techniquesList}</ul>`);
    }
    
    return content;
  };

  const generateTemplate = (item, itemType) => {
    if (!item) return '';
    let template = '';
    
    // Remove custom ID generation and use standard CSS classes
    template += `<div class="popup-content-section space-y-6">`;
    
    // Profile section
    template += '<div class="popup-card"><h2>Profiili</h2>';
    switch(itemType) {
      case 'ingredient':
        template += generateIngredientProfile(item);
        break;
      case 'equipment':
        template += generateEquipmentProfile(item);
        break;
      case 'technique':
        template += generateTechniqueProfile(item);
        break;
    }
    template += '</div>';
    
    // Kitchen/Usage section
    const kitchenContent = generateKitchenSection(item, itemType);
    if (kitchenContent) {
      const sectionTitle = itemType === 'technique' ? 'Käytäntö' : 'Keittiössä';
      template += `<div class="popup-card"><h2>${sectionTitle}</h2>${kitchenContent}</div>`;
    }
    
    // Variants section
    if (item.variants && item.variants.length > 0) {
      template += '<div class="popup-card"><h2>Variantit</h2>';
      template += '<div class="popup-variants-section"><div class="popup-variants-container">';
      item.variants.forEach(variant => {
        template += `<div class="popup-variant-item">
            <div class="popup-variant-name">${variant.name}</div>
            <div class="popup-variant-description">${variant.description || ''}</div>
          </div>`;
      });
      template += '</div></div></div>';
    }
    
    // Tips section
    if (item.tips && item.tips.length > 0) {
      template += '<div class="popup-card"><h2>Vinkit</h2>';
      template += '<div class="popup-tips-grid">';
      item.tips.forEach(tip => {
        template += `<div class="popup-tip-item">
            <svg class="popup-tip-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path>
            </svg>
            <span class="popup-tip-text">${tip}</span>
          </div>`;
      });
      template += '</div></div>';
    }
    
    // Safety section
    if (item.safety && Array.isArray(item.safety) && item.safety.length > 0) {
      template += '<div class="popup-card"><h2>Turvallisuus</h2>';
      template += `<div class="p-6"><ul>${item.safety.map(s => `<li class="popup-safety-item">${s}</li>`).join('')}</ul></div>`;
      template += '</div>';
    }
    
    // Sourcing section (for ingredients)
    if (item.sourcing && itemType === 'ingredient') {
      template += '<div class="popup-card"><h2>Hankkiminen</h2>';
      template += `<div class="p-6"><p>${item.sourcing}</p></div>`;
      template += '</div>';
    }
    
    template += '</div>';
    return template;
  };

  const closePopup = () => {
    if (!popupRef.current) return;
    setIsOpen(false);
    setCurrentItem(null);
    setCurrentItemType(null);
    document.body.classList.remove('overflow-hidden');
    if (window.location.hash) {
      history.pushState('', document.title, window.location.pathname + window.location.search);
    }
  };

  const handleHashNavigation = () => {
    const hash = window.location.hash;
    if (!hash) return;
    let itemId = null;
    let itemType = null;
    
    if (hash.startsWith('#ing-') || hash.startsWith('#eq-') || hash.startsWith('#tech-')) {
      itemId = hash.substring(hash.indexOf('-') + 1);
      if (hash.startsWith('#ing-')) itemType = 'ingredient';
      else if (hash.startsWith('#eq-')) itemType = 'equipment';
      else if (hash.startsWith('#tech-')) itemType = 'technique';
    } else if (hash.startsWith('#')) {
      itemId = hash.substring(1);
    }
    
    if (itemId) {
      // Try to find a link on the page with this hash to get category info
      const existingLink = document.querySelector(`a[href="#${itemId}"][data-category]`);
      const category = existingLink?.getAttribute('data-category') || null;
      const linkItemType = existingLink?.getAttribute('data-item-type') || itemType;
      
      openPopupWithSmartLoading(itemId, linkItemType, category);
    }
  };

  useEffect(() => {
    // Initialize component
    setIsInitialized(true);
    
    // Provide a simple API for opening popups
    window.initEnhancedPopup = async () => {
      return {
        openPopup: openPopupWithSmartLoading,
        closePopup
      };
    };
  }, []);

  useEffect(() => {
    if (!isInitialized) return;
    
    const handleCloseClick = (e) => {
      e.preventDefault();
      closePopup();
    };
    
    if (closeButtonRef.current) {
      closeButtonRef.current.addEventListener('click', handleCloseClick);
    }
    
    const handleDocumentClick = (event) => {
      // Universal popup link handling – check for popup handler data attribute
      const link = event.target.closest('a[href^="#"]');
      if (link && link.getAttribute('href')) {
        // Check if this link has popup handler data attributes
        const hasPopupHandler = link.getAttribute('data-popup-handler') === 'true';
        if (!hasPopupHandler) return;
        
        const href = link.getAttribute('href');
        let itemId = null;
        if (href.startsWith('#ing-') || href.startsWith('#eq-') || href.startsWith('#tech-')) {
          itemId = href.substring(href.indexOf('-') + 1);
        } else if (href.startsWith('#')) {
          itemId = href.substring(1);
        }

        if (itemId) {
          event.preventDefault();
          
          // Get item type and category from data attributes
          const itemType = link.getAttribute('data-item-type') || null;
          const category = link.getAttribute('data-category') || null;
          
          openPopupWithSmartLoading(itemId, itemType, category);
          return;
        }
      }
      
      if (isOpen && popupRef.current && !event.target.closest('.popup-content-container') && 
          !event.target.closest('.popup-close-btn') && !event.target.closest('.wiki-link--ingredient, .ingredient-link, .wiki-link--equipment, .equipment-link, .wiki-link--technique, .technique-link')) {
        closePopup();
      }
    };
    
    document.addEventListener('click', handleDocumentClick);
    
    const handleKeyDown = (event) => {
      if (event.key === 'Escape' && isOpen) {
        closePopup();
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    
    const handleHashChange = () => {
      handleHashNavigation();
    };
    
    window.addEventListener('hashchange', handleHashChange);
    handleHashNavigation();
    
    const addClickHandlersToLinks = () => {
      document.querySelectorAll('.wiki-link--ingredient, .ingredient-link, .wiki-link--equipment, .equipment-link, .wiki-link--technique, .technique-link').forEach(link => {
        if (!link.hasAttribute('data-click-handler-added')) {
          link.setAttribute('data-click-handler-added', 'true');
          link.addEventListener('click', (e) => {
            // Only handle links that have popup handler attribute
            const hasPopupHandler = link.getAttribute('data-popup-handler') === 'true';
            if (!hasPopupHandler) return;
            
            const href = link.getAttribute('href');
            if (!href) return;
            let itemId = null;
            if (href.startsWith('#ing-') || href.startsWith('#eq-') || href.startsWith('#tech-')) {
              itemId = href.substring(href.indexOf('-') + 1);
            } else if (href.startsWith('#')) {
              itemId = href.substring(1);
            }
            if (itemId) {
              e.preventDefault();
              
              // Get item type and category from data attributes
              const itemType = link.getAttribute('data-item-type') || null;
              const category = link.getAttribute('data-category') || null;
              
              openPopupWithSmartLoading(itemId, itemType, category);
            }
          });
        }
      });
    };
    
    addClickHandlersToLinks();
    const linkCheckInterval = setInterval(addClickHandlersToLinks, 2000);
    
    return () => {
      document.removeEventListener('click', handleDocumentClick);
      document.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('hashchange', handleHashChange);
      clearInterval(linkCheckInterval);
      if (closeButtonRef.current) {
        closeButtonRef.current.removeEventListener('click', handleCloseClick);
      }
    };
  }, [isInitialized, isOpen]);

  return (
    <div id="enhanced-popup" ref={popupRef} className={`popup-main ${isOpen ? '' : 'invisible opacity-0 pointer-events-none'}`}>
      <button id="close-popup" ref={closeButtonRef} className="popup-close-btn">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 sm:h-8 sm:w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
        <span className="sr-only">Close</span>
      </button>
      <div className="popup-content-container grid grid-cols-1 md:grid-cols-2 gap-y-4 md:gap-y-8 gap-x-6 md:gap-x-8 items-start">
        <div id="item-image" ref={imageContainerRef} className="h-full"></div>
        <div className="popup-content-wrapper">
          <div id="item-content" ref={contentRef} className="popup-content-section"></div>
        </div>
      </div>
    </div>
  );
}

// Enhanced image rendering for all item types with URL filter integration
const renderImage = (item, itemType) => {
  if (!item) return '';
  
  // Helper function to generate correct filter URLs for unified hakemisto
  const generateCategoryUrl = (itemType, specificCategory) => {
    const filters = [];
    
    // Add the specific category if available
    if (specificCategory) {
      filters.push(`category:${encodeURIComponent(specificCategory)}`);
    }
    
    // Map English type names to Finnish for the filtering system
    const typeMapping = {
      'ingredient': 'ainesosat',
      'equipment': 'välineet', 
      'technique': 'tekniikat'
    };
    
    // Add the type filter with Finnish name
    const finnishType = typeMapping[itemType] || itemType;
    filters.push(`type:${encodeURIComponent(finnishType)}`);
    
    // Create the final URL with proper query parameters
    return `/hakemisto?filters=${filters.join(',')}`;
  };
  
  // Determine category name and link based on item type
  let categoryDisplayName = 'Tuntematon';
  let categoryLink = '/hakemisto';
  
  switch(itemType) {
    case 'ingredient':
      categoryDisplayName = 'Ainesosat';
      break;
    case 'equipment':
      categoryDisplayName = 'Välineet';
      break;
    case 'technique':
      categoryDisplayName = 'Tekniikat';
      break;
  }
  
  // Try to get more specific category if available
  if (item.category) {
    // Format for display (capitalize first letter)
    const firstLetter = item.category.charAt(0).toUpperCase();
    const restOfWord = item.category.slice(1);
    categoryDisplayName = firstLetter + restOfWord;
    
    // Generate URL with both category and type filters
    categoryLink = generateCategoryUrl(itemType, item.category);
  } else {
    // If no specific category, just filter by type
    categoryLink = generateCategoryUrl(itemType, null);
  }
  
  // Get item type icon for placeholder
  const getItemTypeIcon = (type) => {
    switch(type) {
      case 'equipment':
        return '🔧';
      case 'technique':
        return '👨‍🍳';
      case 'ingredient':
      default:
        return '🥄';
    }
  };

  // Get optimized image URL (large version for popup)
  const optimizedImageUrl = item ? getOptimizedImageUrl(item, 'large') : null;
  
  // For fallback, if no optimized image but we have an imageUrl, use the original
  let fallbackImageUrl = null;
  if (!optimizedImageUrl && item.imageUrl) {
    // Handle different image path formats
    if (!item.imageUrl.startsWith('http') && !item.imageUrl.startsWith('/')) {
      // If it's a relative path like "images/ingredients/vehnajauho.jpg", make it absolute
      fallbackImageUrl = `/${item.imageUrl}`;
    } else if (item.imageUrl.startsWith('/images/')) {
      // If it starts with /images/, it's already in the right format
      fallbackImageUrl = item.imageUrl;
    } else {
      fallbackImageUrl = item.imageUrl;
    }
  }
  
  const hasImage = optimizedImageUrl || fallbackImageUrl;

  // Use the same layout structure regardless of whether there's an image or not
  return `
    <div class="relative w-full h-full">
      <div class="w-full aspect-[16/9] md:aspect-none md:h-full overflow-hidden relative rounded-lg ${!hasImage ? 'bg-gradient-to-br from-[var(--color-gray-100)] to-[var(--color-gray-200)]' : ''}">
        ${hasImage ? 
          `<img src="${optimizedImageUrl || fallbackImageUrl}" alt="${item.name}" class="w-full h-full object-cover" loading="lazy" decoding="async">` : 
          `<div class="absolute inset-0 flex items-center justify-center">
             <div class="text-6xl md:text-8xl lg:text-9xl opacity-30">${getItemTypeIcon(itemType)}</div>
           </div>`
        }
        <div class="absolute inset-0 flex flex-col justify-between p-3 sm:p-4 md:p-6 text-white z-20">
          <div>
            <div class="absolute left-0 top-0 w-full h-[calc(5em+4rem)] pointer-events-none z-10 bg-gradient-to-b from-black/35 to-transparent to-90%"></div>
            <div class="max-w-[90%] sm:max-w-[80%] relative z-20">
              <p class="text-gray-200 text-xs sm:text-sm md:text-base lg:text-xl mb-1 sm:mb-2 lg:mb-2 xl:mb-2 drop-shadow-md shadow-black/20">
                <a href="${categoryLink}" class="border-b border-white/40 hover:border-white no-underline">
                  ${categoryDisplayName}
                </a>
              </p>
              <h1 class="text-gray-200 text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold mb-1 drop-shadow-lg shadow-black/25">${item.name}</h1>
            </div>
          </div>
          ${hasImage && item.imageAttribution ? 
            `<div>
              <div class="absolute left-0 bottom-0 w-full h-12 pointer-events-none bg-gradient-to-t from-black/30 to-transparent"></div>
              <div class="relative z-20 text-right">
                <p class="text-white/80 text-xs">${item.imageAttribution || ''}</p>
              </div>
            </div>` : 
            ''
          }
        </div>
      </div>
    </div>
  `;
};