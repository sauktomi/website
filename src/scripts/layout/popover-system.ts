/**
 * Native Popover System
 * 
 * Simple popover management using the native HTML Popover API.
 * Provides ingredient information with minimal overhead.
 * 
 * @author Tomi
 * @version 4.0.0
 */

interface PopoverData {
  id?: string;
  name: string;
  description?: string;
  production?: string;
  science?: string;
  properties?: Record<string, string>;
  tips?: string[];
  imageUrl?: string;
  variants?: Array<{name: string; description?: string; temp?: string; time?: string}>;
  techniques?: string[];
  care?: string;
  tags?: string[];
}

const PopoverSystem = {
  init(): void {
    this.setupPopovers();
    this.setupGlobalListeners();
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
      }
    });
  },

  async handlePopoverOpen(popover: HTMLElement, itemId: string, itemType: string, category?: string): Promise<void> {
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
  },

  async loadData(itemId: string, itemType: string, category?: string): Promise<PopoverData | null> {
    try {
      let data: any = null;

      switch (itemType) {
        case 'ingredient':
          if (category) {
            const module = await import(`../../content/data/categories/${category}.json`);
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

    if (data.imageUrl) {
      imageContainer.innerHTML = `<img src="${data.imageUrl}" alt="${data.name}" class="popover-image w-full h-full object-cover" loading="lazy" decoding="async" />`;
      imageContainer.style.display = 'block';
    } else {
      imageContainer.style.display = 'none';
    }
  },

  updateContent(popover: HTMLElement, data: PopoverData): void {
    const contentElement = popover.querySelector('.popover-text-content');
    if (contentElement) {
      contentElement.innerHTML = this.buildContent(data);
    }
  },

  buildContent(data: PopoverData): string {
    let content = '';

    if (data.description) {
      content += `<p class="popover-description">${data.description}</p>`;
    }

    if (data.production) {
      content += `<div class="popover-section"><h4>Valmistus</h4><p>${data.production}</p></div>`;
    }

    if (data.science) {
      content += `<div class="popover-section"><h4>Tiede</h4><p>${data.science}</p></div>`;
    }

    if (data.properties && Object.keys(data.properties).length > 0) {
      content += this.buildPropertiesSection(data.properties);
    }

    if (data.variants && data.variants.length > 0) {
      content += this.buildVariantsSection(data.variants);
    }

    if (data.tips && data.tips.length > 0) {
      content += this.buildTipsSection(data.tips);
    }

    if (data.techniques && data.techniques.length > 0) {
      content += this.buildTechniquesSection(data.techniques);
    }

    if (data.care) {
      content += this.buildCareSection(data.care);
    }

    return content;
  },

  buildPropertiesSection(properties: Record<string, string>): string {
    let html = '<div class="popover-section"><h4>Ominaisuudet</h4><ul>';
    Object.entries(properties).forEach(([key, value]) => {
      html += `<li><strong>${key}:</strong> ${value}</li>`;
    });
    html += '</ul></div>';
    return html;
  },

  buildVariantsSection(variants: Array<{name: string; description?: string; temp?: string; time?: string}>): string {
    let html = '<div class="popover-section"><h4>Variantit</h4><ul>';
    variants.forEach(variant => {
      html += `<li><strong>${variant.name}</strong>`;
      if (variant.description) html += `: ${variant.description}`;
      if (variant.temp) html += ` (${variant.temp})`;
      if (variant.time) html += ` - ${variant.time}`;
      html += '</li>';
    });
    html += '</ul></div>';
    return html;
  },

  buildTipsSection(tips: string[]): string {
    let html = '<div class="popover-section"><h4>Vinkit</h4><ul>';
    tips.forEach(tip => {
      html += `<li>${tip}</li>`;
    });
    html += '</ul></div>';
    return html;
  },

  buildTechniquesSection(techniques: string[]): string {
    let html = '<div class="popover-section"><h4>Tekniikat</h4><ul>';
    techniques.forEach(technique => {
      html += `<li>${technique}</li>`;
    });
    html += '</ul></div>';
    return html;
  },

  buildCareSection(care: string): string {
    return `<div class="popover-section"><h4>Hoito</h4><p>${care}</p></div>`;
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
  }
};

export default PopoverSystem;