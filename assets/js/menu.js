class NavigationManager {
  #state = {
    isMobileActive: false, 
    currentMega: null,
    currentMobile: null,
    hovers: new Set(),
    rafId: null,
    megaCloseRafId: null,
    lastScrollY: 0,
    isNavVisible: true,
    config: { delay: 800, transition: 250 }
  };
  
  #els = {};
  #cachedTriggers = new Map();
  
  constructor() {
    this.#initElements();
    this.#initTheme(); 
    this.#cacheNavTriggers();
    this.#bindEvents();
    this.#initScrollHandler();
  }

  #initElements() {
    const sel = {
      mainNav: '.top-nav',
      mobileNav: '.mobile-menu', 
      megas: ['.mega-dropdown', true],
      mToggles: ['.mobile-section-toggle', true],
      menuToggle: '.menu-toggle',
      themeToggle: '.theme-toggle',
      root: document.documentElement
    };
    this.#els = Object.fromEntries(Object.entries(sel).map(
      ([k, s]) => [k, k === 'root' ? s : Array.isArray(s) ? document.querySelectorAll(s[0]) : document.querySelector(s)]
    ));
  }

  #initTheme() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    const { root } = this.#els;
    root.setAttribute('data-theme', savedTheme);
  }

  #cacheNavTriggers() {
    this.#els.megas?.forEach(mega => {
      const link = mega.parentElement.querySelector('.nav-link');
      if (link) this.#cachedTriggers.set(mega, link);
    });
  }

  #initScrollHandler() {
    let ticking = false;
    const { mainNav } = this.#els;
    const headerElements = document.querySelectorAll('h1, header');
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            mainNav.style.transform = 'translateY(0)';
            this.#state.isNavVisible = true;
          }
        });
      },
      { threshold: 0.1 }
    );
    
    headerElements.forEach(el => observer.observe(el));
    
    let scrollTimeout;
    window.addEventListener('scroll', () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          const currentScrollY = window.scrollY;
          const scrollDelta = currentScrollY - this.#state.lastScrollY;
          const isHeaderVisible = Array.from(headerElements)
            .some(el => el.getBoundingClientRect().top >= 0 && 
                       el.getBoundingClientRect().bottom <= window.innerHeight);
          
          if (scrollDelta > 50 && this.#state.isNavVisible && !isHeaderVisible) {
            clearTimeout(scrollTimeout);
            scrollTimeout = setTimeout(() => {
              mainNav.style.transform = 'translateY(-100%)';
              this.#state.isNavVisible = false;
            }, 150);
          } else if ((scrollDelta < -25 || isHeaderVisible) && !this.#state.isNavVisible) {
            clearTimeout(scrollTimeout);
            mainNav.style.transform = 'translateY(0)';
            this.#state.isNavVisible = true;
          }
          
          this.#state.lastScrollY = currentScrollY;
          ticking = false;
        });
        ticking = true;
      }
    });
  }

  #bindEvents() {
    this.#bindDesktop();
    this.#bindMobile();
    this.#bindControls();
    this.#bindGlobal();
  }

  #bindDesktop() {
    this.#cachedTriggers.forEach((link, mega) => {
      link.addEventListener('mouseenter', this.#throttle(() => {
        cancelAnimationFrame(this.#state.megaCloseRafId);
        this.#state.hovers.add(mega);
        this.#openMega(mega);
      }, this.#state.config.delay));

      link.addEventListener('mouseleave', () => {
        this.#state.hovers.delete(mega);
        this.#scheduleMegaClose(mega);
      });

      link.addEventListener('touchstart', () => this.#toggleMega(mega));

      link.addEventListener('click', e => {
        if (!this.#els.menuToggle.offsetParent && link.getAttribute('aria-expanded') === 'true') {
          e.preventDefault();
          this.#toggleMega(mega);
        }
      });

      link.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          this.#toggleMega(mega);
        }
        if (e.key === 'Escape') {
          this.#closeMega(mega);
          link.focus();
        }
      });

      mega.addEventListener('mouseenter', this.#throttle(() => {
        cancelAnimationFrame(this.#state.megaCloseRafId);
        this.#state.hovers.add(mega);
      }, this.#state.config.delay));

      mega.addEventListener('mouseleave', () => {
        this.#state.hovers.delete(mega);
        this.#scheduleMegaClose(mega);
      });
    });
  }

  #bindMobile() {
    this.#els.mToggles?.forEach(toggle => {
      ['click', 'keydown'].forEach(evt => 
        toggle.addEventListener(evt, this.#throttle(() => {
          const sub = document.getElementById(toggle.getAttribute('aria-controls'));
          if (sub) this.#toggleMobileSub(sub, toggle);
        }, 200))
      );
    });
  }

  #bindControls() {
    const { menuToggle, themeToggle } = this.#els;
    menuToggle?.addEventListener('click', () => this.#toggleMobile());
    themeToggle?.addEventListener('click', () => this.#toggleTheme());
  }

  #bindGlobal() {
    document.addEventListener('click', e => {
      if (!e.target.closest('.nav-item') && !e.target.closest('.mega-dropdown')) {
        this.#closeAllMegas();
      }
    });
    window.addEventListener('resize', this.#throttle(() => {
      !this.#els.menuToggle.offsetParent ? this.#closeMobile() : this.#closeAllMegas();
    }, 250));
    document.addEventListener('keydown', e => e.key === 'Escape' && this.#closeAll());
  }

  #throttle(fn, wait) {
    let last = 0;
    return (...args) => {
      const now = performance.now();
      if (now - last >= wait) {
        fn.apply(this, args);
        last = now;
      }
    };
  }

  #openMobileSub(sub, toggle) {
    toggle.setAttribute('aria-expanded', 'true');
    sub.hidden = false;
  }

  #closeMobileSub(sub, toggle) {
    toggle.setAttribute('aria-expanded', 'false');
    sub.hidden = true;
  }

  #toggleMobileSub(sub, toggle) {
    toggle.getAttribute('aria-expanded') === 'false' ?
      this.#openMobileSub(sub, toggle) :
      this.#closeMobileSub(sub, toggle);
  }

  #toggleMobile() {
    const { mobileNav, menuToggle } = this.#els;
    const show = menuToggle.getAttribute('aria-expanded') !== 'true';
    
    if (show) {
      mobileNav.style.display = 'block';
      mobileNav.offsetHeight;
      mobileNav.style.opacity = '1'; 
    } else {
      mobileNav.style.opacity = '0';
      this.#state.rafId = requestAnimationFrame(() => {
        if (mobileNav.style.opacity === '0') mobileNav.style.display = 'none';
        else this.#state.rafId = requestAnimationFrame(arguments.callee);
      });
    }

    menuToggle.setAttribute('aria-expanded', show ? 'true' : 'false');
    document.body.style.overflow = show ? 'hidden' : ''; 
  }

  #toggleTheme() {
    const { root } = this.#els;
    const currentTheme = root.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    root.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme); 
  }

  #openMega(mega) {
    if (this.#state.currentMega && this.#state.currentMega !== mega) {
      this.#closeMega(this.#state.currentMega);
    }
    mega.setAttribute('aria-hidden', 'false');
    this.#cachedTriggers.get(mega).setAttribute('aria-expanded', 'true');
    this.#state.currentMega = mega;
  }

  #closeMega(mega) {
    mega.setAttribute('aria-hidden', 'true');
    this.#cachedTriggers.get(mega).setAttribute('aria-expanded', 'false');
    this.#state.currentMega = null;
  }

  #toggleMega(mega) {
    const link = this.#cachedTriggers.get(mega);
    link.getAttribute('aria-expanded') === 'false' ?
      this.#openMega(mega) : 
      this.#closeMega(mega);
  }

  #scheduleMegaClose(mega) {
    if (this.#state.hovers.size > 0) return;
    
    let startTime = performance.now();
    const link = this.#cachedTriggers.get(mega);

    const animate = time => {
      if (time - startTime >= this.#state.config.delay) {
        this.#closeMega(mega);
      } else {
        this.#state.megaCloseRafId = requestAnimationFrame(animate);
      }
    };
    this.#state.megaCloseRafId = requestAnimationFrame(animate);
  }

  #closeAllMegas() {
    this.#cachedTriggers.forEach((_, mega) => this.#closeMega(mega));
  }

  #closeMobile() {
    const { mobileNav } = this.#els;
    if (mobileNav.style.display !== 'none') this.#toggleMobile();

    this.#els.mToggles?.forEach(toggle => {
      const sub = document.getElementById(toggle.getAttribute('aria-controls'));
      if (sub) this.#closeMobileSub(sub, toggle);
    });
  }

  #closeAll() {
    this.#closeAllMegas();
    this.#closeMobile();
    this.#state.hovers.clear();
    cancelAnimationFrame(this.#state.megaCloseRafId);
    cancelAnimationFrame(this.#state.rafId);
  }

  destroy() {
    this.#closeAll();
    this.#cachedTriggers.clear();
    document.body.style.overflow = '';
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => new NavigationManager());
} else {
  new NavigationManager();
}