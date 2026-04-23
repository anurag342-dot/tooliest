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
      reader.onload = (ev) => { img = new Image(); img.alt = 'Uploaded image for cropping'; img.onload = () => { document.getElementById('icr-w').value = img.width; document.getElementById('icr-h').value = img.height; document.getElementById('icr-crop').classList.remove('hidden'); }; img.src = ev.target.result; };
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
        currentImg.alt = 'Uploaded image for conversion';
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
  'image-compressor'(c) {
    c.innerHTML = `<div class="tool-workspace-body">
      <div class="file-upload-zone" id="img-drop"><div class="upload-icon">📸</div><p>Drop image here or click to upload</p><p class="upload-hint">Supports JPEG, PNG, WebP</p><input type="file" id="img-file" accept="image/*" style="display:none"></div>
      <div class="input-group mt-4"><label>Quality: <span id="img-q-val">80</span>%</label><input type="range" id="img-quality" min="10" max="100" value="80"></div>
      <div class="media-preview-grid">
        ${ToolRenderers.buildUploadPreviewCard('img-original', 'Original image')}
        ${ToolRenderers.buildUploadPreviewCard('img-result', 'Compressed output')}
      </div>
      <div class="result-stats mt-4" id="img-stats"></div>
      <div class="mt-4 hidden" id="img-download"><button class="btn btn-success" id="img-dl-btn">Download Compressed Image</button></div>
    </div>`;

    const zone = document.getElementById('img-drop');
    const fileInput = document.getElementById('img-file');
    const qualityInput = document.getElementById('img-quality');
    const qualityValue = document.getElementById('img-q-val');
    const stats = document.getElementById('img-stats');
    const downloadWrap = document.getElementById('img-download');
    const downloadBtn = document.getElementById('img-dl-btn');

    let currentFile = null;
    let currentImg = null;
    let currentOriginalUrl = '';
    let currentResultUrl = '';
    let currentResultBlob = null;

    const clearResult = () => {
      if (currentResultUrl) {
        URL.revokeObjectURL(currentResultUrl);
        currentResultUrl = '';
      }
      currentResultBlob = null;
      ToolRenderers.hideUploadPreviewCard('img-result');
      downloadWrap.classList.add('hidden');
    };

    const renderStats = (blob) => {
      if (!currentFile || !currentImg || !blob) return;
      const saved = ((1 - blob.size / currentFile.size) * 100).toFixed(1);
      stats.innerHTML = [
        ['Original', ToolRenderers.formatBytes(currentFile.size)],
        ['Compressed', ToolRenderers.formatBytes(blob.size)],
        ['Saved', saved < 0 ? '0%' : `${saved}%`],
        ['Dimensions', `${currentImg.width} × ${currentImg.height}`],
      ].map(([label, value]) => `<div class="stat-card"><div class="stat-num" style="font-size:1rem">${value}</div><div class="stat-lbl">${label}</div></div>`).join('');
    };

    const compressImage = () => {
      if (!currentFile || !currentImg) return;
      const canvas = document.createElement('canvas');
      canvas.width = currentImg.width;
      canvas.height = currentImg.height;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(currentImg, 0, 0);
      canvas.toBlob((blob) => {
        if (!blob) {
          App.toast('Could not compress this image in your browser.', 'error');
          return;
        }
        clearResult();
        currentResultBlob = blob;
        currentResultUrl = URL.createObjectURL(blob);
        ToolRenderers.setUploadPreviewCard('img-result', {
          url: currentResultUrl,
          title: `compressed_${currentFile.name.replace(/\.[^/.]+$/, '')}.jpg`,
          meta: `${ToolRenderers.formatBytes(blob.size)} • ${currentImg.width} × ${currentImg.height}`,
          note: 'Review the compressed export before downloading it.',
          alt: 'Compressed image preview',
        });
        renderStats(blob);
        downloadWrap.classList.remove('hidden');
        downloadBtn.onclick = () => {
          const link = document.createElement('a');
          link.href = currentResultUrl;
          link.download = `compressed_${currentFile.name.replace(/\.[^/.]+$/, '')}.jpg`;
          link.click();
        };
      }, 'image/jpeg', Number(qualityInput.value) / 100);
    };

    const processFile = (file) => {
      fileInput.value = '';
      if (!file || !file.type.startsWith('image/')) return;
      if (currentOriginalUrl) URL.revokeObjectURL(currentOriginalUrl);
      clearResult();
      currentFile = file;
      currentOriginalUrl = URL.createObjectURL(file);
      currentImg = new Image();
      currentImg.alt = 'Uploaded image for compression';
      currentImg.onload = () => {
        ToolRenderers.setUploadPreviewCard('img-original', {
          url: currentOriginalUrl,
          title: file.name,
          meta: `${ToolRenderers.formatBytes(file.size)} • ${currentImg.width} × ${currentImg.height}`,
          note: `Source format: ${(file.type.split('/')[1] || 'image').toUpperCase()}`,
          alt: 'Original image preview',
        });
        compressImage();
      };
      currentImg.src = currentOriginalUrl;
    };

    zone.addEventListener('click', () => fileInput.click());
    zone.addEventListener('dragover', (e) => { e.preventDefault(); zone.classList.add('drag-over'); });
    zone.addEventListener('dragleave', () => zone.classList.remove('drag-over'));
    zone.addEventListener('drop', (e) => {
      e.preventDefault();
      zone.classList.remove('drag-over');
      processFile(e.dataTransfer.files[0]);
    });
    fileInput.addEventListener('change', (e) => processFile(e.target.files[0]));
    qualityInput.addEventListener('input', (e) => {
      qualityValue.textContent = e.target.value;
      if (currentImg) compressImage();
    });
  },

  'image-resizer'(c) {
    c.innerHTML = `<div class="tool-workspace-body">
      <div class="file-upload-zone" id="ir-drop"><div class="upload-icon">📐</div><p>Drop image or click to upload</p><input type="file" id="ir-file" accept="image/*" style="display:none"></div>
      <div class="flex gap-4 flex-wrap mt-4">
        <div class="input-group" style="flex:1"><label>Width (px)</label><input type="number" id="ir-w" placeholder="800"></div>
        <div class="input-group" style="flex:1"><label>Height (px)</label><input type="number" id="ir-h" placeholder="600"></div>
      </div>
      <div class="checkbox-group mb-4"><label class="checkbox-label"><input type="checkbox" id="ir-ratio" checked><span class="checkmark">✓</span> Maintain Aspect Ratio</label></div>
      <div class="flex gap-3 flex-wrap mb-4">
        <button class="btn btn-primary hidden" id="ir-resize">Resize Image</button>
        <button class="btn btn-success hidden" id="ir-download">Download Resized Image</button>
      </div>
      <div class="media-preview-grid">
        ${ToolRenderers.buildUploadPreviewCard('ir-original', 'Original image')}
        ${ToolRenderers.buildUploadPreviewCard('ir-result', 'Resized output')}
      </div>
      <div class="result-stats mt-4 hidden" id="ir-stats"></div>
    </div>`;

    const zone = document.getElementById('ir-drop');
    const fileInput = document.getElementById('ir-file');
    const widthInput = document.getElementById('ir-w');
    const heightInput = document.getElementById('ir-h');
    const ratioInput = document.getElementById('ir-ratio');
    const resizeBtn = document.getElementById('ir-resize');
    const downloadBtn = document.getElementById('ir-download');
    const stats = document.getElementById('ir-stats');

    let currentFile = null;
    let origImg = null;
    let currentOriginalUrl = '';
    let currentResultUrl = '';

    const clearResult = () => {
      if (currentResultUrl) {
        URL.revokeObjectURL(currentResultUrl);
        currentResultUrl = '';
      }
      ToolRenderers.hideUploadPreviewCard('ir-result');
      downloadBtn.classList.add('hidden');
    };

    const updateStats = (items) => {
      stats.classList.remove('hidden');
      stats.innerHTML = items.map(([label, value]) => `<div class="stat-card"><div class="stat-num" style="font-size:1rem">${value}</div><div class="stat-lbl">${label}</div></div>`).join('');
    };

    const loadFile = (file) => {
      fileInput.value = '';
      if (!file || !file.type.startsWith('image/')) return;
      if (currentOriginalUrl) URL.revokeObjectURL(currentOriginalUrl);
      clearResult();
      currentFile = file;
      currentOriginalUrl = URL.createObjectURL(file);
      origImg = new Image();
      origImg.alt = 'Uploaded image for resizing';
      origImg.onload = () => {
        widthInput.value = origImg.width;
        heightInput.value = origImg.height;
        resizeBtn.classList.remove('hidden');
        ToolRenderers.setUploadPreviewCard('ir-original', {
          url: currentOriginalUrl,
          title: file.name,
          meta: `${ToolRenderers.formatBytes(file.size)} • ${origImg.width} × ${origImg.height}`,
          note: 'Choose the new dimensions, then generate the resized copy.',
          alt: 'Original image preview',
        });
        updateStats([
          ['Original', `${origImg.width} × ${origImg.height}`],
          ['File Size', ToolRenderers.formatBytes(file.size)],
          ['Status', 'Ready to resize'],
        ]);
      };
      origImg.src = currentOriginalUrl;
    };

    zone.addEventListener('click', () => fileInput.click());
    zone.addEventListener('dragover', (e) => { e.preventDefault(); zone.classList.add('drag-over'); });
    zone.addEventListener('dragleave', () => zone.classList.remove('drag-over'));
    zone.addEventListener('drop', (e) => {
      e.preventDefault();
      zone.classList.remove('drag-over');
      loadFile(e.dataTransfer.files[0]);
    });
    fileInput.addEventListener('change', (e) => loadFile(e.target.files[0]));

    widthInput.addEventListener('input', () => {
      if (ratioInput.checked && origImg && widthInput.value) {
        const ratio = origImg.height / origImg.width;
        heightInput.value = Math.max(1, Math.round(Number(widthInput.value) * ratio));
      }
    });

    heightInput.addEventListener('input', () => {
      if (ratioInput.checked && origImg && heightInput.value) {
        const ratio = origImg.width / origImg.height;
        widthInput.value = Math.max(1, Math.round(Number(heightInput.value) * ratio));
      }
    });

    resizeBtn.addEventListener('click', () => {
      if (!origImg || !currentFile) return;
      const width = Math.max(1, parseInt(widthInput.value, 10) || origImg.width);
      const height = Math.max(1, parseInt(heightInput.value, 10) || origImg.height);
      const canvas = document.createElement('canvas');
      const outputMime = ['image/jpeg', 'image/png', 'image/webp'].includes(currentFile.type) ? currentFile.type : 'image/png';
      const outputExt = outputMime === 'image/jpeg' ? 'jpg' : outputMime.split('/')[1];
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (outputMime === 'image/jpeg') {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, width, height);
      }
      ctx.drawImage(origImg, 0, 0, width, height);
      canvas.toBlob((blob) => {
        if (!blob) {
          App.toast('Could not resize this image in your browser.', 'error');
          return;
        }
        clearResult();
        currentResultUrl = URL.createObjectURL(blob);
        ToolRenderers.setUploadPreviewCard('ir-result', {
          url: currentResultUrl,
          title: `resized_${width}x${height}.${outputExt}`,
          meta: `${ToolRenderers.formatBytes(blob.size)} • ${width} × ${height}`,
          note: 'Preview the resized output before downloading it.',
          alt: 'Resized image preview',
        });
        updateStats([
          ['Original', `${origImg.width} × ${origImg.height}`],
          ['Resized', `${width} × ${height}`],
          ['Output Size', ToolRenderers.formatBytes(blob.size)],
        ]);
        downloadBtn.classList.remove('hidden');
        downloadBtn.onclick = () => {
          const link = document.createElement('a');
          link.href = currentResultUrl;
          link.download = `resized_${width}x${height}.${outputExt}`;
          link.click();
        };
      }, outputMime, outputMime === 'image/png' ? undefined : 0.92);
    });
  },

  'image-cropper'(c) {
    c.innerHTML = `<div class="tool-workspace-body">
      <div class="file-upload-zone" id="icr-drop"><div class="upload-icon">✂️</div><p>Drop image or click to upload</p><input type="file" id="icr-file" accept="image/*" style="display:none"></div>
      <div class="flex gap-4 flex-wrap mt-4">
        <div class="input-group" style="flex:1"><label>X</label><input type="number" id="icr-x" value="0"></div>
        <div class="input-group" style="flex:1"><label>Y</label><input type="number" id="icr-y" value="0"></div>
        <div class="input-group" style="flex:1"><label>Width</label><input type="number" id="icr-w" value="200"></div>
        <div class="input-group" style="flex:1"><label>Height</label><input type="number" id="icr-h" value="200"></div>
      </div>
      <div class="flex gap-3 flex-wrap mt-4">
        <button class="btn btn-primary hidden" id="icr-crop">Crop Image</button>
        <button class="btn btn-success hidden" id="icr-download">Download Cropped Image</button>
      </div>
      <div class="media-preview-grid">
        ${ToolRenderers.buildUploadPreviewCard('icr-original', 'Original image')}
        ${ToolRenderers.buildUploadPreviewCard('icr-result', 'Cropped output')}
      </div>
      <div class="result-stats mt-4 hidden" id="icr-stats"></div>
    </div>`;

    const zone = document.getElementById('icr-drop');
    const fileInput = document.getElementById('icr-file');
    const cropBtn = document.getElementById('icr-crop');
    const downloadBtn = document.getElementById('icr-download');
    const stats = document.getElementById('icr-stats');

    let currentFile = null;
    let currentImg = null;
    let currentOriginalUrl = '';
    let currentResultUrl = '';

    const clearResult = () => {
      if (currentResultUrl) {
        URL.revokeObjectURL(currentResultUrl);
        currentResultUrl = '';
      }
      ToolRenderers.hideUploadPreviewCard('icr-result');
      downloadBtn.classList.add('hidden');
    };

    const updateStats = (items) => {
      stats.classList.remove('hidden');
      stats.innerHTML = items.map(([label, value]) => `<div class="stat-card"><div class="stat-num" style="font-size:1rem">${value}</div><div class="stat-lbl">${label}</div></div>`).join('');
    };

    const loadFile = (file) => {
      fileInput.value = '';
      if (!file || !file.type.startsWith('image/')) return;
      if (currentOriginalUrl) URL.revokeObjectURL(currentOriginalUrl);
      clearResult();
      currentFile = file;
      currentOriginalUrl = URL.createObjectURL(file);
      currentImg = new Image();
      currentImg.alt = 'Uploaded image for cropping';
      currentImg.onload = () => {
        document.getElementById('icr-x').value = 0;
        document.getElementById('icr-y').value = 0;
        document.getElementById('icr-w').value = currentImg.width;
        document.getElementById('icr-h').value = currentImg.height;
        cropBtn.classList.remove('hidden');
        ToolRenderers.setUploadPreviewCard('icr-original', {
          url: currentOriginalUrl,
          title: file.name,
          meta: `${ToolRenderers.formatBytes(file.size)} • ${currentImg.width} × ${currentImg.height}`,
          note: 'Adjust the crop values, then generate the cropped output.',
          alt: 'Original image preview',
        });
        updateStats([
          ['Original', `${currentImg.width} × ${currentImg.height}`],
          ['File Size', ToolRenderers.formatBytes(file.size)],
          ['Status', 'Ready to crop'],
        ]);
      };
      currentImg.src = currentOriginalUrl;
    };

    zone.addEventListener('click', () => fileInput.click());
    zone.addEventListener('dragover', (e) => { e.preventDefault(); zone.classList.add('drag-over'); });
    zone.addEventListener('dragleave', () => zone.classList.remove('drag-over'));
    zone.addEventListener('drop', (e) => {
      e.preventDefault();
      zone.classList.remove('drag-over');
      loadFile(e.dataTransfer.files[0]);
    });
    fileInput.addEventListener('change', (e) => loadFile(e.target.files[0]));

    cropBtn.addEventListener('click', () => {
      if (!currentImg || !currentFile) return;
      const x = Math.max(0, Number(document.getElementById('icr-x').value) || 0);
      const y = Math.max(0, Number(document.getElementById('icr-y').value) || 0);
      const width = Math.max(1, Number(document.getElementById('icr-w').value) || currentImg.width);
      const height = Math.max(1, Number(document.getElementById('icr-h').value) || currentImg.height);
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      canvas.getContext('2d').drawImage(currentImg, x, y, width, height, 0, 0, width, height);
      canvas.toBlob((blob) => {
        if (!blob) {
          App.toast('Could not crop this image in your browser.', 'error');
          return;
        }
        clearResult();
        currentResultUrl = URL.createObjectURL(blob);
        ToolRenderers.setUploadPreviewCard('icr-result', {
          url: currentResultUrl,
          title: `cropped_${currentFile.name.replace(/\.[^/.]+$/, '')}.png`,
          meta: `${ToolRenderers.formatBytes(blob.size)} • ${width} × ${height}`,
          note: `Crop area: ${x}, ${y} to ${x + width}, ${y + height}`,
          alt: 'Cropped image preview',
        });
        updateStats([
          ['Original', `${currentImg.width} × ${currentImg.height}`],
          ['Crop Size', `${width} × ${height}`],
          ['Output Size', ToolRenderers.formatBytes(blob.size)],
        ]);
        downloadBtn.classList.remove('hidden');
        downloadBtn.onclick = () => {
          const link = document.createElement('a');
          link.href = currentResultUrl;
          link.download = `cropped_${currentFile.name.replace(/\.[^/.]+$/, '')}.png`;
          link.click();
        };
      }, 'image/png');
    });
  },

  'image-to-base64'(c) {
    c.innerHTML = `<div class="tool-workspace-body">
      <div class="file-upload-zone" id="ib-drop"><div class="upload-icon">🔣</div><p>Drop image or click to upload</p><input type="file" id="ib-file" accept="image/*" style="display:none"></div>
      <div class="media-preview-grid">
        ${ToolRenderers.buildUploadPreviewCard('ib-original', 'Source image')}
      </div>
      <div class="result-stats mt-4 hidden" id="ib-stats"></div>
      <div class="input-group mt-4"><label>Base64 String</label><div class="output-area empty" id="tool-output" style="max-height:300px;overflow:auto"><button class="copy-btn hidden" id="copy-btn">Copy</button>Upload an image to convert</div></div>
    </div>`;

    const zone = document.getElementById('ib-drop');
    const fileInput = document.getElementById('ib-file');
    const stats = document.getElementById('ib-stats');
    const output = document.getElementById('tool-output');
    const copyBtn = document.getElementById('copy-btn');
    let currentOriginalUrl = '';

    const loadFile = (file) => {
      fileInput.value = '';
      if (!file || !file.type.startsWith('image/')) return;
      if (currentOriginalUrl) URL.revokeObjectURL(currentOriginalUrl);
      currentOriginalUrl = URL.createObjectURL(file);
      const preview = new Image();
      preview.alt = 'Uploaded image for Base64 conversion';
      preview.onload = () => {
        ToolRenderers.setUploadPreviewCard('ib-original', {
          url: currentOriginalUrl,
          title: file.name,
          meta: `${ToolRenderers.formatBytes(file.size)} • ${preview.width} × ${preview.height}`,
          note: 'You can confirm the exact source image before copying the Base64 output.',
          alt: 'Image to Base64 source preview',
        });
      };
      preview.src = currentOriginalUrl;

      const reader = new FileReader();
      reader.onload = (event) => {
        output.classList.remove('empty');
        output.textContent = event.target.result;
        copyBtn.classList.remove('hidden');
        output.appendChild(copyBtn);
        stats.classList.remove('hidden');
        stats.innerHTML = [
          ['Original Size', ToolRenderers.formatBytes(file.size)],
          ['Base64 Length', `${event.target.result.length.toLocaleString()} chars`],
          ['Encoding', 'Data URL'],
        ].map(([label, value]) => `<div class="stat-card"><div class="stat-num" style="font-size:1rem">${value}</div><div class="stat-lbl">${label}</div></div>`).join('');
      };
      reader.readAsDataURL(file);
    };

    zone.addEventListener('click', () => fileInput.click());
    zone.addEventListener('dragover', (e) => { e.preventDefault(); zone.classList.add('drag-over'); });
    zone.addEventListener('dragleave', () => zone.classList.remove('drag-over'));
    zone.addEventListener('drop', (e) => {
      e.preventDefault();
      zone.classList.remove('drag-over');
      loadFile(e.dataTransfer.files[0]);
    });
    fileInput.addEventListener('change', (e) => loadFile(e.target.files[0]));
    copyBtn.addEventListener('click', function() {
      copyToClipboard(document.getElementById('tool-output').textContent, this);
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
          <select id="ic-format"></select>
        </div>
        <div class="input-group" style="flex:1;min-width:200px">
          <label>Quality: <span id="ic-q-val">75</span>% <span style="font-size:0.75rem;color:var(--text-tertiary)">(JPEG/WebP only)</span></label>
          <input type="range" id="ic-quality" min="10" max="100" value="75">
        </div>
      </div>
      <div id="ic-png-warn" class="mt-2 hidden" style="font-size:0.8rem;color:#f59e0b;">Converting to PNG is lossless and may result in a larger file size.</div>
      <div class="media-preview-grid">
        ${ToolRenderers.buildUploadPreviewCard('ic-original', 'Original image')}
        ${ToolRenderers.buildUploadPreviewCard('ic-result', 'Converted output')}
      </div>
      <div class="result-stats mt-4 hidden" id="ic-stats"></div>
      <button class="btn btn-primary mt-4 hidden" id="ic-convert">Convert & Optimize Image</button>
      <div class="mt-4 hidden" id="ic-result-actions" style="text-align:center"></div>
    </div>`;

    const zone = document.getElementById('ic-drop');
    const fileInput = document.getElementById('ic-file');
    const controls = document.getElementById('ic-controls');
    const stats = document.getElementById('ic-stats');
    const convertBtn = document.getElementById('ic-convert');
    const resultDiv = document.getElementById('ic-result-actions');
    const formatSelect = document.getElementById('ic-format');
    const pngWarn = document.getElementById('ic-png-warn');
    const qualityInput = document.getElementById('ic-quality');
    const qualityValue = document.getElementById('ic-q-val');

    let currentFile = null;
    let currentImg = null;
    let currentOriginalUrl = '';
    let currentConvertedUrl = '';

    const availableFormats = [
      { name: 'PNG', mime: 'image/png', ext: 'png' },
      { name: 'JPEG', mime: 'image/jpeg', ext: 'jpg' },
      { name: 'WebP', mime: 'image/webp', ext: 'webp' },
    ];

    const clearConvertedResult = () => {
      if (currentConvertedUrl) {
        URL.revokeObjectURL(currentConvertedUrl);
        currentConvertedUrl = '';
      }
      ToolRenderers.hideUploadPreviewCard('ic-result');
      resultDiv.classList.add('hidden');
      resultDiv.innerHTML = '';
    };

    const processFile = (file) => {
      fileInput.value = '';
      if (!file || !file.type.startsWith('image/')) {
        App.toast('Please select a valid image file', 'error');
        return;
      }
      if (currentOriginalUrl) URL.revokeObjectURL(currentOriginalUrl);
      clearConvertedResult();
      currentFile = file;
      currentOriginalUrl = URL.createObjectURL(file);
      currentImg = new Image();
      currentImg.alt = 'Uploaded image for conversion';
      currentImg.onload = () => {
        controls.classList.remove('hidden');
        stats.classList.remove('hidden');
        convertBtn.classList.remove('hidden');

        let fileMime = file.type;
        if (fileMime === 'image/jpg') fileMime = 'image/jpeg';

        formatSelect.innerHTML = '';
        availableFormats.forEach((format) => {
          if (format.mime !== fileMime) {
            const option = document.createElement('option');
            option.value = format.mime;
            option.textContent = format.name;
            option.dataset.ext = format.ext;
            formatSelect.appendChild(option);
          }
        });

        pngWarn.classList.toggle('hidden', formatSelect.value !== 'image/png');
        ToolRenderers.setUploadPreviewCard('ic-original', {
          url: currentOriginalUrl,
          title: file.name,
          meta: `${ToolRenderers.formatBytes(file.size)} • ${currentImg.width} × ${currentImg.height}`,
          note: `Source format: ${(fileMime.split('/')[1] || 'image').toUpperCase()}`,
          alt: 'Original image preview',
        });
        stats.innerHTML = [
          ['Input Format', fileMime.split('/')[1].toUpperCase()],
          ['Dimensions', `${currentImg.width} × ${currentImg.height}`],
          ['Original Size', ToolRenderers.formatBytes(file.size)],
        ].map(([label, value]) => `<div class="stat-card"><div class="stat-num" style="font-size:1rem">${value}</div><div class="stat-lbl">${label}</div></div>`).join('');
      };
      currentImg.src = currentOriginalUrl;
    };

    zone.addEventListener('click', () => fileInput.click());
    zone.addEventListener('dragover', (e) => { e.preventDefault(); zone.classList.add('drag-over'); });
    zone.addEventListener('dragleave', () => zone.classList.remove('drag-over'));
    zone.addEventListener('drop', (e) => {
      e.preventDefault();
      zone.classList.remove('drag-over');
      processFile(e.dataTransfer.files[0]);
    });
    fileInput.addEventListener('change', (e) => processFile(e.target.files[0]));
    qualityInput.addEventListener('input', (e) => { qualityValue.textContent = e.target.value; });
    formatSelect.addEventListener('change', (e) => {
      pngWarn.classList.toggle('hidden', e.target.value !== 'image/png');
    });

    convertBtn.addEventListener('click', () => {
      if (!currentImg || !currentFile) return;
      const format = formatSelect.value;
      const quality = Number(qualityInput.value) / 100;
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
        clearConvertedResult();
        currentConvertedUrl = URL.createObjectURL(blob);
        const selectedExt = formatSelect.options[formatSelect.selectedIndex].dataset.ext;
        const newName = `${currentFile.name.replace(/\.[^/.]+$/, '')}.${selectedExt}`;
        ToolRenderers.setUploadPreviewCard('ic-result', {
          url: currentConvertedUrl,
          title: newName,
          meta: `${ToolRenderers.formatBytes(blob.size)} • ${currentImg.width} × ${currentImg.height}`,
          note: `Converted to ${(format.split('/')[1] || 'image').toUpperCase()}`,
          alt: 'Converted image preview',
        });
        resultDiv.classList.remove('hidden');
        resultDiv.innerHTML = `<p class="mt-3" style="color:var(--text-secondary)">New Size: ${ToolRenderers.formatBytes(blob.size)}</p>`;
        const downloadBtn = document.createElement('button');
        downloadBtn.className = 'btn btn-success mt-3';
        downloadBtn.textContent = 'Download Converted Image';
        downloadBtn.onclick = () => {
          const link = document.createElement('a');
          link.href = currentConvertedUrl;
          link.download = newName;
          link.click();
        };
        resultDiv.appendChild(downloadBtn);
        App.toast('Generated and optimized successfully!');
      }, format, quality);
    });
  },
});
