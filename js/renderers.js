// ============================================
// TOOLIEST.COM — Tool Renderers (All 55 tools)
// ============================================

const TOOL_RENDERER_CHUNKS = {
  'renderers2.min.js': [
    'css-minifier', 'css-beautifier', 'gradient-generator', 'box-shadow-generator',
    'flexbox-playground', 'css-animation-generator', 'color-picker', 'palette-generator',
    'contrast-checker', 'hex-to-rgb', 'color-blindness-sim', 'image-compressor',
    'image-resizer', 'image-cropper', 'image-to-base64', 'base64-to-image',
    'image-converter',
  ],
  'renderers3.min.js': [
    'json-formatter', 'json-validator', 'json-minifier', 'json-to-csv', 'csv-to-json',
    'html-minifier', 'html-beautifier', 'html-entity-encoder', 'html-table-generator',
    'markdown-to-html', 'js-minifier', 'js-beautifier', 'regex-tester', 'js-obfuscator',
    'unit-converter', 'temperature-converter', 'number-base-converter', 'timezone-converter',
    'base64-encoder', 'url-encoder', 'jwt-decoder', 'hash-generator',
  ],
  'renderers4.min.js': [
    'twitter-counter', 'instagram-caption', 'hashtag-generator', 'youtube-thumbnail',
    'password-security-suite', 'uuid-generator', 'fake-data-generator', 'ai-text-summarizer',
    'ai-paraphraser', 'ai-email-writer', 'ai-blog-ideas', 'ai-meta-writer',
    'cron-parser', 'diff-checker', 'sql-formatter', 'chmod-calculator', 'image-exif-stripper',
    'qr-code-generator',
  ],
  'renderers5.min.js': [
    'loan-mortgage-analyzer', 'compound-interest', 'sip-calculator', 'retirement-calculator',
    'roi-calculator', 'debt-payoff', 'inflation-calculator', 'percentage-calculator',
    'age-calculator', 'tip-calculator', 'bmi-calculator',
  ],
  'renderers6.min.js': ['audio-converter'],
};

const TOOL_RENDERER_CHUNK_MAP = Object.entries(TOOL_RENDERER_CHUNKS).reduce((map, [chunkFile, toolIds]) => {
  toolIds.forEach((toolId) => {
    map[toolId] = chunkFile;
  });
  return map;
}, {});

const ToolRenderers = {
  rendererChunkMap: TOOL_RENDERER_CHUNK_MAP,
  loadedRendererChunks: new Set(),
  loadingRendererChunks: new Map(),
  accessibleLabelCounter: 0,

  getSafeErrorMessage(error) {
    return String(error && error.message ? error.message : error || 'Unknown error')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  },

  renderLoadingState(container, message = 'This tool is loading...') {
    container.innerHTML = `<div class="tool-workspace-body" style="text-align:center;padding:40px">
      <p style="font-size:0.9rem;letter-spacing:0.08em;text-transform:uppercase;margin-bottom:12px;color:var(--text-tertiary)">Loading</p>
      <p style="color:var(--text-secondary)">${this.escapeHtml(message)}</p>
    </div>`;
  },

  renderErrorState(container, error, toolId) {
    const safeMessage = this.getSafeErrorMessage(error);
    // [TOOLIEST AUDIT WARN-02] Log error details to console for easier diagnosis.
    if (toolId) console.error('[Tooliest] Tool render failed:', toolId, error);
    const repoUrl = typeof TOOLIEST_REPOSITORY_URL !== 'undefined' ? TOOLIEST_REPOSITORY_URL : 'https://github.com/anurag342-dot/tooliest';
    const issueTitle = encodeURIComponent(`Tool render error${toolId ? ': ' + toolId : ''}`);
    const issueBody = encodeURIComponent(`**Tool:** ${toolId || 'unknown'}\n**Error:** ${safeMessage}\n**Steps to reproduce:** [describe what you did]\n**Browser:** [your browser and version]`);
    const bugUrl = `${repoUrl}/issues/new?title=${issueTitle}&body=${issueBody}`;
    container.innerHTML = `<div class="tool-workspace-body" style="text-align:center;padding:40px">
      <p style="font-size:1.6rem;margin-bottom:8px">⚠️</p>
      <p style="font-size:0.9rem;letter-spacing:0.08em;text-transform:uppercase;margin-bottom:12px;color:var(--accent-tertiary)">Tool Error</p>
      <p style="color:var(--text-secondary);margin-bottom:8px">Something went wrong loading this tool.</p>
      <p style="color:var(--text-tertiary);font-size:0.85rem;margin-bottom:20px">Error: ${safeMessage}</p>
      <div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap;">
        <button class="btn btn-secondary" onclick="location.reload()">↺ Reload Page</button>
        <a href="${bugUrl}" target="_blank" rel="noopener noreferrer" class="btn btn-secondary" style="text-decoration:none">🐛 Report Bug</a>
      </div>
    </div>`;
  },

  async loadRendererChunk(chunkFile) {
    if (!chunkFile) return;
    if (this.loadedRendererChunks.has(chunkFile)) return;
    if (this.loadingRendererChunks.has(chunkFile)) {
      await this.loadingRendererChunks.get(chunkFile);
      return;
    }

    const version = typeof TOOLIEST_ASSET_VERSION === 'string' ? TOOLIEST_ASSET_VERSION : '20260417v17';
    const chunkPromise = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      // [TOOLIEST AUDIT] Lazy-load non-core renderer chunks so the first render ships a much smaller JS payload.
      script.src = `/js/${chunkFile}?v=${encodeURIComponent(version)}`;
      script.async = true;
      script.dataset.tooliestRendererChunk = chunkFile;
      script.onload = () => {
        this.loadedRendererChunks.add(chunkFile);
        this.loadingRendererChunks.delete(chunkFile);
        resolve();
      };
      script.onerror = () => {
        this.loadingRendererChunks.delete(chunkFile);
        reject(new Error(`Failed to load renderer chunk: ${chunkFile}`));
      };
      document.head.appendChild(script);
    });

    this.loadingRendererChunks.set(chunkFile, chunkPromise);
    await chunkPromise;
  },
  disconnectAccessibleLabelObserver(container) {
    if (container?.__tooliestLabelObserver) {
      container.__tooliestLabelObserver.disconnect();
      delete container.__tooliestLabelObserver;
    }
  },

  ensureAccessibleLabels(container) {
    if (!container) return;
    const linkVisibleLabels = () => {
      container.querySelectorAll('.input-group').forEach((group) => {
        const label = group.querySelector('label:not(.checkbox-label):not([for])');
        if (!label) return;
        const control = group.querySelector('input:not([type="hidden"]), textarea, select');
        if (!control || label.closest('.checkbox-label')) return;
        if (!control.id) {
          this.accessibleLabelCounter += 1;
          control.id = `tooliest-field-${this.accessibleLabelCounter}`;
        }
        label.setAttribute('for', control.id);
      });
    };

    this.disconnectAccessibleLabelObserver(container);
    linkVisibleLabels();

    if (typeof MutationObserver !== 'function') return;
    let rafId = 0;
    const observer = new MutationObserver(() => {
      if (rafId) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        rafId = 0;
        linkVisibleLabels();
      });
    });
    observer.observe(container, { childList: true, subtree: true });
    container.__tooliestLabelObserver = observer;
  },

  async render(toolId, container) {
    this.disconnectAccessibleLabelObserver(container);
    container.dataset.tooliestRendererToolId = toolId;
    let rendererFn = this.renderers[toolId];
    const chunkFile = this.rendererChunkMap[toolId];

    if (!rendererFn && chunkFile) {
      this.renderLoadingState(container);
      try {
        await this.loadRendererChunk(chunkFile);
      } catch (err) {
        console.error('[Tooliest] Error loading renderer chunk:', toolId, err);
      this.renderErrorState(container, err, toolId);
        return;
      }

      if (!container.isConnected || container.dataset.tooliestRendererToolId !== toolId) {
        return;
      }
      rendererFn = this.renderers[toolId];
    }

    if (!rendererFn) {
      this.renderErrorState(container, 'Tool renderer not found.', toolId);
      return;
    }

    try {
      rendererFn(container);
      this.ensureAccessibleLabels(container);
      App.setupAutoSave('tool-input', toolId);
    } catch (err) {
      console.error('[Tooliest] Error rendering tool:', toolId, err);
      this.renderErrorState(container, err, toolId);
    }
    return;
    /*
        console.error('[Tooliest] Error rendering tool:', toolId, err);
        const safeMessage = String(err && err.message ? err.message : 'Unknown error')
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;');
        container.innerHTML = `<div class="tool-workspace-body" style="text-align:center;padding:40px">
          <p style="font-size:1.5rem;margin-bottom:12px">⚠️</p>
          <p style="color:var(--text-secondary);margin-bottom:8px">Something went wrong loading this tool.</p>
          <p style="color:var(--text-tertiary);font-size:0.85rem">Error: ${safeMessage}</p>
          <button class="btn btn-secondary" style="margin-top:16px" onclick="location.reload()">Reload Page</button>
        </div>`;
      }
    } else {
      container.innerHTML = '<div class="tool-workspace-body"><p style="color:var(--text-tertiary);text-align:center;padding:40px">This tool is loading...</p></div>';
    }
    */
  },

  // Helper to build standard tool layout
  layout(container, inputHTML, outputHTML, actionBtn, onAction) {
    container.innerHTML = `
      <div class="tool-workspace-body">
        <div class="input-group">${inputHTML}</div>
        <div class="flex gap-2 flex-wrap mb-4">${actionBtn}</div>
        <div class="input-group"><label>Result</label><div class="output-area empty" id="tool-output"><button class="copy-btn hidden" id="copy-btn" onclick="copyToClipboard(document.getElementById('tool-output').innerText, this)">Copy</button>Your output will appear here</div></div>
        <div class="result-stats" id="result-stats"></div>
      </div>`;
    container.querySelector('.btn-primary')?.addEventListener('click', (event) => {
      const start = performance.now();
      onAction();
      if (typeof App !== 'undefined' && typeof App.recordToolPerformance === 'function') {
        App.recordToolPerformance(App.activeToolId, event.currentTarget.textContent || 'Tool action', performance.now() - start);
      }
    });
  },

  setOutput(text, stats) {
    const out = document.getElementById('tool-output');
    const copyBtn = document.getElementById('copy-btn');
    if (out) { out.classList.remove('empty'); out.textContent = text; if (copyBtn) { copyBtn.classList.remove('hidden'); out.appendChild(copyBtn); } }
    if (stats) {
      const el = document.getElementById('result-stats');
      if (el) el.innerHTML = Object.entries(stats).map(([k,v]) => `<div class="stat-card"><div class="stat-num">${v}</div><div class="stat-lbl">${k}</div></div>`).join('');
    }
  },

  escapeHtml(value = '') {
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  },

  escapeAttr(value = '') {
    return this.escapeHtml(value);
  },

  // [TOOLIEST AUDIT] Only reuse safe http(s) URLs when previewing user-provided links or images.
  sanitizeHttpUrl(value = '', allowRelative = true) {
    const input = String(value || '').trim();
    if (!input) return '';
    try {
      const url = allowRelative ? new URL(input, window.location.origin) : new URL(input);
      return ['http:', 'https:'].includes(url.protocol) ? url.href : '';
    } catch (_) {
      return '';
    }
  },

  renderers: {
    // ===== TEXT TOOLS =====
    'word-counter'(c) {
      c.innerHTML = `<div class="tool-workspace-body">
        <div class="input-group"><label>Enter or paste your text</label><textarea id="wc-input" rows="8" placeholder="Type or paste your text here..."></textarea></div>
        <div class="result-stats" id="wc-stats"></div></div>`;
      const inp = document.getElementById('wc-input');
      const update = () => {
        const t = inp.value;
        const words = t.trim() ? t.trim().split(/\s+/).length : 0;
        const chars = t.length;
        const charsNoSpace = t.replace(/\s/g, '').length;
        const sentenceBreaks = t.match(/(?:[.!?…]+|;+(?=\s|$)|(?:--|—)+(?=\s+[A-Z0-9]))/g);
        const sentences = t.trim() ? (sentenceBreaks || []).length || 1 : 0;
        const paragraphs = t.trim() ? t.split(/\n\s*\n/).filter(p => p.trim()).length : 0;
        const readTime = words === 0 ? 0 : Math.max(1, Math.ceil(words / 200));
        document.getElementById('wc-stats').innerHTML = [
          ['Words', words], ['Characters', chars], ['No Spaces', charsNoSpace],
          ['Sentences', sentences], ['Paragraphs', paragraphs], ['Read Time', readTime + ' min']
        ].map(([l,v]) => `<div class="stat-card"><div class="stat-num">${v}</div><div class="stat-lbl">${l}</div></div>`).join('');
      };
      inp.addEventListener('input', update);
      App.setupAutoSave('wc-input', 'word_counter');
      update();
    },

    'character-counter'(c) {
      c.innerHTML = `<div class="tool-workspace-body">
        <div class="input-group"><label>Enter text to count characters</label><textarea id="cc-input" rows="6" placeholder="Type or paste text..."></textarea></div>
        <div class="result-stats" id="cc-stats"></div>
        <div class="mt-4" id="cc-limits"></div></div>`;
      const inp = document.getElementById('cc-input');
      const limits = [['Twitter/X', 280], ['Instagram', 2200], ['Facebook', 63206], ['LinkedIn', 3000], ['YouTube Title', 100], ['Meta Title', 60], ['Meta Description', 160]];
      const update = () => {
        const t = inp.value;
        document.getElementById('cc-stats').innerHTML = [
          ['Characters', t.length], ['Without Spaces', t.replace(/\s/g,'').length], ['Words', t.trim() ? t.trim().split(/\s+/).length : 0], ['Lines', t ? t.split('\n').length : 0]
        ].map(([l,v]) => `<div class="stat-card"><div class="stat-num">${v}</div><div class="stat-lbl">${l}</div></div>`).join('');
        document.getElementById('cc-limits').innerHTML = '<label style="font-size:0.85rem;color:var(--text-secondary);margin-bottom:8px;display:block">Platform Limits</label>' + limits.map(([name, max]) => {
          const pct = Math.min(100, (t.length / max) * 100);
          const color = pct > 100 ? '#f43f5e' : pct > 80 ? '#f59e0b' : '#10b981';
          return `<div style="display:flex;align-items:center;gap:10px;margin-bottom:6px;font-size:0.85rem">
            <span style="width:130px;color:var(--text-secondary)">${name}</span>
            <div style="flex:1;height:6px;background:var(--bg-tertiary);border-radius:99px;overflow:hidden"><div style="height:100%;width:${pct}%;background:${color};border-radius:99px;transition:width 0.3s"></div></div>
            <span style="width:70px;text-align:right;color:${color};font-family:var(--font-mono);font-size:0.8rem">${t.length}/${max}</span></div>`;
        }).join('');
      };
      inp.addEventListener('input', update); 
      App.setupAutoSave('cc-input', 'char_counter');
      update();
    },

    'case-converter'(c) {
      c.innerHTML = `<div class="tool-workspace-body">
        <div class="input-group"><label>Enter text to convert</label><textarea id="tc-input" rows="5" placeholder="Type your text here..."></textarea></div>
        <div class="flex gap-2 flex-wrap mb-4">
          <button class="btn btn-primary btn-sm" data-case="upper">UPPERCASE</button>
          <button class="btn btn-secondary btn-sm" data-case="lower">lowercase</button>
          <button class="btn btn-secondary btn-sm" data-case="title">Title Case</button>
          <button class="btn btn-secondary btn-sm" data-case="sentence">Sentence case</button>
          <button class="btn btn-secondary btn-sm" data-case="camel">camelCase</button>
          <button class="btn btn-secondary btn-sm" data-case="snake">snake_case</button>
          <button class="btn btn-secondary btn-sm" data-case="kebab">kebab-case</button>
          <button class="btn btn-secondary btn-sm" data-case="pascal">PascalCase</button>
          <button class="btn btn-secondary btn-sm" data-case="toggle">tOGGLE</button>
        </div>
        <div class="input-group"><label>Result</label><div class="output-area empty" id="tool-output"><button class="copy-btn hidden" id="copy-btn">Copy</button>Converted text appears here</div></div></div>`;
      const inp = document.getElementById('tc-input');
      const out = document.getElementById('tool-output');
      const copyBtn = document.getElementById('copy-btn');
      const convert = (type) => {
        const t = inp.value; if(!t) return;
        let r = '';
        switch(type) {
          case 'upper': r = t.toUpperCase(); break;
          case 'lower': r = t.toLowerCase(); break;
          case 'title': r = t.replace(/\w\S*/g, w => w.charAt(0).toUpperCase() + w.substr(1).toLowerCase()); break;
          case 'sentence': r = t.toLowerCase().replace(/(^\s*\w|[.!?]\s+\w)/g, m => m.toUpperCase()); break;
          case 'camel': r = t.toLowerCase().replace(/[^a-zA-Z0-9]+(.)/g, (m,ch) => ch.toUpperCase()); break;
          case 'snake': r = t.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, ''); break;
          case 'kebab': r = t.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''); break;
          case 'pascal': r = t.replace(/\w\S*/g, w => w.charAt(0).toUpperCase() + w.substr(1).toLowerCase()).replace(/\s+/g, ''); break;
          case 'toggle': r = t.split('').map(ch => ch === ch.toUpperCase() ? ch.toLowerCase() : ch.toUpperCase()).join(''); break;
        }
        out.classList.remove('empty'); out.textContent = r; 
        copyBtn.classList.remove('hidden'); out.appendChild(copyBtn);
      };
      c.querySelectorAll('[data-case]').forEach(btn => btn.addEventListener('click', () => convert(btn.dataset.case)));
      copyBtn.addEventListener('click', () => copyToClipboard(out.textContent, copyBtn));
      App.setupAutoSave('tc-input', 'case_converter');
    },

    'lorem-ipsum'(c) {
      const words = 'lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor incididunt ut labore et dolore magna aliqua ut enim ad minim veniam quis nostrud exercitation ullamco laboris nisi aliquip ex ea commodo consequat duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur excepteur sint occaecat cupidatat non proident sunt in culpa qui officia deserunt mollit anim id est laborum'.split(' ');
      c.innerHTML = `<div class="tool-workspace-body">
        <div class="flex gap-4 flex-wrap mb-4">
          <div class="input-group" style="flex:1;min-width:120px"><label>Count</label><input type="number" id="li-count" value="3" min="1" max="100"></div>
          <div class="input-group" style="flex:1;min-width:150px"><label>Type</label><select id="li-type"><option value="paragraphs">Paragraphs</option><option value="sentences">Sentences</option><option value="words">Words</option></select></div>
        </div>
        <button class="btn btn-primary mb-4" id="li-gen">Generate Lorem Ipsum</button>
        <div class="input-group"><label>Generated Text</label><div class="output-area empty" id="tool-output"><button class="copy-btn hidden" id="copy-btn">Copy</button>Click generate to create text</div></div></div>`;
      const gen = () => {
        const count = parseInt(document.getElementById('li-count').value) || 3;
        const type = document.getElementById('li-type').value;
        let result = '';
        const randWord = () => words[Math.floor(Math.random() * words.length)];
        const randSentence = () => {
          const len = 8 + Math.floor(Math.random() * 12);
          let s = Array.from({length: len}, randWord).join(' ');
          return s.charAt(0).toUpperCase() + s.slice(1) + '.';
        };
        if (type === 'words') result = Array.from({length: count}, randWord).join(' ');
        else if (type === 'sentences') result = Array.from({length: count}, randSentence).join(' ');
        else result = Array.from({length: count}, () => Array.from({length: 3 + Math.floor(Math.random() * 4)}, randSentence).join(' ')).join('\n\n');
        const out = document.getElementById('tool-output');
        const btn = document.getElementById('copy-btn');
        out.classList.remove('empty'); out.textContent = result; btn.classList.remove('hidden'); out.appendChild(btn);
      };
      document.getElementById('li-gen').addEventListener('click', gen);
      document.getElementById('copy-btn').addEventListener('click', function() { copyToClipboard(document.getElementById('tool-output').textContent, this); });
    },

    'text-reverser'(c) {
      ToolRenderers.layout(c,
        '<label>Enter text to reverse</label><textarea id="tool-input" rows="5" placeholder="Type text here..."></textarea>',
        '', '<button class="btn btn-primary">Reverse Text</button> <button class="btn btn-secondary" id="rev-words">Reverse Words</button> <button class="btn btn-secondary" id="rev-each">Reverse Each Word</button>',
        () => { const t = document.getElementById('tool-input').value; if(t) ToolRenderers.setOutput(t.split('').reverse().join('')); }
      );
      document.getElementById('rev-words')?.addEventListener('click', () => { const t = document.getElementById('tool-input').value; if(t) ToolRenderers.setOutput(t.split(/\s+/).reverse().join(' ')); });
      document.getElementById('rev-each')?.addEventListener('click', () => { const t = document.getElementById('tool-input').value; if(t) ToolRenderers.setOutput(t.split(/\s+/).map(w => w.split('').reverse().join('')).join(' ')); });
    },

    'remove-duplicates'(c) {
      ToolRenderers.layout(c,
        '<label>Paste lines (one per line)</label><textarea id="tool-input" rows="8" placeholder="Line 1\nLine 2\nLine 1\nLine 3..."></textarea>',
        '', '<button class="btn btn-primary">Remove Duplicates</button>',
        () => {
          const lines = document.getElementById('tool-input').value.split('\n');
          const unique = [...new Set(lines)];
          ToolRenderers.setOutput(unique.join('\n'), {'Original': lines.length, 'Unique': unique.length, 'Removed': lines.length - unique.length});
        }
      );
    },

    'slug-generator'(c) {
      c.innerHTML = `<div class="tool-workspace-body">
        <div class="input-group"><label>Enter text to convert to slug</label><input type="text" id="slug-input" placeholder="My Awesome Blog Post Title"></div>
        <div class="input-group"><label>URL Slug</label><div class="output-area" id="tool-output" style="min-height:50px;font-size:1.1rem"><button class="copy-btn" id="copy-btn">Copy</button>your-slug-appears-here</div></div></div>`;
      const inp = document.getElementById('slug-input');
      const update = () => {
        const slug = inp.value.toLowerCase().trim().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
        const out = document.getElementById('tool-output');
        const btn = document.getElementById('copy-btn');
        out.textContent = slug || 'your-slug-appears-here'; out.appendChild(btn);
      };
      inp.addEventListener('input', update);
      document.getElementById('copy-btn').addEventListener('click', function() { copyToClipboard(document.getElementById('tool-output').textContent, this); });
    },

    'string-encoder'(c) {
      c.innerHTML = `<div class="tool-workspace-body">
        <div class="input-group"><label>Enter text</label><textarea id="tool-input" rows="4" placeholder="Enter text to encode/decode..."></textarea></div>
        <div class="input-group"><label>Encoding</label><select id="enc-type"><option value="base64">Base64</option><option value="url">URL Encode</option><option value="html">HTML Entities</option><option value="binary">Binary</option><option value="hex">Hexadecimal</option></select></div>
        <div class="flex gap-2 mb-4"><button class="btn btn-primary" id="enc-btn">Encode</button><button class="btn btn-secondary" id="dec-btn">Decode</button></div>
        <div class="input-group"><label>Result</label><div class="output-area empty" id="tool-output"><button class="copy-btn hidden" id="copy-btn">Copy</button>Result appears here</div></div></div>`;
      const process = (encode) => {
        const t = document.getElementById('tool-input').value;
        const type = document.getElementById('enc-type').value;
        let r = '';
        try {
          if (type === 'base64') r = encode ? btoa(unescape(encodeURIComponent(t))) : decodeURIComponent(escape(atob(t)));
          else if (type === 'url') r = encode ? encodeURIComponent(t) : decodeURIComponent(t);
          else if (type === 'html') {
            if (encode) { const d = document.createElement('div'); d.textContent = t; r = d.innerHTML; }
            else {
              // [TOOLIEST AUDIT] Decode HTML entities without touching live DOM via innerHTML.
              const doc = new DOMParser().parseFromString(t, 'text/html');
              r = doc.body.textContent || '';
            }
          }
          else if (type === 'binary') r = encode ? t.split('').map(c => c.charCodeAt(0).toString(2).padStart(8,'0')).join(' ') : t.split(' ').map(b => String.fromCharCode(parseInt(b,2))).join('');
          else if (type === 'hex') r = encode ? t.split('').map(c => c.charCodeAt(0).toString(16).padStart(2,'0')).join(' ') : t.split(' ').map(h => String.fromCharCode(parseInt(h,16))).join('');
        } catch(e) { r = 'Error: Invalid input for decoding'; }
        const out = document.getElementById('tool-output');
        const btn = document.getElementById('copy-btn');
        out.classList.remove('empty'); out.textContent = r; btn.classList.remove('hidden'); out.appendChild(btn);
      };
      document.getElementById('enc-btn').addEventListener('click', () => process(true));
      document.getElementById('dec-btn').addEventListener('click', () => process(false));
      document.getElementById('copy-btn').addEventListener('click', function() { copyToClipboard(document.getElementById('tool-output').textContent, this); });
    },

    // ===== SEO TOOLS =====
    'meta-tag-generator'(c) {
      c.innerHTML = `<div class="tool-workspace-body">
        <div class="input-group"><label>Page Title</label><input type="text" id="mt-title" placeholder="My Amazing Web Page" maxlength="70"></div>
        <div class="input-group"><label>Description</label><textarea id="mt-desc" rows="3" placeholder="A brief description of your page..." maxlength="160"></textarea></div>
        <div class="input-group"><label>Keywords (comma separated)</label><input type="text" id="mt-keywords" placeholder="web tools, seo, free tools"></div>
        <div class="input-group"><label>URL</label><input type="url" id="mt-url" placeholder="https://example.com/page"></div>
        <div class="input-group"><label>Author</label><input type="text" id="mt-author" placeholder="Your Name"></div>
        <div class="flex gap-2 mb-4"><button class="btn btn-primary" id="mt-gen">✨ Generate Meta Tags</button><button class="btn btn-secondary" id="mt-ai">🤖 AI Suggest Description</button></div>
        <div class="input-group"><label>Generated HTML</label><div class="output-area empty" id="tool-output" style="white-space:pre-wrap"><button class="copy-btn hidden" id="copy-btn">Copy</button></div></div></div>`;
      document.getElementById('mt-gen').addEventListener('click', () => {
        const titleValue = document.getElementById('mt-title').value || 'Untitled';
        const descValue = document.getElementById('mt-desc').value || '';
        const keywordsValue = document.getElementById('mt-keywords').value || '';
        const urlValue = document.getElementById('mt-url').value || '';
        const authorValue = document.getElementById('mt-author').value || '';
        const safeTitleText = ToolRenderers.escapeHtml(titleValue);
        const safeTitleAttr = ToolRenderers.escapeAttr(titleValue);
        const safeDescAttr = ToolRenderers.escapeAttr(descValue);
        const safeKeywordsAttr = ToolRenderers.escapeAttr(keywordsValue);
        const safeUrlAttr = ToolRenderers.escapeAttr(urlValue);
        const safeAuthorAttr = ToolRenderers.escapeAttr(authorValue);

        // [TOOLIEST AUDIT] Escape all user-provided values before building preview markup.
        let html = `<!-- Primary Meta Tags -->\n<title>${safeTitleText}</title>\n<meta name="title" content="${safeTitleAttr}">\n<meta name="description" content="${safeDescAttr}">`;
        if (keywordsValue) html += `\n<meta name="keywords" content="${safeKeywordsAttr}">`;
        if (authorValue) html += `\n<meta name="author" content="${safeAuthorAttr}">`;
        html += `\n\n<!-- Open Graph / Facebook -->\n<meta property="og:type" content="website">\n<meta property="og:title" content="${safeTitleAttr}">\n<meta property="og:description" content="${safeDescAttr}">`;
        if (urlValue) html += `\n<meta property="og:url" content="${safeUrlAttr}">`;
        html += `\n\n<!-- Twitter -->\n<meta name="twitter:card" content="summary_large_image">\n<meta name="twitter:title" content="${safeTitleAttr}">\n<meta name="twitter:description" content="${safeDescAttr}">`;
        const out = document.getElementById('tool-output'); const btn = document.getElementById('copy-btn');
        out.classList.remove('empty'); out.textContent = html; btn.classList.remove('hidden'); out.appendChild(btn);
      });
      document.getElementById('mt-ai').addEventListener('click', () => {
        const title = document.getElementById('mt-title').value;
        if (title) document.getElementById('mt-desc').value = AI.writeMetaDescription(title);
      });
      document.getElementById('copy-btn').addEventListener('click', function() { copyToClipboard(document.getElementById('tool-output').textContent, this); });
    },

    'keyword-density'(c) {
      c.innerHTML = `<div class="tool-workspace-body">
        <div class="input-group"><label>Paste your content</label><textarea id="tool-input" rows="8" placeholder="Paste your article or blog post here..."></textarea></div>
        <button class="btn btn-primary mb-4" id="kd-analyze">📊 Analyze Keywords</button>
        <div id="kd-results"></div></div>`;
      document.getElementById('kd-analyze').addEventListener('click', () => {
        const text = document.getElementById('tool-input').value;
        if (!text.trim()) return;
        const keywords = AI.extractKeywords(text, 20);
        const total = text.trim().split(/\s+/).length;
        let html = `<div class="result-stats mb-4">${[['Total Words', total], ['Unique Keywords', keywords.length]].map(([l,v]) => `<div class="stat-card"><div class="stat-num">${v}</div><div class="stat-lbl">${l}</div></div>`).join('')}</div>`;
        html += '<div style="overflow-x:auto"><table style="width:100%;border-collapse:collapse;font-size:0.9rem"><thead><tr style="border-bottom:2px solid var(--border-color)"><th style="text-align:left;padding:10px;color:var(--text-secondary)">Keyword</th><th style="text-align:center;padding:10px;color:var(--text-secondary)">Count</th><th style="text-align:center;padding:10px;color:var(--text-secondary)">Density</th><th style="padding:10px;color:var(--text-secondary)">Bar</th></tr></thead><tbody>';
        keywords.forEach(kw => {
          const pct = parseFloat(kw.density);
          html += `<tr style="border-bottom:1px solid var(--border-color)"><td style="padding:10px;font-weight:500">${ToolRenderers.escapeHtml(kw.word)}</td><td style="text-align:center;padding:10px;font-family:var(--font-mono)">${kw.count}</td><td style="text-align:center;padding:10px;font-family:var(--font-mono)">${kw.density}%</td><td style="padding:10px"><div style="width:100%;height:8px;background:var(--bg-tertiary);border-radius:99px"><div style="height:100%;width:${Math.min(100,pct*10)}%;background:var(--gradient-primary);border-radius:99px"></div></div></td></tr>`;
        });
        html += '</tbody></table></div>';
        document.getElementById('kd-results').innerHTML = html;
      });
    },

    'sitemap-generator'(c) {
      c.innerHTML = `<div class="tool-workspace-body">
        <div class="input-group"><label>Base URL</label><input type="url" id="sm-base" placeholder="https://example.com"></div>
        <div class="input-group"><label>URLs (one per line)</label><textarea id="sm-urls" rows="6" placeholder="/\n/about\n/contact\n/blog\n/services"></textarea></div>
        <div class="flex gap-4 flex-wrap mb-4">
          <div class="input-group" style="flex:1;min-width:120px"><label>Priority</label><select id="sm-priority"><option value="1.0">1.0</option><option value="0.8" selected>0.8</option><option value="0.6">0.6</option><option value="0.4">0.4</option></select></div>
          <div class="input-group" style="flex:1;min-width:120px"><label>Frequency</label><select id="sm-freq"><option value="daily">Daily</option><option value="weekly" selected>Weekly</option><option value="monthly">Monthly</option><option value="yearly">Yearly</option></select></div>
        </div>
        <button class="btn btn-primary mb-4">Generate Sitemap</button>
        <div class="input-group"><label>XML Sitemap</label><div class="output-area empty" id="tool-output" style="white-space:pre"><button class="copy-btn hidden" id="copy-btn">Copy</button></div></div></div>`;
      c.querySelector('.btn-primary').addEventListener('click', () => {
        const base = document.getElementById('sm-base').value.replace(/\/$/,'') || 'https://example.com';
        const urls = document.getElementById('sm-urls').value.split('\n').filter(u => u.trim());
        const priority = document.getElementById('sm-priority').value;
        const freq = document.getElementById('sm-freq').value;
        const date = new Date().toISOString().split('T')[0];
        let xml = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
        (urls.length ? urls : ['/']).forEach(u => {
          const url = u.trim().startsWith('http') ? u.trim() : base + (u.trim().startsWith('/') ? u.trim() : '/' + u.trim());
          xml += `  <url>\n    <loc>${url}</loc>\n    <lastmod>${date}</lastmod>\n    <changefreq>${freq}</changefreq>\n    <priority>${priority}</priority>\n  </url>\n`;
        });
        xml += '</urlset>';
        const out = document.getElementById('tool-output'); const btn = document.getElementById('copy-btn');
        out.classList.remove('empty'); out.textContent = xml; btn.classList.remove('hidden'); out.appendChild(btn);
      });
      document.getElementById('copy-btn').addEventListener('click', function() { copyToClipboard(document.getElementById('tool-output').textContent, this); });
    },

    'robots-txt-generator'(c) {
      c.innerHTML = `<div class="tool-workspace-body">
        <div class="input-group"><label>User-Agent</label><select id="rt-agent"><option value="*">All Bots (*)</option><option value="Googlebot">Googlebot</option><option value="Bingbot">Bingbot</option></select></div>
        <div class="input-group"><label>Disallow paths (one per line)</label><textarea id="rt-disallow" rows="4" placeholder="/admin/\n/private/\n/tmp/">/admin/\n/private/</textarea></div>
        <div class="input-group"><label>Allow paths (one per line)</label><textarea id="rt-allow" rows="3" placeholder="/public/">/</textarea></div>
        <div class="input-group"><label>Sitemap URL</label><input type="url" id="rt-sitemap" placeholder="https://example.com/sitemap.xml"></div>
        <button class="btn btn-primary mb-4">Generate robots.txt</button>
        <div class="input-group"><label>Generated robots.txt</label><div class="output-area empty" id="tool-output"><button class="copy-btn hidden" id="copy-btn">Copy</button></div></div></div>`;
      c.querySelector('.btn-primary').addEventListener('click', () => {
        const agent = document.getElementById('rt-agent').value;
        const dis = document.getElementById('rt-disallow').value.split('\n').filter(l => l.trim());
        const allow = document.getElementById('rt-allow').value.split('\n').filter(l => l.trim());
        const sitemap = document.getElementById('rt-sitemap').value;
        let txt = `User-agent: ${agent}\n`;
        dis.forEach(d => txt += `Disallow: ${d.trim()}\n`);
        allow.forEach(a => txt += `Allow: ${a.trim()}\n`);
        if (sitemap) txt += `\nSitemap: ${sitemap}`;
        const out = document.getElementById('tool-output'); const btn = document.getElementById('copy-btn');
        out.classList.remove('empty'); out.textContent = txt; btn.classList.remove('hidden'); out.appendChild(btn);
      });
      document.getElementById('copy-btn').addEventListener('click', function() { copyToClipboard(document.getElementById('tool-output').textContent, this); });
    },

    'og-preview'(c) {
      c.innerHTML = `<div class="tool-workspace-body">
        <div class="input-group"><label>OG Title</label><input type="text" id="og-title" placeholder="My Page Title" value="Welcome to Tooliest"></div>
        <div class="input-group"><label>OG Description</label><textarea id="og-desc" rows="2" placeholder="Page description...">80+ free online tools for developers and designers.</textarea></div>
        <div class="input-group"><label>OG Image URL</label><input type="url" id="og-image" placeholder="https://example.com/image.jpg"></div>
        <div class="input-group"><label>Site URL</label><input type="url" id="og-url" placeholder="https://example.com" value="https://tooliest.com"></div>
        <button class="btn btn-primary mb-4">Preview</button>
        <div id="og-previews"></div></div>`;
      const previews = document.getElementById('og-previews');
      previews.innerHTML = `
        <label style="font-size:0.85rem;color:var(--text-secondary);margin-bottom:12px;display:block">Facebook Preview</label>
        <div style="max-width:500px;background:var(--bg-secondary);border:1px solid var(--border-color);border-radius:var(--radius-md);overflow:hidden;margin-bottom:24px">
          <div data-og-image="facebook" style="height:260px;background:var(--bg-tertiary);display:flex;align-items:center;justify-content:center;color:var(--text-tertiary);font-size:0.9rem"></div>
          <div style="padding:12px 16px">
            <div data-og-domain="facebook" style="font-size:0.75rem;color:var(--text-tertiary);text-transform:uppercase"></div>
            <div data-og-title="facebook" style="font-weight:600;margin:4px 0;font-size:1rem"></div>
            <div data-og-desc="facebook" style="font-size:0.85rem;color:var(--text-secondary)"></div>
          </div>
        </div>
        <label style="font-size:0.85rem;color:var(--text-secondary);margin-bottom:12px;display:block">Twitter/X Preview</label>
        <div style="max-width:500px;background:var(--bg-secondary);border:1px solid var(--border-color);border-radius:var(--radius-lg);overflow:hidden">
          <div data-og-image="twitter" style="height:240px;background:var(--bg-tertiary);display:flex;align-items:center;justify-content:center;color:var(--text-tertiary)"></div>
          <div style="padding:12px 16px">
            <div data-og-title="twitter" style="font-weight:600;font-size:0.95rem"></div>
            <div data-og-desc="twitter" style="font-size:0.85rem;color:var(--text-secondary);margin:4px 0"></div>
            <div data-og-domain="twitter" style="font-size:0.8rem;color:var(--text-tertiary)"></div>
          </div>
        </div>`;
      const applyPreviewImage = (element, imageUrl, fallbackText) => {
        element.style.backgroundColor = 'var(--bg-tertiary)';
        element.style.backgroundImage = '';
        element.style.backgroundPosition = '';
        element.style.backgroundSize = '';
        element.textContent = fallbackText;
        if (imageUrl) {
          element.style.backgroundImage = `url("${imageUrl}")`;
          element.style.backgroundPosition = 'center';
          element.style.backgroundSize = 'cover';
          element.textContent = '';
        }
      };
      const preview = () => {
        const title = document.getElementById('og-title').value || 'Untitled';
        const desc = document.getElementById('og-desc').value || '';
        const imageUrl = ToolRenderers.sanitizeHttpUrl(document.getElementById('og-image').value);
        const safeUrl = ToolRenderers.sanitizeHttpUrl(document.getElementById('og-url').value) || 'https://example.com';
        const domain = new URL(safeUrl).hostname;

        // [TOOLIEST AUDIT] Fill OG preview cards with textContent/style assignments to avoid DOM XSS.
        previews.querySelector('[data-og-domain="facebook"]').textContent = domain;
        previews.querySelector('[data-og-title="facebook"]').textContent = title;
        previews.querySelector('[data-og-desc="facebook"]').textContent = desc;
        previews.querySelector('[data-og-title="twitter"]').textContent = title;
        previews.querySelector('[data-og-desc="twitter"]').textContent = desc;
        previews.querySelector('[data-og-domain="twitter"]').textContent = `🔗 ${domain}`;
        applyPreviewImage(previews.querySelector('[data-og-image="facebook"]'), imageUrl, '🖼️ No image set');
        applyPreviewImage(previews.querySelector('[data-og-image="twitter"]'), imageUrl, '🖼️ No image');
      };
      c.querySelector('.btn-primary').addEventListener('click', preview);
      preview();
    },

    'schema-generator'(c) {
      c.innerHTML = `<div class="tool-workspace-body">
        <div class="input-group"><label>Schema Type</label><select id="sg-type">
          <option value="Article">Article</option><option value="FAQPage">FAQ Page</option><option value="Product">Product</option><option value="Organization">Organization</option><option value="LocalBusiness">Local Business</option><option value="Person">Person</option></select></div>
        <div id="sg-fields"></div>
        <button class="btn btn-primary mb-4">✨ Generate Schema</button>
        <div class="input-group"><label>JSON-LD Schema</label><div class="output-area empty" id="tool-output" style="white-space:pre-wrap"><button class="copy-btn hidden" id="copy-btn">Copy</button></div></div></div>`;
      const fields = {
        Article: [['headline','Article Title'],['author','Author Name'],['datePublished','Date Published (YYYY-MM-DD)'],['description','Description'],['url','URL']],
        FAQPage: [['q1','Question 1'],['a1','Answer 1'],['q2','Question 2'],['a2','Answer 2'],['q3','Question 3'],['a3','Answer 3']],
        Product: [['name','Product Name'],['description','Description'],['price','Price'],['currency','Currency (USD)'],['brand','Brand']],
        Organization: [['name','Organization Name'],['url','URL'],['logo','Logo URL'],['description','Description']],
        LocalBusiness: [['name','Business Name'],['address','Address'],['phone','Phone'],['url','Website']],
        Person: [['name','Full Name'],['jobTitle','Job Title'],['url','Website'],['email','Email']],
      };
      const renderFields = () => {
        const type = document.getElementById('sg-type').value;
        document.getElementById('sg-fields').innerHTML = (fields[type]||[]).map(([id,lbl]) => `<div class="input-group"><label>${lbl}</label><input type="text" id="sf-${id}" placeholder="${lbl}"></div>`).join('');
      };
      document.getElementById('sg-type').addEventListener('change', renderFields);
      renderFields();
      c.querySelector('.btn-primary').addEventListener('click', () => {
        const type = document.getElementById('sg-type').value;
        const vals = {};
        (fields[type]||[]).forEach(([id]) => vals[id] = document.getElementById('sf-'+id)?.value || '');
        let schema = {'@context': 'https://schema.org'};
        if (type === 'Article') {
          Object.assign(schema, {
            '@type': 'Article',
            headline: vals.headline,
            author: { '@type': 'Person', name: vals.author },
            datePublished: vals.datePublished,
            description: vals.description,
            url: vals.url,
          });
        } else if (type === 'FAQPage') {
          schema['@type'] = 'FAQPage';
          schema.mainEntity = [];
          for (let i = 1; i <= 3; i++) {
            if (vals['q' + i]) {
              schema.mainEntity.push({
                '@type': 'Question',
                name: vals['q' + i],
                acceptedAnswer: { '@type': 'Answer', text: vals['a' + i] },
              });
            }
          }
        } else if (type === 'Product') {
          Object.assign(schema, {
            '@type': 'Product',
            name: vals.name,
            description: vals.description,
            brand: { '@type': 'Brand', name: vals.brand },
            offers: { '@type': 'Offer', price: vals.price, priceCurrency: vals.currency || 'USD' },
          });
        } else if (type === 'Organization') {
          Object.assign(schema, {
            '@type': 'Organization',
            name: vals.name,
            url: vals.url,
            logo: vals.logo,
            description: vals.description,
          });
        } else if (type === 'LocalBusiness') {
          Object.assign(schema, {
            '@type': 'LocalBusiness',
            name: vals.name,
            address: vals.address,
            telephone: vals.phone,
            url: vals.url,
          });
        } else if (type === 'Person') {
          Object.assign(schema, {
            '@type': 'Person',
            name: vals.name,
            jobTitle: vals.jobTitle,
            url: vals.url,
            email: vals.email,
          });
        }
        const json = JSON.stringify(schema, null, 2);
        const wrapped = `<script type="application/ld+json">\n${json}\n</script>`;
        const out = document.getElementById('tool-output'); const btn = document.getElementById('copy-btn');
        out.classList.remove('empty'); out.textContent = wrapped; btn.classList.remove('hidden'); out.appendChild(btn);
      });
      document.getElementById('copy-btn').addEventListener('click', function() { copyToClipboard(document.getElementById('tool-output').textContent, this); });
    },
  }
};
