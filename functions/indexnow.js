const DEFAULT_HOST = 'tooliest.com';
const DEFAULT_KEY = 'tooliest-indexnow-20260420';
const DEFAULT_URLS = [
  'https://tooliest.com/',
  'https://tooliest.com/sitemap.xml',
];

async function handleIndexNow(request, env) {
  const key = String(env.INDEXNOW_KEY || DEFAULT_KEY).trim();
  const keyLocation = `https://${DEFAULT_HOST}/indexnow-key.txt`;
  let urlList = DEFAULT_URLS;

  if (request.method === 'POST') {
    try {
      const body = await request.json();
      if (Array.isArray(body?.urls) && body.urls.length) {
        urlList = body.urls.filter((url) => typeof url === 'string' && /^https:\/\/tooliest\.com\//.test(url));
      }
    } catch (_) {
      // Fall back to the default sitemap/home submission set if no JSON body is provided.
    }
  }

  if (!urlList.length) {
    return new Response(JSON.stringify({ error: 'No valid Tooliest URLs supplied.' }), {
      status: 400,
      headers: { 'content-type': 'application/json; charset=utf-8' },
    });
  }

  const response = await fetch('https://api.indexnow.org/IndexNow', {
    method: 'POST',
    headers: { 'content-type': 'application/json; charset=utf-8' },
    body: JSON.stringify({
      host: DEFAULT_HOST,
      key,
      keyLocation,
      urlList,
    }),
  });

  const payload = {
    submitted: urlList.length,
    status: response.status,
    ok: response.ok,
  };

  return new Response(JSON.stringify(payload, null, 2), {
    status: response.ok ? 200 : 502,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
      'x-robots-tag': 'noindex, nofollow',
    },
  });
}

export function onRequestGet(context) {
  return handleIndexNow(context.request, context.env);
}

export function onRequestPost(context) {
  return handleIndexNow(context.request, context.env);
}
