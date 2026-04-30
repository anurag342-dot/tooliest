const ALLOWED_ORIGINS = ['https://tooliest.com'];
const VALID_TOOLS = new Set(['summarizer', 'paraphraser', 'email', 'blog', 'metadesc']);
const RATE_LIMIT_MAX = 20;
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;

const rateLimitStore = new Map();

function isLocalOrigin(origin) {
  return origin.startsWith('http://localhost') || origin.startsWith('http://127.0.0.1');
}

function isAllowedOrigin(origin) {
  return ALLOWED_ORIGINS.includes(origin) || isLocalOrigin(origin);
}

function buildHeaders(origin, extraHeaders = {}) {
  const headers = {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'Cache-Control': 'no-store',
    'Referrer-Policy': 'no-referrer',
  };

  if (origin) {
    headers['Access-Control-Allow-Origin'] = origin;
  }

  return { ...headers, ...extraHeaders };
}

function json(body, status, origin) {
  return new Response(JSON.stringify(body), {
    status,
    headers: buildHeaders(origin, { 'Content-Type': 'application/json' }),
  });
}

function logRequest(tool, startedAt, success, model) {
  console.log(
    JSON.stringify({
      timestamp: new Date().toISOString(),
      tool: tool || null,
      responseTimeMs: Date.now() - startedAt,
      success: Boolean(success),
      model: model || null,
    })
  );
}

function consumeRateLimit(ipAddress) {
  const now = Date.now();
  const existing = rateLimitStore.get(ipAddress);

  if (!existing || now - existing.windowStart >= RATE_LIMIT_WINDOW_MS) {
    rateLimitStore.set(ipAddress, { count: 1, windowStart: now });
    return true;
  }

  existing.count += 1;
  return existing.count <= RATE_LIMIT_MAX;
}

function pickOption(value, allowedValues, fallback) {
  return allowedValues.includes(value) ? value : fallback;
}

function pickNumber(value, allowedValues, fallback) {
  const parsed = Number(value);
  return allowedValues.includes(parsed) ? parsed : fallback;
}

function normalizeOptions(tool, options) {
  const safeOptions = options && typeof options === 'object' ? options : {};

  switch (tool) {
    case 'summarizer':
      return {
        length: pickOption(safeOptions.length, ['short', 'medium', 'detailed'], 'medium'),
      };
    case 'paraphraser':
      return {
        style: pickOption(safeOptions.style, ['standard', 'formal', 'casual', 'creative', 'simple'], 'standard'),
      };
    case 'email':
      return {
        tone: pickOption(
          safeOptions.tone,
          ['professional', 'friendly', 'assertive', 'apologetic', 'persuasive'],
          'professional'
        ),
        type: pickOption(
          safeOptions.type,
          ['reply', 'cold-outreach', 'follow-up', 'complaint', 'thank-you'],
          'reply'
        ),
      };
    case 'blog':
      return {
        count: pickNumber(safeOptions.count, [3, 5, 10], 5),
        format: pickOption(safeOptions.format, ['titles-only', 'titles-with-outline'], 'titles-only'),
      };
    case 'metadesc':
      return {
        tone: pickOption(safeOptions.tone, ['neutral', 'engaging', 'urgent', 'curious'], 'engaging'),
        maxChars: pickNumber(safeOptions.maxChars, [150, 155, 160], 155),
      };
    default:
      return {};
  }
}

function buildPrompt(tool, input, options) {
  switch (tool) {
    case 'summarizer':
      return `Summarize the following text.
- short = 1-2 sentences max
- medium = one concise paragraph
- detailed = 5-7 bullet points, each starting with "\u2022"
Return ONLY the summary. No intro. No preamble.
Length: ${options.length || 'medium'}
Text:
${input}`;
    case 'paraphraser':
      return `Paraphrase the following text in a ${options.style || 'standard'} style.
Rules:
- Preserve the exact meaning
- Significantly change sentence structure and vocabulary
- Do not add or remove information
Return ONLY the paraphrased text. No explanation. No preamble.
Text:
${input}`;
    case 'email':
      return `Write a complete ${options.type || 'reply'} email based on the context below.
Tone: ${options.tone || 'professional'}
Format EXACTLY as:
Subject: [subject line here]

[email body here]

[sign-off],
[Your Name]

Rules:
- Be concise and match the tone exactly
- No explanation before or after the email
Return ONLY the subject line and email body in the exact format above.
Context:
${input}`;
    case 'blog': {
      const formatBlock =
        options.format === 'titles-with-outline'
          ? `Format each as:
[number]. [Blog Title]
   \u2022 Sub-point 1
   \u2022 Sub-point 2
   \u2022 Sub-point 3`
          : 'Format: numbered list, one title per line.';

      return `Generate ${options.count || 5} blog post ideas for the topic below.
${formatBlock}
Rules:
- Titles must be specific, compelling, and SEO-friendly
- No intro sentence - start directly with "1."
Return ONLY the numbered list.
Topic/Keyword:
${input}`;
    }
    case 'metadesc':
      return `Write an SEO-optimized meta description for the content below.
Rules:
- Strictly under ${options.maxChars || 155} characters - count carefully
- Tone: ${options.tone || 'engaging'}
- Include a subtle call to action
- Do not start with "Discover", "Learn", or "Are you looking"
- No quotation marks in output
After the description, on a new line write: Chars: X
where X is the actual character count of the description only.
Content/Topic:
${input}`;
    default:
      return input;
  }
}

function isServerError(status) {
  return Number.isInteger(status) && status >= 500 && status < 600;
}

async function callGemini(prompt, apiKey) {
  let response;

  try {
    response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            maxOutputTokens: 1024,
            temperature: 0.7,
          },
        }),
      }
    );
  } catch (_) {
    return { ok: false, networkError: true };
  }

  if (!response.ok) {
    return { ok: false, status: response.status };
  }

  let data;
  try {
    data = await response.json();
  } catch (_) {
    return { ok: false, parseError: true };
  }

  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (typeof text !== 'string' || !text.trim()) {
    return { ok: false, unexpectedFormat: true };
  }

  return { ok: true, text: text.trim() };
}

async function callOpenRouter(prompt, apiKey) {
  let response;
  try {
    response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://tooliest.com',
        'X-Title': 'Tooliest AI Tools',
      },
      body: JSON.stringify({
        model: 'openrouter/free',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 1024,
        temperature: 0.7,
      }),
    });
  } catch (_) {
    return { ok: false, networkError: true };
  }

  if (!response.ok) {
    return { ok: false, status: response.status };
  }

  let data;
  try {
    data = await response.json();
  } catch (_) {
    return { ok: false, parseError: true };
  }

  const text = data?.choices?.[0]?.message?.content;
  if (typeof text !== 'string' || !text.trim()) {
    return { ok: false, unexpectedFormat: true };
  }

  return { ok: true, text: text.trim() };
}
export async function onRequest(context) {
  const request = context.request;
  const startedAt = Date.now();
  const origin = request.headers.get('Origin') || '';
  let tool = null;
  const finish = (response, success, model) => {
    logRequest(tool, startedAt, success, model);
    return response;
  };

  if (!isAllowedOrigin(origin)) {
    return finish(
      new Response(null, {
        status: 403,
        headers: buildHeaders(''),
      }),
      false,
      null
    );
  }

  if (request.method === 'OPTIONS') {
    return finish(
      new Response(null, {
        status: 204,
        headers: buildHeaders(origin, {
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
          'Access-Control-Max-Age': '86400',
        }),
      }),
      true,
      null
    );
  };

  if (request.method !== 'POST') {
    return finish(json({ success: false, error: 'Method not allowed.' }, 405, origin), false, null);
  }

  const ipAddress =
    request.headers.get('CF-Connecting-IP') ||
    request.headers.get('X-Forwarded-For')?.split(',')[0]?.trim() ||
    '';
  const shouldRateLimit = !isLocalOrigin(origin) && Boolean(ipAddress);

  if (shouldRateLimit && !consumeRateLimit(ipAddress)) {
    return finish(
      json({ success: false, error: 'Too many requests. Please wait a few minutes.' }, 429, origin),
      false,
      null
    );
  }

  let payload;
  try {
    payload = await request.json();
  } catch (_) {
    return finish(json({ success: false, error: 'Invalid request body.' }, 400, origin), false, null);
  }

  tool = typeof payload?.tool === 'string' ? payload.tool : null;
  if (!VALID_TOOLS.has(tool)) {
    return finish(json({ success: false, error: 'Invalid tool.' }, 400, origin), false, null);
  }

  if (typeof payload?.input !== 'string') {
    return finish(json({ success: false, error: 'No input provided.' }, 400, origin), false, null);
  }

  const cleanedInput = payload.input.replace(/\0/g, '');
  const trimmedInput = cleanedInput.trim();

  if (!trimmedInput) {
    return finish(json({ success: false, error: 'No input provided.' }, 400, origin), false, null);
  }

  if (trimmedInput.length > 5000) {
    return finish(
      json({ success: false, error: 'Input too long. Max 5000 characters.' }, 413, origin),
      false,
      null
    );
  }

  const safeOptions = normalizeOptions(tool, payload.options);
  const prompt = buildPrompt(tool, trimmedInput, safeOptions);

  const geminiResult = await callGemini(prompt, context.env.GEMINI_API_KEY);

  if (geminiResult.ok) {
    return finish(
      json({ success: true, result: geminiResult.text, model: 'gemini' }, 200, origin),
      true,
      'gemini'
    );
  }

  if (geminiResult.parseError || geminiResult.unexpectedFormat) {
    return finish(
      json({ success: false, error: 'AI returned an unexpected response. Try again.' }, 502, origin),
      false,
      'gemini'
    );
  }

  const shouldFallback =
    geminiResult.networkError || geminiResult.status === 429 || isServerError(geminiResult.status);

  if (!shouldFallback) {
    return finish(
      json({ success: false, error: 'AI service temporarily unavailable. Try again in a moment.' }, 503, origin),
      false,
      'gemini'
    );
  }

  const openRouterResult = await callOpenRouter(prompt, context.env.OPENROUTER_API_KEY);

  if (openRouterResult.ok) {
    return finish(
      json({ success: true, result: openRouterResult.text, model: 'openrouter' }, 200, origin),
      true,
      'openrouter'
    );
  }

  if (openRouterResult.parseError || openRouterResult.unexpectedFormat) {
    return finish(
      json({ success: false, error: 'AI returned an unexpected response. Try again.' }, 502, origin),
      false,
      'openrouter'
    );
  }

  if (openRouterResult.networkError) {
    return finish(
      json({ success: false, error: 'Could not reach AI service. Check your connection.' }, 503, origin),
      false,
      'openrouter'
    );
  }

  if (openRouterResult.status === 429) {
    return finish(
      json({ success: false, error: 'AI service is busy. Please try again shortly.' }, 429, origin),
      false,
      'openrouter'
    );
  }

  return finish(
    json({ success: false, error: 'AI service temporarily unavailable. Try again in a moment.' }, 503, origin),
    false,
    'openrouter'
  );
}
