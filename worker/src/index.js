/**
 * Custom-event sink for the portfolio.
 *
 * Cloudflare Web Analytics (the beacon in `_app.page.tsx`) handles pageviews
 * and Core Web Vitals, but has no custom-event API. This Worker is that API:
 * the client's `trackEvent` posts `{ name, props }` here, and we record one
 * data point per event in a Workers Analytics Engine dataset. Query it with
 * the GraphQL/SQL Analytics Engine API (or a Grafana panel).
 *
 * Fire-and-forget by design — the client uses `navigator.sendBeacon`, so this
 * always returns quickly and never blocks a navigation.
 */

// Mirrors `analyticsEvents` in `src/utils/analytics.ts`. Anything not on this
// list is rejected, so a stray/forged event name can't pollute the dataset.
const ALLOWED_EVENTS = new Set([
  'contact_submit',
  'contact_success',
  'contact_error',
  'resume_download',
  'resume_open',
]);

const ALLOWED_ORIGINS = new Set([
  'https://parammehta.com',
  'https://www.parammehta.com',
]);

const MAX_BODY_BYTES = 1024;

function corsHeaders(origin) {
  const headers = {
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
  };
  if (origin && ALLOWED_ORIGINS.has(origin)) {
    headers['Access-Control-Allow-Origin'] = origin;
  }
  return headers;
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin');
    const cors = corsHeaders(origin);

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: cors });
    }

    if (request.method !== 'POST') {
      return new Response('Method Not Allowed', { status: 405, headers: cors });
    }

    // Only our own origins may write to the dataset. `sendBeacon` bypasses the
    // CORS *response* check, so this server-side check is the real gate.
    if (!origin || !ALLOWED_ORIGINS.has(origin)) {
      return new Response('Forbidden', { status: 403 });
    }

    const raw = await request.text();
    if (raw.length > MAX_BODY_BYTES) {
      return new Response('Payload Too Large', { status: 413, headers: cors });
    }

    let payload;
    try {
      payload = JSON.parse(raw);
    } catch {
      return new Response('Bad Request', { status: 400, headers: cors });
    }

    const name = typeof payload?.name === 'string' ? payload.name : '';
    if (!ALLOWED_EVENTS.has(name)) {
      return new Response('Unknown event', { status: 422, headers: cors });
    }

    const props =
      payload.props && typeof payload.props === 'object' ? payload.props : {};
    const reason =
      typeof props.reason === 'string' ? props.reason.slice(0, 64) : '';

    // `writeDataPoint` is only bound in deployed/`wrangler dev` runs; guard so
    // a missing binding degrades to a no-op instead of a 500.
    env.ANALYTICS?.writeDataPoint({
      // A single index drives Analytics Engine sampling; bucket by event name.
      indexes: [name],
      blobs: [
        name,
        reason,
        (request.headers.get('Referer') || '').slice(0, 256),
        request.cf?.country || '',
      ],
      doubles: [1],
    });

    return new Response(null, { status: 204, headers: cors });
  },
};
