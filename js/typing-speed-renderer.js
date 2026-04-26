(function initTypingSpeedRenderer() {
  const DATA = window.TooliestTypingData || {};
  const STORAGE = {
    state: 'tooliest_typing_state',
    stats: 'tooliest_typing_stats',
  };
  const DEFAULT_CUSTOM_TEXT = 'Private practice matters. Use your own text here to train with the words, phrases, and terminology you actually type every day.';
  const DEFAULTS = {
    mode: 'words',
    wordsMode: 'time',
    timeLimit: 60,
    wordCount: 25,
    difficulty: 'medium',
    language: 'english',
    customText: DEFAULT_CUSTOM_TEXT,
  };
  const MODE_OPTIONS = [
    { value: 'words', label: 'Words' },
    { value: 'sentences', label: 'Sentences' },
    { value: 'code', label: 'Code' },
    { value: 'numbers', label: 'Numbers' },
    { value: 'custom', label: 'Custom Text' },
  ];
  const WORDS_MODE_OPTIONS = [
    { value: 'time', label: 'Timed' },
    { value: 'count', label: 'Word Count' },
  ];
  const TIME_OPTIONS = [15, 30, 60, 120, 300];
  const WORD_COUNT_OPTIONS = [10, 25, 50, 100];
  const DIFFICULTY_OPTIONS = ['easy', 'medium', 'hard'];

  function readStorage(key, fallback) {
    try {
      const raw = typeof safeLocalGet === 'function' ? safeLocalGet(key) : localStorage.getItem(key);
      if (!raw) return fallback;
      return JSON.parse(raw);
    } catch (_) {
      return fallback;
    }
  }

  function writeStorage(key, value) {
    try {
      const serialized = JSON.stringify(value);
      if (typeof safeLocalSet === 'function') safeLocalSet(key, serialized);
      else localStorage.setItem(key, serialized);
    } catch (_) {
      // Ignore storage failures in restrictive browsing modes.
    }
  }

  function removeTypingStorage() {
    try {
      Object.keys(localStorage).forEach((key) => {
        if (key === STORAGE.state || key === STORAGE.stats || key.indexOf('tooliest_typing_pb_') === 0) {
          localStorage.removeItem(key);
        }
      });
    } catch (_) {
      // Ignore removal failures in private or restricted contexts.
    }
  }

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function mulberry32(seed) {
    let t = seed >>> 0;
    return function seededRandom() {
      t += 0x6D2B79F5;
      let step = Math.imul(t ^ (t >>> 15), t | 1);
      step ^= step + Math.imul(step ^ (step >>> 7), step | 61);
      return ((step ^ (step >>> 14)) >>> 0) / 4294967296;
    };
  }

  function hashString(input) {
    let hash = 2166136261;
    const text = String(input || '');
    for (let index = 0; index < text.length; index += 1) {
      hash ^= text.charCodeAt(index);
      hash = Math.imul(hash, 16777619);
    }
    return hash >>> 0;
  }

  function shuffle(values, seed) {
    const list = values.slice();
    const random = mulberry32(seed);
    for (let index = list.length - 1; index > 0; index -= 1) {
      const swapIndex = Math.floor(random() * (index + 1));
      [list[index], list[swapIndex]] = [list[swapIndex], list[index]];
    }
    return list;
  }

  function formatTime(totalSeconds) {
    const safe = Math.max(0, Math.round(totalSeconds));
    const minutes = Math.floor(safe / 60);
    const seconds = safe % 60;
    return `${minutes}:${String(seconds).padStart(2, '0')}`;
  }

  function formatPercent(value) {
    return `${Number(value || 0).toFixed(1)}%`;
  }

  function cleanCustomText(value) {
    return String(value || '')
      .replace(/\r\n/g, '\n')
      .replace(/[ \t]+/g, ' ')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  }

  function getConfigKey(config) {
    const lengthKey = config.mode === 'words' && config.wordsMode === 'count'
      ? `count_${config.wordCount}`
      : String(config.timeLimit);
    return [config.mode, lengthKey, config.difficulty, config.language].join('_');
  }

  function getPbKey(config) {
    return `tooliest_typing_pb_${getConfigKey(config)}`;
  }

  function getStatsStore() {
    const store = readStorage(STORAGE.stats, { configs: {} });
    if (!store || typeof store !== 'object') return { configs: {} };
    if (!store.configs || typeof store.configs !== 'object') store.configs = {};
    return store;
  }

  function getModeKind(mode) {
    return mode === 'words' || mode === 'numbers' ? 'token' : 'stream';
  }

  function getDurationLabel(config) {
    if (config.mode === 'words' && config.wordsMode === 'count') {
      return `${config.wordCount} words`;
    }
    return `${config.timeLimit}s`;
  }

  function analyzeTyped(expected, typed) {
    const target = String(expected || '');
    const actual = String(typed || '');
    let correct = 0;
    let total = 0;
    const errors = [];
    const maxLength = Math.max(target.length, actual.length);
    for (let index = 0; index < maxLength; index += 1) {
      const expectedChar = target[index] || '';
      const typedChar = actual[index] || '';
      if (!typedChar) continue;
      total += 1;
      if (typedChar === expectedChar) {
        correct += 1;
      } else {
        errors.push({
          expected: expectedChar || '(extra)',
          typed: typedChar,
          fragment: target.slice(Math.max(0, index - 1), Math.min(target.length, index + 2)) || typedChar,
        });
      }
    }
    return {
      correct,
      total,
      incorrect: total - correct,
      errors,
    };
  }

  function buildMistakeSummary(errors) {
    const counts = new Map();
    errors.forEach((error) => {
      [error.expected, error.fragment].forEach((candidate) => {
        const key = String(candidate || '').trim();
        if (!key) return;
        counts.set(key, (counts.get(key) || 0) + 1);
      });
    });
    return [...counts.entries()]
      .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))
      .slice(0, 6)
      .map(([label]) => label);
  }

  function drawSparkline(canvas, values) {
    if (!canvas) return;
    const context = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    context.clearRect(0, 0, width, height);
    if (!values.length) {
      context.fillStyle = '#8b90aa';
      context.font = '12px Inter, system-ui, sans-serif';
      context.fillText('Complete a few tests to build your trend line.', 10, height / 2);
      return;
    }
    const max = Math.max(...values, 1);
    const min = Math.min(...values);
    const range = Math.max(max - min, 1);
    const step = values.length === 1 ? width : width / (values.length - 1);
    context.beginPath();
    context.strokeStyle = '#38bdf8';
    context.lineWidth = 2.5;
    values.forEach((value, index) => {
      const x = step * index;
      const y = height - (((value - min) / range) * (height - 16) + 8);
      if (index === 0) context.moveTo(x, y);
      else context.lineTo(x, y);
    });
    context.stroke();
    context.lineTo(width, height);
    context.lineTo(0, height);
    context.closePath();
    context.fillStyle = 'rgba(56, 189, 248, 0.12)';
    context.fill();
  }

  function launchConfetti(canvas) {
    if (!canvas) return;
    const ratio = window.devicePixelRatio || 1;
    const width = canvas.offsetWidth;
    const height = canvas.offsetHeight;
    canvas.width = width * ratio;
    canvas.height = height * ratio;
    const context = canvas.getContext('2d');
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    const particles = Array.from({ length: 50 }, () => ({
      x: width / 2,
      y: 14,
      dx: (Math.random() - 0.5) * 7,
      dy: Math.random() * -3 - 1,
      size: Math.random() * 6 + 4,
      color: ['#38bdf8', '#8b5cf6', '#22c55e', '#f59e0b', '#fb7185'][Math.floor(Math.random() * 5)],
      alpha: 1,
    }));
    const start = performance.now();
    canvas.hidden = false;

    function frame(now) {
      const elapsed = now - start;
      context.clearRect(0, 0, width, height);
      particles.forEach((particle) => {
        particle.x += particle.dx;
        particle.y += particle.dy;
        particle.dy += 0.12;
        particle.alpha = Math.max(0, 1 - elapsed / 1800);
        context.globalAlpha = particle.alpha;
        context.fillStyle = particle.color;
        context.fillRect(particle.x, particle.y, particle.size, particle.size);
      });
      context.globalAlpha = 1;
      if (elapsed < 2000) {
        requestAnimationFrame(frame);
      } else {
        context.clearRect(0, 0, width, height);
        canvas.hidden = true;
      }
    }

    requestAnimationFrame(frame);
  }

  function animateCount(element, value) {
    if (!element) return;
    const finalValue = Math.max(0, Math.round(value));
    const start = performance.now();
    const duration = 800;

    function frame(now) {
      const progress = clamp((now - start) / duration, 0, 1);
      element.textContent = String(Math.round(finalValue * progress));
      if (progress < 1) requestAnimationFrame(frame);
    }

    requestAnimationFrame(frame);
  }

  function renderButtons(options, currentValue, group, labelFormatter) {
    return `<div class="typing-segmented" data-group="${group}">
      ${options.map((option) => {
        const value = typeof option === 'object' ? option.value : option;
        const label = typeof option === 'object' ? option.label : labelFormatter(option);
        const active = String(value) === String(currentValue);
        return `<button type="button" class="typing-segmented-btn${active ? ' is-active' : ''}" data-group="${group}" data-value="${ToolRenderers.escapeAttr(value)}" aria-pressed="${active}">${ToolRenderers.escapeHtml(label)}</button>`;
      }).join('')}
    </div>`;
  }

  function buildWordsText(config, seed) {
    const count = config.wordsMode === 'count' ? Math.max(config.wordCount + 220, 300) : 300;
    if (typeof DATA.getWordSequence === 'function') {
      return DATA.getWordSequence(config.language, seed, count);
    }
    const pool = (DATA.getWordPool && DATA.getWordPool(config.language, config.difficulty)) || ['typing'];
    const random = mulberry32(seed);
    const words = [];
    for (let index = 0; index < count; index += 1) {
      words.push(pool[Math.floor(random() * pool.length)] || 'typing');
    }
    return words.join(' ');
  }

  function buildSentenceText(config, seed) {
    if (typeof DATA.getSentenceSequence === 'function') {
      return DATA.getSentenceSequence(config.language, seed, 1100);
    }
    const bank = shuffle((DATA.getSentenceBank && DATA.getSentenceBank(config.language)) || ['Practice builds speed.'], seed);
    return bank.slice(0, 12).join(' ');
  }

  function buildCodeText(seed) {
    const groups = DATA.codeExamples || {};
    const languages = shuffle(Object.keys(groups), seed).filter((key) => Array.isArray(groups[key]) && groups[key].length);
    if (!languages.length) {
      const snippets = shuffle(DATA.codeSnippets || [], seed);
      return snippets.slice(0, 10).map((snippet) => snippet.text).join('\n\n');
    }
    const blocks = [];
    languages.slice(0, 3).forEach((language, languageIndex) => {
      const examples = shuffle(groups[language], seed + languageIndex);
      if (examples[0]) {
        blocks.push(`${language.toUpperCase()}\n${examples[0]}`);
      }
    });
    return blocks.join('\n\n');
  }

  function buildNumbersText(seed) {
    const scenarios = shuffle(DATA.numberScenarios || [], seed);
    if (scenarios.length) {
      return scenarios.slice(0, 12).join(' ');
    }
    const random = mulberry32(seed);
    const digits = '0123456789';
    const groups = [];
    while (groups.length < 220) {
      let next = '';
      for (let index = 0; index < 6; index += 1) {
        next += digits[Math.floor(random() * digits.length)];
      }
      groups.push(next);
    }
    return groups.join(' ');
  }

  function buildCustomText(config) {
    const cleaned = cleanCustomText(config.customText);
    return cleaned.length >= 20 ? cleaned : DEFAULT_CUSTOM_TEXT;
  }

  function buildText(config) {
    const seed = hashString(`${Date.now()}:${config.mode}:${config.language}:${config.difficulty}:${config.wordCount}:${config.timeLimit}`);
    if (config.mode === 'sentences') return { seed, text: buildSentenceText(config, seed) };
    if (config.mode === 'code') return { seed, text: buildCodeText(seed) };
    if (config.mode === 'numbers') return { seed, text: buildNumbersText(seed) };
    if (config.mode === 'custom') return { seed, text: buildCustomText(config) };
    return { seed, text: buildWordsText(config, seed) };
  }

  ToolRenderers.renderers['typing-speed-test'] = function renderTypingSpeedTest(container) {
    const persisted = readStorage(STORAGE.state, {});
    let config = {
      ...DEFAULTS,
      ...persisted,
      customText: cleanCustomText(persisted.customText || DEFAULT_CUSTOM_TEXT) || DEFAULT_CUSTOM_TEXT,
    };
    let state = null;
    let rafId = 0;
    let latestResult = null;

    function saveConfig() {
      writeStorage(STORAGE.state, config);
    }

    function createState() {
      const generated = buildText(config);
      const tokenMode = getModeKind(config.mode) === 'token';
      return {
        config: { ...config },
        seed: generated.seed,
        text: generated.text,
        tokens: tokenMode ? generated.text.split(/\s+/).filter(Boolean) : [],
        tokenMode,
        currentWordIndex: 0,
        committedWords: [],
        currentInput: '',
        streamInput: '',
        streamLastLength: 0,
        isRunning: false,
        isFinished: false,
        startedAt: 0,
        finishedAt: 0,
        errors: [],
      };
    }

    container.innerHTML = `
      <style>
        .typing-speed-tool { display:flex; flex-direction:column; gap:20px; }
        .typing-card { background:var(--bg-secondary); border:1px solid var(--border-color); border-radius:20px; padding:20px; box-shadow:var(--shadow-md); }
        .typing-privacy-banner { display:flex; gap:12px; align-items:flex-start; background:rgba(15,23,42,0.72); border:1px solid rgba(56,189,248,0.28); border-radius:18px; padding:16px 18px; }
        .typing-privacy-banner strong { display:block; margin-bottom:4px; color:var(--text-primary); }
        .typing-privacy-banner p { margin:0; color:var(--text-secondary); font-size:0.95rem; line-height:1.6; }
        .typing-lock { width:40px; height:40px; border-radius:14px; display:grid; place-items:center; background:rgba(59,130,246,0.14); color:#7dd3fc; font-size:1.12rem; flex:0 0 auto; }
        .typing-config-grid { display:grid; grid-template-columns:repeat(auto-fit, minmax(220px, 1fr)); gap:16px; }
        .typing-segmented { display:flex; flex-wrap:wrap; gap:8px; }
        .typing-segmented-btn { min-height:42px; padding:10px 14px; border-radius:999px; border:1px solid var(--border-color); background:var(--bg-tertiary); color:var(--text-secondary); font-weight:600; cursor:pointer; transition:transform 0.18s ease, border-color 0.18s ease, background 0.18s ease, color 0.18s ease; }
        .typing-segmented-btn:hover { transform:translateY(-1px); color:var(--text-primary); border-color:rgba(96,165,250,0.4); }
        .typing-segmented-btn.is-active { background:var(--gradient-primary); color:#fff; border-color:transparent; box-shadow:0 10px 24px rgba(59,130,246,0.25); }
        .typing-config-note { margin:14px 0 0; color:var(--text-tertiary); font-size:0.9rem; line-height:1.6; }
        .typing-status-row { display:flex; flex-wrap:wrap; align-items:center; justify-content:space-between; gap:16px; margin-bottom:14px; }
        .typing-timer { font-size:2rem; font-weight:800; letter-spacing:-0.04em; color:var(--text-primary); }
        .typing-subcopy { color:var(--text-tertiary); font-size:0.95rem; }
        .typing-progress { position:relative; width:100%; height:8px; border-radius:999px; background:rgba(148,163,184,0.14); overflow:hidden; margin-bottom:20px; }
        .typing-progress > span { position:absolute; inset:0 auto 0 0; width:0%; border-radius:inherit; background:var(--gradient-primary); transition:width 0.12s linear; }
        .typing-live-stats { display:grid; grid-template-columns:repeat(4, minmax(110px, 1fr)); gap:12px; width:100%; }
        .typing-live-stat { border:1px solid var(--border-color); border-radius:16px; padding:12px 14px; background:var(--bg-tertiary); }
        .typing-live-stat strong { display:block; color:var(--text-primary); font-size:1.1rem; }
        .typing-live-stat span { display:block; color:var(--text-tertiary); font-size:0.78rem; letter-spacing:0.08em; text-transform:uppercase; margin-top:3px; }
        .typing-display-wrap { position:relative; border:1px solid var(--border-color); border-radius:24px; background:linear-gradient(180deg, rgba(15,23,42,0.82), rgba(15,23,42,0.64)); padding:24px; min-height:240px; max-height:320px; overflow:auto; scrollbar-gutter:stable; }
        .typing-display { font-size:clamp(1.05rem, 1.35vw, 1.25rem); line-height:1.95; color:var(--text-primary); word-break:break-word; }
        .typing-display.mode-code { white-space:pre-wrap; font-family:var(--font-mono); }
        .typing-word { display:inline-block; margin:0 0.4ch 0.46rem 0; padding:2px 4px; border-radius:10px; scroll-margin-block:88px; }
        .typing-word-current { background:rgba(59,130,246,0.12); box-shadow:inset 0 -2px 0 rgba(59,130,246,0.78); }
        .typing-char-correct { color:#97a0bc; }
        .typing-char-error { color:#fca5a5; text-decoration:underline wavy #f87171; text-underline-offset:3px; }
        .typing-char-error sup { font-size:0.58em; color:#fecdd3; margin-left:1px; }
        .typing-char-extra { color:#fecaca; background:rgba(248,113,113,0.12); border-radius:6px; text-decoration:underline wavy #f87171; text-underline-offset:3px; }
        .typing-char-current { background:rgba(99,102,241,0.16); border-radius:6px; box-shadow:inset 0 -2px 0 #60a5fa; }
        .typing-char-upcoming { color:var(--text-primary); }
        .typing-inline-note { display:flex; gap:12px; align-items:flex-start; margin-top:14px; color:var(--text-tertiary); font-size:0.9rem; line-height:1.6; }
        .typing-input-row { display:flex; flex-wrap:wrap; gap:12px; align-items:flex-end; margin-top:18px; }
        .typing-input-row .input-group { flex:1 1 420px; margin:0; }
        .typing-results[hidden] { display:none !important; }
        .typing-results { margin-top:18px; padding-top:18px; border-top:1px solid var(--border-color); display:grid; gap:16px; }
        .typing-results-head { display:flex; flex-wrap:wrap; align-items:flex-end; justify-content:space-between; gap:16px; }
        .typing-result-big { font-size:3rem; font-weight:800; letter-spacing:-0.06em; color:var(--text-primary); }
        .typing-result-grid { display:grid; grid-template-columns:repeat(auto-fit, minmax(140px, 1fr)); gap:12px; }
        .typing-result-card, .typing-chart-card, .typing-mistakes-card, .typing-share-card { border:1px solid var(--border-color); border-radius:18px; background:var(--bg-tertiary); padding:16px; }
        .typing-result-card strong { display:block; color:var(--text-primary); font-size:1.15rem; }
        .typing-result-card span { display:block; color:var(--text-tertiary); font-size:0.78rem; letter-spacing:0.08em; text-transform:uppercase; margin-top:4px; }
        .typing-best-banner { border-radius:18px; padding:14px 16px; background:rgba(34,197,94,0.12); border:1px solid rgba(34,197,94,0.28); color:#dcfce7; }
        .typing-best-banner.is-chasing { background:rgba(59,130,246,0.12); border-color:rgba(59,130,246,0.28); color:#dbeafe; }
        .typing-best-banner strong { display:block; margin-bottom:4px; }
        .typing-best-progress { position:relative; height:8px; border-radius:999px; background:rgba(148,163,184,0.16); overflow:hidden; margin-top:10px; }
        .typing-best-progress > span { position:absolute; inset:0 auto 0 0; width:0%; border-radius:inherit; background:var(--gradient-primary); }
        .typing-chart-card canvas { width:100%; height:84px; display:block; }
        .typing-mistake-list { display:flex; flex-wrap:wrap; gap:8px; margin-top:10px; }
        .typing-mistake-chip { border-radius:999px; border:1px solid rgba(248,113,113,0.28); background:rgba(248,113,113,0.08); color:#fecaca; padding:7px 12px; font-size:0.88rem; }
        .typing-result-actions { display:flex; flex-wrap:wrap; gap:10px; margin-top:12px; }
        .typing-sr { position:absolute; width:1px; height:1px; overflow:hidden; clip-path:inset(50%); white-space:nowrap; }
        .typing-dashboard summary { cursor:pointer; font-weight:700; color:var(--text-primary); }
        .typing-dashboard-meta { color:var(--text-tertiary); font-size:0.9rem; margin-top:8px; }
        .typing-dashboard-table-wrap { overflow:auto; margin-top:16px; }
        .typing-dashboard table { width:100%; border-collapse:collapse; min-width:760px; }
        .typing-dashboard th, .typing-dashboard td { padding:12px 10px; border-bottom:1px solid var(--border-color); text-align:left; font-size:0.92rem; }
        .typing-dashboard th { color:var(--text-tertiary); font-size:0.78rem; text-transform:uppercase; letter-spacing:0.08em; }
        .typing-confetti { position:absolute; inset:0; width:100%; height:100%; pointer-events:none; }
        .typing-custom-warning { margin-top:10px; color:#fbbf24; font-size:0.88rem; }
        @media (max-width: 960px) { .typing-live-stats { grid-template-columns:repeat(2, minmax(0, 1fr)); } }
        @media (max-width: 720px) {
          .typing-card { padding:18px; }
          .typing-display-wrap { padding:18px; min-height:216px; }
          .typing-timer { font-size:1.7rem; }
          .typing-result-big { font-size:2.35rem; }
        }
      </style>
      <div class="typing-speed-tool">
        <div class="typing-privacy-banner" role="note">
          <div class="typing-lock" aria-hidden="true">🔒</div>
          <div>
            <strong>Your keystrokes stay in this browser.</strong>
            <p>Tooliest processes every character locally on your device. The typing engine never sends your text anywhere, and the test itself triggers zero network requests while you type. Open DevTools → Network if you want to verify that yourself.</p>
          </div>
        </div>

        <section class="typing-card" id="typing-config-card">
          <div class="typing-config-grid">
            <div class="input-group" style="grid-column:1/-1">
              <label>Mode</label>
              ${renderButtons(MODE_OPTIONS, config.mode, 'typing-mode')}
            </div>
            <div class="input-group" id="typing-words-mode-wrap">
              <label>Words test type</label>
              ${renderButtons(WORDS_MODE_OPTIONS, config.wordsMode, 'typing-words-mode')}
            </div>
            <div class="input-group" id="typing-time-wrap">
              <label>Time</label>
              ${renderButtons(TIME_OPTIONS, config.timeLimit, 'typing-time', (value) => `${value}s`)}
            </div>
            <div class="input-group" id="typing-word-count-wrap">
              <label>Word count</label>
              ${renderButtons(WORD_COUNT_OPTIONS, config.wordCount, 'typing-word-count', (value) => String(value))}
            </div>
            <div class="input-group">
              <label>Difficulty</label>
              ${renderButtons(DIFFICULTY_OPTIONS, config.difficulty, 'typing-difficulty', (value) => value.charAt(0).toUpperCase() + value.slice(1))}
            </div>
            <div class="input-group" id="typing-language-wrap">
              <label for="typing-language-select">Language</label>
              <select id="typing-language-select">${(DATA.languages || []).map((language) => `<option value="${ToolRenderers.escapeAttr(language.value)}"${language.value === config.language ? ' selected' : ''}>${ToolRenderers.escapeHtml(language.label)}</option>`).join('')}</select>
            </div>
            <div class="input-group" id="typing-custom-wrap" style="grid-column:1/-1">
              <label for="typing-custom-text">Custom text</label>
              <textarea id="typing-custom-text" rows="4" placeholder="Paste at least 20 characters of your own text to practice.">${ToolRenderers.escapeHtml(config.customText)}</textarea>
              <div class="typing-custom-warning hidden" id="typing-custom-warning">Add at least 20 characters to use your own text. Until then, Tooliest shows a private placeholder passage so the layout never breaks.</div>
            </div>
          </div>
          <p class="typing-config-note">Screen reader users: this tool requires visual interaction and is not fully accessible in screen reader mode. We are working on an accessible alternative.</p>
        </section>

        <section class="typing-card">
          <div class="typing-status-row">
            <div>
              <div class="typing-timer" id="typing-timer">1:00</div>
              <div class="typing-subcopy" id="typing-timer-caption">Timer starts on your first keystroke.</div>
            </div>
            <div class="typing-live-stats">
              <div class="typing-live-stat"><strong id="typing-stat-wpm">0</strong><span>WPM</span></div>
              <div class="typing-live-stat"><strong id="typing-stat-raw">0</strong><span>Raw WPM</span></div>
              <div class="typing-live-stat"><strong id="typing-stat-accuracy">100.0%</strong><span>Accuracy</span></div>
              <div class="typing-live-stat"><strong id="typing-stat-errors">0</strong><span>Errors</span></div>
            </div>
          </div>
          <div class="typing-progress" aria-hidden="true"><span id="typing-progress-bar"></span></div>
          <div class="typing-display-wrap" id="typing-display-wrap" tabindex="0" aria-label="Typing prompt area">
            <div class="typing-display" id="typing-display" aria-live="polite"></div>
            <canvas class="typing-confetti" id="typing-confetti" hidden></canvas>
          </div>
          <div class="typing-inline-note">
            <span aria-hidden="true">⌨️</span>
            <span id="typing-guidance">Click or tap the prompt, then start typing. In Words mode, press Space to lock in each word.</span>
          </div>
          <div class="typing-input-row">
            <div class="input-group">
              <label for="typing-input">Type here</label>
              <input id="typing-input" type="text" role="textbox" aria-label="Type here" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false" placeholder="Click here and start typing..." />
            </div>
            <button type="button" class="btn btn-secondary" id="typing-restart-btn" style="min-height:52px">Restart</button>
          </div>
          <div class="typing-results" id="typing-results" hidden>
            <div class="typing-results-head">
              <div>
                <div class="typing-result-big" id="typing-result-big">0</div>
                <div class="typing-subcopy">Words per minute</div>
              </div>
              <div class="typing-subcopy" id="typing-result-summary">Your local stats will appear here after the first run.</div>
            </div>
            <div class="typing-result-grid">
              <div class="typing-result-card"><strong id="typing-result-accuracy">100.0%</strong><span>Accuracy</span></div>
              <div class="typing-result-card"><strong id="typing-result-raw">0</strong><span>Raw WPM</span></div>
              <div class="typing-result-card"><strong id="typing-result-errors">0</strong><span>Errors</span></div>
              <div class="typing-result-card"><strong id="typing-result-duration">60s</strong><span>Test duration</span></div>
              <div class="typing-result-card"><strong id="typing-result-characters">0 / 0 / 0</strong><span>Correct / Incorrect / Total</span></div>
            </div>
            <div class="typing-best-banner" id="typing-best-banner">
              <strong id="typing-best-title">Personal best</strong>
              <span id="typing-best-copy">Finish a test and Tooliest will compare your result against your local best for this setup.</span>
              <div class="typing-best-progress"><span id="typing-best-progress"></span></div>
            </div>
            <div class="typing-chart-card">
              <strong>Recent scores</strong>
              <div class="typing-subcopy">Last 10 attempts for this exact setup.</div>
              <canvas id="typing-sparkline" width="460" height="84" aria-hidden="true"></canvas>
            </div>
            <div class="typing-mistakes-card">
              <strong>You struggled with</strong>
              <div class="typing-mistake-list" id="typing-mistake-list"></div>
            </div>
            <div class="typing-share-card">
              <strong>Next action</strong>
              <div class="typing-subcopy">Restart instantly, go back to settings, or copy a share-ready result line.</div>
              <div class="typing-result-actions">
                <button type="button" class="btn btn-primary" id="typing-try-again-btn">Try Again</button>
                <button type="button" class="btn btn-secondary" id="typing-settings-btn">Change Settings</button>
                <button type="button" class="btn btn-secondary" id="typing-share-btn">Share Result</button>
              </div>
            </div>
          </div>
          <div class="typing-sr" id="typing-sr-announcer" aria-live="assertive"></div>
        </section>

        <details class="typing-card typing-dashboard">
          <summary>Personal best dashboard</summary>
          <p class="typing-dashboard-meta">Your stats live in this browser only. Reset them any time if you use a shared device or want a clean slate.</p>
          <div class="typing-dashboard-table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Mode</th>
                  <th>Duration</th>
                  <th>Difficulty</th>
                  <th>Language</th>
                  <th>Best WPM</th>
                  <th>Best Accuracy</th>
                  <th>Attempts</th>
                  <th>Last Tested</th>
                </tr>
              </thead>
              <tbody id="typing-dashboard-body"></tbody>
            </table>
          </div>
          <div class="typing-result-actions">
            <button type="button" class="btn btn-secondary" id="typing-reset-stats-btn">Reset all stats</button>
          </div>
        </details>
      </div>
    `;

    const refs = {
      modeButtons: container.querySelectorAll('[data-group="typing-mode"] .typing-segmented-btn'),
      wordsModeButtons: container.querySelectorAll('[data-group="typing-words-mode"] .typing-segmented-btn'),
      timeButtons: container.querySelectorAll('[data-group="typing-time"] .typing-segmented-btn'),
      wordCountButtons: container.querySelectorAll('[data-group="typing-word-count"] .typing-segmented-btn'),
      difficultyButtons: container.querySelectorAll('[data-group="typing-difficulty"] .typing-segmented-btn'),
      languageSelect: container.querySelector('#typing-language-select'),
      customText: container.querySelector('#typing-custom-text'),
      customWarning: container.querySelector('#typing-custom-warning'),
      wordsModeWrap: container.querySelector('#typing-words-mode-wrap'),
      timeWrap: container.querySelector('#typing-time-wrap'),
      wordCountWrap: container.querySelector('#typing-word-count-wrap'),
      languageWrap: container.querySelector('#typing-language-wrap'),
      customWrap: container.querySelector('#typing-custom-wrap'),
      timer: container.querySelector('#typing-timer'),
      timerCaption: container.querySelector('#typing-timer-caption'),
      progress: container.querySelector('#typing-progress-bar'),
      display: container.querySelector('#typing-display'),
      displayWrap: container.querySelector('#typing-display-wrap'),
      guidance: container.querySelector('#typing-guidance'),
      input: container.querySelector('#typing-input'),
      restartBtn: container.querySelector('#typing-restart-btn'),
      statWpm: container.querySelector('#typing-stat-wpm'),
      statRaw: container.querySelector('#typing-stat-raw'),
      statAccuracy: container.querySelector('#typing-stat-accuracy'),
      statErrors: container.querySelector('#typing-stat-errors'),
      results: container.querySelector('#typing-results'),
      resultBig: container.querySelector('#typing-result-big'),
      resultSummary: container.querySelector('#typing-result-summary'),
      resultAccuracy: container.querySelector('#typing-result-accuracy'),
      resultRaw: container.querySelector('#typing-result-raw'),
      resultErrors: container.querySelector('#typing-result-errors'),
      resultDuration: container.querySelector('#typing-result-duration'),
      resultCharacters: container.querySelector('#typing-result-characters'),
      bestBanner: container.querySelector('#typing-best-banner'),
      bestTitle: container.querySelector('#typing-best-title'),
      bestCopy: container.querySelector('#typing-best-copy'),
      bestProgress: container.querySelector('#typing-best-progress'),
      sparkline: container.querySelector('#typing-sparkline'),
      mistakeList: container.querySelector('#typing-mistake-list'),
      tryAgainBtn: container.querySelector('#typing-try-again-btn'),
      settingsBtn: container.querySelector('#typing-settings-btn'),
      shareBtn: container.querySelector('#typing-share-btn'),
      srAnnouncer: container.querySelector('#typing-sr-announcer'),
      dashboardBody: container.querySelector('#typing-dashboard-body'),
      resetStatsBtn: container.querySelector('#typing-reset-stats-btn'),
      confetti: container.querySelector('#typing-confetti'),
    };

    function setActive(buttons, currentValue) {
      buttons.forEach((button) => {
        const active = button.dataset.value === String(currentValue);
        button.classList.toggle('is-active', active);
        button.setAttribute('aria-pressed', active ? 'true' : 'false');
      });
    }

    function updateConfigUi() {
      setActive(refs.modeButtons, config.mode);
      setActive(refs.wordsModeButtons, config.wordsMode);
      setActive(refs.timeButtons, config.timeLimit);
      setActive(refs.wordCountButtons, config.wordCount);
      setActive(refs.difficultyButtons, config.difficulty);
      refs.languageSelect.value = config.language;
      refs.customText.value = config.customText;

      const isWords = config.mode === 'words';
      const isWordsCount = isWords && config.wordsMode === 'count';
      const isLanguageMode = config.mode === 'words' || config.mode === 'sentences';
      const isCustom = config.mode === 'custom';

      refs.wordsModeWrap.style.display = isWords ? '' : 'none';
      refs.wordCountWrap.style.display = isWordsCount ? '' : 'none';
      refs.timeWrap.style.opacity = isWordsCount ? '0.55' : '1';
      refs.timeWrap.style.pointerEvents = isWordsCount ? 'none' : '';
      refs.languageWrap.style.display = isLanguageMode ? '' : 'none';
      refs.customWrap.style.display = isCustom ? '' : 'none';
      refs.customWarning.classList.toggle('hidden', !(isCustom && cleanCustomText(config.customText).length < 20));
    }

    function renderDashboard() {
      const store = getStatsStore();
      const rows = Object.values(store.configs || {})
        .sort((left, right) => String(right.lastTested || '').localeCompare(String(left.lastTested || '')))
        .map((entry) => `<tr>
          <td>${ToolRenderers.escapeHtml(entry.mode || '-')}</td>
          <td>${ToolRenderers.escapeHtml(entry.duration || '-')}</td>
          <td>${ToolRenderers.escapeHtml(entry.difficulty || '-')}</td>
          <td>${ToolRenderers.escapeHtml(entry.language || '-')}</td>
          <td><strong>${Math.round(entry.bestWpm || 0)}</strong></td>
          <td>${formatPercent(entry.bestAccuracy || 0)}</td>
          <td>${entry.attempts || 0}</td>
          <td>${ToolRenderers.escapeHtml(entry.lastTested || '-')}</td>
        </tr>`)
        .join('');
      refs.dashboardBody.innerHTML = rows || '<tr><td colspan="8" style="color:var(--text-tertiary)">No saved stats yet. Run a few tests and this dashboard will fill in automatically.</td></tr>';
    }

    function getElapsedMs(now) {
      if (!state.startedAt) return 0;
      if (state.isFinished) return Math.max(1, state.finishedAt - state.startedAt);
      return Math.max(1, now - state.startedAt);
    }

    function getMetrics(includeCurrent) {
      let correctChars = 0;
      let totalChars = 0;
      let incorrectChars = 0;

      if (state.tokenMode) {
        state.committedWords.forEach((entry) => {
          const stats = analyzeTyped(entry.expected, entry.typed);
          correctChars += stats.correct;
          totalChars += stats.total;
          incorrectChars += stats.incorrect;
        });
        if (includeCurrent && state.currentInput) {
          const currentExpected = state.tokens[state.currentWordIndex] || '';
          const stats = analyzeTyped(currentExpected, state.currentInput);
          correctChars += stats.correct;
          totalChars += stats.total;
          incorrectChars += stats.incorrect;
        }
      } else {
        const length = includeCurrent ? state.streamInput.length : state.streamInput.length;
        for (let index = 0; index < length; index += 1) {
          const typedChar = state.streamInput[index];
          const expectedChar = state.text[index] || '';
          if (!typedChar) continue;
          totalChars += 1;
          if (typedChar === expectedChar) correctChars += 1;
          else incorrectChars += 1;
        }
      }

      const elapsedMinutes = getElapsedMs(performance.now()) / 60000;
      const rawWpm = totalChars ? (totalChars / 5) / elapsedMinutes : 0;
      const wpm = correctChars ? (correctChars / 5) / elapsedMinutes : 0;
      const accuracy = totalChars ? (correctChars / totalChars) * 100 : 100;

      return {
        correctChars,
        totalChars,
        incorrectChars,
        rawWpm,
        wpm,
        accuracy,
      };
    }

    function updateLiveStats() {
      const metrics = getMetrics(true);
      refs.statWpm.textContent = String(Math.max(0, Math.round(metrics.wpm)));
      refs.statRaw.textContent = String(Math.max(0, Math.round(metrics.rawWpm)));
      refs.statAccuracy.textContent = formatPercent(metrics.accuracy);
      refs.statErrors.textContent = String(metrics.incorrectChars);
    }

    function currentTimerSeconds(now) {
      if (config.mode === 'words' && config.wordsMode === 'count') {
        return getElapsedMs(now) / 1000;
      }
      return Math.max(0, config.timeLimit - (getElapsedMs(now) / 1000));
    }

    function currentProgress(now) {
      if (config.mode === 'words' && config.wordsMode === 'count') {
        return clamp(state.currentWordIndex / Math.max(config.wordCount, 1), 0, 1);
      }
      return clamp((getElapsedMs(now) / 1000) / config.timeLimit, 0, 1);
    }

    function renderTokenChars(expected, typed, current) {
      const html = [];
      const maxLength = Math.max(expected.length, typed.length, current ? typed.length + 1 : typed.length);
      for (let index = 0; index < maxLength; index += 1) {
        const expectedChar = expected[index] || '';
        const typedChar = typed[index] || '';
        if (typedChar) {
          if (typedChar === expectedChar) {
            html.push(`<span class="typing-char-correct">${ToolRenderers.escapeHtml(typedChar)}</span>`);
          } else if (expectedChar) {
            html.push(`<span class="typing-char-error">${ToolRenderers.escapeHtml(expectedChar)}<sup>${ToolRenderers.escapeHtml(typedChar)}</sup></span>`);
          } else {
            html.push(`<span class="typing-char-extra">${ToolRenderers.escapeHtml(typedChar)}</span>`);
          }
        } else if (current && index === typed.length) {
          html.push(`<span class="typing-char-current">${ToolRenderers.escapeHtml(expectedChar || ' ')}</span>`);
        } else if (expectedChar) {
          html.push(`<span class="typing-char-upcoming">${ToolRenderers.escapeHtml(expectedChar)}</span>`);
        }
      }
      return html.join('');
    }

    function renderDisplay() {
      if (state.tokenMode) {
        const html = [];
        for (let index = 0; index < state.tokens.length; index += 1) {
          const expected = state.tokens[index];
          if (index < state.currentWordIndex) {
            const committed = state.committedWords[index] || { expected, typed: '' };
            html.push(`<span class="typing-word" data-word-index="${index}">${renderTokenChars(expected, committed.typed, false)}</span>`);
          } else if (index === state.currentWordIndex) {
            html.push(`<span class="typing-word typing-word-current" data-word-index="${index}">${renderTokenChars(expected, state.currentInput, true)}</span>`);
          } else {
            html.push(`<span class="typing-word" data-word-index="${index}">${ToolRenderers.escapeHtml(expected)}</span>`);
          }
        }
        refs.display.className = 'typing-display';
        refs.display.innerHTML = html.join('');
      } else {
        const html = [];
        for (let index = 0; index < state.text.length; index += 1) {
          const expectedChar = state.text[index] || '';
          const typedChar = state.streamInput[index] || '';
          if (typedChar) {
            if (typedChar === expectedChar) {
              html.push(`<span class="typing-char-correct">${ToolRenderers.escapeHtml(typedChar)}</span>`);
            } else {
              html.push(`<span class="typing-char-error">${ToolRenderers.escapeHtml(expectedChar || ' ')}<sup>${ToolRenderers.escapeHtml(typedChar)}</sup></span>`);
            }
          } else if (index === state.streamInput.length) {
            html.push(`<span class="typing-char-current">${ToolRenderers.escapeHtml(expectedChar || ' ')}</span>`);
          } else {
            html.push(`<span class="typing-char-upcoming">${ToolRenderers.escapeHtml(expectedChar)}</span>`);
          }
        }
        refs.display.className = `typing-display${config.mode === 'code' ? ' mode-code' : ''}`;
        refs.display.innerHTML = html.join('');
      }
      requestAnimationFrame(() => {
        const currentWord = state.tokenMode
          ? refs.display.querySelector(`[data-word-index="${state.currentWordIndex}"]`)
          : refs.display.querySelector('.typing-char-current');
        currentWord?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
      });
    }

    function updateTimer() {
      const now = performance.now();
      refs.timer.textContent = formatTime(currentTimerSeconds(now));
      refs.timerCaption.textContent = config.mode === 'words' && config.wordsMode === 'count'
        ? (state.isRunning ? 'Elapsed time' : 'Timer starts on your first keystroke.')
        : (state.isRunning ? 'Countdown active' : 'Timer starts on your first keystroke.');
      refs.progress.style.width = `${currentProgress(now) * 100}%`;
    }

    function startTest() {
      if (state.isRunning || state.isFinished) return;
      state.isRunning = true;
      state.startedAt = performance.now();
      tick();
    }

    function flushCurrentWord() {
      const expected = state.tokens[state.currentWordIndex] || '';
      const typed = state.currentInput;
      if (!typed) return;
      const stats = analyzeTyped(expected, typed);
      state.committedWords[state.currentWordIndex] = { expected, typed };
      state.errors.push(...stats.errors);
      state.currentWordIndex += 1;
      state.currentInput = '';
      refs.input.value = '';
    }

    function finishTest() {
      if (state.isFinished) return;
      if (state.tokenMode && state.currentInput) {
        flushCurrentWord();
      }
      cancelAnimationFrame(rafId);
      state.isRunning = false;
      state.isFinished = true;
      state.finishedAt = performance.now();
      updateTimer();
      const metrics = getMetrics(false);
      const result = {
        wpm: Math.max(0, Math.round(metrics.wpm)),
        rawWpm: Math.max(0, Math.round(metrics.rawWpm)),
        accuracy: Number(metrics.accuracy.toFixed(1)),
        errors: metrics.incorrectChars,
        correctChars: metrics.correctChars,
        incorrectChars: metrics.incorrectChars,
        totalChars: metrics.totalChars,
        duration: getElapsedMs(performance.now()) / 1000,
        date: new Date().toISOString().slice(0, 10),
      };
      latestResult = result;

      const previousBest = readStorage(getPbKey(config), null);
      const isNewBest = !previousBest || result.wpm >= (previousBest.wpm || 0);
      if (isNewBest) {
        writeStorage(getPbKey(config), result);
      }

      const store = getStatsStore();
      const key = getConfigKey(config);
      const entry = store.configs[key] || {
        mode: config.mode,
        duration: getDurationLabel(config),
        difficulty: config.difficulty,
        language: DATA.languageLabels?.[config.language] || config.language,
        bestWpm: 0,
        bestAccuracy: 0,
        attempts: 0,
        lastTested: '',
        history: [],
      };
      entry.mode = config.mode;
      entry.duration = getDurationLabel(config);
      entry.difficulty = config.difficulty;
      entry.language = DATA.languageLabels?.[config.language] || config.language;
      entry.bestWpm = Math.max(entry.bestWpm || 0, result.wpm);
      entry.bestAccuracy = Math.max(entry.bestAccuracy || 0, result.accuracy);
      entry.attempts = (entry.attempts || 0) + 1;
      entry.lastTested = result.date;
      entry.history = [...(entry.history || []), {
        wpm: result.wpm,
        rawWpm: result.rawWpm,
        accuracy: result.accuracy,
        errors: result.errors,
        date: result.date,
      }].slice(-10);
      store.configs[key] = entry;
      writeStorage(STORAGE.stats, store);

      refs.results.hidden = false;
      animateCount(refs.resultBig, result.wpm);
      refs.resultSummary.textContent = isNewBest
        ? 'New personal best saved locally in this browser.'
        : 'This run is saved locally, so your next session has something to beat.';
      refs.resultAccuracy.textContent = formatPercent(result.accuracy);
      refs.resultRaw.textContent = String(result.rawWpm);
      refs.resultErrors.textContent = String(result.errors);
      refs.resultDuration.textContent = `${Math.round(result.duration)}s`;
      refs.resultCharacters.textContent = `${result.correctChars} / ${result.incorrectChars} / ${result.totalChars}`;

      const gap = Math.max(0, Math.round((entry.bestWpm || 0) - result.wpm));
      refs.bestBanner.classList.toggle('is-chasing', !isNewBest);
      refs.bestTitle.textContent = isNewBest ? 'New Personal Best!' : `Your best: ${Math.round(entry.bestWpm || 0)} WPM`;
      refs.bestCopy.textContent = isNewBest
        ? `You just set a new local best for ${getDurationLabel(config)} on ${DATA.languageLabels?.[config.language] || config.language}.`
        : `${gap} WPM away from your best score for this setup.`;
      refs.bestProgress.style.width = `${clamp(result.wpm / Math.max(entry.bestWpm || 1, 1), 0, 1) * 100}%`;

      drawSparkline(refs.sparkline, (entry.history || []).map((item) => item.wpm));
      const mistakes = buildMistakeSummary(state.errors);
      refs.mistakeList.innerHTML = mistakes.length
        ? mistakes.map((item) => `<span class="typing-mistake-chip">${ToolRenderers.escapeHtml(item)}</span>`).join('')
        : '<span class="typing-subcopy">No repeat pattern stood out in this run.</span>';

      refs.srAnnouncer.textContent = `Typing test complete. ${result.wpm} words per minute with ${result.accuracy.toFixed(1)} percent accuracy.`;
      if (isNewBest) launchConfetti(refs.confetti);
      renderDashboard();
    }

    function tick() {
      if (!state.isRunning) return;
      updateTimer();
      updateLiveStats();
      if (!(config.mode === 'words' && config.wordsMode === 'count') && currentTimerSeconds(performance.now()) <= 0) {
        finishTest();
        return;
      }
      rafId = requestAnimationFrame(tick);
    }

    function resetTest(scroll) {
      cancelAnimationFrame(rafId);
      saveConfig();
      state = createState();
      latestResult = null;
      refs.results.hidden = true;
      refs.resultBig.textContent = '0';
      refs.input.value = '';
      refs.displayWrap.scrollTop = 0;
      refs.guidance.textContent = state.tokenMode
        ? 'Click or tap the prompt, then type the current word and press Space to advance. Backspace stays within the active word only.'
        : 'Click or tap the prompt, then type through the full prompt in one continuous flow.';
      renderDisplay();
      updateTimer();
      updateLiveStats();
      if (scroll) refs.displayWrap.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    container.addEventListener('click', (event) => {
      const button = event.target.closest('.typing-segmented-btn');
      if (!button) return;
      const group = button.dataset.group;
      const value = button.dataset.value;
      if (group === 'typing-mode') config.mode = value;
      if (group === 'typing-words-mode') config.wordsMode = value;
      if (group === 'typing-time') config.timeLimit = Number(value) || DEFAULTS.timeLimit;
      if (group === 'typing-word-count') config.wordCount = Number(value) || DEFAULTS.wordCount;
      if (group === 'typing-difficulty') config.difficulty = value;
      updateConfigUi();
      resetTest(false);
    });

    refs.languageSelect.addEventListener('change', () => {
      config.language = refs.languageSelect.value || DEFAULTS.language;
      updateConfigUi();
      resetTest(false);
    });

    refs.customText.addEventListener('input', () => {
      config.customText = refs.customText.value;
      updateConfigUi();
      if (config.mode === 'custom') resetTest(false);
      else saveConfig();
    });

    refs.displayWrap.addEventListener('click', () => refs.input.focus());
    refs.displayWrap.addEventListener('touchstart', () => refs.input.focus(), { passive: true });

    refs.input.addEventListener('keydown', (event) => {
      if (event.key === 'Backspace' && !refs.input.value) {
        event.preventDefault();
        return;
      }
      if (state.tokenMode && (event.key === ' ' || event.key === 'Enter')) {
        event.preventDefault();
        if (!state.isRunning && state.currentInput.trim()) startTest();
        flushCurrentWord();
        renderDisplay();
        updateLiveStats();
        if (config.mode === 'words' && config.wordsMode === 'count' && state.currentWordIndex >= config.wordCount) {
          finishTest();
        }
      } else if (!state.isRunning && event.key.length === 1) {
        startTest();
      }
    });

    refs.input.addEventListener('input', () => {
      if (state.isFinished) return;
      if (state.tokenMode) {
        state.currentInput = refs.input.value.replace(/\s+/g, '');
        if (state.currentInput && !state.isRunning) startTest();
      } else {
        const nextValue = refs.input.value.replace(/\r/g, '').slice(0, state.text.length);
        if (nextValue.length > state.streamLastLength) {
          for (let index = state.streamLastLength; index < nextValue.length; index += 1) {
            const typedChar = nextValue[index];
            const expectedChar = state.text[index] || '';
            if (typedChar !== expectedChar) {
              state.errors.push({
                expected: expectedChar || '(extra)',
                typed: typedChar,
                fragment: state.text.slice(Math.max(0, index - 1), Math.min(state.text.length, index + 2)) || typedChar,
              });
            }
          }
        }
        state.streamInput = nextValue;
        state.streamLastLength = nextValue.length;
        if (nextValue && !state.isRunning) startTest();
        if (state.streamInput.length >= state.text.length) finishTest();
      }
      renderDisplay();
      updateLiveStats();
    });

    refs.restartBtn.addEventListener('click', () => {
      resetTest(true);
      refs.input.focus();
    });

    refs.tryAgainBtn.addEventListener('click', () => {
      resetTest(true);
      refs.input.focus();
    });

    refs.settingsBtn.addEventListener('click', () => {
      refs.results.hidden = true;
      container.querySelector('#typing-config-card')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });

    refs.shareBtn.addEventListener('click', () => {
      if (!latestResult) return;
      const shareText = `I typed ${latestResult.wpm} WPM with ${latestResult.accuracy}% accuracy on Tooliest's Typing Speed Test. Try it: tooliest.com/typing-speed-test`;
      if (typeof copyToClipboard === 'function') {
        copyToClipboard(shareText, refs.shareBtn);
      }
    });

    refs.resetStatsBtn.addEventListener('click', () => {
      if (!window.confirm('Reset all local typing stats and personal bests for this browser?')) return;
      removeTypingStorage();
      refs.srAnnouncer.textContent = 'All local typing stats were reset.';
      renderDashboard();
      resetTest(false);
    });

    updateConfigUi();
    renderDashboard();
    resetTest(false);
  };
})();
