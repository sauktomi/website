/**
 * Settings Manager
 * 
 * Manages user preferences and settings across the website.
 * Handles theme preferences, navigation settings, and user-specific
 * configurations with persistence and synchronization.
 * 
 * Features:
 * - User preference management
 * - Settings persistence
 * - Cross-tab synchronization
 * - Default value handling
 * - Settings validation
 * 
 * Settings Types:
 * - Theme preferences (dark/light mode)
 * - Navigation preferences
 * - Display options
 * - Accessibility settings
 * - Performance preferences
 * 
 * Integration:
 * - Works with theme manager
 * - Integrates with navigation system
 * - Supports mobile preferences
 * - Maintains settings across sessions
 * 
 * @author Tomi
 * @version 2.0.0
 */

import type { CustomWindow } from '../../utils/types';

// SettingsManager class for handling user preferences
class SettingsManager {
  elements: Map<string, Element | null>;
  settingsConfig: Record<string, { default: boolean; element: string; storageKey?: string }>;
  debouncedSaveSettings: () => void;
  navbarActions: any;
  navbarViewActions: any;
  state: { navbarOpen: boolean; navbarView: string };
  _resizeObserver!: ResizeObserver;

  constructor() {
    this.elements = new Map();
    // Debounced saveSettings to avoid frequent localStorage writes
    this.debouncedSaveSettings = this._debounce(() => this.saveSettings(), 300);
    this.settingsConfig = {} as Record<string, { default: boolean; element: string; storageKey?: string }>;
    this.state = { navbarOpen: false, navbarView: 'navigation' };

    this.init();
  }
  
  /**
   * Simple debounce helper
   * @param {Function} fn
   * @param {number} delay
   * @returns {Function}
   */
  _debounce(fn: Function, delay: number): () => void {
    let timeoutId: NodeJS.Timeout | undefined;
    return (...args: any[]) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => fn.apply(this, args), delay);
    };
  }

  initElements() {
    const selectors = {
      navbar: '#navbar',
      navbarMainToggle: '#navbar-toggle',
      pageContainer: '#page-container',
      settingsToggle: '#navbar-settings-toggle',
      darkModeToggle: '#dark-mode-toggle',
      timerNotifications: '#timer-notifications',
      mobileRecipeSidebar: '#mobileRecipeSidebar',
      sidebarToggle: '#sidebar-toggle'
    };
    
    Object.entries(selectors).forEach(([key, selector]) => {
      this.elements.set(key, document.querySelector(selector));
    });
  }

  setupSettings() {
    this.settingsConfig = {
      darkMode: { default: false, element: 'darkModeToggle', storageKey: 'user-theme-choice' },
      timerNotifications: { default: true, element: 'timerNotifications' },
      mobileRecipeSidebar: { default: true, element: 'mobileRecipeSidebar' },
      sidebar: { default: true, element: 'sidebarToggle', storageKey: 'sidebarEnabled' }
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
          const element = this.elements.get(config.element) as HTMLInputElement | null;
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
          const element = this.elements.get(config.element) as HTMLInputElement | null;
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
      const darkModeElement = this.elements.get('darkModeToggle') as HTMLInputElement | null;
      const windowWithTheme = window as CustomWindow;
      if (darkModeElement && windowWithTheme.ThemeManager) {
        const shouldBeDark = darkModeElement.checked;
        
        // Apply the theme change immediately
        windowWithTheme.ThemeManager.apply(shouldBeDark);
        windowWithTheme.ThemeManager.setupState(shouldBeDark);
      }
      
      // Handle mobile recipe sidebar toggle
      const mobileRecipeSidebarElement = this.elements.get('mobileRecipeSidebar') as HTMLInputElement | null;
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
      
      // Handle sidebar toggle
      const sidebarElement = this.elements.get('sidebarToggle') as HTMLInputElement | null;
      if (sidebarElement) {
        const shouldShowSidebar = sidebarElement.checked;
        localStorage.setItem('sidebarEnabled', shouldShowSidebar.toString());
        if (shouldShowSidebar) {
          document.documentElement.setAttribute('data-sidebar', 'enabled');
        } else {
          document.documentElement.setAttribute('data-sidebar', 'disabled');
        }
        
        // Update home page state to ensure proper sidebar visibility
        const isHomePage = window.location.pathname === '/';
        document.documentElement.setAttribute('data-home-page', isHomePage.toString());
        
        // Force an immediate UI update by triggering a custom event or directly updating visibility
        document.dispatchEvent(new CustomEvent('sidebarVisibilityChanged', {
          detail: { enabled: shouldShowSidebar }
        }));
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
    const values: Record<string, boolean> = {};
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
      'mobileRecipeSidebar',
      'sidebarToggle'
    ];
    
    settingElements.forEach(elementKey => {
      const element = this.elements.get(elementKey) as HTMLInputElement | null;
      if (element) {
        element.addEventListener('change', () => {
          this.debouncedSaveSettings();
        });
      }
    });
  }

  setupNavbar() {
    // Simplified navbar setup - the navbar dialog handles its own open/close
    this.bindNavbarEvents();
  }

  bindNavbarEvents() {
    // Add close condition when clicking on the dialog backdrop
    const navbarDialog = document.getElementById('navbar-dialog') as HTMLDialogElement | null;
    if (navbarDialog) {
      navbarDialog.addEventListener('click', (e) => {
        // Check if the click target is the dialog element itself (backdrop)
        if (e.target === navbarDialog) {
          navbarDialog.close();
        }
      }, { passive: true });
    }
  }

  setupNavbarViews() {
    // Simplified navbar views - just handle settings toggle
    this.bindNavbarViewEvents();
  }

  bindNavbarViewEvents() {
    // Settings toggle button
    const settingsToggle = this.elements.get('settingsToggle') as HTMLElement | null;
    console.log('SettingsManager: Looking for settings toggle:', settingsToggle);
    if (settingsToggle) {
      console.log('SettingsManager: Adding click event to settings toggle');
      settingsToggle.addEventListener('click', () => {
        console.log('SettingsManager: Settings toggle clicked');
        // Toggle the settings section visibility
        const settingsSection = document.getElementById('navbar-settings-section');
        if (settingsSection) {
          const isHidden = settingsSection.classList.contains('hidden');
          console.log('SettingsManager: Settings section hidden:', isHidden);
          if (isHidden) {
            settingsSection.classList.remove('hidden');
            settingsToggle.setAttribute('aria-label', 'Piilota asetukset');
            console.log('SettingsManager: Settings section shown');
          } else {
            settingsSection.classList.add('hidden');
            settingsToggle.setAttribute('aria-label', 'Avaa asetukset');
            console.log('SettingsManager: Settings section hidden');
          }
        } else {
          console.log('SettingsManager: Settings section not found');
        }
      });
    } else {
      console.log('SettingsManager: Settings toggle not found');
    }
  }

  setupResponsive() {
    const updateLayout = () => {
      const html = document.documentElement;
      const navbar = this.elements.get('navbar') as HTMLElement | null;
      const desiredLayout = window.innerWidth >= 1024 ? 'desktop' : 'mobile';

      if (html.getAttribute('data-layout') !== desiredLayout) {
        html.setAttribute('data-layout', desiredLayout);
        html.setAttribute('data-navbar', 'collapsed');
        this.state.navbarOpen = false;
        if (navbar) {
          navbar.classList.remove('navbar-bg-visible', 'navbar-bg-hiding');
        }
      }
    };

    // Initial run
    updateLayout();

    // Observe documentElement size changes instead of continuous resize events
    this._resizeObserver = new ResizeObserver(updateLayout);
    this._resizeObserver.observe(document.documentElement);
  }

  init() {
    console.log('SettingsManager: Initializing...');
    this.initElements();
    this.setupSettings();
    this.setupNavbar();
    this.setupNavbarViews();
    this.setupResponsive();
    console.log('SettingsManager: Initialization complete');
  }
}

// Initialize SettingsManager globally
const customWindow = window as CustomWindow;
customWindow.settingsManager = new SettingsManager();

export default SettingsManager; 