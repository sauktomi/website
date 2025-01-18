class ServingsControl {
  static UNIT_MAPPINGS = {
    yield: { g: 1, kg: 1000, ml: 1, l: 1000, dl: 100 },
    servings: { annosta: 1, kpl: 1 }
  };

  static CONVERSIONS = {
    tl: 5,
    rkl: 15,  
    ml: 1,
    l: 1000,
    g: 1,
    kg: 1000
  };

  #cleanupFunctions = [];
  #elements = {};
  #ingredientAmounts = new Map();

  constructor() {
    try {
      this.#initElements();
      if (!this.#elements.customInput) {
        console.warn('ServingsControl: Required elements not found');
        return;
      }

      this.state = this.#initializeState();
      this.#setupEventListeners();
      this.#setupScalingUI();
      this.#cacheIngredientAmounts();
    } catch (error) {
      console.error('ServingsControl initialization error:', error);
    }
  }

  cleanup() {
    this.#cleanupFunctions.forEach(cleanup => cleanup());
    this.#cleanupFunctions = [];
  }

  #initElements() {
    const sel = {
      customInput: '.custom-amount-input',
      unitSelect: '.unit-select', 
      scalingControl: '.scaling-control',
      ingredientsContainer: '.ingredients-list'
    };

    this.#elements = Object.fromEntries(
      Object.entries(sel).map(([k, s]) => [k, document.querySelector(s)])  
    );
  }

  #initializeState() {
    const { unitSelect, customInput } = this.#elements;
    const selectedOption = unitSelect?.selectedOptions[0];
    
    const yield = this.#parseYield();
    const servings = this.#parseServings();
    const mode = selectedOption?.value ?? customInput.dataset.type ?? 'servings';
    const unit = selectedOption?.dataset.unit ?? customInput.dataset.unit ?? 'annosta';
    
    return { yield, servings, mode, unit };
  }

  #parseYield() {
    const { customInput } = this.#elements;
    if (!customInput.hasAttribute('data-original-yield')) return null;
    
    return {
      value: parseFloat(customInput.dataset.originalYield),
      unit: customInput.dataset.restOfYield
    };
  }

  #parseServings() {
    const { customInput } = this.#elements;
    return {
      value: parseFloat(customInput.dataset.originalServings || customInput.dataset.originalValue),
      unit: 'annosta'
    };
  }

  #setupEventListeners() {
    const { unitSelect, customInput } = this.#elements;
    
    const inputHandler = this.#debounce(async () => {
      const value = parseFloat(customInput.value);
      if (!isNaN(value) && value > 0.1 && value <= 9999) {
        this.#updateIngredients(value / this.#getBaseValue());
      }
    }, 250);
    customInput.addEventListener('input', inputHandler);
    this.#cleanupFunctions.push(() => 
      customInput.removeEventListener('input', inputHandler)
    );

    if (unitSelect) {
      const unitChangeHandler = this.#debounce(() => {
        const option = unitSelect.selectedOptions[0];
        if (!option) return;

        const newMode = option.value;
        const newUnit = option.dataset.unit;
        const currentValue = parseFloat(customInput.value);

        if (!isNaN(currentValue)) {
          const conversionFactor = this.#calculateConversionFactor(newMode, newUnit);
          const newValue = currentValue * conversionFactor;
          
          this.state.mode = newMode;
          this.state.unit = newUnit;
          
          customInput.value = this.#roundToDecimal(newValue);
          customInput.dataset.type = newMode;
          customInput.dataset.unit = newUnit;
          
          this.#updateIngredients(newValue / this.#getBaseValue());
        }
      }, 250);
      unitSelect.addEventListener('change', unitChangeHandler);
      this.#cleanupFunctions.push(() => 
        unitSelect.removeEventListener('change', unitChangeHandler)
      );
    }

    const form = customInput.closest('form');
    if (form) {
      const submitHandler = e => e.preventDefault();
      form.addEventListener('submit', submitHandler);
      this.#cleanupFunctions.push(() => 
        form.removeEventListener('submit', submitHandler)
      );
    }
  }

  #setupScalingUI() {
    const { scalingControl, customInput } = this.#elements;
    if (!scalingControl) return;

    try {
      const params = JSON.parse(scalingControl.dataset.params || '{}');
      const scalingFactors = params.scaling_factors || [0.5, 1, 2];
      
      const container = customInput.closest('.scaling-container');
      if (!container) return;

      const buttonsHTML = scalingFactors.map(factor => 
        `<button class="scaling-factor" data-factor="${factor}">${factor}×</button>`
      ).join('');

      const factorsDiv = document.createElement('div');
      factorsDiv.className = 'scaling-factors';
      factorsDiv.innerHTML = buttonsHTML;
      container.appendChild(factorsDiv);

      const clickHandler = this.#debounce((e) => {
        if (e.target.matches('.scaling-factor')) {
          const factor = parseFloat(e.target.dataset.factor);
          if (!isNaN(factor)) {
            const baseValue = this.#getBaseValue();
            const newValue = this.#roundToDecimal(baseValue * factor);
            customInput.value = String(newValue);
            this.#updateIngredients(newValue / baseValue);
          }
        }
      }, 100);
      factorsDiv.addEventListener('click', clickHandler);
      this.#cleanupFunctions.push(() => {
        factorsDiv.removeEventListener('click', clickHandler);
        container.removeChild(factorsDiv);
      });
    } catch (error) {
      console.error('Error setting up scaling UI:', error);
    }
  }

  #cacheIngredientAmounts() {
    document.querySelectorAll('.ingredient-amount').forEach(amountEl => {
      this.#ingredientAmounts.set(amountEl, { 
        original: amountEl.textContent,
        originalUnit: amountEl.nextElementSibling.textContent.trim()
      });
    });
  }

  #updateIngredients(scaleFactor) {
    this.#ingredientAmounts.forEach(({ original, originalUnit }, amountEl) => {
      const unitEl = amountEl.nextElementSibling;
      const { value, unit } = this.#calculateScaledAmount(
        parseFloat(original),
        originalUnit, 
        scaleFactor
      );
      
      if (amountEl.textContent !== String(value) || unitEl.textContent !== unit) {
        amountEl.textContent = String(value).replace(/\.0$/, '');  
        unitEl.textContent = unit;
      }
    });
  }

  #calculateScaledAmount(value, unit, factor) {
    const scaled = value * factor;
    
    if (ServingsControl.CONVERSIONS[unit]) {
      const baseValue = scaled * ServingsControl.CONVERSIONS[unit];
      return unit === 'g' || unit === 'kg' ?
        this.#convertWeight(baseValue) :
        this.#convertVolume(baseValue);  
    }

    return {
      value: unit === 'kpl' ? 
        Math.round(scaled) : 
        this.#roundToDecimal(scaled), 
      unit
    };
  }

  #convertWeight(grams) {
    return grams >= ServingsControl.CONVERSIONS.kg ?
      { value: this.#roundToDecimal(grams / ServingsControl.CONVERSIONS.kg, 2), unit: 'kg' } :
      { value: Math.round(grams), unit: 'g' };
  }

  #convertVolume(ml) {
    if (ml >= ServingsControl.CONVERSIONS.l) {
      return { value: this.#roundToDecimal(ml / ServingsControl.CONVERSIONS.l, 2), unit: 'l' };
    }
    if (ml >= 50) { 
      return { value: Math.round(ml), unit: 'ml' };
    }
    return { value: this.#roundToDecimal(ml), unit: 'ml' };
  }

  #calculateConversionFactor(newMode, newUnit) {
    const { mode, unit, yield: yieldValue, servings } = this.state;
    
    if (unit === 'kpl' || newUnit === 'kpl') {
      return unit === 'kpl' ? 
        (newMode === 'yield' ? yieldValue.value : servings.value) :
        (mode === 'yield' ? 1 / yieldValue.value : 1 / servings.value);
    }

    return mode === newMode ? 1 :
           mode === 'servings' ? yieldValue.value / servings.value : 
           servings.value / yieldValue.value;
  }

  #getBaseValue() {
    const { mode, unit, yield: yieldValue, servings } = this.state;
    return mode === 'yield' && yieldValue ?
      yieldValue.value * (ServingsControl.UNIT_MAPPINGS.yield[unit] || 1) :
      unit === 'kpl' ? 1 : servings.value;
  }

  #roundToDecimal(num, decimals = 1) {
    const factor = 10 ** decimals;
    return Math.round(num * factor) / factor;
  }

  #debounce(fn, delay) {
    let timeout;
    return (...args) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => fn(...args), delay);
    };
  }
}

class RecipeUI {
  #cleanupFunctions = [];
  #elements = {};

  constructor() {
    this.#initElements();  
  }

  cleanup() {
    this.#cleanupFunctions.forEach(cleanup => cleanup());
    this.#cleanupFunctions = [];
  }

  init() {
    try {
      this.#initMetaToggle();
      this.#initStickySidebar();
      this.#setupLazyLoading();  
    } catch (error) {
      console.error('RecipeUI initialization error:', error); 
    }
  }

  #initElements() {
    const sel = {
      recipeMetaButton: '.recipe-meta',
      additionalInfo: '#additional-info',
      stickyToggle: '.sticky-toggle',
      sidebar: '.recipe-sidebar',
      lazyImages: ['.recipe-image[data-src]', true]
    };

    this.#elements = Object.fromEntries(
      Object.entries(sel).map(([k, s]) => [
        k, 
        Array.isArray(s) ?
          document.querySelectorAll(s[0]) :
          document.querySelector(s)  
      ])
    );
  }

  #setupLazyLoading() {
    const { lazyImages } = this.#elements;
    if (!lazyImages.length) return;

    let observer;
    const options = {
      rootMargin: '50px',
      threshold: 0.1  
    };

    const loadImage = img => {
      img.src = img.dataset.src;
      img.removeAttribute('data-src');
    };

    const handleIntersect = (entries, obs) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          loadImage(entry.target);
          obs.unobserve(entry.target); 
        }
      });
    };

    const mobileScreen = window.matchMedia('(max-width: 767px)');
    const setObserver = () => {
      observer = new IntersectionObserver(handleIntersect, options);
      lazyImages.forEach(img => observer.observe(img));
    };

    setObserver();
    mobileScreen.addListener(() => {
      observer.disconnect();
      setObserver(); 
    });

    this.#cleanupFunctions.push(() => {
      observer.disconnect();
      mobileScreen.removeListener(setObserver);
    });
  }

  #initMetaToggle() {
    const { recipeMetaButton, additionalInfo } = this.#elements;
    if (!recipeMetaButton || !additionalInfo) return;

    const toggleHandler = () => {
      const isExpanded = recipeMetaButton.getAttribute('aria-expanded') === 'true';
      additionalInfo.classList.toggle('show');
      recipeMetaButton.setAttribute('aria-expanded', !isExpanded);
    };

    const keyHandler = e => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        toggleHandler();
      }
    };

    recipeMetaButton.addEventListener('click', toggleHandler);
    recipeMetaButton.addEventListener('keydown', keyHandler);

    this.#cleanupFunctions.push(() => {
      recipeMetaButton.removeEventListener('click', toggleHandler);
      recipeMetaButton.removeEventListener('keydown', keyHandler);
    });
  }

  #initStickySidebar() {
    const { stickyToggle, sidebar } = this.#elements;
    if (!stickyToggle || !sidebar) return;

    const toggleHandler = () => sidebar.classList.toggle('sticky');
    stickyToggle.addEventListener('click', toggleHandler);
    this.#cleanupFunctions.push(() => 
      stickyToggle.removeEventListener('click', toggleHandler)
    );
  }
}

// Initialization
let servingsControl;
let recipeUI;

const init = () => {
  try {
    servingsControl = new ServingsControl();
    recipeUI = new RecipeUI();
    recipeUI.init();
    
    window.addEventListener('beforeunload', () => {
      servingsControl?.cleanup();
      recipeUI?.cleanup();
    });
  } catch (error) {
    console.error('Global initialization error:', error);
  }
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}