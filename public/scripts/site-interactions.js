/**
 * Site-wide interaction enhancements
 * Optimized for performance and progressive enhancement
 */

class SiteInteractions {
    constructor() {
      this.observers = new Map();
      this.isReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      
      this.init();
    }
  
    // Utilities
    static debounce(func, wait) {
      let timeout;
      return function executedFunction(...args) {
        const later = () => {
          clearTimeout(timeout);
          func.apply(this, args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
      };
    }
  
    static throttle(func, limit) {
      let inThrottle;
      return function executedFunction(...args) {
        if (!inThrottle) {
          func.apply(this, args);
          inThrottle = true;
          setTimeout(() => inThrottle = false, limit);
        }
      };
    }
  
    // Enhanced smooth scrolling
    initSmoothScrolling() {
      if (this.isReducedMotion) return;
  
      this.handleAnchorClick = (e) => {
        const link = e.target.closest('a[href^="#"]');
        if (!link) return;
  
        const targetId = link.getAttribute('href');
        if (targetId === '#') return;
  
        const targetElement = document.querySelector(targetId);
        if (!targetElement) return;
  
        e.preventDefault();
        
        targetElement.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
  
        // Update URL without jumping
        history.pushState?.(null, null, targetId);
      };
  
      document.addEventListener('click', this.handleAnchorClick, { passive: false });
    }
  
    // Optimized lazy loading with intersection observer
    initLazyLoading() {
      if (!('IntersectionObserver' in window)) return;
  
      const imageObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const img = entry.target;
            this.loadImage(img);
            imageObserver.unobserve(img);
          }
        });
      }, {
        rootMargin: '50px 0px',
        threshold: 0.1
      });
  
      this.observers.set('images', imageObserver);
  
      // Observe existing images
      document.querySelectorAll('img[data-src]').forEach(img => {
        imageObserver.observe(img);
      });
  
      // Handle dynamically added images
      this.setupDynamicImageObserver();
    }
  
    loadImage(img) {
      return new Promise((resolve, reject) => {
        const tempImg = new Image();
        
        tempImg.onload = () => {
          img.src = tempImg.src;
          img.removeAttribute('data-src');
          img.classList.remove('lazy');
          img.classList.add('loaded');
          resolve(img);
        };
        
        tempImg.onerror = () => {
          img.classList.add('error');
          reject(new Error('Failed to load image'));
        };
        
        tempImg.src = img.dataset.src;
      });
    }
  
    setupDynamicImageObserver() {
      if (!('MutationObserver' in window)) return;
  
      const mutationObserver = new MutationObserver((mutations) => {
        mutations.forEach(mutation => {
          mutation.addedNodes.forEach(node => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              const images = node.matches?.('img[data-src]') 
                ? [node] 
                : [...(node.querySelectorAll?.('img[data-src]') || [])];
              
              images.forEach(img => {
                this.observers.get('images')?.observe(img);
              });
            }
          });
        });
      });
  
      mutationObserver.observe(document.body, {
        childList: true,
        subtree: true
      });
  
      this.observers.set('mutation', mutationObserver);
    }
  
    // Enhanced focus management
    initFocusManagement() {
      this.setupSkipLink();
      this.setupModalEscape();
      this.setupFocusTrap();
    }
  
    setupSkipLink() {
      const skipLink = document.querySelector('.skip-link');
      if (!skipLink) return;
  
      skipLink.addEventListener('click', (e) => {
        e.preventDefault();
        const target = document.querySelector(skipLink.getAttribute('href'));
        if (target) {
          target.setAttribute('tabindex', '-1');
          target.focus();
          target.addEventListener('blur', () => {
            target.removeAttribute('tabindex');
          }, { once: true });
        }
      });
    }
  
    setupModalEscape() {
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
          const openModal = document.querySelector('[aria-modal="true"]');
          if (openModal) {
            const closeButton = openModal.querySelector('[data-close]');
            closeButton?.click();
          }
        }
      });
    }
  
    setupFocusTrap() {
      // Enhanced focus trap for modals and panels
      document.addEventListener('keydown', (e) => {
        if (e.key !== 'Tab') return;
  
        const modal = document.querySelector('[aria-modal="true"]');
        if (!modal) return;
  
        const focusables = modal.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        
        if (!focusables.length) return;
  
        const firstFocusable = focusables[0];
        const lastFocusable = focusables[focusables.length - 1];
  
        if (e.shiftKey) {
          if (document.activeElement === firstFocusable) {
            e.preventDefault();
            lastFocusable.focus();
          }
        } else {
          if (document.activeElement === lastFocusable) {
            e.preventDefault();
            firstFocusable.focus();
          }
        }
      });
    }
  
    // Performance monitoring with error handling
    initPerformanceMonitoring() {
      if (!('performance' in window && 'PerformanceObserver' in window)) return;
      if (window.location.hostname !== 'localhost') return;
  
      const metrics = {
        lcp: null,
        fid: null,
        cls: 0
      };
  
      try {
        // LCP (Largest Contentful Paint)
        new PerformanceObserver((entryList) => {
          const entries = entryList.getEntries();
          const lastEntry = entries[entries.length - 1];
          metrics.lcp = lastEntry.startTime;
          this.reportMetric('LCP', metrics.lcp);
        }).observe({ type: 'largest-contentful-paint', buffered: true });
  
        // FID (First Input Delay)
        new PerformanceObserver((entryList) => {
          entryList.getEntries().forEach(entry => {
            metrics.fid = entry.processingStart - entry.startTime;
            this.reportMetric('FID', metrics.fid);
          });
        }).observe({ type: 'first-input', buffered: true });
  
        // CLS (Cumulative Layout Shift)
        new PerformanceObserver((entryList) => {
          entryList.getEntries().forEach(entry => {
            if (!entry.hadRecentInput) {
              metrics.cls += entry.value;
              this.reportMetric('CLS', metrics.cls);
            }
          });
        }).observe({ type: 'layout-shift', buffered: true });
  
      } catch (error) {
        // Performance monitoring failed silently
      }
    }
  
    reportMetric(name, value) {
      // In production, send to analytics
      // Only log in development
      if (window.location.hostname === 'localhost') {
        // Performance metric logged
      }
      
      // Dispatch custom event for external listeners
      document.dispatchEvent(new CustomEvent('performance-metric', {
        detail: { name, value }
      }));
    }
  
    // Enhanced keyboard navigation
    initKeyboardNavigation() {
      const gridConfig = {
        selectors: '.group a, .modernist-card a',
        columns: this.getGridColumns()
      };
  
      document.addEventListener('keydown', (e) => {
        if (!['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) return;
  
        const activeElement = document.activeElement;
        if (!activeElement?.matches(gridConfig.selectors)) return;
  
        e.preventDefault();
        
        const cards = [...document.querySelectorAll(gridConfig.selectors)];
        const currentIndex = cards.indexOf(activeElement);
        
        if (currentIndex === -1) return;
  
        const nextIndex = this.calculateNextIndex(
          currentIndex, 
          e.key, 
          cards.length, 
          gridConfig.columns
        );
  
        if (nextIndex >= 0 && nextIndex < cards.length) {
          cards[nextIndex].focus();
        }
      });
  
      // Update grid columns on resize
      window.addEventListener('resize', SiteInteractions.throttle(() => {
        gridConfig.columns = this.getGridColumns();
      }, 250));
    }
  
    getGridColumns() {
      const width = window.innerWidth;
      if (width >= 1280) return 4;
      if (width >= 1024) return 3;
      if (width >= 768) return 2;
      return 1;
    }
  
    calculateNextIndex(currentIndex, key, totalItems, columns) {
      switch (key) {
        case 'ArrowRight':
          return (currentIndex + 1) % totalItems;
        case 'ArrowLeft':
          return (currentIndex - 1 + totalItems) % totalItems;
        case 'ArrowDown':
          return Math.min(currentIndex + columns, totalItems - 1);
        case 'ArrowUp':
          return Math.max(currentIndex - columns, 0);
        default:
          return currentIndex;
      }
    }
  
    // Motion preference handling
    handleReducedMotion() {
      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
      
      const updateMotionPreference = (mediaQuery) => {
        this.isReducedMotion = mediaQuery.matches;
      };
  
      updateMotionPreference(prefersReducedMotion);
      prefersReducedMotion.addEventListener('change', updateMotionPreference);
    }
  
    // Initialize all enhancements
    init() {
      // Use requestIdleCallback for non-critical features
      const initFeatures = () => {
        this.initSmoothScrolling();
        this.initLazyLoading();
        this.initFocusManagement();
        this.initKeyboardNavigation();
        this.handleReducedMotion();
        this.initPerformanceMonitoring();
      };
  
      if ('requestIdleCallback' in window) {
        requestIdleCallback(initFeatures, { timeout: 2000 });
      } else {
        setTimeout(initFeatures, 100);
      }
    }
  
    // Cleanup method for SPA navigation
    destroy() {
      // Disconnect observers
      this.observers.forEach(observer => observer.disconnect());
      this.observers.clear();
      
      // Remove event listeners
      if (this.handleAnchorClick) {
        document.removeEventListener('click', this.handleAnchorClick);
      }
    }
  }
  
  // Auto-initialize when DOM is ready
  const siteInteractions = (() => {
    let instance = null;
    
    const init = () => {
      if (instance) instance.destroy();
      instance = new SiteInteractions();
      return instance;
    };
  
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', init);
    } else {
      init();
    }
  
    // Handle SPA navigation
    document.addEventListener('astro:after-swap', init);
  
    return { getInstance: () => instance };
  })();
  
  // Export for module usage
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = SiteInteractions;
  }