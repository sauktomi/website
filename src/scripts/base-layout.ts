/**
 * Base Layout Initialization
 * 
 * Simple, direct module initialization for the website.
 * Removes over-engineered centralized system in favor of direct imports.
 * 
 * @author Tomi
 * @version 3.0.0
 */

// Simple initialization function
export default function initBaseLayout() {
  console.log('Base layout: Starting initialization...');
  
  const initModules = async () => {
    // Core modules - always load
    await import('./layout/theme-manager.ts').then(module => module.default.init());
    await import('./layout/settings-manager.ts').then(module => new module.default().init());
    await import('./site-interactions.ts'); // auto-initializes
    
    // Page-specific modules
    const path = window.location.pathname;
    
    if (path.includes('/reseptit') || path.includes('/hakemisto')) {
      await import('./recipe-interactions.ts'); // auto-initializes
      await import('./layout/popover-system.ts').then(module => module.default.init());
    }
  };

  // Initialize on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initModules);
  } else {
    initModules();
  }

  // Handle Astro navigation
  document.addEventListener('astro:before-swap', () => {
    // Cleanup global managers if they exist
    if (window.globalRecipeManager) {
      window.globalRecipeManager.cleanup();
    }
  });

  document.addEventListener('astro:after-swap', initModules);
}


