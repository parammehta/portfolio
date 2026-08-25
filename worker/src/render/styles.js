/**
 * Dashboard stylesheet, inlined into the document head.
 *
 * Colour roles come from the validated data-viz palette rather than being
 * picked by eye — see the notes on each block. Light and dark are *selected*
 * sets, not an automatic flip: the dark steps are the same hues re-stepped for
 * the dark surface. There is no theme toggle; it follows the OS.
 */
export const STYLES = `
:root {
  color-scheme: light dark;

  /* Chrome & ink */
  --plane:#f9f9f7; --surface:#fcfcfb; --raise:#f1f1ee;
  --ink:#0b0b0b; --ink2:#52514e; --muted:#898781;
  --grid:#e1e0d9; --axis:#c3c2b7; --border:rgba(11,11,11,.10);

  /* Single accent: one hue for every magnitude mark (bar lists, main chart). */
  --accent:#eb6834; --accentSoft:rgba(235,104,52,.16); --accentLine:rgba(235,104,52,.45);

  /* Categorical — only for composite marks where segments share one bar.
     Fixed order, never cycled; first three validate all-pairs in both modes. */
  --cat1:#2a78d6; --cat2:#eb6834; --cat3:#1baf7a;

  /* Sequential (heatmap): one hue, light -> dark. */
  --seq1:#cde2fb; --seq2:#9ec5f4; --seq3:#5598e7; --seq4:#2a78d6; --seq5:#184f95;

  /* Ordinal (funnel): same hue, no lighter than step 250 on this surface. */
  --ord1:#86b6ef; --ord2:#5598e7; --ord3:#2a78d6; --ord4:#1c5cab;

  --good:#006300; --bad:#d03b3b;
}
@media (prefers-color-scheme: dark) {
  :root {
    --plane:#0d0d0d; --surface:#1a1a19; --raise:#232322;
    --ink:#ffffff; --ink2:#c3c2b7; --muted:#898781;
    --grid:#2c2c2a; --axis:#383835; --border:rgba(255,255,255,.10);
    --accent:#d95926; --accentSoft:rgba(217,89,38,.22); --accentLine:rgba(217,89,38,.5);
    --cat1:#3987e5; --cat2:#d95926; --cat3:#199e70;
    /* Sequential inverts direction on a dark surface: near-surface -> bright. */
    --seq1:#184f95; --seq2:#256abf; --seq3:#3987e5; --seq4:#6da7ec; --seq5:#b7d3f6;
    --ord1:#b7d3f6; --ord2:#86b6ef; --ord3:#3987e5; --ord4:#184f95;
    --good:#0ca30c; --bad:#d03b3b;
  }
}

* { box-sizing:border-box; }
html { -webkit-text-size-adjust:100%; }
body {
  margin:0; background:var(--plane); color:var(--ink);
  font:13px/1.5 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;
  font-synthesis-weight:none;
}
main { max-width:1240px; margin:0 auto; padding:20px 20px 56px; }
h1,h2 { margin:0; font-weight:600; }
code, .mono { font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,monospace; }
.num { font-variant-numeric:tabular-nums; }

/* ---- Toolbar ---------------------------------------------------------- */
.top {
  display:flex; flex-wrap:wrap; align-items:baseline; gap:8px 14px;
  padding-bottom:14px; margin-bottom:18px; border-bottom:1px solid var(--border);
}
.top h1 { font-size:16px; letter-spacing:-.01em; }
.meta { color:var(--muted); font-size:12px; }
.meta strong { color:var(--ink2); font-weight:500; }
.spacer { flex:1 1 auto; }

/* Filters sit in one row above the charts. */
.controls { display:flex; flex-wrap:wrap; gap:8px; align-items:center; margin-bottom:18px; }
.chips { display:inline-flex; background:var(--raise); border:1px solid var(--border); border-radius:7px; padding:2px; }
.chip {
  appearance:none; border:0; background:none; color:var(--ink2);
  font:inherit; font-size:12px; padding:4px 10px; border-radius:5px; cursor:pointer;
}
.chip:hover { color:var(--ink); }
.chip[aria-pressed="true"] { background:var(--surface); color:var(--ink); font-weight:600; box-shadow:0 1px 2px rgba(0,0,0,.06); }
select, .btn {
  appearance:none; font:inherit; font-size:12px; color:var(--ink2);
  background:var(--surface); border:1px solid var(--border); border-radius:7px;
  padding:5px 10px; cursor:pointer;
}
select { padding-right:26px; background-image:linear-gradient(45deg,transparent 50%,var(--muted) 50%),linear-gradient(135deg,var(--muted) 50%,transparent 50%); background-position:calc(100% - 14px) 50%,calc(100% - 9px) 50%; background-size:5px 5px,5px 5px; background-repeat:no-repeat; }
.btn:hover, select:hover { color:var(--ink); }
.btn[aria-pressed="true"] { color:var(--accent); border-color:var(--accentLine); }
.live { display:inline-flex; align-items:center; gap:6px; color:var(--muted); font-size:12px; }
.dot { width:6px; height:6px; border-radius:50%; background:var(--muted); }
.dot.on { background:var(--good); }
body.loading .dot.on { animation:pulse 1s ease-in-out infinite; }
@keyframes pulse { 50% { opacity:.25; } }

:focus-visible { outline:2px solid var(--accent); outline-offset:2px; border-radius:3px; }

/* ---- Grid & panels ---------------------------------------------------- */
.grid { display:grid; grid-template-columns:repeat(12,1fr); gap:14px; }
.panel {
  grid-column:span 4; min-width:0;
  background:var(--surface); border:1px solid var(--border); border-radius:9px; padding:13px 15px 15px;
}
.panel.w6 { grid-column:span 6; }
.panel.w8 { grid-column:span 8; }
.panel.w12 { grid-column:span 12; }
.panel > header { display:flex; align-items:baseline; gap:8px; margin-bottom:12px; }
.panel h2 { font-size:12px; letter-spacing:.02em; text-transform:uppercase; color:var(--ink2); }
.panel .note { color:var(--muted); font-size:11px; margin-left:auto; text-align:right; }
.foot { color:var(--muted); font-size:11px; margin:10px 0 0; }
.foot strong { color:var(--ink2); font-weight:600; }
.empty { color:var(--muted); margin:0; font-size:12px; padding:6px 0; }
.qerror { color:var(--bad); margin:0; font-size:12px; overflow-wrap:anywhere; }

/* ---- KPI tiles -------------------------------------------------------- */
.kpis { display:grid; grid-template-columns:repeat(6,1fr); gap:14px; margin-bottom:14px; }
.kpi { background:var(--surface); border:1px solid var(--border); border-radius:9px; padding:12px 14px; min-width:0; }
.kpi .cap { color:var(--muted); font-size:11px; text-transform:uppercase; letter-spacing:.04em; }
.kpi .val { font-size:24px; font-weight:600; letter-spacing:-.02em; margin-top:3px; line-height:1.15; }
.kpi .val.text { font-size:15px; line-height:1.3; word-break:break-all; }
.kpi .sub { display:flex; align-items:center; gap:5px; margin-top:4px; font-size:11px; color:var(--muted); }
/* Direction is spelled out as an arrow glyph plus a signed number, so the
   delta never depends on colour alone. */
.delta { font-weight:600; font-variant-numeric:tabular-nums; }
.delta.up { color:var(--good); }
.delta.down { color:var(--bad); }
.delta.flat { color:var(--muted); }

/* ---- Bar lists (single hue: magnitude, not identity) ------------------ */
.bars { list-style:none; margin:0; padding:0; display:flex; flex-direction:column; gap:7px; }
.bars li { display:grid; grid-template-columns:minmax(0,42%) 1fr auto; align-items:center; gap:10px; font-size:12px; }
.bars .lbl { min-width:0; }
.bars .lbl span { display:block; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
.bars .track { background:var(--grid); border-radius:0 3px 3px 0; height:9px; overflow:hidden; }
/* Rounded only at the data end; the baseline end stays square and anchored. */
.bars .fill { display:block; height:100%; background:var(--accent); border-radius:0 3px 3px 0; min-width:2px; }
.bars .n { color:var(--ink2); font-variant-numeric:tabular-nums; font-weight:500; }
.bars .pct { color:var(--muted); font-size:11px; font-variant-numeric:tabular-nums; }

/* ---- Segmented bar (categorical: identity within one mark) ------------ */
.seg { display:flex; height:12px; border-radius:3px; overflow:hidden; gap:2px; background:var(--grid); }
.seg > span { display:block; min-width:2px; }
.legend { display:flex; flex-wrap:wrap; gap:4px 14px; margin-top:10px; font-size:12px; }
.legend .item { display:inline-flex; align-items:center; gap:6px; color:var(--ink2); }
.legend .swatch { width:9px; height:9px; border-radius:2px; flex:none; }
.legend .n { color:var(--muted); font-variant-numeric:tabular-nums; }

/* ---- Funnel (ordinal ramp) -------------------------------------------- */
.funnel { display:flex; flex-direction:column; gap:3px; }
.funnel .step { display:grid; grid-template-columns:minmax(0,110px) 1fr auto; align-items:center; gap:10px; font-size:12px; }
.funnel .lbl { overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
.funnel .n { color:var(--ink2); font-weight:500; }
.funnel .track { height:20px; background:var(--grid); border-radius:0 3px 3px 0; overflow:hidden; }
.funnel .fill { display:block; height:100%; border-radius:0 3px 3px 0; min-width:2px; }
.funnel .drop { color:var(--muted); font-size:11px; padding-left:120px; font-variant-numeric:tabular-nums; }

/* ---- Charts ----------------------------------------------------------- */
.chart { position:relative; width:100%; }
.chart svg { display:block; width:100%; overflow:visible; }
.chart .gridline { stroke:var(--grid); stroke-width:1; shape-rendering:crispEdges; }
.chart .baseline { stroke:var(--axis); stroke-width:1; shape-rendering:crispEdges; }
.chart .tick { fill:var(--muted); font-size:10px; font-variant-numeric:tabular-nums; }
.chart .area { fill:var(--accentSoft); }
.chart .line { fill:none; stroke:var(--accent); stroke-width:2; stroke-linejoin:round; stroke-linecap:round; }
/* 2px surface ring so a marker sitting on the line stays legible. */
.chart .marker { fill:var(--accent); stroke:var(--surface); stroke-width:2; }
.chart .crosshair { stroke:var(--axis); stroke-width:1; stroke-dasharray:3 3; }
.chart .hit { fill:transparent; cursor:crosshair; }

.tooltip {
  position:fixed; z-index:20; pointer-events:none; opacity:0;
  transform:translate(-50%,-100%); transition:opacity .08s ease;
  background:var(--ink); color:var(--plane); font-size:11px; line-height:1.45;
  padding:5px 8px; border-radius:6px; white-space:nowrap;
}
.tooltip.on { opacity:1; }
.tooltip b { font-variant-numeric:tabular-nums; }

/* ---- Heatmap ---------------------------------------------------------- */
.heat { display:flex; flex-direction:column; gap:2px; overflow-x:auto; }
.heat-row { display:grid; grid-template-columns:30px repeat(24,minmax(15px,1fr)); gap:2px; align-items:center; }
.heat-lbl { font-size:10px; color:var(--muted); }
.heat-hr { font-size:9px; color:var(--muted); text-align:center; }
.heat-cell { aspect-ratio:1; border-radius:2px; background:var(--grid); cursor:default; }
.heat-cell:focus-visible { outline:2px solid var(--accent); outline-offset:1px; }
.heat-key { display:flex; align-items:center; gap:6px; margin-top:10px; font-size:11px; color:var(--muted); }
.heat-key i { width:14px; height:9px; border-radius:2px; display:block; }

/* ---- Table ------------------------------------------------------------ */
.tablewrap { overflow-x:auto; max-height:340px; overflow-y:auto; margin:-2px -4px; padding:2px 4px; }
table { border-collapse:collapse; width:100%; font-size:12px; }
thead th {
  position:sticky; top:0; z-index:1; background:var(--surface);
  text-align:left; font-weight:600; font-size:11px; color:var(--muted);
  text-transform:uppercase; letter-spacing:.03em;
  padding:0 10px 6px 0; border-bottom:1px solid var(--border);
}
tbody td { padding:5px 10px 5px 0; border-bottom:1px solid var(--grid); color:var(--ink2); white-space:nowrap; }
tbody tr:last-child td { border-bottom:0; }
tbody td:first-child { color:var(--muted); font-variant-numeric:tabular-nums; }
.trunc { max-width:210px; overflow:hidden; text-overflow:ellipsis; display:inline-block; vertical-align:bottom; }

/* Screen-reader-only table view, so identity is never colour-alone. */
.sr { position:absolute; width:1px; height:1px; padding:0; margin:-1px; overflow:hidden; clip:rect(0 0 0 0); white-space:nowrap; border:0; }

footer.page { color:var(--muted); font-size:11px; margin-top:20px; padding-top:14px; border-top:1px solid var(--border); }

/* ---- Responsive ------------------------------------------------------- */
@media (max-width:1080px) {
  .kpis { grid-template-columns:repeat(3,1fr); }
  .panel { grid-column:span 6; }
  .panel.w8 { grid-column:span 12; }
}
@media (max-width:680px) {
  main { padding:16px 14px 40px; }
  .kpis { grid-template-columns:repeat(2,1fr); }
  .panel, .panel.w6, .panel.w8 { grid-column:span 12; }
  .bars li { grid-template-columns:minmax(0,50%) 1fr auto; }
}
@media (prefers-reduced-motion:reduce) {
  *, *::before, *::after { animation-duration:.01ms !important; transition-duration:.01ms !important; }
}
`;
