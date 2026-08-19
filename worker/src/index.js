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

// Namespaces the visitor hash — see visitorId(). Not a secret (it only has to
// stop the hash being a plain rainbow-table lookup of an IP+UA pair), but
// changing it resets every visitor to "new".
const VISITOR_SALT = 'portfolio-analytics-v1';

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

  const referer = (request.headers.get('Referer') || '').slice(0, 256);

  // `writeDataPoint` is only bound in deployed/`wrangler dev` runs; guard so
  // a missing binding degrades to a no-op instead of a 500.
  env.ANALYTICS?.writeDataPoint({
    // A single index drives Analytics Engine sampling; bucket by event name.
    indexes: [name],
    // Append-only: each new field goes on the end so blobN keeps meaning the
    // same for rows written before that field existed.
    blobs: [
      name,
      reason,
      referer,
      request.cf?.country || '',
      detail,
      await visitorId(request),
      pagePath(referer),
    ],
    doubles: [1],
  });

  return new Response(null, { status: 204, headers: cors });
}

/**
 * A pseudonymous per-visitor id, so the dashboard can say "9 events from 2
 * people" instead of just "9 events".
 *
 * The raw IP is never stored — it is hashed together with the user agent and
 * a fixed salt, and only the first 16 hex chars are kept. The salt is fixed
 * rather than daily-rotating (which is what Plausible/Fathom do) because a
 * rotating salt makes every visitor look new the next day, and distinguishing
 * new from returning is the entire point of this field. The tradeoff: the id
 * is stable across days, so treat it as pseudonymous, not anonymous.
 */
async function visitorId(request) {
  const ip = request.headers.get('CF-Connecting-IP') || '';
  const ua = request.headers.get('User-Agent') || '';
  if (!ip && !ua) return '';

  const data = new TextEncoder().encode(`${VISITOR_SALT}:${ip}:${ua}`);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return [...new Uint8Array(digest)]
    .slice(0, 8)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

/** The path of the page the event fired on, for the per-page breakdown. */
function pagePath(referer) {
  if (!referer) return '';
  try {
    return new URL(referer).pathname.slice(0, 64);
  } catch {
    return '';
  }
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

  const { data, errors } = await runDashboardQueries(env, dashboardQueries());
  return htmlResponse(dashboardPage({ ...data, errors, auth }));
}

// Named rather than a fixed-order array so a bad query fails only its own
// panel — see runDashboardQueries. Exported (not inlined in handleDashboard)
// so `npm run verify` can run every query against the live SQL API without
// duplicating them — see scripts/verify-queries.mjs.
export function dashboardQueries() {
  return {
    totals: `SELECT blob1 AS event, sum(_sample_interval) AS n
              FROM ${DATASET} GROUP BY event ORDER BY n DESC`,
    daily: `SELECT toStartOfDay(timestamp) AS day, sum(_sample_interval) AS n
            FROM ${DATASET} WHERE timestamp > now() - INTERVAL '30' DAY
            GROUP BY day ORDER BY day`,
    referrers: `SELECT blob3 AS referer, sum(_sample_interval) AS n
                FROM ${DATASET} WHERE blob3 != '' GROUP BY referer ORDER BY n DESC LIMIT 10`,
    countries: `SELECT blob4 AS country, sum(_sample_interval) AS n
                FROM ${DATASET} WHERE blob4 != '' GROUP BY country ORDER BY n DESC LIMIT 10`,
    interactions: `SELECT format('{}: {}', blob1, blob5) AS interaction, sum(_sample_interval) AS n
                   FROM ${DATASET} WHERE blob5 != '' GROUP BY interaction ORDER BY n DESC LIMIT 15`,
    activity: `SELECT toDayOfWeek(timestamp) AS dow, toHour(timestamp) AS hour,
                      sum(_sample_interval) AS n
               FROM ${DATASET} GROUP BY dow, hour`,
    // One row per visitor; new-vs-returning is derived in JS from whether the
    // first and last event fall on the same day.
    visitors: `SELECT blob6 AS visitor, min(timestamp) AS first_seen,
                      max(timestamp) AS last_seen
               FROM ${DATASET} WHERE blob6 != '' GROUP BY visitor`,
    pages: `SELECT blob7 AS page, sum(_sample_interval) AS n
            FROM ${DATASET} WHERE blob7 != '' GROUP BY page ORDER BY n DESC LIMIT 10`,
    theme: `SELECT blob5 AS theme, sum(_sample_interval) AS n
            FROM ${DATASET} WHERE blob1 = 'theme_toggle' AND blob5 != ''
            GROUP BY theme ORDER BY n DESC`,
    weekOverWeek: `SELECT
                     sumIf(_sample_interval, timestamp > now() - INTERVAL '7' DAY) AS this_week,
                     sumIf(_sample_interval, timestamp <= now() - INTERVAL '7' DAY
                           AND timestamp > now() - INTERVAL '14' DAY) AS prev_week
                   FROM ${DATASET}`,
  };
}

/**
 * Runs each named query independently (Promise.allSettled, not .all) so one
 * bad query — a typo'd SQL function, a transient API error — degrades only
 * its own panel instead of blanking the whole dashboard. `data[name]` is
 * always an array (empty on failure); `errors[name]` is set only on failure.
 */
async function runDashboardQueries(env, queries) {
  const entries = Object.entries(queries);
  const settled = await Promise.allSettled(entries.map(([, sql]) => runQuery(env, sql)));

  const data = {};
  const errors = {};
  entries.forEach(([name], i) => {
    const result = settled[i];
    if (result.status === 'fulfilled') {
      data[name] = result.value;
    } else {
      data[name] = [];
      errors[name] = String(result.reason?.message || result.reason);
    }
  });
  return { data, errors };
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
      const label = esc(r[labelKey] || '—');
      // A CSS tooltip, not the native `title` attribute — `title`'s browser-
      // rendered popup is slow, inconsistent across browsers/OS, and doesn't
      // fire at all on touch. `.label-wrap` carries the tooltip so it isn't
      // clipped by `.label`'s own overflow:hidden (an element's ::after is
      // still inside its own clipping box). `tabindex` makes it reachable by
      // keyboard Tab and by tap-to-focus on touch (CSS ::after has no hover
      // equivalent there); `aria-label` gives screen readers the untruncated
      // text directly, since generated ::after content isn't reliably
      // exposed to the accessibility tree.
      return `<li>
        <span class="label-wrap tip" data-tip="${label}" aria-label="${label}" tabindex="0">
          <span class="label">${label}</span>
        </span>
        <span class="track"><span class="fill" style="width:${pct.toFixed(1)}%"></span></span>
        <span class="value">${num(r.n)}</span>
      </li>`;
    })
    .join('')}</ul>`;
}

const SPARK_DAYS = 30;

// toStartOfDay returns "2026-08-19 00:00:00"; only the date part is meaningful.
function dayKey(value) {
  return String(value ?? '').slice(0, 10);
}

/**
 * Expands the query's sparse rows (it only returns days that *have* events)
 * into one entry per day across the whole window, zero-filling the gaps.
 * Without this the x-axis is an index, not a date: two days a week apart plot
 * as adjacent points and a straight rising line, which reads as steady growth
 * that never happened.
 */
function fillDailySeries(daily, days = SPARK_DAYS) {
  const counts = new Map(daily.map(d => [dayKey(d.day), Number(d.n) || 0]));
  const today = new Date();
  const series = [];
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate() - i));
    const key = date.toISOString().slice(0, 10);
    series.push({ day: key, n: counts.get(key) ?? 0 });
  }
  return series;
}

function sparkline(daily) {
  if (!daily.length) return '<p class="empty">No data yet.</p>';
  const series = fillDailySeries(daily);
  const w = 720;
  const h = 160;
  const max = Math.max(...series.map(d => d.n), 1);
  const step = w / (series.length - 1);
  const yFor = d => h - (d.n / max) * (h - 20) - 10;
  const coords = series.map((d, i) => [i * step, yFor(d)]);
  const points = coords.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' ');

  // A bare line has no numbers on it at all — mark the days that actually have
  // events (hoverable, with a native tooltip), and caption the peak/latest so
  // they're readable without hovering.
  const markers = coords
    .map(([x, y], i) =>
      series[i].n > 0
        ? `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="3" fill="currentColor"><title>${esc(
            `${num(series[i].n)} on ${series[i].day}`
          )}</title></circle>`
        : ''
    )
    .join('');

  const withEvents = series.filter(d => d.n > 0);
  const peak = withEvents.reduce((best, d) => (d.n > best.n ? d : best), withEvents[0]);
  const latest = withEvents[withEvents.length - 1];
  const caption = `<p class="spark-caption">Peak <strong>${num(peak.n)}</strong> on ${esc(
    peak.day
  )} · Latest <strong>${num(latest.n)}</strong> on ${esc(latest.day)}</p>`;

  return `<svg viewBox="0 0 ${w} ${h}" class="spark" preserveAspectRatio="none" role="img" aria-label="Events per day">
    <polyline fill="none" stroke="currentColor" stroke-width="2" points="${points}" />
    ${markers}
  </svg>
  ${caption}`;
}

function contactFunnel(totals) {
  const byEvent = Object.fromEntries(totals.map(r => [r.event, Number(r.n) || 0]));
  // The CTA click is the top of the funnel: it's what gets someone to the form
  // in the first place, so the interesting drop-off is clicked -> submitted.
  const clicked = byEvent.profile_contact_click || 0;
  const submitted = byEvent.contact_submit || 0;
  const succeeded = byEvent.contact_success || 0;
  const failed = byEvent.contact_error || 0;
  if (!clicked && !submitted && !succeeded && !failed) {
    return '<p class="empty">No data yet.</p>';
  }

  const rows = [
    { label: 'CTA clicked', n: clicked },
    { label: 'Submitted', n: submitted },
    { label: 'Succeeded', n: succeeded },
    { label: 'Failed', n: failed },
  ];
  const pct = (a, b) => (b ? `${((a / b) * 100).toFixed(0)}%` : '—');
  return `${barList(rows, 'label')}<p class="muted" style="margin:10px 0 0;font-size:12px;">
    Click → submit: <strong>${pct(submitted, clicked)}</strong> ·
    Submit → success: <strong>${pct(succeeded, submitted)}</strong>
  </p>`;
}

function visitorStats(visitors) {
  if (!visitors.length) return '<p class="empty">No data yet.</p>';
  // "Returning" = seen on more than one calendar day. A visitor whose whole
  // history is a single session counts as new.
  const returning = visitors.filter(v => dayKey(v.first_seen) !== dayKey(v.last_seen)).length;
  const fresh = visitors.length - returning;
  return `${barList(
    [
      { label: 'New', n: fresh },
      { label: 'Returning', n: returning },
    ],
    'label'
  )}<p class="muted" style="margin:10px 0 0;font-size:12px;">
    <strong>${num(visitors.length)}</strong> unique ${
      visitors.length === 1 ? 'visitor' : 'visitors'
    } · returning = seen on more than one day
  </p>`;
}

function weekOverWeek(rows) {
  const row = rows[0];
  if (!row) return '<p class="empty">No data yet.</p>';
  const current = Number(row.this_week) || 0;
  const previous = Number(row.prev_week) || 0;

  let delta;
  if (!previous) {
    delta = current ? '<span class="delta up">first week with data</span>' : '—';
  } else {
    const change = ((current - previous) / previous) * 100;
    const dir = change >= 0 ? 'up' : 'down';
    const arrow = change >= 0 ? '▲' : '▼';
    delta = `<span class="delta ${dir}">${arrow} ${Math.abs(change).toFixed(0)}%</span>`;
  }

  return `${barList(
    [
      { label: 'This week', n: current },
      { label: 'Previous week', n: previous },
    ],
    'label'
  )}<p class="muted" style="margin:10px 0 0;font-size:12px;">Week over week: ${delta}</p>`;
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
          // Color intensity alone isn't legible cell-to-cell, so print the
          // count directly (blank for 0 — the empty background already reads
          // as "nothing happened here").
          return `<div class="heat-cell" style="background:${bg}" title="${esc(
            `${n} on ${HEAT_DAYS[d]}`
          )}">${n > 0 ? n : ''}</div>`;
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

function panelError(message) {
  return `<p class="panel-error">Query failed: ${esc(message)}</p>`;
}

// Renders a panel body, or the query's error if that one query failed —
// so one bad query only blanks its own panel. See runDashboardQueries.
function panel(errors, key, render) {
  return errors[key] ? panelError(errors[key]) : render();
}

function dashboardPage({
  totals,
  daily,
  referrers,
  countries,
  interactions,
  activity,
  visitors,
  pages,
  theme,
  weekOverWeek: wow,
  errors,
  auth,
}) {
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
    ${
      errors.totals
        ? `<div class="card card-error">${panelError(errors.totals)}</div>`
        : `<div class="card"><div class="big">${num(grandTotal)}</div><div class="cap">total events</div></div>
    ${totals
      .slice(0, 4)
      .map(
        r =>
          `<div class="card"><div class="big">${num(r.n)}</div><div class="cap">${esc(
            r.event
          )}</div></div>`
      )
      .join('')}`
    }
  </section>

  <section class="panel">
    <h2>Events per day <span class="muted">(30d)</span></h2>
    ${panel(errors, 'daily', () => sparkline(daily))}
  </section>

  <section class="panel">
    <h2>Activity by day &amp; hour</h2>
    ${panel(errors, 'activity', () => heatmap(activity))}
  </section>

  <div class="grid">
    <section class="panel"><h2>By event</h2>${panel(errors, 'totals', () => barList(totals, 'event'))}</section>
    <section class="panel"><h2>Top referrers</h2>${panel(errors, 'referrers', () => barList(referrers, 'referer'))}</section>
    <section class="panel"><h2>Top countries</h2>${panel(errors, 'countries', () => barList(countries, 'country'))}</section>
    <section class="panel panel-wide"><h2>Top interactions</h2>${panel(errors, 'interactions', () => barList(interactions, 'interaction'))}</section>
    <section class="panel"><h2>Visitors</h2>${panel(errors, 'visitors', () => visitorStats(visitors))}</section>
    <section class="panel"><h2>Week over week</h2>${panel(errors, 'weekOverWeek', () => weekOverWeek(wow))}</section>
    <section class="panel"><h2>Top pages</h2>${panel(errors, 'pages', () => barList(pages, 'page'))}</section>
    <section class="panel"><h2>Theme preference</h2>${panel(errors, 'theme', () => barList(theme, 'theme'))}</section>
    <section class="panel"><h2>Contact funnel</h2>${panel(errors, 'totals', () => contactFunnel(totals))}</section>
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
.cards { display:grid; grid-template-columns:repeat(auto-fit,minmax(136px,1fr)); gap:12px; margin-bottom:28px; }
.card { background:var(--card); border:1px solid var(--line); border-radius:10px; padding:14px 16px; overflow:hidden; }
.big { font-size:26px; font-weight:600; }
.cap { color:var(--muted); font-size:12px; margin-top:2px; text-transform:uppercase; letter-spacing:.04em; overflow-wrap:anywhere; }
.panel { background:var(--card); border:1px solid var(--line); border-radius:10px; padding:18px 20px; margin-bottom:20px; }
.panel h2 { margin:0 0 14px; font-size:15px; }
.grid { display:grid; grid-template-columns:1fr; gap:20px; }
@media (min-width:680px) { .grid { grid-template-columns:1fr 1fr; } .grid .panel:first-child, .grid .panel-wide { grid-column:1/-1; } }
.spark { width:100%; height:160px; color:var(--accent); display:block; }
.spark-caption { margin:8px 0 0; font-size:12px; color:var(--muted); }
.spark-caption strong { color:var(--fg); font-weight:600; }
.delta { font-weight:600; }
.delta.up { color:#30a46c; }
.delta.down { color:#e5484d; }
.bars { list-style:none; margin:0; padding:0; display:flex; flex-direction:column; gap:8px; }
.bars li { display:grid; grid-template-columns:minmax(90px,50%) 1fr auto; align-items:center; gap:10px; font-size:13px; }
.label-wrap { min-width:0; }
.bars .label { display:block; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
/* CSS-only tooltip — not the native title attribute, which renders slowly,
   inconsistently across browsers/OS, and not at all on touch. .tip sits on
   a wrapper (not the truncated .label itself) so the popup isn't clipped by
   that element's own overflow:hidden. */
.tip { position:relative; }
.tip::after {
  content:attr(data-tip);
  position:absolute; left:0; bottom:100%; margin-bottom:6px;
  background:var(--fg); color:var(--bg);
  padding:4px 8px; border-radius:6px; font-size:12px; white-space:nowrap;
  opacity:0; pointer-events:none; transition:opacity .1s ease; z-index:10;
}
.tip:hover::after, .tip:focus-visible::after { opacity:1; }
.bars .track { background:var(--line); border-radius:5px; height:10px; overflow:hidden; }
.bars .fill { display:block; height:100%; background:var(--accent); border-radius:5px; }
.bars .value { font-variant-numeric:tabular-nums; color:var(--muted); }
.empty { color:var(--muted); margin:0; }
.panel-error { color:#e5484d; margin:0; font-size:13px; }
.card-error { display:flex; align-items:center; }
.card-error .panel-error { font-size:12px; }
.heatmap { display:flex; flex-direction:column; gap:3px; overflow-x:auto; }
.heat-row { display:grid; grid-template-columns:34px repeat(24,minmax(22px,1fr)); gap:3px; align-items:center; }
.heat-daylabel { font-size:11px; color:var(--muted); }
.heat-hourlabel { font-size:9px; color:var(--muted); text-align:center; }
.heat-cell { aspect-ratio:1; border-radius:3px; display:flex; align-items:center; justify-content:center; font-size:9px; font-variant-numeric:tabular-nums; color:var(--fg); }
footer { color:var(--muted); font-size:12px; margin-top:28px; }
`;
