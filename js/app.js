// ============================================
// TOOLIEST.COM — Main Application (SPA Router)
// ============================================

const TOOLIEST_CHANGELOG = [
  { version: '2.5', date: '2026-04-06', items: ['Added prerendered category pages for SEO', 'Added favorites export and import backup', 'Introduced welcome tour and performance metrics', 'Added side-by-side comparison mode for related tools'] },
  { version: '2.4', date: '2026-04-06', items: ['Added dark/light theme toggle', 'Keyboard shortcuts panel (press ?)', 'Tool sharing via Web Share API', 'Cross-category related tools'] },
  { version: '2.3', date: '2026-04-05', items: ['Expanded structured data across tool pages', 'Improved accessibility states for favorites and categories', 'Strengthened offline caching and font loading'] },
  { version: '2.2', date: '2026-04-04', items: ['80+ tools now available', 'Cookie consent and GDPR compliance', 'PWA offline support improved'] },
  { version: '2.1', date: '2026-04-02', items: ['AI-powered tools launched', 'Image EXIF privacy stripper', 'Browser-based audio converter released'] },
  { version: '2.0', date: '2026-03-28', items: ['Complete redesign with glassmorphism UI', 'Added 30+ new tools', 'Mobile-first responsive layout'] },
];
const TOOLIEST_ASSET_VERSION = window.__TOOLIEST_ASSET_VERSION || '20260415v9';

// Safe localStorage helper — prevents crashes in private browsing or restricted environments
function safeLocalGet(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw !== null ? JSON.parse(raw) : fallback;
  } catch (e) {
    return fallback;
  }
}

function safeLocalRead(key, fallback = null) {
  try {
    const raw = localStorage.getItem(key);
    return raw !== null ? raw : fallback;
  } catch (e) {
    return fallback;
  }
}

function safeLocalSet(key, value) {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch (e) {
    return false;
  }
}

const App = {
  currentView: 'home',
  currentCategory: 'all',
  searchQuery: '',
  favorites: safeLocalGet('tooliest_favorites', []),
  toolUsage: safeLocalGet('tooliest_usage', {}),
  deferredPrompt: null,
  activeToolId: null,
  pendingPerformanceMeasurement: null,
  performanceDashboardCleanup: null,
  inputCapabilities: null,

  init() {
    this.normalizeLegacyHashRoute();
    document.body.classList.toggle('embed-mode', this.isEmbedMode());
    this.initInputCapabilities();

    if (!this.isEmbedMode() && 'serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register(`/sw.js?v=${encodeURIComponent(TOOLIEST_ASSET_VERSION)}`)
          .then(reg => console.log('[Service Worker] Registered', reg.scope))
          .catch(err => console.log('[Service Worker] Failed', err));
      });
      // Auto-reload when a new service worker version activates
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data && event.data.type === 'SW_UPDATED') {
          console.log('[Tooliest] New version available, reloading...');
          window.location.reload();
        }
      });
    }
    
    this.initTheme();
    this.bindEvents();
    this.handleRoute();
    window.addEventListener('popstate', () => this.handleRoute());
    if (!this.isEmbedMode()) {
      window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        this.deferredPrompt = e;
        
        // Show nav button
        const navBtn = document.getElementById('nav-install-btn');
        if (navBtn) {
          navBtn.style.display = '';
          navBtn.onclick = async (ev) => {
            ev.preventDefault();
            this.deferredPrompt.prompt();
            const { outcome } = await this.deferredPrompt.userChoice;
            if (outcome === 'accepted') {
              navBtn.style.display = 'none';
              document.getElementById('pwa-install-banner')?.remove();
            }
            this.deferredPrompt = null;
          };
        }
        
        // Show floating banner specifically if not dismissed
        setTimeout(() => this.showInstallPrompt(), 3000);
      });
      window.addEventListener('appinstalled', () => {
        this.deferredPrompt = null;
        document.getElementById('pwa-install-banner')?.remove();
        const navBtn = document.getElementById('nav-install-btn');
        if (navBtn) navBtn.style.display = 'none';
      });
    }
    let ticking = false;
    window.addEventListener('scroll', () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          document.querySelector('.navbar')?.classList.toggle('scrolled', window.scrollY > 20);
          ticking = false;
        });
        ticking = true;
      }
    });
    if (!this.isEmbedMode()) {
      window.setTimeout(() => this.maybeShowWelcomeTour(), 900);
    }
  },

  initInputCapabilities() {
    const compactViewport = window.matchMedia('(max-width: 820px)');
    const coarsePointer = window.matchMedia('(pointer: coarse)');
    const anyCoarsePointer = window.matchMedia('(any-pointer: coarse)');
    const anyFinePointer = window.matchMedia('(any-pointer: fine)');
    const hoverCapable = window.matchMedia('(hover: hover)');
    const bindChange = (query, handler) => {
      if (query.addEventListener) {
        query.addEventListener('change', handler);
      } else if (query.addListener) {
        query.addListener(handler);
      }
    };

    const applyCapabilities = () => {
      const previous = this.inputCapabilities || {};
      const hasTouchPoints = navigator.maxTouchPoints > 0;
      const touchPreferred = coarsePointer.matches ||
        (anyCoarsePointer.matches && !hoverCapable.matches) ||
        (hasTouchPoints && !anyFinePointer.matches);

      this.inputCapabilities = {
        hasTouchPoints,
        touchPreferred,
        compactViewport: compactViewport.matches,
        hasHardwareKeyboard: previous.hasHardwareKeyboard || (!touchPreferred && anyFinePointer.matches),
      };
      this.updateShortcutUI();
    };

    [compactViewport, coarsePointer, anyCoarsePointer, anyFinePointer, hoverCapable].forEach((query) => {
      bindChange(query, applyCapabilities);
    });

    window.addEventListener('resize', applyCapabilities, { passive: true });
    document.addEventListener('keydown', (event) => {
      if (!this.hasLikelyHardwareKeyboardEvent(event) || this.inputCapabilities?.hasHardwareKeyboard) return;
      this.inputCapabilities = {
        ...(this.inputCapabilities || {}),
        hasHardwareKeyboard: true,
      };
      this.updateShortcutUI();
    }, true);

    applyCapabilities();
  },

  hasLikelyHardwareKeyboardEvent(event) {
    if (!event || event.isComposing || event.key === 'Unidentified') return false;
    const tagName = event.target?.tagName;
    const typingField = ['INPUT', 'TEXTAREA', 'SELECT'].includes(tagName);
    const navigationKeys = ['Escape', 'Tab', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.key);
    return Boolean(
      event.ctrlKey ||
      event.metaKey ||
      event.altKey ||
      navigationKeys ||
      (!typingField && event.key && event.key.length === 1)
    );
  },

  isTouchOnlyDevice() {
    return Boolean(this.inputCapabilities?.touchPreferred) && !this.inputCapabilities?.hasHardwareKeyboard;
  },

  shouldUseCompactTour() {
    return Boolean(this.inputCapabilities?.compactViewport) || this.isTouchOnlyDevice();
  },

  shouldShowKeyboardShortcutHints() {
    return !this.isTouchOnlyDevice();
  },

  shouldUseCompactNavSearch() {
    return window.matchMedia('(max-width: 1175px)').matches;
  },

  focusSearch() {
    if (this.shouldUseCompactNavSearch()) {
      const mobileSearchOverlay = document.getElementById('mobile-search-overlay');
      const mobileSearchInput = document.getElementById('mobile-search-input');
      mobileSearchOverlay?.classList.add('open');
      window.setTimeout(() => {
        mobileSearchInput?.focus();
        mobileSearchInput?.select?.();
      }, 100);
      return;
    }

    const searchEl = document.getElementById('search-input');
    if (searchEl) {
      searchEl.focus();
      searchEl.select?.();
    }
  },

  updateShortcutUI() {
    const showHints = this.shouldShowKeyboardShortcutHints();
    document.body.classList.toggle('shortcut-hints-hidden', !showHints);
    document.body.classList.toggle('touch-only-device', this.isTouchOnlyDevice());

    document.querySelectorAll('.search-shortcut').forEach((hint) => {
      hint.hidden = !showHints;
      hint.setAttribute('aria-hidden', showHints ? 'false' : 'true');
    });

    const shortcutButton = document.getElementById('show-shortcuts-btn');
    if (shortcutButton) {
      shortcutButton.textContent = showHints ? 'View Shortcuts' : 'Desktop Shortcut Tips';
    }
  },

  normalizeLegacyHashRoute() {
    const legacyPath = this.pathFromLegacyHash(location.hash);
    if (legacyPath) {
      history.replaceState({}, '', legacyPath);
    }
  },

  pathFromLegacyHash(hash) {
    if (!hash || !hash.startsWith('#/')) return '';
    return hash.replace(/^#/, '');
  },

  getRoute() {
    const path = this.pathFromLegacyHash(location.hash) || location.pathname;
    return this.parsePath(path);
  },

  findToolById(toolId) {
    return TOOLS.find((tool) => tool.id === toolId) || null;
  },

  parsePath(rawPath) {
    const url = new URL(rawPath, window.location.origin);
    let pathname = url.pathname.replace(/\/index\.html$/, '/');

    if (pathname.length > 1 && pathname.endsWith('/')) {
      pathname = pathname.slice(0, -1);
    }

    const parts = pathname.replace(/^\/+/, '').split('/').filter(Boolean);
    if (parts.length === 0) return { view: 'home' };
    if (parts[0] === 'tool' && parts[1]) {
      const legacyToolId = decodeURIComponent(parts[1]);
      if (this.findToolById(legacyToolId)) {
        return { view: 'tool', toolId: legacyToolId, legacyPath: true };
      }
    }
    if (parts.length === 1) {
      const rootToolId = decodeURIComponent(parts[0]);
      if (this.findToolById(rootToolId)) {
        return { view: 'tool', toolId: rootToolId };
      }
    }
    if (parts[0] === 'category' && parts[1]) return { view: 'category', categoryId: decodeURIComponent(parts[1]) };
    if (parts[0] === 'search' && parts[1]) return { view: 'search', query: decodeURIComponent(parts.slice(1).join('/')) };
    return { view: 'home' };
  },

  getHomePath() {
    return '/';
  },

  getCategoryPath(categoryId) {
    return categoryId && categoryId !== 'all'
      ? `/category/${encodeURIComponent(categoryId)}`
      : this.getHomePath();
  },

  getToolPath(toolId) {
    return `/${encodeURIComponent(toolId)}`;
  },

  getSearchPath(query) {
    return `/search/${encodeURIComponent(query)}`;
  },

  getAbsoluteUrl(path) {
    return new URL(path, window.location.origin).toString();
  },

  isEmbedMode() {
    return new URLSearchParams(window.location.search).get('embed') === '1';
  },

  getCategoryById(categoryId) {
    return TOOL_CATEGORIES.find(category => category.id === categoryId) || null;
  },

  getVisibleCategories() {
    return TOOL_CATEGORIES.filter(category => !['all', 'favorites'].includes(category.id));
  },

  getCategoryMeta(categoryId) {
    if (!categoryId || ['all', 'favorites'].includes(categoryId)) return null;

    const category = this.getCategoryById(categoryId);
    if (!category) return null;

    const tools = TOOLS.filter(tool => tool.category === categoryId);
    const count = tools.length;
    const lowerName = category.name.toLowerCase();

    return {
      category,
      tools,
      count,
      title: `${category.name} | Tooliest`,
      description: `Explore ${count} free ${lowerName} on Tooliest. Browser-based utilities with no signup, no uploads, and no server processing.`,
      intro: `Browse Tooliest's ${lowerName} and launch every tool instantly in your browser without sending your data to a server.`,
    };
  },

  getRelatedTools(tool, limit = 5) {
    const candidates = [
      ...TOOLS.filter(candidate => candidate.category === tool.category && candidate.id !== tool.id),
      ...TOOLS.filter(candidate =>
        candidate.category !== tool.category &&
        candidate.id !== tool.id &&
        candidate.tags.some(tag => tool.tags.includes(tag))
      ),
    ];

    return candidates.filter((candidate, index) =>
      candidates.findIndex(item => item.id === candidate.id) === index
    ).slice(0, limit);
  },

  getCompareCandidates(tool, limit = 10) {
    return this.getRelatedTools(tool, limit);
  },

  isAppPath(pathname) {
    const normalized = pathname.replace(/\/index\.html$/, '/');
    return normalized === '/' ||
      Boolean(this.parsePath(normalized).view === 'tool') ||
      normalized.startsWith('/tool/') ||
      normalized.startsWith('/category/') ||
      normalized.startsWith('/search/');
  },

  navigate(path, options = {}) {
    const target = new URL(path, window.location.origin);
    const nextPath = target.pathname + target.search + target.hash;
    const method = options.replace ? 'replaceState' : 'pushState';

    history[method]({}, '', nextPath);
    this.handleRoute(options);
  },

  syncSearchInputs(value = '') {
    const normalized = value || '';
    const desktopSearch = document.getElementById('search-input');
    const mobileSearch = document.getElementById('mobile-search-input');
    if (desktopSearch) desktopSearch.value = normalized;
    if (mobileSearch) mobileSearch.value = normalized;
  },

  bindEvents() {
    // Search
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
      searchInput.placeholder = `Search ${TOOLS.length}+ tools...`;
    }
    // BUG-14: Make mobile search placeholder dynamic too
    const mobileSearchEl = document.getElementById('mobile-search-input');
    if (mobileSearchEl) {
      mobileSearchEl.placeholder = `Search ${TOOLS.length}+ tools...`;
    }
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.searchQuery = e.target.value.toLowerCase();
        if (this.currentView === 'home') {
          this.renderToolsGrid();
        } else if (this.searchQuery === '') {
          this.navigate(this.getCategoryPath(this.currentCategory), { replace: true });
        }
      });
      searchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && this.searchQuery) {
          this.navigate(this.getSearchPath(this.searchQuery));
        }
      });
    }
    // Intercept same-origin app links so tool/category navigation stays SPA-fast.
    document.addEventListener('click', (e) => {
      const link = e.target.closest('a[href]');
      if (!link) return;
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      if (link.target && link.target !== '_self') return;
      if (link.hasAttribute('download')) return;

      const href = link.getAttribute('href') || '';
      if (href.startsWith('#/')) {
        e.preventDefault();
        this.navigate(this.pathFromLegacyHash(href));
        return;
      }

      const url = new URL(link.href, window.location.origin);
      if (url.origin !== window.location.origin || !this.isAppPath(url.pathname)) return;

      e.preventDefault();
      this.navigate(url.pathname + url.search + url.hash);
    });

    // Keyboard shortcut for search
    document.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        this.focusSearch();
      }
    });
    // Mobile menu — toggle open/close
    const mobileBtn = document.getElementById('mobile-menu-btn');
    const navLinks = document.getElementById('nav-links');
    let mobileMenuScrollResetTimer = 0;
    const syncMobileMenuState = () => {
      const isOpen = navLinks?.classList.contains('mobile-open');
      document.body.classList.toggle('nav-menu-open', Boolean(isOpen));
      if (mobileBtn) {
        mobileBtn.textContent = isOpen ? '✕' : '☰';
        mobileBtn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
      }
    };
    const forceMobileMenuTop = () => {
      if (!navLinks) return;
      navLinks.scrollTop = 0;
      navLinks.scrollLeft = 0;
      if (typeof navLinks.scrollTo === 'function') {
        try {
          navLinks.scrollTo({ top: 0, left: 0, behavior: 'auto' });
        } catch (_) {
          navLinks.scrollTo(0, 0);
        }
      }
    };
    const resetMobileMenuScroll = () => {
      if (!navLinks) return;
      forceMobileMenuTop();
      window.requestAnimationFrame(forceMobileMenuTop);
      if (mobileMenuScrollResetTimer) clearTimeout(mobileMenuScrollResetTimer);
      mobileMenuScrollResetTimer = window.setTimeout(() => {
        if (navLinks.classList.contains('mobile-open')) {
          forceMobileMenuTop();
          window.requestAnimationFrame(forceMobileMenuTop);
        }
      }, 220);
    };
    const openMobileMenu = () => {
      if (!navLinks) return;
      if (navLinks.contains(document.activeElement) && typeof document.activeElement?.blur === 'function') {
        document.activeElement.blur();
      }
      navLinks.classList.add('mobile-open');
      resetMobileMenuScroll();
      syncMobileMenuState();
    };
    const closeMobileMenu = () => {
      if (!navLinks) return;
      navLinks.classList.remove('mobile-open');
      navLinks.scrollTop = 0;
      syncMobileMenuState();
    };
    mobileBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      if (navLinks?.classList.contains('mobile-open')) {
        closeMobileMenu();
      } else {
        openMobileMenu();
      }
    });
    // Close on outside click
    document.addEventListener('click', (e) => {
      if (navLinks?.classList.contains('mobile-open') && !navLinks.contains(e.target) && e.target !== mobileBtn) {
        closeMobileMenu();
      }
    });
    // Close on Escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && navLinks?.classList.contains('mobile-open')) {
        closeMobileMenu();
      }
    });
    // Close menu when a nav link is clicked (on mobile)
    navLinks?.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', closeMobileMenu);
    });
    navLinks?.addEventListener('animationend', () => {
      if (navLinks.classList.contains('mobile-open')) {
        forceMobileMenuTop();
      }
    });
    window.addEventListener('resize', () => {
      if (window.innerWidth > 768 && navLinks?.classList.contains('mobile-open')) {
        closeMobileMenu();
      }
    });
    // Mobile search overlay
    const mobileSearchBtn = document.getElementById('mobile-search-btn');
    const mobileSearchOverlay = document.getElementById('mobile-search-overlay');
    const mobileSearchInput = document.getElementById('mobile-search-input');
    const mobileSearchClose = document.getElementById('mobile-search-close');
    const mobileSearchResults = document.getElementById('mobile-search-results');

    const openMobileSearch = () => {
      mobileSearchOverlay?.classList.add('open');
      setTimeout(() => mobileSearchInput?.focus(), 100);
    };
    const closeMobileSearch = () => {
      mobileSearchOverlay?.classList.remove('open');
      if (mobileSearchInput) mobileSearchInput.value = '';
      if (mobileSearchResults) mobileSearchResults.innerHTML = '';
    };

    mobileSearchBtn?.addEventListener('click', openMobileSearch);
    mobileSearchClose?.addEventListener('click', closeMobileSearch);
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && mobileSearchOverlay?.classList.contains('open')) closeMobileSearch();
    });

    mobileSearchInput?.addEventListener('input', (e) => {
      const q = e.target.value.toLowerCase().trim();
      if (!q) { if (mobileSearchResults) mobileSearchResults.innerHTML = ''; return; }
      const matches = TOOLS.filter(t =>
        t.name.toLowerCase().includes(q) || t.description.toLowerCase().includes(q) || t.tags.some(tag => tag.includes(q))
      ).slice(0, 12);
      if (mobileSearchResults) {
        mobileSearchResults.innerHTML = matches.length
          ? matches.map(t => `<a class="search-result-item" href="${this.getToolPath(t.id)}" style="display:flex;align-items:center;gap:12px;">
              <span style="font-size:1.4rem;">${t.icon}</span>
              <div><div style="font-weight:600;color:var(--accent-primary);">${t.name}</div><div style="font-size:0.82rem;color:var(--text-secondary);">${t.description.slice(0, 60)}...</div></div>
            </a>`).join('')
          : '<p style="color:var(--text-tertiary);padding:12px 0;">No tools found. Try different keywords.</p>';
        // Close overlay when a result is tapped
        mobileSearchResults.querySelectorAll('.search-result-item').forEach(item => {
          item.addEventListener('click', closeMobileSearch);
        });
      }
    });
  },

  handleRoute(options = {}) {
    const route = this.getRoute();
    if (route.view === 'tool' && route.legacyPath) {
      this.navigate(this.getToolPath(route.toolId), { replace: true });
      return;
    }
    const preserveCollectionScroll = Boolean(options.preserveScroll) &&
      this.currentView === 'home' &&
      !this.searchQuery &&
      (route.view === 'home' || route.view === 'category');
    const preservedScrollY = preserveCollectionScroll ? window.scrollY : 0;
    document.getElementById('nav-links')?.classList.remove('mobile-open');
    document.body.classList.remove('nav-menu-open');
    const mobileMenuButton = document.getElementById('mobile-menu-btn');
    if (mobileMenuButton) {
      mobileMenuButton.textContent = '\u2630';
      mobileMenuButton.setAttribute('aria-expanded', 'false');
    }
    if (route.view !== 'tool' && this.performanceDashboardCleanup) {
      this.performanceDashboardCleanup();
      this.performanceDashboardCleanup = null;
    }

    if (route.view === 'tool' && route.toolId) {
      this.showTool(route.toolId);
    } else if (route.view === 'category' && route.categoryId) {
      this.searchQuery = '';
      this.syncSearchInputs('');
      this.currentCategory = route.categoryId;
      this.currentView = 'home';
      this.renderHome();
      this.setActiveCategory(route.categoryId);
    } else if (route.view === 'search' && route.query) {
      this.currentView = 'search';
      this.searchQuery = route.query.toLowerCase();
      this.syncSearchInputs(route.query);
      this.renderSearchResults();
    } else {
      this.currentView = 'home';
      this.currentCategory = 'all';
      this.searchQuery = '';
      this.syncSearchInputs('');
      this.renderHome();
    }

    if (preserveCollectionScroll) {
      window.scrollTo(0, preservedScrollY);
    } else {
      window.scrollTo(0, 0);
    }

    // Announce route change for screen readers (accessibility)
    const announcer = document.getElementById('route-announcer');
    if (announcer) {
      let label = 'Page loaded';
      if (route.view === 'tool' && route.toolId) {
        const t = TOOLS.find(x => x.id === route.toolId);
        label = t ? t.name + ' tool loaded' : 'Tool page loaded';
      } else if (route.view === 'category' && route.categoryId) {
        const cat = TOOL_CATEGORIES.find(x => x.id === route.categoryId);
        label = cat ? cat.name + ' category' : 'Category loaded';
      } else if (route.view === 'search') {
        label = 'Search results for ' + (route.query || '');
      } else {
        label = 'Tooliest home page';
      }
      announcer.textContent = label;
    }

    this.updateShortcutUI();
  },

  renderHome() {
    const main = document.getElementById('main-content');
    const categoryMeta = this.getCategoryMeta(this.currentCategory);
    main.innerHTML = this.getHeroHTML() +
      this.getRecentlyUsedHTML() +
      this.getMostPopularHTML() +
      this.getFavoritesManagerHTML() +
      this.getCategoriesHTML() +
      '<section class="tools-section"><div class="tools-grid" id="tools-grid"></div></section>' +
      this.getAdHTML('home-bottom');
    this.renderToolsGrid();
    this.bindCategoryTabs();
    this.bindHomeFeaturePanels();
    this.bindToolCardInteractions(main);
    if (categoryMeta) {
      this.updateSEO(categoryMeta.title, categoryMeta.description, null);
    } else if (this.currentCategory === 'favorites') {
      this.updateSEO('Favorite Tools | Tooliest', 'Your saved Tooliest favorites on this device. Export or import them any time with no account required.', null);
    } else {
      this.updateSEO('Tooliest — 80+ Free Online Tools Powered by AI', 'Access 80+ free online tools for text, SEO, CSS, colors, images, JSON, encoding, math, and more. No signup required. AI-powered features included.', null);
    }
  },

  getHeroHTML() {
    const categoryCount = this.getVisibleCategories().length;
    return `<section class="hero">
      <div class="hero-badge"><span class="pulse-dot"></span> Free &amp; No Signup Required</div>
      <h1>Every Tool You Need.<br><span class="gradient-text">Zero Installs.</span></h1>
      <p>${TOOLS.length}+ powerful online tools for developers, designers, writers, and marketers. All free, all instant, all AI-enhanced.</p>
      <div class="hero-stats">
        <div class="hero-stat"><div class="stat-value">${TOOLS.length}+</div><div class="stat-label">Free Tools</div></div>
        <div class="hero-stat"><div class="stat-value">${categoryCount}</div><div class="stat-label">Categories</div></div>
        <div class="hero-stat"><div class="stat-value">0</div><div class="stat-label">Signups Needed</div></div>
      </div>
    </section>`;
  },

  getCategoriesHTML() {
    const tabs = TOOL_CATEGORIES.map(c =>
      `<button class="category-tab${c.id === this.currentCategory ? ' active' : ''}" data-category="${c.id}" aria-pressed="${c.id === this.currentCategory}">
        <span>${c.icon}</span> ${c.name} <span class="tab-count">${c.count}</span>
      </button>`
    ).join('');
    return `<section class="categories-section"><div class="category-tabs" id="category-tabs">${tabs}</div></section>`;
  },

  bindCategoryTabs() {
    document.querySelectorAll('.category-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        this.currentCategory = tab.dataset.category;
        this.navigate(this.getCategoryPath(this.currentCategory), { replace: true, preserveScroll: true });
      });
    });
  },

  setActiveCategory(id) {
    document.querySelectorAll('.category-tab').forEach(t => {
      t.classList.toggle('active', t.dataset.category === id);
      t.setAttribute('aria-pressed', t.dataset.category === id);
    });
  },

  renderToolsGrid() {
    let tools = (this.currentCategory === 'all') 
      ? [...TOOLS] 
      : (this.currentCategory === 'favorites') 
        ? TOOLS.filter(t => this.favorites.includes(t.id))
        : TOOLS.filter(t => t.category === this.currentCategory);
        
    if (this.searchQuery) {
      const q = this.searchQuery;
      tools = TOOLS.filter(t =>
        t.name.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q) ||
        t.tags.some(tag => tag.includes(q)) ||
        t.category.includes(q)
      );
    }
    const grid = document.getElementById('tools-grid');
    if (!grid) return;
    grid.innerHTML = tools.length ? tools.map(t => this.getToolCardHTML(t)).join('') : '<div class="text-center" style="grid-column:1/-1;padding:60px 20px;color:var(--text-tertiary)"><h3>No tools found</h3><p>Try a different search or category</p></div>';
    this.bindToolCardInteractions(grid);
  },

  bindToolCardInteractions(root = document) {
    root.querySelectorAll('.tool-card').forEach(card => {
      if (card.dataset.bound === 'true') return;
      card.dataset.bound = 'true';

      card.addEventListener('click', (e) => {
        if (e.target.closest('.fav-btn')) return;
        this.navigate(this.getToolPath(card.dataset.toolId));
      });

      card.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          this.navigate(this.getToolPath(card.dataset.toolId));
        }
      });

      const favBtn = card.querySelector('.fav-btn');
      if (favBtn) {
        favBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          this.toggleFavorite(card.dataset.toolId);
        });
      }
    });
  },

  toggleFavorite(toolId) {
    if (this.favorites.includes(toolId)) {
      this.favorites = this.favorites.filter(id => id !== toolId);
    } else {
      this.favorites.push(toolId);
    }
    safeLocalSet('tooliest_favorites', JSON.stringify(this.favorites));
    
    // Update count quickly
    const favCat = TOOL_CATEGORIES.find(c => c.id === 'favorites');
    if (favCat) favCat.count = this.favorites.length;
    
    // Refresh without destroying search query
    this.renderHome();
    this.toast(this.favorites.includes(toolId) ? 'Added to favorites ⭐' : 'Removed from favorites');
  },

  getToolCardHTML(tool) {
    const isFav = this.favorites.includes(tool.id);
    return `<div class="tool-card animate-in" data-tool-id="${tool.id}" role="link" tabindex="0" aria-label="Open ${tool.name} tool">
      <button type="button" class="fav-btn${isFav ? ' active' : ''}" aria-label="${isFav ? 'Remove from favorites' : 'Add to favorites'}" aria-pressed="${isFav}">${isFav ? '⭐' : '☆'}</button>
      <div class="tool-card-header">
        <div class="tool-card-icon">${tool.icon}</div>
        <div class="tool-card-info">
          <h3>${tool.name}</h3>
          <div style="display:flex; align-items:center; gap:8px;">
            <span class="tool-category-label">${TOOL_CATEGORIES.find(c => c.id === tool.category)?.name || ''}</span>
            ${tool.isAI ? '<div class="ai-badge">✨ AI</div>' : ''}
          </div>
        </div>
      </div>
      <p>${tool.description}</p>
      <div class="tool-card-tags">${tool.tags.slice(0, 3).map(t => `<span class="tool-tag">${t}</span>`).join('')}</div>
    </div>`;
  },

  getAdHTML(id) {
    return `<div class="container"><div class="ad-space" id="ad-${id}"><!-- Ad Space: Replace with AdSense code --><span>Advertisement</span></div></div>`;
  },

  getPopularTools(limit = 6) {
    return Object.entries(this.toolUsage)
      .sort((a, b) => b[1] - a[1])
      .map(([toolId]) => TOOLS.find(tool => tool.id === toolId))
      .filter(Boolean)
      .slice(0, limit);
  },

  getToolContentSectionsHTML(tool) {
    const categoryName = TOOL_CATEGORIES.find(c => c.id === tool.category)?.name || 'online tools';
    const fallbackExplain = `${tool.name} is part of Tooliest's ${categoryName.toLowerCase()} collection and runs directly in your browser, so your input stays on your device.`;
    const steps = [
      `Open the ${tool.name} workspace.`,
      'Type, paste, upload, or adjust the input fields as needed.',
      'Run the action or conversion to get instant results in your browser.',
      'Copy, download, or reuse the output without sending your data to a server.',
    ];

    return `<div class="tool-content-sections">
      <section class="tool-content-section">
        <h2>What Is ${tool.name}?</h2>
        <p>${tool.description}</p>
        ${tool.education ? `<div class="tool-education-copy">${tool.education}</div>` : `<p>${fallbackExplain}</p>`}
      </section>
      <section class="tool-content-section">
        <h2>How To Use ${tool.name}</h2>
        <ol>${steps.map(step => `<li>${step}</li>`).join('')}</ol>
      </section>
    </div>`;
  },

  getMostPopularHTML() {
    const popularTools = this.getPopularTools(6);
    if (popularTools.length === 0) return '';
    return `<section class="tools-section tools-section-condensed">
      <div class="section-shell">
        <div class="section-heading">
          <h3>Most Popular On This Device</h3>
          <p>Your most-used Tooliest tools based on local browser history.</p>
        </div>
        <div class="related-tools-grid">${popularTools.map(tool => this.getToolCardHTML(tool)).join('')}</div>
      </div>
    </section>`;
  },

  getFavoritesManagerHTML() {
    const favoriteCount = this.favorites.length;
    return `<section class="tools-section tools-section-condensed">
      <div class="section-shell home-utility-grid">
        <div class="home-utility-panel">
          <div class="section-heading">
            <h3>Favorites Backup</h3>
            <p>${favoriteCount ? `${favoriteCount} favorite tool(s) saved on this device.` : 'Save tools with the star button, then export or import them without needing an account.'}</p>
          </div>
          <div class="panel-actions">
            <button class="btn btn-secondary btn-sm" id="favorites-export-btn"${favoriteCount ? '' : ' disabled'}>Export Favorites</button>
            <button class="btn btn-secondary btn-sm" id="favorites-import-btn">Import Favorites</button>
            <input type="file" id="favorites-import-file" class="hidden" accept="application/json">
          </div>
        </div>
        <div class="home-utility-panel">
          <div class="section-heading">
            <h3>Need a Quick Start?</h3>
            <p>Open the guided tour any time to find search, favorites, sharing, install support, and keyboard shortcuts.</p>
          </div>
          <div class="panel-actions">
            <button class="btn btn-secondary btn-sm" id="show-tour-btn">Open Welcome Tour</button>
            <button class="btn btn-secondary btn-sm" id="show-shortcuts-btn">View Shortcuts</button>
          </div>
        </div>
      </div>
    </section>`;
  },

  getToolPageHTML(tool, catName, related, compareCandidates, isEmbed) {
    if (isEmbed) {
      return `<div class="tool-page tool-page-embed">
        <div class="tool-page-header">
          <h1 style="margin:0">${tool.icon} ${tool.name}</h1>
          <p>${tool.description}</p>
        </div>
        <div class="tool-workspace" id="tool-workspace"></div>
      </div>`;
    }

    return `<div class="tool-page">
      <div class="tool-page-header">
        <div class="tool-breadcrumb">
          <a href="${this.getHomePath()}">Home</a>
          <span class="separator">›</span>
          <a href="${this.getCategoryPath(tool.category)}">${catName}</a>
          <span class="separator">›</span>
          <span>${tool.name}</span>
        </div>
        <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px">
          <h1 style="margin:0">${tool.icon} ${tool.name} ${tool.isAI ? '<span class="ai-badge" style="font-size:0.5em;vertical-align:middle">✨ AI-Powered</span>' : ''}</h1>
          <div class="tool-header-actions">
            <button class="btn btn-secondary btn-sm" id="compare-tool-btn" aria-label="Compare this tool with another tool"${compareCandidates.length ? '' : ' disabled'}>Compare</button>
            <button class="btn btn-secondary btn-sm" id="print-tool-btn" aria-label="Print this tool output">Print</button>
            <button class="btn btn-secondary btn-sm" id="share-tool-btn" aria-label="Share this tool">Share</button>
          </div>
        </div>
        <p>${tool.description}</p>
        ${tool.education ? `<div class="tool-education-visible" style="margin-top:16px;background:var(--bg-secondary);padding:16px;border-radius:var(--radius-md);border:1px solid var(--border-color);"><div style="font-weight:600;color:var(--accent-primary);margin-bottom:8px">About this tool</div><div style="font-size:0.9rem;line-height:1.5;color:var(--text-secondary)">${tool.education}</div></div>` : ''}
      </div>
      ${this.getAdHTML('tool-top')}
      <div class="tool-workspace" id="tool-workspace"></div>
      <div class="tool-performance-panel" id="tool-performance-panel"></div>
      ${compareCandidates.length ? `<div class="compare-panel" id="compare-panel">
        <div class="compare-panel-header">
          <div>
            <h3>Compare Tools</h3>
            <p>Open a related tool side by side without losing your place.</p>
          </div>
          <div class="compare-panel-actions">
            <select id="compare-tool-select" aria-label="Select a tool to compare">
              <option value="">Choose a tool</option>
              ${compareCandidates.map(candidate => `<option value="${candidate.id}">${candidate.name}</option>`).join('')}
            </select>
            <button class="btn btn-secondary btn-sm" id="compare-launch-btn">Open Compare View</button>
            <button class="btn btn-secondary btn-sm hidden" id="compare-close-btn">Close</button>
          </div>
        </div>
        <div id="tool-comparison-root"></div>
      </div>` : ''}
      ${this.getToolContentSectionsHTML(tool)}
      ${this.getAdHTML('tool-bottom')}
      ${related.length ? `<div class="related-tools"><h3>You May Also Like</h3><div class="related-tools-grid">${related.map(r => this.getToolCardHTML(r)).join('')}</div></div>` : ''}
    </div>`;
  },

  // ===== TOOL PAGE RENDERING =====
  showTool(toolId) {
    const tool = TOOLS.find(t => t.id === toolId);
    if (!tool) { this.navigate(this.getHomePath(), { replace: true }); return; }
    const isEmbed = this.isEmbedMode();
    this.currentView = 'tool';
    this.activeToolId = toolId;
    if (!isEmbed) {
      this.trackUsage(toolId);
    }
    this.updateSEO(tool.meta.title, tool.meta.desc, tool);
    const catName = TOOL_CATEGORIES.find(c => c.id === tool.category)?.name || '';
    const main = document.getElementById('main-content');
    
    const related = this.getRelatedTools(tool, 5);
    const compareCandidates = this.getCompareCandidates(tool, 10);
    main.innerHTML = this.getToolPageHTML(tool, catName, related, compareCandidates, isEmbed);
    // Render tool UI
    const workspace = document.getElementById('tool-workspace');
    ToolRenderers.render(toolId, workspace);
    this.enhanceRuntimeMedia(main, tool);

    if (!isEmbed) {
      this.startToolPerformanceTracking(tool);
      document.getElementById('share-tool-btn')?.addEventListener('click', () => this.shareTool(tool));
      document.getElementById('print-tool-btn')?.addEventListener('click', () => this.printToolPage());
      document.getElementById('compare-tool-btn')?.addEventListener('click', () => {
        document.getElementById('compare-panel')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
      document.getElementById('compare-launch-btn')?.addEventListener('click', () => {
        const compareToolId = document.getElementById('compare-tool-select')?.value || '';
        this.openToolComparison(tool, compareToolId);
      });
      document.getElementById('compare-close-btn')?.addEventListener('click', () => this.closeToolComparison());
    }

    this.bindToolCardInteractions(main);
  },

  renderSearchResults() {
    const main = document.getElementById('main-content');
    const q = this.searchQuery;
    const results = TOOLS.filter(t =>
      t.name.toLowerCase().includes(q) || t.description.toLowerCase().includes(q) || t.tags.some(tag => tag.includes(q))
    );
    // BUG-17: Sanitize search query to prevent XSS — use textContent for user input
    const escapeHTML = (str) => str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
    const safeQ = escapeHTML(q);
    main.innerHTML = `<div class="search-results">
      <h2>Search results for "${safeQ}"</h2>
      <p style="color:var(--text-secondary);margin-bottom:24px">${results.length} tool(s) found</p>
      ${results.map(t => `<a class="search-result-item" href="${this.getToolPath(t.id)}" style="display:block">
        <h3>${t.icon} ${t.name}</h3><p>${t.description}</p>
      </a>`).join('') || '<p>No tools found. Try different keywords.</p>'}
    </div>`;
    this.updateSEO(`Search: ${q} | Tooliest`, `Search Tooliest's 80+ free online tools for "${q}".`, null);
  },

  setupAutoSave(inputId, storageKey) {
    const inp = document.getElementById(inputId);
    if (!inp) return;
    const saved = safeLocalRead('tooliest_save_' + storageKey, null);
    if (typeof saved === 'string') inp.value = saved;
    let timeout;
    inp.addEventListener('input', () => {
      clearTimeout(timeout);
      timeout = setTimeout(() => safeLocalSet('tooliest_save_' + storageKey, inp.value), 800);
    });
  },

  showInstallPrompt() {
    if (this.isEmbedMode()) return;
    if (document.getElementById('pwa-install-banner') || safeLocalRead('tooliest_pwa_dismissed')) return;
    const banner = document.createElement('div');
    banner.id = 'pwa-install-banner';
    banner.innerHTML = `
      <div style="display:flex;align-items:center;gap:12px;">
        <span style="font-size:1.8rem">📲</span>
        <div><div style="font-weight:600;color:var(--text-primary)">Install Tooliest</div><div style="font-size:0.85rem;color:var(--text-secondary)">Works 100% Offline</div></div>
      </div>
      <div style="display:flex;gap:12px;align-items:center;">
        <button id="pwa-install-btn" class="btn btn-primary" style="padding:6px 12px;font-size:0.9rem">Install App</button>
        <button id="pwa-close-btn" style="background:none;border:none;color:var(--text-tertiary);cursor:pointer;font-size:1rem;padding:4px">✕</button>
      </div>`;
    document.body.appendChild(banner);
    document.getElementById('pwa-install-btn').addEventListener('click', async () => {
      if (this.deferredPrompt) {
        this.deferredPrompt.prompt();
        const { outcome } = await this.deferredPrompt.userChoice;
        if (outcome === 'accepted') banner.remove();
        this.deferredPrompt = null;
      }
    });
    document.getElementById('pwa-close-btn').addEventListener('click', () => {
      safeLocalSet('tooliest_pwa_dismissed', '1');
      banner.classList.remove('show');
      setTimeout(() => banner.remove(), 300);
    });
    requestAnimationFrame(() => banner.classList.add('show'));
  },

  updateSEO(title, description, tool) {
    document.title = title;
    let meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute('content', description);
    // Update OG tags
    const ogTitle = document.querySelector('meta[property="og:title"]');
    const ogDesc = document.querySelector('meta[property="og:description"]');
    const ogUrl = document.querySelector('meta[property="og:url"]');
    const twTitle = document.querySelector('meta[name="twitter:title"]');
    const twDesc = document.querySelector('meta[name="twitter:description"]');
    const canonical = document.querySelector('link[rel="canonical"]');
    const robots = document.querySelector('meta[name="robots"]');
    const routePath = tool
      ? this.getToolPath(tool.id)
      : (this.currentView === 'search' && this.searchQuery)
        ? this.getSearchPath(this.searchQuery)
        : this.getCategoryPath(this.currentCategory);
    const absoluteUrl = this.getAbsoluteUrl(routePath);
    if (ogTitle) ogTitle.setAttribute('content', title);
    if (ogDesc) ogDesc.setAttribute('content', description);
    if (ogUrl) ogUrl.setAttribute('content', absoluteUrl);
    if (twTitle) twTitle.setAttribute('content', title);
    if (twDesc) twDesc.setAttribute('content', description);
    if (canonical) canonical.setAttribute('href', absoluteUrl);
    if (robots) {
      robots.setAttribute('content', (this.currentView === 'search' || this.currentCategory === 'favorites') ? 'noindex, follow' : 'index, follow');
    }
    // Remove old dynamic schemas
    document.querySelectorAll('script[data-dynamic-schema]').forEach(s => s.remove());
    // Inject per-tool JSON-LD + BreadcrumbList if on a tool page
    if (tool) {
      const catName = TOOL_CATEGORIES.find(c => c.id === tool.category)?.name || tool.category;
      const toolSchema = {
        '@context': 'https://schema.org',
        '@type': 'WebApplication',
        'name': tool.name,
        'url': absoluteUrl,
        'description': tool.meta?.desc || tool.description,
        'applicationCategory': 'UtilityApplication',
        'operatingSystem': 'Any',
        'offers': { '@type': 'Offer', 'price': '0', 'priceCurrency': 'USD' },
        'dateModified': new Date().toISOString().split('T')[0]
      };
      const breadcrumb = {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        'itemListElement': [
          { '@type': 'ListItem', 'position': 1, 'name': 'Home', 'item': 'https://tooliest.com/' },
          { '@type': 'ListItem', 'position': 2, 'name': catName, 'item': 'https://tooliest.com' + this.getCategoryPath(tool.category) },
          { '@type': 'ListItem', 'position': 3, 'name': tool.name, 'item': absoluteUrl }
        ]
      };
      // AEO-02: HowTo schema for tool pages
      const howTo = {
        '@context': 'https://schema.org',
        '@type': 'HowTo',
        'name': 'How to use ' + tool.name + ' online',
        'description': tool.meta?.desc || tool.description,
        'step': [
          { '@type': 'HowToStep', 'position': 1, 'name': 'Open the tool', 'text': 'Open ' + absoluteUrl + ' in your browser.' },
          { '@type': 'HowToStep', 'position': 2, 'name': 'Enter your input', 'text': 'Type, paste, or upload your content into the tool workspace' },
          { '@type': 'HowToStep', 'position': 3, 'name': 'Get results', 'text': 'Click the action button to process your input and get instant results' },
          { '@type': 'HowToStep', 'position': 4, 'name': 'Copy or download', 'text': 'Copy the output to clipboard or download the result file' }
        ],
        'tool': { '@type': 'HowToTool', 'name': 'Web Browser' }
      };
      [toolSchema, breadcrumb, howTo].forEach(schema => {
        const script = document.createElement('script');
        script.type = 'application/ld+json';
        script.setAttribute('data-dynamic-schema', 'true');
        script.textContent = JSON.stringify(schema);
        document.head.appendChild(script);
      });
    } else {
      const categoryMeta = this.getCategoryMeta(this.currentCategory);
      if (!categoryMeta) return;

      const collectionSchema = {
        '@context': 'https://schema.org',
        '@type': 'CollectionPage',
        name: categoryMeta.category.name,
        url: absoluteUrl,
        description: categoryMeta.description,
        dateModified: new Date().toISOString().split('T')[0],
        isPartOf: 'https://tooliest.com/',
      };
      const breadcrumb = {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://tooliest.com/' },
          { '@type': 'ListItem', position: 2, name: categoryMeta.category.name, item: absoluteUrl }
        ]
      };
      const itemList = {
        '@context': 'https://schema.org',
        '@type': 'ItemList',
        name: `${categoryMeta.category.name} on Tooliest`,
        itemListElement: categoryMeta.tools.slice(0, 20).map((candidate, index) => ({
          '@type': 'ListItem',
          position: index + 1,
          url: this.getAbsoluteUrl(this.getToolPath(candidate.id)),
          name: candidate.name,
        })),
      };
      [collectionSchema, breadcrumb, itemList].forEach(schema => {
        const script = document.createElement('script');
        script.type = 'application/ld+json';
        script.setAttribute('data-dynamic-schema', 'true');
        script.textContent = JSON.stringify(schema);
        document.head.appendChild(script);
      });
    }
  },

  toast(message, type = 'success') {
    const existing = document.querySelector('.toast');
    if (existing) existing.remove();
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    (document.getElementById('toast-container') || document.body).appendChild(toast);
    requestAnimationFrame(() => toast.classList.add('show'));
    setTimeout(() => { toast.classList.remove('show'); setTimeout(() => toast.remove(), 400); }, 2500);
  },
  // ===== FEAT-01: THEME TOGGLE =====
  initTheme() {
    const saved = safeLocalRead('tooliest_theme', 'dark') || 'dark';
    document.documentElement.setAttribute('data-theme', saved);
    // Update toggle button icon after DOM loads
    setTimeout(() => {
      const btn = document.getElementById('theme-toggle-btn');
      if (btn) btn.textContent = saved === 'light' ? '🌙' : '☀️';
    }, 0);
  },

  toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme') || 'dark';
    const next = current === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    safeLocalSet('tooliest_theme', next);
    const btn = document.getElementById('theme-toggle-btn');
    if (btn) btn.textContent = next === 'light' ? '🌙' : '☀️';
    this.toast(next === 'light' ? 'Light mode enabled ☀️' : 'Dark mode enabled 🌙');
  },

  // ===== FEAT-02: TOOL USAGE TRACKING =====
  trackUsage(toolId) {
    this.toolUsage[toolId] = (this.toolUsage[toolId] || 0) + 1;
    // Store last-used timestamp
    const recent = safeLocalGet('tooliest_recent', []);
    const filtered = recent.filter(id => id !== toolId);
    filtered.unshift(toolId);
    safeLocalSet('tooliest_recent', JSON.stringify(filtered.slice(0, 10)));
    safeLocalSet('tooliest_usage', JSON.stringify(this.toolUsage));
  },

  getRecentlyUsedHTML() {
    const recent = safeLocalGet('tooliest_recent', []).slice(0, 5);
    if (recent.length === 0) return '';
    const recentTools = recent.map(id => TOOLS.find(t => t.id === id)).filter(Boolean);
    if (recentTools.length === 0) return '';
    return `<section class="tools-section" style="padding-bottom:0">
      <div style="max-width:var(--max-width);margin:0 auto;padding:0 24px">
        <h3 style="font-size:1.1rem;font-weight:700;margin-bottom:16px;color:var(--text-secondary)">⏱️ Recently Used</h3>
        <div class="related-tools-grid">${recentTools.map(t => this.getToolCardHTML(t)).join('')}</div>
      </div>
    </section>`;
  },

  // ===== FEAT-04: WEB SHARE API =====
  shareTool(tool) {
    const url = this.getAbsoluteUrl(this.getToolPath(tool.id));
    const shareData = { title: tool.name + ' — Free Online Tool', text: tool.description, url };
    if (navigator.share) {
      navigator.share(shareData).catch(() => {});
    } else {
      navigator.clipboard.writeText(url).then(() => this.toast('Link copied to clipboard! 📋'));
    }
  },

  printToolPage() {
    window.print();
  },

  bindHomeFeaturePanels() {
    const exportBtn = document.getElementById('favorites-export-btn');
    const importBtn = document.getElementById('favorites-import-btn');
    const importInput = document.getElementById('favorites-import-file');

    exportBtn?.addEventListener('click', () => this.exportFavorites());
    importBtn?.addEventListener('click', () => importInput?.click());
    importInput?.addEventListener('change', (event) => {
      const file = event.target.files && event.target.files[0];
      if (file) {
        this.importFavorites(file);
      }
      event.target.value = '';
    });

    document.getElementById('show-tour-btn')?.addEventListener('click', () => this.showWelcomeTour(true));
    document.getElementById('show-shortcuts-btn')?.addEventListener('click', () => this.showShortcuts());
  },

  exportFavorites() {
    if (!this.favorites.length) {
      this.toast('Save at least one favorite before exporting.', 'error');
      return;
    }

    const payload = {
      source: 'Tooliest',
      version: 1,
      exportedAt: new Date().toISOString(),
      favorites: this.favorites,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'tooliest-favorites.json';
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    this.toast('Favorites exported successfully.');
  },

  importFavorites(file) {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result || '{}'));
        const imported = Array.isArray(parsed) ? parsed : parsed.favorites;
        if (!Array.isArray(imported)) {
          throw new Error('Invalid favorites file');
        }

        const validIds = imported.filter((toolId, index) =>
          typeof toolId === 'string' &&
          TOOLS.some(tool => tool.id === toolId) &&
          imported.indexOf(toolId) === index
        );

        if (!validIds.length) {
          this.toast('No valid Tooliest favorites were found in that file.', 'error');
          return;
        }

        this.favorites = [...new Set([...this.favorites, ...validIds])];
        safeLocalSet('tooliest_favorites', JSON.stringify(this.favorites));
        const favCategory = TOOL_CATEGORIES.find(category => category.id === 'favorites');
        if (favCategory) favCategory.count = this.favorites.length;
        this.renderHome();
        this.toast(`Imported ${validIds.length} favorite tool(s).`);
      } catch (error) {
        this.toast('That file could not be imported.', 'error');
      }
    };
    reader.readAsText(file);
  },

  maybeShowWelcomeTour() {
    if (this.currentView !== 'home' || this.currentCategory !== 'all' || this.searchQuery) return;
    if (safeLocalRead('tooliest_tour_completed')) return;
    this.showWelcomeTour();
  },

  getWelcomeTourSteps() {
    const touchOnly = this.isTouchOnlyDevice();
    return [
      {
        title: 'Search instantly',
        description: touchOnly
          ? 'Use the search bar to jump to any tool without covering the workspace.'
          : 'Use the search bar or press Ctrl + K to jump to any tool.',
        note: touchOnly
          ? 'Keyboard shortcuts are available on desktop devices or when you connect a physical keyboard.'
          : '',
      },
      {
        title: 'Save favorites',
        description: 'Star the tools you use most, then export or import them across devices with a simple JSON file.',
        note: '',
      },
      {
        title: 'Use side-by-side compare',
        description: 'On tool pages, open related tools next to each other to compare inputs and outputs without extra tabs.',
        note: '',
      },
      {
        title: 'Stay productive offline',
        description: 'Install Tooliest as a PWA and keep your most-used browser tools close even on slower connections.',
        note: '',
      },
    ];
  },

  showWelcomeTour(force = false) {
    if (!force && safeLocalRead('tooliest_tour_completed')) return;
    if (document.getElementById('welcome-tour-overlay')) return;

    const steps = this.getWelcomeTourSteps();
    const overlay = document.createElement('div');
    overlay.id = 'welcome-tour-overlay';
    overlay.innerHTML = `<div class="tour-panel" role="dialog" aria-modal="true" aria-label="Welcome to Tooliest">
      <div class="tour-header">
        <div>
          <h2>Welcome to Tooliest</h2>
          <p>Everything stays in your browser. Here are the fastest ways to get value from the site.</p>
        </div>
        <button type="button" class="tour-close-btn" id="welcome-tour-close" aria-label="Close welcome tour">Close</button>
      </div>
      <div class="tour-mobile-meta" aria-live="polite">
        <span class="tour-progress-label">Step <span id="tour-current-step">1</span> of ${steps.length}</span>
        <div class="tour-pagination" role="tablist" aria-label="Welcome tour progress">
          ${steps.map((step, index) => `<button type="button" class="tour-dot${index === 0 ? ' active' : ''}" data-tour-dot="${index}" aria-label="Go to step ${index + 1}: ${step.title}"></button>`).join('')}
        </div>
      </div>
      <div class="tour-steps">
        ${steps.map((step, index) => `<div class="tour-step${index === 0 ? ' is-active' : ''}" data-tour-step="${index}">
          <span class="tour-step-number">${String(index + 1).padStart(2, '0')}</span>
          <strong>${step.title}</strong>
          <p>${step.description}</p>
          ${step.note ? `<div class="tour-step-note">${step.note}</div>` : ''}
        </div>`).join('')}
      </div>
      <div class="tour-actions">
        <button type="button" class="btn btn-secondary btn-sm" id="tour-prev-btn">Back</button>
        <button type="button" class="btn btn-primary" id="welcome-tour-done">Start Exploring</button>
      </div>
    </div>`;

    document.body.appendChild(overlay);
    const panel = overlay.querySelector('.tour-panel');
    const prevButton = overlay.querySelector('#tour-prev-btn');
    const primaryButton = overlay.querySelector('#welcome-tour-done');
    const currentStepLabel = overlay.querySelector('#tour-current-step');
    const stepEls = Array.from(overlay.querySelectorAll('.tour-step'));
    const dotEls = Array.from(overlay.querySelectorAll('.tour-dot'));
    let activeStep = 0;

    const syncTourState = () => {
      const compact = this.shouldUseCompactTour();
      panel?.setAttribute('data-compact', compact ? 'true' : 'false');

      stepEls.forEach((stepEl, index) => {
        const isActive = index === activeStep;
        stepEl.classList.toggle('is-active', isActive);
        stepEl.hidden = compact ? !isActive : false;
      });

      dotEls.forEach((dotEl, index) => {
        const isActive = index === activeStep;
        dotEl.classList.toggle('active', isActive);
        dotEl.setAttribute('aria-current', isActive ? 'step' : 'false');
      });

      if (currentStepLabel) {
        currentStepLabel.textContent = String(activeStep + 1);
      }

      if (prevButton) {
        prevButton.hidden = !compact;
        prevButton.disabled = activeStep === 0;
      }

      if (primaryButton) {
        primaryButton.textContent = compact && activeStep < stepEls.length - 1
          ? 'Next Step'
          : 'Start Exploring';
      }
    };

    const dismiss = () => {
      window.removeEventListener('resize', syncTourState);
      safeLocalSet('tooliest_tour_completed', '1');
      overlay.remove();
    };

    overlay.addEventListener('click', (event) => {
      if (event.target === overlay) dismiss();
    });
    prevButton?.addEventListener('click', () => {
      activeStep = Math.max(0, activeStep - 1);
      syncTourState();
    });
    dotEls.forEach((dotEl) => {
      dotEl.addEventListener('click', () => {
        activeStep = Number(dotEl.dataset.tourDot) || 0;
        syncTourState();
      });
    });
    document.getElementById('welcome-tour-close')?.addEventListener('click', dismiss);
    primaryButton?.addEventListener('click', () => {
      if (this.shouldUseCompactTour() && activeStep < stepEls.length - 1) {
        activeStep += 1;
        syncTourState();
        return;
      }
      dismiss();
    });
    window.addEventListener('resize', syncTourState, { passive: true });
    syncTourState();
  },

  enhanceRuntimeMedia(root, tool) {
    root?.querySelectorAll('img').forEach((img, index) => {
      if (!img.getAttribute('alt')) {
        img.setAttribute('alt', `${tool.name} preview ${index + 1}`);
      }
      if (!img.getAttribute('loading')) {
        img.setAttribute('loading', 'lazy');
      }
      if (!img.getAttribute('decoding')) {
        img.setAttribute('decoding', 'async');
      }
    });
  },

  renderToolPerformancePanel(toolId) {
    const panel = document.getElementById('tool-performance-panel');
    if (!panel) return;

    const history = safeLocalGet(`tooliest_perf_${toolId}`, []);
    if (!history.length) {
      panel.innerHTML = `<div class="perf-panel">
        <div class="section-heading">
          <h3>Performance Metrics</h3>
          <p>Tooliest measures interactions locally in your browser. Run this tool to see how fast it responds on your device.</p>
        </div>
      </div>`;
      return;
    }

    const last = history[history.length - 1];
    const durations = history.map(entry => Number(entry.duration) || 0).filter(Boolean);
    const average = durations.reduce((sum, value) => sum + value, 0) / durations.length;
    const fastest = Math.min(...durations);
    const slowest = Math.max(...durations);

    panel.innerHTML = `<div class="perf-panel">
      <div class="section-heading">
        <h3>Performance Metrics</h3>
        <p>Measured locally on this device from your most recent tool interactions.</p>
      </div>
      <div class="perf-grid">
        <div class="perf-card"><span>Last action</span><strong>${last.label}</strong></div>
        <div class="perf-card"><span>Last run</span><strong>${last.duration.toFixed(1)} ms</strong></div>
        <div class="perf-card"><span>Average</span><strong>${average.toFixed(1)} ms</strong></div>
        <div class="perf-card"><span>Fastest</span><strong>${fastest.toFixed(1)} ms</strong></div>
        <div class="perf-card"><span>Slowest</span><strong>${slowest.toFixed(1)} ms</strong></div>
        <div class="perf-card"><span>Samples</span><strong>${durations.length}</strong></div>
      </div>
    </div>`;
  },

  recordToolPerformance(toolId, label, duration) {
    const targetToolId = toolId || this.activeToolId;
    if (!targetToolId || !Number.isFinite(duration) || duration < 0) return;

    const historyKey = `tooliest_perf_${targetToolId}`;
    const history = safeLocalGet(historyKey, []);
    history.push({
      label: (label || 'Tool interaction').trim().slice(0, 60),
      duration: Number(duration.toFixed(2)),
      timestamp: new Date().toISOString(),
    });
    safeLocalSet(historyKey, JSON.stringify(history.slice(-20)));
    this.pendingPerformanceMeasurement = null;
    this.renderToolPerformancePanel(targetToolId);
  },

  startToolPerformanceTracking(tool) {
    if (this.performanceDashboardCleanup) {
      this.performanceDashboardCleanup();
      this.performanceDashboardCleanup = null;
    }

    const workspace = document.getElementById('tool-workspace');
    if (!workspace) return;

    this.renderToolPerformancePanel(tool.id);

    const capture = (event, fallbackLabel) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      if (target.closest('.copy-btn')) return;
      const label = target.closest('button')?.textContent?.trim() ||
        target.closest('label')?.textContent?.trim() ||
        fallbackLabel;
      this.pendingPerformanceMeasurement = {
        toolId: tool.id,
        label,
        start: performance.now(),
      };
    };

    const clickHandler = (event) => capture(event, 'Tool action');
    const inputHandler = (event) => capture(event, 'Live update');

    workspace.addEventListener('click', clickHandler, true);
    workspace.addEventListener('input', inputHandler, true);
    workspace.addEventListener('change', inputHandler, true);

    let mutationScheduled = false;
    const observer = new MutationObserver(() => {
      this.enhanceRuntimeMedia(workspace, tool);
      if (!this.pendingPerformanceMeasurement || mutationScheduled) return;
      mutationScheduled = true;
      requestAnimationFrame(() => {
        mutationScheduled = false;
        if (!this.pendingPerformanceMeasurement) return;
        const duration = performance.now() - this.pendingPerformanceMeasurement.start;
        if (duration <= 5000) {
          this.recordToolPerformance(
            this.pendingPerformanceMeasurement.toolId,
            this.pendingPerformanceMeasurement.label,
            duration
          );
        } else {
          this.pendingPerformanceMeasurement = null;
        }
      });
    });

    observer.observe(workspace, {
      subtree: true,
      childList: true,
      characterData: true,
      attributes: true,
      attributeFilter: ['class', 'style', 'value', 'src'],
    });

    this.performanceDashboardCleanup = () => {
      workspace.removeEventListener('click', clickHandler, true);
      workspace.removeEventListener('input', inputHandler, true);
      workspace.removeEventListener('change', inputHandler, true);
      observer.disconnect();
      this.pendingPerformanceMeasurement = null;
    };
  },

  openToolComparison(primaryTool, compareToolId) {
    const comparisonRoot = document.getElementById('tool-comparison-root');
    const closeButton = document.getElementById('compare-close-btn');
    const compareTool = TOOLS.find(tool => tool.id === compareToolId);

    if (!comparisonRoot || !compareTool) {
      this.toast('Choose a related tool to compare.', 'error');
      return;
    }

    comparisonRoot.innerHTML = `<div class="compare-layout">
      <div class="compare-pane">
        <div class="compare-pane-header">
          <strong>${primaryTool.name}</strong>
          <span>Current tool</span>
        </div>
        <iframe src="${this.getToolPath(primaryTool.id)}?embed=1" title="${primaryTool.name} comparison panel" loading="lazy"></iframe>
      </div>
      <div class="compare-pane">
        <div class="compare-pane-header">
          <strong>${compareTool.name}</strong>
          <span>Related tool</span>
        </div>
        <iframe src="${this.getToolPath(compareTool.id)}?embed=1" title="${compareTool.name} comparison panel" loading="lazy"></iframe>
      </div>
    </div>`;
    closeButton?.classList.remove('hidden');
    comparisonRoot.scrollIntoView({ behavior: 'smooth', block: 'start' });
  },

  closeToolComparison() {
    const comparisonRoot = document.getElementById('tool-comparison-root');
    comparisonRoot?.replaceChildren();
    document.getElementById('compare-close-btn')?.classList.add('hidden');
  },

  // ===== FEAT-03: KEYBOARD SHORTCUTS PANEL =====
  showShortcuts() {
    const existing = document.getElementById('shortcuts-overlay');
    if (existing) { existing.remove(); return; }
    const showKeyboardShortcuts = this.shouldShowKeyboardShortcutHints();
    const overlay = document.createElement('div');
    overlay.id = 'shortcuts-overlay';
    overlay.innerHTML = `<div class="shortcuts-panel">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px">
        <h2 style="font-size:1.2rem;font-weight:700">${showKeyboardShortcuts ? '⌨️ Keyboard Shortcuts' : '⌨️ Desktop Shortcut Tips'}</h2>
        <button id="shortcuts-close" style="background:none;border:none;color:var(--text-secondary);font-size:1.3rem;cursor:pointer">✕</button>
      </div>
      ${showKeyboardShortcuts
        ? `<div class="shortcut-list">
          <div class="shortcut-item"><kbd>Ctrl</kbd> + <kbd>K</kbd><span>Search tools</span></div>
          <div class="shortcut-item"><kbd>?</kbd><span>Show shortcuts</span></div>
          <div class="shortcut-item"><kbd>H</kbd><span>Go home</span></div>
          <div class="shortcut-item"><kbd>T</kbd><span>Toggle theme</span></div>
          <div class="shortcut-item"><kbd>Esc</kbd><span>Close overlay</span></div>
        </div>`
        : `<div class="shortcut-device-note">
          <strong>Keyboard shortcuts are available on desktop devices.</strong>
          <p>Connect a physical keyboard to use shortcuts here, or keep using the on-screen search, menu, and theme controls.</p>
        </div>`}
    </div>`;
    document.body.appendChild(overlay);
    overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });
    document.getElementById('shortcuts-close')?.addEventListener('click', () => overlay.remove());
  },

  // ===== FEAT-05: WHAT'S NEW CHANGELOG =====
  showChangelog() {
    const existing = document.getElementById('changelog-overlay');
    if (existing) { existing.remove(); return; }
    const overlay = document.createElement('div');
    overlay.id = 'changelog-overlay';
    overlay.innerHTML = `<div class="changelog-panel">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px">
        <h2 style="font-size:1.2rem;font-weight:700">🆕 What's New</h2>
        <button id="changelog-close" style="background:none;border:none;color:var(--text-secondary);font-size:1.3rem;cursor:pointer">✕</button>
      </div>
      ${TOOLIEST_CHANGELOG.map(v => `
        <div class="changelog-entry">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
            <span style="font-weight:700;color:var(--accent-primary)">v${v.version}</span>
            <span style="font-size:0.8rem;color:var(--text-tertiary)">${v.date}</span>
          </div>
          <ul style="margin:0;padding-left:18px;color:var(--text-secondary);font-size:0.9rem;line-height:1.7">
            ${v.items.map(i => '<li>' + i + '</li>').join('')}
          </ul>
        </div>
      `).join('')}
    </div>`;
    document.body.appendChild(overlay);
    overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });
    document.getElementById('changelog-close')?.addEventListener('click', () => overlay.remove());
    safeLocalSet('tooliest_changelog_seen', TOOLIEST_CHANGELOG[0].version);
  },
};

// === Clipboard Helper ===
function copyToClipboard(text, btn) {
  navigator.clipboard.writeText(text).then(() => {
    App.toast('Copied to clipboard!');
    if (btn) { btn.textContent = '✓ Copied'; btn.classList.add('copied'); setTimeout(() => { btn.textContent = 'Copy'; btn.classList.remove('copied'); }, 1500); }
  });
}

// === Global Keyboard Shortcuts ===
document.addEventListener('keydown', (e) => {
  // Ctrl+K: Focus search (works everywhere)
  if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
    e.preventDefault();
    App.focusSearch();
    return;
  }
  // Esc: close overlays
  if (e.key === 'Escape') {
    document.getElementById('shortcuts-overlay')?.remove();
    document.getElementById('changelog-overlay')?.remove();
    return;
  }
  // Don't trigger letter shortcuts if typing in input fields
  if (['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) return;
  if (e.key === '?') { e.preventDefault(); App.showShortcuts(); }
  if (e.key === 'h' || e.key === 'H') { App.navigate(App.getHomePath()); }
  if (e.key === 't' || e.key === 'T') { App.toggleTheme(); }
});

// === INIT ===
document.addEventListener('DOMContentLoaded', () => App.init());
