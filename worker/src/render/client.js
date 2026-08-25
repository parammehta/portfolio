/**
 * The dashboard's client app, inlined into the page as a <script>.
 *
 * Deliberately plain: no framework, no bundler, no build step for the Worker.
 * Written without template literals so it can live inside one — the file is a
 * single exported string.
 *
 * Every data-bearing node is built with createElement/createElementNS and set
 * via textContent, so values from the dataset are never parsed as markup.
 * There is no innerHTML in here at all, which is what makes escaping
 * structural rather than something a future panel can forget.
 */
export const CLIENT_JS = `
(function () {
  'use strict';

  var boot = JSON.parse(document.getElementById('bootstrap').textContent);
  var state = {
    range: boot.range,
    event: boot.event,
    series: 'events',
    auto: false,
    payload: boot
  };
  var controller = null;
  var timer = null;

  var nf = new Intl.NumberFormat('en-US');
  function n(v) { return nf.format(Number(v) || 0); }
  function toNum(v) { return Number(v) || 0; }

  // ---- tiny DOM helpers -------------------------------------------------
  var SVGNS = 'http://www.w3.org/2000/svg';

  function el(tag, cls, text) {
    var node = document.createElement(tag);
    if (cls) node.className = cls;
    if (text !== undefined && text !== null) node.textContent = String(text);
    return node;
  }
  function svg(tag, attrs) {
    var node = document.createElementNS(SVGNS, tag);
    for (var k in attrs) if (attrs[k] !== undefined) node.setAttribute(k, attrs[k]);
    return node;
  }
  function clear(node) { while (node.firstChild) node.removeChild(node.firstChild); }

  // ---- shared tooltip ---------------------------------------------------
  var tip = el('div', 'tooltip');
  document.body.appendChild(tip);

  function showTip(html, x, y) {
    clear(tip);
    for (var i = 0; i < html.length; i++) {
      if (i) tip.appendChild(document.createElement('br'));
      var line = html[i];
      if (Array.isArray(line)) {
        tip.appendChild(document.createTextNode(line[0]));
        tip.appendChild(el('b', null, line[1]));
      } else {
        tip.appendChild(document.createTextNode(line));
      }
    }
    tip.style.left = x + 'px';
    tip.style.top = (y - 8) + 'px';
    tip.classList.add('on');
  }
  function hideTip() { tip.classList.remove('on'); }

  // Any element can carry a tooltip; hover for mouse, focus for keyboard and
  // touch (a tap focuses a tabindex=0 node, and there is no hover on touch).
  function attachTip(node, lines) {
    function show() {
      var r = node.getBoundingClientRect();
      showTip(lines, r.left + r.width / 2, r.top);
    }
    node.addEventListener('mouseenter', show);
    node.addEventListener('focus', show);
    node.addEventListener('mouseleave', hideTip);
    node.addEventListener('blur', hideTip);
  }

  // ---- time -------------------------------------------------------------
  // Analytics Engine returns 'YYYY-MM-DD HH:MM:SS' in UTC; everything on this
  // page stays UTC so the heatmap's toHour/toDayOfWeek agree with the chart.
  function parseTs(s) { return Date.parse(String(s).replace(' ', 'T') + 'Z'); }

  var MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  function fmtDay(ms) {
    var d = new Date(ms);
    return MONTHS[d.getUTCMonth()] + ' ' + d.getUTCDate();
  }
  function fmtHour(ms) {
    var d = new Date(ms);
    return String(d.getUTCHours()).padStart(2, '0') + ':00';
  }
  function fmtFull(ms, bucket) {
    return bucket === 'hour'
      ? fmtDay(ms) + ' ' + fmtHour(ms) + ' UTC'
      : fmtDay(ms) + ' UTC';
  }
  function fmtClock(ms) {
    var d = new Date(ms);
    return String(d.getUTCHours()).padStart(2, '0') + ':' +
           String(d.getUTCMinutes()).padStart(2, '0') + ':' +
           String(d.getUTCSeconds()).padStart(2, '0');
  }

  /**
   * Expands the query's sparse rows (it only returns buckets that *have*
   * events) into one entry per bucket across the whole window, zero-filling
   * the gaps. Without this the x-axis is an index, not a date: two days a week
   * apart plot as adjacent points and a straight rising line, which reads as
   * steady growth that never happened.
   */
  function fillSeries(rows, bucket, hours) {
    var step = bucket === 'hour' ? 3600000 : 86400000;
    var byTime = {};
    var earliest = Infinity;
    rows.forEach(function (r) {
      var t = parseTs(r.bucket);
      if (isNaN(t)) return;
      byTime[t] = r;
      if (t < earliest) earliest = t;
    });

    var end = Math.floor(Date.now() / step) * step;
    var start;
    if (hours) start = end - (Math.ceil((hours * 3600000) / step) - 1) * step;
    else if (earliest === Infinity) start = end;
    else start = earliest;

    // "All time" is unbounded by definition; cap the point count so a long
    // history degrades to a wide chart rather than tens of thousands of nodes.
    var count = Math.floor((end - start) / step) + 1;
    if (count > 400) { start = end - 399 * step; count = 400; }

    var out = [];
    for (var i = 0; i < count; i++) {
      var t = start + i * step;
      var row = byTime[t];
      out.push({ t: t, n: row ? toNum(row.n) : 0, visitors: row ? toNum(row.visitors) : 0 });
    }
    return out;
  }

  // ---- panel plumbing ---------------------------------------------------
  function panelBody(key, node) {
    var errors = state.payload.errors || {};
    if (errors[key]) {
      var p = el('p', 'qerror');
      p.textContent = 'Query failed: ' + errors[key];
      return p;
    }
    return node();
  }
  function rows(key) { return (state.payload.data && state.payload.data[key]) || []; }
  function firstRow(key) { return rows(key)[0] || null; }

  function empty(msg) { return el('p', 'empty', msg || 'No data in this range.'); }

  function makePanel(width, title, note) {
    var section = el('section', 'panel' + (width ? ' ' + width : ''));
    var head = el('header');
    head.appendChild(el('h2', null, title));
    if (note) head.appendChild(el('span', 'note', note));
    section.appendChild(head);
    var body = el('div');
    section.appendChild(body);
    return { section: section, body: body, head: head };
  }

  // ---- bar list (single hue: magnitude, with the label always visible) ---
  function barList(list, opts) {
    opts = opts || {};
    if (!list.length) return empty(opts.emptyMsg);
    var max = list.reduce(function (m, r) { return Math.max(m, toNum(r.n)); }, 0) || 1;
    var total = list.reduce(function (s, r) { return s + toNum(r.n); }, 0);
    var ul = el('ul', 'bars');

    list.forEach(function (r) {
      var value = toNum(r.n);
      var li = el('li');

      var lbl = el('span', 'lbl');
      var inner = el('span', null, opts.label ? opts.label(r) : (r.label || '—'));
      lbl.appendChild(inner);
      lbl.tabIndex = 0;
      attachTip(lbl, [String(opts.label ? opts.label(r) : (r.label || '—')),
                      ['', n(value) + (total ? ' · ' + ((value / total) * 100).toFixed(1) + '%' : '')]]);
      li.appendChild(lbl);

      var track = el('span', 'track');
      var fill = el('span', 'fill');
      fill.style.width = ((value / max) * 100).toFixed(1) + '%';
      track.appendChild(fill);
      li.appendChild(track);

      var val = el('span', 'n num', n(value));
      li.appendChild(val);
      ul.appendChild(li);
    });
    return ul;
  }

  // ---- segmented bar (categorical: identity inside one mark) ------------
  var CATS = ['var(--cat1)', 'var(--cat2)', 'var(--cat3)'];

  function segmented(list, opts) {
    opts = opts || {};
    if (!list.length) return empty(opts.emptyMsg);
    var total = list.reduce(function (s, r) { return s + toNum(r.n); }, 0);
    if (!total) return empty(opts.emptyMsg);

    var wrap = el('div');
    var bar = el('div', 'seg');
    var legend = el('div', 'legend');

    list.slice(0, 3).forEach(function (r, i) {
      var value = toNum(r.n);
      var pct = (value / total) * 100;

      var seg = el('span');
      seg.style.background = CATS[i];
      seg.style.width = pct.toFixed(2) + '%';
      seg.tabIndex = 0;
      attachTip(seg, [String(r.label), ['', n(value) + ' · ' + pct.toFixed(1) + '%']]);
      bar.appendChild(seg);

      // Every segment is also direct-labelled in the legend, so identity never
      // rests on colour alone (and the light-mode contrast relief is met).
      var item = el('span', 'item');
      var sw = el('i', 'swatch');
      sw.style.background = CATS[i];
      item.appendChild(sw);
      item.appendChild(document.createTextNode(r.label));
      item.appendChild(el('span', 'n', n(value) + ' · ' + pct.toFixed(0) + '%'));
      legend.appendChild(item);
    });

    wrap.appendChild(bar);
    wrap.appendChild(legend);
    if (opts.foot) {
      var f = el('p', 'foot');
      f.appendChild(document.createTextNode(opts.foot));
      wrap.appendChild(f);
    }
    return wrap;
  }

  // ---- KPI tiles --------------------------------------------------------
  function delta(current, previous) {
    var span = el('span', 'delta');
    if (previous === null || previous === undefined) {
      span.className = 'delta flat';
      span.textContent = '—';
      return span;
    }
    if (!previous) {
      span.className = 'delta ' + (current ? 'up' : 'flat');
      span.textContent = current ? 'new' : '—';
      return span;
    }
    var change = ((current - previous) / previous) * 100;
    var up = change >= 0;
    span.className = 'delta ' + (Math.abs(change) < 0.5 ? 'flat' : (up ? 'up' : 'down'));
    span.textContent = (up ? '▲ +' : '▼ −') + Math.abs(change).toFixed(0) + '%';
    return span;
  }

  function kpiTile(cap, value, current, previous, hint, isText) {
    var tile = el('div', 'kpi');
    tile.appendChild(el('div', 'cap', cap));
    // A name (top event) is not a figure: it gets its own smaller step so a
    // long event name doesn't break mid-word in a narrow tile.
    tile.appendChild(el('div', isText ? 'val text' : 'val num', value));
    var sub = el('div', 'sub');
    if (current !== undefined) {
      sub.appendChild(delta(current, previous));
      sub.appendChild(document.createTextNode(hint || 'vs previous'));
    } else if (hint) {
      sub.appendChild(document.createTextNode(hint));
    }
    tile.appendChild(sub);
    return tile;
  }

  function renderKpis() {
    var host = document.getElementById('kpis');
    clear(host);

    var errors = state.payload.errors || {};
    if (errors.kpis) {
      var box = el('div', 'kpi');
      box.appendChild(el('p', 'qerror', 'Query failed: ' + errors.kpis));
      host.appendChild(box);
      return;
    }

    var cur = firstRow('kpis') || {};
    var prev = firstRow('kpisPrev');
    var events = toNum(cur.events);
    var visitors = toNum(cur.visitors);
    var sessions = toNum((firstRow('sessions') || {}).sessions);
    var prevEvents = prev ? toNum(prev.events) : null;
    var prevVisitors = prev ? toNum(prev.visitors) : null;

    var visitorRows = rows('visitors');
    var returning = visitorRows.filter(function (v) {
      return String(v.first_seen).slice(0, 10) !== String(v.last_seen).slice(0, 10);
    }).length;

    var top = rows('totals')[0];

    host.appendChild(kpiTile('Events', n(events), events, prevEvents));
    host.appendChild(kpiTile('Visitors', n(visitors), visitors, prevVisitors));
    host.appendChild(kpiTile('Sessions', sessions ? n(sessions) : '—', undefined,
      undefined, sessions ? 'distinct tabs' : 'not yet captured'));
    host.appendChild(kpiTile('Events / visitor',
      visitors ? (events / visitors).toFixed(1) : '—', undefined, undefined, 'in range'));
    host.appendChild(kpiTile('Returning',
      visitorRows.length ? Math.round((returning / visitorRows.length) * 100) + '%' : '—',
      undefined, undefined, returning + ' of ' + visitorRows.length + ' visitors'));
    host.appendChild(kpiTile('Top event', top ? top.label : '—', undefined, undefined,
      top ? n(top.n) + ' events' : 'no events', true));
  }

  // ---- time-series chart ------------------------------------------------
  function niceMax(value) {
    if (value <= 5) return 5;
    var mag = Math.pow(10, Math.floor(Math.log10(value)));
    var norm = value / mag;
    var step = norm <= 1 ? 1 : norm <= 2 ? 2 : norm <= 5 ? 5 : 10;
    return step * mag;
  }

  function renderChart() {
    var host = document.getElementById('chart');
    clear(host);

    var errors = state.payload.errors || {};
    if (errors.timeseries) {
      host.appendChild(el('p', 'qerror', 'Query failed: ' + errors.timeseries));
      return;
    }

    var meta = state.payload.meta;
    var series = fillSeries(rows('timeseries'), meta.bucket, meta.hours);
    if (!series.length) { host.appendChild(empty()); return; }

    var key = state.series === 'visitors' ? 'visitors' : 'n';
    var width = Math.max(host.clientWidth || 900, 320);
    var height = 240;
    var padL = 42, padR = 10, padT = 14, padB = 24;
    var plotW = width - padL - padR;
    var plotH = height - padT - padB;

    var peakValue = series.reduce(function (m, d) { return Math.max(m, d[key]); }, 0);
    var top = niceMax(peakValue);
    var x = function (i) { return padL + (series.length === 1 ? plotW / 2 : (i / (series.length - 1)) * plotW); };
    var y = function (v) { return padT + plotH - (v / top) * plotH; };

    var s = svg('svg', { width: width, height: height, role: 'img' });
    s.setAttribute('aria-label',
      (state.series === 'visitors' ? 'Visitors' : 'Events') + ' per ' + meta.bucket +
      ', ' + series.length + ' buckets');

    // Recessive gridlines + y ticks.
    [0, 0.5, 1].forEach(function (f) {
      var value = top * f;
      var yy = Math.round(y(value)) + 0.5;
      var line = svg('line', { x1: padL, x2: padL + plotW, y1: yy, y2: yy,
        'class': f === 0 ? 'baseline' : 'gridline' });
      s.appendChild(line);
      var label = svg('text', { x: padL - 8, y: yy + 3, 'text-anchor': 'end', 'class': 'tick' });
      label.textContent = n(Math.round(value));
      s.appendChild(label);
    });

    // ~6 x labels, always including the last bucket.
    var every = Math.max(1, Math.ceil(series.length / 6));
    series.forEach(function (d, i) {
      if (i % every !== 0 && i !== series.length - 1) return;
      var label = svg('text', { x: x(i), y: height - 6, 'text-anchor': 'middle', 'class': 'tick' });
      label.textContent = meta.bucket === 'hour' ? fmtHour(d.t) : fmtDay(d.t);
      s.appendChild(label);
    });

    var linePoints = series.map(function (d, i) { return x(i).toFixed(1) + ',' + y(d[key]).toFixed(1); });
    var areaD = 'M' + x(0).toFixed(1) + ',' + y(0).toFixed(1) + ' L' +
      linePoints.join(' L') + ' L' + x(series.length - 1).toFixed(1) + ',' + y(0).toFixed(1) + ' Z';
    s.appendChild(svg('path', { d: areaD, 'class': 'area' }));
    s.appendChild(svg('polyline', { points: linePoints.join(' '), 'class': 'line' }));

    // Direct-label the peak and the latest bucket only — never every point.
    var peakIndex = 0;
    series.forEach(function (d, i) { if (d[key] > series[peakIndex][key]) peakIndex = i; });
    [peakIndex, series.length - 1].forEach(function (i) {
      if (!series[i][key]) return;
      s.appendChild(svg('circle', { cx: x(i), cy: y(series[i][key]), r: 4, 'class': 'marker' }));
    });

    var crosshair = svg('line', { x1: 0, x2: 0, y1: padT, y2: padT + plotH, 'class': 'crosshair' });
    crosshair.style.display = 'none';
    s.appendChild(crosshair);
    var cursor = svg('circle', { cx: 0, cy: 0, r: 4, 'class': 'marker' });
    cursor.style.display = 'none';
    s.appendChild(cursor);

    var hit = svg('rect', { x: padL, y: padT, width: plotW, height: plotH, 'class': 'hit' });
    s.appendChild(hit);

    hit.addEventListener('mousemove', function (event) {
      var box = s.getBoundingClientRect();
      var px = event.clientX - box.left;
      var i = series.length === 1 ? 0
        : Math.round(((px - padL) / plotW) * (series.length - 1));
      i = Math.min(series.length - 1, Math.max(0, i));
      var d = series[i];
      crosshair.setAttribute('x1', x(i));
      crosshair.setAttribute('x2', x(i));
      crosshair.style.display = '';
      cursor.setAttribute('cx', x(i));
      cursor.setAttribute('cy', y(d[key]));
      cursor.style.display = '';
      showTip([
        fmtFull(d.t, meta.bucket),
        ['events ', n(d.n)],
        ['visitors ', n(d.visitors)]
      ], box.left + x(i), box.top + y(d[key]));
    });
    hit.addEventListener('mouseleave', function () {
      crosshair.style.display = 'none';
      cursor.style.display = 'none';
      hideTip();
    });

    host.appendChild(s);

    var caption = el('p', 'foot');
    var peak = series[peakIndex];
    var latest = series[series.length - 1];
    caption.appendChild(document.createTextNode('Peak '));
    caption.appendChild(el('strong', null, n(peak[key])));
    caption.appendChild(document.createTextNode(' on ' + fmtFull(peak.t, meta.bucket) + ' · latest '));
    caption.appendChild(el('strong', null, n(latest[key])));
    caption.appendChild(document.createTextNode(' on ' + fmtFull(latest.t, meta.bucket)));
    host.appendChild(caption);
  }

  // ---- funnel (ordinal ramp) -------------------------------------------
  var ORD = ['var(--ord1)', 'var(--ord2)', 'var(--ord3)', 'var(--ord4)'];

  function renderFunnel() {
    var by = {};
    rows('funnel').forEach(function (r) { by[r.label] = toNum(r.n); });

    // The CTA click is the top of the funnel: it is what gets someone to the
    // form at all, so the interesting drop-off is clicked -> submitted.
    var steps = [
      { label: 'CTA clicked', n: by.profile_contact_click || 0 },
      { label: 'Submitted', n: by.contact_submit || 0 },
      { label: 'Succeeded', n: by.contact_success || 0 }
    ];
    var failed = by.contact_error || 0;
    if (!steps[0].n && !steps[1].n && !steps[2].n && !failed) return empty();

    var max = Math.max(steps[0].n, steps[1].n, steps[2].n, 1);
    var wrap = el('div', 'funnel');

    steps.forEach(function (step, i) {
      var row = el('div', 'step');
      row.appendChild(el('span', 'lbl', step.label));
      var track = el('span', 'track');
      var fill = el('span', 'fill');
      fill.style.width = ((step.n / max) * 100).toFixed(1) + '%';
      fill.style.background = ORD[i];
      track.appendChild(fill);
      row.appendChild(track);
      row.appendChild(el('span', 'n num', n(step.n)));
      wrap.appendChild(row);

      if (i < steps.length - 1) {
        var next = steps[i + 1].n;
        var pct = step.n ? ((next / step.n) * 100).toFixed(0) + '%' : '—';
        wrap.appendChild(el('div', 'drop', '↳ ' + pct + ' continue'));
      }
    });

    var foot = el('p', 'foot');
    foot.appendChild(document.createTextNode('Failed submissions: '));
    foot.appendChild(el('strong', null, n(failed)));
    var out = el('div');
    out.appendChild(wrap);
    out.appendChild(foot);
    return out;
  }

  // ---- heatmap (sequential ramp) ---------------------------------------
  var DOW = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  var SEQ = ['var(--seq1)', 'var(--seq2)', 'var(--seq3)', 'var(--seq4)', 'var(--seq5)'];

  function renderHeatmap() {
    var list = rows('activity');
    if (!list.length) return empty();

    // toDayOfWeek is 1 (Mon)..7 (Sun); toHour is 0..23.
    var grid = [];
    for (var d = 0; d < 7; d++) grid.push(new Array(24).fill(0));
    var max = 0;
    list.forEach(function (r) {
      var day = Number(r.dow), hour = Number(r.hour), value = toNum(r.n);
      if (day >= 1 && day <= 7 && hour >= 0 && hour <= 23) {
        grid[day - 1][hour] = value;
        if (value > max) max = value;
      }
    });
    if (!max) return empty();

    var wrap = el('div');
    var heat = el('div', 'heat');

    var header = el('div', 'heat-row');
    header.appendChild(el('div', 'heat-lbl'));
    for (var h = 0; h < 24; h++) header.appendChild(el('div', 'heat-hr', h % 3 === 0 ? h : ''));
    heat.appendChild(header);

    grid.forEach(function (hours, dayIndex) {
      var row = el('div', 'heat-row');
      row.appendChild(el('div', 'heat-lbl', DOW[dayIndex]));
      hours.forEach(function (value, hour) {
        var cell = el('div', 'heat-cell');
        if (value > 0) {
          // Five discrete steps rather than a continuous alpha: adjacent
          // intensities are only distinguishable when the steps are coarse.
          var step = Math.min(4, Math.floor((value / max) * 5 - 1e-9));
          cell.style.background = SEQ[Math.max(0, step)];
          cell.tabIndex = 0;
          attachTip(cell, [DOW[dayIndex] + ' ' + String(hour).padStart(2, '0') + ':00 UTC',
                           ['', n(value) + ' events']]);
        }
        row.appendChild(cell);
      });
      heat.appendChild(row);
    });

    wrap.appendChild(heat);

    var key = el('div', 'heat-key');
    key.appendChild(document.createTextNode('0'));
    var zero = el('i');
    zero.style.background = 'var(--grid)';
    key.appendChild(zero);
    SEQ.forEach(function (colour) {
      var box = el('i');
      box.style.background = colour;
      key.appendChild(box);
    });
    key.appendChild(document.createTextNode(n(max) + ' events · UTC'));
    wrap.appendChild(key);
    return wrap;
  }

  // ---- recent events table ---------------------------------------------
  function renderRecent() {
    var list = rows('recent');
    if (!list.length) return empty();

    var wrap = el('div', 'tablewrap');
    var table = el('table');
    var thead = el('thead');
    var hrow = el('tr');
    ['Time (UTC)', 'Event', 'Detail', 'Page', 'Country', 'Device'].forEach(function (h) {
      hrow.appendChild(el('th', null, h));
    });
    thead.appendChild(hrow);
    table.appendChild(thead);

    var tbody = el('tbody');
    list.forEach(function (r) {
      var tr = el('tr');
      var ts = parseTs(r.timestamp);
      tr.appendChild(el('td', 'num', isNaN(ts) ? '—' : fmtDay(ts) + ' ' + fmtClock(ts)));
      tr.appendChild(el('td', 'mono', r.event || '—'));
      [r.detail, r.page].forEach(function (value) {
        var td = el('td');
        var span = el('span', 'trunc', value || '—');
        span.title = value || '';
        td.appendChild(span);
        tr.appendChild(td);
      });
      tr.appendChild(el('td', null, flag(r.country)));
      tr.appendChild(el('td', null, r.device || '—'));
      tbody.appendChild(tr);
    });
    table.appendChild(tbody);
    wrap.appendChild(table);
    return wrap;
  }

  /** ISO-3166 alpha-2 -> regional indicator pair, plus the code itself. */
  function flag(code) {
    if (!code || code.length !== 2 || !/^[A-Za-z]{2}$/.test(code)) return code || '—';
    var upper = code.toUpperCase();
    var emoji = String.fromCodePoint(
      0x1f1e6 + upper.charCodeAt(0) - 65,
      0x1f1e6 + upper.charCodeAt(1) - 65
    );
    return emoji + ' ' + upper;
  }

  // ---- coverage notes for the late-added dimensions ---------------------
  function coverageNote(field) {
    var cov = firstRow('coverage');
    if (!cov) return '';
    var total = toNum(cov.total);
    var have = toNum(cov[field]);
    if (!total) return '';
    if (have >= total) return '';
    if (!have) return 'not captured in this range';
    return Math.round((have / total) * 100) + '% of events';
  }

  // ---- panel definitions ------------------------------------------------
  // One spec per panel keeps the layout readable and the render loop dumb.
  var PANELS = [
    { key: 'totals', width: 'w6', title: 'Events by name',
      render: function () { return barList(rows('totals').slice(0, 10)); } },
    { key: 'interactions', width: 'w6', title: 'Top interactions',
      render: function () { return barList(rows('interactions')); } },
    { key: 'pages', width: null, title: 'Top pages',
      render: function () { return barList(rows('pages')); } },
    { key: 'countries', width: null, title: 'Top countries',
      render: function () { return barList(rows('countries'), { label: function (r) { return flag(r.label); } }); } },
    { key: 'sources', width: null, title: 'Traffic sources',
      note: function () { return coverageNote('with_source'); },
      render: function () {
        return barList(rows('sources'), { emptyMsg: 'No external referrers recorded yet.' });
      } },
    { key: 'devices', width: null, title: 'Devices',
      note: function () { return coverageNote('with_device'); },
      render: function () {
        return segmented(rows('devices'), { emptyMsg: 'Device data starts from the schema update.' });
      } },
    { key: 'browsers', width: null, title: 'Browsers',
      render: function () { return barList(rows('browsers'), { emptyMsg: 'Browser data starts from the schema update.' }); } },
    { key: 'os', width: null, title: 'Operating systems',
      render: function () { return barList(rows('os'), { emptyMsg: 'OS data starts from the schema update.' }); } },
    { key: 'funnel', width: null, title: 'Contact funnel', note: 'all events',
      render: renderFunnel },
    { key: 'visitors', width: null, title: 'New vs returning',
      render: function () {
        var list = rows('visitors');
        if (!list.length) return empty();
        var returning = list.filter(function (v) {
          return String(v.first_seen).slice(0, 10) !== String(v.last_seen).slice(0, 10);
        }).length;
        return segmented(
          [{ label: 'New', n: list.length - returning }, { label: 'Returning', n: returning }],
          { foot: 'Returning = seen on more than one day. ' + n(list.length) + ' unique visitors.' }
        );
      } },
    { key: 'theme', width: null, title: 'Theme chosen', note: 'theme_toggle',
      render: function () {
        return segmented(rows('theme'), { emptyMsg: 'No theme toggles in this range.' });
      } },
    { key: 'errorReasons', width: null, title: 'Contact errors', note: 'contact_error',
      render: function () { return barList(rows('errorReasons'), { emptyMsg: 'No submission errors — good.' }); } },
    { key: 'activity', width: 'w12', title: 'Activity by day & hour', render: renderHeatmap },
    { key: 'recent', width: 'w12', title: 'Recent events', note: 'latest 50',
      render: renderRecent }
  ];

  function renderPanels() {
    var host = document.getElementById('panels');
    clear(host);
    PANELS.forEach(function (spec) {
      var note = typeof spec.note === 'function' ? spec.note() : spec.note;
      var p = makePanel(spec.width, spec.title, note);
      p.body.appendChild(panelBody(spec.key, spec.render));
      host.appendChild(p.section);
    });
  }

  // ---- top-level render -------------------------------------------------
  function render() {
    renderKpis();
    renderChart();
    renderPanels();

    document.getElementById('stamp').textContent =
      fmtClock(Date.parse(state.payload.generatedAt)) + ' UTC';

    var meta = state.payload.meta;
    document.getElementById('rangeLabel').textContent =
      meta.label + ' · ' + (meta.bucket === 'hour' ? 'hourly' : 'daily') + ' buckets';

    document.querySelectorAll('[data-range]').forEach(function (b) {
      b.setAttribute('aria-pressed', String(b.dataset.range === state.range));
    });
    document.querySelectorAll('[data-series]').forEach(function (b) {
      b.setAttribute('aria-pressed', String(b.dataset.series === state.series));
    });
  }

  // ---- data fetching ----------------------------------------------------
  function url() {
    var q = new URLSearchParams({ range: state.range });
    if (state.event) q.set('event', state.event);
    return '/dashboard/data?' + q.toString();
  }

  function refresh() {
    if (controller) controller.abort();
    controller = new AbortController();
    document.body.classList.add('loading');

    fetch(url(), { signal: controller.signal, headers: { Accept: 'application/json' } })
      .then(function (res) {
        if (!res.ok) throw new Error('HTTP ' + res.status);
        return res.json();
      })
      .then(function (payload) {
        state.payload = payload;
        state.range = payload.range;
        state.event = payload.event;
        render();
      })
      .catch(function (error) {
        if (error.name === 'AbortError') return;
        document.getElementById('stamp').textContent = 'refresh failed (' + error.message + ')';
      })
      .then(function () { document.body.classList.remove('loading'); });
  }

  function syncUrl() {
    var q = new URLSearchParams({ range: state.range });
    if (state.event) q.set('event', state.event);
    history.replaceState(null, '', '/dashboard?' + q.toString());
  }

  function setAuto(on) {
    state.auto = on;
    var btn = document.getElementById('auto');
    btn.setAttribute('aria-pressed', String(on));
    document.getElementById('autoDot').classList.toggle('on', on);
    if (timer) { clearInterval(timer); timer = null; }
    if (on) timer = setInterval(refresh, 60000);
  }

  // ---- wiring -----------------------------------------------------------
  document.querySelectorAll('[data-range]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      if (state.range === btn.dataset.range) return;
      state.range = btn.dataset.range;
      syncUrl();
      refresh();
    });
  });

  document.querySelectorAll('[data-series]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      state.series = btn.dataset.series;
      render();
    });
  });

  document.getElementById('event').addEventListener('change', function (e) {
    state.event = e.target.value;
    syncUrl();
    refresh();
  });

  document.getElementById('reload').addEventListener('click', refresh);
  document.getElementById('auto').addEventListener('click', function () { setAuto(!state.auto); });

  // Re-render on resize: the chart is drawn at pixel size (not a scaled
  // viewBox) so its text stays at one size and the hit areas stay accurate.
  var resizeTimer = null;
  window.addEventListener('resize', function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(renderChart, 120);
  });

  render();
})();
`;
