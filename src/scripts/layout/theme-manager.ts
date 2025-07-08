/**
 * Theme Manager
 * 
 * Manages dark/light theme switching with system preference detection,
 * local storage persistence, and cross-tab synchronization. Provides
 * a clean API for theme management throughout the application.
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
 * @version 2.0.0
 */

import type { CustomWindow } from '../../utils/types';

// Optimised Theme Manager
const ThemeManager = {
  _currentTheme: null as string | null,
  _detectInitialTheme() {
    const STORAGE_KEY = 'user-theme-choice';
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)');
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored === 'dark' || stored === 'light') {
        return stored;
      }
    } catch (_) {}
    return prefersDark.matches ? 'dark' : 'light';
  },
  _persist(theme: string) {
    const STORAGE_KEY = 'user-theme-choice';
    try { localStorage.setItem(STORAGE_KEY, theme); } catch (_) {}
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
    document.documentElement.setAttribute('data-theme', theme);
    this._dispatch(theme);
  },
  toggle() {
    const newTheme = this._currentTheme === 'dark' ? 'light' : 'dark';
    this._persist(newTheme);
    this.apply(newTheme === 'dark');
    this.setupState(newTheme === 'dark');
    return newTheme === 'dark';
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
  },
  init() {
    const initialTheme = this._detectInitialTheme();
    this._currentTheme = initialTheme;
    document.documentElement.setAttribute('data-theme', initialTheme);
    this._syncToggle(initialTheme);
    this.setupState(initialTheme === 'dark');
    this._dispatch(initialTheme);
    // Defer non-critical event listeners to reduce initial load impact
    setTimeout(() => {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)');
      prefersDark.addEventListener('change', (e) => {
        try {
          if (localStorage.getItem('user-theme-choice') == null) {
            this.apply(e.matches);
            this.setupState(e.matches);
            this._syncToggle(e.matches ? 'dark' : 'light');
          }
        } catch (_) {}
      });

      // Cross-tab theme sync
      window.addEventListener('storage', (evt) => {
        if (evt.key === 'user-theme-choice' && (evt.newValue === 'dark' || evt.newValue === 'light')) {
          this.apply(evt.newValue === 'dark');
          this.setupState(evt.newValue === 'dark');
          this._syncToggle(evt.newValue);
        }
      });
    }, 100);
  }
};

if (typeof window !== 'undefined') {
  (window as CustomWindow).ThemeManager = ThemeManager;
}

export default ThemeManager; 