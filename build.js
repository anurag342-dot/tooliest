const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { minify } = require('terser');
const crypto = require('crypto');

const SITE_URL = 'https://tooliest.com';
const FONT_URL = 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap';
const BUILD_DATE = new Date().toISOString().split('T')[0];
const ASSET_VERSION = '20260415v10';
const CSS_BUNDLE_PATH = '/css/styles3.min.css';
const GOOGLE_TAG_ID = 'AW-18068794869';
const GOOGLE_TAG_SNIPPET = `<!-- Google tag (gtag.js) -->
  <script async src="https://www.googletagmanager.com/gtag/js?id=${GOOGLE_TAG_ID}"></script>
  <script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());

  gtag('config', '${GOOGLE_TAG_ID}');
  </script>`;
const ADSENSE_CLIENT = 'ca-pub-3155132462698504';
const ADSENSE_SCRIPT_URL = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT}`;
const CONSENT_DEFAULTS_INLINE = `<script>window.dataLayer=window.dataLayer||[];window.gtag=window.gtag||function(){window.dataLayer.push(arguments)};window.gtag('consent','default',{ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied',analytics_storage:'denied',wait_for_update:2000});</script>`;
const LEGACY_TOOL_PATH_REDIRECT_INLINE = `<script>(function(){var match=window.location.pathname.match(/^\\/tool\\/([^/]+)\\/?$/);if(!match)return;var target='/' + match[1] + (window.location.search||'') + (window.location.hash||'');window.location.replace(target);})();</script>`;
const ADSENSE_SCRIPT_TAG = `<script>window.addEventListener('load',function(){var s=document.createElement('script');s.src='${ADSENSE_SCRIPT_URL}';s.async=true;s.crossOrigin='anonymous';document.head.appendChild(s);});</script>`;
const THEME_BOOTSTRAP_INLINE = `<script>try{const savedTheme=localStorage.getItem('tooliest_theme');if(savedTheme==='light'||savedTheme==='dark'){document.documentElement.setAttribute('data-theme',savedTheme);}}catch(_){}</script>`;
const BRAND_ICON_PATHS = {
  svg: '/favicon.svg',
  png48: '/favicon-48.png',
  shortcut: '/favicon.ico',
  appleTouch: '/apple-touch-icon.png',
};
const STATIC_PAGE_PATHS = {
  about: '/about',
  contact: '/contact',
  privacy: '/privacy',
  terms: '/terms',
};
const STATIC_PAGE_SOURCE_FILES = {
  about: 'about.html',
  contact: 'contact.html',
  privacy: 'privacy.html',
  terms: 'terms.html',
};
const ROOT_STATIC_FILE_PATHS = [
  '/ads.txt',
  '/manifest.json',
  '/robots.txt',
  '/sitemap.html',
  '/sitemap.xml',
  '/sw.js',
  '/bundle.min.js',
  '/favicon.svg',
  '/favicon.ico',
  '/favicon-48.png',
  '/apple-touch-icon.png',
  '/icon-192.png',
  '/icon-512.png',
  '/icon-maskable-512.png',
  '/social-card.jpg',
  '/social-card.png',
];
const RESERVED_ROOT_SEGMENTS = new Set([
  'about',
  'contact',
  'privacy',
  'terms',
  'category',
  'search',
  'tool',
  'sitemap',
  'sitemap.html',
  'sitemap.xml',
  'robots.txt',
  'ads.txt',
  'manifest.json',
  'sw.js',
  'bundle.min.js',
  'css',
  'js',
  'favicon.svg',
  'favicon.ico',
  'favicon-48.png',
  'apple-touch-icon.png',
  'icon-192.png',
  'icon-512.png',
  'icon-maskable-512.png',
  'social-card.jpg',
]);

const filesToBundle = [
  'js/app.js',
  'js/tools.js',
  'js/renderers.js',
  'js/renderers2.js',
  'js/renderers3.js',
  'js/renderers4.js',
  'js/renderers5.js',
  'js/renderers6.js',
  'js/ai.js',
];

function escapeHtml(value = '') {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function escapeAttr(value = '') {
  return escapeHtml(value).replace(/'/g, '&#39;');
}

function stripHtml(value = '') {
  return String(value)
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function getAbsoluteUrl(pathname) {
  return new URL(pathname, SITE_URL).toString();
}

function getVersionedAssetPath(pathname) {
  return `${pathname}?v=${ASSET_VERSION}`;
}

function minifyCSS(css) {
  return css
    .replace(/\/\*[\s\S]*?\*\//g, '')       // remove comments
    .replace(/\s*([{}:;,>~+])\s*/g, '$1')  // remove whitespace around tokens
    .replace(/;}/g, '}')                    // remove trailing semicolons
    .replace(/\s{2,}/g, ' ')               // collapse whitespace
    .replace(/^\s+|\s+$/gm, '')            // trim lines
    .replace(/\n+/g, '')                    // remove newlines
    .trim();
}

function getToolPath(toolId) {
  return `/${encodeURIComponent(toolId)}`;
}

function getLegacyToolPath(toolId) {
  return `/tool/${encodeURIComponent(toolId)}/`;
}

function getCategoryPath(categoryId) {
  return categoryId && categoryId !== 'all'
    ? `/category/${encodeURIComponent(categoryId)}`
    : '/';
}

function getRenderableCategories(categories) {
  return categories.filter((category) => !['all', 'favorites'].includes(category.id));
}

function getCategoryTools(tools, categoryId) {
  return tools.filter((tool) => tool.category === categoryId);
}

function getCategoryMeta(category, tools) {
  const categoryTools = getCategoryTools(tools, category.id);
  const count = categoryTools.length;
  return {
    category,
    tools: categoryTools,
    count,
    title: `${category.name} | Tooliest`,
    description: `Explore ${count} free ${category.name.toLowerCase()} on Tooliest. Browser-based utilities with no signup, no uploads, and no server processing.`,
    intro: `Browse Tooliest's ${category.name.toLowerCase()} and launch every tool instantly in your browser without sending your data to a server.`,
  };
}

function readTools() {
  const source = fs.readFileSync(path.join(__dirname, 'js', 'tools.js'), 'utf8');
  const sandbox = {
    console,
    localStorage: {
      getItem() {
        return '[]';
      },
      setItem() {},
    },
    window: {},
    document: {},
    JSON,
  };

  vm.createContext(sandbox);
  vm.runInContext(`${source}\nthis.__TOOLS = TOOLS; this.__TOOL_CATEGORIES = TOOL_CATEGORIES;`, sandbox);
  return {
    tools: sandbox.__TOOLS,
    categories: sandbox.__TOOL_CATEGORIES,
  };
}

function validateToolRoutes(tools) {
  const seen = new Set();

  tools.forEach((tool) => {
    const id = String(tool.id || '').trim();
    if (!id) {
      throw new Error(`Tool "${tool.name || 'Unknown'}" is missing a valid id.`);
    }
    if (seen.has(id)) {
      throw new Error(`Duplicate tool id detected: "${id}".`);
    }
    if (RESERVED_ROOT_SEGMENTS.has(id)) {
      throw new Error(`Tool id "${id}" conflicts with a reserved root route.`);
    }
    seen.add(id);
  });
}

function renderNavbar() {
  return `<nav class="navbar" id="navbar">
    <div class="nav-inner">
      <a class="nav-logo" href="/" id="nav-logo">
        <div class="logo-icon">⚡</div>
        <div class="logo-text"><span>Tooliest</span></div>
      </a>

      <div class="nav-search">
        <span class="search-icon">🔍</span>
        <input type="text" id="search-input" placeholder="Search 80+ tools..." autocomplete="off">
        <span class="search-shortcut">Ctrl+K</span>
      </div>

      <div class="nav-links" id="nav-links">
        <a href="/" class="active">Home</a>
        <a href="/category/text">Text</a>
        <a href="/category/seo">SEO</a>
        <a href="/category/ai">AI Tools</a>
        <a href="/category/developer">Dev</a>
        <a href="${STATIC_PAGE_PATHS.about}">About</a>
        <a href="#" id="nav-install-btn" style="display:none;color:var(--accent-primary);font-weight:600;">📲 Install App</a>
        <button class="theme-toggle-btn" id="theme-toggle-btn" onclick="App.toggleTheme()" aria-label="Toggle theme">☀️</button>
        <button class="theme-toggle-btn" id="changelog-btn" onclick="App.showChangelog()" aria-label="What's new" title="What's New">🆕</button>
      </div>

      <button class="mobile-search-btn" id="mobile-search-btn" aria-label="Open search">🔍</button>
      <button class="mobile-menu-btn" id="mobile-menu-btn" aria-label="Open navigation menu">☰</button>
    </div>
  </nav>`;
}

function renderFooter() {
  return `<footer class="site-footer">
    <div class="footer-inner">
      <div class="footer-brand">
        <h3>⚡ <span>Tooliest</span></h3>
        <p>80+ free online tools for developers, designers, writers, and marketers. All tools run directly in your browser — no data is sent to any server. Fast, private, and always free.</p>
      </div>
      <div class="footer-col">
        <h4>Popular Tools</h4>
        <ul>
          <li><a href="${getToolPath('word-counter')}">Word Counter</a></li>
          <li><a href="${getToolPath('json-formatter')}">JSON Formatter</a></li>
          <li><a href="${getToolPath('color-picker')}">Color Picker</a></li>
          <li><a href="${getToolPath('password-security-suite')}">Password Generator</a></li>
          <li><a href="${getToolPath('image-compressor')}">Image Compressor</a></li>
          <li><a href="${getToolPath('css-minifier')}">CSS Minifier</a></li>
        </ul>
      </div>
      <div class="footer-col">
        <h4>AI Tools</h4>
        <ul>
          <li><a href="${getToolPath('ai-text-summarizer')}">Text Summarizer</a></li>
          <li><a href="${getToolPath('ai-paraphraser')}">AI Paraphraser</a></li>
          <li><a href="${getToolPath('ai-email-writer')}">Email Writer</a></li>
          <li><a href="${getToolPath('ai-blog-ideas')}">Blog Idea Generator</a></li>
          <li><a href="${getToolPath('hashtag-generator')}">Hashtag Generator</a></li>
          <li><a href="${getToolPath('palette-generator')}">Color Palette AI</a></li>
        </ul>
      </div>
      <div class="footer-col">
        <h4>Company</h4>
        <ul>
          <li><a href="${STATIC_PAGE_PATHS.about}">About Us</a></li>
          <li><a href="${STATIC_PAGE_PATHS.contact}">Contact</a></li>
          <li><a href="${STATIC_PAGE_PATHS.privacy}">Privacy Policy</a></li>
          <li><a href="${STATIC_PAGE_PATHS.terms}">Terms of Service</a></li>
          <li><a href="/sitemap.html">All Tools (Sitemap)</a></li>
        </ul>
      </div>
    </div>
    <div class="footer-bottom">
      <span>&copy; 2026 Tooliest.com — All tools are free and run in your browser.</span>
      <span>
        <a href="${STATIC_PAGE_PATHS.privacy}" style="color:inherit;opacity:0.7;">Privacy</a> &nbsp;·&nbsp;
        <a href="${STATIC_PAGE_PATHS.terms}" style="color:inherit;opacity:0.7;">Terms</a> &nbsp;·&nbsp;
        <a href="${STATIC_PAGE_PATHS.contact}" style="color:inherit;opacity:0.7;">Contact</a> &nbsp;·&nbsp;
        <button onclick="TooliestConsent && TooliestConsent.reset()" style="background:none;border:none;color:inherit;opacity:0.7;cursor:pointer;font-size:inherit;padding:0;font-family:inherit;">Manage Cookies</button>
      </span>
    </div>
  </footer>`;
}

function renderMobileSearchOverlay() {
  return `<div id="mobile-search-overlay" role="dialog" aria-label="Search tools" aria-modal="true">
    <div class="mobile-search-inner">
      <div class="mobile-search-header">
        <span style="font-size:1.1rem;font-weight:700;color:var(--text-primary)">Search Tools</span>
        <button id="mobile-search-close" aria-label="Close search" style="background:none;border:none;color:var(--text-secondary);font-size:1.5rem;cursor:pointer;padding:4px 8px;line-height:1;">✕</button>
      </div>
      <div style="position:relative;">
        <span style="position:absolute;left:14px;top:50%;transform:translateY(-50%);color:var(--text-tertiary);pointer-events:none;">🔍</span>
        <input type="text" id="mobile-search-input" placeholder="Search 80+ tools..." autocomplete="off"
          style="width:100%;padding:14px 16px 14px 44px;background:var(--bg-secondary);border:1px solid var(--border-color);border-radius:var(--radius-md);color:var(--text-primary);font-size:1rem;outline:none;font-family:var(--font-primary);"
          aria-label="Search tools">
      </div>
      <div id="mobile-search-results" style="margin-top:16px;max-height:60vh;overflow-y:auto;"></div>
    </div>
  </div>`;
}

function renderCookieBanner() {
  return `<div id="cookie-banner" role="dialog" aria-label="Cookie consent" aria-live="polite">
    <div class="cookie-inner">
      <div class="cookie-icon">🍪</div>
      <div class="cookie-text">
        <strong>We use browser storage and optional cookies to keep Tooliest free</strong>
        <p>Tooliest uses browser storage to remember your privacy choices on this device. If you accept non-essential tracking, Google may also use cookies for analytics and ads. <a href="${STATIC_PAGE_PATHS.privacy}">Learn more in our Privacy Policy.</a></p>
      </div>
      <div class="cookie-actions">
        <button id="cookie-reject-btn">Reject Non-Essential</button>
        <button id="cookie-accept-btn">Accept All Cookies ✓</button>
      </div>
    </div>
  </div>`;
}

function renderPageShell({ title, description, canonicalPath, structuredData, mainContent, keywords }) {
  const canonicalUrl = getAbsoluteUrl(canonicalPath);
  const pageKeywords = keywords || 'free online tools, browser tools, tooliest';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  ${LEGACY_TOOL_PATH_REDIRECT_INLINE}
  ${CONSENT_DEFAULTS_INLINE}
  ${GOOGLE_TAG_SNIPPET}
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeAttr(description)}">
  <meta name="keywords" content="${escapeAttr(pageKeywords)}">
  <meta name="author" content="Tooliest">
  <meta name="robots" content="index, follow">
  <meta name="theme-color" content="#8b5cf6">
  ${THEME_BOOTSTRAP_INLINE}
  <link rel="manifest" href="/manifest.json">
  <meta property="og:type" content="website">
  <meta property="og:title" content="${escapeAttr(title)}">
  <meta property="og:description" content="${escapeAttr(description)}">
  <meta property="og:url" content="${escapeAttr(canonicalUrl)}">
  <meta property="og:site_name" content="Tooliest">
  <meta property="og:image" content="https://tooliest.com/social-card.jpg">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:site" content="@tooliest">
  <meta name="twitter:title" content="${escapeAttr(title)}">
  <meta name="twitter:description" content="${escapeAttr(description)}">
  <meta name="twitter:image" content="https://tooliest.com/social-card.jpg">
  <link rel="canonical" href="${escapeAttr(canonicalUrl)}">
  <link rel="alternate" hreflang="en" href="${escapeAttr(canonicalUrl)}">
  <link rel="alternate" hreflang="x-default" href="https://tooliest.com/">
  <link rel="icon" href="${BRAND_ICON_PATHS.svg}" type="image/svg+xml">
  <link rel="icon" href="${BRAND_ICON_PATHS.png48}" sizes="48x48" type="image/png">
  <link rel="shortcut icon" href="${BRAND_ICON_PATHS.shortcut}" type="image/x-icon">
  <link rel="apple-touch-icon" href="${BRAND_ICON_PATHS.appleTouch}" sizes="180x180">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link rel="preload" as="style" href="${FONT_URL}">
  <link rel="stylesheet" href="${FONT_URL}">
  <link rel="stylesheet" href="${getVersionedAssetPath(CSS_BUNDLE_PATH)}">
  <script>window.__TOOLIEST_ASSET_VERSION='${ASSET_VERSION}';</script>
  <script src="${getVersionedAssetPath('/js/consent.js')}" defer></script>
  ${ADSENSE_SCRIPT_TAG}
  ${structuredData.map(schema => `<script type="application/ld+json">${JSON.stringify(schema)}</script>`).join('\n  ')}
</head>
<body>
  <a href="#main-content" class="skip-link">Skip to main content</a>
  ${renderNavbar()}
  ${mainContent}
  ${renderFooter()}
  ${renderMobileSearchOverlay()}
  ${renderCookieBanner()}
  <div id="toast-container"></div>
  <div id="route-announcer" role="status" aria-live="polite" aria-atomic="true" class="sr-only"></div>
  <script src="${getVersionedAssetPath('/bundle.min.js')}" defer></script>
</body>
</html>`;
}

function renderStaticToolCard(tool, categories) {
  const categoryName = categories.find(category => category.id === tool.category)?.name || '';
  return `<a class="tool-card tool-card-link" href="${getToolPath(tool.id)}" aria-label="Open ${escapeAttr(tool.name)} tool">
    <div class="tool-card-header">
      <div class="tool-card-icon">${tool.icon}</div>
      <div class="tool-card-info">
        <h3>${escapeHtml(tool.name)}</h3>
        <div style="display:flex; align-items:center; gap:8px;">
          <span class="tool-category-label">${escapeHtml(categoryName)}</span>
          ${tool.isAI ? '<div class="ai-badge">✨ AI</div>' : ''}
        </div>
      </div>
    </div>
    <p>${escapeHtml(tool.description)}</p>
    <div class="tool-card-tags">${tool.tags.slice(0, 3).map(tag => `<span class="tool-tag">${escapeHtml(tag)}</span>`).join('')}</div>
  </a>`;
}

function renderToolContentSections(tool, categories) {
  const categoryName = categories.find(category => category.id === tool.category)?.name || 'online tools';
  const fallbackExplain = `${tool.name} is part of Tooliest's ${categoryName.toLowerCase()} collection and runs directly in your browser, so your input stays on your device.`;
  const steps = [
    `Open the ${tool.name} workspace.`,
    'Type, paste, upload, or adjust the input fields as needed.',
    'Run the action or conversion to get instant results in your browser.',
    'Copy, download, or reuse the output without sending your data to a server.',
  ];

  const faqHtml = (tool.faq && tool.faq.length)
    ? `<section class="tool-content-section">
      <h2>Frequently Asked Questions</h2>
      <div class="faq-list">${tool.faq.map(item => `<details class="faq-item"><summary>${escapeHtml(item.q)}</summary><p>${escapeHtml(item.a)}</p></details>`).join('')}</div>
    </section>`
    : '';

  const whyUseHtml = tool.whyUse
    ? `<section class="tool-content-section">
      <h2>Why Use ${escapeHtml(tool.name)}?</h2>
      <ul>${tool.whyUse.map(reason => `<li>${escapeHtml(reason)}</li>`).join('')}</ul>
    </section>`
    : '';

  const whoUsesHtml = tool.whoUses
    ? `<section class="tool-content-section">
      <h2>Who Uses ${escapeHtml(tool.name)}?</h2>
      <p>${escapeHtml(tool.whoUses)}</p>
    </section>`
    : '';

  return `<div class="tool-content-sections">
    <section class="tool-content-section">
      <h2>What Is ${escapeHtml(tool.name)}?</h2>
      <p>${escapeHtml(tool.description)}</p>
      ${tool.education ? `<div class="tool-education-copy">${tool.education}</div>` : `<p>${escapeHtml(fallbackExplain)}</p>`}
    </section>
    <section class="tool-content-section">
      <h2>How To Use ${escapeHtml(tool.name)}</h2>
      <ol>${steps.map(step => `<li>${escapeHtml(step)}</li>`).join('')}</ol>
    </section>
    ${whyUseHtml}
    ${whoUsesHtml}
    ${faqHtml}
  </div>`;
}

function renderRelatedTools(tool, tools, categories) {
  const sameCategory = tools.filter(candidate => candidate.category === tool.category && candidate.id !== tool.id);
  const relatedByTag = tools.filter(candidate =>
    candidate.category !== tool.category &&
    candidate.id !== tool.id &&
    candidate.tags.some(tag => tool.tags.includes(tag))
  );
  const related = [...sameCategory.slice(0, 3), ...relatedByTag.slice(0, 2)].slice(0, 5);

  if (!related.length) return '';

  return `<div class="related-tools">
    <h3>You May Also Like</h3>
    <div class="related-tools-grid">${related.map(candidate => renderStaticToolCard(candidate, categories)).join('')}</div>
  </div>`;
}

function getRelatedCategories(categoryId, categories) {
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
  return relatedIds.map(id => categories.find(c => c.id === id)).filter(Boolean);
}

function renderCategoryPage(category, tools, categories) {
  const meta = getCategoryMeta(category, tools);
  const canonicalPath = getCategoryPath(category.id);
  const canonicalUrl = getAbsoluteUrl(canonicalPath);
  const relatedCats = getRelatedCategories(category.id, getRenderableCategories(categories));
  const categoryKeywords = meta.tools.slice(0, 5).map(t => t.name.toLowerCase()).join(', ') + `, ${category.name.toLowerCase()}, free online tools, tooliest`;

  const structuredData = [
    {
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      name: category.name,
      url: canonicalUrl,
      description: meta.description,
      dateModified: BUILD_DATE,
      isPartOf: { '@type': 'WebSite', url: 'https://tooliest.com/' },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://tooliest.com/' },
        { '@type': 'ListItem', position: 2, name: category.name, item: canonicalUrl },
      ],
    },
    {
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      name: `${category.name} on Tooliest`,
      itemListElement: meta.tools.map((tool, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        url: getAbsoluteUrl(getToolPath(tool.id)),
        name: tool.name,
      })),
    },
  ];

  const relatedCatsHtml = relatedCats.length
    ? `<div class="tool-content-sections" style="margin-top:32px">
        <section class="tool-content-section">
          <h2>Related Tool Categories</h2>
          <p>Looking for more? Explore these related categories on Tooliest:</p>
          <ul>${relatedCats.map(rc => `<li><a href="${getCategoryPath(rc.id)}">${rc.icon} ${escapeHtml(rc.name)}</a> — ${getCategoryTools(tools, rc.id).length} free tools</li>`).join('')}</ul>
        </section>
        <section class="tool-content-section">
          <h2>What Are ${escapeHtml(category.name)}?</h2>
          <p>Tooliest's ${category.name.toLowerCase()} are browser-based utilities that process everything locally on your device. No files are uploaded, no accounts are needed, and every tool is completely free. Whether you're a developer, designer, writer, or marketer, these tools help you work faster without compromising your privacy.</p>
        </section>
      </div>`
    : '';

  const mainContent = `<main class="main-content" id="main-content">
    <section class="tool-page">
      <div class="tool-page-header">
        <div class="tool-breadcrumb">
          <a href="/">Home</a>
          <span class="separator">›</span>
          <span>${escapeHtml(category.name)}</span>
        </div>
        <h1 style="margin:0">${category.icon} ${escapeHtml(category.name)}</h1>
        <p>${escapeHtml(meta.description)}</p>
        <p style="margin-top:12px;color:var(--text-tertiary);font-size:0.92rem">${escapeHtml(meta.intro)}</p>
      </div>
      <section class="tools-section" style="padding:0">
        <div class="tools-grid">${meta.tools.map((tool) => renderStaticToolCard(tool, categories)).join('')}</div>
      </section>
      ${relatedCatsHtml}
    </section>
  </main>`;

  return renderPageShell({
    title: meta.title,
    description: meta.description,
    canonicalPath,
    structuredData,
    mainContent,
    keywords: categoryKeywords,
  });
}

function renderToolPage(tool, tools, categories) {
  const categoryName = categories.find(category => category.id === tool.category)?.name || tool.category;
  const canonicalPath = getToolPath(tool.id);
  const canonicalUrl = getAbsoluteUrl(canonicalPath);
  const description = tool.meta?.desc || tool.description;
  const plainEducation = stripHtml(tool.education || '');
  const toolKeywords = [...tool.tags, categoryName.toLowerCase(), 'free online tool', 'browser-based', 'tooliest'].join(', ');

  const structuredData = [
    {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: 'Tooliest',
      url: 'https://tooliest.com',
      logo: 'https://tooliest.com/icon-512.png',
      description: 'A free, browser-based platform offering 80+ online utility tools for developers, designers, writers, and marketers.',
      foundingDate: '2026',
      sameAs: ['https://twitter.com/tooliest'],
      contactPoint: {
        '@type': 'ContactPoint',
        contactType: 'customer support',
        url: getAbsoluteUrl(STATIC_PAGE_PATHS.contact),
      },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'WebApplication',
      name: tool.name,
      url: canonicalUrl,
      description,
      applicationCategory: 'UtilityApplication',
      operatingSystem: 'Any',
      dateModified: BUILD_DATE,
      browserRequirements: 'Requires a JavaScript-enabled modern web browser',
      featureList: tool.tags.join(', '),
      softwareVersion: '2.5',
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'USD',
      },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://tooliest.com/' },
        { '@type': 'ListItem', position: 2, name: categoryName, item: `https://tooliest.com${getCategoryPath(tool.category)}` },
        { '@type': 'ListItem', position: 3, name: tool.name, item: canonicalUrl },
      ],
    },
    {
      '@context': 'https://schema.org',
      '@type': 'HowTo',
      name: `How to use ${tool.name} online`,
      description,
      step: [
        { '@type': 'HowToStep', position: 1, name: 'Open the tool', text: `Open ${canonicalUrl} in your browser.` },
        { '@type': 'HowToStep', position: 2, name: 'Enter your input', text: 'Type, paste, or upload your content into the tool workspace.' },
        { '@type': 'HowToStep', position: 3, name: 'Get results', text: 'Run the tool to process your input instantly.' },
        { '@type': 'HowToStep', position: 4, name: 'Copy or download', text: 'Copy the result to the clipboard or download the output file.' },
      ],
      tool: { '@type': 'HowToTool', name: 'Web Browser' },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      name: tool.name,
      speakable: {
        '@type': 'SpeakableSpecification',
        cssSelector: ['.tool-page-header p', '.tool-content-section'],
      },
      url: canonicalUrl,
    },
  ];

  // Add FAQ schema if tool has FAQ data
  if (tool.faq && tool.faq.length) {
    structuredData.push({
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: tool.faq.map(item => ({
        '@type': 'Question',
        name: item.q,
        acceptedAnswer: {
          '@type': 'Answer',
          text: item.a,
        },
      })),
    });
  }

  const mainContent = `<main class="main-content" id="main-content">
    <div class="tool-page">
      <div class="tool-page-header">
        <div class="tool-breadcrumb">
          <a href="/">Home</a>
          <span class="separator">›</span>
          <a href="${getCategoryPath(tool.category)}">${escapeHtml(categoryName)}</a>
          <span class="separator">›</span>
          <span>${escapeHtml(tool.name)}</span>
        </div>
        <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px">
          <h1 style="margin:0"><span role="img" aria-label="${escapeAttr(tool.name)} icon">${tool.icon}</span> ${escapeHtml(tool.name)} ${tool.isAI ? '<span class="ai-badge" style="font-size:0.5em;vertical-align:middle">✨ AI-Powered</span>' : ''}</h1>
          <a class="btn btn-secondary btn-sm" href="${canonicalPath}" aria-label="Open the interactive ${escapeAttr(tool.name)} tool">Open Interactive Tool</a>
        </div>
        <p>${escapeHtml(tool.description)}</p>
        ${plainEducation ? `<p style="margin-top:12px;color:var(--text-tertiary);font-size:0.92rem">${escapeHtml(plainEducation)}</p>` : ''}
      </div>
      <div class="tool-workspace">
        <div class="tool-workspace-body">
          <p style="color:var(--text-secondary);margin-bottom:8px">Loading the interactive ${escapeHtml(tool.name)} tool…</p>
          <p style="color:var(--text-tertiary);font-size:0.9rem">If JavaScript is enabled, Tooliest will load the live browser-based tool automatically.</p>
        </div>
      </div>
      ${renderToolContentSections(tool, categories)}
      ${renderRelatedTools(tool, tools, categories)}
    </div>
  </main>`;

  return renderPageShell({
    title: tool.meta?.title || `${tool.name} | Tooliest`,
    description,
    canonicalPath,
    structuredData,
    mainContent,
    keywords: toolKeywords,
  });
}

async function bundleJavascript() {
  console.log('Bundling JavaScript...');
  const combinedCode = filesToBundle
    .filter(file => fs.existsSync(file))
    .map(file => fs.readFileSync(file, 'utf8'))
    .join('\n;');

  const minified = await minify(combinedCode, {
    format: { comments: false },
  });

  fs.writeFileSync('bundle.min.js', minified.code);
  console.log(`Created bundle.min.js (${(minified.code.length / 1024).toFixed(2)} KB)`);
}

function writeToolPages(tools, categories) {
  console.log(`Generating ${tools.length} static tool pages...`);
  tools.forEach((tool) => {
    const outputDir = path.join(__dirname, tool.id);
    fs.mkdirSync(outputDir, { recursive: true });
    fs.writeFileSync(path.join(outputDir, 'index.html'), renderToolPage(tool, tools, categories));
  });
}

function renderLegacyToolRedirectPage(toolId) {
  const targetPath = getToolPath(toolId);
  const targetUrl = getAbsoluteUrl(targetPath);
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Redirecting...</title>
  <meta name="robots" content="noindex, follow">
  <link rel="canonical" href="${escapeAttr(targetUrl)}">
  <meta http-equiv="refresh" content="0; url=${escapeAttr(targetUrl)}">
  <script>
    (function () {
      var target = ${JSON.stringify(targetPath)};
      var search = window.location.search || '';
      var hash = window.location.hash || '';
      window.location.replace(target + search + hash);
    })();
  </script>
</head>
<body>
  <p>Redirecting to <a href="${escapeAttr(targetPath)}">${escapeHtml(targetPath)}</a>...</p>
</body>
</html>`;
}

function writeLegacyToolPages(tools) {
  console.log('Generating legacy /tool/* redirect pages...');
  tools.forEach((tool) => {
    const outputDir = path.join(__dirname, 'tool', tool.id);
    fs.mkdirSync(outputDir, { recursive: true });
    fs.writeFileSync(path.join(outputDir, 'index.html'), renderLegacyToolRedirectPage(tool.id));
  });
}

function writeCategoryPages(tools, categories) {
  const renderableCategories = getRenderableCategories(categories);
  console.log(`Generating ${renderableCategories.length} static category pages...`);
  renderableCategories.forEach((category) => {
    const outputDir = path.join(__dirname, 'category', category.id);
    fs.mkdirSync(outputDir, { recursive: true });
    fs.writeFileSync(path.join(outputDir, 'index.html'), renderCategoryPage(category, tools, categories));
  });
}

function renderRedirectsFile(tools, categories) {
  return [
    '# Legacy tool URLs',
    '/tool/*    /:splat    301!',
    '',
    '# Static files and directories are served directly by the host.',
    '# Everything else falls back to the SPA shell.',
    '/*    /index.html    200',
    '',
  ].join('\n');
}

function renderHeadersFile(tools, categories) {
  const htmlPageCacheRule = '  Cache-Control: public, max-age=3600, stale-while-revalidate=86400';
  const cleanStaticPageHeaders = Object.values(STATIC_PAGE_PATHS)
    .flatMap((cleanPath) => [cleanPath, htmlPageCacheRule, '', `${cleanPath}.html`, htmlPageCacheRule, '']);
  const categoryHeaders = getRenderableCategories(categories)
    .flatMap((category) => [getCategoryPath(category.id), htmlPageCacheRule, '']);
  const toolHeaders = tools
    .flatMap((tool) => [getToolPath(tool.id), htmlPageCacheRule, '']);

  return [
    '/*',
    '  # Security Headers - applied to all routes',
    '  X-Frame-Options: SAMEORIGIN',
    '  X-Content-Type-Options: nosniff',
    '  X-XSS-Protection: 1; mode=block',
    '  Referrer-Policy: strict-origin-when-cross-origin',
    '  Permissions-Policy: geolocation=(), microphone=(), camera=()',
    '',
    '  # Content Security Policy',
    "  Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline' https://pagead2.googlesyndication.com https://www.googletagmanager.com https://partner.googleadservices.com https://tpc.googlesyndication.com https://esm.sh https://unpkg.com https://cdn.jsdelivr.net; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https:; frame-src 'self' https://www.googletagmanager.com https://googleads.g.doubleclick.net https://tpc.googlesyndication.com; connect-src 'self' https://esm.sh https://unpkg.com https://cdn.jsdelivr.net",
    '',
    '# Static assets - aggressive caching',
    '/css/*',
    '  Cache-Control: public, max-age=31536000, immutable',
    '',
    '/js/*',
    '  Cache-Control: public, max-age=31536000, immutable',
    '',
    '/bundle.min.js',
    '  Cache-Control: public, max-age=31536000, immutable',
    '',
    '/favicon*',
    '  Cache-Control: public, max-age=31536000, immutable',
    '',
    '/social-card*',
    '  Cache-Control: public, max-age=2592000',
    '',
    '/manifest.json',
    '  Cache-Control: public, max-age=86400',
    '',
    '# HTML pages',
    '/index.html',
    '  Cache-Control: public, max-age=0, must-revalidate',
    '',
    ...cleanStaticPageHeaders,
    ...categoryHeaders,
    ...toolHeaders,
    '/tool/*',
    htmlPageCacheRule,
    '',
    '/sitemap.html',
    htmlPageCacheRule,
    '',
    '/sitemap.xml',
    '  Cache-Control: public, max-age=3600',
    '  Content-Type: application/xml',
    '',
    '/robots.txt',
    '  Cache-Control: public, max-age=86400',
    '',
  ].join('\n');
}

function writeRoutingFiles(tools, categories) {
  fs.writeFileSync(path.join(__dirname, '_redirects'), renderRedirectsFile(tools, categories));
  fs.writeFileSync(path.join(__dirname, '_headers'), renderHeadersFile(tools, categories));
}

function writeCleanStaticPages() {
  Object.entries(STATIC_PAGE_SOURCE_FILES).forEach(([key, sourceFile]) => {
    const cleanPath = STATIC_PAGE_PATHS[key];
    const outputDir = path.join(__dirname, cleanPath.replace(/^\/+/, ''));
    fs.mkdirSync(outputDir, { recursive: true });
    fs.copyFileSync(
      path.join(__dirname, sourceFile),
      path.join(outputDir, 'index.html')
    );
  });
}

function writeSitemap(tools, categories) {
  console.log('Generating sitemap.xml...');
  const staticPages = [
    { loc: 'https://tooliest.com/', priority: '1.0', changefreq: 'weekly' },
    { loc: getAbsoluteUrl(STATIC_PAGE_PATHS.about), priority: '0.8', changefreq: 'monthly' },
    { loc: getAbsoluteUrl(STATIC_PAGE_PATHS.contact), priority: '0.7', changefreq: 'monthly' },
    { loc: getAbsoluteUrl(STATIC_PAGE_PATHS.privacy), priority: '0.6', changefreq: 'monthly' },
    { loc: getAbsoluteUrl(STATIC_PAGE_PATHS.terms), priority: '0.5', changefreq: 'monthly' },
    { loc: getAbsoluteUrl('/sitemap.html'), priority: '0.7', changefreq: 'monthly' },
  ];

  const categoryPages = getRenderableCategories(categories).map((category) => ({
    loc: getAbsoluteUrl(getCategoryPath(category.id)),
    priority: '0.8',
    changefreq: 'monthly',
  }));

  const toolPages = tools.map((tool) => ({
    loc: getAbsoluteUrl(getToolPath(tool.id)),
    priority: '0.9',
    changefreq: 'monthly',
  }));

  const entries = [...staticPages, ...categoryPages, ...toolPages];
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries.map((entry) => `  <url>\n    <loc>${entry.loc}</loc>\n    <lastmod>${BUILD_DATE}</lastmod>\n    <changefreq>${entry.changefreq}</changefreq>\n    <priority>${entry.priority}</priority>\n  </url>`).join('\n')}\n</urlset>\n`;

  fs.writeFileSync(path.join(__dirname, 'sitemap.xml'), sitemap);
}

function writeHtmlSitemap(tools, categories) {
  console.log('Generating HTML sitemap page...');
  const renderableCategories = getRenderableCategories(categories);
  const categoryBlocks = renderableCategories.map(cat => {
    const catTools = getCategoryTools(tools, cat.id);
    return `<div class="sitemap-category">
      <h2><a href="${getCategoryPath(cat.id)}">${cat.icon} ${escapeHtml(cat.name)}</a> <span style="color:var(--text-tertiary);font-size:0.85rem;font-weight:400">(${catTools.length} tools)</span></h2>
      <ul>${catTools.map(t => `<li><a href="${getToolPath(t.id)}">${t.icon} ${escapeHtml(t.name)}</a> — ${escapeHtml(t.description.slice(0, 80))}</li>`).join('')}</ul>
    </div>`;
  }).join('');

  const mainContent = `<main class="main-content" id="main-content">
    <div class="tool-page">
      <div class="tool-page-header">
        <div class="tool-breadcrumb">
          <a href="/">Home</a>
          <span class="separator">›</span>
          <span>All Tools</span>
        </div>
        <h1 style="margin:0">🗺️ All Tooliest Tools</h1>
        <p>Browse every free online tool on Tooliest, organized by category. ${tools.length} tools across ${renderableCategories.length} categories — all free, all browser-based.</p>
      </div>
      <div class="tool-content-sections">
        ${categoryBlocks}
      </div>
    </div>
  </main>`;

  const structuredData = [
    {
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      name: 'All Tooliest Tools — HTML Sitemap',
      url: getAbsoluteUrl('/sitemap.html'),
      description: `Browse all ${tools.length} free online tools on Tooliest organized by category.`,
      dateModified: BUILD_DATE,
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://tooliest.com/' },
        { '@type': 'ListItem', position: 2, name: 'All Tools', item: getAbsoluteUrl('/sitemap.html') },
      ],
    },
  ];

  const html = renderPageShell({
    title: `All ${tools.length}+ Free Online Tools — Tooliest Sitemap`,
    description: `Browse every free online tool on Tooliest. ${tools.length} browser-based tools across ${renderableCategories.length} categories.`,
    canonicalPath: '/sitemap.html',
    structuredData,
    mainContent,
    keywords: 'all tools, free online tools, tooliest sitemap, tool directory, browser tools',
  });

  fs.writeFileSync(path.join(__dirname, 'sitemap.html'), html);
}

function writeHomePage(tools, categories) {
  console.log('Generating pre-rendered index.html...');
  const renderableCategories = getRenderableCategories(categories);
  const featuredTools = tools.slice(0, 18);

  const categoryTabsHtml = renderableCategories.map(cat =>
    `<a href="${getCategoryPath(cat.id)}" class="category-tab">${cat.icon} ${escapeHtml(cat.name)} <span class="tab-count">${cat.count}</span></a>`
  ).join('');

  const toolCardsHtml = featuredTools.map(tool => renderStaticToolCard(tool, categories)).join('');

  const structuredData = [
    {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: 'Tooliest',
      url: 'https://tooliest.com',
      potentialAction: {
        '@type': 'SearchAction',
        target: {
          '@type': 'EntryPoint',
          urlTemplate: 'https://tooliest.com/search/{search_term_string}',
        },
        'query-input': 'required name=search_term_string',
      },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'WebApplication',
      name: 'Tooliest',
      url: 'https://tooliest.com',
      description: `${tools.length}+ free online tools for developers, designers, writers, and marketers. AI-powered features included.`,
      dateModified: BUILD_DATE,
      applicationCategory: 'UtilityApplication',
      operatingSystem: 'Any',
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: 'Tooliest',
      url: 'https://tooliest.com',
      logo: 'https://tooliest.com/icon-512.png',
      description: 'A free, browser-based platform offering 80+ online utility tools for developers, designers, writers, and marketers.',
      foundingDate: '2026',
      sameAs: ['https://twitter.com/tooliest'],
      contactPoint: {
        '@type': 'ContactPoint',
        contactType: 'customer support',
        url: getAbsoluteUrl(STATIC_PAGE_PATHS.contact),
      },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      name: 'Tooliest — Free Online Tools',
      speakable: {
        '@type': 'SpeakableSpecification',
        cssSelector: ['.hero h1', '.hero p', '.footer-brand p'],
      },
      url: 'https://tooliest.com',
    },
    {
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      name: 'Popular Tools on Tooliest',
      itemListElement: featuredTools.slice(0, 10).map((tool, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        url: getAbsoluteUrl(getToolPath(tool.id)),
        name: tool.name,
      })),
    },
  ];

  const mainContent = `<main class="main-content" id="main-content">
    <section class="hero">
      <div class="hero-badge"><span class="pulse-dot"></span> Free &amp; No Signup Required</div>
      <h1>Every Tool You Need.<br><span class="gradient-text">Zero Installs.</span></h1>
      <p>${tools.length}+ powerful online tools for developers, designers, writers, and marketers. All free, all instant, all AI-enhanced.</p>
      <div class="hero-stats">
        <div class="hero-stat"><div class="stat-value">${tools.length}+</div><div class="stat-label">Free Tools</div></div>
        <div class="hero-stat"><div class="stat-value">${renderableCategories.length}</div><div class="stat-label">Categories</div></div>
        <div class="hero-stat"><div class="stat-value">0</div><div class="stat-label">Signups Needed</div></div>
      </div>
    </section>
    <section class="categories-section"><div class="category-tabs" id="category-tabs">${categoryTabsHtml}</div></section>
    <section class="tools-section"><div class="tools-grid" id="tools-grid">${toolCardsHtml}</div></section>
  </main>`;

  const html = renderPageShell({
    title: `Tooliest — ${tools.length}+ Free Online Tools Powered by AI | tooliest.com`,
    description: `Access ${tools.length}+ free online tools for text, SEO, CSS, colors, images, JSON, encoding, math, and more. No signup required. AI-powered features included.`,
    canonicalPath: '/',
    structuredData,
    mainContent,
    keywords: 'free online tools, text tools, SEO tools, CSS generator, color picker, JSON formatter, image compressor, AI tools, developer tools, converter tools, tooliest',
  });

  fs.writeFileSync(path.join(__dirname, 'index.html'), html);
}

function minifyCSSFile() {
  const cssPath = path.join(__dirname, 'css', 'styles.css');
  const raw = fs.readFileSync(cssPath, 'utf8');
  const minified = minifyCSS(raw);
  const minPath = path.join(__dirname, 'css', 'styles3.min.css');
  fs.writeFileSync(minPath, minified);
  const savings = ((1 - minified.length / raw.length) * 100).toFixed(1);
  console.log(`Minified CSS: ${(raw.length / 1024).toFixed(1)} KB → ${(minified.length / 1024).toFixed(1)} KB (${savings}% smaller)`);
}

async function build() {
  const { tools, categories } = readTools();
  validateToolRoutes(tools);
  await bundleJavascript();
  minifyCSSFile();
  writeRoutingFiles(tools, categories);
  writeCleanStaticPages();
  writeHomePage(tools, categories);
  writeToolPages(tools, categories);
  writeLegacyToolPages(tools);
  writeCategoryPages(tools, categories);
  writeHtmlSitemap(tools, categories);
  writeSitemap(tools, categories);
  console.log('Build complete.');
}

build().catch((error) => {
  console.error('Build failed:', error);
  process.exitCode = 1;
});
