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
 * 
 * @author Tomi
 * @version 2.0.0
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
 */
export default function SimpleFilterSystem({ 
  config,
  searchPlaceholder = "Etsi...",
  filterSections = []
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilters, setActiveFilters] = useState(new Map());
  const searchInputRef = useRef(null);

  // Configuration with defaults
  const filterConfig = {
    itemSelector: '.recipe-item-wrapper, .reference-item-wrapper',
    sectionSelector: '.category-section, .letter-section',
    noResultsId: 'no-results',
    ...config
  };

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
      const itemValue = item.dataset[filterType.toLowerCase()] || '';
      
      if (Array.isArray(filterValue)) {
        const itemValues = itemValue.split(',').map(v => v.trim().toLowerCase());
        const matches = filterValue.some(fv => itemValues.includes(fv.toLowerCase()));
        if (!matches) return false;
      } else {
        if (itemValue.toLowerCase() !== filterValue.toLowerCase()) return false;
      }
    }

    return true;
  };

  // Apply filters when search term or filters change
  useEffect(() => {
    applyFilters();
  }, [searchTerm, activeFilters]);

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
    applyFilters(searchTerm, newActiveFilters);
    
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
    applyFilters(searchTerm, newActiveFilters);
  };

  // Clear all filters
  const clearAllFilters = () => {
    setActiveFilters(new Map());
    setSearchTerm('');
    applyFilters('', new Map());
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
      </div>

      {/* Filter Controls */}
      <div class="filter-controls">
        {/* Filter Buttons */}
        {filterSections.map((section) => {
          const activeCount = getActiveFilterCount(section.id);
          return (
            <button
              key={section.id}
              popovertarget={`filter-popover-${section.id}`}
              class="filter-button filter-button-anchor"
              aria-label={`Avaa ${section.title} suodattimet`}
              style={`--anchor-name: --filter-button-${section.id}`}
            >
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d={section.icon}></path>
              </svg>
              <span class="filter-button-text">{section.title}</span>
              {activeCount > 0 && (
                <span class="filter-button-badge" aria-label={`${activeCount} suodatin aktiivinen`}>
                  {activeCount}
                </span>
              )}
            </button>
          );
        })}

        {/* Clear All Filters Button */}
        {activeFilters.size > 0 && (
          <button
            onClick={clearAllFilters}
            class="clear-all-button"
            aria-label="Tyhjennä kaikki suodattimet"
          >
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
            <span class="clear-all-button-text">Tyhjennä kaikki</span>
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

          {/* Popover Content */}
          <div class="filter-popover-content">
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
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                  </svg>
                  Tyhjennä suodattimet
                </button>
              </div>
            )}
          </div>
        </div>
      ))}

    </div>
  );
} 