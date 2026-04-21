const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.resolve(__dirname, '..');
const BUILD_JS_PATH = path.join(ROOT, 'build.js');
const TOOLS_JS_PATH = path.join(ROOT, 'js', 'tools.js');
const SITE_URL = 'https://tooliest.com';
const FONT_URL = 'https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&family=JetBrains+Mono:wght@400&display=swap&subset=latin';
const GOOGLE_TAG_ID = process.env.GOOGLE_TAG_ID || 'AW-18068794869';
const ADSENSE_CLIENT = process.env.ADSENSE_CLIENT || 'ca-pub-3155132462698504';
const BUILD_DATE = new Date().toISOString().split('T')[0];
const PDF_OVERRIDES = {
  'pdf-merger': {
    icon: '&#128196;',
    summaryHeading: 'How Do I Merge PDF Files Online for Free?',
    howToHeading: 'How to merge PDF files step by step',
    howToSteps: [
      { name: 'Upload your PDF files', text: 'Add two or more PDF files from your device to start building the merged document.' },
      { name: 'Reorder or remove pages', text: 'Use the thumbnail grid to drag pages into the final order and remove anything you do not want to keep.' },
      { name: 'Merge everything into one file', text: 'Run the merge action to combine all selected pages into one new PDF.' },
      { name: 'Download the merged PDF', text: 'Save the finished file locally and share it without sending source documents to a server.' },
    ],
    faq: [
      { q: 'How do I combine multiple PDF files into one?', a: 'Upload the files, arrange the page order, and export one merged PDF. Tooliest combines the pages locally in your browser.' },
      { q: 'Can I rearrange PDF pages before merging?', a: 'Yes. PDF Merger includes page thumbnails, so you can drag pages into the exact order you want before downloading the final file.' },
      { q: 'Is PDF merging private on Tooliest?', a: 'Yes. The merge happens on your device in the browser, so your PDFs are not uploaded to a remote server.' },
    ],
    metaDesc: 'Merge multiple PDF files into one document with drag-and-drop page ordering and thumbnail previews. Free, private, and no signup required. Try Tooliest now.',
  },
  'pdf-splitter': {
    icon: '&#9986;',
    summaryHeading: 'How Do I Split PDF Files Online Without Uploading Them?',
    howToHeading: 'How to split a PDF into smaller files',
    howToSteps: [
      { name: 'Upload one PDF', text: 'Choose the PDF you want to split by range, every N pages, or a custom page selection.' },
      { name: 'Choose a split mode', text: 'Pick whether you want separate files by range, one file every N pages, or one file per page.' },
      { name: 'Enter the pages to export', text: 'Provide the page numbers or ranges you want to keep in each output file.' },
      { name: 'Split and download', text: 'Generate the new PDFs and download the results directly from your browser.' },
    ],
    faq: [
      { q: 'Can I split a PDF into individual pages?', a: 'Yes. PDF Splitter can export each page as its own PDF or create grouped files from custom ranges.' },
      { q: 'How do I extract only a few pages from a PDF?', a: 'Upload the file, choose the extract or custom-range mode, enter the page numbers you want, and download the smaller result.' },
    ],
    metaDesc: 'Split PDFs by page range, specific pages, or every N pages. Free browser-based PDF splitter with private local processing. Try Tooliest now.',
  },
  'pdf-compressor': {
    icon: '&#128230;',
    summaryHeading: 'How Do I Compress PDF Files Online Without Losing Control?',
    howToHeading: 'How to reduce PDF file size in your browser',
    howToSteps: [
      { name: 'Upload your PDF', text: 'Add the PDF you want to compress and let the browser prepare the document.' },
      { name: 'Choose the compression level', text: 'Pick low, medium, or high compression, or fine-tune the quality slider for a better size-to-quality balance.' },
      { name: 'Run the compression pass', text: 'Process the PDF and let Tooliest rebuild the file with smaller embedded assets.' },
      { name: 'Compare the size savings', text: 'Review the original versus compressed size, then download the smaller PDF if the quality looks right.' },
    ],
    faq: [
      { q: 'Will compressing a PDF reduce quality?', a: 'It can if the PDF contains large scanned images, which is why Tooliest lets you control the quality level before exporting the smaller file.' },
      { q: 'Why should I compress a PDF before sending it?', a: 'Smaller PDFs upload faster, work better with email attachment limits, and are easier to download on slower mobile connections.' },
      { q: 'Does Tooliest upload my PDF to compress it?', a: 'No. PDF Compressor works locally in your browser, so the document stays on your device throughout the workflow.' },
    ],
    metaDesc: 'Compress PDF files online with browser-based quality controls and before-versus-after size comparisons. Free, private, and no signup required. Shrink your PDF now.',
  },
  'pdf-rotate': {
    icon: '&#128260;',
    summaryHeading: 'How Do I Rotate PDF Pages Online?',
    howToHeading: 'How to fix sideways PDF pages',
    howToSteps: [
      { name: 'Upload the PDF', text: 'Open the PDF that has sideways or upside-down pages.' },
      { name: 'Select the affected pages', text: 'Choose whether to rotate all pages or only specific pages in the document.' },
      { name: 'Apply the rotation angle', text: 'Use 90, 180, or 270 degrees to set the correct reading orientation.' },
      { name: 'Save the corrected file', text: 'Export the rotated PDF and download the updated version instantly.' },
    ],
    faq: [
      { q: 'Can I rotate only one page in a PDF?', a: 'Yes. PDF Page Rotator lets you correct one page without changing the rest of the document.' },
      { q: 'Does rotating a PDF make the text blurry?', a: 'No. Rotating a PDF usually updates the page orientation instead of re-rendering the content, so text stays crisp.' },
    ],
    metaDesc: 'Rotate PDF pages online by 90, 180, or 270 degrees. Fix scanned PDFs fast with browser-based private processing on Tooliest.',
  },
  'pdf-reorder': {
    icon: '&#129513;',
    summaryHeading: 'How Do I Reorder PDF Pages with Drag and Drop?',
    howToHeading: 'How to rearrange a PDF page order',
    howToSteps: [
      { name: 'Upload your PDF', text: 'Load the document you want to reorganize in the visual page grid.' },
      { name: 'Drag pages into a new order', text: 'Move thumbnails until the page sequence matches the final reading order you want.' },
      { name: 'Remove any pages you do not need', text: 'Optionally delete extra pages while you are reordering the document.' },
      { name: 'Download the reordered PDF', text: 'Export the updated PDF and keep the new page arrangement as a fresh file.' },
    ],
    faq: [
      { q: 'How do I change the order of pages in a PDF?', a: 'Upload the document, drag the thumbnails into a new order, and export the rearranged PDF. Tooliest handles everything in the browser.' },
      { q: 'Can I remove pages while reordering a PDF?', a: 'Yes. PDF Page Reorder also lets you drop pages you no longer want before you save the new file.' },
    ],
    metaDesc: 'Reorder PDF pages with drag-and-drop thumbnails. Rearrange document flow privately in your browser and download the updated PDF with Tooliest.',
  },
  'pdf-extract': {
    icon: '&#128228;',
    summaryHeading: 'How Do I Extract Specific PDF Pages Online?',
    howToHeading: 'How to export selected pages from a PDF',
    howToSteps: [
      { name: 'Upload the source PDF', text: 'Choose the PDF that contains the pages you want to save into a new file.' },
      { name: 'Select the pages to keep', text: 'Pick the exact pages you want, including non-consecutive selections when needed.' },
      { name: 'Create the new subset PDF', text: 'Run the extraction so Tooliest builds a smaller PDF from only the selected pages.' },
      { name: 'Download the extracted file', text: 'Save the new PDF locally and keep the original source file unchanged.' },
    ],
    faq: [
      { q: 'What is the difference between splitting and extracting a PDF?', a: 'Splitting usually creates multiple files from page ranges, while extracting focuses on saving only the pages you choose into one new PDF.' },
      { q: 'Can I extract non-consecutive pages from a PDF?', a: 'Yes. PDF Page Extractor supports picking separate page numbers and packaging them into a single new PDF.' },
    ],
    metaDesc: 'Extract selected pages from a PDF into a new file. Free browser-based page extraction with private local processing at Tooliest.',
  },
  'pdf-delete-pages': {
    icon: '&#128465;',
    summaryHeading: 'How Do I Remove Unwanted Pages from a PDF?',
    howToHeading: 'How to delete pages from a PDF visually',
    howToSteps: [
      { name: 'Upload the PDF', text: 'Open the document you want to clean up in the page thumbnail view.' },
      { name: 'Mark pages to remove', text: 'Select the blank, duplicate, or outdated pages you want to delete.' },
      { name: 'Review the remaining pages', text: 'Confirm the pages you are keeping before exporting the updated file.' },
      { name: 'Download the cleaned PDF', text: 'Save the new version locally once the unwanted pages have been removed.' },
    ],
    faq: [
      { q: 'How do I remove a page from a PDF for free?', a: 'Upload the file, select the pages you want to remove, and export the cleaned version. The editing stays local in the browser.' },
      { q: 'Can I delete multiple PDF pages at once?', a: 'Yes. PDF Page Deleter supports removing several pages in one pass before you download the updated document.' },
    ],
    metaDesc: 'Delete unwanted pages from a PDF online with visual page selection. Free, private browser-based PDF page remover from Tooliest.',
  },
  'pdf-watermark': {
    icon: '&#128167;',
    summaryHeading: 'How Do I Add a Watermark to a PDF Online?',
    howToHeading: 'How to watermark every page of a PDF',
    howToSteps: [
      { name: 'Upload the PDF', text: 'Open the document that needs a watermark applied to every page.' },
      { name: 'Enter the watermark text', text: 'Type the label you want to apply, such as Draft, Confidential, or Approved.' },
      { name: 'Adjust the styling', text: 'Choose the watermark angle, opacity, size, and color before you export the final file.' },
      { name: 'Export the watermarked PDF', text: 'Generate the updated PDF and download it directly from your browser.' },
    ],
    faq: [
      { q: 'Can I watermark every page in a PDF at once?', a: 'Yes. PDF Watermark applies the same text watermark across the entire document in one browser-based pass.' },
      { q: 'Will the watermark become part of the PDF permanently?', a: 'Yes. The exported file includes the watermark on the pages, so it stays with the PDF you download.' },
    ],
    metaDesc: 'Add text watermarks to PDFs online. Control opacity, angle, size, and color with a private browser-based PDF watermark tool from Tooliest.',
  },
  'pdf-page-numbers': {
    icon: '&#128290;',
    summaryHeading: 'How Do I Add Page Numbers to a PDF?',
    howToHeading: 'How to number PDF pages online',
    howToSteps: [
      { name: 'Upload your PDF', text: 'Open the document that needs page numbers added to the top or bottom of each page.' },
      { name: 'Choose the numbering format', text: 'Set the starting number, page position, and display format that matches your document.' },
      { name: 'Apply the numbering', text: 'Run the pagination step to place the numbers on every page in the file.' },
      { name: 'Download the numbered PDF', text: 'Save the updated PDF with the new page numbering already applied.' },
    ],
    faq: [
      { q: 'Can I start page numbering from a custom number?', a: 'Yes. PDF Page Numbers lets you choose a starting number instead of always beginning with page 1.' },
      { q: 'Can I place page numbers at the top or bottom?', a: 'Yes. You can choose common top or bottom positions before exporting the numbered PDF.' },
    ],
    metaDesc: 'Add page numbers to PDFs online with custom position, format, and starting number. Free browser-based pagination from Tooliest.',
  },
  'pdf-protect': {
    icon: '&#128274;',
    summaryHeading: 'How Do I Password-Protect a PDF Online?',
    howToHeading: 'How to encrypt a PDF with a password',
    howToSteps: [
      { name: 'Upload the PDF', text: 'Open the PDF file you want to protect before sharing it with other people.' },
      { name: 'Enter and confirm the password', text: 'Choose a strong password and confirm it so the protected export uses the exact value you expect.' },
      { name: 'Encrypt the document in your browser', text: 'Run the protection step to add password-based access to the PDF locally on your device.' },
      { name: 'Download the protected PDF', text: 'Save the encrypted file and share the password separately with approved recipients.' },
    ],
    faq: [
      { q: 'Is it safe to password-protect a PDF in the browser?', a: 'Yes. Tooliest encrypts the PDF locally in your browser, so the document and password are not uploaded to a remote server.' },
      { q: 'What types of PDFs should I protect?', a: 'Use password protection for financial records, HR forms, contracts, internal decks, identity documents, and other PDFs that contain sensitive information.' },
      { q: 'Can I protect a PDF without installing desktop software?', a: 'Yes. PDF Password Protect runs entirely in the browser, so you can encrypt the file without using Acrobat or another desktop editor.' },
    ],
    metaDesc: 'Password-protect and encrypt PDFs online in your browser. Free, private PDF security tool for sensitive documents from Tooliest.',
  },
  'pdf-to-images': {
    icon: '&#128444;',
    summaryHeading: 'How Do I Convert PDF Pages to Images Online?',
    howToHeading: 'How to turn a PDF into PNG or JPG files',
    howToSteps: [
      { name: 'Upload the PDF', text: 'Open the PDF you want to convert into individual image files.' },
      { name: 'Choose the image format and DPI', text: 'Pick PNG or JPG output and set the quality level that works for your sharing or design workflow.' },
      { name: 'Render each page as an image', text: 'Let Tooliest draw every page in the browser and prepare the exported files.' },
      { name: 'Download the images', text: 'Save the generated images or ZIP package directly to your device.' },
    ],
    faq: [
      { q: 'Can I turn each page of a PDF into a separate image?', a: 'Yes. PDF to Images converts every page into its own PNG or JPG file so you can reuse the pages one by one.' },
      { q: 'Should I export PDF pages as PNG or JPG?', a: 'PNG is better for sharper text and line art, while JPG usually creates smaller files when photo-heavy pages matter more than perfect crispness.' },
    ],
    metaDesc: 'Convert PDF pages to PNG or JPG images online. Free browser-based PDF to image tool with private local rendering from Tooliest.',
  },
  'images-to-pdf': {
    icon: '&#128444;',
    summaryHeading: 'How Do I Convert Images to PDF Online for Free?',
    howToHeading: 'How to turn JPG, PNG, and WebP files into a PDF',
    howToSteps: [
      { name: 'Upload your images', text: 'Add JPG, PNG, or WebP files from your device to start building the PDF.' },
      { name: 'Reorder and size the pages', text: 'Drag the image cards into order, then choose the page size, orientation, fit style, and margins you want.' },
      { name: 'Create the PDF', text: 'Run the export step so Tooliest turns the image stack into one PDF document.' },
      { name: 'Download the finished file', text: 'Save the PDF locally and share it without uploading the original images anywhere.' },
    ],
    faq: [
      { q: 'Can I combine several JPG files into one PDF?', a: 'Yes. Upload multiple JPG, PNG, or WebP files, arrange them in order, and export one PDF from the browser.' },
      { q: 'Will my images be uploaded during conversion?', a: 'No. Images to PDF creates the final PDF locally in your browser, so the source files stay on your device.' },
      { q: 'Can I reorder pages before creating the PDF?', a: 'Yes. The image cards are draggable, so you can control the order before you generate the final PDF.' },
    ],
    metaDesc: 'Convert images to PDF online and combine JPG, PNG, or WebP files into one document. Free browser-based image-to-PDF tool on Tooliest.',
  },
  'text-to-pdf': {
    icon: '&#128221;',
    summaryHeading: 'How Do I Convert Plain Text to PDF Online?',
    howToHeading: 'How to create a PDF from plain text',
    howToSteps: [
      { name: 'Paste your text', text: 'Add the notes, logs, outline, or draft you want to turn into a PDF.' },
      { name: 'Choose formatting options', text: 'Set the page size, font size, line height, margins, and font family before export.' },
      { name: 'Create the PDF', text: 'Generate the formatted PDF with the layout settings you selected.' },
      { name: 'Download the file', text: 'Save the final PDF to your device for sharing, printing, or archiving.' },
    ],
    faq: [
      { q: 'Can I convert notes or logs into a PDF?', a: 'Yes. Paste the text, adjust the formatting settings, and export a clean PDF directly from the browser.' },
      { q: 'Is Text to PDF useful for printing?', a: 'Yes. A fixed PDF layout is a simple way to make notes, drafts, and logs easier to print or archive.' },
    ],
    metaDesc: 'Convert plain text into a PDF online with font and margin controls. Free browser-based text-to-PDF generator from Tooliest.',
  },
  'pdf-to-text': {
    icon: '&#128195;',
    summaryHeading: 'How Do I Extract Text from a PDF Online?',
    howToHeading: 'How to copy PDF text in your browser',
    howToSteps: [
      { name: 'Upload the PDF', text: 'Open the PDF that contains the text you want to copy, search, or reuse.' },
      { name: 'Extract the text layer', text: 'Let Tooliest read the selectable text that is already embedded in the document.' },
      { name: 'Review the extracted content', text: 'Check the plain-text output in the workspace before you copy or export it.' },
      { name: 'Copy or download the result', text: 'Copy the extracted text to the clipboard or download it as a TXT file.' },
    ],
    faq: [
      { q: 'Can I copy text out of a PDF for free?', a: 'Yes. Upload the PDF, let the browser extract the text layer, and then copy or download the result.' },
      { q: 'Will PDF to Text work on scanned PDFs?', a: 'It works best when the PDF already contains selectable text. Scanned image-only PDFs usually need OCR before text extraction can be accurate.' },
    ],
    metaDesc: 'Extract text from PDF files online and copy or download the result. Free browser-based PDF to text tool with private local processing.',
  },
};

function getAssetVersion() {
  const source = fs.readFileSync(BUILD_JS_PATH, 'utf8');
  const match = source.match(/const ASSET_VERSION = '([^']+)'/);
  if (!match) {
    throw new Error('Could not read ASSET_VERSION from build.js');
  }
  return match[1];
}

const ASSET_VERSION = getAssetVersion();
const CSS_BUNDLE_PATH = `/css/styles3.min.css?v=${ASSET_VERSION}`;
const BUNDLE_PATH = `/bundle.min.js?v=${ASSET_VERSION}`;
const CONSENT_PATH = `/js/consent.js?v=${ASSET_VERSION}`;

const LEGACY_TOOL_PATH_REDIRECT_INLINE = `<script>(function(){var match=window.location.pathname.match(/^\\/tool\\/([^/]+)\\/?$/);if(!match)return;var target='/' + match[1] + (window.location.search||'') + (window.location.hash||'');window.location.replace(target);})();</script>`;
const CONSENT_DEFAULTS_INLINE = `<script>window.dataLayer=window.dataLayer||[];window.gtag=window.gtag||function(){window.dataLayer.push(arguments)};window.gtag('consent','default',{ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied',analytics_storage:'denied',wait_for_update:2000});</script>`;
const GOOGLE_TAG_SNIPPET = `<script>(function(){var loaded=false;function boot(){if(loaded)return;loaded=true;var s=document.createElement('script');s.src='https://www.googletagmanager.com/gtag/js?id=${GOOGLE_TAG_ID}';s.async=true;document.head.appendChild(s);window.dataLayer=window.dataLayer||[];window.gtag=window.gtag||function(){window.dataLayer.push(arguments)};window.gtag('js',new Date());window.gtag('config','${GOOGLE_TAG_ID}');}window.addEventListener('load',function(){if('requestIdleCallback' in window){requestIdleCallback(boot,{timeout:4000});return;}setTimeout(boot,2500);});})();</script>`;
const THEME_BOOTSTRAP_INLINE = `<script>try{const savedTheme=localStorage.getItem('tooliest_theme');if(savedTheme==='light'||savedTheme==='dark'){document.documentElement.setAttribute('data-theme',savedTheme);}}catch(_){}</script>`;
const ADSENSE_SCRIPT_TAG = `<script>(function(){var loaded=false;function boot(){if(loaded)return;loaded=true;var s=document.createElement('script');s.src='https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT}';s.async=true;s.crossOrigin='anonymous';document.head.appendChild(s);}window.addEventListener('load',function(){if('requestIdleCallback' in window){requestIdleCallback(boot,{timeout:4500});return;}setTimeout(boot,3200);});})();</script>`;

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function escapeAttr(value) {
  return escapeHtml(value);
}

function repairTextArtifacts(text) {
  const replacements = [
    ['âŒ', 'Error:'],
    ['âœ…', 'Done'],
    ['âœ•', 'X'],
    ['â†’', '->'],
    ['â¬‡', 'Download'],
    ['â€¦', '...'],
    ['Â·', ' - '],
    ['â€”', ' - '],
    ['â˜€ï¸', 'Light'],
    ['âš¡', '+'],
    ['ðŸ‘', 'Show'],
    ['ðŸ—‚ï¸', '[IMG]'],
    ['ðŸ“‚', '[PDF]'],
    ['ðŸ“„', '[FILE]'],
    ['ðŸ”', '[LOCK]'],
    ['ðŸ”’', '[LOCK]'],
    ['ðŸ—œï¸', '[ZIP]'],
    ['ðŸ—‘ï¸', '[DEL]'],
    ['ðŸ”„', '[ROT]'],
    ['ðŸ§©', '[ORD]'],
    ['ðŸ“¤', '[EXT]'],
    ['ðŸ’§', '[WM]'],
    ['ðŸ”¢', '[123]'],
    ['ðŸ–¼ï¸', '[IMG]'],
    ['ðŸ“ƒ', '[TXT]'],
    ['ðŸ“¦', '[PDF]'],
    ['ðŸŸ¢ ', ''],
    ['ðŸŸ¡ ', ''],
    ['ðŸ”´ ', ''],
  ];

  let output = text;
  replacements.forEach(([from, to]) => {
    output = output.split(from).join(to);
  });
  return output;
}

function getAbsoluteUrl(pathname) {
  return `${SITE_URL}${pathname.startsWith('/') ? pathname : `/${pathname}`}`;
}

function getToolPath(toolId) {
  return `/${toolId}`;
}

function getCategoryPath(categoryId) {
  return `/category/${categoryId}`;
}

function loadToolRegistry() {
  const source = fs.readFileSync(TOOLS_JS_PATH, 'utf8');
  const sandbox = {
    console,
    localStorage: {
      getItem: () => '[]',
      setItem: () => {},
      removeItem: () => {},
    },
  };
  sandbox.globalThis = sandbox;
  vm.createContext(sandbox);
  const script = new vm.Script(`${source}\n;globalThis.__TOOLS = TOOLS; globalThis.__CATEGORIES = TOOL_CATEGORIES;`);
  script.runInContext(sandbox);
  return {
    tools: sandbox.__TOOLS || [],
    categories: sandbox.__CATEGORIES || [],
  };
}

function applyPdfOverrides(tools) {
  tools.forEach((tool) => {
    const override = PDF_OVERRIDES[tool.id];
    if (!override) {
      return;
    }
    if (override.icon) tool.icon = override.icon;
    if (override.summaryHeading) tool.summaryHeading = override.summaryHeading;
    if (override.howToHeading) tool.howToHeading = override.howToHeading;
    if (override.howToSteps) tool.howToSteps = override.howToSteps;
    if (override.faq) tool.faq = override.faq;
    tool.meta = tool.meta || {};
    if (override.metaTitle) tool.meta.title = override.metaTitle;
    if (override.metaDesc) tool.meta.desc = override.metaDesc;
    tool.reviewedBy = 'Accuracy verified by the Tooliest Engineering Team';
  });
}

function renderNavbar() {
  return `<nav class="navbar" id="navbar">
    <div class="nav-inner">
      <a class="nav-logo" href="/" id="nav-logo">
        <div class="logo-icon">&#9889;</div>
        <div class="logo-text"><span>Tooliest</span></div>
      </a>
      <div class="nav-search">
        <span class="search-icon">&#128269;</span>
        <input type="text" id="search-input" placeholder="Search tools..." autocomplete="off">
        <span class="search-shortcut">Ctrl+K</span>
      </div>
      <div class="nav-links" id="nav-links">
        <a href="/" class="active">Home</a>
        <a href="/category/text">Text</a>
        <a href="/category/seo">SEO</a>
        <a href="/category/ai">AI Tools</a>
        <a href="/category/pdf">PDF</a>
        <a href="/category/developer">Dev</a>
        <a href="/about">About</a>
        <a href="#" id="nav-install-btn" style="color:var(--accent-primary);font-weight:600;">Install App</a>
        <button class="theme-toggle-btn" id="theme-toggle-btn" onclick="window.App&&App.toggleTheme&&App.toggleTheme()" aria-label="Toggle theme">&#9728;</button>
        <button class="theme-toggle-btn" id="changelog-btn" onclick="window.App&&App.showChangelog&&App.showChangelog()" aria-label="What's new" title="What's New">🆕</button>
      </div>
      <button class="mobile-search-btn" id="mobile-search-btn" aria-label="Open search">&#128269;</button>
      <button class="mobile-menu-btn" id="mobile-menu-btn" aria-label="Open navigation menu">&#9776;</button>
    </div>
  </nav>`;
}

function renderFooter() {
  return `<footer class="site-footer">
    <div class="footer-inner">
      <div class="footer-brand">
        <p class="footer-brand-title">&#9889; <span>Tooliest</span></p>
        <p>Free browser-based tools for developers, designers, writers, marketers, and document workflows. Every tool runs locally in your browser for speed and privacy.</p>
      </div>
      <div class="footer-col">
        <p class="footer-col-title">PDF Tools</p>
        <ul>
          <li><a href="/pdf-merger">PDF Merger</a></li>
          <li><a href="/pdf-splitter">PDF Splitter</a></li>
          <li><a href="/pdf-compressor">PDF Compressor</a></li>
          <li><a href="/pdf-to-images">PDF to Images</a></li>
          <li><a href="/images-to-pdf">Images to PDF</a></li>
          <li><a href="/pdf-to-text">PDF to Text</a></li>
        </ul>
      </div>
      <div class="footer-col">
        <p class="footer-col-title">Related Categories</p>
        <ul>
          <li><a href="/category/pdf">PDF Tools</a></li>
          <li><a href="/category/image">Image Tools</a></li>
          <li><a href="/category/privacy">Privacy Tools</a></li>
          <li><a href="/category/converter">Converters</a></li>
          <li><a href="/category/text">Text Tools</a></li>
          <li><a href="/software">SEO Software Guides</a></li>
        </ul>
      </div>
      <div class="footer-col">
        <p class="footer-col-title">Company</p>
        <ul>
          <li><a href="/about">About Us</a></li>
          <li><a href="/contact">Contact</a></li>
          <li><a href="/privacy">Privacy Policy</a></li>
          <li><a href="/terms">Terms of Service</a></li>
          <li><a href="/sitemap.html">All Tools</a></li>
        </ul>
      </div>
    </div>
    <p class="adsense-disclosure">Tooliest is supported by advertising through Google AdSense. Ad revenue helps keep every tool free. <a href="/privacy">Learn about our ad policy</a></p>
    <div class="footer-bottom">
      <span>&copy; 2026 Tooliest.com - All tools are free and run in your browser.</span>
      <span>
        <a href="/privacy" style="color:inherit;opacity:0.7;">Privacy</a> |
        <a href="/terms" style="color:inherit;opacity:0.7;">Terms</a> |
        <a href="/contact" style="color:inherit;opacity:0.7;">Contact</a> |
        <button onclick="window.TooliestConsent&&TooliestConsent.reset&&TooliestConsent.reset()" style="background:none;border:none;color:inherit;opacity:0.7;cursor:pointer;font-size:inherit;padding:0;font-family:inherit;">Manage Cookies</button>
      </span>
    </div>
  </footer>`;
}

function renderMobileSearchOverlay() {
  return `<div id="mobile-search-overlay" role="dialog" aria-label="Search tools" aria-modal="true">
    <div class="mobile-search-inner">
      <div class="mobile-search-header">
        <span style="font-size:1.1rem;font-weight:700;color:var(--text-primary)">Search Tools</span>
        <button id="mobile-search-close" aria-label="Close search" style="background:none;border:none;color:var(--text-secondary);font-size:1.5rem;cursor:pointer;padding:4px 8px;line-height:1;">X</button>
      </div>
      <div style="position:relative;">
        <span style="position:absolute;left:14px;top:50%;transform:translateY(-50%);color:var(--text-tertiary);pointer-events:none;">&#128269;</span>
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
      <div class="cookie-icon">&#127850;</div>
      <div class="cookie-text">
        <strong>We use browser storage and optional cookies to keep Tooliest free</strong>
        <p>Tooliest uses browser storage to remember your privacy choices on this device. If you accept non-essential tracking, Google may also use cookies for analytics and ads. <a href="/privacy">Learn more in our Privacy Policy.</a></p>
      </div>
      <div class="cookie-actions">
        <button id="cookie-reject-btn">Reject Non-Essential</button>
        <button id="cookie-accept-btn">Accept All Cookies</button>
      </div>
    </div>
  </div>`;
}

function getRelatedCategories(tool, categories) {
  const ids = Array.isArray(tool.relatedCategoryIds) && tool.relatedCategoryIds.length
    ? tool.relatedCategoryIds
    : ['image', 'privacy', 'converter'];
  return ids
    .map((id) => categories.find((category) => category.id === id))
    .filter(Boolean);
}

function renderToolContentSections(tool, categories) {
  const steps = Array.isArray(tool.howToSteps) ? tool.howToSteps : [];
  const highlights = Array.isArray(tool.contentHighlights) ? tool.contentHighlights : [];
  const faq = Array.isArray(tool.faq) ? tool.faq : [];
  const changelog = Array.isArray(tool.changelog) ? tool.changelog : [];
  const references = Array.isArray(tool.referenceLinks) ? tool.referenceLinks : [];
  const relatedCategories = getRelatedCategories(tool, categories);

  const snippetHtml = tool.aeoSnippet
    ? `<section class="tool-content-section">
      <h2>${escapeHtml(tool.aeoSnippet.heading || 'Quick Answer')}</h2>
      <p>${escapeHtml(tool.aeoSnippet.text || '')}</p>
    </section>`
    : '';

  const methodologyHtml = tool.methodology
    ? `<section class="tool-content-section tool-methodology">
      <h2>Methodology & Accuracy Notes</h2>
      <div>${tool.methodology}</div>
      ${tool.accuracyDisclaimer ? `<p class="tool-accuracy-disclaimer">${escapeHtml(tool.accuracyDisclaimer)}</p>` : ''}
    </section>`
    : '';

  const highlightsHtml = highlights.length
    ? `<section class="tool-content-section">
      <h2>Practical Examples & Benchmarks</h2>
      <ul>${highlights.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul>
    </section>`
    : '';

  const howToHtml = steps.length
    ? `<section class="tool-content-section">
      <h2>${escapeHtml(tool.howToHeading || `How to use ${tool.name}`)}</h2>
      <ol>${steps.map((step) => `<li><strong>${escapeHtml(step.name)}</strong> - ${escapeHtml(step.text)}</li>`).join('')}</ol>
    </section>`
    : '';

  const whyUseHtml = tool.whyUse
    ? `<section class="tool-content-section">
      <h2>Why Use ${escapeHtml(tool.name)}?</h2>
      <ul>${tool.whyUse.map((reason) => `<li>${escapeHtml(reason)}</li>`).join('')}</ul>
    </section>`
    : '';

  const whoUsesHtml = tool.whoUses
    ? `<section class="tool-content-section">
      <h2>Who Uses ${escapeHtml(tool.name)}?</h2>
      <p>${escapeHtml(tool.whoUses)}</p>
    </section>`
    : '';

  const faqHtml = faq.length
    ? `<section class="tool-content-section">
      <h2>Frequently Asked Questions</h2>
      <div class="faq-list">${faq.map((item) => `<details class="faq-item"><summary>${escapeHtml(item.q)}</summary><p>${escapeHtml(item.a)}</p></details>`).join('')}</div>
    </section>`
    : '';

  const relatedCategoriesHtml = relatedCategories.length
    ? `<section class="tool-content-section">
      <h2>Explore Related Categories</h2>
      <ul>${relatedCategories.map((category) => `<li><a href="${getCategoryPath(category.id)}">${escapeHtml(category.name)}</a> - ${escapeHtml(String(category.count || 0))} tools</li>`).join('')}</ul>
    </section>`
    : '';

  const changelogHtml = changelog.length
    ? `<section class="tool-content-section">
      <h2>Changelog</h2>
      <ul class="changelog-list">${changelog.map((entry) => `<li><time datetime="${escapeAttr(entry.date)}">${escapeHtml(entry.date)}</time> - ${escapeHtml(entry.text)}</li>`).join('')}</ul>
    </section>`
    : '';

  const referencesHtml = references.length
    ? `<section class="tool-content-section">
      <h2>Reference Sources</h2>
      <ul>${references.map((item) => `<li><a href="${escapeAttr(item.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(item.label)}</a></li>`).join('')}</ul>
    </section>`
    : '';

  return `<article class="tool-article">
    <div class="tool-content-sections">
      <section class="tool-content-section">
        <h2>${escapeHtml(tool.summaryHeading || `What is ${tool.name}?`)}</h2>
        <p>${escapeHtml(tool.description)}</p>
        ${tool.education ? `<div class="tool-education-copy">${tool.education}</div>` : ''}
      </section>
      ${snippetHtml}
      ${methodologyHtml}
      ${highlightsHtml}
      ${howToHtml}
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
  const sameCategory = tools.filter((candidate) => candidate.category === tool.category && candidate.id !== tool.id).slice(0, 3);
  const relatedByTag = tools.filter((candidate) =>
    candidate.category !== tool.category &&
    candidate.id !== tool.id &&
    Array.isArray(candidate.tags) &&
    Array.isArray(tool.tags) &&
    candidate.tags.some((tag) => tool.tags.includes(tag))
  ).slice(0, 2);
  const related = [...sameCategory, ...relatedByTag].slice(0, 5);
  if (!related.length) {
    return '';
  }
  return `<div class="related-tools">
    <h3>You May Also Like</h3>
    <div class="related-tools-grid">${related.map((candidate) => renderStaticToolCard(candidate, categories)).join('')}</div>
  </div>`;
}

function renderStaticToolCard(tool, categories) {
  const categoryName = categories.find((category) => category.id === tool.category)?.name || '';
  return `<a class="tool-card tool-card-link" href="${getToolPath(tool.id)}" aria-label="Open ${escapeAttr(tool.name)} tool">
    <div class="tool-card-header">
      <div class="tool-card-icon">${tool.icon}</div>
      <div class="tool-card-info">
        <h3>${escapeHtml(tool.name)}</h3>
        <div style="display:flex; align-items:center; gap:8px;">
          <span class="tool-category-label">${escapeHtml(categoryName)}</span>
        </div>
      </div>
    </div>
    <p>${escapeHtml(tool.description)}</p>
    <div class="tool-card-tags">${(tool.tags || []).slice(0, 3).map((tag) => `<span class="tool-tag">${escapeHtml(tag)}</span>`).join('')}</div>
  </a>`;
}

function buildStructuredData(tool, categories) {
  const categoryName = categories.find((category) => category.id === tool.category)?.name || 'PDF Tools';
  const canonicalPath = getToolPath(tool.id);
  const canonicalUrl = getAbsoluteUrl(canonicalPath);
  const description = tool.meta?.desc || tool.description;
  const steps = Array.isArray(tool.howToSteps) ? tool.howToSteps : [];
  const faq = Array.isArray(tool.faq) ? tool.faq : [];

  const data = [
    {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: 'Tooliest',
      url: SITE_URL,
      logo: `${SITE_URL}/icon-512.png`,
      description: 'A free, browser-based platform with online tools for developers, designers, writers, marketers, and document workflows.',
      foundingDate: '2026',
      sameAs: ['https://twitter.com/tooliest'],
      contactPoint: {
        '@type': 'ContactPoint',
        contactType: 'customer support',
        url: `${SITE_URL}/contact`,
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
      dateModified: tool.lastReviewed || BUILD_DATE,
      browserRequirements: 'Requires a JavaScript-enabled modern web browser',
      featureList: (tool.tags || []).join(', '),
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
        { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE_URL}/` },
        { '@type': 'ListItem', position: 2, name: categoryName, item: getAbsoluteUrl(getCategoryPath(tool.category)) },
        { '@type': 'ListItem', position: 3, name: tool.name, item: canonicalUrl },
      ],
    },
    {
      '@context': 'https://schema.org',
      '@type': 'HowTo',
      name: tool.howToHeading || `How to use ${tool.name} online`,
      description,
      step: steps.map((step, index) => ({
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
      dateModified: tool.lastReviewed || BUILD_DATE,
    },
  ];

  if (faq.length) {
    data.push({
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: faq.map((item) => ({
        '@type': 'Question',
        name: item.q,
        acceptedAnswer: {
          '@type': 'Answer',
          text: item.a,
        },
      })),
    });
  }

  return data.map((entry) => `<script type="application/ld+json">${JSON.stringify(entry)}</script>`).join('\n');
}

function extractStyleBlocks(html) {
  return [...html.matchAll(/<style[\s\S]*?<\/style>/gi)].map((match) => match[0]).join('\n');
}

function extractWorkspace(html, filePath) {
  const match = html.match(/<div class="tool-workspace"[\s\S]*?(?=<article class="tool-article"|<div class="tool-content-sections"|<footer class="site-footer")/i);
  if (!match) {
    throw new Error(`Could not extract tool workspace from ${filePath}`);
  }
  const workspace = match[0].trim();
  if (/^<div class="tool-workspace"[^>]*\bid=/i.test(workspace)) {
    return workspace;
  }
  return workspace.replace(/^<div class="tool-workspace"/i, '<div class="tool-workspace" id="tool-workspace"');
}

function extractTrailingScripts(html) {
  const footerMatch = html.match(/<\/footer>\s*([\s\S]*?)<\/body>/i);
  if (!footerMatch) {
    return '';
  }
  const scriptHtml = footerMatch[1] || '';
  return [...scriptHtml.matchAll(/<script[\s\S]*?<\/script>/gi)]
    .map((match) => match[0])
    .filter((scriptTag) => !/src="\/bundle\.min\.js[^"]*"/i.test(scriptTag))
    .filter((scriptTag) => !/src="\/js\/consent\.js[^"]*"/i.test(scriptTag))
    .join('\n')
    .trim();
}

function renderPage(tool, categories, tools, originalHtml) {
  const repairedOriginalHtml = repairTextArtifacts(originalHtml);
  const categoryName = categories.find((category) => category.id === tool.category)?.name || 'PDF Tools';
  const styleBlocks = extractStyleBlocks(repairedOriginalHtml);
  const workspaceHtml = extractWorkspace(repairedOriginalHtml, tool.standaloneSourceFile);
  const trailingScripts = extractTrailingScripts(repairedOriginalHtml);
  const title = tool.meta?.title || `${tool.name} | Tooliest`;
  const description = tool.meta?.desc || tool.description;
  const keywords = [...(tool.tags || []), categoryName.toLowerCase(), 'free online tool', 'browser-based', 'tooliest'].join(', ');
  const canonicalPath = getToolPath(tool.id);
  const canonicalUrl = getAbsoluteUrl(canonicalPath);
  const ogImage = tool.ogImage || `/og/tools/${tool.id}.svg`;
  const ogImageUrl = ogImage.startsWith('http') ? ogImage : getAbsoluteUrl(ogImage);
  const reviewedDate = tool.lastReviewed || BUILD_DATE;
  const reviewedLabel = tool.lastReviewedLabel || tool.lastReviewed || BUILD_DATE;
  const reviewedBy = tool.reviewedBy || 'Accuracy verified by the Tooliest Engineering Team';

  return repairTextArtifacts(`<!DOCTYPE html>
<html lang="en">
<head>
  ${LEGACY_TOOL_PATH_REDIRECT_INLINE}
  ${CONSENT_DEFAULTS_INLINE}
  ${GOOGLE_TAG_SNIPPET}
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeAttr(description)}">
  <meta name="keywords" content="${escapeAttr(keywords)}">
  <meta name="author" content="Tooliest">
  <meta name="robots" content="index, follow">
  <meta name="googlebot" content="index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1">
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
  <meta property="og:image:alt" content="${escapeAttr(tool.ogImageAlt || `${tool.name} social preview card from Tooliest`)}">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:site" content="@tooliest">
  <meta name="twitter:title" content="${escapeAttr(title)}">
  <meta name="twitter:description" content="${escapeAttr(description)}">
  <meta name="twitter:image" content="${escapeAttr(ogImageUrl)}">
  <meta name="twitter:image:alt" content="${escapeAttr(tool.ogImageAlt || `${tool.name} social preview card from Tooliest`)}">
  <link rel="canonical" href="${escapeAttr(canonicalUrl)}">
  <link rel="alternate" hreflang="en" href="${escapeAttr(canonicalUrl)}">
  <link rel="alternate" hreflang="x-default" href="${SITE_URL}/">
  <link rel="icon" href="/favicon.svg" type="image/svg+xml">
  <link rel="icon" href="/favicon-48.png" sizes="48x48" type="image/png">
  <link rel="shortcut icon" href="/favicon.ico" type="image/x-icon">
  <link rel="apple-touch-icon" href="/apple-touch-icon.png" sizes="180x180">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link rel="preload" href="${FONT_URL}" as="style">
  ${styleBlocks}
  <link rel="stylesheet" href="${FONT_URL}" media="print" onload="this.media='all'">
  <noscript><link rel="stylesheet" href="${FONT_URL}"></noscript>
  <link rel="preload" href="${CSS_BUNDLE_PATH}" as="style" fetchpriority="high">
  <link rel="stylesheet" href="${CSS_BUNDLE_PATH}">
  <script>window.__TOOLIEST_ASSET_VERSION='${ASSET_VERSION}';</script>
  <script src="${CONSENT_PATH}" defer></script>
  ${ADSENSE_SCRIPT_TAG}
  ${buildStructuredData(tool, categories)}
</head>
<body>
  <a href="#main-content" class="skip-link">Skip to main content</a>
  ${renderNavbar()}
  <main class="main-content" id="main-content">
    <div class="tool-page">
      <div class="tool-page-header">
        <div class="tool-breadcrumb">
          <a href="/">Home</a>
          <span class="separator">&rsaquo;</span>
          <a href="${getCategoryPath(tool.category)}">${escapeHtml(categoryName)}</a>
          <span class="separator">&rsaquo;</span>
          <span>${escapeHtml(tool.name)}</span>
        </div>
        <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px">
          <h1 style="margin:0"><span role="img" aria-label="${escapeAttr(tool.name)} icon">${tool.icon}</span> ${escapeHtml(tool.name)}</h1>
          <a class="btn btn-secondary btn-sm" href="#tool-workspace" aria-label="Jump to the live ${escapeAttr(tool.name)} workspace">Jump to Live Tool</a>
        </div>
        <p>${escapeHtml(tool.description)}</p>
        <p class="tool-last-updated"><time datetime="${escapeAttr(reviewedDate)}">Last reviewed: ${escapeHtml(reviewedLabel)}</time> | ${escapeHtml(reviewedBy)}</p>
      </div>
      ${workspaceHtml}
      ${renderToolContentSections(tool, categories)}
      ${renderRelatedTools(tool, tools, categories)}
    </div>
  </main>
  ${renderFooter()}
  ${renderMobileSearchOverlay()}
  ${renderCookieBanner()}
  <div id="toast-container"></div>
  <div id="route-announcer" role="status" aria-live="polite" aria-atomic="true" class="sr-only"></div>
  <script src="${BUNDLE_PATH}" defer></script>
  ${trailingScripts}
</body>
</html>`);
}

function main() {
  const { tools, categories } = loadToolRegistry();
  applyPdfOverrides(tools);
  const pdfTools = tools.filter((tool) => tool.category === 'pdf' && tool.standalonePage && tool.standaloneSourceFile);
  let changed = 0;

  pdfTools.forEach((tool) => {
    const filePath = path.join(ROOT, tool.standaloneSourceFile);
    const originalHtml = fs.readFileSync(filePath, 'utf8');
    const normalizedHtml = renderPage(tool, categories, tools, originalHtml);
    if (normalizedHtml !== originalHtml) {
      fs.writeFileSync(filePath, normalizedHtml);
      changed += 1;
    }
  });

  console.log(`Normalized ${changed} PDF standalone pages.`);
}

main();
