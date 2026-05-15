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
    'Access-Control-Allow-Methods': 'GET, PUT, DELETE, OPTIONS',
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

function getResumeId(request, params = {}) {
  const id = String(params.id || '').trim().toLowerCase();
  if (id) return id;
  const pathname = new URL(request.url).pathname;
  return String(pathname.split('/').filter(Boolean).pop() || '').trim().toLowerCase();
}

function validateRequest(request, env, params) {
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
  const resumeId = getResumeId(request, params);
  if (!RESUME_ID_RE.test(resumeId)) {
    return { error: json({ error: 'Invalid resume ID.' }, 400, { origin: responseOrigin }) };
  }
  if (!env.RESUME_STORE) {
    return { error: json({ error: 'Resume storage is not configured.' }, 503, { origin: responseOrigin }) };
  }
  return { userId, resumeId, responseOrigin };
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

export async function onRequestGet({ request, env, params }) {
  const validation = validateRequest(request, env, params);
  if (validation.error) return validation.error;
  const { userId, resumeId, responseOrigin } = validation;
  try {
    const raw = await env.RESUME_STORE.get(resumeKey(userId, resumeId));
    if (!raw) return json({ error: 'Resume not found' }, 404, { origin: responseOrigin });
    return json({ state: JSON.parse(raw) }, 200, { origin: responseOrigin });
  } catch (error) {
    console.error('[Resumes API] GET single failed:', error?.name || 'Error');
    return json({ error: 'Could not load resume.' }, 500, { origin: responseOrigin });
  }
}

export async function onRequestPut({ request, env, params }) {
  const validation = validateRequest(request, env, params);
  if (validation.error) return validation.error;
  const { userId, resumeId, responseOrigin } = validation;
  try {
    const body = await parseBody(request);
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      return json({ error: 'Invalid JSON body.' }, 400, { origin: responseOrigin });
    }
    const stateValidation = validateStateForWrite(body.state);
    if (!stateValidation.ok) {
      return json(stateValidation.response, stateValidation.status, { origin: responseOrigin });
    }
    const list = await readMeta(env, userId);
    const index = list.findIndex((entry) => entry.id === resumeId);
    if (index === -1) {
      return json({ error: 'Resume not found' }, 404, { origin: responseOrigin });
    }
    await env.RESUME_STORE.put(resumeKey(userId, resumeId), stateValidation.serialized, {
      expirationTtl: KV_TTL_SECONDS,
    });
    const updated = {
      ...list[index],
      updatedAt: new Date().toISOString(),
      targetRole: cleanString(body.state?.targetRole, 100),
    };
    if (typeof body.name === 'string') {
      updated.name = cleanString(body.name, 80) || updated.name;
    }
    list[index] = updated;
    await writeMeta(env, userId, list);
    return json({ ok: true }, 200, { origin: responseOrigin });
  } catch (error) {
    console.error('[Resumes API] PUT failed:', error?.name || 'Error');
    return json({ error: 'Could not update resume.' }, 500, { origin: responseOrigin });
  }
}

export async function onRequestDelete({ request, env, params }) {
  const validation = validateRequest(request, env, params);
  if (validation.error) return validation.error;
  const { userId, resumeId, responseOrigin } = validation;
  try {
    const list = await readMeta(env, userId);
    const nextList = list.filter((entry) => entry.id !== resumeId);
    if (nextList.length === list.length) {
      return json({ error: 'Resume not found' }, 404, { origin: responseOrigin });
    }
    await writeMeta(env, userId, nextList);
    await env.RESUME_STORE.delete(resumeKey(userId, resumeId));
    return json({ ok: true }, 200, { origin: responseOrigin });
  } catch (error) {
    console.error('[Resumes API] DELETE failed:', error?.name || 'Error');
    return json({ error: 'Could not delete resume.' }, 500, { origin: responseOrigin });
  }
}
