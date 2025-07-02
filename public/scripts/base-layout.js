// Base Layout Initialization Script
// Externalized from BaseLayout.astro inline script

// Component Manager for handling initialization timing and dependencies
class ComponentManager {
  constructor() {
    this.initialized = new Set();
    this.dataReady = false;
  }

  async waitForData() {
    return new Promise((resolve) => {
      const checkData = () => {
        const ingredientsScript = document.getElementById('ingredients-data');
        const equipmentScript = document.getElementById('equipment-data');
        
        // Parse ingredients data
        if (ingredientsScript) {
          try {
            window.ingredientsData = JSON.parse(ingredientsScript.textContent);
          } catch (e) {
            console.warn('Could not parse ingredients data:', e);
            window.ingredientsData = { ingredients: [], categories: [] };
          }
        }
        
        // Parse equipment data if available
        if (equipmentScript) {
          try {
            window.equipmentData = JSON.parse(equipmentScript.textContent);
            
            // Merge equipment data into ingredients data
            if (window.ingredientsData && window.equipmentData) {
              window.ingredientsData.ingredients = [
                ...(window.ingredientsData.ingredients || []),
                ...(window.equipmentData.ingredients || [])
              ];
              window.ingredientsData.categories = [
                ...(window.ingredientsData.categories || []),
                ...(window.equipmentData.categories || [])
              ];
            }
          } catch (e) {
            console.warn('Could not parse equipment data:', e);
          }
        }
        
        this.dataReady = true;
        resolve();
      };
      
      // Check immediately or wait for DOM
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', checkData);
      } else {
        checkData();
      }
    });
  }

  async initializeComponent(name, initFunction) {
    if (this.initialized.has(name)) return;
    
    // Wait for data if needed
    if (!this.dataReady) {
      await this.waitForData();
    }
    
    try {
      await initFunction();
      this.initialized.add(name);
    } catch (e) {
      console.warn(`Failed to initialize ${name}:`, e);
    }
  }

  reset() {
    this.initialized.clear();
    this.dataReady = false;
  }
}

// SiteManager class (simplified from original)
class SiteManager {
  constructor() {
    this.state = {
      sidebarOpen: false,
      sidebarView: 'navigation' // 'navigation' or 'settings'
    };
    
    this.elements = new Map();
    this.init();
  }
  
  initElements() {
    const selectors = {
      sidebar: '#sidebar',
      sidebarMainToggle: '#sidebar-main-toggle',
      sidebarOverlay: '#sidebar-overlay',
      pageContainer: '#page-container',
      settingsToggle: '#settings-toggle',
      sidebarNavigationView: '#sidebar-main-content nav',
      sidebarSettingsView: '#sidebar-settings-view',
      sidebarNavigationHeader: '#sidebar-navigation-header',
      sidebarSettingsHeader: '#sidebar-settings-header',
      sidebarSettingsBackHeader: '#sidebar-settings-back-header',
      sidebarNavigationBack: '#sidebar-navigation-back',
      darkModeToggle: '#dark-mode-toggle',
      timerNotifications: '#timer-notifications',
      mobileRecipeSidebar: '#mobile-recipe-sidebar'
    };
    
    Object.entries(selectors).forEach(([key, selector]) => {
      this.elements.set(key, document.querySelector(selector));
    });
  }

  setupSettings() {
    this.settingsConfig = {
      darkMode: { default: false, element: 'darkModeToggle', storageKey: 'user-theme-choice' },
      timerNotifications: { default: true, element: 'timerNotifications' },
      mobileRecipeSidebar: { default: true, element: 'mobileRecipeSidebar' }
    };
    
    this.loadSettings();
    this.bindSettingsEvents();
  }

  loadSettings() {
    Object.entries(this.settingsConfig).forEach(([key, config]) => {
      try {
        const storageKey = config.storageKey || key;
        const stored = localStorage.getItem(storageKey);
        
        let value;
        if (key === 'darkMode') {
          // For darkMode, use same logic as ThemeManager: user choice OR system preference
          if (stored !== null) {
            value = stored === 'dark';
          } else {
            // No user preference - check system preference
            value = window.matchMedia('(prefers-color-scheme: dark)').matches;
          }
        } else {
          value = stored !== null ? stored === 'true' : config.default;
        }
        
        if (config.element) {
          const element = this.elements.get(config.element);
          if (element) element.checked = value;
        }
      } catch (e) {
        console.warn(`Failed to load setting: ${key}`, e);
      }
    });
  }

  saveSettings() {
    try {
      Object.entries(this.settingsConfig).forEach(([key, config]) => {
        if (config.element) {
          const element = this.elements.get(config.element);
          const value = element?.checked ?? config.default;
          const storageKey = config.storageKey || key;
          
          if (key === 'darkMode') {
            // For darkMode, store the theme directly ('dark'/'light') not boolean
            localStorage.setItem(storageKey, value ? 'dark' : 'light');
          } else {
            localStorage.setItem(storageKey, value.toString());
          }
        }
      });
      
      // Handle dark mode toggle using ThemeManager
      const darkModeElement = this.elements.get('darkModeToggle');
      if (darkModeElement && window.ThemeManager) {
        const shouldBeDark = darkModeElement.checked;
        
        // Apply the theme change immediately
        window.ThemeManager.apply(shouldBeDark);
        window.ThemeManager.setupState(shouldBeDark);
      }
      
      // Handle mobile recipe sidebar toggle
      const mobileRecipeSidebarElement = this.elements.get('mobileRecipeSidebar');
      if (mobileRecipeSidebarElement) {
        const shouldShow = mobileRecipeSidebarElement.checked;
        const recipeRightSidebar = document.querySelector('#recipe-right-sidebar');
        if (recipeRightSidebar) {
          recipeRightSidebar.setAttribute('data-sidebar-enabled', shouldShow.toString());
        }
        
        // Update html data attribute for CSS margin control (like theme system)
        const isRecipePage = window.location.pathname.startsWith('/reseptit/');
        if (isRecipePage && shouldShow) {
          document.documentElement.setAttribute('data-mobile-recipe-sidebar', 'enabled');
        } else {
          document.documentElement.removeAttribute('data-mobile-recipe-sidebar');
        }
      }
      
      // Dispatch settings change event
      document.dispatchEvent(new CustomEvent('recipeSettingsChanged', {
        detail: this.getSettingsValues()
      }));
    } catch (e) {
      console.warn('Failed to save settings:', e);
    }
  }

  getSettingsValues() {
    const values = {};
    Object.entries(this.settingsConfig).forEach(([key, config]) => {
      const storageKey = config.storageKey || key;
      const stored = localStorage.getItem(storageKey);
      
      if (key === 'darkMode') {
        values[key] = stored === 'dark';
      } else {
        values[key] = stored === 'true';
      }
    });
    return values;
  }

  bindSettingsEvents() {
    const settingElements = [
      'darkModeToggle',
      'timerNotifications',
      'mobileRecipeSidebar'
    ];
    
    settingElements.forEach(elementKey => {
      const element = this.elements.get(elementKey);
      if (element) {
        element.addEventListener('change', () => this.saveSettings());
      }
    });
  }

  setupSidebar() {
    this.sidebarActions = {
      open: () => {
        const html = document.documentElement;
        const sidebar = this.elements.get('sidebar');
        const isDesktop = window.innerWidth >= 1024;
        
        if (isDesktop) {
          html.setAttribute('data-sidebar', 'expanded');
        } else {
          html.setAttribute('data-sidebar', 'open');
        }
        
        // Immediately show background when opening
        if (sidebar) {
          sidebar.classList.remove('sidebar-bg-hiding');
          sidebar.classList.add('sidebar-bg-visible');
        }
        
        this.state.sidebarOpen = true;
      },
      
      close: () => {
        const html = document.documentElement;
        const sidebar = this.elements.get('sidebar');
        
        html.setAttribute('data-sidebar', 'collapsed');
        this.state.sidebarOpen = false;
        
        // Handle background removal with delay
        if (sidebar) {
          sidebar.classList.remove('sidebar-bg-visible');
          sidebar.classList.add('sidebar-bg-hiding');
          
          // Remove hiding class after animation completes (600ms)
          setTimeout(() => {
            sidebar.classList.remove('sidebar-bg-hiding');
          }, 600);
        }
        
        // Always return to navigation view when sidebar closes
        this.sidebarViewActions?.showNavigation();
      },
      
      toggle: () => {
        if (this.state.sidebarOpen) {
          this.sidebarActions.close();
        } else {
          this.sidebarActions.open();
        }
      }
    };
    
    this.bindSidebarEvents();
  }

  bindSidebarEvents() {
    const eventMap = [
      ['sidebarMainToggle', this.sidebarActions.toggle],
      ['sidebarOverlay', this.sidebarActions.close]
    ];
    
    eventMap.forEach(([elementKey, handler]) => {
      const element = this.elements.get(elementKey);
      if (element) {
        element.addEventListener('click', handler);
      }
    });
  }

  setupSidebarViews() {
    this.sidebarViewActions = {
      showNavigation: () => {
        const navigationView = this.elements.get('sidebarNavigationView');
        const settingsView = this.elements.get('sidebarSettingsView');
        const navigationHeader = this.elements.get('sidebarNavigationHeader');
        const settingsHeader = this.elements.get('sidebarSettingsHeader');
        const settingsToggle = this.elements.get('settingsToggle');
        const settingsBackHeader = this.elements.get('sidebarSettingsBackHeader');
        const navigationBack = this.elements.get('sidebarNavigationBack');
        
        if (navigationView && settingsView && navigationHeader && settingsHeader) {
          // Switch content views
          navigationView.classList.remove('hidden');
          navigationView.classList.add('flex');
          settingsView.classList.add('hidden');
          settingsView.classList.remove('flex');
          
          // Switch headers
          navigationHeader.classList.remove('hidden');
          navigationHeader.classList.add('flex');
          settingsHeader.classList.add('hidden');
          settingsHeader.classList.remove('flex');
          
          // Switch left button bar buttons - show settings and navigation back, hide settings back
          if (settingsToggle) {
            settingsToggle.classList.remove('hidden');
          }
          if (settingsBackHeader) {
            settingsBackHeader.classList.add('hidden');
          }
          if (navigationBack) {
            navigationBack.classList.remove('hidden');
          }
          
          this.state.sidebarView = 'navigation';
        }
      },
      
      showSettings: () => {
        const navigationView = this.elements.get('sidebarNavigationView');
        const settingsView = this.elements.get('sidebarSettingsView');
        const navigationHeader = this.elements.get('sidebarNavigationHeader');
        const settingsHeader = this.elements.get('sidebarSettingsHeader');
        const settingsToggle = this.elements.get('settingsToggle');
        const settingsBackHeader = this.elements.get('sidebarSettingsBackHeader');
        const navigationBack = this.elements.get('sidebarNavigationBack');
        
        if (navigationView && settingsView && navigationHeader && settingsHeader) {
          // Switch content views
          navigationView.classList.add('hidden');
          navigationView.classList.remove('flex');
          settingsView.classList.remove('hidden');
          settingsView.classList.add('flex');
          
          // Switch headers
          navigationHeader.classList.add('hidden');
          navigationHeader.classList.remove('flex');
          settingsHeader.classList.remove('hidden');
          settingsHeader.classList.add('flex');
          
          // Switch left button bar buttons - show settings back, hide settings and navigation back
          if (settingsToggle) {
            settingsToggle.classList.add('hidden');
          }
          if (settingsBackHeader) {
            settingsBackHeader.classList.remove('hidden');
          }
          if (navigationBack) {
            navigationBack.classList.add('hidden');
          }
          
          this.state.sidebarView = 'settings';
        }
      },
      
      toggleToSettings: () => {
        // If sidebar is closed, open it and show settings
        if (!this.state.sidebarOpen) {
          this.sidebarActions.open();
        }
        this.sidebarViewActions.showSettings();
      }
    };
    
    this.bindSidebarViewEvents();
  }

  bindSidebarViewEvents() {
    // Settings toggle buttons
    const settingsToggles = document.querySelectorAll('#settings-toggle');
    settingsToggles.forEach(toggle => {
      toggle.addEventListener('click', this.sidebarViewActions.toggleToSettings);
    });
    
    // Settings back button in header
    const settingsBackHeader = this.elements.get('sidebarSettingsBackHeader');
    if (settingsBackHeader) {
      settingsBackHeader.addEventListener('click', () => {
        this.sidebarViewActions.showNavigation();
        this.saveSettings(); // Save settings when leaving settings view
      });
    }
  }

  setupResponsive() {
    const handleResize = () => {
      const html = document.documentElement;
      const sidebar = this.elements.get('sidebar');
      
      if (window.innerWidth >= 1024) {
        html.setAttribute('data-layout', 'desktop');
        html.setAttribute('data-sidebar', 'collapsed');
        
        // Close sidebar when switching to desktop
        this.state.sidebarOpen = false;
      } else {
        html.setAttribute('data-layout', 'mobile');
        html.setAttribute('data-sidebar', 'collapsed');
        
        // Close sidebar when switching to mobile
        this.state.sidebarOpen = false;
      }
      
      // Clear background classes on resize since sidebar is closed
      if (sidebar) {
        sidebar.classList.remove('sidebar-bg-visible', 'sidebar-bg-hiding');
      }
    };
    
    handleResize();
    window.addEventListener('resize', this.throttle(handleResize, 250));
  }

  throttle(func, limit) {
    let inThrottle;
    return function(...args) {
      if (!inThrottle) {
        func.apply(this, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  }

  init() {
    this.initElements();
    
    // Initialize ThemeManager first to sync toggle button state
    if (window.ThemeManager) {
      window.ThemeManager.init();
    }
    
    this.setupSettings();
    this.setupSidebar();
    this.setupSidebarViews();
    this.setupResponsive();
  }
}

// Global component manager and initialization
window.componentManager = new ComponentManager();

const handleNavigation = async () => {
  // Reset sidebar state on navigation - always start closed
  const html = document.documentElement;
  const sidebar = document.querySelector('#sidebar');
  const isDesktop = window.innerWidth >= 1024;
  
  if (isDesktop) {
    html.setAttribute('data-layout', 'desktop');
    html.setAttribute('data-sidebar', 'collapsed');
  } else {
    html.setAttribute('data-layout', 'mobile');
    html.setAttribute('data-sidebar', 'collapsed');
  }
  
  // Clear background classes on navigation
  if (sidebar) {
    sidebar.classList.remove('sidebar-bg-visible', 'sidebar-bg-hiding');
  }
  
  // Optimized for prefetched pages - immediate cleanup and initialization
  window.componentManager.reset();
  
  // Clear popup instance to ensure clean reinitialization
  if (window.ingredientPopupInstance) {
    window.ingredientPopupInstance = null;
  }
  
  // Preload ingredient data if needed (for faster popup interactions)
  if (window.IngredientDataLoader && !window.IngredientDataLoader.getCachedData()) {
    const hasIngredientLinks = document.querySelector('.wiki-link--ingredient, .ingredient-link, #ingredient-popup');
    if (hasIngredientLinks) {
      window.IngredientDataLoader.preload();
    }
  }
  
  // Initialize core site manager
  await window.componentManager.initializeComponent('siteManager', () => {
    if (window.siteManager) {
      window.siteManager = null;
    }
    window.siteManager = new SiteManager();
  });
  
  // Initialize page-specific components with faster timing for prefetched pages
  const initPromises = [];
  
  // Only initialize ingredient popup if it exists on the page
  if (document.getElementById('ingredient-popup')) {
    initPromises.push(
      window.componentManager.initializeComponent('ingredientPopup', () => {
        if (typeof window.initIngredientPopup === 'function') {
          window.initIngredientPopup();
        }
      })
    );
  }
  
  // Only initialize recipe features if we're on a recipe page
  if (typeof window.initRecipeFeatures === 'function') {
    initPromises.push(
      window.componentManager.initializeComponent('recipeFeatures', () => {
        window.initRecipeFeatures();
      })
    );
  }
  
  // Wait for all components to initialize in parallel
  await Promise.all(initPromises);
  
  // Handle immediate hash navigation for prefetched pages
  if (window.location.hash) {
    setTimeout(() => {
      window.dispatchEvent(new Event('hashchange'));
    }, 50);
  }
};

// Single initialization handler
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', handleNavigation);
} else {
  handleNavigation();
}

// Handle navigation events
document.addEventListener('astro:page-load', handleNavigation);