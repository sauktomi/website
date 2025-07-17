/**
 * Settings Manager
 * 
 * Simple user preferences management with localStorage persistence.
 * Handles basic settings like dark mode and sidebar preferences.
 * 
 * @author Tomi
 * @version 3.0.0
 */

import type { CustomWindow } from '../../utils/types';

class SettingsManager {
  constructor() {
    this.init();
  }

  init() {
    this.loadSettings();
    this.bindEvents();
  }

  loadSettings() {
    // Load theme setting
    const themeDropdown = document.getElementById('theme-dropdown') as HTMLSelectElement;
    if (themeDropdown) {
      const stored = localStorage.theme;
      if (stored === 'dark' || stored === 'light' || stored === 'system') {
        themeDropdown.value = stored;
      } else {
        // Default to system if no stored choice
        themeDropdown.value = 'system';
      }
    }

    // Load sidebar setting
    const sidebarToggle = document.getElementById('sidebar-toggle') as HTMLInputElement;
    if (sidebarToggle) {
      const stored = localStorage.getItem('sidebarEnabled');
      sidebarToggle.checked = stored !== 'false'; // Default to true
    }

    // Load mobile recipe sidebar setting
    const mobileSidebarToggle = document.getElementById('mobile-recipe-sidebar') as HTMLInputElement;
    if (mobileSidebarToggle) {
      const stored = localStorage.getItem('mobileRecipeSidebar');
      mobileSidebarToggle.checked = stored !== 'false'; // Default to true
    }
  }

  bindEvents() {
    // Settings toggle button - try to bind immediately
    this.bindSettingsToggle();
    
    // Also try to bind when dialog opens (in case elements aren't available yet)
    document.addEventListener('click', (event) => {
      if (event.target && (event.target as HTMLElement).id === 'navbar-toggle') {
        // Dialog is about to open, try binding again
        setTimeout(() => this.bindSettingsToggle(), 100);
      }
    });

    // Theme dropdown
    const themeDropdown = document.getElementById('theme-dropdown') as HTMLSelectElement;
    if (themeDropdown) {
      themeDropdown.addEventListener('change', () => {
        const selectedTheme = themeDropdown.value as 'light' | 'dark' | 'system';
        
        // Apply theme using ThemeManager
        const windowWithTheme = window as CustomWindow;
        if (windowWithTheme.ThemeManager) {
          windowWithTheme.ThemeManager.setTheme(selectedTheme);
        }
      });
    }

    // Sidebar toggle
    const sidebarToggle = document.getElementById('sidebar-toggle') as HTMLInputElement;
    if (sidebarToggle) {
      sidebarToggle.addEventListener('change', () => {
        const enabled = sidebarToggle.checked;
        localStorage.setItem('sidebarEnabled', enabled.toString());
        
        if (enabled) {
          document.documentElement.setAttribute('data-sidebar', 'enabled');
        } else {
          document.documentElement.setAttribute('data-sidebar', 'disabled');
        }
      });
    }

    // Mobile recipe sidebar toggle
    const mobileSidebarToggle = document.getElementById('mobile-recipe-sidebar') as HTMLInputElement;
    if (mobileSidebarToggle) {
      mobileSidebarToggle.addEventListener('change', () => {
        const enabled = mobileSidebarToggle.checked;
        localStorage.setItem('mobileRecipeSidebar', enabled.toString());
        
        const recipeSidebar = document.querySelector('#recipe-right-sidebar');
        if (recipeSidebar) {
          recipeSidebar.setAttribute('data-sidebar-enabled', enabled.toString());
        }
        
        if (enabled) {
          document.documentElement.setAttribute('data-mobile-recipe-sidebar', 'enabled');
        } else {
          document.documentElement.removeAttribute('data-mobile-recipe-sidebar');
        }
      });
    }
  }

  bindSettingsToggle() {
    const settingsToggle = document.getElementById('navbar-settings-toggle');
    if (settingsToggle && !settingsToggle.hasAttribute('data-settings-bound')) {
      settingsToggle.setAttribute('data-settings-bound', 'true');
      settingsToggle.addEventListener('click', () => {
        const settingsSection = document.getElementById('navbar-settings-section');
        if (settingsSection) {
          settingsSection.classList.toggle('hidden');
          const isHidden = settingsSection.classList.contains('hidden');
          settingsToggle.setAttribute('aria-label', isHidden ? 'Avaa asetukset' : 'Piilota asetukset');
        }
      });
    }
  }
}

export default SettingsManager; 