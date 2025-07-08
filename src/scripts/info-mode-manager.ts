/**
 * Info Mode Manager
 * 
 * Manages the display of additional information and tips throughout the website.
 * Provides a toggle system for showing/hiding supplementary content and
 * maintains user preferences across sessions.
 * 
 * Features:
 * - Global info mode toggle
 * - User preference persistence
 * - Dynamic content visibility
 * - Accessibility considerations
 * - Performance optimizations
 * 
 * Functionality:
 * - Show/hide additional tips and information
 * - Remember user preferences
 * - Smooth transitions for content changes
 * - Keyboard navigation support
 * - Screen reader compatibility
 * 
 * Integration:
 * - Works across all pages
 * - Integrates with recipe instructions
 * - Supports ingredient information
 * - Maintains state across navigation
 * 
 * @author Tomi
 * @version 2.0.0
 */

// Info Mode Manager
// Manages the global setting for showing/hiding info buttons and boxes in recipes

interface InfoModeManager {
  init(): void;
  setEnabled(enabled: boolean): void;
  getEnabled(): boolean;
  clearIndividualInfoStates(): void;
}

declare global {
  interface Window {
    InfoModeManager: InfoModeManager;
  }
}

const InfoModeManager = (function(): InfoModeManager {
  const STORAGE_KEY = 'info-mode-enabled';
  
  let isEnabled = false;
  
  function init(): void {
    // Load saved preference
    const saved = localStorage.getItem(STORAGE_KEY);
    isEnabled = saved === 'true';
    
    // Apply initial state immediately
    updateBodyClass();
    
    // Defer non-critical operations
    deferNonCriticalInit();
  }

  function deferNonCriticalInit(): void {
    const initFeatures = () => {
      updateToggleStates();
      clearIndividualInfoStates();
      setupEventListeners();
    };

    if (window.requestIdleCallback) {
      window.requestIdleCallback(initFeatures, { timeout: 1500 });
    } else {
      setTimeout(initFeatures, 100);
    }
  }
  
  function setupEventListeners(): void {
    // Settings sidebar toggle
    const settingsToggle = document.getElementById('info-mode-toggle') as HTMLInputElement;
    if (settingsToggle) {
      settingsToggle.addEventListener('change', (e: Event) => {
        const target = e.target as HTMLInputElement;
        setEnabled(target.checked);
        // Sync with any local toggles
        syncLocalToggles();
      });
    }
    
    // Listen for custom events from local toggles
    document.addEventListener('infoModeChanged', (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail && typeof customEvent.detail.enabled === 'boolean') {
        setEnabled(customEvent.detail.enabled);
        updateToggleStates();
      }
    });
  }
  
  function setEnabled(enabled: boolean): void {
    isEnabled = enabled;
    localStorage.setItem(STORAGE_KEY, enabled.toString());
    updateBodyClass();
    updateToggleStates();
    
    // Clear any individual info box states when global mode changes
    clearIndividualInfoStates();
  }
  
  function updateBodyClass(): void {
    if (isEnabled) {
      document.body.classList.add('info-mode-enabled');
    } else {
      document.body.classList.remove('info-mode-enabled');
    }
  }
  
  function updateToggleStates(): void {
    // Update settings sidebar toggle
    const settingsToggle = document.getElementById('info-mode-toggle') as HTMLInputElement;
    if (settingsToggle) {
      settingsToggle.checked = isEnabled;
    }
    
    // Update any local toggles (use setTimeout to ensure DOM is ready)
    setTimeout(() => {
      const localToggles = document.querySelectorAll('.local-info-toggle') as NodeListOf<HTMLInputElement>;
      localToggles.forEach(toggle => {
        toggle.checked = isEnabled;
      });
    }, 0);
  }
  
  function syncLocalToggles(): void {
    const localToggles = document.querySelectorAll('.local-info-toggle') as NodeListOf<HTMLInputElement>;
    localToggles.forEach(toggle => {
      toggle.checked = isEnabled;
    });
  }
  
  function clearIndividualInfoStates(): void {
    // Reset all manually shown/hidden info boxes to their default state
    const infoNotes = document.querySelectorAll('.recipe-note-info, .recipe-note-notice') as NodeListOf<HTMLElement>;
    infoNotes.forEach(note => {
      // Remove any inline styles that were set by individual button clicks
      note.style.display = '';
      note.setAttribute('aria-hidden', 'true');
    });
    
    // Reset all info button states
    const infoButtons = document.querySelectorAll('.recipe-info-button') as NodeListOf<HTMLButtonElement>;
    infoButtons.forEach(button => {
      button.setAttribute('aria-expanded', 'false');
      button.setAttribute('aria-label', 'Näytä lisätiedot');
      button.setAttribute('title', 'Näytä lisätiedot');
    });
  }
  
  function getEnabled(): boolean {
    return isEnabled;
  }
  
  // Public API
  return {
    init,
    setEnabled,
    getEnabled,
    clearIndividualInfoStates
  };
})();

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', InfoModeManager.init);
} else {
  InfoModeManager.init();
}

// Handle Astro navigation events for prefetched pages
['astro:after-swap', 'astro:page-load'].forEach(event => {
  document.addEventListener(event, InfoModeManager.init);
});

// Expose globally
window.InfoModeManager = InfoModeManager;

export default InfoModeManager;