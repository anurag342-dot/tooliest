const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.resolve(__dirname, '..');
const TOOLS_JS_PATH = path.join(ROOT, 'js', 'tools.js');
const RESUME_PAGE_PATH = path.join(ROOT, 'resume-builder', 'index.html');

function loadToolRegistry() {
  const source = fs.readFileSync(TOOLS_JS_PATH, 'utf8');
  const sandbox = {
    console,
    localStorage: {
      getItem: () => '[]',
      setItem: () => {},
      removeItem: () => {},
    },
    window: {},
    document: {},
  };

  sandbox.globalThis = sandbox;
  vm.createContext(sandbox);
  const script = new vm.Script(`${source}\n;globalThis.__TOOLS = TOOLS;`);
  script.runInContext(sandbox);
  return sandbox.__TOOLS || [];
}

function escapeHtml(value = '') {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/\u2014/g, '&mdash;')
    .replace(/\u2013/g, '&ndash;');
}

function escapeAttr(value = '') {
  return escapeHtml(value).replace(/`/g, '&#96;');
}

function replaceOrThrow(html, pattern, replacement, label) {
  if (!pattern.test(html)) {
    throw new Error(`Could not find ${label} in resume-builder/index.html`);
  }
  return html.replace(pattern, replacement);
}

function main() {
  const tool = loadToolRegistry().find((candidate) => candidate.id === 'resume-builder');
  if (!tool) {
    throw new Error('Could not find resume-builder in js/tools.js');
  }

  const contentSectionsHtml = String(tool.contentSectionsHtml || '').trim();
  if (!contentSectionsHtml) {
    throw new Error('resume-builder contentSectionsHtml is empty');
  }

  const faqCount = (contentSectionsHtml.match(/<details class="faq-item">/g) || []).length;
  if (faqCount !== 9) {
    throw new Error(`Expected 9 resume-builder FAQs, found ${faqCount}`);
  }

  const metaDescription = tool.meta && tool.meta.desc ? tool.meta.desc : tool.description;
  const subtitle = tool.description;
  const articleHtml = `<article class="tool-article">
    <div class="tool-content-sections">
      ${contentSectionsHtml}
    </div>
  </article>`;

  const originalHtml = fs.readFileSync(RESUME_PAGE_PATH, 'utf8');
  let nextHtml = originalHtml;

  nextHtml = replaceOrThrow(
    nextHtml,
    /<meta name="description" content="[^"]*">/,
    `<meta name="description" content="${escapeAttr(metaDescription)}">`,
    'meta description'
  );
  nextHtml = replaceOrThrow(
    nextHtml,
    /<meta property="og:description" content="[^"]*">/,
    `<meta property="og:description" content="${escapeAttr(metaDescription)}">`,
    'Open Graph description'
  );
  nextHtml = replaceOrThrow(
    nextHtml,
    /<meta name="twitter:description" content="[^"]*">/,
    `<meta name="twitter:description" content="${escapeAttr(metaDescription)}">`,
    'Twitter description'
  );
  nextHtml = replaceOrThrow(
    nextHtml,
    /(<div class="tool-page-header">[\s\S]*?<p>)[\s\S]*?(<\/p>\s*<p class="tool-last-updated")/,
    `$1${escapeHtml(subtitle)}$2`,
    'page subtitle'
  );
  nextHtml = replaceOrThrow(
    nextHtml,
    /<article class="tool-article">[\s\S]*?<\/article>/,
    articleHtml,
    'tool article content'
  );

  if (nextHtml !== originalHtml) {
    fs.writeFileSync(RESUME_PAGE_PATH, nextHtml);
  }

  console.log(`Normalized resume-builder page with ${faqCount} FAQs.`);
}

main();
