/**
 * ✨ Enchanted Search Redirection System
 * 
 * An elegant implementation focused on:
 * - Zero dependencies
 * - Minimal DOM manipulation
 * - Clean event handling
 * - Performance optimization
 * 
 * Core Design Principles:
 * - Graceful degradation
 * - Intuitive UX patterns
 * - Semantic behavior
 * - Memory efficiency
 * 
 * @version 1.0.0
 * @license MIT
 */
(() => {
    'use strict';

    /**
     * 🎭 Core Search Elements Registry
     */
    const elements = {
        searchForm: null,
        searchInput: null
    };

    /**
     * 🌟 Initialize Search Enhancement System
     * Sets up event listeners and prepares DOM elements
     */
    function initializeSearchRedirect() {
        // Create virtual form for semantic submission
        elements.searchForm = document.createElement('form');
        elements.searchForm.setAttribute('role', 'search');
        elements.searchForm.setAttribute('action', '/search/');
        elements.searchForm.setAttribute('method', 'get');

        // Locate existing search input
        elements.searchInput = document.querySelector('#recipe-search');
        if (!elements.searchInput) return;

        // Wrap input in form while preserving DOM structure
        elements.searchInput.parentNode.insertBefore(
            elements.searchForm, 
            elements.searchInput
        );
        elements.searchForm.appendChild(elements.searchInput);

        // Preserve original input attributes
        elements.searchInput.setAttribute('name', 'q');

        // Bind submission handler
        elements.searchForm.addEventListener('submit', handleSearchSubmit);
    }

    /**
     * 🎨 Search Submission Handler
     * Manages form submission with grace
     * @param {Event} event - Form submission event
     */
    function handleSearchSubmit(event) {
        event.preventDefault();
        
        const query = elements.searchInput.value.trim();
        if (!query) return;

        // Construct search URL with encoded parameters
        const searchURL = `/search/?q=${encodeURIComponent(query)}`;
        
        // Navigate to search results
        window.location.href = searchURL;
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeSearchRedirect);
    } else {
        initializeSearchRedirect();
    }
})();