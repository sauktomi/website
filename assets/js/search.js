class RecipeSearchManager {
  constructor() {
    this.cache = new Map();
    this.initElements();
    this.initEventListeners();
  }

  initElements() {
    this.elements = {
      searchInput: document.querySelector('#recipe-search'),
      siteSearchInput: document.querySelector('#site-search'),
      searchOverlay: document.querySelector('.search-overlay'),
      searchToggle: document.querySelector('.search-toggle'),
      searchClose: document.querySelector('.search-close'),
      overlayResults: document.querySelector('.search-overlay .search-results')
    };

    if (this.elements.searchInput) {
      this.elements.searchResults = this.createResultsContainer();
      this.elements.searchInput.parentNode.appendChild(this.elements.searchResults);
    }
  }

  createResultsContainer() {
    return Object.assign(document.createElement('div'), {
      className: 'search-results',
      id: 'recipe-search-results',
      role: 'listbox',
      'aria-label': 'Search results'
    });
  }

  initEventListeners() {
    const setupSearch = (input, results) => {
      if (!input) return;
      
      input.setAttribute('role', 'searchbox');
      input.setAttribute('aria-expanded', 'false');
      input.setAttribute('aria-controls', results.id);
      
      const handler = this.debounce(async () => {
        const query = input.value.trim();
        if (query.length < 2) {
          this.clearResults(results);
          return;
        }
        
        await this.performSearch(query, results);
        input.setAttribute('aria-expanded', results.children.length > 0);
      }, 250);

      input.addEventListener('input', handler);
      input.addEventListener('focus', () => this.loadRecipes());
    };

    setupSearch(this.elements.searchInput, this.elements.searchResults);
    setupSearch(this.elements.siteSearchInput, this.elements.overlayResults);
    this.setupOverlaySearch();
    this.setupKeyboardNavigation();
  }

  setupOverlaySearch() {
    const { searchOverlay, searchToggle, searchClose, siteSearchInput, overlayResults } = this.elements;
    if (!searchOverlay) return;

    const toggleSearch = (show) => {
      searchOverlay.classList.toggle('active', show);
      searchToggle.setAttribute('aria-expanded', show);
      document.body.style.overflow = show ? 'hidden' : '';
      if (show) {
        this.loadRecipes();
      } else {
        this.clearResults(overlayResults);
      }
    };

    searchToggle?.addEventListener('click', () => {
      toggleSearch(true);
      setTimeout(() => siteSearchInput?.focus(), 150);
    });
    searchClose?.addEventListener('click', () => toggleSearch(false));
    searchOverlay?.addEventListener('click', e => {
      if (e.target === searchOverlay) toggleSearch(false);
    });

    window.addEventListener('keydown', e => {
      if (e.key === 'Escape' && searchOverlay.classList.contains('active')) {
        toggleSearch(false);
      }
      if (e.key === '/' && !searchOverlay.classList.contains('active')) {
        e.preventDefault();
        toggleSearch(true);
        siteSearchInput?.focus();
      }
    });
  }

  setupKeyboardNavigation() {
    window.addEventListener('keydown', e => {
      const results = this.getActiveResults();
      if (!results) return;

      const current = results.querySelector('.search-result.active');
      
      switch (e.key) {
        case 'ArrowDown':
        case 'ArrowUp':
          e.preventDefault();
          const next = e.key === 'ArrowDown'
            ? (current?.nextElementSibling || results.firstElementChild)
            : (current?.previousElementSibling || results.lastElementChild);
          
          current?.classList.remove('active');
          next?.classList.add('active');
          break;
          
        case 'Enter':
          const link = current?.querySelector('a');
          if (link) {
            e.preventDefault();
            link.click();
          }
          break;
      }
    });
  }

  async loadRecipes() {
    if (this.recipes) return;
    
    try {
      const response = await fetch('/search-index-slim.json');
      if (!response.ok) throw new Error('Failed to load recipes');
      
      this.recipes = await response.json();
      // Pre-process recipes for faster search
      this.recipes.forEach(recipe => {
        recipe.searchText = [
          recipe.title,
          ...(recipe.kategoriat || []),
          ...(recipe.ingredients || [])
        ].join(' ').toLowerCase();
      });
    } catch (error) {
      console.error('Failed to load recipes:', error);
      this.recipes = [];
    }
  }

  async performSearch(query, container) {
    const cacheKey = query.toLowerCase();
    if (this.cache.has(cacheKey)) {
      this.renderResults(this.cache.get(cacheKey), container);
      return;
    }

    if (!this.recipes) await this.loadRecipes();
    
    const terms = query.toLowerCase().split(/\s+/);
    const results = this.recipes
      .reduce((matches, recipe) => {
        const score = terms.reduce((total, term) => {
          if (!recipe.searchText.includes(term)) return total;
          return total + (
            recipe.title.toLowerCase() === term ? 10 :
            recipe.title.toLowerCase().includes(term) ? 5 :
            recipe.kategoriat?.some(cat => cat.toLowerCase().includes(term)) ? 3 : 1
          );
        }, 0);
        
        if (score > 0) matches.push({ recipe, score });
        return matches;
      }, [])
      .sort((a, b) => b.score - a.score)
      .slice(0, container === this.elements.overlayResults ? 20 : 5);

    this.cache.set(cacheKey, results);
    this.renderResults(results, container);
  }

  renderResults(results, container) {
    container.innerHTML = results.length ? results.map(({ recipe }) => `
      <div class="search-result" role="option">
        <a href="${recipe.permalink}">
          <div class="result-title">${recipe.title}</div>
          ${recipe.difficulty || recipe.total_time ? `
            <div class="result-metadata">
              ${recipe.difficulty ? `${recipe.difficulty} • ` : ''}
              ${this.getTimeCategory(recipe.total_time)}
            </div>
          ` : ''}
        </a>
      </div>
    `).join('') : '<div class="no-results">Ei hakutuloksia</div>';

    container.firstElementChild?.classList.add('active');
  }

  getTimeCategory(timeString) {
    if (!timeString) return '';
    const match = timeString.match(/(?:(\d+)H)?(?:(\d+)M)?/);
    if (!match) return '';
    
    const minutes = (parseInt(match[1] || 0) * 60) + parseInt(match[2] || 0);
    return minutes <= 30 ? 'Nopea' :
           minutes <= 60 ? 'Keskinopea' :
           minutes <= 120 ? 'Hidas' : 'Erittäin hidas';
  }

  clearResults(container) {
    container.innerHTML = '';
  }

  debounce(fn, delay) {
    let timeout;
    return (...args) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => fn(...args), delay);
    };
  }

  getActiveResults() {
    return this.elements.searchOverlay?.classList.contains('active')
      ? this.elements.overlayResults
      : this.elements.searchResults;
  }
}

class ThemeManager {
  constructor() {
    this.elements = {
      root: document.documentElement,
      toggle: document.querySelector('.theme-toggle'),
      lightIcon: document.querySelector('.theme-toggle-light'),
      darkIcon: document.querySelector('.theme-toggle-dark')
    };
    
    const theme = localStorage.getItem('theme') || 'light';
    this.setTheme(theme);
    
    this.elements.toggle?.addEventListener('click', () => 
      this.setTheme(this.elements.root.getAttribute('data-theme') === 'light' ? 'dark' : 'light')
    );
  }

  setTheme(theme) {
    this.elements.root.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
    this.elements.lightIcon?.classList.toggle('hidden', theme === 'dark');
    this.elements.darkIcon?.classList.toggle('hidden', theme === 'light');
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

function init() {
  new RecipeSearchManager();
  new ThemeManager();
}