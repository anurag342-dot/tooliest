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
    education: '<strong>What is Read Time?</strong><br>Standard reading speed is calculated at roughly 200 to 250 words per minute. This metric helps content creators gauge how long it takes an average user to consume their blog post or article, which directly impacts SEO dwell time.',
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
    meta: { title: 'Inflation Calculator - Purchasing Power Calculator | Tooliest', desc: 'Calculate how inflation affects your money over time. See purchasing power decline with visual charts.' }
  },
];

// Count tools per category
const favCache = JSON.parse(localStorage.getItem('tooliest_favorites') || '[]');
TOOL_CATEGORIES.forEach(cat => {
  if (cat.id === 'all') {
    cat.count = TOOLS.length;
  } else if (cat.id === 'favorites') {
    cat.count = favCache.length;
  } else {
    cat.count = TOOLS.filter(t => t.category === cat.id).length;
  }
});
