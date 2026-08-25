#!/usr/bin/env node
/**
 * Ask the deployed site what it is running, instead of asking CI whether it
 * thinks it succeeded.
 *
 * A green deploy job is a claim about a workflow run; it is not evidence that
 * the bytes you wrote are the bytes being served. (A workflow badge once read
 * "success" here for a run that started two hours *before* the commit under
 * test.) This fetches the live HTML, extracts the Next.js build id, and
 * compares it against the local build — and optionally greps the served
 * JavaScript for a marker string you expect your change to contain.
 *
 * Usage:
 *   node scripts/verify-deploy.mjs
 *   node scripts/verify-deploy.mjs --expect pm_sid --expect contact_cta_click
 *   node scripts/verify-deploy.mjs --url https://parammehta.com
 */
import { readFileSync } from 'node:fs';

const args = process.argv.slice(2);
const flag = name => {
  const i = args.indexOf(name);
  return i === -1 ? null : args[i + 1];
};
const all = name =>
  args.flatMap((a, i) => (a === name && args[i + 1] ? [args[i + 1]] : []));

const site = flag('--url') || process.env.NEXT_PUBLIC_WEBSITE_URL || 'https://parammehta.com';
const expects = all('--expect');

/**
 * `output: 'export'` does not copy BUILD_ID into the export directory, so the
 * local id comes from `.next/BUILD_ID`, falling back to the chunk path baked
 * into the exported HTML — which is what actually ships, and so is the more
 * faithful comparison of the two.
 */
function localBuildId() {
  for (const [file, extract] of [
    ['build/index.html', html => html.match(/\/_next\/static\/([^/]+)\/_buildManifest\.js/)?.[1]],
    ['.next/BUILD_ID', text => text.trim()],
  ]) {
    try {
      const id = extract(readFileSync(file, 'utf8'));
      if (id) return id;
    } catch {
      // Try the next location; a missing local build is not an error here.
    }
  }
  return null;
}

const problems = [];

const res = await fetch(site, { headers: { 'Cache-Control': 'no-cache' } });
if (!res.ok) {
  console.error(`✗ ${site} returned HTTP ${res.status}`);
  process.exit(1);
}
const html = await res.text();
console.log(`✓ ${site} → HTTP ${res.status}`);

// Next embeds the build id in the __NEXT_DATA__ payload and in every chunk URL.
const served = html.match(/"buildId":"([^"]+)"/)?.[1]
  ?? html.match(/\/_next\/static\/([^/]+)\/_buildManifest\.js/)?.[1];

if (!served) {
  problems.push('could not find a build id in the served HTML');
} else {
  const local = localBuildId();
  if (!local) {
    console.log(`• served build id ${served} (no local build/ to compare against)`);
  } else if (local === served) {
    console.log(`✓ build id matches local build (${served})`);
  } else {
    problems.push(`build id mismatch: served ${served}, local ${local}`);
  }
}

if (expects.length) {
  const chunks = [...new Set([...html.matchAll(/\/_next\/static\/[^"']+?\.js/g)].map(m => m[0]))];
  const sources = await Promise.all(
    chunks.map(path =>
      fetch(new URL(path, site))
        .then(r => (r.ok ? r.text() : ''))
        .catch(() => '')
    )
  );
  const haystack = sources.join('');
  for (const marker of expects) {
    if (haystack.includes(marker)) {
      console.log(`✓ served JS contains "${marker}"`);
    } else {
      problems.push(`served JS does not contain "${marker}" (checked ${chunks.length} chunks)`);
    }
  }
}

if (problems.length) {
  console.error('\n✗ deploy not verified:');
  for (const p of problems) console.error(`  ${p}`);
  process.exit(1);
}
console.log('\n✓ deploy verified');
