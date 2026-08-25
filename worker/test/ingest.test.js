import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ALLOWED_EVENTS, pagePath, parseUserAgent } from '../src/ingest.js';

test('parseUserAgent keeps the most-specific browser check first', () => {
  // Every Edge UA also says "Chrome"; every Chrome UA also says "Safari"; and
  // iOS Chrome/Firefox say neither (they are CriOS/FxiOS on top of WebKit).
  // Ordering is the whole implementation, so these are the cases that matter.
  const cases = [
    ['Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36 Edg/120', 'Edge'],
    ['Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/120 Safari/537.36', 'Chrome'],
    ['Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 Version/17.0 Safari/605.1.15', 'Safari'],
    ['Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 CriOS/120 Mobile/15E148 Safari/604.1', 'Chrome'],
    ['Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 FxiOS/120 Mobile/15E148 Safari/604.1', 'Firefox'],
    ['Mozilla/5.0 (X11; Linux x86_64; rv:120.0) Gecko/20100101 Firefox/120.0', 'Firefox'],
    ['Mozilla/5.0 (Windows NT 10.0) AppleWebKit/537.36 Chrome/120 Safari/537.36 OPR/106', 'Opera'],
  ];
  for (const [ua, browser] of cases) {
    assert.equal(parseUserAgent(ua).browser, browser, ua);
  }
});

test('parseUserAgent classifies device and OS', () => {
  const iphone =
    'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Version/17.0 Mobile/15E148 Safari/604.1';
  const ipad = 'Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Version/17.0 Safari/604.1';
  const androidPhone =
    'Mozilla/5.0 (Linux; Android 13; SM-S901B) AppleWebKit/537.36 Chrome/120 Mobile Safari/537.36';
  // An Android tablet is exactly an Android UA *without* "Mobile" in it.
  const androidTablet =
    'Mozilla/5.0 (Linux; Android 13; SM-X700) AppleWebKit/537.36 Chrome/120 Safari/537.36';
  const mac = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/120 Safari/537.36';

  assert.deepEqual(parseUserAgent(iphone), { device: 'mobile', browser: 'Safari', os: 'iOS' });
  assert.equal(parseUserAgent(ipad).device, 'tablet');
  assert.equal(parseUserAgent(androidPhone).device, 'mobile');
  assert.equal(parseUserAgent(androidTablet).device, 'tablet');
  assert.equal(parseUserAgent(mac).device, 'desktop');
  assert.equal(parseUserAgent(mac).os, 'macOS');
});

test('parseUserAgent trusts Sec-CH-UA-Mobile over the UA string', () => {
  // Chromium's client hint is authoritative where it exists; a desktop-looking
  // UA with ?1 is a mobile browser requesting a desktop site.
  const ua = 'Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 Chrome/120 Safari/537.36';
  assert.equal(parseUserAgent(ua, '?1').device, 'mobile');
});

test('parseUserAgent returns empty fields for a missing UA', () => {
  assert.deepEqual(parseUserAgent(''), { device: '', browser: '', os: '' });
});

test('pagePath keeps only the path, and survives a junk Referer', () => {
  assert.equal(pagePath('https://parammehta.com/resume/?utm=x#top'), '/resume/');
  assert.equal(pagePath('not a url'), '');
  assert.equal(pagePath(''), '');
});

test('the allowlist covers the events that were previously dropped', () => {
  // These two were emitted by the site and 422'd by the Worker. The real guard
  // is src/utils/analyticsEvents.test.ts, which compares the whole list.
  assert.ok(ALLOWED_EVENTS.has('scheduling_open'));
  assert.ok(ALLOWED_EVENTS.has('home_experience_slide'));
});

test('the CTA event replaced the profile-only one on the allowlist', () => {
  assert.ok(ALLOWED_EVENTS.has('contact_cta_click'));
  assert.ok(!ALLOWED_EVENTS.has('profile_contact_click'));
});
