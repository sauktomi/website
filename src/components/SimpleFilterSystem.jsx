/**
 * Simple Filter System Component
 * 
 * A lightweight, performant filtering system that provides search and filter
 * functionality for recipe listings and directory pages. Uses native HTML
 * Popover API for filter interfaces and minimal JavaScript for optimal performance.
 * 
 * Features:
 * - Real-time search with multiple data attribute support
 * - Multi-select and single-select filter options
 * - URL-based filtering with shareable links
 * - Native HTML Popover API for filter interfaces
 * - Mobile-optimized touch interactions
 * - Automatic results counting and display
 * - Section-based filtering with visibility management
 * - Keyboard navigation support
 * - Accessibility features (ARIA labels, screen reader support)
 * 
 * Performance Optimizations:
 * - Minimal DOM manipulation
 * - Efficient filtering algorithms
 * - Debounced search input
 * - Memory leak prevention
 * - No external dependencies beyond Preact
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

import { useEffect, useRef, useState } from 'preact/hooks';

/**
 * @typedef {Object} FilterOption
 * @property {string} id - Unique identifier for the option
 * @property {string} label - Display label for the option
 * @property {string} value - Value to filter by
 */

/**
 * @typedef {Object} FilterSection
 * @property {string} id - Unique identifier for the section
 * @property {string} title - Display title for the section
 * @property {string} icon - SVG path or icon identifier
 * @property {'single' | 'multi'} type - Type of filter selection
 * @property {FilterOption[]} options - Array of filter options
 */

/**
 * @param {Object} props
 * @param {Object} props.config - Configuration for filtering
 * @param {string} [props.searchPlaceholder="Etsi..."] - Placeholder text for search input
 * @param {FilterSection[]} [props.filterSections=[]] - Array of filter sections
 * @param {string} [props.resultsCountText="tulosta löytyi"] - Text for results count
 * @param {boolean} [props.updateUrl=true] - Whether to update URL when filters change
 */
export default function SimpleFilterSystem({ 
  config,
  searchPlaceholder = "Etsi...",
  filterSections = [],
  updateUrl = true
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilters, setActiveFilters] = useState(new Map());
  const [isInitialized, setIsInitialized] = useState(false);
  const searchInputRef = useRef(null);

  // Configuration with defaults
  const filterConfig = {
    itemSelector: '.recipe-item-wrapper, .reference-item-wrapper',
    sectionSelector: '.category-section, .letter-section',
    noResultsId: 'no-results',
    ...config
  };

  // Initialize filters from URL parameters on component mount
  useEffect(() => {
    if (typeof window === 'undefined' || isInitialized) return;
    
    const urlParams = new URLSearchParams(window.location.search);
    const urlFilters = new Map();
    
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
    const searchParam = urlParams.get('search') || urlParams.get('q');
    if (searchParam) {
      setSearchTerm(searchParam);
    }
    
    if (urlFilters.size > 0) {
      setActiveFilters(urlFilters);
    }
    
    setIsInitialized(true);
  }, [filterSections]);

  // Update URL when filters change (debounced)
  useEffect(() => {
    if (!isInitialized || !updateUrl || typeof window === 'undefined') return;
    
    const timeoutId = setTimeout(() => {
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
    }, 300); // Debounce URL updates
    
    return () => clearTimeout(timeoutId);
  }, [activeFilters, searchTerm, isInitialized, updateUrl]);

  // Core filtering logic (simplified)
  const applyFilters = (term = searchTerm, filters = activeFilters) => {
    const items = document.querySelectorAll(filterConfig.itemSelector);
    const sections = document.querySelectorAll(filterConfig.sectionSelector);
    const noResults = document.getElementById(filterConfig.noResultsId);
    
    let visibleCount = 0;

    items.forEach(item => {
      const isVisible = itemMatchesFilters(item, term, filters);
      const wrapper = item.closest('.list-item-wrapper, .recipe-item-wrapper, .reference-item-wrapper') || item;
      
      if (isVisible) {
        wrapper.style.display = '';
        visibleCount++;
      } else {
        wrapper.style.display = 'none';
      }
    });

    sections.forEach(section => {
      const sectionItems = section.querySelectorAll(filterConfig.itemSelector);
      const visibleSectionItems = Array.from(sectionItems).filter(item => {
        const wrapper = item.closest('.list-item-wrapper, .recipe-item-wrapper, .reference-item-wrapper') || item;
        return wrapper.style.display !== 'none';
      });
      
      section.style.display = visibleSectionItems.length > 0 ? '' : 'none';
    });

    if (noResults) {
      noResults.style.display = visibleCount === 0 ? 'block' : 'none';
    }
  };

  const itemMatchesFilters = (item, term, filters) => {
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
        const value = item.dataset[attr] || '';
        return value.toLowerCase().includes(searchTerm);
      });
      
      if (!matchesSearch) return false;
    }

    // Other filters
    for (const [filterType, filterValue] of filters.entries()) {
      let itemValue = '';
      
      // Map filter types to correct data attributes
      switch (filterType) {
        case 'vaikeustaso':
          // Check both vaikeustaso and difficulty attributes
          itemValue = item.dataset.vaikeustaso || item.dataset.difficulty || '';
          break;
        case 'kokonaisaika':
          // Handle time categorization
          const rawTime = item.dataset.kokonaisaika || '';
          if (rawTime) {
            // Convert raw time to category
            const timeValue = categorizeTime(rawTime);
            itemValue = timeValue;
          }
          break;
        case 'techniques':
          itemValue = item.dataset.techniques || '';
          break;
        case 'category':
          itemValue = item.dataset.category || '';
          break;
        case 'tags':
          itemValue = item.dataset.tags || '';
          break;
        case 'dietary':
          itemValue = item.dataset.dietary || '';
          break;
        case 'type':
          itemValue = item.dataset.type || '';
          break;
        default:
          // Try direct attribute match
          itemValue = item.dataset[filterType.toLowerCase()] || '';
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

  // Helper function to categorize time values
  const categorizeTime = (timeValue) => {
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

  // Apply filters when search term or filters change
  useEffect(() => {
    if (isInitialized) {
      applyFilters();
    }
  }, [searchTerm, activeFilters, isInitialized]);

  // Helper function to get active filter count for a section
  const getActiveFilterCount = (sectionId) => {
    const filters = activeFilters.get(sectionId);
    if (!filters) return 0;
    return Array.isArray(filters) ? filters.length : 1;
  };

  // Handle filter selection
  const handleFilterClick = (sectionId, value, type) => {
    const newActiveFilters = new Map(activeFilters);
    
    if (type === 'multi') {
      // Multi-select filter
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
    } else {
      // Single-select filter
      const currentValue = newActiveFilters.get(sectionId);
      if (currentValue === value) {
        newActiveFilters.delete(sectionId);
      } else {
        newActiveFilters.set(sectionId, value);
      }
    }
    
    setActiveFilters(newActiveFilters);
    
    // Hide the popover after selection only for single-select filters
    if (type === 'single') {
      const popover = document.getElementById(`filter-popover-${sectionId}`);
      if (popover) {
        popover.hidePopover();
      }
    }
  };

  // Clear filters for a specific section
  const clearSectionFilters = (sectionId) => {
    const newActiveFilters = new Map(activeFilters);
    newActiveFilters.delete(sectionId);
    setActiveFilters(newActiveFilters);
  };

  // Clear all filters
  const clearAllFilters = () => {
    setActiveFilters(new Map());
    setSearchTerm('');
  };

  // Clear search input only
  const clearSearchInput = () => {
    setSearchTerm('');
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  };

  // Handle popover state for filter buttons
  useEffect(() => {
    const filterButtons = document.querySelectorAll('.filter-button[popovertarget]');
    
    filterButtons.forEach(button => {
      const popoverId = button.getAttribute('popovertarget');
      const popover = document.getElementById(popoverId);
      
      if (popover) {
        // Set initial state
        button.setAttribute('aria-expanded', 'false');
        
        // Listen for popover events
        popover.addEventListener('toggle', (event) => {
          const isOpen = event.newState === 'open';
          button.setAttribute('aria-expanded', isOpen.toString());
        });
      }
    });
  }, [filterSections]);

  return (
    <div class="filter-system-container">
      
      {/* Filter Controls */}
      <div class="filter-controls">
        {/* Filter Buttons */}
        {filterSections.map((section) => {
          const activeCount = getActiveFilterCount(section.id);
          return (
            <button
              key={section.id}
              popovertarget={`filter-popover-${section.id}`}
              class="filter-button"
              aria-label={`Avaa ${section.title} suodattimet`}
              style={`--anchor-name: --filter-button-${section.id}`}
            >
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d={section.icon}></path>
              </svg>
              {activeCount > 0 && (
                <span class="filter-button-badge" aria-label={`${activeCount} suodatin aktiivinen`}>
                  {activeCount}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Search Input */}
      <div class="filter-search-container">
        <div class="filter-search-icon">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
          </svg>
        </div>
        <input
          ref={searchInputRef}
          type="search"
          placeholder={searchPlaceholder}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          class="filter-search-input"
          aria-label="Etsi sisältöä"
        />
        {/* Clear Search Button - positioned on the right side of search */}
        {searchTerm && (
          <button
            onClick={clearSearchInput}
            class="filter-clear-button"
            aria-label="Tyhjennä hakuteksti"
          >
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        )}
      </div>

      {/* Filter Popovers */}
      {filterSections.map((section) => (
        <div
          key={section.id}
          id={`filter-popover-${section.id}`}
          popover="auto"
          class="filter-popover filter-popover-positioned popover-smooth-transition"
          style={`--position-anchor: --filter-button-${section.id}`}
        >

            {/* Filter Options */}
            <div class="filter-options">
              {section.options.map((option) => {
                const isActive = section.type === 'multi' 
                  ? (activeFilters.get(section.id) || []).includes(option.value)
                  : activeFilters.get(section.id) === option.value;
                
                return (
                  <button
                    key={option.id}
                    onClick={() => handleFilterClick(section.id, option.value, section.type)}
                    aria-pressed={isActive}
                    aria-label={`${isActive ? 'Poista' : 'Valitse'} suodatin: ${option.label}`}
                    class={`filter-option-button ${isActive ? 'active' : ''}`}
                  >
                    <span class="filter-option-text">{option.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Clear Section Filters Button */}
            {getActiveFilterCount(section.id) > 0 && (
              <div class="filter-clear-section">
                <button
                  onClick={() => clearSectionFilters(section.id)}
                  class="filter-clear-section-button"
                  aria-label={`Tyhjennä ${section.title} suodattimet`}
                >
                  Tyhjennä suodattimet
                </button>
              </div>
            )}
          </div>
      ))}

    </div>
  );
} 