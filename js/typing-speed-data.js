(function initTooliestTypingData(global) {
  const LANGUAGE_LABELS = {
    english: 'English',
    spanish: 'Spanish',
    french: 'French',
    german: 'German',
    portuguese: 'Portuguese',
    hindi: 'Hindi (romanized)',
    japanese: 'Japanese (romaji)',
  };

  const WORD_SEEDS = {
    english: {
      easy: ['the', 'and', 'that', 'with', 'from', 'this', 'have', 'will', 'your', 'about', 'there', 'which', 'their', 'would', 'could', 'people', 'after', 'before', 'every', 'while', 'where', 'small', 'great', 'right', 'think', 'write', 'world', 'under', 'sound', 'light', 'study', 'place', 'house', 'point', 'water', 'again', 'never', 'today', 'story', 'table', 'power', 'group', 'music', 'young', 'learn', 'maybe', 'carry', 'happy', 'three', 'other', 'first', 'found', 'clean', 'quick', 'smart', 'early', 'later', 'basic', 'focus', 'build'],
      medium: ['browser', 'feature', 'improve', 'capture', 'process', 'offline', 'privacy', 'instant', 'support', 'quality', 'project', 'pattern', 'canvas', 'timing', 'metric', 'storage', 'history', 'session', 'default', 'custom', 'signal', 'render', 'format', 'cursor', 'output', 'sample', 'author', 'review', 'launch', 'worker'],
      hard: ['reproducible', 'constraint', 'analysis', 'frictionless', 'competitive', 'keyboard', 'retention', 'assessment', 'configuration', 'instrumentation'],
    },
    spanish: {
      easy: ['hola', 'gracias', 'tarde', 'noche', 'manana', 'amigo', 'casa', 'tiempo', 'gente', 'mundo', 'trabajo', 'libro', 'papel', 'agua', 'comida', 'camino', 'bueno', 'mejor', 'nuevo', 'viejo', 'claro', 'fuerte', 'calma', 'lugar', 'familia', 'escuela', 'ciudad', 'viaje', 'cambio', 'ayuda'],
      medium: ['ventana', 'teclado', 'pantalla', 'rapidez', 'detalle', 'sistema', 'mensaje', 'archivo', 'practica', 'lectura', 'numero', 'privado', 'seguro', 'historia', 'resultado'],
      hard: ['constancia', 'rendimiento', 'desarrollo', 'comparacion', 'configuracion'],
    },
    french: {
      easy: ['bonjour', 'merci', 'maison', 'temps', 'monde', 'travail', 'table', 'livre', 'route', 'eau', 'famille', 'ecole', 'ville', 'ami', 'jour', 'nuit', 'matin', 'clair', 'fort', 'calme', 'simple', 'rapide', 'propre', 'histoire', 'groupe', 'musique', 'image', 'papier', 'message', 'sourire'],
      medium: ['clavier', 'ecran', 'vitesse', 'lecture', 'numero', 'prive', 'secure', 'resultat', 'archive', 'phrase', 'projet', 'modele', 'fenetre', 'donnee', 'saisie'],
      hard: ['configuration', 'comparaison', 'developpement', 'performance', 'reproductible'],
    },
    german: {
      easy: ['hallo', 'danke', 'haus', 'zeit', 'welt', 'arbeit', 'buch', 'wasser', 'weg', 'familie', 'schule', 'stadt', 'freund', 'morgen', 'abend', 'nacht', 'klar', 'stark', 'ruhig', 'schnell', 'sauber', 'einfach', 'frage', 'antwort', 'musik', 'farbe', 'fenster', 'papier', 'bild', 'sprache'],
      medium: ['tastatur', 'bildschirm', 'geschwindigkeit', 'privat', 'sicher', 'ergebnis', 'verlauf', 'speicher', 'eingabe', 'ausgabe', 'projekt', 'beispiel', 'sprung', 'kontext', 'satz'],
      hard: ['konfiguration', 'vergleich', 'entwicklung', 'wiederholbar', 'herausforderung'],
    },
    portuguese: {
      easy: ['ola', 'obrigado', 'casa', 'tempo', 'mundo', 'trabalho', 'livro', 'agua', 'familia', 'escola', 'cidade', 'amigo', 'manhana', 'noite', 'claro', 'forte', 'calmo', 'simples', 'rapido', 'limpo', 'historia', 'grupo', 'musica', 'imagem', 'papel', 'janela', 'estrada', 'ajuda', 'novo', 'velho'],
      medium: ['teclado', 'tela', 'velocidade', 'privado', 'seguro', 'resultado', 'arquivo', 'leitura', 'entrada', 'saida', 'projeto', 'modelo', 'detalhe', 'sinal', 'frase'],
      hard: ['configuracao', 'comparacao', 'desenvolvimento', 'desempenho', 'reproducivel'],
    },
    hindi: {
      easy: ['namaste', 'dhanyavad', 'ghar', 'samay', 'duniya', 'kaam', 'kitab', 'paani', 'parivar', 'school', 'shahar', 'dost', 'subah', 'raat', 'saaf', 'tez', 'shaant', 'sach', 'naya', 'purana', 'madad', 'raasta', 'rang', 'sur', 'kagaz', 'tasveer', 'khushi', 'soch', 'likho', 'bolo'],
      medium: ['keyboard', 'screen', 'gati', 'surakshit', 'nijji', 'parinam', 'itihaas', 'sangrah', 'pravesh', 'nikas', 'abhyas', 'vakya', 'sankhya', 'vishesh', 'sandesh'],
      hard: ['vinyas', 'tulna', 'vikas', 'punarutpaadan', 'chunauti'],
    },
    japanese: {
      easy: ['konnichiwa', 'arigato', 'ie', 'jikan', 'sekai', 'shigoto', 'hon', 'mizu', 'kazoku', 'gakkou', 'machi', 'tomodachi', 'asa', 'yoru', 'akarui', 'hayai', 'shizuka', 'atarashii', 'furui', 'tasukeru', 'michi', 'iro', 'ongaku', 'kami', 'shashin', 'egao', 'kangaeru', 'kaku', 'hanasu', 'mirai'],
      medium: ['kiiboodo', 'sukuriin', 'supiido', 'puraibeto', 'anzen', 'kekka', 'rekishi', 'hozon', 'nyuuryoku', 'shutsuryoku', 'renshuu', 'bunshou', 'bangou', 'shousai', 'messeeji'],
      hard: ['settei', 'hikaku', 'kaihatsu', 'saigen', 'kadai'],
    },
  };

  const SENTENCE_PARTS = {
    english: {
      subjects: ['The writer', 'A fast typist', 'This private tool', 'The product team', 'A careful student', 'The remote freelancer', 'A patient learner', 'The early editor', 'Every daily practice session'],
      verbs: ['checks every sentence', 'practices for fifteen minutes', 'stores progress locally', 'improves accuracy first', 'starts with slower bursts', 'reads the prompt aloud', 'builds steady rhythm', 'returns after lunch', 'tracks small gains'],
      endings: ['before chasing speed.', 'without sending data anywhere.', 'to build daily confidence.', 'when the timer feels comfortable.', 'so each session stays useful.', 'while the prompt stays easy to follow.', 'because clean technique lasts longer.', 'and notices fewer mistakes each round.', 'while the local history keeps the streak visible.'],
    },
    spanish: {
      subjects: ['El usuario', 'Una persona rapida', 'Esta prueba privada', 'El equipo pequeno', 'La estudiante', 'El redactor remoto', 'Cada sesion diaria', 'La persona paciente', 'El editor de la manana'],
      verbs: ['practica cada manana', 'mide la precision primero', 'guarda el progreso localmente', 'revisa cada palabra', 'mejora con calma', 'vuelve despues del almuerzo', 'mantiene un ritmo estable', 'lee cada linea despacio', 'anota pequenas mejoras'],
      endings: ['antes de buscar velocidad.', 'sin enviar datos a ningun servidor.', 'para volver manana con confianza.', 'cuando el ritmo se siente natural.', 'y mantiene un habito diario.', 'mientras el texto sigue claro.', 'porque la tecnica limpia dura mas.', 'y nota menos errores en cada ronda.', 'mientras el historial local muestra el avance.'],
    },
    french: {
      subjects: ['L utilisateur', 'Un typiste rapide', 'Cet outil prive', 'La petite equipe', 'La personne calme', 'Le redacteur a distance', 'Chaque session du matin', 'L etudiant patient', 'Le chef de projet'],
      verbs: ['verifie chaque mot', 'pratique quinze minutes', 'garde les scores localement', 'ameliore la precision', 'reprend le test demain', 'revient apres le dejeuner', 'garde un rythme stable', 'lit chaque ligne doucement', 'suit les petits progres'],
      endings: ['avant de viser plus vite.', 'sans envoyer de donnees au serveur.', 'pour construire une habitude simple.', 'quand le rythme devient naturel.', 'et garde une progression claire.', 'pendant que le texte reste lisible.', 'parce que la bonne technique dure plus longtemps.', 'et remarque moins d erreurs a chaque tour.', 'tandis que l historique local montre les efforts.'],
    },
    german: {
      subjects: ['Der Nutzer', 'Eine schnelle Person', 'Dieses private Werkzeug', 'Das kleine Team', 'Der ruhige Lerner', 'Der freie Autor', 'Jede Morgensitzung', 'Der geduldige Student', 'Die konzentrierte Redakteurin'],
      verbs: ['pruft jedes Wort', 'ubt funfzehn Minuten', 'speichert Werte lokal', 'steigert zuerst die Genauigkeit', 'kehrt morgen zuruck', 'liest jede Zeile langsam', 'halt den Rhythmus stabil', 'macht nach dem Mittag weiter', 'verfolgt kleine Fortschritte'],
      endings: ['bevor mehr Tempo wichtig wird.', 'ohne Daten an einen Server zu senden.', 'damit die Routine einfach bleibt.', 'wenn sich der Rhythmus gut anfuhlt.', 'und baut jeden Tag Vertrauen auf.', 'wahrend der Text gut lesbar bleibt.', 'weil saubere Technik langer tragt.', 'und sieht in jeder Runde weniger Fehler.', 'wahrend die lokale Historie Fortschritt zeigt.'],
    },
    portuguese: {
      subjects: ['O usuario', 'Uma pessoa rapida', 'Esta ferramenta privada', 'A equipe pequena', 'Quem pratica sempre', 'O redator remoto', 'Cada sessao diaria', 'O estudante paciente', 'A editora da manha'],
      verbs: ['confere cada palavra', 'pratica por quinze minutos', 'guarda o progresso localmente', 'melhora a precisao primeiro', 'volta amanha para treinar', 'le cada linha com calma', 'mantem um ritmo estavel', 'retorna depois do almoco', 'acompanha pequenos ganhos'],
      endings: ['antes de buscar mais velocidade.', 'sem enviar dados para servidor nenhum.', 'para criar um habito leve.', 'quando o ritmo parece natural.', 'e acompanha a evolucao com clareza.', 'enquanto o texto continua legivel.', 'porque a tecnica limpa dura mais.', 'e percebe menos erros em cada rodada.', 'enquanto o historico local mostra o progresso.'],
    },
    hindi: {
      subjects: ['Yeh upyogakarta', 'Ek tez typist', 'Yeh private test', 'Chhoti team', 'Har din seekhne wala vyakti', 'Door se kaam karne wala lekhak', 'Subah ki har practice', 'Dhyan se seekhne wala student', 'Shaant editor'],
      verbs: ['har shabd dekhkar likhta hai', 'pandrah minute abhyas karta hai', 'progress ko local rakhta hai', 'pehle sahi likhne par dhyan deta hai', 'kal fir se lautkar practice karta hai', 'har line ko araam se padhta hai', 'ek saman rhythm banaye rakhta hai', 'dopahar ke baad wapas aata hai', 'chhote sudhar note karta hai'],
      endings: ['phir speed badhata hai.', 'aur data kahin bhejta nahin hai.', 'taaki roz ka routine ban sake.', 'jab rhythm natural lagne lage.', 'aur dheere dheere confidence badhe.', 'jab text aasan dikhai deta rahe.', 'kyonki saaf technique zyada tikti hai.', 'aur har round me kam galti dekhta hai.', 'jab local history me pragati dikhai deti hai.'],
    },
    japanese: {
      subjects: ['Kono yuuzaa', 'Hayai taipisuto', 'Kono puraibeto tesuto', 'Chiisana chiimu', 'Mainichi renshuu suru hito', 'Rimooto no raitaa', 'Asa no renshuu jikan', 'Shizuka ni manabu gakusei', 'Shuchuu shite iru editaa'],
      verbs: ['subete no tango o kakunin shimasu', 'juugo fun renshuu shimasu', 'kiroku o rokaru ni hozon shimasu', 'seikakusa kara nobashimasu', 'ashita mo modotte kimasu', 'mae no gyou o yukkuri yomimasu', 'antei shita rizumu o tsukurimasu', 'hiru no ato ni mou ichido hajimemasu', 'chiisai seichou o kiroku shimasu'],
      endings: ['sorekara supiido o agemasu.', 'saabaa ni deeta o okurimasen.', 'kantan na shuukan o tsukurimasu.', 'rizumu ga shizen ni naru made tsuzukemasu.', 'soshite jishin o sukoshi zutsu tsukemasu.', 'tekisuto ga yomiyasui mama tsuzukimasu.', 'kirei na kihon ga nagaku yaku ni tachimasu.', 'maikai no ronda de machigai ga herimasu.', 'rokaru no rireki ga seika o misete kuremasu.'],
    },
  };

  const CODE_SNIPPETS = [
    { language: 'JavaScript', text: 'const total = items.reduce((sum, item) => sum + item.price, 0);' },
    { language: 'JavaScript', text: 'document.querySelectorAll("button").forEach((button) => button.disabled = false);' },
    { language: 'JavaScript', text: 'if (!response.ok) throw new Error(`Request failed: ${response.status}`);' },
    { language: 'JavaScript', text: 'const slug = title.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-");' },
    { language: 'JavaScript', text: 'const safeJson = JSON.parse(localStorage.getItem("draft") || "{}");' },
    { language: 'JavaScript', text: 'const formatter = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });' },
    { language: 'Python', text: 'total = sum(item["price"] for item in items if item.get("price"))' },
    { language: 'Python', text: 'for index, value in enumerate(records, start=1): print(index, value)' },
    { language: 'Python', text: 'clean_text = " ".join(part.strip() for part in raw_text.splitlines() if part.strip())' },
    { language: 'Python', text: 'if not filename.lower().endswith(".pdf"): raise ValueError("PDF file required")' },
    { language: 'Python', text: 'result = sorted(scores, key=lambda score: score["wpm"], reverse=True)[:10]' },
    { language: 'Python', text: 'config = {"mode": "words", "duration": 60, "difficulty": "medium"}' },
    { language: 'HTML', text: '<button class="btn btn-primary" aria-label="Start typing test">Start Test</button>' },
    { language: 'HTML', text: '<input type="text" autocomplete="off" spellcheck="false" aria-label="Type here">' },
    { language: 'HTML', text: '<section class="tool-content-section"><h2>Why Privacy Matters</h2><p>Everything stays local.</p></section>' },
    { language: 'HTML', text: '<canvas id="sparkline" width="320" height="80" aria-hidden="true"></canvas>' },
    { language: 'JavaScript', text: 'requestAnimationFrame((now) => updateTimer(Math.max(0, limit - (now - startTime))));' },
    { language: 'Python', text: 'history.append({"date": today, "wpm": wpm, "accuracy": round(accuracy, 1)})' },
    { language: 'HTML', text: '<progress max="100" value="64" aria-label="Test progress"></progress>' },
    { language: 'JavaScript', text: 'const seeded = mulberry32(seed); const pick = pool[Math.floor(seeded() * pool.length)];' },
    { language: 'Python', text: 'mistakes = collections.Counter(error["expected"] for error in errors if error.get("expected"))' },
    { language: 'HTML', text: '<span class="typing-char typing-char-error" aria-label="Incorrect character">x</span>' },
    { language: 'JavaScript', text: 'hiddenInput.addEventListener("keydown", (event) => event.key === "Backspace" && !hiddenInput.value && event.preventDefault());' },
    { language: 'Python', text: 'elapsed_minutes = max(elapsed_seconds / 60, 1 / 60)' },
  ];

  const CODE_EXAMPLES = {
    javascript: [
      ['const attempts = JSON.parse(localStorage.getItem("typingAttempts") || "[]");', 'const recent = attempts.slice(-10);', 'const average = recent.reduce((sum, run) => sum + run.wpm, 0) / Math.max(recent.length, 1);', 'console.log(`Average WPM: ${average.toFixed(1)}`);'].join('\n'),
      ['function formatResult(result) {', '  const accuracy = `${result.accuracy.toFixed(1)}%`;', '  return `${result.wpm} WPM at ${accuracy} accuracy`;', '}', '', 'statusLabel.textContent = formatResult(latestResult);'].join('\n'),
      ['const config = { mode: "words", duration: 60, language: "english" };', 'const prompt = buildPrompt(config);', 'hiddenInput.focus();', 'renderPrompt(prompt);'].join('\n'),
      ['const mistakes = new Map();', 'errors.forEach((item) => {', '  mistakes.set(item.expected, (mistakes.get(item.expected) || 0) + 1);', '});', 'const summary = [...mistakes.entries()].sort((a, b) => b[1] - a[1]);'].join('\n'),
      ['async function cachePrompt(text) {', '  const data = new TextEncoder().encode(text);', '  const digest = await crypto.subtle.digest("SHA-256", data);', '  return Array.from(new Uint8Array(digest)).slice(0, 8);', '}'].join('\n'),
      ['const progress = Math.min(currentWordIndex / words.length, 1);', 'progressBar.style.width = `${(progress * 100).toFixed(1)}%`;', 'timerLabel.textContent = formatTime(remainingSeconds);'].join('\n'),
      ['window.addEventListener("keydown", (event) => {', '  if (event.key === "Tab") return;', '  if (!testState.isRunning) startTest();', '});'].join('\n'),
      ['const samples = source.split(/\\s+/).filter(Boolean);', 'const unique = [...new Set(samples)];', 'const nextPrompt = unique.slice(0, 80).join(" ");', 'preview.textContent = nextPrompt;'].join('\n'),
    ],
    python: [
      ['history = load_history()', 'recent = history[-10:]', 'average = sum(item["wpm"] for item in recent) / max(len(recent), 1)', 'print(f"Average WPM: {average:.1f}")'].join('\n'),
      ['def summarize_run(result):', '    accuracy = f"{result[\'accuracy\']:.1f}%"', '    return f"{result[\'wpm\']} WPM at {accuracy} accuracy"', '', 'status_label = summarize_run(latest_result)'].join('\n'),
      ['config = {"mode": "code", "duration": 60, "language": "english"}', 'prompt = build_prompt(config)', 'render_prompt(prompt)', 'save_state(config)'].join('\n'),
      ['from collections import Counter', '', 'missed = Counter(error["expected"] for error in errors)', 'common = missed.most_common(5)', 'print(common)'].join('\n'),
      ['def normalize_text(value):', '    lines = [line.strip() for line in value.splitlines() if line.strip()]', '    return " ".join(lines)', '', 'cleaned = normalize_text(raw_text)'].join('\n'),
      ['scores = sorted(history, key=lambda item: item["wpm"], reverse=True)', 'personal_best = scores[0] if scores else None', 'if personal_best:', '    print(personal_best["wpm"])'].join('\n'),
      ['remaining = max(limit - elapsed, 0)', 'minutes = int(remaining // 60)', 'seconds = int(remaining % 60)', 'print(f"{minutes}:{seconds:02d}")'].join('\n'),
      ['def build_share_line(wpm, accuracy):', '    return f"I typed {wpm} WPM with {accuracy:.1f}% accuracy."', '', 'message = build_share_line(84, 97.4)'].join('\n'),
    ],
    html: [
      ['<section class="typing-results">', '  <h2>Latest Run</h2>', '  <p>84 WPM with 97.4% accuracy</p>', '</section>'].join('\n'),
      ['<div class="typing-dashboard">', '  <button type="button">Reset Stats</button>', '  <canvas id="typing-sparkline" width="320" height="80"></canvas>', '</div>'].join('\n'),
      ['<label for="typing-input">Type here</label>', '<input id="typing-input" type="text" autocomplete="off" spellcheck="false">', '<p aria-live="polite">Your result updates as you type.</p>'].join('\n'),
      ['<article class="typing-card">', '  <h3>Personal Best</h3>', '  <strong>92 WPM</strong>', '  <p>Stored only in this browser.</p>', '</article>'].join('\n'),
      ['<div class="typing-progress">', '  <span class="typing-progress-bar" style="width: 63%"></span>', '</div>', '<small>Session progress</small>'].join('\n'),
      ['<section class="typing-config">', '  <button type="button" aria-pressed="true">Words</button>', '  <button type="button" aria-pressed="false">Sentences</button>', '</section>'].join('\n'),
      ['<table width="100%" cellpadding="0" cellspacing="0">', '  <tr><td><strong>Accuracy</strong></td><td>97.4%</td></tr>', '  <tr><td><strong>Errors</strong></td><td>4</td></tr>', '</table>'].join('\n'),
      ['<div class="typing-note">', '  <p>Your keystrokes stay in this browser only.</p>', '  <p>No network request is required to run this test.</p>', '</div>'].join('\n'),
    ],
  };

  const NUMBER_SCENARIOS = [
    'INV-1048 04/26/2026 458.22 98451 #7721 17:45 +977-9700064756',
    'PO-8821 2026-05-14 1200.50 18.00% 3307 4419 6721 5802',
    'REF-2917 09:30 67.40 18/24 503-17-88 440022 7815',
    'ID-4408 12/11/2026 998.04 441-882-190 71% 4506 8820',
    'TKT-7314 08:55 245.75 5520-7719-4402 13/18 9071',
    'REC-8104 07:20 58.95 TAX-14.00% 99017 4410 3312',
    'ORD-2219 2026-08-03 74.80 006741 19:05 12/42',
    'BIL-9027 05/17/2026 650.10 880-41-770 5539',
    'LOT-1834 16:42 310.25 22.5% 7714 4408 9931',
    'ACC-7301 2026-09-21 84.64 778812 14:10 +1-415-555-0182',
    'TRK-6508 11:28 407.90 31/90 12004 8843',
    'QTE-4401 06/30/2026 118.35 47.00 903-772 1550',
  ];

  function buildWeightedPool(seed, targetLength) {
    const targetEasy = Math.floor(targetLength * 0.6);
    const targetMedium = Math.floor(targetLength * 0.3);
    const pool = [];

    while (pool.length < targetEasy) {
      pool.push(seed.easy[pool.length % seed.easy.length]);
    }
    while (pool.length < targetEasy + targetMedium) {
      const index = pool.length - targetEasy;
      pool.push(seed.medium[index % seed.medium.length]);
    }
    while (pool.length < targetLength) {
      const index = pool.length - targetEasy - targetMedium;
      pool.push(seed.hard[index % seed.hard.length]);
    }
    return pool;
  }

  function buildSentenceBank(parts) {
    const bank = [];
    parts.subjects.forEach((subject) => {
      parts.verbs.forEach((verb) => {
        parts.endings.forEach((ending) => {
          bank.push(`${subject} ${verb} ${ending}`);
        });
      });
    });
    return bank;
  }

  function mulberry32(seed) {
    let value = seed >>> 0;
    return function random() {
      value += 0x6d2b79f5;
      let t = Math.imul(value ^ (value >>> 15), 1 | value);
      t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function shuffleWithSeed(values, seed) {
    const list = values.slice();
    const random = mulberry32(seed);
    for (let index = list.length - 1; index > 0; index -= 1) {
      const swapIndex = Math.floor(random() * (index + 1));
      [list[index], list[swapIndex]] = [list[swapIndex], list[index]];
    }
    return list;
  }

  function stripSentencePunctuation(sentence) {
    return String(sentence || '')
      .replace(/[.,!?;:]+/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function randomDigits(random, length) {
    const digits = '0123456789';
    let output = '';
    for (let index = 0; index < length; index += 1) {
      output += digits[Math.floor(random() * digits.length)];
    }
    return output;
  }

  function randomDate(random) {
    const month = String(Math.floor(random() * 12) + 1).padStart(2, '0');
    const day = String(Math.floor(random() * 28) + 1).padStart(2, '0');
    const year = 2026 + Math.floor(random() * 3);
    return random() > 0.5 ? `${month}/${day}/${year}` : `${year}-${month}-${day}`;
  }

  function randomTime(random) {
    const hour = String(Math.floor(random() * 24)).padStart(2, '0');
    const minute = String(Math.floor(random() * 60)).padStart(2, '0');
    return `${hour}:${minute}`;
  }

  function randomAmount(random) {
    const whole = Math.floor(random() * 1800) + 10;
    const cents = String(Math.floor(random() * 100)).padStart(2, '0');
    return `${whole}.${cents}`;
  }

  function buildSentenceSequence(language, seed, minCharacters) {
    const bank = SENTENCE_BANKS[language] || SENTENCE_BANKS.english;
    const selected = [];
    let total = 0;
    let round = 0;

    while (total < minCharacters && round < 4) {
      const shuffled = shuffleWithSeed(bank, seed + round * 97);
      for (let index = 0; index < shuffled.length && total < minCharacters; index += 1) {
        const sentence = shuffled[index];
        selected.push(sentence);
        total += sentence.length + 1;
      }
      round += 1;
    }

    return selected.join(' ');
  }

  function buildWordSequence(language, seed, minWords) {
    const bank = SENTENCE_BANKS[language] || SENTENCE_BANKS.english;
    const selected = [];
    let totalWords = 0;
    let round = 0;

    while (totalWords < minWords && round < 4) {
      const shuffled = shuffleWithSeed(bank, seed + round * 131);
      for (let index = 0; index < shuffled.length && totalWords < minWords; index += 1) {
        const normalized = stripSentencePunctuation(shuffled[index]);
        selected.push(normalized);
        totalWords += normalized.split(/\s+/).filter(Boolean).length;
      }
      round += 1;
    }

    return selected.join(' ');
  }

  function formatCodeLanguageLabel(language) {
    if (language === 'javascript') return 'JavaScript';
    if (language === 'python') return 'Python';
    if (language === 'html') return 'HTML';
    return String(language || '').toUpperCase();
  }

  function buildCodeSequence(seed, minCharacters) {
    const languages = shuffleWithSeed(Object.keys(CODE_EXAMPLES), seed).filter((key) => Array.isArray(CODE_EXAMPLES[key]) && CODE_EXAMPLES[key].length);
    const blocks = [];
    const labels = [];
    let total = 0;
    let round = 0;

    while (languages.length && total < minCharacters && round < 3) {
      languages.forEach((language, languageIndex) => {
        if (total >= minCharacters) return;
        const examples = shuffleWithSeed(CODE_EXAMPLES[language], seed + round * 71 + languageIndex * 13);
        examples.slice(0, 2).forEach((example) => {
          if (total >= minCharacters) return;
          const block = example;
          blocks.push(block);
          labels.push(formatCodeLanguageLabel(language));
          total += block.length + 2;
        });
      });
      round += 1;
    }

    return {
      text: blocks.join('\n\n'),
      languages: [...new Set(labels)],
    };
  }

  function buildNumberSequence(seed, count) {
    const random = mulberry32(seed);
    const scenarios = shuffleWithSeed(NUMBER_SCENARIOS, seed).slice();
    const builders = [
      () => `INV-${randomDigits(random, 4)} ${randomDate(random)} ${randomAmount(random)} ${randomDigits(random, 5)} #${randomDigits(random, 4)} ${randomTime(random)} +977-${randomDigits(random, 10)}`,
      () => `PO-${randomDigits(random, 4)} ${randomDate(random)} ${randomAmount(random)} ${Number(random() * 24).toFixed(2)}% ${randomDigits(random, 4)} ${randomDigits(random, 4)} ${randomDigits(random, 4)} ${randomDigits(random, 4)}`,
      () => `REF-${randomDigits(random, 4)} ${randomTime(random)} ${randomAmount(random)} ${randomDigits(random, 2)}/${randomDigits(random, 2)} ${randomDigits(random, 3)}-${randomDigits(random, 2)}-${randomDigits(random, 2)} ${randomDigits(random, 6)} ${randomDigits(random, 4)}`,
      () => `TKT-${randomDigits(random, 4)} ${randomDate(random)} ${randomAmount(random)} ${randomDigits(random, 4)}-${randomDigits(random, 4)}-${randomDigits(random, 4)} ${randomDigits(random, 2)}/${randomDigits(random, 2)} ${randomDigits(random, 4)}`,
      () => `ACC-${randomDigits(random, 4)} ${randomTime(random)} ${randomAmount(random)} ${randomDigits(random, 3)}-${randomDigits(random, 3)}-${randomDigits(random, 4)} TAX-${Number(random() * 18).toFixed(2)}%`,
      () => `LOT-${randomDigits(random, 4)} ${randomDate(random)} ${randomAmount(random)} BIN-${randomDigits(random, 5)} ${randomDigits(random, 4)} ${randomDigits(random, 4)} ${randomDigits(random, 4)}`,
    ];

    while (scenarios.length < count) {
      const template = builders[Math.floor(random() * builders.length)];
      scenarios.push(template());
    }

    return scenarios.slice(0, count).join(' ');
  }

  const WORD_POOLS = Object.fromEntries(
    Object.entries(WORD_SEEDS).map(([language, seed]) => [
      language,
      {
        easy: buildWeightedPool({ easy: seed.easy, medium: seed.easy, hard: seed.easy }, language === 'english' ? 1000 : 500),
        medium: buildWeightedPool(seed, language === 'english' ? 1000 : 500),
        hard: buildWeightedPool({ easy: seed.medium, medium: seed.medium, hard: seed.hard }, language === 'english' ? 1000 : 500),
      },
    ])
  );

  const SENTENCE_BANKS = Object.fromEntries(
    Object.entries(SENTENCE_PARTS).map(([language, parts]) => [language, buildSentenceBank(parts)])
  );

  global.TooliestTypingData = {
    languages: Object.entries(LANGUAGE_LABELS).map(([value, label]) => ({ value, label })),
    languageLabels: LANGUAGE_LABELS,
    wordPools: WORD_POOLS,
    sentenceBanks: SENTENCE_BANKS,
    codeSnippets: CODE_SNIPPETS,
    codeExamples: CODE_EXAMPLES,
    numberScenarios: NUMBER_SCENARIOS,
    getWordPool(language, difficulty) {
      const pools = WORD_POOLS[language] || WORD_POOLS.english;
      return pools[difficulty] || pools.medium;
    },
    getSentenceBank(language) {
      return SENTENCE_BANKS[language] || SENTENCE_BANKS.english;
    },
    getSentenceSequence(language, seed, minCharacters) {
      return buildSentenceSequence(language, seed, minCharacters || 1100);
    },
    getWordSequence(language, seed, minWords) {
      return buildWordSequence(language, seed, minWords || 300);
    },
    getCodeSequence(seed, minCharacters) {
      return buildCodeSequence(seed, minCharacters || 1300).text;
    },
    getCodeSequenceData(seed, minCharacters) {
      return buildCodeSequence(seed, minCharacters || 1300);
    },
    getNumberSequence(seed, count) {
      return buildNumberSequence(seed, count || 24);
    },
  };
})(window);
