/**
 * Recipe Interactions Manager
 * 
 * Manages interactive features and enhancements for recipe pages.
 * Handles ingredient popovers, progress tracking, mobile controls,
 * and recipe-specific functionality.
 * 
 * Features:
 * - Ingredient popover system with native HTML Popover API
 * - Recipe progress tracking and step navigation
 * - Mobile-optimized interface controls
 * - Keyboard navigation and accessibility
 * - Recipe metadata display and management
 * - Interactive cooking instructions
 * 
 * Components:
 * - Ingredient popovers with detailed information
 * - Progress tracking for recipe steps
 * - Mobile bottom toolbar with essential controls
 * - Recipe metadata display
 * - Interactive instruction elements
 * 
 * Integration:
 * - Native HTML Popover API for ingredient information
 * - View transitions for smooth navigation
 * - Touch-friendly mobile interface
 * - Screen reader accessibility
 * 
 * @author Tomi
 * @version 2.0.0
 */

// Recipe Interactions Module
// Extracted from src/pages/reseptit/[...slug].astro
// Optimized for performance with lazy initialization and debounced operations

interface EventListenerTracker {
  element: Element | Document | Window;
  event: string;
  handler: EventListener;
}

interface NavigationHandler {
  event: string;
  handler: EventListener;
}

interface MiseEnPlaceState {
  [taskText: string]: boolean;
}

declare global {
  interface Window {
    RecipeInteractionManager: typeof RecipeInteractionManager;
    globalRecipeManager: RecipeInteractionManager | null;
    RecipeSharing?: { init(): void };
    RecipeNavigation?: { init(): void };
    requestIdleCallback: (callback: IdleRequestCallback, options?: IdleRequestOptions) => number;
    cancelIdleCallback: (id: number) => void;
  }
  
  interface HTMLElement {
    _sectionContent?: Element[];
  }
}

class RecipeInteractionManager {
  private completedSteps: Set<string>;
  private recipeSlug: string;
  private storageKey: string;
  private isInitialLoad: boolean;
  private handleResize: EventListener | null;
  private timeoutIds: number[];
  private eventListeners: EventListenerTracker[];
  private idleCallbackIds: number[];
  private isInitialized: boolean;

  constructor() {
    this.completedSteps = new Set<string>();
    this.recipeSlug = '';
    this.storageKey = '';
    this.isInitialLoad = true;
    this.handleResize = null;
    this.timeoutIds = [];
    this.eventListeners = [];
    this.idleCallbackIds = [];
    this.isInitialized = false;
  }

  init(): void {
    if (this.isInitialized) return;
    
    this.recipeSlug = window.location.pathname.split('/').pop() || 'unknown-recipe';
    this.storageKey = `recipe-steps-${this.recipeSlug}`;
    
    // Critical initialization - run immediately
    this.loadCompletionStates();
    this.initializeInstructionSteps();
    
    // Non-critical features - defer to idle time
    this.deferNonCriticalInit();
    
    // Mark initial load as complete after a short delay
    const timeoutId = window.setTimeout(() => {
      this.isInitialLoad = false;
    }, 500);
    this.timeoutIds.push(timeoutId);
    
    this.isInitialized = true;
  }

  private deferNonCriticalInit(): void {
    const initFeatures = () => {
      this.initializeMiseEnPlace();
      this.initializeModules();
    };

    if (window.requestIdleCallback) {
      const idleId = window.requestIdleCallback(initFeatures, { timeout: 2000 });
      this.idleCallbackIds.push(idleId);
    } else {
      const timeoutId = window.setTimeout(initFeatures, 100);
      this.timeoutIds.push(timeoutId);
    }
  }

  // Debounced save operation to reduce localStorage writes
  private debouncedSave = this.debounce(() => {
    this.saveCompletionStates();
  }, 300);

  private debounce<T extends (...args: any[]) => any>(func: T, wait: number): (...args: Parameters<T>) => void {
    let timeout: NodeJS.Timeout;
    return function executedFunction(this: unknown, ...args: Parameters<T>) {
      const later = () => {
        clearTimeout(timeout);
        func.apply(this, args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  private loadCompletionStates(): void {
    try {
      const saved = localStorage.getItem(this.storageKey);
      if (saved) {
        this.completedSteps = new Set(JSON.parse(saved));
      }
    } catch (error) {
      console.warn('Failed to load instruction step states:', error);
    }
  }

  private saveCompletionStates(): void {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(Array.from(this.completedSteps)));
    } catch (error) {
      console.warn('Failed to save instruction step states:', error);
    }
  }





  private initializeInstructionSteps(): void {
    const instructionLists = document.querySelectorAll('.recipe-body .recipe-instruction-steps');
    
    instructionLists.forEach((list, listIndex) => {
      const steps = list.querySelectorAll('li');
      
      steps.forEach((step, stepIndex) => {
        const stepId = this.getStepId(step, listIndex, stepIndex);
        
        step.setAttribute('data-step-id', stepId);
        
        if (this.completedSteps.has(stepId)) {
          step.classList.add('step-completed');
        }
        
        // Add mousemove listener for hover effects on step number area
        step.addEventListener('mousemove', (e: MouseEvent) => {
          const rect = step.getBoundingClientRect();
          const mouseX = e.clientX;
          const mouseY = e.clientY;
          
          let isInNumberArea = false;
          
          // Grid layout: step number is in the first column, but only the actual number area is clickable
          const numberAreaWidth = window.innerWidth < 768 ? 40 : 48; // w-10 on mobile, w-12 on desktop
          const numberAreaHeight = window.innerWidth < 768 ? 40 : 48; // h-10 on mobile, h-12 on desktop
          
          // Check if mouse is in the actual step number area (not the entire left column)
          isInNumberArea = mouseX >= rect.left && mouseX <= rect.left + numberAreaWidth &&
                          mouseY >= rect.top && mouseY <= rect.top + numberAreaHeight;
          
          if (isInNumberArea) {
            (step as HTMLElement).style.cursor = 'pointer';
          } else {
            (step as HTMLElement).style.cursor = 'default';
          }
        });
        
        step.addEventListener('mouseleave', () => {
          (step as HTMLElement).style.cursor = 'default';
        });
        
        step.addEventListener('click', (e: MouseEvent) => {
          e.stopPropagation();
          
          const target = e.target as HTMLElement;
          

          
          // Don't handle clicks on other interactive elements or figures (from remarkFigureCaption)
          if (target.closest('button') || 
              target.closest('a') || 
              target.closest('input') ||
              target.closest('figure') ||
              target.closest('img')) {
            return;
          }
          
          // Use requestAnimationFrame for immediate visual feedback
          requestAnimationFrame(() => {
            // Calculate if click is in the step number area (flexbox layout)
            const rect = step.getBoundingClientRect();
            const clickX = e.clientX;
            const clickY = e.clientY;
            
            // Step number area dimensions based on grid CSS
            const numberAreaWidth = window.innerWidth < 768 ? 40 : 48; // w-10 on mobile, w-12 on desktop
            const numberAreaHeight = window.innerWidth < 768 ? 40 : 48; // h-10 on mobile, h-12 on desktop
            
            // Check if click is within the actual step number area (not the entire left column)
            const isInNumberArea = clickX >= rect.left && clickX <= rect.left + numberAreaWidth &&
                                 clickY >= rect.top && clickY <= rect.top + numberAreaHeight;
            
            if (!isInNumberArea) {
              return; // Only handle clicks in the step number area
            }
            
            const isCompleted = step.classList.contains('step-completed');
            
            // Immediate visual feedback
            if (isCompleted) {
              step.classList.remove('step-completed');
              this.completedSteps.delete(stepId);
            } else {
              step.classList.add('step-completed');
              this.completedSteps.add(stepId);
            }
            
            // Defer heavy operations
            if ('requestIdleCallback' in window) {
              (window as any).requestIdleCallback(() => {
                this.debouncedSave();
                this.updateStepProgress();
              }, { timeout: 100 });
            } else {
              setTimeout(() => {
                this.debouncedSave();
                this.updateStepProgress();
              }, 0);
            }
          });
        });
      });
    });
    
    this.updateStepProgress();
    this.setupProgressPopup();
  }

  private getStepId(step: Element, listIndex: number, stepIndex: number): string {
    const stepText = step.textContent?.trim() || '';
    const truncatedText = stepText.substring(0, 50);
    return `step-${listIndex}-${stepIndex}-${truncatedText.replace(/[^a-zA-Z0-9]/g, '-')}`;
  }

  private updateStepProgress(): void {
    this.updateProgressDisplay();
    this.updateSectionCompletion();
  }

  private updateProgressDisplay(): void {
    const sectionHeaders = document.querySelectorAll('.recipe-body .recipe-section--instructions h4');
    
    const progressFractionMobile = document.getElementById('progress-fraction-mobile');
    const sidebarProgressLabel = document.getElementById('sidebar-progress-label');
    const sidebarProgressList = document.getElementById('sidebar-progress-list');
    const sidebarProgressContainer = document.getElementById('sidebar-progress');
    
    if (sectionHeaders.length > 0) {
      const completedSections = document.querySelectorAll('.recipe-body .recipe-section--instructions h4.section-completed').length;
      const fractionText = `${completedSections}/${sectionHeaders.length}`;
      
      if (progressFractionMobile) progressFractionMobile.textContent = fractionText;
      
      // Update pre-rendered section progress items
      const sectionProgressItems = document.querySelectorAll('.section-progress-item');
      sectionProgressItems.forEach((item, index) => {
        const indicator = item.querySelector('.section-progress-indicator') as HTMLElement;
        const title = item.querySelector('.section-progress-title') as HTMLElement;
        const correspondingHeader = sectionHeaders[index] as HTMLElement;
        
        if (correspondingHeader && indicator && title) {
          const isCompleted = correspondingHeader.classList.contains('section-completed');
          
          // Update item styling
          if (isCompleted) {
            item.className = 'section-progress-item flex items-center gap-3 p-2 rounded-lg bg-green-50 border border-green-200 hover:bg-green-100 no-underline border-none';
            indicator.className = 'section-progress-indicator w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold bg-green-500 text-primary-light';
            indicator.textContent = '✓';
            title.className = 'section-progress-title text-sm text-green-800 font-medium';
          } else {
            item.className = 'section-progress-item flex items-center gap-3 p-2 rounded-lg no-underline border-none';
            indicator.className = 'section-progress-indicator w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold bg-secondary text-secondary-accent';
            indicator.textContent = (index + 1).toString();
            title.className = 'section-progress-title text-sm text-primary-dark';
          }
        }
      });
      
      // Mobile progress visibility is now handled by CSS only
      if (sidebarProgressContainer) {
        sidebarProgressContainer.classList.add('vis-block');
      }
    } else {
      const totalSteps = document.querySelectorAll('.recipe-body .recipe-instruction-steps .recipe-instruction-step').length;
      const completedStepsCount = this.completedSteps.size;
      const fractionText = `${completedStepsCount}/${totalSteps}`;
      
      if (progressFractionMobile) progressFractionMobile.textContent = fractionText;
      if (sidebarProgressLabel) sidebarProgressLabel.textContent = 'Askeleet';
      
      if (sidebarProgressList) {
        let listContent = `
          <div class="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div class="flex items-center justify-between mb-2">
              <span class="text-blue-800 font-medium text-sm">Suoritettu</span>
              <span class="text-blue-600 text-lg font-bold">${completedStepsCount}/${totalSteps}</span>
            </div>
            <div class="w-full bg-blue-200 rounded-full h-2">
              <div class="bg-blue-500 h-2 rounded-full transition-all duration-300" style="width: ${totalSteps > 0 ? (completedStepsCount / totalSteps) * 100 : 0}%"></div>
            </div>
          </div>
        `;
        
        if (completedStepsCount < totalSteps) {
          listContent += `
            <p class="text-xs text-secondary-accent mt-2 px-1">
              Jäljellä ${totalSteps - completedStepsCount} askelta
            </p>
          `;
        } else if (totalSteps > 0) {
          listContent += `
            <p class="text-xs text-green font-medium mt-2 px-1">
              🎉 Kaikki askeleet suoritettu!
            </p>
          `;
        }
        
        sidebarProgressList.innerHTML = listContent;
      }
      
      // Mobile progress visibility is now handled by CSS only
      if (sidebarProgressContainer) {
        if (completedStepsCount > 0) {
          sidebarProgressContainer.classList.add('vis-block');
        } else {
          sidebarProgressContainer.classList.remove('vis-block');
        }
      }
    }
  }



  private updateSectionCompletion(): void {
    const sectionHeaders = document.querySelectorAll('.recipe-body .recipe-section--instructions h4');
    
    sectionHeaders.forEach(header => {
      const headerElement = header as HTMLElement;
      let nextElement = headerElement.nextElementSibling;
      let correspondingList: HTMLOListElement | null = null;
      const sectionContent: Element[] = [];
      
      while (nextElement) {
        if (nextElement.tagName === 'H4' || nextElement.tagName === 'H3' || nextElement.tagName === 'H2') {
          break;
        }
        
        sectionContent.push(nextElement);
        
        if (nextElement.classList.contains('recipe-instruction-steps')) {
          correspondingList = nextElement as HTMLOListElement;
        }
        
        nextElement = nextElement.nextElementSibling;
      }
      
      if (headerElement.hasAttribute('data-toggle-handler')) {
        headerElement._sectionContent = sectionContent;
      }
      
      if (correspondingList) {
        const stepsInSection = correspondingList.querySelectorAll('.recipe-instruction-step');
        const completedStepsInSection = correspondingList.querySelectorAll('.recipe-instruction-step.step-completed');
        
        const wasCompleted = headerElement.classList.contains('section-completed');
        const isNowCompleted = stepsInSection.length > 0 && completedStepsInSection.length === stepsInSection.length;
        
        if (!headerElement.hasAttribute('data-toggle-handler')) {
          headerElement.setAttribute('data-toggle-handler', 'true');
          
          headerElement.addEventListener('click', (e: MouseEvent) => {
            const rect = headerElement.getBoundingClientRect();
            const clickX = e.clientX;
            const clickY = e.clientY;
            
            const buttonLeft = rect.right - 44;
            const buttonRight = rect.right - 12;
            const buttonTop = rect.top + (rect.height / 2) - 16;
            const buttonBottom = rect.top + (rect.height / 2) + 16;
            
            const clickedOnButton = clickX >= buttonLeft && clickX <= buttonRight && 
                                   clickY >= buttonTop && clickY <= buttonBottom;
            
            if (!headerElement.classList.contains('section-completed')) {
              return;
            }
            
            if (clickedOnButton) {
              const isCollapsed = headerElement.classList.contains('section-collapsed');
              
              if (!isCollapsed) {
                this.uncheckAllStepsInSection(headerElement);
                return;
              }
            }
            
            const isCollapsed = headerElement.classList.contains('section-collapsed');
            const storedContent = headerElement._sectionContent;
            
            if (!storedContent || storedContent.length === 0) {
              console.warn('No stored content found for section:', headerElement.textContent);
              return;
            }
            
            if (isCollapsed) {
              headerElement.classList.remove('section-collapsed');
              storedContent.forEach((element) => {
                element.classList.remove('section-content-collapsed');
                element.classList.add('section-content-expanded');
              });
            } else {
              this.smoothCollapseSection(headerElement, storedContent, false);
            }
          });
        }
        
        headerElement._sectionContent = sectionContent;
        
        if (isNowCompleted) {
          headerElement.classList.add('section-completed');
          
          if (!wasCompleted) {
            // Only auto-scroll if this is not the initial page load
            this.smoothCollapseSection(headerElement, sectionContent, !this.isInitialLoad);
          }
          
          this.updateProgressDisplay();
        } else {
          headerElement.classList.remove('section-completed', 'section-collapsed', 'section-background-applied');
          
          sectionContent.forEach(element => {
            element.classList.remove('section-content-collapsed');
            element.classList.add('section-content-expanded');
          });
          
          this.updateProgressDisplay();
        }
      }
    });
  }

  private uncheckAllStepsInSection(header: HTMLElement): void {
    const storedContent = header._sectionContent;
    if (!storedContent) return;
    
    storedContent.forEach((element) => {
      if (element.classList.contains('recipe-instruction-steps')) {
        const steps = element.querySelectorAll('.recipe-instruction-step[data-step-id]');
        steps.forEach((step) => {
          const stepElement = step as HTMLElement;
          const stepId = stepElement.getAttribute('data-step-id');
          
          if (stepId && stepElement.classList.contains('step-completed')) {
            stepElement.classList.remove('step-completed');
            this.completedSteps.delete(stepId);
          }
        });
      }
    });
    
    this.debouncedSave();
    this.updateStepProgress();
  }

  private smoothCollapseSection(header: HTMLElement, sectionContent: Element[], shouldScrollToHeader: boolean = false): void {
    header.classList.add('section-collapsing');
    header.classList.add('section-collapsed');
    
    sectionContent.forEach(element => {
      element.classList.add('section-content-collapsed');
      element.classList.remove('section-content-expanded');
    });
    
    if (shouldScrollToHeader) {
      const timeoutId = window.setTimeout(() => {
        const headerTop = header.offsetTop;
        const viewportHeight = window.innerHeight;
        
        const targetScrollY = Math.max(0, headerTop - (viewportHeight * 0.25));
        
        window.scrollTo({
          top: targetScrollY,
          behavior: 'smooth'
        });
      }, 100);
      this.timeoutIds.push(timeoutId);
      
      const timeoutId2 = window.setTimeout(() => {
        header.classList.add('section-background-applied');
      }, 800);
      this.timeoutIds.push(timeoutId2);
    } else {
      header.classList.add('section-background-applied');
    }
    
    const timeoutId3 = window.setTimeout(() => {
      header.classList.remove('section-collapsing');
    }, 500);
    this.timeoutIds.push(timeoutId3);
  }

  private setupProgressPopup(): void {
    const mobileProgressButton = document.getElementById('step-progress') as HTMLElement;
    if (mobileProgressButton) {
      mobileProgressButton.addEventListener('click', (e: Event) => {
        e.preventDefault();
        e.stopPropagation();
        
        // Toggle functionality - check if panel is already open
        const existingPanel = document.getElementById('progress-panel');
        if (existingPanel) {
          // Panel is open, close it
          const backdrop = existingPanel.querySelector('.backdrop-blur-sm') as HTMLElement;
          if (backdrop) {
            backdrop.click(); // Trigger the close handler
          }
        } else {
          // Panel is closed, open it
          this.showProgressPopup();
        }
      });
      mobileProgressButton.style.cursor = 'pointer';
      mobileProgressButton.setAttribute('title', 'Näytä edistyminen');
    }
  }

  private showProgressPopup(): void {
    const sectionHeaders = document.querySelectorAll('.recipe-body .recipe-section--instructions h4');
    
    let panelContent = '';
    
    if (sectionHeaders.length > 0) {
      panelContent = '<h3 class="text-xl font-semibold mb-6 text-primary-dark">Reseptin edistyminen</h3>';
      panelContent += '<div class="space-y-3">';
      
      sectionHeaders.forEach((header, index) => {
        const headerElement = header as HTMLElement;
        const isCompleted = headerElement.classList.contains('section-completed');
        const sectionTitle = headerElement.textContent?.trim() || `Osio ${index + 1}`;
        const headerId = headerElement.id || headerElement.getAttribute('id');
        const linkHref = headerId ? `#${headerId}` : '#';
        
        panelContent += `
          <a href="${linkHref}" class="flex items-center gap-4 p-4 rounded-lg ${isCompleted ? 'bg-green-50 border border-green-200 hover:bg-green-100' : 'bg-primary-light border border-secondary-light hover:bg-secondary-light'} no-underline border-none">
            <div class="w-8 h-8 rounded-full flex items-center justify-center ${isCompleted ? 'bg-green-500 text-primary-light' : 'bg-secondary text-secondary-accent'} font-semibold">
              ${isCompleted ? '✓' : (index + 1)}
            </div>
            <span class="${isCompleted ? 'text-green-800 font-medium' : 'text-primary-dark'} text-base">${sectionTitle}</span>
          </a>
        `;
      });
      
      panelContent += '</div>';
    } else {
      const totalSteps = document.querySelectorAll('.recipe-body .recipe-instruction-steps .recipe-instruction-step').length;
      const completedStepsCount = this.completedSteps.size;
      
      panelContent = '<h3 class="text-xl font-semibold mb-6 text-primary-dark">Askelten edistyminen</h3>';
      panelContent += `
        <div class="mb-6 p-6 bg-blue-50 border border-blue-200 rounded-lg">
          <div class="flex items-center justify-between mb-3">
            <span class="text-blue-800 font-medium text-lg">Suoritettu</span>
            <span class="text-blue-600 text-2xl font-bold">${completedStepsCount}/${totalSteps}</span>
          </div>
          <div class="w-full bg-blue-200 rounded-full h-3">
            <div class="bg-blue-500 h-3 rounded-full transition-all duration-300" style="width: ${totalSteps > 0 ? (completedStepsCount / totalSteps) * 100 : 0}%"></div>
          </div>
        </div>
      `;
      
      if (completedStepsCount < totalSteps) {
        panelContent += `
          <p class="text-base text-secondary-accent leading-relaxed">
            Jäljellä ${totalSteps - completedStepsCount} askelta. Klikkaa askelia merkitäksesi ne tehdyiksi.
          </p>
        `;
      } else if (totalSteps > 0) {
        panelContent += `
          <p class="text-base text-green font-medium leading-relaxed">
            🎉 Kaikki askeleet suoritettu!
          </p>
        `;
      }
    }
    
    // Remove existing progress panel if it exists
    const existingPanel = document.getElementById('progress-panel');
    if (existingPanel) {
      existingPanel.remove();
      return;
    }
    
    const panel = document.createElement('div');
    panel.id = 'progress-panel';
    panel.className = 'fixed bottom-0 left-0 right-0 z-50 h-full pointer-events-none transition-transform duration-300 ease-in-out';
    panel.style.transform = 'translateY(100%)';
    
    panel.innerHTML = `
      <!-- Blur backdrop -->
      <div class="absolute inset-0 backdrop-blur-sm pointer-events-auto opacity-0 transition-opacity duration-300" style="backdrop-filter: blur(2px);"></div>
      
      <!-- Progress panel -->
      <div class="bg-secondary-light h-full shadow-2xl border-t border-secondary-light pointer-events-auto relative overflow-y-auto panel-wrapper">
        <div class="p-6 panel-content">    
          <div class="max-w-md mx-auto">
            ${panelContent}
          </div>
        </div>
      </div>
    `;
    
    document.body.appendChild(panel);
    
    // Animate panel in
    const timeoutId = window.setTimeout(() => {
      panel.style.transform = 'translateY(0)';
      const backdrop = panel.querySelector('.backdrop-blur-sm') as HTMLElement;
      if (backdrop) {
        backdrop.style.opacity = '1';
      }
    }, 10);
    this.timeoutIds.push(timeoutId);
    
    // Setup close handlers
    const closeBtn = panel.querySelector('.close-panel') as HTMLElement;
    const backdrop = panel.querySelector('.backdrop-blur-sm') as HTMLElement;
    
    const closePanel = () => {
      panel.style.transform = 'translateY(100%)';
      const backdrop = panel.querySelector('.backdrop-blur-sm') as HTMLElement;
      if (backdrop) {
        backdrop.style.opacity = '0';
      }
      const timeoutId = window.setTimeout(() => {
        if (panel.parentNode) {
          panel.parentNode.removeChild(panel);
        }
      }, 300);
      this.timeoutIds.push(timeoutId);
    };
    
    closeBtn?.addEventListener('click', closePanel);
    backdrop?.addEventListener('click', closePanel);
    
    // Close panel when clicking on section links
    const sectionLinks = panel.querySelectorAll('a[href^="#"]');
    sectionLinks.forEach(link => {
      link.addEventListener('click', () => {
        // Small delay to allow the anchor navigation to work
        const timeoutId = window.setTimeout(() => {
          closePanel();
        }, 100);
        this.timeoutIds.push(timeoutId);
      });
    });
  }

  private initializeMiseEnPlace(): void {
    const taskListItems = document.querySelectorAll('.task-list-item input[type="checkbox"]');
    taskListItems.forEach(checkbox => {
      const checkboxElement = checkbox as HTMLInputElement;
      const parentListItem = checkboxElement.parentElement as HTMLElement;
      
      checkboxElement.removeAttribute('disabled');
      
      if (parentListItem) {
        parentListItem.addEventListener('click', (e: Event) => {
          if (e.target === checkboxElement) {
            return;
          }
          
          checkboxElement.checked = !checkboxElement.checked;
          checkboxElement.dispatchEvent(new Event('change'));
        });
      }
      
      checkboxElement.addEventListener('change', (e: Event) => {
        const target = e.target as HTMLInputElement;
        const parentElement = target?.parentElement;
        
        if (parentElement?.textContent) {
          const taskText = parentElement.textContent.trim();
          const isChecked = target.checked;
          
          try {
            const storageKey = `mise-en-place-${this.recipeSlug}`;
            let savedStates: MiseEnPlaceState = JSON.parse(localStorage.getItem(storageKey) || '{}');
            savedStates[taskText] = isChecked;
            localStorage.setItem(storageKey, JSON.stringify(savedStates));
          } catch (error) {
            console.warn('Failed to save mise en place state:', error);
          }
        }
      });
    });
    
    // Restore saved checkbox states
    try {
      const storageKey = `mise-en-place-${this.recipeSlug}`;
      const savedStates: MiseEnPlaceState = JSON.parse(localStorage.getItem(storageKey) || '{}');
      
      taskListItems.forEach(checkbox => {
        const checkboxElement = checkbox as HTMLInputElement;
        const parentElement = checkboxElement.parentElement;
        
        if (parentElement?.textContent) {
          const taskText = parentElement.textContent.trim();
          if (savedStates[taskText] === true) {
            checkboxElement.checked = true;
          }
        }
      });
    } catch (error) {
      console.warn('Failed to restore mise en place state:', error);
    }
  }

  private initializeModules(): void {
    // Initialize other recipe modules if they exist
    if (typeof window.RecipeSharing !== 'undefined') window.RecipeSharing?.init();
    if (typeof window.RecipeNavigation !== 'undefined') window.RecipeNavigation?.init();
    // Timer system is now auto-initialized, no need to call init
  }

  cleanup(): void {
    // Remove event listeners to prevent memory leaks
    if (this.handleResize) {
      window.removeEventListener('resize', this.handleResize);
      this.handleResize = null;
    }
    
    // Clear any intervals or timeouts
    if (this.timeoutIds) {
      this.timeoutIds.forEach(id => clearTimeout(id));
      this.timeoutIds = [];
    }
    
    // Cancel idle callbacks
    if (this.idleCallbackIds && window.cancelIdleCallback) {
      this.idleCallbackIds.forEach(id => window.cancelIdleCallback(id));
      this.idleCallbackIds = [];
    }
    
    // Remove any other event listeners that were added
    if (this.eventListeners) {
      this.eventListeners.forEach(({ element, event, handler }) => {
        if (element && element.removeEventListener) {
          element.removeEventListener(event, handler);
        }
      });
      this.eventListeners = [];
    }
    
    this.isInitialized = false;
  }
}

// Create global instance - ensure only one instance exists
let globalRecipeManager: RecipeInteractionManager | null = null;
let navigationHandlers: NavigationHandler[] = [];

function initializeRecipeManager(): void {
  // Only initialize on recipe pages
  if ((window.location.pathname.includes('/reseptit') || window.location.pathname.includes('/hakemisto') || window.location.pathname.includes('/reseptit/')) && !window.location.pathname.endsWith('/reseptit') && !window.location.pathname.endsWith('/hakemisto')) {
    if (!globalRecipeManager) {
      globalRecipeManager = new RecipeInteractionManager();
      globalRecipeManager.init();
    }
  }
}

function resetRecipeManager(): void {
  if (globalRecipeManager && typeof globalRecipeManager.cleanup === 'function') {
    globalRecipeManager.cleanup();
  }
  globalRecipeManager = null;
}

function addNavigationHandler(event: string, handler: EventListener): void {
  document.addEventListener(event, handler);
  navigationHandlers.push({ event, handler });
}

// Expose classes globally
window.RecipeInteractionManager = RecipeInteractionManager;
window.globalRecipeManager = globalRecipeManager;

// Auto-initialize on DOMContentLoaded
addNavigationHandler('DOMContentLoaded', initializeRecipeManager);

// Handle Astro navigation
addNavigationHandler('astro:before-swap', () => {
  resetRecipeManager();
});

['astro:after-swap', 'astro:page-load'].forEach(event => {
  addNavigationHandler(event, () => {
    initializeRecipeManager();
  });
});

export default RecipeInteractionManager;