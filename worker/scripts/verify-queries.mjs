#!/usr/bin/env node
/**
 * Runs every dashboard SQL query against the live Analytics Engine SQL API,
 * so a bad query (typo'd function, unsupported syntax — Analytics Engine's
 * dialect is a limited ClickHouse subset, e.g. no concat() or ||) is caught
 * here instead of on the deployed dashboard.
 *
 * Requires CF_API_TOKEN (Account Analytics: Read) as an env var — the same
 * token set via `npx wrangler secret put CF_API_TOKEN`. ACCOUNT_ID defaults
 * to the public value already in wrangler.toml.
 *
 * Usage: CF_API_TOKEN=... npm run verify
 */
import { dashboardQueries } from '../src/index.js';

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

  // Mirrors runQuery in src/index.js: some failures come back as plain text,
  // not JSON, so read as text first.
  const text = await res.text();
  if (!res.ok) return { ok: false, detail: text.slice(0, 300) };

  try {
    const json = JSON.parse(text);
    if (json.success === false) return { ok: false, detail: JSON.stringify(json.errors) };
    return { ok: true };
  } catch {
    return { ok: false, detail: text.slice(0, 300) };
  }
}

const queries = Object.entries(dashboardQueries());
let failed = 0;

for (const [name, sql] of queries) {
  const result = await checkQuery(sql);
  console.log(`${result.ok ? '✓' : '✗'} ${name}`);
  if (!result.ok) {
    console.log(`  ${result.detail}`);
    failed++;
  }
}

if (failed) {
  console.error(`\n${failed} of ${queries.length} quer${queries.length === 1 ? 'y' : 'ies'} failed.`);
  process.exit(1);
}
console.log(`\nAll ${queries.length} queries valid.`);
