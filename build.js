const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { minify } = require('terser');

const SITE_URL = 'https://tooliest.com';
const FONT_URL = 'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;600&display=swap';
const BUILD_DATE = new Date().toISOString().split('T')[0];

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

function getToolPath(toolId) {
  return `/tool/${encodeURIComponent(toolId)}/`;
}

function getCategoryPath(categoryId) {
  return categoryId && categoryId !== 'all'
    ? `/category/${encodeURIComponent(categoryId)}`
    : '/';
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
        <a href="/about.html">About</a>
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
          <li><a href="/tool/word-counter/">Word Counter</a></li>
          <li><a href="/tool/json-formatter/">JSON Formatter</a></li>
          <li><a href="/tool/color-picker/">Color Picker</a></li>
          <li><a href="/tool/password-security-suite/">Password Generator</a></li>
          <li><a href="/tool/image-compressor/">Image Compressor</a></li>
          <li><a href="/tool/css-minifier/">CSS Minifier</a></li>
        </ul>
      </div>
      <div class="footer-col">
        <h4>AI Tools</h4>
        <ul>
          <li><a href="/tool/ai-text-summarizer/">Text Summarizer</a></li>
          <li><a href="/tool/ai-paraphraser/">AI Paraphraser</a></li>
          <li><a href="/tool/ai-email-writer/">Email Writer</a></li>
          <li><a href="/tool/ai-blog-ideas/">Blog Idea Generator</a></li>
          <li><a href="/tool/hashtag-generator/">Hashtag Generator</a></li>
          <li><a href="/tool/palette-generator/">Color Palette AI</a></li>
        </ul>
      </div>
      <div class="footer-col">
        <h4>Company</h4>
        <ul>
          <li><a href="/about.html">About Us</a></li>
          <li><a href="/contact.html">Contact</a></li>
          <li><a href="/privacy.html">Privacy Policy</a></li>
          <li><a href="/terms.html">Terms of Service</a></li>
        </ul>
      </div>
    </div>
    <div class="footer-bottom">
      <span>&copy; 2026 Tooliest.com — All tools are free and run in your browser.</span>
      <span>
        <a href="/privacy.html" style="color:inherit;opacity:0.7;">Privacy</a> &nbsp;·&nbsp;
        <a href="/terms.html" style="color:inherit;opacity:0.7;">Terms</a> &nbsp;·&nbsp;
        <a href="/contact.html" style="color:inherit;opacity:0.7;">Contact</a> &nbsp;·&nbsp;
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
        <strong>We use cookies to keep Tooliest free</strong>
        <p>We use cookies for analytics and to show ads via Google AdSense — this is what keeps all our tools free for everyone. You can accept all cookies or reject non-essential ones. <a href="/privacy.html">Learn more in our Privacy Policy.</a></p>
      </div>
      <div class="cookie-actions">
        <button id="cookie-reject-btn">Reject Non-Essential</button>
        <button id="cookie-accept-btn">Accept All Cookies ✓</button>
      </div>
    </div>
  </div>`;
}

function renderPageShell({ title, description, canonicalPath, structuredData, mainContent }) {
  const canonicalUrl = getAbsoluteUrl(canonicalPath);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeAttr(description)}">
  <meta name="keywords" content="free online tools, text tools, SEO tools, CSS generator, color picker, JSON formatter, image compressor, AI tools, developer tools, converter tools">
  <meta name="author" content="Tooliest">
  <meta name="robots" content="index, follow">
  <meta name="theme-color" content="#8b5cf6">
  <link rel="manifest" href="/manifest.json">
  <meta property="og:type" content="website">
  <meta property="og:title" content="${escapeAttr(title)}">
  <meta property="og:description" content="${escapeAttr(description)}">
  <meta property="og:url" content="${escapeAttr(canonicalUrl)}">
  <meta property="og:site_name" content="Tooliest">
  <meta property="og:image" content="https://tooliest.com/social-card.png">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:site" content="@tooliest">
  <meta name="twitter:title" content="${escapeAttr(title)}">
  <meta name="twitter:description" content="${escapeAttr(description)}">
  <meta name="twitter:image" content="https://tooliest.com/social-card.png">
  <link rel="canonical" href="${escapeAttr(canonicalUrl)}">
  <link rel="alternate" hreflang="en" href="https://tooliest.com/">
  <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>⚡</text></svg>">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link rel="preload" as="style" href="${FONT_URL}">
  <link rel="stylesheet" href="${FONT_URL}">
  <link rel="stylesheet" href="/css/styles.css">
  <script src="/js/consent.js" defer></script>
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
  <script src="/bundle.min.js"></script>
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

function renderToolPage(tool, tools, categories) {
  const categoryName = categories.find(category => category.id === tool.category)?.name || tool.category;
  const canonicalPath = getToolPath(tool.id);
  const canonicalUrl = getAbsoluteUrl(canonicalPath);
  const description = tool.meta?.desc || tool.description;
  const plainEducation = stripHtml(tool.education || '');

  const structuredData = [
    {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: 'Tooliest',
      url: 'https://tooliest.com',
      logo: 'https://tooliest.com/icon-512.png',
      description: 'A free, browser-based platform offering 80+ online utility tools for developers, designers, writers, and marketers.',
      contactPoint: {
        '@type': 'ContactPoint',
        contactType: 'customer support',
        url: 'https://tooliest.com/contact.html',
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
  ];

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
          <h1 style="margin:0">${tool.icon} ${escapeHtml(tool.name)} ${tool.isAI ? '<span class="ai-badge" style="font-size:0.5em;vertical-align:middle">✨ AI-Powered</span>' : ''}</h1>
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
    const outputDir = path.join(__dirname, 'tool', tool.id);
    fs.mkdirSync(outputDir, { recursive: true });
    fs.writeFileSync(path.join(outputDir, 'index.html'), renderToolPage(tool, tools, categories));
  });
}

function writeSitemap(tools) {
  console.log('Generating sitemap.xml...');
  const staticPages = [
    { loc: 'https://tooliest.com/', priority: '1.0', changefreq: 'weekly' },
    { loc: 'https://tooliest.com/about.html', priority: '0.8', changefreq: 'monthly' },
    { loc: 'https://tooliest.com/contact.html', priority: '0.7', changefreq: 'monthly' },
    { loc: 'https://tooliest.com/privacy.html', priority: '0.6', changefreq: 'monthly' },
    { loc: 'https://tooliest.com/terms.html', priority: '0.5', changefreq: 'monthly' },
  ];

  const toolPages = tools.map((tool) => ({
    loc: getAbsoluteUrl(getToolPath(tool.id)),
    priority: '0.9',
    changefreq: 'monthly',
  }));

  const entries = [...staticPages, ...toolPages];
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries.map((entry) => `  <url>\n    <loc>${entry.loc}</loc>\n    <lastmod>${BUILD_DATE}</lastmod>\n    <changefreq>${entry.changefreq}</changefreq>\n    <priority>${entry.priority}</priority>\n  </url>`).join('\n')}\n</urlset>\n`;

  fs.writeFileSync(path.join(__dirname, 'sitemap.xml'), sitemap);
}

async function build() {
  const { tools, categories } = readTools();
  await bundleJavascript();
  writeToolPages(tools, categories);
  writeSitemap(tools);
  console.log('Build complete.');
}

build().catch((error) => {
  console.error('Build failed:', error);
  process.exitCode = 1;
});
