// ============================================
// TOOLIEST.COM — Tool Renderers Part 4
// Social, Privacy, AI, Developer tools
// ============================================
const _cs = (c) => { const b=c.querySelector('#copy-btn'); if(b) b.addEventListener('click', function(){copyToClipboard(document.getElementById('tool-output').textContent,this)}); };
const _show = (text) => { const o=document.getElementById('tool-output'),b=document.getElementById('copy-btn'); o.classList.remove('empty'); o.textContent=text; if(b){b.classList.remove('hidden');o.appendChild(b)} };
const _escapeQrWifiValue = (value) => String(value || '').replace(/([\\;,:"])/g, '\\$1');
const _normalizeQrUrl = (value) => {
  const trimmed = String(value || '').trim();
  if (!trimmed) return '';
  if (/^[a-z]+:/i.test(trimmed)) return trimmed;
  if (/^[\w.-]+\.[a-z]{2,}(?:[/?#]|$)/i.test(trimmed)) return `https://${trimmed}`;
  return trimmed;
};
const _formatBytes = (value) => {
  const bytes = Number(value || 0);
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 B';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};
const _concatUint8Arrays = (chunks) => {
  const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
  const output = new Uint8Array(totalLength);
  let offset = 0;
  chunks.forEach((chunk) => {
    output.set(chunk, offset);
    offset += chunk.length;
  });
  return output;
};
const _asciiFromBytes = (bytes, offset, length) => {
  let text = '';
  for (let index = 0; index < length; index += 1) {
    text += String.fromCharCode(bytes[offset + index]);
  }
  return text;
};
const _startsWithAscii = (bytes, text, offset = 0) => {
  if (!bytes || offset + text.length > bytes.length) return false;
  for (let index = 0; index < text.length; index += 1) {
    if (bytes[offset + index] !== text.charCodeAt(index)) return false;
  }
  return true;
};
const _readUint32BE = (bytes, offset) => (
  ((bytes[offset] << 24) >>> 0) +
  (bytes[offset + 1] << 16) +
  (bytes[offset + 2] << 8) +
  bytes[offset + 3]
);
const _readUint32LE = (bytes, offset) => (
  bytes[offset] +
  (bytes[offset + 1] << 8) +
  (bytes[offset + 2] << 16) +
  ((bytes[offset + 3] << 24) >>> 0)
);
const _writeUint32LE = (bytes, offset, value) => {
  bytes[offset] = value & 0xff;
  bytes[offset + 1] = (value >>> 8) & 0xff;
  bytes[offset + 2] = (value >>> 16) & 0xff;
  bytes[offset + 3] = (value >>> 24) & 0xff;
};
const _isJpegBytes = (bytes) => bytes?.length > 3 && bytes[0] === 0xff && bytes[1] === 0xd8;
const _isPngBytes = (bytes) => bytes?.length > 8 && _startsWithAscii(bytes, 'PNG', 1);
const _isWebpBytes = (bytes) => bytes?.length > 12 && _startsWithAscii(bytes, 'RIFF', 0) && _startsWithAscii(bytes, 'WEBP', 8);
const _createCleanImageName = (fileName, fallbackExtension) => {
  const raw = String(fileName || 'image').trim() || 'image';
  const dotIndex = raw.lastIndexOf('.');
  const baseName = dotIndex > 0 ? raw.slice(0, dotIndex) : raw;
  const extension = dotIndex > 0 ? raw.slice(dotIndex + 1) : fallbackExtension;
  return `cleaned-${baseName}.${extension || fallbackExtension || 'img'}`;
};
const _downloadBlob = (blob, fileName) => {
  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = objectUrl;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
};
const _stripJpegMetadata = (bytes) => {
  if (!_isJpegBytes(bytes)) throw new Error('This JPEG file could not be parsed safely.');
  const keptSegments = [bytes.slice(0, 2)];
  const removedLabels = new Set();
  let offset = 2;

  while (offset < bytes.length) {
    if (bytes[offset] !== 0xff) {
      keptSegments.push(bytes.slice(offset));
      break;
    }

    const markerStart = offset;
    while (offset < bytes.length && bytes[offset] === 0xff) offset += 1;
    if (offset >= bytes.length) break;

    const marker = bytes[offset];
    if ((marker >= 0xd0 && marker <= 0xd7) || marker === 0x01 || marker === 0xd9) {
      keptSegments.push(bytes.slice(markerStart, offset + 1));
      offset += 1;
      if (marker === 0xd9) break;
      continue;
    }

    if (marker === 0xda) {
      keptSegments.push(bytes.slice(markerStart));
      break;
    }

    if (offset + 2 >= bytes.length) {
      throw new Error('This JPEG file has an invalid metadata segment.');
    }

    const segmentLength = (bytes[offset + 1] << 8) | bytes[offset + 2];
    const segmentEnd = offset + 1 + segmentLength;
    if (segmentLength < 2 || segmentEnd > bytes.length) {
      throw new Error('This JPEG file has a damaged metadata block.');
    }

    const payload = bytes.slice(offset + 3, segmentEnd);
    let keepSegment = true;

    if (marker === 0xe1) {
      keepSegment = false;
      removedLabels.add(_startsWithAscii(payload, 'Exif') ? 'EXIF metadata' : 'APP1 metadata');
      if (_startsWithAscii(payload, 'http://ns.adobe.com/xap/1.0/')) removedLabels.add('XMP metadata');
    } else if (marker === 0xed) {
      keepSegment = false;
      removedLabels.add('IPTC/Photoshop metadata');
    } else if (marker === 0xfe) {
      keepSegment = false;
      removedLabels.add('comment metadata');
    } else if (marker === 0xe2) {
      const keepsColorProfile = _startsWithAscii(payload, 'ICC_PROFILE') || _startsWithAscii(payload, 'FPXR');
      if (!keepsColorProfile) {
        keepSegment = false;
        removedLabels.add('APP2 metadata');
      }
    } else if (marker >= 0xe3 && marker <= 0xef && marker !== 0xee) {
      keepSegment = false;
      removedLabels.add(`APP${marker - 0xe0} metadata`);
    }

    if (keepSegment) keptSegments.push(bytes.slice(markerStart, segmentEnd));
    offset = segmentEnd;
  }

  return {
    bytes: _concatUint8Arrays(keptSegments),
    removedLabels: Array.from(removedLabels),
  };
};
const _stripPngMetadata = (bytes) => {
  if (!_isPngBytes(bytes)) throw new Error('This PNG file could not be parsed safely.');
  const signature = bytes.slice(0, 8);
  const keptChunks = [signature];
  const removedLabels = new Set();
  let offset = 8;

  while (offset + 12 <= bytes.length) {
    const chunkLength = _readUint32BE(bytes, offset);
    const chunkType = _asciiFromBytes(bytes, offset + 4, 4);
    const chunkEnd = offset + 12 + chunkLength;
    if (chunkEnd > bytes.length) {
      throw new Error('This PNG file has a damaged metadata chunk.');
    }

    const chunkBytes = bytes.slice(offset, chunkEnd);
    const removableChunks = new Map([
      ['eXIf', 'EXIF metadata'],
      ['tEXt', 'text metadata'],
      ['zTXt', 'compressed text metadata'],
      ['iTXt', 'international text metadata'],
      ['tIME', 'timestamp metadata'],
    ]);

    if (removableChunks.has(chunkType)) {
      removedLabels.add(removableChunks.get(chunkType));
    } else {
      keptChunks.push(chunkBytes);
    }

    offset = chunkEnd;
    if (chunkType === 'IEND') break;
  }

  return {
    bytes: _concatUint8Arrays(keptChunks),
    removedLabels: Array.from(removedLabels),
  };
};
const _stripWebpMetadata = (bytes) => {
  if (!_isWebpBytes(bytes)) throw new Error('This WebP file could not be parsed safely.');
  const chunks = [];
  const removedLabels = new Set();
  let offset = 12;
  let vp8xChunkIndex = -1;

  while (offset + 8 <= bytes.length) {
    const chunkType = _asciiFromBytes(bytes, offset, 4);
    const chunkSize = _readUint32LE(bytes, offset + 4);
    const paddedSize = chunkSize + (chunkSize % 2);
    const chunkEnd = offset + 8 + paddedSize;
    if (chunkEnd > bytes.length) {
      throw new Error('This WebP file has a damaged chunk.');
    }

    if (chunkType === 'EXIF') {
      removedLabels.add('EXIF metadata');
      offset = chunkEnd;
      continue;
    }
    if (chunkType === 'XMP ') {
      removedLabels.add('XMP metadata');
      offset = chunkEnd;
      continue;
    }

    const chunkBytes = bytes.slice(offset, chunkEnd);
    if (chunkType === 'VP8X' && chunkSize >= 10) {
      vp8xChunkIndex = chunks.length;
    }
    chunks.push({ type: chunkType, bytes: chunkBytes });
    offset = chunkEnd;
  }

  if (vp8xChunkIndex >= 0 && removedLabels.size) {
    const updatedChunk = chunks[vp8xChunkIndex].bytes.slice();
    updatedChunk[8] &= ~0x0c;
    chunks[vp8xChunkIndex].bytes = updatedChunk;
  }

  const payload = _concatUint8Arrays(chunks.map((chunk) => chunk.bytes));
  const output = new Uint8Array(12 + payload.length);
  output.set([0x52, 0x49, 0x46, 0x46], 0);
  _writeUint32LE(output, 4, payload.length + 4);
  output.set([0x57, 0x45, 0x42, 0x50], 8);
  output.set(payload, 12);

  return {
    bytes: output,
    removedLabels: Array.from(removedLabels),
  };
};
const _buildLosslessCleanImage = async (file) => {
  const bytes = new Uint8Array(await file.arrayBuffer());
  const originalExtension = String(file.name || '').split('.').pop()?.toLowerCase() || '';

  if (_isJpegBytes(bytes)) {
    const cleaned = _stripJpegMetadata(bytes);
    return {
      blob: new Blob([cleaned.bytes], { type: 'image/jpeg' }),
      extension: originalExtension === 'jpeg' ? 'jpeg' : 'jpg',
      removedLabels: cleaned.removedLabels,
      formatLabel: 'JPEG',
      lossless: true,
    };
  }

  if (_isPngBytes(bytes)) {
    const cleaned = _stripPngMetadata(bytes);
    return {
      blob: new Blob([cleaned.bytes], { type: 'image/png' }),
      extension: 'png',
      removedLabels: cleaned.removedLabels,
      formatLabel: 'PNG',
      lossless: true,
    };
  }

  if (_isWebpBytes(bytes)) {
    const cleaned = _stripWebpMetadata(bytes);
    return {
      blob: new Blob([cleaned.bytes], { type: 'image/webp' }),
      extension: 'webp',
      removedLabels: cleaned.removedLabels,
      formatLabel: 'WebP',
      lossless: true,
    };
  }

  throw new Error('Lossless metadata stripping is currently available for JPEG, PNG, and WebP files. HEIC/HEIF images need conversion first, which would re-encode the image.');
};
const _renderQrToCanvas = (canvas, payload, options = {}) => {
  if (typeof qrcode !== 'function') {
    throw new Error('Bundled QR engine unavailable');
  }

  const size = Math.max(128, Math.min(1024, Number(options.size || 384)));
  const quietZoneModules = Math.max(0, Math.min(12, Number(options.margin || 4)));
  const errorCorrectionLevel = options.errorCorrectionLevel || 'M';
  const darkColor = options.darkColor || '#111827';
  const lightColor = options.lightColor || '#ffffff';

  const qr = qrcode(0, errorCorrectionLevel);
  qr.addData(payload);
  qr.make();

  const moduleCount = qr.getModuleCount();
  const totalModules = moduleCount + quietZoneModules * 2;
  const cellSize = Math.max(1, Math.floor(size / totalModules));
  const drawnSize = totalModules * cellSize;
  const offset = Math.floor((size - drawnSize) / 2);
  const context = canvas.getContext('2d');

  canvas.width = size;
  canvas.height = size;
  context.imageSmoothingEnabled = false;
  context.clearRect(0, 0, size, size);
  context.fillStyle = lightColor;
  context.fillRect(0, 0, size, size);

  for (let row = 0; row < moduleCount; row += 1) {
    for (let col = 0; col < moduleCount; col += 1) {
      if (!qr.isDark(row, col)) continue;
      context.fillStyle = darkColor;
      context.fillRect(
        offset + (quietZoneModules + col) * cellSize,
        offset + (quietZoneModules + row) * cellSize,
        cellSize,
        cellSize
      );
    }
  }

  return { size, moduleCount, cellSize };
};

Object.assign(ToolRenderers.renderers, {
  // ===== SOCIAL MEDIA =====
  'twitter-counter'(c) {
    c.innerHTML=`<div class="tool-workspace-body"><div class="input-group"><label>Compose your tweet</label><textarea id="tw-input" rows="5" placeholder="What's happening?" maxlength="280"></textarea></div><div style="display:flex;justify-content:space-between;align-items:center"><span id="tw-count" style="font-size:2rem;font-weight:800;color:var(--accent-success)">0</span><span style="color:var(--text-tertiary)">/ 280</span></div><div style="height:6px;background:var(--bg-tertiary);border-radius:99px;margin-top:8px"><div id="tw-bar" style="height:100%;width:0%;border-radius:99px;transition:all 0.3s;background:var(--accent-success)"></div></div></div>`;
    document.getElementById('tw-input').addEventListener('input',(e)=>{const len=e.target.value.length;const pct=(len/280)*100;const color=pct>100?'#f43f5e':pct>80?'#f59e0b':'#10b981';document.getElementById('tw-count').textContent=len;document.getElementById('tw-count').style.color=color;const bar=document.getElementById('tw-bar');bar.style.width=Math.min(100,pct)+'%';bar.style.background=color});
  },

  'instagram-caption'(c) {
    c.innerHTML=`<div class="tool-workspace-body"><div class="input-group"><label>Topic / Describe your post</label><input type="text" id="ic-topic" placeholder="sunset at the beach"></div><div class="input-group"><label>Mood</label><select id="ic-mood"><option value="inspiring">✨ Inspiring</option><option value="funny">😂 Funny</option><option value="professional">💼 Professional</option></select></div><button class="btn btn-primary mb-4">✨ Generate Caption</button><div class="input-group"><label>Generated Caption</label><div class="output-area empty" id="tool-output"><button class="copy-btn hidden" id="copy-btn">Copy</button></div></div></div>`;
    c.querySelector('.btn-primary').addEventListener('click',()=>{const topic=document.getElementById('ic-topic').value;const mood=document.getElementById('ic-mood').value;if(!topic){App.toast('Enter a topic first');return}_show(AI.generateCaption(topic,mood))});
    _cs(c);
  },

  'hashtag-generator'(c) {
    c.innerHTML=`<div class="tool-workspace-body"><div class="input-group"><label>Enter topic or keyword</label><input type="text" id="hg-topic" placeholder="fitness, travel, food..."></div><div class="input-group"><label>Number of hashtags: <span id="hg-cnt">20</span></label><input type="range" id="hg-count" min="5" max="30" value="20"></div><button class="btn btn-primary mb-4">🤖 Generate Hashtags</button><div class="input-group"><label>Generated Hashtags</label><div class="output-area empty" id="tool-output" style="line-height:2"><button class="copy-btn hidden" id="copy-btn">Copy</button></div></div></div>`;
    document.getElementById('hg-count').addEventListener('input',(e)=>document.getElementById('hg-cnt').textContent=e.target.value);
    c.querySelector('.btn-primary').addEventListener('click',()=>{const topic=document.getElementById('hg-topic').value;const count=+document.getElementById('hg-count').value;if(!topic)return;const tags=AI.generateHashtags(topic,count);_show(tags.join(' '))});
    _cs(c);
  },

  'youtube-thumbnail'(c) {
    c.innerHTML=`<div class="tool-workspace-body"><div class="input-group"><label>Upload Thumbnail Image</label><div class="file-upload-zone" id="yt-drop"><div class="upload-icon">▶️</div><p>Drop thumbnail or click to upload</p><input type="file" id="yt-file" accept="image/*" style="display:none"></div></div><div class="input-group"><label>Video Title</label><input type="text" id="yt-title" value="10 Tips That Will Change Your Life" placeholder="Video Title"></div><div class="input-group"><label>Channel Name</label><input type="text" id="yt-channel" value="My Channel" placeholder="Channel Name"></div><div class="mt-4" id="yt-preview"><div style="background:var(--bg-secondary);border-radius:var(--radius-md);overflow:hidden;max-width:400px"><div id="yt-thumb" style="width:100%;aspect-ratio:16/9;background:var(--bg-tertiary);display:flex;align-items:center;justify-content:center;font-size:3rem;position:relative">🎬<div style="position:absolute;bottom:8px;right:8px;background:rgba(0,0,0,0.8);padding:2px 6px;border-radius:4px;font-size:0.75rem;color:white">12:34</div></div><div style="padding:12px;display:flex;gap:10px"><div style="width:36px;height:36px;border-radius:50%;background:var(--accent-primary);flex-shrink:0"></div><div><div id="yt-t-display" style="font-size:0.9rem;font-weight:600;line-height:1.3">10 Tips That Will Change Your Life</div><div id="yt-c-display" style="font-size:0.8rem;color:var(--text-tertiary);margin-top:2px">My Channel · 1.2M views · 2 days ago</div></div></div></div></div></div>`;
    const zone=document.getElementById('yt-drop'),fi=document.getElementById('yt-file');
    zone.addEventListener('click',()=>fi.click());
    fi.addEventListener('change',(e)=>{const file=e.target.files[0];if(!file)return;const reader=new FileReader();reader.onload=(ev)=>{document.getElementById('yt-thumb').style.background=`url(${ev.target.result}) center/cover`;document.getElementById('yt-thumb').textContent=''};reader.readAsDataURL(file)});
    document.getElementById('yt-title').addEventListener('input',(e)=>document.getElementById('yt-t-display').textContent=e.target.value);
    document.getElementById('yt-channel').addEventListener('input',(e)=>document.getElementById('yt-c-display').textContent=e.target.value+' · 1.2M views · 2 days ago');
  },

  // ===== PRIVACY =====
  'password-security-suite'(c) {
    c.innerHTML=`<div class="tool-workspace-body"><div style="display:grid;grid-template-columns:1fr;gap:24px;"><div><div class="input-group"><label>Password</label><input type="text" id="ps-input" placeholder="Type a password, or generate one..."></div><div style="height:8px;background:var(--bg-tertiary);border-radius:99px;margin:16px 0"><div id="ps-bar" style="height:100%;width:0%;border-radius:99px;transition:all 0.3s"></div></div><div class="stat-card text-center mb-4"><div class="stat-num" id="ps-score">-</div><div class="stat-lbl" id="ps-label">Enter a password</div></div><div id="ps-tips"></div></div><div style="padding:20px;background:var(--bg-glass);border:1px solid var(--border-color);border-radius:var(--radius-md);"><h3 style="margin-bottom:16px;font-size:1rem;">Generate Strong Password</h3><div class="input-group"><label>Length: <span id="pg-len-val">16</span></label><input type="range" id="pg-len" min="4" max="64" value="16"></div><div class="checkbox-group mt-3"><label class="checkbox-label"><input type="checkbox" id="pg-upper" checked><span class="checkmark">✓</span> Uppercase</label><label class="checkbox-label"><input type="checkbox" id="pg-lower" checked><span class="checkmark">✓</span> Lowercase</label><label class="checkbox-label"><input type="checkbox" id="pg-nums" checked><span class="checkmark">✓</span> Numbers</label><label class="checkbox-label"><input type="checkbox" id="pg-syms" checked><span class="checkmark">✓</span> Symbols</label></div><button class="btn btn-primary w-full mt-4" id="pg-gen">🔑 Generate & Check</button></div></div><button class="btn btn-secondary w-full mt-4" id="ps-copy">Copy Password</button></div>`;
    const checker = () => {
      const pw = document.getElementById('ps-input').value; let score=0; const tips=[];
      if(pw.length>=8)score+=20; else tips.push('Use at least 8 characters');
      if(pw.length>=12)score+=10; if(pw.length>=16)score+=10;
      if(/[a-z]/.test(pw))score+=10; else tips.push('Add lowercase letters');
      if(/[A-Z]/.test(pw))score+=10; else tips.push('Add uppercase letters');
      if(/[0-9]/.test(pw))score+=10; else tips.push('Add numbers');
      if(/[^a-zA-Z0-9]/.test(pw))score+=15; else tips.push('Add special characters');
      if(!/(.)\1{2,}/.test(pw))score+=5; else tips.push('Avoid repeated characters');
      if(!/^(123|abc|qwerty|password)/i.test(pw))score+=10; else tips.push('Avoid common patterns');
      const labels=[['Very Weak','#f43f5e'],['Weak','#f59e0b'],['Fair','#eab308'],['Strong','#10b981'],['Very Strong','#06b6d4']];
      const idx = pw ? Math.min(4,Math.floor(score/20)) : 0;
      document.getElementById('ps-score').textContent = pw ? labels[idx][0] : '-';
      document.getElementById('ps-score').style.color = pw ? labels[idx][1] : '';
      document.getElementById('ps-label').textContent = pw ? `Score: ${score}/100` : 'Enter a password';
      const bar = document.getElementById('ps-bar');
      bar.style.width = pw ? score+'%' : '0%';
      bar.style.background = pw ? labels[idx][1] : '';
      document.getElementById('ps-tips').innerHTML = (pw && tips.length) ? '<div style="margin-top:12px"><p style="font-size:0.85rem;color:var(--text-secondary);margin-bottom:8px">💡 Suggestions:</p>'+tips.map(t=>`<div style="font-size:0.85rem;color:var(--text-tertiary);padding:4px 0">• ${t}</div>`).join('')+'</div>' : '';
    };
    document.getElementById('ps-input').addEventListener('input', checker);
    document.getElementById('pg-len').addEventListener('input', (e)=>document.getElementById('pg-len-val').textContent=e.target.value);
    document.getElementById('pg-gen').addEventListener('click', ()=>{
      let chars='';
      if(document.getElementById('pg-upper').checked)chars+='ABCDEFGHIJKLMNOPQRSTUVWXYZ';
      if(document.getElementById('pg-lower').checked)chars+='abcdefghijklmnopqrstuvwxyz';
      if(document.getElementById('pg-nums').checked)chars+='0123456789';
      if(document.getElementById('pg-syms').checked)chars+='!@#$%^&*()_+-=[]{}|;:,.<>?';
      if(!chars){App.toast('Select at least one option');return;}
      const len=+document.getElementById('pg-len').value;
      let pw=''; const arr=new Uint32Array(len); crypto.getRandomValues(arr);
      for(let i=0;i<len;i++) pw+=chars[arr[i]%chars.length];
      document.getElementById('ps-input').value = pw;
      checker();
    });
    document.getElementById('ps-copy').addEventListener('click', ()=>{
       const pw = document.getElementById('ps-input').value;
       if(pw) copyToClipboard(pw, document.getElementById('ps-copy'));
    });
    document.getElementById('pg-gen').click();
  },

  'uuid-generator'(c) {
    c.innerHTML=`<div class="tool-workspace-body"><div class="input-group"><label>Number of UUIDs</label><input type="number" id="uu-count" value="5" min="1" max="100"></div><button class="btn btn-primary mb-4">🆔 Generate UUIDs</button><div class="input-group"><label>Generated UUIDs</label><div class="output-area" id="tool-output"><button class="copy-btn" id="copy-btn">Copy</button></div></div></div>`;
    const gen=()=>{const count=+document.getElementById('uu-count').value;const uuids=[];for(let i=0;i<count;i++){uuids.push('xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g,(ch)=>{const r=crypto.getRandomValues(new Uint8Array(1))[0]%16;const v=ch==='x'?r:(r&0x3|0x8);return v.toString(16)}))}_show(uuids.join('\n'))};
    c.querySelector('.btn-primary').addEventListener('click',gen);_cs(c);gen();
  },

  'fake-data-generator'(c) {
    const fNames=['James','Emma','Liam','Olivia','Noah','Ava','William','Sophia','Benjamin','Mia','Lucas','Charlotte','Henry','Amelia','Alexander','Harper'];
    const lNames=['Smith','Johnson','Williams','Brown','Jones','Garcia','Miller','Davis','Rodriguez','Martinez','Hernandez','Lopez','Wilson','Anderson','Thomas','Taylor'];
    const domains=['gmail.com','yahoo.com','outlook.com','proton.me','mail.com'];
    const streets=['Oak St','Maple Ave','Cedar Blvd','Pine Dr','Elm Way','Birch Ln','Willow Rd','Ash Ct'];
    const cities=['New York','Los Angeles','Chicago','Houston','Phoenix','Philadelphia','San Antonio','San Diego','Dallas','Austin'];
    c.innerHTML=`<div class="tool-workspace-body"><div class="input-group"><label>Number of records</label><input type="number" id="fd-count" value="5" min="1" max="50"></div><div class="checkbox-group mb-4"><label class="checkbox-label"><input type="checkbox" id="fd-name" checked><span class="checkmark">✓</span> Name</label><label class="checkbox-label"><input type="checkbox" id="fd-email" checked><span class="checkmark">✓</span> Email</label><label class="checkbox-label"><input type="checkbox" id="fd-phone" checked><span class="checkmark">✓</span> Phone</label><label class="checkbox-label"><input type="checkbox" id="fd-addr" checked><span class="checkmark">✓</span> Address</label></div><button class="btn btn-primary mb-4">🎭 Generate Data</button><div class="input-group"><label>Generated Data</label><div class="output-area" id="tool-output" style="max-height:400px;overflow:auto"><button class="copy-btn" id="copy-btn">Copy</button></div></div></div>`;
    c.querySelector('.btn-primary').addEventListener('click',()=>{const count=+document.getElementById('fd-count').value;const records=[];for(let i=0;i<count;i++){const fn=fNames[Math.floor(Math.random()*fNames.length)];const ln=lNames[Math.floor(Math.random()*lNames.length)];const r={};if(document.getElementById('fd-name').checked)r.name=fn+' '+ln;if(document.getElementById('fd-email').checked)r.email=fn.toLowerCase()+'.'+ln.toLowerCase()+'@'+domains[Math.floor(Math.random()*domains.length)];if(document.getElementById('fd-phone').checked)r.phone='+1-'+Math.floor(200+Math.random()*800)+'-'+Math.floor(100+Math.random()*900)+'-'+Math.floor(1000+Math.random()*9000);if(document.getElementById('fd-addr').checked)r.address=Math.floor(100+Math.random()*9900)+' '+streets[Math.floor(Math.random()*streets.length)]+', '+cities[Math.floor(Math.random()*cities.length)];records.push(r)}_show(JSON.stringify(records,null,2))});
    _cs(c);
  },

   // ===== DEVELOPER =====
  'cron-parser'(c) {
    c.innerHTML=`<div class="tool-workspace-body"><div class="input-group"><label>Cron Expression</label><input type="text" id="cp-input" value="0 9 * * 1-5" placeholder="* * * * *"></div><div style="font-size:0.8rem;color:var(--text-tertiary);margin-bottom:16px;font-family:var(--font-mono)">minute hour day-of-month month day-of-week</div><div class="stat-card" id="cp-result" style="text-align:left;padding:20px"></div><div class="color-values mt-4" id="cp-fields"></div></div>`;
    const explain=()=>{const cron=document.getElementById('cp-input').value.trim().split(/\s+/);if(cron.length<5){document.getElementById('cp-result').innerHTML='<span style="color:var(--accent-tertiary)">Need 5 fields: minute hour day month weekday</span>';return}const labels=['Minute','Hour','Day of Month','Month','Day of Week'];const explain_field=(val,label)=>{if(val==='*')return'Every '+label.toLowerCase();if(val.includes('/'))return'Every '+val.split('/')[1]+' '+label.toLowerCase()+'(s)';if(val.includes('-'))return label+' '+val.split('-')[0]+' through '+val.split('-')[1];if(val.includes(','))return label+' '+val;return label+' '+val};const parts=labels.map((l,i)=>explain_field(cron[i],l));const weekdays=['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];let readable='Runs '+parts.join(', ');document.getElementById('cp-result').innerHTML=`<div style="font-weight:600;margin-bottom:8px;color:var(--accent-primary)">📅 Schedule</div><p>${ToolRenderers.escapeHtml(readable)}</p>`;document.getElementById('cp-fields').innerHTML=labels.map((l,i)=>`<div class="color-value-item"><span>${l}</span><span>${ToolRenderers.escapeHtml(cron[i]||'*')}</span></div>`).join('')};
    document.getElementById('cp-input').addEventListener('input',explain);explain();
  },

  'diff-checker'(c) {
    c.innerHTML=`<div class="tool-workspace-body"><div style="display:grid;grid-template-columns:1fr 1fr;gap:16px"><div class="input-group"><label>Original Text</label><textarea id="dc-left" rows="10" placeholder="Original text...">Hello World\nThis is a test\nLine three</textarea></div><div class="input-group"><label>Modified Text</label><textarea id="dc-right" rows="10" placeholder="Modified text...">Hello World\nThis is a modified test\nLine three\nNew line four</textarea></div></div><button class="btn btn-primary mt-4 mb-4">🔍 Compare</button><div id="dc-results"></div></div>`;
    c.querySelector('.btn-primary').addEventListener('click',()=>{const left=document.getElementById('dc-left').value.split('\n');const right=document.getElementById('dc-right').value.split('\n');const maxLen=Math.max(left.length,right.length);let html='<div style="font-family:var(--font-mono);font-size:0.85rem">';for(let i=0;i<maxLen;i++){const l=left[i]??'';const r=right[i]??'';if(l===r){html+=`<div style="padding:4px 12px;border-left:3px solid var(--border-color)">${l?ToolRenderers.escapeHtml(l):'&nbsp;'}</div>`}else{if(l)html+=`<div style="padding:4px 12px;background:rgba(244,63,94,0.1);border-left:3px solid #f43f5e;color:#f43f5e">- ${ToolRenderers.escapeHtml(l)}</div>`;if(r)html+=`<div style="padding:4px 12px;background:rgba(16,185,129,0.1);border-left:3px solid #10b981;color:#10b981">+ ${ToolRenderers.escapeHtml(r)}</div>`}}html+='</div>';document.getElementById('dc-results').innerHTML=html});
  },

  'sql-formatter'(c) {
    ToolRenderers.layout(c,'<label>Paste SQL Query</label><textarea id="tool-input" rows="8" placeholder="SELECT * FROM users WHERE id = 1 AND name = \'John\' ORDER BY created_at DESC"></textarea>','','<button class="btn btn-primary">✨ Format SQL</button>',()=>{let sql=document.getElementById('tool-input').value;const keywords=['SELECT','FROM','WHERE','AND','OR','ORDER BY','GROUP BY','HAVING','LIMIT','OFFSET','INSERT INTO','VALUES','UPDATE','SET','DELETE FROM','JOIN','LEFT JOIN','RIGHT JOIN','INNER JOIN','ON','AS','IN','NOT','NULL','IS','LIKE','BETWEEN','EXISTS','UNION','ALL','DISTINCT','COUNT','SUM','AVG','MIN','MAX','CREATE TABLE','ALTER TABLE','DROP TABLE','INDEX'];keywords.forEach(kw=>{sql=sql.replace(new RegExp('\\b'+kw.replace(/ /g,'\\s+')+'\\b','gi'),'\n'+kw.toUpperCase())});sql=sql.replace(/,/g,',\n  ').trim();ToolRenderers.setOutput(sql)});
    _cs(c);
  },

  'chmod-calculator'(c) {
    c.innerHTML=`<div class="tool-workspace-body"><h3 style="font-size:0.95rem;color:var(--text-secondary);margin-bottom:16px">Set Permissions</h3><div style="display:grid;grid-template-columns:auto 1fr 1fr 1fr;gap:8px;align-items:center;font-size:0.9rem"><div></div><div style="text-align:center;font-weight:600">Read (4)</div><div style="text-align:center;font-weight:600">Write (2)</div><div style="text-align:center;font-weight:600">Execute (1)</div><div style="font-weight:600">Owner</div><div style="text-align:center"><input type="checkbox" id="ch-or" checked></div><div style="text-align:center"><input type="checkbox" id="ch-ow" checked></div><div style="text-align:center"><input type="checkbox" id="ch-ox" checked></div><div style="font-weight:600">Group</div><div style="text-align:center"><input type="checkbox" id="ch-gr" checked></div><div style="text-align:center"><input type="checkbox" id="ch-gw"></div><div style="text-align:center"><input type="checkbox" id="ch-gx" checked></div><div style="font-weight:600">Others</div><div style="text-align:center"><input type="checkbox" id="ch-tr" checked></div><div style="text-align:center"><input type="checkbox" id="ch-tw"></div><div style="text-align:center"><input type="checkbox" id="ch-tx" checked></div></div><div class="result-stats mt-4" id="ch-results"></div></div>`;
    const update=()=>{const g=id=>document.getElementById(id).checked?1:0;const owner=g('ch-or')*4+g('ch-ow')*2+g('ch-ox');const group=g('ch-gr')*4+g('ch-gw')*2+g('ch-gx');const others=g('ch-tr')*4+g('ch-tw')*2+g('ch-tx');const numeric=`${owner}${group}${others}`;const toSym=(v)=>(v&4?'r':'-')+(v&2?'w':'-')+(v&1?'x':'-');const symbolic=toSym(owner)+toSym(group)+toSym(others);document.getElementById('ch-results').innerHTML=[['Numeric',numeric],['Symbolic',symbolic],['Command',`chmod ${numeric}`]].map(([l,v])=>`<div class="stat-card" style="cursor:pointer" onclick="copyToClipboard('${v}')"><div class="stat-num" style="font-size:1.2rem">${v}</div><div class="stat-lbl">${l}</div></div>`).join('')};
    c.querySelectorAll('input[type="checkbox"]').forEach(cb=>cb.addEventListener('change',update));update();
  },

  'image-exif-stripper'(c) {
    c.innerHTML = `<div class="tool-workspace-body">
      <div class="file-upload-zone" id="ex-drop">
        <div class="upload-icon">🥷</div>
        <p>Drop image or click to upload</p>
        <p class="upload-hint">Lossless cleanup for JPEG, PNG, and WebP. Everything stays in your browser.</p>
        <input type="file" id="ex-file" accept="image/jpeg,image/png,image/webp" style="display:none">
      </div>
      <div class="result-stats mt-4 hidden" id="ex-stats"></div>
      <div id="ex-metadata" class="mt-4 hidden" style="background:rgba(244,63,94,0.1);border:1px solid #f43f5e;border-radius:var(--radius-md);padding:16px;">
        <h3 style="color:#f43f5e;font-size:1rem;display:flex;align-items:center;gap:8px">Metadata Found</h3>
        <p style="font-size:0.85rem;margin-top:8px;color:var(--text-secondary)" id="ex-meta-desc">Tracking metadata was detected and will be removed from the clean download below.</p>
      </div>
      <div id="ex-clean" class="mt-4 hidden" style="background:rgba(16,185,129,0.1);border:1px solid #10b981;border-radius:var(--radius-md);padding:16px;">
        <h3 id="ex-clean-title" style="color:#10b981;font-size:1rem;display:flex;align-items:center;gap:8px">Clean image ready</h3>
        <p id="ex-clean-desc" style="font-size:0.85rem;margin-top:8px;color:var(--text-secondary)">Your privacy-safe image is ready to download.</p>
        <div id="ex-preview-wrap" class="mt-3 hidden" style="padding:12px;background:rgba(255,255,255,0.04);border:1px solid var(--border-color);border-radius:var(--radius-md);text-align:center">
          <img id="ex-preview" alt="Cleaned image preview" style="max-width:100%;max-height:320px;border-radius:var(--radius-md);display:block;margin:0 auto">
        </div>
        <div id="ex-action" class="mt-3"></div>
      </div>
    </div>`;

    const zone = document.getElementById('ex-drop');
    const fileInput = document.getElementById('ex-file');
    const statsDiv = document.getElementById('ex-stats');
    const metaWarn = document.getElementById('ex-metadata');
    const metaDesc = document.getElementById('ex-meta-desc');
    const cleanDiv = document.getElementById('ex-clean');
    const cleanTitle = document.getElementById('ex-clean-title');
    const cleanDesc = document.getElementById('ex-clean-desc');
    const actionDiv = document.getElementById('ex-action');
    const previewWrap = document.getElementById('ex-preview-wrap');
    const previewImage = document.getElementById('ex-preview');
    let activePreviewUrl = '';

    zone.addEventListener('click', () => fileInput.click());
    zone.addEventListener('dragover', (e) => { e.preventDefault(); zone.classList.add('drag-over'); });
    zone.addEventListener('dragleave', () => zone.classList.remove('drag-over'));
    zone.addEventListener('drop', (e) => { e.preventDefault(); zone.classList.remove('drag-over'); handleFile(e.dataTransfer.files[0]); });
    fileInput.addEventListener('change', (e) => handleFile(e.target.files[0]));

    const resetPreview = () => {
      if (activePreviewUrl) {
        URL.revokeObjectURL(activePreviewUrl);
        activePreviewUrl = '';
      }
      previewImage.removeAttribute('src');
      previewWrap.classList.add('hidden');
    };

    const renderStats = (items) => {
      statsDiv.classList.remove('hidden');
      statsDiv.innerHTML = items.map(([label, value]) => `
        <div class="stat-card">
          <div class="stat-num" style="font-size:1rem;word-break:break-word">${ToolRenderers.escapeHtml(value)}</div>
          <div class="stat-lbl">${ToolRenderers.escapeHtml(label)}</div>
        </div>
      `).join('');
    };

    async function handleFile(file) {
      fileInput.value = '';
      if (!file || !file.type.startsWith('image/')) {
        App.toast('Please upload an image file', 'error');
        return;
      }

      metaWarn.classList.add('hidden');
      cleanDiv.classList.add('hidden');
      actionDiv.innerHTML = '';
      resetPreview();

      renderStats([
        ['File Name', file.name],
        ['Format', (file.type.split('/')[1] || 'image').toUpperCase()],
        ['Original Size', _formatBytes(file.size)],
        ['Status', 'Scanning and preparing clean download'],
      ]);

      try {
        const startedAt = performance.now();
        const cleaned = await _buildLosslessCleanImage(file);
        const cleanBlob = cleaned.blob;
        const removedLabels = cleaned.removedLabels;
        const removedText = removedLabels.length ? removedLabels.join(', ') : 'No removable privacy metadata detected';
        const savedBytes = Math.max(0, file.size - cleanBlob.size);
        const downloadName = _createCleanImageName(file.name, cleaned.extension);

        renderStats([
          ['File Name', file.name],
          ['Format', cleaned.formatLabel],
          ['Original Size', _formatBytes(file.size)],
          ['Clean Size', _formatBytes(cleanBlob.size)],
          ['Method', cleaned.lossless ? 'Lossless metadata stripping' : 'Re-encoded export'],
        ]);

        if (removedLabels.length) {
          metaWarn.classList.remove('hidden');
          metaDesc.textContent = `Removed ${removedText}. Download the clean image below.`;
          cleanTitle.textContent = 'Metadata removed successfully';
          cleanDesc.textContent = 'Your clean image is ready. This version was rewritten without re-encoding, so the picture quality stays the same.';
        } else {
          metaWarn.classList.add('hidden');
          cleanTitle.textContent = 'No removable metadata detected';
          cleanDesc.textContent = 'This file did not contain removable EXIF, XMP, or text metadata. You can still download the verified copy below.';
        }

        cleanDiv.classList.remove('hidden');
        activePreviewUrl = URL.createObjectURL(cleanBlob);
        previewImage.src = activePreviewUrl;
        previewWrap.classList.remove('hidden');

        actionDiv.innerHTML = `
          <div style="display:flex;gap:12px;flex-wrap:wrap">
            <button type="button" class="btn btn-success" id="ex-download">Download Clean Image</button>
            <button type="button" class="btn btn-secondary" id="ex-reset">Choose Another Image</button>
          </div>
          <div style="margin-top:12px;font-size:0.85rem;color:var(--text-tertiary);display:grid;gap:6px">
            <p style="margin:0"><strong>Removed:</strong> ${ToolRenderers.escapeHtml(removedText)}</p>
            <p style="margin:0"><strong>Clean size:</strong> ${ToolRenderers.escapeHtml(_formatBytes(cleanBlob.size))}${savedBytes ? ` (${ToolRenderers.escapeHtml(_formatBytes(savedBytes))} smaller)` : ''}</p>
          </div>
        `;

        document.getElementById('ex-download')?.addEventListener('click', () => {
          _downloadBlob(cleanBlob, downloadName);
        });
        document.getElementById('ex-reset')?.addEventListener('click', () => {
          fileInput.click();
        });

        if (typeof App !== 'undefined' && typeof App.recordToolPerformance === 'function') {
          App.recordToolPerformance('image-exif-stripper', 'Strip metadata', performance.now() - startedAt);
        }
      } catch (error) {
        console.error('[Tooliest] EXIF stripping failed:', error);
        metaWarn.classList.add('hidden');
        cleanDiv.classList.remove('hidden');
        cleanTitle.textContent = 'Could not create a clean download';
        cleanDesc.textContent = error.message || 'This image format could not be processed safely in your browser.';
        actionDiv.innerHTML = `
          <div style="display:flex;gap:12px;flex-wrap:wrap">
            <button type="button" class="btn btn-secondary" id="ex-try-again">Choose Another Image</button>
          </div>
        `;
        document.getElementById('ex-try-again')?.addEventListener('click', () => fileInput.click());
        App.toast(error.message || 'Could not remove the image metadata.', 'error');
      }
    }
  },

  'qr-code-generator'(c) {
    c.innerHTML = `<div class="tool-workspace-body">
      <div class="input-group">
        <label for="qr-mode">QR Code Type</label>
        <select id="qr-mode">
          <option value="url">URL</option>
          <option value="text">Plain Text</option>
          <option value="email">Email</option>
          <option value="phone">Phone Number</option>
          <option value="wifi">Wi-Fi Access</option>
        </select>
      </div>
      <div id="qr-fields"></div>
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:12px;margin-top:16px">
        <div class="input-group">
          <label for="qr-size">Image Size</label>
          <select id="qr-size">
            <option value="256">256 px</option>
            <option value="384" selected>384 px</option>
            <option value="512">512 px</option>
            <option value="768">768 px</option>
          </select>
        </div>
        <div class="input-group">
          <label for="qr-margin">Quiet Zone</label>
          <select id="qr-margin">
            <option value="1">1</option>
            <option value="2">2</option>
            <option value="4" selected>4</option>
            <option value="6">6</option>
          </select>
        </div>
        <div class="input-group">
          <label for="qr-level">Error Correction</label>
          <select id="qr-level">
            <option value="L">Low</option>
            <option value="M" selected>Medium</option>
            <option value="Q">Quartile</option>
            <option value="H">High</option>
          </select>
        </div>
        <div class="input-group">
          <label for="qr-dark">Dark Color</label>
          <input type="color" id="qr-dark" value="#111827">
        </div>
        <div class="input-group">
          <label for="qr-light">Light Color</label>
          <input type="color" id="qr-light" value="#ffffff">
        </div>
      </div>
      <div style="display:flex;gap:12px;flex-wrap:wrap;margin-top:20px">
        <button class="btn btn-primary" id="qr-generate">Generate QR Code</button>
        <button class="btn btn-secondary hidden" id="qr-download">Download PNG</button>
      </div>
      <div class="stat-card mt-4" style="text-align:left">
        <div style="font-weight:700;margin-bottom:6px">Private by design</div>
        <p style="margin:0;color:var(--text-secondary);font-size:0.9rem">Tooliest creates the QR image entirely in your browser, so the content you encode is never uploaded.</p>
      </div>
      <div id="qr-preview-wrap" class="mt-4 hidden" style="text-align:center;padding:20px;background:var(--bg-glass);border:1px solid var(--border-color);border-radius:var(--radius-lg)">
        <canvas id="qr-canvas" width="384" height="384" style="max-width:100%;height:auto;border-radius:var(--radius-md);background:#fff"></canvas>
        <p id="qr-status" style="font-size:0.85rem;color:var(--text-tertiary);margin-top:12px" aria-live="polite">QR code ready for download.</p>
      </div>
    </div>`;

    const fieldRoot = document.getElementById('qr-fields');
    const modeInput = document.getElementById('qr-mode');
    const generateBtn = document.getElementById('qr-generate');
    const downloadBtn = document.getElementById('qr-download');
    const previewWrap = document.getElementById('qr-preview-wrap');
    const previewCanvas = document.getElementById('qr-canvas');
    const statusText = document.getElementById('qr-status');

    const renderFields = () => {
      const mode = modeInput.value;
      if (mode === 'wifi') {
        fieldRoot.innerHTML = `<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:12px">
          <div class="input-group"><label for="qr-ssid">Wi-Fi Name (SSID)</label><input type="text" id="qr-ssid" placeholder="Office Wi-Fi"></div>
          <div class="input-group"><label for="qr-password">Password</label><input type="text" id="qr-password" placeholder="SecurePassword123"></div>
          <div class="input-group"><label for="qr-security">Security Type</label><select id="qr-security"><option value="WPA" selected>WPA/WPA2</option><option value="WEP">WEP</option><option value="nopass">Open Network</option></select></div>
          <div class="input-group"><label for="qr-hidden">Hidden Network</label><select id="qr-hidden"><option value="false" selected>No</option><option value="true">Yes</option></select></div>
        </div>`;
        return;
      }

      const fieldConfig = {
        url: { label: 'Website URL', placeholder: 'https://tooliest.com/tools/qr-code-generator', tag: 'input', type: 'url' },
        text: { label: 'Text to Encode', placeholder: 'Type any text, code, or short message', tag: 'textarea' },
        email: { label: 'Email Address', placeholder: 'hello@example.com', tag: 'input', type: 'email' },
        phone: { label: 'Phone Number', placeholder: '+1 555 123 4567', tag: 'input', type: 'tel' },
      };
      const config = fieldConfig[mode] || fieldConfig.text;
      fieldRoot.innerHTML = `<div class="input-group">
        <label for="qr-primary">${config.label}</label>
        ${config.tag === 'textarea'
          ? `<textarea id="qr-primary" rows="4" placeholder="${config.placeholder}"></textarea>`
          : `<input type="${config.type}" id="qr-primary" placeholder="${config.placeholder}">`}
      </div>`;
    };

    const getPayload = () => {
      const mode = modeInput.value;
      if (mode === 'wifi') {
        const ssid = document.getElementById('qr-ssid')?.value.trim() || '';
        if (!ssid) {
          App.toast('Enter the Wi-Fi network name first.', 'error');
          return '';
        }
        const security = document.getElementById('qr-security')?.value || 'WPA';
        const password = security === 'nopass' ? '' : (document.getElementById('qr-password')?.value || '');
        const hidden = document.getElementById('qr-hidden')?.value === 'true' ? 'true' : 'false';
        return `WIFI:T:${security};S:${_escapeQrWifiValue(ssid)};P:${_escapeQrWifiValue(password)};H:${hidden};;`;
      }

      const primary = document.getElementById('qr-primary')?.value.trim() || '';
      if (!primary) {
        App.toast('Add something to encode first.', 'error');
        return '';
      }
      if (mode === 'url') return _normalizeQrUrl(primary);
      if (mode === 'email') return `mailto:${primary}`;
      if (mode === 'phone') return `tel:${primary.replace(/\s+/g, '')}`;
      return primary;
    };

    const generate = async () => {
      const payload = getPayload();
      if (!payload) return;
      const startedAt = performance.now();
      generateBtn.disabled = true;
      generateBtn.textContent = 'Generating...';
      try {
        const renderResult = _renderQrToCanvas(previewCanvas, payload, {
          size: Number(document.getElementById('qr-size')?.value || 384),
          margin: Number(document.getElementById('qr-margin')?.value || 4),
          errorCorrectionLevel: document.getElementById('qr-level')?.value || 'M',
          darkColor: document.getElementById('qr-dark')?.value || '#111827',
          lightColor: document.getElementById('qr-light')?.value || '#ffffff',
        });
        previewWrap.classList.remove('hidden');
        downloadBtn.classList.remove('hidden');
        statusText.textContent = `QR code ready at ${renderResult.size}px with ${renderResult.moduleCount} modules. Scan it now or download the PNG.`;
        App.recordToolPerformance('qr-code-generator', 'Generate QR Code', performance.now() - startedAt);
      } catch (error) {
        console.error('[Tooliest] QR generation failed:', error);
        App.toast('Could not generate the QR code. The bundled QR engine hit an error.', 'error');
      } finally {
        generateBtn.disabled = false;
        generateBtn.textContent = 'Generate QR Code';
      }
    };

    modeInput.addEventListener('change', renderFields);
    generateBtn.addEventListener('click', generate);
    downloadBtn.addEventListener('click', () => {
      const link = document.createElement('a');
      link.href = previewCanvas.toDataURL('image/png');
      link.download = `tooliest-${modeInput.value}-qr.png`;
      link.click();
    });

    renderFields();
  },
  'image-exif-stripper'(c) {
    c.innerHTML = `<div class="tool-workspace-body">
      <div class="file-upload-zone" id="ex-drop">
        <div class="upload-icon">🧼</div>
        <p>Drop image or click to upload</p>
        <p class="upload-hint">Lossless cleanup for JPEG, PNG, and WebP. Everything stays in your browser.</p>
        <input type="file" id="ex-file" accept="image/jpeg,image/png,image/webp" style="display:none">
      </div>
      <div class="media-preview-grid">
        ${ToolRenderers.buildUploadPreviewCard('ex-original', 'Original image')}
        ${ToolRenderers.buildUploadPreviewCard('ex-clean-preview', 'Clean output')}
      </div>
      <div class="result-stats mt-4 hidden" id="ex-stats"></div>
      <div id="ex-metadata" class="mt-4 hidden" style="background:rgba(244,63,94,0.1);border:1px solid #f43f5e;border-radius:var(--radius-md);padding:16px;">
        <h3 style="color:#f43f5e;font-size:1rem;display:flex;align-items:center;gap:8px">Metadata Found</h3>
        <p style="font-size:0.85rem;margin-top:8px;color:var(--text-secondary)" id="ex-meta-desc">Tracking metadata was detected and will be removed from the clean download below.</p>
      </div>
      <div id="ex-clean" class="mt-4 hidden" style="background:rgba(16,185,129,0.1);border:1px solid #10b981;border-radius:var(--radius-md);padding:16px;">
        <h3 id="ex-clean-title" style="color:#10b981;font-size:1rem;display:flex;align-items:center;gap:8px">Clean image ready</h3>
        <p id="ex-clean-desc" style="font-size:0.85rem;margin-top:8px;color:var(--text-secondary)">Your privacy-safe image is ready to download.</p>
        <div id="ex-action" class="mt-3"></div>
      </div>
    </div>`;

    const zone = document.getElementById('ex-drop');
    const fileInput = document.getElementById('ex-file');
    const statsDiv = document.getElementById('ex-stats');
    const metaWarn = document.getElementById('ex-metadata');
    const metaDesc = document.getElementById('ex-meta-desc');
    const cleanDiv = document.getElementById('ex-clean');
    const cleanTitle = document.getElementById('ex-clean-title');
    const cleanDesc = document.getElementById('ex-clean-desc');
    const actionDiv = document.getElementById('ex-action');

    let activeSourceUrl = '';
    let activeCleanUrl = '';

    const renderStats = (items) => {
      statsDiv.classList.remove('hidden');
      statsDiv.innerHTML = items.map(([label, value]) => `
        <div class="stat-card">
          <div class="stat-num" style="font-size:1rem;word-break:break-word">${ToolRenderers.escapeHtml(value)}</div>
          <div class="stat-lbl">${ToolRenderers.escapeHtml(label)}</div>
        </div>
      `).join('');
    };

    const resetPreviews = () => {
      if (activeSourceUrl) {
        URL.revokeObjectURL(activeSourceUrl);
        activeSourceUrl = '';
      }
      if (activeCleanUrl) {
        URL.revokeObjectURL(activeCleanUrl);
        activeCleanUrl = '';
      }
      ToolRenderers.hideUploadPreviewCard('ex-original');
      ToolRenderers.hideUploadPreviewCard('ex-clean-preview');
    };

    async function handleFile(file) {
      fileInput.value = '';
      if (!file || !file.type.startsWith('image/')) {
        App.toast('Please upload an image file', 'error');
        return;
      }

      metaWarn.classList.add('hidden');
      cleanDiv.classList.add('hidden');
      actionDiv.innerHTML = '';
      resetPreviews();

      activeSourceUrl = URL.createObjectURL(file);
      const sourcePreview = new Image();
      sourcePreview.alt = 'Original image preview';
      sourcePreview.onload = () => {
        ToolRenderers.setUploadPreviewCard('ex-original', {
          url: activeSourceUrl,
          title: file.name,
          meta: `${_formatBytes(file.size)} • ${sourcePreview.width} × ${sourcePreview.height}`,
          note: `Source format: ${(file.type.split('/')[1] || 'image').toUpperCase()}`,
          alt: 'Original image preview',
        });
      };
      sourcePreview.src = activeSourceUrl;

      renderStats([
        ['File Name', file.name],
        ['Format', (file.type.split('/')[1] || 'image').toUpperCase()],
        ['Original Size', _formatBytes(file.size)],
        ['Status', 'Scanning and preparing clean download'],
      ]);

      try {
        const startedAt = performance.now();
        const cleaned = await _buildLosslessCleanImage(file);
        const cleanBlob = cleaned.blob;
        const removedLabels = cleaned.removedLabels;
        const removedText = removedLabels.length ? removedLabels.join(', ') : 'No removable privacy metadata detected';
        const savedBytes = Math.max(0, file.size - cleanBlob.size);
        const downloadName = _createCleanImageName(file.name, cleaned.extension);

        renderStats([
          ['File Name', file.name],
          ['Format', cleaned.formatLabel],
          ['Original Size', _formatBytes(file.size)],
          ['Clean Size', _formatBytes(cleanBlob.size)],
          ['Method', cleaned.lossless ? 'Lossless metadata stripping' : 'Re-encoded export'],
        ]);

        if (removedLabels.length) {
          metaWarn.classList.remove('hidden');
          metaDesc.textContent = `Removed ${removedText}. Download the clean image below.`;
          cleanTitle.textContent = 'Metadata removed successfully';
          cleanDesc.textContent = 'Your clean image is ready. This version was rewritten without re-encoding, so the picture quality stays the same.';
        } else {
          metaWarn.classList.add('hidden');
          cleanTitle.textContent = 'No removable metadata detected';
          cleanDesc.textContent = 'This file did not contain removable EXIF, XMP, or text metadata. You can still download the verified copy below.';
        }

        cleanDiv.classList.remove('hidden');
        activeCleanUrl = URL.createObjectURL(cleanBlob);
        ToolRenderers.setUploadPreviewCard('ex-clean-preview', {
          url: activeCleanUrl,
          title: downloadName,
          meta: `${_formatBytes(cleanBlob.size)}${savedBytes ? ` • ${_formatBytes(savedBytes)} smaller` : ''}`,
          note: removedText,
          alt: 'Cleaned image preview',
        });

        actionDiv.innerHTML = `
          <div style="display:flex;gap:12px;flex-wrap:wrap">
            <button type="button" class="btn btn-success" id="ex-download">Download Clean Image</button>
            <button type="button" class="btn btn-secondary" id="ex-reset">Choose Another Image</button>
          </div>
        `;

        document.getElementById('ex-download')?.addEventListener('click', () => {
          _downloadBlob(cleanBlob, downloadName);
        });
        document.getElementById('ex-reset')?.addEventListener('click', () => {
          fileInput.click();
        });

        if (typeof App !== 'undefined' && typeof App.recordToolPerformance === 'function') {
          App.recordToolPerformance('image-exif-stripper', 'Strip metadata', performance.now() - startedAt);
        }
      } catch (error) {
        console.error('[Tooliest] EXIF stripping failed:', error);
        metaWarn.classList.add('hidden');
        cleanDiv.classList.remove('hidden');
        cleanTitle.textContent = 'Could not create a clean download';
        cleanDesc.textContent = error.message || 'This image format could not be processed safely in your browser.';
        actionDiv.innerHTML = `
          <div style="display:flex;gap:12px;flex-wrap:wrap">
            <button type="button" class="btn btn-secondary" id="ex-try-again">Choose Another Image</button>
          </div>
        `;
        document.getElementById('ex-try-again')?.addEventListener('click', () => fileInput.click());
        App.toast(error.message || 'Could not remove the image metadata.', 'error');
      }
    }

    zone.addEventListener('click', () => fileInput.click());
    zone.addEventListener('dragover', (e) => { e.preventDefault(); zone.classList.add('drag-over'); });
    zone.addEventListener('dragleave', () => zone.classList.remove('drag-over'));
    zone.addEventListener('drop', (e) => {
      e.preventDefault();
      zone.classList.remove('drag-over');
      handleFile(e.dataTransfer.files[0]);
    });
    fileInput.addEventListener('change', (e) => handleFile(e.target.files[0]));
  },
});

// ===== AI HELPER SYSTEM =====

const _AI_PROXY_PATH = '/api/ai-proxy';
const _AI_INPUT_LIMIT = 5000;
const _AI_CALL_STATE = { showError: null, showResult: null, setLoading: null };

function _setAIHandlerState(handlers) {
  _AI_CALL_STATE.showError = typeof handlers?.showError === 'function' ? handlers.showError : null;
  _AI_CALL_STATE.showResult = typeof handlers?.showResult === 'function' ? handlers.showResult : null;
  _AI_CALL_STATE.setLoading = typeof handlers?.setLoading === 'function' ? handlers.setLoading : null;
}

async function callAI(tool, input, options = {}) {
  const trimmed = input ? input.trim() : '';
  const showError = _AI_CALL_STATE.showError || ((msg) => { if (typeof App !== 'undefined') App.toast(msg, 'error'); });
  const showResult = _AI_CALL_STATE.showResult || (() => {});
  const setLoading = _AI_CALL_STATE.setLoading || (() => {});

  if (trimmed.length < 10) { showError('Please enter at least a sentence of text.'); return null; }
  if (trimmed.length > _AI_INPUT_LIMIT) { showError('Input is too long. Please keep it under 5000 characters.'); return null; }

  setLoading(true);
  try {
    const response = await fetch(_AI_PROXY_PATH, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tool, input: trimmed, options }),
    });

    let errorMessage = '';
    if (!response.ok) {
      try {
        const errorData = await response.clone().json();
        errorMessage = typeof errorData?.error === 'string' ? errorData.error : '';
      } catch (_) {}
    }

    if (response.status === 429) { showError(errorMessage || 'Too many requests. Please wait a few minutes and try again.'); return null; }
    if (response.status === 413) { showError(errorMessage || 'Input is too long. Please shorten it and try again.'); return null; }
    if (response.status === 403) { showError(errorMessage || 'Request blocked. Please refresh the page and try again.'); return null; }
    if (!response.ok) { showError(errorMessage || 'Something went wrong. Please try again shortly.'); return null; }

    const data = await response.json();
    if (data.success) { showResult(data.result); return data.result; }
    showError(data.error || 'AI could not process this. Please rephrase and try again.');
    return null;
  } catch (_) {
    showError(!navigator.onLine ? 'You appear to be offline. Check your connection.' : 'Could not reach the AI service. Please try again in a moment.');
    return null;
  } finally {
    setLoading(false);
  }
}

function _createAISpinner() {
  const s = document.createElement('span');
  s.setAttribute('aria-hidden', 'true');
  s.style.cssText = 'width:14px;height:14px;border:2px solid rgba(255,255,255,0.35);border-top-color:#fff;border-radius:50%;display:inline-block;animation:spin 0.8s linear infinite;margin-left:6px;vertical-align:middle';
  return s;
}

function _toggleAIChoiceButtons(buttons, activeValue) {
  buttons.forEach((b) => {
    const isActive = b.dataset.value === String(activeValue);
    b.classList.toggle('btn-primary', isActive);
    b.classList.toggle('btn-secondary', !isActive);
    b.setAttribute('aria-pressed', String(isActive));
  });
}

function _bindAIChoiceButtons(buttons, defaultValue, onChange) {
  let currentValue = String(defaultValue);
  const apply = (value) => {
    currentValue = String(value);
    _toggleAIChoiceButtons(buttons, currentValue);
    if (typeof onChange === 'function') onChange(currentValue);
  };
  buttons.forEach((b) => b.addEventListener('click', () => apply(b.dataset.value || defaultValue)));
  apply(defaultValue);
  return () => currentValue;
}

function _bindAICharCounter(inputs, counter, getText) {
  const fields = Array.isArray(inputs) ? inputs : [inputs];
  const update = () => {
    const raw = typeof getText === 'function' ? getText() : (fields[0]?.value || '');
    if (counter) counter.textContent = `${String(raw).length} / 5000 characters`;
  };
  fields.filter(Boolean).forEach((f) => f.addEventListener('input', update));
  update();
  return update;
}

function _createAIWorkspaceBindings(container, options = {}) {
  const button = container.querySelector(options.buttonSelector || '.btn-primary');
  const output = container.querySelector(options.outputSelector || '#tool-output');
  const outputText = container.querySelector(options.outputTextSelector || '#tool-output-text');
  const copyButton = container.querySelector(options.copySelector || '#copy-btn');
  const error = container.querySelector(options.errorSelector || '#tool-error');
  const placeholderText = options.placeholderText || 'Your AI output will appear here.';
  const originalLabel = button ? button.textContent.trim() : 'Generate';

  if (copyButton && outputText) {
    copyButton.addEventListener('click', () => copyToClipboard(outputText.textContent || '', copyButton));
  }

  const hideError = () => { if (error) { error.classList.add('hidden'); error.textContent = ''; } };
  const showError = (msg) => {
    hideError();
    if (error) { error.textContent = msg; error.classList.remove('hidden'); }
    else if (typeof App !== 'undefined') App.toast(msg, 'error');
  };
  const showResult = (text) => {
    hideError();
    if (output) output.classList.remove('empty');
    if (outputText) outputText.textContent = text;
    if (copyButton && output) { copyButton.classList.remove('hidden'); output.appendChild(copyButton); }
  };
  const resetOutput = () => {
    if (output) output.classList.add('empty');
    if (outputText) outputText.textContent = placeholderText;
    if (copyButton && output) { copyButton.classList.add('hidden'); output.appendChild(copyButton); }
  };
  const setLoading = (isLoading) => {
    if (!button) return;
    button.disabled = isLoading;
    button.setAttribute('aria-busy', String(isLoading));
    button.textContent = '';
    if (isLoading) { button.append('Generating... '); button.appendChild(_createAISpinner()); }
    else { button.textContent = originalLabel; }
  };

  resetOutput();
  hideError();
  return { button, output, outputText, showError, showResult, resetOutput, setLoading };
}

// ===== REAL AI TOOLS =====
Object.assign(ToolRenderers.renderers, {

  'ai-text-summarizer'(c) {
    c.innerHTML=`<div class="tool-workspace-body"><div class="input-group"><label>Paste text to summarize</label><textarea id="tool-input" rows="10" placeholder="Paste a long article or text here..."></textarea><div id="as-char-count" style="font-size:0.8rem;color:var(--text-tertiary);margin-top:8px">0 / 5000 characters</div></div><div class="input-group"><label>Summary Length</label><div style="display:flex;gap:8px;flex-wrap:wrap"><button type="button" class="btn btn-secondary" data-value="short">Short</button><button type="button" class="btn btn-secondary" data-value="medium">Medium</button><button type="button" class="btn btn-secondary" data-value="detailed">Detailed</button></div></div><button class="btn btn-primary mb-4" type="button">&#10024; Summarize with AI</button><div id="tool-error" class="hidden" style="margin:-4px 0 16px;padding:12px;border:1px solid rgba(244,63,94,0.35);border-radius:var(--radius-md);background:rgba(244,63,94,0.08);color:#fda4af"></div><div class="input-group"><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px"><label style="margin:0">Summary</label><span style="font-size:0.78rem;color:var(--text-tertiary)">Powered by AI</span></div><div class="output-area empty" id="tool-output" style="white-space:pre-wrap"><div id="tool-output-text">Your summary will appear here.</div><button class="copy-btn hidden" id="copy-btn" type="button">Copy</button></div></div></div>`;
    const input = c.querySelector('#tool-input');
    const bindings = _createAIWorkspaceBindings(c, { placeholderText: 'Your summary will appear here.' });
    const getLength = _bindAIChoiceButtons(Array.from(c.querySelectorAll('[data-value]')), 'medium');
    _bindAICharCounter(input, c.querySelector('#as-char-count'));
    bindings.button.addEventListener('click', () => {
      _setAIHandlerState(bindings);
      bindings.resetOutput();
      callAI('summarizer', input.value, { length: getLength() });
    });
  },

  'ai-paraphraser'(c) {
    c.innerHTML=`<div class="tool-workspace-body"><div class="input-group"><label>Enter text to paraphrase</label><textarea id="tool-input" rows="6" placeholder="Enter text here..."></textarea><div id="ap-char-count" style="font-size:0.8rem;color:var(--text-tertiary);margin-top:8px">0 / 5000 characters</div></div><div class="input-group"><label>Style</label><select id="ap-style"><option value="standard">Standard</option><option value="formal">Formal</option><option value="casual">Casual</option><option value="creative">Creative</option><option value="simple">Simple</option></select></div><button class="btn btn-primary mb-4" type="button">&#128260; Paraphrase with AI</button><div id="tool-error" class="hidden" style="margin:-4px 0 16px;padding:12px;border:1px solid rgba(244,63,94,0.35);border-radius:var(--radius-md);background:rgba(244,63,94,0.08);color:#fda4af"></div><div class="input-group"><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px"><label style="margin:0">Paraphrased Text</label><span style="font-size:0.78rem;color:var(--text-tertiary)">Powered by AI</span></div><div class="output-area empty" id="tool-output" style="white-space:pre-wrap"><div id="tool-output-text">Your paraphrased text will appear here.</div><button class="copy-btn hidden" id="copy-btn" type="button">Copy</button></div></div></div>`;
    const input = c.querySelector('#tool-input');
    const style = c.querySelector('#ap-style');
    const bindings = _createAIWorkspaceBindings(c, { placeholderText: 'Your paraphrased text will appear here.' });
    _bindAICharCounter(input, c.querySelector('#ap-char-count'));
    bindings.button.addEventListener('click', () => {
      _setAIHandlerState(bindings);
      bindings.resetOutput();
      callAI('paraphraser', input.value, { style: style.value });
    });
  },

  'ai-email-writer'(c) {
    c.innerHTML=`<div class="tool-workspace-body"><div class="input-group"><label>Email Type</label><select id="ae-type"><option value="reply">Reply</option><option value="cold-outreach">Cold Outreach</option><option value="follow-up">Follow-up</option><option value="complaint">Complaint</option><option value="thank-you">Thank You</option></select></div><div class="input-group"><label>Recipient Name</label><input type="text" id="ae-recipient" placeholder="John Smith"></div><div class="input-group"><label>Tone</label><select id="ae-tone"><option value="professional">Professional</option><option value="friendly">Friendly</option><option value="assertive">Assertive</option><option value="apologetic">Apologetic</option><option value="persuasive">Persuasive</option></select></div><div class="input-group"><label>Details / Context</label><input type="text" id="ae-details" placeholder="Brief context..."><div id="ae-char-count" style="font-size:0.8rem;color:var(--text-tertiary);margin-top:8px">0 / 5000 characters</div></div><button class="btn btn-primary mb-4" type="button">&#9993; Generate Email</button><div id="tool-error" class="hidden" style="margin:-4px 0 16px;padding:12px;border:1px solid rgba(244,63,94,0.35);border-radius:var(--radius-md);background:rgba(244,63,94,0.08);color:#fda4af"></div><div class="input-group"><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px"><label style="margin:0">Generated Email</label><span style="font-size:0.78rem;color:var(--text-tertiary)">Powered by AI</span></div><div class="output-area empty" id="tool-output" style="white-space:pre-wrap"><div id="tool-output-text">Your AI email will appear here.</div><button class="copy-btn hidden" id="copy-btn" type="button">Copy</button></div></div></div>`;
    const type = c.querySelector('#ae-type');
    const recipient = c.querySelector('#ae-recipient');
    const tone = c.querySelector('#ae-tone');
    const details = c.querySelector('#ae-details');
    const bindings = _createAIWorkspaceBindings(c, { placeholderText: 'Your AI email will appear here.' });
    const buildInput = () => {
      const parts = [];
      if (recipient.value.trim()) parts.push(`Recipient: ${recipient.value.trim()}`);
      if (details.value.trim()) parts.push(`Context: ${details.value.trim()}`);
      return parts.join('\n');
    };
    _bindAICharCounter([recipient, details], c.querySelector('#ae-char-count'), buildInput);
    bindings.button.addEventListener('click', () => {
      _setAIHandlerState(bindings);
      bindings.resetOutput();
      callAI('email', buildInput(), { tone: tone.value, type: type.value });
    });
  },

  'ai-blog-ideas'(c) {
    c.innerHTML=`<div class="tool-workspace-body"><div class="input-group"><label>Topic or Keyword</label><input type="text" id="bi-topic" placeholder="artificial intelligence, fitness, cooking..."><div id="bi-char-count" style="font-size:0.8rem;color:var(--text-tertiary);margin-top:8px">0 / 5000 characters</div></div><div class="input-group"><label>Number of Ideas</label><div style="display:flex;gap:8px;flex-wrap:wrap" data-choice="count"><button type="button" class="btn btn-secondary" data-value="3">3</button><button type="button" class="btn btn-secondary" data-value="5">5</button><button type="button" class="btn btn-secondary" data-value="10">10</button></div></div><div class="input-group"><label>Format</label><div style="display:flex;gap:8px;flex-wrap:wrap" data-choice="format"><button type="button" class="btn btn-secondary" data-value="titles-only">Titles Only</button><button type="button" class="btn btn-secondary" data-value="titles-with-outline">Titles + Outline</button></div></div><button class="btn btn-primary mb-4" type="button">&#128161; Generate Ideas</button><div id="tool-error" class="hidden" style="margin:-4px 0 16px;padding:12px;border:1px solid rgba(244,63,94,0.35);border-radius:var(--radius-md);background:rgba(244,63,94,0.08);color:#fda4af"></div><div class="input-group"><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px"><label style="margin:0">Generated Ideas</label><span style="font-size:0.78rem;color:var(--text-tertiary)">Powered by AI</span></div><div class="output-area empty" id="bi-results" style="white-space:pre-wrap"><div id="tool-output-text">Your blog ideas will appear here.</div><button class="copy-btn hidden" id="copy-btn" type="button">Copy</button></div></div></div>`;
    const topic = c.querySelector('#bi-topic');
    const bindings = _createAIWorkspaceBindings(c, { outputSelector: '#bi-results', placeholderText: 'Your blog ideas will appear here.' });
    const getCount = _bindAIChoiceButtons(Array.from(c.querySelectorAll('[data-choice="count"] [data-value]')), '5');
    const getFormat = _bindAIChoiceButtons(Array.from(c.querySelectorAll('[data-choice="format"] [data-value]')), 'titles-only');
    _bindAICharCounter(topic, c.querySelector('#bi-char-count'));
    bindings.button.addEventListener('click', () => {
      _setAIHandlerState(bindings);
      bindings.resetOutput();
      callAI('blog', topic.value, { count: Number(getCount()), format: getFormat() });
    });
  },

  'ai-meta-writer'(c) {
    c.innerHTML=`<div class="tool-workspace-body"><div class="input-group"><label>Page Title</label><input type="text" id="am-title" placeholder="My Blog Post Title"></div><div class="input-group"><label>Target Keyword (optional)</label><input type="text" id="am-keyword" placeholder="seo tools"><div id="am-char-count" style="font-size:0.8rem;color:var(--text-tertiary);margin-top:8px">0 / 5000 characters</div></div><div class="input-group"><label>Tone</label><select id="am-tone"><option value="neutral">Neutral</option><option value="engaging" selected>Engaging</option><option value="urgent">Urgent</option><option value="curious">Curious</option></select></div><div class="input-group"><label>Max Characters</label><div style="display:flex;gap:8px;flex-wrap:wrap"><button type="button" class="btn btn-secondary" data-value="150">150</button><button type="button" class="btn btn-secondary" data-value="155">155</button><button type="button" class="btn btn-secondary" data-value="160">160</button></div></div><button class="btn btn-primary mb-4" type="button">&#10024; Generate Meta Description</button><div id="tool-error" class="hidden" style="margin:-4px 0 16px;padding:12px;border:1px solid rgba(244,63,94,0.35);border-radius:var(--radius-md);background:rgba(244,63,94,0.08);color:#fda4af"></div><div class="input-group"><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px"><label style="margin:0">Meta Description</label><div style="display:flex;align-items:center;gap:12px"><span id="am-output-count" style="font-size:0.78rem;color:var(--text-tertiary)">Output: 0 / 155 chars</span><span style="font-size:0.78rem;color:var(--text-tertiary)">Powered by AI</span></div></div><div class="output-area empty" id="am-results" style="white-space:pre-wrap"><div id="tool-output-text">Your meta description will appear here.</div><button class="copy-btn hidden" id="copy-btn" type="button">Copy</button></div></div></div>`;
    const title = c.querySelector('#am-title');
    const keyword = c.querySelector('#am-keyword');
    const tone = c.querySelector('#am-tone');
    const outputCount = c.querySelector('#am-output-count');
    const bindings = _createAIWorkspaceBindings(c, { outputSelector: '#am-results', placeholderText: 'Your meta description will appear here.' });
    const buildInput = () => {
      const parts = [];
      if (title.value.trim()) parts.push(`Page title: ${title.value.trim()}`);
      if (keyword.value.trim()) parts.push(`Target keyword: ${keyword.value.trim()}`);
      return parts.join('\n');
    };
    let lastCount = 0;
    let getMaxChars = () => '155';
    const renderOutputCount = (lim) => {
      const limit = Number(lim || getMaxChars());
      if (outputCount) {
        outputCount.textContent = `Output: ${lastCount} / ${limit} chars`;
        outputCount.style.color = lastCount > limit ? '#fda4af' : 'var(--text-tertiary)';
      }
    };
    getMaxChars = _bindAIChoiceButtons(Array.from(c.querySelectorAll('[data-value]')), '155', renderOutputCount);
    const baseShowResult = bindings.showResult;
    bindings.showResult = (text) => {
      const match = String(text || '').match(/\r?\nChars:\s*(\d+)\s*$/i);
      const desc = match ? String(text).slice(0, match.index).trim() : String(text || '').trim();
      lastCount = match ? Number(match[1]) : desc.length;
      baseShowResult(desc);
      renderOutputCount();
    };
    _bindAICharCounter([title, keyword], c.querySelector('#am-char-count'), buildInput);
    renderOutputCount('155');
    bindings.button.addEventListener('click', () => {
      _setAIHandlerState(bindings);
      lastCount = 0;
      bindings.resetOutput();
      renderOutputCount();
      callAI('metadesc', buildInput(), { tone: tone.value, maxChars: Number(getMaxChars()) });
    });
  },

});
