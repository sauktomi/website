// Recipe Interactions Module
// Extracted from src/pages/reseptit/[...slug].astro

class RecipeInteractionManager {
  constructor() {
    this.completedSteps = new Set();
    this.recipeSlug = '';
    this.storageKey = '';
    this.isInitialLoad = true; // Flag to prevent auto-scroll on page load
  }

  init() {
    this.recipeSlug = window.location.pathname.split('/').pop() || 'unknown-recipe';
    this.storageKey = `recipe-steps-${this.recipeSlug}`;
    this.loadCompletionStates();
    
    this.initializeInfoNotes();
    this.initializeInstructionSteps();
    this.initializeMiseEnPlace();
    this.initializeModules();
    
    // Mobile progress visibility is now handled by CSS only
    
    // Mark initial load as complete after a short delay
    setTimeout(() => {
      this.isInitialLoad = false;
    }, 500);
  }

  loadCompletionStates() {
    try {
      const saved = localStorage.getItem(this.storageKey);
      if (saved) {
        this.completedSteps = new Set(JSON.parse(saved));
      }
    } catch (error) {
      console.warn('Failed to load instruction step states:', error);
    }
  }

  saveCompletionStates() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(Array.from(this.completedSteps)));
    } catch (error) {
      console.warn('Failed to save instruction step states:', error);
    }
  }

  initializeInfoNotes() {
    this.addLocalInfoToggle();
    
    const instructionLists = document.querySelectorAll('.recipe-body ol');
    
    instructionLists.forEach(list => {
      const infoNotes = list.querySelectorAll('.recipe-note-info, .recipe-note-notice');
      
      infoNotes.forEach(note => {
        const infoButton = document.createElement('button');
        infoButton.className = 'recipe-info-button';
        infoButton.setAttribute('aria-label', 'Näytä lisätiedot');
        infoButton.setAttribute('title', 'Näytä lisätiedot');
        infoButton.innerHTML = `
          <svg class="recipe-info-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="9" stroke-width="0.5"/>
            <path class="info-char" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01"/>
          </svg>
        `;
        
        note.setAttribute('aria-hidden', 'true');
        note.parentNode?.insertBefore(infoButton, note);
        
        infoButton.addEventListener('click', () => {
          if (document.body.classList.contains('info-mode-enabled')) {
            return;
          }
          
          const noteElement = note;
          const isHidden = noteElement.style.display === 'none' || window.getComputedStyle(noteElement).display === 'none';
          
          if (isHidden) {
            noteElement.style.display = 'block';
            note.setAttribute('aria-hidden', 'false');
            infoButton.setAttribute('aria-expanded', 'true');
            infoButton.setAttribute('aria-label', 'Piilota lisätiedot');
            infoButton.setAttribute('title', 'Piilota lisätiedot');
          } else {
            noteElement.style.display = 'none';
            note.setAttribute('aria-hidden', 'true');
            infoButton.setAttribute('aria-expanded', 'false');
            infoButton.setAttribute('aria-label', 'Näytä lisätiedot');
            infoButton.setAttribute('title', 'Näytä lisätiedot');
          }
        });
        
        infoButton.setAttribute('aria-expanded', 'false');
      });
    });
  }

  addLocalInfoToggle() {
    const ohjeHeader = document.querySelector('#ohje');
    if (!ohjeHeader) return;
    
    let isInfoModeEnabled = false;
    try {
      const saved = localStorage.getItem('info-mode-enabled');
      isInfoModeEnabled = saved === 'true';
    } catch (error) {
      console.warn('Failed to load info mode state:', error);
    }
    
    const settingsButton = document.createElement('button');
    settingsButton.className = 'recipe-settings-button';
    settingsButton.setAttribute('aria-label', 'Asetukset');
    settingsButton.setAttribute('title', 'Asetukset');
    settingsButton.setAttribute('aria-expanded', 'false');
    settingsButton.innerHTML = `
      <svg class="recipe-settings-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/>
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
      </svg>
    `;
    
    ohjeHeader.appendChild(settingsButton);
    
    const toggleContainer = document.createElement('div');
    toggleContainer.className = 'info-toggle-container hidden';
    toggleContainer.innerHTML = `
      <div class="info-toggle-header">
        <div>
          <div class="info-toggle-label">Näytä kaikki lisätiedot</div>
          <div class="info-toggle-description">Näytä kaikki vinkit ja lisätiedot kerralla ilman painikkeita</div>
        </div>
        <label class="info-toggle-switch">
          <input type="checkbox" class="local-info-toggle" ${isInfoModeEnabled ? 'checked' : ''} />
          <div class="info-toggle-switch-bg"></div>
        </label>
      </div>
    `;
    
    ohjeHeader.parentNode?.insertBefore(toggleContainer, ohjeHeader.nextSibling);
    
    settingsButton.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      
      const isExpanded = settingsButton.getAttribute('aria-expanded') === 'true';
      
      if (isExpanded) {
        toggleContainer.classList.add('hidden');
        settingsButton.setAttribute('aria-expanded', 'false');
      } else {
        toggleContainer.classList.remove('hidden');
        settingsButton.setAttribute('aria-expanded', 'true');
      }
    });
    
    const localToggle = toggleContainer.querySelector('.local-info-toggle');
    if (localToggle) {
      localToggle.checked = isInfoModeEnabled;
      
      localToggle.addEventListener('change', (e) => {
        const target = e.target;
        const enabled = target?.checked || false;
        document.dispatchEvent(new CustomEvent('infoModeChanged', {
          detail: { enabled }
        }));
      });
    }
  }

  initializeInstructionSteps() {
    const instructionLists = document.querySelectorAll('.recipe-body #ohje ~ ol, .recipe-body h3#ohje ~ ol, .recipe-body #ohje ~ h4 + ol, .recipe-body h3#ohje ~ h4 + ol');
    
    instructionLists.forEach((list, listIndex) => {
      const steps = list.querySelectorAll('li');
      
      steps.forEach((step, stepIndex) => {
        const stepId = this.getStepId(step, listIndex, stepIndex);
        
        step.setAttribute('data-step-id', stepId);
        
        if (this.completedSteps.has(stepId)) {
          step.classList.add('step-completed');
        }
        
        // Add mousemove listener for hover effects on step number area
        step.addEventListener('mousemove', (e) => {
          const rect = step.getBoundingClientRect();
          const mouseX = e.clientX;
          const mouseY = e.clientY;
          
          let isInNumberArea = false;
          
          if (window.innerWidth < 768) {
            const numberAreaTop = rect.top;
            const numberAreaBottom = rect.top + 48;
            isInNumberArea = mouseY >= numberAreaTop && mouseY <= numberAreaBottom;
          } else {
            const numberAreaLeft = rect.left - 24;
            const numberAreaRight = numberAreaLeft + 56;
            const numberAreaTop = rect.top;
            const numberAreaBottom = numberAreaTop + 56;
            
            isInNumberArea = mouseX >= numberAreaLeft && mouseX <= numberAreaRight && 
                           mouseY >= numberAreaTop && mouseY <= numberAreaBottom;
          }
          
          if (isInNumberArea) {
            step.style.cursor = 'pointer';
          } else {
            step.style.cursor = 'default';
          }
        });
        
        step.addEventListener('mouseleave', () => {
          step.style.cursor = 'default';
        });
        
        step.addEventListener('click', (e) => {
          e.stopPropagation();
          
          const target = e.target;
          if (target.closest('.recipe-info-button') || target.closest('button') || target.closest('a') || target.closest('input')) {
            return;
          }
          
          // Calculate if click is in the step number area (where ::before element is)
          const rect = step.getBoundingClientRect();
          const clickX = e.clientX;
          const clickY = e.clientY;
          
          // Step number area dimensions based on CSS positioning
          const numberAreaWidth = 56; // w-14 = 3.5rem = 56px
          const numberAreaHeight = 56; // h-14 = 3.5rem = 56px
          
          // Check if click is within the step number area
          let isInNumberArea = false;
          
          // Mobile layout (full width number area at top)
          if (window.innerWidth < 768) {
            const numberAreaTop = rect.top;
            const numberAreaBottom = rect.top + 48; // h-12 on mobile
            isInNumberArea = clickY >= numberAreaTop && clickY <= numberAreaBottom;
          } else {
            // Desktop layout (circular number on left)
            const numberAreaLeft = rect.left - 24; // Positioned at -left-6 (-24px)
            const numberAreaRight = numberAreaLeft + numberAreaWidth;
            const numberAreaTop = rect.top; // Positioned at top-0
            const numberAreaBottom = numberAreaTop + numberAreaHeight;
            
            isInNumberArea = clickX >= numberAreaLeft && clickX <= numberAreaRight && 
                           clickY >= numberAreaTop && clickY <= numberAreaBottom;
          }
          
          if (!isInNumberArea) {
            return; // Only handle clicks in the step number area
          }
          
          const isCompleted = step.classList.contains('step-completed');
          
          if (isCompleted) {
            step.classList.remove('step-completed');
            this.completedSteps.delete(stepId);
          } else {
            step.classList.add('step-completed');
            this.completedSteps.add(stepId);
          }
          
          this.saveCompletionStates();
          this.updateStepProgress();
        });
      });
    });
    
    this.updateStepProgress();
    this.setupProgressPopup();
  }

  getStepId(step, listIndex, stepIndex) {
    const stepText = step.textContent?.trim() || '';
    const truncatedText = stepText.substring(0, 50);
    return `step-${listIndex}-${stepIndex}-${truncatedText.replace(/[^a-zA-Z0-9]/g, '-')}`;
  }

  updateStepProgress() {
    this.updateProgressDisplay();
    this.updateSectionCompletion();
  }

  updateProgressDisplay() {
    const sectionHeaders = document.querySelectorAll('.recipe-body #ohje ~ h4, .recipe-body h3#ohje ~ h4');
    
    const progressFractionMobile = document.getElementById('progress-fraction-mobile');
    const sidebarProgressLabel = document.getElementById('sidebar-progress-label');
    const sidebarProgressList = document.getElementById('sidebar-progress-list');
    const mobileProgressContainer = document.getElementById('step-progress');
    const sidebarProgressContainer = document.getElementById('sidebar-progress');
    
    if (sectionHeaders.length > 0) {
      const completedSections = document.querySelectorAll('.recipe-body #ohje ~ h4.section-completed, .recipe-body h3#ohje ~ h4.section-completed').length;
      const fractionText = `${completedSections}/${sectionHeaders.length}`;
      
      if (progressFractionMobile) progressFractionMobile.textContent = fractionText;
      
      // Update pre-rendered section progress items
      const sectionProgressItems = document.querySelectorAll('.section-progress-item');
      sectionProgressItems.forEach((item, index) => {
        const indicator = item.querySelector('.section-progress-indicator');
        const title = item.querySelector('.section-progress-title');
        const correspondingHeader = sectionHeaders[index];
        
        if (correspondingHeader && indicator && title) {
          const isCompleted = correspondingHeader.classList.contains('section-completed');
          
          // Update item styling
          if (isCompleted) {
            item.className = 'section-progress-item flex items-center gap-3 p-2 rounded-lg bg-green-50 border border-green-200 hover:bg-green-100 transition-colors duration-200 no-underline border-none';
            indicator.className = 'section-progress-indicator w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold bg-green-500 text-white';
            indicator.textContent = '✓';
            title.className = 'section-progress-title text-sm text-green-800 font-medium';
          } else {
            item.className = 'section-progress-item flex items-center gap-3 p-2 rounded-lg transition-colors duration-200 no-underline border-none';
            indicator.className = 'section-progress-indicator w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold bg-gray-300 text-gray-600';
            indicator.textContent = (index + 1).toString();
            title.className = 'section-progress-title text-sm text-gray-700';
          }
        }
      });
      
      // Mobile progress visibility is now handled by CSS only
      if (sidebarProgressContainer) {
        sidebarProgressContainer.classList.add('vis-block');
      }
    } else {
      const totalSteps = document.querySelectorAll('.recipe-body #ohje ~ ol li, .recipe-body h3#ohje ~ ol li').length;
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
            <p class="text-xs text-gray-600 mt-2 px-1">
              Jäljellä ${totalSteps - completedStepsCount} askelta
            </p>
          `;
        } else if (totalSteps > 0) {
          listContent += `
            <p class="text-xs text-green-600 font-medium mt-2 px-1">
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

  updateSectionCompletion() {
    const sectionHeaders = document.querySelectorAll('.recipe-body #ohje ~ h4, .recipe-body h3#ohje ~ h4');
    
    sectionHeaders.forEach(header => {
      let nextElement = header.nextElementSibling;
      let correspondingList = null;
      const sectionContent = [];
      
      while (nextElement) {
        if (nextElement.tagName === 'H4' || nextElement.tagName === 'H3' || nextElement.tagName === 'H2') {
          break;
        }
        
        sectionContent.push(nextElement);
        
        if (nextElement.tagName === 'OL') {
          correspondingList = nextElement;
        }
        
        nextElement = nextElement.nextElementSibling;
      }
      
      if (header.hasAttribute('data-toggle-handler')) {
        header._sectionContent = sectionContent;
      }
      
      if (correspondingList) {
        const stepsInSection = correspondingList.querySelectorAll('li');
        const completedStepsInSection = correspondingList.querySelectorAll('li.step-completed');
        
        const wasCompleted = header.classList.contains('section-completed');
        const isNowCompleted = stepsInSection.length > 0 && completedStepsInSection.length === stepsInSection.length;
        
        if (!header.hasAttribute('data-toggle-handler')) {
          header.setAttribute('data-toggle-handler', 'true');
          
          header.addEventListener('click', (e) => {
            const rect = header.getBoundingClientRect();
            const mouseEvent = e;
            const clickX = mouseEvent.clientX;
            const clickY = mouseEvent.clientY;
            
            const buttonLeft = rect.right - 44;
            const buttonRight = rect.right - 12;
            const buttonTop = rect.top + (rect.height / 2) - 16;
            const buttonBottom = rect.top + (rect.height / 2) + 16;
            
            const clickedOnButton = clickX >= buttonLeft && clickX <= buttonRight && 
                                   clickY >= buttonTop && clickY <= buttonBottom;
            
            if (!header.classList.contains('section-completed')) {
              return;
            }
            
            if (clickedOnButton) {
              const isCollapsed = header.classList.contains('section-collapsed');
              
              if (!isCollapsed) {
                this.uncheckAllStepsInSection(header);
                return;
              }
            }
            
            const isCollapsed = header.classList.contains('section-collapsed');
            const storedContent = header._sectionContent;
            
            if (!storedContent || storedContent.length === 0) {
              console.warn('No stored content found for section:', header.textContent);
              return;
            }
            
            if (isCollapsed) {
              header.classList.remove('section-collapsed');
              storedContent.forEach((element) => {
                element.classList.remove('section-content-collapsed');
                element.classList.add('section-content-expanded');
              });
            } else {
              this.smoothCollapseSection(header, storedContent, false);
            }
          });
        }
        
        header._sectionContent = sectionContent;
        
        if (isNowCompleted) {
          header.classList.add('section-completed');
          
          if (!wasCompleted) {
            // Only auto-scroll if this is not the initial page load
            this.smoothCollapseSection(header, sectionContent, !this.isInitialLoad);
          }
          
          this.updateProgressDisplay();
        } else {
          header.classList.remove('section-completed', 'section-collapsed', 'section-background-applied');
          
          sectionContent.forEach(element => {
            element.classList.remove('section-content-collapsed');
            element.classList.add('section-content-expanded');
          });
          
          this.updateProgressDisplay();
        }
      }
    });
  }

  uncheckAllStepsInSection(header) {
    const storedContent = header._sectionContent;
    if (!storedContent) return;
    
    storedContent.forEach((element) => {
      if (element.tagName === 'OL') {
        const steps = element.querySelectorAll('li[data-step-id]');
        steps.forEach((step) => {
          const stepElement = step;
          const stepId = stepElement.getAttribute('data-step-id');
          
          if (stepId && stepElement.classList.contains('step-completed')) {
            stepElement.classList.remove('step-completed');
            this.completedSteps.delete(stepId);
          }
        });
      }
    });
    
    this.saveCompletionStates();
    this.updateStepProgress();
  }

  smoothCollapseSection(header, sectionContent, shouldScrollToHeader = false) {
    header.classList.add('section-collapsing');
    header.classList.add('section-collapsed');
    
    sectionContent.forEach(element => {
      element.classList.add('section-content-collapsed');
      element.classList.remove('section-content-expanded');
    });
    
    if (shouldScrollToHeader) {
      setTimeout(() => {
        const headerElement = header;
        const headerTop = headerElement.offsetTop;
        const viewportHeight = window.innerHeight;
        
        const targetScrollY = Math.max(0, headerTop - (viewportHeight * 0.25));
        
        window.scrollTo({
          top: targetScrollY,
          behavior: 'smooth'
        });
      }, 100);
      
      setTimeout(() => {
        header.classList.add('section-background-applied');
      }, 800);
    } else {
      header.classList.add('section-background-applied');
    }
    
    setTimeout(() => {
      header.classList.remove('section-collapsing');
    }, 500);
  }

  setupProgressPopup() {
    const mobileProgressButton = document.getElementById('step-progress');
    if (mobileProgressButton) {
      mobileProgressButton.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.showProgressPopup();
      });
      mobileProgressButton.style.cursor = 'pointer';
      mobileProgressButton.setAttribute('title', 'Näytä edistyminen');
    }
  }

  showProgressPopup() {
    const sectionHeaders = document.querySelectorAll('.recipe-body #ohje ~ h4, .recipe-body h3#ohje ~ h4');
    
    let popupContent = '';
    
    if (sectionHeaders.length > 0) {
      popupContent = '<h3 class="text-lg font-semibold mb-4">Reseptin edistyminen</h3>';
      popupContent += '<div class="space-y-3">';
      
      sectionHeaders.forEach((header, index) => {
        const isCompleted = header.classList.contains('section-completed');
        const sectionTitle = header.textContent?.trim() || `Osio ${index + 1}`;
        const headerId = header.id || header.getAttribute('id');
        const linkHref = headerId ? `#${headerId}` : '#';
        
        popupContent += `
          <a href="${linkHref}" class="flex items-center gap-3 p-3 rounded-lg ${isCompleted ? 'bg-green-50 border border-green-200 hover:bg-green-100' : 'bg-gray-50 border border-gray-200 hover:bg-gray-100'} transition-colors duration-200 no-underline border-none">
            <div class="w-6 h-6 rounded-full flex items-center justify-center ${isCompleted ? 'bg-green-500 text-white' : 'bg-gray-300 text-gray-600'}">
              ${isCompleted ? '✓' : (index + 1)}
            </div>
            <span class="${isCompleted ? 'text-green-800 font-medium' : 'text-gray-700'}">${sectionTitle}</span>
          </a>
        `;
      });
      
      popupContent += '</div>';
    } else {
      const totalSteps = document.querySelectorAll('.recipe-body #ohje ~ ol li, .recipe-body h3#ohje ~ ol li').length;
      const completedStepsCount = this.completedSteps.size;
      
      popupContent = '<h3 class="text-lg font-semibold mb-4">Askelten edistyminen</h3>';
      popupContent += `
        <div class="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div class="flex items-center justify-between">
            <span class="text-blue-800 font-medium">Suoritettu</span>
            <span class="text-blue-600 text-xl font-bold">${completedStepsCount}/${totalSteps}</span>
          </div>
          <div class="mt-2 w-full bg-blue-200 rounded-full h-2">
            <div class="bg-blue-500 h-2 rounded-full transition-all duration-300" style="width: ${totalSteps > 0 ? (completedStepsCount / totalSteps) * 100 : 0}%"></div>
          </div>
        </div>
      `;
      
      if (completedStepsCount < totalSteps) {
        popupContent += `
          <p class="text-sm text-gray-600">
            Jäljellä ${totalSteps - completedStepsCount} askelta. Klikkaa askelia merkitäksesi ne tehdyiksi.
          </p>
        `;
      } else {
        popupContent += `
          <p class="text-sm text-green-600 font-medium">
            🎉 Kaikki askeleet suoritettu!
          </p>
        `;
      }
    }
    
    const popup = document.createElement('div');
    popup.className = 'fixed inset-0 z-50 flex items-center justify-center p-4';
    popup.style.background = 'rgba(0, 0, 0, 0.5)';
    popup.style.backdropFilter = 'blur(4px)';
    
    popup.innerHTML = `
      <div class="bg-gray-50 border border-gray-200 rounded-xl p-6 max-w-md w-full shadow-2xl">
        ${popupContent}
        <button class="mt-6 w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
          Sulje
        </button>
      </div>
    `;
    
    const closeBtn = popup.querySelector('button');
    closeBtn?.addEventListener('click', () => document.body.removeChild(popup));
    popup.addEventListener('click', (e) => {
      if (e.target === popup) document.body.removeChild(popup);
    });
    
    // Close popup when clicking on section links
    const sectionLinks = popup.querySelectorAll('a[href^="#"]');
    sectionLinks.forEach(link => {
      link.addEventListener('click', () => {
        // Small delay to allow the anchor navigation to work
        setTimeout(() => {
          document.body.removeChild(popup);
        }, 100);
      });
    });
    
    document.body.appendChild(popup);
  }

  initializeMiseEnPlace() {
    const taskListItems = document.querySelectorAll('.task-list-item input[type="checkbox"]');
    taskListItems.forEach(checkbox => {
      const checkboxElement = checkbox;
      const parentListItem = checkboxElement.parentElement;
      
      checkboxElement.removeAttribute('disabled');
      
      if (parentListItem) {
        parentListItem.style.cursor = 'pointer';
        
        parentListItem.addEventListener('click', (e) => {
          if (e.target === checkboxElement) {
            return;
          }
          
          checkboxElement.checked = !checkboxElement.checked;
          checkboxElement.dispatchEvent(new Event('change'));
        });
      }
      
      checkboxElement.addEventListener('change', (e) => {
        const target = e.target;
        const parentElement = target?.parentElement;
        
        if (parentElement?.textContent) {
          const taskText = parentElement.textContent.trim();
          const isChecked = target.checked;
          
          try {
            const storageKey = `mise-en-place-${this.recipeSlug}`;
            let savedStates = JSON.parse(localStorage.getItem(storageKey) || '{}');
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
      const savedStates = JSON.parse(localStorage.getItem(storageKey) || '{}');
      
      taskListItems.forEach(checkbox => {
        const checkboxElement = checkbox;
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

  initializeModules() {
    // Initialize other recipe modules if they exist
    // Note: RecipeProgress is not initialized here as RecipeInteractionManager handles progress tracking
    if (typeof RecipeSharing !== 'undefined') RecipeSharing?.init();
    if (typeof RecipeNavigation !== 'undefined') RecipeNavigation?.init();
    if (typeof RecipeTimer !== 'undefined') RecipeTimer?.init();
  }

  cleanup() {
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
    
    // Remove any other event listeners that were added
    if (this.eventListeners) {
      this.eventListeners.forEach(({ element, event, handler }) => {
        if (element && element.removeEventListener) {
          element.removeEventListener(event, handler);
        }
      });
      this.eventListeners = [];
    }
  }
}

// Create global instance - ensure only one instance exists
let globalRecipeManager = null;
let isInitialized = false;
let navigationHandlers = [];

function initializeRecipeManager() {
  // Only initialize on recipe pages
  if ((window.location.pathname.includes('/reseptit') || window.location.pathname.includes('/hakemisto') || window.location.pathname.includes('/reseptit/')) && !window.location.pathname.endsWith('/reseptit') && !window.location.pathname.endsWith('/hakemisto')) {
    if (!globalRecipeManager) {
      globalRecipeManager = new RecipeInteractionManager();
      globalRecipeManager.init();
      isInitialized = true;
    }
  }
}

function resetRecipeManager() {
  if (globalRecipeManager && typeof globalRecipeManager.cleanup === 'function') {
    globalRecipeManager.cleanup();
  }
  globalRecipeManager = null;
  isInitialized = false;
}

function cleanupNavigationHandlers() {
  navigationHandlers.forEach(({ event, handler }) => {
    document.removeEventListener(event, handler);
  });
  navigationHandlers = [];
}

function addNavigationHandler(event, handler) {
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