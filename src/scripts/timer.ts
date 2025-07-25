/**
 * Kitchen Timer
 * 
 * Simple timer using native HTML Popover API with minimal code.
 * Features: timer links, sound notifications, state persistence.
 */

interface TimerState {
  totalSeconds: number;
  isRunning: boolean;
  hasCompleted: boolean;
  timestamp: number;
}

// Global timer state
let timerState: TimerState = {
  totalSeconds: 300,
  isRunning: false,
  hasCompleted: false,
  timestamp: 0
};

let intervalId: number | null = null;
let isInitialized = false;

// DOM elements
let timerTrigger: HTMLElement | null = null;
let minutesInput: HTMLInputElement | null = null;
let secondsInput: HTMLInputElement | null = null;
let startBtn: HTMLElement | null = null;
let pauseBtn: HTMLElement | null = null;
let resetBtn: HTMLElement | null = null;
let timerSlider: HTMLInputElement | null = null;
let triggerText: HTMLElement | null = null;

// Initialize timer
function initTimer(): void {
  setupElements();
  setupEventListeners();
  
  // Only restore state and mark as initialized on first run
  if (!isInitialized) {
    restoreState();
    isInitialized = true;
  }
  
  updateUI();
}

function setupElements(): void {
  timerTrigger = document.getElementById('timer-trigger');
  minutesInput = document.getElementById('timer-minutes-input') as HTMLInputElement;
  secondsInput = document.getElementById('timer-seconds-input') as HTMLInputElement;
  startBtn = document.getElementById('start-timer');
  pauseBtn = document.getElementById('pause-timer');
  resetBtn = document.getElementById('reset-timer');
  timerSlider = document.getElementById('timer-slider') as HTMLInputElement;
  triggerText = document.querySelector('.timer-trigger-text');
}

function setupEventListeners(): void {
  // Remove existing listeners to avoid duplicates
  startBtn?.removeEventListener('click', startTimer);
  pauseBtn?.removeEventListener('click', pauseTimer);
  resetBtn?.removeEventListener('click', resetTimer);
  timerSlider?.removeEventListener('input', handleSliderChange);
  
  // Add listeners
  startBtn?.addEventListener('click', startTimer);
  pauseBtn?.addEventListener('click', pauseTimer);
  resetBtn?.addEventListener('click', resetTimer);
  timerSlider?.addEventListener('input', handleSliderChange);
  
  // Named functions for input validation
  const validateMinutesInput = () => validateInput(minutesInput!, null);
  const validateSecondsInput = () => validateInput(secondsInput!, 59);
  const formatMinutesInput = () => formatInput(minutesInput!);
  const formatSecondsInput = () => formatInput(secondsInput!);
  
  if (minutesInput) {
    minutesInput.removeEventListener('input', validateMinutesInput);
    minutesInput.removeEventListener('blur', formatMinutesInput);
    minutesInput.addEventListener('input', validateMinutesInput);
    minutesInput.addEventListener('blur', formatMinutesInput);
  }
  
  if (secondsInput) {
    secondsInput.removeEventListener('input', validateSecondsInput);
    secondsInput.removeEventListener('blur', formatSecondsInput);
    secondsInput.addEventListener('input', validateSecondsInput);
    secondsInput.addEventListener('blur', formatSecondsInput);
  }
}

function startTimer(): void {
  if (timerState.isRunning) return;
  
  // Clear any existing interval first
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
  }
  
  // Get values from inputs
  const minutes = parseInt(minutesInput?.value || '5');
  const seconds = parseInt(secondsInput?.value || '0');
  const totalSeconds = Math.max(300, minutes * 60 + seconds);
  
  timerState.totalSeconds = totalSeconds;
  timerState.isRunning = true;
  timerState.hasCompleted = false;
  timerState.timestamp = Date.now();
  
  updateUI();
  saveState();
  
  intervalId = window.setInterval(() => {
    if (timerState.totalSeconds > 0) {
      timerState.totalSeconds--;
      updateUI();
    } else {
      handleComplete();
    }
  }, 1000);
}

function pauseTimer(): void {
  if (!timerState.isRunning) return;
  
  timerState.isRunning = false;
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
  }
  
  saveState();
  updateUI();
}

function resetTimer(): void {
  timerState.totalSeconds = 300;
  timerState.isRunning = false;
  timerState.hasCompleted = false;
  
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
  }
  
  saveState();
  updateUI();
}

function handleComplete(): void {
  timerState.isRunning = false;
  timerState.hasCompleted = true;
  timerState.totalSeconds = 0;
    
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
  }
    
  playSound();
  showNotification();
  saveState();
  updateUI();
}

function playSound(): void {
  try {
    new Audio('/sounds/timer-alarm.mp3').play().catch(() => {
      // Silent fallback if audio fails
    });
  } catch (error) {
    // Silent fallback
  }
}

function showNotification(): void {
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification('Keittiöajastin', {
      body: 'Aika on umpeutunut!',
      icon: '/icons/timer-icon.png'
    });
  }
}

function updateUI(): void {
  const minutes = Math.floor(timerState.totalSeconds / 60);
  const seconds = timerState.totalSeconds % 60;
  
  // Re-query elements if they're not available (in case DOM was replaced)
  if (!minutesInput) minutesInput = document.getElementById('timer-minutes-input') as HTMLInputElement;
  if (!secondsInput) secondsInput = document.getElementById('timer-seconds-input') as HTMLInputElement;
  if (!startBtn) startBtn = document.getElementById('start-timer');
  if (!pauseBtn) pauseBtn = document.getElementById('pause-timer');
  if (!resetBtn) resetBtn = document.getElementById('reset-timer');
  if (!timerSlider) timerSlider = document.getElementById('timer-slider') as HTMLInputElement;
  if (!triggerText) triggerText = document.querySelector('.timer-trigger-text');
  if (!timerTrigger) timerTrigger = document.getElementById('timer-trigger');
    
  // Update inputs
  if (minutesInput) minutesInput.value = minutes.toString();
  if (secondsInput) secondsInput.value = seconds.toString().padStart(2, '0');
    
  // Update trigger text
  if (triggerText) {
    triggerText.textContent = timerState.isRunning 
      ? `${minutes}:${seconds.toString().padStart(2, '0')}`
      : 'Avaa ajastin';
  }
    
  // Update timer button
  const timerBtn = document.getElementById('timer-btn');
  if (timerBtn) {
    const svgElement = timerBtn.querySelector('svg');
    if (svgElement) {
      if (timerState.isRunning) {
        svgElement.style.display = 'none';
        let timerText = timerBtn.querySelector('.timer-text');
        if (!timerText) {
          timerText = document.createElement('span');
          timerText.className = 'timer-text text-sm font-mono font-bold';
          timerBtn.appendChild(timerText);
        }
        timerText.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
      } else {
        svgElement.style.display = 'block';
        timerBtn.querySelector('.timer-text')?.remove();
      }
    }
    
    timerBtn.classList.toggle('timer-active', timerState.isRunning);
  }
  
  // Dispatch timer state change event for top navigation integration
  document.dispatchEvent(new CustomEvent('timerStateChanged', {
    detail: {
      isRunning: timerState.isRunning,
      totalSeconds: timerState.totalSeconds
    }
  }));
  
  // Update buttons
  if (startBtn && pauseBtn) {
    startBtn.style.display = timerState.isRunning ? 'none' : 'flex';
    pauseBtn.style.display = timerState.isRunning ? 'flex' : 'none';
  }
  
  if (resetBtn) {
    const shouldShow = !timerState.isRunning && 
      (timerState.totalSeconds !== 300 || timerState.hasCompleted);
    resetBtn.style.display = shouldShow ? 'flex' : 'none';
  }

  // Update trigger button
  if (timerTrigger) {
    timerTrigger.classList.toggle('timer-active', timerState.isRunning);
  }

  // Update slider
  if (timerSlider) {
    timerSlider.value = minutes.toString();
    updateSliderBackground();
    
    const container = document.getElementById('timer-slider-container');
    if (container) {
      container.style.display = timerState.isRunning ? 'none' : 'block';
    }
  }
}

function updateSliderBackground(): void {
  if (!timerSlider) return;
  
  const min = parseInt(timerSlider.min) || 5;
  const max = parseInt(timerSlider.max) || 90;
  const val = parseInt(timerSlider.value) || min;
  const percent = ((val - min) / (max - min)) * 100;
  
  const accent = 'var(--color-secondary-accent, #f59e42)';
  const base = 'var(--color-secondary-light, #f3f4f6)';
  timerSlider.style.background = `linear-gradient(to right, ${accent} 0%, ${accent} ${percent}%, ${base} ${percent}%, ${base} 100%)`;
}

function handleSliderChange(): void {
  if (!timerSlider) return;
  
  const minutes = Math.max(5, parseInt(timerSlider.value) || 5);
  
  if (minutesInput) minutesInput.value = minutes.toString();
  if (secondsInput) secondsInput.value = '00';
  
  timerState.totalSeconds = minutes * 60;
  timerState.hasCompleted = false;
  
  updateSliderBackground();
}

function validateInput(input: HTMLInputElement, maxValue: number | null): void {
  let value = parseInt(input.value) || 0;
  if (maxValue !== null && value > maxValue) value = maxValue;
  if (value < 0) value = 0;
  input.value = value.toString();
}

function formatInput(input: HTMLInputElement): void {
  const value = parseInt(input.value) || 0;
  input.value = input === secondsInput 
    ? value.toString().padStart(2, '0')
    : value.toString();
}

function parseTimeText(timeText: string): number {
  const text = timeText.trim().toLowerCase();
  let totalSeconds = 0;
  
  // Hours (t = tunti)
  const hourMatch = text.match(/(\d+(?:[.,]\d+)?)\s*t/i);
  if (hourMatch) {
    const hours = parseFloat(hourMatch[1].replace(',', '.'));
    totalSeconds += hours * 3600;
  }
  
  // Minutes
  const minuteMatch = text.match(/(\d+)\s*min/i);
  if (minuteMatch) {
    totalSeconds += parseInt(minuteMatch[1]) * 60;
  }
  
  // Seconds
  const secondMatch = text.match(/(\d+)\s*s/i);
  if (secondMatch) {
    totalSeconds += parseInt(secondMatch[1]);
  }
  
  // Ranges (e.g., "5-10 minuuttia")
  if (totalSeconds === 0) {
    const rangeMatch = text.match(/(\d+)-(\d+)/);
    if (rangeMatch) {
      const min = parseInt(rangeMatch[1]);
      const max = parseInt(rangeMatch[2]);
      totalSeconds = Math.floor((min + max) / 2) * 60;
    }
  }
  
  return Math.max(300, totalSeconds);
}

function startTimerFromText(timeText: string, triggerElement?: HTMLElement): void {
  const totalSeconds = parseTimeText(timeText);
  
  timerState.totalSeconds = totalSeconds;
  timerState.hasCompleted = false;
  
  // Re-setup elements in case they were replaced during navigation
  setupElements();
  
  updateUI();
  startTimer();
  
  if (triggerElement) {
    // Remove active class from all timer links
    document.querySelectorAll('.timer-link.active-timer-link')
      .forEach(link => link.classList.remove('active-timer-link'));
    triggerElement.classList.add('active-timer-link');
  }
}

function saveState(): void {
  try {
    localStorage.setItem('recipeTimerState', JSON.stringify(timerState));
  } catch (error) {
    // Silent fallback
  }
}

function restoreState(): void {
  try {
    const saved = localStorage.getItem('recipeTimerState');
    if (saved) {
      const state: TimerState = JSON.parse(saved);
      const elapsed = Math.floor((Date.now() - state.timestamp) / 1000);
      
      if (state.isRunning && state.timestamp > 0) {
        const remaining = Math.max(0, state.totalSeconds - elapsed);
        timerState.totalSeconds = remaining;
        timerState.isRunning = remaining > 0;
        timerState.hasCompleted = remaining === 0;
        
        if (timerState.isRunning) {
          // Don't call startTimer() here - just start the interval directly
          timerState.timestamp = Date.now() - (elapsed * 1000); // Adjust timestamp
          intervalId = window.setInterval(() => {
            if (timerState.totalSeconds > 0) {
              timerState.totalSeconds--;
              updateUI();
            } else {
              handleComplete();
            }
          }, 1000);
        }
      } else {
        timerState.totalSeconds = state.totalSeconds;
        timerState.isRunning = false;
        timerState.hasCompleted = state.hasCompleted;
      }
    }
  } catch (error) {
    // Silent fallback
  }
}

// Enhanced timer links handler with better error handling
function handleTimerLinkClick(e: Event): void {
  const target = e.target as HTMLElement;
  const timerLink = target.closest('.timer-link') as HTMLElement;
  
  if (!timerLink) return;
  
  // Prevent any default behavior
  e.preventDefault();
  e.stopPropagation();
  
  try {
    const timeText = timerLink.dataset.timerText || timerLink.textContent?.trim() || '';
    const totalMinutes = parseFloat(timerLink.dataset.timerMinutes || '0');
    
    if (totalMinutes > 0) {
      const totalSeconds = Math.round(totalMinutes * 60);
      timerState.totalSeconds = totalSeconds;
      timerState.hasCompleted = false;
      updateUI();
      startTimer();
      
      // Open the timer popover if available
      const timerPopover = document.getElementById('timer-popover');
      if (timerPopover && 'showPopover' in timerPopover) {
        (timerPopover as any).showPopover();
      }
      
      // Mark this timer link as active
      document.querySelectorAll('.timer-link.active-timer-link')
        .forEach(link => link.classList.remove('active-timer-link'));
      timerLink.classList.add('active-timer-link');
      
    } else if (timeText) {
      // Fallback to parsing time text
      startTimerFromText(timeText, timerLink);
    }
  } catch (error) {
    console.warn('Timer link error:', error);
  }
}

// Global function for timer links (for backward compatibility)
if (typeof window !== 'undefined') {
  (window as any).startTimerFromText = startTimerFromText;
}

// Initialize when DOM is ready
if (typeof document !== 'undefined') {
  // Set up timer links event listener with better error handling
  document.addEventListener('click', handleTimerLinkClick, { 
    capture: true, // Use capture phase to ensure we catch it first
    passive: false  // Allow preventDefault
  });
  
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initTimer);
  } else {
    // Use setTimeout to ensure DOM is fully ready
    setTimeout(initTimer, 0);
  }
  
  // Reinitialize on view transitions (Astro)
  document.addEventListener('astro:page-load', () => {
    // Small delay to ensure DOM is updated
    setTimeout(initTimer, 10);
  });
}

export default { initTimer };