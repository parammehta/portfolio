#!/usr/bin/env bash
#
# Everything CI will run, in one command that cannot half-pass.
#
# `set -euo pipefail` matters here: without it a failing step inside a pipeline
# still reports the exit code of the *last* command, which is how a broken
# `next build` once reported success. Every step below is checked.
#
# Usage: npm run preflight            (skips the live SQL check)
#        CF_API_TOKEN=... npm run preflight
set -euo pipefail

cd "$(dirname "$0")/.."

step() { printf '\n\033[1m▸ %s\033[0m\n' "$1"; }

# Stale node_modules produce failures that look exactly like source bugs — a
# local install lagging the lockfile once made `main` look broken for an hour.
# Cheapest possible check, so it goes first.
step "dependency freshness"
node --input-type=module -e "
import { readFileSync } from 'node:fs';
const lock = JSON.parse(readFileSync('package-lock.json', 'utf8'));
const stale = [];
for (const [path, entry] of Object.entries(lock.packages)) {
  if (!path.startsWith('node_modules/') || !entry.version) continue;
  let installed;
  try {
    installed = JSON.parse(readFileSync(path + '/package.json', 'utf8')).version;
  } catch { continue; }          // optional/platform deps are allowed to be absent
  if (installed !== entry.version) stale.push(path.replace('node_modules/', '') + ': installed ' + installed + ', lockfile ' + entry.version);
}
if (stale.length) {
  console.error('node_modules is out of sync with package-lock.json:');
  for (const line of stale) console.error('  ' + line);
  console.error('\nRun: npm ci');
  process.exit(1);
}
console.log('node_modules matches package-lock.json');
"

step "lint";           npm run lint
step "stylelint";      npm run stylelint
step "typecheck";      npm run typecheck
step "unit tests";     npm run test:unit
step "integration";    npm run test:integration
step "worker tests";   (cd worker && npm test)

if [ -n "${CF_API_TOKEN:-}" ]; then
  step "worker SQL (live, every range)"; (cd worker && npm run verify)
else
  printf '\n\033[2m▸ worker SQL — skipped (set CF_API_TOKEN to include it)\033[0m\n'
fi

step "build + e2e";    npm run test:e2e

printf '\n\033[32m✓ preflight passed\033[0m\n'
