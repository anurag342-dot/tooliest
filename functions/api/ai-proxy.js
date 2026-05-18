const DEFAULT_ALLOWED_ORIGIN = 'https://tooliest.com';
const DEFAULT_ALLOWED_ORIGINS = new Set([
  DEFAULT_ALLOWED_ORIGIN,
  'https://www.tooliest.com',
]);
const MAX_MESSAGES = 8;
const MAX_MESSAGE_CHARS = 20000;
const MAX_TOKENS_DEFAULT = 2048;
const MAX_TOKENS_LIMIT = 4096;
const DEFAULT_TEMPERATURE = 0.7;
const PER_TOOL_DAILY_LIMIT = 15;
const RATE_LIMIT_TTL_SECONDS = 86400;

const CHAINS = {
  'resume-builder': ['openai/gpt-oss-120b:free', 'nvidia/nemotron-3-super-120b-a12b:free', 'meta-llama/llama-3.3-70b-instruct:free'],
  'summarizer': ['openai/gpt-oss-120b:free', 'nvidia/nemotron-3-super-120b-a12b:free', 'google/gemma-3-12b-it:free'],
  'paraphraser': ['openai/gpt-oss-120b:free', 'meta-llama/llama-3.3-70b-instruct:free', 'google/gemma-4-26b-a4b-it:free'],
  'email': ['openai/gpt-oss-120b:free', 'google/gemma-4-31b-it:free', 'meta-llama/llama-3.3-70b-instruct:free'],
  'blog': ['nousresearch/hermes-3-llama-3.1-405b:free', 'openai/gpt-oss-120b:free', 'minimax/minimax-m2.5:free'],
  'metadesc': ['google/gemma-4-26b-a4b-it:free', 'meta-llama/llama-3.3-70b-instruct:free', 'openai/gpt-oss-20b:free'],
  'grammar-checker': ['liquid/lfm-2.5-1.2b-thinking:free', 'nvidia/nemotron-nano-9b-v2:free', 'google/gemma-3-12b-it:free'],
  'cover-letter': ['openai/gpt-oss-120b:free', 'google/gemma-4-31b-it:free', 'meta-llama/llama-3.3-70b-instruct:free'],
  'ocr-tool': ['baidu/qianfan-ocr-fast:free', 'nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free', 'google/gemma-4-26b-a4b-it:free'],
  'code-explainer': ['qwen/qwen3-coder:free', 'poolside/laguna-m.1:free', 'openai/gpt-oss-120b:free'],
  'sql-generator': ['qwen/qwen3-coder:free', 'poolside/laguna-xs.2:free', 'openai/gpt-oss-20b:free'],
  'youtube-script': ['nousresearch/hermes-3-llama-3.1-405b:free', 'openai/gpt-oss-120b:free', 'minimax/minimax-m2.5:free'],
  'hashtag-generator': ['meta-llama/llama-3.3-70b-instruct:free', 'google/gemma-4-26b-a4b-it:free', 'nvidia/nemotron-nano-9b-v2:free'],
  'flashcard-generator': ['qwen/qwen3-next-80b-a3b-instruct:free', 'nvidia/nemotron-3-super-120b-a12b:free', 'openai/gpt-oss-120b:free'],
  'bio-generator': ['openai/gpt-oss-120b:free', 'minimax/minimax-m2.5:free', 'meta-llama/llama-3.3-70b-instruct:free'],
};

function isLocalOrigin(origin) {
  return /^https?:\/\/(?:localhost|127\.0\.0\.1)(?::\d+)?$/i.test(origin);
}

function getRequestOrigin(request) {
  return String(request.headers.get('Origin') || '').trim();
}

function getConfiguredAllowedOrigins(env) {
  return String(env.ALLOWED_ORIGIN || '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
}

function getAllowedOrigin(request, env) {
  const requestOrigin = getRequestOrigin(request);
  const configuredOrigins = getConfiguredAllowedOrigins(env);
  const allowedOrigins = new Set([
    ...DEFAULT_ALLOWED_ORIGINS,
    ...configuredOrigins,
  ]);
  if (!requestOrigin) {
    return configuredOrigins[0] || DEFAULT_ALLOWED_ORIGIN;
  }
  if (allowedOrigins.has(requestOrigin) || isLocalOrigin(requestOrigin)) {
    return requestOrigin;
  }
  return null;
}

function corsHeaders(origin) {
  const headers = {
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Accept, X-Tooliest-User-ID, X-Tooliest-FP',
    'Access-Control-Max-Age': '86400',
    'Cache-Control': 'no-store',
    'Content-Type': 'application/json',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    Vary: 'Origin',
  };
  if (origin) {
    headers['Access-Control-Allow-Origin'] = origin;
  }
  return headers;
}

function json(data, status = 200, options = {}) {
  const { origin = DEFAULT_ALLOWED_ORIGIN, headers: extraHeaders = {} } = options;
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      ...corsHeaders(origin),
      ...extraHeaders,
    },
  });
}

function getClientIP(request) {
  return (
    request.headers.get('CF-Connecting-IP')
    || request.headers.get('X-Forwarded-For')?.split(',')[0]?.trim()
    || 'unknown'
  );
}

function getQuotaDateKey(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

function getQuotaResetAt(date = new Date()) {
  const resetAt = new Date(date);
  resetAt.setUTCHours(24, 0, 0, 0);
  return resetAt;
}

function getQuotaKey(ip, tool, date = new Date()) {
  return `rl:${ip}:${tool}:${getQuotaDateKey(date)}`;
}

function getUserQuotaKey(userId, date = new Date()) {
  return `rl_uid:${userId}:${getQuotaDateKey(date)}`;
}

function getFingerprintQuotaKey(fingerprint, date = new Date()) {
  return `rl_fp:${fingerprint}:${getQuotaDateKey(date)}`;
}

function encodeQuotaPart(value) {
  return encodeURIComponent(String(value || 'unknown'));
}

function getIPUsagePrefix(ip, tool, date = new Date()) {
  return `rl_evt:ip:${encodeQuotaPart(ip)}:${encodeQuotaPart(tool)}:${getQuotaDateKey(date)}:`;
}

function getUserUsagePrefix(userId, date = new Date()) {
  return `rl_evt:uid:${userId}:${getQuotaDateKey(date)}:`;
}

function getFingerprintUsagePrefix(fingerprint, date = new Date()) {
  return `rl_evt:fp:${fingerprint}:${getQuotaDateKey(date)}:`;
}

function parseRateLimitCount(data) {
  if (!data) return 0;
  const parsed = parseInt(data, 10);
  return Number.isFinite(parsed) ? Math.max(0, parsed) : 0;
}

function getRateLimitIdentity(request) {
  const rawUserId = String(request.headers.get('X-Tooliest-User-ID') || '').trim().toLowerCase();
  const rawFingerprint = String(request.headers.get('X-Tooliest-FP') || '').trim().toLowerCase();
  return {
    userId: /^[0-9a-f-]{36}$/i.test(rawUserId) ? rawUserId : '',
    fingerprint: /^[0-9a-f]{8}$/i.test(rawFingerprint) ? rawFingerprint : '',
  };
}

function getRateLimitEntries(ip, tool, identity = {}, date = new Date()) {
  const entries = [{
    signal: 'ip',
    key: getQuotaKey(ip, tool, date),
    usagePrefix: getIPUsagePrefix(ip, tool, date),
  }];
  if (identity.userId) {
    entries.push({
      signal: 'uid',
      key: getUserQuotaKey(identity.userId, date),
      usagePrefix: getUserUsagePrefix(identity.userId, date),
    });
  }
  if (identity.fingerprint) {
    entries.push({
      signal: 'fp',
      key: getFingerprintQuotaKey(identity.fingerprint, date),
      usagePrefix: getFingerprintUsagePrefix(identity.fingerprint, date),
    });
  }
  return entries;
}

async function countUsageRecords(env, prefix) {
  let count = 0;
  let cursor;
  do {
    const options = { prefix, limit: PER_TOOL_DAILY_LIMIT + 1 };
    if (cursor) options.cursor = cursor;
    const page = await env.TOOLIEST_KV.list(options);
    count += Array.isArray(page?.keys) ? page.keys.length : 0;
    if (count >= PER_TOOL_DAILY_LIMIT) return count;
    cursor = page?.cursor;
    if (page?.list_complete !== false) break;
  } while (cursor);
  return count;
}

function createUsageRecordId() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
}

async function readRateLimitStatus(env, ip, tool, identity = {}) {
  const now = new Date();
  const resetAt = getQuotaResetAt(now);
  const entries = getRateLimitEntries(ip, tool, identity, now);
  try {
    const counters = await Promise.all(entries.map(async (entry) => {
      const [counterValue, usageCount] = await Promise.all([
        env.TOOLIEST_KV.get(entry.key),
        countUsageRecords(env, entry.usagePrefix),
      ]);
      return {
        ...entry,
        count: Math.max(parseRateLimitCount(counterValue), usageCount),
      };
    }));
    const maxCount = counters.reduce((max, entry) => Math.max(max, entry.count), 0);
    const blocked = counters.some((entry) => entry.count >= PER_TOOL_DAILY_LIMIT);
    return {
      blocked,
      counters,
      maxCount,
      quotaAvailable: true,
      remaining: Math.max(0, PER_TOOL_DAILY_LIMIT - maxCount),
      resetAt,
    };
  } catch (error) {
    console.error('KV rate limit read error:', error?.message || 'Unknown error');
    return {
      blocked: false,
      counters: entries.map((entry) => ({ ...entry, count: 0 })),
      maxCount: 0,
      quotaAvailable: false,
      remaining: -1,
      resetAt,
    };
  }
}

async function reserveRateLimitUsage(env, quota) {
  if (!quota?.quotaAvailable) {
    return { keys: [], remaining: -1, resetAt: quota?.resetAt || getQuotaResetAt() };
  }
  const usageRecordId = createUsageRecordId();
  const keys = quota.counters.map((entry) => `${entry.usagePrefix}${usageRecordId}`);
  try {
    await Promise.all(keys.map((key) => (
      env.TOOLIEST_KV.put(key, '1', {
        expirationTtl: RATE_LIMIT_TTL_SECONDS,
      })
    )));
    const nextMax = quota.counters.reduce((max, entry) => Math.max(max, entry.count + 1), 0);
    return {
      keys,
      remaining: Math.max(0, PER_TOOL_DAILY_LIMIT - nextMax),
      resetAt: quota.resetAt,
    };
  } catch (error) {
    console.error('KV rate limit reservation error:', error?.message || 'Unknown error');
    return {
      keys: [],
      remaining: -1,
      resetAt: quota.resetAt || getQuotaResetAt(),
    };
  }
}

async function releaseRateLimitUsage(env, reservation) {
  if (!reservation?.keys?.length) return;
  try {
    await Promise.all(reservation.keys.map((key) => env.TOOLIEST_KV.delete(key)));
  } catch (error) {
    console.error('KV rate limit release error:', error?.message || 'Unknown error');
  }
}

function rateLimitExceededResponse(origin, resetAt = getQuotaResetAt()) {
  return json({
    error: 'Daily AI limit reached. Try again tomorrow.',
    message: 'Daily AI limit reached. Try again tomorrow.',
    remaining: 0,
    reset_at: resetAt.toISOString(),
  }, 429, {
    origin,
    headers: {
      'X-RateLimit-Remaining': '0',
      'X-RateLimit-Reset': resetAt.toISOString(),
      ...buildRateLimitHeaders(0, resetAt),
    },
  });
}

function sanitizeMessages(messages) {
  if (!Array.isArray(messages) || !messages.length || messages.length > MAX_MESSAGES) {
    return null;
  }

  const safeMessages = [];
  let totalChars = 0;

  for (const message of messages) {
    if (!message || typeof message !== 'object') return null;
    const role = String(message.role || '').trim();
    const content = typeof message.content === 'string' ? message.content.trim() : '';
    if (!['system', 'user', 'assistant'].includes(role) || !content) {
      return null;
    }
    totalChars += content.length;
    if (totalChars > MAX_MESSAGE_CHARS) {
      return null;
    }
    safeMessages.push({ role, content });
  }

  return safeMessages;
}

function clampMaxTokens(value) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return MAX_TOKENS_DEFAULT;
  return Math.min(MAX_TOKENS_LIMIT, Math.max(128, Math.round(parsed)));
}

function clampTemperature(value) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return DEFAULT_TEMPERATURE;
  return Math.min(1.2, Math.max(0, parsed));
}

function buildRateLimitHeaders(remaining, resetAt = getQuotaResetAt()) {
  if (!Number.isFinite(remaining) || remaining < 0) {
    return {};
  }
  return {
    'X-RateLimit-Limit': String(PER_TOOL_DAILY_LIMIT),
    'X-RateLimit-Remaining': String(Math.max(0, remaining)),
    'X-RateLimit-Reset': resetAt.toISOString(),
  };
}

async function tryModel(model, messages, maxTokens, temperature, apiKey) {
  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': DEFAULT_ALLOWED_ORIGIN,
      'X-Title': 'Tooliest',
    },
    body: JSON.stringify({
      model,
      messages,
      max_tokens: maxTokens,
      temperature,
    }),
  });

  if (!response.ok) {
    const error = new Error(`HTTP ${response.status}`);
    error.code = response.status;
    throw error;
  }

  const data = await response.json();
  const content = data?.choices?.[0]?.message?.content;
  const hasText = typeof content === 'string'
    ? content.trim().length > 0
    : Array.isArray(content) && content.some((item) => item && item.type === 'text' && typeof item.text === 'string' && item.text.trim());

  if (!hasText) {
    const error = new Error('Empty response');
    error.code = 502;
    error.retryable = true;
    throw error;
  }

  return { ...data, model_used: model };
}

export async function onRequestOptions(context) {
  const allowedOrigin = getAllowedOrigin(context.request, context.env);
  if (!allowedOrigin && getRequestOrigin(context.request)) {
    return new Response(null, {
      status: 403,
      headers: corsHeaders(DEFAULT_ALLOWED_ORIGIN),
    });
  }
  return new Response(null, {
    status: 204,
    headers: corsHeaders(allowedOrigin || DEFAULT_ALLOWED_ORIGIN),
  });
}

export async function onRequestGet({ request, env }) {
  const allowedOrigin = getAllowedOrigin(request, env);
  const responseOrigin = allowedOrigin || DEFAULT_ALLOWED_ORIGIN;
  if (!allowedOrigin && getRequestOrigin(request)) {
    return json({ error: 'Origin not allowed.' }, 403, { origin: DEFAULT_ALLOWED_ORIGIN });
  }

  const url = new URL(request.url);
  const tool = String(url.searchParams.get('tool') || '').trim();
  if (!tool || !CHAINS[tool]) {
    return json({ error: `Unknown tool: ${tool || 'unknown'}` }, 400, { origin: responseOrigin });
  }

  const ip = getClientIP(request);
  const identity = getRateLimitIdentity(request);
  const quota = await readRateLimitStatus(env, ip, tool, identity);
  if (!quota.quotaAvailable || !Number.isFinite(quota.remaining) || quota.remaining < 0) {
    return json({
      error: 'Quota unavailable',
      message: 'AI quota status could not be synced right now.',
      reset_at: quota.resetAt.toISOString(),
    }, 503, { origin: responseOrigin });
  }
  const remaining = Number.isFinite(quota.remaining)
    ? Math.max(0, quota.remaining)
    : PER_TOOL_DAILY_LIMIT;
  return json({
    tool,
    limit: PER_TOOL_DAILY_LIMIT,
    remaining,
    reset_at: quota.resetAt.toISOString(),
  }, 200, {
    origin: responseOrigin,
    headers: buildRateLimitHeaders(remaining, quota.resetAt),
  });
}

export async function onRequestPost({ request, env }) {
  const allowedOrigin = getAllowedOrigin(request, env);
  const responseOrigin = allowedOrigin || DEFAULT_ALLOWED_ORIGIN;
  if (!allowedOrigin && getRequestOrigin(request)) {
    return json({ error: 'Origin not allowed.' }, 403, { origin: DEFAULT_ALLOWED_ORIGIN });
  }

  let body;
  try {
    body = await request.json();
  } catch (_) {
    return json({ error: 'Invalid JSON.' }, 400, { origin: responseOrigin });
  }

  const tool = typeof body?.tool === 'string' ? body.tool.trim() : '';
  const messages = sanitizeMessages(body?.messages);
  const chain = CHAINS[tool];

  if (!tool || !chain) {
    return json({ error: `Unknown tool: ${tool || 'unknown'}` }, 400, { origin: responseOrigin });
  }
  if (!messages) {
    return json({ error: 'Required: messages (1-8 non-empty chat messages).' }, 400, { origin: responseOrigin });
  }

  const ip = getClientIP(request);
  const identity = getRateLimitIdentity(request);
  const quota = await readRateLimitStatus(env, ip, tool, identity);
  const rateLimitHeaders = buildRateLimitHeaders(quota.remaining, quota.resetAt);

  if (quota.quotaAvailable && quota.blocked) {
    return rateLimitExceededResponse(responseOrigin, quota.resetAt);
  }

  const apiKey = env.OPENROUTER_API_KEY;
  if (!apiKey) {
    return json({ error: 'Service unavailable - configuration error.' }, 503, {
      origin: responseOrigin,
      headers: rateLimitHeaders,
    });
  }

  const maxTokens = clampMaxTokens(body?.max_tokens);
  const temperature = clampTemperature(body?.temperature);
  const requestedSkipModels = Array.isArray(body?.skip_models)
    ? body.skip_models.filter((model) => typeof model === 'string')
    : [];
  const modelsToTry = chain.filter((model) => !requestedSkipModels.includes(model));

  if (!modelsToTry.length) {
    return json({ error: 'No eligible models remain for this request.' }, 503, {
      origin: responseOrigin,
      headers: rateLimitHeaders,
    });
  }

  const reservation = await reserveRateLimitUsage(env, quota);
  const reservedRateLimitHeaders = buildRateLimitHeaders(reservation.remaining, reservation.resetAt);

  for (const model of modelsToTry) {
    try {
      const result = await tryModel(model, messages, maxTokens, temperature, apiKey);
      return json(result, 200, {
        origin: responseOrigin,
        headers: reservedRateLimitHeaders,
      });
    } catch (error) {
      const retryable = error?.retryable || error?.code === 429 || (Number.isInteger(error?.code) && error.code >= 500);
      if (!retryable) {
        break;
      }
    }
  }

  await releaseRateLimitUsage(env, reservation);
  return json({ error: 'All models are busy. Please wait 60 seconds and retry.' }, 503, {
    origin: responseOrigin,
    headers: rateLimitHeaders,
  });
}
