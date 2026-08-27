#!/usr/bin/env node
/**
 * Put the site's security headers back on CloudFront, as a response headers
 * policy.
 *
 * These headers used to come from a Lambda@Edge (`functions/headers.js`) on the
 * origin-response event. That function was dropped from `functions/serverless.yml`
 * when the contact API was deployed, and nothing replaced it — the distribution
 * has carried no security headers since. A response headers policy is the right
 * mechanism for a static site anyway: it is native to CloudFront, costs nothing
 * per request, and cannot cold-start or throw.
 *
 * The policy is described here rather than clicked into the console so that the
 * headers the site serves are reviewable in the repo. Re-running is safe: it
 * updates the existing policy in place and only touches the distribution when
 * the policy is not already attached.
 *
 * Usage:
 *   node scripts/deploy-headers-policy.mjs --dry-run   # print the policy, change nothing
 *   node scripts/deploy-headers-policy.mjs
 */
import { execFileSync } from 'node:child_process';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

// The same distribution as scripts/invalidate-cloudfront.js.
const DISTRIBUTION_ID = 'E3E00OKUBAT1AJ';
const POLICY_NAME = 'parammehta-portfolio-security-headers';

/**
 * Values carried over verbatim from the retired Lambda@Edge, so this restores
 * what the site used to serve rather than quietly changing its posture.
 *
 * The CSP is deliberately just `upgrade-insecure-requests` — a real
 * script-src policy needs Next's inline bootstrap, Turnstile and the analytics
 * beacon accounted for, which is its own piece of work.
 */
const policyConfig = {
  Name: POLICY_NAME,
  Comment: 'Security headers for parammehta.com (see scripts/deploy-headers-policy.mjs)',
  SecurityHeadersConfig: {
    StrictTransportSecurity: {
      Override: true,
      AccessControlMaxAgeSec: 63072000,
      IncludeSubdomains: true,
      Preload: true,
    },
    ContentTypeOptions: { Override: true },
    FrameOptions: { Override: true, FrameOption: 'SAMEORIGIN' },
    ReferrerPolicy: { Override: true, ReferrerPolicy: 'no-referrer-when-downgrade' },
    ContentSecurityPolicy: { Override: true, ContentSecurityPolicy: 'upgrade-insecure-requests;' },
    XSSProtection: { Override: true, Protection: true, ModeBlock: true },
  },
};

const dryRun = process.argv.includes('--dry-run');
const scratch = mkdtempSync(path.join(tmpdir(), 'headers-policy-'));

function aws(...args) {
  const out = execFileSync('aws', [...args, '--output', 'json'], {
    encoding: 'utf8',
    maxBuffer: 32 * 1024 * 1024,
  });
  return out.trim() ? JSON.parse(out) : null;
}

/** The CLI takes structured input as `file://`, so each payload gets a temp file. */
function asFile(name, value) {
  const file = path.join(scratch, `${name}.json`);
  writeFileSync(file, JSON.stringify(value));
  return `file://${file}`;
}

function findPolicy() {
  const list = aws('cloudfront', 'list-response-headers-policies', '--type', 'custom');
  const match = (list?.ResponseHeadersPolicyList?.Items ?? []).find(
    item => item.ResponseHeadersPolicy?.ResponseHeadersPolicyConfig?.Name === POLICY_NAME
  );
  return match?.ResponseHeadersPolicy?.Id ?? null;
}

function upsertPolicy() {
  const existing = findPolicy();

  if (!existing) {
    const created = aws(
      'cloudfront',
      'create-response-headers-policy',
      '--response-headers-policy-config',
      asFile('policy', policyConfig)
    );
    console.log(`Created response headers policy ${created.ResponseHeadersPolicy.Id}`);
    return created.ResponseHeadersPolicy.Id;
  }

  const { ETag } = aws('cloudfront', 'get-response-headers-policy', '--id', existing);
  aws(
    'cloudfront',
    'update-response-headers-policy',
    '--id',
    existing,
    '--if-match',
    ETag,
    '--response-headers-policy-config',
    asFile('policy', policyConfig)
  );
  console.log(`Updated response headers policy ${existing}`);
  return existing;
}

function attachPolicy(policyId) {
  const { ETag, DistributionConfig } = aws(
    'cloudfront',
    'get-distribution-config',
    '--id',
    DISTRIBUTION_ID
  );

  if (DistributionConfig.DefaultCacheBehavior.ResponseHeadersPolicyId === policyId) {
    console.log(`Distribution ${DISTRIBUTION_ID} already serves this policy`);
    return;
  }

  DistributionConfig.DefaultCacheBehavior.ResponseHeadersPolicyId = policyId;
  aws(
    'cloudfront',
    'update-distribution',
    '--id',
    DISTRIBUTION_ID,
    '--if-match',
    ETag,
    '--distribution-config',
    asFile('distribution', DistributionConfig)
  );
  console.log(`Attached policy to distribution ${DISTRIBUTION_ID} — edges take a few minutes`);
}

if (dryRun) {
  console.log(JSON.stringify(policyConfig, null, 2));
  console.log(`\nWould attach the above to distribution ${DISTRIBUTION_ID}.`);
  console.log(`Existing policy: ${findPolicy() ?? 'none — would be created'}`);
} else {
  attachPolicy(upsertPolicy());
  console.log('Verify with: curl -sSI https://parammehta.com/ | grep -i strict-transport');
}
