const DEFAULT_ALLOWED_ORIGIN = 'https://tooliest.com';
const DEFAULT_ALLOWED_ORIGINS = new Set([
  DEFAULT_ALLOWED_ORIGIN,
  'https://www.tooliest.com',
]);
const USER_ID_RE = /^[0-9a-f-]{36}$/i;
const RESUME_ID_RE = /^rb_[0-9a-f]{8}$/i;
const KV_TTL_SECONDS = 7776000;
const MAX_RESUMES_PER_USER = 5;
const MAX_STATE_CHARS = 120000;

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
  if (!requestOrigin) return configuredOrigins[0] || DEFAULT_ALLOWED_ORIGIN;
  if (allowedOrigins.has(requestOrigin) || isLocalOrigin(requestOrigin)) return requestOrigin;
  return null;
}

function corsHeaders(origin) {
  const headers = {
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Tooliest-User-ID',
    'Access-Control-Max-Age': '86400',
    'Cache-Control': 'no-store',
    'Content-Type': 'application/json',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    Vary: 'Origin',
  };
  if (origin) headers['Access-Control-Allow-Origin'] = origin;
  return headers;
}

function json(data, status = 200, options = {}) {
  const { origin = DEFAULT_ALLOWED_ORIGIN } = options;
  return new Response(JSON.stringify(data), {
    status,
    headers: corsHeaders(origin),
  });
}

function validateRequest(request, env) {
  const allowedOrigin = getAllowedOrigin(request, env);
  const responseOrigin = allowedOrigin || DEFAULT_ALLOWED_ORIGIN;
  if (!allowedOrigin && getRequestOrigin(request)) {
    return { error: json({ error: 'Origin not allowed.' }, 403, { origin: responseOrigin }) };
  }
  const userId = String(request.headers.get('X-Tooliest-User-ID') || '').trim().toLowerCase();
  if (!userId) {
    return { error: json({ error: 'Missing X-Tooliest-User-ID header.' }, 400, { origin: responseOrigin }) };
  }
  if (!USER_ID_RE.test(userId)) {
    return { error: json({ error: 'Invalid user ID.' }, 400, { origin: responseOrigin }) };
  }
  if (!env.RESUME_STORE) {
    return { error: json({ error: 'Resume storage is not configured.' }, 503, { origin: responseOrigin }) };
  }
  return { userId, responseOrigin };
}

function metaKey(userId) {
  return `user:${userId}:meta`;
}

function resumeKey(userId, resumeId) {
  return `user:${userId}:resume:${resumeId}`;
}

function cleanString(value, maxLength = 120) {
  return String(value || '').trim().slice(0, maxLength);
}

function normalizeMetaEntry(entry) {
  if (!entry || typeof entry !== 'object') return null;
  const id = cleanString(entry.id, 20).toLowerCase();
  if (!RESUME_ID_RE.test(id)) return null;
  return {
    id,
    name: cleanString(entry.name, 80) || 'My Resume',
    targetRole: cleanString(entry.targetRole, 100),
    createdAt: cleanString(entry.createdAt, 40) || new Date().toISOString(),
    updatedAt: cleanString(entry.updatedAt, 40) || new Date().toISOString(),
  };
}

function normalizeMetaList(value) {
  if (!Array.isArray(value)) return [];
  return value.map(normalizeMetaEntry).filter(Boolean).slice(0, MAX_RESUMES_PER_USER);
}

async function readMeta(env, userId) {
  const raw = await env.RESUME_STORE.get(metaKey(userId));
  if (!raw) return [];
  try {
    return normalizeMetaList(JSON.parse(raw));
  } catch (_) {
    return [];
  }
}

async function writeMeta(env, userId, list) {
  await env.RESUME_STORE.put(metaKey(userId), JSON.stringify(normalizeMetaList(list)), {
    expirationTtl: KV_TTL_SECONDS,
  });
}

function getStateTargetRole(state) {
  return cleanString(state?.targetRole, 100);
}

function validateStateForWrite(state) {
  if (!state || typeof state !== 'object' || Array.isArray(state)) {
    return { ok: false, response: { error: 'State must be an object.' }, status: 400 };
  }
  const serialized = JSON.stringify(state);
  if (serialized.length > MAX_STATE_CHARS) {
    return { ok: false, response: { error: 'Resume state is too large.' }, status: 413 };
  }
  return { ok: true, serialized };
}

function randomResumeId() {
  const bytes = new Uint8Array(4);
  if (globalThis.crypto?.getRandomValues) {
    globalThis.crypto.getRandomValues(bytes);
  } else {
    for (let index = 0; index < bytes.length; index += 1) {
      bytes[index] = Math.floor(Math.random() * 256);
    }
  }
  return `rb_${Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('')}`;
}

async function parseBody(request) {
  try {
    return await request.json();
  } catch (_) {
    return null;
  }
}

export async function onRequestOptions({ request, env }) {
  const allowedOrigin = getAllowedOrigin(request, env);
  return new Response(null, {
    status: 204,
    headers: corsHeaders(allowedOrigin || DEFAULT_ALLOWED_ORIGIN),
  });
}

export async function onRequestGet({ request, env }) {
  const validation = validateRequest(request, env);
  if (validation.error) return validation.error;
  const { userId, responseOrigin } = validation;
  try {
    const resumes = await readMeta(env, userId);
    return json({ resumes }, 200, { origin: responseOrigin });
  } catch (error) {
    console.error('[Resumes API] GET list failed:', error?.name || 'Error');
    return json({ error: 'Could not load resumes.' }, 500, { origin: responseOrigin });
  }
}

export async function onRequestPost({ request, env }) {
  const validation = validateRequest(request, env);
  if (validation.error) return validation.error;
  const { userId, responseOrigin } = validation;
  try {
    const body = await parseBody(request);
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      return json({ error: 'Invalid JSON body.' }, 400, { origin: responseOrigin });
    }
    const existing = await readMeta(env, userId);
    if (existing.length >= MAX_RESUMES_PER_USER) {
      return json({
        error: 'Maximum resumes reached',
        message: 'Maximum of 5 resumes reached. Delete one to create a new one.',
      }, 409, { origin: responseOrigin });
    }
    let id = randomResumeId();
    let guard = 0;
    while (existing.some((entry) => entry.id === id) && guard < 8) {
      id = randomResumeId();
      guard += 1;
    }
    const now = new Date().toISOString();
    const state = body.state && typeof body.state === 'object' && !Array.isArray(body.state)
      ? body.state
      : null;
    const validationResult = state ? validateStateForWrite(state) : { ok: true };
    if (!validationResult.ok) {
      return json(validationResult.response, validationResult.status, { origin: responseOrigin });
    }
    const resume = {
      id,
      name: cleanString(body.name, 80) || 'My Resume',
      targetRole: getStateTargetRole(state),
      createdAt: now,
      updatedAt: now,
    };
    if (state) {
      await env.RESUME_STORE.put(resumeKey(userId, id), validationResult.serialized, {
        expirationTtl: KV_TTL_SECONDS,
      });
    }
    await writeMeta(env, userId, [...existing, resume]);
    return json({ resume }, 201, { origin: responseOrigin });
  } catch (error) {
    console.error('[Resumes API] POST create failed:', error?.name || 'Error');
    return json({ error: 'Could not create resume.' }, 500, { origin: responseOrigin });
  }
}
