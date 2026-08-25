import { test } from 'node:test';
import assert from 'node:assert/strict';
import { handleEvent } from '../src/ingest.js';

/**
 * `X-Dry-Run: 1` exists so the *deployed* ingest path can be smoke-tested
 * without writing to the dataset — Analytics Engine has no delete API, so
 * every production verification used to leave permanent synthetic rows behind.
 */
function post(body, headers = {}) {
  return new Request('https://worker.example/', {
    method: 'POST',
    headers: { Origin: 'https://parammehta.com', ...headers },
    body: JSON.stringify(body),
  });
}

function spyEnv() {
  const writes = [];
  return { writes, env: { ANALYTICS: { writeDataPoint: p => writes.push(p) } } };
}

test('a normal POST records a data point', async () => {
  const { writes, env } = spyEnv();
  const res = await handleEvent(post({ name: 'nav_link_click', props: { label: 'Resume' } }), env);
  assert.equal(res.status, 204);
  assert.equal(writes.length, 1);
  assert.equal(writes[0].blobs[0], 'nav_link_click');
});

test('a dry run passes every check but records nothing', async () => {
  const { writes, env } = spyEnv();
  const res = await handleEvent(
    post({ name: 'contact_cta_click', props: { source: 'hero' } }, { 'X-Dry-Run': '1' }),
    env
  );
  // Same status as the real thing, so a smoke test exercises the same path.
  assert.equal(res.status, 204);
  assert.equal(res.headers.get('X-Dry-Run'), 'accepted');
  assert.equal(writes.length, 0);
});

test('a dry run still rejects what a real request would reject', async () => {
  const { writes, env } = spyEnv();
  const headers = { 'X-Dry-Run': '1' };

  const forged = await handleEvent(post({ name: 'forged_event' }, headers), env);
  assert.equal(forged.status, 422);

  const badOrigin = new Request('https://worker.example/', {
    method: 'POST',
    headers: { Origin: 'https://evil.example', ...headers },
    body: JSON.stringify({ name: 'nav_link_click' }),
  });
  assert.equal((await handleEvent(badOrigin, env)).status, 403);

  assert.equal(writes.length, 0);
});

test('the source prop lands in the detail blob', async () => {
  const { writes, env } = spyEnv();
  await handleEvent(post({ name: 'contact_cta_click', props: { source: 'hero' } }), env);
  assert.equal(writes[0].blobs[4], 'hero');
});
