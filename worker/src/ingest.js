/**
 * Event ingestion (POST /).
 *
 * The site's `trackEvent` posts `{ name, props }` here via `navigator.sendBeacon`;
 * we record one data point per event in a Workers Analytics Engine dataset.
 */

// Mirrors `analyticsEvents` in `src/utils/analytics.ts`. Anything not on this
// list is rejected, so a stray/forged event name can't pollute the dataset.
// Kept honest by `src/utils/analytics.test.ts`, which asserts the two lists
// match — they drifted silently once already (`scheduling_open` and
// `home_experience_slide` were 422'd for as long as they existed).
export const ALLOWED_EVENTS = new Set([
  'contact_submit',
  'contact_success',
  'contact_error',
  'scheduling_open',
  'resume_download',
  'resume_open',
  'design_system_open',
  'nav_link_click',
  'social_link_click',
  'theme_toggle',
  'contact_cta_click',
  'home_experience_slide',
  'experience_tab_select',
  'experience_details_click',
  'skills_tool_link_click',
]);

const ALLOWED_ORIGINS = new Set([
  'https://parammehta.com',
  'https://www.parammehta.com',
]);

const MAX_BODY_BYTES = 1024;

// Namespaces the visitor hash — see visitorId(). Not a secret (it only has to
// stop the hash being a plain rainbow-table lookup of an IP+UA pair), but
// changing it resets every visitor to "new".
const VISITOR_SALT = 'portfolio-analytics-v1';

export function corsHeaders(origin) {
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

/** Every blob is capped so one oversized prop can't dominate a data point. */
function field(value, max = 64) {
  return typeof value === 'string' ? value.slice(0, max) : '';
}

export async function handleEvent(request, env) {
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
  const reason = field(props.reason);
  // A single free-text field for whichever prop identifies *what* was
  // clicked (nav/social label, experience company, skills tool link, the
  // resulting theme on a theme_toggle, or which CTA led to the contact form).
  const detail = field(
    props.label ?? props.company ?? props.tool ?? props.theme ?? props.source
  );

  const referer = field(request.headers.get('Referer') || '', 256);
  const ua = parseUserAgent(
    request.headers.get('User-Agent') || '',
    request.headers.get('Sec-CH-UA-Mobile') || ''
  );

  // Verifying the deployed ingest path used to mean writing to the real
  // dataset, and Analytics Engine has no delete API — so smoke-testing
  // production permanently polluted it. `X-Dry-Run: 1` runs every check above
  // (origin, size, JSON, allowlist) and the UA parsing, then returns the same
  // 204 without recording anything.
  if (request.headers.get('X-Dry-Run') === '1') {
    return new Response(null, { status: 204, headers: { ...cors, 'X-Dry-Run': 'accepted' } });
  }

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
      ua.device,
      ua.browser,
      ua.os,
      // `ref`/`sid` come from the client (see createBeaconSink in
      // src/utils/analytics.ts) — the Referer header is our own page, not the
      // external source that sent the visitor here.
      field(props.ref),
      field(props.sid, 32),
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
export async function visitorId(request) {
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
export function pagePath(referer) {
  if (!referer) return '';
  try {
    return new URL(referer).pathname.slice(0, 64);
  } catch {
    return '';
  }
}

/**
 * Device / browser / OS from the User-Agent, with `Sec-CH-UA-Mobile` preferred
 * for the device when it's present (Chromium sends it; nobody else does).
 *
 * Pure and exported so the ordering traps below are covered by unit tests
 * rather than by hoping: every Edge UA also says "Chrome", every Chrome UA
 * also says "Safari", and iOS Chrome/Firefox say neither (they're "CriOS" and
 * "FxiOS" on top of WebKit). The checks must stay most-specific-first.
 */
export function parseUserAgent(ua, chMobile = '') {
  if (!ua) return { device: '', browser: '', os: '' };

  let os = 'Other';
  if (/iPhone|iPad|iPod/.test(ua)) os = 'iOS';
  else if (/Android/.test(ua)) os = 'Android';
  else if (/Mac OS X|Macintosh/.test(ua)) os = 'macOS';
  else if (/Windows/.test(ua)) os = 'Windows';
  else if (/Linux|X11|CrOS/.test(ua)) os = 'Linux';

  let browser = 'Other';
  if (/Edg[A-Z]?\//.test(ua)) browser = 'Edge';
  else if (/OPR\/|Opera/.test(ua)) browser = 'Opera';
  else if (/Firefox\/|FxiOS\//.test(ua)) browser = 'Firefox';
  else if (/Chrome\/|CriOS\//.test(ua)) browser = 'Chrome';
  else if (/Safari\//.test(ua)) browser = 'Safari';

  // An explicit tablet token beats everything — a tablet is still a tablet
  // whichever way its client hint answers "are you mobile?". Otherwise the
  // hint wins where Chromium sent one, and the UA string is the fallback.
  // "Android without Mobile" is the standard tablet tell, but it is a guess,
  // so it loses to a `?1` hint rather than overriding it.
  let device;
  if (/iPad|Tablet/.test(ua)) device = 'tablet';
  else if (chMobile === '?1') device = 'mobile';
  else if (/Android(?!.*Mobile)/.test(ua)) device = 'tablet';
  else if (/Mobile|iPhone|iPod/.test(ua)) device = 'mobile';
  else device = 'desktop';

  return { device, browser, os };
}
