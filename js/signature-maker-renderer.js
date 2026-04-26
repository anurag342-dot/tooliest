// ============================================
// TOOLIEST.COM - Tool Renderers Signature Maker
// ============================================

(function () {
  const STATE_KEY = 'tooliest_signature_maker_state';
  const SAVED_KEY = 'tooliest_saved_signatures';
  const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
  const MAX_SAVED_SIGNATURES = 5;
  const MAX_STROKES = 20;
  const CANVAS_WIDTH = 680;
  const CANVAS_HEIGHT = 260;
  const EXPORT_PADDING = 16;
  const CLEAR_DURATION = 200;
  const SAVE_DEBOUNCE = 500;
  const PREVIEW_DEBOUNCE = 150;
  const TIP_ROTATE_MS = 5000;

  const COLOR_OPTIONS = [
    { id: 'black', label: 'Black', value: '#111827' },
    { id: 'navy', label: 'Dark Blue', value: '#1E3A8A' },
    { id: 'green', label: 'Dark Green', value: '#166534' },
    { id: 'red', label: 'Dark Red', value: '#991B1B' },
    { id: 'purple', label: 'Dark Purple', value: '#6D28D9' },
  ];

  const WIDTH_OPTIONS = [
    { id: 'thin', label: 'Thin', value: 1.5 },
    { id: 'medium', label: 'Medium', value: 2.5 },
    { id: 'thick', label: 'Thick', value: 4 },
  ];

  const STYLE_OPTIONS = [
    { id: 'ink', label: 'Ink' },
    { id: 'ballpoint', label: 'Ballpoint' },
    { id: 'brush', label: 'Brush' },
  ];

  const TYPE_FONTS = [
    { id: 'Dancing Script', family: '"Dancing Script", cursive', query: 'family=Dancing+Script:wght@700' },
    { id: 'Great Vibes', family: '"Great Vibes", cursive', query: 'family=Great+Vibes' },
    { id: 'Pacifico', family: '"Pacifico", cursive', query: 'family=Pacifico' },
    { id: 'Sacramento', family: '"Sacramento", cursive', query: 'family=Sacramento' },
    { id: 'Parisienne', family: '"Parisienne", cursive', query: 'family=Parisienne' },
    { id: 'Pinyon Script', family: '"Pinyon Script", cursive', query: 'family=Pinyon+Script' },
    { id: 'Allura', family: '"Allura", cursive', query: 'family=Allura' },
    { id: 'Alex Brush', family: '"Alex Brush", cursive', query: 'family=Alex+Brush' },
    { id: 'Qwitcher Grypen', family: '"Qwitcher Grypen", cursive', query: 'family=Qwitcher+Grypen:wght@700' },
    { id: 'Aguafina Script', family: '"Aguafina Script", cursive', query: 'family=Aguafina+Script' },
    { id: 'Meie Script', family: '"Meie Script", cursive', query: 'family=Meie+Script' },
    { id: 'Lovers Quarrel', family: '"Lovers Quarrel", cursive', query: 'family=Lovers+Quarrel' },
  ];

  const FONT_STYLESHEET_URL = `https://fonts.googleapis.com/css2?${TYPE_FONTS.map((font) => font.query).join('&')}&display=swap`;

  const EXPORT_RESOLUTIONS = {
    standard: { id: 'standard', label: 'Standard (1x)', scale: 1 },
    high: { id: 'high', label: 'High (2x)', scale: 2 },
    ultra: { id: 'ultra', label: 'Ultra (3x)', scale: 3 },
  };

  const EXPORT_COLORS = {
    original: { id: 'original', label: 'Keep original', value: null },
    black: { id: 'black', label: 'Black', value: '#111827' },
    navy: { id: 'navy', label: 'Navy blue', value: '#1E3A8A' },
  };

  const MODE_TABS = [
    { id: 'draw', label: 'Draw' },
    { id: 'type', label: 'Type' },
    { id: 'upload', label: 'Upload' },
  ];

  const PREVIEW_CONTEXTS = [
    { id: 'document', label: 'On a white document' },
    { id: 'invoice', label: 'On an invoice' },
    { id: 'email', label: 'In email' },
  ];

  const GUIDED_TIPS = [
    'Tip: Draw slowly for a more natural looking signature.',
    'Tip: Use your actual signature on a touchscreen for the most authentic result.',
    'Tip: The Upload mode can digitize your paper signature in seconds.',
    'Tip: Try Great Vibes or Dancing Script for an elegant typed signature.',
  ];

  const escapeHtml = (value) => ToolRenderers.escapeHtml(value);
  const escapeAttr = (value) => ToolRenderers.escapeAttr(value);

  function debounce(fn, wait) {
    let timeoutId = null;
    return function debounced(...args) {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => fn.apply(this, args), wait);
    };
  }

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function uid() {
    return `sig-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  }

  function readState() {
    return normalizeState(safeLocalGet(STATE_KEY, null));
  }

  function writeState(state) {
    safeLocalSet(STATE_KEY, JSON.stringify(state));
  }

  function readSavedSignatures() {
    return normalizeSavedSignatures(safeLocalGet(SAVED_KEY, []));
  }

  function writeSavedSignatures(entries) {
    safeLocalSet(SAVED_KEY, JSON.stringify(entries.slice(0, MAX_SAVED_SIGNATURES)));
  }

  function normalizeColor(value, fallback = '#111827') {
    const raw = String(value || '').trim();
    const prefixed = raw.startsWith('#') ? raw : `#${raw}`;
    return /^#[0-9a-fA-F]{6}$/.test(prefixed) ? prefixed.toUpperCase() : fallback.toUpperCase();
  }

  function defaultState() {
    return {
      mode: 'draw',
      previewContext: 'invoice',
      export: {
        transparent: true,
        whiteBackground: false,
        resolution: 'high',
        color: 'original',
      },
      draw: {
        color: '#111827',
        widthPreset: 'medium',
        style: 'ink',
        baselineEnabled: true,
        guideDismissed: false,
        strokes: [],
      },
      type: {
        text: 'Your Signature',
        font: 'Dancing Script',
        color: '#111827',
        slant: 6,
        variantScale: 1,
      },
      upload: {
        originalData: '',
        originalName: '',
        threshold: 180,
        invert: false,
        showOriginal: false,
      },
      savedOpen: false,
    };
  }

  function normalizeStrokePoint(point) {
    return {
      x: Number(point && point.x) || 0,
      y: Number(point && point.y) || 0,
      pressure: clamp(Number(point && point.pressure) || 0.5, 0.05, 1),
      time: Number(point && point.time) || performance.now(),
    };
  }

  function normalizeStroke(stroke) {
    return {
      id: String(stroke && stroke.id || uid()),
      color: normalizeColor(stroke && stroke.color, '#111827'),
      widthPreset: WIDTH_OPTIONS.some((item) => item.id === stroke?.widthPreset) ? stroke.widthPreset : 'medium',
      style: STYLE_OPTIONS.some((item) => item.id === stroke?.style) ? stroke.style : 'ink',
      points: Array.isArray(stroke && stroke.points) ? stroke.points.map(normalizeStrokePoint) : [],
    };
  }

  function normalizeSavedSignatures(entries) {
    if (!Array.isArray(entries)) return [];
    return entries
      .filter((entry) => entry && typeof entry === 'object' && entry.thumbnail && entry.state)
      .slice(0, MAX_SAVED_SIGNATURES)
      .map((entry) => ({
        id: String(entry.id || uid()),
        mode: ['draw', 'type', 'upload'].includes(entry.mode) ? entry.mode : 'draw',
        label: String(entry.label || 'Saved signature'),
        font: String(entry.font || ''),
        timestamp: String(entry.timestamp || new Date().toISOString()),
        thumbnail: String(entry.thumbnail || ''),
        exportData: String(entry.exportData || ''),
        mimeType: String(entry.mimeType || 'image/png'),
        fileName: String(entry.fileName || 'my-signature.png'),
        state: normalizeState(entry.state),
      }));
  }

  function normalizeState(rawValue) {
    const base = defaultState();
    if (!rawValue || typeof rawValue !== 'object') return base;

    const next = {
      ...base,
      ...rawValue,
      export: { ...base.export, ...(rawValue.export || {}) },
      draw: { ...base.draw, ...(rawValue.draw || {}) },
      type: { ...base.type, ...(rawValue.type || {}) },
      upload: { ...base.upload, ...(rawValue.upload || {}) },
    };

    next.mode = MODE_TABS.some((tab) => tab.id === next.mode) ? next.mode : base.mode;
    next.previewContext = PREVIEW_CONTEXTS.some((tab) => tab.id === next.previewContext) ? next.previewContext : base.previewContext;
    next.export.transparent = Boolean(next.export.transparent);
    next.export.whiteBackground = Boolean(next.export.whiteBackground);
    if (!next.export.transparent && !next.export.whiteBackground) next.export.transparent = true;
    if (next.export.transparent && next.export.whiteBackground) next.export.whiteBackground = false;
    next.export.resolution = EXPORT_RESOLUTIONS[next.export.resolution] ? next.export.resolution : base.export.resolution;
    next.export.color = EXPORT_COLORS[next.export.color] ? next.export.color : base.export.color;

    next.draw.color = normalizeColor(next.draw.color, base.draw.color);
    next.draw.widthPreset = WIDTH_OPTIONS.some((item) => item.id === next.draw.widthPreset) ? next.draw.widthPreset : base.draw.widthPreset;
    next.draw.style = STYLE_OPTIONS.some((item) => item.id === next.draw.style) ? next.draw.style : base.draw.style;
    next.draw.baselineEnabled = Boolean(next.draw.baselineEnabled);
    next.draw.guideDismissed = Boolean(next.draw.guideDismissed);
    next.draw.strokes = Array.isArray(next.draw.strokes) ? next.draw.strokes.map(normalizeStroke).slice(-MAX_STROKES) : [];

    next.type.text = String(next.type.text || base.type.text);
    next.type.font = TYPE_FONTS.some((font) => font.id === next.type.font) ? next.type.font : base.type.font;
    next.type.color = normalizeColor(next.type.color, base.type.color);
    next.type.slant = clamp(Number(next.type.slant) || 0, -20, 20);
    next.type.variantScale = clamp(Number(next.type.variantScale) || 1, 0.8, 1.2);

    next.upload.originalData = String(next.upload.originalData || '');
    next.upload.originalName = String(next.upload.originalName || '');
    next.upload.threshold = clamp(Number(next.upload.threshold) || 180, 0, 255);
    next.upload.invert = Boolean(next.upload.invert);
    next.upload.showOriginal = Boolean(next.upload.showOriginal);

    next.savedOpen = Boolean(next.savedOpen);

    return next;
  }

  function colorOptionByValue(value) {
    return COLOR_OPTIONS.find((option) => option.value === value) || COLOR_OPTIONS[0];
  }

  function widthValue(widthPreset) {
    return (WIDTH_OPTIONS.find((option) => option.id === widthPreset) || WIDTH_OPTIONS[1]).value;
  }

  function toRgb(hex) {
    const safeHex = normalizeColor(hex).slice(1);
    return {
      r: parseInt(safeHex.slice(0, 2), 16),
      g: parseInt(safeHex.slice(2, 4), 16),
      b: parseInt(safeHex.slice(4, 6), 16),
    };
  }

  function formatSavedDate(isoValue) {
    try {
      return new Intl.DateTimeFormat(undefined, {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      }).format(new Date(isoValue));
    } catch (_) {
      return isoValue;
    }
  }

  function downloadBlob(blob, fileName) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 60_000);
  }

  function canvasToBlob(canvas, type, quality) {
    return new Promise((resolve) => canvas.toBlob(resolve, type, quality));
  }

  function loadImage(source) {
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error('Could not load the selected image.'));
      image.src = source;
    });
  }

  function ensureFontStylesheet() {
    if (window.__tooliestSignatureFontsPromise) return window.__tooliestSignatureFontsPromise;

    window.__tooliestSignatureFontsPromise = new Promise((resolve, reject) => {
      const existing = document.getElementById('tooliest-signature-fonts');
      if (existing) {
        resolve();
        return;
      }

      const link = document.createElement('link');
      link.id = 'tooliest-signature-fonts';
      link.rel = 'stylesheet';
      link.href = FONT_STYLESHEET_URL;
      link.onload = () => resolve();
      link.onerror = () => reject(new Error('Could not load the signature fonts.'));
      document.head.appendChild(link);
    }).catch((error) => {
      console.warn('[Tooliest] Signature font load failed.', error);
    });

    return window.__tooliestSignatureFontsPromise;
  }

  async function ensureFontLoaded(fontId, previewText) {
    const option = TYPE_FONTS.find((font) => font.id === fontId) || TYPE_FONTS[0];
    await ensureFontStylesheet();
    if (document.fonts && document.fonts.load) {
      try {
        await Promise.all([
          document.fonts.load(`72px ${option.family}`, previewText || 'Signature'),
          document.fonts.ready,
        ]);
      } catch (_) {
        // Font fallback is acceptable if the browser does not fully support the requested font loading API.
      }
    }
    return option;
  }

  function warmAllPreviewFonts(previewText, onReady) {
    if (!window.__tooliestSignatureFontPreviewWarmPromise) {
      window.__tooliestSignatureFontPreviewWarmPromise = ensureFontStylesheet()
        .then(async () => {
          if (document.fonts && document.fonts.load) {
            await Promise.all(TYPE_FONTS.map((font) => document.fonts.load(`42px ${font.family}`, previewText || 'Signature')));
          }
        })
        .catch((error) => {
          console.warn('[Tooliest] Signature preview fonts did not finish loading.', error);
        });
    }
    return window.__tooliestSignatureFontPreviewWarmPromise
      .then(async () => {
        if (typeof onReady === 'function') onReady();
      });
  }

  function midpoint(left, right) {
    return {
      x: (left.x + right.x) / 2,
      y: (left.y + right.y) / 2,
    };
  }

  function pointDistance(left, right) {
    if (!left || !right) return 0;
    return Math.hypot(right.x - left.x, right.y - left.y);
  }

  function calculatePressureWidth(pressure, selectedWidth) {
    const safePressure = clamp(Number(pressure) || 0.5, 0.05, 1);
    return selectedWidth * (0.75 + safePressure * 0.7);
  }

  function calculateStrokeWidth(point, previousPoint, nextPoint, stroke) {
    const base = widthValue(stroke.widthPreset);
    if (stroke.style === 'ballpoint') return base;

    const pressureWidth = calculatePressureWidth(point.pressure, base);
    const fallbackNext = nextPoint || point;
    const fallbackPrev = previousPoint || point;
    const distance = pointDistance(fallbackPrev, fallbackNext);
    const deltaTime = Math.max(16, (fallbackNext.time || point.time) - (fallbackPrev.time || point.time));
    const speed = distance / deltaTime;
    const speedFactor = clamp(speed * 10, 0, 1);

    if (stroke.style === 'brush') {
      return clamp(pressureWidth * (3.1 - speedFactor * 1.75), base * 0.95, base * 4.3);
    }

    return clamp(pressureWidth * (1.45 - speedFactor * 0.52), base * 0.78, base * 2.35);
  }

  function drawDot(ctx, point, stroke) {
    ctx.save();
    ctx.fillStyle = stroke.color;
    ctx.beginPath();
    ctx.arc(point.x, point.y, Math.max(0.9, calculatePressureWidth(point.pressure, widthValue(stroke.widthPreset)) / 2), 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function drawStroke(ctx, stroke) {
    const points = Array.isArray(stroke.points) ? stroke.points : [];
    if (!points.length) return;
    if (points.length === 1) {
      drawDot(ctx, points[0], stroke);
      return;
    }

    ctx.save();
    ctx.strokeStyle = stroke.color;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    if (stroke.style === 'ink') {
      ctx.globalAlpha = 0.94;
      ctx.shadowBlur = 1.5;
      ctx.shadowColor = stroke.color;
    } else if (stroke.style === 'brush') {
      ctx.globalAlpha = 0.97;
      ctx.shadowBlur = widthValue(stroke.widthPreset) * 1.4;
      ctx.shadowColor = stroke.color;
    }

    if (points.length === 2) {
      ctx.beginPath();
      ctx.moveTo(points[0].x, points[0].y);
      ctx.lineWidth = calculateStrokeWidth(points[1], points[0], points[1], stroke);
      ctx.lineTo(points[1].x, points[1].y);
      ctx.stroke();
      ctx.restore();
      return;
    }

    for (let index = 0; index < points.length - 2; index += 1) {
      const p0 = points[index];
      const p1 = points[index + 1];
      const p2 = points[index + 2];
      const controlPoint = midpoint(p0, p1);
      const endPoint = midpoint(p1, p2);
      ctx.beginPath();
      ctx.moveTo(controlPoint.x, controlPoint.y);
      ctx.lineWidth = calculateStrokeWidth(p1, p0, p2, stroke);
      ctx.quadraticCurveTo(p1.x, p1.y, endPoint.x, endPoint.y);
      ctx.stroke();
    }

    const beforeLast = points[points.length - 2];
    const last = points[points.length - 1];
    ctx.beginPath();
    ctx.moveTo(beforeLast.x, beforeLast.y);
    ctx.lineWidth = calculateStrokeWidth(last, beforeLast, last, stroke);
    ctx.lineTo(last.x, last.y);
    ctx.stroke();
    ctx.restore();
  }

  function detectBounds(canvas) {
    const ctx = canvas.getContext('2d');
    const { width, height } = canvas;
    const data = ctx.getImageData(0, 0, width, height).data;
    let minX = width;
    let minY = height;
    let maxX = -1;
    let maxY = -1;

    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < width; x += 1) {
        const alpha = data[(y * width + x) * 4 + 3];
        if (alpha > 0) {
          minX = Math.min(minX, x);
          minY = Math.min(minY, y);
          maxX = Math.max(maxX, x);
          maxY = Math.max(maxY, y);
        }
      }
    }

    if (maxX < minX || maxY < minY) return null;
    return { minX, minY, maxX, maxY };
  }

  function createCanvas(width, height) {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    return canvas;
  }

  function fitContain(imageWidth, imageHeight, targetWidth, targetHeight, padding = 24) {
    const usableWidth = Math.max(1, targetWidth - padding * 2);
    const usableHeight = Math.max(1, targetHeight - padding * 2);
    const scale = Math.min(usableWidth / imageWidth, usableHeight / imageHeight, 1.6);
    const drawWidth = Math.max(1, Math.round(imageWidth * scale));
    const drawHeight = Math.max(1, Math.round(imageHeight * scale));
    return {
      x: Math.round((targetWidth - drawWidth) / 2),
      y: Math.round((targetHeight - drawHeight) / 2),
      width: drawWidth,
      height: drawHeight,
    };
  }

  function createThumbnailData(canvas, preserveTransparency) {
    const thumb = createCanvas(220, 92);
    const ctx = thumb.getContext('2d');
    if (!preserveTransparency) {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, thumb.width, thumb.height);
    }

    const scale = Math.min(thumb.width / canvas.width, thumb.height / canvas.height);
    const drawWidth = canvas.width * scale;
    const drawHeight = canvas.height * scale;
    const x = (thumb.width - drawWidth) / 2;
    const y = (thumb.height - drawHeight) / 2;
    ctx.drawImage(canvas, x, y, drawWidth, drawHeight);
    return preserveTransparency ? thumb.toDataURL('image/png') : thumb.toDataURL('image/jpeg', 0.7);
  }

  function buildSignatureLabel(state) {
    if (state.mode === 'type') return (state.type.text || 'Typed signature').trim().slice(0, 36) || 'Typed signature';
    if (state.mode === 'upload') return (state.upload.originalName || 'Uploaded signature').slice(0, 36);
    return 'Drawn signature';
  }

  function buildTypeFontSvgImport() {
    return `<style>@import url('${FONT_STYLESHEET_URL}');</style>`;
  }

  function sanitizeFileName(label) {
    return String(label || 'my-signature')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'my-signature';
  }

  Object.assign(ToolRenderers.renderers, {
    'signature-maker'(container) {
      let state = readState();
      let savedSignatures = readSavedSignatures();
      let redoStrokes = [];
      let currentStroke = null;
      let pointerId = null;
      let drawRenderRaf = 0;
      let ghostRaf = 0;
      let clearAnimation = null;
      let uploadImage = null;
      let uploadImageSource = '';
      let previewTicket = 0;
      let fontTicket = 0;
      let uploadTicket = 0;
      let tipIndex = 0;
      let tipInterval = null;
      container.innerHTML = `
<style>
  .sm-wrap { font-family: var(--font-primary); }
  .sm-surface { display: flex; flex-direction: column; gap: 18px; }
  .sm-tabbar { display: flex; gap: 10px; flex-wrap: wrap; margin-bottom: 4px; }
  .sm-tab {
    min-height: 44px;
    padding: 0 18px;
    border-radius: 999px;
    border: 1px solid var(--border-color);
    background: rgba(255,255,255,0.03);
    color: var(--text-secondary);
    font: inherit;
    font-weight: 700;
    cursor: pointer;
    transition: all 0.2s ease;
  }
  .sm-tab[aria-selected="true"] {
    background: linear-gradient(135deg, #8b5cf6, #06b6d4);
    border-color: transparent;
    color: #ffffff;
    box-shadow: 0 12px 28px rgba(6, 182, 212, 0.18);
  }
  .sm-stage {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    gap: 18px;
    align-items: start;
  }
  .sm-panel,
  .sm-tip-card,
  .sm-preview-block,
  .sm-export-block,
  .sm-workflow,
  .sm-saved-panel {
    border: 1px solid var(--border-color);
    border-radius: 18px;
    background: rgba(255,255,255,0.03);
  }
  .sm-panel,
  .sm-preview-block,
  .sm-export-block,
  .sm-workflow {
    padding: 20px;
  }
  .sm-tip-card {
    padding: 18px;
    position: static;
  }
  .sm-tip-card h3,
  .sm-preview-head h3,
  .sm-export-head h3,
  .sm-workflow h3,
  .sm-saved-summary-title {
    margin: 0 0 8px;
    font-size: 1.02rem;
  }
  .sm-tip-card p,
  .sm-panel > p,
  .sm-preview-head p,
  .sm-export-head p,
  .sm-note,
  .sm-privacy-note,
  .sm-width-warning {
    margin: 0;
    color: var(--text-secondary);
    font-size: 0.94rem;
    line-height: 1.6;
  }
  .sm-mode-panel[hidden] { display: none !important; }
  .sm-canvas-card {
    position: relative;
    border: 1px solid rgba(148, 163, 184, 0.28);
    border-radius: 20px;
    background:
      linear-gradient(45deg, rgba(255,255,255,0.06) 25%, transparent 25%, transparent 75%, rgba(255,255,255,0.06) 75%, rgba(255,255,255,0.06)),
      linear-gradient(45deg, rgba(255,255,255,0.06) 25%, transparent 25%, transparent 75%, rgba(255,255,255,0.06) 75%, rgba(255,255,255,0.06)),
      #f8fafc;
    background-position: 0 0, 12px 12px, 0 0;
    background-size: 24px 24px, 24px 24px, auto;
    box-shadow: inset 0 1px 0 rgba(255,255,255,0.18), 0 20px 46px rgba(2, 6, 23, 0.18);
    overflow: hidden;
  }
  .sm-canvas-card.is-white {
    background: #ffffff;
  }
  .sm-canvas-label {
    position: absolute;
    left: 16px;
    top: 12px;
    z-index: 2;
    font-size: 0.8rem;
    font-weight: 700;
    color: #64748b;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }
  .sm-canvas {
    display: block;
    width: 100%;
    max-width: 680px;
    height: auto;
    aspect-ratio: 680 / 260;
    touch-action: none;
    cursor: crosshair;
  }
  .sm-draw-canvas {
    background: transparent;
  }
  .sm-upload-drop {
    display: block;
    margin-bottom: 16px;
    border: 1.5px dashed rgba(139, 92, 246, 0.32);
    border-radius: 16px;
    padding: 18px;
    text-align: center;
    background: rgba(139, 92, 246, 0.05);
    cursor: pointer;
    transition: border-color 0.18s ease, background 0.18s ease, transform 0.18s ease;
  }
  .sm-upload-drop:hover,
  .sm-upload-drop.is-dragover {
    border-color: #8b5cf6;
    background: rgba(139, 92, 246, 0.12);
    transform: translateY(-1px);
  }
  .sm-upload-drop input { display: none; }
  .sm-upload-drop strong {
    display: block;
    font-size: 1.08rem;
    line-height: 1.35;
    color: var(--text-primary);
  }
  .sm-upload-drop p {
    max-width: 560px;
    margin-inline: auto;
  }
  .sm-section-stack { display: flex; flex-direction: column; gap: 16px; }
  .sm-grid {
    display: grid;
    gap: 14px;
  }
  .sm-grid-2 {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .sm-field {
    display: flex;
    flex-direction: column;
    gap: 8px;
    min-width: 0;
  }
  .sm-field label,
  .sm-label {
    font-size: 0.86rem;
    font-weight: 700;
    color: var(--text-secondary);
  }
  .sm-field input[type="text"],
  .sm-field input[type="range"],
  .sm-field input[type="file"],
  .sm-field select,
  .sm-field textarea {
    width: 100%;
  }
  .sm-field input[type="range"] {
    -webkit-appearance: none;
    appearance: none;
    height: 40px;
    padding: 0;
    border: 0;
    background: transparent;
    cursor: pointer;
  }
  .sm-field input[type="range"]::-webkit-slider-runnable-track {
    height: 8px;
    border-radius: 999px;
    background: rgba(148, 163, 184, 0.24);
    border: 1px solid rgba(148, 163, 184, 0.18);
  }
  .sm-field input[type="range"]::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 22px;
    height: 22px;
    margin-top: -8px;
    border: 2px solid #ffffff;
    border-radius: 999px;
    background: linear-gradient(135deg, #8b5cf6, #06b6d4);
    box-shadow: 0 8px 20px rgba(6, 182, 212, 0.22);
  }
  .sm-field input[type="range"]::-moz-range-track {
    height: 8px;
    border-radius: 999px;
    background: rgba(148, 163, 184, 0.24);
    border: 1px solid rgba(148, 163, 184, 0.18);
  }
  .sm-field input[type="range"]::-moz-range-thumb {
    width: 22px;
    height: 22px;
    border: 2px solid #ffffff;
    border-radius: 999px;
    background: linear-gradient(135deg, #8b5cf6, #06b6d4);
    box-shadow: 0 8px 20px rgba(6, 182, 212, 0.22);
  }
  .sm-field input[type="text"],
  .sm-field input[type="url"],
  .sm-field input[type="number"],
  .sm-field textarea,
  .sm-field select {
    min-height: 44px;
    padding: 12px 14px;
    border-radius: 14px;
    border: 1px solid var(--border-color);
    background: var(--bg-secondary);
    color: var(--text-primary);
    font: inherit;
  }
  .sm-field textarea {
    min-height: 96px;
    resize: vertical;
  }
  .sm-note-row {
    display: flex;
    flex-wrap: wrap;
    gap: 10px 16px;
    align-items: center;
  }
  .sm-mobile-note,
  .sm-access-note {
    margin: 0 0 12px;
    font-size: 0.92rem;
    color: var(--text-secondary);
  }
  .sm-mobile-note {
    display: none;
    font-weight: 700;
    color: #c4b5fd;
  }
  .sm-upload-controls {
    align-items: start;
  }
  .sm-upload-field {
    padding: 16px;
    border: 1px solid var(--border-color);
    border-radius: 16px;
    background: rgba(255,255,255,0.02);
  }
  .sm-controls-row,
  .sm-export-actions,
  .sm-preview-tabs,
  .sm-option-buttons,
  .sm-draw-actions {
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
    align-items: center;
  }
  .sm-chip,
  .sm-option-button,
  .sm-color-swatch,
  .sm-font-card,
  .sm-draw-action,
  .sm-preview-tab,
  .sm-workflow-step {
    border: 1px solid var(--border-color);
    background: rgba(255,255,255,0.03);
    color: var(--text-primary);
  }
  .sm-chip,
  .sm-option-button,
  .sm-draw-action,
  .sm-preview-tab {
    min-height: 42px;
    padding: 0 14px;
    border-radius: 999px;
    font: inherit;
    font-weight: 700;
    cursor: pointer;
    transition: all 0.18s ease;
  }
  .sm-chip.is-active,
  .sm-option-button.is-active,
  .sm-preview-tab.is-active,
  .sm-draw-action.is-primary {
    border-color: transparent;
    background: linear-gradient(135deg, #8b5cf6, #06b6d4);
    color: #ffffff;
    box-shadow: 0 10px 24px rgba(6, 182, 212, 0.14);
  }
  .sm-option-button.is-soft-active {
    background: rgba(139, 92, 246, 0.12);
    border-color: rgba(139, 92, 246, 0.32);
    color: #d8b4fe;
  }
  .sm-color-row,
  .sm-width-row {
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
    align-items: center;
  }
  .sm-color-swatch {
    width: 38px;
    height: 38px;
    border-radius: 999px;
    position: relative;
    cursor: pointer;
    transition: transform 0.16s ease, box-shadow 0.16s ease;
  }
  .sm-color-swatch::after {
    content: '';
    position: absolute;
    inset: 5px;
    border-radius: inherit;
    background: currentColor;
  }
  .sm-color-swatch.is-active {
    box-shadow: 0 0 0 2px #ffffff, 0 0 0 4px rgba(139, 92, 246, 0.55);
    transform: translateY(-1px);
  }
  .sm-font-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 10px;
  }
  .sm-font-card {
    min-height: 84px;
    padding: 14px;
    border-radius: 16px;
    text-align: left;
    cursor: pointer;
    transition: border-color 0.2s ease, transform 0.2s ease, background 0.2s ease;
  }
  .sm-font-card:hover {
    transform: translateY(-1px);
    border-color: rgba(139, 92, 246, 0.4);
  }
  .sm-font-card.is-active {
    border-color: transparent;
    background: linear-gradient(135deg, rgba(139, 92, 246, 0.18), rgba(6, 182, 212, 0.18));
    box-shadow: inset 0 0 0 1px rgba(255,255,255,0.12);
  }
  .sm-font-card span {
    display: block;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .sm-font-card small {
    display: block;
    margin-top: 8px;
    color: var(--text-secondary);
    font-size: 0.8rem;
    font-weight: 700;
    letter-spacing: 0.02em;
  }
  .sm-preview-block,
  .sm-export-block {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }
  .sm-preview-frame {
    border: 1px solid rgba(148, 163, 184, 0.22);
    border-radius: 20px;
    background: rgba(255,255,255,0.03);
    overflow: hidden;
  }
  .sm-preview-scene {
    padding: 18px;
  }
  .sm-preview-card {
    border-radius: 18px;
    background: #ffffff;
    color: #0f172a;
    min-height: 230px;
    overflow: hidden;
    box-shadow: 0 14px 34px rgba(15, 23, 42, 0.12);
  }
  .sm-preview-doc {
    padding: 26px;
  }
  .sm-preview-doc h4,
  .sm-preview-email h4,
  .sm-preview-invoice h4 {
    margin: 0 0 12px;
    font: 700 0.95rem/1.3 var(--font-primary);
    color: #334155;
  }
  .sm-preview-line {
    margin-top: 18px;
    padding-top: 12px;
    border-top: 1px solid #cbd5e1;
  }
  .sm-preview-line-label {
    font: 700 0.8rem/1 var(--font-primary);
    color: #64748b;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }
  .sm-preview-signature {
    display: block;
    max-width: 100%;
    max-height: 110px;
    margin-top: 12px;
  }
  .sm-preview-invoice {
    padding: 22px 24px 24px;
    display: grid;
    gap: 16px;
  }
  .sm-preview-invoice-head {
    display: flex;
    justify-content: space-between;
    gap: 14px;
    align-items: flex-start;
  }
  .sm-preview-tag {
    display: inline-flex;
    align-items: center;
    min-height: 30px;
    padding: 0 12px;
    border-radius: 999px;
    background: rgba(139, 92, 246, 0.12);
    color: #6d28d9;
    font: 700 0.8rem/1 var(--font-primary);
  }
  .sm-preview-invoice-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-height: 38px;
    padding: 0 14px;
    border-radius: 999px;
    background: linear-gradient(135deg, #8b5cf6, #06b6d4);
    color: #ffffff;
    font: 700 0.86rem/1 var(--font-primary);
    text-decoration: none;
  }
  .sm-preview-email {
    background: #f8fafc;
  }
  .sm-preview-email-top {
    padding: 14px 18px;
    background: #e2e8f0;
    display: grid;
    gap: 8px;
  }
  .sm-preview-email-bar {
    height: 12px;
    border-radius: 999px;
    background: rgba(100, 116, 139, 0.28);
  }
  .sm-preview-email-body {
    padding: 22px;
  }
  .sm-status {
    display: none;
    padding: 14px 16px;
    border-radius: 14px;
    font-size: 0.92rem;
    line-height: 1.5;
  }
  .sm-status.is-visible { display: block; }
  .sm-status.is-success {
    background: rgba(16, 185, 129, 0.1);
    border: 1px solid rgba(16, 185, 129, 0.24);
    color: #a7f3d0;
  }
  .sm-status.is-error {
    background: rgba(239, 68, 68, 0.1);
    border: 1px solid rgba(239, 68, 68, 0.24);
    color: #fecaca;
  }
  .sm-export-options {
    display: grid;
    gap: 14px;
  }
  .sm-toggle {
    display: inline-flex;
    align-items: center;
    gap: 10px;
    min-height: 42px;
    padding: 0 14px;
    border-radius: 999px;
    border: 1px solid var(--border-color);
    background: rgba(255,255,255,0.03);
    cursor: pointer;
    font-weight: 700;
  }
  .sm-toggle input { accent-color: #8b5cf6; }
  .sm-privacy-note {
    padding: 14px 16px;
    border: 1px solid rgba(16, 185, 129, 0.18);
    background: rgba(16, 185, 129, 0.06);
    border-radius: 14px;
  }
  .sm-workflow {
    padding: 20px;
  }
  .sm-workflow-steps {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 14px;
    margin-top: 16px;
  }
  .sm-workflow-step {
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding: 16px;
    border-radius: 18px;
    text-decoration: none;
    transition: transform 0.18s ease, border-color 0.18s ease;
  }
  .sm-workflow-step:hover {
    transform: translateY(-1px);
    border-color: rgba(139, 92, 246, 0.32);
  }
  .sm-workflow-step.is-current {
    border-color: transparent;
    background: linear-gradient(135deg, rgba(139, 92, 246, 0.18), rgba(6, 182, 212, 0.18));
    box-shadow: inset 0 0 0 1px rgba(255,255,255,0.12);
  }
  .sm-workflow-step strong {
    color: var(--text-primary);
    font-size: 0.94rem;
  }
  .sm-workflow-step span {
    color: var(--text-secondary);
    font-size: 0.86rem;
    line-height: 1.45;
  }
  .sm-saved-panel {
    overflow: hidden;
  }
  .sm-saved-panel summary {
    list-style: none;
    padding: 18px 20px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
  }
  .sm-saved-panel summary::-webkit-details-marker { display: none; }
  .sm-saved-count {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 28px;
    height: 28px;
    border-radius: 999px;
    background: rgba(139, 92, 246, 0.16);
    color: #d8b4fe;
    font-weight: 700;
  }
  .sm-saved-body {
    padding: 0 20px 20px;
    display: grid;
    gap: 12px;
  }
  .sm-saved-empty {
    color: var(--text-secondary);
    font-size: 0.92rem;
    padding-top: 4px;
  }
  .sm-saved-item {
    display: grid;
    grid-template-columns: 108px minmax(0, 1fr) auto;
    gap: 14px;
    align-items: center;
    padding: 14px;
    border-radius: 16px;
    border: 1px solid var(--border-color);
    background: rgba(255,255,255,0.02);
  }
  .sm-saved-thumb {
    width: 108px;
    height: 62px;
    border-radius: 14px;
    border: 1px solid rgba(148, 163, 184, 0.28);
    background:
      linear-gradient(45deg, rgba(255,255,255,0.06) 25%, transparent 25%, transparent 75%, rgba(255,255,255,0.06) 75%, rgba(255,255,255,0.06)),
      linear-gradient(45deg, rgba(255,255,255,0.06) 25%, transparent 25%, transparent 75%, rgba(255,255,255,0.06) 75%, rgba(255,255,255,0.06)),
      #ffffff;
    background-position: 0 0, 12px 12px, 0 0;
    background-size: 24px 24px, 24px 24px, auto;
    object-fit: contain;
    padding: 6px;
    box-sizing: border-box;
  }
  .sm-saved-meta strong {
    display: block;
    margin-bottom: 4px;
    font-size: 0.95rem;
  }
  .sm-saved-meta p {
    margin: 0;
    color: var(--text-secondary);
    font-size: 0.86rem;
  }
  .sm-saved-actions {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
    justify-content: flex-end;
  }
  .sm-sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    border: 0;
  }
  @media (min-width: 1420px) {
    .sm-stage {
      grid-template-columns: minmax(0, 1fr) 280px;
    }
    .sm-tip-card {
      position: sticky;
      top: 92px;
    }
  }
  @media (max-width: 1080px) {
    .sm-workflow-steps {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }
  @media (max-width: 900px) {
    .sm-upload-controls {
      grid-template-columns: 1fr;
    }
  }
  @media (max-width: 767px) {
    .sm-panel,
    .sm-preview-block,
    .sm-export-block,
    .sm-workflow {
      padding: 16px;
    }
    .sm-mobile-note {
      display: block;
    }
    .sm-grid-2,
    .sm-font-grid,
    .sm-workflow-steps,
    .sm-saved-item {
      grid-template-columns: 1fr;
    }
    .sm-saved-actions {
      justify-content: flex-start;
    }
    .sm-canvas {
      aspect-ratio: 100 / 34;
      min-height: 200px;
    }
  }
</style>

<div class="tool-workspace-body sm-wrap">
  <div class="sm-surface">
    <div class="sm-tabbar" role="tablist" aria-label="Signature input modes">
      ${MODE_TABS.map((tab, index) => `
        <button class="sm-tab" type="button" role="tab" id="sm-tab-${tab.id}" aria-selected="${state.mode === tab.id ? 'true' : 'false'}" aria-controls="sm-panel-${tab.id}" tabindex="${state.mode === tab.id ? '0' : '-1'}" data-mode-tab="${tab.id}">
          ${tab.label}
        </button>`).join('')}
    </div>

    <div class="sm-stage">
      <section class="sm-panel">
        <div class="sm-mode-panel" id="sm-panel-draw" role="tabpanel" aria-labelledby="sm-tab-draw">
          <p class="sm-mobile-note">Sign with your finger below</p>
          <p class="sm-access-note">For keyboard and screen reader users, Type mode is the accessible signature option.</p>
          <div class="sm-canvas-card" id="sm-draw-shell">
            <div class="sm-canvas-label">Sign here</div>
            <canvas id="sm-draw-canvas" class="sm-canvas sm-draw-canvas" role="img" aria-label="Signature drawing canvas. Use mouse, touch, or keyboard to draw." tabindex="0"></canvas>
          </div>
          <div class="sm-section-stack" style="margin-top:16px">
            <div class="sm-field">
              <span class="sm-label">Ink color</span>
              <div class="sm-color-row" id="sm-draw-colors"></div>
            </div>
            <div class="sm-grid sm-grid-2">
              <div class="sm-field">
                <span class="sm-label">Ink width</span>
                <div class="sm-controls-row" id="sm-width-buttons"></div>
              </div>
              <div class="sm-field">
                <span class="sm-label">Ink style</span>
                <div class="sm-controls-row" id="sm-style-buttons"></div>
              </div>
            </div>
            <div class="sm-note-row">
              <label class="sm-toggle" for="sm-baseline-toggle">
                <input type="checkbox" id="sm-baseline-toggle">
                <span>Show baseline guide</span>
              </label>
            </div>
            <div class="sm-draw-actions">
              <button class="sm-draw-action" type="button" id="sm-undo-btn">Undo</button>
              <button class="sm-draw-action" type="button" id="sm-redo-btn">Redo</button>
              <button class="sm-draw-action" type="button" id="sm-clear-btn" aria-label="Clear signature canvas">Clear Canvas</button>
            </div>
          </div>
        </div>

        <div class="sm-mode-panel" id="sm-panel-type" role="tabpanel" aria-labelledby="sm-tab-type" hidden>
          <div class="sm-grid sm-grid-2">
            <div class="sm-field">
              <label for="sm-type-text">Signature Text</label>
              <input type="text" id="sm-type-text" maxlength="60" placeholder="Your Signature">
            </div>
            <div class="sm-field">
              <label for="sm-type-slant">Slant</label>
              <input type="range" id="sm-type-slant" min="-20" max="20" step="1">
              <span class="sm-note" id="sm-type-slant-value"></span>
            </div>
          </div>
          <div class="sm-note-row" style="margin:14px 0 16px">
            <span class="sm-label">Ink color</span>
            <div class="sm-color-row" id="sm-type-colors"></div>
            <button class="sm-chip" type="button" id="sm-randomize-btn">Randomize</button>
          </div>
          <div class="sm-canvas-card is-white">
            <div class="sm-canvas-label">Typed preview</div>
            <canvas id="sm-type-canvas" class="sm-canvas" aria-hidden="true"></canvas>
          </div>
          <div class="sm-section-stack" style="margin-top:16px">
            <span class="sm-label">Signature-style fonts</span>
            <div class="sm-font-grid" id="sm-font-grid"></div>
          </div>
        </div>

        <div class="sm-mode-panel" id="sm-panel-upload" role="tabpanel" aria-labelledby="sm-tab-upload" hidden>
          <label class="sm-upload-drop" id="sm-upload-drop" for="sm-upload-input">
            <input type="file" id="sm-upload-input" accept=".png,.jpg,.jpeg,.webp">
            <strong>Drop a signature image here or click to browse</strong>
            <p class="sm-note" style="margin-top:8px">PNG, JPG, JPEG, or WebP. Tooliest removes light backgrounds locally in your browser.</p>
          </label>
          <div class="sm-grid sm-grid-2 sm-upload-controls">
            <div class="sm-field sm-upload-field">
              <label for="sm-threshold">Background removal strength</label>
              <input type="range" id="sm-threshold" min="0" max="255" step="1" aria-label="Background removal threshold">
              <span class="sm-note" id="sm-threshold-value"></span>
            </div>
            <div class="sm-field sm-upload-field">
              <span class="sm-label">Before / After</span>
              <div class="sm-controls-row">
                <button class="sm-option-button" type="button" data-upload-view="processed">Processed</button>
                <button class="sm-option-button" type="button" data-upload-view="original">Original</button>
              </div>
              <label class="sm-toggle" for="sm-upload-invert" style="margin-top:10px">
                <input type="checkbox" id="sm-upload-invert">
                <span>Invert colors first</span>
              </label>
            </div>
          </div>
          <div class="sm-draw-actions" style="margin-bottom:16px">
            <button class="sm-draw-action" type="button" id="sm-remove-upload-btn">Remove upload</button>
          </div>
          <div class="sm-canvas-card">
            <div class="sm-canvas-label">Upload cleanup</div>
            <canvas id="sm-upload-canvas" class="sm-canvas" aria-hidden="true"></canvas>
          </div>
        </div>
      </section>

      <aside class="sm-tip-card">
        <h3>Guided Tips</h3>
        <p id="sm-tip-text">${escapeHtml(GUIDED_TIPS[0])}</p>
      </aside>
    </div>

    <section class="sm-preview-block">
      <div class="sm-preview-head">
        <h3>Signature Preview</h3>
        <p>Check how the signature looks on a document, inside an invoice, or in an email footer before you export it.</p>
      </div>
      <div class="sm-preview-tabs" id="sm-preview-tabs">
        ${PREVIEW_CONTEXTS.map((context) => `
          <button class="sm-preview-tab" type="button" data-preview-context="${context.id}">${context.label}</button>
        `).join('')}
      </div>
      <div class="sm-preview-frame" aria-label="Signature preview">
        <div class="sm-preview-scene" id="sm-preview-scene"></div>
      </div>
    </section>

    <section class="sm-export-block">
      <div class="sm-export-head">
        <h3>Export Options</h3>
        <p>Download a transparent PNG, copy it to the clipboard, or export SVG when you need a scalable signature.</p>
      </div>
      <div class="sm-status" id="sm-status" aria-live="assertive"></div>
      <div class="sm-export-options">
        <div class="sm-note-row">
          <label class="sm-toggle" for="sm-export-transparent">
            <input type="checkbox" id="sm-export-transparent">
            <span>Transparent background</span>
          </label>
          <label class="sm-toggle" for="sm-export-white">
            <input type="checkbox" id="sm-export-white">
            <span>White background</span>
          </label>
        </div>
        <div class="sm-field">
          <span class="sm-label">Resolution</span>
          <div class="sm-option-buttons" id="sm-resolution-buttons"></div>
        </div>
        <div class="sm-field">
          <span class="sm-label">Color standardization</span>
          <div class="sm-option-buttons" id="sm-export-color-buttons"></div>
        </div>
        <p class="sm-width-warning" id="sm-width-warning"></p>
      </div>
      <div class="sm-export-actions">
        <button class="btn" type="button" id="sm-download-btn">Download PNG</button>
        <button class="btn btn-secondary" type="button" id="sm-copy-btn">Copy to Clipboard</button>
        <button class="btn btn-secondary" type="button" id="sm-svg-btn">Download SVG</button>
        <button class="btn btn-secondary" type="button" id="sm-photos-btn">Save to Photos</button>
      </div>
      <p class="sm-note">Your signature is generated on this device only. Nothing is uploaded anywhere.</p>
      <p class="sm-privacy-note">Saved signatures live only in this browser. Transparent exports are ideal for invoices, PDFs, and Word documents because the signature sits cleanly on the page.</p>
      <div class="sm-sr-only" id="sm-live-region" aria-live="assertive"></div>
    </section>

    <section class="sm-workflow">
      <h3>Complete Document Workflow</h3>
      <p class="sm-note">This is the highest-value Tooliest path for invoices and signed PDFs. Step 2 is where you are right now.</p>
      <div class="sm-workflow-steps">
        <a class="sm-workflow-step" href="/invoice-generator">
          <strong>Step 1: Create Invoice</strong>
          <span>Draft the invoice, save local business details, and export the PDF.</span>
        </a>
        <a class="sm-workflow-step is-current" href="/signature-maker" aria-current="page">
          <strong>Step 2: Sign It</strong>
          <span>Draw, type, or clean up a signature and export a reusable transparent PNG.</span>
        </a>
        <a class="sm-workflow-step" href="/pdf-compressor">
          <strong>Step 3: Compress the PDF</strong>
          <span>Trim file size before sending the signed document to a client or teammate.</span>
        </a>
        <a class="sm-workflow-step" href="/pdf-protect">
          <strong>Step 4: Protect with Password</strong>
          <span>Lock the signed PDF with a password before sharing sensitive paperwork.</span>
        </a>
      </div>
    </section>

    <details class="sm-saved-panel" id="sm-saved-panel">
      <summary>
        <div>
          <div class="sm-saved-summary-title">Saved Signatures</div>
          <p class="sm-note">Restore one of your recent signatures instantly or download it again.</p>
        </div>
        <span class="sm-saved-count" id="sm-saved-count">0</span>
      </summary>
      <div class="sm-saved-body" id="sm-saved-body"></div>
    </details>
  </div>
</div>`;

      const refs = {
        modeTabs: Array.from(container.querySelectorAll('[data-mode-tab]')),
        modePanels: Array.from(container.querySelectorAll('[role="tabpanel"]')),
        drawShell: container.querySelector('#sm-draw-shell'),
        drawCanvas: container.querySelector('#sm-draw-canvas'),
        typeCanvas: container.querySelector('#sm-type-canvas'),
        uploadCanvas: container.querySelector('#sm-upload-canvas'),
        drawColors: container.querySelector('#sm-draw-colors'),
        typeColors: container.querySelector('#sm-type-colors'),
        widthButtons: container.querySelector('#sm-width-buttons'),
        styleButtons: container.querySelector('#sm-style-buttons'),
        baselineToggle: container.querySelector('#sm-baseline-toggle'),
        undoButton: container.querySelector('#sm-undo-btn'),
        redoButton: container.querySelector('#sm-redo-btn'),
        clearButton: container.querySelector('#sm-clear-btn'),
        typeText: container.querySelector('#sm-type-text'),
        typeSlant: container.querySelector('#sm-type-slant'),
        typeSlantValue: container.querySelector('#sm-type-slant-value'),
        randomizeButton: container.querySelector('#sm-randomize-btn'),
        fontGrid: container.querySelector('#sm-font-grid'),
        uploadDrop: container.querySelector('#sm-upload-drop'),
        uploadInput: container.querySelector('#sm-upload-input'),
        threshold: container.querySelector('#sm-threshold'),
        thresholdValue: container.querySelector('#sm-threshold-value'),
        uploadInvert: container.querySelector('#sm-upload-invert'),
        removeUploadButton: container.querySelector('#sm-remove-upload-btn'),
        uploadViewButtons: Array.from(container.querySelectorAll('[data-upload-view]')),
        previewTabs: Array.from(container.querySelectorAll('[data-preview-context]')),
        previewScene: container.querySelector('#sm-preview-scene'),
        resolutionButtons: container.querySelector('#sm-resolution-buttons'),
        exportColorButtons: container.querySelector('#sm-export-color-buttons'),
        exportTransparent: container.querySelector('#sm-export-transparent'),
        exportWhite: container.querySelector('#sm-export-white'),
        downloadButton: container.querySelector('#sm-download-btn'),
        copyButton: container.querySelector('#sm-copy-btn'),
        svgButton: container.querySelector('#sm-svg-btn'),
        photosButton: container.querySelector('#sm-photos-btn'),
        status: container.querySelector('#sm-status'),
        liveRegion: container.querySelector('#sm-live-region'),
        tipText: container.querySelector('#sm-tip-text'),
        savedPanel: container.querySelector('#sm-saved-panel'),
        savedCount: container.querySelector('#sm-saved-count'),
        savedBody: container.querySelector('#sm-saved-body'),
        widthWarning: container.querySelector('#sm-width-warning'),
      };

      const isTouchFriendly = window.matchMedia('(max-width: 767px)').matches || navigator.maxTouchPoints > 0;
      const isTransparentShell = () => state.export.transparent && !state.export.whiteBackground;

      refs.photosButton.textContent = isTouchFriendly ? 'Save to Photos' : 'Save to Device Library';
      refs.savedPanel.open = Boolean(state.savedOpen);

      [refs.drawCanvas, refs.typeCanvas, refs.uploadCanvas].forEach((canvas) => {
        canvas.width = CANVAS_WIDTH;
        canvas.height = CANVAS_HEIGHT;
      });

      function setStatus(message, type) {
        refs.status.className = `sm-status is-visible ${type === 'error' ? 'is-error' : 'is-success'}`;
        refs.status.textContent = message;
        refs.liveRegion.textContent = message;
      }

      function clearStatus() {
        refs.status.className = 'sm-status';
        refs.status.textContent = '';
      }

      function flashSavedState() {
        refs.liveRegion.textContent = 'Signature settings saved locally.';
      }

      const persistSoon = debounce(() => {
        writeState(state);
        flashSavedState();
      }, SAVE_DEBOUNCE);

      function startTipRotation() {
        if (tipInterval) clearInterval(tipInterval);
        refs.tipText.textContent = GUIDED_TIPS[tipIndex];
        tipInterval = setInterval(() => {
          tipIndex = (tipIndex + 1) % GUIDED_TIPS.length;
          refs.tipText.textContent = GUIDED_TIPS[tipIndex];
        }, TIP_ROTATE_MS);
      }

      function renderColorSwatches(target, currentColor, onClick) {
        target.innerHTML = COLOR_OPTIONS.map((option) => `
          <button class="sm-color-swatch ${currentColor === option.value ? 'is-active' : ''}" type="button" style="color:${option.value}" aria-label="Ink color: ${escapeAttr(option.label)}" data-color-value="${escapeAttr(option.value)}"></button>
        `).join('');
        target.querySelectorAll('[data-color-value]').forEach((button) => {
          button.addEventListener('click', () => onClick(button.dataset.colorValue));
        });
      }

      function renderWidthButtons() {
        refs.widthButtons.innerHTML = WIDTH_OPTIONS.map((option) => `
          <button class="sm-option-button ${state.draw.widthPreset === option.id ? 'is-active' : ''}" type="button" data-width-preset="${option.id}">
            ${option.label}
          </button>
        `).join('');
        refs.widthButtons.querySelectorAll('[data-width-preset]').forEach((button) => {
          button.addEventListener('click', () => {
            state.draw.widthPreset = button.dataset.widthPreset;
            syncControls();
            scheduleDrawRender();
            schedulePreview();
            persistSoon();
          });
        });
      }

      function renderStyleButtons() {
        refs.styleButtons.innerHTML = STYLE_OPTIONS.map((option) => `
          <button class="sm-option-button ${state.draw.style === option.id ? 'is-active' : ''}" type="button" data-style-preset="${option.id}">
            ${option.label}
          </button>
        `).join('');
        refs.styleButtons.querySelectorAll('[data-style-preset]').forEach((button) => {
          button.addEventListener('click', () => {
            state.draw.style = button.dataset.stylePreset;
            syncControls();
            scheduleDrawRender();
            schedulePreview();
            persistSoon();
          });
        });
      }

      function renderResolutionButtons() {
        refs.resolutionButtons.innerHTML = Object.values(EXPORT_RESOLUTIONS).map((option) => `
          <button class="sm-option-button ${state.export.resolution === option.id ? 'is-active' : ''}" type="button" data-resolution="${option.id}">
            ${option.label}
          </button>
        `).join('');
        refs.resolutionButtons.querySelectorAll('[data-resolution]').forEach((button) => {
          button.addEventListener('click', () => {
            state.export.resolution = button.dataset.resolution;
            renderResolutionButtons();
            persistSoon();
          });
        });
      }

      function renderExportColorButtons() {
        refs.exportColorButtons.innerHTML = Object.values(EXPORT_COLORS).map((option) => `
          <button class="sm-option-button ${state.export.color === option.id ? 'is-active' : ''}" type="button" data-export-color="${option.id}">
            ${option.label}
          </button>
        `).join('');
        refs.exportColorButtons.querySelectorAll('[data-export-color]').forEach((button) => {
          button.addEventListener('click', () => {
            state.export.color = button.dataset.exportColor;
            renderExportColorButtons();
            schedulePreview();
            persistSoon();
          });
        });
      }

      function renderFontGrid() {
        const previewText = state.type.text.trim() || 'Your Signature';
        refs.fontGrid.innerHTML = TYPE_FONTS.map((font) => `
          <button class="sm-font-card ${state.type.font === font.id ? 'is-active' : ''}" type="button" data-font-choice="${escapeAttr(font.id)}">
            <span style="font-family:${escapeAttr(font.family)};font-size:1.95rem;line-height:1.1">${escapeHtml(previewText)}</span>
            <small>${escapeHtml(font.id)}</small>
          </button>
        `).join('');
        refs.fontGrid.querySelectorAll('[data-font-choice]').forEach((button) => {
          button.addEventListener('click', async () => {
            state.type.font = button.dataset.fontChoice;
            syncControls();
            renderTypeCanvas();
            schedulePreview();
            persistSoon();
          });
        });
      }

      function syncControls() {
        refs.modeTabs.forEach((tab) => {
          const selected = tab.dataset.modeTab === state.mode;
          tab.setAttribute('aria-selected', selected ? 'true' : 'false');
          tab.tabIndex = selected ? 0 : -1;
        });
        refs.modePanels.forEach((panel) => {
          panel.hidden = panel.id !== `sm-panel-${state.mode}`;
        });

        refs.drawShell.classList.toggle('is-white', state.export.whiteBackground && !state.export.transparent);
        refs.baselineToggle.checked = Boolean(state.draw.baselineEnabled);
        refs.typeText.value = state.type.text;
        refs.typeSlant.value = String(state.type.slant);
        refs.typeSlantValue.textContent = `${state.type.slant > 0 ? '+' : ''}${state.type.slant} degrees`;
        refs.threshold.value = String(state.upload.threshold);
        refs.thresholdValue.textContent = `${state.upload.threshold} / 255`;
        refs.uploadInvert.checked = Boolean(state.upload.invert);
        refs.exportTransparent.checked = Boolean(state.export.transparent);
        refs.exportWhite.checked = Boolean(state.export.whiteBackground);
        refs.previewTabs.forEach((button) => {
          button.classList.toggle('is-active', button.dataset.previewContext === state.previewContext);
        });
        refs.uploadViewButtons.forEach((button) => {
          button.classList.toggle('is-active', state.upload.showOriginal ? button.dataset.uploadView === 'original' : button.dataset.uploadView === 'processed');
        });
        refs.undoButton.disabled = !state.draw.strokes.length;
        refs.redoButton.disabled = !redoStrokes.length;
        refs.svgButton.disabled = state.mode === 'upload';
        refs.svgButton.textContent = state.mode === 'upload' ? 'Download SVG (Draw or Type only)' : 'Download SVG';
        refs.widthWarning.textContent = state.mode === 'upload' && !state.upload.originalData ? 'Upload a signature image to use the cleanup mode.' : '';

        renderColorSwatches(refs.drawColors, state.draw.color, (value) => {
          state.draw.color = value;
          syncControls();
          scheduleDrawRender();
          schedulePreview();
          persistSoon();
        });
        renderColorSwatches(refs.typeColors, state.type.color, (value) => {
          state.type.color = value;
          syncControls();
          renderTypeCanvas();
          schedulePreview();
          persistSoon();
        });
        renderWidthButtons();
        renderStyleButtons();
        renderResolutionButtons();
        renderExportColorButtons();
        renderFontGrid();
      }

      function startGhostLoop() {
        if (ghostRaf) return;
        if (state.mode !== 'draw' || state.draw.guideDismissed || state.draw.strokes.length || currentStroke) return;
        const loop = (timestamp) => {
          ghostRaf = 0;
          renderDrawCanvas(timestamp);
          if (state.mode === 'draw' && !state.draw.guideDismissed && !state.draw.strokes.length && !currentStroke) {
            ghostRaf = requestAnimationFrame(loop);
          }
        };
        ghostRaf = requestAnimationFrame(loop);
      }

      function stopGhostLoop() {
        if (ghostRaf) {
          cancelAnimationFrame(ghostRaf);
          ghostRaf = 0;
        }
      }

      function renderGhostWatermark(ctx, timestamp) {
        const alpha = 0.1 + ((Math.sin(timestamp / 520) + 1) / 2) * 0.08;
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.fillStyle = '#94a3b8';
        ctx.font = '58px cursive';
        ctx.textBaseline = 'middle';
        ctx.fillText('Your Signature', 122, CANVAS_HEIGHT * 0.57);
        ctx.restore();
      }

      function renderBaseline(ctx) {
        ctx.save();
        ctx.setLineDash([10, 8]);
        ctx.lineWidth = 1;
        ctx.strokeStyle = 'rgba(100, 116, 139, 0.55)';
        const y = CANVAS_HEIGHT * 0.6;
        ctx.beginPath();
        ctx.moveTo(22, y);
        ctx.lineTo(CANVAS_WIDTH - 22, y);
        ctx.stroke();
        ctx.restore();
      }

      function renderDrawCanvas(timestamp = performance.now(), targetCanvas = refs.drawCanvas, options = {}) {
        const ctx = targetCanvas.getContext('2d');
        ctx.clearRect(0, 0, targetCanvas.width, targetCanvas.height);

        if (clearAnimation && !options.omitAnimation) {
          const progress = clamp((timestamp - clearAnimation.start) / CLEAR_DURATION, 0, 1);
          if (clearAnimation.image) {
            ctx.drawImage(clearAnimation.image, 0, 0, targetCanvas.width, targetCanvas.height);
          }
          ctx.fillStyle = `rgba(255,255,255,${progress})`;
          ctx.fillRect(0, 0, targetCanvas.width, targetCanvas.height);
          if (progress < 1) {
            scheduleDrawRender();
            return;
          }
          clearAnimation = null;
          ctx.clearRect(0, 0, targetCanvas.width, targetCanvas.height);
        }

        if (!options.omitBaseline && state.draw.baselineEnabled) {
          renderBaseline(ctx);
        }

        state.draw.strokes.forEach((stroke) => drawStroke(ctx, stroke));
        if (currentStroke) drawStroke(ctx, currentStroke);

        if (!options.omitGhost && !state.draw.guideDismissed && !state.draw.strokes.length && !currentStroke) {
          renderGhostWatermark(ctx, timestamp);
        }
      }

      function scheduleDrawRender() {
        if (drawRenderRaf) return;
        drawRenderRaf = requestAnimationFrame((timestamp) => {
          drawRenderRaf = 0;
          renderDrawCanvas(timestamp);
        });
      }

      function pointFromEvent(event) {
        const rect = refs.drawCanvas.getBoundingClientRect();
        return {
          x: ((event.clientX - rect.left) * refs.drawCanvas.width) / rect.width,
          y: ((event.clientY - rect.top) * refs.drawCanvas.height) / rect.height,
          pressure: event.pressure || 0.5,
          time: performance.now(),
        };
      }

      function startStroke(event) {
        if (state.mode !== 'draw') return;
        if (event.button !== undefined && event.button !== 0 && event.pointerType !== 'touch' && event.pointerType !== 'pen') return;
        clearStatus();
        event.preventDefault();
        refs.drawCanvas.focus();
        pointerId = event.pointerId;
        if (refs.drawCanvas.setPointerCapture && event.pointerId !== undefined) {
          try {
            refs.drawCanvas.setPointerCapture(event.pointerId);
          } catch (_) {
            // Some browsers can reject pointer capture on synthetic or secondary events.
          }
        }
        state.draw.guideDismissed = true;
        stopGhostLoop();
        redoStrokes = [];
        const point = pointFromEvent(event);
        currentStroke = normalizeStroke({
          id: uid(),
          color: state.draw.color,
          widthPreset: state.draw.widthPreset,
          style: state.draw.style,
          points: [point],
        });
        scheduleDrawRender();
      }

      function moveStroke(event) {
        if (state.mode !== 'draw' || !currentStroke) return;
        if (pointerId !== null && event.pointerId !== pointerId) return;
        event.preventDefault();
        currentStroke.points.push(pointFromEvent(event));
        scheduleDrawRender();
        schedulePreview();
      }

      function finishStroke(event) {
        if (!currentStroke) return;
        if (pointerId !== null && event.pointerId !== undefined && event.pointerId !== pointerId) return;
        event.preventDefault();
        if (refs.drawCanvas.releasePointerCapture && pointerId !== null) {
          try {
            refs.drawCanvas.releasePointerCapture(pointerId);
          } catch (_) {
            // Ignore browsers that already released capture.
          }
        }
        if (currentStroke.points.length) {
          state.draw.strokes.push(clone(currentStroke));
          state.draw.strokes = state.draw.strokes.slice(-MAX_STROKES);
        }
        currentStroke = null;
        pointerId = null;
        scheduleDrawRender();
        schedulePreview();
        persistSoon();
      }

      function undoStroke() {
        if (!state.draw.strokes.length) return;
        redoStrokes.push(state.draw.strokes.pop());
        redoStrokes = redoStrokes.slice(-MAX_STROKES);
        scheduleDrawRender();
        schedulePreview();
        persistSoon();
        syncControls();
      }

      function redoStroke() {
        if (!redoStrokes.length) return;
        state.draw.strokes.push(redoStrokes.pop());
        state.draw.strokes = state.draw.strokes.slice(-MAX_STROKES);
        scheduleDrawRender();
        schedulePreview();
        persistSoon();
        syncControls();
      }

      function clearCanvasWithFade() {
        if (!state.draw.strokes.length && !currentStroke) return;
        if (!window.confirm('Are you sure? This cannot be undone.')) return;
        const image = new Image();
        image.src = refs.drawCanvas.toDataURL('image/png');
        clearAnimation = { start: performance.now(), image };
        currentStroke = null;
        pointerId = null;
        redoStrokes = [];
        state.draw.strokes = [];
        scheduleDrawRender();
        schedulePreview();
        persistSoon();
        syncControls();
      }

      function paintTypeCanvas(targetCanvas) {
        const ctx = targetCanvas.getContext('2d');
        const option = TYPE_FONTS.find((font) => font.id === state.type.font) || TYPE_FONTS[0];
        const text = state.type.text.trim() || 'Your Signature';
        ctx.clearRect(0, 0, targetCanvas.width, targetCanvas.height);
        ctx.save();
        let fontSize = 72 * state.type.variantScale;
        ctx.font = `${fontSize}px ${option.family}`;
        let metrics = ctx.measureText(text);
        const maxWidth = targetCanvas.width - 84;
        if (metrics.width > maxWidth) {
          fontSize *= maxWidth / metrics.width;
          ctx.font = `${fontSize}px ${option.family}`;
          metrics = ctx.measureText(text);
        }
        const x = Math.max(34, (targetCanvas.width - metrics.width) / 2);
        const y = targetCanvas.height * 0.64;
        ctx.translate(x, y);
        ctx.transform(1, 0, Math.tan(state.type.slant * Math.PI / 180), 1, 0, 0);
        ctx.fillStyle = state.type.color;
        ctx.font = `${fontSize}px ${option.family}`;
        ctx.textBaseline = 'alphabetic';
        ctx.fillText(text, 0, 0);
        ctx.restore();
      }

      function renderTypeCanvas() {
        paintTypeCanvas(refs.typeCanvas);
        const token = ++fontTicket;
        ensureFontLoaded(state.type.font, state.type.text).then(() => {
          if (token !== fontTicket) return;
          paintTypeCanvas(refs.typeCanvas);
          schedulePreview();
        });
      }

      async function ensureUploadImage() {
        if (!state.upload.originalData) {
          uploadImage = null;
          uploadImageSource = '';
          return null;
        }
        if (uploadImage && uploadImageSource === state.upload.originalData) return uploadImage;
        uploadImageSource = state.upload.originalData;
        uploadImage = await loadImage(state.upload.originalData);
        return uploadImage;
      }

      function paintUploadCanvas(targetCanvas, sourceImage, forceProcessed = false) {
        const ctx = targetCanvas.getContext('2d');
        ctx.clearRect(0, 0, targetCanvas.width, targetCanvas.height);
        if (!sourceImage) {
          ctx.save();
          ctx.fillStyle = '#64748b';
          ctx.font = '600 20px Inter, Arial, sans-serif';
          ctx.fillText('Upload a signature image to clean it up', 86, targetCanvas.height * 0.5);
          ctx.restore();
          return;
        }

        const fit = fitContain(sourceImage.width, sourceImage.height, targetCanvas.width, targetCanvas.height, 28);
        if (state.upload.showOriginal && !forceProcessed) {
          ctx.drawImage(sourceImage, fit.x, fit.y, fit.width, fit.height);
          return;
        }

        const scratch = createCanvas(fit.width, fit.height);
        const scratchCtx = scratch.getContext('2d');
        scratchCtx.drawImage(sourceImage, 0, 0, fit.width, fit.height);
        const imageData = scratchCtx.getImageData(0, 0, fit.width, fit.height);
        const data = imageData.data;

        for (let index = 0; index < data.length; index += 4) {
          let red = data[index];
          let green = data[index + 1];
          let blue = data[index + 2];
          const alpha = data[index + 3];
          if (!alpha) continue;

          if (state.upload.invert) {
            red = 255 - red;
            green = 255 - green;
            blue = 255 - blue;
          }

          const luminance = 0.299 * red + 0.587 * green + 0.114 * blue;
          if (luminance > state.upload.threshold) {
            data[index + 3] = 0;
            continue;
          }

          const darkness = clamp((255 - luminance) / 255, 0.2, 1);
          data[index] = 0;
          data[index + 1] = 0;
          data[index + 2] = 0;
          data[index + 3] = Math.round(alpha * darkness);
        }

        scratchCtx.putImageData(imageData, 0, 0);
        ctx.drawImage(scratch, fit.x, fit.y, fit.width, fit.height);
      }

      async function renderUploadCanvas() {
        const ticket = ++uploadTicket;
        try {
          const image = await ensureUploadImage();
          if (ticket !== uploadTicket) return;
          paintUploadCanvas(refs.uploadCanvas, image, false);
          schedulePreview();
        } catch (error) {
          setStatus(String(error && error.message ? error.message : error), 'error');
        }
      }

      async function buildSourceCanvas() {
        const source = createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
        if (state.mode === 'draw') {
          renderDrawCanvas(performance.now(), source, { omitBaseline: true, omitGhost: true, omitAnimation: true });
          return source;
        }
        if (state.mode === 'type') {
          await ensureFontLoaded(state.type.font, state.type.text);
          paintTypeCanvas(source);
          return source;
        }
        const image = await ensureUploadImage();
        paintUploadCanvas(source, image, true);
        return source;
      }

      function recolorCanvas(canvas, hex) {
        if (!hex) return;
        const rgb = toRgb(hex);
        const ctx = canvas.getContext('2d');
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        for (let index = 0; index < data.length; index += 4) {
          if (!data[index + 3]) continue;
          data[index] = rgb.r;
          data[index + 1] = rgb.g;
          data[index + 2] = rgb.b;
        }
        ctx.putImageData(imageData, 0, 0);
      }

      async function createExportCanvas() {
        const source = await buildSourceCanvas();
        const bounds = detectBounds(source);
        if (!bounds) return null;
        const padding = EXPORT_PADDING;
        const cropWidth = bounds.maxX - bounds.minX + 1;
        const cropHeight = bounds.maxY - bounds.minY + 1;
        const scale = EXPORT_RESOLUTIONS[state.export.resolution].scale;
        const output = createCanvas((cropWidth + padding * 2) * scale, (cropHeight + padding * 2) * scale);
        const ctx = output.getContext('2d');
        if (state.export.whiteBackground) {
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, output.width, output.height);
        }
        ctx.drawImage(
          source,
          bounds.minX,
          bounds.minY,
          cropWidth,
          cropHeight,
          padding * scale,
          padding * scale,
          cropWidth * scale,
          cropHeight * scale
        );
        const override = EXPORT_COLORS[state.export.color].value;
        if (override) recolorCanvas(output, override);
        return output;
      }

      async function buildPreviewMarkup() {
        const ticket = ++previewTicket;
        const previewCanvas = await createExportCanvas();
        if (ticket !== previewTicket) return;
        if (!previewCanvas) {
          refs.previewScene.innerHTML = '<p class="sm-note">Add a signature first and the preview will update automatically here.</p>';
          return;
        }

        const dataUrl = previewCanvas.toDataURL('image/png');
        if (state.previewContext === 'document') {
          refs.previewScene.innerHTML = `
            <div class="sm-preview-card sm-preview-doc">
              <h4>Service agreement</h4>
              <p style="margin:0;color:#475569;font-size:0.96rem;line-height:1.6">Signed electronically below to confirm the approved scope, pricing, and delivery window.</p>
              <div class="sm-preview-line">
                <div class="sm-preview-line-label">Authorized Signature</div>
                <img class="sm-preview-signature" src="${escapeAttr(dataUrl)}" alt="Signature on a document preview">
              </div>
            </div>`;
          return;
        }

        if (state.previewContext === 'invoice') {
          refs.previewScene.innerHTML = `
            <div class="sm-preview-card sm-preview-invoice">
              <div class="sm-preview-invoice-head">
                <div>
                  <h4>Invoice approval</h4>
                  <div class="sm-preview-tag">Invoice-ready</div>
                </div>
                <a class="sm-preview-invoice-btn" href="/invoice-generator">Generate an invoice to sign</a>
              </div>
              <div style="height:1px;background:#e2e8f0"></div>
              <div class="sm-preview-line">
                <div class="sm-preview-line-label">Authorized Signature</div>
                <img class="sm-preview-signature" src="${escapeAttr(dataUrl)}" alt="Signature on an invoice preview">
              </div>
            </div>`;
          return;
        }

        refs.previewScene.innerHTML = `
          <div class="sm-preview-card sm-preview-email">
            <div class="sm-preview-email-top">
              <div class="sm-preview-email-bar" style="width:58%"></div>
              <div class="sm-preview-email-bar" style="width:76%"></div>
            </div>
            <div class="sm-preview-email-body">
              <h4>Email footer</h4>
              <p style="margin:0 0 12px;color:#475569;font-size:0.96rem;line-height:1.6">Best regards,</p>
              <img class="sm-preview-signature" src="${escapeAttr(dataUrl)}" alt="Signature in an email preview">
            </div>
          </div>`;
      }

      const schedulePreview = debounce(() => {
        buildPreviewMarkup().catch((error) => {
          console.warn('[Tooliest] Signature preview update failed.', error);
        });
      }, PREVIEW_DEBOUNCE);

      function saveExportedSignature(exportCanvas, mimeType, fileName) {
        const entry = {
          id: uid(),
          mode: state.mode,
          label: buildSignatureLabel(state),
          font: state.mode === 'type' ? state.type.font : '',
          timestamp: new Date().toISOString(),
          thumbnail: createThumbnailData(exportCanvas, state.export.transparent && !state.export.whiteBackground),
          exportData: exportCanvas.toDataURL('image/png'),
          mimeType,
          fileName,
          state: clone(state),
        };
        savedSignatures = [entry, ...savedSignatures.filter((existing) => existing.id !== entry.id)].slice(0, MAX_SAVED_SIGNATURES);
        writeSavedSignatures(savedSignatures);
        renderSavedSignatures();
      }

      async function exportPng({ photoLabel = false } = {}) {
        clearStatus();
        const exportCanvas = await createExportCanvas();
        if (!exportCanvas) {
          setStatus('Add or create a signature before exporting it.', 'error');
          return;
        }
        const blob = await canvasToBlob(exportCanvas, 'image/png');
        if (!blob) {
          setStatus('Could not prepare the PNG export. Please try again.', 'error');
          return;
        }
        const fileName = 'my-signature.png';
        downloadBlob(blob, fileName);
        saveExportedSignature(exportCanvas, 'image/png', fileName);
        setStatus(photoLabel ? 'Signature saved to your device.' : 'Signature downloaded as PNG.', 'success');
      }

      async function copyPngToClipboard() {
        clearStatus();
        const exportCanvas = await createExportCanvas();
        if (!exportCanvas) {
          setStatus('Add or create a signature before copying it.', 'error');
          return;
        }
        const blob = await canvasToBlob(exportCanvas, 'image/png');
        if (!blob) {
          setStatus('Could not prepare the PNG for the clipboard.', 'error');
          return;
        }
        if (!navigator.clipboard || typeof ClipboardItem === 'undefined' || !navigator.clipboard.write) {
          setStatus('PNG clipboard copy is not supported in this browser. Download the PNG instead.', 'error');
          return;
        }
        try {
          await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
          setStatus('Signature PNG copied to the clipboard.', 'success');
        } catch (error) {
          setStatus('Clipboard copy failed. Download the PNG instead.', 'error');
        }
      }

      function buildDrawSvgMarkup(bounds) {
        const width = bounds.maxX - bounds.minX + 1 + EXPORT_PADDING * 2;
        const height = bounds.maxY - bounds.minY + 1 + EXPORT_PADDING * 2;
        const override = EXPORT_COLORS[state.export.color].value;
        const paths = state.draw.strokes.map((stroke) => {
          const points = stroke.points || [];
          if (!points.length) return '';
          const offsetX = bounds.minX - EXPORT_PADDING;
          const offsetY = bounds.minY - EXPORT_PADDING;
          let pathData = `M ${(points[0].x - offsetX).toFixed(2)} ${(points[0].y - offsetY).toFixed(2)}`;
          if (points.length === 1) {
            pathData += ` L ${(points[0].x - offsetX + 0.01).toFixed(2)} ${(points[0].y - offsetY + 0.01).toFixed(2)}`;
          } else if (points.length === 2) {
            pathData += ` L ${(points[1].x - offsetX).toFixed(2)} ${(points[1].y - offsetY).toFixed(2)}`;
          } else {
            for (let index = 1; index < points.length - 1; index += 1) {
              const point = points[index];
              const next = points[index + 1];
              const endPoint = midpoint(point, next);
              pathData += ` Q ${(point.x - offsetX).toFixed(2)} ${(point.y - offsetY).toFixed(2)} ${(endPoint.x - offsetX).toFixed(2)} ${(endPoint.y - offsetY).toFixed(2)}`;
            }
          }
          return `<path d="${pathData}" fill="none" stroke="${escapeAttr(override || stroke.color)}" stroke-width="${widthValue(stroke.widthPreset)}" stroke-linecap="round" stroke-linejoin="round" />`;
        }).join('');
        return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
  ${state.export.whiteBackground ? `<rect width="${width}" height="${height}" fill="#ffffff" />` : ''}
  ${paths}
</svg>`;
      }

      async function buildTypeSvgMarkup() {
        const sourceCanvas = await buildSourceCanvas();
        const bounds = detectBounds(sourceCanvas);
        if (!bounds) return '';
        const width = bounds.maxX - bounds.minX + 1 + EXPORT_PADDING * 2;
        const height = bounds.maxY - bounds.minY + 1 + EXPORT_PADDING * 2;
        const font = TYPE_FONTS.find((option) => option.id === state.type.font) || TYPE_FONTS[0];
        const fill = EXPORT_COLORS[state.export.color].value || state.type.color;
        const fontSize = Math.round(72 * state.type.variantScale);
        const skew = Math.tan(state.type.slant * Math.PI / 180);
        const x = EXPORT_PADDING;
        const y = Math.round(height * 0.7);
        return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
  <defs>${buildTypeFontSvgImport()}</defs>
  ${state.export.whiteBackground ? `<rect width="${width}" height="${height}" fill="#ffffff" />` : ''}
  <text x="${x}" y="${y}" font-family="${escapeAttr(font.id)}" font-size="${fontSize}" fill="${escapeAttr(fill)}" transform="matrix(1 0 ${skew.toFixed(4)} 1 0 0)">${escapeHtml(state.type.text.trim() || 'Your Signature')}</text>
</svg>`;
      }

      async function exportSvg() {
        clearStatus();
        if (state.mode === 'upload') {
          setStatus('SVG export is available for Draw and Type modes only.', 'error');
          return;
        }
        const sourceCanvas = await buildSourceCanvas();
        const bounds = detectBounds(sourceCanvas);
        if (!bounds) {
          setStatus('Create a signature before exporting it as SVG.', 'error');
          return;
        }
        const markup = state.mode === 'draw' ? buildDrawSvgMarkup(bounds) : await buildTypeSvgMarkup();
        const blob = new Blob([markup], { type: 'image/svg+xml;charset=utf-8' });
        downloadBlob(blob, `${sanitizeFileName(buildSignatureLabel(state)) || 'my-signature'}.svg`);
        setStatus('Signature downloaded as SVG.', 'success');
      }

      function renderSavedSignatures() {
        refs.savedCount.textContent = String(savedSignatures.length);
        if (!savedSignatures.length) {
          refs.savedBody.innerHTML = '<p class="sm-saved-empty">Your signatures are stored only on this device. Download one to keep a quick restore copy here.</p>';
          return;
        }

        refs.savedBody.innerHTML = savedSignatures.map((entry) => `
          <div class="sm-saved-item">
            <img class="sm-saved-thumb" src="${escapeAttr(entry.thumbnail)}" alt="${escapeAttr(entry.label)} thumbnail">
            <div class="sm-saved-meta">
              <strong>${escapeHtml(entry.label)}</strong>
              <p>${escapeHtml(entry.mode === 'type' && entry.font ? `${entry.mode} - ${entry.font}` : entry.mode)}</p>
              <p>${escapeHtml(formatSavedDate(entry.timestamp))}</p>
            </div>
            <div class="sm-saved-actions">
              <button class="sm-chip" type="button" data-saved-action="restore" data-saved-id="${escapeAttr(entry.id)}">Restore</button>
              <button class="sm-chip" type="button" data-saved-action="download" data-saved-id="${escapeAttr(entry.id)}">Re-export</button>
              <button class="sm-chip" type="button" data-saved-action="delete" data-saved-id="${escapeAttr(entry.id)}">Delete</button>
            </div>
          </div>
        `).join('');

        refs.savedBody.querySelectorAll('[data-saved-action]').forEach((button) => {
          button.addEventListener('click', async () => {
            const entry = savedSignatures.find((item) => item.id === button.dataset.savedId);
            if (!entry) return;
            if (button.dataset.savedAction === 'delete') {
              savedSignatures = savedSignatures.filter((item) => item.id !== entry.id);
              writeSavedSignatures(savedSignatures);
              renderSavedSignatures();
              return;
            }
            if (button.dataset.savedAction === 'download') {
              const response = await fetch(entry.exportData);
              const blob = await response.blob();
              downloadBlob(blob, entry.fileName || 'my-signature.png');
              setStatus('Saved signature downloaded again.', 'success');
              return;
            }
            state = normalizeState(entry.state);
            redoStrokes = [];
            refs.savedPanel.open = true;
            syncControls();
            if (state.mode === 'draw') {
              scheduleDrawRender();
              startGhostLoop();
            } else if (state.mode === 'type') {
              renderTypeCanvas();
            } else {
              renderUploadCanvas();
            }
            schedulePreview();
            persistSoon();
            setStatus('Saved signature restored.', 'success');
          });
        });
      }

      function syncModeRendering() {
        if (state.mode === 'draw') {
          scheduleDrawRender();
          startGhostLoop();
        } else {
          stopGhostLoop();
        }
        if (state.mode === 'type') {
          renderTypeCanvas();
        }
        if (state.mode === 'upload') {
          renderUploadCanvas();
        }
      }

      refs.modeTabs.forEach((button) => {
        button.addEventListener('click', () => {
          state.mode = button.dataset.modeTab;
          syncControls();
          syncModeRendering();
          schedulePreview();
          persistSoon();
        });
      });

      refs.previewTabs.forEach((button) => {
        button.addEventListener('click', () => {
          state.previewContext = button.dataset.previewContext;
          syncControls();
          schedulePreview();
          persistSoon();
        });
      });

      refs.baselineToggle.addEventListener('change', () => {
        state.draw.baselineEnabled = refs.baselineToggle.checked;
        scheduleDrawRender();
        persistSoon();
      });

      refs.undoButton.addEventListener('click', undoStroke);
      refs.redoButton.addEventListener('click', redoStroke);
      refs.clearButton.addEventListener('click', clearCanvasWithFade);

      refs.drawCanvas.addEventListener('pointerdown', startStroke);
      refs.drawCanvas.addEventListener('pointermove', moveStroke);
      refs.drawCanvas.addEventListener('pointerup', finishStroke);
      refs.drawCanvas.addEventListener('pointerleave', finishStroke);
      refs.drawCanvas.addEventListener('pointercancel', finishStroke);
      refs.drawCanvas.addEventListener('touchmove', (event) => {
        if (state.mode === 'draw') event.preventDefault();
      }, { passive: false });
      refs.drawCanvas.addEventListener('keydown', (event) => {
        if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'z' && !event.shiftKey) {
          event.preventDefault();
          undoStroke();
        } else if ((event.ctrlKey || event.metaKey) && (event.key.toLowerCase() === 'y' || (event.shiftKey && event.key.toLowerCase() === 'z'))) {
          event.preventDefault();
          redoStroke();
        }
      });

      refs.typeText.addEventListener('input', () => {
        state.type.text = refs.typeText.value;
        renderFontGrid();
        renderTypeCanvas();
        schedulePreview();
        persistSoon();
      });

      refs.typeSlant.addEventListener('input', () => {
        state.type.slant = clamp(Number(refs.typeSlant.value) || 0, -20, 20);
        syncControls();
        renderTypeCanvas();
        schedulePreview();
        persistSoon();
      });

      refs.randomizeButton.addEventListener('click', () => {
        const font = TYPE_FONTS[Math.floor(Math.random() * TYPE_FONTS.length)];
        state.type.font = font.id;
        state.type.variantScale = clamp(0.92 + Math.random() * 0.18, 0.8, 1.2);
        state.type.slant = Math.round(-6 + Math.random() * 18);
        syncControls();
        renderTypeCanvas();
        schedulePreview();
        persistSoon();
      });

      refs.uploadDrop.addEventListener('dragover', (event) => {
        event.preventDefault();
        refs.uploadDrop.classList.add('is-dragover');
      });
      refs.uploadDrop.addEventListener('dragleave', () => {
        refs.uploadDrop.classList.remove('is-dragover');
      });
      refs.uploadDrop.addEventListener('drop', (event) => {
        event.preventDefault();
        refs.uploadDrop.classList.remove('is-dragover');
        const file = event.dataTransfer && event.dataTransfer.files && event.dataTransfer.files[0];
        if (file) handleUploadFile(file);
      });
      async function handleUploadFile(file) {
        clearStatus();
        if (!file) return;
        if (!['image/png', 'image/jpeg', 'image/jpg', 'image/webp'].includes(file.type)) {
          setStatus('Upload PNG, JPG, JPEG, or WebP files only.', 'error');
          return;
        }
        if (file.size > MAX_IMAGE_BYTES) {
          setStatus('Uploaded signature images must be 5 MB or smaller.', 'error');
          return;
        }
        setTimeout(async () => {
          try {
            const reader = new FileReader();
            reader.onload = async () => {
              state.upload.originalData = String(reader.result || '');
              state.upload.originalName = file.name;
              state.upload.showOriginal = false;
              syncControls();
              await renderUploadCanvas();
              schedulePreview();
              persistSoon();
              setStatus('Signature image loaded and ready to clean up.', 'success');
            };
            reader.onerror = () => setStatus('Could not read the uploaded image.', 'error');
            reader.readAsDataURL(file);
          } catch (error) {
            setStatus(String(error && error.message ? error.message : error), 'error');
          }
        }, 0);
      }

      refs.uploadInput.addEventListener('change', () => {
        const file = refs.uploadInput.files && refs.uploadInput.files[0];
        if (file) handleUploadFile(file);
      });

      refs.threshold.addEventListener('input', () => {
        state.upload.threshold = clamp(Number(refs.threshold.value) || 180, 0, 255);
        syncControls();
        renderUploadCanvas();
        schedulePreview();
        persistSoon();
      });

      refs.uploadInvert.addEventListener('change', () => {
        state.upload.invert = refs.uploadInvert.checked;
        renderUploadCanvas();
        schedulePreview();
        persistSoon();
      });

      refs.uploadViewButtons.forEach((button) => {
        button.addEventListener('click', () => {
          state.upload.showOriginal = button.dataset.uploadView === 'original';
          syncControls();
          renderUploadCanvas();
          persistSoon();
        });
      });

      refs.removeUploadButton.addEventListener('click', () => {
        state.upload.originalData = '';
        state.upload.originalName = '';
        state.upload.showOriginal = false;
        refs.uploadInput.value = '';
        uploadImage = null;
        uploadImageSource = '';
        syncControls();
        renderUploadCanvas();
        schedulePreview();
        persistSoon();
      });

      refs.exportTransparent.addEventListener('change', () => {
        state.export.transparent = refs.exportTransparent.checked;
        if (state.export.transparent) state.export.whiteBackground = false;
        if (!state.export.transparent && !state.export.whiteBackground) state.export.whiteBackground = true;
        syncControls();
        schedulePreview();
        persistSoon();
      });

      refs.exportWhite.addEventListener('change', () => {
        state.export.whiteBackground = refs.exportWhite.checked;
        if (state.export.whiteBackground) state.export.transparent = false;
        if (!state.export.whiteBackground && !state.export.transparent) state.export.transparent = true;
        syncControls();
        schedulePreview();
        persistSoon();
      });

      refs.downloadButton.addEventListener('click', () => exportPng({ photoLabel: false }));
      refs.photosButton.addEventListener('click', () => exportPng({ photoLabel: true }));
      refs.copyButton.addEventListener('click', copyPngToClipboard);
      refs.svgButton.addEventListener('click', exportSvg);

      refs.savedPanel.addEventListener('toggle', () => {
        state.savedOpen = refs.savedPanel.open;
        persistSoon();
      });

      syncControls();
      renderSavedSignatures();
      startTipRotation();
      warmAllPreviewFonts(state.type.text, () => {
        renderFontGrid();
        renderTypeCanvas();
        schedulePreview();
      });
      syncModeRendering();
      schedulePreview();
    },
  });
})();
