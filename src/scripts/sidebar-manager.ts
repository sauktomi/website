/**
 * Sidebar Manager
 * 
 * Handles the sidebar popup behavior for recipe pages.
 * On desktop: positions sidebar absolutely to the right
 * On mobile: shows as a popup with trigger button
 */

// Initialize sidebar functionality
function initSidebar(): void {
  setupSidebarBehavior();
}

function setupSidebarBehavior(): void {
  const sidebar = document.getElementById('recipe-sidebar') as HTMLElement;
  const trigger = document.getElementById('sidebar-trigger') as HTMLElement;
  
  if (!sidebar) return;
  
  // On desktop, show sidebar by default
  if (window.innerWidth >= 768) {
    // For desktop, show the popover so it's positioned relative to the anchor
    if (!sidebar.matches(':popover-open')) {
      sidebar.showPopover();
    }
  }
  
  // Handle window resize
  let resizeTimeout: number;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = window.setTimeout(() => {
      if (window.innerWidth >= 768) {
        // Desktop: ensure sidebar is visible
        if (!sidebar.matches(':popover-open')) {
          sidebar.showPopover();
        }
      } else {
        // Mobile: hide sidebar if open
        if (sidebar.matches(':popover-open')) {
          sidebar.hidePopover();
        }
      }
    }, 100); // Debounce resize events
  });
  
  // Handle popover state changes
  sidebar.addEventListener('toggle', (event) => {
    const isOpen = (event.target as HTMLElement).matches(':popover-open');
    
    // Update trigger button state on mobile
    if (trigger) {
      trigger.classList.toggle('active', isOpen);
    }
  });
  
  // Close sidebar when clicking outside on mobile
  document.addEventListener('click', (event) => {
    if (window.innerWidth < 768) {
      const target = event.target as HTMLElement;
      if (!sidebar.contains(target) && !trigger?.contains(target)) {
        sidebar.hidePopover();
      }
    }
  });
}

// Initialize when DOM is ready
if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSidebar);
  } else {
    initSidebar();
  }
}

export default { initSidebar }; 