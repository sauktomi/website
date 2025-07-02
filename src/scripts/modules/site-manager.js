/**
 * Site Manager Module
 * Consolidated site-wide functionality combining base layout, interactions, and theme management
 */

import { DOMUtils } from '../utils/dom.js';

export class SiteManager {
  constructor() {
    this.state = {
      sidebarOpen: false,
      sidebarView: 'navigation',
      currentTheme: 'light',
      isReducedMotion: DOMUtils.prefersReducedMotion()
    };
    
    this.elements = new Map();
    this.observers = new Map();
    this.cleanupFunctions = [];
    this.initialized = new Set();
    
    this.settingsConfig = {
      darkMode: { default: false, element: 'darkModeToggle', storageKey: 'user-theme-choice' },
      timerNotifications: { default: true, element: 'timerNotifications' },
      mobileRecipeSidebar: { default: true, element: 'mobileRecipeSidebar' }
    };
  }

  /**
   * Initialize all site functionality
   */
  async init() {
    try {
      this.initElements();
      this.initTheme();
      this.initSettings();
      this.initSidebar();
      this.initInteractions();
      this.initResponsive();
      
      console.log('✅ Site Manager initialized successfully');
    } catch (error) {
      console.error('❌ Site Manager initialization failed:', error);
    }
  }

  /**
   * Initialize DOM element references
   */
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
    
    this.elements = DOMUtils.mapElements(selectors);
  }

  /**
   * Theme Management
   */
  initTheme() {
    try {
      const currentTheme = this.getCurrentTheme();
      const appliedTheme = document.documentElement.getAttribute('data-theme');
      
      if (appliedTheme !== currentTheme) {
        this.applyTheme(currentTheme === 'dark');
      }
      
      this.state.currentTheme = currentTheme;
      this.syncThemeToggle(currentTheme === 'dark');
      
      // Set up global theme state
      window.ThemeManager = {
        current: currentTheme,
        isDark: currentTheme === 'dark',
        apply: () => this.applyTheme(this.getCurrentTheme() === 'dark'),
        toggle: () => this.toggleTheme(),
        init: () => this.initTheme()
      };
      
    } catch (e) {
      console.warn('Theme initialization failed:', e);
      this.applyTheme(false);
      this.state.currentTheme = 'light';
      this.syncThemeToggle(false);
    }
  }

  getCurrentTheme() {
    try {
      const stored = localStorage.getItem('user-theme-choice');
      return stored !== null 
        ? stored
        : (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    } catch {
      return 'light';
    }
  }

  applyTheme(isDark) {
    const html = document.documentElement;
    const theme = isDark ? 'dark' : 'light';
    const currentTheme = html.getAttribute('data-theme');
    
    if (currentTheme !== theme) {
      html.setAttribute('data-theme', theme);
      this.state.currentTheme = theme;
      
      if (document.body) {
        document.body.offsetHeight;
      }
      
      document.dispatchEvent(new CustomEvent('themeChanged', {
        detail: { theme, isDark }
      }));
    }
  }

  syncThemeToggle(isDark) {
    const toggleButton = this.elements.get('darkModeToggle');
    if (toggleButton) {
      toggleButton.checked = isDark;
    }
  }

  toggleTheme() {
    try {
      const current = this.getCurrentTheme();
      const newTheme = current === 'dark' ? 'light' : 'dark';
      localStorage.setItem('user-theme-choice', newTheme);
      this.applyTheme(newTheme === 'dark');
      this.syncThemeToggle(newTheme === 'dark');
      this.state.currentTheme = newTheme;
      return newTheme === 'dark';
    } catch (e) {
      console.warn('Theme toggle failed:', e);
      return false;
    }
  }

  /**
   * Settings Management
   */
  initSettings() {
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
      
      // Handle dark mode toggle
      const darkModeElement = this.elements.get('darkModeToggle');
      if (darkModeElement) {
        const shouldBeDark = darkModeElement.checked;
        this.applyTheme(shouldBeDark);
      }
      
      // Handle mobile recipe sidebar toggle
      const mobileRecipeSidebarElement = this.elements.get('mobileRecipeSidebar');
      if (mobileRecipeSidebarElement) {
        const shouldShow = mobileRecipeSidebarElement.checked;
        const recipeRightSidebar = DOMUtils.$('#recipe-right-sidebar');
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
    const settingElements = ['darkModeToggle', 'timerNotifications', 'mobileRecipeSidebar'];
    
    settingElements.forEach(elementKey => {
      const element = this.elements.get(elementKey);
      if (element) {
        const cleanup = DOMUtils.addEvent(element, 'change', () => this.saveSettings());
        this.cleanupFunctions.push(cleanup);
      }
    });
  }

  /**
   * Sidebar Management
   */
  initSidebar() {
    this.setupSidebarActions();
    this.setupSidebarViews();
    this.bindSidebarEvents();
  }

  setupSidebarActions() {
    this.sidebarActions = {
      open: () => {
        const html = document.documentElement;
        const sidebar = this.elements.get('sidebar');
        const isDesktop = !DOMUtils.isMobile();
        
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
  }

  setupSidebarViews() {
    this.sidebarViewActions = {
      showNavigation: () => {
        const elements = [
          'sidebarNavigationView', 'sidebarSettingsView', 'sidebarNavigationHeader',
          'sidebarSettingsHeader', 'settingsToggle', 'sidebarSettingsBackHeader', 'sidebarNavigationBack'
        ].map(key => this.elements.get(key));

        const [navigationView, settingsView, navigationHeader, settingsHeader, 
               settingsToggle, settingsBackHeader, navigationBack] = elements;
        
        if (navigationView && settingsView && navigationHeader && settingsHeader) {
          // Switch content views
          DOMUtils.toggleVisibility(navigationView, true, 'flex');
          DOMUtils.toggleVisibility(settingsView, false);
          
          // Switch headers
          DOMUtils.toggleVisibility(navigationHeader, true, 'flex');
          DOMUtils.toggleVisibility(settingsHeader, false);
          
          // Switch left button bar buttons
          DOMUtils.toggleVisibility(settingsToggle, true);
          DOMUtils.toggleVisibility(settingsBackHeader, false);
          DOMUtils.toggleVisibility(navigationBack, true);
          
          this.state.sidebarView = 'navigation';
        }
      },
      
      showSettings: () => {
        const elements = [
          'sidebarNavigationView', 'sidebarSettingsView', 'sidebarNavigationHeader',
          'sidebarSettingsHeader', 'settingsToggle', 'sidebarSettingsBackHeader', 'sidebarNavigationBack'
        ].map(key => this.elements.get(key));

        const [navigationView, settingsView, navigationHeader, settingsHeader, 
               settingsToggle, settingsBackHeader, navigationBack] = elements;
        
        if (navigationView && settingsView && navigationHeader && settingsHeader) {
          // Switch content views
          DOMUtils.toggleVisibility(navigationView, false);
          DOMUtils.toggleVisibility(settingsView, true, 'flex');
          
          // Switch headers
          DOMUtils.toggleVisibility(navigationHeader, false);
          DOMUtils.toggleVisibility(settingsHeader, true, 'flex');
          
          // Switch left button bar buttons
          DOMUtils.toggleVisibility(settingsToggle, false);
          DOMUtils.toggleVisibility(settingsBackHeader, true);
          DOMUtils.toggleVisibility(navigationBack, false);
          
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
  }

  bindSidebarEvents() {
    const eventMap = [
      ['sidebarMainToggle', this.sidebarActions.toggle],
      ['sidebarOverlay', this.sidebarActions.close]
    ];
    
    eventMap.forEach(([elementKey, handler]) => {
      const element = this.elements.get(elementKey);
      if (element) {
        const cleanup = DOMUtils.addEvent(element, 'click', handler);
        this.cleanupFunctions.push(cleanup);
      }
    });

    // Settings toggle buttons
    const settingsToggles = DOMUtils.$$('#settings-toggle');
    settingsToggles.forEach(toggle => {
      const cleanup = DOMUtils.addEvent(toggle, 'click', this.sidebarViewActions.toggleToSettings);
      this.cleanupFunctions.push(cleanup);
    });
    
    // Settings back button
    const settingsBackHeader = this.elements.get('sidebarSettingsBackHeader');
    if (settingsBackHeader) {
      const cleanup = DOMUtils.addEvent(settingsBackHeader, 'click', () => {
        this.sidebarViewActions.showNavigation();
        this.saveSettings();
      });
      this.cleanupFunctions.push(cleanup);
    }
  }

  /**
   * Site Interactions (from site-interactions.js)
   */
  initInteractions() {
    this.initSmoothScrolling();
    this.initLazyLoading();
    this.initFocusManagement();
    this.initKeyboardNavigation();
    this.handleReducedMotion();
  }

  initSmoothScrolling() {
    if (this.state.isReducedMotion) return;

    const handleAnchorClick = (e) => {
      const link = e.target.closest('a[href^="#"]');
      if (!link) return;

      const targetId = link.getAttribute('href');
      if (targetId === '#') return;

      const targetElement = DOMUtils.$(targetId);
      if (!targetElement) return;

      e.preventDefault();
      DOMUtils.scrollToElement(targetElement);

      // Update URL without jumping
      if (history.pushState) {
        history.pushState(null, null, targetId);
      }
    };

    const cleanup = DOMUtils.addEvent(document, 'click', handleAnchorClick, { passive: false });
    this.cleanupFunctions.push(cleanup);
  }

  initLazyLoading() {
    if (!('IntersectionObserver' in window)) return;

    const imageObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target;
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
    DOMUtils.$$('img[data-src]').forEach(img => {
      imageObserver.observe(img);
    });
  }

  loadImage(img) {
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
      
      tempImg.src = img.dataset.src;
    });
  }

  initFocusManagement() {
    this.setupSkipLink();
    this.setupModalEscape();
    this.setupFocusTrap();
  }

  setupSkipLink() {
    const skipLink = DOMUtils.$('.skip-link');
    if (!skipLink) return;

    const cleanup = DOMUtils.addEvent(skipLink, 'click', (e) => {
      e.preventDefault();
      const target = DOMUtils.$(skipLink.getAttribute('href'));
      if (target) {
        target.setAttribute('tabindex', '-1');
        DOMUtils.focusElement(target);
        DOMUtils.addEvent(target, 'blur', () => {
          target.removeAttribute('tabindex');
        }, { once: true });
      }
    });
    
    this.cleanupFunctions.push(cleanup);
  }

  setupModalEscape() {
    const cleanup = DOMUtils.addEvent(document, 'keydown', (e) => {
      if (e.key === 'Escape') {
        const openModal = DOMUtils.$('[aria-modal="true"]');
        if (openModal) {
          const closeButton = DOMUtils.$('[data-close]', openModal);
          closeButton?.click();
        }
      }
    });
    
    this.cleanupFunctions.push(cleanup);
  }

  setupFocusTrap() {
    const cleanup = DOMUtils.addEvent(document, 'keydown', (e) => {
      if (e.key !== 'Tab') return;

      const modal = DOMUtils.$('[aria-modal="true"]');
      if (!modal) return;

      const focusables = DOMUtils.getFocusableElements(modal);
      if (!focusables.length) return;

      const firstFocusable = focusables[0];
      const lastFocusable = focusables[focusables.length - 1];

      if (e.shiftKey) {
        if (document.activeElement === firstFocusable) {
          e.preventDefault();
          DOMUtils.focusElement(lastFocusable);
        }
      } else {
        if (document.activeElement === lastFocusable) {
          e.preventDefault();
          DOMUtils.focusElement(firstFocusable);
        }
      }
    });
    
    this.cleanupFunctions.push(cleanup);
  }

  initKeyboardNavigation() {
    // Grid navigation for card layouts
    const cleanup = DOMUtils.addEvent(document, 'keydown', (e) => {
      if (!['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) return;

      const activeElement = document.activeElement;
      const selectors = '.group a, .modernist-card a';
      if (!activeElement?.matches(selectors)) return;

      e.preventDefault();
      
      const cards = DOMUtils.$$(selectors);
      const currentIndex = cards.indexOf(activeElement);
      
      if (currentIndex === -1) return;

      const columns = this.getGridColumns();
      const nextIndex = this.calculateNextIndex(currentIndex, e.key, cards.length, columns);

      if (nextIndex >= 0 && nextIndex < cards.length) {
        DOMUtils.focusElement(cards[nextIndex]);
      }
    });
    
    this.cleanupFunctions.push(cleanup);
  }

  getGridColumns() {
    const breakpoint = DOMUtils.getBreakpoint();
    switch (breakpoint) {
      case 'xl': return 4;
      case 'lg': return 3;
      case 'md': return 2;
      default: return 1;
    }
  }

  calculateNextIndex(currentIndex, key, totalItems, columns) {
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

  handleReducedMotion() {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    
    const updateMotionPreference = (mediaQuery) => {
      this.state.isReducedMotion = mediaQuery.matches;
    };

    updateMotionPreference(prefersReducedMotion);
    prefersReducedMotion.addEventListener('change', updateMotionPreference);
  }

  /**
   * Responsive Design Management
   */
  initResponsive() {
    const handleResize = DOMUtils.throttle(() => {
      const html = document.documentElement;
      const sidebar = this.elements.get('sidebar');
      
      if (DOMUtils.isMobile()) {
        html.setAttribute('data-layout', 'mobile');
        html.setAttribute('data-sidebar', 'collapsed');
        this.state.sidebarOpen = false;
      } else {
        html.setAttribute('data-layout', 'desktop');
        html.setAttribute('data-sidebar', 'collapsed');
        this.state.sidebarOpen = false;
      }
      
      // Clear background classes on resize since sidebar is closed
      if (sidebar) {
        sidebar.classList.remove('sidebar-bg-visible', 'sidebar-bg-hiding');
      }
    }, 250);
    
    handleResize(); // Run immediately
    const cleanup = DOMUtils.addEvent(window, 'resize', handleResize);
    this.cleanupFunctions.push(cleanup);
  }

  /**
   * Navigation handling for SPA-like behavior
   */
  handleNavigation() {
    // Reset sidebar state on navigation - always start closed
    const html = document.documentElement;
    const sidebar = this.elements.get('sidebar');
    
    if (DOMUtils.isMobile()) {
      html.setAttribute('data-layout', 'mobile');
      html.setAttribute('data-sidebar', 'collapsed');
    } else {
      html.setAttribute('data-layout', 'desktop');
      html.setAttribute('data-sidebar', 'collapsed');
    }
    
    // Clear background classes on navigation
    if (sidebar) {
      sidebar.classList.remove('sidebar-bg-visible', 'sidebar-bg-hiding');
    }
    
    // Reset state
    this.state.sidebarOpen = false;
    this.initialized.clear();
    
    // Clear popup instance to ensure clean reinitialization
    if (window.ingredientPopupInstance) {
      window.ingredientPopupInstance = null;
    }
    
    // Re-initialize after navigation
    requestAnimationFrame(() => this.init());
  }

  /**
   * Cleanup all event listeners and observers
   */
  destroy() {
    // Disconnect observers
    this.observers.forEach(observer => observer.disconnect());
    this.observers.clear();
    
    // Remove all event listeners
    this.cleanupFunctions.forEach(cleanup => {
      if (typeof cleanup === 'function') cleanup();
    });
    this.cleanupFunctions = [];
    
    // Clear state
    this.initialized.clear();
    this.state = {
      sidebarOpen: false,
      sidebarView: 'navigation',
      currentTheme: 'light',
      isReducedMotion: false
    };
  }
}

// Component Manager for handling initialization timing and dependencies
export class ComponentManager {
  constructor() {
    this.initialized = new Set();
    this.dataReady = false;
  }

  async waitForData() {
    return new Promise((resolve) => {
      const checkData = () => {
        const ingredientsScript = DOMUtils.$('#ingredients-data');
        const equipmentScript = DOMUtils.$('#equipment-data');
        
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