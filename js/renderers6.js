// ============================================
// TOOLIEST.COM — Tool Renderers Part 6
// AUDIO CONVERTER — Pure JS (no WASM/SharedArrayBuffer)
// Decode: Web Audio API | Encode: lamejs + pure JS + MediaRecorder
// ============================================

Object.assign(ToolRenderers.renderers, {

  'audio-converter'(c) {
    c.innerHTML = `
<style>
  .af-wrap { font-family: var(--font-primary); }
  .af-dropzone {
    border: 2px dashed rgba(124,58,237,0.5); border-radius: var(--radius-lg);
    padding: 48px 24px; text-align: center; cursor: pointer;
    transition: all 0.25s; background: rgba(124,58,237,0.04); position: relative;
  }
  .af-dropzone:hover, .af-dropzone.dragover { border-color:#7c3aed; background:rgba(124,58,237,0.10); transform:translateY(-2px); }
  .af-dropzone-input { position:absolute; inset:0; opacity:0; cursor:pointer; width:100%; height:100%; }
  .af-format-bar { display:flex; gap:8px; flex-wrap:wrap; align-items:center; margin-top:20px; }
  .af-fmt-lbl { font-size:0.82rem; color:var(--text-secondary); font-weight:600; letter-spacing:.06em; text-transform:uppercase; }
  .af-fmt-btn {
    padding:6px 14px; border-radius:20px; font-size:0.82rem; font-weight:700;
    border:1.5px solid rgba(255,255,255,0.12); background:transparent; color:var(--text-secondary);
    cursor:pointer; transition:all 0.18s;
  }
  .af-fmt-btn:hover { border-color:#7c3aed; color:#c4b5fd; }
  .af-fmt-btn.active { background:linear-gradient(135deg,#7c3aed,#06b6d4); border-color:transparent; color:#fff; box-shadow:0 2px 12px rgba(124,58,237,0.4); }
  .af-q-row { display:flex; gap:20px; flex-wrap:wrap; margin-top:16px; align-items:center; }
  .af-q-lbl { font-size:0.82rem; color:var(--text-secondary); font-weight:600; text-transform:uppercase; letter-spacing:.06em; white-space:nowrap; }
  .af-q-btn {
    padding:5px 12px; border-radius:99px; font-size:0.8rem; font-weight:600;
    border:1.5px solid rgba(255,255,255,0.12); background:transparent; color:var(--text-secondary);
    cursor:pointer; transition:all 0.18s;
  }
  .af-q-btn:hover { border-color:#06b6d4; color:#67e8f9; }
  .af-q-btn.active { background:rgba(6,182,212,0.18); border-color:#06b6d4; color:#67e8f9; }
  .af-adv-toggle {
    margin-top:14px; background:none; border:none; color:var(--accent-secondary);
    font-size:0.82rem; cursor:pointer; padding:0; display:flex; align-items:center; gap:6px;
    font-family:var(--font-primary);
  }
  .af-adv-panel { display:none; }
  .af-adv-panel.open { display:block; }
  .af-adv-row { display:flex; gap:12px; flex-wrap:wrap; margin-top:12px; }
  .af-adv-grp { display:flex; flex-direction:column; gap:4px; flex:1; min-width:130px; }
  .af-adv-grp label { font-size:0.75rem; color:var(--text-secondary); font-weight:600; }
  .af-adv-grp select {
    padding:7px 10px; background:var(--bg-secondary); border:1px solid var(--border-color);
    border-radius:var(--radius-sm); color:var(--text-primary); font-size:0.85rem;
    cursor:pointer; font-family:var(--font-primary);
  }
  .af-act-row { display:flex; gap:12px; margin-top:20px; flex-wrap:wrap; align-items:center; }
  .af-conv-btn {
    padding:12px 28px; border-radius:var(--radius-md); font-size:0.95rem; font-weight:700;
    background:linear-gradient(135deg,#7c3aed,#06b6d4); border:none; color:#fff; cursor:pointer;
    transition:all 0.2s; display:flex; align-items:center; gap:8px;
    box-shadow:0 4px 16px rgba(124,58,237,0.35); font-family:var(--font-primary);
  }
  .af-conv-btn:hover { transform:translateY(-2px); box-shadow:0 6px 24px rgba(124,58,237,0.5); }
  .af-conv-btn:disabled { opacity:.5; cursor:not-allowed; transform:none; box-shadow:none; }
  .af-clr-btn {
    padding:10px 18px; border-radius:var(--radius-md); font-size:0.88rem; font-weight:600;
    background:transparent; border:1.5px solid var(--border-color); color:var(--text-secondary);
    cursor:pointer; transition:all 0.18s; font-family:var(--font-primary);
  }
  .af-clr-btn:hover { border-color:#f43f5e; color:#f43f5e; }
  .af-fcnt { font-size:0.85rem; color:var(--text-secondary); }
  .af-status-box {
    display:flex; align-items:center; gap:10px; padding:14px 16px;
    border-radius:var(--radius-md); margin-top:16px; font-size:0.88rem;
    border:1px solid rgba(6,182,212,0.3); background:rgba(6,182,212,0.07); color:#67e8f9;
  }
  .af-status-box.ok  { border-color:rgba(16,185,129,.3); background:rgba(16,185,129,.07); color:#6ee7b7; }
  .af-status-box.err { border-color:rgba(244,63,94,.35); background:rgba(244,63,94,.06); color:#fca5a5; }
  .af-wave { display:inline-flex; align-items:center; gap:3px; height:18px; }
  .af-wave span { width:3px; background:currentColor; border-radius:2px; animation:afWv .9s ease-in-out infinite; height:4px; }
  .af-wave span:nth-child(2){animation-delay:.15s} .af-wave span:nth-child(3){animation-delay:.3s}
  .af-wave span:nth-child(4){animation-delay:.45s} .af-wave span:nth-child(5){animation-delay:.6s}
  @keyframes afWv { 0%,100%{height:4px} 50%{height:16px} }
  .af-queue { margin-top:24px; }
  .af-q-hdr { display:flex; justify-content:space-between; align-items:center; margin-bottom:12px; }
  .af-q-title { font-size:0.82rem; font-weight:700; color:var(--text-secondary); text-transform:uppercase; letter-spacing:.07em; }
  .af-flist { display:flex; flex-direction:column; gap:10px; }
  .af-fitem {
    background:var(--bg-secondary); border:1px solid var(--border-color); border-radius:var(--radius-md);
    padding:12px 16px; display:grid; grid-template-columns:1fr auto auto; gap:12px; align-items:center;
    transition:border-color .2s;
  }
  .af-fitem.done      { border-color:rgba(16,185,129,.4); }
  .af-fitem.error     { border-color:rgba(244,63,94,.4); }
  .af-fitem.converting{ border-color:rgba(124,58,237,.5); }
  .af-fname { font-size:.88rem; font-weight:600; color:var(--text-primary); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
  .af-fmeta { font-size:.75rem; color:var(--text-tertiary); margin-top:2px; }
  .af-pbar-wrap { height:5px; background:var(--bg-tertiary); border-radius:99px; overflow:hidden; margin-top:6px; }
  .af-pbar { height:100%; border-radius:99px; transition:width .3s; width:0%; background:linear-gradient(90deg,#7c3aed,#06b6d4); }
  .af-pbar.done  { background:linear-gradient(90deg,#10b981,#06b6d4); width:100%; }
  .af-pbar.error { background:#f43f5e; }
  .af-badge { font-size:.72rem; font-weight:700; padding:3px 9px; border-radius:99px; white-space:nowrap; }
  .af-badge.queued     { background:rgba(255,255,255,.06); color:var(--text-tertiary); }
  .af-badge.converting { background:rgba(124,58,237,.2); color:#c4b5fd; }
  .af-badge.done       { background:rgba(16,185,129,.18); color:#6ee7b7; }
  .af-badge.error      { background:rgba(244,63,94,.18); color:#fca5a5; }
  .af-dl-btn {
    padding:5px 12px; border-radius:99px; font-size:.78rem; font-weight:700;
    background:linear-gradient(135deg,#10b981,#06b6d4); border:none; color:#fff;
    cursor:pointer; transition:all .18s; white-space:nowrap;
  }
  .af-dl-btn:hover { transform:translateY(-1px); }
  .af-rm-btn {
    padding:4px 8px; border-radius:99px; font-size:.72rem; background:transparent;
    border:1px solid var(--border-color); color:var(--text-tertiary); cursor:pointer; transition:all .18s;
  }
  .af-rm-btn:hover { border-color:#f43f5e; color:#f43f5e; }
  .af-dlall-btn {
    padding:8px 18px; border-radius:var(--radius-md); font-size:.82rem; font-weight:700;
    background:transparent; border:1.5px solid rgba(16,185,129,.45); color:#6ee7b7;
    cursor:pointer; transition:all .2s; font-family:var(--font-primary); display:flex; align-items:center; gap:6px;
  }
  .af-dlall-btn:hover { background:rgba(16,185,129,.1); }
  .af-note { font-size:.78rem; color:var(--text-tertiary); margin-top:8px; }
  .af-privacy {
    display:flex; align-items:center; gap:8px; font-size:.78rem; color:var(--text-tertiary);
    padding:10px 14px; margin-top:20px; background:rgba(16,185,129,.05);
    border:1px solid rgba(16,185,129,.15); border-radius:var(--radius-md);
  }
  @media(max-width:560px){ .af-fitem{ grid-template-columns:1fr; } }
</style>

<div class="tool-workspace-body af-wrap">
  <div class="af-dropzone" id="af-dz">
    <input type="file" class="af-dropzone-input" id="af-fi" multiple
      accept=".mp3,.mp4,.m4a,.aac,.wav,.flac,.ogg,.wma,.aiff,.opus,.webm">
    <div style="font-size:3rem;margin-bottom:12px">🎵</div>
    <div style="font-size:1.1rem;font-weight:700;color:var(--text-primary);margin-bottom:6px">Drop audio files here or click to browse</div>
    <div style="font-size:.85rem;color:var(--text-secondary)">MP3 · WAV · FLAC · M4A · OGG · WMA · AIFF · OPUS — Max 500MB per file</div>
  </div>

  <div class="af-format-bar">
    <span class="af-fmt-lbl">Convert To:</span>
    <button class="af-fmt-btn active" data-fmt="mp3">MP3</button>
    <button class="af-fmt-btn" data-fmt="wav">WAV</button>
    <button class="af-fmt-btn" data-fmt="ogg">OGG</button>
    <button class="af-fmt-btn" data-fmt="opus">OPUS</button>
    <button class="af-fmt-btn" data-fmt="aac">AAC</button>
    <button class="af-fmt-btn" data-fmt="m4a">M4A</button>
  </div>
  <div class="af-note" id="af-fmt-note">🚀 Fast pure-JS encoding — no uploads, works offline</div>

  <div class="af-q-row">
    <span class="af-q-lbl">Quality:</span>
    <button class="af-q-btn" data-q="high">🏆 High (320k)</button>
    <button class="af-q-btn active" data-q="balanced">⭐ Balanced (192k)</button>
    <button class="af-q-btn" data-q="small">📦 Small (96k)</button>
  </div>

  <button class="af-adv-toggle" id="af-adv-tog"><span id="af-arr">▶</span> Advanced Settings</button>
  <div class="af-adv-panel" id="af-adv-panel">
    <div class="af-adv-row">
      <div class="af-adv-grp">
        <label>Bitrate (MP3)</label>
        <select id="af-br">
          <option value="320">320 kbps</option>
          <option value="256">256 kbps</option>
          <option value="192" selected>192 kbps</option>
          <option value="128">128 kbps</option>
          <option value="96">96 kbps</option>
          <option value="64">64 kbps</option>
        </select>
      </div>
      <div class="af-adv-grp">
        <label>Channels</label>
        <select id="af-ch">
          <option value="auto" selected>Auto</option>
          <option value="stereo">Stereo</option>
          <option value="mono">Mono</option>
        </select>
      </div>
    </div>
  </div>

  <div class="af-act-row">
    <button class="af-conv-btn" id="af-cbtn" disabled>🎵 Convert All</button>
    <button class="af-clr-btn" id="af-clr">Clear Queue</button>
    <span class="af-fcnt" id="af-fcnt"></span>
  </div>

  <div id="af-status" style="display:none"></div>

  <div id="af-qwrap" style="display:none">
    <div class="af-queue">
      <div class="af-q-hdr">
        <span class="af-q-title">📋 File Queue</span>
        <button class="af-dlall-btn" id="af-dlall" style="display:none">⬇ Download All (ZIP)</button>
      </div>
      <div class="af-flist" id="af-fl"></div>
    </div>
  </div>

  <div class="af-privacy">🔒 <strong>100% Private</strong> — Files never leave your browser. No WASM, no uploads, no SharedArrayBuffer.</div>
</div>`;

    // ── STATE ──────────────────────────────────────────
    const state = { files:[], fmt:'mp3', quality:'balanced', converting:false };

    const QUALITY = { high:{kbps:320}, balanced:{kbps:192}, small:{kbps:96} };
    const MIME    = { mp3:'audio/mpeg', wav:'audio/wav', ogg:'audio/ogg', opus:'audio/ogg', aac:'audio/mp4', m4a:'audio/mp4' };

    // ── FORMAT NOTE ────────────────────────────────────
    const FMT_NOTES = {
      mp3:  '🚀 Fast pure-JS encoding — no uploads, works offline',
      wav:  '🚀 Lossless PCM — instant conversion, largest file size',
      ogg:  '⏱ OGG uses browser MediaRecorder — encodes in real-time',
      opus: '⏱ OPUS uses browser MediaRecorder — encodes in real-time',
      aac:  '⏱ AAC uses browser MediaRecorder — encodes in real-time',
      m4a:  '⏱ M4A uses browser MediaRecorder — encodes in real-time',
    };

    function updateFmtNote() {
      const el = document.getElementById('af-fmt-note');
      if (el) el.textContent = FMT_NOTES[state.fmt] || '';
    }

    // ── LAME LOADER ────────────────────────────────────
    function loadLame() {
      return new Promise((ok, fail) => {
        if (window.lamejs) { ok(); return; }
        const s = document.createElement('script');
        s.src = 'https://cdn.jsdelivr.net/npm/lamejs@1.2.1/lame.min.js';
        s.onload = ok;
        s.onerror = () => {
          const s2 = document.createElement('script');
          s2.src = 'https://unpkg.com/lamejs@1.2.1/lame.min.js';
          s2.onload = ok; s2.onerror = fail;
          document.head.appendChild(s2);
        };
        document.head.appendChild(s);
      });
    }

    // ── AUDIO DECODE ───────────────────────────────────
    async function decodeAudio(file) {
      const buf = await file.arrayBuffer();
      const ctx = new AudioContext();
      try {
        return await ctx.decodeAudioData(buf);
      } catch(e) {
        ctx.close();
        throw new Error('Cannot decode this file — browser may not support the format');
      }
    }

    // ── WAV ENCODER (pure JS) ──────────────────────────
    function encodeWav(ab, forceMono) {
      const nCh = forceMono ? 1 : ab.numberOfChannels;
      const sr  = ab.sampleRate;
      const len = ab.length;
      const buf = new ArrayBuffer(44 + len * nCh * 2);
      const v   = new DataView(buf);
      const ws  = (off, str) => { for (let i=0;i<str.length;i++) v.setUint8(off+i, str.charCodeAt(i)); };
      ws(0,'RIFF'); v.setUint32(4, 36+len*nCh*2, true);
      ws(8,'WAVE'); ws(12,'fmt ');
      v.setUint32(16,16,true); v.setUint16(20,1,true);
      v.setUint16(22,nCh,true); v.setUint32(24,sr,true);
      v.setUint32(28,sr*nCh*2,true); v.setUint16(32,nCh*2,true);
      v.setUint16(34,16,true); ws(36,'data');
      v.setUint32(40,len*nCh*2,true);

      // Get channel data (mix to mono if needed)
      let channels = [];
      if (forceMono) {
        const m = new Float32Array(len);
        for (let ch=0;ch<ab.numberOfChannels;ch++) {
          const d=ab.getChannelData(ch); for(let i=0;i<len;i++) m[i]+=d[i]/ab.numberOfChannels;
        }
        channels=[m];
      } else {
        for(let ch=0;ch<nCh;ch++) channels.push(ab.getChannelData(ch));
      }

      let off=44;
      for(let i=0;i<len;i++) {
        for(let ch=0;ch<nCh;ch++) {
          const s=Math.max(-1,Math.min(1,channels[ch][i]));
          v.setInt16(off, s<0?s*32768:s*32767, true); off+=2;
        }
      }
      return new Blob([buf], {type:'audio/wav'});
    }

    // ── MP3 ENCODER (lamejs) ───────────────────────────
    async function encodeMp3(ab, kbps, forceMono, onPct) {
      await loadLame();
      const {Mp3Encoder} = window.lamejs;
      const nCh = forceMono ? 1 : Math.min(ab.numberOfChannels, 2);
      const toI16 = f => { const o=new Int16Array(f.length); for(let i=0;i<f.length;i++){const s=Math.max(-1,Math.min(1,f[i]));o[i]=s<0?s*32768:s*32767;} return o; };

      const enc = new Mp3Encoder(nCh, ab.sampleRate, kbps);
      const BLOCK = 1152, chunks = [], total = ab.length;

      let L = toI16(ab.getChannelData(0)), R = nCh>1 ? toI16(ab.getChannelData(1)) : L;
      if (forceMono && ab.numberOfChannels>1) {
        const m=new Float32Array(total);
        for(let i=0;i<total;i++) m[i]=(ab.getChannelData(0)[i]+ab.getChannelData(1)[i])/2;
        L=R=toI16(m);
      }

      for(let i=0;i<total;i+=BLOCK) {
        const lc=L.subarray(i,i+BLOCK), rc=R.subarray(i,i+BLOCK);
        const out = nCh>1 ? enc.encodeBuffer(lc,rc) : enc.encodeBuffer(lc);
        if(out.length) chunks.push(new Uint8Array(out));
        if(i%115200===0) { onPct(Math.round(i/total*95)); await new Promise(r=>setTimeout(r,0)); }
      }
      const fl=enc.flush(); if(fl.length) chunks.push(new Uint8Array(fl));
      onPct(100);
      const tot=chunks.reduce((s,c)=>s+c.length,0);
      const out=new Uint8Array(tot); let off=0;
      chunks.forEach(c=>{out.set(c,off);off+=c.length;});
      return new Blob([out],{type:'audio/mpeg'});
    }

    // ── MEDIARECORDER ENCODER (OGG/OPUS/AAC/M4A) ──────
    async function encodeMediaRecorder(ab, fmt, onPct) {
      const mimeMap = { ogg:'audio/ogg;codecs=vorbis', opus:'audio/ogg;codecs=opus', aac:'audio/mp4', m4a:'audio/mp4' };
      let mime = mimeMap[fmt] || '';
      if (!MediaRecorder.isTypeSupported(mime)) {
        const fallbacks = ['audio/ogg;codecs=opus','audio/webm;codecs=opus','audio/webm','audio/mp4'];
        mime = fallbacks.find(t=>MediaRecorder.isTypeSupported(t)) || '';
      }
      return new Promise((resolve, reject) => {
        const ctx  = new AudioContext({sampleRate: ab.sampleRate});
        const dest = ctx.createMediaStreamDestination();
        const src  = ctx.createBufferSource();
        src.buffer = ab; src.connect(dest);
        const rec  = new MediaRecorder(dest.stream, mime ? {mimeType:mime} : {});
        const chunks=[], dur=ab.duration*1000, t0=Date.now();
        const iv=setInterval(()=>onPct(Math.min(98,Math.round((Date.now()-t0)/dur*100))),400);
        rec.ondataavailable = e => { if(e.data.size>0) chunks.push(e.data); };
        rec.onstop = () => { clearInterval(iv); ctx.close(); onPct(100); resolve(new Blob(chunks,{type:mime||'audio/webm'})); };
        rec.onerror = e => { clearInterval(iv); ctx.close(); reject(e); };
        rec.start(250); src.start(0);
        src.onended = () => setTimeout(()=>rec.stop(), 300);
      });
    }

    // ── MAIN CONVERT ───────────────────────────────────
    async function convertAll() {
      if (state.converting) return;
      const pending = state.files.filter(f=>f.status==='queued'||f.status==='error');
      if (!pending.length) return;
      state.converting = true; updateBtn();

      const br     = parseInt(document.getElementById('af-br')?.value) || 192;
      const chOpt  = document.getElementById('af-ch')?.value || 'auto';
      const forceMono = chOpt === 'mono';

      for (const item of pending) {
        item.status='converting'; item.progress=5; patchItem(item);
        try {
          const ab = await decodeAudio(item.file);
          item.progress=15; patchItem(item);

          const onPct = pct => { item.progress=15+Math.round(pct*.83); patchItem(item); };
          let blob;

          if (state.fmt==='mp3') {
            const kbps = QUALITY[state.quality]?.kbps || br;
            blob = await encodeMp3(ab, kbps, forceMono, onPct);
          } else if (state.fmt==='wav') {
            blob = encodeWav(ab, forceMono); onPct(100);
          } else {
            blob = await encodeMediaRecorder(ab, state.fmt, onPct);
          }

          item.blob=blob; item.status='done'; item.progress=100; item.eta=null;
          patchItem(item);
          App.toast(`✓ ${item.name} converted!`);
        } catch(err) {
          item.status='error'; item.progress=0;
          console.error('[AudioForge]', err);
          patchItem(item);
          App.toast(`Failed: ${item.name} — ${err.message}`, 'error');
        }
      }
      state.converting=false; updateBtn(); renderQueue();
    }

    // ── FILE MANAGEMENT ────────────────────────────────
    const EXTS=['mp3','mp4','m4a','aac','wav','flac','ogg','wma','aiff','opus','webm','aif'];
    const getExt = n => n.split('.').pop().toLowerCase();

    function addFiles(list) {
      Array.from(list).forEach(f => {
        if(f.size>500*1024*1024){ App.toast(`${f.name}: exceeds 500MB limit`,'error'); return; }
        if(!EXTS.includes(getExt(f.name))){ App.toast(`${f.name}: unsupported format`,'error'); return; }
        state.files.push({ id:crypto.randomUUID(), file:f, name:f.name, ext:getExt(f.name),
          sizeMB:(f.size/1024/1024).toFixed(1), status:'queued', progress:0, blob:null });
        renderQueue(); updateBtn();
      });
    }

    // ── RENDER ─────────────────────────────────────────
    function renderQueue() {
      const wrap=document.getElementById('af-qwrap');
      const list=document.getElementById('af-fl');
      const cnt =document.getElementById('af-fcnt');
      if(!wrap||!list) return;
      if(!state.files.length){ wrap.style.display='none'; if(cnt) cnt.textContent=''; return; }
      wrap.style.display='block';
      if(cnt) cnt.textContent=`${state.files.length} file${state.files.length>1?'s':''} queued`;
      const labels={queued:'Queued',converting:'Converting…',done:'✓ Done',error:'✕ Error'};
      list.innerHTML=state.files.map(item=>{
        const pct=item.status==='done'?100:item.progress;
        const bc=item.status==='done'?'done':item.status==='error'?'error':'';
        const act=item.status==='done'
          ? `<button class="af-dl-btn" data-dl="${item.id}">⬇ Download</button>`
          : `<span class="af-badge ${item.status}">${labels[item.status]}</span>`;
        return `<div class="af-fitem ${item.status}" id="afi-${item.id}">
          <div>
            <div class="af-fname" title="${item.name}">🎵 ${item.name}</div>
            <div class="af-fmeta" id="afm-${item.id}">${item.sizeMB} MB · ${item.ext.toUpperCase()} → ${state.fmt.toUpperCase()}</div>
            <div class="af-pbar-wrap"><div class="af-pbar ${bc}" id="afp-${item.id}" style="width:${pct}%"></div></div>
          </div>
          <div id="afa-${item.id}">${act}</div>
          ${item.status!=='converting'?`<button class="af-rm-btn" data-rm="${item.id}">✕</button>`:'<span></span>'}
        </div>`;
      }).join('');
      list.querySelectorAll('[data-rm]').forEach(b=>b.addEventListener('click',()=>{
        state.files=state.files.filter(f=>f.id!==b.dataset.rm); renderQueue(); updateBtn();
      }));
      list.querySelectorAll('[data-dl]').forEach(b=>b.addEventListener('click',()=>{
        const item=state.files.find(f=>f.id===b.dataset.dl);
        if(item?.blob) dlBlob(item.blob, outName(item));
      }));
      const anyDone=state.files.some(f=>f.status==='done');
      const da=document.getElementById('af-dlall');
      if(da) da.style.display=anyDone&&state.files.length>1?'flex':'none';
    }

    function patchItem(item) {
      const bar=document.getElementById(`afp-${item.id}`);
      const row=document.getElementById(`afi-${item.id}`);
      const act=document.getElementById(`afa-${item.id}`);
      if(!bar){ renderQueue(); return; }
      const pct=item.status==='done'?100:item.progress;
      bar.style.width=pct+'%';
      bar.className=`af-pbar ${item.status==='done'?'done':item.status==='error'?'error':''}`;
      if(row) row.className=`af-fitem ${item.status}`;
      if(act) {
        if(item.status==='done'){
          act.innerHTML=`<button class="af-dl-btn" data-dl="${item.id}">⬇ Download</button>`;
          act.querySelector('[data-dl]').addEventListener('click',()=>{ if(item.blob) dlBlob(item.blob,outName(item)); });
          const da=document.getElementById('af-dlall'); if(da&&state.files.length>1) da.style.display='flex';
        } else {
          const labels={queued:'Queued',converting:'Converting…',error:'✕ Error'};
          act.innerHTML=`<span class="af-badge ${item.status}">${labels[item.status]||item.status}</span>`;
        }
      }
    }

    function updateBtn() {
      const btn=document.getElementById('af-cbtn'); if(!btn) return;
      const pending=state.files.filter(f=>f.status==='queued'||f.status==='error');
      if(state.converting){
        btn.disabled=true;
        btn.innerHTML=`<span class="af-wave"><span></span><span></span><span></span><span></span><span></span></span> Converting…`;
      } else if(!state.files.length){ btn.disabled=true; btn.innerHTML='🎵 Convert All';
      } else if(!pending.length){ btn.disabled=true; btn.innerHTML='✅ All Done';
      } else { btn.disabled=false; btn.innerHTML=`🎵 Convert${pending.length>1?' All ('+pending.length+')':''}`;
      }
    }

    // ── DOWNLOAD ───────────────────────────────────────
    function outName(item){ return item.name.replace(/\.[^/.]+$/,'')+'.'+state.fmt; }
    function dlBlob(blob,name){
      const url=URL.createObjectURL(blob), a=document.createElement('a');
      a.href=url; a.download=name; a.click(); setTimeout(()=>URL.revokeObjectURL(url),60000);
    }
    async function dlAllZip(){
      const done=state.files.filter(f=>f.status==='done'&&f.blob); if(!done.length) return;
      App.toast('Preparing ZIP…');
      try {
        const {zip}=await import('https://esm.sh/fflate@0.8.2');
        const files={};
        for(const item of done){ files[outName(item)]=new Uint8Array(await item.blob.arrayBuffer()); }
        zip(files,{level:0},(err,data)=>{
          if(err){ done.forEach(i=>dlBlob(i.blob,outName(i))); return; }
          dlBlob(new Blob([data],{type:'application/zip'}),'tooliest_audio_converted.zip');
        });
      } catch { done.forEach(i=>dlBlob(i.blob,outName(i))); }
    }

    // ── EVENT BINDINGS ─────────────────────────────────
    const dz=document.getElementById('af-dz'), fi=document.getElementById('af-fi');
    fi?.addEventListener('change', e=>{ if(e.target.files.length) addFiles(e.target.files); });
    dz?.addEventListener('dragover', e=>{ e.preventDefault(); dz.classList.add('dragover'); });
    dz?.addEventListener('dragleave', ()=>dz.classList.remove('dragover'));
    dz?.addEventListener('drop', e=>{ e.preventDefault(); dz.classList.remove('dragover'); if(e.dataTransfer.files.length) addFiles(e.dataTransfer.files); });

    c.querySelectorAll('.af-fmt-btn').forEach(btn=>btn.addEventListener('click',()=>{
      c.querySelectorAll('.af-fmt-btn').forEach(b=>b.classList.remove('active'));
      btn.classList.add('active'); state.fmt=btn.dataset.fmt;
      updateFmtNote(); renderQueue();
    }));

    c.querySelectorAll('.af-q-btn').forEach(btn=>btn.addEventListener('click',()=>{
      c.querySelectorAll('.af-q-btn').forEach(b=>b.classList.remove('active'));
      btn.classList.add('active'); state.quality=btn.dataset.q;
    }));

    document.getElementById('af-adv-tog')?.addEventListener('click',()=>{
      const p=document.getElementById('af-adv-panel'), a=document.getElementById('af-arr');
      p?.classList.toggle('open'); if(a) a.textContent=p?.classList.contains('open')?'▼':'▶';
    });

    document.getElementById('af-cbtn')?.addEventListener('click', convertAll);
    document.getElementById('af-clr')?.addEventListener('click',()=>{ if(state.converting) return; state.files=[]; renderQueue(); updateBtn(); });
    document.getElementById('af-dlall')?.addEventListener('click', dlAllZip);

    updateFmtNote(); updateBtn();
  },

});
