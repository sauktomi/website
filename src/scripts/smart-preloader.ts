/**
 * Smart Preloader System
 * 
 * Intelligently preloads ingredient and equipment data for optimal performance.
 * Uses predictive loading based on user behavior and content visibility
 * to reduce loading times and improve user experience.
 * 
 * Features:
 * - Predictive data loading
 * - Intersection Observer integration
 * - Memory-efficient caching
 * - Background loading optimization
 * - Error handling and fallbacks
 * 
 * Loading Strategies:
 * - Preload visible content immediately
 * - Lazy load off-screen content
 * - Cache frequently accessed data
 * - Prioritize critical information
 * 
 * Performance:
 * - Reduces initial page load time
 * - Minimizes memory usage
 * - Optimizes network requests
 * - Provides smooth user experience
 * 
 * @author Tomi
 * @version 2.0.0
 */

// Smart Ingredient Data Preloader
// Intelligently preloads ingredient data based on user behavior and page content

interface EventListenerTracker {
  element: Element | Document | Window;
  event: string;
  handler: EventListener;
}

interface IngredientData {
  ingredients: any[];
  categories: any[];
  [key: string]: any;
}

declare global {
  interface Window {
    IngredientDataLoader?: {
      loadIngredientData(): Promise<IngredientData>;
    };
    smartIngredientPreloader?: SmartIngredientPreloader;
    applyRecipeUrlFilters?: () => void;
  }
}

class SmartIngredientPreloader {
  private preloadedData: Map<string, any>;
  private preloadPromises: Map<string, Promise<any>>;
  private initialized: boolean;
  private observers: IntersectionObserver[];
  private eventListeners: EventListenerTracker[];
  
  constructor() {
    this.preloadedData = new Map();
    this.preloadPromises = new Map();
    this.initialized = false;
    this.observers = [];
    this.eventListeners = [];
    
    this.init();
  }
  
  cleanup(): void {
    // Disconnect all observers
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
    
    // Remove all event listeners
    this.eventListeners.forEach(({ element, event, handler }) => {
      if (element && element.removeEventListener) {
        element.removeEventListener(event, handler);
      }
    });
    this.eventListeners = [];
    
    // Clear caches
    this.preloadedData.clear();
    this.preloadPromises.clear();
    this.initialized = false;
  }
  
  private addEventListenerTracked(
    element: Element | Document | Window | null,
    event: string,
    handler: EventListener,
    options?: AddEventListenerOptions
  ): void {
    if (element && element.addEventListener) {
      element.addEventListener(event, handler, options);
      this.eventListeners.push({ element, event, handler });
    }
  }
  
  private init(): void {
    if (this.initialized) return;
    this.initialized = true;
    
    // Set up intersection observer for ingredient links
    this.setupIntersectionObserver();
    
    // Handle Astro navigation events
    this.setupNavigationHandlers();
    
    // Defer preloading to idle time if not immediately needed
    this.deferPreloading();
  }

  private deferPreloading(): void {
    const preloadIfNeeded = () => {
      if (this.shouldPreloadIngredientData()) {
        this.preloadIngredientData();
      }
    };

    if (window.requestIdleCallback) {
      window.requestIdleCallback(preloadIfNeeded, { timeout: 3000 });
    } else {
      setTimeout(preloadIfNeeded, 200);
    }
  }
  
  private setupIntersectionObserver(): void {
    if (!('IntersectionObserver' in window)) return;
    
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const element = entry.target as HTMLElement;
          
          // Preload ingredient data if ingredient links are visible
          if (element.matches('.wiki-link--ingredient, .ingredient-link')) {
            this.preloadIngredientData();
          }
          
          observer.unobserve(element);
        }
      });
    }, {
      rootMargin: '100px 0px',
      threshold: 0.1
    });
    
    this.observers.push(observer);
    
    // Observe ingredient-related elements
    document.querySelectorAll('.wiki-link--ingredient, .ingredient-link').forEach(el => {
      observer.observe(el);
    });
  }
  
  private setupNavigationHandlers(): void {
    const navigationHandler = (): void => {
      // Re-observe new elements after navigation
      this.setupIntersectionObserver();
      
      // Preload data if current page likely needs it
      if (this.shouldPreloadIngredientData()) {
        this.preloadIngredientData();
      }
      
      // Special handling for reference pages
      if (this.isReferencePage()) {
        this.handleReferencePage();
      }
      
      // Coordinate with recipe filtering if on recipes page
      if (this.isRecipePage()) {
        this.handleRecipePage();
      }
    };
    
    // Clean up before navigation
    const cleanupHandler = (): void => {
      this.cleanup();
    };
    
    this.addEventListenerTracked(document, 'astro:before-swap', cleanupHandler);
    
    ['astro:after-swap', 'astro:page-load'].forEach(event => {
      this.addEventListenerTracked(document, event, navigationHandler);
    });
  }
  
  private shouldPreloadIngredientData(): boolean {
    return !!(document.querySelector('.wiki-link--ingredient, .ingredient-link, #ingredient-popup') ||
           document.body.classList.contains('recipe-page') ||
           window.location.pathname.includes('/reseptit') ||
           window.location.pathname.includes('/hakemisto') ||
           this.isReferencePage());
  }
  
  private isReferencePage(): boolean {
    return document.querySelector('script[data-reference-page]') !== null ||
           window.location.pathname.includes('/hakemisto/ainesosat');
  }
  
  private isRecipePage(): boolean {
    return window.location.pathname.includes('/reseptit');
  }
  
  private handleReferencePage(): void {
    // Ensure ingredient data is preloaded for reference pages
    this.preloadIngredientData();
    
    // Set up special observers for reference page links
    const ingredientLinks = document.querySelectorAll('.ingredient-item a[href^="#"]');
    ingredientLinks.forEach(link => {
      this.addEventListenerTracked(link, 'mouseenter', () => {
        // Preload ingredient data on hover for faster popup response
        this.preloadIngredientData();
      }, { once: true, passive: true });
    });
  }
  
  private handleRecipePage(): void {
    // Trigger URL filtering for recipe pages after navigation
    if (typeof window.applyRecipeUrlFilters === 'function') {
      // Call immediately
      window.applyRecipeUrlFilters();
    }
  }
  
  private async preloadIngredientData(): Promise<IngredientData | null> {
    const cacheKey = 'ingredient-data';
    
    if (this.preloadedData.has(cacheKey)) {
      return this.preloadedData.get(cacheKey);
    }
    
    if (this.preloadPromises.has(cacheKey)) {
      return this.preloadPromises.get(cacheKey);
    }
    
    // Use existing data loader if available
    if (window.IngredientDataLoader) {
      const promise = window.IngredientDataLoader.loadIngredientData();
      this.preloadPromises.set(cacheKey, promise);
      
      try {
        const data = await promise;
        this.preloadedData.set(cacheKey, data);
        this.preloadPromises.delete(cacheKey);
        return data;
      } catch (error) {
        this.preloadPromises.delete(cacheKey);
        console.warn('Failed to preload ingredient data:', error);
        return null;
      }
    }
    
    return null;
  }
  
  // Public API
  getPreloadedData(key: string): any {
    return this.preloadedData.get(key);
  }
  
  clearCache(): void {
    this.preloadedData.clear();
    this.preloadPromises.clear();
  }
}

// Initialize smart ingredient preloader with proper cleanup
if (typeof window !== 'undefined') {
  // Clean up existing instance
  if (window.smartIngredientPreloader && typeof window.smartIngredientPreloader.cleanup === 'function') {
    window.smartIngredientPreloader.cleanup();
  }
  
  window.smartIngredientPreloader = new SmartIngredientPreloader();
}

export default SmartIngredientPreloader;