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

// DOM elements
let timerPopover: HTMLElement | null = null;
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
  restoreState();
  setupEventListeners();
  updateUI();
}

function setupElements(): void {
  timerPopover = document.getElementById('timer-popover');
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
  startBtn?.addEventListener('click', startTimer);
  pauseBtn?.addEventListener('click', pauseTimer);
  resetBtn?.addEventListener('click', resetTimer);
  timerSlider?.addEventListener('input', handleSliderChange);
  
  minutesInput?.addEventListener('input', () => validateInput(minutesInput!, null));
  secondsInput?.addEventListener('input', () => validateInput(secondsInput!, 59));
  minutesInput?.addEventListener('blur', () => formatInput(minutesInput!));
  secondsInput?.addEventListener('blur', () => formatInput(secondsInput!));
  
  // Timer links
  document.addEventListener('click', (e) => {
    const target = e.target as HTMLElement;
    if (target.classList.contains('timer-link')) {
      e.preventDefault();
      const timeText = target.dataset.timerText || target.textContent || '';
      startTimerFromText(timeText, target);
    }
  });
}

function startTimer(): void {
  if (timerState.isRunning) return;
  
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
    new Audio('/sounds/timer-alarm.mp3').play().catch(() => {});
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
    
    // Update inputs
  if (minutesInput) minutesInput.value = minutes.toString();
  if (secondsInput) secondsInput.value = seconds.toString().padStart(2, '0');
    
    // Update trigger text
  if (triggerText) {
    triggerText.textContent = timerState.isRunning 
      ? `${minutes}:${seconds.toString().padStart(2, '0')}`
      : 'Avaa ajastin';
    }
    
  // Update mobile timer
    const mobileTimerBtn = document.getElementById('kitchen-timer');
    if (mobileTimerBtn) {
      const svgElement = mobileTimerBtn.querySelector('svg');
      if (svgElement) {
      if (timerState.isRunning) {
          svgElement.style.display = 'none';
          let timerText = mobileTimerBtn.querySelector('.mobile-timer-text');
          if (!timerText) {
            timerText = document.createElement('span');
            timerText.className = 'mobile-timer-text text-sm font-mono font-bold';
            mobileTimerBtn.appendChild(timerText);
          }
          timerText.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
        } else {
          svgElement.style.display = 'block';
        mobileTimerBtn.querySelector('.mobile-timer-text')?.remove();
          }
        }
    
    mobileTimerBtn.classList.toggle('timer-active', timerState.isRunning);
  }
  
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
  
  updateUI();
  startTimer();
  
  if (triggerElement) {
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

// Global function for timer links
if (typeof window !== 'undefined') {
  (window as any).startTimerFromText = startTimerFromText;
    }

// Initialize when DOM is ready
if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initTimer);
  } else {
    initTimer();
  }
}

export default { initTimer }; 