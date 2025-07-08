/**
 * Native Popover System
 * 
 * Lightweight popover management using the native HTML Popover API.
 * Provides ingredient information with optimal performance and minimal overhead.
 * 
 * @author Tomi
 * @version 3.0.0
 */

interface PopoverData {
  id?: string;
  name: string;
  description?: string;
  production?: string;
  science?: string;
  properties?: Record<string, string>;
  tips?: string[];
  optimizedImages?: Record<string, string>;
  imageUrl?: string;
  variants?: Array<{name: string; description?: string; temp?: string; time?: string}>;
  techniques?: string[];
  care?: string;
  tags?: string[];
}

interface CategoryData {
  category: {
    id: string;
    name: string;
    subtitle?: string;
    description?: string;
  };
  ingredients: PopoverData[];
}

interface EquipmentData {
  category: Record<string, any>;
  items: Record<string, PopoverData>;
}

interface TechniqueData {
  category: Record<string, any>;
  items: Record<string, PopoverData>;
}

class PopoverManager {
  private static instance: PopoverManager;
  private initialized = false;
  private dataCache = new Map<string, any>();

  static getInstance(): PopoverManager {
    if (!PopoverManager.instance) {
      PopoverManager.instance = new PopoverManager();
    }
    return PopoverManager.instance;
  }

  init(): void {
    if (this.initialized) return;
    
    this.setupPopovers();
    this.setupGlobalListeners();
    this.initialized = true;
  }

  private setupPopovers(): void {
    const popovers = document.querySelectorAll<HTMLElement>('.ingredient-popover');
    
    popovers.forEach((popover) => {
      const { itemId, itemType, category } = popover.dataset;
      if (itemId && itemType) {
        this.initializePopover(popover, itemId, itemType, category);
      }
    });
  }

  private initializePopover(popover: HTMLElement, itemId: string, itemType: string, category?: string): void {
    // Handle popover toggle events
    popover.addEventListener('toggle', (event: any) => {
      if (event.newState === 'open') {
        this.handlePopoverOpen(popover, itemId, itemType, category);
      } else if (event.newState === 'closed') {
        this.handlePopoverClose();
      }
    });
  }

  private async handlePopoverOpen(popover: HTMLElement, itemId: string, itemType: string, category?: string): Promise<void> {
    document.body.style.overflow = 'hidden';
    
    try {
      const data = await this.loadData(itemId, itemType, category);
      if (data) {
        this.renderPopover(popover, data);
      } else {
        this.showError(popover, 'Ainesosaa ei löytynyt');
      }
    } catch (error) {
      console.error('Popover data loading failed:', error);
      this.showError(popover, 'Virhe tiedon lataamisessa');
    }
  }

  private handlePopoverClose(): void {
    document.body.style.overflow = '';
  }

  private setupGlobalListeners(): void {
    // Handle escape key
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') {
        const openPopover = document.querySelector<HTMLElement>(':popover-open');
        if (openPopover) {
          (openPopover as any).hidePopover();
        }
      }
    });
  }

  private async loadData(itemId: string, itemType: string, category?: string): Promise<PopoverData | null> {
    const cacheKey = `${itemType}-${itemId}-${category || ''}`;
    
    if (this.dataCache.has(cacheKey)) {
      return this.dataCache.get(cacheKey);
    }

    try {
      let data: any = null;

      switch (itemType) {
        case 'ingredient':
          if (category) {
            data = await this.loadCategoryData(category);
          }
          break;
        case 'equipment':
          data = await this.loadEquipmentData();
          break;
        case 'technique':
          data = await this.loadTechniqueData();
          break;
      }

      if (!data) return null;

      const item = this.findItem(data, itemId, itemType);
      if (item) {
        this.dataCache.set(cacheKey, item);
        return item;
      }
    } catch (error) {
      console.error('Data loading error:', error);
    }

    return null;
  }

  private async loadCategoryData(category: string): Promise<CategoryData | null> {
    try {
      // Use dynamic import with proper path resolution
      const module = await import(`../../content/data/categories/${category}.json`);
      return module.default;
    } catch (error) {
      console.error('Failed to load category data for:', category, error);
      return null;
    }
  }

  private async loadEquipmentData(): Promise<EquipmentData | null> {
    try {
      const module = await import('../../content/data/equipment.json');
      return module.default;
    } catch (error) {
      console.error('Failed to load equipment data:', error);
      return null;
    }
  }

  private async loadTechniqueData(): Promise<TechniqueData | null> {
    try {
      const module = await import('../../content/data/techniques.json');
      return module.default;
    } catch (error) {
      console.error('Failed to load technique data:', error);
      return null;
    }
  }

  private findItem(data: any, itemId: string, itemType: string): PopoverData | null {
    const normalizedId = this.normalizeId(itemId);

    if (itemType === 'ingredient' && data.ingredients) {
      const found = data.ingredients.find((ing: PopoverData) => 
        ing.id === itemId || 
        ing.id === normalizedId ||
        (ing.id && this.normalizeId(ing.id) === normalizedId)
      );
      return found || null;
    }

    if ((itemType === 'equipment' || itemType === 'technique') && data.items) {
      // For equipment/techniques, items is an object with itemId as key
      const item = data.items[itemId] || data.items[normalizedId];
      if (item) return item;
      
      // Fallback: search through all items
      const items = Object.values(data.items) as PopoverData[];
      const found = items.find((item: PopoverData) => 
        item.id === itemId || 
        item.id === normalizedId ||
        (item.id && this.normalizeId(item.id) === normalizedId)
      );
      return found || null;
    }

    return null;
  }

  private normalizeId(str: string): string {
    if (!str) return '';
    return str
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[åäö]/g, (match) => ({ 'å': 'a', 'ä': 'a', 'ö': 'o' }[match] || match));
  }

  private renderPopover(popover: HTMLElement, data: PopoverData): void {
    this.updateTitle(popover, data.name);
    this.updateImage(popover, data);
    this.updateContent(popover, data);
    this.addViewTransitions(popover, data);
  }

  private updateTitle(popover: HTMLElement, title: string): void {
    const titleElement = popover.querySelector('.popover-title-text');
    if (titleElement) {
      titleElement.textContent = title || 'Nimeä ei saatavilla';
    }
  }

  private updateImage(popover: HTMLElement, data: PopoverData): void {
    const container = popover.querySelector('.popover-image-container');
    if (!container) return;

    const imageUrl = this.getImageUrl(data);
    container.innerHTML = imageUrl 
      ? `<img src="${imageUrl}" alt="${data.name}" class="popover-image w-full h-full object-cover" loading="lazy" decoding="async" />`
      : `<div class="popover-image-placeholder w-full h-full flex items-center justify-center bg-secondary-light">
           <svg class="size-12 text-secondary-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
             <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
           </svg>
         </div>`;
  }

  private getImageUrl(data: PopoverData): string | null {
    if (data.optimizedImages?.large) {
      return data.optimizedImages.large;
    }
    
    if (data.imageUrl) {
      const lastDotIndex = data.imageUrl.lastIndexOf('.');
      if (lastDotIndex > 0) {
        const basePath = data.imageUrl.substring(0, lastDotIndex);
        return `${basePath}-large.webp`;
      }
    }
    
    return null;
  }

  private updateContent(popover: HTMLElement, data: PopoverData): void {
    const container = popover.querySelector('.popover-text-content');
    if (!container) return;

    const content = this.buildContent(data);
    container.innerHTML = content;
  }

  private buildContent(data: PopoverData): string {
    const parts: string[] = [];

    if (data.description) {
      parts.push(`<p class="popover-description text-base text-primary-dark leading-relaxed">${data.description}</p>`);
    }

    if (data.production) {
      parts.push(`<p class="popover-production text-sm text-secondary-accent leading-relaxed">${data.production}</p>`);
    }

    if (data.science) {
      parts.push(`<p class="popover-science text-sm text-secondary-accent leading-relaxed">${data.science}</p>`);
    }

    if (data.properties && Object.keys(data.properties).length > 0) {
      parts.push(this.buildPropertiesSection(data.properties));
    }

    if (data.variants && data.variants.length > 0) {
      parts.push(this.buildVariantsSection(data.variants));
    }

    if (data.tips && data.tips.length > 0) {
      parts.push(this.buildTipsSection(data.tips));
    }

    if (data.techniques && data.techniques.length > 0) {
      parts.push(this.buildTechniquesSection(data.techniques));
    }

    if (data.care) {
      parts.push(this.buildCareSection(data.care));
    }

    return parts.length > 0 
      ? parts.join('')
      : '<p class="popover-no-content text-secondary-accent italic">Lisätietoja ei saatavilla.</p>';
  }

  private buildPropertiesSection(properties: Record<string, string>): string {
    const propertyItems = Object.entries(properties)
      .map(([key, value]) => `
        <div class="popover-property-item flex justify-between items-start gap-4 py-2">
          <dt class="popover-property-label text-sm font-medium text-primary-dark capitalize flex-shrink-0">${key}</dt>
          <dd class="popover-property-value text-sm text-primary-dark text-right">${value}</dd>
        </div>
      `)
      .join('');

    return `
      <div class="popover-properties">
        <h3 class="popover-section-title text-base font-semibold text-primary-dark mb-2">Ominaisuudet</h3>
        <dl class="popover-properties-list space-y-2">${propertyItems}</dl>
      </div>
    `;
  }

  private buildVariantsSection(variants: Array<{name: string; description?: string; temp?: string; time?: string}>): string {
    const variantItems = variants
      .map(variant => {
        let description = '';
        if (variant.description) {
          description = variant.description;
        } else if (variant.temp && variant.time) {
          description = `${variant.temp}, ${variant.time}`;
        } else if (variant.temp) {
          description = variant.temp;
        } else if (variant.time) {
          description = variant.time;
        }
        return `<li class="popover-variant-item text-sm text-primary-dark"><strong>${variant.name}:</strong> ${description}</li>`;
      })
      .join('');

    return `
      <div class="popover-variants">
        <h3 class="popover-section-title text-base font-semibold text-primary-dark mb-2">Variantit</h3>
        <ul class="popover-variants-list space-y-1 list-disc list-inside">${variantItems}</ul>
      </div>
    `;
  }

  private buildTipsSection(tips: string[]): string {
    const tipItems = tips
      .map(tip => `<li class="popover-tip-item text-sm text-primary-dark">${tip}</li>`)
      .join('');

    return `
      <div class="popover-tips">
        <h3 class="popover-section-title text-base font-semibold text-primary-dark mb-2">Vinkit</h3>
        <ul class="popover-tips-list space-y-2 list-disc list-inside">${tipItems}</ul>
      </div>
    `;
  }

  private buildTechniquesSection(techniques: string[]): string {
    const techniqueItems = techniques
      .map(technique => `<li class="popover-technique-item text-sm text-primary-dark">${technique}</li>`)
      .join('');

    return `
      <div class="popover-techniques">
        <h3 class="popover-section-title text-base font-semibold text-primary-dark mb-2">Tekniikat</h3>
        <ul class="popover-techniques-list space-y-1 list-disc list-inside">${techniqueItems}</ul>
      </div>
    `;
  }

  private buildCareSection(care: string): string {
    return `
      <div class="popover-care">
        <h3 class="popover-section-title text-base font-semibold text-primary-dark mb-2">Hoito</h3>
        <p class="popover-care-text text-sm text-primary-dark leading-relaxed">${care}</p>
      </div>
    `;
  }

  private addViewTransitions(popover: HTMLElement, data: PopoverData): void {
    const itemId = data.id || data.name?.toLowerCase().replace(/\s+/g, '-');
    if (!itemId) return;

    const image = popover.querySelector('.popover-image');
    if (image) {
      image.setAttribute('view-transition-name', `popover-image-${itemId}`);
    }

    const description = popover.querySelector('.popover-description');
    if (description) {
      description.setAttribute('view-transition-name', `popover-description-${itemId}`);
    }
  }

  private showError(popover: HTMLElement, message: string): void {
    this.updateTitle(popover, 'Virhe');
    
    const container = popover.querySelector('.popover-text-content');
    if (container) {
      container.innerHTML = `
        <div class="popover-error text-center py-4">
          <p class="popover-error-message text-red font-medium mb-2">${message}</p>
          <p class="popover-error-help text-sm text-secondary-accent">
            Löydät kaikki ainesosat, välineet ja tekniikat 
            <a href="/hakemisto" class="popover-error-link text-primary-accent underline hover:decoration-solid">hakemistosta</a>.
          </p>
        </div>
      `;
    }
  }
}

// Initialize when DOM is ready
const initPopovers = () => {
  PopoverManager.getInstance().init();
};

export default {
  init: initPopovers
};