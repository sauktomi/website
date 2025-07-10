/**
 * Theme Manager
 * 
 * Manages dark/light theme switching with system preference detection,
 * local storage persistence, and cross-tab synchronization. Uses modern
 * classList.toggle approach for better performance.
 * 
 * Features:
 * - System preference detection (prefers-color-scheme)
 * - Local storage persistence for user choice
 * - Cross-tab theme synchronization
 * - Custom event dispatching for theme changes
 * - Toggle state management
 * - Graceful fallback handling
 * 
 * API:
 * - init(): Initialize theme system
 * - toggle(): Switch between themes
 * - apply(isDark): Apply specific theme
 * - getCurrentTheme(): Get current theme
 * - setupState(isDark): Setup global state
 * 
 * Events:
 * - themeChanged: Dispatched when theme changes
 * - storage: Handles cross-tab synchronization
 * 
 * @author Tomi
 * @version 3.0.0
 */

import type { CustomWindow } from '../../utils/types';

// Modern Theme Manager using classList.toggle
const ThemeManager = {
  _currentTheme: null as string | null,
  
  _detectInitialTheme() {
    return localStorage.theme === "dark" ||
      (!("theme" in localStorage) && window.matchMedia("(prefers-color-scheme: dark)").matches)
      ? 'dark' : 'light';
  },
  
  _persist(theme: string | null) {
    if (theme === null) {
      localStorage.removeItem('theme');
    } else {
      localStorage.theme = theme;
    }
  },
  
  _dispatch(theme: string) {
    const isDark = theme === 'dark';
    document.dispatchEvent(new CustomEvent('themeChanged', { detail: { theme, isDark } }));
  },
  
  _syncToggle(theme: string) {
    const checkbox = document.getElementById('dark-mode-toggle') as HTMLInputElement | null;
    if (checkbox) checkbox.checked = (theme === 'dark');
  },
  
  apply(isDark: boolean) {
    const theme = isDark ? 'dark' : 'light';
    if (theme === this._currentTheme) return;
    
    this._currentTheme = theme;
    document.documentElement.classList.toggle('dark', isDark);
    this._dispatch(theme);
  },
  
  toggle() {
    const newTheme = this._currentTheme === 'dark' ? 'light' : 'dark';
    this._persist(newTheme);
    this.apply(newTheme === 'dark');
    this.setupState(newTheme === 'dark');
    return newTheme === 'dark';
  },
  
  setSystemPreference() {
    this._persist(null);
    const isDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    this.apply(isDark);
    this.setupState(isDark);
  },
  
  getCurrentTheme() {
    return this._currentTheme || this._detectInitialTheme();
  },
  
  setupState(isDark: boolean) {
    const state = ((window as CustomWindow).__THEME_STATE__ = (window as CustomWindow).__THEME_STATE__ || {});
    state.current = isDark ? 'dark' : 'light';
    state.isDark = isDark;
    state.apply = () => this.apply(this.getCurrentTheme() === 'dark');
    state.toggle = () => this.toggle();
    state.setSystemPreference = () => this.setSystemPreference();
  },
  
  init() {
    const initialTheme = this._detectInitialTheme();
    this._currentTheme = initialTheme;
    document.documentElement.classList.toggle('dark', initialTheme === 'dark');
    this._syncToggle(initialTheme);
    this.setupState(initialTheme === 'dark');
    this._dispatch(initialTheme);
    
    // Defer non-critical event listeners to reduce initial load impact
    setTimeout(() => {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)');
      prefersDark.addEventListener('change', (e) => {
        // Only apply system preference if user hasn't made an explicit choice
        if (!("theme" in localStorage)) {
          this.apply(e.matches);
          this.setupState(e.matches);
          this._syncToggle(e.matches ? 'dark' : 'light');
        }
      });

      // Cross-tab theme sync
      window.addEventListener('storage', (evt) => {
        if (evt.key === 'theme') {
          const newTheme = evt.newValue === 'dark' ? 'dark' : 'light';
          this.apply(newTheme === 'dark');
          this.setupState(newTheme === 'dark');
          this._syncToggle(newTheme);
        }
      });
    }, 100);
  }
};

if (typeof window !== 'undefined') {
  (window as CustomWindow).ThemeManager = ThemeManager;
}

export default ThemeManager; 