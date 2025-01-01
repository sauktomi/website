(() => {
  class NavigationManager {
    #elements = {};
    #state = {
      isMobileActive: false,
      currentSection: null,
      hoverStates: new WeakMap(),
      closeTimer: null,
      touchData: { x: null, y: null },
      config: {
        threshold: 50,
        closeDelay: 800,
        transition: 250
      }
    };

    constructor() {
      if ('requestIdleCallback' in window) {
        requestIdleCallback(() => {
          this.#cacheElements();
          this.#bindEvents();
        });
      } else {
        this.#cacheElements();
        this.#bindEvents();
      }
    }

    #cacheElements() {
      const query = selector => document.querySelector(selector);
      const queryAll = selector => [...document.querySelectorAll(selector)];

      this.#elements = {
        nav: {
          items: queryAll('.nav-item'),
          mega: query('.mega-dropdown'),
          content: query('.mega-content')
        },
        mobile: {
          menu: query('.mobile-menu'),
          toggle: query('.menu-toggle'),
          mainView: query('.main-view'),
          submenuView: query('.submenu-view'),
          submenuContent: query('.submenu-content')
        }
      };
    }

    #bindEvents() {
      this.#setupDesktopNav();
      this.#setupMobileNav();
      this.#setupGlobalListeners();
    }

    #setupDesktopNav() {
      const { items, mega } = this.#elements.nav;
      let hoverTimer = null;
      
      const clearClose = () => {
        if (this.#state.closeTimer) {
          clearTimeout(this.#state.closeTimer);
          this.#state.closeTimer = null;
        }
        if (hoverTimer) {
          clearTimeout(hoverTimer);
          hoverTimer = null;
        }
      };

      const scheduleClose = () => {
        clearClose();
        hoverTimer = setTimeout(() => {
          const hasActiveHover = [...this.#state.hoverStates.entries()]
            .some(([_, isHovered]) => isHovered);
          if (!hasActiveHover) {
            this.#hideDropdown(true);
          }
        }, this.#state.config.closeDelay);
      };

      items.forEach(item => {
        const handlers = {
          enter: () => {
            clearClose();
            this.#state.hoverStates.set(item, true);
            this.#showDropdown(item);
          },
          leave: e => {
            this.#state.hoverStates.delete(item);
            if (!e.relatedTarget?.closest('.mega-dropdown')) {
              scheduleClose();
            }
          }
        };

        item.addEventListener('mouseenter', handlers.enter, { passive: true });
        item.addEventListener('mouseleave', handlers.leave, { passive: true });
        item.addEventListener('focusin', handlers.enter, { passive: true });
        item.addEventListener('focusout', handlers.leave, { passive: true });
      });

      if (mega) {
        mega.addEventListener('mouseenter', () => {
          clearClose();
          this.#state.hoverStates.set(mega, true);
        }, { passive: true });

        mega.addEventListener('mouseleave', e => {
          this.#state.hoverStates.delete(mega);
          if (!e.relatedTarget?.closest('.nav-item')) {
            scheduleClose();
          }
        }, { passive: true });

        document.addEventListener('click', e => {
          if (!e.target.closest('.nav-item') && 
              !e.target.closest('.mega-dropdown')) {
            this.#hideDropdown(true);
          }
        }, { passive: true });
      }
    }

    #setupMobileNav() {
      const { mobile } = this.#elements;

      mobile.toggle?.addEventListener('click', () => this.#toggleMobile(), { passive: true });

      mobile.menu?.addEventListener('click', e => {
        const target = e.target;
        e.preventDefault();

        if (target.closest('.back-button')) {
          this.#hideSubmenu();
          return;
        }

        const sectionTrigger = target.closest('.section-trigger');
        if (sectionTrigger) {
          const section = sectionTrigger.dataset.section;
          if (section) {
            this.#showSubmenu(section);
          }
          return;
        }

        const menuLink = target.closest('.menu-trigger');
        if (menuLink) {
          const href = menuLink.getAttribute('href');
          if (href && href !== '#') {
            window.location.href = href;
          }
        }
      }, { passive: false });

      if (mobile.menu) {
        this.#setupTouchHandlers(mobile.menu);
      }
    }

    #setupGlobalListeners() {
      document.addEventListener('keydown', e => {
        if (e.key === 'Escape') {
          if (this.#state.currentSection) {
            this.#hideSubmenu();
          } else if (this.#state.isMobileActive) {
            this.#closeMobile();
          } else {
            this.#hideDropdown(true);
          }
        }
      }, { passive: true });

      document.addEventListener('click', e => {
        if (this.#state.isMobileActive && 
            !e.target.closest('.mobile-menu') && 
            !e.target.closest('.menu-toggle')) {
          this.#closeMobile();
        }
      }, { passive: true });
    }

    #setupTouchHandlers(element) {
      const handlers = {
        start: e => {
          this.#state.touchData = {
            x: e.touches[0].clientX,
            y: e.touches[0].clientY
          };
        },
        move: e => {
          if (!this.#state.touchData.x) return;

          const deltaX = e.touches[0].clientX - this.#state.touchData.x;
          const deltaY = e.touches[0].clientY - this.#state.touchData.y;

          if (Math.abs(deltaX) > Math.abs(deltaY) && 
              deltaX > this.#state.config.threshold) {
            if (this.#state.currentSection) {
              this.#hideSubmenu();
            } else {
              this.#closeMobile();
            }
            this.#state.touchData = { x: null, y: null };
          }
        },
        end: () => {
          this.#state.touchData = { x: null, y: null };
        }
      };

      element.addEventListener('touchstart', handlers.start, { passive: true });
      element.addEventListener('touchmove', handlers.move, { passive: true });
      element.addEventListener('touchend', handlers.end, { passive: true });
    }

    #showDropdown(item) {
      if (this.#state.isMobileActive) return;

      clearTimeout(this.#state.closeTimer);
      const menuData = item.querySelector('.menu-data');

      if (menuData && this.#elements.nav.content) {
        requestAnimationFrame(() => {
          this.#elements.nav.content.innerHTML = menuData.innerHTML;
          this.#elements.nav.mega?.classList.add('active');
          item.setAttribute('aria-expanded', 'true');
          this.#state.currentMenu = item;
        });
      }
    }

    #scheduleHide() {
      if ([...this.#state.hoverStates.values()].some(Boolean)) return;
      this.#state.closeTimer = setTimeout(
        () => this.#hideDropdown(), 
        this.#state.config.closeDelay
      );
    }

    #hideDropdown(immediate = false) {
      const { mega, content } = this.#elements.nav;
      if (!mega) return;

      const hide = () => {
        mega.classList.remove('active');
        this.#state.currentMenu?.setAttribute('aria-expanded', 'false');
        this.#state.currentMenu = null;

        setTimeout(() => {
          if (!mega.classList.contains('active')) {
            content.innerHTML = '';
          }
        }, this.#state.config.transition);
      };

      immediate ? hide() : this.#scheduleHide();
    }

    #toggleMobile() {
      this.#state.isMobileActive = !this.#state.isMobileActive;
      this.#state.isMobileActive ? this.#openMobile() : this.#closeMobile();
    }

    #openMobile() {
      const { menu, toggle } = this.#elements.mobile;
      if (!menu || !toggle) return;
      
      toggle.classList.add('active');
      toggle.setAttribute('aria-expanded', 'true');
      menu.setAttribute('aria-expanded', 'true');
      document.body.style.overflow = 'hidden';
    }

    #closeMobile() {
      const { menu, toggle } = this.#elements.mobile;
      if (!menu || !toggle) return;

      if (this.#state.currentSection) {
        this.#hideSubmenu();
      }

      menu.classList.add('closing');
      toggle.classList.remove('active');
      toggle.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';

      // Wait for opacity transition to complete
      setTimeout(() => {
        menu.classList.remove('closing');
        menu.setAttribute('aria-expanded', 'false');
        this.#state.isMobileActive = false;
      }, this.#state.config.transition);
    }

    #showSubmenu(section) {
      const { menu, submenuView, mainView } = this.#elements.mobile;
      if (!menu || !submenuView || !mainView) return;

      const menuData = [...document.querySelectorAll('.menu-data')]
        .find(data => data.closest('.nav-item')?.dataset.menu === section);

      if (menuData) {
        const content = [...menuData.querySelectorAll('.category-group')]
          .map(group => {
            const title = group.querySelector('h3')?.textContent || '';
            const links = [...group.querySelectorAll('a')]
              .map(link => `
                <a href="${link.getAttribute('href') || '#'}" 
                   class="menu-trigger">
                  ${link.textContent.trim()}
                  <svg width="24" height="24">
                    <use href="/images/icons.svg#icon-chevron-right"/>
                  </svg>
                </a>
              `).join('');

            return `
              <div class="menu-section section">
                <h3 class="submenu-header">${title}</h3>
                ${links}
              </div>
            `;
          }).join('');

        const submenuContent = submenuView.querySelector('.submenu-content');
        if (submenuContent) {
          submenuContent.innerHTML = content;
          submenuView.style.display = 'block';
          
          // Use requestAnimationFrame to ensure display change is processed
          requestAnimationFrame(() => {
            this.#state.currentSection = section;
            menu.classList.add('submenu-active');
            
            // Trigger opacity transition after display is set
            setTimeout(() => {
              submenuView.style.opacity = '1';
            }, 50);
          });
        }
      }
    }

    #hideSubmenu() {
      const { menu, submenuView, mainView } = this.#elements.mobile;
      if (!menu || !submenuView || !mainView) return;

      submenuView.style.opacity = '0';
      menu.classList.remove('submenu-active');
      
      // Wait for opacity transition before hiding
      setTimeout(() => {
        submenuView.style.display = 'none';
        this.#state.currentSection = null;
      }, this.#state.config.transition);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      if ('requestIdleCallback' in window) {
        requestIdleCallback(() => new NavigationManager());
      } else {
        new NavigationManager();
      }
    });
  } else {
    if ('requestIdleCallback' in window) {
      requestIdleCallback(() => new NavigationManager());
    } else {
      new NavigationManager();
    }
  }
})();
