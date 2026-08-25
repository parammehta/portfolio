/**
 * Custom-event sink + dashboard for the portfolio.
 *
 * Cloudflare Web Analytics (the beacon in `_app.page.tsx`) handles pageviews
 * and Core Web Vitals, but has no custom-event API. This Worker is that API:
 *
 *   POST /                the client's `trackEvent` posts `{ name, props }`; we
 *                         record one data point per event in a Workers
 *                         Analytics Engine dataset. Fire-and-forget
 *                         (navigator.sendBeacon).
 *
 *   GET  /dashboard       the dashboard shell, with the first payload inlined.
 *   GET  /dashboard/data  the same payload as JSON, for the client's range and
 *                         filter changes.
 *
 * Both dashboard routes sit behind Cloudflare Access — see access.js and
 * worker/README.md.
 */
import { handleEvent, corsHeaders } from './ingest.js';
import { verifyAccessJwt } from './access.js';
import {
  DEFAULT_RANGE,
  RANGES,
  dashboardQueries,
  normaliseEvent,
  normaliseRange,
  runDashboardQueries,
} from './queries.js';
import { dashboardPage, errorPage } from './render/shell.js';

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (request.method === 'GET' && url.pathname === '/dashboard') {
      return handleDashboard(request, env, url);
    }

    if (request.method === 'GET' && url.pathname === '/dashboard/data') {
      return handleDashboardData(request, env, url);
    }

    // Ingest is the catch-all only for the root path. It used to match every
    // path, which meant a stray POST to /dashboard silently wrote a data point.
    if (url.pathname === '/') {
      return handleEvent(request, env);
    }

    return new Response('Not Found', {
      status: 404,
      headers: corsHeaders(request.headers.get('Origin')),
    });
  },
};

// ---------------------------------------------------------------------------
// Dashboard
// ---------------------------------------------------------------------------

/**
 * Both dashboard routes share one gate: Access first (defence in depth — the
 * edge already enforces it, but a misconfigured route must not leak data),
 * then the API credentials the read path needs.
 */
async function gate(request, env, url) {
  const auth = await verifyAccessJwt(request, env, url);
  if (!auth.ok) {
    return {
      auth,
      failure: {
        title: 'Not authorised',
        detail: auth.reason,
        status: auth.reason === 'access not configured' ? 500 : 403,
      },
    };
  }

  if (!env.ACCOUNT_ID || !env.CF_API_TOKEN) {
    return {
      auth,
      failure: {
        title: 'Dashboard not configured',
        detail:
          'Set the ACCOUNT_ID var and the CF_API_TOKEN secret on the Worker (see worker/README.md).',
        status: 500,
      },
    };
  }

  return { auth };
}

/** Everything the client needs for one (range, event) view. */
async function buildPayload(env, url) {
  const range = normaliseRange(url.searchParams.get('range') || DEFAULT_RANGE);
  const event = normaliseEvent(url.searchParams.get('event') || '');
  const { bucket, hours, label } = RANGES[range];

  const { data, errors } = await runDashboardQueries(env, dashboardQueries(range, event));

  return {
    range,
    event,
    meta: { bucket, hours, label },
    generatedAt: new Date().toISOString(),
    data,
    errors,
  };
}

async function handleDashboard(request, env, url) {
  const { auth, failure } = await gate(request, env, url);
  if (failure) {
    return htmlResponse(errorPage(failure.title, failure.detail), failure.status);
  }

  const payload = await buildPayload(env, url);
  return htmlResponse(dashboardPage(payload, auth));
}

async function handleDashboardData(request, env, url) {
  const { failure } = await gate(request, env, url);
  if (failure) {
    return jsonResponse({ error: failure.title, detail: failure.detail }, failure.status);
  }

  return jsonResponse(await buildPayload(env, url));
}

// ---------------------------------------------------------------------------
// Responses
// ---------------------------------------------------------------------------

// Analytics is not something to cache at the edge or in the browser.
const NO_STORE = {
  'Cache-Control': 'no-store',
  'X-Content-Type-Options': 'nosniff',
};

function htmlResponse(html, status = 200) {
  return new Response(html, {
    status,
    headers: { 'Content-Type': 'text/html; charset=utf-8', ...NO_STORE },
  });
}

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', ...NO_STORE },
  });
}
