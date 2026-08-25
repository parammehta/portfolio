/**
 * The server-rendered document.
 *
 * The shell is chrome only — every panel is drawn by the client from the
 * bootstrap payload embedded below, so there is exactly one rendering path
 * instead of a server one and a client one that drift apart. The payload is
 * inlined rather than fetched so the first paint has real data with no
 * request waterfall.
 */
import { ALLOWED_EVENTS } from '../ingest.js';
import { DATASET, RANGES } from '../queries.js';
import { STYLES } from './styles.js';
import { CLIENT_JS } from './client.js';

export function esc(value) {
  return String(value ?? '').replace(
    /[&<>"']/g,
    c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]
  );
}

/**
 * Safe to drop inside <script type="application/json">: the only sequence that
 * can end that element early is `</`, and escaping `<` as < keeps the JSON
 * byte-identical once parsed.
 */
function jsonScript(payload) {
  return JSON.stringify(payload).replace(/</g, '\\u003c');
}

function rangeChips(active) {
  return Object.entries(RANGES)
    .map(
      ([key, { label }]) =>
        `<button type="button" class="chip" data-range="${esc(key)}" title="${esc(label)}"
           aria-pressed="${key === active}">${esc(key)}</button>`
    )
    .join('');
}

function eventOptions(active) {
  const options = [...ALLOWED_EVENTS].sort();
  return [
    `<option value=""${active ? '' : ' selected'}>All events</option>`,
    ...options.map(
      name =>
        `<option value="${esc(name)}"${name === active ? ' selected' : ''}>${esc(name)}</option>`
    ),
  ].join('');
}

export function dashboardPage(payload, auth) {
  return `<!doctype html>
<html lang="en"><head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta name="robots" content="noindex" />
<title>Portfolio analytics</title>
<style>${STYLES}</style>
</head><body>
<main>
  <div class="top">
    <h1>Portfolio analytics</h1>
    <span class="meta">dataset <code>${esc(DATASET)}</code>${
      auth?.email ? ` · <strong>${esc(auth.email)}</strong>` : ''
    }</span>
    <span class="spacer"></span>
    <span class="meta">updated <span id="stamp">—</span></span>
  </div>

  <div class="controls">
    <div class="chips" role="group" aria-label="Time range">${rangeChips(payload.range)}</div>
    <label class="sr" for="event">Filter by event</label>
    <select id="event">${eventOptions(payload.event)}</select>
    <span class="spacer"></span>
    <span class="live"><span class="dot" id="autoDot"></span>
      <button type="button" class="btn" id="auto" aria-pressed="false">Auto-refresh</button>
    </span>
    <button type="button" class="btn" id="reload">Refresh</button>
  </div>

  <noscript><p class="qerror">This dashboard renders its panels with JavaScript, which is
    currently disabled.</p></noscript>

  <div class="kpis" id="kpis"></div>

  <section class="panel w12" style="margin-bottom:14px">
    <header>
      <h2>Activity over time</h2>
      <div class="chips" role="group" aria-label="Series">
        <button type="button" class="chip" data-series="events" aria-pressed="true">Events</button>
        <button type="button" class="chip" data-series="visitors" aria-pressed="false">Visitors</button>
      </div>
      <span class="note" id="rangeLabel"></span>
    </header>
    <div class="chart" id="chart"></div>
  </section>

  <div class="grid" id="panels"></div>

  <footer class="page">
    Counts are sampling-adjusted (<code>sum(_sample_interval)</code>); visitor and session
    counts are distinct counts of sampled rows, so they are floors. All times UTC.
  </footer>
</main>
<script type="application/json" id="bootstrap">${jsonScript(payload)}</script>
<script>${CLIENT_JS}</script>
</body></html>`;
}

export function errorPage(title, detail) {
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta name="robots" content="noindex" />
<title>${esc(title)}</title><style>${STYLES}</style></head>
<body><main>
  <div class="top"><h1>${esc(title)}</h1></div>
  <section class="panel w12"><p class="empty">${esc(detail)}</p></section>
</main></body></html>`;
}
