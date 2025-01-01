// Utility functions
const debounce = (fn, delay) => {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
};

class StateMachine {
  constructor(initialState) {
    this.state = initialState;
    this.listeners = new Set();
  }

  transition(event) {
    this.state = event;
    this.notify();
  }

  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  notify() {
    this.listeners.forEach(listener => listener(this.state));
  }
}

const DOM = {
  cache: new Map(),
  get(selector) {
    if (!this.cache.has(selector)) {
      const element = document.querySelector(selector);
      if (element) this.cache.set(selector, element);
    }
    return this.cache.get(selector);
  },
  getAll(selector) {
    return document.querySelectorAll(selector);
  },
  clear() {
    this.cache.clear();
  }
};

const utils = {
  formatTime(minutes) {
    if (!minutes) return '0 min';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours === 0 ? `${mins} min` : 
           mins === 0 ? `${hours} hr` : 
           `${hours} hr ${mins} min`;
  },

  scaleNumber(number, factor) {
    const scaled = number * factor;
    return scaled % 1 === 0 ? 
      scaled.toString() : 
      Math.abs(scaled - Math.round(scaled)) >= 0.5 ? 
        `~${Math.round(scaled)}` : 
        scaled.toFixed(1);
  },

  roundToDecimal(num, decimals) {
    return Math.round(num * Math.pow(10, decimals)) / Math.pow(10, decimals);
  }
};

class ServingsControl {
  constructor() {
    this.elements = {
      customInput: document.querySelector('.custom-amount-input'),
      currentYield: document.querySelector('#current-yield'),
      ingredientsList: document.querySelectorAll('.ingredients-list'),
      unitToggle: document.querySelector('.unit-toggle-btn'),
      unitOptions: document.querySelector('.unit-options'),
      presetButtons: document.querySelectorAll('.preset-btn')
    };

    if (!this.elements.customInput) return;

    this.unitMappings = {
      yield: {
        g: { base: 1 },
        kg: { base: 1000 },
        ml: { base: 1 },
        l: { base: 1000 },
        dl: { base: 100 },
        kpl: { base: 1 }
      },
      servings: {
        annosta: { base: 1 }
      }
    };

    const initialYield = this.initializeYield();
    const initialServings = this.initializeServings();
    const firstOption = this.elements.unitOptions?.querySelector('[role="option"]');
    const initialMode = firstOption?.dataset.value || this.elements.customInput.dataset.type || 'servings';
    const initialUnit = firstOption?.dataset.unit || this.elements.customInput.dataset.unit || 'servings';

    this.state = {
      yield: initialYield,
      servings: initialServings,
      scaleFactor: 1,
      mode: initialMode,
      unit: initialUnit,
      baseValue: initialMode === 'yield' && initialYield ? 
        parseFloat(initialYield.value) * (this.unitMappings.yield[initialUnit]?.base || 1) :
        parseFloat(initialServings.value || 0)
    };

    if (this.elements.unitToggle) {
      this.elements.unitToggle.querySelector('.current-unit').textContent = initialUnit;
    }

    const { customInput } = this.elements;
    if (this.state.mode === 'yield' && this.state.yield) {
      customInput.value = this.state.yield.value;
    } else if (this.state.mode === 'servings') {
      customInput.value = this.state.servings.value;
    }

    this.validateInput = (value) => {
      const num = parseFloat(value);
      return !isNaN(num) && num > 0 && num <= 9999;
    };

    this.debouncedScale = debounce((value) => {
      if (this.validateInput(value)) {
        const scaleFactor = this.calculateScaleFactor(value);
        this.applyScaling(scaleFactor);
      }
    }, 150);

    this.setupEventListeners();
    this.setupAccessibility();
    this.setupScaleSlider();
    this.positionScalePointsAndMarkers();
  }

  initializeYield() {
    const { customInput } = this.elements;
    return customInput.hasAttribute('data-original-yield') ? {
      value: parseFloat(customInput.dataset.originalYield),
      unit: customInput.dataset.restOfYield
    } : null;
  }

  initializeServings() {
    const { customInput } = this.elements;
    return {
      value: parseFloat(customInput.dataset.originalServings || customInput.dataset.originalValue),
      unit: 'annosta'
    };
  }

  setupAccessibility() {
    const { customInput, unitToggle, unitOptions } = this.elements;
    
    if (customInput) {
      customInput.setAttribute('aria-label', 'Adjust recipe quantity');
      customInput.setAttribute('inputmode', 'decimal');
    }

    if (unitToggle) {
      unitToggle.setAttribute('aria-haspopup', 'listbox');
      unitToggle.setAttribute('aria-expanded', 'false');
    }

    if (unitOptions) {
      unitOptions.setAttribute('role', 'listbox');
      unitOptions.setAttribute('aria-label', 'Select measurement unit');
    }

    this.setupKeyboardNav();
  }

  setupKeyboardNav() {
    const { unitOptions } = this.elements;
    if (!unitOptions) return;

    const options = Array.from(unitOptions.querySelectorAll('[role="option"]'));
    let currentIndex = -1;

    unitOptions.addEventListener('keydown', (e) => {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          currentIndex = Math.min(currentIndex + 1, options.length - 1);
          break;
        case 'ArrowUp':
          e.preventDefault();
          currentIndex = Math.max(currentIndex - 1, 0);
          break;
        case 'Enter':
        case ' ':
          e.preventDefault();
          if (currentIndex >= 0) {
            this.handleUnitChange(options[currentIndex]);
          }
          break;
      }
      
      if (currentIndex >= 0) {
        options[currentIndex].focus();
      }
    });
  }

  setupScaleSlider() {
    const scaleRange = document.querySelector('.scale-range');
    if (!scaleRange) return;

    scaleRange.style.transition = 'all 0.15s ease-out';

    let touchStartX = 0;
    let currentScale = parseFloat(scaleRange.value);

    scaleRange.addEventListener('touchstart', (e) => {
      touchStartX = e.touches[0].clientX;
      currentScale = parseFloat(scaleRange.value);
    });

    scaleRange.addEventListener('touchmove', (e) => {
      e.preventDefault();
      const touch = e.touches[0];
      const diff = touch.clientX - touchStartX;
      const step = (scaleRange.max - scaleRange.min) / scaleRange.offsetWidth;
      const newScale = currentScale + (diff * step);
      
      if (newScale >= parseFloat(scaleRange.min) && newScale <= parseFloat(scaleRange.max)) {
        scaleRange.value = newScale;
        if (this.state.mode === 'yield' && this.state.yield) {
          const value = this.state.baseValue * newScale;
          this.elements.customInput.value = value;
        } else {
          const scaledServings = Math.round(this.state.servings.value * newScale);
          this.elements.customInput.value = scaledServings;
        }
        this.debouncedScale(this.elements.customInput.value);
        const event = new Event('input');
        scaleRange.dispatchEvent(event);
      }
    });

    scaleRange.setAttribute('aria-label', 'Adjust recipe scale');
    scaleRange.setAttribute('aria-valuemin', scaleRange.min);
    scaleRange.setAttribute('aria-valuemax', scaleRange.max);
    scaleRange.setAttribute('aria-valuenow', scaleRange.value);
  }

  setupEventListeners() {
    const { customInput, presetButtons, unitToggle, unitOptions } = this.elements;

    customInput?.addEventListener('input', e => {
      const value = parseFloat(e.target.value);
      if (!isNaN(value) && value > 0) {
        this.debouncedScale(value);
      }
    });

    this.setupScaleRangeListeners();

    unitToggle?.addEventListener('click', () => {
      const isExpanded = unitOptions.classList.contains('open');
      unitOptions?.classList.toggle('open');
      unitToggle.setAttribute('aria-expanded', !isExpanded);
    });

    unitOptions?.querySelectorAll('[role="option"]').forEach(option => {
      option.addEventListener('click', () => this.handleUnitChange(option));
    });

    document.addEventListener('click', e => {
      if (!unitToggle?.contains(e.target) && !unitOptions?.contains(e.target)) {
        unitOptions?.classList.remove('open');
        unitToggle?.setAttribute('aria-expanded', 'false');
      }
    });

    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && unitOptions?.classList.contains('open')) {
        unitOptions.classList.remove('open');
        unitToggle?.setAttribute('aria-expanded', 'false');
        unitToggle?.focus();
      }
    });

    customInput?.closest('form')?.addEventListener('submit', e => e.preventDefault());
  }

  setupScaleRangeListeners() {
    const scaleRange = document.querySelector('.scale-range');
    const scaleMarkers = document.querySelectorAll('.scale-marker');

    if (scaleRange) {
      const scalePoints = document.querySelectorAll('.scale-point');

      const updateScaleUI = (scale) => {
        const min = parseFloat(scaleRange.min);
        const max = parseFloat(scaleRange.max);
        const sliderPosition = ((scale - min) / (max - min)) * 100;
        
        requestAnimationFrame(() => {
          scalePoints.forEach(point => {
            const pointPosition = parseFloat(point.style.left);
            point.classList.toggle('active', Math.abs(pointPosition - sliderPosition) < 1);
          });
          
          scaleMarkers.forEach(marker => {
            const markerPosition = parseFloat(marker.style.left);
            marker.classList.toggle('active', Math.abs(markerPosition - sliderPosition) < 1);
          });
        });
      };

      scaleRange.addEventListener('input', (e) => {
        const scale = parseFloat(e.target.value);
        if (!isNaN(scale)) {
          if (this.state.mode === 'yield' && this.state.yield) {
            const value = this.state.baseValue * scale;
            this.elements.customInput.value = value;
          } else {
            // For servings mode, calculate actual servings based on scale
            const scaledServings = Math.round(this.state.servings.value * scale);
            this.elements.customInput.value = scaledServings;
          }
          this.debouncedScale(this.elements.customInput.value);
          updateScaleUI(scale);
        }
      });

      const handleScaleClick = (element, index) => {
        const totalPoints = scalePoints.length;
        const position = (index / (totalPoints - 1)) * 100;
        const min = parseFloat(scaleRange.min);
        const max = parseFloat(scaleRange.max);
        const scale = min + (position / 100) * (max - min);
        scaleRange.value = scale;
        const event = new Event('input');
        scaleRange.dispatchEvent(event);
      };

      scalePoints.forEach((point, index) => {
        point.addEventListener('click', () => handleScaleClick(point, index));
      });

      scaleMarkers.forEach((marker, index) => {
        marker.addEventListener('click', () => handleScaleClick(marker, index));
      });

      const defaultScale = parseFloat(scaleRange.value);
      if (!isNaN(defaultScale)) {
        updateScaleUI(defaultScale);
      }
    }
  }

  handleUnitChange(option) {
    const newMode = option.dataset.value;
    const newUnit = option.dataset.unit;
    const { customInput, unitToggle, unitOptions } = this.elements;
    const currentValue = parseFloat(customInput.value);
    
    if (isNaN(currentValue)) return;
    
    let conversionFactor = 1;
    if (this.state.mode !== newMode) {
      if (this.state.mode === 'servings' && newMode === 'yield' && this.state.yield) {
        conversionFactor = this.state.yield.value / this.state.servings.value;
      } else if (this.state.mode === 'yield' && newMode === 'servings' && this.state.yield) {
        conversionFactor = this.state.servings.value / this.state.yield.value;
      }
    }
    
    const newValue = currentValue * conversionFactor;
    
    this.state.mode = newMode;
    this.state.unit = newUnit;
    
    if (newMode === 'yield' && this.state.yield) {
      this.state.baseValue = parseFloat(this.state.yield.value) * (this.unitMappings.yield[newUnit]?.base || 1);
    } else if (newMode === 'servings') {
      this.state.baseValue = parseFloat(this.state.servings.value);
    }
    
    customInput.dataset.type = newMode;
    customInput.dataset.unit = newUnit;
    
    customInput.value = utils.roundToDecimal(newValue, 1);
    unitToggle.querySelector('.current-unit').textContent = newUnit;
    unitOptions.classList.remove('open');
    unitToggle.setAttribute('aria-expanded', 'false');
    
    const newScaleFactor = this.calculateScaleFactor(newValue);
    this.applyScaling(newScaleFactor);
  }

  calculateScaleFactor(value) {
    return value / this.state.baseValue;
  }

  applyScaling(scaleFactor) {
    const { currentYield, customInput } = this.elements;

    this.state.scaleFactor = scaleFactor;

    if (this.state.mode === 'yield' && this.state.yield) {
      const scaledYield = parseFloat(customInput.value);
      const servingsScaleFactor = scaledYield / this.state.yield.value;
      const scaledServings = Math.round(this.state.servings.value * servingsScaleFactor);
      
      currentYield.textContent = this.state.mode === 'servings' ? 
        `${scaledServings} ${this.state.servings.unit}\n(${scaledYield}${this.state.yield.unit})` :
        `${scaledYield}${this.state.yield.unit}\n(${scaledServings} ${this.state.servings.unit})`;
      this.scaleIngredients(servingsScaleFactor);
    } else if (this.state.mode === 'servings') {
      const scaledServings = Math.round(this.state.baseValue * scaleFactor);
      customInput.value = scaledServings;

      if (this.state.yield) {
        const yieldScaleFactor = scaledServings / this.state.servings.value;
        const scaledYield = this.state.yield.value * yieldScaleFactor;
        currentYield.textContent = this.state.mode === 'servings' ?
          `${scaledServings} ${this.state.servings.unit}\n(${scaledYield}${this.state.yield.unit})` :
          `${scaledYield}${this.state.yield.unit}\n(${scaledServings} ${this.state.servings.unit})`;
      } else {
        currentYield.textContent = `${scaledServings} ${this.state.servings.unit}`;
      }
      
      this.scaleIngredients(scaleFactor);
    }
  }

  scaleIngredients(scaleFactor) {
    const formatNumber = (num) => num.toString().replace(/\.0$/, '');
    
    const CONVERSIONS = {
      tl_to_ml: 5,
      rkl_to_ml: 15,
      ml_to_l: 1000,
      g_to_kg: 1000
    };

    const processVolumeUnit = (value, unit) => {
      try {
        if (value < 0 || !CONVERSIONS[`${unit}_to_ml`] && unit !== 'l' && unit !== 'ml') {
          throw new Error('Invalid volume conversion parameters');
        }

        let mlValue;
        switch (unit) {
          case 'tl':
            mlValue = value * CONVERSIONS.tl_to_ml;
            break;
          case 'rkl':
            mlValue = value * CONVERSIONS.rkl_to_ml;
            break;
          case 'ml':
            mlValue = value;
            break;
          case 'l':
            mlValue = value * CONVERSIONS.ml_to_l;
            break;
          default:
            return { value, unit };
        }

        const precision = mlValue < 1 ? 2 : 1;

        if (mlValue >= CONVERSIONS.ml_to_l) {
          return {
            value: utils.roundToDecimal(mlValue / CONVERSIONS.ml_to_l, 2),
            unit: 'l'
          };
        }

        if (mlValue >= 50) {
          return {
            value: Math.round(mlValue),
            unit: 'ml'
          };
        }

        if (mlValue > CONVERSIONS.rkl_to_ml && mlValue < 50) {
          return {
            value: utils.roundToDecimal(mlValue / CONVERSIONS.rkl_to_ml, precision),
            unit: 'rkl'
          };
        }

        if (mlValue > CONVERSIONS.tl_to_ml && mlValue <= CONVERSIONS.rkl_to_ml) {
          return {
            value: utils.roundToDecimal(mlValue / CONVERSIONS.tl_to_ml, precision),
            unit: 'tl'
          };
        }

        return {
          value: utils.roundToDecimal(mlValue, precision),
          unit: 'ml'
        };

      } catch (error) {
        console.error('Volume conversion error:', error);
        return { value, unit };
      }
    };

    const processMassUnit = (value, unit) => {
      if (unit === 'g' && value >= CONVERSIONS.g_to_kg) {
        return {
          value: utils.roundToDecimal(value / CONVERSIONS.g_to_kg, 2),
          unit: 'kg'
        };
      }
      if (unit === 'g') {
        return { value: Math.round(value), unit };
      }
      return { value, unit };
    };

    this.elements.ingredientsList.forEach(list => {
      const items = list.querySelectorAll('.ingredient');

      items.forEach(item => {
        const amountEl = item.querySelector('.ingredient-amount');
        const unitEl = item.querySelector('.ingredient-unit');
        
        if (!amountEl || !unitEl) return;

        if (!amountEl.dataset.original) {
          amountEl.dataset.original = amountEl.textContent;
          unitEl.dataset.original = unitEl.textContent;
        }

        const originalValue = parseFloat(amountEl.dataset.original);
        const originalUnit = unitEl.dataset.original.trim();
        const scaledValue = originalValue * scaleFactor;

        let result;
        switch (originalUnit) {
          case 'tl':
          case 'rkl':
          case 'ml':
          case 'l':
            result = processVolumeUnit(scaledValue, originalUnit);
            break;
          case 'g':
          case 'kg':
            result = processMassUnit(scaledValue, originalUnit);
            break;
          case 'kpl':
            result = {
              value: Math.floor(scaledValue * 100) / 100,
              unit: originalUnit
            };
            break;
          default:
            result = {
              value: scaledValue % 1 === 0 ? 
                scaledValue : 
                utils.roundToDecimal(scaledValue, 1),
              unit: originalUnit
            };
        }

        amountEl.textContent = formatNumber(result.value);
        amountEl.dataset.value = result.value;
        unitEl.textContent = result.unit;
        unitEl.dataset.unit = result.unit;
      });
    });
  }

  positionScalePointsAndMarkers() {
    const scalePoints = Array.from(document.querySelectorAll('.scale-point'));
    const scaleMarkers = Array.from(document.querySelectorAll('.scale-marker'));
    const scaleRange = document.querySelector('.scale-range');
    
    if (!scaleRange || !scalePoints.length) return;
    
    const sortByScale = (a, b) => parseFloat(a.dataset.scale) - parseFloat(b.dataset.scale);
    scalePoints.sort(sortByScale);
    scaleMarkers.sort(sortByScale);
    
    const totalPoints = scalePoints.length;
    const step = 100 / (totalPoints - 1);
    
    const scaleValueMap = new Map();
    scalePoints.forEach((point, index) => {
      const visualPosition = index * step;
      const scaleValue = parseFloat(point.dataset.scale);
      scaleValueMap.set(visualPosition, scaleValue);
      point.style.left = `${visualPosition}%`;
    });
    
    scaleMarkers.forEach((marker, index) => {
      marker.style.left = `${index * step}%`;
    });
    
    scaleRange.dataset.scaleMap = JSON.stringify(Array.from(scaleValueMap.entries()));
  }
}

class RecipeUI {
  constructor() {
    this.observer = new IntersectionObserver(
      (entries) => this.handleIntersection(entries),
      { threshold: 0.1 }
    );
    
    this.init();
  }

  init() {
    this.initMetaToggle();
    this.initMobileNav();
    this.initStickySidebar();
    this.setupLazyLoading();
  }

  setupLazyLoading() {
    const images = document.querySelectorAll('.recipe-image[data-src]');
    images.forEach(img => this.observer.observe(img));
  }

  handleIntersection(entries) {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const img = entry.target;
        img.src = img.dataset.src;
        img.removeAttribute('data-src');
        this.observer.unobserve(img);
      }
    });
  }

  initMetaToggle() {
    const recipeMetaButton = document.querySelector('.recipe-meta');
    const additionalInfo = document.getElementById('additional-info');

    if (recipeMetaButton && additionalInfo) {
      recipeMetaButton.addEventListener('click', () => {
        const isExpanded = recipeMetaButton.getAttribute('aria-expanded') === 'true';
        additionalInfo.classList.toggle('show');
        recipeMetaButton.setAttribute('aria-expanded', !isExpanded);
      });

      recipeMetaButton.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          recipeMetaButton.click();
        }
      });
    }
  }

  initMobileNav() {
    const tabs = document.querySelectorAll('.tab-btn');
    const recipeBody = document.querySelector('.recipe-body');
    
    if (!tabs || !recipeBody) return;

    recipeBody.style.transition = 'transform 0.3s ease-out';
    
    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        const target = tab.dataset.tab;
        
        requestAnimationFrame(() => {
          tabs.forEach(t => t.classList.remove('active'));
          tab.classList.add('active');
          
          recipeBody.style.transform = 
            target === 'ingredients' ? 'translateX(0)' : 'translateX(-50%)';
        });
      });
    });
  }

  initStickySidebar() {
    const toggle = document.querySelector('.sticky-toggle');
    const sidebar = document.querySelector('.recipe-sidebar');
    
    if (toggle && sidebar) {
      toggle.addEventListener('click', () => {
        sidebar.classList.toggle('sticky');
      });
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  try {
    new ServingsControl();
    new RecipeUI();
  } catch (error) {
    console.error('Initialization error:', error);
  }
});