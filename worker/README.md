# Analytics events Worker

Cloudflare Web Analytics (the beacon in `src/pages/_app.page.tsx`) records
pageviews and Core Web Vitals but has **no custom-event API**. This Worker is
that API: the site's `trackEvent` (see `src/utils/analytics.ts`) posts
`{ name, props }` here, and the Worker writes one data point per event to a
[Workers Analytics Engine](https://developers.cloudflare.com/analytics/analytics-engine/)
dataset (`portfolio_events`).

It is deployed separately from the site — the site is on S3 + CloudFront; this
is Cloudflare infrastructure.

## What it does

- Accepts `POST` from the site's own origins only (`parammehta.com`,
  `www.parammehta.com`); everything else gets `403`.
- Rejects any event name not on the allowlist (kept in sync with
  `analyticsEvents` in `src/utils/analytics.ts`).
- Writes the fields below, indexed by event name (the sampling key). The blob
  list is **append-only** — a new field goes on the end so existing rows keep
  their meaning.
- Serves a protected `GET /dashboard` (page) and `GET /dashboard/data` (JSON)
  that chart the events (see [Query the data](#query-the-data)).

### Fields

| Field | Meaning | Source |
|---|---|---|
| `index1` | event name | the sampling key — Analytics Engine allows exactly one |
| `blob1` | event name | |
| `blob2` | `props.reason` | only `contact_error` sets it |
| `blob3` | `Referer` header | our own page URL, **not** the external source |
| `blob4` | country | `request.cf.country` |
| `blob5` | detail | `props.label ?? company ?? tool ?? theme` — one polymorphic slot |
| `blob6` | visitor id | see [About `blob6`](#about-blob6-visitor) |
| `blob7` | page path | pathname of `blob3` |
| `blob8` | device | `mobile` / `tablet` / `desktop` |
| `blob9` | browser | Chrome / Safari / Firefox / Edge / Opera / Other |
| `blob10` | OS | iOS / Android / macOS / Windows / Linux / Other |
| `blob11` | external referrer host | `props.ref` from the client |
| `blob12` | session id | `props.sid` from the client (per tab) |
| `double1` | `1` | unused — every count is `sum(_sample_interval)` |

`blob8`–`blob10` are derived server-side from the `User-Agent` and
`Sec-CH-UA-Mobile` (see `parseUserAgent` in `src/ingest.js`).

`blob11` and `blob12` **have to come from the client**: the `Referer` header on
a beacon is the page the event fired on — our own URL — so the Worker cannot
see where a visitor actually came from. `createBeaconSink` in
`src/utils/analytics.ts` attaches `ref` (the referrer hostname, blank when
same-origin) and `sid` (a `sessionStorage` id) to every event.

> **These five fields are blank for every row written before they were added.**
> The dashboard says so rather than showing a breakdown of whatever happens to
> be filled in — the `coverage` query reports what fraction of the range has
> each field, and the panels carry that as a note.

### Modules

`src/index.js` is the router and nothing else:

| File | Contains |
|---|---|
| `src/index.js` | route table, the shared Access + config gate, response helpers |
| `src/ingest.js` | `ALLOWED_EVENTS`, `handleEvent`, `visitorId`, `pagePath`, `parseUserAgent` |
| `src/access.js` | Cloudflare Access JWT verification |
| `src/queries.js` | `RANGES`, `dashboardQueries(range, event)`, the SQL runner |
| `src/render/shell.js` | the HTML document + the inlined bootstrap payload |
| `src/render/styles.js` | the stylesheet |
| `src/render/client.js` | the client app, as a string |

### Tests

```bash
cd worker && npm test          # node --test, no dependencies
```

Covers `parseUserAgent`'s ordering traps (every Edge UA also says "Chrome";
every Chrome UA also says "Safari") and `dashboardQueries` — that each range
builds a predicate, that an unknown range or an off-allowlist event filter is
dropped rather than interpolated into SQL, and that no query uses a function
the dialect rejects.

The allowlist is separately pinned by `src/utils/analyticsEvents.test.ts` in
the site's Jest suite, which compares it against `analyticsEvents`. The two
lists drifted once already — `scheduling_open` and `home_experience_slide` were
emitted by the site and 422'd here for as long as they existed, so no rows were
ever recorded for them.

### About `blob6` (visitor)

So the dashboard can say "9 events from 2 people" rather than just "9 events".
The raw IP is **never stored**: it is hashed (SHA-256) together with the user
agent and a fixed salt, and only the first 16 hex chars are kept.

The salt is fixed rather than daily-rotating — the rotating-salt approach
(Plausible, Fathom) makes every visitor look new the next day, which would
defeat the new-vs-returning split this field exists for. The tradeoff is that
the id is stable across days, so treat it as **pseudonymous, not anonymous**.
Changing `VISITOR_SALT` in `src/index.js` resets every visitor to "new".

## Deploy

Requires a Cloudflare account with Workers enabled (free plan is fine).

```bash
cd worker
npm install
npx wrangler login        # first time only
npm run deploy
```

Wrangler creates the `portfolio_events` dataset from `wrangler.toml` on first
deploy and prints the Worker URL
(`https://portfolio-analytics.<subdomain>.workers.dev`).

> **First deploy fails with `You need to enable Analytics Engine` (code 10089)?**
> Enable it once at
> `https://dash.cloudflare.com/<account-id>/workers/analytics-engine`, then
> re-run `npm run deploy`.

Or from the repo root: `npm run deploy:worker`.

### Before deploying a dashboard query change

Analytics Engine's SQL dialect is a limited ClickHouse subset — no `concat()`
or `||`, for example — so a query that looks fine can still 422 in production.
Two checks catch that before it reaches the live dashboard:

```bash
cd worker
npm test                              # pure-function checks, no network
CF_API_TOKEN=<token> npm run verify   # every dashboardQueries() entry, for every range, against the live SQL API
npx wrangler dev                      # then hit /dashboard once locally against real data
```

`verify` sweeps all five ranges, not just the default — the ranges differ in
their time predicate and their bucketing function, so a query that only breaks
on `24h` (hourly buckets) or `all` (no predicate at all) still fails the check.

`verify` needs the same token as `CF_API_TOKEN` (Account Analytics: Read) —
export it locally, it isn't read from the deployed secret. A query that fails
would otherwise only surface once it's live, as that panel's "Query failed"
message on the real dashboard.

## Wire it to the site

The site sends events here only when `NEXT_PUBLIC_ANALYTICS_EVENTS_URL` is set
at build time. Add the deployed Worker URL as a GitHub repo **Variable** of that
name (Settings → Secrets and variables → Actions → Variables). Unset → the site
build simply omits the sink and `trackEvent` no-ops in production.

## Query the data

Analytics Engine has **no built-in charting dashboard** — the Cloudflare
dashboard page only confirms the dataset exists. There are three ways to see
the events; pick either (or both) of the first two.

### Ad-hoc — the SQL API

```bash
curl "https://api.cloudflare.com/client/v4/accounts/<ACCOUNT_ID>/analytics_engine/sql" \
  -H "Authorization: Bearer <API_TOKEN>" \
  -d "SELECT blob1 AS event, count() AS n FROM portfolio_events GROUP BY event"
```

The API token needs **Account → Account Analytics → Read** (dash → My Profile →
API Tokens → Create Custom Token). Handy queries:

```sql
-- events per day, last 30 days (sampling-adjusted counts)
SELECT toStartOfDay(timestamp) AS day, blob1 AS event, sum(_sample_interval) AS n
FROM portfolio_events WHERE timestamp > now() - INTERVAL '30' DAY
GROUP BY day, event ORDER BY day;

-- traffic sources (blob11) and countries. NB blob3 is the Referer *header*,
-- which on a beacon is our own page — it is not where the visitor came from.
SELECT blob11 AS source, sum(_sample_interval) AS n FROM portfolio_events
WHERE blob11 != '' GROUP BY source ORDER BY n DESC LIMIT 10;
SELECT blob4 AS country, sum(_sample_interval) AS n FROM portfolio_events
WHERE blob4 != '' GROUP BY country ORDER BY n DESC LIMIT 10;

-- unique visitors / sessions. count(DISTINCT x) is the ONLY spelling that
-- works: uniq(), uniqExact() and countDistinct() are all rejected as unknown
-- functions. A distinct count can't be un-sampled, so treat it as a floor.
SELECT count(DISTINCT blob6) AS visitors, count(DISTINCT blob12) AS sessions
FROM portfolio_events WHERE timestamp > now() - INTERVAL '168' HOUR;

-- top interactions (blob5 = the label/company/tool/theme prop on click events)
-- note: this SQL dialect has no concat() or || — use format() with {} placeholders
SELECT format('{}: {}', blob1, blob5) AS interaction, sum(_sample_interval) AS n
FROM portfolio_events WHERE blob5 != '' GROUP BY interaction ORDER BY n DESC LIMIT 15;

-- unique visitors (blob6); new vs returning is derived from first_seen/last_seen
SELECT blob6 AS visitor, min(timestamp) AS first_seen, max(timestamp) AS last_seen
FROM portfolio_events WHERE blob6 != '' GROUP BY visitor;

-- events per page (blob7 = path of the page the event fired on)
SELECT blob7 AS page, sum(_sample_interval) AS n FROM portfolio_events
WHERE blob7 != '' GROUP BY page ORDER BY n DESC LIMIT 10;

-- week over week (sumIf works; there is no FILTER clause)
SELECT sumIf(_sample_interval, timestamp > now() - INTERVAL '7' DAY) AS this_week,
       sumIf(_sample_interval, timestamp <= now() - INTERVAL '7' DAY
             AND timestamp > now() - INTERVAL '14' DAY) AS prev_week
FROM portfolio_events;
```

> `sum(_sample_interval)` un-samples the counts; plain `count()` is fine at low
> volume but undercounts once Analytics Engine starts sampling.

### Built-in dashboard — `GET /dashboard`

`https://portfolio-analytics.<subdomain>.workers.dev/dashboard` serves the
dashboard: six KPI tiles with deltas against the previous window of equal
length, a time-series chart (events or visitors), and panels for events, pages,
countries, traffic sources, devices/browsers/OS, interactions, the contact
funnel, new-vs-returning visitors, theme choice, submission errors, a day×hour
heatmap, and the latest 50 raw events.

Two routes back it:

| Route | Returns |
|---|---|
| `GET /dashboard?range=&event=` | the page, with the first payload inlined |
| `GET /dashboard/data?range=&event=` | the same payload as JSON |

`range` is one of `24h`, `7d`, `30d` (default), `90d`, `all`; `event` is any
name on the allowlist. Both are validated against a fixed set before they reach
the SQL, and anything unrecognised falls back to the default. The page embeds
its first payload as JSON so the initial paint has real data with no request
waterfall; every later range/filter change is a `fetch` of the JSON route, so
there is one rendering path rather than a server one and a client one that
drift apart.

It reads the SQL API server-side, so it needs:

```bash
# 1. account id — already set as a [vars] entry in wrangler.toml
# 2. the API token (Account Analytics: Read) as a secret, never committed:
cd worker && npx wrangler secret put CF_API_TOKEN
npm run deploy
```

**Protect it with Cloudflare Access** — it exposes your analytics, so it must
not be public. The Worker refuses to serve `/dashboard` in production until
Access is configured (it only runs open on localhost `wrangler dev`).

1. Cloudflare **Zero Trust** dashboard → **Access → Applications → Add an
   application → Self-hosted**.
2. Application domain: `portfolio-analytics.<subdomain>.workers.dev`, path
   `/dashboard`.
3. Add a policy allowing your email (e.g. Action *Allow*, Include *Emails* →
   your address). Free plan covers up to 50 users.
4. On the application's **Overview**, copy the **Application Audience (AUD)
   tag**, and note your team domain (`<team>.cloudflareaccess.com`).
5. Set both on the Worker and redeploy so it verifies the signed Access JWT:

   ```bash
   # uncomment + fill ACCESS_TEAM_DOMAIN and ACCESS_AUD in wrangler.toml, then:
   npm run deploy
   ```

Now visiting `/dashboard` bounces through your Access login, and the Worker
independently verifies the `Cf-Access-Jwt-Assertion` token (checking signature,
audience, and expiry) before rendering.

### Grafana (optional, richer charts + alerting)

The SQL API plugs into Grafana via the **Infinity** data source:

1. Grafana Cloud (free tier) or local Grafana → install the *Infinity* plugin.
2. Add an Infinity data source. For each panel, use a query of:
   - Type **JSON**, Method **POST**,
   - URL `https://api.cloudflare.com/client/v4/accounts/<ACCOUNT_ID>/analytics_engine/sql`,
   - Header `Authorization: Bearer <API_TOKEN>` (Account Analytics: Read),
   - Body = one of the SQL queries above,
   - Rows/Root selector `data`.
3. Build panels (time series for the per-day query; bar/table for referrers and
   countries). Add Grafana alerts if you want threshold notifications.

Downside vs. the built-in dashboard: it's a second service, and the API token
lives in Grafana.
