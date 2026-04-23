(function(global){
  'use strict';

  const DEFAULT_SCALE = 0.55;
  const DEFAULT_MAX_EDGE = 420;
  const DEFAULT_BACKGROUND = '#ffffff';

  function clampPositiveNumber(value, fallback) {
    return Number.isFinite(value) && value > 0 ? value : fallback;
  }

  async function renderPageToCanvas(pdfPage, canvas, options) {
    const opts = options || {};
    const initialScale = clampPositiveNumber(opts.scale, DEFAULT_SCALE);
    const maxEdge = clampPositiveNumber(opts.maxEdge, DEFAULT_MAX_EDGE);
    const background = typeof opts.background === 'string' && opts.background ? opts.background : DEFAULT_BACKGROUND;

    let viewport = pdfPage.getViewport({ scale: initialScale });
    const biggestEdge = Math.max(viewport.width, viewport.height);
    if (biggestEdge > maxEdge) {
      viewport = pdfPage.getViewport({ scale: initialScale * (maxEdge / biggestEdge) });
    }

    const width = Math.max(1, Math.ceil(viewport.width));
    const height = Math.max(1, Math.ceil(viewport.height));
    const ctx = canvas.getContext('2d', { alpha: false }) || canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Preview canvas is unavailable.');
    }

    canvas.width = width;
    canvas.height = height;
    canvas.dataset.previewStatus = 'rendering';
    canvas.style.background = background;

    ctx.save();
    ctx.fillStyle = background;
    ctx.fillRect(0, 0, width, height);
    ctx.restore();
    if ('imageSmoothingEnabled' in ctx) {
      ctx.imageSmoothingEnabled = true;
    }
    try {
      ctx.imageSmoothingQuality = 'high';
    } catch (_) {}

    await pdfPage.render({
      canvasContext: ctx,
      viewport,
    }).promise;

    canvas.dataset.previewStatus = 'ready';
    return { viewport, width, height };
  }

  function drawFallback(canvas, options) {
    const opts = options || {};
    const width = clampPositiveNumber(opts.width, 160);
    const height = clampPositiveNumber(opts.height, 226);
    const label = typeof opts.label === 'string' && opts.label ? opts.label : 'Preview unavailable';
    const detail = typeof opts.detail === 'string' && opts.detail ? opts.detail : 'Open the file to continue.';
    const ctx = canvas.getContext('2d', { alpha: false }) || canvas.getContext('2d');

    canvas.width = width;
    canvas.height = height;
    canvas.dataset.previewStatus = 'fallback';
    canvas.style.background = '#ffffff';

    if (!ctx) {
      return;
    }

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);

    ctx.strokeStyle = 'rgba(139,92,246,0.2)';
    ctx.lineWidth = 2;
    ctx.strokeRect(8, 8, width - 16, height - 16);

    ctx.fillStyle = '#cbd5e1';
    ctx.font = '600 32px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('PDF', width / 2, Math.max(56, Math.round(height * 0.34)));

    ctx.fillStyle = '#475569';
    ctx.font = '600 13px Inter, Arial, sans-serif';
    ctx.fillText(label, width / 2, Math.round(height * 0.64));

    ctx.fillStyle = '#64748b';
    ctx.font = '12px Inter, Arial, sans-serif';
    ctx.fillText(detail, width / 2, Math.round(height * 0.72));
  }

  global.TooliestPdfPreview = {
    renderPageToCanvas,
    drawFallback,
  };
})(window);
