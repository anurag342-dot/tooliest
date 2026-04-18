// ============================================
// TOOLIEST.COM — Main Application (SPA Router)
// ============================================

const TOOLIEST_CHANGELOG = [
  { version: '3.4', date: '2026-04-18', items: ['Made FAQ, why-use, and who-uses sections visible in the live SPA tool pages', 'Restored category FAQ/supporting sections during normal client-side navigation'] },
  { version: '3.3', date: '2026-04-18', items: ['Removed the redundant Popular This Week panel from the homepage', 'Kept Recently Used and Most Popular On This Device as the primary personal discovery sections'] },
  { version: '3.2', date: '2026-04-18', items: ['Cut mobile render-blocking CSS with an inline critical shell', 'Preserved prerendered home and category pages on first load', 'Batched large tool-grid rendering to keep the main thread responsive'] },
  { version: '3.1', date: '2026-04-18', items: ['Added a mobile quick-action bar on tool pages', 'Improved category tab scroll discoverability with swipe hints', 'Finished the remaining mobile audit navigation and paint polish'] },
  { version: '3.0', date: '2026-04-18', items: ['Hardened mobile safe-area handling and touch targets', 'Added reduced-motion and tablet layout improvements', 'Upgraded PWA metadata and mobile menu swipe dismissal'] },
  { version: '2.9', date: '2026-04-17', items: ['Rebuilt Image EXIF Privacy Stripper with explicit clean-download actions and lossless metadata stripping for JPEG, PNG, and WebP'] },
  { version: '2.8', date: '2026-04-17', items: ['Auto-linked visible labels to tool inputs for broader accessibility coverage'] },
  { version: '2.7', date: '2026-04-17', items: ['Cut compare view overhead by reusing the live current workspace', 'Added a weekly popularity section powered by local usage history', 'Added an opt-in email capture prompt for repeat Tooliest users'] },
  { version: '2.6', date: '2026-04-17', items: ['Added browser-based QR Code Generator with PNG download', 'Added Ctrl + / shortcut to reopen your most recently used tool', 'Refreshed featured tool discovery to surface QR workflows faster'] },
  { version: '2.5', date: '2026-04-06', items: ['Added prerendered category pages for SEO', 'Added favorites export and import backup', 'Introduced welcome tour and performance metrics', 'Added side-by-side comparison mode for related tools'] },
  { version: '2.4', date: '2026-04-06', items: ['Added dark/light theme toggle', 'Keyboard shortcuts panel (press ?)', 'Tool sharing via Web Share API', 'Cross-category related tools'] },
  { version: '2.3', date: '2026-04-05', items: ['Expanded structured data across tool pages', 'Improved accessibility states for favorites and categories', 'Strengthened offline caching and font loading'] },
  { version: '2.2', date: '2026-04-04', items: ['80+ tools now available', 'Cookie consent and GDPR compliance', 'PWA offline support improved'] },
  { version: '2.1', date: '2026-04-02', items: ['AI-powered tools launched', 'Image EXIF privacy stripper', 'Browser-based audio converter released'] },
  { version: '2.0', date: '2026-03-28', items: ['Complete redesign with glassmorphism UI', 'Added 30+ new tools', 'Mobile-first responsive layout'] },
];
const TOOLIEST_ASSET_VERSION = window.__TOOLIEST_ASSET_VERSION || '20260418v25';
const TOOLIEST_REPOSITORY_URL = 'https://github.com/anurag342-dot/tooliest';
const TOOLIEST_CONTACT_EMAIL = 'tooliestinternet@gmail.com';
const TOOLIEST_THEME_COLORS = {
  dark: '#8b5cf6',
  light: '#f8f9fc',
};

// Safe localStorage helper — prevents crashes in private browsing or restricted environments
function safeLocalGet(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) return fallback;
    try {
      return JSON.parse(raw);
    } catch (e) {
      // [TOOLIEST AUDIT] Surface corrupted localStorage values instead of failing silently.
      console.warn(`[Tooliest] Failed to parse localStorage key "${key}":`, e);
      return fallback;
    }
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
  toolReadyStateTimer: null,
  comparisonRestoreState: null,
  emailCaptureTimer: null,
  categoryTabsStateHandler: null,
  categoryTabsResizeHandler: null,
  initialRouteHandled: false,
  pendingGridRenderToken: 0,
  homeEnhancementTask: null,

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
        document.body.classList.remove('pwa-install-open');
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
      this.scheduleIdleTask(() => this.maybeShowWelcomeTour(), 1800);
    }
  },

  scheduleIdleTask(callback, timeout = 1200) {
    if ('requestIdleCallback' in window) {
      return window.requestIdleCallback((deadline) => {
        callback(deadline || { didTimeout: false, timeRemaining: () => 0 });
      }, { timeout });
    }
    return window.setTimeout(() => {
      callback({ didTimeout: true, timeRemaining: () => 0 });
    }, Math.min(timeout, 120));
  },

  cancelIdleTask(handle) {
    if (handle == null) return;
    if ('cancelIdleCallback' in window) {
      window.cancelIdleCallback(handle);
      return;
    }
    clearTimeout(handle);
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

  getFocusableElements(root) {
    if (!root) return [];
    return Array.from(root.querySelectorAll('a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'))
      .filter((element) => !element.hasAttribute('hidden') && element.getAttribute('aria-hidden') !== 'true');
  },

  activateOverlayFocusTrap(overlay, panel, onDismiss) {
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const focusPanel = () => {
      const focusable = this.getFocusableElements(panel);
      (focusable[0] || panel)?.focus();
    };
    const handleKeydown = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onDismiss();
        return;
      }
      if (event.key !== 'Tab') return;
      const focusable = this.getFocusableElements(panel);
      if (!focusable.length) {
        event.preventDefault();
        panel?.focus();
        return;
      }
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    overlay.addEventListener('keydown', handleKeydown);
    requestAnimationFrame(focusPanel);

    return () => {
      overlay.removeEventListener('keydown', handleKeydown);
      previousFocus?.focus?.();
    };
  },

  dismissManagedOverlay(overlayId) {
    const overlay = document.getElementById(overlayId);
    if (!overlay) return false;
    if (typeof overlay.__tooliestDismiss === 'function') {
      overlay.__tooliestDismiss();
    } else {
      overlay.remove();
    }
    return true;
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
      faq: this.getCategoryFaqItems(category, tools),
    };
  },

  getFeaturedToolNames(tools, limit = 3) {
    return tools.slice(0, limit).map((tool) => tool.name).join(', ');
  },

  getCategoryFaqItems(category, categoryTools) {
    const lowerName = category.name.toLowerCase();
    const featuredNames = this.getFeaturedToolNames(categoryTools, 3);
    const examples = featuredNames
      ? `You can use ${featuredNames} and other ${lowerName} directly in your browser without signups or uploads.`
      : `You can use Tooliest's ${lowerName} directly in your browser without signups or uploads.`;

    return [
      {
        q: `What can I do with Tooliest's ${lowerName}?`,
        a: `${examples} These tools are built for quick, practical tasks so you can finish work faster while keeping your input on your own device.`,
      },
      {
        q: `Are Tooliest's ${lowerName} free to use?`,
        a: `Yes. All Tooliest ${lowerName} are free to use, require no signup, and work in modern desktop and mobile browsers.`,
      },
      {
        q: `Do Tooliest's ${lowerName} upload my data?`,
        a: 'No. Tooliest processes your input locally in the browser whenever possible, so text, files, and settings stay on your device instead of being sent to a server.',
      },
    ];
  },

  getRelatedCategories(categoryId) {
    const relations = {
      text: ['seo', 'html', 'developer'],
      seo: ['text', 'social', 'ai'],
      css: ['color', 'html', 'image'],
      color: ['css', 'image', 'ai'],
      image: ['color', 'css', 'converter'],
      json: ['html', 'javascript', 'developer'],
      html: ['css', 'json', 'javascript'],
      javascript: ['html', 'json', 'developer'],
      converter: ['encoding', 'math', 'image'],
      encoding: ['converter', 'privacy', 'developer'],
      finance: ['math', 'converter'],
      math: ['finance', 'converter'],
      social: ['seo', 'ai', 'text'],
      privacy: ['encoding', 'developer'],
      ai: ['text', 'seo', 'social'],
      developer: ['javascript', 'json', 'encoding'],
    };
    const relatedIds = relations[categoryId] || [];
    return relatedIds
      .map((id) => this.getCategoryById(id))
      .filter(Boolean);
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

  shouldUseSpaNavigation(targetPathname = window.location.pathname) {
    return this.isAppPath(window.location.pathname) && this.isAppPath(targetPathname);
  },

  goToPath(path, options = {}) {
    const target = new URL(path, window.location.origin);
    const nextPath = target.pathname + target.search + target.hash;
    if (this.shouldUseSpaNavigation(target.pathname)) {
      this.navigate(nextPath, options);
      return;
    }
    window.location.assign(nextPath);
  },

  navigate(path, options = {}) {
    const target = new URL(path, window.location.origin);
    const nextPath = target.pathname + target.search + target.hash;
    const method = options.replace ? 'replaceState' : 'pushState';

    history[method]({}, '', nextPath);
    // [TOOLIEST AUDIT Phase 9] View Transitions API — native app-like transitions on Chrome 111+.
    if (document.startViewTransition && !options.skipTransition) {
      document.startViewTransition(() => this.handleRoute(options));
    } else {
      this.handleRoute(options);
    }
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
        const normalizedQuery = e.target.value.trim().toLowerCase();
        this.searchQuery = normalizedQuery;
        this.renderDesktopSearchPreview(normalizedQuery);
        if (this.currentView === 'home') {
          this.renderToolsGrid();
        } else if (this.currentView === 'search' && this.searchQuery) {
          history.replaceState({}, '', this.getSearchPath(this.searchQuery));
          this.renderSearchResults();
        } else if (this.currentView === 'search' && this.searchQuery === '') {
          this.navigate(this.getCategoryPath(this.currentCategory), { replace: true });
        }
      });
      searchInput.addEventListener('focus', () => {
        if (searchInput.value.trim()) {
          this.renderDesktopSearchPreview(searchInput.value.trim());
        }
      });
      searchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && this.searchQuery) {
          this.hideDesktopSearchPreview();
          this.goToPath(this.getSearchPath(this.searchQuery));
        } else if (e.key === 'Escape') {
          this.hideDesktopSearchPreview();
        }
      });
    }
    document.addEventListener('click', (event) => {
      if (!event.target.closest('.nav-search')) {
        this.hideDesktopSearchPreview();
      }
    });
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
        this.goToPath(this.pathFromLegacyHash(href));
        return;
      }

      const url = new URL(link.href, window.location.origin);
      if (url.origin !== window.location.origin || !this.shouldUseSpaNavigation(url.pathname)) return;

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
    let mobileMenuTouchStartX = 0;
    let mobileMenuTouchStartY = 0;
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
    const bindMobileMenuSwipeDismiss = () => {
      if (!navLinks || navLinks.dataset.swipeBound === 'true') return;
      navLinks.dataset.swipeBound = 'true';
      navLinks.addEventListener('touchstart', (event) => {
        const touch = event.touches?.[0];
        if (!touch) return;
        mobileMenuTouchStartX = touch.clientX;
        mobileMenuTouchStartY = touch.clientY;
      }, { passive: true });
      navLinks.addEventListener('touchend', (event) => {
        const touch = event.changedTouches?.[0];
        if (!touch || !navLinks.classList.contains('mobile-open')) return;
        const deltaX = touch.clientX - mobileMenuTouchStartX;
        const deltaY = touch.clientY - mobileMenuTouchStartY;
        const horizontalSwipe = Math.abs(deltaX) > Math.abs(deltaY);
        if (horizontalSwipe && deltaX > 72) {
          closeMobileMenu();
        }
      }, { passive: true });
    };
    bindMobileMenuSwipeDismiss();
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
    this.hideDesktopSearchPreview();
    this.cancelHomeEnhancement();
    this.pendingGridRenderToken += 1;
    if (!this.isAppPath(window.location.pathname)) {
      this.currentView = 'content';
      this.activeToolId = null;
      this.updateShortcutUI();
      this.initialRouteHandled = true;
      return;
    }

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
    document.body.classList.toggle('tool-view-active', route.view === 'tool' && Boolean(route.toolId) && !this.isEmbedMode());
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

    const usedStaticShell = !this.initialRouteHandled && this.tryHydratePreRenderedRoute(route);

    if (usedStaticShell) {
      this.activeToolId = null;
    } else if (route.view === 'tool' && route.toolId) {
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

    this.initialRouteHandled = true;

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

  tryHydratePreRenderedRoute(route) {
    if (this.isEmbedMode()) return false;
    const main = document.getElementById('main-content');
    if (!main) return false;

    if (route.view === 'category' && route.categoryId) {
      const existingGrid = main.querySelector('.tools-grid');
      if (!existingGrid) return false;
      if (!existingGrid.id) {
        existingGrid.id = 'tools-grid';
      }
      this.currentView = 'home';
      this.currentCategory = route.categoryId;
      this.searchQuery = '';
      this.syncSearchInputs('');
      return true;
    }

    return false;
  },

  cancelHomeEnhancement() {
    if (!this.homeEnhancementTask) return;
    this.cancelIdleTask(this.homeEnhancementTask);
    this.homeEnhancementTask = null;
  },

  scheduleHomeEnhancement() {
    this.cancelHomeEnhancement();
    if (this.currentView !== 'home' || this.currentCategory !== 'all' || this.searchQuery) return;
    this.homeEnhancementTask = this.scheduleIdleTask(() => {
      this.homeEnhancementTask = null;
      this.enhanceStaticHomeShell();
    }, 2200);
  },

  enhanceStaticHomeShell() {
    if (this.currentView !== 'home' || this.currentCategory !== 'all' || this.searchQuery) return;
    const main = document.getElementById('main-content');
    const categoriesSection = main?.querySelector('.categories-section');
    if (!main || !categoriesSection || main.querySelector('#home-dynamic-panels')) return;

    const wrapper = document.createElement('div');
    wrapper.id = 'home-dynamic-panels';
    wrapper.innerHTML = this.getQuickStartHTML() +
      this.getRecentlyUsedHTML() +
      this.getMostPopularHTML() +
      this.getFavoritesManagerHTML();

    if (!wrapper.innerHTML.trim()) return;

    categoriesSection.before(wrapper);
    this.bindHomeFeaturePanels();
    this.bindToolCardInteractions(wrapper);
  },

  renderHome() {
    this.closeToolComparison();
    const main = document.getElementById('main-content');
    const categoryMeta = this.getCategoryMeta(this.currentCategory);
    const categoryContentHtml = categoryMeta ? this.getCategoryContentSectionsHTML(categoryMeta) : '';
    main.innerHTML = this.getHeroHTML() +
      this.getQuickStartHTML() +
      this.getRecentlyUsedHTML() +
      this.getMostPopularHTML() +
      this.getFavoritesManagerHTML() +
      this.getCategoriesHTML() +
      '<section class="tools-section"><div class="tools-grid" id="tools-grid"></div></section>' +
      categoryContentHtml +
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
      this.updateSEO(`Tooliest — ${TOOLS.length}+ Free Online Tools Powered by AI`, `Access ${TOOLS.length}+ free online tools for text, SEO, CSS, colors, images, JSON, encoding, math, and more. No signup required. AI-powered features included.`, null);
    }
  },

  getHeroHTML() {
    const categoryCount = this.getVisibleCategories().length;
    return `<section class="hero">
      <div class="hero-badge"><span class="pulse-dot"></span> ${TOOLS.length}+ Browser-Based Tools • Free &amp; No Signup</div>
      <h1>Every Tool You Need.<br><span class="gradient-text">Zero Installs.</span></h1>
      <p>${TOOLS.length}+ powerful online tools for developers, designers, writers, and marketers. All free, all instant, all AI-enhanced.</p>
      <div class="hero-stats">
        <div class="hero-stat"><div class="stat-value">${TOOLS.length}+</div><div class="stat-label">Free Tools</div></div>
        <div class="hero-stat"><div class="stat-value">${categoryCount}</div><div class="stat-label">Categories</div></div>
        <div class="hero-stat"><div class="stat-value">0</div><div class="stat-label">Signups Needed</div></div>
      </div>
      <div class="hero-trust-strip" aria-label="Tooliest trust highlights">
        <span class="trust-badge">🔒 100% Private — No Uploads</span>
        <span class="trust-badge">⚡ Instant Browser Results</span>
        <span class="trust-badge">📲 PWA Ready + Offline Support</span>
        <span class="trust-badge">🆓 Forever Free Utilities</span>
      </div>
    </section>`;
  },

  getCategoriesHTML() {
    const tabs = TOOL_CATEGORIES.map(c =>
      `<button class="category-tab${c.id === this.currentCategory ? ' active' : ''}" data-category="${c.id}" aria-label="${c.name} category, ${c.count} tool${c.count === 1 ? '' : 's'}" aria-pressed="${c.id === this.currentCategory}">
        <span>${c.icon}</span> ${c.name} <span class="tab-count">${c.count}</span>
      </button>`
    ).join('');
    return `<section class="categories-section">
      <div class="category-tabs" id="category-tabs">${tabs}</div>
      <p class="category-scroll-indicator" id="category-scroll-indicator" aria-hidden="true">Swipe to see more categories →</p>
    </section>`;
  },

  bindCategoryTabs() {
    document.querySelectorAll('.category-tab').forEach(tab => {
      tab.addEventListener('click', (event) => {
        const categoryId = tab.dataset.category || (() => {
          const href = tab.getAttribute('href');
          if (!href) return '';
          const parsed = this.parsePath(new URL(href, window.location.origin).pathname);
          return parsed.view === 'category' ? parsed.categoryId : '';
        })();
        if (!categoryId) return;
        if (tab.tagName === 'A') {
          event.preventDefault();
        }
        this.currentCategory = categoryId;
        this.navigate(this.getCategoryPath(this.currentCategory), { replace: true, preserveScroll: true });
      });
    });

    const categoryTabs = document.getElementById('category-tabs');
    if (!categoryTabs) return;

    if (!this.categoryTabsStateHandler) {
      this.categoryTabsStateHandler = () => this.updateCategoryTabsOverflowState();
    }
    if (!this.categoryTabsResizeHandler) {
      this.categoryTabsResizeHandler = () => this.updateCategoryTabsOverflowState();
      window.addEventListener('resize', this.categoryTabsResizeHandler, { passive: true });
    }
    if (categoryTabs.dataset.overflowBound !== 'true') {
      categoryTabs.dataset.overflowBound = 'true';
      categoryTabs.addEventListener('scroll', this.categoryTabsStateHandler, { passive: true });
    }

    requestAnimationFrame(this.categoryTabsStateHandler);
  },

  updateCategoryTabsOverflowState() {
    const categoryTabs = document.getElementById('category-tabs');
    const section = categoryTabs?.closest('.categories-section');
    const hint = document.getElementById('category-scroll-indicator');
    if (!categoryTabs || !section) return;

    const overflow = categoryTabs.scrollWidth - categoryTabs.clientWidth > 24;
    const atStart = categoryTabs.scrollLeft <= 12;
    const atEnd = categoryTabs.scrollLeft + categoryTabs.clientWidth >= categoryTabs.scrollWidth - 12;

    section.classList.toggle('has-scrollable-tabs', overflow);
    section.classList.toggle('is-scrolled', overflow && !atStart);
    section.classList.toggle('is-scroll-end', !overflow || atEnd);

    if (hint) {
      hint.hidden = !overflow || !atStart || atEnd;
    }
  },

  setActiveCategory(id) {
    document.querySelectorAll('.category-tab').forEach(t => {
      const matches = t.dataset.category === id;
      t.classList.toggle('active', matches);
      t.setAttribute('aria-pressed', matches);
      t.setAttribute('aria-current', matches ? 'page' : 'false');
    });
  },

  getToolsForCurrentGrid() {
    let tools = (this.currentCategory === 'all')
      ? [...TOOLS]
      : (this.currentCategory === 'favorites')
        ? TOOLS.filter((tool) => this.favorites.includes(tool.id))
        : TOOLS.filter((tool) => tool.category === this.currentCategory);

    if (this.searchQuery) {
      const q = this.searchQuery;
      tools = TOOLS.filter((tool) =>
        tool.name.toLowerCase().includes(q) ||
        tool.description.toLowerCase().includes(q) ||
        tool.tags.some((tag) => tag.includes(q)) ||
        tool.category.includes(q)
      );
    }

    return tools;
  },

  renderToolsGrid() {
    const tools = this.getToolsForCurrentGrid();
    const grid = document.getElementById('tools-grid');
    if (!grid) return;

    const renderToken = ++this.pendingGridRenderToken;
    if (!tools.length) {
      grid.innerHTML = '<div class="text-center" style="grid-column:1/-1;padding:60px 20px;color:var(--text-tertiary)"><h3>No tools found</h3><p>Try a different search or category</p></div>';
      return;
    }

    const isTouch = Boolean(this.inputCapabilities?.touchPreferred);
    const initialBatchSize = this.searchQuery
      ? Math.min(tools.length, isTouch ? 12 : 16)
      : Math.min(tools.length, isTouch ? 10 : 14);
    const chunkSize = isTouch ? 8 : 12;
    const renderCards = (slice) => slice.map((tool) => this.getToolCardHTML(tool)).join('');

    grid.innerHTML = renderCards(tools.slice(0, initialBatchSize));
    this.bindToolCardInteractions(grid);

    if (initialBatchSize >= tools.length) {
      return;
    }

    grid.insertAdjacentHTML('beforeend', '<div class="tools-grid-sentinel" aria-live="polite">Loading more tools…</div>');
    let nextIndex = initialBatchSize;

    const appendNextChunk = (deadline) => {
      if (renderToken !== this.pendingGridRenderToken) return;
      const sentinel = grid.querySelector('.tools-grid-sentinel');
      if (!sentinel) return;

      let appended = 0;
      while (nextIndex < tools.length) {
        if (deadline && !deadline.didTimeout && deadline.timeRemaining() <= 8 && appended > 0) {
          break;
        }
        const sliceEnd = Math.min(nextIndex + chunkSize, tools.length);
        sentinel.insertAdjacentHTML('beforebegin', renderCards(tools.slice(nextIndex, sliceEnd)));
        appended += sliceEnd - nextIndex;
        nextIndex = sliceEnd;
        if (!deadline && appended >= chunkSize) {
          break;
        }
      }

      this.bindToolCardInteractions(grid);

      if (nextIndex >= tools.length) {
        sentinel.remove();
        return;
      }

      this.scheduleIdleTask(appendNextChunk, 260);
    };

    this.scheduleIdleTask(appendNextChunk, 260);
  },

  bindToolCardInteractions(root = document) {
    root.querySelectorAll('.tool-card').forEach(card => {
      if (!card.dataset.toolId) return;
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
    if (this.currentView === 'tool') {
      this.syncFavoriteButtons(toolId);
    } else if (this.currentView !== 'search') {
      this.renderHome();
    }
    this.toast(this.favorites.includes(toolId) ? 'Added to favorites ⭐' : 'Removed from favorites');
  },

  syncFavoriteButtons(toolId) {
    const isFav = this.favorites.includes(toolId);
    const toolName = TOOLS.find((tool) => tool.id === toolId)?.name || toolId;
    document.querySelectorAll(`.tool-card[data-tool-id="${toolId}"] .fav-btn`).forEach((button) => {
      button.classList.toggle('active', isFav);
      button.setAttribute('aria-label', isFav ? 'Remove from favorites' : 'Add to favorites');
      button.setAttribute('aria-pressed', String(isFav));
      button.textContent = isFav ? 'â­' : 'â˜†';
    });

    const toolFavoriteButton = document.getElementById('mobile-tool-favorite-btn');
    if (toolFavoriteButton && this.activeToolId === toolId) {
      toolFavoriteButton.classList.toggle('active', isFav);
      toolFavoriteButton.setAttribute('aria-pressed', String(isFav));
      toolFavoriteButton.setAttribute('aria-label', isFav ? `Remove ${toolName} from favorites` : `Save ${toolName} to favorites`);
      const icon = toolFavoriteButton.querySelector('.mobile-tool-nav-icon');
      const label = toolFavoriteButton.querySelector('.mobile-tool-nav-label');
      if (icon) icon.textContent = isFav ? '★' : '☆';
      if (label) label.textContent = isFav ? 'Saved' : 'Save';
    }
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

  getSearchMatches(query, limit = 8) {
    const normalized = String(query || '').trim().toLowerCase();
    if (!normalized) return [];

    return TOOLS
      .map((tool) => {
        const name = tool.name.toLowerCase();
        const description = tool.description.toLowerCase();
        const tags = tool.tags.join(' ').toLowerCase();
        let score = 0;

        if (name.startsWith(normalized)) score += 5;
        else if (name.includes(normalized)) score += 4;
        if (tags.includes(normalized)) score += 3;
        if (description.includes(normalized)) score += 2;
        if (tool.category.includes(normalized)) score += 1;

        return { tool, score };
      })
      .filter((entry) => entry.score > 0)
      .sort((a, b) => b.score - a.score || a.tool.name.localeCompare(b.tool.name))
      .slice(0, limit)
      .map((entry) => entry.tool);
  },

  escapeHTML(value = '') {
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  },

  ensureDesktopSearchPreview() {
    const navSearch = document.querySelector('.nav-search');
    if (!navSearch) return null;

    let panel = navSearch.querySelector('#desktop-search-preview');
    if (!panel) {
      panel = document.createElement('div');
      panel.id = 'desktop-search-preview';
      panel.className = 'nav-search-preview';
      panel.hidden = true;
      panel.setAttribute('role', 'listbox');
      panel.setAttribute('aria-label', 'Tool search suggestions');
      navSearch.appendChild(panel);
    }

    return panel;
  },

  hideDesktopSearchPreview() {
    const panel = document.getElementById('desktop-search-preview');
    if (!panel) return;
    panel.hidden = true;
    panel.classList.remove('open');
    panel.innerHTML = '';
  },

  renderDesktopSearchPreview(query) {
    const normalized = String(query || '').trim().toLowerCase();
    const panel = this.ensureDesktopSearchPreview();
    if (!panel || !normalized) {
      this.hideDesktopSearchPreview();
      return;
    }

    const matches = this.getSearchMatches(normalized, 7);
    const escapedQuery = this.escapeHTML(normalized);
    panel.innerHTML = matches.length
      ? `<div class="nav-search-preview-header">Top matches</div>
        <div class="nav-search-preview-list">
          ${matches.map((tool) => `<a class="nav-search-preview-item" href="${this.getToolPath(tool.id)}" role="option" aria-label="Open ${tool.name}">
            <span class="nav-search-preview-icon" aria-hidden="true">${tool.icon}</span>
            <span class="nav-search-preview-copy">
              <strong>${tool.name}</strong>
              <span>${TOOL_CATEGORIES.find((category) => category.id === tool.category)?.name || 'Tool'} • ${tool.description}</span>
            </span>
          </a>`).join('')}
        </div>
        <a class="nav-search-preview-footer" href="${this.getSearchPath(normalized)}">View all results for “${escapedQuery}”</a>`
      : `<div class="nav-search-preview-empty">
          <strong>No exact matches</strong>
          <span>Press Enter to search Tooliest for “${escapedQuery}”.</span>
        </div>`;

    panel.hidden = false;
    requestAnimationFrame(() => panel.classList.add('open'));
  },

  getTotalUsageCount() {
    return Object.values(this.toolUsage).reduce((sum, count) => sum + (Number(count) || 0), 0);
  },

  getToolUsageCount(toolId) {
    return Number(this.toolUsage?.[toolId] || 0);
  },

  getFeaturedTools(limit = 6) {
    const featuredIds = [
      'word-counter',
      'qr-code-generator',
      'json-formatter',
      'meta-tag-generator',
      'password-security-suite',
      'image-compressor',
      'compound-interest',
      'regex-tester',
      'color-picker',
    ];
    const combined = [
      ...this.getPopularTools(limit),
      ...featuredIds.map((toolId) => TOOLS.find((tool) => tool.id === toolId)).filter(Boolean),
    ];

    return combined.filter((tool, index) =>
      combined.findIndex((candidate) => candidate.id === tool.id) === index
    ).slice(0, limit);
  },

  getQuickStartHTML() {
    const featuredTools = this.getFeaturedTools(6);
    const totalUses = this.getTotalUsageCount();
    if (!featuredTools.length) return '';

    return `<section class="tools-section tools-section-condensed">
      <div class="section-shell">
        <div class="section-heading">
          <h3>Start Here</h3>
          <p>${totalUses ? `You have completed ${totalUses} tool action${totalUses === 1 ? '' : 's'} on this device. Keep momentum with the tools people open most.` : 'New to Tooliest? Start with the fastest, most useful tools before diving into the full directory.'}</p>
        </div>
        <div class="related-tools-grid">${featuredTools.map((tool) => this.getToolCardHTML(tool)).join('')}</div>
      </div>
    </section>`;
  },

  getLastUpdatedDateLabel() {
    const versionMatch = TOOLIEST_ASSET_VERSION.match(/^(\d{4})(\d{2})(\d{2})/);
    const releaseDate = versionMatch
      ? `${versionMatch[1]}-${versionMatch[2]}-${versionMatch[3]}`
      : (TOOLIEST_CHANGELOG[0]?.date || new Date().toISOString().split('T')[0]);

    return new Date(`${releaseDate}T00:00:00`).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  },

  getToolTrustPanelHTML(tool, related) {
    const usageCount = this.getToolUsageCount(tool.id);
    const usageLabel = usageCount
      ? `${usageCount} local run${usageCount === 1 ? '' : 's'}`
      : 'Ready for your first run';
    const pairingLinks = related.slice(0, 3);

    return `<div class="tool-trust-strip" aria-label="${tool.name} trust signals">
      <span class="trust-badge">🔒 100% Private — Runs in your browser</span>
      <span class="trust-badge">⚡ Instant results on this device</span>
      <span class="trust-badge">🆓 Free to use</span>
      <span class="trust-badge">🛠️ Maintained release: ${this.getLastUpdatedDateLabel()}</span>
    </div>
    <div class="tool-proof-grid">
      <div class="tool-proof-card">
        <span>Privacy</span>
        <strong>No data leaves your device</strong>
        <p>Perfect for sensitive content, drafts, client files, and quick checks.</p>
      </div>
      <div class="tool-proof-card">
        <span>Local usage</span>
        <strong>${usageLabel}</strong>
        <p>Tracked only in this browser to power your recent and popular tools.</p>
      </div>
      <div class="tool-proof-card tool-live-status-card" id="tool-live-status-card">
        <span>Status</span>
        <strong id="tool-live-status-value">Ready when you are</strong>
        <p id="tool-live-status-note">Tooliest will confirm when this workspace finishes processing.</p>
      </div>
      <a class="tool-proof-card tool-proof-link" href="${TOOLIEST_REPOSITORY_URL}" target="_blank" rel="noreferrer">
        <span>Source</span>
        <strong>View the Tooliest codebase</strong>
        <p>Open the public repository behind this browser-first tool collection.</p>
      </a>
    </div>
    ${pairingLinks.length ? `<div class="tool-pairing-links">
      <span>Works well with:</span>
      ${pairingLinks.map((candidate) => `<a href="${this.getToolPath(candidate.id)}">${candidate.name}</a>`).join('')}
    </div>` : ''}`;
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
    const whyUseHtml = Array.isArray(tool.whyUse) && tool.whyUse.length
      ? `<section class="tool-content-section">
        <h2>Why Use ${this.escapeHTML(tool.name)}?</h2>
        <ul>${tool.whyUse.map((reason) => `<li>${this.escapeHTML(reason)}</li>`).join('')}</ul>
      </section>`
      : '';
    const whoUsesHtml = tool.whoUses
      ? `<section class="tool-content-section">
        <h2>Who Uses ${this.escapeHTML(tool.name)}?</h2>
        <p>${this.escapeHTML(tool.whoUses)}</p>
      </section>`
      : '';
    const faqHtml = Array.isArray(tool.faq) && tool.faq.length
      ? `<section class="tool-content-section">
        <h2>Frequently Asked Questions</h2>
        <div class="faq-list">${tool.faq.map((item) => `<details class="faq-item"><summary>${this.escapeHTML(item.q)}</summary><p>${this.escapeHTML(item.a)}</p></details>`).join('')}</div>
      </section>`
      : '';

    return `<div class="tool-content-sections">
      <section class="tool-content-section">
        <h2>What Is ${this.escapeHTML(tool.name)}?</h2>
        <p>${this.escapeHTML(tool.description)}</p>
        ${tool.education ? `<div class="tool-education-copy">${tool.education}</div>` : `<p>${fallbackExplain}</p>`}
      </section>
      <section class="tool-content-section">
        <h2>How To Use ${this.escapeHTML(tool.name)}</h2>
        <ol>${steps.map(step => `<li>${this.escapeHTML(step)}</li>`).join('')}</ol>
      </section>
      ${whyUseHtml}
      ${whoUsesHtml}
      ${faqHtml}
    </div>`;
  },

  getCategoryContentSectionsHTML(meta) {
    if (!meta) return '';
    const relatedCategories = this.getRelatedCategories(meta.category.id);
    const topToolsHtml = `<section class="tool-content-section">
      <h2>Best ${this.escapeHTML(meta.category.name)} to Start With</h2>
      <p>These are some of the most useful ${this.escapeHTML(meta.category.name.toLowerCase())} on Tooliest when you want fast results without extra tabs, accounts, or uploads:</p>
      <ul>${meta.tools.slice(0, 6).map((tool) => `<li><a href="${this.getToolPath(tool.id)}"><strong>${this.escapeHTML(tool.name)}</strong></a> - ${this.escapeHTML(tool.description)}</li>`).join('')}</ul>
    </section>`;
    const benefitsHtml = `<section class="tool-content-section">
      <h2>Why Use Browser-Based ${this.escapeHTML(meta.category.name)}?</h2>
      <p>Tooliest's ${this.escapeHTML(meta.category.name.toLowerCase())} are designed for quick, practical work. You can launch a tool instantly, finish the task in one browser tab, and move on without handing your content to a server.</p>
      <ul>
        <li>Launch any tool instantly with no signup or account setup</li>
        <li>Keep your input on your own device for better privacy</li>
        <li>Move between related tools quickly with direct internal links</li>
        <li>Use the same workflows on desktop and mobile browsers</li>
      </ul>
    </section>`;
    const relatedCategoriesHtml = relatedCategories.length
      ? `<section class="tool-content-section">
        <h2>Related Tool Categories</h2>
        <p>Looking for more? Explore these related categories on Tooliest:</p>
        <ul>${relatedCategories.map((category) => `<li><a href="${this.getCategoryPath(category.id)}">${category.icon} ${this.escapeHTML(category.name)}</a> - ${TOOLS.filter((tool) => tool.category === category.id).length} free tools</li>`).join('')}</ul>
      </section>`
      : '';
    const faqHtml = Array.isArray(meta.faq) && meta.faq.length
      ? `<section class="tool-content-section">
        <h2>${this.escapeHTML(meta.category.name)} FAQ</h2>
        <div class="faq-list">${meta.faq.map((item) => `<details class="faq-item"><summary>${this.escapeHTML(item.q)}</summary><p>${this.escapeHTML(item.a)}</p></details>`).join('')}</div>
      </section>`
      : '';

    return `<div class="tool-content-sections" style="margin-top:32px">
      ${topToolsHtml}
      ${benefitsHtml}
      ${relatedCategoriesHtml}
      ${faqHtml}
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
        ${this.getToolTrustPanelHTML(tool, related)}
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
      <nav class="mobile-tool-nav" aria-label="Quick actions for ${tool.name}">
        <button type="button" class="mobile-tool-nav-btn" id="mobile-tool-home-btn" aria-label="Go to the Tooliest home page">
          <span class="mobile-tool-nav-icon" aria-hidden="true">⌂</span>
          <span class="mobile-tool-nav-label">Home</span>
        </button>
        <button type="button" class="mobile-tool-nav-btn" id="mobile-tool-search-btn" aria-label="Search Tooliest tools">
          <span class="mobile-tool-nav-icon" aria-hidden="true">⌕</span>
          <span class="mobile-tool-nav-label">Search</span>
        </button>
        <button type="button" class="mobile-tool-nav-btn${this.favorites.includes(tool.id) ? ' active' : ''}" id="mobile-tool-favorite-btn" aria-label="${this.favorites.includes(tool.id) ? `Remove ${tool.name} from favorites` : `Save ${tool.name} to favorites`}" aria-pressed="${this.favorites.includes(tool.id)}">
          <span class="mobile-tool-nav-icon" aria-hidden="true">${this.favorites.includes(tool.id) ? '★' : '☆'}</span>
          <span class="mobile-tool-nav-label">${this.favorites.includes(tool.id) ? 'Saved' : 'Save'}</span>
        </button>
        <button type="button" class="mobile-tool-nav-btn" id="mobile-tool-share-btn" aria-label="Share ${tool.name}">
          <span class="mobile-tool-nav-icon" aria-hidden="true">↗</span>
          <span class="mobile-tool-nav-label">Share</span>
        </button>
      </nav>
    </div>`;
  },

  // ===== TOOL PAGE RENDERING =====
  showTool(toolId) {
    const tool = TOOLS.find(t => t.id === toolId);
    if (!tool) { this.navigate(this.getHomePath(), { replace: true }); return; }
    this.closeToolComparison();
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
    window.requestAnimationFrame(() => {
      void ToolRenderers.render(toolId, workspace);
    });
    this.enhanceRuntimeMedia(main, tool);

    if (!isEmbed) {
      this.startToolPerformanceTracking(tool);
      document.getElementById('share-tool-btn')?.addEventListener('click', () => this.shareTool(tool));
      document.getElementById('print-tool-btn')?.addEventListener('click', () => this.printToolPage());
      document.getElementById('mobile-tool-home-btn')?.addEventListener('click', () => this.navigate(this.getHomePath()));
      document.getElementById('mobile-tool-search-btn')?.addEventListener('click', () => this.focusSearch());
      document.getElementById('mobile-tool-favorite-btn')?.addEventListener('click', () => this.toggleFavorite(tool.id));
      document.getElementById('mobile-tool-share-btn')?.addEventListener('click', () => this.shareTool(tool));
      document.getElementById('compare-tool-btn')?.addEventListener('click', () => {
        document.getElementById('compare-panel')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
      document.getElementById('compare-launch-btn')?.addEventListener('click', () => {
        const compareToolId = document.getElementById('compare-tool-select')?.value || '';
        this.openToolComparison(tool, compareToolId);
      });
      document.getElementById('compare-close-btn')?.addEventListener('click', () => this.closeToolComparison());
      this.maybeShowEmailCapture(tool);
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
    const safeQ = this.escapeHTML(q);
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
    document.body.classList.add('pwa-install-open');
    document.getElementById('pwa-install-btn').addEventListener('click', async () => {
      if (this.deferredPrompt) {
        this.deferredPrompt.prompt();
        const { outcome } = await this.deferredPrompt.userChoice;
        if (outcome === 'accepted') {
          banner.remove();
          document.body.classList.remove('pwa-install-open');
        }
        this.deferredPrompt = null;
      }
    });
    document.getElementById('pwa-close-btn').addEventListener('click', () => {
      safeLocalSet('tooliest_pwa_dismissed', '1');
      banner.classList.remove('show');
      setTimeout(() => {
        banner.remove();
        document.body.classList.remove('pwa-install-open');
      }, 300);
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
      const softwareSchema = {
        '@context': 'https://schema.org',
        '@type': 'SoftwareApplication',
        'name': tool.name,
        'url': absoluteUrl,
        'description': tool.meta?.desc || tool.description,
        'applicationCategory': 'UtilityApplication',
        'applicationSubCategory': catName,
        'operatingSystem': 'Any',
        'browserRequirements': 'Requires a JavaScript-enabled modern web browser',
        'featureList': tool.tags.join(', '),
        'softwareVersion': TOOLIEST_ASSET_VERSION,
        'isAccessibleForFree': true,
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
      // [TOOLIEST AUDIT] Keep runtime tool schema aligned with pre-rendered pages for richer search coverage.
      [toolSchema, softwareSchema, breadcrumb, howTo].forEach(schema => {
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
    toast.setAttribute('role', 'alert');
    toast.setAttribute('aria-live', 'polite');
    toast.setAttribute('aria-atomic', 'true');
    (document.getElementById('toast-container') || document.body).appendChild(toast);
    requestAnimationFrame(() => toast.classList.add('show'));
    setTimeout(() => { toast.classList.remove('show'); setTimeout(() => toast.remove(), 400); }, 2500);
  },
  // ===== FEAT-01: THEME TOGGLE =====
  initTheme() {
    const saved = safeLocalRead('tooliest_theme', 'dark') || 'dark';
    document.documentElement.setAttribute('data-theme', saved);
    this.updateThemeChrome(saved);
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
    this.updateThemeChrome(next);
    safeLocalSet('tooliest_theme', next);
    const btn = document.getElementById('theme-toggle-btn');
    if (btn) btn.textContent = next === 'light' ? '🌙' : '☀️';
    this.toast(next === 'light' ? 'Light mode enabled ☀️' : 'Dark mode enabled 🌙');
  },

  updateThemeChrome(theme) {
    const themeName = theme === 'light' ? 'light' : 'dark';
    const color = TOOLIEST_THEME_COLORS[themeName];
    document.documentElement.style.colorScheme = themeName;
    document.querySelectorAll('meta[name="theme-color"]:not([media])').forEach((meta) => {
      meta.setAttribute('content', color);
    });
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

  openMostRecentTool() {
    const recent = safeLocalGet('tooliest_recent', []).find((toolId) => TOOLS.some((tool) => tool.id === toolId));
    if (!recent) {
      this.toast('Use a tool once and then Ctrl + / will bring it back instantly.', 'error');
      return;
    }
    this.navigate(this.getToolPath(recent));
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

  maybeShowEmailCapture(tool) {
    if (this.isEmbedMode()) return;
    if (document.getElementById('email-capture-overlay')) return;
    if (safeLocalRead('tooliest_email_capture_disabled') === '1') return;
    if (safeLocalRead('tooliest_email_capture_requested') === '1') return;

    const totalUses = this.getTotalUsageCount();
    const lastPromptTotal = Number(safeLocalRead('tooliest_email_capture_last_prompt_total') || 0);
    if (totalUses < 3 || totalUses % 3 !== 0 || totalUses === lastPromptTotal) return;

    safeLocalSet('tooliest_email_capture_last_prompt_total', String(totalUses));
    if (this.emailCaptureTimer) {
      clearTimeout(this.emailCaptureTimer);
    }

    this.emailCaptureTimer = window.setTimeout(() => {
      this.emailCaptureTimer = null;
      if (this.currentView === 'tool') {
        this.showEmailCapture(tool);
      }
    }, 700);
  },

  openEmailCaptureInbox(email, tool) {
    const subject = encodeURIComponent('Tooliest updates signup');
    const body = encodeURIComponent(
      `Please add this email to Tooliest updates:\n\n${email}\n\nMost recent tool: ${tool?.name || 'Tooliest'}\nTotal local uses: ${this.getTotalUsageCount()}\nPage: ${window.location.href}`
    );
    const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(TOOLIEST_CONTACT_EMAIL)}&su=${subject}&body=${body}`;
    const mailtoUrl = `mailto:${TOOLIEST_CONTACT_EMAIL}?subject=${subject}&body=${body}`;
    const popup = window.open(gmailUrl, '_blank', 'noopener');
    if (!popup) {
      window.location.href = mailtoUrl;
    }
  },

  showEmailCapture(tool) {
    if (document.getElementById('email-capture-overlay')) return;

    const totalUses = this.getTotalUsageCount();
    const safeToolName = this.escapeHTML(tool?.name || 'Tooliest');
    const overlay = document.createElement('div');
    overlay.id = 'email-capture-overlay';
    overlay.innerHTML = `<div class="email-capture-panel" role="dialog" aria-modal="true" aria-label="Join Tooliest updates" tabindex="-1">
      <div class="email-capture-header">
        <div>
          <h2>Keep the best Tooliest launches coming</h2>
          <p>You have used Tooliest ${totalUses} time${totalUses === 1 ? '' : 's'} on this device. Get weekly updates, new tool launches, and practical browser-first workflows.</p>
        </div>
        <button type="button" class="email-capture-close" id="email-capture-close" aria-label="Close email signup">Close</button>
      </div>
      <div class="email-capture-meta">
        <span class="guide-chip">Latest tool: ${safeToolName}</span>
        <span class="guide-chip">No account required</span>
        <span class="guide-chip">Fully static workflow</span>
      </div>
      <form id="email-capture-form" class="email-capture-form" novalidate>
        <div class="input-group">
          <label for="email-capture-input">Email address</label>
          <input type="email" id="email-capture-input" placeholder="you@example.com" autocomplete="email" required>
        </div>
        <p class="email-capture-note">Tooliest is a static site, so joining opens your email app with a prefilled signup message to the Tooliest inbox. You stay in control and nothing is sent silently.</p>
        <div class="email-capture-actions">
          <button type="submit" class="btn btn-primary">Join Updates</button>
          <button type="button" class="btn btn-secondary btn-sm" id="email-capture-later">Maybe Later</button>
          <button type="button" class="btn btn-secondary btn-sm" id="email-capture-never">Don't Show Again</button>
        </div>
        <a class="email-capture-link" href="/contact">Prefer the contact form instead?</a>
      </form>
    </div>`;

    document.body.appendChild(overlay);
    const panel = overlay.querySelector('.email-capture-panel');
    const form = overlay.querySelector('#email-capture-form');
    const input = overlay.querySelector('#email-capture-input');
    let releaseFocus = null;

    const dismiss = (options = {}) => {
      if (options.disable) {
        safeLocalSet('tooliest_email_capture_disabled', '1');
      }
      if (options.requested) {
        safeLocalSet('tooliest_email_capture_requested', '1');
      }
      releaseFocus?.();
      overlay.remove();
    };

    overlay.__tooliestDismiss = dismiss;
    releaseFocus = this.activateOverlayFocusTrap(overlay, panel, () => dismiss());
    overlay.addEventListener('click', (event) => {
      if (event.target === overlay) dismiss();
    });
    document.getElementById('email-capture-close')?.addEventListener('click', () => dismiss());
    document.getElementById('email-capture-later')?.addEventListener('click', () => dismiss());
    document.getElementById('email-capture-never')?.addEventListener('click', () => {
      dismiss({ disable: true });
      this.toast('Email prompts turned off for this browser.');
    });

    form?.addEventListener('submit', (event) => {
      event.preventDefault();
      const email = String(input?.value || '').trim();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        input?.focus();
        this.toast('Enter a valid email address to prepare the signup message.', 'error');
        return;
      }

      this.openEmailCaptureInbox(email, tool);
      dismiss({ requested: true });
      this.toast('Your email app is ready. Send the prefilled message to join Tooliest updates.');
    });
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
    overlay.innerHTML = `<div class="tour-panel" role="dialog" aria-modal="true" aria-label="Welcome to Tooliest" tabindex="-1">
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
    let releaseFocus = null;

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
      releaseFocus?.();
      safeLocalSet('tooliest_tour_completed', '1');
      overlay.remove();
    };
    overlay.__tooliestDismiss = dismiss;
    releaseFocus = this.activateOverlayFocusTrap(overlay, panel, dismiss);

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
    this.updateToolReadyState(label, duration);
  },

  updateToolReadyState(label, duration) {
    const statusValue = document.getElementById('tool-live-status-value');
    const statusNote = document.getElementById('tool-live-status-note');
    const statusCard = document.getElementById('tool-live-status-card');
    const workspace = document.getElementById('tool-workspace');
    if (!statusValue || !statusNote || !statusCard || !workspace) return;

    // [TOOLIEST AUDIT] Add a subtle completion state so users know when a tool output is ready.
    statusValue.textContent = `Results ready in ${Math.max(1, Math.round(duration))} ms`;
    statusNote.textContent = `${label || 'Your latest tool action'} completed locally on this device.`;

    statusCard.classList.remove('is-updated');
    workspace.classList.remove('result-ready');
    void statusCard.offsetWidth;
    void workspace.offsetWidth;
    statusCard.classList.add('is-updated');
    workspace.classList.add('result-ready');

    if (this.toolReadyStateTimer) {
      clearTimeout(this.toolReadyStateTimer);
    }
    this.toolReadyStateTimer = window.setTimeout(() => {
      statusCard.classList.remove('is-updated');
      workspace.classList.remove('result-ready');
    }, 1800);
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
    const iframeSandbox = 'allow-same-origin allow-scripts allow-forms allow-downloads';
    const workspace = document.getElementById('tool-workspace');
    const performancePanel = document.getElementById('tool-performance-panel');

    if (!comparisonRoot || !compareTool || !workspace) {
      this.toast('Choose a related tool to compare.', 'error');
      return;
    }

    if (compareTool.id === primaryTool.id) {
      this.toast('Pick a different tool to compare against.', 'error');
      return;
    }

    if (this.comparisonRestoreState) {
      this.closeToolComparison();
    }

    const workspacePlaceholder = document.createElement('div');
    workspacePlaceholder.hidden = true;
    workspacePlaceholder.setAttribute('data-compare-placeholder', 'workspace');
    workspace.parentNode?.insertBefore(workspacePlaceholder, workspace);

    let performancePlaceholder = null;
    if (performancePanel?.parentNode) {
      performancePlaceholder = document.createElement('div');
      performancePlaceholder.hidden = true;
      performancePlaceholder.setAttribute('data-compare-placeholder', 'performance');
      performancePanel.parentNode.insertBefore(performancePlaceholder, performancePanel);
    }

    comparisonRoot.innerHTML = `<div class="compare-layout">
      <div class="compare-pane compare-pane-live">
        <div class="compare-pane-header">
          <strong>${primaryTool.name}</strong>
          <span>Live workspace</span>
        </div>
        <div class="compare-pane-body" id="compare-live-pane"></div>
      </div>
      <div class="compare-pane">
        <div class="compare-pane-header">
          <strong>${compareTool.name}</strong>
          <span>Related tool</span>
        </div>
        <iframe src="${this.getToolPath(compareTool.id)}?embed=1" title="${compareTool.name} comparison panel" loading="lazy" sandbox="${iframeSandbox}" referrerpolicy="no-referrer"></iframe>
      </div>
    </div>`;

    const livePane = document.getElementById('compare-live-pane');
    livePane?.appendChild(workspace);
    if (performancePanel) {
      livePane?.appendChild(performancePanel);
    }

    this.comparisonRestoreState = {
      workspace,
      workspacePlaceholder,
      performancePanel,
      performancePlaceholder,
    };

    closeButton?.classList.remove('hidden');
    comparisonRoot.scrollIntoView({ behavior: 'smooth', block: 'start' });
  },

  closeToolComparison() {
    if (this.comparisonRestoreState) {
      const {
        workspace,
        workspacePlaceholder,
        performancePanel,
        performancePlaceholder,
      } = this.comparisonRestoreState;

      if (workspacePlaceholder?.parentNode) {
        workspacePlaceholder.replaceWith(workspace);
      }
      if (performancePanel && performancePlaceholder?.parentNode) {
        performancePlaceholder.replaceWith(performancePanel);
      }
      this.comparisonRestoreState = null;
    }

    const comparisonRoot = document.getElementById('tool-comparison-root');
    comparisonRoot?.replaceChildren();
    document.getElementById('compare-close-btn')?.classList.add('hidden');
  },

  // ===== FEAT-03: KEYBOARD SHORTCUTS PANEL =====
  showShortcuts() {
    const existing = document.getElementById('shortcuts-overlay');
    if (existing) { this.dismissManagedOverlay('shortcuts-overlay'); return; }
    const showKeyboardShortcuts = this.shouldShowKeyboardShortcutHints();
    const overlay = document.createElement('div');
    overlay.id = 'shortcuts-overlay';
    overlay.innerHTML = `<div class="shortcuts-panel" role="dialog" aria-modal="true" aria-label="Tooliest keyboard shortcuts" tabindex="-1">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px">
        <h2 style="font-size:1.2rem;font-weight:700">${showKeyboardShortcuts ? '⌨️ Keyboard Shortcuts' : '⌨️ Desktop Shortcut Tips'}</h2>
        <button id="shortcuts-close" style="background:none;border:none;color:var(--text-secondary);font-size:1.3rem;cursor:pointer">✕</button>
      </div>
      ${showKeyboardShortcuts
        ? `<div class="shortcut-list">
          <div class="shortcut-item"><kbd>Ctrl</kbd> + <kbd>K</kbd><span>Search tools</span></div>
          <div class="shortcut-item"><kbd>Ctrl</kbd> + <kbd>/</kbd><span>Open last-used tool</span></div>
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
    const panel = overlay.querySelector('.shortcuts-panel');
    let releaseFocus = null;
    const dismiss = () => {
      releaseFocus?.();
      overlay.remove();
    };
    overlay.__tooliestDismiss = dismiss;
    releaseFocus = this.activateOverlayFocusTrap(overlay, panel, dismiss);
    overlay.addEventListener('click', (e) => { if (e.target === overlay) dismiss(); });
    document.getElementById('shortcuts-close')?.addEventListener('click', dismiss);
  },

  // ===== FEAT-05: WHAT'S NEW CHANGELOG =====
  showChangelog() {
    const existing = document.getElementById('changelog-overlay');
    if (existing) { this.dismissManagedOverlay('changelog-overlay'); return; }
    const overlay = document.createElement('div');
    overlay.id = 'changelog-overlay';
    overlay.innerHTML = `<div class="changelog-panel" role="dialog" aria-modal="true" aria-label="Tooliest changelog" tabindex="-1">
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
    const panel = overlay.querySelector('.changelog-panel');
    let releaseFocus = null;
    const dismiss = () => {
      releaseFocus?.();
      overlay.remove();
    };
    overlay.__tooliestDismiss = dismiss;
    releaseFocus = this.activateOverlayFocusTrap(overlay, panel, dismiss);
    overlay.addEventListener('click', (e) => { if (e.target === overlay) dismiss(); });
    document.getElementById('changelog-close')?.addEventListener('click', dismiss);
    safeLocalSet('tooliest_changelog_seen', TOOLIEST_CHANGELOG[0].version);
  },
};

// === Clipboard Helper ===
// [TOOLIEST AUDIT Phase 9] Hardened: async/await, failure toast, fallback for older browsers.
async function copyToClipboard(text, btn) {
  const originalText = btn ? btn.textContent : null;
  const originalLabel = btn ? btn.getAttribute('aria-label') : null;
  const markCopied = () => {
    if (!btn) return;
    btn.textContent = '✓ Copied';
    btn.classList.add('copied');
    btn.setAttribute('aria-label', 'Copied to clipboard');
    setTimeout(() => {
      btn.textContent = originalText || 'Copy';
      btn.classList.remove('copied');
      if (originalLabel) btn.setAttribute('aria-label', originalLabel);
    }, 1800);
  };
  // Modern Clipboard API
  if (navigator.clipboard && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(text);
      App.toast('Copied to clipboard!');
      markCopied();
      return;
    } catch (_) { /* fall through to legacy */ }
  }
  // Legacy fallback (non-HTTPS or older browsers)
  try {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.cssText = 'position:fixed;top:-9999px;left:-9999px;opacity:0';
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand('copy');
    ta.remove();
    if (ok) { App.toast('Copied to clipboard!'); markCopied(); }
    else throw new Error('execCommand failed');
  } catch (err) {
    App.toast('Copy failed — please select and copy manually.', 'error');
  }
}

// === Global Keyboard Shortcuts ===
document.addEventListener('keydown', (e) => {
  // Ctrl+K: Focus search (works everywhere)
  if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
    e.preventDefault();
    App.focusSearch();
    return;
  }
  if ((e.ctrlKey || e.metaKey) && !e.shiftKey && (e.key === '/' || e.code === 'Slash')) {
    e.preventDefault();
    App.openMostRecentTool();
    return;
  }
  // Esc: close overlays
  if (e.key === 'Escape') {
    if (App.dismissManagedOverlay('email-capture-overlay')) return;
    if (App.dismissManagedOverlay('shortcuts-overlay')) return;
    if (App.dismissManagedOverlay('changelog-overlay')) return;
    if (App.dismissManagedOverlay('welcome-tour-overlay')) return;
    return;
  }
  // Don't trigger letter shortcuts if typing in input fields
  if (['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName) || e.target.isContentEditable) return;
  if (e.key === '?') { e.preventDefault(); App.showShortcuts(); }
  if (e.key === 'h' && !e.ctrlKey && !e.metaKey && !e.altKey && !e.shiftKey) { App.navigate(App.getHomePath()); }
  // [TOOLIEST AUDIT] Only fire theme toggle on lowercase 't' — Shift+T was triggering unintentionally.
  if (e.key === 't' && !e.ctrlKey && !e.metaKey && !e.altKey && !e.shiftKey) { App.toggleTheme(); }
});

// === INIT ===
document.addEventListener('DOMContentLoaded', () => App.init());
