/**
 * Custom-event sink + dashboard for the portfolio.
 *
 * Cloudflare Web Analytics (the beacon in `_app.page.tsx`) handles pageviews
 * and Core Web Vitals, but has no custom-event API. This Worker is that API:
 *
 *   POST /            the client's `trackEvent` posts `{ name, props }`; we
 *                     record one data point per event in a Workers Analytics
 *                     Engine dataset. Fire-and-forget (navigator.sendBeacon).
 *
 *   GET  /dashboard   a small server-rendered dashboard that queries the
 *                     Analytics Engine SQL API and charts the events. Meant to
 *                     sit behind Cloudflare Access — see verifyAccessJwt and
 *                     worker/README.md.
 */

// Mirrors `analyticsEvents` in `src/utils/analytics.ts`. Anything not on this
// list is rejected, so a stray/forged event name can't pollute the dataset.
const ALLOWED_EVENTS = new Set([
  'contact_submit',
  'contact_success',
  'contact_error',
  'resume_download',
  'resume_open',
  'design_system_open',
  'nav_link_click',
  'social_link_click',
  'theme_toggle',
  'profile_contact_click',
  'experience_tab_select',
  'experience_details_click',
  'skills_tool_link_click',
]);

const ALLOWED_ORIGINS = new Set([
  'https://parammehta.com',
  'https://www.parammehta.com',
]);

const MAX_BODY_BYTES = 1024;

const DATASET = 'portfolio_events';

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (request.method === 'GET' && url.pathname === '/dashboard') {
      return handleDashboard(request, env, url);
    }

    return handleEvent(request, env);
  },
};

// ---------------------------------------------------------------------------
// Event ingestion (POST /)
// ---------------------------------------------------------------------------

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

async function handleEvent(request, env) {
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
  // A single free-text field for whichever prop identifies *what* was
  // clicked (nav/social label, experience company, skills tool link, or the
  // resulting theme on a theme_toggle).
  const detailValue = props.label ?? props.company ?? props.tool ?? props.theme;
  const detail = typeof detailValue === 'string' ? detailValue.slice(0, 64) : '';

  // `writeDataPoint` is only bound in deployed/`wrangler dev` runs; guard so
  // a missing binding degrades to a no-op instead of a 500.
  env.ANALYTICS?.writeDataPoint({
    // A single index drives Analytics Engine sampling; bucket by event name.
    indexes: [name],
    // Appended after country rather than inserted, so blob3/blob4 keep
    // meaning the same for rows written before this field existed.
    blobs: [
      name,
      reason,
      (request.headers.get('Referer') || '').slice(0, 256),
      request.cf?.country || '',
      detail,
    ],
    doubles: [1],
  });

  return new Response(null, { status: 204, headers: cors });
}

// ---------------------------------------------------------------------------
// Dashboard (GET /dashboard)
// ---------------------------------------------------------------------------

async function handleDashboard(request, env, url) {
  // Defence in depth: Cloudflare Access enforces auth at the edge, but we also
  // verify its signed JWT here so a misconfigured route can't leak the data.
  const auth = await verifyAccessJwt(request, env, url);
  if (!auth.ok) {
    return htmlResponse(
      errorPage('Not authorised', auth.reason),
      auth.reason === 'access not configured' ? 500 : 403
    );
  }

  if (!env.ACCOUNT_ID || !env.CF_API_TOKEN) {
    return htmlResponse(
      errorPage(
        'Dashboard not configured',
        'Set the ACCOUNT_ID var and the CF_API_TOKEN secret on the Worker (see worker/README.md).'
      ),
      500
    );
  }

  try {
    const [totals, daily, referrers, countries, interactions, activity] = await Promise.all([
      runQuery(
        env,
        `SELECT blob1 AS event, sum(_sample_interval) AS n
         FROM ${DATASET} GROUP BY event ORDER BY n DESC`
      ),
      runQuery(
        env,
        `SELECT toStartOfDay(timestamp) AS day, sum(_sample_interval) AS n
         FROM ${DATASET} WHERE timestamp > now() - INTERVAL '30' DAY
         GROUP BY day ORDER BY day`
      ),
      runQuery(
        env,
        `SELECT blob3 AS referer, sum(_sample_interval) AS n
         FROM ${DATASET} WHERE blob3 != '' GROUP BY referer ORDER BY n DESC LIMIT 10`
      ),
      runQuery(
        env,
        `SELECT blob4 AS country, sum(_sample_interval) AS n
         FROM ${DATASET} WHERE blob4 != '' GROUP BY country ORDER BY n DESC LIMIT 10`
      ),
      runQuery(
        env,
        `SELECT format('{}: {}', blob1, blob5) AS interaction, sum(_sample_interval) AS n
         FROM ${DATASET} WHERE blob5 != '' GROUP BY interaction ORDER BY n DESC LIMIT 15`
      ),
      runQuery(
        env,
        `SELECT toDayOfWeek(timestamp) AS dow, toHour(timestamp) AS hour,
                sum(_sample_interval) AS n
         FROM ${DATASET} GROUP BY dow, hour`
      ),
    ]);

    return htmlResponse(
      dashboardPage({ totals, daily, referrers, countries, interactions, activity, auth })
    );
  } catch (error) {
    return htmlResponse(errorPage('Query failed', String(error.message || error)), 502);
  }
}

async function runQuery(env, sql) {
  const res = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${env.ACCOUNT_ID}/analytics_engine/sql`,
    { method: 'POST', headers: { Authorization: `Bearer ${env.CF_API_TOKEN}` }, body: sql }
  );

  // The SQL API returns { meta, data, rows } as JSON on success, but some
  // failures (e.g. invalid SQL) come back as a plain-text body — read as
  // text first so a bad response can't crash as a raw JSON.parse error.
  const text = await res.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    throw new Error(text || `HTTP ${res.status}`);
  }
  // On success it's the raw { meta, data, rows } shape; on failure it's the
  // standard { success: false, errors } envelope.
  if (!res.ok || json.success === false) {
    throw new Error(JSON.stringify(json.errors ?? json));
  }
  return json.data ?? [];
}

// ---------------------------------------------------------------------------
// Cloudflare Access JWT verification
// ---------------------------------------------------------------------------

/**
 * Verify the `Cf-Access-Jwt-Assertion` header against the team's Access certs.
 * Configured via the ACCESS_TEAM_DOMAIN + ACCESS_AUD vars; if either is unset
 * we skip verification (local `wrangler dev`) but refuse in production so the
 * dashboard is never accidentally public.
 */
async function verifyAccessJwt(request, env, url) {
  const teamDomain = env.ACCESS_TEAM_DOMAIN;
  const aud = env.ACCESS_AUD;
  const isLocal = url.hostname === 'localhost' || url.hostname === '127.0.0.1';

  if (!teamDomain || !aud) {
    if (isLocal) return { ok: true, email: 'local-dev', skipped: true };
    return { ok: false, reason: 'access not configured' };
  }

  const token = request.headers.get('Cf-Access-Jwt-Assertion');
  if (!token) return { ok: false, reason: 'missing Access token' };

  try {
    const [headerB64, payloadB64, sigB64] = token.split('.');
    const header = decodeSegment(headerB64);
    const payload = decodeSegment(payloadB64);

    const certs = await fetch(`https://${teamDomain}/cdn-cgi/access/certs`).then(r =>
      r.json()
    );
    const jwk = certs.keys?.find(k => k.kid === header.kid);
    if (!jwk) return { ok: false, reason: 'unknown signing key' };

    const key = await crypto.subtle.importKey(
      'jwk',
      jwk,
      { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
      false,
      ['verify']
    );
    const valid = await crypto.subtle.verify(
      'RSASSA-PKCS1-v1_5',
      key,
      base64UrlToBytes(sigB64),
      new TextEncoder().encode(`${headerB64}.${payloadB64}`)
    );
    if (!valid) return { ok: false, reason: 'bad signature' };

    const audOk = Array.isArray(payload.aud)
      ? payload.aud.includes(aud)
      : payload.aud === aud;
    if (!audOk) return { ok: false, reason: 'audience mismatch' };
    if (payload.exp && Date.now() / 1000 > payload.exp) {
      return { ok: false, reason: 'token expired' };
    }

    return { ok: true, email: payload.email || 'unknown' };
  } catch {
    return { ok: false, reason: 'verification error' };
  }
}

function base64UrlToBytes(b64url) {
  const b64 = b64url.replace(/-/g, '+').replace(/_/g, '/');
  const bin = atob(b64);
  return Uint8Array.from(bin, c => c.charCodeAt(0));
}

function decodeSegment(b64url) {
  return JSON.parse(new TextDecoder().decode(base64UrlToBytes(b64url)));
}

// ---------------------------------------------------------------------------
// HTML rendering
// ---------------------------------------------------------------------------

function htmlResponse(html, status = 200) {
  return new Response(html, {
    status,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      // Analytics is not something to cache at the edge or in the browser.
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}

function esc(value) {
  return String(value ?? '').replace(
    /[&<>"']/g,
    c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]
  );
}

function num(value) {
  return Number(value || 0).toLocaleString('en-US');
}

function barList(rows, labelKey) {
  if (!rows.length) return '<p class="empty">No data yet.</p>';
  const max = Math.max(...rows.map(r => Number(r.n) || 0), 1);
  return `<ul class="bars">${rows
    .map(r => {
      const pct = ((Number(r.n) || 0) / max) * 100;
      return `<li>
        <span class="label">${esc(r[labelKey] || '—')}</span>
        <span class="track"><span class="fill" style="width:${pct.toFixed(1)}%"></span></span>
        <span class="value">${num(r.n)}</span>
      </li>`;
    })
    .join('')}</ul>`;
}

function sparkline(daily) {
  if (!daily.length) return '<p class="empty">No data yet.</p>';
  const w = 720;
  const h = 160;
  const max = Math.max(...daily.map(d => Number(d.n) || 0), 1);
  const step = daily.length > 1 ? w / (daily.length - 1) : w;
  const yFor = d => h - (Number(d.n) || 0) / max * (h - 20) - 10;
  // A single data point can't form a polyline segment, so plot it as a flat
  // line across the full width instead of a coordinate that renders nothing.
  const coords =
    daily.length > 1
      ? daily.map((d, i) => [i * step, yFor(d)])
      : [[0, yFor(daily[0])], [w, yFor(daily[0])]];
  const points = coords.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' ');
  return `<svg viewBox="0 0 ${w} ${h}" class="spark" preserveAspectRatio="none" role="img" aria-label="Events per day">
    <polyline fill="none" stroke="currentColor" stroke-width="2" points="${points}" />
  </svg>`;
}

function contactFunnel(totals) {
  const byEvent = Object.fromEntries(totals.map(r => [r.event, Number(r.n) || 0]));
  const submitted = byEvent.contact_submit || 0;
  const succeeded = byEvent.contact_success || 0;
  const failed = byEvent.contact_error || 0;
  if (!submitted && !succeeded && !failed) return '<p class="empty">No data yet.</p>';

  const rate = submitted ? `${((succeeded / submitted) * 100).toFixed(0)}%` : '—';
  const rows = [
    { label: 'Submitted', n: submitted },
    { label: 'Succeeded', n: succeeded },
    { label: 'Failed', n: failed },
  ];
  return `${barList(rows, 'label')}<p class="muted" style="margin:10px 0 0;font-size:12px;">Success rate: ${rate}</p>`;
}

const HEAT_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function heatmap(activity) {
  if (!activity.length) return '<p class="empty">No data yet.</p>';

  // toDayOfWeek is 1 (Mon) .. 7 (Sun); toHour is 0..23.
  const grid = Array.from({ length: 7 }, () => Array(24).fill(0));
  let max = 1;
  for (const row of activity) {
    const day = Number(row.dow);
    const hour = Number(row.hour);
    const n = Number(row.n) || 0;
    if (day >= 1 && day <= 7 && hour >= 0 && hour <= 23) {
      grid[day - 1][hour] = n;
      if (n > max) max = n;
    }
  }

  const headerCells = Array.from(
    { length: 24 },
    (_, h) => `<div class="heat-hourlabel">${h % 4 === 0 ? h : ''}</div>`
  ).join('');

  const rows = grid
    .map((hours, d) => {
      const cells = hours
        .map(n => {
          // Mirrors --accent (#f5842a); the CSS var can't be read from here.
          const bg = n > 0 ? `rgba(245,132,42,${(0.15 + 0.85 * (n / max)).toFixed(2)})` : 'var(--line)';
          return `<div class="heat-cell" style="background:${bg}" title="${esc(
            `${n} on ${HEAT_DAYS[d]}`
          )}"></div>`;
        })
        .join('');
      return `<div class="heat-row"><div class="heat-daylabel">${HEAT_DAYS[d]}</div>${cells}</div>`;
    })
    .join('');

  return `<div class="heatmap">
    <div class="heat-row heat-header"><div class="heat-daylabel"></div>${headerCells}</div>
    ${rows}
  </div>`;
}

function dashboardPage({ totals, daily, referrers, countries, interactions, activity, auth }) {
  const grandTotal = totals.reduce((sum, r) => sum + (Number(r.n) || 0), 0);
  return `<!doctype html>
<html lang="en"><head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta name="robots" content="noindex" />
<title>Portfolio analytics</title>
<style>${STYLES}</style>
</head><body>
<main>
  <header>
    <h1>Portfolio events</h1>
    <p class="sub">Analytics Engine · dataset <code>${DATASET}</code>${
      auth?.email ? ` · ${esc(auth.email)}` : ''
    }</p>
  </header>

  <section class="cards">
    <div class="card"><div class="big">${num(grandTotal)}</div><div class="cap">total events</div></div>
    ${totals
      .slice(0, 4)
      .map(
        r =>
          `<div class="card"><div class="big">${num(r.n)}</div><div class="cap">${esc(
            r.event
          )}</div></div>`
      )
      .join('')}
  </section>

  <section class="panel">
    <h2>Events per day <span class="muted">(30d)</span></h2>
    ${sparkline(daily)}
  </section>

  <section class="panel">
    <h2>Activity by day &amp; hour</h2>
    ${heatmap(activity)}
  </section>

  <div class="grid">
    <section class="panel"><h2>By event</h2>${barList(totals, 'event')}</section>
    <section class="panel"><h2>Top referrers</h2>${barList(referrers, 'referer')}</section>
    <section class="panel"><h2>Top countries</h2>${barList(countries, 'country')}</section>
    <section class="panel"><h2>Top interactions</h2>${barList(interactions, 'interaction')}</section>
    <section class="panel"><h2>Contact funnel</h2>${contactFunnel(totals)}</section>
  </div>

  <footer>Rendered ${new Date().toISOString()} · counts are sampling-adjusted</footer>
</main>
</body></html>`;
}

function errorPage(title, detail) {
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${esc(title)}</title><style>${STYLES}</style></head>
<body><main><header><h1>${esc(title)}</h1></header>
<section class="panel"><p>${esc(detail)}</p></section></main></body></html>`;
}

const STYLES = `
:root { color-scheme: light dark; --bg:#fff; --fg:#111; --muted:#666; --line:#e5e5e5; --accent:#f5842a; --card:#f7f7f8; }
@media (prefers-color-scheme: dark) { :root { --bg:#0f0f10; --fg:#f2f2f2; --muted:#9a9a9a; --line:#26262a; --accent:#f5842a; --card:#17171a; } }
* { box-sizing: border-box; }
body { margin:0; background:var(--bg); color:var(--fg); font:15px/1.5 -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif; }
main { max-width:860px; margin:0 auto; padding:32px 20px 64px; }
header h1 { margin:0 0 4px; font-size:24px; }
.sub, .muted { color:var(--muted); }
.sub { margin:0 0 24px; font-size:13px; }
code { font-family:ui-monospace,SFMono-Regular,Menlo,monospace; font-size:.9em; }
.cards { display:grid; grid-template-columns:repeat(auto-fit,minmax(120px,1fr)); gap:12px; margin-bottom:28px; }
.card { background:var(--card); border:1px solid var(--line); border-radius:10px; padding:14px 16px; }
.big { font-size:26px; font-weight:600; }
.cap { color:var(--muted); font-size:12px; margin-top:2px; text-transform:uppercase; letter-spacing:.04em; }
.panel { background:var(--card); border:1px solid var(--line); border-radius:10px; padding:18px 20px; margin-bottom:20px; }
.panel h2 { margin:0 0 14px; font-size:15px; }
.grid { display:grid; grid-template-columns:1fr; gap:20px; }
@media (min-width:680px) { .grid { grid-template-columns:1fr 1fr; } .grid .panel:first-child { grid-column:1/-1; } }
.spark { width:100%; height:160px; color:var(--accent); display:block; }
.bars { list-style:none; margin:0; padding:0; display:flex; flex-direction:column; gap:8px; }
.bars li { display:grid; grid-template-columns:minmax(90px,34%) 1fr auto; align-items:center; gap:10px; font-size:13px; }
.bars .label { overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
.bars .track { background:var(--line); border-radius:5px; height:10px; overflow:hidden; }
.bars .fill { display:block; height:100%; background:var(--accent); border-radius:5px; }
.bars .value { font-variant-numeric:tabular-nums; color:var(--muted); }
.empty { color:var(--muted); margin:0; }
.heatmap { display:flex; flex-direction:column; gap:3px; overflow-x:auto; }
.heat-row { display:grid; grid-template-columns:34px repeat(24,minmax(14px,1fr)); gap:3px; align-items:center; }
.heat-daylabel { font-size:11px; color:var(--muted); }
.heat-hourlabel { font-size:9px; color:var(--muted); text-align:center; }
.heat-cell { aspect-ratio:1; border-radius:3px; }
footer { color:var(--muted); font-size:12px; margin-top:28px; }
`;
