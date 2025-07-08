/**
 * Centralized Layout Initialization System
 * 
 * This module coordinates all page initialization to prevent conflicts and ensure
 * proper loading order. It manages the lifecycle of all JavaScript modules and
 * provides a clean interface for page-specific functionality.
 * 
 * Architecture:
 * - Module registration system with dependencies
 * - Automatic initialization order management
 * - Memory leak prevention with cleanup
 * - Error handling and graceful degradation
 * - Page-specific module loading
 * 
 * Key Modules:
 * - Theme Manager: Dark/light mode switching
 * - Settings Manager: User preferences persistence
 * - Site Interactions: Global event handling
 * - Recipe Interactions: Recipe-specific features
 * - Popover System: Native popover management
 * - Timer System: Kitchen timer functionality
 * 
 * @author Tomi
 * @version 2.0.0
 */

// Centralized initialization system
// Coordinates all page initialization to prevent conflicts



interface InitializationModule {
  name: string;
  init: () => Promise<void> | void;
  cleanup?: () => void;
  dependencies?: string[];
}

class CentralizedInitializer {
  private modules: Map<string, InitializationModule> = new Map();
  private initialized: Set<string> = new Set();
  private isInitializing = false;

  register(module: InitializationModule): void {
    this.modules.set(module.name, module);
  }

  async initializeAll(): Promise<void> {
    if (this.isInitializing) return;
    this.isInitializing = true;

    console.log('CentralizedInitializer: Starting initialization...');

    // Initialize data first
    await this.initializeData();

    // Initialize core modules in dependency order
    const coreModules = ['theme', 'settings', 'site-interactions'];
    for (const moduleName of coreModules) {
      await this.initializeModule(moduleName);
    }

    // Initialize page-specific modules
    await this.initializePageSpecificModules();

    console.log('CentralizedInitializer: Initialization complete');
    this.isInitializing = false;
  }

  private async initializeData(): Promise<void> {
    console.log('CentralizedInitializer: Initializing data...');
    
    // Data is now loaded dynamically by the popover system as needed
    // No pre-loading of all ingredients data
  }

  private async initializeModule(moduleName: string): Promise<void> {
    const module = this.modules.get(moduleName);
    if (!module || this.initialized.has(moduleName)) return;

    // Check dependencies
    if (module.dependencies) {
      for (const dep of module.dependencies) {
        await this.initializeModule(dep);
      }
    }

    try {
      console.log(`CentralizedInitializer: Initializing ${moduleName}...`);
      await module.init();
      this.initialized.add(moduleName);
      console.log(`CentralizedInitializer: ${moduleName} initialized`);
    } catch (error) {
      console.error(`CentralizedInitializer: Failed to initialize ${moduleName}:`, error);
    }
  }

  private async initializePageSpecificModules(): Promise<void> {
    // Initialize modules based on current page
    const path = window.location.pathname;
    
    if (path.includes('/reseptit') || path.includes('/hakemisto')) {
      await this.initializeModule('recipe-interactions');
      await this.initializeModule('popover-system');
    }
    
    if (path.includes('/hakemisto')) {
      await this.initializeModule('smart-preloader');
    }
    
    // Always initialize these
    await this.initializeModule('info-mode-manager');
  }

  cleanup(): void {
    console.log('CentralizedInitializer: Cleaning up...');
    
    for (const [name, module] of this.modules) {
      if (module.cleanup && this.initialized.has(name)) {
        try {
          module.cleanup();
          console.log(`CentralizedInitializer: Cleaned up ${name}`);
        } catch (error) {
          console.error(`CentralizedInitializer: Failed to cleanup ${name}:`, error);
        }
      }
    }
    
    this.initialized.clear();
  }
}

// Create global instance
const centralizedInitializer = new CentralizedInitializer();

// Register all modules
centralizedInitializer.register({
  name: 'theme',
  init: async () => {
    const module = await import('./layout/theme-manager.ts');
    module.default.init();
  }
});

centralizedInitializer.register({
  name: 'settings',
  init: async () => {
    console.log('Base layout: Loading settings manager...');
    try {
      const module = await import('./layout/settings-manager.ts');
      console.log('Base layout: Settings manager module loaded:', module);
      new module.default().init();
      console.log('Base layout: Settings manager initialized');
    } catch (error) {
      console.error('Base layout: Failed to load settings manager:', error);
    }
  }
});

centralizedInitializer.register({
  name: 'site-interactions',
  init: async () => {
    const module = await import('./site-interactions.ts');
    // site-interactions auto-initializes
  }
});

centralizedInitializer.register({
  name: 'recipe-interactions',
  init: async () => {
    const module = await import('./recipe-interactions.ts');
    // recipe-interactions auto-initializes
  },
  cleanup: () => {
    if (window.globalRecipeManager) {
      window.globalRecipeManager.cleanup();
    }
  }
});

centralizedInitializer.register({
  name: 'popover-system',
  init: async () => {
    const module = await import('./layout/popover-system.ts');
    module.default.init();
  }
});

centralizedInitializer.register({
  name: 'info-mode-manager',
  init: async () => {
    const module = await import('./info-mode-manager.ts');
    // info-mode-manager auto-initializes
  }
});

centralizedInitializer.register({
  name: 'smart-preloader',
  init: async () => {
    const module = await import('./smart-preloader.ts');
    // smart-preloader auto-initializes
  },
  cleanup: () => {
    if (window.smartIngredientPreloader) {
      window.smartIngredientPreloader.cleanup();
    }
  }
});

// Main initialization function
export default function initBaseLayout() {
  console.log('Base layout: Starting centralized initialization...');
  
  // Initialize on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      centralizedInitializer.initializeAll();
    });
  } else {
    centralizedInitializer.initializeAll();
  }

  // Handle Astro navigation
  document.addEventListener('astro:before-swap', () => {
    centralizedInitializer.cleanup();
  });

  document.addEventListener('astro:after-swap', () => {
    centralizedInitializer.initializeAll();
  });
}

// Export for testing
export { CentralizedInitializer, centralizedInitializer };


