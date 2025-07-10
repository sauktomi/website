/**
 * Simple Filter System Utilities
 * 
 * A lightweight, performant filtering system that provides search and filter
 * functionality for recipe listings and directory pages. Core utility functions
 * for filtering DOM elements and managing filter state.
 * 
 * Features:
 * - Real-time search with multiple data attribute support
 * - Multi-select and single-select filter options
 * - URL-based filtering with shareable links
 * - Section-based filtering with visibility management
 * - Efficient filtering algorithms
 * - Memory leak prevention
 * 
 * Usage:
 * - Recipe listing page: Filter by difficulty, time, techniques, etc.
 * - Directory page: Filter by type, dietary restrictions, categories
 * - Search across multiple data attributes
 * - Real-time results updating
 * - URL-based filter initialization and updates
 * 
 * @author Tomi
 * @version 2.1.0
 */

/**
 * @typedef FilterOption
 */
export interface FilterOption {
    id: string;
    label: string;
    value: string;
  }
  
  /**
   * @typedef FilterSection
   */
  export interface FilterSection {
    id: string;
    title: string;
    icon: string;
    type: 'single' | 'multi';
    options: FilterOption[];
  }
  
  /**
   * @typedef FilterConfig
   */
  export interface FilterConfig {
    itemSelector: string;
    sectionSelector: string;
    noResultsId: string;
  }
  
  /**
   * @typedef FilterSystemOptions
   */
  export interface FilterSystemOptions {
    config: FilterConfig;
    searchPlaceholder?: string;
    filterSections?: FilterSection[];
    resultsCountText?: string;
    updateUrl?: boolean;
  }
  
  /**
   * Default configuration for filtering
   */
  export const defaultFilterConfig: FilterConfig = {
    itemSelector: '.recipe-item-wrapper, .reference-item-wrapper',
    sectionSelector: '.category-section, .letter-section',
    noResultsId: 'no-results'
  };
  
  /**
   * Helper function to categorize time values
   */
  export const categorizeTime = (timeValue: string | number): string => {
    if (!timeValue) return '';
    
    // Handle ranges like "80-105" or single values like "45"
    const timeStr = timeValue.toString();
    
    // Extract the highest number from ranges (e.g., "80-105" -> 105)
    const numbers = timeStr.match(/\d+/g);
    if (!numbers) return '';
    
    const maxMinutes = Math.max(...numbers.map(n => parseInt(n)));
    
    // Handle hour notation (e.g., "~4-5h" -> 240-300 minutes)
    if (timeStr.includes('h') || timeStr.includes('tuntia')) {
      // Convert hours to minutes (assuming the numbers are hours)
      const hourNumbers = timeStr.match(/\d+/g);
      if (hourNumbers) {
        const maxHours = Math.max(...hourNumbers.map(n => parseInt(n)));
        const totalMinutes = maxHours * 60;
        
        if (totalMinutes <= 30) return 'quick';
        if (totalMinutes <= 60) return 'medium';
        if (totalMinutes <= 120) return 'long';
        return 'extended';
      }
    }
    
    // Handle very long times (like 20-30h which would be 1200-1800 minutes)
    if (maxMinutes > 1000) return 'extended';
    
    // Handle very short times (like 7-8 minutes)
    if (maxMinutes <= 30) return 'quick';
    if (maxMinutes <= 60) return 'medium';
    if (maxMinutes <= 120) return 'long';
    return 'extended';
  };
  
  /**
   * Check if an item matches the current filters
   */
  export const itemMatchesFilters = (
    item: Element, 
    term: string, 
    filters: Map<string, string | string[]>
  ): boolean => {
    // Search filter
    if (term) {
      const searchTerm = term.toLowerCase();
      
      // Search in all available data attributes that contain searchable text
      const searchableAttributes = [
        'searchName', 'title', 'name', 'techniques', 'category', 'tags', 
        'recipeNumber', 'recipeNumberRaw', 'recipeNumberVariations',
        'dietary', 'vaikeustaso', 'difficulty', 'costlevel', 'cost',
        'kokonaisaika', 'firstLetter'
      ];
      
      const matchesSearch = searchableAttributes.some(attr => {
        const value = (item as HTMLElement).dataset[attr] || '';
        return value.toLowerCase().includes(searchTerm);
      });
      
      if (!matchesSearch) return false;
    }
  
    // Other filters
    for (const [filterType, filterValue] of filters.entries()) {
      let itemValue = '';
      const dataset = (item as HTMLElement).dataset;
      
      // Map filter types to correct data attributes
      switch (filterType) {
        case 'vaikeustaso':
          // Check both vaikeustaso and difficulty attributes
          itemValue = dataset.vaikeustaso || dataset.difficulty || '';
          break;
        case 'kokonaisaika':
          // Handle time categorization
          const rawTime = dataset.kokonaisaika || '';
          if (rawTime) {
            // Convert raw time to category
            const timeValue = categorizeTime(rawTime);
            itemValue = timeValue;
          }
          break;
        case 'techniques':
          itemValue = dataset.techniques || '';
          break;
        case 'category':
          itemValue = dataset.category || '';
          break;
        case 'tags':
          itemValue = dataset.tags || '';
          break;
        case 'dietary':
          itemValue = dataset.dietary || '';
          break;
        case 'type':
          itemValue = dataset.type || '';
          break;
        default:
          // Try direct attribute match
          itemValue = dataset[filterType.toLowerCase()] || '';
      }
      
      if (Array.isArray(filterValue)) {
        const itemValues = itemValue.split(',').map(v => v.trim().toLowerCase());
        const matches = filterValue.some(fv => {
          const filterVal = fv.toLowerCase();
          // For difficulty levels, also check compound values (e.g., "keskivaikea-vaativa")
          return itemValues.some(itemVal => {
            // Split compound values and check if any part matches
            const itemParts = itemVal.split('-').map(part => part.trim());
            return itemParts.includes(filterVal) || itemVal === filterVal;
          });
        });
        if (!matches) return false;
      } else {
        const filterVal = filterValue.toLowerCase();
        const itemParts = itemValue.toLowerCase().split('-').map(part => part.trim());
        if (!itemParts.includes(filterVal) && itemValue.toLowerCase() !== filterVal) return false;
      }
    }
  
    return true;
  };
  
  /**
   * Apply filters to DOM elements
   */
  export const applyFilters = (
    term: string = '', 
    filters: Map<string, string | string[]> = new Map(),
    config: FilterConfig = defaultFilterConfig
  ): number => {
    // Add DOM ready check
    if (typeof document === 'undefined') return 0;
    
    const items = document.querySelectorAll(config.itemSelector);
    const sections = document.querySelectorAll(config.sectionSelector);
    const noResults = document.getElementById(config.noResultsId);
    
    let visibleCount = 0;
  
    items.forEach(item => {
      const isVisible = itemMatchesFilters(item, term, filters);
      const wrapper = item.closest('.list-item-wrapper, .recipe-item-wrapper, .reference-item-wrapper') || item;
      
      if (isVisible) {
        (wrapper as HTMLElement).style.display = '';
        visibleCount++;
      } else {
        (wrapper as HTMLElement).style.display = 'none';
      }
    });
  
    sections.forEach(section => {
      const sectionItems = section.querySelectorAll(config.itemSelector);
      const visibleSectionItems = Array.from(sectionItems).filter(item => {
        const wrapper = item.closest('.list-item-wrapper, .recipe-item-wrapper, .reference-item-wrapper') || item;
        return (wrapper as HTMLElement).style.display !== 'none';
      });
      
      (section as HTMLElement).style.display = visibleSectionItems.length > 0 ? '' : 'none';
    });
  
    if (noResults) {
      noResults.style.display = visibleCount === 0 ? 'block' : 'none';
    }
  
    return visibleCount;
  };
  
  /**
   * Initialize filters from URL parameters
   */
  export const initializeFiltersFromUrl = (filterSections: FilterSection[]): {
    urlFilters: Map<string, string | string[]>;
    searchTerm: string;
  } => {
    if (typeof window === 'undefined') {
      return { urlFilters: new Map(), searchTerm: '' };
    }
  
    const urlParams = new URLSearchParams(window.location.search);
    const urlFilters = new Map<string, string | string[]>();
    
    // Check each filter section for matching URL parameters
    filterSections.forEach(section => {
      const paramValue = urlParams.get(section.id);
      if (paramValue) {
        // Validate that the parameter value exists in the section options
        const validOptions = section.options.map(opt => opt.value);
        
        if (section.type === 'multi') {
          // For multi-select, support comma-separated values
          const values = paramValue.split(',').filter(val => validOptions.includes(val));
          if (values.length > 0) {
            urlFilters.set(section.id, values);
          }
        } else {
          // For single-select, only set if value is valid
          if (validOptions.includes(paramValue)) {
            urlFilters.set(section.id, paramValue);
          }
        }
      }
    });
    
    // Also check for search parameter
    const searchParam = urlParams.get('search') || urlParams.get('q') || '';
    
    return { urlFilters, searchTerm: searchParam };
  };
  
  /**
   * Update URL with current filter state
   */
  export const updateUrlWithFilters = (
    activeFilters: Map<string, string | string[]>,
    searchTerm: string
  ): void => {
    if (typeof window === 'undefined' || typeof document === 'undefined') return;
    
    const url = new URL(window.location.href);
    const params = new URLSearchParams();
    
    // Add active filters to URL
    activeFilters.forEach((value, key) => {
      if (Array.isArray(value)) {
        params.set(key, value.join(','));
      } else {
        params.set(key, value);
      }
    });
    
    // Add search term if present
    if (searchTerm.trim()) {
      params.set('search', searchTerm);
    }
    
    // Update URL without causing page reload
    const newUrl = params.toString() 
      ? `${url.pathname}?${params.toString()}` 
      : url.pathname;
      
    if (newUrl !== window.location.pathname + window.location.search) {
      window.history.replaceState({}, '', newUrl);
    }
  };
  
  /**
   * Handle filter selection for multi-select filters
   */
  export const handleMultiSelectFilter = (
    sectionId: string,
    value: string,
    activeFilters: Map<string, string | string[]>
  ): Map<string, string | string[]> => {
    const newActiveFilters = new Map(activeFilters);
    const currentValues = newActiveFilters.get(sectionId) || [];
    const newValues = Array.isArray(currentValues) ? [...currentValues] : [currentValues];
    
    const valueIndex = newValues.indexOf(value);
    if (valueIndex > -1) {
      newValues.splice(valueIndex, 1);
    } else {
      newValues.push(value);
    }
    
    if (newValues.length === 0) {
      newActiveFilters.delete(sectionId);
    } else {
      newActiveFilters.set(sectionId, newValues);
    }
    
    return newActiveFilters;
  };
  
  /**
   * Handle filter selection for single-select filters
   */
  export const handleSingleSelectFilter = (
    sectionId: string,
    value: string,
    activeFilters: Map<string, string | string[]>
  ): Map<string, string | string[]> => {
    const newActiveFilters = new Map(activeFilters);
    const currentValue = newActiveFilters.get(sectionId);
    
    if (currentValue === value) {
      newActiveFilters.delete(sectionId);
    } else {
      newActiveFilters.set(sectionId, value);
    }
    
    return newActiveFilters;
  };
  
  /**
   * Get active filter count for a section
   */
  export const getActiveFilterCount = (
    sectionId: string,
    activeFilters: Map<string, string | string[]>
  ): number => {
    const filters = activeFilters.get(sectionId);
    if (!filters) return 0;
    return Array.isArray(filters) ? filters.length : 1;
  };
  
  /**
   * Clear filters for a specific section
   */
  export const clearSectionFilters = (
    sectionId: string,
    activeFilters: Map<string, string | string[]>
  ): Map<string, string | string[]> => {
    const newActiveFilters = new Map(activeFilters);
    newActiveFilters.delete(sectionId);
    return newActiveFilters;
  };
  
  /**
   * Check if a filter value is active for a section
   */
  export const isFilterActive = (
    sectionId: string,
    value: string,
    activeFilters: Map<string, string | string[]>,
    type: 'single' | 'multi'
  ): boolean => {
    const filters = activeFilters.get(sectionId);
    if (!filters) return false;
    
    if (type === 'multi') {
      return Array.isArray(filters) ? filters.includes(value) : filters === value;
    } else {
      return filters === value;
    }
  };
  
  /**
   * Debounce function for performance optimization
   */
  export const debounce = <T extends (...args: any[]) => any>(
    func: T,
    wait: number
  ): ((...args: Parameters<T>) => void) => {
    let timeout: NodeJS.Timeout;
    return (...args: Parameters<T>) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), wait);
    };
  };