// ============================================
// TOOLIEST.COM — AI Features Module
// Client-side AI algorithms & smart features
// ============================================

const AI = {
  // Text Summarizer - extractive summarization using sentence scoring
  summarize(text, sentenceCount = 3) {
    if (!text || !text.trim()) return '';
    const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
    if (sentences.length <= sentenceCount) return text;
    
    // Word frequency scoring
    const words = text.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/).filter(w => w.length > 3);
    const stopWords = new Set(['this', 'that', 'these', 'those', 'with', 'from', 'have', 'been', 'were', 'will', 'would', 'could', 'should', 'their', 'there', 'they', 'them', 'then', 'than', 'what', 'when', 'where', 'which', 'while', 'about', 'after', 'before', 'between', 'under', 'over', 'again', 'because', 'into', 'through', 'during', 'each', 'some', 'other', 'also', 'very', 'just', 'more', 'most', 'only']);
    const freq = {};
    words.forEach(w => {
      if (!stopWords.has(w)) freq[w] = (freq[w] || 0) + 1;
    });
    
    // Score each sentence
    const scored = sentences.map((s, i) => {
      const sWords = s.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/);
      let score = sWords.reduce((sum, w) => sum + (freq[w] || 0), 0) / Math.max(sWords.length, 1);
      if (i === 0) score *= 1.5; // Boost first sentence
      if (i === sentences.length - 1) score *= 1.2; // Boost last sentence
      return { sentence: s.trim(), score, index: i };
    });
    
    scored.sort((a, b) => b.score - a.score);
    const top = scored.slice(0, sentenceCount);
    top.sort((a, b) => a.index - b.index);
    return top.map(s => s.sentence).join(' ');
  },

  // Paraphraser - synonym replacement + sentence restructuring
  paraphrase(text, style = 'standard') {
    if (!text || !text.trim()) return '';
    
    const synonymMap = {
      'good': ['great', 'excellent', 'wonderful', 'superb', 'fine'],
      'bad': ['poor', 'terrible', 'awful', 'unpleasant', 'subpar'],
      'big': ['large', 'enormous', 'substantial', 'considerable', 'massive'],
      'small': ['tiny', 'compact', 'minor', 'modest', 'little'],
      'important': ['crucial', 'essential', 'vital', 'significant', 'critical'],
      'help': ['assist', 'support', 'aid', 'facilitate', 'enable'],
      'make': ['create', 'produce', 'develop', 'generate', 'build'],
      'use': ['utilize', 'employ', 'leverage', 'apply', 'adopt'],
      'show': ['demonstrate', 'illustrate', 'reveal', 'display', 'exhibit'],
      'get': ['obtain', 'acquire', 'receive', 'gain', 'secure'],
      'give': ['provide', 'offer', 'deliver', 'supply', 'present'],
      'think': ['believe', 'consider', 'reckon', 'suppose', 'regard'],
      'say': ['state', 'mention', 'express', 'declare', 'note'],
      'need': ['require', 'necessitate', 'demand', 'call for', 'want'],
      'fast': ['quick', 'rapid', 'swift', 'speedy', 'prompt'],
      'easy': ['simple', 'straightforward', 'effortless', 'uncomplicated', 'painless'],
      'hard': ['difficult', 'challenging', 'demanding', 'tough', 'complex'],
      'start': ['begin', 'commence', 'initiate', 'launch', 'kick off'],
      'end': ['finish', 'conclude', 'complete', 'terminate', 'wrap up'],
      'change': ['modify', 'alter', 'adjust', 'transform', 'revise'],
      'find': ['discover', 'locate', 'identify', 'detect', 'uncover'],
      'try': ['attempt', 'endeavor', 'strive', 'aim', 'seek'],
      'problem': ['issue', 'challenge', 'concern', 'obstacle', 'difficulty'],
      'result': ['outcome', 'consequence', 'effect', 'product', 'output'],
      'way': ['method', 'approach', 'technique', 'manner', 'strategy'],
      'part': ['component', 'element', 'portion', 'section', 'segment'],
      'work': ['function', 'operate', 'perform', 'labor', 'toil'],
      'move': ['transfer', 'shift', 'relocate', 'transport', 'migrate'],
      'keep': ['maintain', 'retain', 'preserve', 'sustain', 'hold'],
      'very': ['extremely', 'remarkably', 'exceptionally', 'particularly', 'highly'],
      'many': ['numerous', 'countless', 'several', 'multiple', 'various'],
      'different': ['distinct', 'diverse', 'varied', 'unique', 'separate'],
      'new': ['novel', 'fresh', 'innovative', 'modern', 'recent'],
      'old': ['ancient', 'former', 'previous', 'aged', 'traditional'],
      'run': ['execute', 'operate', 'manage', 'conduct', 'handle'],
      'understand': ['comprehend', 'grasp', 'appreciate', 'recognize', 'perceive'],
      'however': ['nevertheless', 'nonetheless', 'yet', 'still', 'on the other hand'],
      'but': ['however', 'yet', 'although', 'nevertheless', 'though'],
      'because': ['since', 'as', 'due to the fact that', 'given that', 'owing to'],
      'also': ['additionally', 'furthermore', 'moreover', 'besides', 'likewise'],
    };
    
    let result = text;
    const words = text.split(/\b/);
    
    result = words.map(word => {
      const lower = word.toLowerCase().trim();
      if (synonymMap[lower]) {
        const syns = synonymMap[lower];
        const replacement = syns[Math.floor(Math.random() * syns.length)];
        // Maintain capitalization
        if (word[0] === word[0].toUpperCase()) {
          return replacement.charAt(0).toUpperCase() + replacement.slice(1);
        }
        return replacement;
      }
      return word;
    }).join('');
    
    // Style adjustments
    if (style === 'formal') {
      result = result.replace(/\bdon't\b/gi, 'do not')
                     .replace(/\bcan't\b/gi, 'cannot')
                     .replace(/\bwon't\b/gi, 'will not')
                     .replace(/\bit's\b/gi, 'it is')
                     .replace(/\bI'm\b/gi, 'I am')
                     .replace(/\bwe're\b/gi, 'we are')
                     .replace(/\bthey're\b/gi, 'they are')
                     .replace(/\byou're\b/gi, 'you are');
    }
    
    return result;
  },

  // Email Writer
  writeEmail(purpose, recipient, tone = 'professional', details = '') {
    const greetings = {
      professional: `Dear ${recipient || 'Sir/Madam'},`,
      casual: `Hey ${recipient || 'there'}!`,
      friendly: `Hi ${recipient || 'there'},`,
    };
    
    const closings = {
      professional: 'Best regards,',
      casual: 'Cheers,',
      friendly: 'Warm regards,',
    };
    
    const templates = {
      'follow-up': {
        professional: `I hope this email finds you well. I am writing to follow up on our previous conversation regarding ${details || 'our recent discussion'}.\n\nI wanted to check if there have been any updates or if you need any additional information from my end. I remain very interested and look forward to hearing from you at your earliest convenience.\n\nPlease do not hesitate to reach out if you have any questions.`,
        casual: `Just wanted to touch base about ${details || 'what we discussed'}. Any updates on your end?\n\nLet me know if you need anything from me — happy to help!`,
        friendly: `I hope you're doing great! I wanted to follow up on ${details || 'our last conversation'}.\n\nJust checking in to see if there's been any progress. Feel free to let me know if there's anything I can help with!`,
      },
      'meeting-request': {
        professional: `I am writing to request a meeting to discuss ${details || 'an important matter'}.\n\nWould you be available sometime this week? I am flexible with timing and can adjust to your schedule. A 30-minute slot would be sufficient.\n\nPlease let me know your availability, and I will send a calendar invitation accordingly.`,
        casual: `Would love to catch up and chat about ${details || 'a few things'}. Got some time this week?\n\nLet me know what works for you!`,
        friendly: `I'd love to schedule some time to discuss ${details || 'something I have in mind'}. Would any time this week work for you?\n\nI'm pretty flexible, so just let me know what fits your schedule best!`,
      },
      'thank-you': {
        professional: `I wanted to express my sincere gratitude for ${details || 'your time and assistance'}.\n\nYour support has been invaluable, and I truly appreciate the effort you have put in. It has made a significant difference.\n\nI look forward to our continued collaboration.`,
        casual: `Just wanted to say a big thanks for ${details || 'everything'}! Really appreciate it.\n\nYou're awesome!`,
        friendly: `Thank you so much for ${details || 'your help'}! I really appreciate you taking the time.\n\nIt means a lot to me, and I'm grateful for your support!`,
      },
      'introduction': {
        professional: `I am reaching out to introduce myself. ${details || 'I am a professional looking to connect and explore potential collaboration opportunities.'}\n\nI believe there is great potential for us to work together, and I would welcome the opportunity to discuss this further.\n\nWould you be available for a brief call or meeting?`,
        casual: `Wanted to reach out and say hi! ${details || "I've been following your work and thought it'd be cool to connect."}\n\nWould love to chat sometime if you're up for it!`,
        friendly: `I hope this message finds you well! I wanted to introduce myself. ${details || "I've been admiring your work and would love to connect."}\n\nI'd be delighted to learn more about what you do. Perhaps we could chat sometime?`,
      },
      'general': {
        professional: `I am writing to you regarding ${details || 'a matter I would like to bring to your attention'}.\n\nI would appreciate the opportunity to discuss this with you further. Please let me know a convenient time.\n\nThank you for your time and consideration.`,
        casual: `Wanted to drop you a quick note about ${details || 'something on my mind'}.\n\nLet me know your thoughts when you get a chance!`,
        friendly: `I hope you're having a wonderful day! I wanted to reach out about ${details || 'something I think you might be interested in'}.\n\nI'd love to hear your thoughts on this. Feel free to reply whenever you get a chance!`,
      },
    };
    
    const type = templates[purpose] ? purpose : 'general';
    const body = templates[type][tone] || templates[type]['professional'];
    
    return `${greetings[tone] || greetings.professional}\n\n${body}\n\n${closings[tone] || closings.professional}\n[Your Name]`;
  },

  // Blog Idea Generator
  generateBlogIdeas(topic, count = 5) {
    if (!topic) return [];
    const templates = [
      `The Ultimate Guide to ${topic}: Everything You Need to Know`,
      `${count > 3 ? '10' : '7'} Common ${topic} Mistakes and How to Avoid Them`,
      `How ${topic} Is Changing the World in ${new Date().getFullYear()}`,
      `${topic} vs. Alternatives: A Comprehensive Comparison`,
      `A Beginner's Complete Guide to ${topic}`,
      `Why ${topic} Matters More Than You Think`,
      `The Future of ${topic}: Trends and Predictions`,
      `How to Master ${topic} in 30 Days`,
      `${topic} Best Practices Every Professional Should Know`,
      `The Hidden Benefits of ${topic} Nobody Talks About`,
      `How I Used ${topic} to Transform My Workflow`,
      `${topic} FAQ: Answers to the Most Common Questions`,
      `Step-by-Step Tutorial: Getting Started with ${topic}`,
      `Why Most People Fail at ${topic} (And How to Succeed)`,
      `${topic} Case Study: Real Results and Lessons Learned`,
    ];
    
    // Shuffle and pick
    const shuffled = templates.sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count);
  },

  // Meta Description Writer
  writeMetaDescription(pageTitle, pageContent, keyword = '') {
    if (!pageTitle) return '';
    const year = new Date().getFullYear();
    const templates = [
      `Discover ${pageTitle.toLowerCase()} with our comprehensive guide. ${keyword ? `Learn about ${keyword} and ` : ''}Get expert insights, tips, and strategies for ${year}.`,
      `${pageTitle} - your complete resource for ${keyword || 'success'}. Free tools, expert advice, and actionable tips. Updated for ${year}.`,
      `Looking for ${pageTitle.toLowerCase()}? Our free tool helps you ${keyword ? keyword.toLowerCase() : 'achieve results'} faster. Try it now - no signup required!`,
      `${pageTitle}: Free online tool with instant results. ${keyword ? `Perfect for ${keyword}. ` : ''}Trusted by thousands of users worldwide.`,
      `Master ${pageTitle.toLowerCase()} with our free online tool. ${keyword ? `Optimize your ${keyword} ` : 'Get results '}in seconds. No registration needed.`,
    ];
    
    const description = templates[Math.floor(Math.random() * templates.length)];
    return description.length > 160 ? description.substring(0, 157) + '...' : description;
  },

  // Instagram Caption Generator
  generateCaption(topic, mood = 'inspiring') {
    if (!topic) return '';
    const captions = {
      inspiring: [
        `✨ ${topic} isn't just a dream — it's a journey worth taking. Every step counts, every effort matters. Keep pushing forward! 💪\n\n#${topic.replace(/\s+/g, '')} #Motivation #DreamBig #NeverGiveUp`,
        `🌟 The beauty of ${topic} lies in the process, not just the destination. Embrace every moment of growth. 🌱\n\n#${topic.replace(/\s+/g, '')} #Growth #Inspiration #KeepGoing`,
        `💫 ${topic} taught me that greatness comes from consistency, not perfection. Show up every day. 🔥\n\n#${topic.replace(/\s+/g, '')} #Consistency #Greatness #DailyMotivation`,
      ],
      funny: [
        `😂 My relationship with ${topic}? It's complicated. But we're making it work! 🤷‍♂️\n\n#${topic.replace(/\s+/g, '')} #Relatable #LOL #Mood`,
        `🤣 Started with ${topic}, ended up questioning all my life choices. 10/10 would do again! 😅\n\n#${topic.replace(/\s+/g, '')} #Funny #TrueStory #NoRegrets`,
        `😎 Professional ${topic} enthusiast. Amateur at everything else. And I'm okay with that! 🙃\n\n#${topic.replace(/\s+/g, '')} #Comedy #JustKidding #SortOf`,
      ],
      professional: [
        `📊 ${topic} continues to transform how we work and create value. Here are my key takeaways from recent experience:\n\n1️⃣ Focus on fundamentals\n2️⃣ Embrace continuous learning\n3️⃣ Build meaningful connections\n\n#${topic.replace(/\s+/g, '')} #Professional #Leadership #Innovation`,
        `🎯 In the world of ${topic}, success comes from strategic thinking and consistent execution. What's your approach?\n\n#${topic.replace(/\s+/g, '')} #Strategy #Success #Business`,
      ],
    };
    
    const moodCaptions = captions[mood] || captions.inspiring;
    return moodCaptions[Math.floor(Math.random() * moodCaptions.length)];
  },

  // Hashtag Generator
  generateHashtags(topic, count = 20) {
    if (!topic) return [];
    const words = topic.toLowerCase().split(/\s+/);
    const base = topic.replace(/\s+/g, '');
    
    const prefixes = ['', 'best', 'top', 'daily', 'my', 'love', 'insta', 'the', 'pro', 'real'];
    const suffixes = ['life', 'vibes', 'goals', 'tips', 'lover', 'guru', 'daily', 'world', 'community', 'inspiration'];
    const general = ['instagood', 'photooftheday', 'trending', 'viral', 'explore', 'fyp', 'reels', 'followme', 'lifestyle', 'motivation', 'success', 'mindset', 'growth', 'inspiration', 'creativity', 'passion', 'hustle', 'grind', 'goals', 'blessed'];
    
    const tags = new Set();
    tags.add(base);
    words.forEach(w => { if (w.length > 2) tags.add(w); });
    
    prefixes.forEach(p => tags.add(p + base));
    suffixes.forEach(s => tags.add(base + s));
    words.forEach(w => {
      suffixes.forEach(s => tags.add(w + s));
    });
    general.forEach(g => tags.add(g));
    
    return Array.from(tags).slice(0, count).map(t => '#' + t);
  },

  // Color Palette from Color Theory
  generatePalette(hexColor, harmony = 'complementary') {
    const hsl = AI.hexToHSL(hexColor);
    if (!hsl) return [];
    let palette = [];
    
    switch(harmony) {
      case 'complementary':
        palette = [
          hsl,
          { h: (hsl.h + 180) % 360, s: hsl.s, l: hsl.l },
        ];
        break;
      case 'analogous':
        palette = [
          { h: (hsl.h - 30 + 360) % 360, s: hsl.s, l: hsl.l },
          hsl,
          { h: (hsl.h + 30) % 360, s: hsl.s, l: hsl.l },
        ];
        break;
      case 'triadic':
        palette = [
          hsl,
          { h: (hsl.h + 120) % 360, s: hsl.s, l: hsl.l },
          { h: (hsl.h + 240) % 360, s: hsl.s, l: hsl.l },
        ];
        break;
      case 'split-complementary':
        palette = [
          hsl,
          { h: (hsl.h + 150) % 360, s: hsl.s, l: hsl.l },
          { h: (hsl.h + 210) % 360, s: hsl.s, l: hsl.l },
        ];
        break;
      case 'tetradic':
        palette = [
          hsl,
          { h: (hsl.h + 90) % 360, s: hsl.s, l: hsl.l },
          { h: (hsl.h + 180) % 360, s: hsl.s, l: hsl.l },
          { h: (hsl.h + 270) % 360, s: hsl.s, l: hsl.l },
        ];
        break;
      case 'shades':
        palette = [
          { h: hsl.h, s: hsl.s, l: Math.min(90, hsl.l + 30) },
          { h: hsl.h, s: hsl.s, l: Math.min(80, hsl.l + 15) },
          hsl,
          { h: hsl.h, s: hsl.s, l: Math.max(20, hsl.l - 15) },
          { h: hsl.h, s: hsl.s, l: Math.max(10, hsl.l - 30) },
        ];
        break;
      default:
        palette = [hsl];
    }
    
    return palette.map(c => AI.hslToHex(c.h, c.s, c.l));
  },

  // Utility: HEX to HSL
  hexToHSL(hex) {
    hex = hex.replace('#', '');
    if (hex.length === 3) hex = hex.split('').map(c => c + c).join('');
    if (hex.length !== 6) return null;
    
    let r = parseInt(hex.substr(0, 2), 16) / 255;
    let g = parseInt(hex.substr(2, 2), 16) / 255;
    let b = parseInt(hex.substr(4, 2), 16) / 255;
    
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;
    
    if (max === min) {
      h = s = 0;
    } else {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
        case g: h = ((b - r) / d + 2) / 6; break;
        case b: h = ((r - g) / d + 4) / 6; break;
      }
    }
    
    return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
  },

  // Utility: HSL to HEX
  hslToHex(h, s, l) {
    h /= 360; s /= 100; l /= 100;
    let r, g, b;
    if (s === 0) {
      r = g = b = l;
    } else {
      const hue2rgb = (p, q, t) => {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1/6) return p + (q - p) * 6 * t;
        if (t < 1/2) return q;
        if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
        return p;
      };
      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;
      r = hue2rgb(p, q, h + 1/3);
      g = hue2rgb(p, q, h);
      b = hue2rgb(p, q, h - 1/3);
    }
    const toHex = x => {
      const hex = Math.round(x * 255).toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    };
    return '#' + toHex(r) + toHex(g) + toHex(b);
  },

  // Keyword extraction
  extractKeywords(text, count = 10) {
    const words = text.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/).filter(w => w.length > 3);
    const stopWords = new Set(['this', 'that', 'these', 'those', 'with', 'from', 'have', 'been', 'were', 'will', 'would', 'could', 'should', 'their', 'there', 'they', 'them', 'then', 'than', 'what', 'when', 'where', 'which', 'while', 'about', 'after', 'before', 'between', 'under', 'over', 'again', 'because', 'into', 'through', 'during', 'each', 'some', 'other', 'also', 'very', 'just', 'more', 'most', 'only', 'your', 'such', 'like', 'does', 'being', 'here', 'much', 'both', 'well', 'back', 'even', 'still', 'same', 'want', 'come', 'take', 'know', 'make', 'like', 'long', 'look', 'many', 'said']);
    const freq = {};
    words.forEach(w => {
      if (!stopWords.has(w)) freq[w] = (freq[w] || 0) + 1;
    });
    return Object.entries(freq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, count)
      .map(([word, count]) => ({ word, count, density: ((count / words.length) * 100).toFixed(2) }));
  },
};
