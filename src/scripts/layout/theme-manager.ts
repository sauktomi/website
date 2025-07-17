/**
 * Theme Manager
 * 
 * Manages theme switching with three options: light, dark, and system preference.
 * Features local storage persistence, cross-tab synchronization, and system
 * preference detection with automatic updates.
 * 
 * Features:
 * - Three theme modes: light, dark, system
 * - System preference detection (prefers-color-scheme)
 * - Local storage persistence for user choice
 * - Cross-tab theme synchronization
 * - Custom event dispatching for theme changes
 * - Dropdown state management
 * - Graceful fallback handling
 * 
 * API:
 * - init(): Initialize theme system
 * - setTheme(theme): Set specific theme mode
 * - getCurrentTheme(): Get current theme mode
 * - getEffectiveTheme(): Get effective theme (light/dark)
 * - setupState(theme): Setup global state
 * 
 * Events:
 * - themeChanged: Dispatched when theme changes
 * - storage: Handles cross-tab synchronization
 * 
 * @author Tomi
 * @version 4.0.0
 */

import type { CustomWindow } from '../../utils/types';

// Enhanced Theme Manager with three-way selection
const ThemeManager = {
  _currentTheme: null as string | null,
  
  _detectInitialTheme() {
    // Check localStorage first, then default to system
    if (localStorage.theme === "dark" || localStorage.theme === "light") {
      return localStorage.theme;
    }
    return "system";
  },
  
  _getSystemTheme() {
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? 'dark' : 'light';
  },
  
  _getEffectiveTheme() {
    const theme = this._currentTheme || this._detectInitialTheme();
    if (theme === 'system') {
      return this._getSystemTheme();
    }
    return theme;
  },
  
  _persist(theme: string) {
    localStorage.theme = theme;
  },
  
  _dispatch(theme: string, effectiveTheme: string) {
    const isDark = effectiveTheme === 'dark';
    document.dispatchEvent(new CustomEvent('themeChanged', { 
      detail: { theme, effectiveTheme, isDark } 
    }));
  },
  
  _syncDropdown(theme: string) {
    const dropdown = document.getElementById('theme-dropdown') as HTMLSelectElement | null;
    if (dropdown) dropdown.value = theme;
  },
  
  apply(theme: string) {
    if (theme === this._currentTheme) return;
    
    this._currentTheme = theme;
    const effectiveTheme = this._getEffectiveTheme();
    const isDark = effectiveTheme === 'dark';
    
    document.documentElement.classList.toggle('dark', isDark);
    this._dispatch(theme, effectiveTheme);
  },
  
  setTheme(theme: 'light' | 'dark' | 'system') {
    this._persist(theme);
    this.apply(theme);
    this.setupState(theme);
    return theme;
  },
  
  getCurrentTheme() {
    return this._currentTheme || this._detectInitialTheme();
  },
  
  getEffectiveTheme() {
    return this._getEffectiveTheme();
  },
  
  setupState(theme: string) {
    const state = ((window as CustomWindow).__THEME_STATE__ = (window as CustomWindow).__THEME_STATE__ || {});
    state.current = theme;
    state.effective = this._getEffectiveTheme();
    state.isDark = state.effective === 'dark';
    state.setTheme = (newTheme: string) => this.setTheme(newTheme as 'light' | 'dark' | 'system');
    state.getCurrentTheme = () => this.getCurrentTheme();
    state.getEffectiveTheme = () => this.getEffectiveTheme();
  },
  
  init() {
    const initialTheme = this._detectInitialTheme();
    this._currentTheme = initialTheme;
    const effectiveTheme = this._getEffectiveTheme();
    const isDark = effectiveTheme === 'dark';
    
    document.documentElement.classList.toggle('dark', isDark);
    this._syncDropdown(initialTheme);
    this.setupState(initialTheme);
    this._dispatch(initialTheme, effectiveTheme);
    
    // Defer non-critical event listeners to reduce initial load impact
    setTimeout(() => {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)');
      prefersDark.addEventListener('change', (e) => {
        // Only apply system preference if user has selected "system"
        if (this._currentTheme === 'system') {
          const newEffectiveTheme = e.matches ? 'dark' : 'light';
          const isDark = newEffectiveTheme === 'dark';
          document.documentElement.classList.toggle('dark', isDark);
          this._dispatch('system', newEffectiveTheme);
          this.setupState('system');
        }
      });

      // Cross-tab theme sync
      window.addEventListener('storage', (evt) => {
        if (evt.key === 'theme') {
          const newTheme = evt.newValue || 'system';
          this.apply(newTheme);
          this.setupState(newTheme);
          this._syncDropdown(newTheme);
        }
      });
    }, 100);
  }
};

if (typeof window !== 'undefined') {
  (window as CustomWindow).ThemeManager = ThemeManager;
}

export default ThemeManager; 