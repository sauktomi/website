class RecipeSearchManager {
  constructor() {
    this.cache = new Map();
    this.selectors = {
      searchOverlay: '.search-overlay',
      siteSearchInput: '#site-search',
      searchResults: '.search-results',
      searchToggle: '.search-toggle',
      searchClose: '.search-close'
    };
    this.recipes = [];
    this.elements = {};
    this.initElements();
    this.initEventListeners();
    this.loadRecipes(); // Preload search index on page load
  }

  initElements() {
    Object.entries(this.selectors).forEach(([key, selector]) => {
      this.elements[key] = document.querySelector(selector);
    });

    const { siteSearchInput, searchResults, searchToggle, searchClose } = this.elements;

    if (siteSearchInput && searchResults) {
      siteSearchInput.setAttribute('role', 'searchbox');
      siteSearchInput.setAttribute('aria-controls', 'search-results');
      siteSearchInput.setAttribute('aria-expanded', 'false');
      searchResults.setAttribute('role', 'listbox');
      searchResults.id = 'search-results';
    }

    searchToggle?.setAttribute('aria-label', 'Open search');
    searchClose?.setAttribute('aria-label', 'Close search');
  }

  initEventListeners() {
    const { siteSearchInput, searchOverlay, searchToggle, searchClose } = this.elements;

    if (siteSearchInput) {
      const handler = this.debounce(async () => {
        const query = siteSearchInput.value.trim();
        if (query.length < 2) {
          this.clearResults();
          return;
        }
        await this.performSearch(query);
      }, 250);

      siteSearchInput.addEventListener('input', handler);
      siteSearchInput.addEventListener('focus', () => {
        if (searchOverlay) {
          searchOverlay.classList.add('active');
          document.body.style.overflow = 'hidden';
        }
      });
    }

    // Mobile toggle
    const toggleSearch = (show) => {
      const { searchOverlay, siteSearchInput } = this.elements;
      if (!searchOverlay) return;
    
      if (show) {
        searchOverlay.classList.add('active');
        document.body.style.overflow = 'hidden';
        this.lastActiveElement = document.activeElement;
        setTimeout(() => siteSearchInput?.focus(), 150);
      } else {
        searchOverlay.classList.remove('active');
        document.body.style.overflow = '';
        this.clearResults();
        siteSearchInput && (siteSearchInput.value = '');
        this.lastActiveElement?.focus();
      }
    };

    searchToggle?.addEventListener('click', () => toggleSearch(true));
    searchClose?.addEventListener('click', () => toggleSearch(false));

    // Click outside to close
    document.addEventListener('mousedown', e => {
      const { searchOverlay, searchClose } = this.elements;
      if (searchOverlay?.classList.contains('active') && 
          !e.target.closest('#site-search') && 
          !e.target.closest('.search-toggle') &&
          !e.target.closest('.search-results')) {
        searchClose?.click();
      }
    });

    this.setupKeyboardNavigation();
  }

  setupKeyboardNavigation() {
    const { searchResults, searchClose, searchToggle } = this.elements;

    window.addEventListener('keydown', e => {
      if (!searchResults) return;

      const current = searchResults.querySelector('.search-result.active');
      
      switch (e.key) {
        case 'ArrowDown':
        case 'ArrowUp':
          e.preventDefault();
          const next = e.key === 'ArrowDown'
            ? (current?.nextElementSibling || searchResults.firstElementChild)
            : (current?.previousElementSibling || searchResults.lastElementChild);
          
          current?.classList.remove('active');
          next?.classList.add('active');
          break;
          
        case 'Enter':
          current?.querySelector('a')?.click();
          break;

        case 'Escape':
          window.innerWidth <= 768 && searchClose?.click();
          break;
          
        case '/':
          if (window.innerWidth <= 768 && !searchResults.children.length) {
            e.preventDefault();
            searchToggle?.click();
          }
          break;
      }
    });
  }

  async loadRecipes() {
    try {
      const response = await fetch('/search-index-slim.json');
      if (!response.ok) throw new Error('Failed to load recipes');
      
      this.recipes = await response.json();
      this.recipes = this.recipes.map(recipe => ({
        ...recipe,
        searchText: [
          recipe.title,
          ...(recipe.kategoriat || []),
          ...(recipe.ingredients || [])
        ].join(' ').toLowerCase()
      }));
    } catch (error) {
      console.error('Failed to load recipes:', error);
    }
  }

  async performSearch(query) {
    const cacheKey = query.toLowerCase();
    if (this.cache.has(cacheKey)) {
      this.renderResults(this.cache.get(cacheKey));
      return;
    }

    const terms = query.toLowerCase().split(/\s+/);
    const results = this.recipes
      .map(recipe => ({
        recipe,
        score: terms.reduce((total, term) => 
          total + (recipe.searchText.includes(term) ? 
            (recipe.title.toLowerCase().includes(term) ? 2 : 1) : 0), 0)
      }))
      .filter(({ score }) => score > 0) 
      .sort((a, b) => b.score - a.score)
      .slice(0, 20);

    this.cache.set(cacheKey, results);
    this.renderResults(results);
  }

  renderResults(results) {
    const { searchResults, siteSearchInput } = this.elements;
    if (!searchResults) return;
    
    const fragment = new DocumentFragment();
    results.forEach(({ recipe }) => {
      const resultEl = document.createElement('div');
      resultEl.className = 'search-result';
      resultEl.setAttribute('role', 'option');
      resultEl.innerHTML = `
        <a href="${recipe.permalink}">
          <div class="result-title">${recipe.title}</div>
          ${recipe.difficulty || recipe.total_time ? `
            <div class="result-metadata">
              ${recipe.difficulty ? `${recipe.difficulty} • ` : ''}
              ${this.getTimeCategory(recipe.total_time)}
            </div>
          ` : ''}
        </a>
      `;
      fragment.appendChild(resultEl);
    });
    
    searchResults.innerHTML = results.length ? '' : '<div class="no-results">Ei hakutuloksia</div>';
    searchResults.appendChild(fragment);
    searchResults.firstElementChild?.classList.add('active');
    siteSearchInput?.setAttribute('aria-expanded', results.length > 0);
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

  clearResults() {
    const { searchResults, siteSearchInput } = this.elements;

    searchResults && (searchResults.innerHTML = '');
    siteSearchInput?.setAttribute('aria-expanded', 'false');
  }

  debounce(fn, delay) {
    let timeout;
    return (...args) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => fn(...args), delay);
    };
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => new RecipeSearchManager());
} else {
  new RecipeSearchManager();
}