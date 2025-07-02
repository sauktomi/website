// Info Mode Manager
// Manages the global setting for showing/hiding info buttons and boxes in recipes

window.InfoModeManager = (function() {
  const STORAGE_KEY = 'info-mode-enabled';
  
  let isEnabled = false;
  
  function init() {
    // Load saved preference
    const saved = localStorage.getItem(STORAGE_KEY);
    isEnabled = saved === 'true';
    
    // Apply initial state
    updateBodyClass();
    updateToggleStates();
    
    // Clear any conflicting individual states on page load
    clearIndividualInfoStates();
    
    // Set up event listeners
    setupEventListeners();
  }
  
  function setupEventListeners() {
    // Settings sidebar toggle
    const settingsToggle = document.getElementById('info-mode-toggle');
    if (settingsToggle) {
      settingsToggle.addEventListener('change', (e) => {
        setEnabled(e.target.checked);
        // Sync with any local toggles
        syncLocalToggles();
      });
    }
    
    // Listen for custom events from local toggles
    document.addEventListener('infoModeChanged', (e) => {
      setEnabled(e.detail.enabled);
      updateToggleStates();
    });
  }
  
  function setEnabled(enabled) {
    isEnabled = enabled;
    localStorage.setItem(STORAGE_KEY, enabled.toString());
    updateBodyClass();
    updateToggleStates();
    
    // Clear any individual info box states when global mode changes
    clearIndividualInfoStates();
  }
  
  function updateBodyClass() {
    if (isEnabled) {
      document.body.classList.add('info-mode-enabled');
    } else {
      document.body.classList.remove('info-mode-enabled');
    }
  }
  
  function updateToggleStates() {
    // Update settings sidebar toggle
    const settingsToggle = document.getElementById('info-mode-toggle');
    if (settingsToggle) {
      settingsToggle.checked = isEnabled;
    }
    
    // Update any local toggles (use setTimeout to ensure DOM is ready)
    setTimeout(() => {
      const localToggles = document.querySelectorAll('.local-info-toggle');
      localToggles.forEach(toggle => {
        toggle.checked = isEnabled;
      });
    }, 0);
  }
  
  function syncLocalToggles() {
    const localToggles = document.querySelectorAll('.local-info-toggle');
    localToggles.forEach(toggle => {
      toggle.checked = isEnabled;
    });
  }
  
  function clearIndividualInfoStates() {
    // Reset all manually shown/hidden info boxes to their default state
    const infoNotes = document.querySelectorAll('.recipe-note-info, .recipe-note-notice');
    infoNotes.forEach(note => {
      // Remove any inline styles that were set by individual button clicks
      note.style.display = '';
      note.setAttribute('aria-hidden', 'true');
    });
    
    // Reset all info button states
    const infoButtons = document.querySelectorAll('.recipe-info-button');
    infoButtons.forEach(button => {
      button.setAttribute('aria-expanded', 'false');
      button.setAttribute('aria-label', 'Näytä lisätiedot');
      button.setAttribute('title', 'Näytä lisätiedot');
    });
  }
  
  function getEnabled() {
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