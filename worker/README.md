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
- Writes `blob1=name`, `blob2=reason`, `blob3=referer`, `blob4=country`,
  `double1=1`, indexed by event name (the sampling key).
- Serves a protected `GET /dashboard` that charts the events (see
  [Query the data](#query-the-data)).

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

-- top referrers / countries
SELECT blob3 AS referer, sum(_sample_interval) AS n FROM portfolio_events
WHERE blob3 != '' GROUP BY referer ORDER BY n DESC LIMIT 10;
SELECT blob4 AS country, sum(_sample_interval) AS n FROM portfolio_events
WHERE blob4 != '' GROUP BY country ORDER BY n DESC LIMIT 10;

-- top interactions (blob5 = the label/company/tool/theme prop on click events)
-- note: this SQL dialect has no concat() or || — use format() with {} placeholders
SELECT format('{}: {}', blob1, blob5) AS interaction, sum(_sample_interval) AS n
FROM portfolio_events WHERE blob5 != '' GROUP BY interaction ORDER BY n DESC LIMIT 15;
```

> `sum(_sample_interval)` un-samples the counts; plain `count()` is fine at low
> volume but undercounts once Analytics Engine starts sampling.

### Built-in dashboard — `GET /dashboard`

The Worker serves a small server-rendered dashboard (event totals, a 30-day
sparkline, top referrers and countries) at
`https://portfolio-analytics.<subdomain>.workers.dev/dashboard`.

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
