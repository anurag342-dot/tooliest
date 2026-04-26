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
      subjects: ['The writer', 'A fast typist', 'This private tool', 'The product team', 'A careful student'],
      verbs: ['checks every sentence', 'practices for fifteen minutes', 'stores progress locally', 'improves accuracy first', 'starts with slower bursts'],
      endings: ['before chasing speed.', 'without sending data anywhere.', 'to build daily confidence.', 'when the timer feels comfortable.', 'so each session stays useful.'],
    },
    spanish: {
      subjects: ['El usuario', 'Una persona rapida', 'Esta prueba privada', 'El equipo pequeno', 'La estudiante'],
      verbs: ['practica cada manana', 'mide la precision primero', 'guarda el progreso localmente', 'revisa cada palabra', 'mejora con calma'],
      endings: ['antes de buscar velocidad.', 'sin enviar datos a ningun servidor.', 'para volver manana con confianza.', 'cuando el ritmo se siente natural.', 'y mantiene un habito diario.'],
    },
    french: {
      subjects: ['L utilisateur', 'Un typiste rapide', 'Cet outil prive', 'La petite equipe', 'La personne calme'],
      verbs: ['verifie chaque mot', 'pratique quinze minutes', 'garde les scores localement', 'ameliore la precision', 'reprend le test demain'],
      endings: ['avant de viser plus vite.', 'sans envoyer de donnees au serveur.', 'pour construire une habitude simple.', 'quand le rythme devient naturel.', 'et garde une progression claire.'],
    },
    german: {
      subjects: ['Der Nutzer', 'Eine schnelle Person', 'Dieses private Werkzeug', 'Das kleine Team', 'Der ruhige Lerner'],
      verbs: ['pruft jedes Wort', 'ubt funfzehn Minuten', 'speichert Werte lokal', 'steigert zuerst die Genauigkeit', 'kehrt morgen zuruck'],
      endings: ['bevor mehr Tempo wichtig wird.', 'ohne Daten an einen Server zu senden.', 'damit die Routine einfach bleibt.', 'wenn sich der Rhythmus gut anfuhlt.', 'und baut jeden Tag Vertrauen auf.'],
    },
    portuguese: {
      subjects: ['O usuario', 'Uma pessoa rapida', 'Esta ferramenta privada', 'A equipe pequena', 'Quem pratica sempre'],
      verbs: ['confere cada palavra', 'pratica por quinze minutos', 'guarda o progresso localmente', 'melhora a precisao primeiro', 'volta amanha para treinar'],
      endings: ['antes de buscar mais velocidade.', 'sem enviar dados para servidor nenhum.', 'para criar um habito leve.', 'quando o ritmo parece natural.', 'e acompanha a evolucao com clareza.'],
    },
    hindi: {
      subjects: ['Yeh upyogakarta', 'Ek tez typist', 'Yeh private test', 'Chhoti team', 'Har din seekhne wala vyakti'],
      verbs: ['har shabd dekhkar likhta hai', 'pandrah minute abhyas karta hai', 'progress ko local rakhta hai', 'pehle sahi likhne par dhyan deta hai', 'kal fir se lautkar practice karta hai'],
      endings: ['phir speed badhata hai.', 'aur data kahin bhejta nahin hai.', 'taaki roz ka routine ban sake.', 'jab rhythm natural lagne lage.', 'aur dheere dheere confidence badhe.'],
    },
    japanese: {
      subjects: ['Kono yuuzaa', 'Hayai taipisuto', 'Kono puraibeto tesuto', 'Chiisana chiimu', 'Mainichi renshuu suru hito'],
      verbs: ['subete no tango o kakunin shimasu', 'juugo fun renshuu shimasu', 'kiroku o rokaru ni hozon shimasu', 'seikakusa kara nobashimasu', 'ashita mo modotte kimasu'],
      endings: ['sorekara supiido o agemasu.', 'saabaa ni deeta o okurimasen.', 'kantan na shuukan o tsukurimasu.', 'rizumu ga shizen ni naru made tsuzukemasu.', 'soshite jishin o sukoshi zutsu tsukemasu.'],
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

  function buildWeightedPool(seed, targetLength) {
    const targetEasy = Math.floor(targetLength * 0.6);
    const targetMedium = Math.floor(targetLength * 0.3);
    const targetHard = targetLength - targetEasy - targetMedium;
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
          if (bank.length < 140) {
            bank.push(`${subject} ${verb} ${ending}`);
          }
        });
      });
    });
    return bank;
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
    getWordPool(language, difficulty) {
      const pools = WORD_POOLS[language] || WORD_POOLS.english;
      return pools[difficulty] || pools.medium;
    },
    getSentenceBank(language) {
      return SENTENCE_BANKS[language] || SENTENCE_BANKS.english;
    },
  };
})(window);
