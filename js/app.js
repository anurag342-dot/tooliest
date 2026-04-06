// ============================================
// TOOLIEST.COM — Main Application (SPA Router)
// ============================================

const TOOLIEST_CHANGELOG = [
  { version: '2.4', date: '2026-04-06', items: ['Added dark/light theme toggle', 'Keyboard shortcuts panel (press ?)', 'Tool sharing via Web Share API', 'Cross-category related tools'] },
  { version: '2.3', date: '2026-04-05', items: ['Added tool comparison mode', 'Export/import favorites', 'Performance metrics on tools'] },
  { version: '2.2', date: '2026-04-04', items: ['80+ tools now available', 'Cookie consent & GDPR compliance', 'PWA offline support improved'] },
  { version: '2.1', date: '2026-04-02', items: ['AI-powered tools launched', 'Image EXIF privacy stripper', 'Audio converter with FFmpeg'] },
  { version: '2.0', date: '2026-03-28', items: ['Complete redesign with glassmorphism UI', 'Added 30+ new tools', 'Mobile-first responsive layout'] },
];

const App = {
  currentView: 'home',
  currentCategory: 'all',
  searchQuery: '',
  favorites: JSON.parse(localStorage.getItem('tooliest_favorites') || '[]'),
  toolUsage: JSON.parse(localStorage.getItem('tooliest_usage') || '{}'),
  deferredPrompt: null,

  init() {
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js')
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
    window.addEventListener('hashchange', () => this.handleRoute());
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
          location.hash = '#/category/' + this.currentCategory;
        }
      });
      searchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && this.searchQuery) {
          location.hash = '#/search/' + encodeURIComponent(this.searchQuery);
        }
      });
    }
    // Keyboard shortcut for search
    document.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        searchInput?.focus();
      }
    });
    // Mobile menu — toggle open/close
    const mobileBtn = document.getElementById('mobile-menu-btn');
    const navLinks = document.getElementById('nav-links');
    mobileBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      const isOpen = navLinks?.classList.toggle('mobile-open');
      if (mobileBtn) mobileBtn.textContent = isOpen ? '✕' : '☰';
    });
    // Close on outside click
    document.addEventListener('click', (e) => {
      if (navLinks?.classList.contains('mobile-open') && !navLinks.contains(e.target) && e.target !== mobileBtn) {
        navLinks.classList.remove('mobile-open');
        if (mobileBtn) mobileBtn.textContent = '☰';
      }
    });
    // Close on Escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && navLinks?.classList.contains('mobile-open')) {
        navLinks.classList.remove('mobile-open');
        if (mobileBtn) mobileBtn.textContent = '☰';
      }
    });
    // Close menu when a nav link is clicked (on mobile)
    navLinks?.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        navLinks.classList.remove('mobile-open');
        if (mobileBtn) mobileBtn.textContent = '☰';
      });
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
          ? matches.map(t => `<div class="search-result-item" style="display:flex;align-items:center;gap:12px;" onclick="location.hash='#/tool/${t.id}';">
              <span style="font-size:1.4rem;">${t.icon}</span>
              <div><div style="font-weight:600;color:var(--accent-primary);">${t.name}</div><div style="font-size:0.82rem;color:var(--text-secondary);">${t.description.slice(0, 60)}...</div></div>
            </div>`).join('')
          : '<p style="color:var(--text-tertiary);padding:12px 0;">No tools found. Try different keywords.</p>';
        // Close overlay when a result is tapped
        mobileSearchResults.querySelectorAll('.search-result-item').forEach(item => {
          item.addEventListener('click', closeMobileSearch);
        });
      }
    });
  },

  handleRoute() {
    const hash = location.hash || '#/';
    const parts = hash.replace('#/', '').split('/');
    document.getElementById('nav-links')?.classList.remove('mobile-open');
    window.scrollTo(0, 0);

    if (parts[0] === 'tool' && parts[1]) {
      this.showTool(parts[1]);
    } else if (parts[0] === 'category' && parts[1]) {
      this.currentCategory = parts[1];
      this.currentView = 'home';
      this.renderHome();
      this.setActiveCategory(parts[1]);
    } else if (parts[0] === 'search' && parts[1]) {
      this.searchQuery = decodeURIComponent(parts[1]);
      this.renderSearchResults();
    } else {
      this.currentView = 'home';
      this.currentCategory = 'all';
      this.searchQuery = '';
      this.renderHome();
    }
  },

  renderHome() {
    const main = document.getElementById('main-content');
    main.innerHTML = this.getHeroHTML() + this.getRecentlyUsedHTML() + this.getCategoriesHTML() + '<section class="tools-section"><div class="tools-grid" id="tools-grid"></div></section>' + this.getAdHTML('home-bottom');
    this.renderToolsGrid();
    this.bindCategoryTabs();
    // Bind recently used tool card clicks
    main.querySelectorAll('.related-tools-grid .tool-card').forEach(card => {
      card.addEventListener('click', (e) => {
        if (e.target.closest('.fav-btn')) return;
        location.hash = '#/tool/' + card.dataset.toolId;
      });
    });
    this.updateSEO('Tooliest — Free Online Tools Powered by AI', 'Access 80+ free online tools for text, SEO, CSS, colors, images, JSON, encoding, math, and more. No signup required. AI-powered features included.');
  },

  getHeroHTML() {
    return `<section class="hero">
      <div class="hero-badge"><span class="pulse-dot"></span> Free &amp; No Signup Required</div>
      <h1>Every Tool You Need.<br><span class="gradient-text">Zero Installs.</span></h1>
      <p>${TOOLS.length}+ powerful online tools for developers, designers, writers, and marketers. All free, all instant, all AI-enhanced.</p>
      <div class="hero-stats">
        <div class="hero-stat"><div class="stat-value">${TOOLS.length}+</div><div class="stat-label">Free Tools</div></div>
        <div class="hero-stat"><div class="stat-value">${TOOL_CATEGORIES.length - 1}</div><div class="stat-label">Categories</div></div>
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
        this.setActiveCategory(this.currentCategory);
        this.renderToolsGrid();
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
    grid.querySelectorAll('.tool-card').forEach(card => {
      card.addEventListener('click', (e) => {
        if (e.target.closest('.fav-btn')) return; // Ignore favoriting clicks
        location.hash = '#/tool/' + card.dataset.toolId; 
      });
      // Keyboard support for tool cards (BUG-08: accessibility)
      card.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          location.hash = '#/tool/' + card.dataset.toolId;
        }
      });
      // Favoriting listener
      const favBtn = card.querySelector('.fav-btn');
      if (favBtn) {
        favBtn.addEventListener('click', () => this.toggleFavorite(card.dataset.toolId));
      }
    });
  },

  toggleFavorite(toolId) {
    if (this.favorites.includes(toolId)) {
      this.favorites = this.favorites.filter(id => id !== toolId);
    } else {
      this.favorites.push(toolId);
    }
    localStorage.setItem('tooliest_favorites', JSON.stringify(this.favorites));
    
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
      <button class="fav-btn${isFav ? ' active' : ''}" aria-label="${isFav ? 'Remove from favorites' : 'Add to favorites'}">${isFav ? '⭐' : '☆'}</button>
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

  // ===== TOOL PAGE RENDERING =====
  showTool(toolId) {
    const tool = TOOLS.find(t => t.id === toolId);
    if (!tool) { location.hash = '#/'; return; }
    this.currentView = 'tool';
    this.trackUsage(toolId);
    this.updateSEO(tool.meta.title, tool.meta.desc, tool);
    const catName = TOOL_CATEGORIES.find(c => c.id === tool.category)?.name || '';
    const main = document.getElementById('main-content');
    
    // SEO-08: Cross-category related tools + same category
    const sameCategory = TOOLS.filter(t => t.category === tool.category && t.id !== tool.id);
    const otherCategory = TOOLS.filter(t => t.category !== tool.category && t.id !== tool.id && t.tags.some(tag => tool.tags.includes(tag)));
    const related = [...sameCategory.slice(0, 3), ...otherCategory.slice(0, 2)].slice(0, 5);
    
    main.innerHTML = `<div class="tool-page">
      <div class="tool-page-header">
        <div class="tool-breadcrumb">
          <a href="#/" onclick="location.hash='#/'">Home</a>
          <span class="separator">›</span>
          <a href="#/category/${tool.category}">${catName}</a>
          <span class="separator">›</span>
          <span>${tool.name}</span>
        </div>
        <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px">
          <h1 style="margin:0">${tool.icon} ${tool.name} ${tool.isAI ? '<span class="ai-badge" style="font-size:0.5em;vertical-align:middle">✨ AI-Powered</span>' : ''}</h1>
          <button class="btn btn-secondary btn-sm" id="share-tool-btn" aria-label="Share this tool">📤 Share</button>
        </div>
        <p>${tool.description}</p>
        ${tool.education ? `<div class="tool-education-visible" style="margin-top:16px;background:var(--bg-secondary);padding:16px;border-radius:var(--radius-md);border:1px solid var(--border-color);"><div style="font-weight:600;color:var(--accent-primary);margin-bottom:8px">📖 About this tool</div><div style="font-size:0.9rem;line-height:1.5;color:var(--text-secondary)">${tool.education}</div></div>` : ''}
      </div>
      ${this.getAdHTML('tool-top')}
      <div class="tool-workspace" id="tool-workspace"></div>
      ${this.getAdHTML('tool-bottom')}
      ${related.length ? `<div class="related-tools"><h3>You May Also Like</h3><div class="related-tools-grid">${related.map(r => this.getToolCardHTML(r)).join('')}</div></div>` : ''}
    </div>`;

    // Render tool UI
    const workspace = document.getElementById('tool-workspace');
    ToolRenderers.render(toolId, workspace);

    // FEAT-04: Share button
    document.getElementById('share-tool-btn')?.addEventListener('click', () => this.shareTool(tool));

    // Bind related tool clicks
    main.querySelectorAll('.related-tools-grid .tool-card').forEach(card => {
      card.addEventListener('click', () => { location.hash = '#/tool/' + card.dataset.toolId; });
    });
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
      ${results.map(t => `<div class="search-result-item" onclick="location.hash='#/tool/${t.id}'">
        <h3>${t.icon} ${t.name}</h3><p>${t.description}</p>
      </div>`).join('') || '<p>No tools found. Try different keywords.</p>'}
    </div>`;
  },

  setupAutoSave(inputId, storageKey) {
    const inp = document.getElementById(inputId);
    if (!inp) return;
    const saved = localStorage.getItem('tooliest_save_' + storageKey);
    if (saved) inp.value = saved;
    let timeout;
    inp.addEventListener('input', () => {
      clearTimeout(timeout);
      timeout = setTimeout(() => localStorage.setItem('tooliest_save_' + storageKey, inp.value), 800);
    });
  },

  showInstallPrompt() {
    if (document.getElementById('pwa-install-banner') || localStorage.getItem('tooliest_pwa_dismissed')) return;
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
      localStorage.setItem('tooliest_pwa_dismissed', '1');
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
    const twTitle = document.querySelector('meta[name="twitter:title"]');
    const twDesc = document.querySelector('meta[name="twitter:description"]');
    if (ogTitle) ogTitle.setAttribute('content', title);
    if (ogDesc) ogDesc.setAttribute('content', description);
    if (twTitle) twTitle.setAttribute('content', title);
    if (twDesc) twDesc.setAttribute('content', description);
    // Remove old dynamic schemas
    document.querySelectorAll('script[data-dynamic-schema]').forEach(s => s.remove());
    // Inject per-tool JSON-LD + BreadcrumbList if on a tool page
    if (tool) {
      const catName = TOOL_CATEGORIES.find(c => c.id === tool.category)?.name || tool.category;
      const toolSchema = {
        '@context': 'https://schema.org',
        '@type': 'WebApplication',
        'name': tool.name,
        'url': 'https://tooliest.com/#/tool/' + tool.id,
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
          { '@type': 'ListItem', 'position': 2, 'name': catName, 'item': 'https://tooliest.com/#/category/' + tool.category },
          { '@type': 'ListItem', 'position': 3, 'name': tool.name, 'item': 'https://tooliest.com/#/tool/' + tool.id }
        ]
      };
      // AEO-02: HowTo schema for tool pages
      const howTo = {
        '@context': 'https://schema.org',
        '@type': 'HowTo',
        'name': 'How to use ' + tool.name + ' online',
        'description': tool.meta?.desc || tool.description,
        'step': [
          { '@type': 'HowToStep', 'position': 1, 'name': 'Open the tool', 'text': 'Navigate to ' + tool.name + ' on Tooliest.com' },
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
    }
  },

  toast(message, type = 'success') {
    const existing = document.querySelector('.toast');
    if (existing) existing.remove();
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);
    requestAnimationFrame(() => toast.classList.add('show'));
    setTimeout(() => { toast.classList.remove('show'); setTimeout(() => toast.remove(), 400); }, 2500);
  },
  // ===== FEAT-01: THEME TOGGLE =====
  initTheme() {
    const saved = localStorage.getItem('tooliest_theme') || 'dark';
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
    localStorage.setItem('tooliest_theme', next);
    const btn = document.getElementById('theme-toggle-btn');
    if (btn) btn.textContent = next === 'light' ? '🌙' : '☀️';
    this.toast(next === 'light' ? 'Light mode enabled ☀️' : 'Dark mode enabled 🌙');
  },

  // ===== FEAT-02: TOOL USAGE TRACKING =====
  trackUsage(toolId) {
    this.toolUsage[toolId] = (this.toolUsage[toolId] || 0) + 1;
    // Store last-used timestamp
    const recent = JSON.parse(localStorage.getItem('tooliest_recent') || '[]');
    const filtered = recent.filter(id => id !== toolId);
    filtered.unshift(toolId);
    localStorage.setItem('tooliest_recent', JSON.stringify(filtered.slice(0, 10)));
    localStorage.setItem('tooliest_usage', JSON.stringify(this.toolUsage));
  },

  getRecentlyUsedHTML() {
    const recent = JSON.parse(localStorage.getItem('tooliest_recent') || '[]').slice(0, 5);
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
    const url = 'https://tooliest.com/#/tool/' + tool.id;
    const shareData = { title: tool.name + ' — Free Online Tool', text: tool.description, url };
    if (navigator.share) {
      navigator.share(shareData).catch(() => {});
    } else {
      navigator.clipboard.writeText(url).then(() => this.toast('Link copied to clipboard! 📋'));
    }
  },

  // ===== FEAT-03: KEYBOARD SHORTCUTS PANEL =====
  showShortcuts() {
    const existing = document.getElementById('shortcuts-overlay');
    if (existing) { existing.remove(); return; }
    const overlay = document.createElement('div');
    overlay.id = 'shortcuts-overlay';
    overlay.innerHTML = `<div class="shortcuts-panel">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px">
        <h2 style="font-size:1.2rem;font-weight:700">⌨️ Keyboard Shortcuts</h2>
        <button id="shortcuts-close" style="background:none;border:none;color:var(--text-secondary);font-size:1.3rem;cursor:pointer">✕</button>
      </div>
      <div class="shortcut-list">
        <div class="shortcut-item"><kbd>Ctrl</kbd> + <kbd>K</kbd><span>Search tools</span></div>
        <div class="shortcut-item"><kbd>?</kbd><span>Show shortcuts</span></div>
        <div class="shortcut-item"><kbd>H</kbd><span>Go home</span></div>
        <div class="shortcut-item"><kbd>T</kbd><span>Toggle theme</span></div>
        <div class="shortcut-item"><kbd>Esc</kbd><span>Close overlay</span></div>
      </div>
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
    localStorage.setItem('tooliest_changelog_seen', TOOLIEST_CHANGELOG[0].version);
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
    const searchEl = document.getElementById('search-input');
    if (searchEl) { searchEl.focus(); searchEl.select(); }
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
  if (e.key === 'h' || e.key === 'H') { location.hash = '#/'; }
  if (e.key === 't' || e.key === 'T') { App.toggleTheme(); }
});

// === INIT ===
document.addEventListener('DOMContentLoaded', () => App.init());
