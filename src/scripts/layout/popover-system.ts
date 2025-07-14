/**
 * Native Popover System
 * 
 * Simple popover management using the native HTML Popover API.
 * Provides ingredient information with minimal overhead.
 * 
 * @author Tomi
 * @version 5.0.0
 */

interface PopoverData {
  id?: string;
  name: string;
  description?: string;
  category?: string;
  production?: string;
  science?: string;
  properties?: Record<string, string>;
  tips?: string[];
  imageUrl?: string;
  variants?: Array<{name: string; description?: string; temp?: string; time?: string}>;
  techniques?: string[];
  // Additional fields for ingredients
  alternatives?: Array<{name: string; id: string; forDiet: string[]; notes: string}>;
  season?: {availability: string; bestSeason: string};
  sourcing?: string;
  käyttö?: string;
  dietaryInfo?: string[];
  flavorProfile?: {sweetness: number; saltiness: number; sourness: number; bitterness: number; umami: number};
  // Additional fields for techniques
  equipment?: string[];
  esimerkki?: string;
  benefits?: string[];
  phases?: Array<{name: string; temp: string; time: string} | string>;
}

const PopoverSystem = {
  init(): void {
    this.setupPopovers();
    this.setupGlobalListeners();
    
    // Lazy load JSON data if on hakemisto page
    if (window.location.pathname === '/hakemisto' || window.location.pathname === '/hakemisto/') {
      this.preloadJsonData();
    } else {
      // For other pages, check URL hash after a delay
      setTimeout(() => {
        this.handleUrlOnLoad();
      }, 500);
    }
  },

  preloadJsonData(): void {
    const preloadModules = async () => {
      const modules = [
        // Equipment and techniques
        () => import('../../content/data/equipment.json'),
        () => import('../../content/data/techniques.json'),
        // Ingredient category files - optimised versions
        () => import('../../content/data/categories/hedelmät-optimised.json'),
        () => import('../../content/data/categories/jauhot-optimised.json'),
        () => import('../../content/data/categories/juustot-optimised.json'),
        () => import('../../content/data/categories/kasvikset-optimised.json'),
        () => import('../../content/data/categories/maitotuotteet-optimised.json'),
        () => import('../../content/data/categories/mausteet-optimised.json'),
        () => import('../../content/data/categories/rasva-optimised.json'),
        () => import('../../content/data/categories/sokeri-optimised.json')
      ];

      // Load all modules in parallel
      const loadPromises = modules.map(async (moduleLoader) => {
        try {
          await moduleLoader();
          console.log('Preloaded JSON module');
        } catch (error) {
          // Silently fail - this is just preloading
          console.debug('Failed to preload JSON module:', error);
        }
      });

      // Wait for all modules to load (or fail) in the background
      await Promise.allSettled(loadPromises);
      
      // After JSON is loaded, check URL hash
      console.log('JSON preloading complete, checking URL hash');
      this.handleUrlOnLoad();
    };

    // Start preloading immediately
    preloadModules();
  },

  setupPopovers(): void {
    const popovers = document.querySelectorAll<HTMLElement>('.ingredient-popover');
    
    popovers.forEach((popover) => {
      const { itemId, itemType, category } = popover.dataset;
      if (itemId && itemType) {
        this.initializePopover(popover, itemId, itemType, category);
      }
    });
  },

  initializePopover(popover: HTMLElement, itemId: string, itemType: string, category?: string): void {
    popover.addEventListener('toggle', (event: any) => {
      if (event.newState === 'open') {
        this.handlePopoverOpen(popover, itemId, itemType, category);
      } else if (event.newState === 'closed') {
        document.body.style.overflow = '';
        this.updateUrlOnClose();
      }
    });
  },

  async handlePopoverOpen(popover: HTMLElement, itemId: string, itemType: string, category?: string): Promise<void> {
    document.body.style.overflow = 'hidden';
    
    try {
      const data = await this.loadData(itemId, itemType, category);
      if (data) {
        this.renderPopover(popover, data);
        this.updateUrlOnOpen(itemId, itemType);
      } else {
        this.showError(popover, 'Ainesosaa ei löytynyt');
      }
    } catch (error) {
      console.error('Popover data loading failed:', error);
      this.showError(popover, 'Virhe tiedon lataamisessa');
    }
  },

  async loadData(itemId: string, itemType: string, category?: string): Promise<PopoverData | null> {
    try {
      let data: any = null;

      switch (itemType) {
        case 'ingredient':
          if (category) {
            const module = await import(`../../content/data/categories/${category}-optimised.json`);
            data = module.default;
          }
          break;
        case 'equipment':
          const equipmentModule = await import('../../content/data/equipment.json');
          data = equipmentModule.default;
          break;
        case 'technique':
          const techniqueModule = await import('../../content/data/techniques.json');
          data = techniqueModule.default;
          break;
      }

      if (!data) return null;

      return this.findItem(data, itemId, itemType);
    } catch (error) {
      console.error('Data loading error:', error);
      return null;
    }
  },

  findItem(data: any, itemId: string, itemType: string): PopoverData | null {
    const normalizedId = this.normalizeId(itemId);

    if (itemType === 'ingredient' && data.ingredients) {
      return data.ingredients.find((ing: PopoverData) => 
        ing.id === itemId || 
        ing.id === normalizedId ||
        (ing.id && this.normalizeId(ing.id) === normalizedId)
      ) || null;
    }

    if (itemType === 'equipment' && data.items) {
      return data.items[itemId] || data.items[normalizedId] || null;
    }

    if (itemType === 'technique' && data.items) {
      return data.items[itemId] || data.items[normalizedId] || null;
    }

    return null;
  },

  normalizeId(str: string): string {
    return str.toLowerCase().replace(/[^a-z0-9]/g, '');
  },

  updateUrlOnOpen(itemId: string, itemType: string): void {
    // Map itemType to Finnish section names
    const sectionMap: Record<string, string> = {
      'ingredient': 'ainesosa',
      'equipment': 'väline',
      'technique': 'tekniikka'
    };
    
    const sectionName = sectionMap[itemType] || itemType;
    const hash = `#${sectionName}-${itemId}`;
    const currentUrl = window.location.href.split('#')[0];
    const newUrl = currentUrl + hash;
    
    if (window.location.href !== newUrl) {
      window.history.replaceState({}, '', newUrl);
    }
  },

  updateUrlOnClose(): void {
    const currentUrl = window.location.href.split('#')[0];
    if (window.location.href !== currentUrl) {
      window.history.replaceState({}, '', currentUrl);
    }
  },

  handleUrlOnLoad(): void {
    const hash = decodeURIComponent(window.location.hash);
    console.log(`Checking URL hash: ${hash}`);
    
    if (hash && hash.startsWith('#')) {
      // Map Finnish section names back to itemType
      const sectionMap: Record<string, string> = {
        'ainesosa': 'ingredient',
        'väline': 'equipment',
        'tekniikka': 'technique'
      };
      
      const match = hash.match(/^#(ainesosa|väline|tekniikka)-(.+)$/);
      if (match) {
        const [, sectionName, itemId] = match;
        const itemType = sectionMap[sectionName];
        console.log(`URL match found: section=${sectionName}, itemId=${itemId}, itemType=${itemType}`);
        
        if (itemType) {
          // Small delay to ensure DOM is ready
          setTimeout(() => {
            this.openPopoverFromUrl(itemId, itemType);
          }, 200);
        }
      } else {
        console.log(`No valid hash match found for: ${hash}`);
      }
    }
  },

  async openPopoverFromUrl(itemId: string, itemType: string): Promise<void> {
    console.log(`Trying to open popover for ${itemType} with ID: ${itemId}`);
    
    // First, check if the item exists on the current page
    const popoverId = `popover-${itemId}-${itemType}`;
    const popover = document.getElementById(popoverId) as HTMLElement;
    const trigger = document.querySelector(`[data-item-id="${itemId}"][data-item-type="${itemType}"]`) as HTMLElement;
    
    // If neither popover nor trigger exists on this page, the item is not available here
    if (!popover && !trigger) {
      console.log(`Item ${itemId} (${itemType}) not found on current page - expected behaviour for now`);
      return;
    }
    
    // Try to open the popover if it exists
    if (popover) {
      console.log(`Found popover with ID: ${popoverId}`);
      if ('showPopover' in popover) {
        (popover as any).showPopover();
        return;
      }
    }
    
    // If popover not found by ID, try to find any popover with matching data attributes
    const allPopovers = document.querySelectorAll<HTMLElement>('.ingredient-popover');
    for (const popover of Array.from(allPopovers)) {
      const popoverItemId = popover.getAttribute('data-item-id');
      const popoverItemType = popover.getAttribute('data-item-type');
      
      if (popoverItemId === itemId && popoverItemType === itemType) {
        console.log(`Found popover by data attributes for ${itemId}`);
        if ('showPopover' in popover) {
          (popover as any).showPopover();
          return;
        }
      }
    }
    
    // If still not found but trigger exists, click it
    if (trigger) {
      console.log(`Found trigger for ${itemId}, clicking it`);
      trigger.click();
      return;
    }
    
    console.log(`No popover found for ${itemType} with ID: ${itemId}`);
  },

  renderPopover(popover: HTMLElement, data: PopoverData): void {
    this.updateTitle(popover, data.name);
    this.updateImage(popover, data);
    this.updateContent(popover, data);
  },

  updateTitle(popover: HTMLElement, title: string): void {
    const titleElement = popover.querySelector('.popover-title');
    if (titleElement) {
      titleElement.textContent = title;
    }
  },

  updateImage(popover: HTMLElement, data: PopoverData): void {
    const imageContainer = popover.querySelector<HTMLElement>('.popover-image-container');
    if (!imageContainer) return;

    // For ingredients, try to get image from category if not directly available
    let imageUrl = data.imageUrl;
    if (!imageUrl && data.category) {
      // Try to construct category image URL (this would need to be implemented based on your image structure)
      // For now, we'll hide the image container if no image is available
      imageContainer.style.display = 'none';
      return;
    }

    if (imageUrl) {
      imageContainer.innerHTML = `<img src="${imageUrl}" alt="${data.name}" class="popover-image w-full h-full object-cover" loading="lazy" decoding="async" />`;
      imageContainer.style.display = 'block';
    } else {
      imageContainer.style.display = 'none';
    }
  },

  updateContent(popover: HTMLElement, data: PopoverData): void {
    const contentElement = popover.querySelector('.popover-text-content');
    if (contentElement) {
      const itemType = popover.dataset.itemType || 'ingredient';
      contentElement.innerHTML = this.buildContent(data, itemType);
      
      // Process cross-references after content is rendered
      this.processCrossReferences(contentElement as HTMLElement);
    }
  },

  buildContent(data: PopoverData, itemType: string): string {
    // Determine item type based on itemType parameter
    const isIngredient = itemType === 'ingredient';
    const isEquipment = itemType === 'equipment';
    const isTechnique = itemType === 'technique';

    let content = '';

    // Description (always first after image)
    if (data.description) {
      content += `<p class="popover-description">${data.description}</p>`;
    }

    // INGREDIENTS: Side-by-side flavor profile, dietary info, and season
    if (isIngredient && (data.flavorProfile || (data.dietaryInfo && data.dietaryInfo.length > 0) || data.season)) {
      content += '<div class="popover-section-side-by-side">';
      if (data.flavorProfile) {
        content += this.buildFlavorProfileSection(data.flavorProfile);
      }
      if (data.dietaryInfo && data.dietaryInfo.length > 0) {
        content += `<div class="popover-section"><h4>Ruokavalio</h4><ul class="dietary-list">${data.dietaryInfo.map(item => `<li class="dietary-item">${item}</li>`).join('')}</ul></div>`;
      }
      if (data.season) {
        content += `<div class="popover-section"><h4>Sesonki</h4><ul class="season-list"><li class="season-item"><strong>Saatavuus:</strong> ${data.season.availability}</li><li class="season-item"><strong>Paras aika:</strong> ${data.season.bestSeason}</li></ul></div>`;
      }
      content += '</div>';
    }

    // INGREDIENTS: Sourcing
    if (isIngredient && data.sourcing) {
      content += `<div class="popover-section"><h4>Valinta</h4><p>${data.sourcing}</p></div>`;
    }

    // INGREDIENTS: Käyttö (uses)
    if (isIngredient && data.käyttö) {
      content += `<div class="popover-section"><h4>Käyttö</h4><p>${data.käyttö}</p></div>`;
    }

    // INGREDIENTS: Side-by-side alternatives and variants
    if (isIngredient && ((data.alternatives && data.alternatives.length > 0) || (data.variants && data.variants.length > 0))) {
      content += '<div class="popover-section-side-by-side">';
      if (data.alternatives && data.alternatives.length > 0) {
        content += this.buildAlternativesSection(data.alternatives);
      }
      if (data.variants && data.variants.length > 0) {
        content += this.buildVariantsSection(data.variants);
      }
      content += '</div>';
    }

    // EQUIPMENT: 3-wide bar with properties and techniques
    if (isEquipment && ((data.properties && Object.keys(data.properties).length > 0) || (data.techniques && data.techniques.length > 0))) {
      content += '<div class="popover-section-side-by-side">';
      if (data.properties && Object.keys(data.properties).length > 0) {
        content += this.buildPropertiesSection(data.properties);
      }
      if (data.techniques && data.techniques.length > 0) {
        content += this.buildTechniquesSection(data.techniques);
      }
      content += '</div>';
    }

    // EQUIPMENT: Käyttö (how to use it)
    if (isEquipment && data.käyttö) {
      content += `<div class="popover-section"><h4>Käyttö</h4><p>${data.käyttö}</p></div>`;
    }

    // EQUIPMENT: Variants below the 3-wide bar
    if (isEquipment && data.variants && data.variants.length > 0) {
      content += this.buildVariantsSection(data.variants);
    }

    // TECHNIQUES: 3-wide bar with properties, benefits, and equipment
    if (isTechnique && ((data.properties && Object.keys(data.properties).length > 0) || (data.benefits && data.benefits.length > 0) || (data.equipment && data.equipment.length > 0))) {
      content += '<div class="popover-section-side-by-side">';
      if (data.properties && Object.keys(data.properties).length > 0) {
        content += this.buildPropertiesSection(data.properties);
      }
      if (data.benefits && data.benefits.length > 0) {
        content += this.buildBenefitsSection(data.benefits);
      }
      if (data.equipment && data.equipment.length > 0) {
        content += this.buildEquipmentSection(data.equipment);
      }
      content += '</div>';
    }

    // TECHNIQUES: Esimerkki (example/how to do it)
    if (isTechnique && data.esimerkki) {
      content += `<div class="popover-section"><h4>Esimerkki</h4><p>${data.esimerkki}</p></div>`;
    }

    // TECHNIQUES: Variants
    if (isTechnique && data.variants && data.variants.length > 0) {
      content += this.buildVariantsSection(data.variants);
    }

    // TECHNIQUES: Phases
    if (isTechnique && data.phases && data.phases.length > 0) {
      content += this.buildPhasesSection(data.phases);
    }

    // Add separator between main and additional sections
    const hasAdditionalSections = data.production || 
                                 data.science ||
                                 (isIngredient && data.properties && Object.keys(data.properties).length > 0) || 
                                 (isIngredient && data.techniques && data.techniques.length > 0) || 
                                 (isIngredient && data.equipment && data.equipment.length > 0) || 
                                 data.tips;
    
    if (hasAdditionalSections) {
      content += '<hr class="popover-section-divider">';
    }

    // Tips moved to top of additional information (after hr)
    if (data.tips && data.tips.length > 0) {
      content += this.buildTipsSection(data.tips);
      content += '<hr class="popover-section-divider">';
    }

    // Additional sections (for all item types)
    if (data.production) {
      content += `<div class="popover-section"><h4>Valmistus</h4><p>${data.production}</p></div>`;
    }

    if (data.science) {
      content += `<div class="popover-section"><h4>Tiede</h4><p>${data.science}</p></div>`;
    }

    // Properties, techniques, and equipment for ingredients only (not equipment or techniques, as they're already shown above)
    if (isIngredient && data.properties && Object.keys(data.properties).length > 0) {
      content += this.buildPropertiesSection(data.properties);
    }

    if (isIngredient && data.techniques && data.techniques.length > 0) {
      content += this.buildTechniquesSection(data.techniques);
    }

    if (isIngredient && data.equipment && data.equipment.length > 0) {
      content += this.buildEquipmentSection(data.equipment);
    }

    return content;
  },

  buildPropertiesSection(properties: Record<string, string>): string {
    let html = '<div class="popover-section"><h4>Ominaisuudet</h4><ul class="properties-list">';
    Object.entries(properties).forEach(([key, value]) => {
      html += `<li class="property-item"><strong>${key}:</strong> ${value}</li>`;
    });
    html += '</ul></div>';
    return html;
  },

  buildVariantsSection(variants: Array<{name: string; description?: string; temp?: string; time?: string}>): string {
    let html = '<div class="popover-section"><h4>Variantit</h4><ul class="variants-list">';
    variants.forEach(variant => {
      html += `<li class="variant-item"><strong>${variant.name}</strong>`;
      if (variant.description) html += `: ${variant.description}`;
      if (variant.temp) html += ` (${variant.temp})`;
      if (variant.time) html += ` - ${variant.time}`;
      html += '</li>';
    });
    html += '</ul></div>';
    return html;
  },

  buildTipsSection(tips: string[]): string {
    let html = '<div class="popover-section"><h4>Vinkit</h4><ul class="tips-list">';
    tips.forEach(tip => {
      html += `<li class="tip-item">${tip}</li>`;
    });
    html += '</ul></div>';
    return html;
  },

  buildTechniquesSection(techniques: string[]): string {
    let html = '<div class="popover-section"><h4>Tekniikat</h4><ul class="techniques-list">';
    techniques.forEach(technique => {
      // For now, just use plain text - cross-references will be handled by the async method
      html += `<li class="technique-item">${technique}</li>`;
    });
    html += '</ul></div>';
    return html;
  },

  buildFlavorProfileSection(flavorProfile: {sweetness: number; saltiness: number; sourness: number; bitterness: number; umami: number}): string {
    const createFlavorItem = (value: number, label: string) => {
      return `<li class="flavor-item"><span class="flavor-label">${label}:</span><span class="flavor-value">${value}/10</span></li>`;
    };

    return `<div class="popover-section"><h4>Makuprofiili</h4>
      <ul class="flavor-list">
        ${createFlavorItem(flavorProfile.sweetness, 'Makeus')}
        ${createFlavorItem(flavorProfile.saltiness, 'Suolaisuus')}
        ${createFlavorItem(flavorProfile.sourness, 'Happamuus')}
        ${createFlavorItem(flavorProfile.bitterness, 'Kitkeryys')}
        ${createFlavorItem(flavorProfile.umami, 'Umami')}
      </ul>
    </div>`;
  },

  buildAlternativesSection(alternatives: Array<{name: string; id: string; forDiet: string[]; notes: string}>): string {
    let html = '<div class="popover-section"><h4>Vaihtoehdot</h4><ul class="alternatives-list">';
    alternatives.forEach(alt => {
      // For now, just use plain text - cross-references will be processed after content is rendered
      html += `<li class="alternative-item"><strong>${alt.name}</strong>`;
      if (alt.notes) html += `: ${alt.notes}`;
      html += '</li>';
    });
    html += '</ul></div>';
    return html;
  },

  buildBenefitsSection(benefits: string[]): string {
    let html = '<div class="popover-section"><h4>Hyödyt</h4><ul class="benefits-list">';
    benefits.forEach(benefit => {
      html += `<li class="benefit-item">${benefit}</li>`;
    });
    html += '</ul></div>';
    return html;
  },

  buildPhasesSection(phases: Array<{name: string; temp: string; time: string} | string>): string {
    let html = '<div class="popover-section"><h4>Vaiheet</h4><ul class="phases-list">';
    phases.forEach(phase => {
      if (typeof phase === 'string') {
        html += `<li class="phase-item">${phase}</li>`;
      } else {
        html += `<li class="phase-item"><strong>${phase.name}</strong>`;
        if (phase.temp) html += ` (${phase.temp})`;
        if (phase.time) html += ` - ${phase.time}`;
        html += '</li>';
      }
    });
    html += '</ul></div>';
    return html;
  },

  buildEquipmentSection(equipment: string[]): string {
    let html = '<div class="popover-section"><h4>Välineet</h4><ul class="equipment-list">';
    equipment.forEach(item => {
      // For now, just use plain text - cross-references will be handled by the async method
      html += `<li class="equipment-item">${item}</li>`;
    });
    html += '</ul></div>';
    return html;
  },

  async processCrossReferences(contentElement: HTMLElement): Promise<void> {
    console.log('Processing cross-references...');
    
    // Process alternatives (ingredients)
    const alternativeItems = contentElement.querySelectorAll<HTMLElement>('.alternative-item strong');
    console.log(`Found ${alternativeItems.length} alternative items`);
    for (const item of Array.from(alternativeItems)) {
      const text = item.textContent?.trim();
      if (text) {
        console.log(`Processing alternative: ${text}`);
        const link = await this.createCrossReferenceLink(text, 'ingredient');
        if (link !== text) {
          console.log(`Created link for: ${text}`);
          item.innerHTML = link;
        } else {
          console.log(`No link created for: ${text}`);
        }
      }
    }

    // Process techniques in equipment sections
    const techniqueItems = contentElement.querySelectorAll<HTMLElement>('.technique-item');
    console.log(`Found ${techniqueItems.length} technique items`);
    for (const item of Array.from(techniqueItems)) {
      const text = item.textContent?.trim();
      if (text) {
        console.log(`Processing technique: ${text}`);
        const link = await this.createCrossReferenceLink(text, 'technique');
        if (link !== text) {
          console.log(`Created link for: ${text}`);
          item.innerHTML = link;
        } else {
          console.log(`No link created for: ${text}`);
        }
      }
    }

    // Process equipment in technique sections
    const equipmentItems = contentElement.querySelectorAll<HTMLElement>('.equipment-item');
    console.log(`Found ${equipmentItems.length} equipment items`);
    for (const item of Array.from(equipmentItems)) {
      const text = item.textContent?.trim();
      if (text) {
        console.log(`Processing equipment: ${text}`);
        const link = await this.createCrossReferenceLink(text, 'equipment');
        if (link !== text) {
          console.log(`Created link for: ${text}`);
          item.innerHTML = link;
        } else {
          console.log(`No link created for: ${text}`);
        }
      }
    }
  },

  async createCrossReferenceLink(text: string, itemType: string, itemId?: string): Promise<string> {
    // Map itemType to Finnish section names for URLs
    const sectionMap: Record<string, string> = {
      'ingredient': 'ainesosa',
      'equipment': 'väline',
      'technique': 'tekniikka'
    };
    
    // If itemId is provided, validate it exists first
    if (itemId) {
      const exists = await this.validateItemExists(itemId, itemType);
      if (exists) {
        const sectionName = sectionMap[itemType] || itemType;
        return `<a href="#${sectionName}-${itemId}" class="cross-reference-link text-primary-accent hover:underline">${text}</a>`;
      }
      return text; // Return plain text if validation fails
    }

    // Otherwise, try to find the item in our data
    try {
      let found: any = null;
      
      switch (itemType) {
        case 'ingredient':
          // Try to find in all ingredient categories
          const categories = ['hedelmät', 'jauhot', 'juustot', 'kasvikset', 'maitotuotteet', 'mausteet', 'rasva', 'sokeri'];
          for (const category of categories) {
            try {
              const module = await import(`../../content/data/categories/${category}-optimised.json`);
              found = module.default.ingredients?.find((ing: any) => 
                ing.name.toLowerCase() === text.toLowerCase() || 
                ing.id === text.toLowerCase()
              );
              if (found) break;
            } catch (error) {
              // Continue to next category
            }
          }
          break;
        case 'equipment':
          try {
            const equipmentModule = await import('../../content/data/equipment.json');
            found = equipmentModule.default.items?.[text.toLowerCase()] || 
                   Object.values(equipmentModule.default.items || {}).find((item: any) => 
                     item.name.toLowerCase() === text.toLowerCase()
                   );
          } catch (error) {
            // Equipment not found
          }
          break;
        case 'technique':
          try {
            const techniqueModule = await import('../../content/data/techniques.json');
            found = techniqueModule.default.items?.[text.toLowerCase()] || 
                   Object.values(techniqueModule.default.items || {}).find((item: any) => 
                     item.name.toLowerCase() === text.toLowerCase()
                   );
          } catch (error) {
            // Technique not found
          }
          break;
      }
      
      // Only create link if item was found
      if (found) {
        const sectionName = sectionMap[itemType] || itemType;
        return `<a href="#${sectionName}-${found.id}" class="cross-reference-link text-primary-accent hover:underline">${text}</a>`;
      }
    } catch (error) {
      // If any error occurs, just return the text without a link
    }

    // If no match found, return plain text
    return text;
  },

  async validateItemExists(itemId: string, itemType: string): Promise<boolean> {
    try {
      switch (itemType) {
        case 'ingredient':
          // Check all ingredient categories
          const categories = ['hedelmät', 'jauhot', 'juustot', 'kasvikset', 'maitotuotteet', 'mausteet', 'rasva', 'sokeri'];
          for (const category of categories) {
            try {
              const module = await import(`../../content/data/categories/${category}-optimised.json`);
              const found = module.default.ingredients?.find((ing: any) => ing.id === itemId);
              if (found) return true;
            } catch (error) {
              // Continue to next category
            }
          }
          break;
        case 'equipment':
          try {
            const equipmentModule = await import('../../content/data/equipment.json');
            return !!equipmentModule.default.items?.[itemId];
          } catch (error) {
            return false;
          }
        case 'technique':
          try {
            const techniqueModule = await import('../../content/data/techniques.json');
            return !!techniqueModule.default.items?.[itemId];
          } catch (error) {
            return false;
          }
      }
    } catch (error) {
      return false;
    }
    return false;
  },

  showError(popover: HTMLElement, message: string): void {
    const contentElement = popover.querySelector('.popover-text-content');
    if (contentElement) {
      contentElement.innerHTML = `<p class="popover-error">${message}</p>`;
    }
  },

  setupGlobalListeners(): void {
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') {
        const openPopover = document.querySelector<HTMLElement>(':popover-open');
        if (openPopover) {
          (openPopover as any).hidePopover();
        }
      }
    });

    // Handle cross-reference link clicks
    document.addEventListener('click', (event) => {
      const target = event.target as HTMLElement;
      const link = target.closest('.cross-reference-link') as HTMLAnchorElement;
      
      if (link) {
        event.preventDefault();
        const href = link.getAttribute('href');
        if (href && href.startsWith('#')) {
          // Map Finnish section names back to itemType
          const sectionMap: Record<string, string> = {
            'ainesosa': 'ingredient',
            'väline': 'equipment',
            'tekniikka': 'technique'
          };
          
          const match = href.match(/^#(ainesosa|väline|tekniikka)-(.+)$/);
          if (match) {
            const [, sectionName, itemId] = match;
            const itemType = sectionMap[sectionName];
            if (itemType) {
              // Update URL first
              this.updateUrlOnOpen(itemId, itemType);
              // Then open popover
              this.openPopoverFromUrl(itemId, itemType);
            }
          }
        }
      }
    });
  }
};

export default PopoverSystem;