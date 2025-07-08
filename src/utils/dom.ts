/**
 * DOM Utility Functions
 * 
 * This module provides a comprehensive set of utility functions for DOM manipulation,
 * event handling, and browser interaction. It serves as a centralized toolkit for
 * common DOM operations used throughout the website.
 * 
 * Key Features:
 * - Element querying and selection utilities
 * - Event listener management with cleanup
 * - Visibility and display toggling
 * - Accessibility and focus management
 * - Responsive design utilities
 * - Performance optimization helpers
 * 
 * Usage:
 * - Import and use individual functions: import { DOMUtils } from './dom.ts'
 * - Access via global object: window.DOMUtils (if available)
 * - Designed for both modern browsers and progressive enhancement
 * 
 * Dependencies:
 * - TypeScript for type safety
 * - Native browser APIs (no external dependencies)
 * 
 * @author Tomi
 * @version 1.0.0
 */

// DOM Utility Functions

export const DOMUtils = {
  /**
   * Query a single element
   * @param selector CSS selector
   * @param context Optional context element
   * @returns HTMLElement or null
   */
  $: function(selector: string, context: Element | Document = document): HTMLElement | null {
    return context.querySelector(selector);
  },

  /**
   * Query multiple elements
   * @param selector CSS selector
   * @param context Optional context element
   * @returns NodeList of elements
   */
  $$: function(selector: string, context: Element | Document = document): NodeListOf<HTMLElement> {
    return context.querySelectorAll(selector);
  },

  /**
   * Map CSS selectors to a Map of elements
   * @param selectors Object with key:selector pairs
   * @param context Optional context element
   * @returns Map of key to HTMLElement
   */
  mapElements: function(selectors: Record<string, string>, context: Element | Document = document): Map<string, HTMLElement> {
    const elements = new Map<string, HTMLElement>();
    Object.entries(selectors).forEach(([key, selector]) => {
      const element = this.$(selector, context) as HTMLElement;
      if (element) {
        elements.set(key, element);
      }
    });
    return elements;
  },

  /**
   * Add event listener and return cleanup function
   * @param element Target element
   * @param event Event type
   * @param handler Event handler
   * @param options Event listener options
   * @returns Cleanup function
   */
  addEvent: function<T extends Event>(
    element: EventTarget,
    event: string,
    handler: (e: T) => void,
    options?: boolean | AddEventListenerOptions
  ): () => void {
    const listener = handler as EventListener;
    element.addEventListener(event, listener, options);
    return () => element.removeEventListener(event, listener, options);
  },

  /**
   * Toggle element visibility
   * @param element Target element
   * @param visible Whether to show or hide
   * @param display Display style when visible (default: 'block')
   */
  toggleVisibility: function(element: HTMLElement, visible: boolean, display = 'block'): void {
    if (visible) {
      element.classList.remove('hidden');
      if (display !== 'block') {
        element.style.display = display;
      }
    } else {
      element.classList.add('hidden');
      element.style.display = '';
    }
  },

  /**
   * Check if user prefers reduced motion
   * @returns boolean
   */
  prefersReducedMotion: function(): boolean {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  },

  /**
   * Check if device is mobile based on viewport width
   * @returns boolean
   */
  isMobile: function(): boolean {
    return window.innerWidth < 1024;
  },

  /**
   * Scroll to an element with smooth behavior
   * @param element Target element
   * @param behavior Scroll behavior
   */
  scrollToElement: function(element: HTMLElement, behavior: ScrollBehavior = 'smooth'): void {
    element.scrollIntoView({ behavior, block: 'start' });
  },

  /**
   * Focus an element
   * @param element Target element
   */
  focusElement: function(element: HTMLElement): void {
    element.focus();
  },

  /**
   * Get focusable elements within a container
   * @param container Container element
   * @returns Array of focusable elements
   */
  getFocusableElements: function(container: HTMLElement): HTMLElement[] {
    return Array.from(container.querySelectorAll('a[href], button, input, textarea, select, details, [tabindex]:not([tabindex="-1"])')) as HTMLElement[];
  },

  /**
   * Get current breakpoint based on window width
   * @returns Current breakpoint
   */
  getBreakpoint: function(): string {
    const width = window.innerWidth;
    if (width < 640) return 'xs';
    if (width < 768) return 'sm';
    if (width < 1024) return 'md';
    if (width < 1280) return 'lg';
    if (width < 1536) return 'xl';
    return '2xl';
  },

  /**
   * Throttle a function to limit execution rate
   * @param func Function to throttle
   * @param limit Time limit in milliseconds
   * @returns Throttled function
   */
  throttle: function<T extends (...args: any[]) => any>(func: T, limit: number): (...args: Parameters<T>) => ReturnType<T> | undefined {
    let inThrottle = false;
    let lastResult: ReturnType<T>;
    return function(this: any, ...args: Parameters<T>): ReturnType<T> | undefined {
      if (!inThrottle) {
        lastResult = func.apply(this, args);
        inThrottle = true;
        setTimeout(() => (inThrottle = false), limit);
      }
      return lastResult;
    };
  }
}; 