// Optimized search implementation with caching
(() => {
    'use strict';

    const CACHE_LIFETIME_MS = 500;
    const DEBOUNCE_DELAY = 300;

    class SearchManager {
        constructor() {
            this.searchIndex = [];
            this.fuse = null;
            this.cache = new Map();
            this.isSearchPage = window.location.pathname === '/search/';
        }

        init() {
            // Only initialize search index on search page
            if (this.isSearchPage && window.searchIndex) {
                this.searchIndex = window.searchIndex;
                this.initializeFuse();
            }
            this.setupEventListeners();
        }

        initializeFuse() {
            const options = {
                shouldSort: true,
                threshold: 0.3,
                distance: 100,
                useExtendedSearch: true,
                keys: [
                    { name: "title", weight: 0.8 },
                    { name: "description", weight: 0.6 },
                    { name: "tags", weight: 0.7 },
                    { name: "category", weight: 0.5 },
                    { name: "diet", weight: 0.4 }
                ]
            };
            this.fuse = new Fuse(this.searchIndex, options);
        }

        setupEventListeners() {
            const searchInput = document.getElementById('recipe-search');
            if (!searchInput) return;

            // Handle search input based on context
            if (this.isSearchPage) {
                // On search page: perform live search
                searchInput.addEventListener('input', this.debounce(() => {
                    this.performSearch();
                }, DEBOUNCE_DELAY));

                // Set up filter handlers
                document.addEventListener('change', (e) => {
                    if (e.target.closest('.filter-option')) {
                        this.performSearch();
                    }
                });

                // Initialize with URL params if present
                const urlParams = new URLSearchParams(window.location.search);
                const searchQuery = urlParams.get('q');
                if (searchQuery) {
                    searchInput.value = decodeURIComponent(searchQuery);
                    this.performSearch();
                }
            } else {
                // On other pages: redirect to search page on Enter
                searchInput.addEventListener('keyup', (e) => {
                    if (e.key === 'Enter') {
                        const searchTerm = searchInput.value.trim();
                        if (searchTerm) {
                            window.location.href = `/search/?q=${encodeURIComponent(searchTerm)}`;
                        }
                    }
                });
            }

            // Handle dropdowns if they exist
            const dropdownButtons = document.querySelectorAll('.filter-dropdown-btn');
            if (dropdownButtons.length > 0) {
                this.setupDropdowns(dropdownButtons);
            }

            // Global Alt + / shortcut
            document.addEventListener('keydown', (e) => {
                if (e.altKey && e.key === '/') {
                    e.preventDefault();
                    if (this.isSearchPage) {
                        searchInput?.focus();
                    } else {
                        window.location.href = '/search/';
                    }
                }
            });
        }

        setupDropdowns(dropdownButtons) {
            dropdownButtons.forEach(button => {
                button.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const dropdownContent = document.getElementById(button.getAttribute('aria-controls'));
                    const isExpanded = button.getAttribute('aria-expanded') === 'true';
                    
                    button.setAttribute('aria-expanded', !isExpanded);
                    dropdownContent.hidden = isExpanded;
                });
            });

            // Close dropdowns when clicking outside
            document.addEventListener('click', (e) => {
                if (!e.target.closest('.filter-group')) {
                    dropdownButtons.forEach(button => {
                        const dropdownContent = document.getElementById(button.getAttribute('aria-controls'));
                        button.setAttribute('aria-expanded', 'false');
                        dropdownContent.hidden = true;
                    });
                }
            });
        }

        getSelectedFilters() {
            const filters = {
                difficulty: new Set(),
                diet: new Set(),
                category: new Set()
            };

            document.querySelectorAll('.filter-option input:checked').forEach(checkbox => {
                const [type] = checkbox.id.split('-');
                if (filters[type]) {
                    filters[type].add(checkbox.value);
                }
            });

            return filters;
        }

        getCacheKey(searchTerm, filters) {
            return `${searchTerm}:${JSON.stringify(filters)}`;
        }

        performSearch() {
            const searchInput = document.getElementById('recipe-search');
            if (!searchInput || !this.fuse) return;
            
            const searchTerm = searchInput.value.toLowerCase();
            const filters = this.getSelectedFilters();
            const cacheKey = this.getCacheKey(searchTerm, filters);

            // Check cache
            const cached = this.cache.get(cacheKey);
            if (cached && (Date.now() - cached.timestamp) < CACHE_LIFETIME_MS) {
                this.displayResults(cached.results);
                return;
            }

            // Perform search
            let results = searchTerm ? 
                this.fuse.search(searchTerm).map(result => result.item) : 
                this.searchIndex;

            // Apply filters
            results = results.filter(recipe => {
                return (!filters.difficulty.size || filters.difficulty.has(recipe.difficulty)) &&
                       (!filters.diet.size || recipe.diet?.some(d => filters.diet.has(d))) &&
                       (!filters.category.size || filters.category.has(recipe.category));
            });

            // Cache results
            this.cache.set(cacheKey, {
                timestamp: Date.now(),
                results: results
            });

            this.displayResults(results);
        }

        displayResults(results) {
            const container = document.getElementById('search-results');
            if (!container) return;

            if (!results.length) {
                container.innerHTML = '<p class="no-results">Ei hakutuloksia</p>';
                return;
            }

            const fragment = document.createDocumentFragment();
            results.forEach(recipe => {
                const card = document.createElement('div');
                card.className = 'picture-card';
                card.innerHTML = this.getCardHTML(recipe);
                fragment.appendChild(card);
            });

            container.innerHTML = '';
            container.appendChild(fragment);
        }

        getCardHTML(recipe) {
            return `
                <a href="${recipe.permalink}" aria-label="Näytä resepti: ${recipe.title}">
                    <div class="image-container">
                        <img src="${recipe.headimg || '/images/default-recipe.jpg'}"
                             alt="${recipe.title}"
                             loading="lazy"
                             class="recipe-image">
                    </div>
                    <div class="card-content">
                        <h2>${recipe.title}</h2>
                        ${recipe.difficulty ? `
                            <div class="recipe-meta">
                                <span class="meta-item">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20v-6M6 20V10M18 20V4"/></svg>
                                    ${recipe.difficulty}
                                </span>
                            </div>
                        ` : ''}
                    </div>
                </a>
            `;
        }

        debounce(func, wait) {
            let timeout;
            return (...args) => {
                clearTimeout(timeout);
                timeout = setTimeout(() => func.apply(this, args), wait);
            };
        }
    }

    // Initialize search when DOM is ready
    document.addEventListener('DOMContentLoaded', () => {
        const searchManager = new SearchManager();
        searchManager.init();
    });
})();
