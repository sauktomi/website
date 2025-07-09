/**
 * Performance Utilities
 * 
 * Shared utility functions for performance optimization across the website.
 * Consolidates debounce, throttle, and requestIdleCallback patterns.
 * 
 * @author Tomi
 * @version 1.0.0
 */

/**
 * Debounce a function to limit execution frequency
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T, 
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return function executedFunction(this: unknown, ...args: Parameters<T>) {
    const later = () => {
      clearTimeout(timeout);
      func.apply(this, args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Throttle a function to limit execution rate
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T, 
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  return function executedFunction(this: unknown, ...args: Parameters<T>) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

/**
 * Execute function when browser is idle, with fallback
 */
export function executeWhenIdle(
  callback: () => void, 
  timeout: number = 2000
): number | undefined {
  if (window.requestIdleCallback) {
    return window.requestIdleCallback(callback, { timeout });
  } else {
    setTimeout(callback, 100);
    return undefined;
  }
}

/**
 * Cancel idle callback if supported
 */
export function cancelIdleExecution(id: number): void {
  if (window.cancelIdleCallback) {
    window.cancelIdleCallback(id);
  }
}

// Global type extensions
declare global {
  interface Window {
    requestIdleCallback: (callback: IdleRequestCallback, options?: IdleRequestOptions) => number;
    cancelIdleCallback: (id: number) => void;
  }
} 