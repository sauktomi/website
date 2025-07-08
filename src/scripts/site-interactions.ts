/**
 * Site Interactions Manager
 * 
 * Manages site-wide interactions, event handling, and global functionality.
 * Provides navigation handling, keyboard shortcuts, and cross-page features.
 * 
 * Features:
 * - Global event handling and delegation
 * - Keyboard navigation and shortcuts
 * - Navigation state management
 * - Cross-page functionality
 * - Performance optimizations
 * - Accessibility enhancements
 * 
 * Event Handling:
 * - Page navigation events
 * - Keyboard shortcuts
 * - Touch gestures
 * - Focus management
 * - View transition handling
 * 
 * Performance:
 * - Event delegation for efficiency
 * - Debounced operations
 * - Memory leak prevention
 * - Lazy initialization
 * 
 * @author Tomi
 * @version 2.0.0
 */

/**
 * Site-wide interaction enhancements
 * Optimized for performance and progressive enhancement
 */

interface GridConfig {
  selectors: string;
  columns: number;
}

interface SiteInteractionsInstance {
  getInstance(): SiteInteractions | null;
}

declare global {
  interface Window {
    requestIdleCallback: (callback: IdleRequestCallback, options?: IdleRequestOptions) => number;
    cancelIdleCallback: (id: number) => void;
  }
}

class SiteInteractions {
  private observers: Map<string, IntersectionObserver | MutationObserver>;
  private isReducedMotion: boolean;
  private handleAnchorClick: EventListener | null;

  constructor() {
    this.observers = new Map();
    this.isReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.handleAnchorClick = null;
    
    this.init();
  }

  // Utilities
  static debounce<T extends (...args: any[]) => any>(func: T, wait: number): (...args: Parameters<T>) => void {
    let timeout: NodeJS.Timeout;
    return function executedFunction(this: unknown, ...args: Parameters<T>) {
      const later = () => {
        clearTimeout(timeout);
        func.apply(this, args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  static throttle<T extends (...args: any[]) => any>(func: T, limit: number): (...args: Parameters<T>) => void {
    let inThrottle: boolean;
    return function executedFunction(this: unknown, ...args: Parameters<T>) {
      if (!inThrottle) {
        func.apply(this, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  }

  // Enhanced smooth scrolling
  private initSmoothScrolling(): void {
    if (this.isReducedMotion) return;

    this.handleAnchorClick = (e: Event) => {
      // Ignore clicks on popover backdrops and when popovers are open
      const target = e.target as HTMLElement;
      if (target.matches('::backdrop') || document.querySelector('[popover]:popover-open')) {
        return;
      }

      const link = (e.target as HTMLElement).closest('a[href^="#"]') as HTMLAnchorElement;
      if (!link) return;

      const targetId = link.getAttribute('href') || '';
      if (targetId === '#') return;

      const targetElement = document.querySelector(targetId) as HTMLElement;
      if (!targetElement) return;

      e.preventDefault();
      
      targetElement.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });

      // Update URL without jumping
      if (history.pushState) {
        history.pushState({}, '', targetId);
      }
    };

    document.addEventListener('click', this.handleAnchorClick, { passive: false });
  }

  // Optimized lazy loading with intersection observer
  private initLazyLoading(): void {
    if (!('IntersectionObserver' in window)) return;

    const imageObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target as HTMLImageElement;
          this.loadImage(img);
          imageObserver.unobserve(img);
        }
      });
    }, {
      rootMargin: '50px 0px',
      threshold: 0.1
    });

    this.observers.set('images', imageObserver);

    // Observe existing images
    document.querySelectorAll('img[data-src]').forEach(img => {
      imageObserver.observe(img);
    });

    // Handle dynamically added images
    this.setupDynamicImageObserver();
  }

  private loadImage(img: HTMLImageElement): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const tempImg = new Image();
      
      tempImg.onload = () => {
        img.src = tempImg.src;
        img.removeAttribute('data-src');
        img.classList.remove('lazy');
        img.classList.add('loaded');
        resolve(img);
      };
      
      tempImg.onerror = () => {
        img.classList.add('error');
        reject(new Error('Failed to load image'));
      };
      
      tempImg.src = img.dataset.src || '';
    });
  }

  private setupDynamicImageObserver(): void {
    if (!('MutationObserver' in window)) return;

    const mutationObserver = new MutationObserver((mutations) => {
      mutations.forEach(mutation => {
        mutation.addedNodes.forEach(node => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            const element = node as HTMLElement;
            const images = element.matches?.('img[data-src]') 
              ? [element as HTMLImageElement] 
              : Array.from(element.querySelectorAll?.('img[data-src]') || []) as HTMLImageElement[];
            
            images.forEach(img => {
              this.observers.get('images')?.observe(img);
            });
          }
        });
      });
    });

    mutationObserver.observe(document.body, {
      childList: true,
      subtree: true
    });

    this.observers.set('mutation', mutationObserver);
  }

  // Enhanced focus management
  private initFocusManagement(): void {
    this.setupSkipLink();
    this.setupModalEscape();
    this.setupFocusTrap();
  }

  private setupSkipLink(): void {
    const skipLink = document.querySelector('.skip-link') as HTMLAnchorElement;
    if (!skipLink) return;

    skipLink.addEventListener('click', (e: Event) => {
      e.preventDefault();
      const target = document.querySelector(skipLink.getAttribute('href') || '') as HTMLElement;
      if (target) {
        target.setAttribute('tabindex', '-1');
        target.focus();
        target.addEventListener('blur', () => {
          target.removeAttribute('tabindex');
        }, { once: true });
      }
    });
  }

  private setupModalEscape(): void {
    document.addEventListener('keydown', (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        const openModal = document.querySelector('[aria-modal="true"]') as HTMLElement;
        if (openModal) {
          const closeButton = openModal.querySelector('[data-close]') as HTMLElement;
          closeButton?.click();
        }
      }
    });
  }

  private setupFocusTrap(): void {
    // Enhanced focus trap for modals and panels
    document.addEventListener('keydown', (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      const modal = document.querySelector('[aria-modal="true"]') as HTMLElement;
      if (!modal) return;

      const focusables = modal.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      ) as NodeListOf<HTMLElement>;
      
      if (!focusables.length) return;

      const firstFocusable = focusables[0];
      const lastFocusable = focusables[focusables.length - 1];

      if (e.shiftKey) {
        if (document.activeElement === firstFocusable) {
          e.preventDefault();
          lastFocusable.focus();
        }
      } else {
        if (document.activeElement === lastFocusable) {
          e.preventDefault();
          firstFocusable.focus();
        }
      }
    });
  }

  // Enhanced keyboard navigation
  private initKeyboardNavigation(): void {
    const gridConfig: GridConfig = {
      selectors: '.group a, .modernist-card a',
      columns: this.getGridColumns()
    };

    document.addEventListener('keydown', (e: KeyboardEvent) => {
      if (!['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) return;

      const activeElement = document.activeElement as HTMLElement;
      if (!activeElement?.matches(gridConfig.selectors)) return;

      e.preventDefault();
      
      const cards = Array.from(document.querySelectorAll(gridConfig.selectors)) as HTMLElement[];
      const currentIndex = cards.indexOf(activeElement);
      
      if (currentIndex === -1) return;

      const nextIndex = this.calculateNextIndex(
        currentIndex, 
        e.key, 
        cards.length, 
        gridConfig.columns
      );

      if (nextIndex >= 0 && nextIndex < cards.length) {
        cards[nextIndex].focus();
      }
    });

    // Update grid columns on resize
    window.addEventListener('resize', SiteInteractions.throttle(() => {
      gridConfig.columns = this.getGridColumns();
    }, 250));
  }

  private getGridColumns(): number {
    const width = window.innerWidth;
    if (width >= 1280) return 4;
    if (width >= 1024) return 3;
    if (width >= 768) return 2;
    return 1;
  }

  private calculateNextIndex(currentIndex: number, key: string, totalItems: number, columns: number): number {
    switch (key) {
      case 'ArrowRight':
        return (currentIndex + 1) % totalItems;
      case 'ArrowLeft':
        return (currentIndex - 1 + totalItems) % totalItems;
      case 'ArrowDown':
        return Math.min(currentIndex + columns, totalItems - 1);
      case 'ArrowUp':
        return Math.max(currentIndex - columns, 0);
      default:
        return currentIndex;
    }
  }

  // Motion preference handling
  private handleReducedMotion(): void {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    
    const updateMotionPreference = (mediaQuery: MediaQueryListEvent | MediaQueryList) => {
      this.isReducedMotion = mediaQuery.matches;
    };

    updateMotionPreference(prefersReducedMotion);
    prefersReducedMotion.addEventListener('change', updateMotionPreference);
  }

  // Initialize all enhancements
  private init(): void {
    // Use requestIdleCallback for non-critical features
    const initFeatures = () => {
      this.initSmoothScrolling();
      this.initLazyLoading();
      this.initFocusManagement();
      this.initKeyboardNavigation();
      this.handleReducedMotion();
    };

    if (window.requestIdleCallback) {
      window.requestIdleCallback(initFeatures, { timeout: 2000 });
    } else {
      setTimeout(initFeatures, 100);
    }
  }

  // Cleanup method for SPA navigation
  destroy(): void {
    // Disconnect observers
    this.observers.forEach(observer => observer.disconnect());
    this.observers.clear();
    
    // Remove event listeners
    if (this.handleAnchorClick) {
      document.removeEventListener('click', this.handleAnchorClick);
    }
  }
}

// Auto-initialize when DOM is ready
const siteInteractionsManager = (() => {
  let instance: SiteInteractions | null = null;
  
  const init = (): SiteInteractions => {
    if (instance) instance.destroy();
    instance = new SiteInteractions();
    return instance;
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Handle SPA navigation
  document.addEventListener('astro:after-swap', init);

  return { getInstance: () => instance };
})();

// Export for module usage
export default SiteInteractions;
export { siteInteractionsManager };