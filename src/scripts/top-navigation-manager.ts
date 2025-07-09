/**
 * Top Navigation Manager
 * 
 * Handles the universal top navigation bar functionality for all pages.
 * Features:
 * - Desktop: Shows full navigation
 * - Mobile: Shows condensed content with timer
 * - Toggle functionality to show/hide content
 * - Timer integration for recipe pages
 * - Back navigation and menu toggle
 * 
 * @author Tomi
 * @version 2.0.0
 */

// Global state
let topNavState = {
  isMobile: false
};

// Initialize top navigation functionality
function initTopNavigation(): void {
  setupTopNavigationElements();
  setupEventListeners();
  updateTopNavigationState();
}

function setupTopNavigationElements(): void {
  // Set initial state based on screen size
  topNavState.isMobile = window.innerWidth < 768;
}

function setupEventListeners(): void {
  // Window resize
  window.addEventListener('resize', handleResize);
  
  // Listen for timer state changes
  document.addEventListener('timerStateChanged', handleTimerStateChange as EventListener);
}



function handleResize(): void {
  // Update mobile state for potential future use
  topNavState.isMobile = window.innerWidth < 768;
}

function handleTimerStateChange(event: CustomEvent): void {
  const { isRunning, totalSeconds } = event.detail;
  updateTimerButton(isRunning, totalSeconds);
}

function updateTimerButton(isRunning: boolean, totalSeconds: number): void {
  const timerBtn = document.getElementById('timer-btn');
  if (!timerBtn) return;
  
  // Timer button is always visible
  timerBtn.style.display = 'flex';
  
  if (isRunning) {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    const timerText = timerBtn.querySelector('.timer-text');
    
    if (timerText) {
      timerText.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }
    
    timerBtn.classList.add('timer-active');
  } else {
    const timerText = timerBtn.querySelector('.timer-text');
    if (timerText) {
      timerText.textContent = 'Ajastin';
    }
    
    timerBtn.classList.remove('timer-active');
  }
}



function updateTopNavigationState(): void {
  // No dynamic buttons to load
}

// Initialize when DOM is ready
if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initTopNavigation);
  } else {
    initTopNavigation();
  }
}

export default { initTopNavigation }; 