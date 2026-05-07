// NOTE: localStorage here is UI-only (quota bar display).
// Real enforcement is server-side via Cloudflare KV in ai-proxy.js.
// A user clearing localStorage can still see wrong counts in the bar
// but the server will correctly block them at 15 requests.

const MAX_PER_DAY = 15;

function storageKey(tool) {
  return `tlst_rl_${tool}`;
}

function todayStr() {
  return new Date().toDateString();
}

function readQuotaState(tool) {
  try {
    const raw = localStorage.getItem(storageKey(tool));
    if (!raw) {
      return { date: todayStr(), count: 0 };
    }
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || parsed.date !== todayStr()) {
      return { date: todayStr(), count: 0 };
    }
    return {
      date: todayStr(),
      count: Number.isFinite(parsed.count) ? Math.max(0, Number(parsed.count)) : 0,
    };
  } catch (_) {
    return { date: todayStr(), count: 0 };
  }
}

function writeQuotaState(tool, count) {
  try {
    localStorage.setItem(storageKey(tool), JSON.stringify({
      date: todayStr(),
      count: Math.max(0, Number(count) || 0),
    }));
  } catch (_) {
    // Storage failures should not break the tool.
  }
}

function syncQuotaFromRemaining(tool, remaining) {
  if (!Number.isFinite(remaining)) return false;
  const normalizedRemaining = Math.max(0, Math.min(MAX_PER_DAY, Math.round(remaining)));
  writeQuotaState(tool, MAX_PER_DAY - normalizedRemaining);
  return true;
}

function extractContentText(content) {
  if (typeof content === 'string') {
    return content.trim();
  }
  if (Array.isArray(content)) {
    return content
      .filter((item) => item && typeof item === 'object' && item.type === 'text' && typeof item.text === 'string')
      .map((item) => item.text)
      .join('')
      .trim();
  }
  return '';
}

export function getRemaining(tool) {
  const state = readQuotaState(tool);
  return Math.max(0, MAX_PER_DAY - state.count);
}

export function consume(tool) {
  const state = readQuotaState(tool);
  writeQuotaState(tool, Math.min(MAX_PER_DAY, state.count + 1));
  return true;
}

export function renderQuota(tool, el) {
  if (!el) return;

  const remaining = getRemaining(tool);
  const pct = (remaining / MAX_PER_DAY) * 100;
  const color = pct > 50 ? '#22c55e' : pct > 20 ? '#f59e0b' : '#ef4444';

  el.textContent = '';

  const wrapper = document.createElement('div');
  wrapper.className = 'quota-bar';

  const label = document.createElement('span');
  label.className = 'quota-label';
  label.textContent = `${remaining} / ${MAX_PER_DAY} free uses today`;

  const track = document.createElement('div');
  track.className = 'quota-track';

  const fill = document.createElement('div');
  fill.className = 'quota-fill';
  fill.style.width = `${pct}%`;
  fill.style.background = color;

  track.appendChild(fill);
  wrapper.append(label, track);
  el.appendChild(wrapper);
}

export function getQuotaButtonLabel(baseLabel, tool) {
  return `${baseLabel} (${getRemaining(tool)} left today)`;
}

export async function callAI({
  tool,
  systemPrompt,
  userContent,
  maxTokens = 2048,
  temperature = 0.7,
  chargeQuota = true,
  skipModels = [],
}) {
  const requestBody = {
    tool,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userContent },
    ],
    max_tokens: maxTokens,
    temperature,
    skip_models: Array.isArray(skipModels) ? skipModels : [],
  };

  const response = await fetch('/api/ai-proxy', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(requestBody),
  });

  let data = null;
  try {
    data = await response.json();
  } catch (_) {
    if (!response.ok) {
      throw new Error('Request failed. Please retry.');
    }
    throw new Error('The AI returned an unreadable response. Please retry.');
  }

  if (chargeQuota) {
    const remainingHeader = Number(response.headers.get('X-RateLimit-Remaining'));
    const synced = syncQuotaFromRemaining(tool, remainingHeader);
    if (!synced && response.ok) {
      consume(tool);
    }
    if (!synced && response.status === 429) {
      syncQuotaFromRemaining(tool, 0);
    }
  }

  if (response.status === 429) {
    throw new Error(data?.message || 'Daily limit reached — 15 uses per tool per day. Resets at midnight. ⚡');
  }

  if (!response.ok) {
    throw new Error(data?.error || 'Request failed. Please retry.');
  }

  const text = extractContentText(data?.choices?.[0]?.message?.content);
  if (!text) {
    throw new Error('The AI returned an empty response. Please retry.');
  }

  return {
    text,
    model: typeof data?.model_used === 'string' ? data.model_used : '',
  };
}

export { MAX_PER_DAY };
