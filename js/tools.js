// ============================================
// TOOLIEST.COM — Tool Registry & Implementations
// 80+ tools across 16 categories
// ============================================

const TOOL_CATEGORIES = [
  { id: 'all', name: 'All Tools', icon: '🔥', count: 0 },
  { id: 'favorites', name: 'Favorites', icon: '⭐', count: 0 },
  { id: 'text', name: 'Text Tools', icon: '📝', count: 0 },
  { id: 'seo', name: 'SEO Tools', icon: '🔍', count: 0 },
  { id: 'css', name: 'CSS Tools', icon: '🎨', count: 0 },
  { id: 'color', name: 'Color Tools', icon: '🌈', count: 0 },
  { id: 'image', name: 'Image Tools', icon: '🖼️', count: 0 },
  { id: 'json', name: 'JSON Tools', icon: '📋', count: 0 },
  { id: 'html', name: 'HTML Tools', icon: '🌐', count: 0 },
  { id: 'javascript', name: 'JavaScript Tools', icon: '⚡', count: 0 },
  { id: 'converter', name: 'Converters', icon: '🔄', count: 0 },
  { id: 'encoding', name: 'Encoding Tools', icon: '🔐', count: 0 },
  { id: 'finance', name: 'Finance Tools', icon: '💰', count: 0 },
  { id: 'math', name: 'Math Tools', icon: '🧮', count: 0 },
  { id: 'social', name: 'Social Media', icon: '📱', count: 0 },
  { id: 'privacy', name: 'Privacy Tools', icon: '🛡️', count: 0 },
  { id: 'ai', name: 'AI Tools', icon: '🤖', count: 0 },
  { id: 'developer', name: 'Developer Tools', icon: '💻', count: 0 },
];

const TOOLS = [
  // ===== TEXT TOOLS =====
  {
    id: 'word-counter',
    name: 'Word Counter',
    description: 'Count words, characters, sentences, and paragraphs with readability analysis.',
    category: 'text',
    icon: '📊',
    tags: ['word count', 'character count', 'readability'],
    isAI: false,
    education: '<strong>What is Read Time?</strong><br>Standard reading speed is calculated at roughly 200 to 250 words per minute. This metric helps content creators gauge how long it takes an average user to consume their blog post or article, which directly impacts SEO dwell time. Tooliest\'s word counter also calculates a Flesch-Kincaid readability score, giving you an objective grade level for your writing. Lower scores mean simpler language that reaches a broader audience, which is critical for web content, marketing copy, and technical documentation alike.',
    whyUse: ['Get instant word, character, sentence, and paragraph counts without uploading files', 'Estimate reading time to improve user engagement and SEO dwell time', 'Check readability scores to ensure your content matches your target audience\'s level', 'Works 100% offline — your text never leaves your browser'],
    whoUses: 'Content writers, bloggers, students, SEO professionals, social media managers, and technical writers who need to meet word count requirements or optimize readability.',
    faq: [
      { q: 'How many words is a typical blog post?', a: 'A short blog post is 300-600 words, a standard post is 1,000-1,500 words, and long-form SEO content is typically 2,000-3,000+ words. Longer content tends to rank higher in search engines when it provides comprehensive value.' },
      { q: 'What is a good readability score?', a: 'A Flesch Reading Ease score of 60-70 is considered ideal for general web content. Scores above 70 are easy to read (suitable for a broad audience), while scores below 50 are difficult and more suited for academic or technical writing.' },
      { q: 'Does this word counter work offline?', a: 'Yes. Tooliest\'s word counter runs entirely in your browser using JavaScript. Once the page is loaded, it works without an internet connection and your text is never sent to any server.' }
    ],
    meta: { title: 'Free Word Counter Tool - Count Words, Characters & Sentences | Tooliest', desc: 'Count words, characters, sentences, and paragraphs instantly. Free online word counter with reading time and readability score.' }
  },
  {
    id: 'character-counter',
    name: 'Character Counter',
    description: 'Count characters with and without spaces. Perfect for social media limits.',
    category: 'text',
    icon: '🔤',
    tags: ['character count', 'twitter', 'social media'],
    isAI: false,
    education: '<strong>Why character limits matter</strong><br>Social media platforms enforce strict character limits: Twitter/X allows 280 characters, Instagram bios are capped at 150, and meta descriptions perform best under 160 characters. Exceeding these limits means your message gets truncated, losing impact and engagement. This character counter helps you stay within platform limits while maximizing your message.',
    whyUse: ['Check character counts for Twitter, Instagram, LinkedIn, and other platforms', 'Count with or without spaces to meet different formatting requirements', 'Ensure meta descriptions and title tags stay within SEO best-practice limits'],
    whoUses: 'Social media managers, SEO professionals, copywriters, and anyone who needs to fit their message within strict character limits.',
    faq: [
      { q: 'What is the Twitter/X character limit?', a: 'Twitter/X allows up to 280 characters per tweet for standard accounts. Twitter Blue subscribers can post up to 25,000 characters. URLs count toward the limit.' },
      { q: 'How long should a meta description be?', a: 'Google typically displays 150-160 characters of a meta description in search results. Keep your descriptions under 160 characters to avoid truncation.' }
    ],
    meta: { title: 'Character Counter - Count Characters Online Free | Tooliest', desc: 'Free character counter tool. Count characters with or without spaces. Check social media character limits for Twitter, Instagram, and more.' }
  },
  {
    id: 'case-converter',
    name: 'Text Case Converter',
    description: 'Convert text to UPPERCASE, lowercase, Title Case, camelCase, and more.',
    category: 'text',
    icon: 'Aa',
    tags: ['uppercase', 'lowercase', 'title case', 'camelCase'],
    isAI: false,
    education: '<strong>Text case formats explained</strong><br>Different contexts require different text cases. <em>Title Case</em> capitalizes the first letter of each major word and is standard for headlines. <em>camelCase</em> and <em>PascalCase</em> are naming conventions in programming. <em>snake_case</em> uses underscores between words and is common in Python and database naming. This converter handles all common formats instantly.',
    whyUse: ['Convert between 8+ text case formats in one click', 'Clean up inconsistent capitalization in bulk text', 'Generate code-ready variable names in camelCase, snake_case, or kebab-case'],
    whoUses: 'Developers, content editors, data analysts, and designers who need consistent text formatting across codebases, documents, or design systems.',
    faq: [
      { q: 'What is Title Case?', a: 'Title Case capitalizes the first letter of each major word in a sentence, while leaving minor words (like "and", "or", "the") in lowercase. It is the standard format for headlines, book titles, and article titles.' },
      { q: 'What is camelCase used for?', a: 'camelCase is a naming convention where the first word is lowercase and each subsequent word starts with an uppercase letter (e.g., myVariableName). It is widely used in JavaScript, Java, and TypeScript for variable and function names.' }
    ],
    meta: { title: 'Text Case Converter - UPPER, lower, Title Case Free | Tooliest', desc: 'Convert text between uppercase, lowercase, title case, sentence case, camelCase, snake_case and more. Free online tool.' }
  },
  {
    id: 'lorem-ipsum',
    name: 'Lorem Ipsum Generator',
    description: 'Generate placeholder text in words, sentences, or paragraphs.',
    category: 'text',
    icon: '📄',
    tags: ['placeholder', 'dummy text', 'lorem ipsum'],
    isAI: false,
    education: '<strong>What is Lorem Ipsum?</strong><br>Lorem Ipsum is dummy text derived from a 1st-century Latin treatise by Cicero. Designers and developers have used it since the 1500s as placeholder content for layouts. It approximates the natural distribution of letters in English, making it useful for previewing typography and page structure without meaningful content distracting reviewers.',
    whyUse: ['Generate realistic-looking placeholder text for design mockups', 'Choose exact word, sentence, or paragraph counts', 'Preview typography and layout without writing real content first'],
    whoUses: 'Web designers, UI/UX designers, front-end developers, print designers, and anyone creating mockups, wireframes, or prototypes that need realistic text content.',
    faq: [
      { q: 'Where does Lorem Ipsum come from?', a: 'Lorem Ipsum originates from sections 1.10.32 and 1.10.33 of "de Finibus Bonorum et Malorum" (The Extremes of Good and Evil) by Cicero, written in 45 BC. The standard Lorem Ipsum passage has been used since the 1500s.' },
      { q: 'Should I use Lorem Ipsum on a live website?', a: 'No. Lorem Ipsum should only be used during the design and development phase. Publishing Lorem Ipsum on a live website looks unprofessional and can negatively impact your SEO since search engines may flag it as thin or low-quality content.' }
    ],
    meta: { title: 'Lorem Ipsum Generator - Free Placeholder Text | Tooliest', desc: 'Generate lorem ipsum placeholder text. Choose words, sentences or paragraphs. Perfect for mockups and design projects.' }
  },
  {
    id: 'text-reverser',
    name: 'Text Reverser',
    description: 'Reverse text, words, or each word individually.',
    category: 'text',
    icon: '🔁',
    tags: ['reverse text', 'backwards', 'mirror'],
    isAI: false,
    education: '<strong>How text reversal works</strong><br>Text reversal can operate at three levels: reversing the entire character sequence (mirror text), reversing word order while keeping individual words intact, or reversing characters within each word. Mirror text is used for creative effects, puzzles, and social media posts. Reverse word order is useful for data manipulation and linguistic analysis.',
    whyUse: ['Create mirror text for social media, puzzles, or creative projects', 'Reverse word order for data processing or linguistic experiments', 'Instantly reverse any text without manual effort'],
    whoUses: 'Social media users, puzzle creators, linguists, data analysts, and developers who need to reverse strings for testing.',
    faq: [
      { q: 'How do I write text backwards?', a: 'Paste your text into the Text Reverser tool, select "Reverse entire text," and click Run. The tool will output your text with all characters in reverse order, creating a mirror effect.' }
    ],
    meta: { title: 'Reverse Text Online - Free Text Reverser Tool | Tooliest', desc: 'Reverse your text instantly. Reverse entire text, individual words, or word order. Free online text reverser tool.' }
  },
  {
    id: 'remove-duplicates',
    name: 'Remove Duplicate Lines',
    description: 'Remove duplicate lines from text. Keep unique lines only.',
    category: 'text',
    icon: '✂️',
    tags: ['duplicates', 'unique lines', 'clean text'],
    isAI: false,
    education: '<strong>Deduplication in data processing</strong><br>Removing duplicate lines is a fundamental data-cleaning operation used in log analysis, CSV preparation, email list management, and content auditing. This tool keeps only unique lines from your input, optionally sorting the results. It processes everything locally in your browser, making it safe for sensitive data like email lists or internal logs.',
    whyUse: ['Clean email lists, CSV data, or log files by removing duplicate entries', 'Sort results alphabetically after deduplication', 'Process sensitive data safely — nothing is uploaded'],
    whoUses: 'Data analysts, system administrators, email marketers, QA engineers, and content managers who need to deduplicate text-based data.',
    faq: [
      { q: 'How do I remove duplicate lines from a text file?', a: 'Paste your text into the Remove Duplicate Lines tool. It will automatically identify and remove any repeated lines, keeping only unique entries. You can optionally sort the results alphabetically.' }
    ],
    meta: { title: 'Remove Duplicate Lines - Free Online Deduplicator | Tooliest', desc: 'Remove duplicate lines from text instantly. Keep only unique lines, sort results, and clean up your text data.' }
  },
  {
    id: 'slug-generator',
    name: 'Text to URL Slug',
    description: 'Convert any text into a clean, SEO-friendly URL slug.',
    category: 'text',
    icon: '🔗',
    tags: ['slug', 'url', 'seo', 'permalink'],
    isAI: false,
    education: '<strong>What is a URL slug?</strong><br>A URL slug is the human-readable portion of a web address that identifies a specific page. For example, in <code>example.com/blog/seo-best-practices</code>, the slug is <code>seo-best-practices</code>. Good slugs are short, descriptive, use hyphens to separate words, and include target keywords. Clean slugs improve click-through rates in search results and make URLs shareable.',
    whyUse: ['Generate SEO-optimized URL slugs from any title or heading', 'Automatically remove special characters, accents, and extra spaces', 'Create consistent permalink structures for blog posts and web pages'],
    whoUses: 'Bloggers, content managers, SEO professionals, and web developers who need clean, consistent URL structures for their websites.',
    faq: [
      { q: 'What makes a good URL slug for SEO?', a: 'A good SEO slug is short (3-5 words), includes a target keyword, uses hyphens to separate words, avoids stop words like "the" or "and," and is entirely lowercase. For example, "best-seo-tools-2026" is better than "the-best-seo-tools-for-your-website-in-2026."' },
      { q: 'Should URL slugs contain numbers?', a: 'Numbers are fine in slugs when relevant (e.g., product IDs or year references), but avoid them if the content may be updated, as the number could become outdated.' }
    ],
    meta: { title: 'URL Slug Generator - Create SEO-Friendly Slugs | Tooliest', desc: 'Convert text to clean URL slugs. Create SEO-friendly permalinks for your blog posts and web pages. Free online slug generator.' }
  },
  {
    id: 'string-encoder',
    name: 'String Encoder/Decoder',
    description: 'Encode and decode strings with Base64, URL encoding, HTML entities, and more.',
    category: 'text',
    icon: '🔣',
    tags: ['encode', 'decode', 'base64', 'url encode'],
    isAI: false,
    education: '<strong>Understanding string encoding</strong><br>String encoding converts characters into a specific format for safe transmission across different systems. Base64 encodes binary data as ASCII text, URL encoding replaces unsafe characters with percent-encoded equivalents, and HTML entity encoding prevents XSS attacks by escaping special characters. Each format serves a specific purpose in web development and data interchange.',
    whyUse: ['Encode and decode between multiple formats in a single tool', 'Debug encoded URLs, API payloads, or HTML content', 'Safely encode user input to prevent XSS vulnerabilities'],
    whoUses: 'Web developers, API developers, security researchers, and QA engineers who work with encoded data across different web protocols.',
    faq: [
      { q: 'What is Base64 encoding?', a: 'Base64 is an encoding scheme that converts binary data into a text format using 64 ASCII characters (A-Z, a-z, 0-9, +, /). It is commonly used to embed images in HTML, transmit binary data in JSON APIs, and encode email attachments.' },
      { q: 'What is URL encoding?', a: 'URL encoding (also called percent-encoding) replaces unsafe characters in URLs with a percent sign followed by two hexadecimal digits. For example, a space becomes %20 and an ampersand becomes %26. This ensures URLs are valid and unambiguous.' }
    ],
    meta: { title: 'String Encoder & Decoder - Base64, URL, HTML | Tooliest', desc: 'Encode and decode strings online. Supports Base64, URL encoding, HTML entities. Free multi-format string encoder.' }
  },

  // ===== SEO TOOLS =====
  {
    id: 'meta-tag-generator',
    name: 'Meta Tag Generator',
    description: 'Generate perfect meta tags for your web pages including title, description, and Open Graph tags.',
    category: 'seo',
    icon: '🏷️',
    tags: ['meta tags', 'seo', 'open graph', 'twitter card'],
    isAI: true,
    education: '<strong>Meta tags and search rankings</strong><br>Meta tags are HTML elements that provide metadata about your web page to search engines and social platforms. The <code>&lt;title&gt;</code> tag directly affects rankings and click-through rates. The <code>&lt;meta description&gt;</code> appears as the snippet beneath your title in search results. Open Graph tags control how your page appears when shared on Facebook, LinkedIn, and other platforms. Twitter Cards use their own set of meta tags for rich tweet previews.',
    whyUse: ['Generate all essential meta tags in one place — title, description, OG, and Twitter Card', 'Preview exactly how your page will appear in Google and social media', 'AI-powered suggestions for SEO-optimized titles and descriptions'],
    whoUses: 'SEO professionals, web developers, content marketers, and business owners who want to optimize how their web pages appear in search results and social shares.',
    faq: [
      { q: 'What is the ideal length for a title tag?', a: 'Google displays up to 60 characters of a title tag in desktop search results. Keep your titles between 50-60 characters to avoid truncation while including your target keyword near the beginning.' },
      { q: 'What are Open Graph tags?', a: 'Open Graph (OG) tags are meta tags that control how your page appears when shared on social media platforms like Facebook and LinkedIn. Key OG tags include og:title, og:description, og:image, and og:url.' }
    ],
    meta: { title: 'Meta Tag Generator - Create SEO Meta Tags Free | Tooliest', desc: 'Generate perfect meta tags for SEO. Create title tags, meta descriptions, Open Graph tags, and Twitter Card markup.' }
  },
  {
    id: 'sitemap-generator',
    name: 'Sitemap Generator',
    description: 'Generate XML sitemaps for your website to improve search engine indexing.',
    category: 'seo',
    icon: '🗺️',
    tags: ['sitemap', 'xml', 'seo', 'crawling'],
    isAI: false,
    education: '<strong>Why sitemaps matter for SEO</strong><br>An XML sitemap is a file that lists all important pages on your website, helping search engine crawlers discover and index your content efficiently. Sitemaps are especially critical for large sites, new sites with few backlinks, sites with JavaScript-rendered content, and pages that change frequently. Google, Bing, and other search engines use sitemaps to prioritize crawling.',
    whyUse: ['Generate valid XML sitemaps that comply with the sitemaps.org protocol', 'Set custom priority and change frequency for each URL', 'Download the sitemap file ready to upload to your web server'],
    whoUses: 'Web developers, SEO professionals, and site administrators who need to ensure all important pages are discovered and indexed by search engines.',
    faq: [
      { q: 'Do I need a sitemap for my website?', a: 'While sitemaps are not required, they are strongly recommended. Google\'s own documentation states that sitemaps help with discovery of new and updated content. They are especially important for sites with 500+ pages, heavy JavaScript rendering, or limited internal linking.' },
      { q: 'Where should I place my sitemap?', a: 'Upload your sitemap.xml to the root directory of your website (e.g., https://example.com/sitemap.xml) and reference it in your robots.txt file with the line: Sitemap: https://example.com/sitemap.xml' }
    ],
    meta: { title: 'Sitemap Generator - Create XML Sitemaps Free | Tooliest', desc: 'Generate XML sitemaps for your website. Add URLs, set priorities, and download your sitemap for better SEO.' }
  },
  {
    id: 'robots-txt-generator',
    name: 'Robots.txt Generator',
    description: 'Create a robots.txt file to control how search engine bots crawl your site.',
    category: 'seo',
    icon: '🤖',
    tags: ['robots.txt', 'crawl', 'seo', 'bots'],
    isAI: false,
    education: '<strong>Understanding robots.txt</strong><br>The robots.txt file is a text file placed in your website\'s root directory that instructs search engine crawlers which pages or sections to crawl and which to ignore. It uses the Robots Exclusion Protocol, supported by all major search engines. Common uses include blocking admin pages, preventing indexation of duplicate content, and managing crawl budget on large sites.',
    whyUse: ['Generate valid robots.txt files without memorizing syntax', 'Block search engines from indexing sensitive or duplicate pages', 'Manage crawl budget by directing bots to your most important content'],
    whoUses: 'Web developers, SEO specialists, and system administrators who need to control search engine crawler behavior on their websites.',
    faq: [
      { q: 'Can robots.txt block a page from appearing in Google?', a: 'No. robots.txt prevents crawling but not indexing. If other pages link to a disallowed URL, Google may still index it without crawling. To truly prevent indexing, use a noindex meta tag or X-Robots-Tag HTTP header.' }
    ],
    meta: { title: 'Robots.txt Generator - Create Robots File Free | Tooliest', desc: 'Generate robots.txt files easily. Control search engine crawler access to your website directories and pages.' }
  },
  {
    id: 'og-preview',
    name: 'Open Graph Preview',
    description: 'Preview how your page will look when shared on social media platforms.',
    category: 'seo',
    icon: '👁️',
    tags: ['open graph', 'social preview', 'facebook', 'twitter'],
    isAI: false,
    education: '<strong>Why social previews matter</strong><br>When you share a URL on Facebook, Twitter, LinkedIn, or Slack, these platforms read your Open Graph and Twitter Card meta tags to generate a rich preview card. A compelling image, title, and description dramatically increase click-through rates. Studies show that posts with rich previews get 2-3x more engagement than plain text links.',
    whyUse: ['Preview exactly how your page will appear on Facebook, Twitter, and LinkedIn before publishing', 'Identify missing or broken Open Graph tags', 'Debug social sharing issues without needing to clear platform caches'],
    whoUses: 'Social media managers, content marketers, web developers, and PR professionals who share content across social platforms.',
    faq: [
      { q: 'Why does my shared link look wrong on Facebook?', a: 'Facebook caches Open Graph data aggressively. If you update your OG tags, use Facebook\'s Sharing Debugger (developers.facebook.com/tools/debug/) to clear the cache and fetch fresh metadata.' }
    ],
    meta: { title: 'Open Graph Preview - Social Media Card Tester | Tooliest', desc: 'Preview your Open Graph tags. See how your web pages will appear when shared on Facebook, Twitter, and LinkedIn.' }
  },
  {
    id: 'schema-generator',
    name: 'Schema Markup Generator',
    description: 'Generate JSON-LD structured data for rich search results.',
    category: 'seo',
    icon: '📐',
    tags: ['schema', 'json-ld', 'structured data', 'rich snippets'],
    isAI: true,
    education: '<strong>What is Schema.org structured data?</strong><br>Schema.org is a collaborative vocabulary used to mark up web content so search engines can understand it better. When you add JSON-LD structured data to your pages, you become eligible for rich results in Google — including FAQ dropdowns, star ratings, recipe cards, event listings, and product prices. JSON-LD is Google\'s recommended format for structured data because it separates markup from HTML content.',
    whyUse: ['Generate valid JSON-LD structured data without coding knowledge', 'Support multiple schema types: Article, FAQ, Product, Event, Recipe, and more', 'AI-powered assistance helps you fill in required and recommended properties'],
    whoUses: 'SEO professionals, web developers, content publishers, and e-commerce managers who want to qualify for Google\'s rich search results.',
    faq: [
      { q: 'What is JSON-LD?', a: 'JSON-LD (JavaScript Object Notation for Linked Data) is a method of encoding structured data using JSON. Google officially recommends JSON-LD over Microdata or RDFa because it can be placed anywhere in the HTML document without modifying visible content.' },
      { q: 'Does structured data improve search rankings?', a: 'Structured data does not directly improve rankings, but it makes your pages eligible for rich results (enhanced search listings), which significantly improve click-through rates. Higher CTR can indirectly improve rankings over time.' }
    ],
    meta: { title: 'Schema Markup Generator - JSON-LD Structured Data | Tooliest', desc: 'Generate Schema.org structured data in JSON-LD format. Create Article, FAQ, Product, and more schema types.' }
  },
  {
    id: 'keyword-density',
    name: 'Keyword Density Checker',
    description: 'Analyze keyword density and frequency in your content for SEO optimization.',
    category: 'seo',
    icon: '📈',
    tags: ['keyword density', 'seo analysis', 'content optimization'],
    isAI: false,
    education: '<strong>Keyword density and modern SEO</strong><br>Keyword density measures how often a target keyword appears relative to the total word count. While exact keyword density is no longer a primary ranking factor, maintaining natural keyword usage (typically 1-3%) helps search engines understand your content\'s topic. Over-optimization (keyword stuffing) can trigger penalties, while under-use may cause your page to miss relevant queries.',
    whyUse: ['Analyze keyword frequency to avoid over-optimization or keyword stuffing', 'Identify which terms dominate your content and find gaps', 'Optimize content for target keywords while maintaining natural readability'],
    whoUses: 'SEO copywriters, content strategists, marketing teams, and bloggers who want to ensure their content is properly optimized for search without being penalized.',
    faq: [
      { q: 'What is the ideal keyword density?', a: 'There is no universally ideal keyword density. Most SEO experts recommend 1-3% for primary keywords. Focus on writing naturally and covering the topic comprehensively rather than hitting a specific percentage. Google\'s algorithms prioritize context and relevance over exact keyword frequency.' }
    ],
    meta: { title: 'Keyword Density Checker - Free SEO Analysis Tool | Tooliest', desc: 'Check keyword density in your content. Analyze word frequency and optimize your text for target keywords.' }
  },

  // ===== CSS TOOLS =====
  {
    id: 'css-minifier',
    name: 'CSS Minifier',
    description: 'Minify your CSS code to reduce file size and improve page load speed.',
    category: 'css',
    icon: '📦',
    tags: ['minify', 'compress', 'optimize', 'css'],
    isAI: false,
    education: '<strong>Why minify CSS?</strong><br>CSS minification removes unnecessary whitespace, comments, and formatting from stylesheets, typically reducing file size by 20-50%. Smaller CSS files download faster, reducing Time to First Paint and improving Core Web Vitals scores. This is especially impactful on mobile connections where every kilobyte matters.',
    whyUse: ['Reduce CSS file size by 20-50% for faster page loads', 'Remove comments, whitespace, and redundant code automatically', 'Improve Core Web Vitals scores and Google PageSpeed Insights ratings'],
    whoUses: 'Front-end developers, web performance engineers, and DevOps teams optimizing deployment pipelines.',
    faq: [
      { q: 'Does minifying CSS break the layout?', a: 'No. CSS minification only removes whitespace, comments, and shortens color codes (e.g., #ffffff to #fff). The visual output remains identical. Always test after minification as a best practice.' }
    ],
    meta: { title: 'CSS Minifier - Compress CSS Code Free | Tooliest', desc: 'Minify CSS code online for free. Reduce CSS file size and improve website loading speed.' }
  },
  {
    id: 'css-beautifier',
    name: 'CSS Beautifier',
    description: 'Format and beautify minified CSS code for better readability.',
    category: 'css',
    icon: '✨',
    tags: ['beautify', 'format', 'prettify', 'css'],
    isAI: false,
    education: '<strong>When to beautify CSS</strong><br>Minified CSS is great for production but unreadable for debugging. CSS beautification restores proper indentation, line breaks, and formatting. This is essential when inheriting legacy code, debugging production issues, or auditing third-party stylesheets.',
    whyUse: ['Convert minified CSS back to readable, well-formatted code', 'Debug production CSS issues by restoring structure', 'Audit and understand third-party or legacy stylesheets'],
    whoUses: 'Front-end developers, code reviewers, and anyone working with minified or poorly formatted CSS.',
    faq: [
      { q: 'What is the difference between CSS beautifier and formatter?', a: 'They are the same thing. Both tools take minified or poorly formatted CSS and add proper indentation, line breaks, and spacing to make the code human-readable.' }
    ],
    meta: { title: 'CSS Beautifier - Format CSS Code Online Free | Tooliest', desc: 'Beautify and format CSS code online. Convert minified CSS to readable, well-indented code.' }
  },
  {
    id: 'gradient-generator',
    name: 'CSS Gradient Generator',
    description: 'Create beautiful CSS gradients with a visual editor. Linear, radial, and conic gradients.',
    category: 'css',
    icon: '🌅',
    tags: ['gradient', 'linear', 'radial', 'background'],
    isAI: false,
    education: '<strong>CSS gradient types explained</strong><br>CSS supports three gradient types: <em>linear</em> (color transitions along a straight line), <em>radial</em> (transitions from a center point outward), and <em>conic</em> (color transitions around a center point, like a pie chart). Gradients are rendered by the browser, so they scale perfectly at any resolution without increasing file size.',
    whyUse: ['Create linear, radial, and conic gradients with a visual editor', 'Copy production-ready CSS code instantly', 'Replace background images with lightweight, scalable gradients'],
    whoUses: 'Web designers, UI developers, and creative professionals building modern interfaces with gradient backgrounds.',
    faq: [
      { q: 'Are CSS gradients better than gradient images?', a: 'Yes in most cases. CSS gradients are resolution-independent, load instantly with no HTTP request, and can be animated. Image gradients require additional bandwidth and may look pixelated on high-DPI screens.' }
    ],
    meta: { title: 'CSS Gradient Generator - Create Beautiful Gradients | Tooliest', desc: 'Create stunning CSS gradients with a visual editor. Generate linear, radial, and conic gradient code.' }
  },
  {
    id: 'box-shadow-generator',
    name: 'Box Shadow Generator',
    description: 'Design box shadows visually and copy the CSS code.',
    category: 'css',
    icon: '🔲',
    tags: ['box shadow', 'shadow', 'css', 'visual'],
    isAI: false,
    education: '<strong>The anatomy of box-shadow</strong><br>The CSS <code>box-shadow</code> property takes up to six values: horizontal offset, vertical offset, blur radius, spread radius, color, and an optional <code>inset</code> keyword. Multiple shadows can be layered to create realistic depth effects. Modern card and button designs typically use subtle shadows with large blur and partial transparency.',
    whyUse: ['Design complex layered shadows with a visual editor', 'Fine-tune offset, blur, spread, and color in real-time', 'Copy production-ready CSS instantly'],
    whoUses: 'UI/UX designers and front-end developers creating modern card layouts, buttons, and elevated UI elements.',
    meta: { title: 'Box Shadow CSS Generator - Visual Shadow Designer | Tooliest', desc: 'Create CSS box shadows with a visual editor. Adjust offset, blur, spread, and color. Copy CSS code instantly.' }
  },
  {
    id: 'flexbox-playground',
    name: 'Flexbox Playground',
    description: 'Interactive flexbox CSS playground. Learn and experiment with flex layouts.',
    category: 'css',
    icon: '📏',
    tags: ['flexbox', 'layout', 'css', 'playground'],
    isAI: false,
    education: '<strong>Understanding CSS Flexbox</strong><br>Flexbox is a one-dimensional CSS layout model that distributes space among items in a container. Key properties include <code>flex-direction</code> (row/column), <code>justify-content</code> (main-axis alignment), <code>align-items</code> (cross-axis alignment), and <code>flex-wrap</code>. Flexbox replaced many float and table-based layout hacks and is supported by 99%+ of browsers.',
    whyUse: ['Learn Flexbox interactively with instant visual feedback', 'Experiment with all flex properties without writing code manually', 'Copy generated CSS for use in your projects'],
    whoUses: 'Front-end developers learning Flexbox, CSS instructors, and designers prototyping responsive layouts.',
    faq: [
      { q: 'What is the difference between Flexbox and CSS Grid?', a: 'Flexbox is a one-dimensional layout system (either rows OR columns), while CSS Grid is two-dimensional (rows AND columns simultaneously). Use Flexbox for component-level layouts (navbars, cards) and Grid for page-level layouts.' }
    ],
    meta: { title: 'Flexbox Playground - Interactive CSS Flexbox Tool | Tooliest', desc: 'Learn CSS Flexbox interactively. Experiment with flex properties and see results in real-time.' }
  },
  {
    id: 'css-animation-generator',
    name: 'CSS Animation Generator',
    description: 'Create CSS keyframe animations with a visual timeline editor.',
    category: 'css',
    icon: '🎬',
    tags: ['animation', 'keyframes', 'transition', 'css'],
    isAI: false,
    education: '<strong>CSS @keyframes animations</strong><br>CSS animations use <code>@keyframes</code> rules to define animation states and the <code>animation</code> shorthand property to apply them. Unlike CSS transitions (which only animate between two states), keyframe animations can define multiple intermediate steps. Combined with <code>animation-timing-function</code>, you can create smooth, performant animations without JavaScript.',
    whyUse: ['Create custom keyframe animations with a visual timeline editor', 'Preview animations in real-time before adding to your code', 'Generate cross-browser compatible CSS animation code'],
    whoUses: 'Front-end developers, motion designers, and web animators creating engaging user interfaces.',
    meta: { title: 'CSS Animation Generator - Create Keyframe Animations | Tooliest', desc: 'Generate CSS keyframe animations visually. Create bounce, fade, slide, and custom animation effects.' }
  },

  // ===== COLOR TOOLS =====
  {
    id: 'color-picker',
    name: 'Color Picker',
    description: 'Pick colors with HEX, RGB, HSL values. Visual color wheel selector.',
    category: 'color',
    icon: '🎯',
    tags: ['color picker', 'hex', 'rgb', 'hsl'],
    isAI: false,
    education: '<strong>Color formats in web development</strong><br>Web colors can be expressed in multiple formats: HEX (#ff5733), RGB (rgb(255,87,51)), HSL (hsl(14,100%,60%)), and CMYK (for print). HEX is the most common in CSS, RGB is used in JavaScript APIs, and HSL is the most intuitive for human manipulation since it separates hue, saturation, and lightness.',
    whyUse: ['Pick any color visually and get all format values instantly', 'Convert between HEX, RGB, HSL, and CMYK in real-time', 'Use the visual color wheel for intuitive color selection'],
    whoUses: 'Web designers, graphic designers, UI developers, and brand managers working with digital color systems.',
    faq: [
      { q: 'What is the difference between HEX and RGB?', a: 'HEX and RGB represent the same color information in different formats. HEX uses hexadecimal notation (#FF5733), while RGB uses decimal values (rgb(255, 87, 51)). They are interchangeable in CSS.' }
    ],
    meta: { title: 'Color Picker - HEX, RGB, HSL Color Selector | Tooliest', desc: 'Pick and convert colors online. Get HEX, RGB, HSL, and CMYK values. Free visual color picker tool.' }
  },
  {
    id: 'palette-generator',
    name: 'Color Palette Generator',
    description: 'Generate beautiful, harmonious color palettes using color theory algorithms.',
    category: 'color',
    icon: '🎨',
    tags: ['palette', 'color scheme', 'harmony', 'design'],
    isAI: true,
    education: '<strong>Color theory and palette generation</strong><br>Color palettes built on color theory principles create visually harmonious designs. <em>Complementary</em> colors sit opposite each other on the color wheel (high contrast). <em>Analogous</em> colors are adjacent (harmonious). <em>Triadic</em> colors are evenly spaced (balanced and vibrant). This AI-powered generator applies these rules to produce professional-grade palettes from any starting color.',
    whyUse: ['Generate harmonious color palettes from any starting color', 'Explore complementary, analogous, triadic, and split-complementary schemes', 'Export palettes as HEX, RGB, or HSL values for direct use'],
    whoUses: 'UI/UX designers, brand designers, interior designers, and artists who need professional color combinations.',
    meta: { title: 'Color Palette Generator - AI-Powered Color Schemes | Tooliest', desc: 'Generate harmonious color palettes. Create complementary, analogous, and triadic color schemes with AI.' }
  },
  {
    id: 'contrast-checker',
    name: 'Contrast Checker',
    description: 'Check color contrast ratios for WCAG accessibility compliance.',
    category: 'color',
    icon: '♿',
    tags: ['contrast', 'accessibility', 'wcag', 'a11y'],
    isAI: false,
    education: '<strong>WCAG contrast requirements</strong><br>The Web Content Accessibility Guidelines (WCAG 2.1) require a minimum contrast ratio of 4.5:1 for normal text (Level AA) and 7:1 for enhanced (Level AAA). Large text (18px+ bold or 24px+ normal) has a reduced requirement of 3:1. Low contrast is one of the most common accessibility violations, affecting users with low vision and aging eyes.',
    whyUse: ['Check any color combination against WCAG 2.1 AA and AAA standards', 'Get real-time contrast ratio calculations', 'Ensure your website is accessible to users with visual impairments'],
    whoUses: 'Web developers, accessibility consultants, designers, and compliance teams ensuring websites meet legal accessibility requirements.',
    faq: [
      { q: 'What is a good contrast ratio?', a: 'WCAG 2.1 Level AA requires a minimum of 4.5:1 for normal text and 3:1 for large text. Level AAA (enhanced accessibility) requires 7:1 and 4.5:1 respectively. Aim for at least AA compliance on all text.' }
    ],
    meta: { title: 'Color Contrast Checker - WCAG Accessibility Tool | Tooliest', desc: 'Check color contrast ratios for WCAG 2.1 compliance. Ensure your website meets AA and AAA accessibility standards.' }
  },
  {
    id: 'hex-to-rgb',
    name: 'HEX to RGB Converter',
    description: 'Convert HEX color codes to RGB, HSL, CMYK, and other formats.',
    category: 'color',
    icon: '🔀',
    tags: ['hex', 'rgb', 'hsl', 'convert'],
    isAI: false,
    education: '<strong>Converting between color formats</strong><br>Different design tools and programming languages use different color formats. CSS primarily uses HEX and RGB, design tools like Figma use both HEX and HSL, and print workflows require CMYK values. This converter handles bidirectional conversion between all common formats with a live preview swatch.',
    whyUse: ['Convert colors between HEX, RGB, HSL, and CMYK formats instantly', 'See a live preview swatch of your converted color', 'Copy any format value with one click'],
    whoUses: 'Web developers bridging design files and code, designers converting between digital and print formats.',
    meta: { title: 'HEX to RGB Converter - Color Code Conversion | Tooliest', desc: 'Convert HEX colors to RGB, HSL, and CMYK. Free online color code converter with instant preview.' }
  },
  {
    id: 'color-blindness-sim',
    name: 'Color Blindness Simulator',
    description: 'Simulate how colors look to people with different types of color blindness.',
    category: 'color',
    icon: '👓',
    tags: ['color blindness', 'accessibility', 'simulation', 'deuteranopia'],
    isAI: false,
    education: '<strong>Understanding color blindness</strong><br>Approximately 8% of men and 0.5% of women have some form of color vision deficiency. The most common types are deuteranopia (green-blind), protanopia (red-blind), and tritanopia (blue-blind). This simulator shows how your chosen colors appear to people with each type, helping you design inclusive interfaces.',
    whyUse: ['See exactly how your colors look to people with different types of color blindness', 'Test design accessibility before shipping to production', 'Ensure information conveyed by color alone has alternative indicators'],
    whoUses: 'UI/UX designers, accessibility teams, product managers, and developers building inclusive digital products.',
    meta: { title: 'Color Blindness Simulator - Test Color Accessibility | Tooliest', desc: 'Simulate different types of color blindness. Test your color choices for accessibility compliance.' }
  },

  // ===== IMAGE TOOLS =====
  {
    id: 'image-compressor',
    name: 'Image Compressor',
    description: 'Compress images without losing quality. Reduce file size for faster loading.',
    category: 'image',
    icon: '📸',
    tags: ['compress', 'optimize', 'reduce size', 'image'],
    isAI: false,
    education: '<strong>How image compression works</strong><br>Image compression reduces file size using two methods: <em>lossy</em> compression (removes data the eye barely notices, e.g., JPEG quality reduction) and <em>lossless</em> compression (removes redundant metadata without visual change). This tool uses browser-native Canvas APIs for lossy compression, keeping everything local and private.',
    whyUse: ['Reduce image file sizes by 50-90% without visible quality loss', 'Speed up your website by optimizing images for web delivery', 'Process images locally — nothing is uploaded to any server'],
    whoUses: 'Web developers, bloggers, e-commerce managers, and anyone who needs smaller image files for faster page loads.',
    faq: [
      { q: 'How much can I compress an image without losing quality?', a: 'Most JPEG images can be compressed 50-80% with minimal visible quality loss. For PNG images, lossless compression typically achieves 10-30% reduction. The optimal compression level depends on the image content.' }
    ],
    meta: { title: 'Image Compressor - Reduce Image Size Online Free | Tooliest', desc: 'Compress images online without losing quality. Reduce JPEG, PNG file sizes for faster web loading.' }
  },
  {
    id: 'image-resizer',
    name: 'Image Resizer',
    description: 'Resize images to any dimensions. Maintain aspect ratio or crop.',
    category: 'image',
    icon: '📐',
    tags: ['resize', 'dimensions', 'scale', 'image'],
    isAI: false,
    education: '<strong>Image resizing for the web</strong><br>Serving correctly-sized images is one of the simplest performance wins. An image displayed at 400px but served at 2000px wastes bandwidth. This tool lets you resize to exact pixel dimensions while maintaining aspect ratio. For responsive sites, prepare multiple sizes and serve them with the HTML <code>srcset</code> attribute.',
    whyUse: ['Resize images to exact pixel dimensions for web, social media, or print', 'Maintain aspect ratio to prevent distortion', 'Process images 100% locally — no uploads required'],
    whoUses: 'Web content managers, social media marketers, photographers, and e-commerce teams preparing product images.',
    meta: { title: 'Image Resizer - Resize Images Online Free | Tooliest', desc: 'Resize images to any dimensions. Maintain aspect ratio, crop, or scale. Free online image resizer.' }
  },
  {
    id: 'image-cropper',
    name: 'Image Cropper',
    description: 'Crop images with preset ratios or custom dimensions.',
    category: 'image',
    icon: '✂️',
    tags: ['crop', 'trim', 'cut', 'image'],
    isAI: false,
    education: '<strong>Cropping images for different platforms</strong><br>Each platform requires specific aspect ratios: Instagram posts use 1:1 (square), stories use 9:16, YouTube thumbnails use 16:9, and Facebook covers use 2.7:1. This cropper includes presets for all major platforms plus custom free-form cropping.',
    whyUse: ['Crop images with platform-specific presets (Instagram, YouTube, Facebook, etc.)', 'Use free-form or custom aspect ratio cropping', 'Process images entirely in your browser for privacy'],
    whoUses: 'Social media managers, content creators, photographers, and designers preparing images for specific platforms.',
    meta: { title: 'Image Cropper - Crop Images Online Free | Tooliest', desc: 'Crop images online with preset aspect ratios or custom dimensions. Free, fast image cropper tool.' }
  },
  {
    id: 'image-to-base64',
    name: 'Image to Base64',
    description: 'Convert images to Base64 encoded strings for embedding in HTML/CSS.',
    category: 'image',
    icon: '🔣',
    tags: ['base64', 'encode', 'embed', 'data uri'],
    isAI: false,
    education: '<strong>Data URIs and inline images</strong><br>Base64-encoded images can be embedded directly in HTML or CSS as data URIs, eliminating an HTTP request. This is ideal for small icons and logos (under 5KB) but increases HTML file size by ~33%. For larger images, regular file URLs with proper caching are more efficient.',
    whyUse: ['Convert images to Base64 strings for embedding in HTML and CSS', 'Eliminate HTTP requests for small icons and graphics', 'Generate data URIs for email HTML templates'],
    whoUses: 'Web developers optimizing page load performance, email template designers, and developers embedding assets inline.',
    meta: { title: 'Image to Base64 Encoder - Convert Images Free | Tooliest', desc: 'Convert images to Base64 encoded strings. Create data URIs for embedding images directly in HTML and CSS.' }
  },
  {
    id: 'base64-to-image',
    name: 'Base64 to Image',
    description: 'Convert Base64 strings back to downloadable images.',
    category: 'image',
    icon: '🖼️',
    tags: ['base64', 'decode', 'image', 'download'],
    isAI: false,
    education: '<strong>Decoding Base64 images</strong><br>Base64-encoded image strings are commonly found in API responses, email sources, CSS files, and database exports. This tool decodes the string back to a visual image that you can preview and download. It supports PNG, JPEG, WebP, GIF, and SVG data URIs.',
    whyUse: ['Decode Base64 strings from APIs, emails, or databases back to images', 'Preview decoded images instantly before downloading', 'Supports all common image formats'],
    whoUses: 'Backend developers debugging API image payloads, email developers, and data engineers extracting embedded images.',
    meta: { title: 'Base64 to Image Converter - Decode Base64 Free | Tooliest', desc: 'Convert Base64 encoded strings back to images. Preview and download decoded images instantly.' }
  },
  {
    id: 'image-converter',
    name: 'Image Format Converter',
    description: 'Convert images to PNG, WebP, JPEG, and AVIF instantly with zero quality loss.',
    category: 'image',
    icon: '🔮',
    tags: ['convert', 'format', 'png', 'jpeg', 'webp', 'avif', 'image'],
    isAI: false,
    education: '<strong>Modern image formats compared</strong><br>JPEG is best for photographs, PNG for graphics with transparency, WebP offers 25-35% smaller files than JPEG at equivalent quality, and AVIF provides even better compression (50%+ smaller). Browser support for WebP is now 97%+ and AVIF is at 93%+, making both excellent choices for modern websites.',
    whyUse: ['Convert between PNG, JPEG, WebP, and AVIF formats instantly', 'Reduce file sizes by converting to modern formats like WebP and AVIF', 'Process images 100% in your browser — no server uploads'],
    whoUses: 'Web developers optimizing image delivery, photographers preparing files for different uses, and content teams managing image assets.',
    faq: [
      { q: 'Should I use WebP or AVIF for my website?', a: 'WebP has broader browser support (97%+) and is a safe default. AVIF offers better compression but has slightly less support (93%+). Use both with the HTML <picture> element and JPEG as a fallback for maximum compatibility.' }
    ],
    meta: { title: 'Image Format Converter - Convert to PNG, JPEG, WebP, AVIF | Tooliest', desc: 'Convert image formats instantly entirely in your browser. Download as PNG, WebP, JPEG or AVIF completely offline.' }
  },

  // ===== JSON TOOLS =====
  {
    id: 'json-formatter',
    name: 'JSON Formatter',
    description: 'Format and beautify JSON data with syntax highlighting and tree view.',
    category: 'json',
    icon: '📋',
    tags: ['json', 'format', 'beautify', 'pretty print'],
    isAI: false,
    education: '<strong>Why format JSON?</strong><br>JSON (JavaScript Object Notation) is the most common data interchange format on the web. Raw API responses and minified JSON files are difficult to read. This formatter adds proper indentation, line breaks, and syntax highlighting. The tree view mode lets you explore nested structures interactively.',
    whyUse: ['Format JSON with proper indentation and syntax highlighting', 'Explore nested data structures with an interactive tree view', 'Validate JSON syntax while formatting'],
    whoUses: 'API developers, backend engineers, data analysts, and QA teams debugging JSON responses.',
    faq: [
      { q: 'What is JSON?', a: 'JSON (JavaScript Object Notation) is a lightweight data format used for storing and transmitting data. It is human-readable, language-independent, and the standard format for REST API responses, configuration files, and data storage.' }
    ],
    meta: { title: 'JSON Formatter & Beautifier - Pretty Print JSON | Tooliest', desc: 'Format and beautify JSON data online. Pretty print with syntax highlighting and indentation.' }
  },
  {
    id: 'json-validator',
    name: 'JSON Validator',
    description: 'Validate JSON data and find syntax errors with line numbers.',
    category: 'json',
    icon: '✅',
    tags: ['json', 'validate', 'lint', 'syntax check'],
    isAI: false,
    education: '<strong>Common JSON syntax errors</strong><br>The most frequent JSON errors are: trailing commas after the last item, single quotes instead of double quotes, unquoted property names, missing commas between items, and comments (JSON does not support comments). This validator pinpoints errors with exact line numbers and description.',
    whyUse: ['Find JSON syntax errors with exact line numbers and error descriptions', 'Validate API responses and configuration files before deployment', 'Catch common mistakes like trailing commas and unquoted keys'],
    whoUses: 'API developers, DevOps engineers, and full-stack developers debugging JSON data issues.',
    meta: { title: 'JSON Validator - Check JSON Syntax Errors Free | Tooliest', desc: 'Validate JSON online. Find syntax errors with detailed error messages and line numbers.' }
  },
  {
    id: 'json-to-csv',
    name: 'JSON to CSV Converter',
    description: 'Convert JSON arrays to CSV format for spreadsheet applications.',
    category: 'json',
    icon: '📊',
    tags: ['json', 'csv', 'convert', 'spreadsheet'],
    isAI: false,
    education: '<strong>When to convert JSON to CSV</strong><br>CSV (Comma-Separated Values) is the universal format for spreadsheets and databases. Converting JSON arrays to CSV makes data importable to Excel, Google Sheets, SQL databases, and BI tools. This converter handles nested objects by flattening them into dot-notation columns.',
    whyUse: ['Convert JSON arrays to CSV for use in Excel and Google Sheets', 'Automatically flatten nested objects into readable columns', 'Download results as a .csv file ready for import'],
    whoUses: 'Data analysts, business intelligence teams, and developers exporting API data for spreadsheet analysis.',
    meta: { title: 'JSON to CSV Converter - Convert JSON Data Free | Tooliest', desc: 'Convert JSON data to CSV format. Export JSON arrays for use in Excel and Google Sheets.' }
  },
  {
    id: 'csv-to-json',
    name: 'CSV to JSON Converter',
    description: 'Convert CSV data to JSON format with automatic header detection.',
    category: 'json',
    icon: '🔄',
    tags: ['csv', 'json', 'convert', 'data'],
    isAI: false,
    education: '<strong>CSV to JSON conversion</strong><br>Converting CSV to JSON transforms tabular data into structured API-ready format. The first row is treated as headers (property names), and each subsequent row becomes a JSON object. This is essential for importing spreadsheet data into JavaScript applications, REST APIs, and NoSQL databases.',
    whyUse: ['Convert spreadsheet data to JSON format for APIs and applications', 'Automatic header detection from the first row', 'Handle quoted fields, commas within values, and special characters'],
    whoUses: 'Full-stack developers, data engineers, and anyone migrating data from spreadsheets to JSON-based systems.',
    meta: { title: 'CSV to JSON Converter - Convert CSV Data Free | Tooliest', desc: 'Convert CSV data to JSON arrays online. Automatic header detection and formatting.' }
  },
  {
    id: 'json-minifier',
    name: 'JSON Minifier',
    description: 'Minify JSON by removing whitespace and reducing file size.',
    category: 'json',
    icon: '📦',
    tags: ['json', 'minify', 'compress', 'compact'],
    isAI: false,
    education: '<strong>Why minify JSON?</strong><br>JSON minification removes all unnecessary whitespace, line breaks, and indentation. This can reduce file size by 15-40%, directly improving API response times and reducing bandwidth costs. For high-traffic APIs and CDN-served files, minified JSON delivers measurable performance improvements.',
    whyUse: ['Reduce JSON file size by 15-40% by removing whitespace', 'Optimize API response payloads for faster delivery', 'Prepare JSON for production storage and transmission'],
    whoUses: 'API developers, DevOps engineers, and backend teams optimizing data transfer performance.',
    meta: { title: 'JSON Minifier - Compress JSON Online Free | Tooliest', desc: 'Minify JSON data by removing whitespace. Reduce JSON file size for API responses and storage.' }
  },

  // ===== HTML TOOLS =====
  {
    id: 'html-minifier',
    name: 'HTML Minifier',
    description: 'Minify HTML code by removing whitespace, comments, and unnecessary attributes.',
    category: 'html',
    icon: '📦',
    tags: ['html', 'minify', 'compress', 'optimize'],
    isAI: false,
    education: '<strong>HTML minification best practices</strong><br>HTML minification removes comments, redundant whitespace, optional closing tags, and unnecessary attributes. This typically reduces HTML file size by 10-25%. Combined with Gzip compression on the server, minified HTML is the fastest path to a low Time to First Byte.',
    whyUse: ['Reduce HTML file size by 10-25% for faster initial page loads', 'Remove HTML comments that may expose internal notes', 'Optimize HTML for production deployment'],
    whoUses: 'Web developers, performance engineers, and DevOps teams building production deployment pipelines.',
    meta: { title: 'HTML Minifier - Compress HTML Code Free | Tooliest', desc: 'Minify HTML code online. Remove whitespace, comments, and unnecessary attributes for faster loading.' }
  },
  {
    id: 'html-beautifier',
    name: 'HTML Beautifier',
    description: 'Format and indent HTML code for better readability.',
    category: 'html',
    icon: '✨',
    tags: ['html', 'beautify', 'format', 'indent'],
    isAI: false,
    education: '<strong>HTML formatting for readability</strong><br>Properly indented HTML is essential for code maintenance and team collaboration. This beautifier handles nested elements, self-closing tags, inline vs. block elements, and embedded scripts. Well-formatted HTML also makes accessibility auditing easier, helping you spot structural issues.',
    whyUse: ['Convert minified HTML back to properly indented, readable code', 'Improve code maintainability for team collaboration', 'Spot structural and accessibility issues more easily'],
    whoUses: 'Front-end developers, code reviewers, and QA teams debugging rendered HTML output.',
    meta: { title: 'HTML Beautifier - Format HTML Code Online Free | Tooliest', desc: 'Beautify and format HTML code with proper indentation. Make minified HTML readable again.' }
  },
  {
    id: 'html-entity-encoder',
    name: 'HTML Entity Encoder',
    description: 'Encode and decode HTML entities. Convert special characters safely.',
    category: 'html',
    icon: '🔡',
    tags: ['html', 'entities', 'encode', 'decode'],
    isAI: false,
    education: '<strong>HTML entities and security</strong><br>HTML entities are coded replacements for reserved characters like <code>&lt;</code>, <code>&gt;</code>, <code>&amp;</code>, and <code>&quot;</code>. Encoding user input into HTML entities is a key defense against Cross-Site Scripting (XSS) attacks, preventing browsers from interpreting injected characters as HTML or JavaScript.',
    whyUse: ['Encode special characters to prevent XSS vulnerabilities', 'Decode HTML entities back to readable text', 'Handle named entities (e.g., &amp;amp;) and numeric entities (e.g., &amp;#38;)'],
    whoUses: 'Web developers, security engineers, and content teams working with HTML markup that contains special characters.',
    meta: { title: 'HTML Entity Encoder/Decoder - Convert Entities | Tooliest', desc: 'Encode and decode HTML entities online. Convert special characters to HTML-safe entities.' }
  },
  {
    id: 'html-table-generator',
    name: 'HTML Table Generator',
    description: 'Generate HTML tables visually. Set rows, columns, and styling options.',
    category: 'html',
    icon: '📊',
    tags: ['html', 'table', 'generator', 'grid'],
    isAI: false,
    education: '<strong>HTML tables and when to use them</strong><br>HTML tables are the correct semantic element for displaying tabular data — information with a meaningful row/column relationship. They should <em>not</em> be used for layout (use CSS Grid/Flexbox instead). Accessible tables include <code>&lt;thead&gt;</code>, <code>&lt;th scope="col"&gt;</code>, and a <code>&lt;caption&gt;</code> element for screen-reader clarity.',
    whyUse: ['Generate HTML table markup instantly without hand-coding', 'Customize rows, columns, headers, and border styles visually', 'Copy paste-ready code into your HTML project'],
    whoUses: 'Web developers, bloggers, marketing teams, and content managers needing structured data tables without writing raw HTML.',
    faq: [
      { q: 'When should I use an HTML table?', a: 'Use HTML tables for tabular data — schedules, comparison charts, pricing tables, or data grids. Avoid tables for page layout; use CSS Grid or Flexbox instead. Semantic tables also improve accessibility for screen readers.' }
    ],
    meta: { title: 'HTML Table Generator - Create Tables Online Free | Tooliest', desc: 'Generate HTML tables with a visual editor. Set rows, columns, headers, and styling. Copy code instantly.' }
  },
  {
    id: 'markdown-to-html',
    name: 'Markdown to HTML',
    description: 'Convert Markdown text to clean HTML code with live preview.',
    category: 'html',
    icon: '📝',
    tags: ['markdown', 'html', 'convert', 'preview'],
    isAI: false,
    education: '<strong>Why Markdown?</strong><br>Markdown is a lightweight markup language created by John Gruber in 2004. It is the standard writing format for README files (GitHub), documentation (Docusaurus, MkDocs), blog posts (Ghost, Jekyll), and content management systems. Converting Markdown to HTML is the final step before rendering it in a browser. This converter handles headings, bold, italic, lists, code blocks, tables, and links.',
    whyUse: ['Convert Markdown to clean HTML for CMS and blog publishing', 'Live preview shows formatted output as you type', 'Handles headings, lists, code blocks, tables, and links'],
    whoUses: 'Technical writers, developers writing README files, bloggers using static site generators, and content teams managing documentation.',
    faq: [
      { q: 'What is Markdown?', a: 'Markdown is a lightweight markup language that uses plain text formatting symbols to add structure — for example, **bold** becomes <strong>bold</strong>, and # Heading 1 becomes <h1>. It is widely used for GitHub READMEs, documentation, and blog posts.' }
    ],
    meta: { title: 'Markdown to HTML Converter - Convert MD Free | Tooliest', desc: 'Convert Markdown to HTML code online. Live preview with syntax highlighting.' }
  },

  // ===== JAVASCRIPT TOOLS =====
  {
    id: 'js-minifier',
    name: 'JavaScript Minifier',
    description: 'Minify JavaScript code to reduce file size and improve performance.',
    category: 'javascript',
    icon: '📦',
    tags: ['javascript', 'minify', 'compress', 'optimize'],
    isAI: false,
    education: '<strong>JavaScript minification explained</strong><br>JS minification removes whitespace, shortens variable names, eliminates dead code, and optimizes expressions. Production JavaScript should always be minified — it can reduce file sizes by 30-80%. Combined with tree shaking and code splitting, minification is a core performance optimization for modern web apps.',
    whyUse: ['Reduce JavaScript file sizes by 30-80% for faster page loads', 'Remove comments and debug code from production bundles', 'Shorten variable names while preserving functionality'],
    whoUses: 'Front-end developers, DevOps engineers, and web performance consultants optimizing production JavaScript.',
    meta: { title: 'JavaScript Minifier - Compress JS Code Free | Tooliest', desc: 'Minify JavaScript code online. Remove whitespace, comments, and shorten variable names.' }
  },
  {
    id: 'js-beautifier',
    name: 'JavaScript Beautifier',
    description: 'Format and beautify minified JavaScript code with proper indentation.',
    category: 'javascript',
    icon: '✨',
    tags: ['javascript', 'beautify', 'format', 'prettify'],
    isAI: false,
    education: '<strong>Why beautify JavaScript?</strong><br>When JavaScript is minified for production, variable names are shortened and whitespace removed — making it unreadable for debugging. Running minified code through a beautifier restores indentation and line breaks, making logic readable again. This is essential when debugging vendor scripts, analyzing third-party code, or reviewing source map-less production bundles.',
    whyUse: ['Convert minified or compressed JavaScript back to readable, indented code', 'Debug third-party scripts and vendor libraries by restoring formatting', 'Improve code readability before doing a code review'],
    whoUses: 'Front-end developers debugging production bundles, security researchers reviewing third-party scripts, and QA engineers analyzing client-side code.',
    faq: [
      { q: 'What is the difference between a JS beautifier and a formatter?', a: 'They essentially do the same thing: add consistent indentation, line breaks, and spacing to JavaScript code. "Beautifier" is the traditional term, while "formatter" is used by modern tools like Prettier. Both make code more readable for humans.' }
    ],
    meta: { title: 'JavaScript Beautifier - Format JS Code Free | Tooliest', desc: 'Beautify and format JavaScript code online. Convert minified JS to readable, indented code.' }
  },
  {
    id: 'regex-tester',
    name: 'Regex Tester',
    description: 'Test regular expressions with real-time matching and group highlighting.',
    category: 'javascript',
    icon: '🎯',
    tags: ['regex', 'regular expression', 'pattern', 'match'],
    isAI: false,
    education: '<strong>Regular expressions demystified</strong><br>Regular expressions (regex) are patterns used to match character combinations in strings. They are essential for data validation (emails, phone numbers), text extraction, search-and-replace operations, and log analysis. Regex syntax is supported in virtually every programming language, making it a universal developer skill.',
    whyUse: ['Test regex patterns against sample text with real-time highlighting', 'View captured groups and understand pattern matching step by step', 'Debug complex regular expressions safely before using in production code'],
    whoUses: 'Developers, data engineers, system administrators, and anyone who needs to parse or validate text patterns.',
    faq: [
      { q: 'What is a regular expression?', a: 'A regular expression (regex) is a sequence of characters defining a search pattern. For example, the pattern ^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$ matches email addresses. Regex is used in JavaScript, Python, Java, and most other languages.' }
    ],
    meta: { title: 'Regex Tester - Test Regular Expressions Online | Tooliest', desc: 'Test regex patterns with real-time matching. Highlight groups, test flags, and debug regular expressions.' }
  },
  {
    id: 'js-obfuscator',
    name: 'JavaScript Obfuscator',
    description: 'Obfuscate JavaScript code to protect your source code from copying.',
    category: 'javascript',
    icon: '🔒',
    tags: ['obfuscate', 'protect', 'javascript', 'security'],
    isAI: false,
    education: '<strong>JavaScript obfuscation vs. minification</strong><br>While minification makes code smaller, obfuscation makes it intentionally hard to understand. Obfuscation renames variables to meaningless strings, converts strings to encoded sequences, and adds control flow flattening. It is not true encryption — determined attackers can still reverse it — but it raises the barrier significantly for casual copying.',
    whyUse: ['Protect proprietary JavaScript algorithms from casual copying', 'Add a layer of defense against code theft and reverse engineering', 'Complement minification with advanced obfuscation techniques'],
    whoUses: 'Software companies protecting client-side business logic, game developers, and SaaS providers with browser-based apps.',
    meta: { title: 'JavaScript Obfuscator - Protect JS Code Free | Tooliest', desc: 'Obfuscate JavaScript code online. Protect your source code from copying and reverse engineering.' }
  },

  // ===== CONVERTER TOOLS =====
  {
    id: 'unit-converter',
    name: 'Unit Converter',
    description: 'Convert between units of length, weight, volume, temperature, speed, and more.',
    category: 'converter',
    icon: '📏',
    tags: ['unit', 'convert', 'length', 'weight'],
    isAI: false,
    education: '<strong>Measurement unit systems</strong><br>The world primarily uses two measurement systems: the metric system (meters, kilograms, liters) used by most countries, and the imperial/US customary system (feet, pounds, gallons) used in the United States. This converter handles conversions across both systems for length, weight, volume, area, speed, pressure, and digital storage.',
    whyUse: ['Convert between metric and imperial units instantly', 'Support for length, weight, volume, temperature, speed, and more', 'Accurate conversions with up to 10 decimal places'],
    whoUses: 'Engineers, scientists, students, travelers, and anyone working across different measurement systems.',
    meta: { title: 'Unit Converter - Convert Length, Weight, Volume | Tooliest', desc: 'Convert between all measurement units. Length, weight, volume, temperature, speed, and more.' }
  },
  {
    id: 'temperature-converter',
    name: 'Temperature Converter',
    description: 'Convert between Celsius, Fahrenheit, and Kelvin instantly.',
    category: 'converter',
    icon: '🌡️',
    tags: ['temperature', 'celsius', 'fahrenheit', 'kelvin'],
    isAI: false,
    education: '<strong>Temperature scales explained</strong><br>There are three main temperature scales: <strong>Celsius (°C)</strong> is the metric standard used by most countries, with 0° as water\'s freezing point and 100° as boiling. <strong>Fahrenheit (°F)</strong> is used primarily in the United States, with 32° freezing and 212° boiling. <strong>Kelvin (K)</strong> is the scientific absolute scale, starting at absolute zero (−273.15°C), and is used in physics, astronomy, and chemistry.',
    whyUse: ['Convert between Celsius, Fahrenheit, and Kelvin instantly', 'See all three scales simultaneously for full context', 'Works offline — no network request required'],
    whoUses: 'Students, scientists, travelers, home cooks, and anyone converting temperatures between unit systems.',
    faq: [
      { q: 'What is the formula to convert Celsius to Fahrenheit?', a: 'To convert Celsius to Fahrenheit: °F = (°C × 9/5) + 32. For example, 100°C = (100 × 1.8) + 32 = 212°F. To convert back: °C = (°F − 32) × 5/9.' }
    ],
    meta: { title: 'Temperature Converter - Celsius, Fahrenheit, Kelvin | Tooliest', desc: 'Convert temperatures between Celsius, Fahrenheit, and Kelvin. Free instant temperature converter.' }
  },
  {
    id: 'number-base-converter',
    name: 'Number Base Converter',
    description: 'Convert numbers between binary, octal, decimal, and hexadecimal bases.',
    category: 'converter',
    icon: '🔢',
    tags: ['binary', 'hex', 'octal', 'decimal'],
    isAI: false,
    education: '<strong>Number bases in computing</strong><br>Computers represent numbers in different bases: <strong>Binary (base 2)</strong> uses only 0 and 1, and is the native language of digital hardware. <strong>Octal (base 8)</strong> was historically used in computing and is still seen in Unix file permissions. <strong>Decimal (base 10)</strong> is the human-standard number system. <strong>Hexadecimal (base 16, 0–9 + A–F)</strong> is widely used in programming for memory addresses, color codes (#FF5733), and bytecodes.',
    whyUse: ['Convert numbers between binary, octal, decimal, and hexadecimal instantly', 'Essential for debugging low-level code, network addresses, and bitwise operations', 'Shows all bases simultaneously for quick cross-reference'],
    whoUses: 'Computer science students, embedded systems developers, network engineers, and programmers working with low-level data.',
    faq: [
      { q: 'What is hexadecimal used for in programming?', a: 'Hexadecimal (base 16) is used for memory addresses, color codes (e.g. #FF5733 in CSS), machine code, and binary data representation. It is more compact than binary — one hex digit represents exactly 4 binary bits.' }
    ],
    meta: { title: 'Number Base Converter - Binary, Hex, Octal | Tooliest', desc: 'Convert numbers between binary, decimal, octal, and hexadecimal. Free number base converter tool.' }
  },
  {
    id: 'timezone-converter',
    name: 'Time Zone Converter',
    description: 'Convert times between different time zones around the world.',
    category: 'converter',
    icon: '🕐',
    tags: ['timezone', 'time', 'convert', 'utc'],
    isAI: false,
    education: '<strong>Understanding time zones</strong><br>Time zones offset from Coordinated Universal Time (UTC), the world\'s primary time standard. UTC+0 is Greenwich Mean Time (GMT). The United States uses UTC−5 (EST) to UTC−8 (PST). India uses UTC+5:30 (IST), a non-standard 30-minute offset. Some regions also observe Daylight Saving Time (DST), adding an hour during summer months.',
    whyUse: ['Convert between time zones for scheduling global meetings and calls', 'See current time in any city worldwide', 'Handles Daylight Saving Time automatically'],
    whoUses: 'Remote teams scheduling cross-timezone meetings, travelers planning itineraries, developers coordinating deployments across regions, and freelancers working with international clients.',
    faq: [
      { q: 'What is the difference between UTC and GMT?', a: 'UTC (Coordinated Universal Time) and GMT (Greenwich Mean Time) share the same base offset (UTC+0) but are technically different standards. UTC is the international atomic time standard used for technical purposes, while GMT is a time zone observed in the UK during winter. In practice, they are equivalent for everyday use.' }
    ],
    meta: { title: 'Time Zone Converter - Convert Times Worldwide | Tooliest', desc: 'Convert times between time zones. Find the time anywhere in the world. Free timezone converter.' }
  },

  // ===== ENCODING TOOLS =====
  {
    id: 'base64-encoder',
    name: 'Base64 Encoder/Decoder',
    description: 'Encode and decode text and files with Base64 encoding.',
    category: 'encoding',
    icon: '🔐',
    tags: ['base64', 'encode', 'decode', 'text'],
    isAI: false,
    education: '<strong>Base64 in web development</strong><br>Base64 encoding converts binary data into a text-safe format using 64 ASCII characters. Common uses include embedding images in CSS/HTML, encoding email attachments (MIME), transmitting binary data in JSON APIs, and encoding authentication credentials in HTTP Basic Auth headers.',
    whyUse: ['Encode text and files to Base64 for use in APIs and web applications', 'Decode Base64 strings back to readable text instantly', 'Handle file-based Base64 encoding for binary data'],
    whoUses: 'Web developers, API engineers, and system administrators working with encoded data across web protocols.',
    meta: { title: 'Base64 Encoder & Decoder - Encode/Decode Online | Tooliest', desc: 'Encode and decode Base64 text online. Convert text to Base64 and back instantly.' }
  },
  {
    id: 'url-encoder',
    name: 'URL Encoder/Decoder',
    description: 'Encode and decode URL strings with percent-encoding.',
    category: 'encoding',
    icon: '🔗',
    tags: ['url', 'encode', 'decode', 'percent encoding'],
    isAI: false,
    education: '<strong>URL encoding and percent-encoding</strong><br>URLs can only contain a limited set of ASCII characters. Special characters (spaces, &, =, ?, #) must be percent-encoded — replaced with a % followed by their two-digit hex value. For example, a space becomes %20 and & becomes %26. This is essential when constructing query strings, API parameters, and embedding URLs inside other URLs.',
    whyUse: ['Encode special characters in URLs for safe HTTP transmission', 'Decode percent-encoded URLs back to readable form', 'Build query strings and API parameters correctly'],
    whoUses: 'Web developers, API engineers, QA testers, and data analysts constructing and debugging HTTP requests.',
    faq: [
      { q: 'What is the difference between encodeURI and encodeURIComponent?', a: 'encodeURI encodes a full URL, leaving characters like / and ? intact. encodeURIComponent encodes a URL component (like a query parameter value), converting / and ? to %2F and %3F. Use encodeURIComponent for individual parameter values to avoid breaking URL structure.' }
    ],
    meta: { title: 'URL Encoder & Decoder - Encode URLs Online Free | Tooliest', desc: 'Encode and decode URLs online. Convert special characters to percent-encoded format and back.' }
  },
  {
    id: 'jwt-decoder',
    name: 'JWT Decoder',
    description: 'Decode JSON Web Tokens and inspect header, payload, and signature.',
    category: 'encoding',
    icon: '🎫',
    tags: ['jwt', 'token', 'decode', 'json web token'],
    isAI: false,
    education: '<strong>Understanding JSON Web Tokens</strong><br>JWTs are a compact, URL-safe token format used for authentication and authorization. Each JWT has three Base64-encoded parts: a header (algorithm and type), a payload (claims like user ID, roles, expiration), and a signature (verification hash). This decoder splits all three parts for inspection without needing the signing key.',
    whyUse: ['Decode and inspect JWT header and payload claims', 'Check token expiration timestamps and issuer information', 'Debug authentication issues in web applications and APIs'],
    whoUses: 'Full-stack developers, API engineers, security auditors, and DevOps teams debugging authentication flows.',
    faq: [
      { q: 'Is it safe to decode JWTs in the browser?', a: 'Yes. Decoding a JWT only reveals the header and payload, which are Base64-encoded (not encrypted). The signature cannot be forged without the secret key. Never share your signing secret, but the token itself is safe to decode client-side.' }
    ],
    meta: { title: 'JWT Decoder - Decode JSON Web Tokens Free | Tooliest', desc: 'Decode JWT tokens online. View header, payload, and signature claims. Free JWT decoder tool.' }
  },
  {
    id: 'hash-generator',
    name: 'Hash Generator',
    description: 'Generate MD5, SHA-1, SHA-256, and SHA-512 hashes from text.',
    category: 'encoding',
    icon: '#️⃣',
    tags: ['hash', 'md5', 'sha', 'checksum'],
    isAI: false,
    education: '<strong>Cryptographic hash functions</strong><br>Hash functions convert input data into a fixed-length digest that is practically impossible to reverse. MD5 (128-bit) and SHA-1 (160-bit) are legacy algorithms still used for checksums but considered insecure for cryptographic purposes. SHA-256 and SHA-512 are part of the SHA-2 family and are used in SSL certificates, blockchain, and password storage.',
    whyUse: ['Generate MD5, SHA-1, SHA-256, and SHA-512 hashes from any text', 'Verify file integrity by comparing hash values', 'All hashing is done locally — your data never leaves your browser'],
    whoUses: 'Developers, security engineers, system administrators, and IT professionals verifying data integrity.',
    faq: [
      { q: 'Is MD5 still safe to use?', a: 'MD5 is considered cryptographically broken and should not be used for security purposes like password storage or digital signatures. However, it is still commonly used for non-security checksums, such as verifying file downloads.' }
    ],
    meta: { title: 'Hash Generator - MD5, SHA-1, SHA-256 Online | Tooliest', desc: 'Generate MD5, SHA-1, SHA-256, SHA-512 hashes online. Free text hashing tool for developers.' }
  },

  // ===== MATH TOOLS =====
  {
    id: 'percentage-calculator',
    name: 'Percentage Calculator',
    description: 'Calculate percentages, percentage change, and percentage of a number.',
    category: 'math',
    icon: '%',
    tags: ['percentage', 'percent', 'calculator', 'math'],
    isAI: false,
    education: '<strong>Percentage calculations explained</strong><br>Percentages express a fraction of 100. Three common calculations: "What is X% of Y?" (X/100 × Y), "X is what % of Y?" (X/Y × 100), and "percentage change" ((New-Old)/Old × 100). This tool handles all three types with clear input fields and instant results.',
    whyUse: ['Calculate percentage of a number, percentage change, and percentage difference', 'Three calculation modes covering all common percentage scenarios', 'Get instant results with clear step-by-step breakdown'],
    whoUses: 'Students, business professionals, accountants, shoppers calculating discounts, and anyone doing quick math.',
    meta: { title: 'Percentage Calculator - Calculate Percentages Free | Tooliest', desc: 'Calculate percentages easily. Find percentage of a number, percentage change, and more.' }
  },
  {
    id: 'age-calculator',
    name: 'Age Calculator',
    description: 'Calculate exact age in years, months, and days from birth date.',
    category: 'math',
    icon: '🎂',
    tags: ['age', 'birthday', 'date', 'calculator'],
    isAI: false,
    education: '<strong>How age is calculated precisely</strong><br>An exact age calculation accounts for leap years, the varying length of months, and whether the current date is before or after the birthday in the current year. "Year difference" alone overcounts by 1 if the birthday hasn\'t occurred yet this year. This calculator returns years, months, and remaining days — and also shows how many days until your next birthday.',
    whyUse: ['Calculate exact age in years, months, and days', 'Find how many days until your next birthday', 'Useful for form validation, legal age checks, and milestone tracking'],
    whoUses: 'Parents tracking children\'s development, professionals verifying age eligibility, developers testing date logic, and anyone curious about exact time spans.',
    faq: [
      { q: 'How do I calculate my exact age?', a: 'Your exact age in years is the number of full birthday anniversaries that have passed. To get months and days, subtract additional time from the last birthday. For example, born January 15, 2000, on April 17, 2026: you are 26 years, 3 months, and 2 days old.' }
    ],
    meta: { title: 'Age Calculator - Calculate Exact Age Online | Tooliest', desc: 'Calculate your exact age in years, months, and days. Find days until your next birthday.' }
  },
  {
    id: 'bmi-calculator',
    name: 'BMI Calculator',
    description: 'Calculate Body Mass Index with health category classification.',
    category: 'math',
    icon: '⚖️',
    tags: ['bmi', 'health', 'weight', 'body mass'],
    isAI: false,
    education: '<strong>Understanding BMI and its limitations</strong><br>Body Mass Index (BMI) is calculated as weight (kg) ÷ height² (m²). The WHO classifies results as: Underweight (&lt;18.5), Normal (18.5–24.9), Overweight (25–29.9), and Obese (≥30). BMI is a useful screening tool but has known limitations — it does not directly measure body fat and can misclassify muscular individuals as overweight.',
    whyUse: ['Calculate BMI instantly in both metric (kg/cm) and imperial (lbs/in) units', 'Get WHO health category classification with context', 'Understand BMI as a starting point for health conversations'],
    whoUses: 'Individuals tracking personal health, healthcare professionals doing initial screenings, and fitness coaches monitoring client progress.',
    faq: [
      { q: 'What is a healthy BMI range?', a: 'According to the WHO, a BMI between 18.5 and 24.9 is considered "normal weight." Below 18.5 is underweight, 25–29.9 is overweight, and 30 or above is classified as obese. BMI is a population-level screening metric and should be interpreted alongside other health indicators.' }
    ],
    meta: { title: 'BMI Calculator - Body Mass Index Calculator | Tooliest', desc: 'Calculate your Body Mass Index (BMI). Get health category classification and weight recommendations.' }
  },

  {
    id: 'tip-calculator',
    name: 'Tip Calculator',
    description: 'Calculate tips and split bills between multiple people.',
    category: 'math',
    icon: '💵',
    tags: ['tip', 'restaurant', 'split bill', 'calculator'],
    isAI: false,
    education: '<strong>Tipping customs around the world</strong><br>Tipping norms vary significantly by country. In the United States, 15–20% is standard for restaurants. In the UK, 10–12.5% is common. In Japan and South Korea, tipping is often considered rude. This calculator handles any tip percentage, splits the bill evenly or by custom amounts, and shows per-person totals including the tip.',
    whyUse: ['Calculate tip amounts for any tip percentage instantly', 'Split bills evenly between any number of people', 'Shows individual share and total bill at a glance'],
    whoUses: 'Restaurant diners, travelers navigating foreign tipping customs, event organizers splitting catering costs, and group outing planners.',
    faq: [
      { q: 'How much should I tip at a restaurant?', a: 'In the United States, 15% is the minimum for adequate service, 18–20% is standard for good service, and 20%+ is for exceptional service. For a $50 bill: 15% = $7.50, 18% = $9.00, 20% = $10.00.' }
    ],
    meta: { title: 'Tip Calculator - Calculate Tips & Split Bills | Tooliest', desc: 'Calculate restaurant tips and split bills evenly. Choose tip percentage and number of people.' }
  },

  // ===== SOCIAL MEDIA TOOLS =====
  {
    id: 'twitter-counter',
    name: 'Twitter/X Character Counter',
    description: 'Count characters for Twitter/X posts with real-time limit indicator.',
    category: 'social',
    icon: '🐦',
    tags: ['twitter', 'x', 'character limit', '280'],
    isAI: false,
    education: '<strong>Twitter/X character counting rules</strong><br>Twitter/X allows 280 characters per post for standard accounts (previously 140). URLs are always counted as 23 characters regardless of actual length. Emojis count as 2 characters. Twitter Blue subscribers can post longer-form content up to 25,000 characters. This counter reflects standard 280-character rules and shows a real-time visual indicator.',
    whyUse: ['Count characters in real time as you compose your tweet', 'Visual countdown indicator shows when you are approaching the 280-character limit', 'Handles URL (23-char) and emoji (2-char) counting accurately'],
    whoUses: 'Social media managers, journalists, marketers, and creators crafting optimized posts for Twitter/X.',
    faq: [
      { q: 'How many characters does Twitter/X allow?', a: 'Standard Twitter/X accounts can post up to 280 characters per tweet. URLs always count as 23 characters. Emojis count as 2 characters. Twitter Blue subscribers get extended post length up to 25,000 characters.' }
    ],
    meta: { title: 'Twitter Character Counter - X Post Length Checker | Tooliest', desc: 'Count characters for Twitter/X posts. See remaining characters with visual limit indicator.' }
  },
  {
    id: 'instagram-caption',
    name: 'Instagram Caption Generator',
    description: 'AI-powered caption generator for Instagram posts with emoji suggestions.',
    category: 'social',
    icon: '📷',
    tags: ['instagram', 'caption', 'ai', 'social media'],
    isAI: true,
    education: '<strong>What makes a great Instagram caption?</strong><br>Top-performing Instagram captions typically open with a hook (a question or surprising fact) within the first 125 characters — since only those characters show without tapping "More." They end with a clear call-to-action (like, comment, follow, link in bio) and include 3–5 relevant hashtags. Emojis add visual personality and increase engagement rates by up to 15%.',
    whyUse: ['Generate engaging Instagram captions from a simple topic or keyword', 'Get emoji suggestions that match the post mood', 'Multiple tone options: fun, professional, inspirational, or promotional'],
    whoUses: 'Social media managers, content creators, small business owners, influencers, and anyone who regularly posts to Instagram.',
    faq: [
      { q: 'How long should an Instagram caption be?', a: 'Instagram captions can be up to 2,200 characters, but only the first 125 characters show in the feed before the "More" tap. For maximum impact, put your most important message in the first two lines, then expand with details, hashtags, or calls-to-action below.' }
    ],
    meta: { title: 'Instagram Caption Generator - AI Captions Free | Tooliest', desc: 'Generate engaging Instagram captions with AI. Get emoji suggestions and hashtag ideas.' }
  },
  {
    id: 'hashtag-generator',
    name: 'Hashtag Generator',
    description: 'AI-powered hashtag generator for maximum social media reach.',
    category: 'social',
    icon: '#️⃣',
    tags: ['hashtag', 'social media', 'ai', 'trending'],
    isAI: true,
    education: '<strong>Hashtag strategy for social media reach</strong><br>Hashtags categorize content and make it discoverable to users following specific topics. On Instagram, the sweet spot is 5–10 highly relevant hashtags — not the maximum 30 (which signals spam). On TikTok, 3–5 niche hashtags outperform broad ones. On LinkedIn, 3–5 professional hashtags are effective. Mix broad (#marketing) with niche (#emailmarketingtips) to balance reach and targeting.',
    whyUse: ['Generate relevant hashtags for Instagram, TikTok, Twitter, and LinkedIn', "Mix broad and niche hashtags for maximum reach without triggering spam filters", 'Get category-specific hashtag suggestions based on your topic'],
    whoUses: 'Social media managers, content creators, brand marketers, bloggers, and small business owners growing organic social reach.',
    faq: [
      { q: 'How many hashtags should I use on Instagram?', a: 'Instagram\'s own research and creator accounts suggest 3–10 highly relevant hashtags perform better than 30 generic ones. Focus on hashtags with 10K–1M posts for the best balance of discoverability and competition. Avoid banned or overused hashtags.' }
    ],
    meta: { title: 'Hashtag Generator - AI Social Media Hashtags | Tooliest', desc: 'Generate trending hashtags for social media. AI-powered suggestions for Instagram, Twitter, and TikTok.' }
  },
  {
    id: 'youtube-thumbnail',
    name: 'YouTube Thumbnail Previewer',
    description: 'Preview how your YouTube thumbnail will look in search results and feeds.',
    category: 'social',
    icon: '▶️',
    tags: ['youtube', 'thumbnail', 'preview', 'video'],
    isAI: false,
    education: '<strong>Why thumbnails matter on YouTube</strong><br>YouTube thumbnails are the #1 factor in click-through rate (CTR), which directly influences YouTube\'s recommendation algorithm. The ideal thumbnail is 1280×720px (16:9 ratio), under 2MB, and uses high-contrast colors, readable text at small sizes, and a human face with expressive emotion (proven to increase clicks by up to 30%). Preview at multiple sizes before uploading.',
    whyUse: ['Preview thumbnails at actual YouTube search result and suggested video sizes', 'Test how your title, face, and colors appear at small screen sizes', 'Catch readability issues before publishing'],
    whoUses: 'YouTubers, video marketers, content strategists, and thumbnail designers optimizing video click-through rates.',
    faq: [
      { q: 'What is the ideal YouTube thumbnail size?', a: 'YouTube recommends 1280×720 pixels with a 16:9 aspect ratio, under 2MB in JPG, GIF, or PNG format. Always check how it looks at the small card thumbnail size (320×180) — text must remain readable at that scale.' }
    ],
    meta: { title: 'YouTube Thumbnail Previewer - Test Thumbnails | Tooliest', desc: 'Preview YouTube thumbnails in search results and recommended feeds. Test before uploading.' }
  },

  // ===== PRIVACY TOOLS =====
  {
    id: 'password-security-suite',
    name: 'Password Security Suite',
    description: 'Generate strong, secure passwords and instantly check their vulnerability strength.',
    category: 'privacy',
    icon: '🛡️',
    tags: ['password', 'security', 'generator', 'strong', 'check', 'strength'],
    isAI: false,
    education: '<strong>Password security best practices</strong><br>Strong passwords are at least 12 characters long and include uppercase letters, lowercase letters, numbers, and special characters. The most important factor is length — each additional character exponentially increases the number of possible combinations. A 16-character random password would take billions of years to brute-force with current technology.',
    whyUse: ['Generate cryptographically strong random passwords', 'Check existing passwords for strength and common vulnerability patterns', 'Customize length, character types, and exclusions'],
    whoUses: 'Security-conscious individuals, IT administrators, and developers implementing password policies.',
    faq: [
      { q: 'How long should a secure password be?', a: 'Security experts recommend a minimum of 12 characters, with 16+ being ideal. Length is the single most important factor in password strength. A 16-character random password is virtually uncrackable with current technology.' }
    ],
    meta: { title: 'Password Security Suite - Generate & Check Passwords | Tooliest', desc: 'Generate strong, secure passwords and perform detailed vulnerability strength analysis all in one place.' }
  },
  {
    id: 'uuid-generator',
    name: 'UUID Generator',
    description: 'Generate random UUIDs (v4) for use as unique identifiers.',
    category: 'privacy',
    icon: '🆔',
    tags: ['uuid', 'guid', 'unique id', 'random'],
    isAI: false,
    education: '<strong>What is a UUID?</strong><br>UUID (Universally Unique Identifier) is a 128-bit identifier standardized by RFC 4122. Version 4 UUIDs are randomly generated and have a collision probability so low it is statistically negligible (1 in 5.3×10³¶ per generated pair). UUIDs are used as primary keys in databases, session tokens, transaction IDs, and anywhere a unique identifier is needed without a central registry.',
    whyUse: ['Generate cryptographically random UUID v4 identifiers instantly', 'Bulk generate multiple UUIDs at once for batch operations', 'Copy a UUID to clipboard with one click'],
    whoUses: 'Backend developers, database architects, DevOps engineers, and QA teams needing unique identifiers for records, sessions, and tests.',
    faq: [
      { q: 'What is the difference between UUID v1 and UUID v4?', a: 'UUID v1 is generated from the current timestamp and MAC address — it is time-based and can expose when and where it was created. UUID v4 is randomly generated with no traceable information. Use v4 for general-purpose identifiers and v1 only when time-ordering is specifically required.' }
    ],
    meta: { title: 'UUID Generator - Generate Random UUIDs v4 | Tooliest', desc: 'Generate random UUID v4 identifiers. Create unique IDs for databases, APIs, and applications.' }
  },
  {
    id: 'fake-data-generator',
    name: 'Fake Data Generator',
    description: 'Generate realistic fake data for testing: names, emails, addresses, and more.',
    category: 'privacy',
    icon: '🎭',
    tags: ['fake data', 'mock', 'test data', 'generator'],
    isAI: false,
    education: '<strong>Why use fake data for testing?</strong><br>Using real user data in development and testing environments is a major GDPR and HIPAA compliance risk. Realistic fake (synthetic) data — with valid-looking names, emails, phone numbers, addresses, and credit card numbers — lets you build and test features without exposing real user information. All data generated by this tool is completely fictional.',
    whyUse: ['Generate realistic test data for frontend prototypes and database seeding', 'Avoid GDPR compliance risk by never using real user data in development', 'Generate names, emails, addresses, phone numbers, and more in bulk'],
    whoUses: 'Software developers, QA engineers, data scientists building test datasets, and UX designers prototyping with realistic placeholder content.',
    faq: [
      { q: 'Is it legal to use fake data generators?', a: 'Yes. Synthetic test data generators create completely fictional data. The generated names, emails, and addresses do not correspond to real people, making them safe for development, testing, and demonstration purposes without any privacy or compliance risk.' }
    ],
    meta: { title: 'Fake Data Generator - Generate Test Data Free | Tooliest', desc: 'Generate realistic fake data for testing. Names, emails, addresses, phone numbers, and more.' }
  },
  {
    id: 'image-exif-stripper',
    name: 'Image EXIF Privacy Stripper',
    description: 'Remove hidden GPS locations and tracking metadata from your photos completely offline.',
    category: 'privacy',
    icon: '🥷',
    tags: ['exif', 'metadata', 'remove', 'privacy', 'gps', 'stripper'],
    isAI: false,
    education: '<strong>What is EXIF metadata and why does it matter?</strong><br>EXIF (Exchangeable Image File Format) data is hidden metadata embedded in photos by cameras and smartphones. It includes GPS coordinates (your exact location when the photo was taken), camera make/model, time and date, exposure settings, and even the device serial number. Sharing photos without stripping EXIF can inadvertently expose where you live, work, or travel.',
    whyUse: ['Remove GPS coordinates and location data from photos before sharing', 'Strip camera brand/model, date, and device information for privacy', '100% offline processing — your photos never leave your browser'],
    whoUses: 'Privacy-conscious individuals, journalists protecting sources, activists, travel bloggers, and anyone sharing images publicly online.',
    faq: [
      { q: 'Can my GPS location be tracked from a photo?', a: 'Yes. Smartphones embed GPS coordinates in every photo by default unless location access is disabled for the camera app. The exact latitude and longitude of where the photo was taken is stored in the EXIF data and is readable by anyone with the photo file. Stripping EXIF before sharing publicly is a critical privacy step.' }
    ],
    meta: { title: 'Image EXIF Metadata Stripper - Remove GPS Info For Free | Tooliest', desc: 'Strip EXIF metadata, GPS locations, and camera data from your images 100% locally. Protect your privacy.' }
  },

  // ===== AI TOOLS =====
  {
    id: 'ai-text-summarizer',
    name: 'AI Text Summarizer',
    description: 'Summarize long texts into concise summaries using AI algorithms.',
    category: 'ai',
    icon: '📑',
    tags: ['summarize', 'ai', 'tldr', 'summary'],
    isAI: true,
    education: '<strong>How AI text summarization works</strong><br>AI text summarization uses natural language processing (NLP) to identify the most important sentences and concepts in a text. Extractive summarization selects key sentences verbatim, while abstractive summarization generates new sentences that capture the core meaning. This tool uses extractive methods to preserve accuracy while delivering concise summaries.',
    whyUse: ['Summarize long articles, reports, and documents into concise key points', 'Get TLDR summaries at adjustable length (short, medium, detailed)', 'Process research papers, news articles, and meeting notes quickly'],
    whoUses: 'Researchers, students, journalists, content curators, and busy professionals who need to digest large amounts of text efficiently.',
    faq: [
      { q: 'How accurate is AI summarization?', a: 'AI summarization works best with well-structured content like articles, reports, and documentation. It excels at identifying key sentences and themes. For creative or highly technical content, always review the summary against the original to ensure critical nuances are captured.' }
    ],
    meta: { title: 'AI Text Summarizer - Summarize Text Free | Tooliest', desc: 'Summarize long text into concise summaries with AI. Get key points and TLDR instantly.' }
  },
  {
    id: 'ai-paraphraser',
    name: 'AI Paraphraser',
    description: 'Rephrase text in different styles while keeping the meaning intact.',
    category: 'ai',
    icon: '🔄',
    tags: ['paraphrase', 'rephrase', 'rewrite', 'ai'],
    isAI: true,
    education: '<strong>What is paraphrasing and when to use it?</strong><br>Paraphrasing rewrites text in different words while preserving the original meaning. It is a fundamental writing skill used for: avoiding plagiarism in academic work, simplifying complex text for a different audience, changing the tone (formal to casual), and refreshing repetitive content. AI paraphrasing tools identify synonyms and restructure sentences while maintaining semantic accuracy.',
    whyUse: ['Rephrase text in formal, casual, creative, or academic styles', 'Simplify complex passages for a wider audience', 'Refresh repetitive copy without changing the underlying message'],
    whoUses: 'Students avoiding plagiarism, content writers refreshing copy, marketers adapting tone for different audiences, and non-native speakers improving fluency.',
    faq: [
      { q: 'Is AI paraphrasing considered plagiarism?', a: 'Paraphrasing with proper attribution is not plagiarism. However, submitting AI-paraphrased content without attribution in academic contexts may violate your institution\'s academic integrity policy. Always cite the original source and check your school or organization\'s guidelines on AI-assisted writing.' }
    ],
    meta: { title: 'AI Paraphraser - Rephrase Text Free Online | Tooliest', desc: 'Paraphrase text with AI. Rephrase in formal, casual, or creative styles while keeping meaning intact.' }
  },
  {
    id: 'ai-email-writer',
    name: 'AI Email Writer',
    description: 'Generate professional emails from simple prompts. Multiple tones available.',
    category: 'ai',
    icon: '✉️',
    tags: ['email', 'write', 'ai', 'professional'],
    isAI: true,
    education: '<strong>The anatomy of an effective professional email</strong><br>Professional emails follow a clear structure: a specific subject line (not "Hello"), a personalized opener, a concise body with one clear purpose per email, and a specific call-to-action. The average professional receives 121 emails per day — getting to the point quickly and using a clear subject line are the two highest-impact improvements.',
    whyUse: ['Generate professional email drafts from a single sentence prompt', 'Choose from multiple tones: formal, friendly, assertive, or apologetic', 'Overcome writer\'s block for difficult emails like complaints, follow-ups, and negotiations'],
    whoUses: 'Business professionals, customer support teams, salespeople, recruiters, and anyone who needs to send professional emails quickly.',
    faq: [
      { q: 'How do I write a professional email?', a: 'A strong professional email has: (1) a specific subject line summarizing the request, (2) a greeting with the recipient\'s name, (3) a brief opening that states your purpose, (4) a concise body — 3–4 sentences maximum, (5) a clear call-to-action, and (6) a professional sign-off like "Best regards" or "Sincerely."' }
    ],
    meta: { title: 'AI Email Writer - Generate Professional Emails | Tooliest', desc: 'Write professional emails with AI. Choose tone, style, and purpose. Generate emails from simple prompts.' }
  },
  {
    id: 'ai-blog-ideas',
    name: 'AI Blog Idea Generator',
    description: 'Generate blog post ideas and outlines from any topic or keyword.',
    category: 'ai',
    icon: '💡',
    tags: ['blog', 'ideas', 'ai', 'content'],
    isAI: true,
    education: '<strong>How to generate blog ideas that rank</strong><br>The best blog ideas sit at the intersection of what your audience searches for and what you can write authoritatively about. SEO-driven ideas target specific long-tail keywords (e.g., "best JSON formatter for developers" rather than just "JSON"). Content-driven ideas answer common questions directly ("how to," "what is," "why does"). This generator combines both approaches.',
    whyUse: ['Generate blog post ideas and headline variations from any keyword or topic', 'Get content angles like tutorials, listicles, comparisons, and opinion pieces', 'Break through content blocks instantly with AI-powered brainstorming'],
    whoUses: 'Content marketers, bloggers, SEO specialists, digital agencies, and founders building content-driven growth strategies.',
    faq: [
      { q: 'How do I come up with blog post ideas?', a: 'Effective blog ideas come from: (1) keyword research (what questions do people search?), (2) competitor gaps (what topics do they miss?), (3) customer questions (what do your users ask repeatedly?), and (4) trending topics in your niche. This generator combines all four angles to surface actionable ideas.' }
    ],
    meta: { title: 'AI Blog Idea Generator - Content Ideas Free | Tooliest', desc: 'Generate blog post ideas from any topic. Get outlines, title suggestions, and content angles with AI.' }
  },
  {
    id: 'ai-meta-writer',
    name: 'AI Meta Description Writer',
    description: 'Generate SEO-optimized meta descriptions from your page content.',
    category: 'ai',
    icon: '🏷️',
    tags: ['meta description', 'seo', 'ai', 'google'],
    isAI: true,
    education: '<strong>What is a meta description and why does it matter?</strong><br>A meta description is the 150–160 character summary shown below your page title in Google search results. While it is not a direct ranking factor, it strongly influences click-through rate (CTR). A compelling meta description with the target keyword and a clear value proposition can improve CTR by 5–10%, effectively increasing your traffic without changing your ranking position.',
    whyUse: ['Generate compelling meta descriptions that improve search click-through rates', 'Ensure descriptions stay within the 150–160 character Google limit', 'Include primary keywords naturally for both SEO and user relevance'],
    whoUses: 'SEO specialists, content marketers, bloggers, web developers, and anyone optimizing pages for Google search performance.',
    faq: [
      { q: 'How long should a meta description be?', a: 'Google typically displays meta descriptions up to 155–160 characters on desktop and around 120 characters on mobile. Write descriptions that are 140–155 characters to stay within limits on both devices. Include your primary keyword and a clear call-to-action ("Learn how," "Get started," "Try free").' }
    ],
    meta: { title: 'AI Meta Description Generator - SEO Optimized | Tooliest', desc: 'Generate SEO-optimized meta descriptions with AI. Create compelling descriptions for better CTR.' }
  },

  // ===== DEVELOPER TOOLS =====
  {
    id: 'cron-parser',
    name: 'Cron Expression Parser',
    description: 'Parse and explain cron expressions in human-readable format.',
    category: 'developer',
    icon: '⏰',
    tags: ['cron', 'schedule', 'parse', 'explain'],
    isAI: false,
    education: '<strong>Cron expression syntax</strong><br>Cron expressions use five or six fields to define schedules: minute, hour, day-of-month, month, day-of-week, and optionally year. Special characters include * (any), / (step), - (range), and , (list). For example, <code>0 9 * * MON-FRI</code> means "at 9:00 AM every weekday." This parser converts complex expressions into plain English.',
    whyUse: ['Convert cron expressions to human-readable descriptions', 'Validate cron syntax before deploying scheduled tasks', 'Build new cron expressions with an interactive visual builder'],
    whoUses: 'DevOps engineers, system administrators, and backend developers managing scheduled tasks, CI/CD pipelines, and automated workflows.',
    faq: [
      { q: 'What does * * * * * mean in cron?', a: 'Five asterisks (* * * * *) means "every minute of every hour of every day of every month on every day of the week." In other words, the task runs once per minute, 24/7.' }
    ],
    meta: { title: 'Cron Expression Parser - Explain Cron Syntax | Tooliest', desc: 'Parse cron expressions and see them in human-readable format. Build and validate cron schedules.' }
  },
  {
    id: 'diff-checker',
    name: 'Diff Checker',
    description: 'Compare two texts and highlight the differences line by line.',
    category: 'developer',
    icon: '🔍',
    tags: ['diff', 'compare', 'merge', 'text difference'],
    isAI: false,
    education: '<strong>Text diffing algorithms</strong><br>Diff tools compare two pieces of text and highlight the differences. The algorithms (similar to Git\'s diff) identify additions, deletions, and modifications on a line-by-line basis. This is essential for code review, content versioning, and verifying that edits were applied correctly.',
    whyUse: ['Compare two texts side by side with color-coded differences', 'Identify additions (green), deletions (red), and modifications', 'Review code changes, document revisions, and configuration updates'],
    whoUses: 'Developers doing code reviews, technical writers tracking document changes, and QA teams verifying update correctness.',
    meta: { title: 'Diff Checker - Compare Text Differences Online | Tooliest', desc: 'Compare two texts side by side. Highlight additions, deletions, and modifications. Free diff tool.' }
  },
  {
    id: 'sql-formatter',
    name: 'SQL Formatter',
    description: 'Format and beautify SQL queries with proper indentation and keywords.',
    category: 'developer',
    icon: '🗄️',
    tags: ['sql', 'format', 'beautify', 'query'],
    isAI: false,
    education: '<strong>SQL formatting standards</strong><br>Well-formatted SQL queries are easier to read, debug, and maintain. Common conventions include uppercasing keywords (SELECT, FROM, WHERE), putting each clause on its own line, and indenting subqueries and JOINs. This formatter supports MySQL, PostgreSQL, SQL Server, and standard SQL syntax.',
    whyUse: ['Format complex SQL queries with proper indentation and keyword casing', 'Debug hard-to-read one-line queries by expanding them', 'Support for MySQL, PostgreSQL, SQL Server, and standard SQL'],
    whoUses: 'Database administrators, backend developers, data analysts, and anyone writing or debugging SQL queries.',
    meta: { title: 'SQL Formatter - Beautify SQL Queries Online | Tooliest', desc: 'Format and beautify SQL queries online. Auto-indent, uppercase keywords, and format subqueries.' }
  },
  {
    id: 'chmod-calculator',
    name: 'Chmod Calculator',
    description: 'Calculate Unix file permissions in numeric and symbolic notation.',
    category: 'developer',
    icon: '🔒',
    tags: ['chmod', 'permissions', 'unix', 'linux'],
    isAI: false,
    education: '<strong>Unix file permissions explained</strong><br>Unix/Linux file permissions control who can read (r), write (w), and execute (x) files. Permissions are set for three groups: owner, group, and others. The numeric notation (e.g., 755) uses octal digits where 4=read, 2=write, 1=execute. So 755 means owner gets full access (7), while group and others can read and execute (5).',
    whyUse: ['Convert between numeric (755) and symbolic (rwxr-xr-x) permission formats', 'Calculate correct permissions for files and directories', 'Understand permission impact with a visual checkbox interface'],
    whoUses: 'Linux system administrators, DevOps engineers, web hosting managers, and developers deploying to Unix-based servers.',
    faq: [
      { q: 'What does chmod 755 mean?', a: 'chmod 755 sets permissions to rwxr-xr-x: the owner can read, write, and execute (7); the group can read and execute (5); and others can read and execute (5). This is the standard permission for web server directories and executable scripts.' }
    ],
    meta: { title: 'Chmod Calculator - Unix File Permissions | Tooliest', desc: 'Calculate Unix chmod permissions. Convert between numeric (755) and symbolic (rwxr-xr-x) notation.' }
  },

  // ===== FINANCE TOOLS =====
  {
    id: 'loan-mortgage-analyzer',
    name: 'Ultimate Loan & Mortgage Analyzer',
    description: 'Calculate EMI, mortgage payments, taxes, insurance, and view visual amortization schedules for any type of loan.',
    category: 'finance',
    icon: '🏦',
    tags: ['emi', 'loan', 'monthly payment', 'amortization', 'mortgage', 'housing', 'auto'],
    isAI: true,
    education: '<strong>Understanding EMI and mortgage payments</strong><br>EMI (Equated Monthly Installment) is a fixed monthly payment combining principal and interest. Mortgage payments can also include property taxes and homeowner\'s insurance (PITI). An amortization schedule shows how each payment is split between principal reduction and interest over the loan term. Early payments are mostly interest, shifting toward principal over time.',
    whyUse: ['Calculate monthly payments for any loan type including mortgage, auto, and personal loans', 'See complete amortization schedules with visual charts', 'Include taxes, insurance, and PMI for realistic mortgage estimates'],
    whoUses: 'Home buyers, mortgage shoppers, financial planners, and anyone comparing loan options.',
    faq: [
      { q: 'What is included in a mortgage payment?', a: 'A full mortgage payment (PITI) includes Principal (loan amount), Interest (lender cost), Taxes (property taxes), and Insurance (homeowner insurance). Some lenders also require PMI if your down payment is less than 20%.' }
    ],
    meta: { title: 'Ultimate Loan & Mortgage Analyzer - EMI Calculator | Tooliest', desc: 'Calculate EMI and mortgage payments with taxes and insurance. Includes visual amortization chart and payment breakdown.' }
  },
  {
    id: 'compound-interest',
    name: 'Compound Interest Calculator',
    description: 'See how your money grows with compound interest. Visual growth chart with yearly breakdown.',
    category: 'finance',
    icon: '📈',
    tags: ['compound interest', 'savings', 'investment', 'growth'],
    isAI: true,
    education: '<strong>The power of compound interest</strong><br>Compound interest earns interest on both the initial principal and accumulated interest from previous periods. Albert Einstein reportedly called it "the eighth wonder of the world." The formula is A = P(1 + r/n)^(nt), where P is principal, r is annual rate, n is compounding frequency, and t is time in years. Even small regular contributions can grow dramatically over decades.',
    whyUse: ['Calculate future value of investments with compound interest', 'See visual growth charts showing wealth accumulation over time', 'Compare different contribution amounts and interest rate scenarios'],
    whoUses: 'Investors, financial planners, students learning about compounding, and anyone planning long-term savings goals.',
    meta: { title: 'Compound Interest Calculator - Investment Growth | Tooliest', desc: 'Calculate compound interest with visual growth chart. See how your savings grow over time with monthly contributions.' }
  },
  {
    id: 'sip-calculator',
    name: 'SIP / Investment Calculator',
    description: 'Calculate returns on Systematic Investment Plans with wealth growth visualization.',
    category: 'finance',
    icon: '💹',
    tags: ['sip', 'mutual fund', 'investment', 'returns'],
    isAI: true,
    education: '<strong>What is a SIP and how does it work?</strong><br>A Systematic Investment Plan (SIP) is a disciplined investment method where a fixed amount is invested in mutual funds at regular intervals (monthly, weekly, or quarterly). SIPs harness <em>rupee cost averaging</em> — buying more units when prices are low and fewer when high — reducing the impact of market volatility. The long-term compound growth from consistent small investments is the core power of SIP.',
    whyUse: ['Calculate total returns and wealth growth from monthly SIP contributions', 'See a visual chart comparing invested amount vs. returns over time', 'Compare different contribution amounts and expected return rates'],
    whoUses: 'Retail investors, financial planners, millennials building wealth through mutual funds, and anyone planning disciplined long-term investing.',
    faq: [
      { q: 'What is rupee cost averaging in SIP?', a: 'Rupee cost averaging (or dollar cost averaging) is the practice of investing a fixed amount at regular intervals regardless of market price. When prices are low, you buy more units; when prices are high, you buy fewer. Over time, this lowers the average cost per unit compared to investing a lump sum at market peak.' }
    ],
    meta: { title: 'SIP Calculator - Systematic Investment Plan Returns | Tooliest', desc: 'Calculate SIP returns and wealth growth. Visual chart showing invested amount vs returns over time.' }
  },
  {
    id: 'retirement-calculator',
    name: 'Retirement Calculator',
    description: 'Plan your retirement with savings projections, inflation adjustment, and withdrawal planning.',
    category: 'finance',
    icon: '🏖️',
    tags: ['retirement', 'pension', 'savings', 'financial planning'],
    isAI: true,
    education: '<strong>The 4% retirement rule explained</strong><br>The 4% rule (Bengen\'s rule) suggests that retirees can withdraw 4% of their retirement savings annually with a high probability of not running out of money over a 30-year retirement. For example, $1M in retirement savings = $40,000/year. However, with longer life expectancies and lower bond yields, many financial planners now recommend a 3–3.5% withdrawal rate.',
    whyUse: ['Project retirement savings based on current contributions and expected returns', 'Adjust for inflation to see real purchasing power at retirement', 'Calculate how much you need to save to reach your retirement income goal'],
    whoUses: 'Individuals planning retirement, financial advisors running client scenarios, and anyone wondering if they are on track to retire comfortably.',
    faq: [
      { q: 'How much do I need to retire?', a: 'A common rule of thumb is to save 25× your desired annual retirement income (the "25x rule," based on the 4% withdrawal rate). For $50,000/year of retirement income, you need $1.25M. This varies with your expected lifestyle, health costs, Social Security income, and investment returns.' }
    ],
    meta: { title: 'Retirement Calculator - Retirement Savings Planner | Tooliest', desc: 'Plan your retirement savings. Calculate how much you need to save with inflation-adjusted projections.' }
  },
  {
    id: 'roi-calculator',
    name: 'ROI Calculator',
    description: 'Calculate Return on Investment with annualized returns and visual comparison.',
    category: 'finance',
    icon: '📊',
    tags: ['roi', 'return on investment', 'profit', 'loss'],
    isAI: true,
    education: '<strong>Return on Investment (ROI) explained</strong><br>ROI measures the profitability of an investment relative to its cost. The formula is ROI = (Net Profit ÷ Cost of Investment) × 100. For example, investing $10,000 and receiving $13,000 back gives ROI = (3,000 ÷ 10,000) × 100 = 30%. Annualized ROI adjusts for time, enabling fair comparison between investments held for different durations.',
    whyUse: ['Calculate ROI and annualized returns for any investment', 'Compare multiple investments with different time horizons fairly', 'See visual profit/loss charts with break-even analysis'],
    whoUses: 'Business owners evaluating marketing campaigns, investors comparing asset returns, startup founders measuring product ROI, and finance students.',
    faq: [
      { q: 'What is a good ROI?', a: 'A "good" ROI depends on the investment type and risk level. The S\u0026P 500 averages ~10% annually (historical). Real estate averages 8–12% including appreciation. Marketing campaigns targeting 300–500% ROI on ad spend. For individual stock picks, beating the S\u0026P 500 index is considered outperformance.' }
    ],
    meta: { title: 'ROI Calculator - Return on Investment Calculator | Tooliest', desc: 'Calculate ROI and annualized returns. Compare investments with visual charts and profit analysis.' }
  },
  {
    id: 'debt-payoff',
    name: 'Debt Payoff Calculator',
    description: 'Plan your debt-free journey with snowball and avalanche methods. Visual payoff timeline.',
    category: 'finance',
    icon: '🎯',
    tags: ['debt', 'payoff', 'snowball', 'avalanche'],
    isAI: true,
    education: '<strong>Snowball vs. Avalanche debt payoff methods</strong><br>The <strong>Debt Snowball</strong> method pays off the smallest debt first, then rolls that payment to the next — creating psychological momentum. The <strong>Debt Avalanche</strong> method pays the highest-interest debt first, minimizing total interest paid mathematically. Avalanche saves more money; Snowball is better for motivation. This calculator shows both strategies with a timeline and total interest comparison.',
    whyUse: ['Compare debt snowball and avalanche payoff strategies side by side', 'See your exact debt-free date and total interest saved', 'Create a realistic payoff plan with a visual monthly timeline'],
    whoUses: 'Individuals with credit card debt, student loans, or multiple debts, personal finance enthusiasts, and financial coaches guiding debt reduction plans.',
    faq: [
      { q: 'What is the debt snowball method?', a: 'The debt snowball method prioritizes paying off your smallest debt first while making minimum payments on larger debts. Once the smallest is paid off, you roll its payment amount to the next smallest debt. This builds psychological momentum — the feeling of eliminating accounts motivates continued progress.' }
    ],
    meta: { title: 'Debt Payoff Calculator - Get Debt Free | Tooliest', desc: 'Plan your debt payoff with snowball & avalanche methods. See your debt-free date and total interest saved.' }
  },
  // ===== AUDIO TOOLS =====
  {
    id: 'audio-converter',
    name: 'Audio Converter',
    description: 'Convert MP3, WAV, FLAC, M4A, OGG, OPUS, WMA and more — entirely in your browser. No uploads, 100% private.',
    category: 'converter',
    icon: '🎵',
    tags: ['audio', 'mp3', 'wav', 'flac', 'm4a', 'ogg', 'convert', 'music', 'opus'],
    isAI: false,
    education: '<strong>How does browser-based audio conversion work?</strong><br>This converter uses the <strong>Web Audio API</strong>, <strong>MediaRecorder</strong>, and a lightweight in-browser MP3 encoder to transform audio files locally on your device. Your audio files <strong>never leave your browser</strong>, there are <strong>no uploads</strong>, and the tool does not depend on SharedArrayBuffer or a server backend.',
    meta: { title: 'Free Audio Converter - Convert MP3 WAV FLAC OGG Online | Tooliest', desc: 'Convert audio files between MP3, WAV, FLAC, M4A, OGG, OPUS and more. 100% browser-based, private, and free. No uploads needed.' }
  },

  {
    id: 'inflation-calculator',
    name: 'Inflation Calculator',
    description: 'Calculate the impact of inflation on purchasing power over time with visual charts.',
    category: 'finance',
    icon: '📉',
    tags: ['inflation', 'purchasing power', 'cpi', 'cost of living'],
    isAI: true,
    education: '<strong>How inflation erodes purchasing power</strong><br>Inflation is the rate at which prices rise over time, measured by the Consumer Price Index (CPI). At 3% annual inflation, $100 today will only buy $74 worth of goods in 10 years. This is why investing is necessary to preserve wealth — savings accounts earning below the inflation rate lose purchasing power in real terms. Central banks target 2% inflation as the optimal balance between growth and stability.',
    whyUse: ['Calculate how much purchasing power your money loses to inflation over time', 'Find the inflation-adjusted equivalent of a historical price today', 'Plan salary negotiations and investment returns factoring in real inflation'],
    whoUses: 'Personal finance planners, investors calculating real returns, HR professionals adjusting salaries, policy analysts, and economists.',
    faq: [
      { q: 'What is the current inflation rate?', a: 'Inflation rates change frequently. In the United States, the Federal Reserve targets a 2% annual inflation rate. From 2021–2023, the US experienced peak inflation of 8–9% (the highest since the 1980s) before cooling back toward the 2–3% range. Check the US Bureau of Labor Statistics (BLS) for the most current CPI data.' }
    ],
    meta: { title: 'Inflation Calculator - Purchasing Power Calculator | Tooliest', desc: 'Calculate how inflation affects your money over time. See purchasing power decline with visual charts.' }
  },
];

const TOOLIEST_CATEGORY_AUDIENCES = {
  text: 'Writers, editors, students, marketers, and documentation teams handling everyday text workflows.',
  seo: 'SEO specialists, content marketers, founders, and web teams improving search visibility and click-through rates.',
  css: 'Front-end developers, UI designers, and product teams refining visual styles and interface polish.',
  color: 'Designers, accessibility reviewers, and brand teams working with palettes, contrast, and visual systems.',
  image: 'Designers, content creators, marketers, and developers editing graphics without leaving the browser.',
  json: 'Developers, QA engineers, and API teams working with structured data, payloads, and configuration files.',
  html: 'Front-end developers, technical SEOs, and publishers reviewing markup and page structure.',
  javascript: 'JavaScript developers, QA engineers, and product teams debugging or preparing browser-side code.',
  converter: 'Developers, analysts, and everyday users converting files, values, or formats quickly.',
  encoding: 'Developers, security engineers, and API teams encoding, decoding, or inspecting transmitted data.',
  finance: 'Investors, analysts, planners, and households making calculations before real money decisions.',
  math: 'Students, teachers, engineers, and office teams running quick calculations with less manual effort.',
  social: 'Social media managers, creators, and brand teams publishing within platform constraints.',
  privacy: 'Privacy-conscious users, security teams, and developers validating content without uploads.',
  ai: 'Content teams, founders, marketers, and operators who need faster first drafts and practical idea generation.',
  developer: 'Developers, DevOps engineers, and technical teams shipping, debugging, and documenting software.',
};

function getTooliestCategory(tool) {
  return TOOL_CATEGORIES.find((category) => category.id === tool.category) || { name: 'Online Tools' };
}

function getTooliestPrimaryTopic(tool) {
  return (tool.tags && tool.tags[0]) || tool.name.toLowerCase();
}

function getTooliestActionSentence(tool) {
  const description = String(tool.description || '').trim().replace(/\.+$/, '');
  if (!description) {
    return `${tool.name} helps you complete the task directly in your browser`;
  }
  return description.charAt(0).toUpperCase() + description.slice(1);
}

function buildTooliestEducation(tool) {
  const categoryName = getTooliestCategory(tool).name.replace(/\s+Tools$/i, '').toLowerCase();
  const action = getTooliestActionSentence(tool);
  const primaryTopic = getTooliestPrimaryTopic(tool);
  return `<strong>What does ${tool.name} do?</strong><br>${action}. Tooliest keeps this ${categoryName} workflow in your browser so you can work with ${primaryTopic} tasks instantly without uploads, installs, or account friction.<br><br><strong>When should you use it?</strong><br>Use ${tool.name} when you want a fast, private way to finish repeatable ${categoryName} work, verify the result immediately, and move on without sending your data to a server.`;
}

function buildTooliestWhyUse(tool) {
  const action = getTooliestActionSentence(tool).replace(/\.$/, '');
  return [
    `${action} with a fast browser-based workflow instead of switching apps.`,
    `Keep sensitive input on your device because Tooliest processes this tool locally in the browser.`,
    `Get results you can review, copy, or download in seconds on desktop or mobile.`,
  ];
}

function buildTooliestWhoUses(tool) {
  return TOOLIEST_CATEGORY_AUDIENCES[tool.category] || 'Professionals, students, and everyday users who want quick results without extra setup.';
}

function buildTooliestFaq(tool) {
  const categoryName = getTooliestCategory(tool).name.replace(/\s+Tools$/i, '').toLowerCase();
  const action = getTooliestActionSentence(tool);
  return [
    {
      q: `How do I use ${tool.name} online?`,
      a: `Open Tooliest's ${tool.name}, enter your input, and run the tool. ${action}. Results are generated instantly in your browser with no signup required.`,
    },
    {
      q: `Is ${tool.name} safe for sensitive data?`,
      a: `Yes. Tooliest runs ${tool.name} client-side in your browser, so your input is not uploaded to a remote server for processing. That makes it a practical option when privacy matters.`,
    },
    {
      q: `Why use ${tool.name} instead of another ${categoryName} tool?`,
      a: `${tool.name} gives you a fast workflow, immediate output, and zero account friction. It is useful when you want to finish ${categoryName} tasks quickly without bouncing between downloads, dashboards, or server-based tools.`,
    },
  ];
}

function mergeTooliestList(existingValues, generatedValues, limit = generatedValues.length) {
  const merged = [];
  [...(Array.isArray(existingValues) ? existingValues : []), ...generatedValues].forEach((value) => {
    const normalized = String(value || '').trim();
    if (!normalized || merged.includes(normalized) || merged.length >= limit) return;
    merged.push(normalized);
  });
  return merged;
}

function mergeTooliestFaq(existingFaq, generatedFaq, limit = generatedFaq.length) {
  const merged = [];
  const seenQuestions = new Set();
  [...(Array.isArray(existingFaq) ? existingFaq : []), ...generatedFaq].forEach((item) => {
    if (!item || !item.q || !item.a || merged.length >= limit) return;
    const question = String(item.q).trim();
    const answer = String(item.a).trim();
    if (!question || !answer || seenQuestions.has(question)) return;
    seenQuestions.add(question);
    merged.push({ q: question, a: answer });
  });
  return merged;
}

// [TOOLIEST AUDIT] Fill missing AEO copy so every tool ships with crawlable explanations, benefits, and FAQs.
TOOLS.forEach((tool) => {
  if (!tool.education) {
    tool.education = buildTooliestEducation(tool);
  }
  tool.whyUse = mergeTooliestList(tool.whyUse, buildTooliestWhyUse(tool), 3);
  if (!tool.whoUses) {
    tool.whoUses = buildTooliestWhoUses(tool);
  }
  tool.faq = mergeTooliestFaq(tool.faq, buildTooliestFaq(tool), 3);
});

// Count tools per category
let favCache = [];
try { favCache = JSON.parse(localStorage.getItem('tooliest_favorites') || '[]'); } catch (e) { /* localStorage unavailable */ }
TOOL_CATEGORIES.forEach(cat => {
  if (cat.id === 'all') {
    cat.count = TOOLS.length;
  } else if (cat.id === 'favorites') {
    cat.count = favCache.length;
  } else {
    cat.count = TOOLS.filter(t => t.category === cat.id).length;
  }
});
