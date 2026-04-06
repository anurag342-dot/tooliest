// ============================================
// TOOLIEST.COM — Tool Renderers Part 4
// Social, Privacy, AI, Developer tools
// ============================================
const _cs = (c) => { const b=c.querySelector('#copy-btn'); if(b) b.addEventListener('click', function(){copyToClipboard(document.getElementById('tool-output').textContent,this)}); };
const _show = (text) => { const o=document.getElementById('tool-output'),b=document.getElementById('copy-btn'); o.classList.remove('empty'); o.textContent=text; if(b){b.classList.remove('hidden');o.appendChild(b)} };

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

  // ===== AI TOOLS =====
  'ai-text-summarizer'(c) {
    c.innerHTML=`<div class="tool-workspace-body"><div class="input-group"><label>Paste text to summarize</label><textarea id="tool-input" rows="10" placeholder="Paste a long article or text here..."></textarea></div><div class="input-group"><label>Summary sentences: <span id="as-cnt">3</span></label><input type="range" id="as-count" min="1" max="10" value="3"></div><button class="btn btn-primary mb-4">✨ Summarize with AI</button><div class="input-group"><label>Summary</label><div class="output-area empty" id="tool-output"><button class="copy-btn hidden" id="copy-btn">Copy</button></div></div></div>`;
    document.getElementById('as-count').addEventListener('input',(e)=>document.getElementById('as-cnt').textContent=e.target.value);
    c.querySelector('.btn-primary').addEventListener('click',()=>{const text=document.getElementById('tool-input').value;const count=+document.getElementById('as-count').value;if(!text.trim()){App.toast('Enter text to summarize');return}const summary=AI.summarize(text,count);_show(summary)});
    _cs(c);
  },

  'ai-paraphraser'(c) {
    c.innerHTML=`<div class="tool-workspace-body"><div class="input-group"><label>Enter text to paraphrase</label><textarea id="tool-input" rows="6" placeholder="Enter text here..."></textarea></div><div class="input-group"><label>Style</label><select id="ap-style"><option value="standard">Standard</option><option value="formal">Formal</option><option value="creative">Creative</option></select></div><button class="btn btn-primary mb-4">🔄 Paraphrase with AI</button><div class="input-group"><label>Paraphrased Text</label><div class="output-area empty" id="tool-output"><button class="copy-btn hidden" id="copy-btn">Copy</button></div></div></div>`;
    c.querySelector('.btn-primary').addEventListener('click',()=>{const text=document.getElementById('tool-input').value;const style=document.getElementById('ap-style').value;if(!text.trim())return;_show(AI.paraphrase(text,style))});
    _cs(c);
  },

  'ai-email-writer'(c) {
    c.innerHTML=`<div class="tool-workspace-body"><div class="input-group"><label>Email Purpose</label><select id="ae-purpose"><option value="follow-up">Follow Up</option><option value="meeting-request">Meeting Request</option><option value="thank-you">Thank You</option><option value="introduction">Introduction</option><option value="general">General</option></select></div><div class="input-group"><label>Recipient Name</label><input type="text" id="ae-recipient" placeholder="John Smith"></div><div class="input-group"><label>Tone</label><select id="ae-tone"><option value="professional">💼 Professional</option><option value="casual">😎 Casual</option><option value="friendly">😊 Friendly</option></select></div><div class="input-group"><label>Details (optional)</label><input type="text" id="ae-details" placeholder="Brief context..."></div><button class="btn btn-primary mb-4">✉️ Generate Email</button><div class="input-group"><label>Generated Email</label><div class="output-area empty" id="tool-output" style="white-space:pre-wrap"><button class="copy-btn hidden" id="copy-btn">Copy</button></div></div></div>`;
    c.querySelector('.btn-primary').addEventListener('click',()=>{const purpose=document.getElementById('ae-purpose').value;const recipient=document.getElementById('ae-recipient').value;const tone=document.getElementById('ae-tone').value;const details=document.getElementById('ae-details').value;_show(AI.writeEmail(purpose,recipient,tone,details))});
    _cs(c);
  },

  'ai-blog-ideas'(c) {
    c.innerHTML=`<div class="tool-workspace-body"><div class="input-group"><label>Topic or Keyword</label><input type="text" id="bi-topic" placeholder="artificial intelligence, fitness, cooking..."></div><div class="input-group"><label>Number of ideas: <span id="bi-cnt">5</span></label><input type="range" id="bi-count" min="3" max="15" value="5"></div><button class="btn btn-primary mb-4">💡 Generate Ideas</button><div id="bi-results"></div></div>`;
    document.getElementById('bi-count').addEventListener('input',(e)=>document.getElementById('bi-cnt').textContent=e.target.value);
    c.querySelector('.btn-primary').addEventListener('click',()=>{const topic=document.getElementById('bi-topic').value;const count=+document.getElementById('bi-count').value;if(!topic)return;const ideas=AI.generateBlogIdeas(topic,count);document.getElementById('bi-results').innerHTML=ideas.map((idea,i)=>`<div style="padding:14px;background:var(--bg-glass);border:1px solid var(--border-color);border-radius:var(--radius-md);margin-bottom:8px;cursor:pointer;transition:border-color 0.2s" onclick="copyToClipboard('${idea.replace(/'/g,"\\'")}')" onmouseover="this.style.borderColor='var(--border-accent)'" onmouseout="this.style.borderColor='var(--border-color)'"><span style="color:var(--accent-primary);font-weight:700;margin-right:8px">${i+1}.</span>${idea}</div>`).join('')});
  },

  'ai-meta-writer'(c) {
    c.innerHTML=`<div class="tool-workspace-body"><div class="input-group"><label>Page Title</label><input type="text" id="am-title" placeholder="My Blog Post Title"></div><div class="input-group"><label>Target Keyword (optional)</label><input type="text" id="am-keyword" placeholder="seo tools"></div><button class="btn btn-primary mb-4">✨ Generate Meta Descriptions</button><div id="am-results"></div></div>`;
    c.querySelector('.btn-primary').addEventListener('click',()=>{const title=document.getElementById('am-title').value;const keyword=document.getElementById('am-keyword').value;if(!title)return;const descriptions=[];for(let i=0;i<5;i++)descriptions.push(AI.writeMetaDescription(title,'',keyword));document.getElementById('am-results').innerHTML=descriptions.map((desc,i)=>{const len=desc.length;const color=len>160?'#f43f5e':len>140?'#f59e0b':'#10b981';return`<div style="padding:14px;background:var(--bg-glass);border:1px solid var(--border-color);border-radius:var(--radius-md);margin-bottom:8px;cursor:pointer" onclick="copyToClipboard(this.querySelector('.meta-text').textContent)"><div class="flex justify-between items-center mb-2"><span style="font-weight:600;color:var(--accent-primary)">Option ${i+1}</span><span style="font-size:0.75rem;color:${color}">${len}/160 chars</span></div><p class="meta-text" style="font-size:0.9rem;line-height:1.5">${desc}</p></div>`}).join('')});
  },

  // ===== DEVELOPER =====
  'cron-parser'(c) {
    c.innerHTML=`<div class="tool-workspace-body"><div class="input-group"><label>Cron Expression</label><input type="text" id="cp-input" value="0 9 * * 1-5" placeholder="* * * * *"></div><div style="font-size:0.8rem;color:var(--text-tertiary);margin-bottom:16px;font-family:var(--font-mono)">minute hour day-of-month month day-of-week</div><div class="stat-card" id="cp-result" style="text-align:left;padding:20px"></div><div class="color-values mt-4" id="cp-fields"></div></div>`;
    const explain=()=>{const cron=document.getElementById('cp-input').value.trim().split(/\s+/);if(cron.length<5){document.getElementById('cp-result').innerHTML='<span style="color:var(--accent-tertiary)">Need 5 fields: minute hour day month weekday</span>';return}const labels=['Minute','Hour','Day of Month','Month','Day of Week'];const explain_field=(val,label)=>{if(val==='*')return'Every '+label.toLowerCase();if(val.includes('/'))return'Every '+val.split('/')[1]+' '+label.toLowerCase()+'(s)';if(val.includes('-'))return label+' '+val.split('-')[0]+' through '+val.split('-')[1];if(val.includes(','))return label+' '+val;return label+' '+val};const parts=labels.map((l,i)=>explain_field(cron[i],l));const weekdays=['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];let readable='Runs '+parts.join(', ');document.getElementById('cp-result').innerHTML=`<div style="font-weight:600;margin-bottom:8px;color:var(--accent-primary)">📅 Schedule</div><p>${readable}</p>`;document.getElementById('cp-fields').innerHTML=labels.map((l,i)=>`<div class="color-value-item"><span>${l}</span><span>${cron[i]||'*'}</span></div>`).join('')};
    document.getElementById('cp-input').addEventListener('input',explain);explain();
  },

  'diff-checker'(c) {
    c.innerHTML=`<div class="tool-workspace-body"><div style="display:grid;grid-template-columns:1fr 1fr;gap:16px"><div class="input-group"><label>Original Text</label><textarea id="dc-left" rows="10" placeholder="Original text...">Hello World\nThis is a test\nLine three</textarea></div><div class="input-group"><label>Modified Text</label><textarea id="dc-right" rows="10" placeholder="Modified text...">Hello World\nThis is a modified test\nLine three\nNew line four</textarea></div></div><button class="btn btn-primary mt-4 mb-4">🔍 Compare</button><div id="dc-results"></div></div>`;
    c.querySelector('.btn-primary').addEventListener('click',()=>{const left=document.getElementById('dc-left').value.split('\n');const right=document.getElementById('dc-right').value.split('\n');const maxLen=Math.max(left.length,right.length);let html='<div style="font-family:var(--font-mono);font-size:0.85rem">';for(let i=0;i<maxLen;i++){const l=left[i]??'';const r=right[i]??'';if(l===r){html+=`<div style="padding:4px 12px;border-left:3px solid var(--border-color)">${l||'&nbsp;'}</div>`}else{if(l)html+=`<div style="padding:4px 12px;background:rgba(244,63,94,0.1);border-left:3px solid #f43f5e;color:#f43f5e">- ${l}</div>`;if(r)html+=`<div style="padding:4px 12px;background:rgba(16,185,129,0.1);border-left:3px solid #10b981;color:#10b981">+ ${r}</div>`}}html+='</div>';document.getElementById('dc-results').innerHTML=html});
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
        <p class="upload-hint">100% privacy: Image is cleaned instantly in your browser</p>
        <input type="file" id="ex-file" accept="image/jpeg,image/png,image/heic,image/webp" style="display:none">
      </div>
      <div class="result-stats mt-4 hidden" id="ex-stats"></div>
      <div id="ex-metadata" class="mt-4 hidden" style="background:rgba(244,63,94,0.1);border:1px solid #f43f5e;border-radius:var(--radius-md);padding:16px;">
        <h3 style="color:#f43f5e;font-size:1rem;display:flex;align-items:center;gap:8px">⚠️ Metadata Found!</h3>
        <p style="font-size:0.85rem;margin-top:8px;color:var(--text-secondary)" id="ex-meta-desc">We found tracking data inside your photo (camera details, GPS, orientation). All this data will be permanently wiped.</p>
      </div>
      <div id="ex-clean" class="mt-4 hidden" style="background:rgba(16,185,129,0.1);border:1px solid #10b981;border-radius:var(--radius-md);padding:16px;">
        <h3 style="color:#10b981;font-size:1rem;display:flex;align-items:center;gap:8px">✅ Completely Cleaned</h3>
        <p style="font-size:0.85rem;margin-top:8px;color:var(--text-secondary)">All metadata was successfully stripped. Your image is now safe to share online anonymously.</p>
        <div id="ex-action" class="mt-3"></div>
      </div>
    </div>`;

    const zone = document.getElementById('ex-drop');
    const fileInput = document.getElementById('ex-file');
    const statsDiv = document.getElementById('ex-stats');
    const metaWarn = document.getElementById('ex-metadata');
    const cleanDiv = document.getElementById('ex-clean');
    const actionDiv = document.getElementById('ex-action');

    zone.addEventListener('click', () => fileInput.click());
    zone.addEventListener('dragover', (e) => { e.preventDefault(); zone.classList.add('drag-over'); });
    zone.addEventListener('dragleave', () => zone.classList.remove('drag-over'));
    zone.addEventListener('drop', (e) => { e.preventDefault(); zone.classList.remove('drag-over'); handleFile(e.dataTransfer.files[0]); });
    fileInput.addEventListener('change', (e) => handleFile(e.target.files[0]));

    function handleFile(file) {
      if (!file || !file.type.startsWith('image/')) {
        App.toast('Please upload an image file', 'error');
        return;
      }

      statsDiv.classList.remove('hidden');
      statsDiv.innerHTML = [
        ['File Name', file.name],
        ['Format', file.type.split('/')[1].toUpperCase()],
        ['Original Size', (file.size / 1024).toFixed(1) + 'KB']
      ].map(([l, v]) => `<div class="stat-card"><div class="stat-num" style="font-size:1rem;word-break:break-all">${v}</div><div class="stat-lbl">${l}</div></div>`).join('');

      metaWarn.classList.add('hidden');
      cleanDiv.classList.add('hidden');

      const reader = new FileReader();
      reader.onload = (e) => {
        const buffer = e.target.result;
        let array = new Uint8Array(buffer);
        let hasExif = checkExif(array);

        if (hasExif) {
          metaWarn.classList.remove('hidden');
        }

        // To reliably strip metadata AND preserve the exact image content without
        // complex manual ArrayBuffer manipulation for all formats, we use an HTML5 Canvas trick.
        // Drawing an image to Canvas and exporting it inherently strips all EXIF metadata.
        const url = URL.createObjectURL(new Blob([array], {type: file.type}));
        const img = new Image();
        img.alt = 'Uploaded image for EXIF stripping';
        img.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext('2d');
          
          if (file.type === 'image/jpeg') {
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
          }
          
          ctx.drawImage(img, 0, 0);

          canvas.toBlob((blob) => {
            if (!blob) {
              App.toast('Failed to secure image', 'error');
              return;
            }
            
            cleanDiv.classList.remove('hidden');
            
            const btn = document.createElement('button');
            btn.className = 'btn btn-success';
            btn.innerHTML = '💾 Download Safe Image';
            btn.onclick = () => {
              const a = document.createElement('a');
              a.href = URL.createObjectURL(blob);
              a.download = 'cleaned_' + file.name;
              a.click();
            };
            
            actionDiv.innerHTML = '';
            actionDiv.appendChild(btn);
            
            // Add size comparison
            const saved = file.size - blob.size;
            if (saved > 0 || hasExif) {
               const p = document.createElement('p');
               p.style.fontSize = '0.85rem';
               p.style.marginTop = '8px';
               p.style.color = 'var(--text-tertiary)';
               p.textContent = `Cleaned size: ${(blob.size/1024).toFixed(1)}KB (-${(Math.max(0, saved)/1024).toFixed(1)}KB metadata removed)`;
               actionDiv.appendChild(p);
            }
          }, file.type === 'image/png' ? 'image/png' : 'image/jpeg', 1.0); // Maintain maximum quality
        };
        img.src = url;
      };
      reader.readAsArrayBuffer(file);
    }

    function checkExif(buf) {
      if (buf[0] !== 0xFF || buf[1] !== 0xD8) return false; // Not a JPEG
      let offset = 2;
      while (offset < buf.length) {
        if (buf[offset] !== 0xFF) break;
        if (buf[offset + 1] === 0xE1) { // APP1 EXIF segment marker
           return true; 
        }
        offset += 2 + (buf[offset + 2] << 8) + buf[offset + 3];
      }
      return false; // Heuristic check primarily focused on JPEG where EXIF is common.
    }
  },
});
