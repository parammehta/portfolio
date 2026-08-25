import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  DEFAULT_RANGE,
  RANGES,
  dashboardQueries,
  normaliseEvent,
  normaliseRange,
} from '../src/queries.js';

test('every range builds every query', () => {
  for (const range of Object.keys(RANGES)) {
    const queries = dashboardQueries(range);
    assert.ok(Object.keys(queries).length >= 18, range);
    for (const [name, sql] of Object.entries(queries)) {
      assert.match(sql, /FROM portfolio_events/, `${range}/${name}`);
    }
  }
});

test('bounded ranges carry a time predicate and a previous window', () => {
  const q = dashboardQueries('7d');
  assert.match(q.totals, /timestamp > now\(\) - INTERVAL '168' HOUR/);
  // The previous window is the immediately preceding stretch of equal length.
  assert.match(q.kpisPrev, /timestamp <= now\(\) - INTERVAL '168' HOUR/);
  assert.match(q.kpisPrev, /timestamp > now\(\) - INTERVAL '336' HOUR/);
});

test('all-time has no predicate and no previous window to compare against', () => {
  const q = dashboardQueries('all');
  assert.doesNotMatch(q.totals, /INTERVAL/);
  assert.doesNotMatch(q.totals, /WHERE/);
  assert.equal(q.kpisPrev, undefined);
});

test('bucketing follows the range', () => {
  assert.match(dashboardQueries('24h').timeseries, /toStartOfHour/);
  assert.match(dashboardQueries('30d').timeseries, /toStartOfDay/);
});

test('an unknown range falls back instead of reaching the SQL', () => {
  const bogus = dashboardQueries("' OR 1=1 --");
  assert.equal(normaliseRange("' OR 1=1 --"), DEFAULT_RANGE);
  assert.deepEqual(bogus, dashboardQueries(DEFAULT_RANGE));
});

test('an event filter off the allowlist is dropped, never interpolated', () => {
  assert.equal(normaliseEvent("nav_link_click'; DROP TABLE x --"), '');
  const q = dashboardQueries('30d', "nav_link_click'; DROP TABLE x --");
  assert.doesNotMatch(q.totals, /DROP TABLE/);
  assert.doesNotMatch(q.totals, /blob1 = /);
});

test('an allowed event filter is applied to the sliceable panels', () => {
  const q = dashboardQueries('30d', 'nav_link_click');
  assert.match(q.totals, /blob1 = 'nav_link_click'/);
  assert.match(q.timeseries, /blob1 = 'nav_link_click'/);
  // The funnel and the theme split would collapse to a single bar if the
  // event filter applied to them, so they deliberately ignore it.
  assert.doesNotMatch(q.funnel, /blob1 = 'nav_link_click'/);
  assert.match(q.theme, /blob1 = 'theme_toggle'/);
});

test('counts are sampling-adjusted, and distinct counts use the one supported spelling', () => {
  const q = dashboardQueries('30d');
  assert.match(q.totals, /sum\(_sample_interval\)/);
  // Analytics Engine rejects uniq/uniqExact/countDistinct as unknown functions.
  assert.match(q.kpis, /count\(DISTINCT blob6\)/);
  for (const sql of Object.values(q)) {
    assert.doesNotMatch(sql, /\buniq\w*\(/i);
    assert.doesNotMatch(sql, /\bconcat\(/i);
  }
});

test('the funnel counts CTA clicks from every entrance, not just the profile', () => {
  const q = dashboardQueries('30d');
  // The old top step read profile_contact_click alone — one of three routes to
  // the form, and not the busy one, so the funnel showed 0 above real
  // submissions. contact_cta_click is emitted by all of them.
  assert.doesNotMatch(q.funnel, /profile_contact_click/);
  assert.match(q.ctaSources, /blob1 = 'contact_cta_click'/);
  // blob5 carries the `source` prop, so the split survives without a new blob.
  assert.match(q.ctaSources, /blob5 AS label/);
});
