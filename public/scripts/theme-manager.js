// Optimized Theme Management Module
// Only applies changes when theme actually changes

const ThemeManager = {
  init() {
    try {
      const currentTheme = this.getCurrentTheme();
      const appliedTheme = document.documentElement.getAttribute('data-theme');
      
      // Only apply if theme has changed or not set
      if (appliedTheme !== currentTheme) {
        this.apply(currentTheme === 'dark');
      }
      
      this.setupState(currentTheme === 'dark');
      
      // Sync toggle button state with current theme
      this.syncToggleButton(currentTheme === 'dark');
    } catch (e) {
      console.warn('Theme initialization failed:', e);
      this.apply(false);
      this.setupState(false);
      this.syncToggleButton(false);
    }
  },
  
  apply(isDark) {
    const html = document.documentElement;
    const theme = isDark ? 'dark' : 'light';
    const currentTheme = html.getAttribute('data-theme');
    
    // Only update if actually different
    if (currentTheme !== theme) {
      html.setAttribute('data-theme', theme);
      
      // Force CSS recalculation and repaint (only if body exists)
      if (document.body) {
        document.body.offsetHeight;
      }
      
      // Dispatch theme change event for other components
      document.dispatchEvent(new CustomEvent('themeChanged', {
        detail: { theme, isDark }
      }));
    }
  },
  
  getCurrentTheme() {
    try {
      const stored = localStorage.getItem('user-theme-choice');
      return stored !== null 
        ? stored
        : (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    } catch {
      return 'light';
    }
  },
  
  setupState(isDark) {
    window.__THEME_STATE__ = {
      current: isDark ? 'dark' : 'light',
      isDark,
      apply: () => this.apply(this.getCurrentTheme() === 'dark'),
      toggle: () => this.toggle()
    };
  },
  
  syncToggleButton(isDark) {
    // Sync the settings toggle button with current theme state
    const toggleButton = document.getElementById('dark-mode-toggle');
    if (toggleButton) {
      toggleButton.checked = isDark;
    }
  },
  
  toggle() {
    try {
      const current = this.getCurrentTheme();
      const newTheme = current === 'dark' ? 'light' : 'dark';
      localStorage.setItem('user-theme-choice', newTheme);
      this.apply(newTheme === 'dark');
      this.setupState(newTheme === 'dark');
      this.syncToggleButton(newTheme === 'dark');
      return newTheme === 'dark';
    } catch (e) {
      console.warn('Theme toggle failed:', e);
      return false;
    }
  }
};

// Auto-initialize for inline usage
if (typeof window !== 'undefined') {
  window.ThemeManager = ThemeManager;
}