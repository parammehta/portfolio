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

Cloudflare dashboard → the Worker → Analytics Engine, or via the SQL API:

```bash
curl "https://api.cloudflare.com/client/v4/accounts/<ACCOUNT_ID>/analytics_engine/sql" \
  -H "Authorization: Bearer <API_TOKEN>" \
  -d "SELECT blob1 AS event, count() AS n FROM portfolio_events GROUP BY event"
```
