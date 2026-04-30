const ALLOWED_MODELS = new Set([
  'google/gemma-4-31b-it:free',
  'google/gemma-4-26b-a4b-it:free',
  'google/gemma-4-31b-it',
  'google/gemma-4-26b-a4b-it',
]);

export default {
  async fetch(request, env) {
    const cors = corsHeaders(env, request);

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: cors });
    }

    if (!isOriginAllowed(request, env)) {
      return json({ error: 'origin not allowed' }, 403, cors);
    }

    const url = new URL(request.url);
    if (!url.pathname.startsWith('/v1/')) {
      return json({ error: 'not found' }, 404, cors);
    }

    let body = null;
    if (request.method === 'POST') {
      try {
        body = await request.json();
      } catch {
        return json({ error: 'invalid json' }, 400, cors);
      }
      if (body?.model && !ALLOWED_MODELS.has(body.model)) {
        return json({ error: `model not allowed: ${body.model}` }, 400, cors);
      }
    }

    const upstream = await fetch('https://openrouter.ai/api' + url.pathname, {
      method: request.method,
      headers: {
        'Authorization': `Bearer ${env.OPENROUTER_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': env.SITE_URL ?? '',
        'X-Title': env.SITE_NAME ?? 'gemma-proxy',
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    const headers = new Headers(upstream.headers);
    for (const [k, v] of Object.entries(cors)) headers.set(k, v);
    return new Response(upstream.body, { status: upstream.status, headers });
  },
};

function corsHeaders(env, request) {
  const origin = request.headers.get('Origin') ?? '';
  const allowed = (env.ALLOWED_ORIGINS ?? '').split(',').map((s) => s.trim());
  const allowOrigin = allowed.includes('*') ? '*' : allowed.includes(origin) ? origin : allowed[0] ?? '';
  return {
    'Access-Control-Allow-Origin': allowOrigin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
    'Vary': 'Origin',
  };
}

function isOriginAllowed(request, env) {
  const allowed = (env.ALLOWED_ORIGINS ?? '*').split(',').map((s) => s.trim());
  if (allowed.includes('*')) return true;
  const origin = request.headers.get('Origin');
  return origin ? allowed.includes(origin) : false;
}

function json(data, status, cors) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...cors },
  });
}
