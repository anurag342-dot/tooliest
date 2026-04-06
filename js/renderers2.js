// ============================================
// TOOLIEST.COM — Tool Renderers Part 2
// CSS, Color, Image, JSON, HTML tools
// ============================================

Object.assign(ToolRenderers.renderers, {
  // ===== CSS TOOLS =====
  'css-minifier'(c) {
    ToolRenderers.layout(c,
      '<label>Paste CSS Code</label><textarea id="tool-input" rows="10" placeholder="body {\n  margin: 0;\n  padding: 0;\n}"></textarea>',
      '', '<button class="btn btn-primary">📦 Minify CSS</button>',
      () => {
        let css = document.getElementById('tool-input').value;
        const original = css.length;
        css = css.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\s+/g, ' ').replace(/\s*([{}:;,>~+])\s*/g, '$1').replace(/;}/g, '}').trim();
        ToolRenderers.setOutput(css, {'Original': original + ' chars', 'Minified': css.length + ' chars', 'Saved': ((1 - css.length/original)*100).toFixed(1) + '%'});
      }
    );
  },

  'css-beautifier'(c) {
    ToolRenderers.layout(c,
      '<label>Paste Minified CSS</label><textarea id="tool-input" rows="10" placeholder="body{margin:0;padding:0}.container{max-width:1200px}"></textarea>',
      '', '<button class="btn btn-primary">✨ Beautify CSS</button>',
      () => {
        let css = document.getElementById('tool-input').value;
        css = css.replace(/\{/g, ' {\n  ').replace(/;/g, ';\n  ').replace(/\}/g, '\n}\n').replace(/  \n\}/g, '\n}').replace(/\n\s*\n/g, '\n').trim();
        ToolRenderers.setOutput(css);
      }
    );
  },

  'gradient-generator'(c) {
    c.innerHTML = `<div class="tool-workspace-body">
      <div class="color-preview" id="grad-preview" style="height:150px;border-radius:var(--radius-lg)"></div>
      <div class="flex gap-4 flex-wrap mb-4">
        <div class="input-group" style="flex:1;min-width:120px"><label>Color 1</label><input type="color" id="grad-c1" value="#8b5cf6" style="width:100%;height:44px;cursor:pointer;border:none;border-radius:var(--radius-md)"></div>
        <div class="input-group" style="flex:1;min-width:120px"><label>Color 2</label><input type="color" id="grad-c2" value="#06b6d4" style="width:100%;height:44px;cursor:pointer;border:none;border-radius:var(--radius-md)"></div>
        <div class="input-group" style="flex:1;min-width:120px"><label>Direction</label><select id="grad-dir">
          <option value="to right">→ Right</option><option value="to left">← Left</option><option value="to bottom">↓ Down</option><option value="to top">↑ Up</option>
          <option value="to bottom right" selected>↘ Diagonal</option><option value="135deg">135°</option><option value="45deg">45°</option></select></div>
        <div class="input-group" style="flex:1;min-width:120px"><label>Type</label><select id="grad-type"><option value="linear" selected>Linear</option><option value="radial">Radial</option></select></div>
      </div>
      <div class="input-group"><label>CSS Code</label><div class="output-area" id="tool-output" style="min-height:50px"><button class="copy-btn" id="copy-btn">Copy</button></div></div></div>`;
    const update = () => {
      const c1 = document.getElementById('grad-c1').value, c2 = document.getElementById('grad-c2').value;
      const dir = document.getElementById('grad-dir').value, type = document.getElementById('grad-type').value;
      const css = type === 'radial' ? `radial-gradient(circle, ${c1}, ${c2})` : `linear-gradient(${dir}, ${c1}, ${c2})`;
      document.getElementById('grad-preview').style.background = css;
      const out = document.getElementById('tool-output'); const btn = document.getElementById('copy-btn');
      out.textContent = `background: ${css};`; out.appendChild(btn);
    };
    ['grad-c1','grad-c2','grad-dir','grad-type'].forEach(id => document.getElementById(id).addEventListener('input', update));
    document.getElementById('copy-btn').addEventListener('click', function() { copyToClipboard(document.getElementById('tool-output').textContent, this); });
    update();
  },

  'box-shadow-generator'(c) {
    c.innerHTML = `<div class="tool-workspace-body">
      <div style="display:flex;align-items:center;justify-content:center;min-height:200px;background:var(--bg-secondary);border-radius:var(--radius-lg);margin-bottom:20px">
        <div id="bs-preview" style="width:150px;height:150px;background:var(--bg-card);border-radius:var(--radius-lg)"></div></div>
      <div class="flex gap-4 flex-wrap">
        <div class="input-group" style="flex:1;min-width:140px"><label>X Offset: <span id="bs-x-val">5</span>px</label><input type="range" id="bs-x" min="-50" max="50" value="5"></div>
        <div class="input-group" style="flex:1;min-width:140px"><label>Y Offset: <span id="bs-y-val">5</span>px</label><input type="range" id="bs-y" min="-50" max="50" value="5"></div>
        <div class="input-group" style="flex:1;min-width:140px"><label>Blur: <span id="bs-b-val">20</span>px</label><input type="range" id="bs-b" min="0" max="100" value="20"></div>
        <div class="input-group" style="flex:1;min-width:140px"><label>Spread: <span id="bs-s-val">0</span>px</label><input type="range" id="bs-s" min="-50" max="50" value="0"></div>
        <div class="input-group" style="flex:1;min-width:100px"><label>Color</label><input type="color" id="bs-color" value="#8b5cf6" style="width:100%;height:40px;cursor:pointer;border:none;border-radius:var(--radius-md)"></div>
      </div>
      <div class="checkbox-group mt-3 mb-4"><label class="checkbox-label"><input type="checkbox" id="bs-inset"><span class="checkmark">✓</span> Inset Shadow</label></div>
      <div class="input-group"><label>CSS Code</label><div class="output-area" id="tool-output" style="min-height:50px"><button class="copy-btn" id="copy-btn">Copy</button></div></div></div>`;
    const update = () => {
      const x = document.getElementById('bs-x').value, y = document.getElementById('bs-y').value;
      const b = document.getElementById('bs-b').value, s = document.getElementById('bs-s').value;
      const color = document.getElementById('bs-color').value;
      const inset = document.getElementById('bs-inset').checked ? 'inset ' : '';
      document.getElementById('bs-x-val').textContent = x;
      document.getElementById('bs-y-val').textContent = y;
      document.getElementById('bs-b-val').textContent = b;
      document.getElementById('bs-s-val').textContent = s;
      const shadow = `${inset}${x}px ${y}px ${b}px ${s}px ${color}`;
      document.getElementById('bs-preview').style.boxShadow = shadow;
      const out = document.getElementById('tool-output'); const btn = document.getElementById('copy-btn');
      out.textContent = `box-shadow: ${shadow};`; out.appendChild(btn);
    };
    ['bs-x','bs-y','bs-b','bs-s','bs-color','bs-inset'].forEach(id => document.getElementById(id).addEventListener('input', update));
    document.getElementById('copy-btn').addEventListener('click', function() { copyToClipboard(document.getElementById('tool-output').textContent, this); });
    update();
  },

  'flexbox-playground'(c) {
    c.innerHTML = `<div class="tool-workspace-body">
      <div class="flex gap-4 flex-wrap mb-4">
        <div class="input-group" style="flex:1;min-width:150px"><label>flex-direction</label><select id="fb-dir"><option>row</option><option>row-reverse</option><option>column</option><option>column-reverse</option></select></div>
        <div class="input-group" style="flex:1;min-width:150px"><label>justify-content</label><select id="fb-jc"><option>flex-start</option><option>flex-end</option><option>center</option><option>space-between</option><option>space-around</option><option>space-evenly</option></select></div>
        <div class="input-group" style="flex:1;min-width:150px"><label>align-items</label><select id="fb-ai"><option>stretch</option><option>flex-start</option><option>flex-end</option><option>center</option><option>baseline</option></select></div>
        <div class="input-group" style="flex:1;min-width:150px"><label>flex-wrap</label><select id="fb-wrap"><option>nowrap</option><option>wrap</option><option>wrap-reverse</option></select></div>
        <div class="input-group" style="flex:1;min-width:120px"><label>gap</label><input type="number" id="fb-gap" value="10" min="0" max="50"></div>
      </div>
      <div id="fb-container" style="min-height:200px;background:var(--bg-secondary);border:2px dashed var(--border-color);border-radius:var(--radius-lg);padding:16px;display:flex"></div>
      <div class="input-group mt-4"><label>CSS Code</label><div class="output-area" id="tool-output" style="min-height:50px"><button class="copy-btn" id="copy-btn">Copy</button></div></div></div>`;
    const items = [1,2,3,4,5];
    const colors = ['#8b5cf6','#06b6d4','#f43f5e','#10b981','#f59e0b'];
    const container = document.getElementById('fb-container');
    items.forEach((n,i) => {
      const el = document.createElement('div');
      el.style.cssText = `width:60px;height:60px;background:${colors[i]};border-radius:var(--radius-md);display:flex;align-items:center;justify-content:center;font-weight:700;color:white;font-size:1.1rem;flex-shrink:0`;
      el.textContent = n;
      container.appendChild(el);
    });
    const update = () => {
      const dir = document.getElementById('fb-dir').value;
      const jc = document.getElementById('fb-jc').value;
      const ai = document.getElementById('fb-ai').value;
      const wrap = document.getElementById('fb-wrap').value;
      const gap = document.getElementById('fb-gap').value;
      container.style.flexDirection = dir;
      container.style.justifyContent = jc;
      container.style.alignItems = ai;
      container.style.flexWrap = wrap;
      container.style.gap = gap + 'px';
      const css = `display: flex;\nflex-direction: ${dir};\njustify-content: ${jc};\nalign-items: ${ai};\nflex-wrap: ${wrap};\ngap: ${gap}px;`;
      const out = document.getElementById('tool-output'); const btn = document.getElementById('copy-btn');
      out.textContent = css; out.appendChild(btn);
    };
    ['fb-dir','fb-jc','fb-ai','fb-wrap','fb-gap'].forEach(id => document.getElementById(id).addEventListener('input', update));
    document.getElementById('copy-btn').addEventListener('click', function() { copyToClipboard(document.getElementById('tool-output').textContent, this); });
    update();
  },

  'css-animation-generator'(c) {
    c.innerHTML = `<div class="tool-workspace-body">
      <div style="display:flex;align-items:center;justify-content:center;min-height:200px;background:var(--bg-secondary);border-radius:var(--radius-lg);margin-bottom:20px">
        <div id="anim-preview" style="width:80px;height:80px;background:var(--gradient-primary);border-radius:var(--radius-md)"></div></div>
      <div class="flex gap-4 flex-wrap mb-4">
        <div class="input-group" style="flex:1;min-width:150px"><label>Animation</label><select id="anim-type"><option value="bounce">Bounce</option><option value="fade">Fade In/Out</option><option value="spin">Spin</option><option value="slide">Slide</option><option value="pulse">Pulse</option><option value="shake">Shake</option></select></div>
        <div class="input-group" style="flex:1;min-width:120px"><label>Duration</label><input type="number" id="anim-dur" value="1" min="0.1" max="10" step="0.1"></div>
        <div class="input-group" style="flex:1;min-width:150px"><label>Timing</label><select id="anim-ease"><option value="ease">ease</option><option value="ease-in">ease-in</option><option value="ease-out">ease-out</option><option value="ease-in-out">ease-in-out</option><option value="linear">linear</option></select></div>
        <div class="input-group" style="flex:1;min-width:120px"><label>Iteration</label><select id="anim-iter"><option value="infinite">Infinite</option><option value="1">1</option><option value="3">3</option><option value="5">5</option></select></div>
      </div>
      <div class="input-group"><label>CSS Code</label><div class="output-area" id="tool-output" style="white-space:pre"><button class="copy-btn" id="copy-btn">Copy</button></div></div></div>`;
    const anims = {
      bounce: '@keyframes bounce {\n  0%, 100% { transform: translateY(0); }\n  50% { transform: translateY(-30px); }\n}',
      fade: '@keyframes fade {\n  0%, 100% { opacity: 0; }\n  50% { opacity: 1; }\n}',
      spin: '@keyframes spin {\n  from { transform: rotate(0deg); }\n  to { transform: rotate(360deg); }\n}',
      slide: '@keyframes slide {\n  0%, 100% { transform: translateX(0); }\n  50% { transform: translateX(50px); }\n}',
      pulse: '@keyframes pulse {\n  0%, 100% { transform: scale(1); }\n  50% { transform: scale(1.15); }\n}',
      shake: '@keyframes shake {\n  0%, 100% { transform: translateX(0); }\n  25% { transform: translateX(-10px); }\n  75% { transform: translateX(10px); }\n}',
    };
    const update = () => {
      const type = document.getElementById('anim-type').value;
      const dur = document.getElementById('anim-dur').value;
      const ease = document.getElementById('anim-ease').value;
      const iter = document.getElementById('anim-iter').value;
      const preview = document.getElementById('anim-preview');
      preview.style.animation = `${type} ${dur}s ${ease} ${iter}`;
      const css = `${anims[type]}\n\n.animated-element {\n  animation: ${type} ${dur}s ${ease} ${iter};\n}`;
      const out = document.getElementById('tool-output'); const btn = document.getElementById('copy-btn');
      out.textContent = css; out.appendChild(btn);
    };
    ['anim-type','anim-dur','anim-ease','anim-iter'].forEach(id => document.getElementById(id).addEventListener('input', update));
    document.getElementById('copy-btn').addEventListener('click', function() { copyToClipboard(document.getElementById('tool-output').textContent, this); });
    update();
  },

  // ===== COLOR TOOLS =====
  'color-picker'(c) {
    c.innerHTML = `<div class="tool-workspace-body">
      <input type="color" id="cp-picker" value="#8b5cf6" style="width:100%;height:100px;cursor:pointer;border:none;border-radius:var(--radius-lg);margin-bottom:16px">
      <div class="color-preview" id="cp-preview" style="background:#8b5cf6"></div>
      <div class="color-values" id="cp-values"></div></div>`;
    const update = () => {
      const hex = document.getElementById('cp-picker').value;
      document.getElementById('cp-preview').style.background = hex;
      const r = parseInt(hex.substr(1,2),16), g = parseInt(hex.substr(3,2),16), b = parseInt(hex.substr(5,2),16);
      const hsl = AI.hexToHSL(hex);
      document.getElementById('cp-values').innerHTML = [
        ['HEX', hex.toUpperCase()], ['RGB', `rgb(${r}, ${g}, ${b})`], ['HSL', `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`],
        ['RGBA', `rgba(${r}, ${g}, ${b}, 1)`]
      ].map(([l,v]) => `<div class="color-value-item" style="cursor:pointer" onclick="copyToClipboard('${v}')"><span>${l}</span><span>${v}</span></div>`).join('');
    };
    document.getElementById('cp-picker').addEventListener('input', update);
    update();
  },

  'palette-generator'(c) {
    c.innerHTML = `<div class="tool-workspace-body">
      <div class="flex gap-4 flex-wrap mb-4">
        <div class="input-group" style="flex:1;min-width:140px"><label>Base Color</label><input type="color" id="pg-color" value="#8b5cf6" style="width:100%;height:44px;cursor:pointer;border:none;border-radius:var(--radius-md)"></div>
        <div class="input-group" style="flex:1;min-width:180px"><label>Harmony</label><select id="pg-harmony">
          <option value="complementary">Complementary</option><option value="analogous">Analogous</option><option value="triadic">Triadic</option>
          <option value="split-complementary">Split Complementary</option><option value="tetradic">Tetradic</option><option value="shades">Shades</option></select></div>
      </div>
      <button class="btn btn-primary mb-4">🎨 Generate Palette</button>
      <div id="pg-palette" style="display:flex;border-radius:var(--radius-lg);overflow:hidden;height:120px;margin-bottom:16px"></div>
      <div id="pg-colors"></div></div>`;
    const gen = () => {
      const hex = document.getElementById('pg-color').value;
      const harmony = document.getElementById('pg-harmony').value;
      const palette = AI.generatePalette(hex, harmony);
      document.getElementById('pg-palette').innerHTML = palette.map(color => `<div style="flex:1;background:${color};cursor:pointer" onclick="copyToClipboard('${color}')" title="${color}"></div>`).join('');
      document.getElementById('pg-colors').innerHTML = '<div class="color-values">' + palette.map(color => `<div class="color-value-item" style="cursor:pointer" onclick="copyToClipboard('${color}')"><span>HEX</span><span>${color}</span></div>`).join('') + '</div>';
    };
    c.querySelector('.btn-primary').addEventListener('click', gen);
    document.getElementById('pg-color').addEventListener('input', gen);
    document.getElementById('pg-harmony').addEventListener('change', gen);
    gen();
  },

  'contrast-checker'(c) {
    c.innerHTML = `<div class="tool-workspace-body">
      <div class="flex gap-4 flex-wrap mb-4">
        <div class="input-group" style="flex:1"><label>Text Color</label><input type="color" id="cc-fg" value="#ffffff" style="width:100%;height:44px;cursor:pointer;border:none;border-radius:var(--radius-md)"></div>
        <div class="input-group" style="flex:1"><label>Background Color</label><input type="color" id="cc-bg" value="#1a1a2e" style="width:100%;height:44px;cursor:pointer;border:none;border-radius:var(--radius-md)"></div>
      </div>
      <div id="cc-preview" style="padding:30px;border-radius:var(--radius-lg);margin-bottom:20px;text-align:center">
        <p style="font-size:1.5rem;font-weight:700;margin-bottom:8px">Sample Text (Large)</p>
        <p style="font-size:1rem">This is how your text will look on the background.</p></div>
      <div class="result-stats" id="cc-results"></div></div>`;
    const luminance = (hex) => {
      const r = parseInt(hex.substr(1,2),16)/255, g = parseInt(hex.substr(3,2),16)/255, b = parseInt(hex.substr(5,2),16)/255;
      const sR = r <= 0.03928 ? r/12.92 : Math.pow((r+0.055)/1.055, 2.4);
      const sG = g <= 0.03928 ? g/12.92 : Math.pow((g+0.055)/1.055, 2.4);
      const sB = b <= 0.03928 ? b/12.92 : Math.pow((b+0.055)/1.055, 2.4);
      return 0.2126*sR + 0.7152*sG + 0.0722*sB;
    };
    const update = () => {
      const fg = document.getElementById('cc-fg').value, bg = document.getElementById('cc-bg').value;
      const preview = document.getElementById('cc-preview');
      preview.style.background = bg; preview.style.color = fg;
      const l1 = luminance(fg), l2 = luminance(bg);
      const ratio = ((Math.max(l1,l2) + 0.05) / (Math.min(l1,l2) + 0.05)).toFixed(2);
      const aaLarge = ratio >= 3 ? '✅ Pass' : '❌ Fail';
      const aaNormal = ratio >= 4.5 ? '✅ Pass' : '❌ Fail';
      const aaaLarge = ratio >= 4.5 ? '✅ Pass' : '❌ Fail';
      const aaaNormal = ratio >= 7 ? '✅ Pass' : '❌ Fail';
      document.getElementById('cc-results').innerHTML = [
        ['Ratio', ratio + ':1'], ['AA (Large)', aaLarge], ['AA (Normal)', aaNormal], ['AAA (Large)', aaaLarge], ['AAA (Normal)', aaaNormal]
      ].map(([l,v]) => `<div class="stat-card"><div class="stat-num" style="font-size:1rem">${v}</div><div class="stat-lbl">${l}</div></div>`).join('');
    };
    ['cc-fg','cc-bg'].forEach(id => document.getElementById(id).addEventListener('input', update));
    update();
  },

  'hex-to-rgb'(c) {
    c.innerHTML = `<div class="tool-workspace-body">
      <div class="input-group"><label>Enter HEX Color</label><input type="text" id="htr-input" value="#8b5cf6" placeholder="#8b5cf6"></div>
      <div class="color-preview" id="htr-preview" style="background:#8b5cf6"></div>
      <div class="color-values" id="htr-values"></div></div>`;
    const update = () => {
      let hex = document.getElementById('htr-input').value.trim();
      if (!hex.startsWith('#')) hex = '#' + hex;
      if (hex.length === 4) hex = '#' + hex[1]+hex[1]+hex[2]+hex[2]+hex[3]+hex[3];
      if (hex.length !== 7) return;
      document.getElementById('htr-preview').style.background = hex;
      const r = parseInt(hex.substr(1,2),16), g = parseInt(hex.substr(3,2),16), b = parseInt(hex.substr(5,2),16);
      const hsl = AI.hexToHSL(hex);
      document.getElementById('htr-values').innerHTML = [
        ['HEX', hex.toUpperCase()], ['RGB', `${r}, ${g}, ${b}`], ['HSL', `${hsl.h}°, ${hsl.s}%, ${hsl.l}%`],
        ['CSS RGB', `rgb(${r}, ${g}, ${b})`], ['CSS HSL', `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`]
      ].map(([l,v]) => `<div class="color-value-item" style="cursor:pointer" onclick="copyToClipboard('${v}')"><span>${l}</span><span>${v}</span></div>`).join('');
    };
    document.getElementById('htr-input').addEventListener('input', update);
    update();
  },

  'color-blindness-sim'(c) {
    c.innerHTML = `<div class="tool-workspace-body">
      <div class="input-group"><label>Pick a Color</label><input type="color" id="cbs-color" value="#e74c3c" style="width:100%;height:60px;cursor:pointer;border:none;border-radius:var(--radius-md)"></div>
      <div id="cbs-results" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:16px;margin-top:16px"></div></div>`;
    const simulate = (r,g,b,type) => {
      switch(type) {
        case 'Protanopia': return [0.567*r+0.433*g, 0.558*r+0.442*g, 0.242*r+0.758*b];
        case 'Deuteranopia': return [0.625*r+0.375*g, 0.7*r+0.3*g, 0.3*r+0.7*b];
        case 'Tritanopia': return [0.95*r+0.05*g, 0.433*g+0.567*b, 0.475*g+0.525*b];
        case 'Achromatopsia': { const avg = 0.299*r+0.587*g+0.114*b; return [avg,avg,avg]; }
        default: return [r,g,b];
      }
    };
    const update = () => {
      const hex = document.getElementById('cbs-color').value;
      const r = parseInt(hex.substr(1,2),16), g = parseInt(hex.substr(3,2),16), b = parseInt(hex.substr(5,2),16);
      const types = ['Normal Vision', 'Protanopia', 'Deuteranopia', 'Tritanopia', 'Achromatopsia'];
      document.getElementById('cbs-results').innerHTML = types.map(type => {
        const [sr,sg,sb] = type === 'Normal Vision' ? [r,g,b] : simulate(r,g,b,type);
        const simHex = '#' + [sr,sg,sb].map(v => Math.round(Math.min(255,Math.max(0,v))).toString(16).padStart(2,'0')).join('');
        return `<div style="text-align:center"><div style="width:100%;height:80px;background:${simHex};border-radius:var(--radius-md);margin-bottom:8px"></div><div style="font-weight:600;font-size:0.9rem">${type}</div><div style="font-size:0.8rem;color:var(--text-tertiary);font-family:var(--font-mono)">${simHex}</div></div>`;
      }).join('');
    };
    document.getElementById('cbs-color').addEventListener('input', update);
    update();
  },

  // ===== IMAGE TOOLS =====
  'image-compressor'(c) {
    c.innerHTML = `<div class="tool-workspace-body">
      <div class="file-upload-zone" id="img-drop"><div class="upload-icon">📸</div><p>Drop image here or click to upload</p><p class="upload-hint">Supports JPEG, PNG, WebP</p><input type="file" id="img-file" accept="image/*" style="display:none"></div>
      <div class="input-group mt-4"><label>Quality: <span id="img-q-val">80</span>%</label><input type="range" id="img-quality" min="10" max="100" value="80"></div>
      <div class="result-stats mt-4" id="img-stats"></div>
      <div class="mt-4 hidden" id="img-download"><button class="btn btn-success" id="img-dl-btn">💾 Download Compressed</button></div></div>`;
    const zone = document.getElementById('img-drop');
    const fileInput = document.getElementById('img-file');
    zone.addEventListener('click', () => fileInput.click());
    zone.addEventListener('dragover', (e) => { e.preventDefault(); zone.classList.add('drag-over'); });
    zone.addEventListener('dragleave', () => zone.classList.remove('drag-over'));
    zone.addEventListener('drop', (e) => { e.preventDefault(); zone.classList.remove('drag-over'); processFile(e.dataTransfer.files[0]); });
    fileInput.addEventListener('change', (e) => processFile(e.target.files[0]));
    
    let currentFile = null;
    let currentImg = null;

    document.getElementById('img-quality').addEventListener('input', (e) => { 
      document.getElementById('img-q-val').textContent = e.target.value; 
      if (currentImg) compressImage();
    });

    function processFile(file) {
      if (!file || !file.type.startsWith('image/')) return;
      currentFile = file;
      const reader = new FileReader();
      reader.onload = (e) => {
        currentImg = new Image();
        currentImg.alt = 'Uploaded image for compression';
        currentImg.onload = () => compressImage();
        currentImg.src = e.target.result;
      };
      reader.readAsDataURL(file);
    }

    function compressImage() {
      if (!currentImg || !currentFile) return;
      const quality = document.getElementById('img-quality').value / 100;
      const canvas = document.createElement('canvas');
      canvas.width = currentImg.width; canvas.height = currentImg.height;
      const ctx = canvas.getContext('2d');
      // Fill white background for transparent images
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(currentImg, 0, 0);
      
      canvas.toBlob((blob) => {
        const saved = ((1 - blob.size / currentFile.size) * 100).toFixed(1);
        document.getElementById('img-stats').innerHTML = [
          ['Original', (currentFile.size/1024).toFixed(1)+'KB'], 
          ['Compressed', (blob.size/1024).toFixed(1)+'KB'], 
          ['Saved', saved < 0 ? '0%' : saved+'%'], 
          ['Dimensions', currentImg.width+'×'+currentImg.height]
        ].map(([l,v]) => `<div class="stat-card"><div class="stat-num" style="font-size:1rem">${v}</div><div class="stat-lbl">${l}</div></div>`).join('');
        
        const dl = document.getElementById('img-download');
        dl.classList.remove('hidden');
        document.getElementById('img-dl-btn').onclick = () => {
          const a = document.createElement('a');
          a.href = URL.createObjectURL(blob);
          a.download = 'compressed_' + currentFile.name.replace(/\.[^/.]+$/, "") + '.jpg';
          a.click();
        };
      }, 'image/jpeg', quality);
    }
  },

  'image-resizer'(c) {
    c.innerHTML = `<div class="tool-workspace-body">
      <div class="file-upload-zone" id="ir-drop"><div class="upload-icon">📐</div><p>Drop image or click to upload</p><input type="file" id="ir-file" accept="image/*" style="display:none"></div>
      <div class="flex gap-4 flex-wrap mt-4">
        <div class="input-group" style="flex:1"><label>Width (px)</label><input type="number" id="ir-w" placeholder="800"></div>
        <div class="input-group" style="flex:1"><label>Height (px)</label><input type="number" id="ir-h" placeholder="600"></div>
      </div>
      <div class="checkbox-group mb-4"><label class="checkbox-label"><input type="checkbox" id="ir-ratio" checked><span class="checkmark">✓</span> Maintain Aspect Ratio</label></div>
      <button class="btn btn-primary mb-4 hidden" id="ir-resize">Resize & Download</button>
      <div id="ir-preview"></div></div>`;
    const zone = document.getElementById('ir-drop');
    const fileInput = document.getElementById('ir-file');
    zone.addEventListener('click', () => fileInput.click());
    let origImg = null;
    fileInput.addEventListener('change', (e) => {
      const file = e.target.files[0]; if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        origImg = new Image();
        origImg.alt = 'Uploaded image for resizing';
        origImg.onload = () => {
          document.getElementById('ir-w').value = origImg.width;
          document.getElementById('ir-h').value = origImg.height;
          document.getElementById('ir-resize').classList.remove('hidden');
          document.getElementById('ir-preview').innerHTML = `<p style="font-size:0.85rem;color:var(--text-secondary)">Original: ${origImg.width} × ${origImg.height}</p>`;
        };
        origImg.src = ev.target.result;
      };
      reader.readAsDataURL(file);
    });
    document.getElementById('ir-w').addEventListener('input', () => {
      if (document.getElementById('ir-ratio').checked && origImg) {
        const ratio = origImg.height / origImg.width;
        document.getElementById('ir-h').value = Math.round(document.getElementById('ir-w').value * ratio);
      }
    });
    document.getElementById('ir-resize').addEventListener('click', () => {
      if (!origImg) return;
      const w = parseInt(document.getElementById('ir-w').value), h = parseInt(document.getElementById('ir-h').value);
      const canvas = document.createElement('canvas');
      canvas.width = w; canvas.height = h;
      canvas.getContext('2d').drawImage(origImg, 0, 0, w, h);
      const a = document.createElement('a');
      a.href = canvas.toDataURL('image/png');
      a.download = `resized_${w}x${h}.png`;
      a.click();
      App.toast('Image downloaded!');
    });
  },

  'image-cropper'(c) {
    c.innerHTML = `<div class="tool-workspace-body"><div class="file-upload-zone" id="icr-drop"><div class="upload-icon">✂️</div><p>Drop image or click to upload</p><input type="file" id="icr-file" accept="image/*" style="display:none"></div>
      <div class="flex gap-4 flex-wrap mt-4"><div class="input-group" style="flex:1"><label>X</label><input type="number" id="icr-x" value="0"></div><div class="input-group" style="flex:1"><label>Y</label><input type="number" id="icr-y" value="0"></div><div class="input-group" style="flex:1"><label>Width</label><input type="number" id="icr-w" value="200"></div><div class="input-group" style="flex:1"><label>Height</label><input type="number" id="icr-h" value="200"></div></div>
      <button class="btn btn-primary mt-4 hidden" id="icr-crop">Crop & Download</button></div>`;
    const zone = document.getElementById('icr-drop'); const fileInput = document.getElementById('icr-file');
    zone.addEventListener('click', () => fileInput.click());
    let img = null;
    fileInput.addEventListener('change', (e) => {
      const file = e.target.files[0]; if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => { img = new Image(); img.onload = () => { document.getElementById('icr-w').value = img.width; document.getElementById('icr-h').value = img.height; document.getElementById('icr-crop').classList.remove('hidden'); }; img.src = ev.target.result; };
      reader.readAsDataURL(file);
    });
    document.getElementById('icr-crop').addEventListener('click', () => {
      if (!img) return;
      const x = +document.getElementById('icr-x').value, y = +document.getElementById('icr-y').value;
      const w = +document.getElementById('icr-w').value, h = +document.getElementById('icr-h').value;
      const canvas = document.createElement('canvas'); canvas.width = w; canvas.height = h;
      canvas.getContext('2d').drawImage(img, x, y, w, h, 0, 0, w, h);
      const a = document.createElement('a'); a.href = canvas.toDataURL('image/png'); a.download = 'cropped.png'; a.click();
      App.toast('Image cropped and downloaded!');
    });
  },

  'image-to-base64'(c) {
    c.innerHTML = `<div class="tool-workspace-body"><div class="file-upload-zone" id="ib-drop"><div class="upload-icon">🔣</div><p>Drop image or click to upload</p><input type="file" id="ib-file" accept="image/*" style="display:none"></div>
      <div class="input-group mt-4"><label>Base64 String</label><div class="output-area empty" id="tool-output" style="max-height:300px;overflow:auto"><button class="copy-btn hidden" id="copy-btn">Copy</button>Upload an image to convert</div></div></div>`;
    const zone = document.getElementById('ib-drop'); const fileInput = document.getElementById('ib-file');
    zone.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', (e) => {
      const file = e.target.files[0]; if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        const out = document.getElementById('tool-output'); const btn = document.getElementById('copy-btn');
        out.classList.remove('empty'); out.textContent = ev.target.result; btn.classList.remove('hidden'); out.appendChild(btn);
      };
      reader.readAsDataURL(file);
    });
    document.getElementById('copy-btn').addEventListener('click', function() { copyToClipboard(document.getElementById('tool-output').textContent, this); });
  },

  'base64-to-image'(c) {
    c.innerHTML = `<div class="tool-workspace-body">
      <div class="input-group"><label>Paste Base64 String</label><textarea id="tool-input" rows="6" placeholder="data:image/png;base64,iVBOR..."></textarea></div>
      <button class="btn btn-primary mb-4">Convert to Image</button>
      <div id="bi-preview" style="text-align:center"></div></div>`;
    c.querySelector('.btn-primary').addEventListener('click', () => {
      const data = document.getElementById('tool-input').value.trim();
      if (!data) return;
      const preview = document.getElementById('bi-preview');
      const img = new Image();
      img.onload = () => {
        preview.innerHTML = '';
        img.style.maxWidth = '100%'; img.style.borderRadius = 'var(--radius-md)';
        img.alt = 'Decoded Base64 image preview';
        preview.appendChild(img);
        const a = document.createElement('a');
        a.href = data; a.download = 'image.png';
        const btn = document.createElement('button');
        btn.className = 'btn btn-success mt-3';
        btn.textContent = '💾 Download Image';
        btn.onclick = () => a.click();
        preview.appendChild(btn);
      };
      img.onerror = () => { preview.innerHTML = '<p style="color:var(--accent-tertiary)">Invalid Base64 data</p>'; };
      img.src = data.startsWith('data:') ? data : 'data:image/png;base64,' + data;
    });
  },

  'image-converter'(c) {
    c.innerHTML = `<div class="tool-workspace-body">
      <div class="file-upload-zone" id="ic-drop">
        <div class="upload-icon">🔮</div>
        <p>Drop image or click to upload</p>
        <p class="upload-hint">Supports JPEG, PNG, WebP, GIF, SVG</p>
        <input type="file" id="ic-file" accept="image/*" style="display:none">
      </div>
      <div class="flex gap-4 flex-wrap mt-4 hidden" id="ic-controls">
        <div class="input-group" style="flex:1;min-width:150px">
          <label>Target Format</label>
          <select id="ic-format">
             <!-- Options dynamically populated based on input -->
          </select>
        </div>
        <div class="input-group" style="flex:1;min-width:200px">
          <label>Quality: <span id="ic-q-val">75</span>% <span style="font-size:0.75rem;color:var(--text-tertiary)">(JPEG/WebP only)</span></label>
          <input type="range" id="ic-quality" min="10" max="100" value="75">
        </div>
      </div>
      <div id="ic-png-warn" class="mt-2 hidden" style="font-size:0.8rem;color:#f59e0b;">⚠️ Converting to PNG is lossless and may result in a larger file size.</div>
      <div class="result-stats mt-4 hidden" id="ic-stats"></div>
      <button class="btn btn-primary mt-4 hidden" id="ic-convert">🔄 Convert & Optimize Image</button>
      <div class="mt-4 hidden" id="ic-result" style="text-align:center"></div>
    </div>`;

    const zone = document.getElementById('ic-drop');
    const fileInput = document.getElementById('ic-file');
    const controls = document.getElementById('ic-controls');
    const stats = document.getElementById('ic-stats');
    const convertBtn = document.getElementById('ic-convert');
    const resultDiv = document.getElementById('ic-result');
    const formatSelect = document.getElementById('ic-format');
    const pngWarn = document.getElementById('ic-png-warn');

    let currentFile = null;
    let currentImg = null;

    const availableFormats = [
      { name: 'PNG', mime: 'image/png', ext: 'png' },
      { name: 'JPEG', mime: 'image/jpeg', ext: 'jpg' },
      { name: 'WebP', mime: 'image/webp', ext: 'webp' }
    ];

    zone.addEventListener('click', () => fileInput.click());
    zone.addEventListener('dragover', (e) => { e.preventDefault(); zone.classList.add('drag-over'); });
    zone.addEventListener('dragleave', () => zone.classList.remove('drag-over'));
    zone.addEventListener('drop', (e) => { e.preventDefault(); zone.classList.remove('drag-over'); processFile(e.dataTransfer.files[0]); });
    fileInput.addEventListener('change', (e) => processFile(e.target.files[0]));

    document.getElementById('ic-quality').addEventListener('input', (e) => {
      document.getElementById('ic-q-val').textContent = e.target.value;
    });
    
    formatSelect.addEventListener('change', (e) => {
      if (pngWarn) pngWarn.classList.toggle('hidden', e.target.value !== 'image/png');
    });

    function processFile(file) {
      if (!file || !file.type.startsWith('image/')) {
        App.toast('Please select a valid image file', 'error');
        return;
      }
      currentFile = file;
      const reader = new FileReader();
      reader.onload = (e) => {
        currentImg = new Image();
        currentImg.onload = () => {
          controls.classList.remove('hidden');
          stats.classList.remove('hidden');
          convertBtn.classList.remove('hidden');
          resultDiv.classList.add('hidden');
          
          let fileMime = file.type;
          if (fileMime === 'image/jpg') fileMime = 'image/jpeg';
          
          formatSelect.innerHTML = '';
          availableFormats.forEach(fmt => {
            if (fmt.mime !== fileMime) {
              const opt = document.createElement('option');
              opt.value = fmt.mime;
              opt.textContent = fmt.name;
              opt.dataset.ext = fmt.ext;
              formatSelect.appendChild(opt);
            }
          });
          
          if (pngWarn) pngWarn.classList.toggle('hidden', formatSelect.value !== 'image/png');

          stats.innerHTML = [
            ['Input Format', fileMime.split('/')[1].toUpperCase()],
            ['Dimensions', `${currentImg.width}×${currentImg.height}px`],
            ['Original Size', (file.size / 1024).toFixed(1) + 'KB']
          ].map(([l, v]) => `<div class="stat-card"><div class="stat-num" style="font-size:1rem">${v}</div><div class="stat-lbl">${l}</div></div>`).join('');
        };
        currentImg.src = e.target.result;
      };
      reader.readAsDataURL(file);
    }

    convertBtn.addEventListener('click', () => {
      if (!currentImg) return;
      const format = formatSelect.value;
      const quality = document.getElementById('ic-quality').value / 100;
      
      const canvas = document.createElement('canvas');
      canvas.width = currentImg.width;
      canvas.height = currentImg.height;
      const ctx = canvas.getContext('2d');
      
      if (format === 'image/jpeg') {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
      
      ctx.drawImage(currentImg, 0, 0);

      canvas.toBlob((blob) => {
        if (!blob) {
          App.toast('Conversion failed. Image might be too large.', 'error');
          return;
        }
        
        resultDiv.classList.remove('hidden');
        resultDiv.innerHTML = '';
        
        const selectedExt = formatSelect.options[formatSelect.selectedIndex].dataset.ext;
        const newName = currentFile.name.replace(/\.[^/.]+$/, "") + '.' + selectedExt;
        
        const outputImg = new Image();
        const objUrl = URL.createObjectURL(blob);
        outputImg.src = objUrl;
        outputImg.style.maxWidth = '100%';
        outputImg.style.maxHeight = '300px';
        outputImg.style.borderRadius = 'var(--radius-md)';
        outputImg.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
        outputImg.alt = 'Converted image preview';
        resultDiv.appendChild(outputImg);
        
        const infoDiv = document.createElement('div');
        infoDiv.innerHTML = `<p class="mt-3" style="color:var(--text-secondary)">New Size: ${(blob.size/1024).toFixed(1)}KB</p>`;
        resultDiv.appendChild(infoDiv);

        const a = document.createElement('a');
        a.href = objUrl;
        a.download = newName;
        
        const btn = document.createElement('button');
        btn.className = 'btn btn-success mt-3';
        btn.innerHTML = '💾 Download completely isolated file';
        btn.onclick = () => { 
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
        };
        resultDiv.appendChild(btn);
        
        App.toast('Generated & Optimized successfully!');
      }, format, quality);
    });
  },
});
