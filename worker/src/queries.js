/**
 * The dashboard's read path: SQL against the Analytics Engine SQL API.
 *
 * Analytics Engine speaks a limited ClickHouse subset — no `concat()`, no
 * `||` (use `format('{}: {}', a, b)`), no `FILTER` clause (use `sumIf`), and
 * none of the ClickHouse uniq family: `uniq`, `uniqExact` and `countDistinct`
 * are all rejected as unknown functions, and `count(DISTINCT x)` is the one
 * spelling that works.
 *
 * Counts come from `sum(_sample_interval)` rather than `count()`, or they
 * undercount once sampling kicks in. Distinct counts are the exception —
 * a distinct count over sampled rows can't be scaled back up, so visitor and
 * session numbers are floors, not estimates.
 *
 * A query that looks fine can still 422 in production, which is what
 * `npm run verify` exists to catch — the uniq() rejection above was found
 * exactly that way.
 */
import { ALLOWED_EVENTS } from './ingest.js';

export const DATASET = 'portfolio_events';

/**
 * The selectable windows. `hours` is null for "all" (no time predicate);
 * `bucket` picks the time-series granularity — only the 24h view is fine
 * enough to want hourly points, everything longer reads better by day.
 */
export const RANGES = {
  '24h': { hours: 24, bucket: 'hour', label: 'Last 24 hours' },
  '7d': { hours: 168, bucket: 'day', label: 'Last 7 days' },
  '30d': { hours: 720, bucket: 'day', label: 'Last 30 days' },
  '90d': { hours: 2160, bucket: 'day', label: 'Last 90 days' },
  all: { hours: null, bucket: 'day', label: 'All time' },
};

export const DEFAULT_RANGE = '30d';

/** Query params are never interpolated raw — both come from a fixed set. */
export function normaliseRange(range) {
  return Object.hasOwn(RANGES, range) ? range : DEFAULT_RANGE;
}

export function normaliseEvent(event) {
  return event && ALLOWED_EVENTS.has(event) ? event : '';
}

/**
 * Builds the shared predicate. `window` is 'current' or 'previous' — the
 * previous window is the immediately preceding stretch of the same length, so
 * every KPI can carry a like-for-like delta. "All time" has no previous
 * window; callers must not ask for one.
 */
function where(range, event, { window = 'current', extra = '' } = {}) {
  const { hours } = RANGES[range];
  const parts = [];

  if (hours && window === 'current') {
    parts.push(`timestamp > now() - INTERVAL '${hours}' HOUR`);
  } else if (hours && window === 'previous') {
    parts.push(`timestamp <= now() - INTERVAL '${hours}' HOUR`);
    parts.push(`timestamp > now() - INTERVAL '${hours * 2}' HOUR`);
  }

  if (event) parts.push(`blob1 = '${event}'`);
  if (extra) parts.push(extra);

  return parts.length ? `WHERE ${parts.join(' AND ')}` : '';
}

/** Same-shaped `label`/`n` breakdown, so the client renders them all alike. */
function breakdown(range, event, column, limit = 10) {
  return `SELECT ${column} AS label, sum(_sample_interval) AS n
          FROM ${DATASET} ${where(range, event, { extra: `${column} != ''` })}
          GROUP BY label ORDER BY n DESC LIMIT ${limit}`;
}

/**
 * Named rather than a fixed-order array so a bad query fails only its own
 * panel — see runDashboardQueries. Exported (not inlined in the handler) so
 * `npm run verify` can run every query against the live SQL API without
 * duplicating them — see scripts/verify-queries.mjs.
 */
export function dashboardQueries(rawRange = DEFAULT_RANGE, rawEvent = '') {
  const range = normaliseRange(rawRange);
  const event = normaliseEvent(rawEvent);
  const { bucket, hours } = RANGES[range];
  const bucketFn = bucket === 'hour' ? 'toStartOfHour' : 'toStartOfDay';

  const queries = {
    timeseries: `SELECT ${bucketFn}(timestamp) AS bucket, sum(_sample_interval) AS n,
                        count(DISTINCT blob6) AS visitors
                 FROM ${DATASET} ${where(range, event)}
                 GROUP BY bucket ORDER BY bucket`,

    kpis: `SELECT sum(_sample_interval) AS events, count(DISTINCT blob6) AS visitors
           FROM ${DATASET} ${where(range, event)}`,

    // Sessions live in blob12, which only exists for rows written after the
    // client started sending `sid` — filtered separately so a pile of empty
    // strings doesn't count as one big session.
    sessions: `SELECT count(DISTINCT blob12) AS sessions
               FROM ${DATASET} ${where(range, event, { extra: "blob12 != ''" })}`,

    // How much of the window predates each late-added blob, so the UI can say
    // "captured for 40% of events in this range" instead of quietly showing a
    // breakdown of whatever happens to be filled in.
    coverage: `SELECT sum(_sample_interval) AS total,
                      sumIf(_sample_interval, blob8 != '') AS with_device,
                      sumIf(_sample_interval, blob11 != '') AS with_source,
                      sumIf(_sample_interval, blob12 != '') AS with_session
               FROM ${DATASET} ${where(range, event)}`,

    totals: `SELECT blob1 AS label, sum(_sample_interval) AS n
             FROM ${DATASET} ${where(range, event)} GROUP BY label ORDER BY n DESC`,

    pages: breakdown(range, event, 'blob7'),
    countries: breakdown(range, event, 'blob4'),
    sources: breakdown(range, event, 'blob11'),
    devices: breakdown(range, event, 'blob8', 5),
    browsers: breakdown(range, event, 'blob9', 6),
    os: breakdown(range, event, 'blob10', 6),

    // blob2 has been written since day one and read by nothing — these are the
    // reasons behind every contact_error.
    errorReasons: `SELECT blob2 AS label, sum(_sample_interval) AS n
                   FROM ${DATASET}
                   ${where(range, '', { extra: "blob1 = 'contact_error' AND blob2 != ''" })}
                   GROUP BY label ORDER BY n DESC LIMIT 8`,

    interactions: `SELECT format('{}: {}', blob1, blob5) AS label, sum(_sample_interval) AS n
                   FROM ${DATASET} ${where(range, event, { extra: "blob5 != ''" })}
                   GROUP BY label ORDER BY n DESC LIMIT 15`,

    theme: `SELECT blob5 AS label, sum(_sample_interval) AS n
            FROM ${DATASET}
            ${where(range, '', { extra: "blob1 = 'theme_toggle' AND blob5 != ''" })}
            GROUP BY label ORDER BY n DESC`,

    activity: `SELECT toDayOfWeek(timestamp) AS dow, toHour(timestamp) AS hour,
                      sum(_sample_interval) AS n
               FROM ${DATASET} ${where(range, event)} GROUP BY dow, hour`,

    // One row per visitor; new-vs-returning is derived in JS from whether the
    // first and last event fall on the same day.
    visitors: `SELECT blob6 AS visitor, min(timestamp) AS first_seen,
                      max(timestamp) AS last_seen
               FROM ${DATASET} ${where(range, event, { extra: "blob6 != ''" })}
               GROUP BY visitor`,

    // The funnel needs every contact step regardless of the event filter —
    // filtering to one event would leave a funnel with a single bar.
    funnel: `SELECT blob1 AS label, sum(_sample_interval) AS n
             FROM ${DATASET} ${where(range, '')} GROUP BY label ORDER BY n DESC`,

    recent: `SELECT timestamp, blob1 AS event, blob5 AS detail, blob7 AS page,
                    blob4 AS country, blob8 AS device
             FROM ${DATASET} ${where(range, event)}
             ORDER BY timestamp DESC LIMIT 50`,
  };

  // "All time" has nothing to compare against, so the deltas are simply absent
  // rather than compared against an empty window that reads as +100%.
  if (hours) {
    queries.kpisPrev = `SELECT sum(_sample_interval) AS events, count(DISTINCT blob6) AS visitors
                        FROM ${DATASET} ${where(range, event, { window: 'previous' })}`;
  }

  return queries;
}

/**
 * Runs each named query independently (Promise.allSettled, not .all) so one
 * bad query — a typo'd SQL function, a transient API error — degrades only
 * its own panel instead of blanking the whole dashboard. `data[name]` is
 * always an array (empty on failure); `errors[name]` is set only on failure.
 */
export async function runDashboardQueries(env, queries) {
  const entries = Object.entries(queries);
  const settled = await Promise.allSettled(
    entries.map(([, sql]) => runQuery(env, sql))
  );

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

export async function runQuery(env, sql) {
  const res = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${env.ACCOUNT_ID}/analytics_engine/sql`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${env.CF_API_TOKEN}` },
      body: sql,
    }
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
