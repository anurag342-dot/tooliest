(function initCodeScreenshotRenderer() {
  const STORAGE = {
    state: 'tooliest_cs_state',
    presets: 'tooliest_cs_presets',
    history: 'tooliest_cs_history',
  };

  const PLACEHOLDER_CODE = `// Paste your code here, or start typing
const greet = (name) => {
  const message = \`Hello, \${name}!\`;
  console.log(message);
  return message;
};

greet('World');`;

  const HIGHLIGHT_CDN = 'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/highlight.min.js';
  const HTML2CANVAS_CDN = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
  const OPTIONAL_LANGUAGE_MODULES = {
    markdown: 'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/languages/markdown.min.js',
    yaml: 'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/languages/yaml.min.js',
    dockerfile: 'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/languages/dockerfile.min.js',
    graphql: 'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/languages/graphql.min.js',
  };
  const SECRET_PATTERNS = [
    /sk-[a-zA-Z0-9]{32,}/,
    /[A-Za-z0-9+/]{40,}={0,2}/,
    /\b(?:eyJ[a-zA-Z0-9_-]+\.[a-zA-Z0-9._-]+\.[a-zA-Z0-9._-]+)\b/,
    /\b(?:password|pwd)\s*=\s*[^;\s]+/i,
    /\b[a-f0-9]{32,}\b/i,
  ];

  const FONT_OPTIONS = [
    { id: 'JetBrains Mono', label: 'JetBrains Mono', stack: "'JetBrains Mono', 'Fira Code', monospace", googleFamily: 'JetBrains+Mono', ligatures: true, group: 'Coding fonts' },
    { id: 'Fira Code', label: 'Fira Code', stack: "'Fira Code', 'JetBrains Mono', monospace", googleFamily: 'Fira+Code', ligatures: true, group: 'Coding fonts', note: '=> >= != supported' },
    { id: 'Source Code Pro', label: 'Source Code Pro', stack: "'Source Code Pro', monospace", googleFamily: 'Source+Code+Pro', ligatures: false, group: 'Coding fonts' },
    { id: 'Cascadia Code', label: 'Cascadia Code', stack: "'Cascadia Code', 'Cascadia Mono', monospace", googleFamily: null, ligatures: true, group: 'Coding fonts', note: 'Uses system font when available' },
    { id: 'Inconsolata', label: 'Inconsolata', stack: "'Inconsolata', monospace", googleFamily: 'Inconsolata', ligatures: false, group: 'Coding fonts' },
    { id: 'IBM Plex Mono', label: 'IBM Plex Mono', stack: "'IBM Plex Mono', monospace", googleFamily: 'IBM+Plex+Mono', ligatures: false, group: 'Coding fonts' },
    { id: 'Menlo', label: 'Menlo', stack: "Menlo, Monaco, monospace", googleFamily: null, ligatures: false, group: 'System fonts' },
    { id: 'Monaco', label: 'Monaco', stack: "Monaco, Menlo, monospace", googleFamily: null, ligatures: false, group: 'System fonts' },
    { id: 'Consolas', label: 'Consolas', stack: "Consolas, 'Courier New', monospace", googleFamily: null, ligatures: false, group: 'System fonts' },
    { id: 'Courier New', label: 'Courier New', stack: "'Courier New', monospace", googleFamily: null, ligatures: false, group: 'System fonts' },
  ];

  const LANGUAGES = [
    { id: 'auto', label: 'Auto detect', ext: '', hljs: null },
    { id: 'javascript', label: 'JavaScript', ext: 'js', hljs: 'javascript' },
    { id: 'typescript', label: 'TypeScript', ext: 'ts', hljs: 'typescript' },
    { id: 'python', label: 'Python', ext: 'py', hljs: 'python' },
    { id: 'html', label: 'HTML', ext: 'html', hljs: 'xml' },
    { id: 'css', label: 'CSS', ext: 'css', hljs: 'css' },
    { id: 'scss', label: 'SCSS', ext: 'scss', hljs: 'scss' },
    { id: 'json', label: 'JSON', ext: 'json', hljs: 'json' },
    { id: 'bash', label: 'Bash', ext: 'sh', hljs: 'bash' },
    { id: 'sql', label: 'SQL', ext: 'sql', hljs: 'sql' },
    { id: 'php', label: 'PHP', ext: 'php', hljs: 'php' },
    { id: 'ruby', label: 'Ruby', ext: 'rb', hljs: 'ruby' },
    { id: 'go', label: 'Go', ext: 'go', hljs: 'go' },
    { id: 'rust', label: 'Rust', ext: 'rs', hljs: 'rust' },
    { id: 'java', label: 'Java', ext: 'java', hljs: 'java' },
    { id: 'c', label: 'C', ext: 'c', hljs: 'c' },
    { id: 'cpp', label: 'C++', ext: 'cpp', hljs: 'cpp' },
    { id: 'csharp', label: 'C#', ext: 'cs', hljs: 'csharp' },
    { id: 'swift', label: 'Swift', ext: 'swift', hljs: 'swift' },
    { id: 'kotlin', label: 'Kotlin', ext: 'kt', hljs: 'kotlin' },
    { id: 'markdown', label: 'Markdown', ext: 'md', hljs: 'markdown' },
    { id: 'yaml', label: 'YAML', ext: 'yml', hljs: 'yaml' },
    { id: 'dockerfile', label: 'Dockerfile', ext: 'dockerfile', hljs: 'dockerfile' },
    { id: 'graphql', label: 'GraphQL', ext: 'graphql', hljs: 'graphql' },
    { id: 'plain-text', label: 'Plain Text', ext: 'txt', hljs: null },
  ];

  const LANGUAGE_BY_ID = LANGUAGES.reduce((map, item) => {
    map[item.id] = item;
    return map;
  }, {});

  const COMMON_AUTO_LANGUAGES = LANGUAGES
    .filter((item) => item.id !== 'auto' && item.id !== 'plain-text' && !OPTIONAL_LANGUAGE_MODULES[item.hljs || item.id])
    .map((item) => item.hljs);

  const SHADOWS = {
    none: 'none',
    subtle: '0 4px 24px rgba(0,0,0,0.12)',
    medium: '0 8px 40px rgba(0,0,0,0.25)',
    heavy: '0 16px 64px rgba(0,0,0,0.45)',
    glow: '0 0 40px rgba(99, 91, 255, 0.4)',
    warm: '0 8px 40px rgba(255, 100, 50, 0.3)',
  };

  const GRADIENTS = {
    cosmic: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    sunset: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    ocean: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    emerald: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
    fire: 'linear-gradient(135deg, #f6d365 0%, #fda085 100%)',
    midnight: 'linear-gradient(135deg, #2c3e50 0%, #3498db 100%)',
    cherry: 'linear-gradient(135deg, #ff416c 0%, #ff4b2b 100%)',
    aurora: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
    nordic: 'linear-gradient(135deg, #2980b9 0%, #6dd5fa 0%, #ffffff 100%)',
    slate: 'linear-gradient(135deg, #434343 0%, #000000 100%)',
    peach: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
    violet: 'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)',
    matrix: 'linear-gradient(135deg, #0f3d0f 0%, #00ff41 100%)',
    twitter: 'linear-gradient(135deg, #1da1f2 0%, #0d8dd9 100%)',
    github: 'linear-gradient(135deg, #24292e 0%, #586069 100%)',
    vercel: 'linear-gradient(135deg, #000000 0%, #1a1a1a 100%)',
    stripe: 'linear-gradient(135deg, #635bff 0%, #0a2540 100%)',
    linear: 'linear-gradient(135deg, #5e6ad2 0%, #a8b3ff 100%)',
    supabase: 'linear-gradient(135deg, #1c1c1c 0%, #3ecf8e 100%)',
    'warm-gray': 'linear-gradient(135deg, #f5f5f0 0%, #e8e8e0 100%)',
  };

  const SIZE_PRESETS = [
    { id: 'custom', label: 'Custom / auto', width: null, height: null },
    { id: 'twitter-post', label: 'Twitter/X Post', width: 1200, height: 675, padding: 40, cardWidth: 720, backgroundMode: 'gradient' },
    { id: 'twitter-square', label: 'Twitter/X Square', width: 1080, height: 1080, padding: 80, cardWidth: 760, backgroundMode: 'gradient' },
    { id: 'linkedin-post', label: 'LinkedIn Post', width: 1200, height: 628, padding: 40, cardWidth: 760, backgroundMode: 'gradient' },
    { id: 'instagram-square', label: 'Instagram Square', width: 1080, height: 1080, padding: 80, cardWidth: 760, backgroundMode: 'gradient' },
    { id: 'instagram-story', label: 'Instagram Story', width: 1080, height: 1920, padding: 120, cardWidth: 900, backgroundMode: 'gradient' },
    { id: 'devto-cover', label: 'Dev.to Cover', width: 1000, height: 420, padding: 32, cardWidth: 820, backgroundMode: 'gradient' },
    { id: 'github-readme', label: 'GitHub README', width: null, height: null, padding: 0, cardWidth: 'auto', backgroundMode: 'transparent' },
    { id: 'blog-wide', label: 'Blog Post Wide', width: 1400, height: 700, padding: 60, cardWidth: 900, backgroundMode: 'gradient' },
    { id: 'presentation-slide', label: 'Presentation Slide', width: 1920, height: 1080, padding: 120, cardWidth: 1200, backgroundMode: 'gradient' },
    { id: 'wallpaper-4k', label: '4K Wallpaper', width: 3840, height: 2160, padding: 240, cardWidth: 2400, backgroundMode: 'gradient' },
  ];

  const BUILTIN_PRESETS = [
    {
      id: 'twitter-ready',
      name: 'Twitter Ready',
      settings: {
        theme: 'one-dark',
        fontFamily: 'JetBrains Mono',
        fontSize: 14,
        backgroundMode: 'gradient',
        gradient: 'cosmic',
        paddingChoice: 'custom',
        customPadding: 40,
        chrome: 'macos',
        shadow: 'heavy',
        sizePreset: 'twitter-post',
        cardWidthChoice: 'custom',
        customCardWidth: 720,
      },
    },
    {
      id: 'devto-article',
      name: 'Dev.to Article',
      settings: {
        theme: 'github-light',
        fontFamily: 'Source Code Pro',
        fontSize: 14,
        backgroundMode: 'gradient',
        gradient: 'warm-gray',
        paddingChoice: 'custom',
        customPadding: 40,
        chrome: 'macos',
        shadow: 'subtle',
        sizePreset: 'custom',
        cardWidthChoice: 'custom',
        customCardWidth: 760,
      },
    },
    {
      id: 'clean-minimal',
      name: 'Clean & Minimal',
      settings: {
        theme: 'github-dark',
        fontFamily: 'JetBrains Mono',
        fontSize: 13,
        backgroundMode: 'transparent',
        paddingChoice: 'custom',
        customPadding: 24,
        chrome: 'none',
        shadow: 'none',
        sizePreset: 'custom',
        cardWidthChoice: 'auto',
      },
    },
  ];

  const THEME_SPECS = [
    { id: 'one-dark', label: 'One Dark', mode: 'dark', background: '#282c34', text: '#abb2bf', accent: '#c678dd', string: '#98c379', comment: '#5c6370', functionColor: '#61afef', typeColor: '#e5c07b', variable: '#e06c75', number: '#d19a66' },
    { id: 'github-dark', label: 'GitHub Dark', mode: 'dark', background: '#0d1117', text: '#c9d1d9', accent: '#79c0ff', string: '#a5d6ff', comment: '#8b949e', functionColor: '#d2a8ff', typeColor: '#ffa657', variable: '#ffa198', number: '#79c0ff' },
    { id: 'github-light', label: 'GitHub Light', mode: 'light', background: '#ffffff', text: '#1f2328', accent: '#0550ae', string: '#0a3069', comment: '#6e7781', functionColor: '#8250df', typeColor: '#953800', variable: '#cf222e', number: '#0550ae' },
    { id: 'dracula', label: 'Dracula', mode: 'dark', background: '#282a36', text: '#f8f8f2', accent: '#ff79c6', string: '#f1fa8c', comment: '#6272a4', functionColor: '#50fa7b', typeColor: '#8be9fd', variable: '#ff5555', number: '#bd93f9' },
    { id: 'monokai-pro', label: 'Monokai Pro', mode: 'dark', background: '#2d2a2e', text: '#fcfcfa', accent: '#ffd866', string: '#a9dc76', comment: '#727072', functionColor: '#78dce8', typeColor: '#ab9df2', variable: '#ff6188', number: '#fc9867' },
    { id: 'solarized-dark', label: 'Solarized Dark', mode: 'dark', background: '#002b36', text: '#93a1a1', accent: '#268bd2', string: '#2aa198', comment: '#586e75', functionColor: '#b58900', typeColor: '#cb4b16', variable: '#dc322f', number: '#d33682' },
    { id: 'solarized-light', label: 'Solarized Light', mode: 'light', background: '#fdf6e3', text: '#657b83', accent: '#268bd2', string: '#2aa198', comment: '#93a1a1', functionColor: '#b58900', typeColor: '#cb4b16', variable: '#dc322f', number: '#d33682' },
    { id: 'nord', label: 'Nord', mode: 'dark', background: '#2e3440', text: '#d8dee9', accent: '#88c0d0', string: '#a3be8c', comment: '#616e88', functionColor: '#81a1c1', typeColor: '#8fbcbb', variable: '#bf616a', number: '#b48ead' },
    { id: 'gruvbox-dark', label: 'Gruvbox Dark', mode: 'dark', background: '#282828', text: '#ebdbb2', accent: '#fabd2f', string: '#b8bb26', comment: '#928374', functionColor: '#83a598', typeColor: '#fe8019', variable: '#fb4934', number: '#d3869b' },
    { id: 'tokyo-night', label: 'Tokyo Night', mode: 'dark', background: '#1a1b2e', text: '#c0caf5', accent: '#7aa2f7', string: '#9ece6a', comment: '#565f89', functionColor: '#7dcfff', typeColor: '#bb9af7', variable: '#f7768e', number: '#ff9e64' },
    { id: 'ayu-light', label: 'Ayu Light', mode: 'light', background: '#fafafa', text: '#5c6166', accent: '#ff9940', string: '#86b300', comment: '#a0a6ac', functionColor: '#55b4d4', typeColor: '#f07171', variable: '#f07171', number: '#a37acc' },
    { id: 'catppuccin-mocha', label: 'Catppuccin Mocha', mode: 'dark', background: '#1e1e2e', text: '#cdd6f4', accent: '#cba6f7', string: '#a6e3a1', comment: '#6c7086', functionColor: '#89b4fa', typeColor: '#f9e2af', variable: '#f38ba8', number: '#fab387' },
    { id: 'rose-pine', label: 'Rose Pine', mode: 'dark', background: '#191724', text: '#e0def4', accent: '#ebbcba', string: '#9ccfd8', comment: '#6e6a86', functionColor: '#31748f', typeColor: '#f6c177', variable: '#eb6f92', number: '#c4a7e7' },
    { id: 'panda', label: 'Panda', mode: 'dark', background: '#292a2b', text: '#e6e6e6', accent: '#19f9d8', string: '#19f9d8', comment: '#676b79', functionColor: '#ff75b5', typeColor: '#ffcc95', variable: '#ff2c6d', number: '#b084eb' },
    { id: 'cobalt2', label: 'Cobalt2', mode: 'dark', background: '#193549', text: '#ffffff', accent: '#ffc600', string: '#3ad900', comment: '#0088ff', functionColor: '#ff9d00', typeColor: '#ffee80', variable: '#ff628c', number: '#ffee80' },
    { id: 'high-contrast', label: 'High Contrast', mode: 'light', background: '#ffffff', text: '#000000', accent: '#0000ff', string: '#008000', comment: '#666666', functionColor: '#800080', typeColor: '#b00020', variable: '#d32f2f', number: '#0050c8' },
  ];

  const THEME_ORDER = [];
  const THEMES = {};
  let highlightPromise = null;
  let html2CanvasPromise = null;
  const fontLoadPromises = new Map();
  const optionalLanguageLoads = new Map();

  function parseHex(hex) {
    const value = String(hex || '').trim().replace('#', '');
    if (value.length === 3) {
      return {
        r: parseInt(value[0] + value[0], 16),
        g: parseInt(value[1] + value[1], 16),
        b: parseInt(value[2] + value[2], 16),
      };
    }
    if (value.length !== 6) return { r: 0, g: 0, b: 0 };
    return {
      r: parseInt(value.slice(0, 2), 16),
      g: parseInt(value.slice(2, 4), 16),
      b: parseInt(value.slice(4, 6), 16),
    };
  }

  function toHex(color) {
    const safe = Math.max(0, Math.min(255, Math.round(color)));
    return safe.toString(16).padStart(2, '0');
  }

  function mixHex(baseHex, overlayHex, ratio) {
    const base = parseHex(baseHex);
    const overlay = parseHex(overlayHex);
    const amount = Math.max(0, Math.min(1, Number(ratio) || 0));
    return `#${toHex(base.r + ((overlay.r - base.r) * amount))}${toHex(base.g + ((overlay.g - base.g) * amount))}${toHex(base.b + ((overlay.b - base.b) * amount))}`;
  }

  function rgba(hex, alpha) {
    const rgb = parseHex(hex);
    return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`;
  }

  function createTheme(spec) {
    const accent = spec.accent;
    THEMES[spec.id] = {
      label: spec.label,
      mode: spec.mode,
      background: spec.background,
      gutter: mixHex(spec.text, spec.background, 0.55),
      text: spec.text,
      accent,
      tokens: {
        'hljs-keyword': { color: accent, bold: true },
        'hljs-built_in': { color: spec.variable },
        'hljs-type': { color: spec.typeColor, bold: true },
        'hljs-literal': { color: spec.functionColor },
        'hljs-number': { color: spec.number },
        'hljs-string': { color: spec.string },
        'hljs-comment': { color: spec.comment, italic: true },
        'hljs-attr': { color: spec.variable },
        'hljs-variable': { color: spec.variable },
        'hljs-property': { color: spec.variable },
        'hljs-function': { color: spec.functionColor },
        'hljs-class': { color: spec.typeColor, bold: true },
        'hljs-title': { color: spec.functionColor },
        'hljs-params': { color: spec.text },
        'hljs-operator': { color: spec.functionColor },
        'hljs-punctuation': { color: spec.text },
        'hljs-tag': { color: spec.variable },
        'hljs-name': { color: spec.variable },
        'hljs-selector-tag': { color: spec.variable },
        'hljs-selector-id': { color: spec.functionColor },
        'hljs-selector-class': { color: spec.typeColor },
        'hljs-meta': { color: spec.comment },
        'hljs-subst': { color: spec.text },
        'hljs-section': { color: spec.functionColor, bold: true },
        'hljs-emphasis': { color: spec.text, italic: true },
        'hljs-strong': { color: spec.text, bold: true },
        'hljs-regexp': { color: spec.string },
        'hljs-symbol': { color: spec.functionColor },
        'hljs-bullet': { color: spec.variable },
        'hljs-addition': { color: spec.string, background: rgba(spec.string, spec.mode === 'dark' ? 0.18 : 0.12) },
        'hljs-deletion': { color: spec.variable, background: rgba(spec.variable, spec.mode === 'dark' ? 0.18 : 0.12) },
      },
      card: {
        titlebarBg: mixHex(spec.background, spec.mode === 'dark' ? '#000000' : '#ffffff', spec.mode === 'dark' ? 0.18 : 0.08),
        titlebarText: mixHex(spec.text, spec.background, 0.3),
        borderColor: mixHex(spec.background, spec.mode === 'dark' ? '#000000' : '#d7dce6', spec.mode === 'dark' ? 0.35 : 0.2),
      },
    };
    THEME_ORDER.push(spec.id);
  }

  THEME_SPECS.forEach(createTheme);

  function escapeHtml(value) {
    return ToolRenderers.escapeHtml(value);
  }

  function readJson(key, fallback) {
    const value = typeof safeLocalGet === 'function' ? safeLocalGet(key, fallback) : fallback;
    return value === undefined ? fallback : value;
  }

  function writeJson(key, value) {
    if (typeof safeLocalSet === 'function') {
      safeLocalSet(key, JSON.stringify(value));
    } else {
      try {
        localStorage.setItem(key, JSON.stringify(value));
      } catch (_) {
        // Ignore localStorage failures.
      }
    }
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function uid(prefix) {
    return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  }

  function normalizeCode(value) {
    return String(value || '').replace(/\r\n?/g, '\n');
  }

  function debounce(fn, wait) {
    let timer = null;
    return function debounced(...args) {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => fn.apply(this, args), wait);
    };
  }

  function hashString(input) {
    const value = String(input || '');
    let hash = 2166136261;
    for (let index = 0; index < value.length; index += 1) {
      hash ^= value.charCodeAt(index);
      hash = Math.imul(hash, 16777619);
    }
    return (hash >>> 0).toString(36);
  }

  function getLanguage(id) {
    return LANGUAGE_BY_ID[id] || LANGUAGE_BY_ID.javascript;
  }

  function defaultFileName(languageId, index) {
    const language = getLanguage(languageId);
    if (language.id === 'dockerfile') return 'Dockerfile';
    if (language.id === 'plain-text') return `notes-${index}.txt`;
    const base = language.id === 'python' ? 'main' : 'index';
    return `${base}.${language.ext || 'txt'}`;
  }

  function createTab(seed, index) {
    const language = getLanguage(seed.manualLanguage || 'javascript');
    return {
      id: seed.id || uid('cs-tab'),
      manualLanguage: seed.manualLanguage || 'auto',
      code: normalizeCode(seed.code || ''),
      highlightSpec: String(seed.highlightSpec || ''),
      blurOverrides: seed.blurOverrides && typeof seed.blurOverrides === 'object' ? { ...seed.blurOverrides } : {},
      name: String(seed.name || defaultFileName(language.id === 'auto' ? 'javascript' : language.id, index || 1)).slice(0, 40),
    };
  }

  function createDefaultState() {
    const tab = createTab({ name: 'index.js', manualLanguage: 'auto', code: '' }, 1);
    return {
      tabs: [tab],
      activeTabId: tab.id,
      theme: 'one-dark',
      themeFilter: 'all',
      chrome: 'macos',
      chromeColor: '',
      backgroundMode: 'gradient',
      gradient: 'cosmic',
      solidColor: '#0f0e17',
      paddingChoice: '32',
      customPadding: 32,
      fontFamily: 'JetBrains Mono',
      fontSize: 14,
      lineHeight: 1.5,
      letterSpacing: 0,
      tabSize: 2,
      ligatures: true,
      borderRadius: 12,
      shadow: 'medium',
      cardWidthChoice: '680',
      customCardWidth: 680,
      sizePreset: 'custom',
      watermark: true,
      watermarkText: '',
      autoPair: true,
      blurSensitive: false,
      dimUnfocused: false,
      diffMode: false,
      previewZoom: 'fit',
      previewPanelHeight: 400,
      fontLoading: false,
    };
  }

  function normalizeState(raw) {
    const base = createDefaultState();
    if (!raw || typeof raw !== 'object') return base;
    const tabs = Array.isArray(raw.tabs) && raw.tabs.length ? raw.tabs.slice(0, 5).map((tab, index) => createTab(tab, index + 1)) : base.tabs;
    const activeTabId = tabs.some((tab) => tab.id === raw.activeTabId) ? raw.activeTabId : tabs[0].id;
    return {
      ...base,
      ...raw,
      tabs,
      activeTabId,
      previewPanelHeight: clamp(Number(raw.previewPanelHeight) || base.previewPanelHeight, 280, 1000),
      customPadding: clamp(Number(raw.customPadding) || base.customPadding, 0, 300),
      customCardWidth: clamp(Number(raw.customCardWidth) || base.customCardWidth, 280, 2600),
      fontSize: clamp(Number(raw.fontSize) || base.fontSize, 12, 24),
      lineHeight: [1.4, 1.5, 1.6, 1.8].includes(Number(raw.lineHeight)) ? Number(raw.lineHeight) : base.lineHeight,
      letterSpacing: [0, 0.5, 1].includes(Number(raw.letterSpacing)) ? Number(raw.letterSpacing) : base.letterSpacing,
      tabSize: [2, 4].includes(Number(raw.tabSize)) ? Number(raw.tabSize) : base.tabSize,
      borderRadius: [0, 4, 8, 12, 16, 24].includes(Number(raw.borderRadius)) ? Number(raw.borderRadius) : base.borderRadius,
      diffMode: !!raw.diffMode,
    };
  }

  function getActiveTab(state) {
    return state.tabs.find((tab) => tab.id === state.activeTabId) || state.tabs[0];
  }

  function getResolvedPadding(state) {
    return state.paddingChoice === 'custom' ? clamp(Number(state.customPadding) || 0, 0, 300) : Number(state.paddingChoice) || 32;
  }

  function getResolvedCardWidth(state) {
    return state.cardWidthChoice === 'custom'
      ? clamp(Number(state.customCardWidth) || 680, 280, 2600)
      : (state.cardWidthChoice === 'auto' ? 'auto' : (Number(state.cardWidthChoice) || 680));
  }

  function getFontMeta(fontId) {
    return FONT_OPTIONS.find((item) => item.id === fontId) || FONT_OPTIONS[0];
  }

  function saveState(runtime) {
    const snapshot = {
      ...runtime.state,
      fontLoading: false,
    };
    writeJson(STORAGE.state, snapshot);
  }

  function normalizeHistory(raw) {
    if (!Array.isArray(raw)) return [];
    return raw.slice(0, 5).filter((entry) => entry && typeof entry === 'object');
  }

  function normalizePresets(raw) {
    if (!Array.isArray(raw)) return [];
    return raw
      .filter((entry) => entry && typeof entry === 'object' && entry.name && entry.settings)
      .slice(0, 10)
      .map((entry) => ({
        id: entry.id || uid('cs-preset'),
        name: String(entry.name).slice(0, 40),
        settings: entry.settings,
        backgroundMode: entry.backgroundMode || entry.settings.backgroundMode || 'gradient',
        gradient: entry.gradient || entry.settings.gradient || 'cosmic',
        solidColor: entry.solidColor || entry.settings.solidColor || '#0f0e17',
      }));
  }

  function ensureStyleTag() {
    if (document.getElementById('code-screenshot-tool-styles')) return;
    const style = document.createElement('style');
    style.id = 'code-screenshot-tool-styles';
    style.textContent = `
      .code-shot-tool {
        display: block;
      }
      .code-shot-shell {
        display: grid;
        gap: 16px;
      }
      .code-shot-main,
      .code-shot-settings-columns,
      .code-shot-settings-stack,
      .code-shot-preview-column,
      .code-shot-controls {
        min-width: 0;
      }
      .code-shot-main {
        display: grid;
        gap: 16px;
      }
      .code-shot-controls {
        display: grid;
        gap: 14px;
      }
      .code-shot-settings-columns {
        display: grid;
        gap: 16px;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        align-items: start;
      }
      .code-shot-settings-stack {
        display: grid;
        gap: 16px;
        align-content: start;
      }
      .code-shot-section {
        border: 1px solid var(--border-color);
        border-radius: var(--radius-md);
        background: var(--bg-card);
        padding: 14px;
        box-shadow: var(--shadow-sm);
      }
      .code-shot-section h3 {
        margin: 0 0 10px;
        font-size: 0.96rem;
        color: var(--text-primary);
      }
      .code-shot-section p {
        margin: 0;
        color: var(--text-secondary);
      }
      .code-shot-grid {
        display: grid;
        gap: 10px;
      }
      .code-shot-grid.two {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }
      .code-shot-field {
        display: grid;
        gap: 8px;
      }
      .code-shot-field label,
      .code-shot-group-label {
        font-size: 0.78rem;
        letter-spacing: 0.04em;
        text-transform: uppercase;
        color: var(--text-secondary);
      }
      .code-shot-field input[type="text"],
      .code-shot-field input[type="number"],
      .code-shot-field input[type="color"],
      .code-shot-field textarea,
      .code-shot-field select {
        width: 100%;
        min-height: 44px;
        border: 1px solid var(--border-color);
        border-radius: var(--radius-sm);
        background: var(--bg-secondary);
        color: var(--text-primary);
        padding: 10px 12px;
        font: inherit;
      }
      .code-shot-field input[type="color"] {
        padding: 6px;
      }
      .code-shot-color-row,
      .code-shot-inline-row {
        display: flex;
        gap: 10px;
        align-items: center;
      }
      .code-shot-color-row input[type="text"] {
        min-width: 0;
      }
      .code-shot-segmented {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
      }
      .code-shot-segmented button,
      .code-shot-chip {
        min-height: 40px;
        padding: 9px 12px;
        border-radius: var(--radius-sm);
        border: 1px solid var(--border-color);
        background: var(--bg-secondary);
        color: var(--text-secondary);
        cursor: pointer;
        transition: background var(--transition-fast), border-color var(--transition-fast), color var(--transition-fast), transform var(--transition-fast);
      }
      .code-shot-segmented button[aria-pressed="true"],
      .code-shot-chip.is-active {
        background: rgba(139, 92, 246, 0.14);
        border-color: var(--border-accent);
        color: var(--text-primary);
      }
      .code-shot-preview-actions .btn[aria-pressed="true"] {
        background: rgba(139, 92, 246, 0.14);
        border-color: var(--border-accent);
        color: var(--text-primary);
      }
      .code-shot-segmented button:focus-visible,
      .code-shot-theme-card:focus-visible,
      .code-shot-swatch:focus-visible,
      .code-shot-tab:focus-visible,
      .code-shot-chip:focus-visible,
      .code-shot-toolbar-btn:focus-visible,
      .code-shot-editor-input:focus-visible,
      .code-shot-overlay-close:focus-visible,
      .code-shot-shadow-option:focus-visible {
        outline: 2px solid var(--accent-primary);
        outline-offset: 2px;
      }
      .code-shot-theme-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(60px, 1fr));
        gap: 8px;
        max-height: 260px;
        overflow-y: auto;
        padding-right: 4px;
      }
      .code-shot-theme-card {
        display: grid;
        gap: 6px;
        padding: 8px 6px;
        min-height: 72px;
        border-radius: 8px;
        border: 1px solid var(--border-color);
        background: var(--bg-secondary);
        color: var(--text-secondary);
        cursor: pointer;
        transition: transform var(--transition-fast), border-color var(--transition-fast), box-shadow var(--transition-fast);
      }
      .code-shot-theme-card:hover {
        transform: scale(1.05);
      }
      .code-shot-theme-preview {
        border-radius: 6px;
        height: 36px;
        border: 1px solid rgba(255,255,255,0.08);
        display: flex;
        align-items: flex-start;
        justify-content: flex-start;
        padding: 6px;
        gap: 4px;
      }
      .code-shot-theme-dot {
        width: 6px;
        height: 6px;
        border-radius: 50%;
      }
      .code-shot-theme-name {
        font-size: 10px;
        line-height: 1.2;
        text-align: left;
      }
      .code-shot-gradient-row {
        display: flex;
        gap: 8px;
        overflow-x: auto;
        padding-bottom: 4px;
      }
      .code-shot-swatch {
        width: 48px;
        height: 32px;
        border-radius: 8px;
        border: 1px solid rgba(255,255,255,0.08);
        flex: 0 0 auto;
        cursor: pointer;
        transition: transform var(--transition-fast), border-color var(--transition-fast);
      }
      .code-shot-swatch:hover {
        transform: translateY(-1px);
      }
      .code-shot-shadow-grid {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 8px;
      }
      .code-shot-shadow-option {
        min-height: 60px;
        border-radius: var(--radius-sm);
        border: 1px solid var(--border-color);
        background: var(--bg-secondary);
        cursor: pointer;
        color: var(--text-secondary);
        padding: 8px;
        display: grid;
        gap: 8px;
      }
      .code-shot-shadow-option[aria-pressed="true"] {
        background: rgba(139, 92, 246, 0.14);
        border-color: var(--border-accent);
        color: var(--text-primary);
        box-shadow: 0 0 0 1px rgba(139, 92, 246, 0.18), 0 10px 28px rgba(139, 92, 246, 0.12);
      }
      .code-shot-shadow-option[aria-pressed="true"] .code-shot-shadow-preview {
        outline: 2px solid rgba(139, 92, 246, 0.55);
        outline-offset: 2px;
      }
      .code-shot-shadow-preview {
        height: 18px;
        width: 100%;
        border-radius: 6px;
        background: linear-gradient(135deg, rgba(139,92,246,0.7), rgba(6,182,212,0.7));
      }
      .code-shot-shadow-name {
        font-size: 0.75rem;
      }
      .code-shot-tabs {
        display: flex;
        gap: 8px;
        flex-wrap: wrap;
      }
      .code-shot-tab {
        min-height: 40px;
        max-width: 220px;
        border-radius: var(--radius-sm);
        border: 1px solid var(--border-color);
        background: var(--bg-secondary);
        color: var(--text-secondary);
        display: inline-flex;
        align-items: center;
        gap: 8px;
        padding: 8px 10px;
        cursor: pointer;
      }
      .code-shot-tab.is-active {
        background: rgba(139, 92, 246, 0.14);
        border-color: var(--border-accent);
        color: var(--text-primary);
      }
      .code-shot-tab-label {
        min-width: 0;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        flex: 1 1 auto;
      }
      .code-shot-tab-close {
        border: none;
        background: transparent;
        color: inherit;
        cursor: pointer;
        padding: 0;
        width: 18px;
        height: 18px;
        line-height: 18px;
      }
      .code-shot-editor-shell {
        border: 1px solid var(--border-color);
        border-radius: var(--radius-md);
        overflow: hidden;
        background: var(--bg-secondary);
      }
      .code-shot-editor-toolbar {
        display: flex;
        justify-content: space-between;
        gap: 12px;
        align-items: center;
        padding: 12px 14px;
        border-bottom: 1px solid var(--border-color);
        background: rgba(255,255,255,0.02);
      }
      .code-shot-toolbar-actions,
      .code-shot-toolbar-left {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        align-items: center;
      }
      .code-shot-toolbar-btn {
        min-height: 38px;
        padding: 8px 10px;
        border-radius: var(--radius-sm);
        border: 1px solid var(--border-color);
        background: var(--bg-glass);
        color: var(--text-secondary);
        cursor: pointer;
      }
      .code-shot-toolbar-note {
        color: var(--text-tertiary);
        font-size: 0.78rem;
        line-height: 1.45;
      }
      .code-shot-editor-frame {
        display: grid;
        grid-template-columns: 56px minmax(0, 1fr);
        min-height: 320px;
      }
      .code-shot-editor-gutter {
        padding: 16px 8px 16px 0;
        text-align: right;
        font-family: var(--font-mono);
        font-size: 0.85rem;
        line-height: 1.6;
        color: var(--text-tertiary);
        background: rgba(255,255,255,0.02);
        user-select: none;
        overflow: hidden;
      }
      .code-shot-editor-stage {
        position: relative;
        overflow: hidden;
      }
      .code-shot-editor-mirror,
      .code-shot-editor-input {
        margin: 0;
        padding: 16px;
        width: 100%;
        min-height: 320px;
        font-family: var(--font-mono);
        font-size: 14px;
        line-height: 1.6;
        tab-size: 2;
        white-space: pre;
        overflow: auto;
      }
      .code-shot-editor-mirror {
        color: var(--text-primary);
        pointer-events: none;
      }
      .code-shot-editor-input {
        position: absolute;
        inset: 0;
        background: transparent;
        border: none;
        resize: none;
        color: transparent;
        caret-color: var(--text-primary);
        outline: none;
        overflow: auto;
      }
      .code-shot-editor-input::selection {
        background: rgba(139, 92, 246, 0.25);
      }
      .code-shot-editor-status {
        display: flex;
        justify-content: space-between;
        gap: 12px;
        padding: 10px 14px;
        border-top: 1px solid var(--border-color);
        color: var(--text-secondary);
        font-size: 0.85rem;
        flex-wrap: wrap;
      }
      .code-shot-badge {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 6px 10px;
        border-radius: 999px;
        border: 1px solid var(--border-color);
        background: var(--bg-glass);
        color: var(--text-secondary);
        font-size: 0.78rem;
      }
      .code-shot-badge a {
        color: var(--text-accent);
      }
      .code-shot-help {
        color: var(--text-tertiary);
        font-size: 0.78rem;
        line-height: 1.45;
      }
      .code-shot-tip {
        font-size: 0.82rem;
        color: var(--text-secondary);
      }
      .code-shot-preview-column {
        display: grid;
        gap: 10px;
      }
      .code-shot-preview-header {
        display: flex;
        justify-content: space-between;
        gap: 12px;
        flex-wrap: wrap;
        align-items: flex-start;
      }
      .code-shot-preview-status,
      .code-shot-preview-actions,
      .code-shot-export-actions {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        align-items: center;
      }
      .code-shot-preview-actions .btn,
      .code-shot-preview-actions .btn-secondary,
      .code-shot-preview-actions .btn-primary,
      .code-shot-export-actions .btn,
      .code-shot-export-actions .btn-secondary,
      .code-shot-export-actions .btn-primary {
        min-height: 42px;
      }
      .code-shot-preview-frame {
        display: grid;
        border: 1px solid var(--border-color);
        border-radius: var(--radius-lg);
        background: linear-gradient(180deg, rgba(255,255,255,0.03), rgba(255,255,255,0.01));
        overflow: hidden;
        box-shadow: var(--shadow-md);
      }
      .code-shot-preview-viewport {
        position: relative;
        display: flex;
        justify-content: center;
        align-items: flex-start;
        overflow: auto;
        padding: 14px;
        min-height: 140px;
      }
      .code-shot-preview-viewport.is-transparent {
        background-image:
          linear-gradient(45deg, rgba(255,255,255,0.05) 25%, transparent 25%),
          linear-gradient(-45deg, rgba(255,255,255,0.05) 25%, transparent 25%),
          linear-gradient(45deg, transparent 75%, rgba(255,255,255,0.05) 75%),
          linear-gradient(-45deg, transparent 75%, rgba(255,255,255,0.05) 75%);
        background-size: 24px 24px;
        background-position: 0 0, 0 12px, 12px -12px, -12px 0;
      }
      .code-shot-preview-zoom {
        display: inline-block;
        transform-origin: top left;
        width: max-content;
        min-width: 0;
      }
      .code-shot-resize-handle {
        height: 16px;
        cursor: row-resize;
        border-top: 1px solid var(--border-color);
        background: linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.07) 50%, transparent 100%);
      }
      .code-shot-preview-note,
      .code-shot-export-note {
        color: var(--text-secondary);
        font-size: 0.86rem;
      }
      .code-shot-export-note strong {
        color: var(--text-primary);
      }
      .code-shot-toast {
        position: fixed;
        right: 24px;
        bottom: calc(24px + var(--safe-bottom));
        width: min(360px, calc(100vw - 32px));
        padding: 16px;
        border-radius: var(--radius-md);
        border: 1px solid var(--border-accent);
        background: rgba(18, 18, 26, 0.94);
        color: var(--text-primary);
        box-shadow: var(--shadow-lg);
        z-index: var(--z-toast);
        opacity: 0;
        visibility: hidden;
        transform: translateY(12px);
        transition: opacity var(--transition-fast), visibility var(--transition-fast), transform var(--transition-fast);
      }
      .code-shot-toast.is-visible {
        opacity: 1;
        visibility: visible;
        transform: translateY(0);
      }
      .code-shot-toast-links {
        margin-top: 10px;
        display: grid;
        gap: 6px;
        font-size: 0.86rem;
      }
      .code-shot-toast a {
        color: var(--text-accent);
      }
      .code-shot-overlay {
        position: fixed;
        inset: 0;
        z-index: var(--z-overlay);
        display: grid;
        place-items: center;
        padding: 24px;
        background: rgba(0, 0, 0, 0.6);
        opacity: 0;
        visibility: hidden;
        pointer-events: none;
        transition: opacity var(--transition-fast), visibility var(--transition-fast);
      }
      .code-shot-overlay.is-open {
        opacity: 1;
        visibility: visible;
        pointer-events: auto;
      }
      .code-shot-overlay-panel {
        width: min(520px, 100%);
        background: var(--bg-secondary);
        border: 1px solid var(--border-color);
        border-radius: var(--radius-lg);
        box-shadow: var(--shadow-lg);
        padding: 22px;
      }
      .code-shot-overlay-head {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        margin-bottom: 16px;
      }
      .code-shot-overlay-close {
        border: 1px solid var(--border-color);
        background: var(--bg-glass);
        color: var(--text-secondary);
        border-radius: 999px;
        width: 40px;
        height: 40px;
        cursor: pointer;
      }
      .code-shot-shortcuts {
        display: grid;
        gap: 10px;
      }
      .code-shot-shortcut-row {
        display: flex;
        justify-content: space-between;
        gap: 16px;
        padding: 10px 0;
        border-bottom: 1px solid var(--border-color);
        color: var(--text-secondary);
      }
      .code-shot-shortcut-row:last-child {
        border-bottom: none;
      }
      .code-shot-shortcut-keys {
        display: flex;
        gap: 8px;
        align-items: center;
        flex-wrap: wrap;
      }
      .code-shot-shortcut-keys kbd {
        font-family: var(--font-mono);
        font-size: 0.78rem;
        padding: 4px 8px;
        border-radius: 6px;
        border: 1px solid var(--border-color);
        background: var(--bg-tertiary);
        color: var(--text-primary);
      }
      .code-shot-details {
        border: 1px solid var(--border-color);
        border-radius: var(--radius-sm);
        background: var(--bg-secondary);
      }
      .code-shot-details summary {
        list-style: none;
        cursor: pointer;
        padding: 10px 12px;
        color: var(--text-secondary);
      }
      .code-shot-details summary::-webkit-details-marker {
        display: none;
      }
      .code-shot-details-body {
        border-top: 1px solid var(--border-color);
        padding: 12px;
        display: grid;
        gap: 10px;
      }
      .code-shot-history-item,
      .code-shot-preset-item {
        display: grid;
        gap: 6px;
        padding: 10px;
        border-radius: var(--radius-sm);
        border: 1px solid var(--border-color);
        background: rgba(255,255,255,0.02);
      }
      .code-shot-history-item button,
      .code-shot-preset-item button {
        justify-self: start;
      }
      .code-shot-preset-row {
        display: flex;
        justify-content: space-between;
        gap: 10px;
        align-items: center;
      }
      .code-shot-mini-swatch {
        width: 32px;
        height: 20px;
        border-radius: 6px;
        border: 1px solid rgba(255,255,255,0.08);
        flex: 0 0 auto;
      }
      .code-shot-save-popover {
        display: none;
        gap: 10px;
        margin-top: 10px;
      }
      .code-shot-save-popover.is-open {
        display: grid;
      }
      .code-shot-toggle {
        display: grid;
        grid-template-columns: 18px minmax(0, 1fr);
        gap: 10px;
        color: var(--text-secondary);
        align-items: start;
        width: 100%;
        padding: 0;
        border: none;
        background: transparent;
        font: inherit;
        text-align: left;
        cursor: pointer;
        user-select: none;
      }
      .code-shot-toggle-box {
        width: 18px;
        height: 18px;
        margin: 2px 0 0;
        border-radius: 4px;
        border: 1px solid var(--border-color);
        background: rgba(255,255,255,0.04);
        position: relative;
        box-sizing: border-box;
        transition: background var(--transition-fast), border-color var(--transition-fast), box-shadow var(--transition-fast);
      }
      .code-shot-toggle span:last-child {
        line-height: 1.45;
      }
      .code-shot-toggle[aria-pressed="true"] {
        color: var(--text-primary);
      }
      .code-shot-toggle[aria-pressed="true"] .code-shot-toggle-box {
        background: var(--accent-primary);
        border-color: var(--accent-primary);
        box-shadow: 0 0 0 1px rgba(139, 92, 246, 0.22), 0 8px 18px rgba(139, 92, 246, 0.18);
      }
      .code-shot-toggle[aria-pressed="true"] .code-shot-toggle-box::after {
        content: '✓';
        position: absolute;
        inset: 0;
        display: grid;
        place-items: center;
        color: #ffffff;
        font-size: 12px;
        font-weight: 700;
        line-height: 1;
      }
      .code-shot-toggle:focus-visible {
        outline: 2px solid var(--accent-primary);
        outline-offset: 3px;
        border-radius: 8px;
      }
      .code-shot-toggle:disabled,
      .code-shot-toggle[aria-disabled="true"] {
        cursor: not-allowed;
      }
      .code-shot-toggle:disabled span:last-child,
      .code-shot-toggle[aria-disabled="true"] span:last-child {
        color: var(--text-tertiary);
      }
      .code-shot-field.is-disabled .code-shot-group-label,
      .code-shot-field.is-disabled .code-shot-help {
        color: var(--text-tertiary);
      }
      .code-shot-field.is-disabled .code-shot-toggle {
        opacity: 0.72;
      }
      .code-shot-field.is-disabled .code-shot-toggle-box {
        background: rgba(255,255,255,0.03);
      }
      .code-shot-mobile-jump {
        display: none;
        margin-bottom: 14px;
      }
      .sr-only {
        position: absolute;
        width: 1px;
        height: 1px;
        padding: 0;
        margin: -1px;
        overflow: hidden;
        clip: rect(0, 0, 0, 0);
        border: 0;
      }
      @media (max-width: 1080px) {
        .code-shot-settings-columns {
          grid-template-columns: 1fr;
        }
      }
      @media (max-width: 980px) {
        .code-shot-grid.two,
        .code-shot-shadow-grid {
          grid-template-columns: 1fr;
        }
      }
      @media (max-width: 768px) {
        .code-shot-editor-frame {
          grid-template-columns: 44px minmax(0, 1fr);
        }
        .code-shot-preview-viewport {
          min-height: 128px;
          padding: 12px;
        }
        .code-shot-shortcut-row {
          flex-direction: column;
          align-items: flex-start;
        }
        .code-shot-mobile-jump {
          display: block;
          position: sticky;
          top: calc(var(--nav-height) + 8px);
          z-index: var(--z-sticky);
        }
      }
      @media (prefers-reduced-motion: reduce) {
        .code-shot-theme-card,
        .code-shot-swatch,
        .code-shot-segmented button,
        .code-shot-chip,
        .code-shot-toast,
        .code-shot-overlay {
          transition: none !important;
          animation: none !important;
        }
      }
    `;
    document.head.appendChild(style);
  }

  function languageSelectOptions() {
    return LANGUAGES.map((item) => {
      if (item.id === 'auto') return '<option value="auto">Auto detect</option>';
      if (item.id === 'plain-text') return `<option value="${item.id}">Plain Text</option>`;
      return `<option value="${item.id}">${item.label} (.${item.ext})</option>`;
    }).join('');
  }

  function fontSelectOptions() {
    const groups = FONT_OPTIONS.reduce((map, item) => {
      if (!map[item.group]) map[item.group] = [];
      map[item.group].push(item);
      return map;
    }, {});
    return Object.entries(groups).map(([group, items]) => `<optgroup label="${escapeHtml(group)}">${items.map((item) => `<option value="${escapeHtml(item.id)}">${escapeHtml(item.label)}</option>`).join('')}</optgroup>`).join('');
  }

  function buildSizePresetOptions() {
    return SIZE_PRESETS.map((preset) => `<option value="${preset.id}">${escapeHtml(preset.label)}${preset.width && preset.height ? ` (${preset.width} x ${preset.height})` : ''}</option>`).join('');
  }

  function createMarkup() {
    return `
      <div class="tool-workspace-body code-shot-tool">
        <div class="code-shot-mobile-jump">
          <button type="button" class="btn btn-secondary" data-action="jump-preview">Preview & export</button>
        </div>
        <div class="code-shot-shell">
          <div class="code-shot-main">
            <section class="code-shot-section">
              <div class="code-shot-tabs" id="cs-editor-tabs"></div>
              <div class="code-shot-editor-shell" style="margin-top:14px;">
                <div class="code-shot-editor-toolbar">
                  <div class="code-shot-toolbar-left">
                    <button type="button" class="code-shot-toolbar-btn" data-action="add-tab" title="Add tab">+</button>
                    <details class="code-shot-details">
                      <summary>Recent</summary>
                      <div class="code-shot-details-body" id="cs-recent-list"></div>
                    </details>
                    <button type="button" class="code-shot-toolbar-btn" data-action="show-shortcuts" id="cs-shortcuts-trigger">Shortcuts</button>
                    <span class="code-shot-toolbar-note" id="cs-shortcuts-note" hidden></span>
                  </div>
                  <div class="code-shot-toolbar-actions">
                    <span class="code-shot-badge" id="cs-language-badge">Language: JavaScript</span>
                  </div>
                </div>
                <div class="code-shot-editor-frame">
                  <div class="code-shot-editor-gutter" id="cs-line-numbers"></div>
                  <div class="code-shot-editor-stage">
                    <pre class="code-shot-editor-mirror" id="cs-editor-mirror" aria-hidden="true"></pre>
                    <textarea class="code-shot-editor-input" id="cs-editor-input" aria-label="Code editor" role="textbox" aria-multiline="true" spellcheck="false" autocapitalize="off" autocomplete="off" autocorrect="off" placeholder="${escapeHtml(PLACEHOLDER_CODE)}"></textarea>
                  </div>
                </div>
                <div class="code-shot-editor-status">
                  <span id="cs-editor-stats">0 lines | 0 characters | JavaScript</span>
                  <span class="code-shot-tip" id="cs-editor-tip">Beautiful code images. Your code stays on your machine.</span>
                </div>
              </div>
            </section>

            <section class="code-shot-section code-shot-preview-column" id="cs-preview-column">
              <div class="code-shot-preview-header">
                <div>
                  <h3>Live preview</h3>
                  <p class="code-shot-preview-note">This is exactly what your image will look like. WYSIWYG.</p>
                </div>
                <div class="code-shot-preview-status">
                  <span class="code-shot-badge" id="cs-offline-badge">Works Offline - Once loaded, no internet needed</span>
                  <span class="code-shot-badge" id="cs-export-size-badge">Auto-sized export</span>
                </div>
              </div>
              <div class="code-shot-preview-frame">
                <div class="code-shot-preview-viewport" id="cs-preview-viewport">
                  <div class="code-shot-preview-zoom" id="cs-preview-zoom-wrap">
                    <div id="code-preview-card" role="img" aria-label="Code screenshot preview"></div>
                  </div>
                </div>
                <div class="code-shot-resize-handle" id="cs-resize-handle" title="Drag to resize preview"></div>
              </div>
              <div class="code-shot-preview-actions">
                <button type="button" class="btn btn-secondary" data-zoom="fit">Fit</button>
                <button type="button" class="btn btn-secondary" data-zoom="0.5">50%</button>
                <button type="button" class="btn btn-secondary" data-zoom="0.75">75%</button>
                <button type="button" class="btn btn-secondary" data-zoom="1">100%</button>
              </div>
              <div class="code-shot-export-actions">
                <button type="button" class="btn btn-secondary" id="cs-copy-btn">Copy image</button>
                <button type="button" class="btn btn-secondary" id="cs-svg-btn">Download SVG</button>
                <button type="button" class="btn btn-primary" id="cs-png-btn" aria-describedby="cs-png-help">Download PNG</button>
                <span id="cs-png-help" class="sr-only">Downloads a 2x resolution PNG of your code screenshot</span>
              </div>
              <p class="code-shot-export-note" id="cs-export-note">This image will export at auto size based on your code card.</p>
              <div class="sr-only" aria-live="polite" id="cs-live-region"></div>
            </section>

            <div class="code-shot-settings-columns">
              <div class="code-shot-settings-stack">
                <section class="code-shot-section">
                  <h3>Quick presets</h3>
                  <div class="code-shot-grid">
                    <div class="code-shot-field">
                      <label for="cs-size-preset">Size preset</label>
                      <select id="cs-size-preset">${buildSizePresetOptions()}</select>
                    </div>
                    <div class="code-shot-inline-row">
                      <button type="button" class="btn btn-secondary" id="cs-save-preset-btn">Save preset</button>
                      <details class="code-shot-details" style="flex:1 1 auto;">
                        <summary>Saved presets</summary>
                        <div class="code-shot-details-body">
                          <div id="cs-preset-list"></div>
                        </div>
                      </details>
                    </div>
                    <div class="code-shot-save-popover" id="cs-save-preset-popover">
                      <input type="text" id="cs-save-preset-name" maxlength="40" placeholder="Name this preset">
                      <div class="code-shot-inline-row">
                        <button type="button" class="btn btn-primary" id="cs-save-preset-confirm">Save</button>
                        <button type="button" class="btn btn-secondary" id="cs-save-preset-cancel">Cancel</button>
                      </div>
                    </div>
                  </div>
                </section>

                <section class="code-shot-section">
                  <h3>Window and background</h3>
                  <div class="code-shot-grid">
                    <div class="code-shot-grid two">
                      <div class="code-shot-field">
                        <span class="code-shot-group-label" id="cs-chrome-label">Window chrome</span>
                        <div class="code-shot-segmented" role="group" aria-labelledby="cs-chrome-label">
                          <button type="button" data-chrome="macos">macOS</button>
                          <button type="button" data-chrome="glass">Glass</button>
                          <button type="button" data-chrome="windows">Windows</button>
                          <button type="button" data-chrome="browser">Browser</button>
                          <button type="button" data-chrome="none">None</button>
                        </div>
                      </div>
                      <div class="code-shot-field">
                        <label for="cs-file-name">File name</label>
                        <input type="text" id="cs-file-name" maxlength="40">
                      </div>
                    </div>
                    <div class="code-shot-grid two">
                      <div class="code-shot-field">
                        <label for="cs-chrome-color">Chrome color override</label>
                        <div class="code-shot-color-row">
                          <input type="color" id="cs-chrome-color">
                          <button type="button" class="btn btn-secondary" id="cs-reset-chrome-color">Reset</button>
                        </div>
                      </div>
                      <div class="code-shot-field">
                        <span class="code-shot-group-label" id="cs-bg-mode-label">Background mode</span>
                        <div class="code-shot-segmented" role="group" aria-labelledby="cs-bg-mode-label">
                          <button type="button" data-bg-mode="gradient">Gradients</button>
                          <button type="button" data-bg-mode="solid">Solid</button>
                          <button type="button" data-bg-mode="transparent">Transparent</button>
                        </div>
                      </div>
                    </div>
                    <div class="code-shot-gradient-row" id="cs-gradient-row"></div>
                    <div class="code-shot-grid two">
                      <div class="code-shot-field">
                        <label for="cs-solid-color">Solid background</label>
                        <div class="code-shot-color-row">
                          <input type="color" id="cs-solid-color">
                          <input type="text" id="cs-solid-color-text" value="#0f0e17">
                        </div>
                      </div>
                      <div class="code-shot-field">
                        <label for="cs-padding-select">Background padding</label>
                        <div class="code-shot-inline-row">
                          <select id="cs-padding-select">
                            <option value="16">16px</option>
                            <option value="32">32px</option>
                            <option value="48">48px</option>
                            <option value="64">64px</option>
                            <option value="custom">Custom</option>
                          </select>
                          <input type="number" id="cs-padding-custom" min="0" max="300" step="1" value="32">
                        </div>
                      </div>
                    </div>
                  </div>
                </section>

                <section class="code-shot-section">
                  <h3>Focus and privacy</h3>
                  <div class="code-shot-grid">
                    <div class="code-shot-grid two">
                      <div class="code-shot-field">
                        <label for="cs-highlight-lines">Highlight lines</label>
                        <input type="text" id="cs-highlight-lines" placeholder="e.g. 2, 4-7, +10">
                        <div class="code-shot-help">Use single lines, ranges, or diff-style entries like <code>+10</code> and <code>-12</code>.</div>
                      </div>
                      <div class="code-shot-field">
                        <span class="code-shot-group-label">Diff mode</span>
                        <button type="button" class="code-shot-toggle" id="cs-diff-mode" aria-pressed="false">
                          <span class="code-shot-toggle-box" aria-hidden="true"></span>
                          <span>Use + / - line coloring</span>
                        </button>
                      </div>
                    </div>
                    <div class="code-shot-grid two">
                      <div class="code-shot-field" id="cs-dim-lines-field">
                        <span class="code-shot-group-label">Dim unfocused lines</span>
                        <button type="button" class="code-shot-toggle" id="cs-dim-lines" aria-pressed="false">
                          <span class="code-shot-toggle-box" aria-hidden="true"></span>
                          <span>Focus on highlighted lines</span>
                        </button>
                        <div class="code-shot-help" id="cs-dim-lines-help">Add highlighted lines first to enable this focus mode.</div>
                      </div>
                      <div class="code-shot-field">
                        <span class="code-shot-group-label">Blur sensitive strings</span>
                        <button type="button" class="code-shot-toggle" id="cs-blur-sensitive" aria-pressed="false">
                          <span class="code-shot-toggle-box" aria-hidden="true"></span>
                          <span>Redact secrets in the preview</span>
                        </button>
                        <div class="code-shot-help">Looks for API keys, JWTs, long tokens, and password strings. Click a string in the preview to force redact or reveal it.</div>
                      </div>
                    </div>
                    <div class="code-shot-grid two">
                      <div class="code-shot-field">
                        <span class="code-shot-group-label">Auto-pair editor</span>
                        <button type="button" class="code-shot-toggle" id="cs-auto-pair" aria-pressed="false">
                          <span class="code-shot-toggle-box" aria-hidden="true"></span>
                          <span>Insert matching brackets and quotes</span>
                        </button>
                      </div>
                      <div class="code-shot-field">
                        <span class="code-shot-group-label">Watermark</span>
                        <button type="button" class="code-shot-toggle" id="cs-watermark" aria-pressed="false">
                          <span class="code-shot-toggle-box" aria-hidden="true"></span>
                          <span>Show tooliest.com watermark</span>
                        </button>
                      </div>
                    </div>
                    <div class="code-shot-field">
                      <label for="cs-watermark-text">Custom watermark text</label>
                      <input type="text" id="cs-watermark-text" maxlength="40" placeholder="Optional handle or credit">
                    </div>
                    <div class="code-shot-tip" id="cs-watermark-note">Share without a watermark - we appreciate it! Consider mentioning @tooliest when you share.</div>
                  </div>
                </section>
              </div>

              <div class="code-shot-settings-stack">
                <section class="code-shot-section">
                  <h3>Syntax and theme</h3>
                  <div class="code-shot-grid">
                    <div class="code-shot-grid two">
                      <div class="code-shot-field">
                        <label for="cs-language-select">Language</label>
                        <select id="cs-language-select">${languageSelectOptions()}</select>
                      </div>
                      <div class="code-shot-field">
                        <span class="code-shot-group-label" id="cs-theme-filter-label">Theme filter</span>
                        <div class="code-shot-segmented" role="group" aria-labelledby="cs-theme-filter-label">
                          <button type="button" data-theme-filter="all">All</button>
                          <button type="button" data-theme-filter="dark">Dark</button>
                          <button type="button" data-theme-filter="light">Light</button>
                        </div>
                      </div>
                    </div>
                    <div class="code-shot-theme-grid" id="cs-theme-grid" tabindex="0" aria-label="Theme selector"></div>
                  </div>
                </section>

                <section class="code-shot-section">
                  <h3>Typography and card</h3>
                  <div class="code-shot-grid">
                    <div class="code-shot-grid two">
                      <div class="code-shot-field">
                        <label for="cs-font-family">Font family</label>
                        <select id="cs-font-family">${fontSelectOptions()}</select>
                      </div>
                      <div class="code-shot-field" id="cs-ligature-field">
                        <span class="code-shot-group-label">Ligatures</span>
                        <button type="button" class="code-shot-toggle" id="cs-ligatures" aria-pressed="false">
                          <span class="code-shot-toggle-box" aria-hidden="true"></span>
                          <span>Enable ligatures</span>
                        </button>
                      </div>
                    </div>
                    <div class="code-shot-grid two">
                      <div class="code-shot-field">
                        <span class="code-shot-group-label" id="cs-font-size-label">Font size</span>
                        <div class="code-shot-segmented" role="group" aria-labelledby="cs-font-size-label">
                          <button type="button" data-font-size="12">12</button>
                          <button type="button" data-font-size="13">13</button>
                          <button type="button" data-font-size="14">14</button>
                          <button type="button" data-font-size="15">15</button>
                          <button type="button" data-font-size="16">16</button>
                          <button type="button" data-font-size="18">18</button>
                          <button type="button" data-font-size="20">20</button>
                        </div>
                      </div>
                      <div class="code-shot-field">
                        <span class="code-shot-group-label" id="cs-line-height-label">Line height</span>
                        <div class="code-shot-segmented" role="group" aria-labelledby="cs-line-height-label">
                          <button type="button" data-line-height="1.4">1.4</button>
                          <button type="button" data-line-height="1.5">1.5</button>
                          <button type="button" data-line-height="1.6">1.6</button>
                          <button type="button" data-line-height="1.8">1.8</button>
                        </div>
                      </div>
                    </div>
                    <div class="code-shot-grid two">
                      <div class="code-shot-field">
                        <span class="code-shot-group-label" id="cs-letter-spacing-label">Letter spacing</span>
                        <div class="code-shot-segmented" role="group" aria-labelledby="cs-letter-spacing-label">
                          <button type="button" data-letter-spacing="0">0</button>
                          <button type="button" data-letter-spacing="0.5">0.5px</button>
                          <button type="button" data-letter-spacing="1">1px</button>
                        </div>
                      </div>
                      <div class="code-shot-field">
                        <span class="code-shot-group-label" id="cs-tab-size-label">Tab size</span>
                        <div class="code-shot-segmented" role="group" aria-labelledby="cs-tab-size-label">
                          <button type="button" data-tab-size="2">2</button>
                          <button type="button" data-tab-size="4">4</button>
                        </div>
                      </div>
                    </div>
                    <div class="code-shot-grid two">
                      <div class="code-shot-field">
                        <span class="code-shot-group-label" id="cs-radius-label">Border radius</span>
                        <div class="code-shot-segmented" role="group" aria-labelledby="cs-radius-label">
                          <button type="button" data-radius="0">0</button>
                          <button type="button" data-radius="4">4</button>
                          <button type="button" data-radius="8">8</button>
                          <button type="button" data-radius="12">12</button>
                          <button type="button" data-radius="16">16</button>
                          <button type="button" data-radius="24">24</button>
                        </div>
                      </div>
                      <div class="code-shot-field">
                        <label for="cs-card-width">Card width</label>
                        <div class="code-shot-inline-row">
                          <select id="cs-card-width">
                            <option value="480">480px</option>
                            <option value="560">560px</option>
                            <option value="680">680px</option>
                            <option value="800">800px</option>
                            <option value="960">960px</option>
                            <option value="auto">Auto-fit</option>
                            <option value="custom">Custom</option>
                          </select>
                          <input type="number" id="cs-card-width-custom" min="280" max="2600" step="10" value="680">
                        </div>
                      </div>
                    </div>
                    <div class="code-shot-shadow-grid" id="cs-shadow-grid"></div>
                    <div class="code-shot-badge" id="cs-font-loading-badge" aria-live="polite">Font ready</div>
                  </div>
                </section>
              </div>
            </div>
          </div>
        </div>

        <div class="code-shot-toast" id="cs-toast"></div>

        <div class="code-shot-overlay" id="cs-shortcuts-overlay" aria-hidden="true">
          <div class="code-shot-overlay-panel">
            <div class="code-shot-overlay-head">
              <div>
                <h3 style="margin:0 0 6px;">Keyboard shortcuts</h3>
                <p style="margin:0;color:var(--text-secondary);" id="cs-shortcuts-lead">Fast ways to move around the tool.</p>
              </div>
              <button type="button" class="code-shot-overlay-close" id="cs-shortcuts-close" aria-label="Close shortcuts panel">x</button>
            </div>
            <div class="code-shot-shortcuts">
              <div class="code-shot-shortcut-row"><span>Export PNG</span><div class="code-shot-shortcut-keys"><kbd>Ctrl</kbd><kbd>S</kbd><span>/</span><kbd>Cmd</kbd><kbd>S</kbd></div></div>
              <div class="code-shot-shortcut-row"><span>Export SVG</span><div class="code-shot-shortcut-keys"><kbd>Ctrl</kbd><kbd>Shift</kbd><kbd>S</kbd><span>/</span><kbd>Cmd</kbd><kbd>Shift</kbd><kbd>S</kbd></div></div>
              <div class="code-shot-shortcut-row"><span>Copy image</span><div class="code-shot-shortcut-keys"><kbd>Ctrl</kbd><kbd>C</kbd><span>/</span><kbd>Cmd</kbd><kbd>C</kbd></div></div>
              <div class="code-shot-shortcut-row"><span>Next theme</span><div class="code-shot-shortcut-keys"><kbd>Ctrl</kbd><kbd>]</kbd><span>/</span><kbd>Cmd</kbd><kbd>]</kbd></div></div>
              <div class="code-shot-shortcut-row"><span>Previous theme</span><div class="code-shot-shortcut-keys"><kbd>Ctrl</kbd><kbd>[</kbd><span>/</span><kbd>Cmd</kbd><kbd>[</kbd></div></div>
              <div class="code-shot-shortcut-row"><span>Toggle chrome</span><div class="code-shot-shortcut-keys"><kbd>Ctrl</kbd><kbd>K</kbd><span>/</span><kbd>Cmd</kbd><kbd>K</kbd></div></div>
              <div class="code-shot-shortcut-row"><span>New tab</span><div class="code-shot-shortcut-keys"><kbd>Ctrl</kbd><kbd>T</kbd><span>/</span><kbd>Cmd</kbd><kbd>T</kbd></div></div>
              <div class="code-shot-shortcut-row"><span>Focus editor</span><div class="code-shot-shortcut-keys"><kbd>E</kbd></div></div>
              <div class="code-shot-shortcut-row"><span>Show shortcuts</span><div class="code-shot-shortcut-keys"><kbd>?</kbd></div></div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  function loadScriptOnce(src, globalName) {
    if (globalName && window[globalName]) return Promise.resolve(window[globalName]);
    return new Promise((resolve, reject) => {
      const existing = Array.from(document.scripts).find((script) => script.src === src);
      if (existing) {
        if (globalName && window[globalName]) {
          resolve(window[globalName]);
          return;
        }
        existing.addEventListener('load', () => resolve(globalName ? window[globalName] : true), { once: true });
        existing.addEventListener('error', () => reject(new Error(`Failed to load ${src}`)), { once: true });
        return;
      }
      const script = document.createElement('script');
      script.src = src;
      script.async = true;
      script.onload = () => resolve(globalName ? window[globalName] : true);
      script.onerror = () => reject(new Error(`Failed to load ${src}`));
      document.head.appendChild(script);
    });
  }

  function ensureHighlight() {
    if (window.hljs) return Promise.resolve(window.hljs);
    if (highlightPromise) return highlightPromise;
    highlightPromise = loadScriptOnce(HIGHLIGHT_CDN, 'hljs').then(() => window.hljs);
    return highlightPromise;
  }

  function ensureHtml2Canvas() {
    if (window.html2canvas) return Promise.resolve(window.html2canvas);
    if (html2CanvasPromise) return html2CanvasPromise;
    html2CanvasPromise = loadScriptOnce(HTML2CANVAS_CDN, 'html2canvas').then(() => window.html2canvas);
    return html2CanvasPromise;
  }

  function prewarmHtml2Canvas() {
    setTimeout(() => {
      ensureHtml2Canvas().catch(() => {
        // Export remains lazy if prewarm misses.
      });
    }, 1800);
  }

  function ensureOptionalLanguage(languageId) {
    const language = getLanguage(languageId);
    const moduleUrl = OPTIONAL_LANGUAGE_MODULES[language.hljs];
    if (!moduleUrl) return Promise.resolve();
    if (optionalLanguageLoads.has(language.hljs)) return optionalLanguageLoads.get(language.hljs);
    const load = ensureHighlight().then(() => loadScriptOnce(moduleUrl));
    optionalLanguageLoads.set(language.hljs, load);
    return load;
  }

  function ensureFont(fontId) {
    const font = getFontMeta(fontId);
    if (!font.googleFamily) return Promise.resolve();
    if (fontLoadPromises.has(font.googleFamily)) return fontLoadPromises.get(font.googleFamily);
    const href = `https://fonts.googleapis.com/css2?family=${font.googleFamily}:wght@400;700&display=swap`;
    const existing = Array.from(document.querySelectorAll('link[rel="stylesheet"]')).find((link) => link.href === href);
    if (!existing) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = href;
      document.head.appendChild(link);
    }
    const promise = document.fonts && document.fonts.ready ? document.fonts.ready.then(() => true) : Promise.resolve(true);
    fontLoadPromises.set(font.googleFamily, promise);
    return promise;
  }

  function createPlainModel(code) {
    const lines = normalizeCode(code).split('\n');
    return {
      lines: lines.map((line) => ({ tokens: line ? [{ text: line, classes: [] }] : [] })),
      detectedLanguage: 'javascript',
      detectedLabel: 'JavaScript',
      confidence: 10,
      manual: false,
    };
  }

  function flattenHighlightTree(root) {
    const lines = [{ tokens: [] }];

    function pushToken(text, classes) {
      if (!text) return;
      const currentLine = lines[lines.length - 1];
      const normalizedClasses = Array.from(new Set((classes || []).filter((className) => /^hljs/.test(className)))).sort();
      const classKey = normalizedClasses.join('|');
      const previous = currentLine.tokens[currentLine.tokens.length - 1];
      if (previous && previous.classKey === classKey) {
        previous.text += text;
        return;
      }
      currentLine.tokens.push({
        text,
        classes: normalizedClasses,
        classKey,
      });
    }

    function walk(node, classes) {
      if (node.nodeType === Node.TEXT_NODE) {
        const value = String(node.nodeValue || '').replace(/\r/g, '');
        const parts = value.split('\n');
        parts.forEach((part, index) => {
          if (part) pushToken(part, classes);
          if (index < parts.length - 1) lines.push({ tokens: [] });
        });
        return;
      }
      if (node.nodeType !== Node.ELEMENT_NODE) return;
      const nextClasses = classes.concat(Array.from(node.classList || []));
      Array.from(node.childNodes).forEach((child) => walk(child, nextClasses));
    }

    Array.from(root.childNodes).forEach((child) => walk(child, []));
    return lines;
  }

  async function buildSemanticModel(tab) {
    const rawCode = tab.code || '';
    const renderCode = rawCode || PLACEHOLDER_CODE;
    if (!renderCode.trim()) return createPlainModel(renderCode);

    const manualLanguage = tab.manualLanguage || 'auto';
    if (manualLanguage !== 'auto' && manualLanguage !== 'plain-text') {
      await ensureOptionalLanguage(manualLanguage);
    }

    const hljs = await ensureHighlight();
    if (!hljs) return createPlainModel(renderCode);

    try {
      let result = null;
      let detectedLanguage = manualLanguage;
      let manual = manualLanguage !== 'auto';

      if (manualLanguage === 'plain-text') {
        return {
          lines: renderCode.split('\n').map((line) => ({ tokens: line ? [{ text: line, classes: [] }] : [] })),
          detectedLanguage: 'plain-text',
          detectedLabel: 'Plain Text',
          confidence: 10,
          manual,
        };
      }

      if (manualLanguage !== 'auto') {
        const language = getLanguage(manualLanguage);
        result = hljs.highlight(renderCode, { language: language.hljs || manualLanguage, ignoreIllegals: true });
        detectedLanguage = manualLanguage;
      } else {
        result = hljs.highlightAuto(renderCode, COMMON_AUTO_LANGUAGES);
        const reverse = LANGUAGES.find((item) => item.hljs === result.language);
        detectedLanguage = reverse ? reverse.id : 'plain-text';
      }

      const wrapper = document.createElement('div');
      wrapper.innerHTML = result.value;
      const lines = flattenHighlightTree(wrapper);
      const language = getLanguage(detectedLanguage);
      const confidence = typeof result.relevance === 'number' ? result.relevance : 0;
      return {
        lines,
        detectedLanguage,
        detectedLabel: manualLanguage === 'auto' && confidence < 5 ? 'Unknown - select manually' : language.label,
        confidence,
        manual,
      };
    } catch (_) {
      return createPlainModel(renderCode);
    }
  }

  function parseHighlightSpec(value, diffMode) {
    const input = String(value || '').trim();
    const map = new Map();
    if (!input) return map;
    input.split(',').map((segment) => segment.trim()).filter(Boolean).forEach((segment) => {
      let kind = 'focus';
      let clean = segment;
      if (diffMode && (clean[0] === '+' || clean[0] === '-')) {
        kind = clean[0] === '+' ? 'addition' : 'deletion';
        clean = clean.slice(1);
      }
      const rangeMatch = clean.match(/^(\d+)\s*-\s*(\d+)$/);
      if (rangeMatch) {
        const start = Number(rangeMatch[1]);
        const end = Number(rangeMatch[2]);
        const min = Math.min(start, end);
        const max = Math.max(start, end);
        for (let number = min; number <= max; number += 1) {
          map.set(number, kind);
        }
        return;
      }
      const single = Number(clean);
      if (Number.isInteger(single) && single > 0) {
        map.set(single, kind);
      }
    });
    return map;
  }

  function resolveTokenTheme(theme, token) {
    const style = {
      color: theme.text,
      background: '',
      fontWeight: '400',
      fontStyle: 'normal',
    };
    (token.classes || []).forEach((className) => {
      const spec = theme.tokens[className];
      if (!spec) return;
      if (spec.color) style.color = spec.color;
      if (spec.background) style.background = spec.background;
      if (spec.bold) style.fontWeight = '700';
      if (spec.italic) style.fontStyle = 'italic';
    });
    return style;
  }

  function isSecretLike(text) {
    return SECRET_PATTERNS.some((pattern) => pattern.test(text));
  }

  function isStringLikeToken(token) {
    const classes = token.classes || [];
    return classes.includes('hljs-string') || classes.includes('hljs-attr') || classes.includes('hljs-meta-string');
  }

  function isTokenBlurred(runtime, token, lineNumber, tokenIndex) {
    const tab = getActiveTab(runtime.state);
    const key = `${lineNumber}:${tokenIndex}:${hashString(token.text)}`;
    const manual = tab.blurOverrides[key];
    if (typeof manual === 'boolean') return manual;
    if (!runtime.state.blurSensitive) return false;
    return isStringLikeToken(token) && isSecretLike(token.text);
  }

  function toggleBlurOverride(runtime, token, lineNumber, tokenIndex) {
    const tab = getActiveTab(runtime.state);
    const key = `${lineNumber}:${tokenIndex}:${hashString(token.text)}`;
    const next = !isTokenBlurred(runtime, token, lineNumber, tokenIndex);
    tab.blurOverrides[key] = next;
    saveState(runtime);
    renderPreview(runtime);
  }

  function getEffectiveCode(tab) {
    return normalizeCode(tab.code || '') || PLACEHOLDER_CODE;
  }

  function countVisualCharacters(text, tabSize) {
    return String(text || '').split('').reduce((count, character) => count + (character === '\t' ? tabSize : 1), 0);
  }

  function measureTextWidth(text, fontSize, letterSpacing, tabSize) {
    const visualLength = countVisualCharacters(text, tabSize);
    return (visualLength * (fontSize * 0.62)) + (Math.max(0, visualLength - 1) * letterSpacing);
  }

  function buildPreviewMetrics(runtime, model) {
    const state = runtime.state;
    const theme = THEMES[state.theme] || THEMES['one-dark'];
    const tab = getActiveTab(state);
    const padding = getResolvedPadding(state);
    const fontSize = Number(state.fontSize) || 14;
    const lineHeight = Number(state.lineHeight) || 1.5;
    const lineHeightPx = fontSize * lineHeight;
    const lineCount = Math.max(1, model.lines.length);
    const gutterWidth = 56;
    const codePaddingX = 20;
    const codePaddingY = 20;
    const tabsVisible = state.tabs.length > 1 && state.chrome !== 'none';
    let chromeHeight = 0;
    if (state.chrome === 'macos' || state.chrome === 'glass') chromeHeight = tabsVisible ? 72 : 40;
    else if (state.chrome === 'windows') chromeHeight = tabsVisible ? 64 : 32;
    else if (state.chrome === 'browser') chromeHeight = tabsVisible ? 84 : 66;
    const contentWidthEstimate = model.lines.reduce((maxWidth, line) => {
      const lineWidth = line.tokens.reduce((sum, token) => sum + measureTextWidth(token.text, fontSize, Number(state.letterSpacing) || 0, state.tabSize), 0);
      return Math.max(maxWidth, lineWidth);
    }, 0);
    let cardWidth = getResolvedCardWidth(state);
    if (cardWidth === 'auto') {
      cardWidth = clamp(Math.ceil(contentWidthEstimate + gutterWidth + (codePaddingX * 2) + 36), 420, 2200);
    }
    const codeAreaHeight = (lineCount * lineHeightPx) + (codePaddingY * 2);
    const cardHeight = chromeHeight + codeAreaHeight;
    const preset = SIZE_PRESETS.find((item) => item.id === state.sizePreset) || SIZE_PRESETS[0];
    const stageWidth = preset.width || Math.ceil(cardWidth + (padding * 2));
    const stageHeight = preset.height || Math.ceil(cardHeight + (padding * 2));
    const availableWidth = stageWidth - (padding * 2);
    const availableHeight = stageHeight - (padding * 2);
    const contentScale = preset.width && preset.height ? Math.min(1, availableWidth / cardWidth, availableHeight / cardHeight) : 1;
    const language = getLanguage(model.detectedLanguage || tab.manualLanguage || 'javascript');

    return {
      theme,
      tab,
      padding,
      fontSize,
      lineHeight,
      lineHeightPx,
      lineCount,
      gutterWidth,
      codePaddingX,
      codePaddingY,
      cardWidth,
      cardHeight,
      chromeHeight,
      stageWidth,
      stageHeight,
      contentScale,
      preset,
      language,
    };
  }

  function lineHighlightColors(theme, kind) {
    if (kind === 'addition') {
      return {
        background: theme.mode === 'dark' ? 'rgba(67, 233, 123, 0.18)' : 'rgba(56, 249, 215, 0.14)',
        accent: 'rgba(67, 233, 123, 0.82)',
      };
    }
    if (kind === 'deletion') {
      return {
        background: theme.mode === 'dark' ? 'rgba(255, 85, 85, 0.18)' : 'rgba(255, 65, 108, 0.12)',
        accent: 'rgba(255, 85, 85, 0.82)',
      };
    }
    return {
      background: theme.mode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)',
      accent: rgba(theme.accent || theme.tokens['hljs-keyword'].color, 0.8),
    };
  }

  function buildMacDots(size) {
    return [
      ['#ff5f56', size],
      ['#ffbd2e', size],
      ['#27c93f', size],
    ];
  }

  function buildPreviewChrome(runtime, metrics) {
    const state = runtime.state;
    const theme = metrics.theme;
    const header = document.createElement('div');
    const topRadius = state.chrome === 'windows' ? '0px' : `${state.borderRadius}px ${state.borderRadius}px 0 0`;
    const headerColor = state.chromeColor || theme.card.titlebarBg;
    const titleColor = theme.card.titlebarText;
    const activeTab = getActiveTab(state);

    if (state.chrome === 'none') {
      return { element: null, height: 0 };
    }

    header.style.cssText = [
      'display:flex',
      'flex-direction:column',
      `border-bottom:1px solid ${rgba(theme.card.borderColor, 0.9)}`,
      `background:${state.chrome === 'glass' ? rgba(headerColor, 0.78) : headerColor}`,
      `border-radius:${topRadius}`,
      'overflow:hidden',
    ].join(';');

    if (state.chrome === 'browser') {
      const tabRow = document.createElement('div');
      tabRow.style.cssText = 'display:flex;align-items:center;gap:8px;padding:10px 14px 8px;';
      state.tabs.forEach((tab, index) => {
        const isActive = tab.id === activeTab.id;
        const tabEl = document.createElement('div');
        tabEl.style.cssText = [
          'display:flex',
          'align-items:center',
          'gap:8px',
          'min-width:0',
          'max-width:180px',
          'padding:7px 10px',
          'border-radius:10px 10px 0 0',
          `background:${isActive ? theme.background : rgba(theme.background, theme.mode === 'dark' ? 0.34 : 0.14)}`,
          `color:${isActive ? theme.text : titleColor}`,
          `border:1px solid ${rgba(theme.card.borderColor, 0.75)}`,
          'border-bottom:none',
        ].join(';');

        const icon = document.createElement('span');
        icon.style.cssText = `display:inline-grid;place-items:center;width:16px;height:16px;border-radius:4px;background:${theme.accent};color:${theme.mode === 'dark' ? '#0b1020' : '#ffffff'};font-size:10px;font-weight:700;flex:0 0 auto;`;
        icon.textContent = (tab.name || activeTab.name || defaultFileName(metrics.language.id, index + 1)).slice(0, 1).toUpperCase();
        const label = document.createElement('span');
        label.style.cssText = 'min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:12px;';
        label.textContent = tab.name;
        const close = document.createElement('span');
        close.style.cssText = 'font-size:12px;opacity:0.7;';
        close.textContent = 'x';
        tabEl.appendChild(icon);
        tabEl.appendChild(label);
        tabEl.appendChild(close);
        tabRow.appendChild(tabEl);
      });
      header.appendChild(tabRow);

      const urlRow = document.createElement('div');
      urlRow.style.cssText = 'padding:0 14px 12px;';
      const urlBar = document.createElement('div');
      urlBar.style.cssText = `height:30px;border-radius:999px;background:${rgba(theme.background, theme.mode === 'dark' ? 0.55 : 0.08)};display:flex;align-items:center;padding:0 14px;color:${titleColor};font-size:12px;`;
      urlBar.textContent = `file:///${activeTab.name || defaultFileName(metrics.language.id, 1)}`;
      urlRow.appendChild(urlBar);
      header.appendChild(urlRow);
      return { element: header, height: state.tabs.length > 1 ? 84 : 66 };
    }

    const topRow = document.createElement('div');
    topRow.style.cssText = [
      'display:flex',
      'align-items:center',
      'justify-content:space-between',
      `height:${state.chrome === 'windows' ? 32 : 40}px`,
      `padding:${state.chrome === 'windows' ? '0 0 0 14px' : '0 14px'}`,
      `color:${titleColor}`,
      'font-size:13px',
    ].join(';');

    if (state.chrome === 'macos' || state.chrome === 'glass') {
      const left = document.createElement('div');
      left.style.cssText = 'display:flex;align-items:center;gap:6px;';
      buildMacDots(state.chrome === 'glass' ? 14 : 12).forEach(([color, size]) => {
        const dot = document.createElement('span');
        dot.style.cssText = `width:${size}px;height:${size}px;border-radius:50%;background:${color};box-shadow:inset 0 -1px 2px rgba(0,0,0,0.28);display:inline-block;`;
        left.appendChild(dot);
      });
      const centerWrap = document.createElement('div');
      centerWrap.style.cssText = 'position:absolute;inset:0;display:flex;align-items:center;justify-content:center;padding:0 88px;pointer-events:none;';
      const center = document.createElement('span');
      center.style.cssText = 'display:block;max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;opacity:0.84;line-height:1.2;';
      center.textContent = activeTab.name || defaultFileName(metrics.language.id, 1);
      centerWrap.appendChild(center);
      topRow.style.position = 'relative';
      topRow.appendChild(left);
      topRow.appendChild(centerWrap);
    } else {
      const title = document.createElement('div');
      title.style.cssText = 'overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:55%;opacity:0.88;';
      title.textContent = activeTab.name || defaultFileName(metrics.language.id, 1);
      const actions = document.createElement('div');
      actions.style.cssText = 'display:flex;align-items:stretch;margin-left:auto;';
      [
        { label: '-', bg: 'transparent' },
        { label: '[]', bg: 'transparent' },
        { label: 'x', bg: '#c42b1c' },
      ].forEach((item) => {
        const box = document.createElement('span');
        box.style.cssText = `width:46px;display:grid;place-items:center;background:${item.bg};color:${item.bg === 'transparent' ? titleColor : '#ffffff'};`;
        box.textContent = item.label;
        actions.appendChild(box);
      });
      topRow.appendChild(title);
      topRow.appendChild(actions);
    }
    header.appendChild(topRow);

    if (state.tabs.length > 1) {
      const tabsRow = document.createElement('div');
      tabsRow.style.cssText = 'display:flex;gap:8px;align-items:center;padding:0 12px 10px;overflow:hidden;';
      state.tabs.forEach((tab) => {
        const isActive = tab.id === activeTab.id;
        const tabEl = document.createElement('div');
        tabEl.style.cssText = [
          'display:flex',
          'align-items:center',
          'gap:6px',
          'min-width:0',
          'max-width:170px',
          'padding:6px 10px',
          'border-radius:10px',
          `background:${isActive ? rgba(theme.background, theme.mode === 'dark' ? 0.88 : 0.96) : rgba(theme.background, theme.mode === 'dark' ? 0.38 : 0.12)}`,
          `color:${isActive ? theme.text : titleColor}`,
          `border:1px solid ${rgba(theme.card.borderColor, 0.75)}`,
        ].join(';');
        const label = document.createElement('span');
        label.style.cssText = 'min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:12px;';
        label.textContent = tab.name;
        tabEl.appendChild(label);
        tabsRow.appendChild(tabEl);
      });
      header.appendChild(tabsRow);
    }

    return {
      element: header,
      height: state.chrome === 'windows'
        ? (state.tabs.length > 1 ? 64 : 32)
        : (state.tabs.length > 1 ? 72 : 40),
    };
  }

  function buildPreview(runtime, options = {}) {
    const interactive = options.interactive !== false;
    const activeTab = getActiveTab(runtime.state);
    const model = runtime.semanticModels.get(activeTab.id) || createPlainModel(getEffectiveCode(activeTab));
    const metrics = buildPreviewMetrics(runtime, model);
    const theme = metrics.theme;
    const highlightMap = parseHighlightSpec(activeTab.highlightSpec, runtime.state.diffMode);
    const scaledCardWidth = Math.max(1, Math.round(metrics.cardWidth * metrics.contentScale));
    const scaledCardHeight = Math.max(1, Math.round(metrics.cardHeight * metrics.contentScale));
    const stage = document.createElement('div');
    stage.id = 'code-preview-card';
    stage.setAttribute('role', 'img');
    stage.setAttribute('aria-label', `Code screenshot preview: ${model.detectedLabel} code in ${theme.label} theme, ${runtime.state.chrome} chrome, ${runtime.state.backgroundMode} background`);
    stage.style.cssText = [
      'position:relative',
      `width:${metrics.stageWidth}px`,
      `height:${metrics.stageHeight}px`,
      `padding:${metrics.padding}px`,
      'box-sizing:border-box',
      metrics.preset.width && metrics.preset.height ? 'display:flex' : 'display:block',
      metrics.preset.width && metrics.preset.height ? 'align-items:center' : '',
      metrics.preset.width && metrics.preset.height ? 'justify-content:center' : '',
      runtime.state.backgroundMode === 'gradient' ? `background:${GRADIENTS[runtime.state.gradient] || GRADIENTS.cosmic}` : '',
      runtime.state.backgroundMode === 'solid' ? `background:${runtime.state.solidColor}` : '',
      runtime.state.backgroundMode === 'transparent' ? 'background:transparent' : '',
      'overflow:hidden',
    ].filter(Boolean).join(';');

    const cardWrap = document.createElement('div');
    cardWrap.style.cssText = [
      `width:${scaledCardWidth}px`,
      `height:${scaledCardHeight}px`,
      'position:relative',
      'overflow:visible',
    ].join(';');

    const cardFrame = document.createElement('div');
    cardFrame.style.cssText = [
      'position:absolute',
      'left:0',
      'top:0',
      `width:${metrics.cardWidth}px`,
      'transform-origin:top left',
      `transform:scale(${metrics.contentScale})`,
      `box-shadow:${SHADOWS[runtime.state.shadow] || SHADOWS.medium}`,
    ].join(';');

    const card = document.createElement('div');
    card.style.cssText = [
      `background:${theme.background}`,
      `color:${theme.text}`,
      `border-radius:${runtime.state.borderRadius}px`,
      `border:1px solid ${theme.card.borderColor}`,
      'overflow:hidden',
      'width:100%',
      `font-family:${getFontMeta(runtime.state.fontFamily).stack}`,
      `font-size:${metrics.fontSize}px`,
      `line-height:${metrics.lineHeight}`,
      `letter-spacing:${runtime.state.letterSpacing}px`,
      `font-variant-ligatures:${getFontMeta(runtime.state.fontFamily).ligatures && runtime.state.ligatures ? 'contextual' : 'none'}`,
      `tab-size:${runtime.state.tabSize}`,
    ].join(';');

    const chrome = buildPreviewChrome(runtime, metrics);
    if (chrome.element) card.appendChild(chrome.element);

    const body = document.createElement('div');
    body.style.cssText = `padding:${metrics.codePaddingY}px ${metrics.codePaddingX}px;display:block;`;

    model.lines.forEach((line, index) => {
      const lineNumber = index + 1;
      const highlightKind = highlightMap.get(lineNumber);
      const highlightStyle = lineHighlightColors(theme, highlightKind);
      const dim = runtime.state.dimUnfocused && highlightMap.size > 0 && !highlightKind;
      const lineRow = document.createElement('div');
      lineRow.dataset.line = String(lineNumber);
      lineRow.style.cssText = [
        'position:relative',
        'display:flex',
        'align-items:stretch',
        'min-height:1em',
        highlightKind ? `background:${highlightStyle.background}` : '',
        dim ? 'opacity:0.35' : 'opacity:1',
      ].filter(Boolean).join(';');

      if (highlightKind) {
        const accentBar = document.createElement('span');
        accentBar.style.cssText = [
          'position:absolute',
          'left:0',
          'top:0',
          'bottom:0',
          'width:3px',
          `background:${highlightStyle.accent}`,
          'pointer-events:none',
        ].join(';');
        lineRow.appendChild(accentBar);
      }

      const numberCell = document.createElement('div');
      numberCell.style.cssText = [
        `width:${metrics.gutterWidth - 6}px`,
        'padding-right:14px',
        'text-align:right',
        `color:${theme.gutter}`,
        'user-select:none',
        'flex:0 0 auto',
      ].join(';');
      numberCell.textContent = String(lineNumber);

      const codeCell = document.createElement('div');
      codeCell.style.cssText = 'flex:1 1 auto;min-width:0;white-space:pre;overflow:visible;';
      if (!line.tokens.length) {
        codeCell.innerHTML = '&nbsp;';
      } else {
        line.tokens.forEach((token, tokenIndex) => {
          const tokenStyle = resolveTokenTheme(theme, token);
          const isBlurred = isTokenBlurred(runtime, token, lineNumber, tokenIndex);
          const span = document.createElement('span');
          span.style.cssText = [
            `color:${tokenStyle.color}`,
            `font-weight:${tokenStyle.fontWeight}`,
            `font-style:${tokenStyle.fontStyle}`,
            tokenStyle.background ? `background:${tokenStyle.background}` : '',
            isBlurred ? `background:${tokenStyle.color};color:transparent;border-radius:2px;padding:0 2px;display:inline-block;` : '',
          ].filter(Boolean).join(';');
          span.textContent = isBlurred ? '████████' : token.text;
          if (interactive && runtime.state.blurSensitive && isStringLikeToken(token)) {
            span.style.cursor = 'pointer';
            span.title = isBlurred ? 'Click to reveal this token in the preview' : 'Click to redact this token in the preview';
            span.addEventListener('click', () => toggleBlurOverride(runtime, token, lineNumber, tokenIndex));
          }
          codeCell.appendChild(span);
        });
      }

      lineRow.appendChild(numberCell);
      lineRow.appendChild(codeCell);
      body.appendChild(lineRow);
    });

    card.appendChild(body);
    cardFrame.appendChild(card);
    cardWrap.appendChild(cardFrame);
    stage.appendChild(cardWrap);

    if (runtime.state.watermark || runtime.state.watermarkText.trim()) {
      const watermark = document.createElement('div');
      watermark.style.cssText = [
        'position:absolute',
        'right:12px',
        'bottom:12px',
        `font-family:${getFontMeta(runtime.state.fontFamily).stack}`,
        'font-size:11px',
        `color:${rgba(theme.text, 0.45)}`,
        'pointer-events:none',
      ].join(';');
      watermark.textContent = runtime.state.watermarkText.trim() || (runtime.state.watermark ? 'tooliest.com' : '');
      if (watermark.textContent) stage.appendChild(watermark);
    }

    return { stage, model, metrics };
  }

  function renderThemeGrid(runtime) {
    const grid = runtime.elements.themeGrid;
    const visibleThemes = THEME_ORDER.filter((themeId) => {
      if (runtime.state.themeFilter === 'all') return true;
      return THEMES[themeId].mode === runtime.state.themeFilter;
    });
    runtime.visibleThemes = visibleThemes;
    grid.innerHTML = '';
    visibleThemes.forEach((themeId) => {
      const theme = THEMES[themeId];
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'code-shot-theme-card';
      button.dataset.theme = themeId;
      button.setAttribute('aria-label', `${theme.label} theme`);
      button.setAttribute('aria-pressed', String(runtime.state.theme === themeId));
      button.style.borderColor = runtime.state.theme === themeId ? theme.accent : '';
      const preview = document.createElement('div');
      preview.className = 'code-shot-theme-preview';
      preview.style.background = theme.background;
      ['hljs-keyword', 'hljs-string', 'hljs-comment'].forEach((tokenKey) => {
        const dot = document.createElement('span');
        dot.className = 'code-shot-theme-dot';
        dot.style.background = theme.tokens[tokenKey].color;
        preview.appendChild(dot);
      });
      const name = document.createElement('div');
      name.className = 'code-shot-theme-name';
      name.textContent = theme.label;
      button.appendChild(preview);
      button.appendChild(name);
      grid.appendChild(button);
    });
  }

  function renderGradientRow(runtime) {
    const row = runtime.elements.gradientRow;
    row.innerHTML = '';
    Object.entries(GRADIENTS).forEach(([id, gradient]) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'code-shot-swatch';
      button.dataset.gradient = id;
      button.setAttribute('aria-label', `${id} gradient`);
      button.style.background = gradient;
      button.style.borderColor = runtime.state.gradient === id ? '#ffffff' : '';
      row.appendChild(button);
    });
  }

  function renderShadowGrid(runtime) {
    const grid = runtime.elements.shadowGrid;
    grid.innerHTML = '';
    Object.entries(SHADOWS).forEach(([id, shadow]) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'code-shot-shadow-option';
      button.dataset.shadow = id;
      button.setAttribute('aria-pressed', String(runtime.state.shadow === id));
      const preview = document.createElement('div');
      preview.className = 'code-shot-shadow-preview';
      preview.style.boxShadow = shadow;
      const label = document.createElement('span');
      label.className = 'code-shot-shadow-name';
      label.textContent = id;
      button.appendChild(preview);
      button.appendChild(label);
      grid.appendChild(button);
    });
  }

  function renderTabButtons(runtime) {
    const wrap = runtime.elements.editorTabs;
    const activeTab = getActiveTab(runtime.state);
    wrap.innerHTML = '';
    runtime.state.tabs.forEach((tab) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = `code-shot-tab${tab.id === activeTab.id ? ' is-active' : ''}`;
      button.dataset.tabId = tab.id;
      button.draggable = true;
      button.setAttribute('aria-pressed', String(tab.id === activeTab.id));
      const label = document.createElement('span');
      label.className = 'code-shot-tab-label';
      label.textContent = tab.name;
      const close = document.createElement('button');
      close.type = 'button';
      close.className = 'code-shot-tab-close';
      close.dataset.closeTab = tab.id;
      close.title = runtime.state.tabs.length > 1 ? 'Close tab' : 'At least one tab is required';
      close.textContent = 'x';
      button.appendChild(label);
      button.appendChild(close);
      wrap.appendChild(button);
    });
  }

  function renderPresetList(runtime) {
    const list = runtime.elements.presetList;
    runtime.userPresets = normalizePresets(readJson(STORAGE.presets, []));
    list.innerHTML = '';

    BUILTIN_PRESETS.forEach((preset) => {
      const item = document.createElement('div');
      item.className = 'code-shot-preset-item';
      const row = document.createElement('div');
      row.className = 'code-shot-preset-row';
      const name = document.createElement('strong');
      name.textContent = preset.name;
      const swatch = document.createElement('div');
      swatch.className = 'code-shot-mini-swatch';
      swatch.style.background = preset.settings.backgroundMode === 'transparent'
        ? 'linear-gradient(45deg, rgba(255,255,255,0.06) 25%, transparent 25%), linear-gradient(-45deg, rgba(255,255,255,0.06) 25%, transparent 25%), linear-gradient(45deg, transparent 75%, rgba(255,255,255,0.06) 75%), linear-gradient(-45deg, transparent 75%, rgba(255,255,255,0.06) 75%)'
        : (preset.settings.backgroundMode === 'solid' ? preset.settings.solidColor : GRADIENTS[preset.settings.gradient]);
      row.appendChild(name);
      row.appendChild(swatch);
      item.appendChild(row);
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'btn btn-secondary';
      button.dataset.applyPreset = preset.id;
      button.textContent = 'Apply';
      item.appendChild(button);
      list.appendChild(item);
    });

    runtime.userPresets.forEach((preset) => {
      const item = document.createElement('div');
      item.className = 'code-shot-preset-item';
      const row = document.createElement('div');
      row.className = 'code-shot-preset-row';
      const name = document.createElement('strong');
      name.textContent = preset.name;
      const swatch = document.createElement('div');
      swatch.className = 'code-shot-mini-swatch';
      swatch.style.background = preset.backgroundMode === 'solid'
        ? preset.solidColor
        : (preset.backgroundMode === 'transparent' ? 'linear-gradient(45deg, rgba(255,255,255,0.06) 25%, transparent 25%), linear-gradient(-45deg, rgba(255,255,255,0.06) 25%, transparent 25%), linear-gradient(45deg, transparent 75%, rgba(255,255,255,0.06) 75%), linear-gradient(-45deg, transparent 75%, rgba(255,255,255,0.06) 75%)' : GRADIENTS[preset.gradient]);
      row.appendChild(name);
      row.appendChild(swatch);
      item.appendChild(row);
      const controls = document.createElement('div');
      controls.className = 'code-shot-inline-row';
      const applyBtn = document.createElement('button');
      applyBtn.type = 'button';
      applyBtn.className = 'btn btn-secondary';
      applyBtn.dataset.applyUserPreset = preset.id;
      applyBtn.textContent = 'Apply';
      const deleteBtn = document.createElement('button');
      deleteBtn.type = 'button';
      deleteBtn.className = 'btn btn-secondary';
      deleteBtn.dataset.deleteUserPreset = preset.id;
      deleteBtn.textContent = 'Delete';
      controls.appendChild(applyBtn);
      controls.appendChild(deleteBtn);
      item.appendChild(controls);
      list.appendChild(item);
    });
  }

  function renderHistory(runtime) {
    const list = runtime.elements.recentList;
    runtime.history = normalizeHistory(readJson(STORAGE.history, []));
    list.innerHTML = '';
    if (!runtime.history.length) {
      const empty = document.createElement('p');
      empty.className = 'code-shot-tip';
      empty.textContent = 'Recent snippets will appear here.';
      list.appendChild(empty);
      return;
    }
    runtime.history.forEach((entry) => {
      const item = document.createElement('div');
      item.className = 'code-shot-history-item';
      const title = document.createElement('strong');
      title.textContent = entry.languageLabel || 'Code snippet';
      const snippet = document.createElement('span');
      snippet.className = 'code-shot-tip';
      snippet.textContent = String(entry.code || '').replace(/\s+/g, ' ').slice(0, 60);
      const time = document.createElement('span');
      time.className = 'code-shot-tip';
      time.textContent = entry.timeLabel || '';
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'btn btn-secondary';
      button.dataset.loadHistory = entry.id;
      button.textContent = 'Restore';
      item.appendChild(title);
      item.appendChild(snippet);
      item.appendChild(time);
      item.appendChild(button);
      list.appendChild(item);
    });
    const clear = document.createElement('button');
    clear.type = 'button';
    clear.className = 'btn btn-secondary';
    clear.dataset.clearHistory = '1';
    clear.textContent = 'Clear history';
    list.appendChild(clear);
  }

  function updateToolbarState(runtime) {
    const state = runtime.state;
    const activeTab = getActiveTab(state);
    const model = runtime.semanticModels.get(activeTab.id) || createPlainModel(getEffectiveCode(activeTab));
    const code = getEffectiveCode(activeTab);
    runtime.elements.editorStats.textContent = `${code.split('\n').length} lines | ${code.length} characters | ${model.detectedLabel}`;
    runtime.elements.languageBadge.innerHTML = model.detectedLabel.indexOf('Unknown') === 0
      ? 'Language: Unknown - select manually'
      : `Language: ${escapeHtml(model.detectedLabel)}`;
    const hint = model.detectedLanguage === 'json'
      ? '<a href="/json-formatter">Tip: Format your JSON first</a>'
      : (model.detectedLanguage === 'css' ? '<a href="/css-beautifier">Tip: Beautify your CSS first</a>' : 'Beautiful code images. Your code stays on your machine.');
    runtime.elements.editorTip.innerHTML = hint;
    runtime.elements.fileName.value = activeTab.name;
    runtime.elements.languageSelect.value = activeTab.manualLanguage || 'auto';
    runtime.elements.highlightInput.value = activeTab.highlightSpec || '';
  }

  function updateLineNumbers(runtime) {
    const count = getEffectiveCode(getActiveTab(runtime.state)).split('\n').length;
    const fragment = [];
    for (let index = 1; index <= count; index += 1) fragment.push(index);
    runtime.elements.lineNumbers.innerHTML = fragment.join('<br>');
  }

  function renderEditorMirror(runtime) {
    const activeTab = getActiveTab(runtime.state);
    const model = runtime.semanticModels.get(activeTab.id) || createPlainModel(getEffectiveCode(activeTab));
    const theme = THEMES[runtime.state.theme] || THEMES['one-dark'];
    const mirror = runtime.elements.editorMirror;
    mirror.innerHTML = '';
    mirror.style.background = theme.background;
    mirror.style.color = theme.text;
    mirror.style.fontFamily = getFontMeta(runtime.state.fontFamily).stack;
    mirror.style.fontSize = `${runtime.state.fontSize}px`;
    mirror.style.lineHeight = String(runtime.state.lineHeight);
    mirror.style.letterSpacing = `${runtime.state.letterSpacing}px`;
    mirror.style.tabSize = String(runtime.state.tabSize);
    mirror.style.fontVariantLigatures = getFontMeta(runtime.state.fontFamily).ligatures && runtime.state.ligatures ? 'contextual' : 'none';
    runtime.elements.editorInput.style.fontFamily = mirror.style.fontFamily;
    runtime.elements.editorInput.style.fontSize = mirror.style.fontSize;
    runtime.elements.editorInput.style.lineHeight = mirror.style.lineHeight;
    runtime.elements.editorInput.style.letterSpacing = mirror.style.letterSpacing;
    runtime.elements.editorInput.style.tabSize = mirror.style.tabSize;

    const expectedValue = normalizeCode(activeTab.code || '');
    if (runtime.elements.editorInput.value !== expectedValue) {
      runtime.elements.editorInput.value = expectedValue;
    }

    model.lines.forEach((line) => {
      const row = document.createElement('div');
      row.style.whiteSpace = 'pre';
      if (!line.tokens.length) {
        row.innerHTML = '&nbsp;';
      } else {
        line.tokens.forEach((token) => {
          const tokenStyle = resolveTokenTheme(theme, token);
          const span = document.createElement('span');
          span.style.color = tokenStyle.color;
          span.style.fontWeight = tokenStyle.fontWeight;
          span.style.fontStyle = tokenStyle.fontStyle;
          span.textContent = token.text;
          row.appendChild(span);
        });
      }
      mirror.appendChild(row);
    });
  }

  function syncEditorScroll(runtime) {
    runtime.elements.editorMirror.scrollTop = runtime.elements.editorInput.scrollTop;
    runtime.elements.editorMirror.scrollLeft = runtime.elements.editorInput.scrollLeft;
    runtime.elements.lineNumbers.scrollTop = runtime.elements.editorInput.scrollTop;
  }

  function refreshPreviewZoom(runtime) {
    if (!runtime.lastPreviewMetrics) return;
    const viewport = runtime.elements.previewViewport;
    const wrapper = runtime.elements.previewZoomWrap;
    const stage = runtime.elements.previewCard;
    const minimumHeight = window.innerWidth <= 768 ? 128 : 140;
    const viewportWidth = Math.max(220, viewport.clientWidth - 32);
    const maxViewportHeight = Math.max(minimumHeight, runtime.state.previewPanelHeight - 12);
    let zoom = 1;
    if (runtime.state.previewZoom === 'fit') {
      zoom = Math.min(1, viewportWidth / runtime.lastPreviewMetrics.stageWidth, maxViewportHeight / runtime.lastPreviewMetrics.stageHeight);
    } else {
      zoom = Number(runtime.state.previewZoom) || 1;
    }
    const scaledWidth = Math.ceil(runtime.lastPreviewMetrics.stageWidth * zoom);
    const scaledHeight = Math.ceil(runtime.lastPreviewMetrics.stageHeight * zoom);
    wrapper.style.transform = 'none';
    wrapper.style.width = `${scaledWidth}px`;
    wrapper.style.height = `${scaledHeight}px`;
    if (stage) {
      stage.style.transformOrigin = 'top left';
      stage.style.transform = `scale(${zoom})`;
    }
    const naturalHeight = scaledHeight + 24;
    const boundedHeight = Math.min(maxViewportHeight, Math.max(minimumHeight, naturalHeight));
    viewport.style.height = 'auto';
    viewport.style.maxHeight = `${boundedHeight}px`;
    viewport.style.overflowX = scaledWidth > viewportWidth ? 'auto' : 'hidden';
    viewport.style.overflowY = naturalHeight > maxViewportHeight ? 'auto' : 'hidden';
  }

  function renderPreview(runtime) {
    const result = buildPreview(runtime);
    runtime.lastPreviewMetrics = result.metrics;
    runtime.elements.previewZoomWrap.innerHTML = '';
    runtime.elements.previewZoomWrap.appendChild(result.stage);
    runtime.elements.previewCard = result.stage;
    runtime.elements.previewViewport.classList.toggle('is-transparent', runtime.state.backgroundMode === 'transparent');
    runtime.elements.exportSizeBadge.textContent = result.metrics.preset.width && result.metrics.preset.height
      ? `${result.metrics.stageWidth} x ${result.metrics.stageHeight}px`
      : 'Auto-sized export';
    runtime.elements.exportNote.innerHTML = result.metrics.preset.width && result.metrics.preset.height
      ? `This image will export at <strong>${result.metrics.stageWidth} x ${result.metrics.stageHeight}px</strong>.`
      : 'This image will export at auto size based on your code card.';
    refreshPreviewZoom(runtime);
  }

  function updateOfflineBadge(runtime) {
    const online = navigator.onLine !== false;
    runtime.elements.offlineBadge.textContent = online
      ? 'Works Offline - Once loaded, no internet needed'
      : 'Working offline - All features available';
  }

  function updateFontBadge(runtime, text) {
    runtime.elements.fontLoadingBadge.textContent = text;
  }

  function prefersKeyboardAndPointer() {
    const mediaMatches = (query) => typeof window.matchMedia === 'function' && window.matchMedia(query).matches;
    const maxTouchPoints = Number(navigator.maxTouchPoints || 0);
    return mediaMatches('(pointer: fine)') || mediaMatches('(any-pointer: fine)') || mediaMatches('(hover: hover)') || maxTouchPoints === 0;
  }

  function updateShortcutMessaging(runtime) {
    const keyboardFriendly = prefersKeyboardAndPointer();
    if (runtime.elements.shortcutsTrigger) {
      runtime.elements.shortcutsTrigger.textContent = keyboardFriendly ? 'Shortcuts' : 'Shortcut keys';
      runtime.elements.shortcutsTrigger.title = keyboardFriendly
        ? 'Open keyboard shortcuts'
        : 'Keyboard shortcuts work best with a connected keyboard and pointer';
    }
    if (runtime.elements.shortcutsLead) {
      runtime.elements.shortcutsLead.textContent = keyboardFriendly
        ? 'Fast ways to move around the tool.'
        : 'Shortcut keys work best with a connected keyboard and pointer. Every action is still available through the on-screen controls.';
    }
    if (runtime.elements.shortcutsNote) {
      runtime.elements.shortcutsNote.hidden = keyboardFriendly;
      runtime.elements.shortcutsNote.textContent = keyboardFriendly
        ? ''
        : 'Shortcut keys work best with a connected keyboard and pointer.';
    }
  }

  function syncControlState(runtime) {
    const state = runtime.state;
    runtime.elements.sizePreset.value = state.sizePreset;
    runtime.elements.fontFamily.value = state.fontFamily;
    runtime.elements.solidColor.value = state.solidColor;
    runtime.elements.solidColorText.value = state.solidColor;
    runtime.elements.paddingSelect.value = state.paddingChoice;
    runtime.elements.paddingCustom.value = state.customPadding;
    runtime.elements.cardWidth.value = state.cardWidthChoice;
    runtime.elements.cardWidthCustom.value = state.customCardWidth;
    runtime.elements.chromeColor.value = state.chromeColor || (THEMES[state.theme] || THEMES['one-dark']).card.titlebarBg;
    runtime.elements.ligatures.setAttribute('aria-pressed', String(!!state.ligatures));
    runtime.elements.diffMode.setAttribute('aria-pressed', String(!!state.diffMode));
    runtime.elements.dimLines.setAttribute('aria-pressed', String(!!state.dimUnfocused));
    runtime.elements.blurSensitive.setAttribute('aria-pressed', String(!!state.blurSensitive));
    runtime.elements.autoPair.setAttribute('aria-pressed', String(!!state.autoPair));
    runtime.elements.watermark.setAttribute('aria-pressed', String(!!state.watermark));
    runtime.elements.watermarkText.value = state.watermarkText;
    runtime.elements.watermarkNote.hidden = Boolean(state.watermark || state.watermarkText.trim());
    runtime.elements.ligatureField.style.display = getFontMeta(state.fontFamily).ligatures ? 'grid' : 'none';
    const hasHighlights = parseHighlightSpec(getActiveTab(state).highlightSpec, state.diffMode).size > 0;
    if (!hasHighlights) {
      state.dimUnfocused = false;
    }
    runtime.elements.dimLines.setAttribute('aria-pressed', String(!!state.dimUnfocused));
    runtime.elements.dimLines.disabled = !hasHighlights;
    runtime.elements.dimLines.setAttribute('aria-disabled', String(!hasHighlights));
    runtime.elements.dimLinesField?.classList.toggle('is-disabled', !hasHighlights);
    if (runtime.elements.dimLinesHelp) {
      runtime.elements.dimLinesHelp.textContent = hasHighlights
        ? 'Only the highlighted lines stay at full emphasis.'
        : 'Add highlighted lines first to enable this focus mode.';
    }

    runtime.container.querySelectorAll('[data-theme-filter]').forEach((button) => {
      button.setAttribute('aria-pressed', String(button.dataset.themeFilter === state.themeFilter));
    });
    runtime.container.querySelectorAll('[data-chrome]').forEach((button) => {
      button.setAttribute('aria-pressed', String(button.dataset.chrome === state.chrome));
    });
    runtime.container.querySelectorAll('[data-bg-mode]').forEach((button) => {
      button.setAttribute('aria-pressed', String(button.dataset.bgMode === state.backgroundMode));
    });
    runtime.container.querySelectorAll('[data-font-size]').forEach((button) => {
      button.setAttribute('aria-pressed', String(Number(button.dataset.fontSize) === Number(state.fontSize)));
    });
    runtime.container.querySelectorAll('[data-line-height]').forEach((button) => {
      button.setAttribute('aria-pressed', String(Number(button.dataset.lineHeight) === Number(state.lineHeight)));
    });
    runtime.container.querySelectorAll('[data-letter-spacing]').forEach((button) => {
      button.setAttribute('aria-pressed', String(Number(button.dataset.letterSpacing) === Number(state.letterSpacing)));
    });
    runtime.container.querySelectorAll('[data-tab-size]').forEach((button) => {
      button.setAttribute('aria-pressed', String(Number(button.dataset.tabSize) === Number(state.tabSize)));
    });
    runtime.container.querySelectorAll('[data-radius]').forEach((button) => {
      button.setAttribute('aria-pressed', String(Number(button.dataset.radius) === Number(state.borderRadius)));
    });
    runtime.container.querySelectorAll('[data-shadow]').forEach((button) => {
      button.setAttribute('aria-pressed', String(button.dataset.shadow === state.shadow));
    });
    runtime.container.querySelectorAll('[data-zoom]').forEach((button) => {
      button.setAttribute('aria-pressed', String(
        state.previewZoom === 'fit'
          ? button.dataset.zoom === 'fit'
          : Number(button.dataset.zoom) === Number(state.previewZoom)
      ));
    });
  }

  function persistHistorySnippet(runtime) {
    const activeTab = getActiveTab(runtime.state);
    const code = normalizeCode(activeTab.code || '');
    if (!code.trim()) return;
    const model = runtime.semanticModels.get(activeTab.id) || createPlainModel(getEffectiveCode(activeTab));
    const now = new Date();
    const history = normalizeHistory(readJson(STORAGE.history, []));
    const entry = {
      id: uid('history'),
      code,
      manualLanguage: activeTab.manualLanguage,
      languageLabel: model.detectedLabel,
      timeLabel: now.toLocaleString(),
      timestamp: now.toISOString(),
    };
    const deduped = history.filter((item) => item.code !== entry.code).slice(0, 4);
    writeJson(STORAGE.history, [entry, ...deduped]);
    renderHistory(runtime);
  }

  const queueHistoryPersist = debounce((runtime) => persistHistorySnippet(runtime), 1200);

  async function refreshSemanticModel(runtime, reason) {
    const activeTab = getActiveTab(runtime.state);
    const runId = ++runtime.semanticRunId;
    try {
      const model = await buildSemanticModel(activeTab);
      if (runId !== runtime.semanticRunId) return;
      runtime.semanticModels.set(activeTab.id, model);
      updateToolbarState(runtime);
      renderEditorMirror(runtime);
      renderPreview(runtime);
      saveState(runtime);
      if (reason === 'input') queueHistoryPersist(runtime);
    } catch (_) {
      if (runId !== runtime.semanticRunId) return;
      runtime.semanticModels.set(activeTab.id, createPlainModel(getEffectiveCode(activeTab)));
      updateToolbarState(runtime);
      renderEditorMirror(runtime);
      renderPreview(runtime);
    }
  }

  function queueSemanticRefresh(runtime, reason, delay) {
    if (runtime.semanticTimer) clearTimeout(runtime.semanticTimer);
    runtime.semanticTimer = setTimeout(() => {
      refreshSemanticModel(runtime, reason);
    }, delay);
  }

  function applySizePreset(runtime, presetId) {
    const preset = SIZE_PRESETS.find((item) => item.id === presetId) || SIZE_PRESETS[0];
    runtime.state.sizePreset = preset.id;
    if (preset.id !== 'custom') {
      runtime.state.paddingChoice = 'custom';
      runtime.state.customPadding = preset.padding;
      runtime.state.cardWidthChoice = preset.cardWidth === 'auto' ? 'auto' : 'custom';
      if (preset.cardWidth !== 'auto') runtime.state.customCardWidth = preset.cardWidth;
      runtime.state.backgroundMode = preset.backgroundMode || runtime.state.backgroundMode;
    }
    syncControlState(runtime);
    saveState(runtime);
    renderPreview(runtime);
  }

  function applyPresetSettings(runtime, settings) {
    Object.assign(runtime.state, settings);
    syncControlState(runtime);
    renderThemeGrid(runtime);
    renderGradientRow(runtime);
    renderShadowGrid(runtime);
    updateToolbarState(runtime);
    renderEditorMirror(runtime);
    renderPreview(runtime);
    saveState(runtime);
  }

  function downloadBlob(blob, fileName) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function showToast(runtime, html) {
    runtime.elements.toast.innerHTML = html;
    runtime.elements.toast.classList.add('is-visible');
    clearTimeout(runtime.toastTimer);
    runtime.toastTimer = setTimeout(() => {
      runtime.elements.toast.classList.remove('is-visible');
    }, 5000);
  }

  function postDownloadToast() {
    const tweetText = encodeURIComponent('Made this code image with Tooliest. Private, offline-ready, and browser-only.');
    return [
      '<strong>Image downloaded.</strong>',
      '<div class="code-shot-toast-links">',
      '<a href="/image-compressor">Compress this PNG - Image Compressor</a>',
      `<a href="https://twitter.com/intent/tweet?text=${tweetText}" target="_blank" rel="noopener">Share it on Twitter/X</a>`,
      '<a href="/qr-code-generator">Generate a QR code of your repo</a>',
      '</div>',
    ].join('');
  }

  function serializePreviewStage(stage) {
    const clone = stage.cloneNode(true);
    clone.style.transform = 'none';
    clone.style.transformOrigin = 'top left';
    clone.removeAttribute('id');
    clone.setAttribute('xmlns', 'http://www.w3.org/1999/xhtml');
    return new XMLSerializer().serializeToString(clone);
  }

  async function loadSvgImage(svgMarkup) {
    const blob = new Blob([svgMarkup], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    try {
      const image = await new Promise((resolve, reject) => {
        const img = new Image();
        img.decoding = 'sync';
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error('Unable to render the preview as an image.'));
        img.src = url;
      });
      return image;
    } finally {
      URL.revokeObjectURL(url);
    }
  }

  async function rasterizeStageWithSvg(stage, width, height, scale) {
    const markup = serializePreviewStage(stage);
    const svgMarkup = [
      `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">`,
      `<foreignObject x="0" y="0" width="${width}" height="${height}">${markup}</foreignObject>`,
      '</svg>',
    ].join('');

    const image = await loadSvgImage(svgMarkup);
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(width * scale));
    canvas.height = Math.max(1, Math.round(height * scale));
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Unable to prepare the PNG canvas.');
    context.scale(scale, scale);
    context.drawImage(image, 0, 0, width, height);
    return canvas;
  }

  async function rasterizeStageWithHtml2Canvas(stage, scale) {
    await ensureHtml2Canvas();
    const captureHost = document.createElement('div');
    captureHost.style.cssText = [
      'position:fixed',
      'left:0',
      'top:0',
      'width:0',
      'height:0',
      'opacity:0',
      'pointer-events:none',
      'overflow:visible',
      'z-index:-1',
    ].join(';');
    captureHost.appendChild(stage);
    document.body.appendChild(captureHost);

    try {
      await new Promise((resolve) => {
        requestAnimationFrame(() => requestAnimationFrame(resolve));
      });

      return await window.html2canvas(stage, {
        scale,
        useCORS: true,
        allowTaint: false,
        backgroundColor: null,
        logging: false,
        foreignObjectRendering: true,
      });
    } finally {
      if (captureHost.parentNode) {
        captureHost.parentNode.removeChild(captureHost);
      }
    }
  }

  async function exportPng(runtime, mode) {
    const button = mode === 'copy' ? runtime.elements.copyBtn : runtime.elements.pngBtn;
    const originalLabel = button.textContent;
    button.textContent = mode === 'copy' ? 'Copying...' : 'Generating...';
    button.disabled = true;
    try {
      await ensureFont(runtime.state.fontFamily);
      if (document.fonts && document.fonts.ready) await document.fonts.ready;

      const preview = buildPreview(runtime, { interactive: false });
      const source = preview.stage;
      const exportScale = Math.max(2, Math.min(4, window.devicePixelRatio || 1));
      let canvas;

      try {
        canvas = await rasterizeStageWithSvg(source, preview.metrics.stageWidth, preview.metrics.stageHeight, exportScale);
      } catch (_) {
        canvas = await rasterizeStageWithHtml2Canvas(source, exportScale);
      }

      const activeTab = getActiveTab(runtime.state);
      const model = runtime.semanticModels.get(activeTab.id) || createPlainModel(getEffectiveCode(activeTab));
      const language = getLanguage(model.detectedLanguage);

      await new Promise((resolve, reject) => {
        canvas.toBlob(async (blob) => {
          if (!blob) {
            reject(new Error('Unable to generate PNG.'));
            return;
          }
          if (mode === 'copy') {
            try {
              await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
              runtime.elements.liveRegion.textContent = 'Image copied to clipboard';
              showToast(runtime, '<strong>Image copied to clipboard.</strong>');
              resolve();
              return;
            } catch (_) {
              downloadBlob(blob, `code-${language.id}-${Date.now()}.png`);
              showToast(runtime, '<strong>Clipboard copy was not available.</strong><div class="code-shot-toast-links">Downloaded the PNG instead.</div>');
              resolve();
              return;
            }
          }
          downloadBlob(blob, `code-${language.id}-${Date.now()}.png`);
          runtime.elements.liveRegion.textContent = 'PNG downloaded';
          showToast(runtime, postDownloadToast());
          resolve();
        }, 'image/png');
      });
    } catch (error) {
      showToast(runtime, `<strong>Export failed.</strong><div class="code-shot-toast-links">${escapeHtml(error.message || 'Please try again.')}</div>`);
    } finally {
      button.textContent = originalLabel;
      button.disabled = false;
    }
  }

  function extractGradientStops(gradient) {
    const matches = gradient.match(/#[0-9a-fA-F]{6}/g) || ['#667eea', '#764ba2'];
    return matches.map((color, index) => ({
      color,
      offset: matches.length === 1 ? '0%' : `${Math.round((index / (matches.length - 1)) * 100)}%`,
    }));
  }

  function xmlEscape(value) {
    return String(value || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function renderSvgChrome(runtime, metrics) {
    const state = runtime.state;
    const theme = metrics.theme;
    const title = xmlEscape(getActiveTab(state).name || defaultFileName(metrics.language.id, 1));
    const color = state.chromeColor || theme.card.titlebarBg;
    const titleColor = theme.card.titlebarText;
    const lines = [];
    const radius = state.chrome === 'windows' ? 0 : state.borderRadius;

    if (state.chrome === 'none') return { markup: '', height: 0 };

    if (state.chrome === 'browser') {
      const headerHeight = state.tabs.length > 1 ? 84 : 66;
      lines.push(`<rect x="0" y="0" width="${metrics.cardWidth}" height="${headerHeight}" rx="${radius}" fill="${color}" />`);
      let tabX = 14;
      state.tabs.forEach((tab) => {
        const isActive = tab.id === state.activeTabId;
        const width = Math.min(180, Math.max(72, 26 + (tab.name.length * 7)));
        lines.push(`<rect x="${tabX}" y="10" width="${width}" height="28" rx="10" fill="${isActive ? theme.background : rgba(theme.background, theme.mode === 'dark' ? 0.34 : 0.14)}" stroke="${theme.card.borderColor}" />`);
        lines.push(`<rect x="${tabX + 8}" y="17" width="16" height="16" rx="4" fill="${theme.accent}" />`);
        lines.push(`<text x="${tabX + 30}" y="18" dominant-baseline="hanging" font-size="12" fill="${isActive ? theme.text : titleColor}">${xmlEscape(tab.name)}</text>`);
        tabX += width + 8;
      });
      lines.push(`<rect x="14" y="${state.tabs.length > 1 ? 48 : 40}" width="${metrics.cardWidth - 28}" height="18" rx="9" fill="${rgba(theme.background, theme.mode === 'dark' ? 0.55 : 0.08)}" />`);
      lines.push(`<text x="28" y="${state.tabs.length > 1 ? 51 : 43}" dominant-baseline="hanging" font-size="12" fill="${titleColor}">file:///${title}</text>`);
      return { markup: lines.join(''), height: headerHeight };
    }

    const topHeight = state.chrome === 'windows' ? 32 : 40;
    const tabsHeight = state.tabs.length > 1 ? 32 : 0;
    lines.push(`<rect x="0" y="0" width="${metrics.cardWidth}" height="${topHeight + tabsHeight}" rx="${radius}" fill="${state.chrome === 'glass' ? rgba(color, 0.78) : color}" />`);
    if (state.chrome === 'macos' || state.chrome === 'glass') {
      buildMacDots(state.chrome === 'glass' ? 14 : 12).forEach(([dotColor, size], index) => {
        lines.push(`<circle cx="${22 + (index * (size + 6))}" cy="${topHeight / 2}" r="${size / 2}" fill="${dotColor}" />`);
      });
      lines.push(`<text x="${metrics.cardWidth / 2}" y="${Math.round(topHeight / 2) + 1}" dominant-baseline="middle" font-size="13" text-anchor="middle" fill="${titleColor}">${title}</text>`);
    } else {
      lines.push(`<text x="14" y="10" dominant-baseline="hanging" font-size="13" fill="${titleColor}">${title}</text>`);
      const baseX = metrics.cardWidth - 138;
      lines.push(`<rect x="${baseX + 92}" y="0" width="46" height="${topHeight}" fill="#c42b1c" />`);
      lines.push(`<text x="${baseX + 20}" y="9" dominant-baseline="hanging" font-size="12" fill="${titleColor}">-</text>`);
      lines.push(`<text x="${baseX + 64}" y="9" dominant-baseline="hanging" font-size="12" fill="${titleColor}">[]</text>`);
      lines.push(`<text x="${baseX + 111}" y="9" dominant-baseline="hanging" font-size="12" fill="#ffffff">x</text>`);
    }
    if (state.tabs.length > 1) {
      let tabX = 12;
      const tabY = topHeight + 4;
      state.tabs.forEach((tab) => {
        const isActive = tab.id === state.activeTabId;
        const width = Math.min(170, Math.max(76, 22 + (tab.name.length * 7)));
        lines.push(`<rect x="${tabX}" y="${tabY}" width="${width}" height="22" rx="10" fill="${isActive ? rgba(theme.background, theme.mode === 'dark' ? 0.88 : 0.96) : rgba(theme.background, theme.mode === 'dark' ? 0.38 : 0.12)}" stroke="${theme.card.borderColor}" />`);
        lines.push(`<text x="${tabX + 10}" y="${tabY + 4}" dominant-baseline="hanging" font-size="12" fill="${isActive ? theme.text : titleColor}">${xmlEscape(tab.name)}</text>`);
        tabX += width + 8;
      });
    }
    return { markup: lines.join(''), height: topHeight + tabsHeight };
  }

  async function exportSvg(runtime) {
    const button = runtime.elements.svgBtn;
    const originalLabel = button.textContent;
    button.textContent = 'Generating...';
    button.disabled = true;
    try {
      await ensureFont(runtime.state.fontFamily);
      if (document.fonts && document.fonts.ready) await document.fonts.ready;
      const activeTab = getActiveTab(runtime.state);
      const model = runtime.semanticModels.get(activeTab.id) || createPlainModel(getEffectiveCode(activeTab));
      const metrics = buildPreviewMetrics(runtime, model);
      const highlightMap = parseHighlightSpec(activeTab.highlightSpec, runtime.state.diffMode);
      const font = getFontMeta(runtime.state.fontFamily);
      const gradientId = `gradient-${Date.now().toString(36)}`;
      const defs = [];
      if (runtime.state.backgroundMode === 'gradient') {
        const stops = extractGradientStops(GRADIENTS[runtime.state.gradient] || GRADIENTS.cosmic);
        defs.push(`<linearGradient id="${gradientId}" x1="0%" y1="0%" x2="100%" y2="100%">${stops.map((stop) => `<stop offset="${stop.offset}" stop-color="${stop.color}" />`).join('')}</linearGradient>`);
      }
      if (font.googleFamily) {
        defs.push(`<style>@import url('https://fonts.googleapis.com/css2?family=${font.googleFamily}:wght@400;700&amp;display=swap');</style>`);
      }
      const chrome = renderSvgChrome(runtime, metrics);
      const codeGroup = [];
      const bodyTop = chrome.height + metrics.codePaddingY;
      model.lines.forEach((line, index) => {
        const lineNumber = index + 1;
        const y = bodyTop + (index * metrics.lineHeightPx);
        const highlightKind = highlightMap.get(lineNumber);
        if (highlightKind) {
          const highlightStyle = lineHighlightColors(metrics.theme, highlightKind);
          codeGroup.push(`<rect x="0" y="${chrome.height + (index * metrics.lineHeightPx) + 3}" width="${metrics.cardWidth}" height="${metrics.lineHeightPx}" fill="${highlightStyle.background}" />`);
          codeGroup.push(`<rect x="0" y="${chrome.height + (index * metrics.lineHeightPx) + 3}" width="3" height="${metrics.lineHeightPx}" fill="${highlightStyle.accent}" />`);
        }
        codeGroup.push(`<text x="${metrics.codePaddingX + metrics.gutterWidth - 14}" y="${y}" text-anchor="end" dominant-baseline="hanging" font-size="${metrics.fontSize}" fill="${metrics.theme.gutter}" font-family="${xmlEscape(font.stack)}">${lineNumber}</text>`);
        let currentX = metrics.codePaddingX + metrics.gutterWidth;
        line.tokens.forEach((token, tokenIndex) => {
          const tokenStyle = resolveTokenTheme(metrics.theme, token);
          const isBlurred = isTokenBlurred(runtime, token, lineNumber, tokenIndex);
          const width = measureTextWidth(token.text, metrics.fontSize, Number(runtime.state.letterSpacing) || 0, runtime.state.tabSize);
          if (isBlurred) {
            codeGroup.push(`<rect x="${currentX}" y="${y + 2}" width="${Math.max(36, measureTextWidth('████████', metrics.fontSize, Number(runtime.state.letterSpacing) || 0, runtime.state.tabSize))}" height="${metrics.fontSize}" rx="2" fill="${tokenStyle.color}" />`);
            currentX += Math.max(36, measureTextWidth('████████', metrics.fontSize, Number(runtime.state.letterSpacing) || 0, runtime.state.tabSize));
            return;
          }
          codeGroup.push(`<text x="${currentX}" y="${y}" dominant-baseline="hanging" font-size="${metrics.fontSize}" font-family="${xmlEscape(font.stack)}" font-weight="${tokenStyle.fontWeight}" font-style="${tokenStyle.fontStyle}" fill="${tokenStyle.color}" xml:space="preserve">${xmlEscape(token.text)}</text>`);
          currentX += width;
        });
      });

      const backgroundFill = runtime.state.backgroundMode === 'gradient'
        ? `url(#${gradientId})`
        : (runtime.state.backgroundMode === 'solid' ? runtime.state.solidColor : 'transparent');

      const watermarkText = runtime.state.watermarkText.trim() || (runtime.state.watermark ? 'tooliest.com' : '');
      const watermark = watermarkText
        ? `<text x="${metrics.stageWidth - 12}" y="${metrics.stageHeight - 20}" text-anchor="end" dominant-baseline="hanging" font-family="${xmlEscape(font.stack)}" font-size="11" fill="${rgba(metrics.theme.text, 0.45)}">${xmlEscape(watermarkText)}</text>`
        : '';

      const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${metrics.stageWidth}" height="${metrics.stageHeight}" viewBox="0 0 ${metrics.stageWidth} ${metrics.stageHeight}">
  <defs>${defs.join('')}</defs>
  ${runtime.state.backgroundMode === 'transparent' ? '' : `<rect x="0" y="0" width="${metrics.stageWidth}" height="${metrics.stageHeight}" fill="${backgroundFill}" />`}
  <g transform="translate(${metrics.padding}, ${metrics.padding}) scale(${metrics.contentScale})">
    <rect x="0" y="0" width="${metrics.cardWidth}" height="${metrics.cardHeight}" rx="${runtime.state.borderRadius}" fill="${metrics.theme.background}" stroke="${metrics.theme.card.borderColor}" />
    ${chrome.markup}
    <g>${codeGroup.join('')}</g>
  </g>
  ${watermark}
</svg>`;

      downloadBlob(new Blob([svg], { type: 'image/svg+xml;charset=utf-8' }), `code-${metrics.language.id}-${Date.now()}.svg`);
      runtime.elements.liveRegion.textContent = 'SVG downloaded';
      showToast(runtime, postDownloadToast());
    } catch (error) {
      showToast(runtime, `<strong>SVG export failed.</strong><div class="code-shot-toast-links">${escapeHtml(error.message || 'Please try again.')}</div>`);
    } finally {
      button.textContent = originalLabel;
      button.disabled = false;
    }
  }

  function cycleTheme(runtime, direction) {
    const visible = runtime.visibleThemes && runtime.visibleThemes.length ? runtime.visibleThemes : THEME_ORDER;
    const currentIndex = visible.indexOf(runtime.state.theme);
    const nextIndex = (currentIndex + direction + visible.length) % visible.length;
    runtime.state.theme = visible[nextIndex];
    syncControlState(runtime);
    renderThemeGrid(runtime);
    renderEditorMirror(runtime);
    renderPreview(runtime);
    saveState(runtime);
  }

  function switchTab(runtime, tabId) {
    if (!runtime.state.tabs.some((tab) => tab.id === tabId)) return;
    runtime.state.activeTabId = tabId;
    renderTabButtons(runtime);
    updateToolbarState(runtime);
    updateLineNumbers(runtime);
    renderEditorMirror(runtime);
    renderPreview(runtime);
    saveState(runtime);
    if (!runtime.semanticModels.has(getActiveTab(runtime.state).id)) {
      queueSemanticRefresh(runtime, 'tab-switch', 0);
    }
  }

  function addTab(runtime) {
    if (runtime.state.tabs.length >= 5) {
      showToast(runtime, '<strong>You can keep up to five tabs in one screenshot.</strong>');
      return;
    }
    const activeTab = getActiveTab(runtime.state);
    const inferredLanguage = activeTab.manualLanguage !== 'auto' ? activeTab.manualLanguage : 'javascript';
    const nextTab = createTab({
      manualLanguage: inferredLanguage,
      name: defaultFileName(inferredLanguage === 'auto' ? 'javascript' : inferredLanguage, runtime.state.tabs.length + 1),
      code: '',
    }, runtime.state.tabs.length + 1);
    runtime.state.tabs.push(nextTab);
    runtime.state.activeTabId = nextTab.id;
    renderTabButtons(runtime);
    updateToolbarState(runtime);
    updateLineNumbers(runtime);
    renderEditorMirror(runtime);
    renderPreview(runtime);
    saveState(runtime);
    runtime.elements.editorInput.focus();
    queueSemanticRefresh(runtime, 'add-tab', 0);
  }

  function closeTab(runtime, tabId) {
    if (runtime.state.tabs.length === 1) {
      showToast(runtime, '<strong>At least one tab is required.</strong>');
      return;
    }
    const index = runtime.state.tabs.findIndex((tab) => tab.id === tabId);
    if (index === -1) return;
    runtime.state.tabs.splice(index, 1);
    if (!runtime.state.tabs.some((tab) => tab.id === runtime.state.activeTabId)) {
      runtime.state.activeTabId = runtime.state.tabs[Math.max(0, index - 1)].id;
    }
    renderTabButtons(runtime);
    updateToolbarState(runtime);
    updateLineNumbers(runtime);
    renderEditorMirror(runtime);
    renderPreview(runtime);
    saveState(runtime);
  }

  function renameActiveTab(runtime) {
    const activeTab = getActiveTab(runtime.state);
    const nextName = window.prompt('Rename tab', activeTab.name || defaultFileName('javascript', 1));
    if (!nextName) return;
    activeTab.name = nextName.slice(0, 40);
    renderTabButtons(runtime);
    updateToolbarState(runtime);
    renderPreview(runtime);
    saveState(runtime);
  }

  function insertAtSelection(textarea, before, after) {
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const value = textarea.value;
    const selected = value.slice(start, end);
    textarea.value = `${value.slice(0, start)}${before}${selected}${after}${value.slice(end)}`;
    textarea.selectionStart = textarea.selectionEnd = start + before.length;
  }

  function indentSelection(textarea, spaces) {
    const indent = ' '.repeat(spaces);
    const value = textarea.value;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const lineStart = value.lastIndexOf('\n', start - 1) + 1;
    const selection = value.slice(lineStart, end);
    const replaced = selection.split('\n').map((line) => `${indent}${line}`).join('\n');
    textarea.value = `${value.slice(0, lineStart)}${replaced}${value.slice(end)}`;
    textarea.selectionStart = start + indent.length;
    textarea.selectionEnd = end + (indent.length * selection.split('\n').length);
  }

  function unindentSelection(textarea, spaces) {
    const value = textarea.value;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const lineStart = value.lastIndexOf('\n', start - 1) + 1;
    const selection = value.slice(lineStart, end);
    let removed = 0;
    const replaced = selection.split('\n').map((line) => {
      if (line.startsWith(' '.repeat(spaces))) {
        removed += spaces;
        return line.slice(spaces);
      }
      if (line.startsWith('\t')) {
        removed += 1;
        return line.slice(1);
      }
      return line;
    }).join('\n');
    textarea.value = `${value.slice(0, lineStart)}${replaced}${value.slice(end)}`;
    textarea.selectionStart = Math.max(lineStart, start - spaces);
    textarea.selectionEnd = Math.max(lineStart, end - removed);
  }

  function smartHome(textarea) {
    const start = textarea.selectionStart;
    const value = textarea.value;
    const lineStart = value.lastIndexOf('\n', start - 1) + 1;
    const lineEnd = value.indexOf('\n', start);
    const line = value.slice(lineStart, lineEnd === -1 ? value.length : lineEnd);
    const indentMatch = line.match(/^\s*/);
    const indentLength = indentMatch ? indentMatch[0].length : 0;
    const firstContent = lineStart + indentLength;
    const current = textarea.selectionStart;
    const target = current === firstContent ? lineStart : firstContent;
    textarea.selectionStart = target;
    textarea.selectionEnd = target;
  }

  function handleEditorInput(runtime) {
    const activeTab = getActiveTab(runtime.state);
    activeTab.code = normalizeCode(runtime.elements.editorInput.value);
    runtime.semanticModels.delete(activeTab.id);
    updateLineNumbers(runtime);
    updateToolbarState(runtime);
    renderEditorMirror(runtime);
    renderPreview(runtime);
    saveState(runtime);
    queueSemanticRefresh(runtime, 'input', 100);
  }

  function loadHistoryEntry(runtime, entryId) {
    const entry = runtime.history.find((item) => item.id === entryId);
    if (!entry) return;
    const activeTab = getActiveTab(runtime.state);
    activeTab.code = normalizeCode(entry.code || '');
    activeTab.manualLanguage = entry.manualLanguage || 'auto';
    runtime.semanticModels.delete(activeTab.id);
    updateToolbarState(runtime);
    updateLineNumbers(runtime);
    renderEditorMirror(runtime);
    renderPreview(runtime);
    saveState(runtime);
    queueSemanticRefresh(runtime, 'history', 0);
  }

  function deleteUserPreset(runtime, presetId) {
    const next = runtime.userPresets.filter((preset) => preset.id !== presetId);
    writeJson(STORAGE.presets, next);
    renderPresetList(runtime);
  }

  function saveUserPreset(runtime) {
    const name = runtime.elements.savePresetName.value.trim().slice(0, 40);
    if (!name) return;
    const current = normalizePresets(readJson(STORAGE.presets, []));
    const snapshot = {
      id: uid('cs-preset'),
      name,
      settings: {
        theme: runtime.state.theme,
        chrome: runtime.state.chrome,
        chromeColor: runtime.state.chromeColor,
        backgroundMode: runtime.state.backgroundMode,
        gradient: runtime.state.gradient,
        solidColor: runtime.state.solidColor,
        paddingChoice: runtime.state.paddingChoice,
        customPadding: runtime.state.customPadding,
        fontFamily: runtime.state.fontFamily,
        fontSize: runtime.state.fontSize,
        lineHeight: runtime.state.lineHeight,
        letterSpacing: runtime.state.letterSpacing,
        tabSize: runtime.state.tabSize,
        ligatures: runtime.state.ligatures,
        borderRadius: runtime.state.borderRadius,
        shadow: runtime.state.shadow,
        cardWidthChoice: runtime.state.cardWidthChoice,
        customCardWidth: runtime.state.customCardWidth,
        sizePreset: runtime.state.sizePreset,
        watermark: runtime.state.watermark,
        watermarkText: runtime.state.watermarkText,
      },
      backgroundMode: runtime.state.backgroundMode,
      gradient: runtime.state.gradient,
      solidColor: runtime.state.solidColor,
    };
    writeJson(STORAGE.presets, [snapshot, ...current].slice(0, 10));
    runtime.elements.savePresetName.value = '';
    runtime.elements.savePresetPopover.classList.remove('is-open');
    renderPresetList(runtime);
  }

  function attachEvents(runtime) {
    const { container, elements } = runtime;

    elements.editorInput.addEventListener('input', () => handleEditorInput(runtime));
    elements.editorInput.addEventListener('scroll', () => syncEditorScroll(runtime));
    elements.editorInput.addEventListener('paste', () => setTimeout(() => handleEditorInput(runtime), 0));
    elements.editorInput.addEventListener('keydown', (event) => {
      if (event.key === 'Tab') {
        event.preventDefault();
        if (event.shiftKey) unindentSelection(elements.editorInput, runtime.state.tabSize);
        else indentSelection(elements.editorInput, runtime.state.tabSize);
        handleEditorInput(runtime);
        return;
      }
      if (event.key === 'Home' && !event.shiftKey && !event.metaKey && !event.ctrlKey) {
        event.preventDefault();
        smartHome(elements.editorInput);
        return;
      }
      if (runtime.state.autoPair && !event.ctrlKey && !event.metaKey && !event.altKey) {
        const pairMap = { '(': ')', '[': ']', '{': '}', '"': '"', "'": "'", '`': '`' };
        if (pairMap[event.key]) {
          event.preventDefault();
          insertAtSelection(elements.editorInput, event.key, pairMap[event.key]);
          handleEditorInput(runtime);
        }
      }
    });

    container.addEventListener('click', (event) => {
      const target = event.target.closest('[data-action],[data-theme],[data-gradient],[data-shadow],[data-tab-id],[data-close-tab],[data-apply-preset],[data-apply-user-preset],[data-delete-user-preset],[data-load-history],[data-clear-history],[data-theme-filter],[data-chrome],[data-bg-mode],[data-font-size],[data-line-height],[data-letter-spacing],[data-tab-size],[data-radius],[data-zoom]');
      if (!target) return;

      if (target.dataset.action === 'jump-preview') {
        elements.previewColumn.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } else if (target.dataset.action === 'add-tab') {
        addTab(runtime);
      } else if (target.dataset.action === 'show-shortcuts') {
        elements.shortcutsOverlay.classList.add('is-open');
        elements.shortcutsOverlay.setAttribute('aria-hidden', 'false');
      } else if (target.dataset.theme) {
        runtime.state.theme = target.dataset.theme;
        syncControlState(runtime);
        renderThemeGrid(runtime);
        renderEditorMirror(runtime);
        renderPreview(runtime);
        saveState(runtime);
      } else if (target.dataset.gradient) {
        runtime.state.gradient = target.dataset.gradient;
        renderGradientRow(runtime);
        renderPreview(runtime);
        saveState(runtime);
      } else if (target.dataset.shadow) {
        runtime.state.shadow = target.dataset.shadow;
        renderShadowGrid(runtime);
        renderPreview(runtime);
        saveState(runtime);
      } else if (target.dataset.tabId) {
        switchTab(runtime, target.dataset.tabId);
      } else if (target.dataset.closeTab) {
        event.stopPropagation();
        closeTab(runtime, target.dataset.closeTab);
      } else if (target.dataset.applyPreset) {
        const preset = BUILTIN_PRESETS.find((item) => item.id === target.dataset.applyPreset);
        if (preset) applyPresetSettings(runtime, preset.settings);
      } else if (target.dataset.applyUserPreset) {
        const preset = runtime.userPresets.find((item) => item.id === target.dataset.applyUserPreset);
        if (preset) applyPresetSettings(runtime, preset.settings);
      } else if (target.dataset.deleteUserPreset) {
        deleteUserPreset(runtime, target.dataset.deleteUserPreset);
      } else if (target.dataset.loadHistory) {
        loadHistoryEntry(runtime, target.dataset.loadHistory);
      } else if (target.dataset.clearHistory) {
        writeJson(STORAGE.history, []);
        renderHistory(runtime);
      } else if (target.dataset.themeFilter) {
        runtime.state.themeFilter = target.dataset.themeFilter;
        syncControlState(runtime);
        renderThemeGrid(runtime);
        saveState(runtime);
      } else if (target.dataset.chrome) {
        runtime.state.chrome = target.dataset.chrome;
        syncControlState(runtime);
        renderPreview(runtime);
        saveState(runtime);
      } else if (target.dataset.bgMode) {
        runtime.state.backgroundMode = target.dataset.bgMode;
        syncControlState(runtime);
        renderPreview(runtime);
        saveState(runtime);
      } else if (target.dataset.fontSize) {
        runtime.state.fontSize = Number(target.dataset.fontSize);
        syncControlState(runtime);
        renderEditorMirror(runtime);
        renderPreview(runtime);
        saveState(runtime);
      } else if (target.dataset.lineHeight) {
        runtime.state.lineHeight = Number(target.dataset.lineHeight);
        syncControlState(runtime);
        renderEditorMirror(runtime);
        renderPreview(runtime);
        saveState(runtime);
      } else if (target.dataset.letterSpacing) {
        runtime.state.letterSpacing = Number(target.dataset.letterSpacing);
        syncControlState(runtime);
        renderEditorMirror(runtime);
        renderPreview(runtime);
        saveState(runtime);
      } else if (target.dataset.tabSize) {
        runtime.state.tabSize = Number(target.dataset.tabSize);
        syncControlState(runtime);
        renderEditorMirror(runtime);
        renderPreview(runtime);
        saveState(runtime);
      } else if (target.dataset.radius) {
        runtime.state.borderRadius = Number(target.dataset.radius);
        syncControlState(runtime);
        renderPreview(runtime);
        saveState(runtime);
      } else if (target.dataset.zoom) {
        runtime.state.previewZoom = target.dataset.zoom === 'fit' ? 'fit' : String(target.dataset.zoom);
        refreshPreviewZoom(runtime);
        saveState(runtime);
      }
    });

    elements.editorTabs.addEventListener('dblclick', (event) => {
      if (event.target.closest('.code-shot-tab')) renameActiveTab(runtime);
    });

    let draggedTabId = '';
    elements.editorTabs.addEventListener('dragstart', (event) => {
      const button = event.target.closest('.code-shot-tab');
      if (!button) return;
      draggedTabId = button.dataset.tabId;
      event.dataTransfer.effectAllowed = 'move';
    });
    elements.editorTabs.addEventListener('dragover', (event) => {
      if (!draggedTabId) return;
      event.preventDefault();
    });
    elements.editorTabs.addEventListener('drop', (event) => {
      const targetTab = event.target.closest('.code-shot-tab');
      if (!targetTab || !draggedTabId || targetTab.dataset.tabId === draggedTabId) return;
      event.preventDefault();
      const fromIndex = runtime.state.tabs.findIndex((tab) => tab.id === draggedTabId);
      const toIndex = runtime.state.tabs.findIndex((tab) => tab.id === targetTab.dataset.tabId);
      if (fromIndex === -1 || toIndex === -1) return;
      const moved = runtime.state.tabs.splice(fromIndex, 1)[0];
      runtime.state.tabs.splice(toIndex, 0, moved);
      renderTabButtons(runtime);
      renderPreview(runtime);
      saveState(runtime);
    });
    elements.editorTabs.addEventListener('dragend', () => {
      draggedTabId = '';
    });

    elements.languageSelect.addEventListener('change', () => {
      const activeTab = getActiveTab(runtime.state);
      activeTab.manualLanguage = elements.languageSelect.value;
      runtime.semanticModels.delete(activeTab.id);
      saveState(runtime);
      queueSemanticRefresh(runtime, 'language', 0);
    });

    elements.fileName.addEventListener('input', () => {
      getActiveTab(runtime.state).name = elements.fileName.value.slice(0, 40);
      renderTabButtons(runtime);
      renderPreview(runtime);
      saveState(runtime);
    });

    elements.chromeColor.addEventListener('input', () => {
      runtime.state.chromeColor = elements.chromeColor.value;
      renderPreview(runtime);
      saveState(runtime);
    });
    elements.resetChromeColor.addEventListener('click', () => {
      runtime.state.chromeColor = '';
      syncControlState(runtime);
      renderPreview(runtime);
      saveState(runtime);
    });

    elements.solidColor.addEventListener('input', () => {
      runtime.state.solidColor = elements.solidColor.value;
      elements.solidColorText.value = runtime.state.solidColor;
      renderPreview(runtime);
      saveState(runtime);
    });
    elements.solidColorText.addEventListener('change', () => {
      const value = /^#[0-9a-fA-F]{6}$/.test(elements.solidColorText.value) ? elements.solidColorText.value : runtime.state.solidColor;
      runtime.state.solidColor = value;
      syncControlState(runtime);
      renderPreview(runtime);
      saveState(runtime);
    });

    elements.paddingSelect.addEventListener('change', () => {
      runtime.state.paddingChoice = elements.paddingSelect.value;
      renderPreview(runtime);
      saveState(runtime);
    });
    elements.paddingCustom.addEventListener('input', () => {
      runtime.state.customPadding = clamp(Number(elements.paddingCustom.value) || 0, 0, 300);
      renderPreview(runtime);
      saveState(runtime);
    });

    elements.fontFamily.addEventListener('change', async () => {
      runtime.state.fontFamily = elements.fontFamily.value;
      runtime.state.fontLoading = true;
      updateFontBadge(runtime, 'Loading font...');
      syncControlState(runtime);
      renderEditorMirror(runtime);
      renderPreview(runtime);
      saveState(runtime);
      await ensureFont(runtime.state.fontFamily);
      runtime.state.fontLoading = false;
      updateFontBadge(runtime, 'Font ready');
      renderEditorMirror(runtime);
      renderPreview(runtime);
      saveState(runtime);
    });
    elements.ligatures.addEventListener('click', () => {
      runtime.state.ligatures = !runtime.state.ligatures;
      syncControlState(runtime);
      renderEditorMirror(runtime);
      renderPreview(runtime);
      saveState(runtime);
    });

    elements.cardWidth.addEventListener('change', () => {
      runtime.state.cardWidthChoice = elements.cardWidth.value;
      renderPreview(runtime);
      saveState(runtime);
    });
    elements.cardWidthCustom.addEventListener('input', () => {
      runtime.state.customCardWidth = clamp(Number(elements.cardWidthCustom.value) || 680, 280, 2600);
      renderPreview(runtime);
      saveState(runtime);
    });

    elements.sizePreset.addEventListener('change', () => applySizePreset(runtime, elements.sizePreset.value));
    elements.highlightInput.addEventListener('input', () => {
      getActiveTab(runtime.state).highlightSpec = elements.highlightInput.value;
      syncControlState(runtime);
      renderPreview(runtime);
      saveState(runtime);
    });
    elements.diffMode.addEventListener('click', () => {
      runtime.state.diffMode = !runtime.state.diffMode;
      syncControlState(runtime);
      renderPreview(runtime);
      saveState(runtime);
    });
    elements.dimLines.addEventListener('click', () => {
      if (elements.dimLines.disabled) return;
      runtime.state.dimUnfocused = !runtime.state.dimUnfocused;
      syncControlState(runtime);
      renderPreview(runtime);
      saveState(runtime);
    });
    elements.blurSensitive.addEventListener('click', () => {
      runtime.state.blurSensitive = !runtime.state.blurSensitive;
      syncControlState(runtime);
      renderPreview(runtime);
      saveState(runtime);
    });
    elements.autoPair.addEventListener('click', () => {
      runtime.state.autoPair = !runtime.state.autoPair;
      syncControlState(runtime);
      saveState(runtime);
    });
    elements.watermark.addEventListener('click', () => {
      runtime.state.watermark = !runtime.state.watermark;
      syncControlState(runtime);
      renderPreview(runtime);
      saveState(runtime);
    });
    elements.watermarkText.addEventListener('input', () => {
      runtime.state.watermarkText = elements.watermarkText.value.slice(0, 40);
      syncControlState(runtime);
      renderPreview(runtime);
      saveState(runtime);
    });

    elements.savePresetBtn.addEventListener('click', () => {
      elements.savePresetPopover.classList.toggle('is-open');
      if (elements.savePresetPopover.classList.contains('is-open')) elements.savePresetName.focus();
    });
    elements.savePresetConfirm.addEventListener('click', () => saveUserPreset(runtime));
    elements.savePresetCancel.addEventListener('click', () => {
      elements.savePresetPopover.classList.remove('is-open');
      elements.savePresetName.value = '';
    });

    elements.shortcutsClose.addEventListener('click', () => {
      elements.shortcutsOverlay.classList.remove('is-open');
      elements.shortcutsOverlay.setAttribute('aria-hidden', 'true');
    });
    elements.shortcutsOverlay.addEventListener('click', (event) => {
      if (event.target === elements.shortcutsOverlay) {
        elements.shortcutsOverlay.classList.remove('is-open');
        elements.shortcutsOverlay.setAttribute('aria-hidden', 'true');
      }
    });

    elements.pngBtn.addEventListener('click', () => exportPng(runtime, 'download'));
    elements.copyBtn.addEventListener('click', () => exportPng(runtime, 'copy'));
    elements.svgBtn.addEventListener('click', () => exportSvg(runtime));

    const startResize = (event) => {
      event.preventDefault();
      const startY = event.clientY;
      const startHeight = runtime.state.previewPanelHeight;
      const onMove = (moveEvent) => {
        runtime.state.previewPanelHeight = clamp(startHeight + (moveEvent.clientY - startY), 280, 1200);
        refreshPreviewZoom(runtime);
      };
      const onUp = () => {
        window.removeEventListener('mousemove', onMove);
        window.removeEventListener('mouseup', onUp);
        saveState(runtime);
      };
      window.addEventListener('mousemove', onMove);
      window.addEventListener('mouseup', onUp);
    };
    elements.resizeHandle.addEventListener('mousedown', startResize);

    window.addEventListener('resize', () => {
      refreshPreviewZoom(runtime);
      updateShortcutMessaging(runtime);
    });
    window.addEventListener('online', () => updateOfflineBadge(runtime));
    window.addEventListener('offline', () => updateOfflineBadge(runtime));

    container.addEventListener('keydown', (event) => {
      const isEditorFocused = document.activeElement === elements.editorInput;
      const metaOrCtrl = event.metaKey || event.ctrlKey;
      if (event.key === '?' && !event.ctrlKey && !event.metaKey && !event.altKey) {
        event.preventDefault();
        elements.shortcutsOverlay.classList.toggle('is-open');
        elements.shortcutsOverlay.setAttribute('aria-hidden', String(!elements.shortcutsOverlay.classList.contains('is-open')));
        return;
      }
      if (!isEditorFocused && (event.key === 'e' || event.key === 'E')) {
        event.preventDefault();
        elements.editorInput.focus();
        return;
      }
      if (metaOrCtrl && event.key.toLowerCase() === 's') {
        event.preventDefault();
        if (event.shiftKey) exportSvg(runtime);
        else exportPng(runtime, 'download');
        return;
      }
      if (metaOrCtrl && event.key.toLowerCase() === 'c' && !isEditorFocused) {
        event.preventDefault();
        exportPng(runtime, 'copy');
        return;
      }
      if (metaOrCtrl && event.key === ']') {
        event.preventDefault();
        cycleTheme(runtime, 1);
        return;
      }
      if (metaOrCtrl && event.key === '[') {
        event.preventDefault();
        cycleTheme(runtime, -1);
        return;
      }
      if (metaOrCtrl && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        const order = ['macos', 'glass', 'windows', 'browser', 'none'];
        const current = order.indexOf(runtime.state.chrome);
        runtime.state.chrome = order[(current + 1) % order.length];
        syncControlState(runtime);
        renderPreview(runtime);
        saveState(runtime);
        return;
      }
      if (metaOrCtrl && event.key.toLowerCase() === 't') {
        event.preventDefault();
        addTab(runtime);
      }
    });

    elements.themeGrid.addEventListener('keydown', (event) => {
      if (!['ArrowRight', 'ArrowLeft', 'ArrowDown', 'ArrowUp'].includes(event.key)) return;
      event.preventDefault();
      const visible = runtime.visibleThemes && runtime.visibleThemes.length ? runtime.visibleThemes : THEME_ORDER;
      const currentIndex = visible.indexOf(runtime.state.theme);
      let nextIndex = currentIndex;
      if (event.key === 'ArrowRight' || event.key === 'ArrowDown') nextIndex = (currentIndex + 1) % visible.length;
      if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') nextIndex = (currentIndex - 1 + visible.length) % visible.length;
      runtime.state.theme = visible[nextIndex];
      syncControlState(runtime);
      renderThemeGrid(runtime);
      renderEditorMirror(runtime);
      renderPreview(runtime);
      saveState(runtime);
    });
  }

  function collectElements(container) {
    return {
      editorTabs: container.querySelector('#cs-editor-tabs'),
      recentList: container.querySelector('#cs-recent-list'),
      themeGrid: container.querySelector('#cs-theme-grid'),
      gradientRow: container.querySelector('#cs-gradient-row'),
      shadowGrid: container.querySelector('#cs-shadow-grid'),
      editorMirror: container.querySelector('#cs-editor-mirror'),
      editorInput: container.querySelector('#cs-editor-input'),
      lineNumbers: container.querySelector('#cs-line-numbers'),
      editorStats: container.querySelector('#cs-editor-stats'),
      editorTip: container.querySelector('#cs-editor-tip'),
      languageBadge: container.querySelector('#cs-language-badge'),
      languageSelect: container.querySelector('#cs-language-select'),
      fileName: container.querySelector('#cs-file-name'),
      chromeColor: container.querySelector('#cs-chrome-color'),
      resetChromeColor: container.querySelector('#cs-reset-chrome-color'),
      solidColor: container.querySelector('#cs-solid-color'),
      solidColorText: container.querySelector('#cs-solid-color-text'),
      paddingSelect: container.querySelector('#cs-padding-select'),
      paddingCustom: container.querySelector('#cs-padding-custom'),
      fontFamily: container.querySelector('#cs-font-family'),
      ligatures: container.querySelector('#cs-ligatures'),
      ligatureField: container.querySelector('#cs-ligature-field'),
      cardWidth: container.querySelector('#cs-card-width'),
      cardWidthCustom: container.querySelector('#cs-card-width-custom'),
      sizePreset: container.querySelector('#cs-size-preset'),
      highlightInput: container.querySelector('#cs-highlight-lines'),
      diffMode: container.querySelector('#cs-diff-mode'),
      dimLinesField: container.querySelector('#cs-dim-lines-field'),
      dimLinesHelp: container.querySelector('#cs-dim-lines-help'),
      dimLines: container.querySelector('#cs-dim-lines'),
      blurSensitive: container.querySelector('#cs-blur-sensitive'),
      autoPair: container.querySelector('#cs-auto-pair'),
      watermark: container.querySelector('#cs-watermark'),
      watermarkText: container.querySelector('#cs-watermark-text'),
      watermarkNote: container.querySelector('#cs-watermark-note'),
      savePresetBtn: container.querySelector('#cs-save-preset-btn'),
      savePresetPopover: container.querySelector('#cs-save-preset-popover'),
      savePresetName: container.querySelector('#cs-save-preset-name'),
      savePresetConfirm: container.querySelector('#cs-save-preset-confirm'),
      savePresetCancel: container.querySelector('#cs-save-preset-cancel'),
      presetList: container.querySelector('#cs-preset-list'),
      previewColumn: container.querySelector('#cs-preview-column'),
      previewViewport: container.querySelector('#cs-preview-viewport'),
      previewZoomWrap: container.querySelector('#cs-preview-zoom-wrap'),
      previewCard: container.querySelector('#code-preview-card'),
      resizeHandle: container.querySelector('#cs-resize-handle'),
      exportSizeBadge: container.querySelector('#cs-export-size-badge'),
      exportNote: container.querySelector('#cs-export-note'),
      offlineBadge: container.querySelector('#cs-offline-badge'),
      liveRegion: container.querySelector('#cs-live-region'),
      fontLoadingBadge: container.querySelector('#cs-font-loading-badge'),
      toast: container.querySelector('#cs-toast'),
      shortcutsTrigger: container.querySelector('#cs-shortcuts-trigger'),
      shortcutsNote: container.querySelector('#cs-shortcuts-note'),
      shortcutsLead: container.querySelector('#cs-shortcuts-lead'),
      shortcutsOverlay: container.querySelector('#cs-shortcuts-overlay'),
      shortcutsClose: container.querySelector('#cs-shortcuts-close'),
      pngBtn: container.querySelector('#cs-png-btn'),
      svgBtn: container.querySelector('#cs-svg-btn'),
      copyBtn: container.querySelector('#cs-copy-btn'),
    };
  }

  ToolRenderers.renderers['code-screenshot'] = function renderCodeScreenshot(container) {
    ensureStyleTag();
    container.innerHTML = createMarkup();
    const runtime = {
      container,
      state: normalizeState(readJson(STORAGE.state, null)),
      elements: collectElements(container),
      visibleThemes: THEME_ORDER.slice(),
      semanticModels: new Map(),
      semanticRunId: 0,
      semanticTimer: null,
      userPresets: [],
      history: [],
      lastPreviewMetrics: null,
      toastTimer: null,
    };

    syncControlState(runtime);
    renderThemeGrid(runtime);
    renderGradientRow(runtime);
    renderShadowGrid(runtime);
    renderTabButtons(runtime);
    renderPresetList(runtime);
    renderHistory(runtime);
    updateShortcutMessaging(runtime);
    updateToolbarState(runtime);
    updateLineNumbers(runtime);
    renderEditorMirror(runtime);
    renderPreview(runtime);
    updateOfflineBadge(runtime);
    attachEvents(runtime);
    updateFontBadge(runtime, 'Font ready');

    ensureFont(runtime.state.fontFamily).then(() => {
      renderEditorMirror(runtime);
      renderPreview(runtime);
    });
    ensureHighlight().then(() => refreshSemanticModel(runtime, 'initial'));
    prewarmHtml2Canvas();
  };
})();
