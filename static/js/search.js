/**
 * ✨ Enchanted Recipe Search
 * Lightweight state management for Hugo static sites
 * 
 * @version 4.2.0
 */

// 🌟 State Management
class RecipeState {
    constructor() {
        this.recipes = [];
        this.activeFilters = new Map();
        this.searchQuery = '';
        this.listeners = new Set();
    }

    // Data initialization
    async initialize() {
        try {
            await this.loadRecipes();
            this.emit('stateChanged');
            return true;
        } catch (error) {
            console.error('Failed to initialize recipe state:', error);
            return false;
        }
    }

    async loadRecipes() {
        const cached = localStorage.getItem('recipe-index');
        if (cached) {
            this.recipes = JSON.parse(cached);
        } else {
            // Get base URL from meta tag or default to '/'
            const baseURL = document.querySelector('base')?.getAttribute('href') || '/';
            const searchIndexPath = new URL('search-index.json', baseURL).pathname;
            
            const response = await fetch(searchIndexPath);
            if (!response.ok) throw new Error('Failed to fetch recipe index');
            this.recipes = await response.json();
            localStorage.setItem('recipe-index', JSON.stringify(this.recipes));
        }

        this.recipes.forEach(recipe => {
            this.prepareRecipe(recipe);
        });
    }

    prepareRecipe(recipe) {
        // Normalize the existing searchText from search-index.json
        const existingSearchText = recipe.searchText || '';
        
        // Add additional searchable content while preserving dietary info
        recipe.searchText = `${existingSearchText} ${recipe.title} ${(recipe.categories || []).join(' ')} ${(recipe.tags || []).join(' ')} ${(recipe.dietary || []).join(' ')}`
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '');

        // Calculate time category
        if (recipe.total_time) {
            const hours = recipe.total_time.includes('H') ? 
                parseInt(recipe.total_time.match(/(\d+)H/)?.[1] || '0') : 0;
            const minutes = recipe.total_time.includes('M') ? 
                parseInt(recipe.total_time.match(/(\d+)M/)?.[1] || '0') : 0;
            const totalMinutes = hours * 60 + minutes;
            
            recipe.timeCategory = 
                totalMinutes <= 30 ? 'Nopea' :
                totalMinutes <= 60 ? 'Keskinopea' :
                totalMinutes <= 120 ? 'Hidas' : 'Erittäin hidas';
        }
    }

    // State updates
    setSearchQuery(query) {
        this.searchQuery = query.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        this.emit('stateChanged');
    }

    toggleFilter(type, value, checked) {
        const key = `${type}:${value}`;
        if (checked) {
            this.activeFilters.set(key, { type, value });
        } else {
            this.activeFilters.delete(key);
        }
        this.emit('stateChanged');
    }

    // State queries
    getFilteredRecipes() {
        const searchTerms = this.searchQuery.split(/\s+/).filter(Boolean);
        
        return this.recipes.filter(recipe => {
            // Apply search
            if (searchTerms.length > 0 && !this.matchesSearch(recipe, searchTerms)) {
                return false;
            }

            // Apply filters
            return this.matchesFilters(recipe);
        });
    }

    getFilterCounts() {
        const searchTerms = this.searchQuery.split(/\s+/).filter(Boolean);
        const counts = new Map();

        document.querySelectorAll('.filter-option input').forEach(checkbox => {
            const type = checkbox.getAttribute('data-filter-type');
            const value = checkbox.value;
            const key = `${type}:${value}`;

            // Count matches for this filter
            const count = this.recipes.filter(recipe => {
                // Apply current search
                if (searchTerms.length > 0 && !this.matchesSearch(recipe, searchTerms)) {
                    return false;
                }

                // Apply other active filters
                const otherFilters = Array.from(this.activeFilters.entries())
                    .filter(([k]) => k !== key);
                if (!this.matchesFilterList(recipe, otherFilters)) {
                    return false;
                }

                // Check if recipe matches this filter
                return this.matchesFilter(recipe, type, value);
            }).length;

            counts.set(key, count);
        });

        return counts;
    }

    matchesSearch(recipe, searchTerms) {
        return searchTerms.every(term => recipe.searchText.includes(term));
    }

    matchesFilters(recipe) {
        return this.matchesFilterList(recipe, this.activeFilters.entries());
    }

    matchesFilterList(recipe, filters) {
        return Array.from(filters).every(([, filter]) => this.matchesFilter(recipe, filter.type, filter.value));
    }

    matchesFilter(recipe, type, value) {
        if (type === 'difficulty') {
            return recipe.difficulty === value;
        }
        if (type === 'timeCategory') {
            return recipe.timeCategory === value;
        }
        const recipeValues = recipe[type] || [];
        return recipeValues.includes(value);
    }

    // Event handling
    subscribe(listener) {
        this.listeners.add(listener);
        return () => this.listeners.delete(listener);
    }

    emit(event) {
        this.listeners.forEach(listener => listener(event));
    }
}

// 🎨 UI Manager
class RecipeUI {
    constructor(state) {
        this.state = state;
        this.elements = {
            search: document.querySelector('#recipe-search'),
            results: document.querySelector('#search-results')
        };

        if (!this.elements.search || !this.elements.results) return;

        this.setupEventListeners();
        this.setupDropdowns();
    }

    setupEventListeners() {
        // Search input
        this.elements.search.addEventListener('input', 
            this.debounce(() => {
                this.state.setSearchQuery(this.elements.search.value);
            }, 150)
        );

        // Filter changes
        document.addEventListener('change', e => {
            if (e.target.matches('.filter-option input')) {
                this.state.toggleFilter(
                    e.target.getAttribute('data-filter-type'),
                    e.target.value,
                    e.target.checked
                );
            }
        });

        // State changes
        this.state.subscribe(() => {
            this.updateUI();
            this.updateURL();
        });
    }

    setupDropdowns() {
        document.querySelectorAll('.filter-dropdown-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggleDropdown(button);
            });
        });

        document.addEventListener('click', () => this.closeAllDropdowns());
    }

    updateUI() {
        this.renderResults();
        this.updateFilterVisibility();
        this.updateFilterCounts();
    }

    updateFilterCounts() {
        const counts = this.state.getFilterCounts();
        
        document.querySelectorAll('.filter-option').forEach(option => {
            const checkbox = option.querySelector('input');
            const label = option.querySelector('label');
            if (!checkbox || !label) return;

            const key = `${checkbox.getAttribute('data-filter-type')}:${checkbox.value}`;
            const count = counts.get(key) || 0;
            
            // Update label text to include count
            const baseText = label.textContent.split(' (')[0]; // Remove any existing count
            label.textContent = `${baseText} (${count})`;
        });
    }

    renderResults() {
        const recipes = this.state.getFilteredRecipes();
        const fragment = document.createDocumentFragment();

        if (recipes.length === 0) {
            const message = document.createElement('div');
            message.className = 'no-results';
            message.innerHTML = '<p>No recipes found</p><p>Try different search terms or filters</p>';
            fragment.appendChild(message);
        } else {
            recipes.forEach(recipe => {
                fragment.appendChild(this.createRecipeCard(recipe));
            });
        }

        this.elements.results.innerHTML = '';
        this.elements.results.appendChild(fragment);
    }

    updateFilterVisibility() {
        const counts = this.state.getFilterCounts();
        
        document.querySelectorAll('.filter-option').forEach(option => {
            const checkbox = option.querySelector('input');
            if (!checkbox) return;

            const key = `${checkbox.getAttribute('data-filter-type')}:${checkbox.value}`;
            const count = counts.get(key) || 0;
            
            option.style.display = count > 0 || checkbox.checked ? '' : 'none';
        });
    }

    createRecipeCard(recipe) {
        const card = document.createElement('div');
        card.className = 'picture-card';
        
        const timeDisplay = this.formatTimeDisplay(recipe.total_time);
        
        // Get base URL from meta tag or default to '/'
        const baseURL = document.querySelector('base')?.getAttribute('href') || '/';
        const defaultImage = new URL('images/default-recipe.jpg', baseURL).pathname;
        
        card.innerHTML = `
            <a href="${recipe.permalink}" aria-label="Näytä resepti: ${recipe.title}">
                <div class="image-container">
                    <img src="${recipe.featured_image || defaultImage}" 
                         alt="${recipe.title}" 
                         loading="lazy"
                         class="recipe-image">
                </div>
                <div class="card-content">
                    <h2>${recipe.title}</h2>
                    <div class="recipe-meta">
                        ${timeDisplay ? `
                            <div class="meta-item" title="Kokonaisaika">
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <circle cx="12" cy="12" r="10"></circle>
                                <polyline points="12 6 12 12 16 14"></polyline>
                                </svg>
                                <span>${timeDisplay}</span>
                            </div>` : ''}
                        ${recipe.recipeCategory ? `
                            <span class="meta-item">
                                ${recipe.recipeCategory}
                            </span>` : ''}
                    </div>
                </div>
            </a>`;
        
        return card;
    }

    toggleDropdown(button) {
        const dropdownId = button.getAttribute('aria-controls');
        const content = document.getElementById(dropdownId);
        if (!content) return;

        const isExpanded = button.getAttribute('aria-expanded') === 'true';

        // Close other dropdowns
        document.querySelectorAll('.filter-dropdown-btn').forEach(otherButton => {
            if (otherButton !== button) {
                const otherId = otherButton.getAttribute('aria-controls');
                const otherContent = document.getElementById(otherId);
                if (otherContent) {
                    otherButton.setAttribute('aria-expanded', 'false');
                    otherContent.hidden = true;
                    const arrow = otherButton.querySelector('.dropdown-arrow');
                    if (arrow) arrow.textContent = '▼';
                }
            }
        });

        // Toggle current dropdown
        button.setAttribute('aria-expanded', !isExpanded);
        content.hidden = isExpanded;
        
        // Update arrow indicator
        const arrow = button.querySelector('.dropdown-arrow');
        if (arrow) {
            arrow.textContent = isExpanded ? '▼' : '▲';
        }
    }

    closeAllDropdowns() {
        document.querySelectorAll('.filter-dropdown-btn').forEach(button => {
            const dropdownId = button.getAttribute('aria-controls');
            const content = document.getElementById(dropdownId);
            if (content) {
                button.setAttribute('aria-expanded', 'false');
                content.hidden = true;
                const arrow = button.querySelector('.dropdown-arrow');
                if (arrow) arrow.textContent = '▼';
            }
        });
    }

    formatTimeDisplay(totalTime) {
        if (!totalTime) return '';

        const hours = totalTime.includes('H') ? 
            parseInt(totalTime.match(/(\d+)H/)?.[1] || '0') : 0;
        const minutes = totalTime.includes('M') ? 
            parseInt(totalTime.match(/(\d+)M/)?.[1] || '0') : 0;
        
        return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
    }

    updateURL() {
        const url = new URL(window.location);
        if (this.state.searchQuery) {
            url.searchParams.set('q', this.state.searchQuery);
        } else {
            url.searchParams.delete('q');
        }
        history.replaceState({}, '', url);
    }

    debounce(fn, wait) {
        let timeout;
        return (...args) => {
            clearTimeout(timeout);
            timeout = setTimeout(() => fn.apply(this, args), wait);
        };
    }
}

// 🚀 Initialize Application
document.addEventListener('DOMContentLoaded', async () => {
    const state = new RecipeState();
    const ui = new RecipeUI(state);
    
    await state.initialize();

    // Initialize from URL if needed
    const params = new URLSearchParams(window.location.search);
    const query = params.get('q');
    if (query) {
        document.querySelector('#recipe-search').value = query;
        state.setSearchQuery(query);
    }
});
