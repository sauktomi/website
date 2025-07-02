import { useEffect, useRef, useState } from 'preact/hooks';

export default function UnifiedFilterSystem({ 
  config,
  searchPlaceholder = "Etsi...",
  alphabetLinks = [],
  filterButtons = [],
  mainFilterButton = {
    ariaLabel: "Avaa suodattimet",
    icon: "M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.707A1 1 0 013 7V4z"
  },
  individualFilterSections = {},
  mainFilterSections = [],
  maxWidth = "90vw sm:max-w-[82vw]",
  position = "sticky",
  topOffset = "top-3 sm:top-6",
  resultsCountText = "tulosta löytyi"
}) {
  const containerRef = useRef(null);
  const searchInputRef = useRef(null);
  const mainPopupRef = useRef(null);
  const individualPopupRef = useRef(null);

  // State management
  const [activeFilters, setActiveFilters] = useState(new Map());
  const [searchTerm, setSearchTerm] = useState('');
  const [currentSort, setCurrentSort] = useState('newest');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [activePopup, setActivePopup] = useState(null);
  const [activeIndividualFilter, setActiveIndividualFilter] = useState(null);
  const [visibleCount, setVisibleCount] = useState(0);
  const [isInitialized, setIsInitialized] = useState(false);
  const [openAccordions, setOpenAccordions] = useState(new Set());
  const [isMobileView, setIsMobileView] = useState(false);
  // Mobile gesture state for main filter popup (use ref for immediate updates)
  const gestureState = useRef({
    isDragging: false,
    startY: 0,
    currentY: 0,
    popupHeight: 0,
    dismissThreshold: 0,
    fadeDistance: 0,
    backdropElement: null // Cache backdrop element for performance
  });
  // Mobile transition state for smooth animations
  const [isMainPopupVisible, setIsMainPopupVisible] = useState(false);
  const [shouldShowMainPopup, setShouldShowMainPopup] = useState(false);

  // Mobile detection and gesture constants
  const isMobile = () => window.innerWidth < 1024;
  const SWIPE_DISMISS_RATIO = 0.4; // Dismiss at 40% of popup height
  const SWIPE_FADE_RATIO = 0.35; // Full transparency at 35% of popup height

  // Configuration with defaults
  const filterConfig = {
    itemSelector: '.recipe-item-wrapper, .reference-item-wrapper',
    sectionSelector: '.category-section, .letter-section',
    noResultsId: 'no-results',
    ...config
  };

  // Sort filter buttons by priority
  const sortedFilterButtons = filterButtons.sort((a, b) => (a.priority || 999) - (b.priority || 999));

  // Filter badge counts
  const getFilterBadgeCount = (filterId) => {
    const filterValue = activeFilters.get(filterId);
    if (!filterValue) return 0;
    return Array.isArray(filterValue) ? filterValue.length : 1;
  };

  const getTotalActiveFiltersCount = () => {
    return Array.from(activeFilters.entries())
      .filter(([key]) => key !== 'sort')
      .reduce((count, [, value]) => {
        return count + (Array.isArray(value) ? value.length : 1);
      }, 0);
  };

  const hasAnyActiveFilters = () => {
    return searchTerm.length > 0 || getTotalActiveFiltersCount() > 0;
  };

  // Accordion management
  const toggleAccordion = (sectionId) => {
    const newOpenAccordions = new Set(openAccordions);
    if (newOpenAccordions.has(sectionId)) {
      newOpenAccordions.delete(sectionId);
    } else {
      newOpenAccordions.add(sectionId);
    }
    setOpenAccordions(newOpenAccordions);
  };

  // Search functionality
  const toggleSearch = () => {
    const newIsSearchOpen = !isSearchOpen;
    setIsSearchOpen(newIsSearchOpen);
    
    if (newIsSearchOpen) {
      setActivePopup(null); // Close any open popups
      setTimeout(() => {
        if (searchInputRef.current) {
          searchInputRef.current.focus();
        }
      }, 100);
    }
  };

  const closeSearch = () => {
    setIsSearchOpen(false);
  };

  const clearSearch = () => {
    setSearchTerm('');
    closeSearch();
    applyFilters('');
  };

  const handleSearchInput = (value) => {
    setSearchTerm(value);
    applyFilters(value);
  };

    // Show main popup with smooth transition (mobile) or immediate (desktop)
  const showMainPopup = () => {
    if (isMobileView) {
      // Mobile: smooth transition
      setShouldShowMainPopup(true);
      
      // Reset backdrop state in case it was closing
      const backdrop = document.querySelector('.filter-popup__backdrop');
      if (backdrop) {
        backdrop.classList.remove('filter-popup__backdrop--dragging');
        backdrop.style.removeProperty('--backdrop-opacity');
      }
      
      // Small delay to ensure DOM is ready
      requestAnimationFrame(() => {
        setIsMainPopupVisible(true);
      });
    } else {
      // Desktop: immediate show
      setShouldShowMainPopup(true);
      setIsMainPopupVisible(true);
    }
  };

  // Hide main popup with smooth transition and coordinated backdrop fade (mobile only)
  const hideMainPopup = () => {
    if (isMobileView) {
      // Mobile: smooth transition
      setIsMainPopupVisible(false);
      
      // Animate backdrop fade coordinated with popup slide-down
      const backdrop = document.querySelector('.filter-popup__backdrop');
      if (backdrop) {
        // Remove any dragging optimizations
        backdrop.classList.remove('filter-popup__backdrop--dragging');
        
        // Animate backdrop opacity from 0.3 to 0 over 600ms (linear fade)
        const startOpacity = 0.3;
        
        // Use requestAnimationFrame for smooth animation
        const startTime = performance.now();
        const animateBackdrop = (currentTime) => {
          const elapsed = currentTime - startTime;
          const progress = Math.min(elapsed / 600, 1); // 600ms duration
          const currentOpacity = startOpacity * (1 - progress); // Linear fade from start to 0
          
          backdrop.style.setProperty('--backdrop-opacity', currentOpacity.toFixed(3));
          
          if (progress < 1) {
            requestAnimationFrame(animateBackdrop);
          }
        };
        
        requestAnimationFrame(animateBackdrop);
      }
      
      // Keep popup in DOM during transition
      setTimeout(() => {
        setShouldShowMainPopup(false);
        // Reset any drag properties
        if (mainPopupRef.current) {
          mainPopupRef.current.style.removeProperty('--main-drag-offset');
        }
        
        // Reset backdrop properties to CSS default
        if (backdrop) {
          backdrop.style.removeProperty('--backdrop-opacity');
        }
      }, 600); // Match transition duration
    } else {
      // Desktop: immediate close
      setIsMainPopupVisible(false);
      setShouldShowMainPopup(false);
    }
  };

  // Popup management
  const togglePopup = (popupId, filterId = null) => {
    if (popupId === 'individual') {
      // Handle individual filter popup logic
      if (activePopup === 'individual' && activeIndividualFilter === filterId) {
        // Clicking the same individual filter button - close popup
        setActivePopup(null);
        setActiveIndividualFilter(null);
      } else {
        // Opening popup or switching to different individual filter - keep popup open
        setActivePopup('individual');
        setActiveIndividualFilter(filterId);
        setIsSearchOpen(false); // Close search when opening popup
        
        // Show only the relevant section
        if (filterId && individualPopupRef.current) {
          const sections = individualPopupRef.current.querySelectorAll('[data-section-id]');
          sections.forEach(section => {
            section.style.display = section.dataset.sectionId === filterId ? '' : 'none';
          });
        }
      }
    } else if (popupId === 'main') {
      // Handle main popup with smooth transitions
      if (activePopup === 'main') {
        setActivePopup(null);
        hideMainPopup();
      } else {
        setActivePopup('main');
        setActiveIndividualFilter(null); // Clear individual filter when opening main popup
        setIsSearchOpen(false); // Close search when opening popup
        showMainPopup();
      }
    } else {
      // Handle other popups
      if (activePopup === popupId) {
        setActivePopup(null);
      } else {
        setActivePopup(popupId);
        setActiveIndividualFilter(null);
        setIsSearchOpen(false);
      }
    }
  };

  const closeAllPopups = (smooth = true) => {
    if (activePopup === 'main' && smooth) {
      hideMainPopup();
    } else if (activePopup === 'main') {
      // Immediate close without transition
      setIsMainPopupVisible(false);
      setShouldShowMainPopup(false);
    }
    setActivePopup(null);
    setActiveIndividualFilter(null);
  };

  // Mobile gesture handling for main filter popup
  const handleGestureStart = (e) => {
    if (!isMobileView || activePopup !== 'main') return;
    
    gestureState.current.isDragging = true;
    gestureState.current.startY = e.touches[0].clientY;
    gestureState.current.popupHeight = mainPopupRef.current?.offsetHeight || 0;
    
    // Calculate proportional thresholds based on popup height
    gestureState.current.dismissThreshold = gestureState.current.popupHeight * SWIPE_DISMISS_RATIO;
    gestureState.current.fadeDistance = gestureState.current.popupHeight * SWIPE_FADE_RATIO;
    
    // Cache backdrop element for performance
    gestureState.current.backdropElement = document.querySelector('.filter-popup__backdrop');
    
    if (mainPopupRef.current) {
      mainPopupRef.current.classList.add('filter-popup--dragging');
    }
    
    // Disable backdrop transitions during dragging for smooth performance
    if (gestureState.current.backdropElement) {
      gestureState.current.backdropElement.classList.add('filter-popup__backdrop--dragging');
    }
  };

  const handleGestureMove = (e) => {
    if (!gestureState.current.isDragging || !isMobileView || activePopup !== 'main') return;
    
    gestureState.current.currentY = e.touches[0].clientY;
    const diffY = Math.max(0, gestureState.current.currentY - gestureState.current.startY);
    
    // Use requestAnimationFrame for smooth 60fps updates
    requestAnimationFrame(() => {
      // Update drag offset on popup
      if (mainPopupRef.current) {
        mainPopupRef.current.style.setProperty('--main-drag-offset', `${diffY}px`);
      }
      
      // Update backdrop opacity - fade linearly from 0 to popup height (100% off screen)
      // Calculate based on popup height with higher precision
      const progress = Math.min(diffY / gestureState.current.popupHeight, 1);
      const opacity = Math.max(0, 0.3 * (1 - progress));
      
      // Use cached backdrop element for performance
      if (gestureState.current.backdropElement) {
        gestureState.current.backdropElement.style.setProperty('--backdrop-opacity', opacity.toFixed(3));
      }
    });
  };

  const handleGestureEnd = () => {
    if (!gestureState.current.isDragging || !isMobileView || activePopup !== 'main') return;
    
    const diffY = gestureState.current.currentY - gestureState.current.startY;
    
    if (mainPopupRef.current) {
      mainPopupRef.current.classList.remove('filter-popup--dragging');
    }
    
    // Re-enable backdrop transitions
    if (gestureState.current.backdropElement) {
      gestureState.current.backdropElement.classList.remove('filter-popup__backdrop--dragging');
    }
    
    // Use proportional dismiss threshold (like ShareButton)
    if (diffY > gestureState.current.dismissThreshold) {
      setActivePopup(null);
      hideMainPopup();
    } else {
      // Reset drag state with smooth transition back (ShareButton style)
      if (mainPopupRef.current) {
        mainPopupRef.current.style.removeProperty('--main-drag-offset');
      }
      
      // Reset backdrop opacity to full (0.3) when snapping back
      if (gestureState.current.backdropElement) {
        gestureState.current.backdropElement.style.setProperty('--backdrop-opacity', '0.3');
        // Remove any inline opacity after a brief delay to let it settle
        setTimeout(() => {
          gestureState.current.backdropElement.style.removeProperty('--backdrop-opacity');
        }, 100);
      }
    }
    
    gestureState.current.isDragging = false;
    gestureState.current.currentY = 0;
    gestureState.current.backdropElement = null; // Clear cache
  };

  // Filter handling
  const handleFilterItemClick = (filterType, value, blockType) => {
    const newActiveFilters = new Map(activeFilters);

    switch (blockType) {
      case 'select':
        if (newActiveFilters.get(filterType) === value) {
          newActiveFilters.delete(filterType);
        } else {
          newActiveFilters.set(filterType, value);
        }
        break;
      case 'multiSelect':
        const current = newActiveFilters.get(filterType) || [];
        const index = current.indexOf(value);
        if (index > -1) {
          current.splice(index, 1);
        } else {
          current.push(value);
        }
        if (current.length === 0) {
          newActiveFilters.delete(filterType);
        } else {
          newActiveFilters.set(filterType, current);
        }
        break;
      case 'sort':
        setCurrentSort(value);
        newActiveFilters.set(filterType, value);
        break;
    }

    setActiveFilters(newActiveFilters);
    applyFilters(searchTerm, newActiveFilters);
    updateUrl(searchTerm, newActiveFilters);
  };

  const resetAllFilters = () => {
    // Find the default sort option from configuration
    const sortSection = mainFilterSections.find(section => section.isSort);
    const defaultSort = sortSection?.options?.find(option => option.default)?.value || 
                       sortSection?.options?.[0]?.value || 
                       'newest';
    
    setActiveFilters(new Map());
    setSearchTerm('');
    setCurrentSort(defaultSort);
    applyFilters('', new Map());
    updateUrl('', new Map());
    closeAllPopups();
  };

  // Core filtering logic
  const itemMatchesSearch = (item, term) => {
    if (!term) return true;
    const searchFields = ['searchName', 'title', 'techniques', 'category', 'tags', 'recipeNumber', 'recipeNumberRaw', 'recipeNumberVariations'];
    const searchTerm = term.toLowerCase();
    
    return searchFields.some(field => {
      const value = item.dataset[field.toLowerCase()] || '';
      return value.toLowerCase().includes(searchTerm);
    });
  };

  const itemMatchesFilter = (item, filterType, filterValue) => {
    const itemValue = item.dataset[filterType.toLowerCase()] || '';
    
    // Special handling for time-based filtering
    if (filterType === 'kokonaisaika') {
      return itemMatchesTimeFilter(item, filterValue);
    }
    
    // Special handling for first letter filtering
    if (filterType === 'firstLetter') {
      const firstLetter = item.dataset.firstLetter || '';
      return firstLetter === filterValue;
    }
    
    if (Array.isArray(filterValue)) {
      const itemValues = itemValue.split(',').map(v => v.trim().toLowerCase());
      return filterValue.some(fv => itemValues.includes(fv.toLowerCase()));
    } else {
      return itemValue.toLowerCase() === filterValue.toLowerCase();
    }
  };

  const itemMatchesTimeFilter = (item, filterValue) => {
    const timeValue = item.dataset.kokonaisaika || '';
    if (!timeValue) return false;
    
    // Convert time value to minutes for comparison
    const timeInMinutes = parseTimeToMinutes(timeValue);
    if (timeInMinutes === null) return false;
    
    const timeCategories = Array.isArray(filterValue) ? filterValue : [filterValue];
    
    return timeCategories.some(category => {
      switch (category) {
        case 'quick':
          return timeInMinutes < 30;
        case 'medium':
          return timeInMinutes >= 30 && timeInMinutes < 60;
        case 'long':
          return timeInMinutes >= 60 && timeInMinutes < 120;
        case 'extended':
          return timeInMinutes >= 120;
        default:
          return false;
      }
    });
  };

  const parseTimeToMinutes = (timeString) => {
    if (!timeString || typeof timeString !== 'string') return null;
    
    // Handle various time formats
    const timeStr = timeString.toString().toLowerCase();
    
    // Match patterns like "30 min", "1 h 30 min", "2 hours", etc.
    const hourMatch = timeStr.match(/(\d+)\s*(?:h|hour|hours|tunt)/);
    const minuteMatch = timeStr.match(/(\d+)\s*(?:min|minute|minutes)/);
    
    let totalMinutes = 0;
    
    if (hourMatch) {
      totalMinutes += parseInt(hourMatch[1]) * 60;
    }
    
    if (minuteMatch) {
      totalMinutes += parseInt(minuteMatch[1]);
    }
    
    // If no matches but we have a number, assume it's minutes
    if (totalMinutes === 0) {
      const numberMatch = timeStr.match(/(\d+)/);
      if (numberMatch) {
        totalMinutes = parseInt(numberMatch[1]);
      }
    }
    
    return totalMinutes > 0 ? totalMinutes : null;
  };

  const itemMatchesFilters = (item, term, filters) => {
    // Search filter
    if (!itemMatchesSearch(item, term)) return false;

    // Other filters
    for (const [filterType, filterValue] of filters.entries()) {
      if (filterType === 'sort') continue;
      if (!itemMatchesFilter(item, filterType, filterValue)) {
        return false;
      }
    }

    return true;
  };

  // Sorting helper functions
  const getSortValue = (item, sortType) => {
    const wrapper = item.closest('.recipe-item-wrapper, .reference-item-wrapper') || item;
    
    switch (sortType) {
      case 'newest':
        // For 'newest', use the original DOM order (return index)
        const allItems = document.querySelectorAll(filterConfig.itemSelector);
        return Array.from(allItems).indexOf(item);
      
      case 'name':
      case 'alphabetical':
        return (wrapper.dataset.title || wrapper.dataset.name || wrapper.dataset.searchName || '').toLowerCase();
      
      case 'category':
        return (wrapper.dataset.category || '').toLowerCase();
      
      case 'difficulty':
      case 'vaikeustaso':
        const difficulty = (wrapper.dataset.vaikeustaso || wrapper.dataset.difficulty || '').toLowerCase();
        // Define difficulty order
        const difficultyOrder = { 'helppo': 1, 'keskitaso': 2, 'haastava': 3, 'vaativa': 4 };
        return difficultyOrder[difficulty] || 999;
      
      case 'type':
        return (wrapper.dataset.type || '').toLowerCase();
      
      case 'dietary':
        return (wrapper.dataset.dietary || '').toLowerCase();
      
      default:
        return '';
    }
  };

  const sortItems = (visibleItems, sortType) => {
    if (!sortType || sortType === 'none') return visibleItems;
    
    return [...visibleItems].sort((a, b) => {
      const aValue = getSortValue(a, sortType);
      const bValue = getSortValue(b, sortType);
      
      // Handle numeric sorting for difficulty and newest (DOM order)
      if (sortType === 'difficulty' || sortType === 'vaikeustaso' || sortType === 'newest') {
        return aValue - bValue;
      }
      
      // Handle alphabetical sorting
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return aValue.localeCompare(bValue, 'fi', { numeric: true, sensitivity: 'base' });
      }
      
      return 0;
    });
  };

  const reorderDOMElements = (sortedItems) => {
    // Group items by their parent containers (sections)
    const containerGroups = new Map();
    
    sortedItems.forEach(item => {
      const wrapper = item.closest('.list-item-wrapper, .recipe-item-wrapper, .reference-item-wrapper') || item;
      const container = wrapper.parentNode;
      
      if (!containerGroups.has(container)) {
        containerGroups.set(container, []);
      }
      containerGroups.get(container).push(wrapper);
    });
    
    // Reorder items within each container
    containerGroups.forEach((items, container) => {
      const fragment = document.createDocumentFragment();
      items.forEach(item => fragment.appendChild(item));
      container.appendChild(fragment);
    });
  };



  const applyFilters = (term = searchTerm, filters = activeFilters) => {
    const items = document.querySelectorAll(filterConfig.itemSelector);
    const sections = document.querySelectorAll(filterConfig.sectionSelector);
    
    let visibleCount = 0;
    const visibleItems = [];

    // First pass: filter items
    items.forEach(item => {
      const isVisible = itemMatchesFilters(item, term, filters);
      const wrapper = item.closest('.list-item-wrapper, .recipe-item-wrapper, .reference-item-wrapper') || item;
      
      if (isVisible) {
        wrapper.style.display = '';
        visibleCount++;
        visibleItems.push(item);
      } else {
        wrapper.style.display = 'none';
      }
    });

    // Apply sorting to visible items
    const currentSortValue = filters.get('sort') || currentSort;
    const sortedItems = sortItems(visibleItems, currentSortValue);
    
    // Reorder DOM elements based on sorting
    if (sortedItems.length > 0) {
      reorderDOMElements(sortedItems);
    }

    // Handle section visibility
    sections.forEach(section => {
      const sectionItems = section.querySelectorAll(filterConfig.itemSelector);
      const visibleSectionItems = Array.from(sectionItems).filter(item => {
        const wrapper = item.closest('.list-item-wrapper, .recipe-item-wrapper, .reference-item-wrapper') || item;
        return wrapper.style.display !== 'none';
      });
      
      section.style.display = visibleSectionItems.length > 0 ? '' : 'none';
    });

    // Show/hide no results
    const noResults = document.getElementById(filterConfig.noResultsId);
    if (noResults) {
      noResults.style.display = visibleCount === 0 ? 'block' : 'none';
    }

    // Update filter option visibility
    updateFilterOptionVisibility(visibleItems);

    setVisibleCount(visibleCount);
    return visibleCount;
  };

  const updateFilterOptionVisibility = (visibleItems) => {
    // Get available values for each filter type from visible items
    const availableValues = {};
    
    visibleItems.forEach(item => {
      Object.keys(filterConfig.filterBlocks || {}).forEach(filterType => {
        if (filterType === 'search' || filterType === 'sort') return;
        
        const itemValue = item.dataset[filterType.toLowerCase()] || '';
        if (!itemValue) return;
        
        if (!availableValues[filterType]) {
          availableValues[filterType] = new Set();
        }
        
        // Handle comma-separated values (for multi-select attributes)
        if (itemValue.includes(',')) {
          itemValue.split(',').forEach(val => {
            const trimmed = val.trim().toLowerCase();
            if (trimmed) availableValues[filterType].add(trimmed);
          });
        } else {
          const trimmed = itemValue.trim().toLowerCase();
          if (trimmed) availableValues[filterType].add(trimmed);
        }
      });
    });

    // Update filter option visibility in both popups
    [mainPopupRef, individualPopupRef].forEach(popupRef => {
      if (!popupRef.current) return;
      
      popupRef.current.querySelectorAll('.filter-section').forEach(section => {
        const sectionId = section.dataset.sectionId;
        if (!sectionId || !availableValues[sectionId]) return;
        
        const availableSet = availableValues[sectionId];
        
        section.querySelectorAll('.filter-item').forEach(button => {
          const value = button.dataset.value;
          if (!value) return;
          
          const isAvailable = availableSet.has(value.toLowerCase());
          
          // For time-based filters, check if any visible items match the time range
          if (sectionId === 'kokonaisaika') {
            const hasMatchingTimeItems = visibleItems.some(item => 
              itemMatchesTimeFilter(item, [value])
            );
            button.style.display = hasMatchingTimeItems ? '' : 'none';
          } else {
            button.style.display = isAvailable ? '' : 'none';
          }
        });
      });
    });
  };

  // URL management
  const updateUrl = (term = searchTerm, filters = activeFilters) => {
    const params = new URLSearchParams();
    
    filters.forEach((value, key) => {
        if (Array.isArray(value)) {
          params.set(key, value.join(','));
        } else {
          params.set(key, value);
      }
    });
    
    if (term) {
      params.set('search', term);
    }
    
    const newUrl = params.toString() ? `${window.location.pathname}?${params}` : window.location.pathname;
    window.history.replaceState({}, '', newUrl);
  };

  const restoreUrlState = () => {
    const params = new URLSearchParams(window.location.search);
    const newActiveFilters = new Map();
    
    params.forEach((value, key) => {
      if (key === 'search') {
        setSearchTerm(value);
      } else if (key === 'sort') {
        setCurrentSort(value);
        newActiveFilters.set(key, value);
      } else {
        const values = value.includes(',') ? value.split(',') : value;
        newActiveFilters.set(key, values);
      }
    });
    
    setActiveFilters(newActiveFilters);
    applyFilters(searchTerm, newActiveFilters);
  };

  // Event handlers
  const handleDocumentClick = (e) => {
    // Handle backdrop clicks separately for mobile
    if (e.target.classList.contains('filter-popup__backdrop')) {
      closeAllPopups();
      return;
    }
    
    // Simple and effective: Close popups when clicking outside any filter-related element
    if (!e.target.closest('#unified-filter-bar, .filter-popup, .shared-filter-popup')) {
      closeAllPopups();
      closeSearch();
    }
  };



  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      closeAllPopups();
      closeSearch();
    }
  };

  // Body scroll lock for mobile main filter popup
  useEffect(() => {
    if (activePopup === 'main' && isMobileView) {
      // Lock body scroll
      const scrollY = window.pageYOffset || document.documentElement.scrollTop;
      document.documentElement.style.setProperty('--scroll-y', `${scrollY}px`);
      document.body.classList.add('filter-body-locked');
    } else {
      // Unlock body scroll
      document.body.classList.remove('filter-body-locked');
      const scrollY = parseInt(document.documentElement.style.getPropertyValue('--scroll-y') || '0');
      if (scrollY) {
        window.scrollTo(0, scrollY);
      }
      document.documentElement.style.removeProperty('--scroll-y');
    }
  }, [activePopup, isMobileView]);

  // Handle window resize for mobile detection
  useEffect(() => {
    const handleResize = () => {
      setIsMobileView(window.innerWidth < 1024);
    };
    
    // Initialize mobile state
    handleResize();
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Initialize default sort value
  useEffect(() => {
    if (!isInitialized) return;
    
    const sortSection = mainFilterSections.find(section => section.isSort);
    const defaultSort = sortSection?.options?.find(option => option.default)?.value || 
                       sortSection?.options?.[0]?.value || 
                       'newest';
    
    if (currentSort === 'newest' && defaultSort !== 'newest') {
      setCurrentSort(defaultSort);
    }
    
    // If no sort filter is explicitly set, set the default sort in activeFilters
    // This ensures both the visual state and actual sorting behavior are consistent
    if (!activeFilters.has('sort') && sortSection) {
      const newActiveFilters = new Map(activeFilters);
      newActiveFilters.set('sort', defaultSort);
      setActiveFilters(newActiveFilters);
      
      // Apply the default sorting immediately
      requestAnimationFrame(() => {
        applyFilters(searchTerm, newActiveFilters);
      });
    }
  }, [mainFilterSections, isInitialized]);

  // Initialize component
  useEffect(() => {
    if (isInitialized) return;

    document.addEventListener('click', handleDocumentClick);
    document.addEventListener('keydown', handleKeyDown);
    
    restoreUrlState();
    
    // Initialize all accordions as closed by default
    setOpenAccordions(new Set());
    
    setIsInitialized(true);

    return () => {
      document.removeEventListener('click', handleDocumentClick);
      document.removeEventListener('keydown', handleKeyDown);
      // Clean up body lock on unmount
      document.body.classList.remove('filter-body-locked');
      document.documentElement.style.removeProperty('--scroll-y');
    };
  }, []);

  // Render sort section (horizontal layout)
  const renderSortSection = (section) => {
    return (
      <div className="sort-section" data-section-id={section.id}>
        <div className="sort-options-container">
          {section.options && section.options.map((option) => {
            // Check if this option is active - either explicitly selected or default when none selected
            const explicitlySelected = activeFilters.get(section.id) === option.value;
            const isDefaultAndNoneSelected = option.default && !activeFilters.has(section.id);
            const isActive = explicitlySelected || isDefaultAndNoneSelected;
            
            return (
              <button 
                key={option.id}
                className={`sort-item ${isActive ? 'sort-item-active' : ''}`}
                onClick={() => handleFilterItemClick(section.id, option.value, section.type)}
                type="button"
                role="option"
                title={option.description || option.label}
              >
                {option.label}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  // Render accordion section (mobile collapsible)
  const renderAccordionSection = (section) => {
    const isOpen = openAccordions.has(section.id);
    const isLargeSection = section.id === 'tags';
    
    return (
      <div className={`accordion-section ${isLargeSection ? 'large-section' : ''}`} data-section-id={section.id}>
        <button 
          className="accordion-header"
          onClick={() => toggleAccordion(section.id)}
          aria-expanded={isOpen}
        >
          <div className="accordion-title">
            {section.icon && (
              <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={section.icon}></path>
              </svg>
            )}
            <span>{section.title}</span>
          </div>
          <svg 
            className={`accordion-chevron ${isOpen ? 'open' : ''}`}
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
          </svg>
        </button>
        
        <div className={`accordion-content ${isOpen ? 'open' : ''}`}>
          <div 
            className={`filter-options-container ${section.maxHeight ? `max-h-${section.maxHeight}` : 'max-h-64'}`}
            data-filter-type={section.type}
          >
            {section.options && (
              <div className={
                section.gridCols && (section.id === 'techniques' || section.id === 'tags') 
                  ? `grid ${section.gridCols}` 
                  : section.gridCols || ''
              }>
                {section.options.map((option) => {
                  const isActive = section.type === 'multiSelect' 
                    ? (activeFilters.get(section.id) || []).includes(option.value)
                    : activeFilters.get(section.id) === option.value;
                  
                  return (
                    <button 
                      key={option.id}
                      className={`filter-item ${section.gridCols && (section.id === 'techniques' || section.id === 'tags') ? 'grid-item' : ''} ${isActive ? 'filter-item-active' : ''}`}
                      onClick={() => handleFilterItemClick(section.id, option.value, section.type)}
                      type="button"
                      role="option"
                      title={option.description || option.label}
                    >
                      {option.label}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Render simple filter section (for individual filter popups - no accordion)
  const renderSimpleFilterSection = (section) => {
    return (
      <div className="simple-filter-section" data-section-id={section.id}>
        <div className="simple-filter-header">
          <div className="simple-filter-title">
            {section.icon && (
              <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={section.icon}></path>
              </svg>
            )}
            <span>{section.title}</span>
          </div>
        </div>
        
        <div className="simple-filter-content">
          <div 
            className={`filter-options-container ${section.maxHeight ? `max-h-${section.maxHeight}` : 'max-h-64'}`}
            data-filter-type={section.type}
          >
            {section.options && (
              <div className={
                section.gridCols && (section.id === 'techniques' || section.id === 'tags') 
                  ? `grid ${section.gridCols}` 
                  : section.gridCols || ''
              }>
                {section.options.map((option) => {
                  const isActive = section.type === 'multiSelect' 
                    ? (activeFilters.get(section.id) || []).includes(option.value)
                    : activeFilters.get(section.id) === option.value;
                  
                  return (
                    <button 
                      key={option.id}
                      className={`filter-item ${section.gridCols && (section.id === 'techniques' || section.id === 'tags') ? 'grid-item' : ''} ${isActive ? 'filter-item-active' : ''}`}
                      onClick={() => handleFilterItemClick(section.id, option.value, section.type)}
                      type="button"
                      role="option"
                      title={option.description || option.label}
                    >
                      {option.label}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Render filter section content
  const renderFilterSection = (section) => {
    // Sort sections get special horizontal treatment
    if (section.isSort) {
      return renderSortSection(section);
    }
    
    // Regular sections use accordion on mobile, regular on desktop
    return renderAccordionSection(section);
  };

  return (
    <nav 
      id="unified-filter-bar"
      ref={containerRef}
      className={`nav-container max-w-[${maxWidth}] mx-auto mb-8 sm:mb-16 lg:mb-20 ${position === 'sticky' ? `sticky ${topOffset} z-40` : ''}`}
      aria-label="Navigointi ja suodattimet"
    >
      <div className="bg-white/95 backdrop-blur-md border border-gray-200/80 rounded-xl shadow-sm">
        {/* Main Filter Row */}
        <div className="flex">
          {/* Search Toggle Button */}
          <button
            className="search-toggle-btn"
            type="button"
            onClick={toggleSearch}
            aria-expanded={isSearchOpen}
            aria-label="Avaa haku"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
            </svg>
          </button>
          
          {/* Main Content Area */}
          {alphabetLinks.length > 0 ? (
            /* Alphabet Links Container */
            <div className={`flex gap-1 flex-1 min-w-0 px-2 sm:px-3 py-2 overflow-x-auto scrollbar-subtle items-center ${isSearchOpen ? 'hidden' : ''}`}>
              {alphabetLinks.map(link => {
                const isActive = activeFilters.get('firstLetter') === link.letter;
                return (
                  <button 
                  key={link.letter}
                    onClick={() => handleFilterItemClick('firstLetter', link.letter, 'select')}
                    className={`alphabet-link ${isActive ? 'alphabet-link-active' : ''}`}
                  data-letter={link.letter}
                    aria-label={link.label || `Näytä kirjain ${link.letter}`}
                    type="button"
                >
                  {link.letter}
                  </button>
                );
              })}
            </div>
          ) : (
            /* Filter Buttons Container */
            <div className={`flex flex-1 overflow-visible ${isSearchOpen ? 'hidden' : ''}`}>
              {sortedFilterButtons.map((button, index) => {
                const badgeCount = getFilterBadgeCount(button.id);
                return (
                  <div 
                    key={button.id}
                    className={`relative flex-1 filter-button-wrapper overflow-visible ${index === 0 ? 'first-filter' : index === sortedFilterButtons.length - 1 ? 'last-filter' : 'middle-filter'}`} 
                    data-position={index === 0 ? 'first' : index === sortedFilterButtons.length - 1 ? 'last' : 'middle'}
                  >
                    <button 
                      className="filter-toggle-btn"
                      type="button"
                      onClick={() => togglePopup('individual', button.id)}
                      aria-expanded={activePopup === 'individual' && activeIndividualFilter === button.id}
                      aria-label={button.ariaLabel}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={button.icon}></path>
                      </svg>
                      <span className="max-md:hidden">{button.label}</span>
                    </button>
                    {badgeCount > 0 && (
                      <span className="filter-badge absolute -top-1 -right-1 w-5 h-5 bg-gray-900 text-white text-xs rounded-full flex items-center justify-center" aria-hidden="true">
                        {badgeCount}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Search Input Container */}
          <div className={`flex-1 relative ${isSearchOpen ? '' : 'hidden'}`}>
            <input 
              ref={searchInputRef}
              type="search" 
              placeholder={searchPlaceholder}
              value={searchTerm}
              onInput={(e) => handleSearchInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Escape' && closeSearch()}
              className="search-input" 
              autoComplete="off"
              spellCheck="false"
            />
            <svg className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
            </svg>
                      <button 
            onClick={clearSearch}
            className="search-close-btn"
            aria-label="Sulje haku"
            type="button"
          >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
          </div>
          
          {/* Main Filter Button */}
          <button 
            className={`main-filter-btn ${filterButtons.length > 0 || alphabetLinks.length > 0 ? 'with-left-content' : 'standalone'}`}
            type="button"
            onClick={() => togglePopup('main')}
            aria-expanded={activePopup === 'main'}
            aria-label={mainFilterButton.ariaLabel}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={mainFilterButton.icon}></path>
            </svg>
            {mainFilterButton.label && (
              <span className="max-md:hidden">{mainFilterButton.label}</span>
            )}
            {getTotalActiveFiltersCount() > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-gray-900 text-white text-xs rounded-full flex items-center justify-center" aria-hidden="true">
                {getTotalActiveFiltersCount()}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Individual Filter Popup */}
      {Object.keys(individualFilterSections).length > 0 && (
        <div 
          ref={individualPopupRef}
          className={`shared-filter-popup absolute left-16 right-0 mt-2 sm:mt-4 bg-white border border-gray-200 rounded-xl shadow-xl z-50 transition-all duration-300 max-h-[70vh] overflow-y-auto ${activePopup === 'individual' ? '' : 'hidden'}`}
          role="dialog" 
          aria-label="Suodattimet"
        >
          {Object.values(individualFilterSections).map(section => renderSimpleFilterSection(section))}
          
          {hasAnyActiveFilters() && (
            <button 
              onClick={resetAllFilters}
              className="individual-reset-btn"
              type="button"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                <path d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99"/>
              </svg>
              <span>Tyhjennä suodattimet</span>
            </button>
          )}
        </div>
      )}
      
      {/* Mobile Backdrop - Full Screen */}
      {isMobileView && shouldShowMainPopup && (
        <div 
          className={`filter-popup__backdrop ${isMainPopupVisible ? 'filter-popup__backdrop--visible' : ''}`}
          onClick={closeAllPopups}
        ></div>
      )}

      {/* Main Filter Popup */}
      {mainFilterSections.length > 0 && (
        <div 
          ref={mainPopupRef}
          className={`filter-popup ${isMobileView ? 'filter-popup--mobile' : ''} ${isMainPopupVisible ? 'filter-popup--visible' : ''} absolute top-full left-0 right-0 mt-2 sm:mt-4 bg-white border border-gray-200 rounded-xl shadow-xl z-20 max-h-[70vh] flex flex-col ${(isMobileView ? shouldShowMainPopup : activePopup === 'main') ? '' : 'hidden'}`}
          role="dialog" 
          aria-label="Suodattimet"
        >
          {/* Main popup content */}
          <div 
            className="filter-popup__content"
            onTouchStart={handleGestureStart}
            onTouchMove={handleGestureMove}
            onTouchEnd={handleGestureEnd}
          >
            {/* Mobile handle */}
            <div className="filter-popup__handle"></div>
            <div className="flex-1 overflow-y-auto">
              {/* Sort section at top (horizontal) */}
              {mainFilterSections.filter(section => section.isSort).map(section => renderFilterSection(section))}
              
              {/* Regular filter sections in grid (accordion on mobile) */}
              <div className="filter-sections-grid">
                {mainFilterSections.filter(section => !section.isSort).map(section => renderFilterSection(section))}
              </div>
            </div>
            
            <div className="border-t border-gray-200 px-4 sm:px-6 py-3 sm:py-4 bg-gray-50 rounded-b-xl flex-shrink-0">
              <div className="flex flex-row justify-between items-center gap-3">
                <div className="text-sm text-gray-600">
                  <span>{visibleCount}</span> {resultsCountText}
                </div>
                
                <div className="flex gap-2">
                  {hasAnyActiveFilters() && (
                    <button 
                      onClick={resetAllFilters}
                      className="reset-btn"
                      type="button"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                        <path d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99"/>
                      </svg>
                      Tyhjennä suodattimet
                    </button>
                  )}
                  
                  <button 
                    onClick={closeAllPopups}
                    className="apply-btn"
                    type="button"
                  >
                    Sulje
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        /* Body lock for mobile filter popup */
        body.filter-body-locked {
          overflow: hidden !important;
          position: fixed !important;
          top: calc(var(--scroll-y) * -1) !important;
          left: 0 !important;
          right: 0 !important;
          width: 100% !important;
        }

        /* Scrollbar styles */
        .scrollbar-subtle {
          scrollbar-width: thin;
          scrollbar-color: rgba(156, 163, 175, 0.3) transparent;
        }
        
        .scrollbar-subtle::-webkit-scrollbar {
          height: 6px;
          width: 6px;
        }
        
        .scrollbar-subtle::-webkit-scrollbar-track {
          background: transparent;
        }
        
        .scrollbar-subtle::-webkit-scrollbar-thumb {
          background-color: rgba(156, 163, 175, 0.2);
          border-radius: 3px;
        }
        
        .scrollbar-subtle::-webkit-scrollbar-thumb:hover {
          background-color: rgba(156, 163, 175, 0.4);
        }

        .scrollbar-thin {
          scrollbar-width: thin;
          scrollbar-color: rgb(209 213 219) transparent;
        }

        .scrollbar-thin::-webkit-scrollbar {
          width: 6px;
        }

        .scrollbar-thin::-webkit-scrollbar-track {
          background: transparent;
        }

        .scrollbar-thin::-webkit-scrollbar-thumb {
          background-color: rgb(209 213 219);
          border-radius: 3px;
        }

        .scrollbar-thin::-webkit-scrollbar-thumb:hover {
          background-color: rgb(156 163 175);
        }

        /* Filter bar buttons */
        .search-toggle-btn,
        .filter-toggle-btn {
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          padding: 0.75rem 1rem;
          color: rgb(75 85 99);
          transition: all 0.2s ease;
          border-right: 1px solid rgba(229, 231, 235, 0.5);
        }

        .search-toggle-btn {
          padding-left: 1rem;
          padding-right: 1.5rem;
          border-radius: 0.75rem 0 0 0.75rem;
        }

        .filter-toggle-btn {
          width: 100%;
          height: 100%;
        }

        .filter-toggle-btn:last-child {
          border-right: none;
        }

        @media (min-width: 768px) {
        .search-toggle-btn:hover,
        .filter-toggle-btn:hover {
          background-color: rgb(17 24 39);
          color: white;
          }
        }

        @media (min-width: 640px) {
          .search-toggle-btn,
          .filter-toggle-btn {
            gap: 0.75rem;
            padding: 0.75rem 1.5rem;
          }
        }

        .main-filter-btn {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.75rem 1rem;
          color: rgb(75 85 99);
          background-color: transparent;
          transition: all 0.2s ease;
          position: relative;
        }

        .main-filter-btn.with-left-content {
          border-radius: 0 0.75rem 0.75rem 0;
          border-left: 1px solid rgba(229, 231, 235, 0.5);
        }

        .main-filter-btn.standalone {
          border-radius: 0.75rem;
        }

        .main-filter-btn:hover {
          background-color: rgb(17 24 39);
          color: white;
        }

        @media (min-width: 640px) {
          .main-filter-btn {
            gap: 0.75rem;
            padding: 0.75rem 1.5rem;
          }
        }

        /* Alphabet links */
        .alphabet-link {
          width: 1.75rem;
          height: 1.75rem;
          border: none;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.75rem;
          font-weight: 500;
          border-radius: 0.5rem;
          color: rgb(75 85 99);
          text-decoration: none;
          transition: all 0.2s ease;
          flex-shrink: 0;
          background-color: transparent;
          cursor: pointer;
        }

        .alphabet-link:hover {
          background-color: rgb(17 24 39);
          color: white;
        }

        .alphabet-link.alphabet-link-active {
          background-color: rgb(17 24 39);
          color: white;
        }

        @media (min-width: 640px) {
          .alphabet-link {
            width: 2.25rem;
            height: 2.25rem;
            font-size: 0.875rem;
          }
        }

        /* Search input */
        .search-input {
          width: 100%;
          padding: 0.75rem 2.5rem 0.75rem 2.5rem;
          font-size: 0.875rem;
          border: 0;
          background-color: transparent;
          outline: none;
        }

        .search-input:focus {
          box-shadow: inset 0 0 0 2px rgb(17 24 39);
        }

        @media (min-width: 640px) {
          .search-input {
            padding: 1rem 3rem;
            font-size: 1rem;
          }
        }

        .search-close-btn {
          position: absolute;
          right: 0.5rem;
          top: 50%;
          transform: translateY(-50%);
          padding: 0.5rem;
          color: rgb(156 163 175);
          border-radius: 0.375rem;
          transition: all 0.2s ease;
        }

        .search-close-btn:hover {
          color: rgb(17 24 39);
          background-color: rgb(243 244 246);
        }

        /* Filter options container */
        .filter-options-container {
          display: flex;
          flex-direction: column;
          gap: 0.125rem;
          overflow-y: auto;
          overflow-x: hidden;
        }

        .filter-options-container::-webkit-scrollbar {
          width: 6px;
        }

        .filter-options-container::-webkit-scrollbar-track {
          background: transparent;
        }

        .filter-options-container::-webkit-scrollbar-thumb {
          background-color: rgb(209 213 219);
          border-radius: 3px;
        }

        .filter-options-container::-webkit-scrollbar-thumb:hover {
          background-color: rgb(156 163 175);
        }

        /* Filter items */
        .filter-item {
          width: 100%;
          text-align: left;
          padding: 0.5rem 0.75rem;
          font-size: 0.875rem;
          border-radius: 0.5rem;
          border: 1px solid transparent;
          transition: all 0.2s ease;
          outline: none;
          background-color: transparent;
          color: rgb(17 24 39);
        }

        .filter-item:hover {
          border-color: rgb(209 213 219);
        }

        .filter-item:focus {
          border-color: rgb(156 163 175);
        }

        .filter-item.grid-item {
          min-height: 3rem;
        }

        .filter-item.filter-item-active {
          background-color: rgb(243 244 246);
          color: rgb(17 24 39);
          border-color: rgb(209 213 219);
        }

        /* Action buttons */
        .reset-btn,
        .apply-btn {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 1rem;
          font-size: 0.875rem;
          border-radius: 0.5rem;
          transition: all 0.2s ease;
          border: none;
          cursor: pointer;
        }

        .reset-btn {
          background-color: rgb(229 231 235);
          color: rgb(55 65 81);
        }

        .reset-btn:hover {
          background-color: rgb(209 213 219);
        }

        .apply-btn {
          background-color: rgb(17 24 39);
          color: white;
        }

        .apply-btn:hover {
          background-color: rgb(55 65 81);
        }

        .individual-reset-btn {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          padding: 0.75rem 1rem;
          font-size: 0.875rem;
          color: rgb(75 85 99);
          background-color: rgb(249 250 251);
          border-top: 1px solid rgb(229 231 235);
          border-radius: 0;
          transition: all 0.2s ease;
          border-left: none;
          border-right: none;
          border-bottom: none;
          cursor: pointer;
        }

        .individual-reset-btn:hover {
          color: rgb(17 24 39);
        }

        /* Sort section (horizontal at top) */
        .sort-section {
          padding: 1rem 1.5rem;
          border-bottom: 1px solid rgb(229 231 235);
          background-color: rgb(249 250 251);
        }

        @media (max-width: 1023px) {
          .sort-section {
            padding: 2rem 1.5rem 1rem;
            border-radius: 12px;
          }
        }

        .sort-options-container {
          display: flex;
          justify-content: space-evenly;
          gap: 0.5rem;
          overflow-x: auto;
          padding: 0.25rem;
        }

        .sort-options-container::-webkit-scrollbar {
          height: 4px;
        }

        .sort-options-container::-webkit-scrollbar-track {
          background: transparent;
        }

        .sort-options-container::-webkit-scrollbar-thumb {
          background-color: rgb(209 213 219);
          border-radius: 2px;
        }

        .sort-item {
          flex-shrink: 0;
          padding: 0.5rem 1rem;
          font-size: 0.875rem;
          border-radius: 0.5rem;
          border: 1px solid rgb(229 231 235);
          background-color: white;
          color: rgb(75 85 99);
          transition: all 0.2s ease;
          cursor: pointer;
          white-space: nowrap;
        }

        .sort-item:hover {
          border-color: rgb(17 24 39);
          color: rgb(17 24 39);
        }

        .sort-item.sort-item-active {
          background-color: rgb(17 24 39);
          color: white;
          border-color: rgb(17 24 39);
        }

        /* Filter sections grid */
        .filter-sections-grid {
          display: block;
          max-height:23rem;
          overflow-y: auto;
        }

        @media (min-width: 1024px) {
          .filter-sections-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
          }
          
          .large-section {
            grid-column: span 2;
          }
        }

        @media (min-width: 1280px) {
          .filter-sections-grid {
            grid-template-columns: repeat(3, 1fr);
          }
          
          .large-section {
            grid-column: span 2;
          }
        }

        /* Base filter popup transitions */
        .filter-popup {
          opacity: 0;
          pointer-events: none;
        }

        .filter-popup--visible {
          opacity: 1;
          pointer-events: auto;
        }

        /* Mobile filter popup (similar to ShareButton) */
        .filter-popup--mobile {
          position: fixed !important;
          top: auto !important;
          bottom: 0 !important;
          left: 0 !important;
          right: 0 !important;
          margin: 0 !important;
          width: 100% !important;
          max-width: 100% !important;
          max-height: 90vh !important;
          border-radius: 1rem 1rem 0 0 !important;
          transform: translateY(100%);
          z-index: 50 !important; /* Above backdrop */
          transition: opacity 600ms cubic-bezier(.4,0,.2,1), transform 600ms cubic-bezier(.4,0,.2,1);
          display: flex !important;
          flex-direction: column !important;
        }

        .filter-popup--mobile.filter-popup--visible {
          transform: translateY(0);
        }

        .filter-popup--mobile.filter-popup--dragging {
          transition: none !important;
          transform: translateY(var(--main-drag-offset, 0px));
        }

        /* Mobile popup content structure */
        .filter-popup--mobile .filter-popup__content {
          display: flex;
          flex-direction: column;
          height: 100%;
          min-height: 0; /* Important for flex children */
        }

        .filter-popup--mobile .flex-1 {
          flex: 1;
          min-height: 0; /* Important for scrolling */
          overflow-y: auto;
          padding-bottom: 0; /* Remove any bottom padding */
        }

        .filter-popup--mobile .bg-gray-50 {
          position: sticky;
          bottom: 0;
          margin-top: auto;
          padding-top: calc(1.5rem + env(safe-area-inset-bottom, 0px)) !important;
          padding-bottom: calc(1.5rem + env(safe-area-inset-bottom, 0px)) !important;
          border-radius: 0 !important; /* Remove rounded corners on mobile */
          flex-shrink: 0; /* Prevent shrinking */
          z-index: 1; /* Ensure it stays above content */
        }

        /* Improve scrolling on mobile */
        .filter-popup--mobile .flex-1::-webkit-scrollbar {
          width: 4px;
        }

        .filter-popup--mobile .flex-1::-webkit-scrollbar-track {
          background: transparent;
        }

        .filter-popup--mobile .flex-1::-webkit-scrollbar-thumb {
          background-color: rgba(156, 163, 175, 0.3);
          border-radius: 2px;
        }

        /* Mobile filter popup handle */
        .filter-popup__handle {
          display: none;
          width: 2.5rem;
          height: 0.25rem;
          background-color: #d1d5db;
          border-radius: 9999px;
          position: absolute;
          top: 0.625rem;
          left: 50%;
          transform: translateX(-50%);
          z-index: 10;
        }

        @media (max-width: 1023px) {
          .filter-popup__handle {
            display: block;
          }
        }

        /* Mobile backdrop - Full Screen (ShareButton style) */
        .filter-popup__backdrop {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(0, 0, 0, var(--backdrop-opacity, 0.3));
          z-index: 40; /* Below popup but above everything else */
          opacity: 0;
          pointer-events: none;
          transition: opacity 600ms cubic-bezier(.4,0,.2,1), background-color 600ms cubic-bezier(.4,0,.2,1);
          will-change: background-color; /* Optimize for animations */
          backface-visibility: hidden; /* Hardware acceleration */
        }

        .filter-popup__backdrop--visible {
          opacity: 1;
          pointer-events: auto;
        }

        /* Disable transitions during dragging for smooth performance */
        .filter-popup__backdrop--dragging {
          transition: none !important;
        }

        /* Coordinated backdrop fade is now handled by JavaScript for precise timing */

        .filter-popup__content {
          position: relative;
          display: flex;
          flex-direction: column;
          height: 100%;
          background: inherit;
          border-radius: inherit;
        }

        /* Simple filter sections (for individual filter popups) */
        .simple-filter-section {
          padding: 1.5rem;
          border-bottom: 1px solid rgb(229 231 235);
        }

        .simple-filter-section:last-child {
          border-bottom: none;
        }

        .simple-filter-header {
          margin-bottom: 1rem;
        }

        .simple-filter-title {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-weight: 500;
          color: rgb(17 24 39);
        }

        .simple-filter-content {
          /* No special styles needed - content is always visible */
        }

        /* Accordion sections (mobile) */
        .accordion-section {
          border-bottom: 1px solid rgb(229 231 235);
        }

        .accordion-header {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 1rem 1.5rem;
          background-color: transparent;
          border: none;
          text-align: left;
          cursor: pointer;
          transition: background-color 0.2s ease;
        }

        .accordion-header:hover {
          background-color: rgb(249 250 251);
        }

        .accordion-title {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-weight: 500;
          color: rgb(17 24 39);
        }

        .accordion-chevron {
          width: 1.25rem;
          height: 1.25rem;
          color: rgb(107 114 128);
          transition: transform 0.2s ease;
        }

        .accordion-chevron.open {
          transform: rotate(180deg);
        }

        .accordion-content {
          max-height: 0;
          overflow: hidden;
          transition: max-height 0.3s ease;
        }

        .accordion-content.open {
          max-height: 500px;
          padding: 0 1.5rem 1rem;
        }

        /* Desktop: Remove accordion styling */
        @media (min-width: 1024px) {
          .accordion-section {
            border-bottom: none;
            border-right: 1px solid rgb(229 231 235);
            border-bottom: 1px solid rgb(229 231 235);
          }

          .accordion-section:last-child {
            border-right: none;
          }

          .accordion-header {
            padding: 1.5rem;
            cursor: default;
            pointer-events: none;
          }

          .accordion-header:hover {
            background-color: transparent;
          }

          .accordion-chevron {
            display: none;
          }

          .accordion-content {
            max-height: none;
            overflow: visible;
            padding: 0 1.5rem 1.5rem;
            transition: none;
          }
        }
      `}</style>
    </nav>
  );
} 