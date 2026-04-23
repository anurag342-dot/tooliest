(function(global){
  'use strict';

  const DEFAULT_SCALE = 0.55;
  const DEFAULT_MAX_EDGE = 420;
  const DEFAULT_BACKGROUND = '#ffffff';
  const DEFAULT_RENDER_SCALE = 1.15;
  const DEFAULT_RENDER_MAX_EDGE = 960;
  const DEFAULT_SCAN_STEP = 2;
  const DEFAULT_WHITE_THRESHOLD = 245;
  const DEFAULT_CROP_PADDING = 18;
  const DEFAULT_FRAME_PADDING = 10;

  function clampPositiveNumber(value, fallback) {
    return Number.isFinite(value) && value > 0 ? value : fallback;
  }

  function fitBox(sourceWidth, sourceHeight, targetWidth, targetHeight) {
    const safeSourceWidth = Math.max(1, sourceWidth);
    const safeSourceHeight = Math.max(1, sourceHeight);
    const scale = Math.min(
      Math.max(0.01, targetWidth / safeSourceWidth),
      Math.max(0.01, targetHeight / safeSourceHeight)
    );
    return {
      width: Math.max(1, Math.round(safeSourceWidth * scale)),
      height: Math.max(1, Math.round(safeSourceHeight * scale)),
    };
  }

  function createCanvas(width, height) {
    if (typeof OffscreenCanvas !== 'undefined') {
      return new OffscreenCanvas(width, height);
    }
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    return canvas;
  }

  function detectContentBounds(ctx, width, height, options) {
    const opts = options || {};
    const step = Math.max(1, Math.floor(clampPositiveNumber(opts.scanStep, DEFAULT_SCAN_STEP)));
    const whiteThreshold = Math.max(0, Math.min(255, Math.floor(clampPositiveNumber(opts.whiteThreshold, DEFAULT_WHITE_THRESHOLD))));
    const cropPadding = Math.max(4, Math.floor(clampPositiveNumber(opts.cropPadding, DEFAULT_CROP_PADDING)));
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;

    let minX = width;
    let minY = height;
    let maxX = -1;
    let maxY = -1;

    for (let y = 0; y < height; y += step) {
      const rowOffset = y * width * 4;
      for (let x = 0; x < width; x += step) {
        const offset = rowOffset + x * 4;
        const alpha = data[offset + 3];
        if (alpha < 8) continue;
        const red = data[offset];
        const green = data[offset + 1];
        const blue = data[offset + 2];
        if (red >= whiteThreshold && green >= whiteThreshold && blue >= whiteThreshold) {
          continue;
        }
        if (x < minX) minX = x;
        if (y < minY) minY = y;
        if (x > maxX) maxX = x;
        if (y > maxY) maxY = y;
      }
    }

    if (maxX < 0 || maxY < 0) {
      return null;
    }

    const x = Math.max(0, minX - cropPadding);
    const y = Math.max(0, minY - cropPadding);
    const right = Math.min(width, maxX + cropPadding + 1);
    const bottom = Math.min(height, maxY + cropPadding + 1);
    return {
      x,
      y,
      width: Math.max(1, right - x),
      height: Math.max(1, bottom - y),
    };
  }

  async function renderPageToCanvas(pdfPage, canvas, options) {
    const opts = options || {};
    const outputScale = clampPositiveNumber(opts.scale, DEFAULT_SCALE);
    const maxEdge = clampPositiveNumber(opts.maxEdge, DEFAULT_MAX_EDGE);
    const renderScale = clampPositiveNumber(
      opts.renderScale,
      Math.max(DEFAULT_RENDER_SCALE, outputScale * 2)
    );
    const renderMaxEdge = clampPositiveNumber(
      opts.renderMaxEdge,
      Math.max(DEFAULT_RENDER_MAX_EDGE, maxEdge * 2)
    );
    const cropWhitespace = opts.cropWhitespace !== false;
    const background = typeof opts.background === 'string' && opts.background ? opts.background : DEFAULT_BACKGROUND;

    let renderViewport = pdfPage.getViewport({ scale: renderScale });
    const renderBiggestEdge = Math.max(renderViewport.width, renderViewport.height);
    if (renderBiggestEdge > renderMaxEdge) {
      renderViewport = pdfPage.getViewport({ scale: renderScale * (renderMaxEdge / renderBiggestEdge) });
    }

    const renderWidth = Math.max(1, Math.ceil(renderViewport.width));
    const renderHeight = Math.max(1, Math.ceil(renderViewport.height));
    const sourceCanvas = createCanvas(renderWidth, renderHeight);
    const sourceCtx = sourceCanvas.getContext('2d', { alpha: false }) || sourceCanvas.getContext('2d');
    if (!sourceCtx) {
      throw new Error('Preview canvas is unavailable.');
    }

    sourceCtx.save();
    sourceCtx.fillStyle = background;
    sourceCtx.fillRect(0, 0, renderWidth, renderHeight);
    sourceCtx.restore();
    if ('imageSmoothingEnabled' in sourceCtx) {
      sourceCtx.imageSmoothingEnabled = true;
    }
    try {
      sourceCtx.imageSmoothingQuality = 'high';
    } catch (_) {}

    await pdfPage.render({
      canvasContext: sourceCtx,
      viewport: renderViewport,
    }).promise;

    let outputViewport = pdfPage.getViewport({ scale: outputScale });
    const outputBiggestEdge = Math.max(outputViewport.width, outputViewport.height);
    if (outputBiggestEdge > maxEdge) {
      outputViewport = pdfPage.getViewport({ scale: outputScale * (maxEdge / outputBiggestEdge) });
    }

    const width = Math.max(1, Math.ceil(outputViewport.width));
    const height = Math.max(1, Math.ceil(outputViewport.height));
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

    const bounds = cropWhitespace
      ? detectContentBounds(sourceCtx, renderWidth, renderHeight, opts)
      : null;
    const sourceBounds = bounds || { x: 0, y: 0, width: renderWidth, height: renderHeight };
    const framePadding = Math.max(6, Math.floor(clampPositiveNumber(opts.framePadding, DEFAULT_FRAME_PADDING)));
    const fitted = fitBox(
      sourceBounds.width,
      sourceBounds.height,
      Math.max(1, width - framePadding * 2),
      Math.max(1, height - framePadding * 2)
    );
    const dx = Math.max(0, Math.round((width - fitted.width) / 2));
    const dy = Math.max(0, Math.round((height - fitted.height) / 2));

    ctx.drawImage(
      sourceCanvas,
      sourceBounds.x,
      sourceBounds.y,
      sourceBounds.width,
      sourceBounds.height,
      dx,
      dy,
      fitted.width,
      fitted.height
    );

    ctx.save();
    ctx.strokeStyle = 'rgba(148,163,184,0.18)';
    ctx.lineWidth = 1;
    ctx.strokeRect(0.5, 0.5, width - 1, height - 1);
    ctx.restore();

    canvas.dataset.previewStatus = 'ready';
    return {
      viewport: outputViewport,
      width,
      height,
      contentBounds: sourceBounds,
    };
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
