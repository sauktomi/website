/**
 * Top Navigation Manager
 * 
 * Handles the universal top navigation bar functionality for all pages.
 * Features:
 * - Desktop: Shows full navigation with dynamic buttons
 * - Mobile: Shows condensed content with timer and dynamic buttons
 * - Toggle functionality to show/hide content
 * - Dynamic button pinning from popup content
 * - Timer integration for recipe pages
 * - Back navigation and menu toggle
 * 
 * @author Tomi
 * @version 2.0.0
 */

interface DynamicButton {
  id: string;
  label: string;
  href: string;
  icon?: string;
}

// Global state
let topNavState = {
  dynamicButtons: new Map<string, DynamicButton>(),
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
  
  // Listen for dynamic button pinning
  document.addEventListener('pinButton', handlePinButton as EventListener);
  document.addEventListener('unpinButton', handleUnpinButton as EventListener);
  
  // Add pin buttons to navigation popover links
  addPinButtonsToSidebarLinks();
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

function handlePinButton(event: CustomEvent): void {
  const { id, label, href, icon } = event.detail;
  
  const dynamicButton: DynamicButton = {
    id,
    label,
    href,
    icon
  };
  
  topNavState.dynamicButtons.set(id, dynamicButton);
  updateDynamicButtons();
  
  // Save to localStorage
  saveDynamicButtons();
  
  // Update pin button state in navigation popover
  updatePinButtonState(id, true);
}

function handleUnpinButton(event: CustomEvent): void {
  const { id } = event.detail;
  
  topNavState.dynamicButtons.delete(id);
  updateDynamicButtons();
  
  // Save to localStorage
  saveDynamicButtons();
  
  // Update pin button state in navigation popover
  updatePinButtonState(id, false);
}

function updateDynamicButtons(): void {
  const dynamicButtonsContainer = document.getElementById('dynamic-buttons');
  if (!dynamicButtonsContainer) return;
  
  // Clear existing buttons
  dynamicButtonsContainer.innerHTML = '';
  
  // Add dynamic buttons
  topNavState.dynamicButtons.forEach((button, id) => {
    const buttonElement = document.createElement('button');
    buttonElement.className = 'dynamic-button';
    buttonElement.setAttribute('data-button-id', id);
    buttonElement.setAttribute('aria-label', button.label);
    
    if (button.icon) {
      buttonElement.innerHTML = `<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">${button.icon}</svg>`;
    } else {
      buttonElement.textContent = button.label.charAt(0).toUpperCase();
    }
    
    buttonElement.addEventListener('click', () => {
      // Scroll to the target element
      const targetElement = document.querySelector(button.href);
      if (targetElement) {
        targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
    
    dynamicButtonsContainer.appendChild(buttonElement);
  });
}

function saveDynamicButtons(): void {
  try {
    const buttonsArray = Array.from(topNavState.dynamicButtons.entries());
    localStorage.setItem('dynamicButtons', JSON.stringify(buttonsArray));
  } catch (error) {
    // Silent fallback
  }
}

function loadDynamicButtons(): void {
  try {
    const saved = localStorage.getItem('dynamicButtons');
    if (saved) {
      const buttonsArray = JSON.parse(saved);
      topNavState.dynamicButtons = new Map(buttonsArray);
      updateDynamicButtons();
    }
  } catch (error) {
    // Silent fallback
  }
}

function addPinButtonsToSidebarLinks(): void {
  // Function to add pin buttons to links in the navigation popover
  const addPinButtonsToLinks = () => {
    const navigationLinks = document.querySelectorAll('#navigation-popover .sidebar-card-content a[href^="#"]');
    
    navigationLinks.forEach((link) => {
      const href = link.getAttribute('href');
      const text = link.textContent?.trim();
      
      if (!href || !text) return;
      
      // Skip if pin button already exists
      if (link.querySelector('.pin-button')) return;
      
      // Create pin button
      const pinButton = document.createElement('button');
      pinButton.className = 'pin-button mr-2 p-1 rounded transition-colors duration-200';
      
      // Check if already pinned
      const isPinned = topNavState.dynamicButtons.has(href);
      
      // Set initial state
      if (isPinned) {
        pinButton.innerHTML = '<svg class="w-3 h-3 text-primary-accent" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>';
        pinButton.classList.add('text-primary-accent');
        pinButton.setAttribute('aria-label', `Poista kiinnitys ${text}`);
        pinButton.setAttribute('title', `Poista kiinnitys ${text}`);
      } else {
        pinButton.innerHTML = '<svg class="w-3 h-3 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"/></svg>';
        pinButton.classList.add('text-primary');
        pinButton.setAttribute('aria-label', `Kiinnitä ${text} palkkiin`);
        pinButton.setAttribute('title', `Kiinnitä ${text} palkkiin`);
      }
      
      // Add click handler
      pinButton.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        // Check current state dynamically
        const currentlyPinned = topNavState.dynamicButtons.has(href);
        
        if (currentlyPinned) {
          // Unpin
          document.dispatchEvent(new CustomEvent('unpinButton', {
            detail: { id: href }
          }));
        } else {
          // Pin
          document.dispatchEvent(new CustomEvent('pinButton', {
            detail: { id: href, label: text, href: href }
          }));
        }
      });
      
      // Insert pin button before the link text
      link.insertBefore(pinButton, link.firstChild);
    });
  };

  // Add pin buttons when navigation popover is shown
  const navigationPopover = document.getElementById('navigation-popover');
  if (navigationPopover) {
    navigationPopover.addEventListener('toggle', (e) => {
      const toggleEvent = e as ToggleEvent;
      if (toggleEvent.newState === 'open') {
        // Small delay to ensure DOM is ready
        setTimeout(addPinButtonsToLinks, 10);
      }
    });
  }

  // Also add on initial load in case popover is already open
  addPinButtonsToLinks();
}

function updatePinButtonState(id: string, isPinned: boolean): void {
  // Find the pin button for this link in the navigation popover
  const navigationPopover = document.getElementById('navigation-popover');
  if (!navigationPopover) return;
  
  const link = navigationPopover.querySelector(`a[href="${id}"]`);
  if (!link) return;
  
  const pinButton = link.querySelector('.pin-button') as HTMLButtonElement;
  if (!pinButton) return;
  
  // Update pin button appearance
  if (isPinned) {
    pinButton.innerHTML = '<svg class="w-3 h-3 text-primary-accent" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>';
    pinButton.classList.remove('text-primary');
    pinButton.classList.add('text-primary-accent');
    pinButton.setAttribute('aria-label', `Poista kiinnitys ${link.textContent?.trim()}`);
    pinButton.setAttribute('title', `Poista kiinnitys ${link.textContent?.trim()}`);
  } else {
    pinButton.innerHTML = '<svg class="w-3 h-3 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"/></svg>';
    pinButton.classList.remove('text-primary-accent');
    pinButton.classList.add('text-primary');
    pinButton.setAttribute('aria-label', `Kiinnitä ${link.textContent?.trim()} palkkiin`);
    pinButton.setAttribute('title', `Kiinnitä ${link.textContent?.trim()} palkkiin`);
  }
}

function updateTopNavigationState(): void {
  // Load dynamic buttons
  loadDynamicButtons();
}

// Global functions for external use
if (typeof window !== 'undefined') {
  (window as any).pinButton = (id: string, label: string, href: string, icon?: string) => {
    document.dispatchEvent(new CustomEvent('pinButton', {
      detail: { id, label, href, icon }
    }));
  };
  
  (window as any).unpinButton = (id: string) => {
    document.dispatchEvent(new CustomEvent('unpinButton', {
      detail: { id }
    }));
  };
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