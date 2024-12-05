/**
 * ✨ Enchanted Recipe Search System
 * 
 * A sophisticated search implementation that combines elegant portal navigation
 * with powerful search capabilities. This system implements advanced search
 * algorithms with real-time results updating and intelligent caching.
 * 
 * Core Enchantments:
 * - Intelligent search index management
 * - Real-time results updating
 * - Memory-efficient caching system
 * - Portal-based navigation
 * - Advanced DOM manipulation optimization
 * 
 * @version 2.2.0
 * @license MIT
 */
(() => {
    'use strict';

    /**
     * 🌟 Magical Configuration Registry
     * Carefully tuned parameters for optimal search performance
     */
    const ENCHANTMENTS = {
        SEARCH: {
            MIN_LENGTH: 2,              // Minimum query length
            DEBOUNCE_MS: 220,           // Human typing pattern optimization
            MAX_RESULTS: 24,            // Viewport-optimized result limit
            PATH: '/search/',           // Portal destination path
            CACHE_DURATION: 2000        // Memory charm duration
        },
        SELECTORS: {
            INPUT: '#recipe-search',    // Search input enchantment point
            RESULTS: '#search-results', // Results manifestation point
            PARAM: 'q'                  // Portal parameter identifier
        }
    };

    /**
     * 📚 Magical Search Index
     * Manages the sacred knowledge of recipes
     */
    class SearchIndex {
        constructor() {
            this.index = null;
            this.isLoading = false;
        }

        /**
         * 📖 Summons the search index from the ethereal plane
         */
        async summonIndex() {
            if (this.index) return this.index;
            if (this.isLoading) return null;

            try {
                this.isLoading = true;
                const response = await fetch('/search-index.json', {
                    method: 'GET',
                    cache: 'force-cache'
                });
                
                if (!response.ok) throw new Error('Index summoning failed');
                
                const rawIndex = await response.json();
                this.index = this.enchantIndex(rawIndex);
                return this.index;
            } catch (error) {
                console.error('🌋 Index summoning failed:', error);
                return null;
            } finally {
                this.isLoading = false;
            }
        }

        /**
         * 🔮 Enchants the raw index with magical properties
         */
        enchantIndex(rawIndex) {
            return rawIndex.map(recipe => ({
                ...recipe,
                searchText: this.createSearchText(recipe)
            }));
        }

        /**
         * ✨ Creates magical search text for enhanced matching
         */
        createSearchText(recipe) {
            const fields = [
                recipe.title,
                (recipe.ingredients || []).join(' '),
                (recipe.categories || []).join(' '),
                (recipe.tags || []).join(' ')
            ];

            return fields
                .filter(Boolean)
                .join(' ')
                .toLowerCase()
                .normalize('NFD')
                .replace(/[\u0300-\u036f]/g, '');
        }
    }

    /**
     * 🎭 Recipe Search Portal
     * Manages the mystical search experience
     */
    class RecipeSearch {
        constructor() {
            // Core components initialization
            this.index = new SearchIndex();
            this.cache = new Map();
            this.elements = {};
            
            // State management
            this.isSearchPage = window.location.pathname === ENCHANTMENTS.SEARCH.PATH;
            
            // Begin the enchantment
            this.initialize();
        }

        /**
         * 🌠 Initializes the search portal
         */
        async initialize() {
            // Await DOM readiness
            if (document.readyState !== 'loading') {
                await this.bindElements();
            } else {
                document.addEventListener('DOMContentLoaded', () => this.bindElements());
            }
        }

        /**
         * 🔗 Binds magical elements and event handlers
         */
        async bindElements() {
            // Capture mystical elements
            this.elements = {
                search: document.querySelector(ENCHANTMENTS.SELECTORS.INPUT),
                results: document.querySelector(ENCHANTMENTS.SELECTORS.RESULTS)
            };

            if (!this.elements.search) return;

            // Enchant the search input
            this.elements.search.setAttribute('role', 'searchbox');
            this.elements.search.setAttribute('aria-label', 'Etsi reseptejä');

            // Bind magical events
            this.elements.search.addEventListener('keydown', (e) => this.handleKeyboardMagic(e));
            this.elements.search.addEventListener('input', (e) => this.handleInputMagic(e));

            // Initialize portal state
            if (this.isSearchPage) {
                await this.initializeFromPortal();
            }

            // Add keyboard shortcut enchantment
            document.addEventListener('keydown', (e) => {
                if (e.altKey && e.key === '/') {
                    e.preventDefault();
                    this.elements.search.focus();
                }
            });
        }

        /**
         * 🎪 Initializes search from portal parameters
         */
        async initializeFromPortal() {
            const params = new URLSearchParams(window.location.search);
            const query = params.get(ENCHANTMENTS.SELECTORS.PARAM);

            if (query && this.elements.search) {
                this.elements.search.value = decodeURIComponent(query);
                await this.performSearch(query);
            }
        }

        /**
         * ⌨️ Handles keyboard interaction magic
         */
        handleKeyboardMagic(event) {
            if (event.key === 'Enter') {
                const query = this.elements.search.value.trim();
                if (query.length >= ENCHANTMENTS.SEARCH.MIN_LENGTH) {
                    if (!this.isSearchPage) {
                        this.activatePortal(query);
                    } else {
                        this.performSearch(query);
                    }
                }
            }
        }

        /**
         * 📝 Handles input magic with debouncing
         */
        handleInputMagic(event) {
            if (!this.isSearchPage) return;

            clearTimeout(this.debounceTimer);
            this.debounceTimer = setTimeout(() => {
                const query = event.target.value.trim();
                this.performSearch(query);
                this.updateSearchParams(query);
            }, ENCHANTMENTS.SEARCH.DEBOUNCE_MS);
        }

        /**
         * 🔍 Performs the magical search
         */
        async performSearch(query) {
            if (!this.elements.results) return;

            // Summon the index if needed
            const index = await this.index.summonIndex();
            if (!index) {
                this.showError('Hakuindeksin lataus epäonnistui');
                return;
            }

            // Perform the search magic
            let results = index;
            if (query && query.length >= ENCHANTMENTS.SEARCH.MIN_LENGTH) {
                const normalizedQuery = query.toLowerCase()
                    .normalize('NFD')
                    .replace(/[\u0300-\u036f]/g, '');
                
                results = index.filter(recipe => 
                    recipe.searchText.includes(normalizedQuery)
                );
            }

            // Manifest the results
            this.renderResults(results.slice(0, ENCHANTMENTS.SEARCH.MAX_RESULTS));
        }

        /**
         * 🎨 Renders search results with DOM optimization
         */
        renderResults(results) {
            if (!this.elements.results) return;

            const fragment = document.createDocumentFragment();
            
            if (results.length === 0) {
                const noResults = document.createElement('div');
                noResults.className = 'no-results';
                noResults.innerHTML = `
                    <p>Ei hakutuloksia</p>
                    <p>Kokeile eri hakusanoja</p>
                `;
                fragment.appendChild(noResults);
            } else {
                results.forEach(recipe => {
                    const card = this.createRecipeCard(recipe);
                    fragment.appendChild(card);
                });
            }

            // Single DOM update for performance
            this.elements.results.innerHTML = '';
            this.elements.results.appendChild(fragment);
        }

        /**
         * 🎴 Creates an enchanted recipe card
         */
        createRecipeCard(recipe) {
            const card = document.createElement('div');
            card.className = 'picture-card';
            card.innerHTML = `
                <a href="${recipe.permalink}" class="card-link">
                    <div class="image-container">
                        <img src="${recipe.featured_image || '/images/default-recipe.jpg'}"
                             alt="${recipe.title}"
                             loading="lazy">
                    </div>
                    <div class="card-content">
                        <h2>${recipe.title}</h2>
                        ${recipe.recipeCategory ? 
                            `<div class="recipe-meta">
                                <span class="meta-item">${recipe.recipeCategory}</span>
                             </div>` : 
                            ''}
                    </div>
                </a>
            `;
            return card;
        }

        /**
         * 🌌 Activates the search portal
         */
        activatePortal(query) {
            const portalURL = new URL(ENCHANTMENTS.SEARCH.PATH, window.location.origin);
            portalURL.searchParams.set(ENCHANTMENTS.SELECTORS.PARAM, query);
            window.location.href = portalURL.toString();
        }

        /**
         * 🔄 Updates search parameters without page reload
         */
        updateSearchParams(query) {
            const url = new URL(window.location);
            if (query) {
                url.searchParams.set(ENCHANTMENTS.SELECTORS.PARAM, query);
            } else {
                url.searchParams.delete(ENCHANTMENTS.SELECTORS.PARAM);
            }
            window.history.replaceState({}, '', url);
        }

        /**
         * ⚠️ Shows error message with grace
         */
        showError(message) {
            if (!this.elements.results) return;
            
            this.elements.results.innerHTML = `
                <div class="search-error" role="alert">
                    <p>${message}</p>
                </div>
            `;
        }
    }

    // ✨ Initialize the magical search system
    window.recipeSearch = new RecipeSearch();
})();