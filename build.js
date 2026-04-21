const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { minify } = require('terser');
const crypto = require('crypto');

function getBuildEnv(name, fallback) {
  const value = process.env[name];
  return typeof value === 'string' && value.trim() ? value.trim() : fallback;
}

const SITE_URL = 'https://tooliest.com';
const FONT_URL = 'https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&family=JetBrains+Mono:wght@400&display=swap&subset=latin';
const BUILD_DATE = new Date().toISOString().split('T')[0];
const ASSET_VERSION = '20260420v27';
const CSS_BUNDLE_PATH = '/css/styles3.min.css';
const BUNDLE_OUTPUT_FILE = 'bundle.min.js';
const INDEXNOW_KEY = getBuildEnv('INDEXNOW_KEY', 'tooliest-indexnow-20260420');
const INDEXNOW_KEY_LOCATION_PATH = '/indexnow-key.txt';
const INDEXNOW_VERIFICATION_PATH = `/${INDEXNOW_KEY}.txt`;
const GOOGLE_TAG_ID = getBuildEnv('GOOGLE_TAG_ID', 'AW-18068794869');
const GOOGLE_TAG_SNIPPET = `<script>(function(){var loaded=false;function boot(){if(loaded)return;loaded=true;var s=document.createElement('script');s.src='https://www.googletagmanager.com/gtag/js?id=${GOOGLE_TAG_ID}';s.async=true;document.head.appendChild(s);window.dataLayer=window.dataLayer||[];window.gtag=window.gtag||function(){window.dataLayer.push(arguments)};window.gtag('js',new Date());window.gtag('config','${GOOGLE_TAG_ID}');}window.addEventListener('load',function(){if('requestIdleCallback' in window){requestIdleCallback(boot,{timeout:4000});return;}setTimeout(boot,2500);});})();</script>`;
const ADSENSE_CLIENT = getBuildEnv('ADSENSE_CLIENT', 'ca-pub-3155132462698504');
const ADSENSE_SCRIPT_URL = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT}`;
const CONSENT_DEFAULTS_INLINE = `<script>window.dataLayer=window.dataLayer||[];window.gtag=window.gtag||function(){window.dataLayer.push(arguments)};window.gtag('consent','default',{ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied',analytics_storage:'denied',wait_for_update:2000});</script>`;
const LEGACY_TOOL_PATH_REDIRECT_INLINE = `<script>(function(){var match=window.location.pathname.match(/^\\/tool\\/([^/]+)\\/?$/);if(!match)return;var target='/' + match[1] + (window.location.search||'') + (window.location.hash||'');window.location.replace(target);})();</script>`;
const ADSENSE_SCRIPT_TAG = `<script>(function(){var loaded=false;function boot(){if(loaded)return;loaded=true;var s=document.createElement('script');s.src='${ADSENSE_SCRIPT_URL}';s.async=true;s.crossOrigin='anonymous';document.head.appendChild(s);}window.addEventListener('load',function(){if('requestIdleCallback' in window){requestIdleCallback(boot,{timeout:4500});return;}setTimeout(boot,3200);});})();</script>`;
const THEME_BOOTSTRAP_INLINE = `<script>try{const savedTheme=localStorage.getItem('tooliest_theme');if(savedTheme==='light'||savedTheme==='dark'){document.documentElement.setAttribute('data-theme',savedTheme);}}catch(_){}</script>`;
const CRITICAL_CSS = `:root{--bg-primary:#0a0a0f;--bg-secondary:#12121a;--bg-tertiary:#1a1a2e;--bg-card:rgba(26,26,46,.6);--bg-glass:rgba(255,255,255,.03);--bg-glass-hover:rgba(255,255,255,.06);--text-primary:#e8e8f0;--text-secondary:#a0a0b8;--text-tertiary:#6b6b80;--accent-primary:#8b5cf6;--accent-secondary:#06b6d4;--accent-success:#10b981;--gradient-primary:linear-gradient(135deg,#8b5cf6,#06b6d4);--border-color:rgba(255,255,255,.06);--border-accent:rgba(139,92,246,.3);--font-primary:'Inter',-apple-system,BlinkMacSystemFont,sans-serif;--font-mono:'JetBrains Mono','Fira Code',monospace;--max-width:1400px;--nav-height:72px;--radius-md:12px;--radius-lg:16px;--radius-full:9999px;--safe-top:env(safe-area-inset-top,0px);--safe-bottom:env(safe-area-inset-bottom,0px);--safe-left:env(safe-area-inset-left,0px);--safe-right:env(safe-area-inset-right,0px);--touch-target-min:44px;--z-nav:1000}[data-theme=light]{--bg-primary:#f8f9fc;--bg-secondary:#fff;--bg-tertiary:#e8eaf0;--bg-card:rgba(255,255,255,.85);--bg-glass:rgba(0,0,0,.02);--bg-glass-hover:rgba(0,0,0,.04);--text-primary:#1a1a2e;--text-secondary:#4a4a6a;--text-tertiary:#6b6b84;--border-color:rgba(0,0,0,.08)}html{font-size:16px;-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale;overflow-x:hidden;overscroll-behavior-y:contain}body{margin:0;font-family:var(--font-primary);background:var(--bg-primary);color:var(--text-primary);line-height:1.6;min-height:100vh}a{color:var(--accent-primary);text-decoration:none}img{display:block;max-width:100%}.skip-link{position:absolute;left:-9999px;top:auto;width:1px;height:1px;overflow:hidden}.skip-link:focus{left:16px;top:16px;width:auto;height:auto;padding:10px 14px;border-radius:999px;background:var(--bg-secondary);color:var(--text-primary);z-index:2000}.navbar{position:fixed;top:0;left:0;right:0;min-height:var(--nav-height);height:var(--nav-height);display:flex;align-items:center;padding:0 max(24px,calc(24px + var(--safe-left))) 0 max(24px,calc(24px + var(--safe-right)));background:rgba(10,10,15,.88);backdrop-filter:blur(18px) saturate(180%);-webkit-backdrop-filter:blur(18px) saturate(180%);border-bottom:1px solid var(--border-color);z-index:var(--z-nav)}[data-theme=light] .navbar{background:rgba(255,255,255,.9)}.nav-inner{max-width:var(--max-width);width:100%;margin:0 auto;display:flex;align-items:center;justify-content:space-between;gap:24px}.nav-logo{display:flex;align-items:center;gap:10px;font-size:1.5rem;font-weight:800;color:var(--text-primary);flex-shrink:0}.nav-logo .logo-icon{display:flex;align-items:center;justify-content:center;width:36px;height:36px;border-radius:12px;background:var(--gradient-primary)}.nav-logo .logo-text span,.hero h1 .gradient-text{-webkit-background-clip:text;-webkit-text-fill-color:transparent;background:var(--gradient-primary);background-clip:text}.nav-search{flex:1;max-width:480px;position:relative}.nav-search input{width:100%;height:42px;padding:0 16px 0 44px;border:1px solid var(--border-color);border-radius:999px;background:var(--bg-glass);color:var(--text-primary);font:inherit;outline:none}.nav-search .search-icon{position:absolute;left:14px;top:50%;transform:translateY(-50%);color:var(--text-tertiary)}.nav-search .search-shortcut{position:absolute;right:14px;top:50%;transform:translateY(-50%);padding:2px 8px;border:1px solid var(--border-color);border-radius:6px;background:var(--bg-tertiary);font:.7rem var(--font-mono);color:var(--text-tertiary)}.nav-links{display:flex;align-items:center;gap:8px;flex-shrink:0}.nav-links a,.theme-toggle-btn,.mobile-menu-btn,.mobile-search-btn{min-height:44px}.nav-links a{padding:8px 16px;border-radius:999px;color:var(--text-secondary);font-size:.9rem;font-weight:500}.theme-toggle-btn,.mobile-menu-btn,.mobile-search-btn{display:inline-flex;align-items:center;justify-content:center;width:44px;height:44px;border:1px solid var(--border-color);border-radius:12px;background:none;color:var(--text-primary);cursor:pointer}.mobile-menu-btn,.mobile-search-btn{display:none}.main-content{padding-top:var(--nav-height);padding-bottom:var(--safe-bottom);min-height:100vh}.hero,.tool-page{max-width:900px;margin:0 auto;padding:80px 24px 40px}.hero{text-align:center}.hero h1{margin:0 0 20px;font-size:clamp(2.5rem,6vw,4.5rem);font-weight:800;line-height:1.1}.hero p,.tool-page-header p{max-width:600px;margin:0 auto 30px;color:var(--text-secondary);font-size:clamp(1rem,2.4vw,1.2rem)}.hero-stats{display:flex;justify-content:center;gap:48px;flex-wrap:wrap;margin-top:40px}.hero-stat{text-align:center}.hero-stat .stat-value{font-size:2rem;font-weight:800;color:var(--accent-primary)}.hero-stat .stat-label,.tool-breadcrumb{font-size:.85rem;color:var(--text-tertiary)}.hero-trust-strip{display:flex;justify-content:center;flex-wrap:wrap;gap:12px;margin-top:28px}.trust-badge,.category-tab,.tool-tag{display:inline-flex;align-items:center;gap:6px;padding:8px 12px;border:1px solid var(--border-color);border-radius:999px;background:var(--bg-glass);color:var(--text-secondary);font-size:.82rem;max-width:100%;white-space:normal;overflow-wrap:anywhere}.categories-section,.tools-section{padding:20px 24px}.category-tabs{max-width:var(--max-width);margin:0 auto 24px;display:flex;flex-wrap:wrap;justify-content:center;gap:8px}.category-tab{white-space:nowrap}.tool-page-header{margin-bottom:32px}.tool-page-header h1{margin:0;font-size:2rem;font-weight:800}.tool-breadcrumb{display:flex;align-items:center;gap:8px;margin-bottom:16px}.tools-grid,.guide-card-grid,.tool-proof-grid,.tool-content-sections{display:grid;gap:20px}.tools-grid{max-width:var(--max-width);margin:0 auto;grid-template-columns:repeat(auto-fill,minmax(min(300px,100%),1fr))}.tool-card,.guide-card,.tool-content-section,.tool-workspace,.tool-proof-card,.home-utility-panel{border:1px solid var(--border-color);border-radius:16px;background:var(--bg-card);min-width:0}.tool-card,.guide-card,.tool-content-section,.tool-proof-card,.home-utility-panel{padding:20px}.tool-card-link{display:block;color:inherit}.tool-card-header{display:flex;align-items:flex-start;gap:14px;margin-bottom:12px}.tool-card-icon{display:flex;align-items:center;justify-content:center;width:52px;height:52px;border-radius:14px;background:var(--gradient-primary);font-size:1.6rem;flex-shrink:0}.tool-card-info h3{margin:0 0 4px;font-size:1.1rem}.tool-card p{margin:0 0 14px;color:var(--text-secondary)}.tool-card-tags{display:flex;flex-wrap:wrap;gap:8px}.guide-card-grid{grid-template-columns:repeat(auto-fit,minmax(min(240px,100%),1fr));margin-top:18px}.guide-card h3{margin:6px 0 10px;font-size:1.08rem}.tool-workspace{padding:0}.tool-workspace-body{padding:20px}.btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;padding:11px 18px;border:none;border-radius:12px;background:var(--gradient-primary);color:#fff;font-weight:700;font:inherit;cursor:pointer}.btn-secondary{border:1px solid var(--border-color);background:var(--bg-glass);color:var(--text-primary)}@media (max-width:1176px){:root{--nav-height:60px}.navbar{padding:0 max(12px,calc(12px + var(--safe-left))) 0 max(12px,calc(12px + var(--safe-right)));height:60px;min-height:60px}.nav-inner{gap:8px;min-height:60px}.nav-search,.nav-links{display:none}.mobile-menu-btn,.mobile-search-btn{display:inline-flex}.nav-logo{gap:8px;font-size:1.1rem}.nav-logo .logo-icon{width:32px;height:32px;font-size:1.1rem}.hero,.tool-page{padding:48px 16px 32px}.hero-stats{gap:20px}.hero-trust-strip{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}.trust-badge{justify-content:center;text-align:center}}@media (max-width:640px){:root{--nav-height:56px}.navbar{padding:0 max(10px,calc(10px + var(--safe-left))) 0 max(10px,calc(10px + var(--safe-right)));height:56px;min-height:56px}.nav-inner{gap:6px}.hero,.tool-page,.categories-section,.tools-section{padding-left:12px;padding-right:12px}.hero h1{font-size:clamp(2rem,9vw,2.6rem)}.hero p{font-size:.98rem}.hero-stats{gap:16px}.hero-stat .stat-value{font-size:1.5rem}.tools-grid{grid-template-columns:1fr}.tool-card,.guide-card,.tool-content-section,.tool-proof-card,.home-utility-panel{padding:16px}}`;
const CONTENT_SECURITY_POLICY = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' https://pagead2.googlesyndication.com https://www.googletagmanager.com https://partner.googleadservices.com https://tpc.googlesyndication.com https://esm.sh https://unpkg.com https://cdn.jsdelivr.net",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com",
  "img-src 'self' data: https:",
  "frame-src 'self' https://www.googletagmanager.com https://googleads.g.doubleclick.net https://tpc.googlesyndication.com",
  "connect-src 'self' https://www.google-analytics.com https://region1.google-analytics.com https://stats.g.doubleclick.net https://pagead2.googlesyndication.com https://googleads.g.doubleclick.net https://partner.googleadservices.com https://www.googletagmanager.com https://esm.sh https://unpkg.com https://cdn.jsdelivr.net",
  "object-src 'none'",
  "base-uri 'self'",
].join('; ');
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
const SOFTWARE_HUB_PATH = '/software';
const STATIC_PAGE_SOURCE_FILES = {
  about: 'about.html',
  contact: 'contact.html',
  privacy: 'privacy.html',
  terms: 'terms.html',
};
const ROOT_STATIC_FILE_PATHS = [
  '/ads.txt',
  '/404.html',
  INDEXNOW_VERIFICATION_PATH,
  '/indexnow-key.txt',
  '/manifest.json',
  '/robots.txt',
  '/sitemap.html',
  '/sitemap.xml',
  '/sitemap-main.xml',
  '/sitemap-tools.xml',
  '/sitemap-categories.xml',
  '/sitemap-software.xml',
  '/sw.js',
  `/${BUNDLE_OUTPUT_FILE}`,
  '/favicon.svg',
  '/favicon.ico',
  '/favicon-48.png',
  '/apple-touch-icon.png',
  '/icon-192.png',
  '/icon-512.png',
  '/icon-maskable-512.png',
  '/og',
  '/social-card.jpg',
  '/social-card.png',
];
const RESERVED_ROOT_SEGMENTS = new Set([
  'about',
  'contact',
  'privacy',
  'terms',
  'software',
  'category',
  'search',
  'tool',
  'sitemap',
  'sitemap.html',
  'sitemap.xml',
  'sitemap-main.xml',
  'sitemap-tools.xml',
  'sitemap-categories.xml',
  'sitemap-software.xml',
  `${INDEXNOW_KEY}.txt`,
  'indexnow-key.txt',
  'og',
  'robots.txt',
  'ads.txt',
  '404.html',
  'manifest.json',
  'sw.js',
  BUNDLE_OUTPUT_FILE,
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

const CORE_BUNDLE_FILES = [
  'js/app.js',
  'js/tools.js',
  'js/renderers.js',
  'js/ai.js',
];
const LAZY_RENDERER_SOURCE_FILES = [
  'js/renderers2.js',
  'js/renderers3.js',
  'js/renderers4.js',
  'js/renderers5.js',
  'js/renderers6.js',
];
const LAZY_RENDERER_CHUNKS = [
  { sourceFiles: ['js/renderers2.js'], outputFile: 'js/renderers2.min.js' },
  { sourceFiles: ['js/renderers3.js'], outputFile: 'js/renderers3.min.js' },
  // [TOOLIEST QR FIX] Bundle the QR engine into the same-origin renderer chunk so the tool never depends on a third-party runtime fetch.
  { sourceFiles: ['node_modules/qrcode-generator/qrcode.js', 'js/renderers4.js'], outputFile: 'js/renderers4.min.js' },
  { sourceFiles: ['js/renderers5.js'], outputFile: 'js/renderers5.min.js' },
  { sourceFiles: ['js/renderers6.js'], outputFile: 'js/renderers6.min.js' },
];
const TOOL_RENDERER_SOURCE_FILES = ['js/renderers.js', ...LAZY_RENDERER_SOURCE_FILES];

const SOFTWARE_CONTENT_CATEGORIES = [
  {
    id: 'all-in-one',
    name: 'All-in-One SEO Suites',
    description: 'Complete SEO platforms for teams that want research, audits, reporting, and workflow tools in one place.',
  },
  {
    id: 'content-optimization',
    name: 'Content Optimization Platforms',
    description: 'Briefing and optimization tools that help content teams plan, refresh, and improve rankings without guesswork.',
  },
  {
    id: 'technical-seo',
    name: 'Technical SEO and Search Intelligence',
    description: 'Crawlers, rank trackers, and market-intelligence tools built for audits, migrations, and high-stakes SEO visibility.',
  },
  {
    id: 'keyword-research',
    name: 'Keyword Discovery and Niche Research',
    description: 'Lighter-weight tools for finding realistic keyword opportunities before you spend months on the wrong content.',
  },
];

const SOFTWARE_CLUSTER_OUTLINES = [
  {
    slug: 'se-ranking',
    name: 'SE Ranking',
    category: 'all-in-one',
    bestFor: 'agencies and in-house teams that want strong reporting without Semrush-level spend',
    summary: 'SE Ranking is the value-first SEO suite that usually comes up when teams want rank tracking, audits, and reporting in one dashboard without enterprise pricing.',
    pillarTitle: 'SE Ranking review: where it wins, where it feels lightweight, and who should actually buy it',
    comparisons: ['SE Ranking vs Semrush for agencies', 'SE Ranking vs Mangools for solo marketers', 'SE Ranking vs AccuRanker for rank tracking'],
    useCases: ['SE Ranking for local SEO', 'SE Ranking for small businesses', 'SE Ranking reporting workflows for agencies'],
  },
  {
    slug: 'moz-pro',
    name: 'Moz Pro',
    category: 'all-in-one',
    bestFor: 'beginners and teams that prefer a calmer, simpler SEO workflow',
    summary: 'Moz Pro still matters because it feels approachable, trusted, and easier to adopt for teams that do not want a huge operational learning curve.',
    pillarTitle: 'Moz Pro review: is the classic SEO suite still worth paying for?',
    comparisons: ['Moz Pro vs Ahrefs for link research', 'Moz Pro vs SE Ranking for growing teams', 'Moz Pro vs Semrush for all-in-one SEO'],
    useCases: ['Moz Pro for local SEO', 'Moz Pro for in-house marketing teams', 'Moz Pro for SEO beginners'],
  },
  {
    slug: 'mangools',
    name: 'Mangools',
    category: 'all-in-one',
    bestFor: 'freelancers, bloggers, and small teams that want a lightweight SEO stack',
    summary: 'Mangools wins people over because it feels fast, friendly, and budget-aware, especially for creators who do not need an enterprise suite.',
    pillarTitle: 'Mangools review: the easiest SEO toolset for solo creators?',
    comparisons: ['Mangools vs Ahrefs for bloggers', 'Mangools vs Ubersuggest for budget SEO', 'Mangools vs SE Ranking for small teams'],
    useCases: ['Mangools for affiliate sites', 'Mangools for freelance SEO', 'Mangools keyword research workflow'],
  },
  {
    slug: 'ubersuggest',
    name: 'Ubersuggest',
    category: 'all-in-one',
    bestFor: 'beginners who want keyword ideas, light audits, and an easy onboarding curve',
    summary: 'Ubersuggest is often the â€œjust get me startedâ€ SEO tool because the workflow is straightforward and the price feels less intimidating.',
    pillarTitle: 'Ubersuggest review: a good starter SEO tool or too limited long term?',
    comparisons: ['Ubersuggest vs Mangools for beginners', 'Ubersuggest vs Semrush on a budget', 'Ubersuggest vs LowFruits for new sites'],
    useCases: ['Ubersuggest for small business SEO', 'Ubersuggest for content ideas', 'Ubersuggest alternatives for scaling teams'],
  },
  {
    slug: 'surfer',
    name: 'Surfer',
    category: 'content-optimization',
    bestFor: 'content teams that want strong optimization workflows and faster brief production',
    summary: 'Surfer sits at the center of many content-led SEO stacks because it pairs SERP analysis with practical workflows for briefs, updates, and optimization.',
    pillarTitle: 'Surfer review: does it still justify the price for content-led SEO?',
    comparisons: ['Surfer vs Clearscope for editorial teams', 'Surfer vs Frase for AI-assisted workflows', 'Surfer vs NeuronWriter for budget-conscious teams'],
    useCases: ['Surfer for content briefs', 'Surfer for refreshing old articles', 'Surfer for agency content production'],
  },
  {
    slug: 'clearscope',
    name: 'Clearscope',
    category: 'content-optimization',
    bestFor: 'teams that care deeply about editorial quality and cleaner optimization signals',
    summary: 'Clearscope usually appeals to content leaders who want a more polished editorial experience and less noise in the optimization process.',
    pillarTitle: 'Clearscope review: premium content optimization for serious editorial teams',
    comparisons: ['Clearscope vs Surfer for content optimization', 'Clearscope vs Frase for AI briefs', 'Clearscope vs WriterZen for planning and optimization'],
    useCases: ['Clearscope for enterprise content teams', 'Clearscope for content refreshes', 'Clearscope for editorial QA'],
  },
  {
    slug: 'frase',
    name: 'Frase',
    category: 'content-optimization',
    bestFor: 'teams that want AI help across research, outlining, and first-draft acceleration',
    summary: 'Frase is attractive when the goal is speed: faster research, quicker outlines, and a less manual content briefing process.',
    pillarTitle: 'Frase review: best for fast content workflows or too AI-heavy?',
    comparisons: ['Frase vs Surfer for content teams', 'Frase vs NeuronWriter for affordability', 'Frase vs Clearscope for editorial quality'],
    useCases: ['Frase for content briefs', 'Frase for updating blog posts', 'Frase for lean marketing teams'],
  },
  {
    slug: 'neuronwriter',
    name: 'NeuronWriter',
    category: 'content-optimization',
    bestFor: 'smaller SEO teams that want Surfer-like workflows with a calmer price tag',
    summary: 'NeuronWriter earns attention because it covers much of the optimization workflow smaller teams want without feeling enterprise-heavy.',
    pillarTitle: 'NeuronWriter review: the practical Surfer alternative for smaller teams',
    comparisons: ['NeuronWriter vs Surfer for budget SEO', 'NeuronWriter vs Frase for AI assistance', 'NeuronWriter vs WriterZen for content planning'],
    useCases: ['NeuronWriter for affiliate sites', 'NeuronWriter for niche content', 'NeuronWriter for content refresh projects'],
  },
  {
    slug: 'writerzen',
    name: 'WriterZen',
    category: 'content-optimization',
    bestFor: 'teams that want topic discovery, clustering, and content planning in one research workflow',
    summary: 'WriterZen leans more into content planning and topic mapping than pure page-level optimization, which makes it useful earlier in the workflow.',
    pillarTitle: 'WriterZen review: better for topic clusters than page-level optimization?',
    comparisons: ['WriterZen vs Frase for planning', 'WriterZen vs Surfer for optimization', 'WriterZen vs LowFruits for opportunity finding'],
    useCases: ['WriterZen for topic clusters', 'WriterZen for new websites', 'WriterZen for editorial planning'],
  },
  {
    slug: 'similarweb',
    name: 'Similarweb',
    category: 'technical-seo',
    bestFor: 'teams doing market research, competitor analysis, and executive reporting',
    summary: 'Similarweb is less about classic SEO workflows and more about understanding the market, competitors, and where traffic appears to come from.',
    pillarTitle: 'Similarweb review: when traffic intelligence beats another SEO suite',
    comparisons: ['Similarweb vs Semrush for competitor research', 'Similarweb vs Ahrefs for market intelligence', 'Similarweb vs Nightwatch for visibility reporting'],
    useCases: ['Similarweb for competitive analysis', 'Similarweb for market sizing', 'Similarweb for executive reports'],
  },
  {
    slug: 'accuranker',
    name: 'AccuRanker',
    category: 'technical-seo',
    bestFor: 'teams that care most about rank tracking accuracy and reporting depth',
    summary: 'AccuRanker tends to win when rankings are the KPI and the team wants a specialist instead of an all-in-one suite.',
    pillarTitle: 'AccuRanker review: the specialist rank tracker serious teams grow into',
    comparisons: ['AccuRanker vs Nightwatch for rank tracking', 'AccuRanker vs SE Ranking for agencies', 'AccuRanker vs Semrush for tracking depth'],
    useCases: ['AccuRanker for agencies', 'AccuRanker for enterprise reporting', 'AccuRanker for local keyword tracking'],
  },
  {
    slug: 'nightwatch',
    name: 'Nightwatch',
    category: 'technical-seo',
    bestFor: 'agencies and teams that want modern visibility reporting with strong segmentation',
    summary: 'Nightwatch earns attention from reporting-focused teams because the dashboards, segmentation, and visibility workflows feel purpose-built.',
    pillarTitle: 'Nightwatch review: smarter rank tracking for reporting-heavy teams',
    comparisons: ['Nightwatch vs AccuRanker for agencies', 'Nightwatch vs Semrush for reporting', 'Nightwatch vs Similarweb for visibility insights'],
    useCases: ['Nightwatch for agencies', 'Nightwatch for local SEO reporting', 'Nightwatch for AI visibility tracking'],
  },
  {
    slug: 'lowfruits',
    name: 'LowFruits',
    category: 'keyword-research',
    bestFor: 'new sites and niche publishers searching for realistic, low-authority opportunities',
    summary: 'LowFruits is popular because it helps people find keyword opportunities they can actually compete for instead of chasing impossible head terms.',
    pillarTitle: 'LowFruits review: one of the best keyword tools for low-authority sites?',
    comparisons: ['LowFruits vs Keywords Everywhere for ideation', 'LowFruits vs Ahrefs for low-competition keywords', 'LowFruits vs Ubersuggest for new sites'],
    useCases: ['LowFruits for niche sites', 'LowFruits for new domains', 'LowFruits for affiliate SEO'],
  },
  {
    slug: 'keywords-everywhere',
    name: 'Keywords Everywhere',
    category: 'keyword-research',
    bestFor: 'fast SERP research and lightweight keyword validation right inside the browser',
    summary: 'Keywords Everywhere is useful when you want a cheaper, faster research assist layered onto your everyday browser workflow.',
    pillarTitle: 'Keywords Everywhere review: the fastest way to validate keywords in your browser',
    comparisons: ['Keywords Everywhere vs LowFruits for opportunity research', 'Keywords Everywhere vs Mangools for lightweight research', 'Keywords Everywhere vs Ahrefs for quick SERP checks'],
    useCases: ['Keywords Everywhere for bloggers', 'Keywords Everywhere for content ideation', 'Keywords Everywhere for fast SERP analysis'],
  },
  {
    slug: 'google-search-console',
    name: 'Google Search Console',
    category: 'technical-seo',
    bestFor: 'every site owner who wants first-party Google search data before buying anything else',
    summary: 'Google Search Console is the anchor for practical SEO because it shows real queries, real clicks, indexing issues, and performance data from Google itself.',
    pillarTitle: 'Google Search Console guide: the free SEO tool every team should master first',
    comparisons: ['Google Search Console vs Semrush', 'Google Search Console vs Ahrefs', 'Google Search Console vs Screaming Frog'],
    useCases: ['Google Search Console for CTR improvements', 'Google Search Console for indexing issues', 'Google Search Console for query mining'],
  },
];

const SOFTWARE_CLUSTERS = [];

SOFTWARE_CLUSTERS.push({
  slug: 'semrush',
  name: 'Semrush',
  category: 'all-in-one',
  hook: 'If your team keeps bouncing between five SEO subscriptions and still feels blind, Semrush is usually the tool people reach for when they want one command center instead of a messy stack.',
  summary: 'Semrush is a broad SEO platform for keyword research, competitor analysis, backlinks, site auditing, content planning, and reporting. It is rarely the cheapest option, but it often becomes the default pick when a team wants depth and speed in one place.',
  bestFor: 'agencies, in-house SEO teams, and content-led growth teams that want one platform to coordinate research, reporting, and optimization',
  notIdealFor: 'solo creators on a tight budget who only need one or two workflows and do not want a heavier learning curve',
  pricing: 'Semrush usually makes sense when the time saved across keyword research, audits, and reporting is worth more than the subscription. It is a workflow purchase more than a casual utility purchase.',
  verdict: 'Choose Semrush when you want breadth, team workflows, and a platform that can support both strategic planning and hands-on execution.',
  strengths: [
    'Very broad feature set spanning keywords, content, backlinks, technical SEO, and competitor research',
    'Strong reporting and client-facing workflows for teams and agencies',
    'Good fit for organizations that want one central source of SEO context',
  ],
  tradeoffs: [
    'Can feel overwhelming for smaller teams',
    'Pricing gets harder to justify if you only rely on two or three features',
    'Some teams still prefer specialist tools for deep backlink research or rank tracking',
  ],
  whoShouldUse: [
    'SEO agencies managing multiple client workflows',
    'In-house teams building repeatable SEO operations',
    'Content teams that want keyword research and optimization planning in one place',
  ],
  whoShouldSkip: [
    'Freelancers who only need lightweight keyword research',
    'Teams that already have separate specialist tools they truly like',
    'Budget-sensitive creators still proving content-market fit',
  ],
  decisionSteps: [
    'Start with the question â€œDo we need breadth or depth?â€ If breadth matters most, Semrush moves up fast.',
    'Check whether multiple teammates need the same source of truth for audits, rankings, and planning.',
    'Estimate whether saved research and reporting time can justify the higher monthly cost.',
  ],
  keywords: ['semrush review', 'is semrush worth it', 'semrush vs ahrefs', 'semrush for agencies', 'how to use semrush for content planning'],
  relatedSlugs: ['ahrefs', 'similarweb', 'se-ranking'],
  comparisons: [
    {
      slug: 'vs-ahrefs',
      title: 'Semrush vs Ahrefs: which is better for keyword research and backlink analysis?',
      competitor: 'Ahrefs',
      competitorSlug: 'ahrefs',
      targetQuery: 'semrush vs ahrefs for keyword research',
      hook: 'This is the comparison most teams end up making when they can only justify one serious SEO suite.',
      toolWins: ['Choose Semrush when you want broader workflow coverage across audits, content planning, and reporting.', 'Choose Semrush when multiple teams need one shared SEO dashboard instead of a narrower research tool.', 'Choose Semrush when competitor and advertising context matters alongside organic research.'],
      competitorWins: ['Ahrefs often feels stronger when backlink research is the center of your decision.', 'Teams that want a cleaner research-first experience may prefer Ahrefs.', 'Writers and strategists sometimes find Ahrefs easier for quick exploratory work.'],
      decisionFramework: ['If your main pain is fragmented workflow, Semrush is usually the better answer.', 'If your main pain is link intelligence depth, Ahrefs usually has the edge.', 'If you need broader reporting and planning, Semrush wins more often.'],
      takeaway: 'Semrush is the better operating system for a broader SEO team, while Ahrefs is often the sharper instrument for link-led research.',
    },
    {
      slug: 'vs-se-ranking',
      title: 'Semrush vs SE Ranking: which one makes more sense for agencies and lean teams?',
      competitor: 'SE Ranking',
      competitorSlug: 'se-ranking',
      targetQuery: 'semrush vs se ranking for agencies',
      hook: 'If Semrush feels powerful but expensive, SE Ranking is usually the first realistic alternative people consider.',
      toolWins: ['Semrush gives larger teams more breadth and stronger multi-workflow depth.', 'Semrush usually wins when research, content, audits, and competitive analysis all matter at once.', 'Agencies with more advanced deliverables often grow into Semrush faster.'],
      competitorWins: ['SE Ranking is easier to justify when budget discipline matters every month.', 'Smaller agencies often prefer the lighter operational overhead.', 'If you mainly need reporting, rank tracking, and practical auditing, SE Ranking can feel more efficient.'],
      decisionFramework: ['Choose Semrush if missing data depth costs you more than subscription savings.', 'Choose SE Ranking if you need a capable all-in-one without premium-suite pricing.', 'Be honest about whether your team will actually use Semrush breadth.'],
      takeaway: 'Semrush is the stronger long-term command center, but SE Ranking is often the more rational short-term buy.',
    },
    {
      slug: 'vs-similarweb',
      title: 'Semrush vs Similarweb: better for SEO execution or market intelligence?',
      competitor: 'Similarweb',
      competitorSlug: 'similarweb',
      targetQuery: 'semrush vs similarweb for competitor research',
      hook: 'These tools overlap on competitor visibility, but they answer very different business questions once you get past the surface.',
      toolWins: ['Semrush is better for day-to-day SEO execution and organic workflow decisions.', 'It connects keyword, audit, content, and rank workflows more directly.', 'Teams doing hands-on optimization usually get faster practical value from Semrush.'],
      competitorWins: ['Similarweb is stronger when executive teams need market share and traffic-estimation context.', 'Broader digital market intelligence is where Similarweb shines.', 'Cross-channel competitive narratives feel more natural in Similarweb.'],
      decisionFramework: ['If your team needs to ship SEO work, choose Semrush.', 'If leadership wants market understanding and category sizing, choose Similarweb.', 'Some organizations eventually use both for different layers of decision-making.'],
      takeaway: 'Semrush is the operatorâ€™s tool. Similarweb is the market-intelligence tool.',
    },
  ],
  useCases: [
    {
      slug: 'for-agencies',
      title: 'Semrush for agencies: reporting, client workflows, and where the subscription pays for itself',
      targetQuery: 'semrush for agencies',
      hook: 'Agency teams do not buy Semrush because it looks impressive. They buy it when client reporting, research, and competitive insight start eating too many hours every week.',
      audience: 'SEO and content agencies',
      whyItFits: ['It centralizes research, reporting, and audit snapshots in one workflow.', 'It reduces tool-switching across account managers, strategists, and specialists.', 'It is easier to standardize deliverables when one platform anchors the process.'],
      quickStart: ['Create a repeatable client setup checklist for projects, audits, and reporting views.', 'Pick one reporting cadence and standardize it before adding complexity.', 'Train the team on the core three workflows first: research, audit, and reporting.'],
      watchouts: ['Do not pay for breadth your team never adopts.', 'Without process ownership, the platform can become underused.', 'Agencies should keep a lightweight SOP library so the tool stays operationally useful.'],
      takeaway: 'Semrush earns its keep in agencies when it becomes part of your operating system, not just a dashboard you check occasionally.',
    },
    {
      slug: 'for-content-planning',
      title: 'How to use Semrush for content planning without overcomplicating your workflow',
      targetQuery: 'how to use semrush for content planning',
      hook: 'A lot of content teams buy Semrush and then use five percent of it. The smarter move is to build one clean planning workflow and ignore the rest until you need it.',
      audience: 'content marketers and editors',
      whyItFits: ['You can go from topic discovery to brief planning without jumping across tools.', 'It gives writers and strategists the same context for priority topics.', 'It helps content refresh work feel less random and more systematic.'],
      quickStart: ['Start with one content pillar and collect realistic supporting topics.', 'Turn promising ideas into a simple editorial queue before chasing more keywords.', 'Use the same scoring criteria for new pages and refresh candidates.'],
      watchouts: ['Avoid treating the tool as a content strategy replacement.', 'Do not chase every keyword just because it is visible.', 'Briefs still need human judgment around search intent and brand angle.'],
      takeaway: 'Semrush is strongest for content planning when it helps your team make fewer, clearer decisions instead of generating more noise.',
    },
    {
      slug: 'for-local-seo',
      title: 'Semrush for local SEO: when it helps and when a lighter stack is enough',
      targetQuery: 'semrush for local seo',
      hook: 'Local teams sometimes assume they need a huge suite, but the real question is whether the suite saves enough time across location-level research and reporting to justify the cost.',
      audience: 'local businesses and multi-location teams',
      whyItFits: ['It works well when local SEO sits inside a broader content and technical strategy.', 'It helps teams coordinate local landing pages with wider keyword research.', 'Agencies handling many local clients can benefit from consistency.'],
      quickStart: ['Map priority markets before expanding into low-value local keywords.', 'Separate â€œmust-winâ€ local pages from lower-priority experiments.', 'Tie local reporting to actual business outcomes, not just rank movement.'],
      watchouts: ['Small local businesses may not need suite-level complexity.', 'A lighter toolset can be enough if local SEO is your only workflow.', 'The cost only makes sense when local work is part of a broader search program.'],
      takeaway: 'Semrush is useful for local SEO when local work connects to a bigger SEO program. If not, a leaner setup can be smarter.',
    },
  ],
});

SOFTWARE_CLUSTERS.push({
  slug: 'screaming-frog',
  name: 'Screaming Frog',
  category: 'technical-seo',
  hook: 'When SEO problems live inside templates, canonicals, broken links, migrations, and metadata debt, Screaming Frog is often the tool that finally turns â€œsomething feels offâ€ into a list you can act on.',
  summary: 'Screaming Frog is a desktop crawler built for technical SEO audits, migrations, metadata analysis, canonical checks, and site-wide issue discovery. It is not flashy, but it is one of the most practical technical SEO tools for teams that need clarity fast.',
  bestFor: 'technical SEOs, growth teams, and agencies handling audits, migrations, and site-wide cleanup work',
  notIdealFor: 'non-technical teams that want a fully guided SEO suite with minimal setup',
  pricing: 'Screaming Frog is usually worth it very quickly because one avoided migration error or one well-run audit can justify the cost.',
  verdict: 'Choose Screaming Frog when your biggest SEO risk is technical complexity, not lack of keyword data.',
  strengths: ['Excellent for fast technical audits and issue discovery', 'Strong fit for migrations, metadata reviews, and site-wide QA', 'Beloved by practitioners because it is practical and direct'],
  tradeoffs: ['Feels more technical and less guided than all-in-one suites', 'Not the right tool if you mostly need keyword and content planning', 'Teams still need judgment to prioritize fixes after the crawl'],
  whoShouldUse: ['Technical SEOs auditing complex sites', 'Agencies handling migrations and cleanup projects', 'In-house teams dealing with recurring indexing and template issues'],
  whoShouldSkip: ['Teams looking for a friendlier content-first platform', 'Users who never touch technical implementation', 'Beginners who need more guidance than raw crawl data'],
  decisionSteps: ['Ask whether your SEO bottleneck is technical health rather than content opportunity.', 'If migrations, duplicate metadata, canonicals, or crawl waste are recurring problems, Screaming Frog becomes very hard to ignore.', 'Pair it with a broader suite if keyword research and reporting are also critical.'],
  keywords: ['screaming frog guide', 'how to use screaming frog', 'screaming frog vs sitebulb', 'screaming frog for technical seo', 'screaming frog audit'],
  relatedSlugs: ['google-search-console', 'semrush', 'similarweb'],
  comparisons: [
    {
      slug: 'vs-sitebulb',
      title: 'Screaming Frog vs Sitebulb: which crawler is better for technical SEO audits?',
      competitor: 'Sitebulb',
      competitorSlug: 'sitebulb',
      targetQuery: 'screaming frog vs sitebulb',
      hook: 'This comparison usually comes down to a classic tradeoff: raw speed and flexibility versus more guided analysis.',
      toolWins: ['Screaming Frog feels faster and more direct for experienced practitioners.', 'Many technical SEOs prefer the control and familiarity it offers.', 'It is excellent when you already know what you are looking for.'],
      competitorWins: ['Sitebulb often feels friendlier and more guided for analysis.', 'Teams that want more interpretation may prefer its presentation style.', 'Some organizations adopt it faster because the learning curve feels softer.'],
      decisionFramework: ['Choose Screaming Frog for practitioner speed and flexibility.', 'Choose Sitebulb for guidance and presentation comfort.', 'The right answer depends on technical maturity more than feature lists.'],
      takeaway: 'Screaming Frog is usually the technicianâ€™s choice. Sitebulb is often the guided-analysis choice.',
    },
    {
      slug: 'vs-semrush-site-audit',
      title: 'Screaming Frog vs Semrush Site Audit: do you need a crawler or a suite audit?',
      competitor: 'Semrush Site Audit',
      competitorSlug: 'semrush',
      targetQuery: 'screaming frog vs semrush site audit',
      hook: 'A lot of teams assume these are substitutes. They overlap, but they support very different working styles.',
      toolWins: ['Screaming Frog gives technical teams more crawl-level control and visibility.', 'It is better for hands-on audits and migration QA.', 'You can investigate edge cases more directly.'],
      competitorWins: ['Semrush Site Audit fits better into a broader all-in-one workflow.', 'Non-technical stakeholders often prefer suite dashboards.', 'It is easier when you want technical checks without becoming a crawler expert.'],
      decisionFramework: ['Choose Screaming Frog for hands-on technical depth.', 'Choose Semrush Site Audit for a more integrated suite workflow.', 'Many advanced teams use both for different layers of review.'],
      takeaway: 'Screaming Frog is the deeper diagnostic tool. Semrush Site Audit is the easier integrated layer.',
    },
    {
      slug: 'vs-ahrefs-site-audit',
      title: 'Screaming Frog vs Ahrefs Site Audit: which one is better for technical cleanup work?',
      competitor: 'Ahrefs Site Audit',
      competitorSlug: 'ahrefs',
      targetQuery: 'screaming frog vs ahrefs site audit',
      hook: 'If you already use Ahrefs, it is tempting to stay inside one ecosystem. The question is whether the built-in audit is enough for the technical work you actually do.',
      toolWins: ['Screaming Frog is stronger when the team needs granular investigation.', 'It is better for template-level QA and migration prep.', 'Technical specialists usually move faster in it once they know the workflow.'],
      competitorWins: ['Ahrefs Site Audit is more convenient when you want everything under one subscription.', 'It fits teams already centered on Ahrefs research workflows.', 'It can be sufficient for lighter technical monitoring.'],
      decisionFramework: ['Choose Screaming Frog for specialist technical work.', 'Choose Ahrefs Site Audit for convenience and lighter monitoring.', 'Use the specialist tool if technical issues create real business risk.'],
      takeaway: 'If your technical work is mission-critical, Screaming Frog is usually the safer bet.',
    },
  ],
  useCases: [
    {
      slug: 'for-broken-links',
      title: 'How to use Screaming Frog to find broken links before they quietly hurt your site',
      targetQuery: 'how to find broken links with screaming frog',
      hook: 'Broken links rarely announce themselves. They slowly erode user experience, waste crawl budget, and create avoidable cleanup debt.',
      audience: 'technical SEOs and website managers',
      whyItFits: ['It surfaces broken internal and external links quickly across the whole site.', 'You can turn vague quality concerns into a fixable task list.', 'It is practical for recurring site hygiene checks.'],
      quickStart: ['Run a full crawl before making assumptions about where the damage is.', 'Separate high-value broken links from low-impact noise.', 'Fix template-level causes first so issues do not reappear.'],
      watchouts: ['Do not treat every broken URL as equally important.', 'Context matters: traffic pages deserve faster attention.', 'Broken-link reports are only useful if they feed into an actual fix workflow.'],
      takeaway: 'Screaming Frog turns broken-link cleanup into a manageable system instead of a scattered guessing game.',
    },
    {
      slug: 'for-site-migrations',
      title: 'Screaming Frog for site migrations: a practical checklist for launch week',
      targetQuery: 'screaming frog for site migrations',
      hook: 'Migrations fail when teams rely on hope and a homepage spot check. Screaming Frog helps you replace hope with a repeatable process.',
      audience: 'SEO teams and agencies handling migrations',
      whyItFits: ['It is ideal for pre-launch and post-launch URL validation.', 'You can verify redirects, canonicals, metadata, and status codes at scale.', 'It gives migration work a concrete QA rhythm.'],
      quickStart: ['Crawl the current site before launch and keep the export as a baseline.', 'Validate redirect behavior and canonical targets after launch.', 'Re-check critical templates and high-value page groups immediately.'],
      watchouts: ['Do not wait until launch day to define success checks.', 'One clean homepage redirect does not mean the migration is healthy.', 'Keep the crawl output connected to engineering fixes, not just SEO notes.'],
      takeaway: 'Screaming Frog shines during migrations because it makes QA measurable and repeatable.',
    },
    {
      slug: 'for-metadata-and-canonicals',
      title: 'How to audit metadata and canonicals with Screaming Frog without drowning in exports',
      targetQuery: 'audit metadata and canonicals with screaming frog',
      hook: 'Metadata and canonical problems get expensive when they spread across templates. The right crawl helps you spot patterns instead of chasing page-by-page noise.',
      audience: 'technical SEOs and content operations teams',
      whyItFits: ['You can audit titles, descriptions, canonicals, and duplicates at scale.', 'Template issues become visible much faster than with manual checks.', 'It is one of the quickest ways to connect content problems to implementation problems.'],
      quickStart: ['Group pages by template or section before prioritizing fixes.', 'Look for repeated issues rather than isolated weird pages.', 'Treat canonical mismatches as strategy questions, not just technical bugs.'],
      watchouts: ['Do not optimize metadata in isolation from search intent.', 'Duplicate patterns matter more than one-off anomalies.', 'Canonical tags can hide bigger information-architecture issues.'],
      takeaway: 'Screaming Frog works best here when it helps you find repeated structural mistakes, not just interesting one-off errors.',
    },
  ],
});

SOFTWARE_CLUSTERS.push({
  slug: 'ahrefs',
  name: 'Ahrefs',
  category: 'all-in-one',
  hook: 'If your team wants research depth without drowning in a giant operations layer, Ahrefs is usually the tool that feels sharpest right away.',
  summary: 'Ahrefs is a research-heavy SEO platform known for backlink intelligence, keyword exploration, and content-gap workflows. It is often chosen by teams that care more about discovering opportunities quickly than managing every SEO task inside one giant system.',
  bestFor: 'SEO strategists, content teams, and publishers who want strong backlink and keyword research with a cleaner research-first workflow',
  notIdealFor: 'teams that need the broadest possible reporting and workflow coverage inside a single platform',
  pricing: 'Ahrefs tends to feel worth it when research quality drives your results. If rank tracking, agency reporting, and workflow breadth matter more than research depth, another tool may fit better.',
  verdict: 'Choose Ahrefs when your biggest need is finding the right opportunities fast and understanding why competitors are winning.',
  strengths: ['Excellent reputation for backlink and content-gap research workflows', 'Fast, focused interface for strategy and investigation work', 'Great fit for publishers, SaaS teams, and content strategists'],
  tradeoffs: ['Less of an all-in-one operating system than Semrush for some teams', 'Price still feels serious for smaller creators', 'Teams wanting deep reporting specialization may still pair it with other tools'],
  whoShouldUse: ['Content-led SEO teams researching new clusters', 'Publishers and affiliate operators who depend on competitive intelligence', 'Strategists who care deeply about links, topic gaps, and opportunity discovery'],
  whoShouldSkip: ['Teams wanting a more budget-friendly entry point', 'Organizations mostly buying for reporting workflows', 'Users who need gentle onboarding more than research depth'],
  decisionSteps: ['Ask whether your bottleneck is discovery or operational execution.', 'If content gaps, backlink opportunities, and competitor research are the pain points, Ahrefs rises quickly.', 'If wider reporting and team workflow management matter more, compare it carefully with Semrush or SE Ranking.'],
  keywords: ['ahrefs review', 'ahrefs for beginners', 'ahrefs vs semrush', 'how to use ahrefs', 'is ahrefs worth it'],
  relatedSlugs: ['semrush', 'moz-pro', 'mangools'],
  comparisons: [
    {
      slug: 'vs-semrush',
      title: 'Ahrefs vs Semrush: which SEO suite is better for research-first teams?',
      competitor: 'Semrush',
      competitorSlug: 'semrush',
      targetQuery: 'ahrefs vs semrush for content teams',
      hook: 'This decision usually comes down to a simple tension: do you want deeper research feel or broader workflow coverage?',
      toolWins: ['Ahrefs wins when backlink analysis and content-gap discovery sit at the center of your workflow.', 'Many strategists prefer the sharper research-first experience.', 'It is often easier to stay focused when the interface feels less operationally crowded.'],
      competitorWins: ['Semrush wins when you want one platform for a broader set of marketing and reporting jobs.', 'Cross-team visibility is often easier in Semrush.', 'Agencies needing workflow breadth may outgrow Ahrefs-only setups faster.'],
      decisionFramework: ['Pick Ahrefs for research-first strategy teams.', 'Pick Semrush for broader operational coverage.', 'If content and links drive most of your wins, Ahrefs has a strong case.'],
      takeaway: 'Ahrefs feels like the sharper research blade; Semrush feels like the broader operating system.',
    },
    {
      slug: 'vs-moz-pro',
      title: 'Ahrefs vs Moz Pro: which one feels better for everyday SEO work?',
      competitor: 'Moz Pro',
      competitorSlug: 'moz-pro',
      targetQuery: 'ahrefs vs moz pro',
      hook: 'Teams comparing Ahrefs and Moz Pro are usually balancing research depth against simplicity and comfort.',
      toolWins: ['Ahrefs is the stronger pick for deeper competitive and backlink work.', 'It reveals opportunities faster for experienced strategists.', 'Content teams chasing growth generally get more strategic value from Ahrefs.'],
      competitorWins: ['Moz Pro often feels friendlier for beginners and calmer teams.', 'Some in-house teams value the lower learning friction.', 'If you want a steadier, simpler workflow, Moz Pro can be easier to adopt.'],
      decisionFramework: ['Pick Ahrefs if research depth matters more than simplicity.', 'Pick Moz Pro if adoption speed and comfort matter more.', 'The right answer depends on team maturity more than hype.'],
      takeaway: 'Ahrefs is usually stronger, but Moz Pro can still be the easier fit for less mature teams.',
    },
    {
      slug: 'vs-mangools',
      title: 'Ahrefs vs Mangools: is the premium suite worth it for solo creators?',
      competitor: 'Mangools',
      competitorSlug: 'mangools',
      targetQuery: 'ahrefs vs mangools for bloggers',
      hook: 'Solo creators often know Ahrefs is stronger. The real question is whether they actually need that much tool.',
      toolWins: ['Ahrefs is clearly better for advanced research and competitive depth.', 'It gives growing publishers more room to scale their strategy.', 'If links and content gaps are core to your business, the difference shows fast.'],
      competitorWins: ['Mangools is much easier to justify when budget is real.', 'The learning curve feels lighter and more welcoming.', 'Smaller creators often get enough value without premium-suite overhead.'],
      decisionFramework: ['Pick Ahrefs if SEO is already a serious revenue channel.', 'Pick Mangools if you want clarity, speed, and lower monthly pressure.', 'Do not buy complexity you will not use.'],
      takeaway: 'Ahrefs is better. Mangools is often enough. That difference matters.',
    },
  ],
  useCases: [
    {
      slug: 'for-beginners',
      title: 'Ahrefs for beginners: how to get real value without getting overwhelmed',
      targetQuery: 'ahrefs for beginners',
      hook: 'Beginners do not struggle with Ahrefs because it is bad. They struggle because it can show far more data than they know how to prioritize.',
      audience: 'new SEO practitioners and in-house marketers',
      whyItFits: ['It teaches competitive thinking quickly when used with restraint.', 'You can get meaningful wins from a few workflows instead of trying everything.', 'It helps beginners see why pages rank, not just what keyword volume looks like.'],
      quickStart: ['Focus on one workflow first: competitor pages, content gaps, or backlinks.', 'Create a tiny weekly routine instead of opening every report.', 'Document what â€œgood opportunityâ€ means before you start exploring.'],
      watchouts: ['Do not confuse more data with a better strategy.', 'Avoid exporting huge lists before you know what you want.', 'A narrow workflow creates better learning than random clicking.'],
      takeaway: 'Ahrefs becomes beginner-friendly once you treat it like a focused research partner, not a data buffet.',
    },
    {
      slug: 'for-low-competition-keywords',
      title: 'How to use Ahrefs to find low-competition keywords you can actually rank for',
      targetQuery: 'how to use ahrefs to find low competition keywords',
      hook: 'Most teams do not need more keyword ideas. They need a faster way to reject the ones they should never chase.',
      audience: 'publishers, SaaS teams, and niche site builders',
      whyItFits: ['Ahrefs is strong at showing where competitors are already proving demand.', 'It helps you spot realistic content openings instead of chasing vanity topics.', 'The research process feels strategic rather than random.'],
      quickStart: ['Start with competitor pages that already match your business model.', 'Pull topic patterns before you evaluate individual keywords.', 'Use keyword difficulty as a clue, not a decision by itself.'],
      watchouts: ['Low difficulty does not always mean good intent.', 'Do not forget to check what kind of pages already rank.', 'A realistic keyword is only valuable if it helps the business.'],
      takeaway: 'Ahrefs is best for low-competition keyword work when you use it to find patterns, not just single lucky terms.',
    },
    {
      slug: 'for-saas-seo',
      title: 'Ahrefs for SaaS SEO: building a content roadmap around product-adjacent intent',
      targetQuery: 'ahrefs for saas seo',
      hook: 'SaaS teams waste a lot of content effort when they publish around traffic instead of product-adjacent demand. Ahrefs can help fix that quickly.',
      audience: 'SaaS marketing teams',
      whyItFits: ['It is strong for finding adjacent opportunities competitors already win.', 'The platform helps content strategists connect topics back to business value.', 'It works well for cluster planning and gap analysis.'],
      quickStart: ['Map product-adjacent jobs to competitor content patterns.', 'Separate traffic content from bottom-funnel support content.', 'Use one cluster at a time so the roadmap stays realistic.'],
      watchouts: ['Do not let top-of-funnel ideas crowd out product-relevant content.', 'A large backlog is not the same as a strategy.', 'Cross-check search opportunity with sales relevance.'],
      takeaway: 'Ahrefs helps SaaS teams most when it narrows the roadmap to opportunities that actually support the product story.',
    },
  ],
});

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

function replaceVersionedAssetReference(html, pathname) {
  const escapedPath = pathname.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return html.replace(new RegExp(`${escapedPath}\\?v=[^"'\\s)]+`, 'g'), getVersionedAssetPath(pathname));
}

function syncStaticPageAssetVersions() {
  Object.values(STATIC_PAGE_SOURCE_FILES).forEach((sourceFile) => {
    const sourcePath = path.join(__dirname, sourceFile);
    const originalHtml = fs.readFileSync(sourcePath, 'utf8');
    let nextHtml = originalHtml;

    // [TOOLIEST AUDIT] Keep static page asset versions aligned with the current build output.
    nextHtml = replaceVersionedAssetReference(nextHtml, CSS_BUNDLE_PATH);
    nextHtml = replaceVersionedAssetReference(nextHtml, '/js/consent.js');
    nextHtml = replaceVersionedAssetReference(nextHtml, `/${BUNDLE_OUTPUT_FILE}`);
    nextHtml = nextHtml.replace(
      /window\.__TOOLIEST_ASSET_VERSION='[^']+'/g,
      `window.__TOOLIEST_ASSET_VERSION='${ASSET_VERSION}'`
    );

    if (nextHtml !== originalHtml) {
      fs.writeFileSync(sourcePath, nextHtml);
    }
  });
}

const rendererSourceCache = new Map();

function normalizeSourcePath(relativePath) {
  return String(relativePath || '').replace(/^\/+/, '').replace(/\//g, path.sep);
}

function getSourceModifiedDate(relativePaths) {
  // [TOOLIEST AUDIT] Derive page freshness from source files so sitemap/schema dates reflect real changes.
  const modifiedTimes = relativePaths
    .map((relativePath) => path.join(__dirname, normalizeSourcePath(relativePath)))
    .filter((absolutePath) => fs.existsSync(absolutePath))
    .map((absolutePath) => fs.statSync(absolutePath).mtimeMs)
    .filter(Boolean);

  if (!modifiedTimes.length) {
    return BUILD_DATE;
  }

  return new Date(Math.max(...modifiedTimes)).toISOString().split('T')[0];
}

function getRendererSourceFileForTool(toolId) {
  for (const sourceFile of TOOL_RENDERER_SOURCE_FILES) {
    if (!rendererSourceCache.has(sourceFile)) {
      rendererSourceCache.set(sourceFile, fs.readFileSync(path.join(__dirname, sourceFile), 'utf8'));
    }
    const source = rendererSourceCache.get(sourceFile) || '';
    if (source.includes(`'${toolId}'(`) || source.includes(`"${toolId}"(`)) {
      return sourceFile;
    }
  }
  return null;
}

function getToolLastModifiedDate(tool) {
  const sourceFiles = ['js/tools.js', 'js/app.js'];
  const rendererSourceFile = getRendererSourceFileForTool(tool.id);
  if (rendererSourceFile) {
    sourceFiles.push(rendererSourceFile);
  }
  if (tool.standaloneSourceFile) {
    sourceFiles.push(tool.standaloneSourceFile);
  }
  if (tool.isAI) {
    sourceFiles.push('js/ai.js');
  }
  return getSourceModifiedDate(sourceFiles);
}

function getCategoryLastModifiedDate(categoryId, tools) {
  const categoryTools = tools.filter((tool) => tool.category === categoryId);
  const sourceFiles = ['js/tools.js'];
  const rendererFiles = new Set(categoryTools.map((tool) => getRendererSourceFileForTool(tool.id)).filter(Boolean));
  rendererFiles.forEach((sourceFile) => sourceFiles.push(sourceFile));
  categoryTools
    .map((tool) => tool.standaloneSourceFile)
    .filter(Boolean)
    .forEach((sourceFile) => sourceFiles.push(sourceFile));
  if (categoryTools.some((tool) => tool.isAI)) {
    sourceFiles.push('js/ai.js');
  }
  return getSourceModifiedDate(sourceFiles);
}

function getStaticPageLastModifiedDate(sourceFile) {
  return getSourceModifiedDate([sourceFile]);
}

function getSiteLastModifiedDate() {
  return getSourceModifiedDate(['js/app.js', 'js/tools.js']);
}

function getSoftwareContentLastModifiedDate() {
  return getSourceModifiedDate(['build.js']);
}

function escapeXml(value = '') {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function wrapOgText(text, maxChars = 28, maxLines = 3) {
  const words = String(text || '').split(/\s+/).filter(Boolean);
  const lines = [];
  let current = '';

  words.forEach((word) => {
    const candidate = current ? `${current} ${word}` : word;
    if (candidate.length <= maxChars || !current) {
      current = candidate;
      return;
    }
    lines.push(current);
    current = word;
  });

  if (current) {
    lines.push(current);
  }

  if (lines.length <= maxLines) {
    return lines;
  }

  const trimmed = lines.slice(0, maxLines);
  trimmed[maxLines - 1] = `${trimmed[maxLines - 1].replace(/[. ]+$/g, '')}...`;
  return trimmed;
}

function renderOgCardSvg({ eyebrow, title, body, badge }) {
  const titleLines = wrapOgText(title, 24, 3);
  const bodyLines = wrapOgText(body, 48, 3);

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630" role="img" aria-labelledby="title desc">
  <title id="title">${escapeXml(title)}</title>
  <desc id="desc">${escapeXml(body)}</desc>
  <defs>
    <linearGradient id="bg" x1="0%" x2="100%" y1="0%" y2="100%">
      <stop offset="0%" stop-color="#081221" />
      <stop offset="50%" stop-color="#101a33" />
      <stop offset="100%" stop-color="#111827" />
    </linearGradient>
    <linearGradient id="accent" x1="0%" x2="100%" y1="0%" y2="100%">
      <stop offset="0%" stop-color="#8b5cf6" />
      <stop offset="100%" stop-color="#06b6d4" />
    </linearGradient>
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="20" stdDeviation="30" flood-color="#020617" flood-opacity="0.35" />
    </filter>
  </defs>
  <rect width="1200" height="630" fill="url(#bg)" rx="36" />
  <circle cx="1030" cy="120" r="180" fill="#8b5cf6" opacity="0.12" />
  <circle cx="220" cy="560" r="220" fill="#06b6d4" opacity="0.1" />
  <rect x="70" y="72" width="1060" height="486" rx="34" fill="rgba(15, 23, 42, 0.78)" stroke="rgba(148, 163, 184, 0.18)" filter="url(#shadow)" />
  <rect x="110" y="118" width="164" height="164" rx="34" fill="url(#accent)" />
  <text x="192" y="218" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="88" font-weight="800" fill="#ffffff">T</text>
  <text x="320" y="150" font-family="Inter, Arial, sans-serif" font-size="26" font-weight="700" letter-spacing="1.4" fill="#93c5fd">${escapeXml(eyebrow)}</text>
  ${titleLines.map((line, index) => `<text x="320" y="${235 + (index * 74)}" font-family="Inter, Arial, sans-serif" font-size="62" font-weight="800" fill="#f8fafc">${escapeXml(line)}</text>`).join('\n  ')}
  ${bodyLines.map((line, index) => `<text x="120" y="${392 + (index * 38)}" font-family="Inter, Arial, sans-serif" font-size="28" font-weight="500" fill="#cbd5e1">${escapeXml(line)}</text>`).join('\n  ')}
  <rect x="120" y="486" width="260" height="56" rx="28" fill="rgba(139, 92, 246, 0.16)" stroke="rgba(139, 92, 246, 0.32)" />
  <text x="150" y="522" font-family="Inter, Arial, sans-serif" font-size="24" font-weight="700" fill="#e9d5ff">${escapeXml(badge)}</text>
  <text x="952" y="528" font-family="Inter, Arial, sans-serif" font-size="26" font-weight="700" fill="#e2e8f0">tooliest.com</text>
</svg>
`;
}

function writeOgAssets(tools, categories) {
  console.log('Generating OG image assets...');
  const ogRoot = path.join(__dirname, 'og');
  const toolDir = path.join(ogRoot, 'tools');
  const categoryDir = path.join(ogRoot, 'categories');
  const siteDir = path.join(ogRoot, 'site');
  [ogRoot, toolDir, categoryDir, siteDir].forEach((dir) => fs.mkdirSync(dir, { recursive: true }));

    const siteCards = [
      {
        file: 'home.svg',
        eyebrow: 'Free online tools',
        title: 'Tooliest',
        body: 'Browser-based tools for text, SEO, JSON, CSS, color, image, AI, and finance workflows. No signup required.',
        badge: 'Zero installs',
    },
    {
      file: 'about.svg',
      eyebrow: 'About Tooliest',
      title: 'Why Tooliest exists',
      body: 'Fast, private browser-based utilities built to remove signups, uploads, and unnecessary friction.',
      badge: 'Private by design',
    },
    {
      file: 'contact.svg',
      eyebrow: 'Contact Tooliest',
      title: 'Send feedback or request a tool',
      body: 'Reach the Tooliest team with bug reports, feature ideas, partnerships, and support questions.',
      badge: 'Reply within 24-48h',
    },
    {
      file: 'privacy.svg',
      eyebrow: 'Privacy policy',
      title: 'How Tooliest handles data',
      body: 'Learn how browser-side processing, local storage, optional cookies, and ads work across the site.',
      badge: 'Browser-first privacy',
    },
    {
      file: 'terms.svg',
      eyebrow: 'Terms of service',
      title: 'How Tooliest can be used',
      body: 'Review the service terms for using Tooliest tools lawfully for personal and professional work.',
      badge: 'Clear usage terms',
    },
    {
      file: 'software.svg',
      eyebrow: 'SEO software guides',
      title: 'Reviews, comparisons, and buying guides',
      body: 'Research-oriented content clusters that help marketers compare SEO platforms without guesswork.',
      badge: 'Decision support',
    },
  ];

  siteCards.forEach((card) => {
    fs.writeFileSync(path.join(siteDir, card.file), renderOgCardSvg(card));
  });

  getRenderableCategories(categories).forEach((category) => {
    const categoryTools = getCategoryTools(tools, category.id);
    const body = category.description || `${categoryTools.length} browser-based ${category.name.toLowerCase()} tools you can use instantly without installs.`;
    fs.writeFileSync(
      path.join(categoryDir, `${category.id}.svg`),
      renderOgCardSvg({
        eyebrow: `${categoryTools.length} tools in ${category.name}`,
        title: `${category.name} tools`,
        body,
        badge: 'Free online',
      })
    );
  });

  tools.forEach((tool) => {
    const categoryName = categories.find((category) => category.id === tool.category)?.name || 'Online tools';
    fs.writeFileSync(
      path.join(toolDir, `${tool.id}.svg`),
      renderOgCardSvg({
        eyebrow: `${categoryName} on Tooliest`,
        title: tool.name,
        body: stripHtml(tool.meta?.desc || tool.description || `${tool.name} is a free browser-based tool on Tooliest.`),
        badge: 'Free and private',
      })
    );
  });
}

function renderSitemapUrlSet(entries) {
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries.map((entry) => `  <url>\n    <loc>${escapeXml(entry.loc)}</loc>\n    <lastmod>${escapeXml(entry.lastmod || BUILD_DATE)}</lastmod>\n    <changefreq>${escapeXml(entry.changefreq || 'monthly')}</changefreq>\n    <priority>${escapeXml(entry.priority || '0.5')}</priority>\n  </url>`).join('\n')}\n</urlset>\n`;
}

function getLatestLastmod(entries) {
  const timestamps = entries
    .map((entry) => Date.parse(entry.lastmod || BUILD_DATE))
    .filter((timestamp) => Number.isFinite(timestamp));
  return timestamps.length ? new Date(Math.max(...timestamps)).toISOString().split('T')[0] : BUILD_DATE;
}

function writeSitemapUrlFile(filename, entries) {
  fs.writeFileSync(path.join(__dirname, filename), renderSitemapUrlSet(entries));
  return {
    loc: getAbsoluteUrl(`/${filename}`),
    lastmod: getLatestLastmod(entries),
  };
}

function writeIndexNowKeyFiles() {
  fs.writeFileSync(path.join(__dirname, INDEXNOW_KEY_LOCATION_PATH.replace(/^\/+/, '')), INDEXNOW_KEY);
  fs.writeFileSync(path.join(__dirname, INDEXNOW_VERIFICATION_PATH.replace(/^\/+/, '')), INDEXNOW_KEY);
}

function shouldSubmitIndexNow() {
  if (process.env.ENABLE_INDEXNOW === 'false') return false;
  return Boolean(process.env.CF_PAGES || process.env.CI || process.env.ENABLE_INDEXNOW === 'true');
}

async function submitIndexNow(urlList) {
  if (!shouldSubmitIndexNow() || !urlList.length || typeof fetch !== 'function') {
    return;
  }

  try {
    const response = await fetch('https://api.indexnow.org/IndexNow', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        host: 'tooliest.com',
        key: INDEXNOW_KEY,
        keyLocation: getAbsoluteUrl(INDEXNOW_KEY_LOCATION_PATH),
        urlList,
      }),
    });
    console.log(`IndexNow submission returned ${response.status}`);
  } catch (error) {
    console.warn('IndexNow submission skipped due to error:', error && error.message ? error.message : error);
  }
}

function minifyCSS(css) {
  // [TOOLIEST AUDIT] Minify conservatively so url()/data values keep their internal punctuation untouched.
  let result = '';
  let quote = '';
  let inComment = false;
  let parenDepth = 0;
  let pendingSpace = false;

  for (let index = 0; index < css.length; index += 1) {
    const char = css[index];
    const nextChar = css[index + 1];

    if (inComment) {
      if (char === '*' && nextChar === '/') {
        inComment = false;
        index += 1;
      }
      continue;
    }

    if (!quote && char === '/' && nextChar === '*') {
      inComment = true;
      index += 1;
      continue;
    }

    if (quote) {
      result += char;
      if (char === '\\' && index + 1 < css.length) {
        result += css[index + 1];
        index += 1;
        continue;
      }
      if (char === quote) {
        quote = '';
      }
      continue;
    }

    if (char === '"' || char === '\'') {
      if (pendingSpace && !result.endsWith(' ')) {
        result += ' ';
      }
      pendingSpace = false;
      quote = char;
      result += char;
      continue;
    }

    if (/\s/.test(char)) {
      if (parenDepth > 0) {
        result += char;
      } else if (result && !/[{:;,>~+[(]/.test(result.slice(-1))) {
        pendingSpace = true;
      }
      continue;
    }

    if (char === '(') {
      parenDepth += 1;
    } else if (char === ')') {
      parenDepth = Math.max(0, parenDepth - 1);
    }

    if (pendingSpace && !/[{}:;,>~+)]/.test(char) && !result.endsWith(' ')) {
      result += ' ';
    }
    pendingSpace = false;

    if (parenDepth === 0 && /[{}:;,>~+]/.test(char) && result.endsWith(' ')) {
      result = result.slice(0, -1);
    }

    result += char;
  }

  return result.replace(/;}/g, '}').trim();
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

function getSoftwareCategory(categoryId) {
  return SOFTWARE_CONTENT_CATEGORIES.find((category) => category.id === categoryId) || SOFTWARE_CONTENT_CATEGORIES[0];
}

function getSoftwareToolPath(toolSlug) {
  return `${SOFTWARE_HUB_PATH}/${encodeURIComponent(toolSlug)}`;
}

function getSoftwareArticlePath(toolSlug, articleSlug) {
  return `${getSoftwareToolPath(toolSlug)}/${encodeURIComponent(articleSlug)}`;
}

function getSoftwareCluster(toolSlug) {
  return SOFTWARE_CLUSTERS.find((cluster) => cluster.slug === toolSlug) || null;
}

function getSoftwareGuideHref(toolSlug) {
  const fullCluster = getSoftwareCluster(toolSlug);
  return fullCluster ? getSoftwareToolPath(toolSlug) : `${SOFTWARE_HUB_PATH}#${encodeURIComponent(toolSlug)}`;
}

function getSoftwareOutline(toolSlug) {
  return SOFTWARE_CLUSTER_OUTLINES.find((cluster) => cluster.slug === toolSlug) || null;
}

function getRenderableCategories(categories) {
  return categories.filter((category) => !['all', 'favorites'].includes(category.id));
}

function getCategoryTools(tools, categoryId) {
  return tools.filter((tool) => tool.category === categoryId);
}

function getFeaturedToolNames(tools, limit = 3) {
  return tools.slice(0, limit).map((tool) => tool.name).join(', ');
}

function getCategoryNarrativeName(category) {
  const words = String(category?.name || '').split(/\s+/).filter(Boolean);
  if (!words.length) return '';
  return words
    .map((word, index) => {
      if (/^[A-Z0-9&+-]{2,}$/.test(word)) {
        return word;
      }
      if (index === 0) {
        return word.toLowerCase();
      }
      return word.toLowerCase();
    })
    .join(' ');
}

function getCategoryFaqItems(category, categoryTools) {
  const narrativeName = getCategoryNarrativeName(category);
  const featuredNames = getFeaturedToolNames(categoryTools, 3);
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
      a: `No. Tooliest processes your input locally in the browser whenever possible, so text, files, and settings stay on your device instead of being sent to a server.`,
    },
  ];
}

function getCategoryMeta(category, tools) {
  const categoryTools = getCategoryTools(tools, category.id);
  const count = categoryTools.length;
  const featuredTitleTools = getFeaturedToolNames(categoryTools, 2);
  const featuredTools = getFeaturedToolNames(categoryTools, 3);
  const narrativeName = getCategoryNarrativeName(category);
  const defaultDescription = featuredTools
    ? `Use ${count} free ${narrativeName} on Tooliest, including ${featuredTools}. Browser-based, fast, private, and no signup required. Explore the category now.`
    : `Use ${count} free ${narrativeName} on Tooliest. Browser-based, fast, private, and no signup required. Explore the category now.`;
  const defaultIntro = featuredTools
    ? `Browse Tooliest's ${narrativeName} and launch every tool instantly in your browser without sending your data to a server. Popular picks include ${featuredTools}.`
    : `Browse Tooliest's ${narrativeName} and launch every tool instantly in your browser without sending your data to a server.`;
  const defaultTopToolsIntro = `These are some of the most useful ${narrativeName} on Tooliest when you want fast results without extra tabs, accounts, or uploads:`;
  const defaultBenefitsIntro = `Tooliest's ${narrativeName} are designed for quick, practical work. You can launch a tool instantly, finish the task in one browser tab, and move on without handing your content to a server.`;

  const pdfDescription = featuredTools
    ? `Use ${count} free PDF tools on Tooliest to merge, split, compress, convert, protect, and export documents in your browser. Popular picks include ${featuredTools}. No signup required.`
    : `Use ${count} free PDF tools on Tooliest to merge, split, compress, convert, protect, and export documents in your browser. No signup required.`;
  const pdfIntro = featuredTools
    ? `Browse Tooliest's PDF tools for document merging, splitting, conversion, protection, and text extraction. Popular picks include ${featuredTools}, and every workflow stays in your browser for better privacy.`
    : `Browse Tooliest's PDF tools for document merging, splitting, conversion, protection, and text extraction. Every workflow stays in your browser for better privacy.`;
  return {
    category,
    tools: categoryTools,
    count,
    title: featuredTitleTools
      ? `Free ${category.name} Online - ${featuredTitleTools} | Tooliest`
      : `Free ${category.name} Online | Tooliest`,
    description: category.id === 'pdf' ? pdfDescription : defaultDescription,
    intro: category.id === 'pdf' ? pdfIntro : defaultIntro,
    topToolsIntro: category.id === 'pdf'
      ? 'These PDF tools handle the document tasks people usually need first: merging files, splitting pages, compressing exports, securing documents, and converting between PDFs, images, and text.'
      : defaultTopToolsIntro,
    benefitsIntro: category.id === 'pdf'
      ? 'Browser-based PDF tools are useful when you need to fix or export a document quickly without installing desktop software, creating an account, or sending files to a server.'
      : defaultBenefitsIntro,
    faq: getCategoryFaqItems(category, categoryTools),
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
        <div class="logo-icon">âš¡</div>
        <div class="logo-text"><span>Tooliest</span></div>
      </a>

      <div class="nav-search">
        <span class="search-icon">ðŸ”</span>
        <input type="text" id="search-input" placeholder="Search tools..." autocomplete="off">
        <span class="search-shortcut">Ctrl+K</span>
      </div>

      <div class="nav-links" id="nav-links">
        <a href="/" class="active">Home</a>
        <a href="/category/text">Text</a>
        <a href="/category/seo">SEO</a>
        <a href="/category/ai">AI Tools</a>
        <a href="/category/developer">Dev</a>
        <a href="${STATIC_PAGE_PATHS.about}">About</a>
        <a href="#" id="nav-install-btn" style="display:none;color:var(--accent-primary);font-weight:600;">ðŸ“² Install App</a>
        <button class="theme-toggle-btn" id="theme-toggle-btn" onclick="App.toggleTheme()" aria-label="Toggle theme">â˜€ï¸</button>
        <button class="theme-toggle-btn" id="changelog-btn" onclick="App.showChangelog()" aria-label="What's new" title="What's New">ðŸ†•</button>
      </div>

      <button class="mobile-search-btn" id="mobile-search-btn" aria-label="Open search">ðŸ”</button>
      <button class="mobile-menu-btn" id="mobile-menu-btn" aria-label="Open navigation menu">â˜°</button>
    </div>
  </nav>`;
}

function renderFooter() {
  return `<footer class="site-footer">
    <div class="footer-inner">
      <div class="footer-brand">
        <p class="footer-brand-title">âš¡ <span>Tooliest</span></p>
        <p>Free browser-based tools for developers, designers, writers, marketers, and document workflows. All tools run directly in your browser, so your input stays on your device.</p>
      </div>
      <div class="footer-col">
        <p class="footer-col-title">Popular Tools</p>
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
        <p class="footer-col-title">AI Tools</p>
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
        <p class="footer-col-title">Company</p>
        <ul>
          <li><a href="${STATIC_PAGE_PATHS.about}">About Us</a></li>
          <li><a href="${STATIC_PAGE_PATHS.contact}">Contact</a></li>
          <li><a href="${STATIC_PAGE_PATHS.privacy}">Privacy Policy</a></li>
          <li><a href="${STATIC_PAGE_PATHS.terms}">Terms of Service</a></li>
          <li><a href="${SOFTWARE_HUB_PATH}">SEO Software Guides</a></li>
          <li><a href="/sitemap.html">All Tools (Sitemap)</a></li>
        </ul>
      </div>
    </div>
    <p class="adsense-disclosure">Tooliest is supported by advertising through Google AdSense. Ad revenue helps keep every tool free. <a href="${STATIC_PAGE_PATHS.privacy}">Learn about our ad policy â†’</a></p>
    <div class="footer-bottom">
      <span>&copy; 2026 Tooliest.com â€” All tools are free and run in your browser.</span>
      <span>
        <a href="${STATIC_PAGE_PATHS.privacy}" style="color:inherit;opacity:0.7;">Privacy</a> &nbsp;Â·&nbsp;
        <a href="${STATIC_PAGE_PATHS.terms}" style="color:inherit;opacity:0.7;">Terms</a> &nbsp;Â·&nbsp;
        <a href="${STATIC_PAGE_PATHS.contact}" style="color:inherit;opacity:0.7;">Contact</a> &nbsp;Â·&nbsp;
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
        <button id="mobile-search-close" aria-label="Close search" style="background:none;border:none;color:var(--text-secondary);font-size:1.5rem;cursor:pointer;padding:4px 8px;line-height:1;">âœ•</button>
      </div>
      <div style="position:relative;">
        <span style="position:absolute;left:14px;top:50%;transform:translateY(-50%);color:var(--text-tertiary);pointer-events:none;">ðŸ”</span>
        <input type="text" id="mobile-search-input" placeholder="Search tools..." autocomplete="off"
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
      <div class="cookie-icon">ðŸª</div>
      <div class="cookie-text">
        <strong>We use browser storage and optional cookies to keep Tooliest free</strong>
        <p>Tooliest uses browser storage to remember your privacy choices on this device. If you accept non-essential tracking, Google may also use cookies for analytics and ads. <a href="${STATIC_PAGE_PATHS.privacy}">Learn more in our Privacy Policy.</a></p>
      </div>
      <div class="cookie-actions">
        <button id="cookie-reject-btn">Reject Non-Essential</button>
        <button id="cookie-accept-btn">Accept All Cookies âœ“</button>
      </div>
    </div>
  </div>`;
}

function renderPageShell({ title, description, canonicalPath, structuredData, mainContent, keywords, ogImagePath = '/social-card.jpg', ogImageAlt = 'Tooliest preview of free browser-based online tools', robots = 'index, follow' }) {
  const canonicalUrl = getAbsoluteUrl(canonicalPath);
  const ogImageUrl = /^https?:\/\//.test(ogImagePath) ? ogImagePath : getAbsoluteUrl(ogImagePath);
  const pageKeywords = keywords || 'free online tools, browser tools, tooliest';
  const versionedCssPath = getVersionedAssetPath(CSS_BUNDLE_PATH);
  const googlebotRobots = robots.includes('noindex')
    ? 'noindex, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1'
    : 'index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  ${LEGACY_TOOL_PATH_REDIRECT_INLINE}
  ${CONSENT_DEFAULTS_INLINE}
  ${GOOGLE_TAG_SNIPPET}
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeAttr(description)}">
  <meta name="keywords" content="${escapeAttr(pageKeywords)}">
  <meta name="author" content="Tooliest">
  <meta name="robots" content="${escapeAttr(robots)}">
  <meta name="googlebot" content="${escapeAttr(googlebotRobots)}">
  <meta name="theme-color" content="#8b5cf6">
  <meta name="theme-color" media="(prefers-color-scheme: dark)" content="#8b5cf6">
  <meta name="theme-color" media="(prefers-color-scheme: light)" content="#f8f9fc">
  <meta name="color-scheme" content="dark light">
  ${THEME_BOOTSTRAP_INLINE}
  <link rel="manifest" href="/manifest.json">
  <meta property="og:type" content="website">
  <meta property="og:title" content="${escapeAttr(title)}">
  <meta property="og:description" content="${escapeAttr(description)}">
  <meta property="og:url" content="${escapeAttr(canonicalUrl)}">
  <meta property="og:site_name" content="Tooliest">
  <meta property="og:image" content="${escapeAttr(ogImageUrl)}">
  <meta property="og:image:alt" content="${escapeAttr(ogImageAlt)}">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:site" content="@tooliest">
  <meta name="twitter:title" content="${escapeAttr(title)}">
  <meta name="twitter:description" content="${escapeAttr(description)}">
  <meta name="twitter:image" content="${escapeAttr(ogImageUrl)}">
  <meta name="twitter:image:alt" content="${escapeAttr(ogImageAlt)}">
  <link rel="canonical" href="${escapeAttr(canonicalUrl)}">
  <link rel="alternate" hreflang="en" href="${escapeAttr(canonicalUrl)}">
  <link rel="alternate" hreflang="x-default" href="https://tooliest.com/">
  <link rel="icon" href="${BRAND_ICON_PATHS.svg}" type="image/svg+xml">
  <link rel="icon" href="${BRAND_ICON_PATHS.png48}" sizes="48x48" type="image/png">
  <link rel="shortcut icon" href="${BRAND_ICON_PATHS.shortcut}" type="image/x-icon">
  <link rel="apple-touch-icon" href="${BRAND_ICON_PATHS.appleTouch}" sizes="180x180">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link rel="preload" href="${FONT_URL}" as="style">
  <style>${CRITICAL_CSS}</style>
  <link rel="stylesheet" href="${FONT_URL}" media="print" onload="this.media='all'">
  <noscript><link rel="stylesheet" href="${FONT_URL}"></noscript>
  <link rel="preload" href="${versionedCssPath}" as="style" fetchpriority="high">
  <link rel="stylesheet" href="${versionedCssPath}">
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
  <script src="${getVersionedAssetPath(`/${BUNDLE_OUTPUT_FILE}`)}" defer></script>
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
          ${tool.isAI ? '<div class="ai-badge">âœ¨ AI</div>' : ''}
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
  const steps = Array.isArray(tool.howToSteps) && tool.howToSteps.length
    ? tool.howToSteps
    : [
      { name: `Open ${tool.name}`, text: `Launch ${tool.name} and add the input you want to process.` },
      { name: 'Set the options', text: 'Adjust the key fields or controls that affect the output.' },
      { name: 'Generate the result', text: 'Run the tool and review the result instantly in your browser.' },
      { name: 'Copy or export the output', text: 'Reuse the final result in the next step of your workflow.' },
    ];
  const relatedCategories = (tool.relatedCategoryIds || [])
    .map((categoryId) => categories.find((candidate) => candidate.id === categoryId))
    .filter(Boolean);

  const snippetHtml = tool.aeoSnippet
    ? `<section class="tool-content-section">
      <h2>${escapeHtml(tool.aeoSnippet.heading)}</h2>
      <p>${escapeHtml(tool.aeoSnippet.answer)}</p>
    </section>`
    : '';

  const highlightsHtml = Array.isArray(tool.contentHighlights) && tool.contentHighlights.length
    ? `<section class="tool-content-section">
      <h2>Practical Examples & Benchmarks</h2>
      <ul>${tool.contentHighlights.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul>
    </section>`
    : '';

  const methodologyHtml = tool.methodology
    ? `<section class="tool-content-section tool-methodology">
      <h2>Methodology & Accuracy Notes</h2>
      <div>${tool.methodology}</div>
      ${tool.accuracyDisclaimer ? `<p class="tool-accuracy-disclaimer">${escapeHtml(tool.accuracyDisclaimer)}</p>` : ''}
    </section>`
    : '';

  const referencesHtml = Array.isArray(tool.referenceLinks) && tool.referenceLinks.length
    ? `<section class="tool-content-section">
      <h2>Reference Sources</h2>
      <ul>${tool.referenceLinks.map((item) => `<li><a href="${escapeAttr(item.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(item.label)}</a></li>`).join('')}</ul>
    </section>`
    : '';

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

  const relatedCategoriesHtml = relatedCategories.length
    ? `<section class="tool-content-section">
      <h2>Explore Related Categories</h2>
      <ul>${relatedCategories.map((category) => `<li><a href="${getCategoryPath(category.id)}">${escapeHtml(category.name)}</a> Ã¢â‚¬â€ ${escapeHtml(String(category.count || ''))} tools</li>`).join('')}</ul>
    </section>`
    : '';

  const changelogHtml = Array.isArray(tool.changelog) && tool.changelog.length
    ? `<section class="tool-content-section">
      <h2>Changelog</h2>
      <ul class="changelog-list">${tool.changelog.map((entry) => `<li><time datetime="${escapeAttr(entry.date)}">${escapeHtml(entry.date)}</time> Ã¢â‚¬â€ ${escapeHtml(entry.text)}</li>`).join('')}</ul>
    </section>`
    : '';

  return `<article class="tool-article">
    <div class="tool-content-sections">
    <section class="tool-content-section">
      <h2>${escapeHtml(tool.summaryHeading || `What Is ${tool.name}?`)}</h2>
      <p>${escapeHtml(tool.description)}</p>
      ${tool.education ? `<div class="tool-education-copy">${tool.education}</div>` : `<p>${escapeHtml(fallbackExplain)}</p>`}
    </section>
    ${snippetHtml}
    ${methodologyHtml}
    ${highlightsHtml}
    <section class="tool-content-section">
      <h2>${escapeHtml(tool.howToHeading || `How To Use ${tool.name}`)}</h2>
      <ol>${steps.map((step) => `<li><strong>${escapeHtml(step.name)}</strong> Ã¢â‚¬â€ ${escapeHtml(step.text)}</li>`).join('')}</ol>
    </section>
    ${whyUseHtml}
    ${whoUsesHtml}
    ${faqHtml}
    ${relatedCategoriesHtml}
    ${changelogHtml}
    ${referencesHtml}
    </div>
  </article>`;
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

function getStaticHomeFeaturedTools(tools) {
  const preferredIds = [
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
  const preferredTools = preferredIds
    .map((toolId) => tools.find((tool) => tool.id === toolId))
    .filter(Boolean);
  const fallbackTools = tools.filter((tool) => !preferredIds.includes(tool.id));
  return [...preferredTools, ...fallbackTools].slice(0, 9);
}

function getRelatedCategories(categoryId, categories) {
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
  return relatedIds.map(id => categories.find(c => c.id === id)).filter(Boolean);
}

function renderCategoryPage(category, tools, categories) {
  const meta = getCategoryMeta(category, tools);
  const canonicalPath = getCategoryPath(category.id);
  const canonicalUrl = getAbsoluteUrl(canonicalPath);
  const relatedCats = getRelatedCategories(category.id, getRenderableCategories(categories));
  const categoryLastModified = getCategoryLastModifiedDate(category.id, tools);
  const categoryKeywords = meta.tools.slice(0, 5).map(t => t.name.toLowerCase()).join(', ') + `, ${category.name.toLowerCase()}, free online tools, tooliest`;
  const narrativeName = getCategoryNarrativeName(category);

  const structuredData = [
    {
      '@context': 'https://schema.org',
        '@type': 'CollectionPage',
        name: category.name,
        url: canonicalUrl,
        description: meta.description,
        dateModified: categoryLastModified,
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
    {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: meta.faq.map((item) => ({
        '@type': 'Question',
        name: item.q,
        acceptedAnswer: {
          '@type': 'Answer',
          text: item.a,
        },
      })),
    },
  ];

  const topToolsHtml = `<section class="tool-content-section">
      <h2>Best ${escapeHtml(category.name)} to Start With</h2>
      <p>${escapeHtml(meta.topToolsIntro || `These are some of the most useful ${narrativeName} on Tooliest when you want fast results without extra tabs, accounts, or uploads:`)}</p>
      <ul>${meta.tools.slice(0, 6).map((tool) => `<li><a href="${getToolPath(tool.id)}"><strong>${escapeHtml(tool.name)}</strong></a> - ${escapeHtml(tool.description)}</li>`).join('')}</ul>
    </section>`;

  const benefitsHtml = `<section class="tool-content-section">
      <h2>Why Use Browser-Based ${escapeHtml(category.name)}?</h2>
      <p>${escapeHtml(meta.benefitsIntro || `Tooliest's ${narrativeName} are designed for quick, practical work. You can launch a tool instantly, finish the task in one browser tab, and move on without handing your content to a server.`)}</p>
      <ul>
        <li>Launch any tool instantly with no signup or account setup</li>
        <li>Keep your input on your own device for better privacy</li>
        <li>Move between related tools quickly with direct internal links</li>
        <li>Use the same workflows on desktop and mobile browsers</li>
      </ul>
    </section>`;

  const relatedCatsHtml = relatedCats.length
    ? `<section class="tool-content-section">
        <h2>Related Tool Categories</h2>
        <p>Looking for more? Explore these related categories on Tooliest:</p>
        <ul>${relatedCats.map(rc => `<li><a href="${getCategoryPath(rc.id)}">${rc.icon} ${escapeHtml(rc.name)}</a> - ${getCategoryTools(tools, rc.id).length} free tools</li>`).join('')}</ul>
      </section>`
    : '';

  const faqHtml = `<section class="tool-content-section">
      <h2>${escapeHtml(category.name)} FAQ</h2>
      <div class="faq-list">${meta.faq.map((item) => `<details class="faq-item"><summary>${escapeHtml(item.q)}</summary><p>${escapeHtml(item.a)}</p></details>`).join('')}</div>
    </section>`;

  const mainContent = `<main class="main-content" id="main-content">
    <section class="tool-page">
      <div class="tool-page-header">
        <div class="tool-breadcrumb">
          <a href="/">Home</a>
          <span class="separator">â€º</span>
          <span>${escapeHtml(category.name)}</span>
        </div>
        <h1 style="margin:0">${category.icon} ${escapeHtml(category.name)}</h1>
        <p>${escapeHtml(meta.description)}</p>
        <p style="margin-top:12px;color:var(--text-tertiary);font-size:0.92rem">${escapeHtml(meta.intro)}</p>
      </div>
      <section class="tools-section" style="padding:0">
        <div class="tools-grid" id="tools-grid">${meta.tools.map((tool) => renderStaticToolCard(tool, categories)).join('')}</div>
      </section>
      <div class="tool-content-sections" style="margin-top:32px">
        ${topToolsHtml}
        ${benefitsHtml}
        ${relatedCatsHtml}
        ${faqHtml}
      </div>
    </section>
  </main>`;

  return renderPageShell({
    title: meta.title,
    description: meta.description,
    canonicalPath,
    structuredData,
    mainContent,
    keywords: categoryKeywords,
    ogImagePath: `/og/categories/${category.id}.svg`,
    ogImageAlt: `${category.name} category preview on Tooliest`,
  });
}

function renderToolPage(tool, tools, categories) {
  const categoryName = categories.find(category => category.id === tool.category)?.name || tool.category;
  const canonicalPath = getToolPath(tool.id);
  const canonicalUrl = getAbsoluteUrl(canonicalPath);
  const description = tool.meta?.desc || tool.description;
  const toolLastModified = getToolLastModifiedDate(tool);
  const toolKeywords = [...tool.tags, categoryName.toLowerCase(), 'free online tool', 'browser-based', 'tooliest'].join(', ');

  const structuredData = [
    {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: 'Tooliest',
      url: 'https://tooliest.com',
      logo: 'https://tooliest.com/icon-512.png',
      description: 'A free, browser-based platform with online tools for developers, designers, writers, marketers, and document workflows.',
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
      dateModified: toolLastModified,
      browserRequirements: 'Requires a JavaScript-enabled modern web browser',
      featureList: tool.tags.join(', '),
      softwareVersion: ASSET_VERSION,
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
      step: (tool.howToSteps || []).map((step, index) => ({
        '@type': 'HowToStep',
        position: index + 1,
        name: step.name,
        text: step.text,
      })),
      tool: { '@type': 'HowToTool', name: `Tooliest ${tool.name}` },
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
      dateModified: tool.lastReviewed || toolLastModified,
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
          <span class="separator">â€º</span>
          <a href="${getCategoryPath(tool.category)}">${escapeHtml(categoryName)}</a>
          <span class="separator">â€º</span>
          <span>${escapeHtml(tool.name)}</span>
        </div>
        <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px">
          <h1 style="margin:0"><span role="img" aria-label="${escapeAttr(tool.name)} icon">${tool.icon}</span> ${escapeHtml(tool.name)} ${tool.isAI ? '<span class="ai-badge" style="font-size:0.5em;vertical-align:middle">âœ¨ AI-Powered</span>' : ''}</h1>
          <a class="btn btn-secondary btn-sm" href="#tool-workspace" aria-label="Jump to the live ${escapeAttr(tool.name)} workspace">Jump to Live Tool</a>
        </div>
        <p>${escapeHtml(tool.description)}</p>
        <p class="tool-last-updated"><time datetime="${escapeAttr(tool.lastReviewed || toolLastModified)}">Last reviewed: ${escapeHtml(tool.lastReviewedLabel || tool.lastReviewed || toolLastModified)}</time> Â· ${escapeHtml(tool.reviewedBy || 'Reviewed by Tooliest')}</p>
      </div>
      <div class="tool-workspace" id="tool-workspace">
        <div class="tool-workspace-body">
          <p style="color:var(--text-secondary);margin-bottom:8px">Loading the interactive ${escapeHtml(tool.name)} toolâ€¦</p>
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
    ogImagePath: tool.ogImage || '/social-card.jpg',
    ogImageAlt: tool.ogImageAlt || `${tool.name} preview card on Tooliest`,
  });
}

function renderSoftwareGuideCards(items, mapItem) {
  return `<div class="guide-card-grid">${items.map((item) => mapItem(item)).join('')}</div>`;
}

function renderSoftwareHubPage() {
  const softwareLastModified = getSoftwareContentLastModifiedDate();
  const categorySections = SOFTWARE_CONTENT_CATEGORIES.map((category) => {
    const published = SOFTWARE_CLUSTERS.filter((cluster) => cluster.category === category.id);
    const roadmap = SOFTWARE_CLUSTER_OUTLINES.filter((cluster) => cluster.category === category.id);
    const publishedHtml = published.length
      ? renderSoftwareGuideCards(published, (cluster) => `<article class="guide-card">
          <span class="guide-card-eyebrow">Published guide</span>
          <h3><a href="${getSoftwareToolPath(cluster.slug)}">${escapeHtml(cluster.name)}</a></h3>
          <p>${escapeHtml(cluster.summary)}</p>
          <ul>${cluster.keywords.slice(0, 3).map((keyword) => `<li>${escapeHtml(keyword)}</li>`).join('')}</ul>
          <div class="guide-card-actions">
            <a href="${getSoftwareToolPath(cluster.slug)}">Read the pillar guide</a>
          </div>
        </article>`)
      : '';
    const roadmapHtml = roadmap.length
      ? renderSoftwareGuideCards(roadmap, (cluster) => `<article class="guide-card guide-card-outline" id="${escapeAttr(cluster.slug)}">
          <span class="guide-card-eyebrow">Roadmap cluster</span>
          <h3>${escapeHtml(cluster.name)}</h3>
          <p>${escapeHtml(cluster.summary)}</p>
          <p><strong>Best for:</strong> ${escapeHtml(cluster.bestFor)}</p>
          <p><strong>Pillar page:</strong> ${escapeHtml(cluster.pillarTitle)}</p>
          <div class="guide-chip-row">${cluster.comparisons.map((comparison) => `<span class="guide-chip">${escapeHtml(comparison)}</span>`).join('')}</div>
          <div class="guide-chip-row">${cluster.useCases.map((useCase) => `<span class="guide-chip">${escapeHtml(useCase)}</span>`).join('')}</div>
        </article>`)
      : '';

    return `<section class="tool-content-section">
      <h2>${escapeHtml(category.name)}</h2>
      <p>${escapeHtml(category.description)}</p>
      ${publishedHtml}
      ${roadmapHtml}
    </section>`;
  }).join('');

  const structuredData = [
    {
        '@context': 'https://schema.org',
        '@type': 'CollectionPage',
        name: 'SEO Software Guides',
        url: getAbsoluteUrl(SOFTWARE_HUB_PATH),
        description: 'Browse Tooliest guides comparing SEO software, content optimization tools, technical crawlers, and keyword research platforms.',
        dateModified: softwareLastModified,
      },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: getAbsoluteUrl('/') },
        { '@type': 'ListItem', position: 2, name: 'SEO Software Guides', item: getAbsoluteUrl(SOFTWARE_HUB_PATH) },
      ],
    },
    {
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      name: 'Published SEO software guides',
      itemListElement: SOFTWARE_CLUSTERS.map((cluster, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        url: getAbsoluteUrl(getSoftwareToolPath(cluster.slug)),
        name: cluster.name,
      })),
    },
  ];

  const mainContent = `<main class="main-content" id="main-content">
    <section class="tool-page">
      <div class="tool-page-header">
        <div class="tool-breadcrumb">
          <a href="/">Home</a>
          <span class="separator">â€º</span>
          <span>SEO Software Guides</span>
        </div>
        <h1 style="margin:0">SEO Software Guides and Content Clusters</h1>
        <p>Tooliest now includes a dedicated content hub for SEO software buyers. We started with full clusters for Semrush, Ahrefs, and Screaming Frog, then mapped the next wave of guides across all-in-one suites, content optimization platforms, technical SEO tools, and keyword research products.</p>
        <p style="margin-top:12px;color:var(--text-tertiary);font-size:0.92rem">These pages are designed to answer real decision questions like â€œWhich tool is worth the money?â€, â€œWhat is best for small teams?â€, and â€œWhat should I buy for a specific workflow?â€ in a more useful, less robotic way.</p>
      </div>
      <div class="tool-content-sections">
        <section class="tool-content-section">
          <h2>How this content hub is structured</h2>
          <ul>
            <li>Each published cluster starts with one pillar page that explains who the tool is for, where it shines, what it costs in time and budget, and where it feels limited.</li>
            <li>Every pillar page links into comparison articles so readers can make trade-offs with confidence instead of bouncing back to Google.</li>
            <li>Use-case articles answer narrower questions like whether a tool works for agencies, SaaS teams, local SEO, migrations, or content planning.</li>
            <li>The roadmap cards below show the next ${SOFTWARE_CLUSTER_OUTLINES.length} clusters we would publish to deepen topical authority around SEO software.</li>
          </ul>
        </section>
        ${categorySections}
        <section class="tool-content-section">
          <h2>Internal linking blueprint</h2>
          <p>Authority should flow from this hub into each tool pillar, then into every comparison article and use-case page. Comparison pages should link back to both tool pillars and forward into the most relevant use case so readers never hit a dead end.</p>
          <ul>
            <li>Pillar pages link to every comparison and use-case page in their cluster.</li>
            <li>Comparison pages link back to both tools, plus one recommended follow-up use case.</li>
            <li>Use-case pages link back to the pillar and one comparison page that helps the reader validate the choice.</li>
            <li>Cross-cluster pages like â€œbest SEO tools for agenciesâ€ should later link into Semrush, SE Ranking, AccuRanker, and Nightwatch.</li>
          </ul>
          <p>You can also pair these guides with Tooliestâ€™s own <a href="${getCategoryPath('seo')}">SEO tools</a> when users want to act on what they just learned instead of leaving the site to do the work elsewhere.</p>
        </section>
      </div>
    </section>
  </main>`;

  return renderPageShell({
    title: 'SEO Software Guides, Comparisons, and Content Clusters | Tooliest',
    description: 'Browse Tooliest SEO software guides covering Semrush, Ahrefs, Screaming Frog, and a roadmap of high-intent content clusters for SEO buyers.',
    canonicalPath: SOFTWARE_HUB_PATH,
    structuredData,
    mainContent,
    keywords: 'seo software guides, semrush review, ahrefs review, screaming frog guide, seo tool comparisons, content clusters',
    ogImagePath: '/og/site/software.svg',
    ogImageAlt: 'Tooliest SEO software guides preview card',
  });
}

function renderSoftwarePillarPage(cluster) {
  const category = getSoftwareCategory(cluster.category);
  const softwareLastModified = getSoftwareContentLastModifiedDate();
  const comparisonCards = renderSoftwareGuideCards(cluster.comparisons, (comparison) => `<article class="guide-card">
      <span class="guide-card-eyebrow">Comparison article</span>
      <h3><a href="${getSoftwareArticlePath(cluster.slug, comparison.slug)}">${escapeHtml(comparison.title)}</a></h3>
      <p>${escapeHtml(comparison.hook)}</p>
      <div class="guide-chip-row"><span class="guide-chip">${escapeHtml(comparison.targetQuery)}</span></div>
    </article>`);
  const useCaseCards = renderSoftwareGuideCards(cluster.useCases, (useCase) => `<article class="guide-card">
      <span class="guide-card-eyebrow">Use-case article</span>
      <h3><a href="${getSoftwareArticlePath(cluster.slug, useCase.slug)}">${escapeHtml(useCase.title)}</a></h3>
      <p>${escapeHtml(useCase.hook)}</p>
      <div class="guide-chip-row"><span class="guide-chip">${escapeHtml(useCase.targetQuery)}</span></div>
    </article>`);
  const relatedCards = renderSoftwareGuideCards(cluster.relatedSlugs.map((slug) => getSoftwareCluster(slug) || getSoftwareOutline(slug)).filter(Boolean), (related) => `<article class="guide-card guide-card-outline">
      <span class="guide-card-eyebrow">Related guide</span>
      <h3><a href="${getSoftwareGuideHref(related.slug)}">${escapeHtml(related.name)}</a></h3>
      <p>${escapeHtml(related.summary)}</p>
    </article>`);

  const structuredData = [
    {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: `${cluster.name} review and buying guide`,
      description: cluster.summary,
        author: { '@type': 'Organization', name: 'Tooliest' },
        publisher: { '@type': 'Organization', name: 'Tooliest', logo: { '@type': 'ImageObject', url: getAbsoluteUrl('/icon-512.png') } },
        datePublished: softwareLastModified,
        dateModified: softwareLastModified,
        mainEntityOfPage: getAbsoluteUrl(getSoftwareToolPath(cluster.slug)),
      },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: getAbsoluteUrl('/') },
        { '@type': 'ListItem', position: 2, name: 'SEO Software Guides', item: getAbsoluteUrl(SOFTWARE_HUB_PATH) },
        { '@type': 'ListItem', position: 3, name: cluster.name, item: getAbsoluteUrl(getSoftwareToolPath(cluster.slug)) },
      ],
    },
  ];

  const mainContent = `<main class="main-content" id="main-content">
    <section class="tool-page">
      <div class="tool-page-header">
        <div class="tool-breadcrumb">
          <a href="/">Home</a>
          <span class="separator">â€º</span>
          <a href="${SOFTWARE_HUB_PATH}">SEO Software Guides</a>
          <span class="separator">â€º</span>
          <span>${escapeHtml(cluster.name)}</span>
        </div>
        <h1 style="margin:0">${escapeHtml(cluster.name)} review: who it is really for, where it wins, and what to read next</h1>
        <p>${escapeHtml(cluster.hook)}</p>
        <p style="margin-top:12px;color:var(--text-tertiary);font-size:0.92rem">Category: ${escapeHtml(category.name)} Â· Best for: ${escapeHtml(cluster.bestFor)}</p>
      </div>
      <div class="tool-content-sections">
        <section class="tool-content-section">
          <h2>Quick take</h2>
          <p>${escapeHtml(cluster.summary)}</p>
          <p>${escapeHtml(cluster.pricing)}</p>
          <p><strong>Bottom line:</strong> ${escapeHtml(cluster.verdict)}</p>
        </section>
        <section class="tool-content-section">
          <h2>Who should use ${escapeHtml(cluster.name)}?</h2>
          <p><strong>Best for:</strong> ${escapeHtml(cluster.bestFor)}</p>
          <p><strong>Not ideal for:</strong> ${escapeHtml(cluster.notIdealFor)}</p>
          <div class="guide-two-col">
            <div>
              <h3>Strong fit</h3>
              <ul>${cluster.whoShouldUse.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul>
            </div>
            <div>
              <h3>Usually skip</h3>
              <ul>${cluster.whoShouldSkip.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul>
            </div>
          </div>
        </section>
        <section class="tool-content-section">
          <h2>Pros and tradeoffs</h2>
          <div class="guide-two-col">
            <div>
              <h3>What it does well</h3>
              <ul>${cluster.strengths.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul>
            </div>
            <div>
              <h3>Where it gets harder</h3>
              <ul>${cluster.tradeoffs.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul>
            </div>
          </div>
        </section>
        <section class="tool-content-section">
          <h2>A simple decision framework</h2>
          <ol>${cluster.decisionSteps.map((step) => `<li>${escapeHtml(step)}</li>`).join('')}</ol>
          <div class="guide-chip-row">${cluster.keywords.map((keyword) => `<span class="guide-chip">${escapeHtml(keyword)}</span>`).join('')}</div>
        </section>
        <section class="tool-content-section">
          <h2>Comparison articles</h2>
          <p>If you already know the shortlist, start here. These pages help readers decide faster instead of comparing screenshots and pricing tables in six browser tabs.</p>
          ${comparisonCards}
        </section>
        <section class="tool-content-section">
          <h2>Use-case articles</h2>
          <p>These pages go deeper on the jobs people actually hire the tool for, whether that is agency reporting, SaaS content planning, local SEO, migrations, or technical cleanup work.</p>
          ${useCaseCards}
        </section>
        <section class="tool-content-section">
          <h2>Related software guides</h2>
          ${relatedCards}
        </section>
      </div>
    </section>
  </main>`;

  return renderPageShell({
    title: `${cluster.name} Review, Alternatives, and Use Cases | Tooliest`,
    description: cluster.summary,
    canonicalPath: getSoftwareToolPath(cluster.slug),
    structuredData,
    mainContent,
    keywords: cluster.keywords.join(', '),
    ogImagePath: '/og/site/software.svg',
    ogImageAlt: `${cluster.name} guide preview card`,
  });
}

function renderSoftwareComparisonPage(cluster, comparison) {
  const softwareLastModified = getSoftwareContentLastModifiedDate();
  const structuredData = [
    {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: comparison.title,
      description: comparison.hook,
        author: { '@type': 'Organization', name: 'Tooliest' },
        publisher: { '@type': 'Organization', name: 'Tooliest', logo: { '@type': 'ImageObject', url: getAbsoluteUrl('/icon-512.png') } },
        datePublished: softwareLastModified,
        dateModified: softwareLastModified,
        mainEntityOfPage: getAbsoluteUrl(getSoftwareArticlePath(cluster.slug, comparison.slug)),
      },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: getAbsoluteUrl('/') },
        { '@type': 'ListItem', position: 2, name: 'SEO Software Guides', item: getAbsoluteUrl(SOFTWARE_HUB_PATH) },
        { '@type': 'ListItem', position: 3, name: cluster.name, item: getAbsoluteUrl(getSoftwareToolPath(cluster.slug)) },
        { '@type': 'ListItem', position: 4, name: comparison.title, item: getAbsoluteUrl(getSoftwareArticlePath(cluster.slug, comparison.slug)) },
      ],
    },
  ];

  const mainContent = `<main class="main-content" id="main-content">
    <section class="tool-page">
      <div class="tool-page-header">
        <div class="tool-breadcrumb">
          <a href="/">Home</a>
          <span class="separator">â€º</span>
          <a href="${SOFTWARE_HUB_PATH}">SEO Software Guides</a>
          <span class="separator">â€º</span>
          <a href="${getSoftwareToolPath(cluster.slug)}">${escapeHtml(cluster.name)}</a>
          <span class="separator">â€º</span>
          <span>${escapeHtml(comparison.title)}</span>
        </div>
        <h1 style="margin:0">${escapeHtml(comparison.title)}</h1>
        <p>${escapeHtml(comparison.hook)}</p>
        <p style="margin-top:12px;color:var(--text-tertiary);font-size:0.92rem">Search intent: ${escapeHtml(comparison.targetQuery)}</p>
      </div>
      <div class="tool-content-sections">
        <section class="tool-content-section">
          <h2>Quick answer</h2>
          <p>${escapeHtml(comparison.takeaway)}</p>
          <p>If you want the shorter version: choose ${escapeHtml(cluster.name)} when your workflow matches the strengths below. Choose ${escapeHtml(comparison.competitor)} when the opposite side of the tradeoff matters more.</p>
        </section>
        <section class="tool-content-section">
          <h2>When ${escapeHtml(cluster.name)} usually wins</h2>
          <ul>${comparison.toolWins.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul>
        </section>
        <section class="tool-content-section">
          <h2>When ${escapeHtml(comparison.competitor)} usually wins</h2>
          <ul>${comparison.competitorWins.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul>
        </section>
        <section class="tool-content-section">
          <h2>Decision framework</h2>
          <ol>${comparison.decisionFramework.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ol>
          <p>Still undecided? Go back to the <a href="${getSoftwareToolPath(cluster.slug)}">${escapeHtml(cluster.name)} pillar page</a> or compare it with the next closest guide in the cluster.</p>
        </section>
        <section class="tool-content-section">
          <h2>Next best pages to read</h2>
          ${renderSoftwareGuideCards(cluster.useCases.slice(0, 2), (useCase) => `<article class="guide-card">
            <span class="guide-card-eyebrow">Use-case follow-up</span>
            <h3><a href="${getSoftwareArticlePath(cluster.slug, useCase.slug)}">${escapeHtml(useCase.title)}</a></h3>
            <p>${escapeHtml(useCase.hook)}</p>
          </article>`)}
        </section>
      </div>
    </section>
  </main>`;

  return renderPageShell({
    title: `${comparison.title} | Tooliest`,
    description: comparison.takeaway,
    canonicalPath: getSoftwareArticlePath(cluster.slug, comparison.slug),
    structuredData,
    mainContent,
    keywords: `${comparison.targetQuery}, ${cluster.name.toLowerCase()}, ${comparison.competitor.toLowerCase()}, seo tool comparison`,
    ogImagePath: '/og/site/software.svg',
    ogImageAlt: `${comparison.title} preview card`,
  });
}

function renderSoftwareUseCasePage(cluster, useCase) {
  const softwareLastModified = getSoftwareContentLastModifiedDate();
  const structuredData = [
    {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: useCase.title,
      description: useCase.hook,
        author: { '@type': 'Organization', name: 'Tooliest' },
        publisher: { '@type': 'Organization', name: 'Tooliest', logo: { '@type': 'ImageObject', url: getAbsoluteUrl('/icon-512.png') } },
        datePublished: softwareLastModified,
        dateModified: softwareLastModified,
        mainEntityOfPage: getAbsoluteUrl(getSoftwareArticlePath(cluster.slug, useCase.slug)),
      },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: getAbsoluteUrl('/') },
        { '@type': 'ListItem', position: 2, name: 'SEO Software Guides', item: getAbsoluteUrl(SOFTWARE_HUB_PATH) },
        { '@type': 'ListItem', position: 3, name: cluster.name, item: getAbsoluteUrl(getSoftwareToolPath(cluster.slug)) },
        { '@type': 'ListItem', position: 4, name: useCase.title, item: getAbsoluteUrl(getSoftwareArticlePath(cluster.slug, useCase.slug)) },
      ],
    },
  ];

  const mainContent = `<main class="main-content" id="main-content">
    <section class="tool-page">
      <div class="tool-page-header">
        <div class="tool-breadcrumb">
          <a href="/">Home</a>
          <span class="separator">â€º</span>
          <a href="${SOFTWARE_HUB_PATH}">SEO Software Guides</a>
          <span class="separator">â€º</span>
          <a href="${getSoftwareToolPath(cluster.slug)}">${escapeHtml(cluster.name)}</a>
          <span class="separator">â€º</span>
          <span>${escapeHtml(useCase.title)}</span>
        </div>
        <h1 style="margin:0">${escapeHtml(useCase.title)}</h1>
        <p>${escapeHtml(useCase.hook)}</p>
        <p style="margin-top:12px;color:var(--text-tertiary);font-size:0.92rem">Audience focus: ${escapeHtml(useCase.audience)} Â· Search intent: ${escapeHtml(useCase.targetQuery)}</p>
      </div>
      <div class="tool-content-sections">
        <section class="tool-content-section">
          <h2>Why this workflow fits ${escapeHtml(cluster.name)}</h2>
          <ul>${useCase.whyItFits.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul>
        </section>
        <section class="tool-content-section">
          <h2>How to get started without wasting time</h2>
          <ol>${useCase.quickStart.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ol>
        </section>
        <section class="tool-content-section">
          <h2>What usually goes wrong</h2>
          <ul>${useCase.watchouts.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul>
          <p><strong>Takeaway:</strong> ${escapeHtml(useCase.takeaway)}</p>
        </section>
        <section class="tool-content-section">
          <h2>Related decision pages</h2>
          ${renderSoftwareGuideCards(cluster.comparisons.slice(0, 2), (comparison) => `<article class="guide-card">
            <span class="guide-card-eyebrow">Comparison article</span>
            <h3><a href="${getSoftwareArticlePath(cluster.slug, comparison.slug)}">${escapeHtml(comparison.title)}</a></h3>
            <p>${escapeHtml(comparison.hook)}</p>
          </article>`)}
        </section>
      </div>
    </section>
  </main>`;

  return renderPageShell({
    title: `${useCase.title} | Tooliest`,
    description: useCase.hook,
    canonicalPath: getSoftwareArticlePath(cluster.slug, useCase.slug),
    structuredData,
    mainContent,
    keywords: `${useCase.targetQuery}, ${cluster.name.toLowerCase()}, seo software, use case guide`,
    ogImagePath: '/og/site/software.svg',
    ogImageAlt: `${useCase.title} preview card`,
  });
}

function getMinifyInputMap(sourceFiles) {
  return sourceFiles
    .filter((file) => fs.existsSync(path.join(__dirname, file)))
    .reduce((inputs, file) => {
      inputs[file] = fs.readFileSync(path.join(__dirname, file), 'utf8');
      return inputs;
    }, {});
}

async function writeMinifiedJavascript(sourceFiles, outputFile) {
  const inputs = getMinifyInputMap(sourceFiles);
  const inputFiles = Object.keys(inputs);
  if (!inputFiles.length) {
    throw new Error(`No JavaScript sources found for ${outputFile}`);
  }

  const normalizedOutputFile = outputFile.replace(/\\/g, '/');
  const outputPath = path.join(__dirname, outputFile);
  const sourceMapFile = `${path.posix.basename(normalizedOutputFile)}.map?v=${ASSET_VERSION}`;
  const minified = await minify(inputs, {
    compress: true,
    mangle: true,
    format: { comments: false },
    sourceMap: {
      filename: normalizedOutputFile,
      url: sourceMapFile,
    },
  });

  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, minified.code);
  if (minified.map) {
    fs.writeFileSync(`${outputPath}.map`, minified.map);
  }
  console.log(`Created ${outputFile} from ${inputFiles.length} source file(s) (${(minified.code.length / 1024).toFixed(2)} KB)`);
}

async function bundleJavascript() {
  console.log('Bundling JavaScript...');
  // [TOOLIEST AUDIT] Ship the SPA core separately from secondary renderer chunks and emit source maps for debugging.
  await writeMinifiedJavascript(CORE_BUNDLE_FILES, BUNDLE_OUTPUT_FILE);
  for (const chunk of LAZY_RENDERER_CHUNKS) {
    await writeMinifiedJavascript(chunk.sourceFiles, chunk.outputFile);
  }
}

function writeToolPages(tools, categories) {
  console.log(`Generating ${tools.length} static tool pages...`);
  tools.forEach((tool) => {
    if (tool.standalonePage) {
      return;
    }
    const outputDir = path.join(__dirname, tool.id);
    fs.mkdirSync(outputDir, { recursive: true });
    fs.writeFileSync(path.join(outputDir, 'index.html'), renderToolPage(tool, tools, categories));
  });
}

function removeDirectoryIfExists(relativeDir) {
  const targetDir = path.join(__dirname, relativeDir);
  if (!fs.existsSync(targetDir)) return;
  // [TOOLIEST SEO] Remove deprecated generated routes so crawlers only see canonical server redirects.
  fs.rmSync(targetDir, { recursive: true, force: true });
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

function writeSoftwareContentPages() {
  console.log('Generating SEO software content hub...');
  const hubDir = path.join(__dirname, SOFTWARE_HUB_PATH.replace(/^\/+/, ''));
  fs.mkdirSync(hubDir, { recursive: true });
  fs.writeFileSync(path.join(hubDir, 'index.html'), renderSoftwareHubPage());

  SOFTWARE_CLUSTERS.forEach((cluster) => {
    const clusterDir = path.join(hubDir, cluster.slug);
    fs.mkdirSync(clusterDir, { recursive: true });
    fs.writeFileSync(path.join(clusterDir, 'index.html'), renderSoftwarePillarPage(cluster));

    cluster.comparisons.forEach((comparison) => {
      const articleDir = path.join(clusterDir, comparison.slug);
      fs.mkdirSync(articleDir, { recursive: true });
      fs.writeFileSync(path.join(articleDir, 'index.html'), renderSoftwareComparisonPage(cluster, comparison));
    });

    cluster.useCases.forEach((useCase) => {
      const articleDir = path.join(clusterDir, useCase.slug);
      fs.mkdirSync(articleDir, { recursive: true });
      fs.writeFileSync(path.join(articleDir, 'index.html'), renderSoftwareUseCasePage(cluster, useCase));
    });
  });
}

function renderRedirectsFile(tools, categories) {
  return [
    '# Canonical host redirects',
    'http://www.tooliest.com/*    https://tooliest.com/:splat    301!',
    'https://www.tooliest.com/*    https://tooliest.com/:splat    301!',
    '',
    '# Canonical URL cleanup',
    '/index.html    /    301!',
    '',
    '# Legacy tool URLs',
    '/tool/*    /:splat    301!',
    '',
    '# Search routes stay on the SPA shell.',
    '/search    /index.html    200',
    '/search/*    /index.html    200',
    '',
    '# Static files and generated routes are served directly by the host.',
    '# Unknown URLs should resolve to a real 404 page instead of the homepage shell.',
    '/*    /404.html    404',
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
  const softwareHeaders = [
    SOFTWARE_HUB_PATH,
    htmlPageCacheRule,
    '',
    ...SOFTWARE_CLUSTERS.flatMap((cluster) => [
      getSoftwareToolPath(cluster.slug),
      htmlPageCacheRule,
      '',
      ...cluster.comparisons.flatMap((comparison) => [
        getSoftwareArticlePath(cluster.slug, comparison.slug),
        htmlPageCacheRule,
        '',
      ]),
      ...cluster.useCases.flatMap((useCase) => [
        getSoftwareArticlePath(cluster.slug, useCase.slug),
        htmlPageCacheRule,
        '',
      ]),
    ]),
  ];

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
    `  Content-Security-Policy: ${CONTENT_SECURITY_POLICY}`,
    '',
    '# Static assets - aggressive caching',
    '/css/*',
    '  Cache-Control: public, max-age=31536000, immutable',
    '',
    '/js/*',
    '  Cache-Control: public, max-age=31536000, immutable',
    '',
    `/${BUNDLE_OUTPUT_FILE}`,
    '  Cache-Control: public, max-age=31536000, immutable',
    '',
    '/favicon*',
    '  Cache-Control: public, max-age=31536000, immutable',
    '',
    '/social-card*',
    '  Cache-Control: public, max-age=2592000',
    '',
    '/og/*',
    '  Cache-Control: public, max-age=31536000, immutable',
    '',
    '/manifest.json',
    '  Cache-Control: public, max-age=86400',
    '',
    INDEXNOW_KEY_LOCATION_PATH,
    '  Cache-Control: public, max-age=86400',
    '  Content-Type: text/plain; charset=utf-8',
    '',
    INDEXNOW_VERIFICATION_PATH,
    '  Cache-Control: public, max-age=86400',
    '  Content-Type: text/plain; charset=utf-8',
    '',
    '/sw.js',
    '  Cache-Control: no-cache, no-store',
    '',
    '/search',
    '  X-Robots-Tag: noindex, follow',
    '  Cache-Control: public, max-age=0, must-revalidate',
    '',
    '/search/*',
    '  X-Robots-Tag: noindex, follow',
    '  Cache-Control: public, max-age=0, must-revalidate',
    '',
    '# HTML pages',
    '/index.html',
    '  Cache-Control: public, max-age=0, must-revalidate',
    '',
    '/404.html',
    '  Cache-Control: public, max-age=0, must-revalidate',
    '  X-Robots-Tag: noindex, follow',
    '',
    ...cleanStaticPageHeaders,
    ...categoryHeaders,
    ...toolHeaders,
    ...softwareHeaders,
    '/tool/*',
    htmlPageCacheRule,
    '',
    '/sitemap.html',
    htmlPageCacheRule,
    '',
    '/sitemap.xml',
    '  Cache-Control: public, max-age=86400',
    '  Content-Type: application/xml',
    '',
    '/sitemap-main.xml',
    '  Cache-Control: public, max-age=86400',
    '  Content-Type: application/xml',
    '',
    '/sitemap-tools.xml',
    '  Cache-Control: public, max-age=86400',
    '  Content-Type: application/xml',
    '',
    '/sitemap-categories.xml',
    '  Cache-Control: public, max-age=86400',
    '  Content-Type: application/xml',
    '',
    '/sitemap-software.xml',
    '  Cache-Control: public, max-age=86400',
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

function write404Page() {
  console.log('Generating 404 page...');
  const structuredData = [
    {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      name: 'Tooliest page not found',
      url: getAbsoluteUrl('/404.html'),
      description: 'This Tooliest page could not be found. Browse the homepage, categories, or tool directory instead.',
    },
  ];

  const mainContent = `<main class="main-content" id="main-content">
    <section class="tool-page">
      <div class="tool-page-header">
        <div class="tool-breadcrumb">
          <a href="/">Home</a>
          <span class="separator">></span>
          <span>404</span>
        </div>
        <h1 style="margin:0">That page could not be found</h1>
        <p>The URL may be outdated, mistyped, or removed. You can still jump back into Tooliest from the links below.</p>
      </div>
      <div class="tool-content-sections">
        <section class="tool-content-section">
          <h2>Try one of these next steps</h2>
          <ul>
            <li><a href="/">Browse the homepage</a> to search across every free online tool.</li>
            <li><a href="/sitemap.html">Open the HTML sitemap</a> for a crawlable directory of all categories and tools.</li>
            <li><a href="${getCategoryPath('seo')}">Visit SEO tools</a> if you were looking for metadata, robots, schema, or sitemap helpers.</li>
            <li><a href="${STATIC_PAGE_PATHS.contact}">Contact Tooliest</a> if you found a broken link we should fix.</li>
          </ul>
        </section>
      </div>
    </section>
  </main>`;

  const html = renderPageShell({
    title: 'Page Not Found | Tooliest',
    description: 'The page you requested could not be found on Tooliest. Browse the homepage, sitemap, or categories to keep exploring.',
    canonicalPath: '/404.html',
    structuredData,
    mainContent,
    keywords: '404, page not found, tooliest',
    ogImagePath: '/og/site/home.svg',
    ogImageAlt: 'Tooliest page not found preview card',
    robots: 'noindex, follow',
  });

  fs.writeFileSync(path.join(__dirname, '404.html'), html);
}

function writeSitemap(tools, categories) {
  console.log('Generating sitemap index and child sitemaps...');
  const staticPages = [
    { loc: getAbsoluteUrl('/'), priority: '1.0', changefreq: 'weekly', lastmod: getSiteLastModifiedDate() },
    { loc: getAbsoluteUrl(STATIC_PAGE_PATHS.about), priority: '0.7', changefreq: 'monthly', lastmod: getStaticPageLastModifiedDate('about.html') },
    { loc: getAbsoluteUrl(STATIC_PAGE_PATHS.contact), priority: '0.5', changefreq: 'monthly', lastmod: getStaticPageLastModifiedDate('contact.html') },
    { loc: getAbsoluteUrl(STATIC_PAGE_PATHS.privacy), priority: '0.3', changefreq: 'yearly', lastmod: getStaticPageLastModifiedDate('privacy.html') },
    { loc: getAbsoluteUrl(STATIC_PAGE_PATHS.terms), priority: '0.3', changefreq: 'yearly', lastmod: getStaticPageLastModifiedDate('terms.html') },
    { loc: getAbsoluteUrl('/sitemap.html'), priority: '0.4', changefreq: 'monthly', lastmod: getSourceModifiedDate(['build.js', 'js/tools.js']) },
  ];

  const categoryPages = getRenderableCategories(categories).map((category) => ({
    loc: getAbsoluteUrl(getCategoryPath(category.id)),
    priority: '0.65',
    changefreq: 'monthly',
    lastmod: getCategoryLastModifiedDate(category.id, tools),
  }));

  const toolPages = tools.map((tool) => ({
    loc: getAbsoluteUrl(getToolPath(tool.id)),
    priority: '0.75',
    changefreq: 'weekly',
    lastmod: getToolLastModifiedDate(tool),
  }));

  const softwarePages = [
    {
      loc: getAbsoluteUrl(SOFTWARE_HUB_PATH),
      priority: '0.75',
      changefreq: 'weekly',
      lastmod: getSoftwareContentLastModifiedDate(),
    },
    ...SOFTWARE_CLUSTERS.flatMap((cluster) => ([
      {
        loc: getAbsoluteUrl(getSoftwareToolPath(cluster.slug)),
        priority: '0.7',
        changefreq: 'monthly',
        lastmod: getSoftwareContentLastModifiedDate(),
      },
      ...cluster.comparisons.map((comparison) => ({
        loc: getAbsoluteUrl(getSoftwareArticlePath(cluster.slug, comparison.slug)),
        priority: '0.62',
        changefreq: 'monthly',
        lastmod: getSoftwareContentLastModifiedDate(),
      })),
      ...cluster.useCases.map((useCase) => ({
        loc: getAbsoluteUrl(getSoftwareArticlePath(cluster.slug, useCase.slug)),
        priority: '0.6',
        changefreq: 'monthly',
        lastmod: getSoftwareContentLastModifiedDate(),
      })),
    ])),
  ];

  const sitemapFiles = [
    writeSitemapUrlFile('sitemap-main.xml', staticPages),
    writeSitemapUrlFile('sitemap-tools.xml', toolPages),
    writeSitemapUrlFile('sitemap-categories.xml', categoryPages),
    writeSitemapUrlFile('sitemap-software.xml', softwarePages),
  ];

  const sitemapIndex = `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${sitemapFiles.map((entry) => `  <sitemap>\n    <loc>${escapeXml(entry.loc)}</loc>\n    <lastmod>${escapeXml(entry.lastmod)}</lastmod>\n  </sitemap>`).join('\n')}\n</sitemapindex>\n`;
  fs.writeFileSync(path.join(__dirname, 'sitemap.xml'), sitemapIndex);

  return [...staticPages, ...categoryPages, ...toolPages, ...softwarePages].map((entry) => entry.loc);
}

function writeHtmlSitemap(tools, categories) {
  console.log('Generating HTML sitemap page...');
  const renderableCategories = getRenderableCategories(categories);
  const sitemapLastModified = getSourceModifiedDate(['build.js', 'js/tools.js']);
  const renderSitemapToolLabel = (tool) => {
    const icon = String(tool.icon || '').trim();
    const shouldShowIcon = icon && /[^\u0000-\u007F]/.test(icon);
    return `${shouldShowIcon ? `${escapeHtml(icon)} ` : ''}${escapeHtml(tool.name)}`;
  };
  const staticBlock = `<div class="sitemap-category">
      <h2><a href="/">Site Pages</a> <span style="color:var(--text-tertiary);font-size:0.85rem;font-weight:400">(6 pages)</span></h2>
      <ul>
        <li><a href="/">Homepage</a> - Browse every free online tool from the main Tooliest directory.</li>
        <li><a href="${STATIC_PAGE_PATHS.about}">About</a> - Learn how Tooliest works, how the site stays free, and why privacy matters here.</li>
        <li><a href="${STATIC_PAGE_PATHS.contact}">Contact</a> - Reach the Tooliest team with support questions, bug reports, or tool ideas.</li>
        <li><a href="${STATIC_PAGE_PATHS.privacy}">Privacy Policy</a> - Review browser storage, optional cookies, ads, and data-handling details.</li>
        <li><a href="${STATIC_PAGE_PATHS.terms}">Terms of Service</a> - Read the usage terms for Tooliest tools and site content.</li>
        <li><a href="/sitemap.html">HTML Sitemap</a> - Browse all tools, categories, and guide hubs from one crawlable page.</li>
      </ul>
    </div>`;
  const softwareBlock = `<div class="sitemap-category">
      <h2><a href="${SOFTWARE_HUB_PATH}">ðŸ§­ SEO Software Guides</a> <span style="color:var(--text-tertiary);font-size:0.85rem;font-weight:400">(${SOFTWARE_CLUSTERS.length} published clusters)</span></h2>
      <ul>${SOFTWARE_CLUSTERS.map((cluster) => `<li><a href="${getSoftwareToolPath(cluster.slug)}">${escapeHtml(cluster.name)}</a> - ${escapeHtml(cluster.summary)}</li>`).join('')}</ul>
    </div>`;
  const categoryBlocks = renderableCategories.map(cat => {
    const catTools = getCategoryTools(tools, cat.id);
    return `<div class="sitemap-category">
      <h2><a href="${getCategoryPath(cat.id)}">${cat.icon} ${escapeHtml(cat.name)}</a> <span style="color:var(--text-tertiary);font-size:0.85rem;font-weight:400">(${catTools.length} tools)</span></h2>
      <ul>${catTools.map(t => `<li><a href="${getToolPath(t.id)}">${renderSitemapToolLabel(t)}</a> â€” ${escapeHtml(t.description.slice(0, 80))}</li>`).join('')}</ul>
    </div>`;
  }).join('');

  const mainContent = `<main class="main-content" id="main-content">
    <div class="tool-page">
      <div class="tool-page-header">
        <div class="tool-breadcrumb">
          <a href="/">Home</a>
          <span class="separator">â€º</span>
          <span>All Tools</span>
        </div>
        <h1 style="margin:0">ðŸ—ºï¸ All Tooliest Tools</h1>
        <p>Browse every free online tool on Tooliest, organized by category. ${tools.length} tools across ${renderableCategories.length} categories, plus software guides and company pages.</p>
      </div>
      <div class="tool-content-sections">
        ${staticBlock}
        ${softwareBlock}
        ${categoryBlocks}
      </div>
    </div>
  </main>`;

  const structuredData = [
    {
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      name: 'All Tooliest Tools â€” HTML Sitemap',
      url: getAbsoluteUrl('/sitemap.html'),
      description: `Browse all ${tools.length} free online tools on Tooliest organized by category.`,
      dateModified: sitemapLastModified,
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
    title: `All ${tools.length}+ Free Online Tools â€” Tooliest Sitemap`,
    description: `Browse every free online tool on Tooliest. ${tools.length} browser-based tools across ${renderableCategories.length} categories, plus company pages and SEO software guides.`,
    canonicalPath: '/sitemap.html',
    structuredData,
    mainContent,
    keywords: 'all tools, free online tools, tooliest sitemap, tool directory, browser tools',
    ogImagePath: '/og/site/home.svg',
    ogImageAlt: 'Tooliest sitemap preview showing the full tool directory',
  });

  fs.writeFileSync(path.join(__dirname, 'sitemap.html'), html);
}

function writeHomePage(tools, categories) {
  console.log('Generating pre-rendered index.html...');
  const renderableCategories = getRenderableCategories(categories);
  const featuredTools = getStaticHomeFeaturedTools(tools);
  const siteLastModified = getSiteLastModifiedDate();

  const categoryTabsHtml = renderableCategories.map(cat =>
    `<a href="${getCategoryPath(cat.id)}" class="category-tab${cat.id === 'all' ? ' active' : ''}" data-category="${cat.id}" aria-current="${cat.id === 'all' ? 'page' : 'false'}">${cat.icon} ${escapeHtml(cat.name)} <span class="tab-count">${cat.count}</span></a>`
  ).join('');

  const toolCardsHtml = featuredTools.map(tool => renderStaticToolCard(tool, categories)).join('');
  const crawlableDirectoryHtml = `<section class="tools-section" aria-labelledby="browse-all-tools-heading">
      <div class="tool-content-sections">
        <section class="tool-content-section">
          <h2 id="browse-all-tools-heading">Browse All Tools by Category</h2>
          <p>Every category below links to crawlable tool pages, so you can jump straight to the exact browser-based workflow you need without waiting for client-side search.</p>
        </section>
        ${renderableCategories.map((category) => {
          const categoryTools = getCategoryTools(tools, category.id);
          return `<section class="tool-content-section">
            <h2><a href="${getCategoryPath(category.id)}">${escapeHtml(category.name)}</a></h2>
            <p>${categoryTools.length} tools in this category, including ${escapeHtml(categoryTools.slice(0, 3).map((tool) => tool.name).join(', '))}.</p>
            <ul>${categoryTools.map((tool) => `<li><a href="${getToolPath(tool.id)}">${escapeHtml(tool.name)}</a> Ã¢â‚¬â€ ${escapeHtml(tool.meta?.desc || tool.description)}</li>`).join('')}</ul>
          </section>`;
        }).join('')}
      </div>
    </section>`;
  const structuredData = [
    {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: 'Tooliest',
      url: 'https://tooliest.com',
      description: `${tools.length}+ free online tools for developers, designers, writers, and marketers.`,
      potentialAction: {
        '@type': 'SearchAction',
        target: {
          '@type': 'EntryPoint',
          urlTemplate: 'https://tooliest.com/?q={search_term_string}',
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
        dateModified: siteLastModified,
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
      description: 'A free, browser-based platform with online tools for developers, designers, writers, marketers, and document workflows.',
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
      name: 'Tooliest â€” Free Online Tools',
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
        <h1>Every Tool You Need.<br><span class="gradient-text">${tools.length}+ Free Online Tools â€” Zero Installs.</span></h1>
        <p>Free online tools for developers, designers, writers, and marketers. Private, fast, and ready in one tab so you can search, launch, and finish faster with Tooliest.</p>
        <div class="hero-stats">
          <div class="hero-stat"><div class="stat-value">1</div><div class="stat-label">Tab Needed</div></div>
          <div class="hero-stat"><div class="stat-value">${renderableCategories.length}</div><div class="stat-label">Categories</div></div>
          <div class="hero-stat"><div class="stat-value">0</div><div class="stat-label">Signups Needed</div></div>
        </div>
        <div class="hero-trust-strip" aria-label="Tooliest trust highlights">
          <span class="trust-badge">ðŸ”’ 100% Private â€” No Uploads</span>
          <span class="trust-badge">âš¡ Instant Browser Results</span>
          <span class="trust-badge">ðŸ“² PWA Ready + Offline Support</span>
          <span class="trust-badge">ðŸ§­ No Account Friction</span>
        </div>
      </section>
    <section class="categories-section">
      <div class="category-tabs" id="category-tabs">${categoryTabsHtml}</div>
      <p class="category-scroll-indicator" id="category-scroll-indicator" aria-hidden="true">Swipe to see more categories â†’</p>
    </section>
    <section class="tools-section"><div class="tools-grid" id="tools-grid">${toolCardsHtml}</div></section>
    ${crawlableDirectoryHtml}
  </main>`;

  const html = renderPageShell({
    title: `Tooliest â€” ${tools.length}+ Free Online Tools Powered by AI`,
    description: `Access ${tools.length}+ free online tools for text, SEO, CSS, colors, images, JSON, encoding, math, and more. No signup required. Start free with Tooliest today.`,
    canonicalPath: '/',
    structuredData,
    mainContent,
    keywords: 'free online tools, text tools, SEO tools, CSS generator, color picker, JSON formatter, image compressor, AI tools, developer tools, converter tools, tooliest',
    ogImagePath: '/og/site/home.svg',
    ogImageAlt: 'Tooliest homepage social preview with free online tools',
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
  console.log(`Minified CSS: ${(raw.length / 1024).toFixed(1)} KB â†’ ${(minified.length / 1024).toFixed(1)} KB (${savings}% smaller)`);
}

async function build() {
  const { tools, categories } = readTools();
  validateToolRoutes(tools);
  await bundleJavascript();
  minifyCSSFile();
  removeDirectoryIfExists('tool');
  syncStaticPageAssetVersions();
  writeOgAssets(tools, categories);
  writeIndexNowKeyFiles();
  writeRoutingFiles(tools, categories);
  write404Page();
  writeCleanStaticPages();
  writeHomePage(tools, categories);
  writeToolPages(tools, categories);
  writeCategoryPages(tools, categories);
  writeSoftwareContentPages();
  writeHtmlSitemap(tools, categories);
  const sitemapUrls = writeSitemap(tools, categories);
  await submitIndexNow(sitemapUrls);
  console.log('Build complete.');
}

build().catch((error) => {
  console.error('Build failed:', error);
  process.exitCode = 1;
});



