#!/usr/bin/env node
/**
 * Runs every dashboard SQL query against the live Analytics Engine SQL API,
 * so a bad query (typo'd function, unsupported syntax — Analytics Engine's
 * dialect is a limited ClickHouse subset, e.g. no concat() or ||) is caught
 * here instead of on the deployed dashboard.
 *
 * Every range is checked, not just the default: the ranges differ in their
 * time predicate and bucketing function, so a query that only breaks on `24h`
 * (hourly buckets) or `all` (no predicate at all) must fail here too.
 *
 * Requires CF_API_TOKEN (Account Analytics: Read) as an env var — the same
 * token set via `npx wrangler secret put CF_API_TOKEN`. ACCOUNT_ID defaults
 * to the public value already in wrangler.toml.
 *
 * Usage: CF_API_TOKEN=... npm run verify
 */
import { dashboardQueries, RANGES } from '../src/queries.js';

const token = process.env.CF_API_TOKEN;
if (!token) {
  console.error('Set CF_API_TOKEN (Account Analytics: Read) to run this — see worker/README.md.');
  process.exit(1);
}
const accountId = process.env.ACCOUNT_ID || '2b3e10900a534b6fb7e855e199717511';

async function checkQuery(sql) {
  const res = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${accountId}/analytics_engine/sql`,
    { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: sql }
  );

  // Mirrors runQuery in src/queries.js: some failures come back as plain text,
  // not JSON, so read as text first.
  const text = await res.text();
  if (!res.ok) return { ok: false, detail: text.slice(0, 300) };

  try {
    const json = JSON.parse(text);
    if (json.success === false) return { ok: false, detail: JSON.stringify(json.errors) };
    return { ok: true, rows: json.rows ?? (json.data?.length || 0) };
  } catch {
    return { ok: false, detail: text.slice(0, 300) };
  }
}

let checked = 0;
let failed = 0;

for (const range of Object.keys(RANGES)) {
  console.log(`\n${range}`);
  for (const [name, sql] of Object.entries(dashboardQueries(range))) {
    const result = await checkQuery(sql);
    checked++;
    console.log(`  ${result.ok ? '✓' : '✗'} ${name}${result.ok ? ` (${result.rows} rows)` : ''}`);
    if (!result.ok) {
      console.log(`    ${result.detail}`);
      failed++;
    }
  }
}

if (failed) {
  console.error(`\n${failed} of ${checked} queries failed.`);
  process.exit(1);
}
console.log(`\nAll ${checked} queries valid.`);
