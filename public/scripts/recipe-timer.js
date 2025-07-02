// Recipe Timer Module
// Handles kitchen timer functionality with notifications

const RecipeTimer = {
  init() {
    // Clean up previous instance to prevent memory leaks
    this.cleanup();
    
    this.timerInterval = null;
    this.totalSeconds = 0;
    this.isRunning = false;
    this.hasCompleted = false; // New flag to track completion state
    this.storageKey = 'recipe-timer-state';
    this.eventListeners = []; // Track event listeners for cleanup
    
    this.setupElements();
    this.setupEventListeners();
    this.setupGlobalTimerFunction();
    this.restoreTimerState();
    this.updateTimerButtonDisplay();
    
    // Don't call updateTimerDisplay() on init if timer is not running
    // This preserves the default input values from HTML
  },

  cleanup() {
    // Clear timer interval
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
    
    // Remove all tracked event listeners
    if (this.eventListeners) {
      this.eventListeners.forEach(({ element, event, handler }) => {
        if (element && element.removeEventListener) {
          element.removeEventListener(event, handler);
        }
      });
      this.eventListeners = [];
    }
    
    // Clean up global function
    if (window.startTimerFromText) {
      delete window.startTimerFromText;
    }
  },

  addEventListenerTracked(element, event, handler, options) {
    if (element && element.addEventListener) {
      element.addEventListener(event, handler, options);
      this.eventListeners.push({ element, event, handler });
    }
  },

  setupElements() {
    this.timerModal = document.getElementById('timer-modal');
    this.kitchenTimerBtn = document.getElementById('kitchen-timer');
    this.closeTimerBtn = document.getElementById('close-timer');
    
    // Mobile/popup timer elements
    this.minutesInput = document.getElementById('timer-minutes-input');
    this.secondsInput = document.getElementById('timer-seconds-input');
    this.startBtn = document.getElementById('start-timer');
    this.pauseBtn = document.getElementById('pause-timer');
    this.resetBtn = document.getElementById('reset-timer');
    
    // Desktop sidebar timer elements
    this.minutesInputDesktop = document.getElementById('timer-minutes-input-desktop');
    this.secondsInputDesktop = document.getElementById('timer-seconds-input-desktop');
    this.startBtnDesktop = document.getElementById('start-timer-desktop');
    this.pauseBtnDesktop = document.getElementById('pause-timer-desktop');
    this.resetBtnDesktop = document.getElementById('reset-timer-desktop');
  },

  setupEventListeners() {
    // Mobile timer button
    this.addEventListenerTracked(this.kitchenTimerBtn, 'click', (e) => {
      this.openTimer(e.currentTarget);
    });
    
    this.addEventListenerTracked(this.closeTimerBtn, 'click', () => this.closeTimer());
    this.addEventListenerTracked(this.timerModal, 'click', (e) => this.handleModalClick(e));
    
    // Mobile/popup timer controls
    this.addEventListenerTracked(this.startBtn, 'click', () => this.handleStart());
    this.addEventListenerTracked(this.pauseBtn, 'click', () => this.pauseTimer());
    this.addEventListenerTracked(this.resetBtn, 'click', () => this.resetTimer());
    
    // Desktop sidebar timer controls
    this.addEventListenerTracked(this.startBtnDesktop, 'click', () => this.handleStart());
    this.addEventListenerTracked(this.pauseBtnDesktop, 'click', () => this.pauseTimer());
    this.addEventListenerTracked(this.resetBtnDesktop, 'click', () => this.resetTimer());
    
    // Input validation and formatting - Mobile/popup
    this.addEventListenerTracked(this.minutesInput, 'input', (e) => this.validateInput(e.target, null));
    this.addEventListenerTracked(this.secondsInput, 'input', (e) => this.validateInput(e.target, 59));
    this.addEventListenerTracked(this.minutesInput, 'blur', (e) => this.formatInput(e.target));
    this.addEventListenerTracked(this.secondsInput, 'blur', (e) => this.formatInput(e.target));
    
    // Input validation and formatting - Desktop sidebar
    this.addEventListenerTracked(this.minutesInputDesktop, 'input', (e) => this.validateInput(e.target, null));
    this.addEventListenerTracked(this.secondsInputDesktop, 'input', (e) => this.validateInput(e.target, 59));
    this.addEventListenerTracked(this.minutesInputDesktop, 'blur', (e) => this.formatInput(e.target));
    this.addEventListenerTracked(this.secondsInputDesktop, 'blur', (e) => this.formatInput(e.target));
    
    // Handle timer links with event delegation
    this.timerLinkHandler = (e) => {
      if (e.target.classList.contains('timer-link')) {
        e.preventDefault();
        const timeText = e.target.dataset.timerText || e.target.textContent;
        window.startTimerFromText(timeText, e.target);
      }
    };
    this.addEventListenerTracked(document, 'click', this.timerLinkHandler);
  },

  setupGlobalTimerFunction() {
    // Handle timer links from recipe content
    const self = this;
    window.startTimerFromText = function(timeText, triggerElement = null) {
      let totalMinutes = 0;
      
      // Check if trigger element has data-timer-minutes attribute (from remark plugin)
      if (triggerElement && triggerElement.dataset && triggerElement.dataset.timerMinutes) {
        totalMinutes = parseInt(triggerElement.dataset.timerMinutes);
        // Timer link clicked
      } else {
        // Fallback to parsing time text manually
        totalMinutes = self.parseTimeText(timeText);
        // Timer parsed from text
      }

      if (totalMinutes > 0) {
        const minutes = Math.floor(totalMinutes);
        const seconds = Math.round((totalMinutes - minutes) * 60);
        
        // Clear previous active timer link
        self.clearActiveTimerLinks();
        
        // Mark this timer link as active
        if (triggerElement) {
          triggerElement.classList.add('timer-link-active');
          self.activeTimerLink = triggerElement;
        }
        
        // Set timer values and update display
        self.totalSeconds = (minutes * 60) + seconds;
        self.hasCompleted = false; // Clear completion state when starting new timer
        self.updateTimerDisplay(); // This will update the input fields
        self.startTimer();
        
        // Update button display immediately
        self.updateTimerButtonDisplay();
      } else {
        console.error(`Timer setup failed: totalMinutes=${totalMinutes}`);
      }
    };
  },

  parseTimeText(timeText) {
    let totalMinutes = 0;
    
    // Handle hours (t = tunti, h = hour)
    const hourMatch = timeText.match(/(\d+(?:[.,]\d+)?)\s*[th]/i);
    if (hourMatch) {
      const hours = parseFloat(hourMatch[1].replace(',', '.'));
      totalMinutes += hours * 60;
    }
    
    // Handle minutes (min = minuuttia, m = minuutti)
    const minuteMatch = timeText.match(/(\d+(?:[.,]\d+)?)\s*(?:min|m)(?:uut|nut)?/i);
    if (minuteMatch) {
      const minutes = parseFloat(minuteMatch[1].replace(',', '.'));
      totalMinutes += minutes;
    }
    
    // Handle seconds (sek = sekuntia, s = sekuntti)
    const secondMatch = timeText.match(/(\d+(?:[.,]\d+)?)\s*(?:sek|s)(?:unt|kun)?/i);
    if (secondMatch) {
      const seconds = parseFloat(secondMatch[1].replace(',', '.'));
      totalMinutes += seconds / 60;
    }
    
    // Handle range formats like "8-10 minuuttia"
    const rangeMatch = timeText.match(/(\d+)\s*[-–]\s*(\d+)\s*(?:min|m)/i);
    if (rangeMatch) {
      const min1 = parseInt(rangeMatch[1]);
      const min2 = parseInt(rangeMatch[2]);
      totalMinutes = Math.min(min1, min2); // Use minimum value
    }
    
    return totalMinutes;
  },

  openTimer(triggerElement = null) {
    if (!this.timerModal) return;
    
    this.timerModal.classList.remove('hidden');
    this.timerModal.classList.add('vis-flex');
    
    // Update button states when opening
    this.updateTimerButtons();
    
    // Center the popup on screen (remove custom positioning)
    this.centerPopup();
    
    // Animate popup in
    const popup = this.timerModal.querySelector('.timer-popup');
    if (popup) {
      setTimeout(() => {
        popup.classList.remove('scale-95', 'opacity-0');
        popup.classList.add('scale-100', 'opacity-100');
      }, 10);
    }
    
    // Request notification permission
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  },

  centerPopup() {
    const popup = this.timerModal.querySelector('.bg-\\[var\\(--color-background\\)\\]');
    
    if (popup) {
      // Remove any existing arrow (cleanup from previous positioning)
      const existingArrow = popup.querySelector('.timer-arrow');
      if (existingArrow) {
        existingArrow.remove();
      }
    }
  },

  closeTimer() {
    if (!this.timerModal) return;
    
    // Animate popup out
    const popup = this.timerModal.querySelector('.timer-popup');
    if (popup) {
      popup.classList.remove('scale-100', 'opacity-100');
      popup.classList.add('scale-95', 'opacity-0');
      
      setTimeout(() => {
        this.timerModal.classList.remove('vis-flex');
        this.timerModal.classList.add('hidden');
      }, 200);
    } else {
      this.timerModal.classList.remove('vis-flex');
      this.timerModal.classList.add('hidden');
    }
  },

  handleModalClick(e) {
    // Close if clicking on the backdrop (blur area)
    if (e.target.classList.contains('backdrop-blur-sm') || e.target === this.timerModal) {
      this.closeTimer();
    }
  },

  handleStart() {
    if (!this.isRunning) {
      // If timer is paused (totalSeconds > 0), resume with current time
      // If timer is stopped (totalSeconds = 0), start with input values
      if (this.totalSeconds === 0) {
        // Always read from inputs when starting fresh
        let minutes = 0;
        let seconds = 0;
        
        // Determine which inputs to read from based on which timer interface is being used
        // Check if timer modal is open (mobile) or use desktop inputs
        const isModalOpen = this.timerModal && !this.timerModal.classList.contains('hidden');
        
        if (isModalOpen && this.minutesInput && this.secondsInput) {
          // Read from mobile/popup inputs
          minutes = parseInt(this.minutesInput.value || '0');
          seconds = parseInt(this.secondsInput.value || '0');
          // Reading timer inputs
        } else if (this.minutesInputDesktop && this.secondsInputDesktop) {
          // Read from desktop sidebar inputs
          minutes = parseInt(this.minutesInputDesktop.value || '0');
          seconds = parseInt(this.secondsInputDesktop.value || '0');
          // Reading timer inputs
        }
        
        this.totalSeconds = minutes * 60 + seconds;
        // Starting timer
      }
      
      if (this.totalSeconds > 0) {
        // Clear completion state when starting a new timer
        this.hasCompleted = false;
        // Don't call updateTimerDisplay() when starting fresh - it would overwrite user input
        // The inputs already have the correct values that the user set
        this.updateTimerButtonDisplay();
        this.startTimer();
      }
    }
  },

  updateTimerDisplay() {
    const minutes = Math.floor(this.totalSeconds / 60);
    const seconds = this.totalSeconds % 60;
    
    // Update mobile/popup inputs
    if (this.minutesInput && this.secondsInput) {
      this.minutesInput.value = minutes.toString().padStart(2, '0');
      this.secondsInput.value = seconds.toString().padStart(2, '0');
      
      // Make inputs readonly when timer is running, editable when paused/stopped
      if (this.isRunning) {
        this.minutesInput.readOnly = true;
        this.secondsInput.readOnly = true;
        this.minutesInput.classList.add('cursor-default');
        this.secondsInput.classList.add('cursor-default');
      } else {
        this.minutesInput.readOnly = false;
        this.secondsInput.readOnly = false;
        this.minutesInput.classList.remove('cursor-default');
        this.secondsInput.classList.remove('cursor-default');
      }
    }
    
    // Update desktop sidebar inputs
    if (this.minutesInputDesktop && this.secondsInputDesktop) {
      this.minutesInputDesktop.value = minutes.toString().padStart(2, '0');
      this.secondsInputDesktop.value = seconds.toString().padStart(2, '0');
      
      // Make inputs readonly when timer is running, editable when paused/stopped
      if (this.isRunning) {
        this.minutesInputDesktop.readOnly = true;
        this.secondsInputDesktop.readOnly = true;
        this.minutesInputDesktop.classList.add('cursor-default');
        this.secondsInputDesktop.classList.add('cursor-default');
      } else {
        this.minutesInputDesktop.readOnly = false;
        this.secondsInputDesktop.readOnly = false;
        this.minutesInputDesktop.classList.remove('cursor-default');
        this.secondsInputDesktop.classList.remove('cursor-default');
      }
    }
    
    this.updateTimerButtons();
  },

  startTimer() {
    if (!this.isRunning && this.totalSeconds > 0) {
      this.isRunning = true;
      this.hasCompleted = false; // Clear completion state when starting
      this.saveTimerState();
      
      // Now that the timer is running, update the display to make inputs readonly
      this.updateTimerDisplay();
      this.updateTimerButtonDisplay();
      this.updateTimerButtons();
      
      this.timerInterval = setInterval(() => {
        this.totalSeconds--;
        this.updateTimerDisplay();
        this.updateTimerButtonDisplay();
        this.saveTimerState();
        
        if (this.totalSeconds <= 0) {
          this.handleTimerComplete();
        }
      }, 1000);
    }
  },

  handleTimerComplete() {
    clearInterval(this.timerInterval);
    this.isRunning = false;
    this.totalSeconds = 0;
    this.hasCompleted = true; // Set completion state flag
    this.saveTimerState();
    this.updateTimerButtonDisplay();
    this.updateTimerButtons(); // Add this call to update button states
    
    // Clear active timer link
    this.clearActiveTimerLinks();
    
    // Show notification
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('Ajastin päättyi!', {
        body: 'Reseptin ajastin on päättynyt.',
        icon: '/favicon.svg'
      });
    } else {
      alert('Ajastin päättyi!');
    }
  },

  pauseTimer() {
    if (this.isRunning) {
      clearInterval(this.timerInterval);
      this.isRunning = false;
      this.saveTimerState();
      this.updateTimerButtonDisplay();
      this.updateTimerButtons();
    }
  },

  resetTimer() {
    clearInterval(this.timerInterval);
    this.isRunning = false;
    this.totalSeconds = 0;
    this.hasCompleted = false; // Clear completion state
    
    // Reset inputs to default values instead of using updateTimerDisplay
    if (this.minutesInput && this.secondsInput) {
      this.minutesInput.value = '5';
      this.secondsInput.value = '00';
      this.minutesInput.readOnly = false;
      this.secondsInput.readOnly = false;
      this.minutesInput.classList.remove('cursor-default');
      this.secondsInput.classList.remove('cursor-default');
    }
    
    if (this.minutesInputDesktop && this.secondsInputDesktop) {
      this.minutesInputDesktop.value = '5';
      this.secondsInputDesktop.value = '00';
      this.minutesInputDesktop.readOnly = false;
      this.secondsInputDesktop.readOnly = false;
      this.minutesInputDesktop.classList.remove('cursor-default');
      this.secondsInputDesktop.classList.remove('cursor-default');
    }
    
    this.saveTimerState();
    this.updateTimerButtonDisplay();
    this.updateTimerButtons();
    
    // Clear active timer link
    this.clearActiveTimerLinks();
  },

  saveTimerState() {
    const state = {
      totalSeconds: this.totalSeconds,
      isRunning: this.isRunning,
      hasCompleted: this.hasCompleted, // Save completion state
      timestamp: Date.now()
    };
    localStorage.setItem(this.storageKey, JSON.stringify(state));
  },

  restoreTimerState() {
    try {
      const saved = localStorage.getItem(this.storageKey);
      if (!saved) return;

      const state = JSON.parse(saved);
      const elapsed = Math.floor((Date.now() - state.timestamp) / 1000);

      // Restore completion state (default to false for backward compatibility)
      this.hasCompleted = state.hasCompleted || false;

      if (state.isRunning && state.totalSeconds > 0) {
        // Timer was actively running
        this.totalSeconds = Math.max(0, state.totalSeconds - elapsed);
        
        if (this.totalSeconds > 0) {
          // Reset isRunning to false first, then start the timer
          // This ensures startTimer() will properly initialize the interval
          this.isRunning = false;
          this.updateTimerDisplay(); // Update display to show remaining time
          this.startTimer();
        } else {
          // Timer finished while away
          this.totalSeconds = 0;
          this.isRunning = false;
          this.hasCompleted = true; // Set completion state
          this.handleTimerComplete();
        }
      } else if (!state.isRunning && state.totalSeconds > 0) {
        // Timer was paused - restore the paused state
        this.totalSeconds = state.totalSeconds;
        this.isRunning = false;
        this.updateTimerDisplay(); // Show the paused timer values
        // Restored paused timer
      } else {
        // No active or paused timer - start fresh
        this.totalSeconds = 0;
        this.isRunning = false;
      }
      
      this.updateTimerButtons();
      this.updateTimerButtonDisplay();
    } catch (error) {
      console.warn('Failed to restore timer state:', error);
    }
  },

  updateTimerButtonDisplay() {
    this.updateSingleTimerButton(this.kitchenTimerBtn, true); // Mobile button (round)
  },

  updateSingleTimerButton(button, isRound = true) {
    if (!button) return;

    const timerIcon = button.querySelector('svg');
    
    if (this.totalSeconds > 0) {
      // Show countdown in button
      const minutes = Math.floor(this.totalSeconds / 60);
      const seconds = this.totalSeconds % 60;
      const timeText = minutes > 0 
        ? `${minutes}:${seconds.toString().padStart(2, '0')}`
        : `${seconds}s`;
      
      // Use semantic classes for styling
      button.classList.add('timer-active');
      
      // Replace icon with countdown text
      if (timerIcon) {
        timerIcon.style.display = 'none';
      }
      
      let textElement = button.querySelector('.timer-countdown');
      if (!textElement) {
        textElement = document.createElement('span');
        textElement.className = 'timer-countdown';
        button.appendChild(textElement);
      }
      
      textElement.textContent = timeText;
      
      // Add running state class if timer is running
      if (this.isRunning) {
        button.classList.add('timer-running');
      } else {
        button.classList.remove('timer-running');
      }
      
      // Update aria-label
      button.setAttribute('aria-label', `Ajastin käynnissä: ${timeText}`);
      button.setAttribute('title', `Ajastin käynnissä: ${timeText}`);
    } else {
      // Reset to original button state
      button.classList.remove('timer-active', 'timer-running');
      
      // Show normal timer icon
      if (timerIcon) {
        timerIcon.style.display = 'block';
      }
      
      const textElement = button.querySelector('.timer-countdown');
      if (textElement) {
        textElement.remove();
      }
      
      // Reset aria-label
      button.setAttribute('aria-label', 'Keittiöajastin');
      button.setAttribute('title', 'Keittiöajastin');
    }
  },

  updateTimerButtons() {
    // Update mobile/popup timer buttons
    if (this.startBtn && this.pauseBtn && this.resetBtn) {
      if (this.isRunning) {
        // Timer is running: show pause button, hide start and reset
        this.startBtn.style.display = 'none';
        this.pauseBtn.style.display = 'flex';
        this.resetBtn.style.display = 'none';
      } else if (this.totalSeconds > 0) {
        // Timer is paused: show start and reset buttons, hide pause
        this.startBtn.style.display = 'flex';
        this.pauseBtn.style.display = 'none';
        this.resetBtn.style.display = 'flex';
      } else if (this.hasCompleted) {
        // Timer has completed: show start and reset buttons to allow new timer or reset
        this.startBtn.style.display = 'flex';
        this.pauseBtn.style.display = 'none';
        this.resetBtn.style.display = 'flex';
      } else {
        // Timer is off: show only start button
        this.startBtn.style.display = 'flex';
        this.pauseBtn.style.display = 'none';
        this.resetBtn.style.display = 'none';
      }
    }
    
    // Update desktop sidebar timer buttons
    if (this.startBtnDesktop && this.pauseBtnDesktop && this.resetBtnDesktop) {
      if (this.isRunning) {
        // Timer is running: show pause button, hide start and reset
        this.startBtnDesktop.style.display = 'none';
        this.pauseBtnDesktop.style.display = 'flex';
        this.resetBtnDesktop.style.display = 'none';
      } else if (this.totalSeconds > 0) {
        // Timer is paused: show start and reset buttons, hide pause
        this.startBtnDesktop.style.display = 'flex';
        this.pauseBtnDesktop.style.display = 'none';
        this.resetBtnDesktop.style.display = 'flex';
      } else if (this.hasCompleted) {
        // Timer has completed: show start and reset buttons to allow new timer or reset
        this.startBtnDesktop.style.display = 'flex';
        this.pauseBtnDesktop.style.display = 'none';
        this.resetBtnDesktop.style.display = 'flex';
      } else {
        // Timer is off: show only start button
        this.startBtnDesktop.style.display = 'flex';
        this.pauseBtnDesktop.style.display = 'none';
        this.resetBtnDesktop.style.display = 'none';
      }
    }
  },

  clearActiveTimerLinks() {
    // Remove active class from all timer links
    const activeLinks = document.querySelectorAll('.timer-link-active');
    activeLinks.forEach(link => {
      link.classList.remove('timer-link-active');
    });
    this.activeTimerLink = null;
  },

  validateInput(input, maxValue) {
    let value = parseInt(input.value);
    if (isNaN(value) || value < 0) {
      input.value = '0';
    } else if (maxValue !== null && value > maxValue) {
      input.value = maxValue.toString();
    }
  },

  formatInput(input) {
    const value = parseInt(input.value) || 0;
    // Only pad with leading zero for seconds input or minutes under 100
    if (input.id === 'timer-seconds-input' || value < 100) {
      input.value = value.toString().padStart(2, '0');
    } else {
      input.value = value.toString();
    }
  }
};

// Auto-initialize for global usage
if (typeof window !== 'undefined') {
  window.RecipeTimer = RecipeTimer;
}

// Handle navigation events for prefetched pages
let navigationEventListeners = [];

function addNavigationListener(event, handler) {
  document.addEventListener(event, handler);
  navigationEventListeners.push({ event, handler });
}

function removeNavigationListeners() {
  navigationEventListeners.forEach(({ event, handler }) => {
    document.removeEventListener(event, handler);
  });
  navigationEventListeners = [];
}

// Clean up before page swap
addNavigationListener('astro:before-swap', () => {
  if (RecipeTimer && typeof RecipeTimer.cleanup === 'function') {
    RecipeTimer.cleanup();
  }
});

// Re-initialize after navigation
['astro:after-swap', 'astro:page-load'].forEach(event => {
  addNavigationListener(event, () => {
    // Re-initialize timer on navigation to ensure it works on prefetched pages
    setTimeout(() => {
      if (RecipeTimer && typeof RecipeTimer.init === 'function') {
        // Reset timer elements and event listeners for new page
        RecipeTimer.init();
      }
    }, 100);
  });
});