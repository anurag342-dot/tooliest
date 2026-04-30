// ============================================
// TOOLIEST.COM — Main Application (SPA Router)
// ============================================

const TOOLIEST_WHATS_NEW = [
  { version: '3.20', date: '2026-04-30', items: ['Removed the repeated release-history sections from tool pages so the educational content stays cleaner and easier to scan', 'Removed the About page release-history block and kept product updates in one shared What&apos;s New panel instead of duplicating them across the site', 'Refreshed the What&apos;s New feed and navigation label so the latest updates stay easy to find without cluttering normal tool pages'] },
  { version: '3.19', date: '2026-04-29', items: ['Launched the Guides &amp; Tutorials section with three in-depth editorial articles on image optimization, CSS minification, and PDF workflows', 'Added unique educational content, HowTo steps, and FAQ extras to 17 tool pages including all minifiers, beautifiers, counters, and image tools', 'Improved site identity with founder info, GitHub link in navigation and footer, and honest privacy-first disclosure across all pages', 'Added Guides navigation link, homepage guides section, RSS feed, and sitemap entries for better discoverability'] },
  { version: '3.18', date: '2026-04-26', items: ['Added the browser-only Code Screenshot Generator with syntax highlighting, multi-file tabs, PNG and SVG export, and share-ready themes', 'Brought offline-ready code image creation into the developer workflow without server uploads or Carbon-style network dependence', 'Connected screenshot exports into JSON formatting, CSS cleanup, image compression, and QR sharing workflows'] },
  { version: '3.17', date: '2026-04-26', items: ['Added the private browser-based Typing Speed Test with words, sentences, code, numbers, and custom text practice', 'Shipped local personal best tracking, sparkline score history, mistake analysis, and a no-keystroke-upload privacy banner', 'Connected the typing workflow to Word Counter, Lorem Ipsum, and password practice tools for follow-up training'] },
  { version: '3.16', date: '2026-04-24', items: ['Added the browser-based Online Signature Maker with draw, type, and upload modes plus transparent PNG and SVG export', 'Connected signature workflows directly into invoices, PDF compression, password protection, and image resizing', 'Added realistic signature preview contexts so exported signatures can be checked against invoices, documents, and email use cases'] },
  { version: '3.15', date: '2026-04-24', items: ['Added the browser-based Email Signature Generator with three table-based templates for Gmail, Outlook, and Apple Mail', 'Shipped instant HTML copy actions, Outlook-friendly output, and live preview chrome without any signup wall', 'Added cross-links into QR, image resizing, and invoice workflows for faster business setup'] },
  { version: '3.14', date: '2026-04-24', items: ['Improved asset versioning and cache refresh behavior so newly shipped tools and fixes appear more reliably after deployment', 'Tightened page revalidation rules for the site shell, categories, and tool routes', 'Reduced stale-service-worker cases that were hiding recent Tooliest updates in normal browsing sessions'] },
  { version: '3.13', date: '2026-04-23', items: ['Added a full browser-based invoice generator with reusable business profiles, live previews, drafts, and PDF export', 'Created a dedicated invoice social preview card and related-tool workflow links for post-download steps', 'Refreshed cached assets and offline routes so the new invoicing experience loads cleanly'] },
  { version: '3.12', date: '2026-04-23', items: ['Added clearer before-and-after upload previews across image editing tools', 'Made source and output files easier to verify before downloading changes', 'Refreshed cached assets so the upgraded preview UI appears immediately'] },
  { version: '3.11', date: '2026-04-23', items: ['Trimmed the oversized empty space under embedded PDF workspaces', 'Changed the embedded PDF height measurement to follow the real workspace content instead of the full viewport', 'Reduced the fallback PDF frame height for cleaner first paint on document tools'] },
  { version: '3.10', date: '2026-04-23', items: ['Moved PDF tools into isolated embedded workspaces so uploads, drag-and-drop, and downloads keep their original behavior', 'Stopped SPA re-hydration from overwriting embedded standalone PDF documents', 'Refreshed asset versions to flush the broken cached PDF tool shell'] },
  { version: '3.9', date: '2026-04-21', items: ['Allowed the shared PDF CDN dependencies inside the site security policy', 'Preserved direct external PDF helper scripts when mounting PDF tools into the Tooliest shell', 'Refreshed asset versions so browsers stop serving the broken PDF library path'] },
  { version: '3.8', date: '2026-04-21', items: ['Moved PDF tools onto the normal Tooliest tool-page shell without forced full-page jumps', 'Restored compare, performance, trust, and quick-action sections on PDF tool pages', 'Swapped the updates pill to a simple new emoji and refreshed cached shell assets'] },
  { version: '3.7', date: '2026-04-21', items: ['Repaired broken shell icons and text that were showing as corrupted symbols', 'Restored the PDF category, updated tool totals, and refreshed the homepage shell', 'Made the install entry consistently visible with browser-menu fallback guidance'] },
  { version: '3.6', date: '2026-04-20', items: ['Reduced repeated tool-count messaging across the homepage hero', 'Bumped the asset version to flush stale cached homepage shells after the SEO refresh'] },
  { version: '3.5', date: '2026-04-18', items: ['Removed duplicate tool-introduction blocks from tool pages', 'Kept the structured What Is section as the single explanation area for each tool'] },
  { version: '3.4', date: '2026-04-18', items: ['Made FAQ, why-use, and who-uses sections visible in the live SPA tool pages', 'Restored category FAQ/supporting sections during normal client-side navigation'] },
  { version: '3.3', date: '2026-04-18', items: ['Removed the redundant Popular This Week panel from the homepage', 'Kept Recently Used and Most Popular On This Device as the primary personal discovery sections'] },
  { version: '3.2', date: '2026-04-18', items: ['Cut mobile render-blocking CSS with an inline critical shell', 'Preserved prerendered home and category pages on first load', 'Batched large tool-grid rendering to keep the main thread responsive'] },
  { version: '3.1', date: '2026-04-18', items: ['Added a mobile quick-action bar on tool pages', 'Improved category tab scroll discoverability with swipe hints', 'Finished the remaining mobile audit navigation and paint polish'] },
  { version: '3.0', date: '2026-04-18', items: ['Hardened mobile safe-area handling and touch targets', 'Added reduced-motion and tablet layout improvements', 'Upgraded PWA metadata and mobile menu swipe dismissal'] },
  { version: '2.9', date: '2026-04-17', items: ['Rebuilt Image EXIF Privacy Stripper with explicit clean-download actions and lossless metadata stripping for JPEG, PNG, and WebP'] },
  { version: '2.8', date: '2026-04-17', items: ['Auto-linked visible labels to tool inputs for broader accessibility coverage'] },
  { version: '2.7', date: '2026-04-17', items: ['Cut compare view overhead by reusing the live current workspace', 'Added a weekly popularity section powered by local usage history', 'Added an opt-in email capture prompt for repeat Tooliest users'] },
  { version: '2.6', date: '2026-04-17', items: ['Added browser-based QR Code Generator with PNG download', 'Added Ctrl + / shortcut to reopen your most recently used tool', 'Refreshed featured tool discovery to surface QR workflows faster'] },
  { version: '2.5', date: '2026-04-06', items: ['Added prerendered category pages for SEO', 'Added favorites export and import backup', 'Introduced the welcome tour', 'Added side-by-side comparison mode for related tools'] },
  { version: '2.4', date: '2026-04-06', items: ['Added dark/light theme toggle', 'Keyboard shortcuts panel (press ?)', 'Tool sharing via Web Share API', 'Cross-category related tools'] },
  { version: '2.3', date: '2026-04-05', items: ['Expanded structured data across tool pages', 'Improved accessibility states for favorites and categories', 'Strengthened offline caching and font loading'] },
  { version: '2.2', date: '2026-04-04', items: ['80+ tools now available', 'Cookie consent and GDPR compliance', 'PWA offline support improved'] },
  { version: '2.1', date: '2026-04-02', items: ['AI-powered tools launched', 'Image EXIF privacy stripper', 'Browser-based audio converter released'] },
  { version: '2.0', date: '2026-03-28', items: ['Complete redesign with glassmorphism UI', 'Added 30+ new tools', 'Mobile-first responsive layout'] },
];
const TOOLIEST_ASSET_VERSION = window.__TOOLIEST_ASSET_VERSION || '20260430-bd6913ad';
const TOOLIEST_ENABLE_PERFORMANCE_PANEL = false;
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
  standaloneToolSourceCache: new Map(),
  standaloneExternalScriptPromises: new Map(),
  standaloneToolMountToken: 0,
  standaloneToolStyleElement: null,
  standaloneToolFrameCleanup: null,
  comparisonFrameCleanup: null,

  init() {
    this.normalizeLegacyHashRoute();
    document.body.classList.toggle('embed-mode', this.isEmbedMode());
    this.initInputCapabilities();
    if (this.initializeStandaloneEmbedDocument()) {
      return;
    }

    if (!this.isEmbedMode() && 'serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register(`/sw.js?v=${encodeURIComponent(TOOLIEST_ASSET_VERSION)}`, { updateViaCache: 'none' })
          .then(reg => console.log('[Service Worker] Registered', reg.scope))
          .catch(err => console.log('[Service Worker] Failed', err));
      });
    }
    
    this.initTheme();
    this.bindEvents();
    this.handleRoute();
    window.addEventListener('popstate', () => this.handleRoute());
    if (!this.isEmbedMode()) {
      this.syncInstallEntryPoints();
      window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        this.deferredPrompt = e;
        this.syncInstallEntryPoints();
        // Show floating banner specifically if not dismissed
        setTimeout(() => this.showInstallPrompt(), 3000);
      });
      window.addEventListener('appinstalled', () => {
        this.deferredPrompt = null;
        document.getElementById('pwa-install-banner')?.remove();
        document.body.classList.remove('pwa-install-open');
        this.syncInstallEntryPoints();
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

  isStandaloneInstall() {
    return Boolean(window.matchMedia?.('(display-mode: standalone)').matches || window.navigator.standalone === true);
  },

  syncInstallEntryPoints() {
    const navBtn = document.getElementById('nav-install-btn');
    if (!navBtn) return;

    if (this.isEmbedMode() || this.isStandaloneInstall()) {
      navBtn.style.display = 'none';
      return;
    }

    navBtn.style.display = '';
    navBtn.setAttribute('aria-label', this.deferredPrompt ? 'Install Tooliest app' : 'Learn how to install Tooliest');
    navBtn.onclick = (event) => {
      event.preventDefault();
      this.handleInstallAction();
    };
  },

  async handleInstallAction() {
    if (this.deferredPrompt) {
      this.deferredPrompt.prompt();
      const { outcome } = await this.deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        document.getElementById('pwa-install-banner')?.remove();
        document.body.classList.remove('pwa-install-open');
      }
      this.deferredPrompt = null;
      this.syncInstallEntryPoints();
      return;
    }

    this.showInstallPrompt({ force: true, manualOnly: true });
    this.toast('Use your browser menu and choose Install App or Add to Home Screen.');
  },

  showInstallPrompt(options = {}) {
    if (this.isEmbedMode() || this.isStandaloneInstall()) return;
    const force = Boolean(options.force);
    const manualOnly = Boolean(options.manualOnly || !this.deferredPrompt);
    const existingBanner = document.getElementById('pwa-install-banner');
    if (existingBanner) {
      if (!force) return;
      existingBanner.remove();
      document.body.classList.remove('pwa-install-open');
    }
    if (!force && safeLocalRead('tooliest_pwa_dismissed')) return;
    if (!force && manualOnly) return;

    const banner = document.createElement('div');
    banner.id = 'pwa-install-banner';
    banner.innerHTML = `
      <div style="display:flex;align-items:center;gap:12px;">
        <div style="display:flex;align-items:center;justify-content:center;width:40px;height:40px;border-radius:12px;background:var(--gradient-primary);font-weight:700;color:#fff;">APP</div>
        <div>
          <div style="font-weight:600;color:var(--text-primary)">Install Tooliest</div>
          <div style="font-size:0.85rem;color:var(--text-secondary)">${manualOnly ? 'Use your browser menu to install or add Tooliest to your home screen.' : 'Open Tooliest as an app with offline support and faster relaunches.'}</div>
        </div>
      </div>
      <div style="display:flex;gap:12px;align-items:center;">
        <button id="pwa-install-btn" class="btn btn-primary" style="padding:6px 12px;font-size:0.9rem">${manualOnly ? 'Install Help' : 'Install App'}</button>
        <button id="pwa-close-btn" aria-label="Close install banner" style="background:none;border:none;color:var(--text-tertiary);cursor:pointer;font-size:1rem;padding:4px">&times;</button>
      </div>`;
    document.body.appendChild(banner);
    document.body.classList.add('pwa-install-open');
    document.getElementById('pwa-install-btn')?.addEventListener('click', async () => {
      if (manualOnly) {
        this.toast('Open the browser menu and choose Install App or Add to Home Screen.');
        return;
      }
      await this.handleInstallAction();
      if (!this.deferredPrompt) {
        banner.remove();
        document.body.classList.remove('pwa-install-open');
      }
    });
    document.getElementById('pwa-close-btn')?.addEventListener('click', () => {
      safeLocalSet('tooliest_pwa_dismissed', '1');
      banner.classList.remove('show');
      setTimeout(() => {
        banner.remove();
        document.body.classList.remove('pwa-install-open');
      }, 300);
    });
    requestAnimationFrame(() => banner.classList.add('show'));
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
    const querySearch = url.searchParams.get('q');

    if (pathname.length > 1 && pathname.endsWith('/')) {
      pathname = pathname.slice(0, -1);
    }

    const parts = pathname.replace(/^\/+/, '').split('/').filter(Boolean);
    if (parts.length === 0) {
      if (querySearch) {
        return { view: 'search', query: querySearch, queryParamSearch: true };
      }
      return { view: 'home' };
    }
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

  initializeStandaloneEmbedDocument() {
    if (!this.isEmbedMode() || !this.isStandaloneToolPath()) return false;

    const main = document.getElementById('main-content');
    const workspace = document.getElementById('tool-workspace');
    if (!main || !workspace) return false;

    const route = this.parsePath(window.location.pathname.replace(/\/index\.html$/, '/'));
    const toolId = route.toolId || '';

    document.body.classList.add('embed-mode', 'standalone-tool-embed');

    const wrapper = document.createElement('div');
    wrapper.className = 'tool-page tool-page-embed standalone-tool-embed-page';
    main.innerHTML = '';
    wrapper.appendChild(workspace);
    main.appendChild(wrapper);

    const reportHeight = () => {
      if (window.parent === window) return;
      const height = Math.max(
        240,
        workspace.scrollHeight || 0,
        workspace.offsetHeight || 0,
        wrapper.scrollHeight || 0,
        wrapper.offsetHeight || 0
      );
      window.parent.postMessage({
        type: 'TOOLIEST_STANDALONE_HEIGHT',
        toolId,
        height,
      }, window.location.origin);
    };

    const queueHeightReport = () => window.requestAnimationFrame(reportHeight);
    const canElementConsumeWheel = (element, deltaY) => {
      if (!(element instanceof Element)) return false;
      const style = window.getComputedStyle(element);
      const overflowY = `${style.overflowY || ''}${style.overflow || ''}`;
      if (!/(auto|scroll|overlay)/i.test(overflowY)) return false;
      const maxScrollTop = element.scrollHeight - element.clientHeight;
      if (maxScrollTop <= 1) return false;
      if (deltaY < 0) return element.scrollTop > 0;
      if (deltaY > 0) return element.scrollTop < maxScrollTop - 1;
      return false;
    };
    const shouldForwardWheelToParent = (target, deltaY) => {
      let node = target instanceof Element ? target : null;
      while (node && node !== document.body) {
        if (canElementConsumeWheel(node, deltaY)) return false;
        node = node.parentElement;
      }
      return true;
    };
    const forwardWheelToParent = (event) => {
      if (window.parent === window) return;
      if (!shouldForwardWheelToParent(event.target, event.deltaY)) return;
      event.preventDefault();
      window.parent.postMessage({
        type: 'TOOLIEST_STANDALONE_WHEEL',
        toolId,
        deltaX: Number(event.deltaX) || 0,
        deltaY: Number(event.deltaY) || 0,
      }, window.location.origin);
    };
    let resizeObserver = null;
    if ('ResizeObserver' in window) {
      resizeObserver = new ResizeObserver(() => queueHeightReport());
      resizeObserver.observe(document.body);
      resizeObserver.observe(main);
      resizeObserver.observe(wrapper);
      resizeObserver.observe(workspace);
    }

    window.addEventListener('load', queueHeightReport, { once: true });
    window.addEventListener('resize', queueHeightReport);
    window.addEventListener('wheel', forwardWheelToParent, { passive: false });
    window.setTimeout(queueHeightReport, 0);
    window.setTimeout(queueHeightReport, 250);
    window.setTimeout(queueHeightReport, 900);
    queueHeightReport();

    window.addEventListener('beforeunload', () => {
      resizeObserver?.disconnect();
      window.removeEventListener('wheel', forwardWheelToParent);
    }, { once: true });

    return true;
  },

  getEmbeddedFrameHeight(frame, minHeight = 320) {
    try {
      const doc = frame?.contentDocument;
      if (!doc) return minHeight;
      const workspace = doc.getElementById('tool-workspace');
      const workspaceBody = workspace?.querySelector('.tool-workspace-body');
      const embedPage = doc.querySelector('.standalone-tool-embed-page');
      return Math.max(
        minHeight,
        workspaceBody?.scrollHeight || 0,
        workspaceBody?.offsetHeight || 0,
        workspace?.scrollHeight || 0,
        workspace?.offsetHeight || 0,
        embedPage?.scrollHeight || 0,
        embedPage?.offsetHeight || 0
      );
    } catch (_) {
      return minHeight;
    }
  },

  applyEmbeddedFrameHeight(frame, height, minHeight = 320) {
    if (!frame) return;
    const safeHeight = Math.max(minHeight, Math.ceil(Number(height) || 0));
    frame.style.height = `${safeHeight}px`;
    frame.style.minHeight = `${safeHeight}px`;
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
    const narrativeName = this.getCategoryNarrativeName(category);
    const featuredNames = this.getFeaturedToolNames(tools, 3);
    const defaultDescription = `Explore ${count} free ${narrativeName} on Tooliest. Browser-based utilities with no signup, no uploads, and no server processing. Explore the category now.`;
    const defaultIntro = `Browse Tooliest's ${narrativeName} and launch every tool instantly in your browser without sending your data to a server.`;
    const pdfDescription = featuredNames
      ? `Use ${count} free PDF tools on Tooliest to merge, split, compress, convert, protect, and export documents in your browser. Popular picks include ${featuredNames}. No signup required.`
      : `Use ${count} free PDF tools on Tooliest to merge, split, compress, convert, protect, and export documents in your browser. No signup required.`;
    const pdfIntro = featuredNames
      ? `Browse Tooliest's PDF tools for document merging, splitting, conversion, protection, and text extraction. Popular picks include ${featuredNames}, and every workflow stays in your browser for better privacy.`
      : `Browse Tooliest's PDF tools for document merging, splitting, conversion, protection, and text extraction. Every workflow stays in your browser for better privacy.`;

    return {
      category,
      tools,
      count,
      title: `Free ${category.name} Online | Tooliest`,
      description: categoryId === 'pdf' ? pdfDescription : defaultDescription,
      intro: categoryId === 'pdf' ? pdfIntro : defaultIntro,
      topToolsIntro: categoryId === 'pdf'
        ? 'These PDF tools handle the document tasks people usually need first: merging files, splitting pages, compressing exports, securing documents, and converting between PDFs, images, and text.'
        : `These are some of the most useful ${narrativeName} on Tooliest when you want fast results without extra tabs, accounts, or uploads:`,
      benefitsIntro: categoryId === 'pdf'
        ? 'Browser-based PDF tools are useful when you need to fix or export a document quickly without installing desktop software, creating an account, or sending files to a server.'
        : `Tooliest's ${narrativeName} are designed for quick, practical work. You can launch a tool instantly, finish the task in one browser tab, and move on without handing your content to a server.`,
      faq: this.getCategoryFaqItems(category, tools),
    };
  },

  getFeaturedToolNames(tools, limit = 3) {
    return tools.slice(0, limit).map((tool) => tool.name).join(', ');
  },

  getCategoryNarrativeName(category) {
    const words = String(category?.name || '').split(/\s+/).filter(Boolean);
    if (!words.length) return '';
    return words
      .map((word) => (/^[A-Z0-9&+-]{2,}$/.test(word) ? word : word.toLowerCase()))
      .join(' ');
  },

  getCategoryFaqItems(category, categoryTools) {
    const narrativeName = this.getCategoryNarrativeName(category);
    const featuredNames = this.getFeaturedToolNames(categoryTools, 3);
    if (category.id === 'pdf') {
      return [
        {
          q: "What can I do with Tooliest's PDF tools?",
          a: 'You can merge, split, compress, reorder, protect, watermark, convert, and extract PDFs directly in your browser. Tooliest also includes PDF to Images, Images to PDF, Text to PDF, and PDF to Text workflows for everyday document work.',
        },
        {
          q: 'Are Tooliest PDF tools private to use?',
          a: 'Yes. Tooliest processes PDF files locally in the browser whenever possible, so your documents stay on your device instead of being uploaded to a remote server.',
        },
        {
          q: 'Which PDF tools are the best starting point for everyday document work?',
          a: 'PDF Merger, PDF Splitter, PDF Compressor, PDF Password Protect, and Images to PDF cover the jobs people usually need first: combining files, splitting page ranges, shrinking exports, securing documents, and packaging images into share-ready PDFs.',
        },
      ];
    }
    const examples = featuredNames
      ? `You can use ${featuredNames} and other ${narrativeName} directly in your browser without signups or uploads.`
      : `You can use Tooliest's ${narrativeName} directly in your browser without signups or uploads.`;

    return [
      {
        q: `What can I do with Tooliest's ${narrativeName}?`,
        a: `${examples} These tools are built for quick, practical tasks so you can finish work faster while keeping your input on your own device.`,
      },
      {
        q: `Are Tooliest's ${narrativeName} free to use?`,
        a: `Yes. All Tooliest ${narrativeName} are free to use, require no signup, and work in modern desktop and mobile browsers.`,
      },
      {
        q: `Do Tooliest's ${narrativeName} upload my data?`,
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
      pdf: ['image', 'privacy', 'converter'],
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

  resolveRelatedLinkCard(link) {
    const hrefToolId = (() => {
      try {
        const pathname = new URL(link?.href || '', window.location.origin).pathname.replace(/\/+$/, '');
        return pathname.replace(/^\//, '');
      } catch (_) {
        return '';
      }
    })();
    const linkedTool = link && (link.toolId || hrefToolId)
      ? TOOLS.find((candidate) => candidate.id === (link.toolId || hrefToolId))
      : null;
    const categoryName = linkedTool
      ? (TOOL_CATEGORIES.find((category) => category.id === linkedTool.category)?.name || 'Related Tool')
      : (link.badge || (link.comingSoon ? 'Coming Soon' : 'Related Tool'));
    return {
      href: link.href || (linkedTool ? this.getToolPath(linkedTool.id) : ''),
      title: link.title || linkedTool?.name || 'Related Tool',
      description: link.description || linkedTool?.description || '',
      icon: link.icon || linkedTool?.icon || '↗',
      categoryName,
      badge: link.badge || '',
      comingSoon: Boolean(link.comingSoon),
    };
  },

  getRelatedLinkCardHTML(link) {
    const normalized = this.resolveRelatedLinkCard(link);
    const badgeHtml = normalized.badge ? `<div class="ai-badge">${this.escapeHTML(normalized.badge)}</div>` : '';
    const cardInner = `<div class="tool-card-header">
        <div class="tool-card-icon">${normalized.icon}</div>
        <div class="tool-card-info">
          <h3>${this.escapeHTML(normalized.title)}</h3>
          <div style="display:flex; align-items:center; gap:8px; flex-wrap:wrap;">
            <span class="tool-category-label">${this.escapeHTML(normalized.categoryName)}</span>
            ${badgeHtml}
          </div>
        </div>
      </div>
      <p>${this.escapeHTML(normalized.description)}</p>
      <div class="tool-card-tags"><span class="tool-tag">${this.escapeHTML(normalized.comingSoon ? 'coming soon' : 'browser-based')}</span></div>`;

    if (normalized.href) {
      return `<a class="tool-card tool-card-link" href="${normalized.href}" aria-label="Open ${this.escapeHTML(normalized.title)}">${cardInner}</a>`;
    }

    return `<div class="tool-card">${cardInner}</div>`;
  },

  getRelatedToolsSectionHTML(tool, related) {
    if (Array.isArray(tool.relatedLinks) && tool.relatedLinks.length) {
      const noteHtml = tool.relatedLinksNote
        ? `<p id="${this.escapeHTML(tool.relatedLinksNote.id || '')}" style="margin-top:16px;color:var(--text-secondary);font-size:0.92rem">${this.escapeHTML(tool.relatedLinksNote.text || '')}</p>`
        : '';
      return `<div class="related-tools">
        <h3>${this.escapeHTML(tool.relatedLinksHeading || 'Related Tools')}</h3>
        <div class="related-tools-grid">${tool.relatedLinks.map((link) => this.getRelatedLinkCardHTML(link)).join('')}</div>
        ${noteHtml}
      </div>`;
    }

    return related.length
      ? `<div class="related-tools"><h3>You May Also Like</h3><div class="related-tools-grid">${related.map(r => this.getToolCardHTML(r)).join('')}</div></div>`
      : '';
  },

  getCompareCandidates(tool, limit = 10) {
    return this.getRelatedTools(tool, limit);
  },

  getStandaloneToolCacheKey(tool) {
    return `${tool.id}:${TOOLIEST_ASSET_VERSION}`;
  },

  extractStandaloneToolInlineScripts(doc) {
    return Array.from(doc.querySelectorAll('script:not([src])'))
      .filter((script) => {
        const type = (script.getAttribute('type') || '').trim().toLowerCase();
        return !type || type === 'text/javascript' || type === 'application/javascript';
      })
      .map((script) => script.textContent || '')
      .filter((code) => {
        const trimmed = code.trim();
        if (!trimmed) return false;
        if (trimmed.includes("window.location.pathname.match(/^\\/tool\\/")) return false;
        if (trimmed.includes("window.gtag('consent','default'")) return false;
        if (trimmed.includes('googletagmanager.com/gtag/js')) return false;
        if (trimmed.includes('pagead2.googlesyndication.com/pagead/js/adsbygoogle.js')) return false;
        if (trimmed.includes('window.__TOOLIEST_ASSET_VERSION')) return false;
        if (trimmed.includes("localStorage.getItem('tooliest_theme')")) return false;
        return true;
      });
  },

  extractStandaloneToolExternalScripts(doc) {
    return Array.from(doc.querySelectorAll('script[src]'))
      .map((script) => script.getAttribute('src') || '')
      .filter(Boolean)
      .filter((src) => {
        if (src.startsWith('/bundle.min.js')) return false;
        if (src.startsWith('/js/consent.js')) return false;
        if (src.includes('googletagmanager.com/gtag/js')) return false;
        if (src.includes('pagead2.googlesyndication.com/pagead/js/adsbygoogle.js')) return false;
        return true;
      });
  },

  extractStandaloneToolStyles(doc) {
    return Array.from(doc.querySelectorAll('style'))
      .map((style) => style.textContent || '')
      .filter((cssText) => {
        const trimmed = cssText.trim();
        if (!trimmed) return false;
        const isSharedShellBlock = trimmed.includes(':root{--bg-primary') && trimmed.includes('.navbar{position:fixed');
        return !isSharedShellBlock;
      })
      .join('\n\n');
  },

  clearStandaloneToolStyles() {
    if (this.standaloneToolStyleElement) {
      this.standaloneToolStyleElement.textContent = '';
    }
  },

  loadStandaloneExternalScript(src) {
    const absoluteSrc = new URL(src, window.location.origin).toString();
    if (this.standaloneExternalScriptPromises.has(absoluteSrc)) {
      return this.standaloneExternalScriptPromises.get(absoluteSrc);
    }

    const existing = Array.from(document.querySelectorAll('script[src]'))
      .find((script) => {
        try {
          return new URL(script.src, window.location.origin).toString() === absoluteSrc;
        } catch (_) {
          return false;
        }
      });
    if (existing && (existing.dataset.loaded === 'true' || existing.readyState === 'complete')) {
      return Promise.resolve();
    }

    const pending = new Promise((resolve, reject) => {
      if (existing) {
        existing.addEventListener('load', () => resolve(), { once: true });
        existing.addEventListener('error', () => reject(new Error(`Failed to load ${absoluteSrc}`)), { once: true });
        return;
      }

      const script = document.createElement('script');
      script.src = absoluteSrc;
      script.async = true;
      script.dataset.standaloneExternal = 'true';
      script.onload = () => {
        script.dataset.loaded = 'true';
        resolve();
      };
      script.onerror = () => reject(new Error(`Failed to load ${absoluteSrc}`));
      document.head.appendChild(script);
    });

    this.standaloneExternalScriptPromises.set(absoluteSrc, pending);
    return pending;
  },

  applyStandaloneToolStyles(cssText) {
    if (!this.standaloneToolStyleElement) {
      const style = document.createElement('style');
      style.id = 'standalone-tool-style';
      document.head.appendChild(style);
      this.standaloneToolStyleElement = style;
    }
    this.standaloneToolStyleElement.textContent = cssText || '';
  },

  async getStandaloneToolSource(tool) {
    const cacheKey = this.getStandaloneToolCacheKey(tool);
    if (this.standaloneToolSourceCache.has(cacheKey)) {
      return this.standaloneToolSourceCache.get(cacheKey);
    }

    const response = await fetch(`${this.getToolPath(tool.id)}?view=standalone-source&v=${encodeURIComponent(TOOLIEST_ASSET_VERSION)}`, {
      credentials: 'same-origin',
      cache: 'force-cache',
    });
    if (!response.ok) {
      throw new Error(`Unable to load ${tool.name}.`);
    }

    const html = await response.text();
    const doc = new DOMParser().parseFromString(html, 'text/html');
    const workspace = doc.querySelector('#tool-workspace');
    if (!workspace) {
      throw new Error(`Missing workspace for ${tool.name}.`);
    }

    const source = {
      styleText: this.extractStandaloneToolStyles(doc),
      workspaceInnerHTML: workspace.innerHTML,
      externalScripts: this.extractStandaloneToolExternalScripts(doc),
      inlineScripts: this.extractStandaloneToolInlineScripts(doc),
    };
    this.standaloneToolSourceCache.set(cacheKey, source);
    return source;
  },

  async mountStandaloneToolWorkspace(tool, workspace) {
    if (this.standaloneToolFrameCleanup) {
      this.standaloneToolFrameCleanup();
      this.standaloneToolFrameCleanup = null;
    }

    const minHeight = 320;
    const iframeId = `standalone-tool-frame-${tool.id}`;
    const iframeSrc = `${this.getToolPath(tool.id)}?embed=1&v=${encodeURIComponent(TOOLIEST_ASSET_VERSION)}`;

    this.clearStandaloneToolStyles();
    workspace.classList.add('tool-workspace-standalone-frame');
    workspace.innerHTML = `<div class="standalone-tool-frame-shell">
      <div class="standalone-tool-frame-loading" data-standalone-tool-loading>
        <p style="color:var(--text-secondary);margin-bottom:8px">Loading the interactive ${this.escapeHTML(tool.name)} tool...</p>
        <p style="color:var(--text-tertiary);font-size:0.9rem;margin:0">Tooliest is opening the original PDF workspace in an isolated browser frame so uploads, downloads, and drag-and-drop stay stable.</p>
      </div>
      <iframe
        id="${iframeId}"
        class="standalone-tool-frame"
        data-standalone-tool-id="${tool.id}"
        src="${iframeSrc}"
        title="${this.escapeHTML(tool.name)} workspace"
        loading="eager"
        referrerpolicy="no-referrer"
        sandbox="allow-same-origin allow-scripts allow-forms allow-downloads"
      ></iframe>
    </div>`;

    const frame = document.getElementById(iframeId);
    const loadingState = workspace.querySelector('[data-standalone-tool-loading]');
    if (!frame) return;

    const syncHeightFromDocument = () => {
      this.applyEmbeddedFrameHeight(frame, this.getEmbeddedFrameHeight(frame, minHeight), minHeight);
    };

    const markReady = () => {
      loadingState?.classList.add('is-hidden');
      frame.classList.add('is-ready');
      syncHeightFromDocument();
      window.setTimeout(syncHeightFromDocument, 150);
      window.setTimeout(syncHeightFromDocument, 700);
    };

    const handleLoad = () => {
      markReady();
    };

    const handleMessage = (event) => {
      if (event.origin !== window.location.origin) return;
      const data = event.data || {};
      if (data.toolId !== tool.id) return;
      if (data.type === 'TOOLIEST_STANDALONE_HEIGHT') {
        this.applyEmbeddedFrameHeight(frame, data.height, minHeight);
        loadingState?.classList.add('is-hidden');
        frame.classList.add('is-ready');
        return;
      }
      if (data.type === 'TOOLIEST_STANDALONE_WHEEL') {
        window.scrollBy({
          top: Number(data.deltaY) || 0,
          left: Number(data.deltaX) || 0,
          behavior: 'auto',
        });
      }
    };

    this.applyEmbeddedFrameHeight(frame, minHeight, minHeight);
    frame.addEventListener('load', handleLoad);
    window.addEventListener('message', handleMessage);
    this.standaloneToolFrameCleanup = () => {
      frame.removeEventListener('load', handleLoad);
      window.removeEventListener('message', handleMessage);
    };
  },

  isAppPath(pathname) {
    const normalized = pathname.replace(/\/index\.html$/, '/');
    return normalized === '/' ||
      Boolean(this.parsePath(normalized).view === 'tool') ||
      normalized.startsWith('/tool/') ||
      normalized.startsWith('/category/') ||
      normalized.startsWith('/search/');
  },

  isStandaloneToolPath(pathname = window.location.pathname) {
    const normalized = pathname.replace(/\/index\.html$/, '/');
    const route = this.parsePath(normalized);
    if (route.view !== 'tool' || !route.toolId) return false;
    return Boolean(TOOLS.find((tool) => tool.id === route.toolId && tool.standalonePage));
  },

  shouldUseSpaNavigation(targetPathname = window.location.pathname) {
    return this.isAppPath(window.location.pathname) &&
      this.isAppPath(targetPathname);
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
        searchInput.placeholder = 'Search tools...';
      }
      // BUG-14: Make mobile search placeholder dynamic too
      const mobileSearchEl = document.getElementById('mobile-search-input');
      if (mobileSearchEl) {
        mobileSearchEl.placeholder = 'Search tools...';
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
    const routeTool = route.view === 'tool' && route.toolId
      ? TOOLS.find((candidate) => candidate.id === route.toolId) || null
      : null;
    if (!routeTool?.standalonePage) {
      this.clearStandaloneToolStyles();
    }
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
    if (route.view !== 'tool' && this.standaloneToolFrameCleanup) {
      this.standaloneToolFrameCleanup();
      this.standaloneToolFrameCleanup = null;
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
      <div class="hero-badge"><span class="pulse-dot"></span> Free &amp; No Signup Required</div>
      <h1>Every Tool You Need.<br><span class="gradient-text">${TOOLS.length}+ Free Online Tools &mdash; Zero Installs.</span></h1>
      <p>Free online tools for developers, designers, writers, and marketers. Private, fast, and ready in one tab so you can search, launch, and finish faster with Tooliest.</p>
      <div class="hero-stats">
        <div class="hero-stat"><div class="stat-value">1</div><div class="stat-label">Tab Needed</div></div>
        <div class="hero-stat"><div class="stat-value">${categoryCount}</div><div class="stat-label">Categories</div></div>
        <div class="hero-stat"><div class="stat-value">0</div><div class="stat-label">Signups Needed</div></div>
      </div>
      <div class="hero-trust-strip" aria-label="Tooliest trust highlights">
        <span class="trust-badge">100% Private - No Uploads</span>
        <span class="trust-badge">Instant Browser Results</span>
        <span class="trust-badge">PWA Ready + Offline Support</span>
        <span class="trust-badge">No Account Friction</span>
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
      button.textContent = isFav ? '\u2B50' : '\u2606';
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
      : (TOOLIEST_WHATS_NEW[0]?.date || new Date().toISOString().split('T')[0]);

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
        <p id="tool-live-status-note">Use the live workspace below to process everything locally on this device.</p>
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
    const steps = Array.isArray(tool.howToSteps) && tool.howToSteps.length
      ? tool.howToSteps
      : [
        { name: `Open ${tool.name}`, text: `Launch ${tool.name} and add the input you want to process.` },
        { name: 'Set the options', text: 'Adjust the fields or controls that affect the output.' },
        { name: 'Generate the result', text: 'Run the tool and review the result instantly in your browser.' },
        { name: 'Copy or export the output', text: 'Reuse the final result in the next step of your workflow.' },
      ];
    const relatedCategories = (tool.relatedCategoryIds || [])
      .map((categoryId) => TOOL_CATEGORIES.find((candidate) => candidate.id === categoryId))
      .filter(Boolean);
    const snippetHtml = tool.aeoSnippet
      ? `<section class="tool-content-section">
        <h2>${this.escapeHTML(tool.aeoSnippet.heading)}</h2>
        <p>${this.escapeHTML(tool.aeoSnippet.answer)}</p>
      </section>`
      : '';
    const highlightsHtml = Array.isArray(tool.contentHighlights) && tool.contentHighlights.length
      ? `<section class="tool-content-section">
        <h2>Practical Examples & Benchmarks</h2>
        <ul>${tool.contentHighlights.map((item) => `<li>${this.escapeHTML(item)}</li>`).join('')}</ul>
      </section>`
      : '';
    const methodologyHtml = tool.methodology
      ? `<section class="tool-content-section tool-methodology">
        <h2>Methodology & Accuracy Notes</h2>
        <div>${tool.methodology}</div>
        ${tool.accuracyDisclaimer ? `<p class="tool-accuracy-disclaimer">${this.escapeHTML(tool.accuracyDisclaimer)}</p>` : ''}
      </section>`
      : '';
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
    const relatedCategoriesHtml = relatedCategories.length
      ? `<section class="tool-content-section">
        <h2>Explore Related Categories</h2>
        <ul>${relatedCategories.map((category) => `<li><a href="${this.getCategoryPath(category.id)}">${this.escapeHTML(category.name)}</a> — ${category.count || 0} tools</li>`).join('')}</ul>
      </section>`
      : '';
    const referencesHtml = Array.isArray(tool.referenceLinks) && tool.referenceLinks.length
      ? `<section class="tool-content-section">
        <h2>Reference Sources</h2>
        <ul>${tool.referenceLinks.map((item) => `<li><a href="${item.url}" target="_blank" rel="noopener noreferrer">${this.escapeHTML(item.label)}</a></li>`).join('')}</ul>
      </section>`
      : '';
    const customSectionsHtml = Array.isArray(tool.customSections) && tool.customSections.length
      ? tool.customSections.map((section) => {
        const paragraphs = Array.isArray(section.body) ? section.body : [section.body];
        return `<section class="tool-content-section">
          <h2>${this.escapeHTML(section.heading || '')}</h2>
          ${paragraphs.filter(Boolean).map((paragraph) => `<p>${this.escapeHTML(paragraph)}</p>`).join('')}
        </section>`;
      }).join('')
      : '';

    return `<article class="tool-article">
      <div class="tool-content-sections">
      <section class="tool-content-section">
        <h2>${this.escapeHTML(tool.summaryHeading || `What Is ${tool.name}?`)}</h2>
        <p>${this.escapeHTML(tool.description)}</p>
        ${tool.education ? `<div class="tool-education-copy">${tool.education}</div>` : `<p>${fallbackExplain}</p>`}
      </section>
      ${customSectionsHtml}
      ${snippetHtml}
      ${methodologyHtml}
      ${highlightsHtml}
      <section class="tool-content-section">
        <h2>${this.escapeHTML(tool.howToHeading || `How To Use ${tool.name}`)}</h2>
        <ol>${steps.map((step) => `<li><strong>${this.escapeHTML(step.name)}</strong> — ${this.escapeHTML(step.text)}</li>`).join('')}</ol>
      </section>
      ${whyUseHtml}
      ${whoUsesHtml}
      ${faqHtml}
      ${relatedCategoriesHtml}
      ${referencesHtml}
      </div>
    </article>`;
  },

  getCategoryContentSectionsHTML(meta) {
    if (!meta) return '';
    const relatedCategories = this.getRelatedCategories(meta.category.id);
    const topToolsHtml = `<section class="tool-content-section">
      <h2>Best ${this.escapeHTML(meta.category.name)} to Start With</h2>
      <p>${this.escapeHTML(meta.topToolsIntro || `These are some of the most useful ${this.getCategoryNarrativeName(meta.category)} on Tooliest when you want fast results without extra tabs, accounts, or uploads:`)}</p>
      <ul>${meta.tools.slice(0, 6).map((tool) => `<li><a href="${this.getToolPath(tool.id)}"><strong>${this.escapeHTML(tool.name)}</strong></a> - ${this.escapeHTML(tool.description)}</li>`).join('')}</ul>
    </section>`;
    const benefitsHtml = `<section class="tool-content-section">
      <h2>Why Use Browser-Based ${this.escapeHTML(meta.category.name)}?</h2>
      <p>${this.escapeHTML(meta.benefitsIntro || `Tooliest's ${this.getCategoryNarrativeName(meta.category)} are designed for quick, practical work. You can launch a tool instantly, finish the task in one browser tab, and move on without handing your content to a server.`)}</p>
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
    const toolHeading = tool.pageHeading || tool.name;
    const showHeaderActions = !tool.hideHeaderActions;
    const showTrustPanel = !tool.hideTrustPanel;
    const showComparePanel = !tool.disableComparePanel && compareCandidates.length;
    const headerActionButtons = [];
    if (!tool.disableComparePanel) {
      headerActionButtons.push(`<button class="btn btn-secondary btn-sm" id="compare-tool-btn" aria-label="Compare this tool with another tool"${compareCandidates.length ? '' : ' disabled'}>Compare</button>`);
    }
    headerActionButtons.push('<button class="btn btn-secondary btn-sm" id="print-tool-btn" aria-label="Print this tool output">Print</button>');
    headerActionButtons.push('<button class="btn btn-secondary btn-sm" id="share-tool-btn" aria-label="Share this tool">Share</button>');
    const headerActionsHtml = showHeaderActions && headerActionButtons.length
      ? `<div class="tool-header-actions">${headerActionButtons.join('')}</div>`
      : '';
    const trustPanelHtml = showTrustPanel ? this.getToolTrustPanelHTML(tool, related) : '';
    const comparePanelHtml = showComparePanel ? `<div class="compare-panel" id="compare-panel">
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
      </div>` : '';
    if (isEmbed) {
      return `<div class="tool-page tool-page-embed">
        <div class="tool-page-header">
          <h1 style="margin:0">${tool.icon} ${toolHeading}</h1>
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
          <h1 style="margin:0">${tool.icon} ${toolHeading} ${tool.isAI ? '<span class="ai-badge" style="font-size:0.5em;vertical-align:middle">AI-Powered</span>' : ''}</h1>
          ${headerActionsHtml}
        </div>
        <p>${tool.description}</p>
        <p class="tool-last-updated"><time datetime="${tool.lastReviewed || ''}">Last reviewed: ${tool.lastReviewedLabel || tool.lastReviewed || ''}</time> · ${tool.reviewedBy || 'Reviewed by Tooliest'}</p>
        ${trustPanelHtml}
      </div>
      ${this.getAdHTML('tool-top')}
      <div class="tool-workspace" id="tool-workspace"></div>
      ${comparePanelHtml}
      ${this.getToolContentSectionsHTML(tool)}
      ${this.getAdHTML('tool-bottom')}
      ${this.getRelatedToolsSectionHTML(tool, related)}
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
    if (this.standaloneToolFrameCleanup) {
      this.standaloneToolFrameCleanup();
      this.standaloneToolFrameCleanup = null;
    }
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
    main.querySelector('#tool-performance-panel')?.remove();
    // Render tool UI
    const workspace = document.getElementById('tool-workspace');
    if (tool.standalonePage) {
      void this.mountStandaloneToolWorkspace(tool, workspace);
    } else {
      window.requestAnimationFrame(() => {
        void ToolRenderers.render(toolId, workspace);
      });
    }
    this.enhanceRuntimeMedia(main, tool);

    if (!isEmbed) {
      if (TOOLIEST_ENABLE_PERFORMANCE_PANEL) {
        this.startToolPerformanceTracking(tool);
      } else if (this.performanceDashboardCleanup) {
        this.performanceDashboardCleanup();
        this.performanceDashboardCleanup = null;
        this.pendingPerformanceMeasurement = null;
      }
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
    this.updateSEO(`Search: ${q} | Tooliest`, `Search Tooliest's free online tools for "${q}".`, null);
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

  _legacyShowInstallPrompt() {
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
    const ogImage = document.querySelector('meta[property="og:image"]');
    const ogImageAlt = document.querySelector('meta[property="og:image:alt"]');
    const twTitle = document.querySelector('meta[name="twitter:title"]');
    const twDesc = document.querySelector('meta[name="twitter:description"]');
    const twImage = document.querySelector('meta[name="twitter:image"]');
    const twImageAlt = document.querySelector('meta[name="twitter:image:alt"]');
    const canonical = document.querySelector('link[rel="canonical"]');
    const robots = document.querySelector('meta[name="robots"]');
    const routePath = tool
      ? this.getToolPath(tool.id)
      : (this.currentView === 'search' && this.searchQuery)
        ? this.getSearchPath(this.searchQuery)
        : this.getCategoryPath(this.currentCategory);
    const absoluteUrl = this.getAbsoluteUrl(routePath);
    const socialImagePath = tool
      ? (tool.ogImage || '/social-card.jpg')
      : (this.currentCategory && !['all', 'favorites'].includes(this.currentCategory))
        ? `/og/categories/${this.currentCategory}.svg`
        : '/og/site/home.svg';
    const socialImageUrl = this.getAbsoluteUrl(socialImagePath);
    if (ogTitle) ogTitle.setAttribute('content', title);
    if (ogDesc) ogDesc.setAttribute('content', description);
    if (ogUrl) ogUrl.setAttribute('content', absoluteUrl);
    if (ogImage) ogImage.setAttribute('content', socialImageUrl);
    if (ogImageAlt) ogImageAlt.setAttribute('content', tool?.ogImageAlt || 'Tooliest preview card');
    if (twTitle) twTitle.setAttribute('content', title);
    if (twDesc) twDesc.setAttribute('content', description);
    if (twImage) twImage.setAttribute('content', socialImageUrl);
    if (twImageAlt) twImageAlt.setAttribute('content', tool?.ogImageAlt || 'Tooliest preview card');
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
        'dateModified': tool.lastReviewed || new Date().toISOString().split('T')[0]
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
        'step': (tool.howToSteps || []).map((step, index) => ({
          '@type': 'HowToStep',
          'position': index + 1,
          'name': step.name,
          'text': step.text
        })),
        'tool': { '@type': 'HowToTool', 'name': 'Tooliest ' + tool.name }
      };
      const faqSchema = Array.isArray(tool.faq) && tool.faq.length ? {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        'mainEntity': tool.faq.map((item) => ({
          '@type': 'Question',
          'name': item.q,
          'acceptedAnswer': {
            '@type': 'Answer',
            'text': item.a
          }
        }))
      } : null;
      const extraSchemas = Array.isArray(tool.extraStructuredData) ? tool.extraStructuredData : [];
      // [TOOLIEST AUDIT] Keep runtime tool schema aligned with pre-rendered pages for richer search coverage.
      [toolSchema, breadcrumb, howTo, faqSchema, ...extraSchemas].filter(Boolean).forEach(schema => {
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
    if (!TOOLIEST_ENABLE_PERFORMANCE_PANEL) {
      document.getElementById('tool-performance-panel')?.remove();
      return;
    }
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
    if (!TOOLIEST_ENABLE_PERFORMANCE_PANEL) return;
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
    if (!TOOLIEST_ENABLE_PERFORMANCE_PANEL) {
      document.getElementById('tool-performance-panel')?.remove();
      return;
    }
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
    const toolPage = comparisonRoot?.closest('.tool-page');
    const compareTool = TOOLS.find(tool => tool.id === compareToolId);
    const iframeSandbox = 'allow-same-origin allow-scripts allow-forms allow-downloads';
    const workspace = document.getElementById('tool-workspace');
    document.getElementById('tool-performance-panel')?.remove();

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
    if (this.comparisonFrameCleanup) {
      this.comparisonFrameCleanup();
      this.comparisonFrameCleanup = null;
    }

    const workspacePlaceholder = document.createElement('div');
    workspacePlaceholder.hidden = true;
    workspacePlaceholder.setAttribute('data-compare-placeholder', 'workspace');
    workspace.parentNode?.insertBefore(workspacePlaceholder, workspace);

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
        <iframe id="compare-tool-frame" src="${this.getToolPath(compareTool.id)}?embed=1" title="${compareTool.name} comparison panel" loading="lazy" sandbox="${iframeSandbox}" referrerpolicy="no-referrer"></iframe>
      </div>
    </div>`;

    const livePane = document.getElementById('compare-live-pane');
    const compareFrame = document.getElementById('compare-tool-frame');
    livePane?.appendChild(workspace);

    if (compareFrame) {
      const fallbackHeight = 360;
      const syncCompareHeight = () => {
        this.applyEmbeddedFrameHeight(compareFrame, this.getEmbeddedFrameHeight(compareFrame, fallbackHeight), fallbackHeight);
      };
      const handleCompareMessage = (event) => {
        if (event.origin !== window.location.origin) return;
        const data = event.data || {};
        if (data.toolId !== compareTool.id || data.type !== 'TOOLIEST_STANDALONE_HEIGHT') return;
        this.applyEmbeddedFrameHeight(compareFrame, data.height, fallbackHeight);
      };

      compareFrame.addEventListener('load', () => {
        syncCompareHeight();
        window.setTimeout(syncCompareHeight, 150);
        window.setTimeout(syncCompareHeight, 700);
      }, { once: true });
      window.addEventListener('message', handleCompareMessage);
      this.applyEmbeddedFrameHeight(compareFrame, fallbackHeight, fallbackHeight);
      this.comparisonFrameCleanup = () => {
        window.removeEventListener('message', handleCompareMessage);
      };
    }

    this.comparisonRestoreState = {
      workspace,
      workspacePlaceholder,
    };

    closeButton?.classList.remove('hidden');
    toolPage?.classList.add('tool-page-compare-active');
    comparisonRoot.scrollIntoView({ behavior: 'smooth', block: 'start' });
  },

  closeToolComparison() {
    if (this.comparisonFrameCleanup) {
      this.comparisonFrameCleanup();
      this.comparisonFrameCleanup = null;
    }
    if (this.comparisonRestoreState) {
      const {
        workspace,
        workspacePlaceholder,
      } = this.comparisonRestoreState;

      if (workspacePlaceholder?.parentNode) {
        workspacePlaceholder.replaceWith(workspace);
      }
      this.comparisonRestoreState = null;
    }

    const comparisonRoot = document.getElementById('tool-comparison-root');
    const toolPage = comparisonRoot?.closest('.tool-page');
    comparisonRoot?.replaceChildren();
    document.getElementById('compare-close-btn')?.classList.add('hidden');
    toolPage?.classList.remove('tool-page-compare-active');
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

  // ===== FEAT-05: WHAT'S NEW PANEL =====
  showWhatsNew() {
    const existing = document.getElementById('whats-new-overlay');
    if (existing) { this.dismissManagedOverlay('whats-new-overlay'); return; }
    const overlay = document.createElement('div');
    overlay.id = 'whats-new-overlay';
    overlay.innerHTML = `<div class="whats-new-panel" role="dialog" aria-modal="true" aria-label="Tooliest what's new" tabindex="-1">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px">
        <h2 style="font-size:1.2rem;font-weight:700">🆕 What's New</h2>
        <button id="whats-new-close" style="background:none;border:none;color:var(--text-secondary);font-size:1.3rem;cursor:pointer">✕</button>
      </div>
      ${TOOLIEST_WHATS_NEW.map(v => `
        <div class="whats-new-entry">
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
    const panel = overlay.querySelector('.whats-new-panel');
    let releaseFocus = null;
    const dismiss = () => {
      releaseFocus?.();
      overlay.remove();
    };
    overlay.__tooliestDismiss = dismiss;
    releaseFocus = this.activateOverlayFocusTrap(overlay, panel, dismiss);
    overlay.addEventListener('click', (e) => { if (e.target === overlay) dismiss(); });
    document.getElementById('whats-new-close')?.addEventListener('click', dismiss);
    safeLocalSet('tooliest_whats_new_seen', TOOLIEST_WHATS_NEW[0].version);
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
    if (App.dismissManagedOverlay('whats-new-overlay')) return;
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
