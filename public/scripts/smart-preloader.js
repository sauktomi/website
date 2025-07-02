// Smart Ingredient Data Preloader
// Intelligently preloads ingredient data based on user behavior and page content

class SmartIngredientPreloader {
  constructor() {
    this.preloadedData = new Map();
    this.preloadPromises = new Map();
    this.initialized = false;
    this.observers = [];
    this.eventListeners = [];
    
    this.init();
  }
  
  cleanup() {
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
  
  addEventListenerTracked(element, event, handler, options) {
    if (element && element.addEventListener) {
      element.addEventListener(event, handler, options);
      this.eventListeners.push({ element, event, handler });
    }
  }
  
  init() {
    if (this.initialized) return;
    this.initialized = true;
    
    // Set up intersection observer for ingredient links
    this.setupIntersectionObserver();
    
    // Handle Astro navigation events
    this.setupNavigationHandlers();
    
    // Preload ingredient data if current page likely needs it
    if (this.shouldPreloadIngredientData()) {
      this.preloadIngredientData();
    }
  }
  
  setupIntersectionObserver() {
    if (!('IntersectionObserver' in window)) return;
    
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const element = entry.target;
          
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
  
  setupNavigationHandlers() {
    const navigationHandler = () => {
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
    const cleanupHandler = () => {
      this.cleanup();
    };
    
    this.addEventListenerTracked(document, 'astro:before-swap', cleanupHandler);
    
    ['astro:after-swap', 'astro:page-load'].forEach(event => {
      this.addEventListenerTracked(document, event, navigationHandler);
    });
  }
  
  shouldPreloadIngredientData() {
    return document.querySelector('.wiki-link--ingredient, .ingredient-link, #ingredient-popup') ||
           document.body.classList.contains('recipe-page') ||
           window.location.pathname.includes('/reseptit') ||
           window.location.pathname.includes('/hakemisto') ||
           this.isReferencePage();
  }
  
  isReferencePage() {
    return document.querySelector('script[data-reference-page]') !== null ||
           window.location.pathname.includes('/hakemisto/ainesosat');
  }
  
  isRecipePage() {
    return window.location.pathname.includes('/reseptit');
  }
  
  handleReferencePage() {
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
  
  handleRecipePage() {
    // Trigger URL filtering for recipe pages after navigation
    if (typeof window.applyRecipeUrlFilters === 'function') {
      // Call immediately
      window.applyRecipeUrlFilters();
    }
  }
  
  async preloadIngredientData() {
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
  getPreloadedData(key) {
    return this.preloadedData.get(key);
  }
  
  clearCache() {
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

