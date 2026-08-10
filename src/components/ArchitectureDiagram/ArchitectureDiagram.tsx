import {
  Fragment,
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from 'react';
import type { ReactNode } from 'react';
import { SegmentedControl, SegmentedControlOption } from 'components/SegmentedControl';
import { classes } from 'utils/style';
import styles from './ArchitectureDiagram.module.css';

type Tier = 'client' | 'edge' | 'storage' | 'api' | 'external' | 'cicd';
type Flow = 'serve' | 'contact' | 'deploy';

interface NodeDef {
  id: string;
  tier: Tier;
  name: string;
  sub: string;
  x: number;
  y: number;
  detail: string;
}

interface EdgeDef {
  from: string;
  to: string;
  flow: Flow;
  dashed?: boolean;
}

interface Step {
  node: string;
  text: string;
}

interface Tab {
  label: string;
  flow: Flow | null;
}

const TIER_LABEL: Record<Tier, string> = {
  client: 'Client',
  edge: 'Edge / CDN',
  storage: 'Origin storage',
  api: 'API',
  external: 'External',
  cicd: 'CI/CD',
};

const NODES: NodeDef[] = [
  {
    id: 'dev',
    tier: 'cicd',
    name: 'Developer',
    sub: 'push → main',
    x: 9,
    y: 12,
    detail:
      'You push Conventional Commits (`feat`/`fix`/`chore`) to `main`. That single event drives the entire release-and-deploy pipeline — there is no manual gate.',
  },
  {
    id: 'ci',
    tier: 'cicd',
    name: 'GitHub Actions',
    sub: 'release-please',
    x: 31,
    y: 12,
    detail:
      '`release-deploy.yml` runs release-please: it opens a Release PR that bumps `package.json` and regenerates `CHANGELOG.md`, then auto-merges it with a PAT so the merge push re-triggers the workflow.',
  },
  {
    id: 'build',
    tier: 'cicd',
    name: 'Build & deploy job',
    sub: 'next build → sync',
    x: 53,
    y: 12,
    detail:
      'On Node 24 the job runs `next build` — a static export that re-bakes the `NEXT_PUBLIC_*` variables — then `aws s3 sync --delete` uploads and a CloudFront invalidation clears the edge.',
  },
  {
    id: 's3sb',
    tier: 'storage',
    name: 'S3 · Storybook',
    sub: 'portfolio-storybook',
    x: 88,
    y: 12,
    detail:
      'A separate bucket for the Storybook component library, deployed out of band via `npm run deploy:storybook`. Not part of the release pipeline.',
  },
  {
    id: 'browser',
    tier: 'client',
    name: 'Visitor browser',
    sub: 'parammehta.com',
    x: 9,
    y: 50,
    detail:
      'Loads the static HTML/JS/CSS bundle. Three.js renders the hero sphere and Draco-compressed device models. The contact page mounts the Turnstile widget and posts to the API.',
  },
  {
    id: 'turnstile',
    tier: 'client',
    name: 'Turnstile widget',
    sub: 'bot check · client',
    x: 28,
    y: 38,
    detail:
      'Cloudflare Turnstile, loaded client-side with a public site key. It issues a token submitted with the form. Left unset locally, the widget and the check are skipped entirely.',
  },
  {
    id: 'analytics',
    tier: 'client',
    name: 'Cloudflare Analytics',
    sub: 'analytics · client',
    x: 28,
    y: 64,
    detail:
      'Cloudflare Web Analytics, loaded client-side as a beacon in SPA mode so it reports each route change on its own. Privacy-friendly and cookieless; there is no server hop — it never touches the backend. Left unset locally, the beacon is never injected.',
  },
  {
    id: 'cloudfront',
    tier: 'edge',
    name: 'CloudFront CDN',
    sub: 'E3E00OKUBAT1AJ',
    x: 50,
    y: 51,
    detail:
      'The CDN distribution fronting the site. It caches every file at the edge, so each deploy issues an invalidation for `/*` — otherwise visitors keep the previous build until the TTL expires.',
  },
  {
    id: 's3site',
    tier: 'storage',
    name: 'S3 · site bucket',
    sub: 'portfolio-site',
    x: 72,
    y: 38,
    detail:
      'The static origin for the main site. `aws s3 sync --delete` uploads `build/` here so removed files disappear. CloudFront reads from it on a cache miss.',
  },
  {
    id: 'apigw',
    tier: 'api',
    name: 'API Gateway',
    sub: 'api.parammehta.com',
    x: 50,
    y: 80,
    detail:
      'The HTTP endpoint (`api.parammehta.com`) proxying `ANY /{proxy+}` to the Lambda. Deployed separately with the Serverless Framework — not part of the site pipeline.',
  },
  {
    id: 'lambda',
    tier: 'api',
    name: 'Lambda',
    sub: 'express contact api',
    x: 72,
    y: 66,
    detail:
      'An arm64 Node function (Express + helmet). It sanitizes input with DOMPurify, silently drops honeypot bots, verifies the Turnstile token, then sends the email.',
  },
  {
    id: 'cfverify',
    tier: 'external',
    name: 'Turnstile verify',
    sub: 'cloudflare siteverify',
    x: 90,
    y: 56,
    detail:
      "The Lambda calls Cloudflare's `siteverify` with a server-side secret to confirm the token is genuine before mailing. Absent the secret, the check is skipped and the honeypot still applies.",
  },
  {
    id: 'ses',
    tier: 'external',
    name: 'Amazon SES',
    sub: 'send email',
    x: 90,
    y: 84,
    detail:
      'Amazon SES delivers the message to the inbox. The Lambda’s IAM role is scoped to only `ses:SendEmail` / `ses:SendRawEmail`.',
  },
];

const EDGES: EdgeDef[] = [
  { from: 'browser', to: 'cloudfront', flow: 'serve' },
  { from: 'cloudfront', to: 's3site', flow: 'serve' },
  { from: 'browser', to: 'analytics', flow: 'serve', dashed: true },
  { from: 'browser', to: 'turnstile', flow: 'contact', dashed: true },
  { from: 'browser', to: 'apigw', flow: 'contact' },
  { from: 'apigw', to: 'lambda', flow: 'contact' },
  { from: 'lambda', to: 'cfverify', flow: 'contact' },
  { from: 'lambda', to: 'ses', flow: 'contact' },
  { from: 'dev', to: 'ci', flow: 'deploy' },
  { from: 'ci', to: 'build', flow: 'deploy' },
  { from: 'build', to: 's3site', flow: 'deploy' },
  { from: 'build', to: 'cloudfront', flow: 'deploy', dashed: true },
  { from: 'dev', to: 's3sb', flow: 'deploy', dashed: true },
];

const FLOW_STEPS: Record<Flow, Step[]> = {
  serve: [
    { node: 'browser', text: 'Browser requests a page from `parammehta.com`.' },
    { node: 'cloudfront', text: 'CloudFront serves the cached file from the nearest edge.' },
    { node: 's3site', text: 'On a cache miss it pulls the origin file from S3.' },
    {
      node: 'analytics',
      text: 'The Cloudflare beacon logs the pageview entirely client-side.',
    },
  ],
  contact: [
    { node: 'browser', text: 'Visitor fills the form; Turnstile issues a token.' },
    { node: 'turnstile', text: 'The client-side bot check produces that token.' },
    { node: 'apigw', text: '`POST /message` hits the API gateway.' },
    { node: 'lambda', text: 'Lambda sanitizes input and silently drops honeypot bots.' },
    { node: 'cfverify', text: 'Lambda verifies the token with Cloudflare.' },
    { node: 'ses', text: 'SES emails the message to the inbox.' },
  ],
  deploy: [
    { node: 'dev', text: 'You push a `feat`/`fix` commit to `main`.' },
    { node: 'ci', text: 'release-please opens and auto-merges the Release PR.' },
    { node: 'build', text: 'The job runs `next build` — a static export.' },
    { node: 's3site', text: '`aws s3 sync --delete` uploads the new build.' },
    { node: 'cloudfront', text: 'A CloudFront invalidation clears the edge cache.' },
  ],
};

const TABS: Tab[] = [
  { label: 'Overview', flow: null },
  { label: 'Page load', flow: 'serve' },
  { label: 'Contact form', flow: 'contact' },
  { label: 'Deploy', flow: 'deploy' },
];

const NODE_MAP: Record<string, NodeDef> = Object.fromEntries(
  NODES.map(node => [node.id, node])
);

// Render inline `code` spans from a plain string without dangerouslySetInnerHTML.
const renderRich = (text: string): ReactNode[] =>
  text.split('`').map((part, index) =>
    index % 2 === 1 ? (
      <code key={index} className={styles.inlineCode}>
        {part}
      </code>
    ) : (
      <Fragment key={index}>{part}</Fragment>
    )
  );

interface PathData {
  d: string;
  flow: Flow;
  from: string;
  to: string;
  dashed: boolean;
}

const BOARD_W = 960;
const BOARD_H = 560;
// Below this container width the scaled board's text gets too small, so we
// switch to a stacked, scroll-free layout instead.
const COMPACT_MAX = 560;

const exitLength = (halfWidth: number, halfHeight: number, ux: number, uy: number): number =>
  Math.min(
    halfWidth / Math.max(Math.abs(ux), 1e-4),
    halfHeight / Math.max(Math.abs(uy), 1e-4)
  );

export const ArchitectureDiagram = () => {
  const markerId = useId().replace(/:/g, '');
  const wrapRef = useRef<HTMLDivElement>(null);
  const boardRef = useRef<HTMLDivElement>(null);
  const nodeRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  const [index, setIndex] = useState(0);
  const [activeNode, setActiveNode] = useState<string | null>(null);
  const [scale, setScale] = useState(1);
  const [compact, setCompact] = useState(false);
  const [paths, setPaths] = useState<PathData[]>([]);

  const activeFlow = TABS[index].flow;

  // Connectors are computed in the board's own fixed 820×560 layout space using
  // offset metrics (which ignore the CSS `transform: scale`), so the geometry
  // stays correct no matter how the board is scaled to fit its container.
  const measure = useCallback(() => {
    const board = boardRef.current;
    if (!board) return;

    const next: PathData[] = [];

    for (const edge of EDGES) {
      const fromEl = nodeRefs.current[edge.from];
      const toEl = nodeRefs.current[edge.to];
      if (!fromEl || !toEl) continue;

      const ax = fromEl.offsetLeft;
      const ay = fromEl.offsetTop;
      const bx = toEl.offsetLeft;
      const by = toEl.offsetTop;

      const dx = bx - ax;
      const dy = by - ay;
      const len = Math.hypot(dx, dy) || 1;
      const ux = dx / len;
      const uy = dy / len;

      const ta = exitLength(fromEl.offsetWidth / 2 + 2, fromEl.offsetHeight / 2 + 2, ux, uy);
      const tb = exitLength(toEl.offsetWidth / 2 + 2, toEl.offsetHeight / 2 + 2, ux, uy);

      const sx = ax + ux * ta;
      const sy = ay + uy * ta;
      const ex = bx - ux * (tb + 7);
      const ey = by - uy * (tb + 7);
      const mx = (sx + ex) / 2;

      const c1x = sx + (mx - sx) * 0.55;
      const c2x = ex - (ex - mx) * 0.55;

      next.push({
        d: `M ${sx} ${sy} C ${c1x} ${sy}, ${c2x} ${ey}, ${ex} ${ey}`,
        flow: edge.flow,
        from: edge.from,
        to: edge.to,
        dashed: Boolean(edge.dashed),
      });
    }

    setPaths(next);
  }, []);

  // Fit the board to the available width (never upscaling); drop to a stacked
  // layout when the column is too narrow to scale down legibly.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const wrap = wrapRef.current;
    if (!wrap) return;

    const fit = () => {
      const width = wrap.clientWidth;
      setCompact(width < COMPACT_MAX);
      setScale(Math.min(1, width / BOARD_W));
    };

    fit();
    window.addEventListener('resize', fit);
    const observer =
      typeof ResizeObserver !== 'undefined' ? new ResizeObserver(fit) : null;
    observer?.observe(wrap);
    return () => {
      window.removeEventListener('resize', fit);
      observer?.disconnect();
    };
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined' || compact) return;
    measure();
    if (typeof document !== 'undefined' && document.fonts?.ready) {
      document.fonts.ready.then(measure).catch(() => {});
    }
  }, [compact, measure]);

  // Nodes lit for the current selection.
  const litNodes = useMemo(() => {
    if (activeNode) {
      const set = new Set<string>([activeNode]);
      for (const edge of EDGES) {
        if (edge.from === activeNode) set.add(edge.to);
        if (edge.to === activeNode) set.add(edge.from);
      }
      return set;
    }
    if (activeFlow) {
      return new Set(FLOW_STEPS[activeFlow].map(step => step.node));
    }
    return null;
  }, [activeNode, activeFlow]);

  const isolating = Boolean(activeNode) || Boolean(activeFlow);

  const selectTab = (nextIndex: number) => {
    setIndex(nextIndex);
    setActiveNode(null);
  };

  const toggleNode = (id: string) => {
    setActiveNode(current => (current === id ? null : id));
  };

  const activeNodeDef = activeNode ? NODE_MAP[activeNode] : null;
  const compactNodes = activeFlow ? FLOW_STEPS[activeFlow].map(step => NODE_MAP[step.node]) : NODES;

  const renderNodeButton = (node: NodeDef, extraClass: string) => {
    const lit = litNodes?.has(node.id) ?? false;
    const dim = Boolean(litNodes) && !lit;

    return (
      <button
        type="button"
        key={node.id}
        ref={element => {
          nodeRefs.current[node.id] = element;
        }}
        className={classes(extraClass, lit && styles.nodeLit, dim && styles.nodeDim)}
        style={extraClass === styles.node ? { left: `${node.x}%`, top: `${node.y}%` } : undefined}
        aria-label={`${node.name} — ${TIER_LABEL[node.tier]}`}
        aria-pressed={activeNode === node.id}
        onClick={() => toggleNode(node.id)}
      >
        <span className={styles.kicker}>{TIER_LABEL[node.tier]}</span>
        <span className={styles.nodeName}>{node.name}</span>
        <span className={styles.nodeSub}>{node.sub}</span>
      </button>
    );
  };

  return (
    <div className={styles.wrap} ref={wrapRef}>
      <div className={styles.controls}>
        <span className={styles.controlsLabel}>Trace</span>
        <SegmentedControl
          currentIndex={index}
          onChange={selectTab}
          label="Trace an architecture flow"
        >
          {TABS.map(tab => (
            <SegmentedControlOption key={tab.label}>{tab.label}</SegmentedControlOption>
          ))}
        </SegmentedControl>
      </div>

      {compact ? (
        <div className={styles.stack}>{compactNodes.map(node => renderNodeButton(node, styles.stackNode))}</div>
      ) : (
        <div className={styles.fit} style={{ height: Math.round(BOARD_H * scale) }}>
          <div
            className={styles.board}
            ref={boardRef}
            style={{ width: BOARD_W, height: BOARD_H, transform: `scale(${scale})` }}
          >
          <svg
            className={styles.edges}
            viewBox={`0 0 ${BOARD_W} ${BOARD_H}`}
            aria-hidden="true"
          >
            <defs>
              <marker
                id={markerId}
                viewBox="0 0 10 10"
                refX="8"
                refY="5"
                markerWidth="6"
                markerHeight="6"
                orient="auto-start-reverse"
              >
                <path
                  d="M2 1L8 5L2 9"
                  fill="none"
                  stroke="context-stroke"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </marker>
            </defs>
            {paths.map((path, pathIndex) => {
              const active = activeNode
                ? path.from === activeNode || path.to === activeNode
                : activeFlow
                  ? path.flow === activeFlow
                  : false;
              const faded = isolating && !active;

              return (
                <path
                  key={pathIndex}
                  d={path.d}
                  markerEnd={`url(#${markerId})`}
                  className={classes(
                    styles.edge,
                    path.dashed && styles.edgeDashed,
                    active && styles.edgeActive,
                    active && styles.edgeFlowing,
                    faded && styles.edgeFaded
                  )}
                />
              );
            })}
          </svg>

            {NODES.map(node => renderNodeButton(node, styles.node))}
          </div>
        </div>
      )}

      <div className={styles.panel} aria-live="polite">
        {activeNodeDef ? (
          <Fragment>
            <p className={styles.panelTitle}>
              {activeNodeDef.name}
              <span className={styles.panelTag}>{TIER_LABEL[activeNodeDef.tier]}</span>
            </p>
            <p className={styles.panelBody}>{renderRich(activeNodeDef.detail)}</p>
          </Fragment>
        ) : activeFlow ? (
          <Fragment>
            <p className={styles.panelTitle}>{TABS[index].label}</p>
            <ol className={styles.steps}>
              {FLOW_STEPS[activeFlow].map(step => (
                <li key={step.node} className={styles.step}>
                  <span className={styles.stepName}>{NODE_MAP[step.node].name}</span>
                  <span className={styles.stepText}> — {renderRich(step.text)}</span>
                </li>
              ))}
            </ol>
          </Fragment>
        ) : (
          <p className={styles.panelBody}>
            One set of infrastructure, three journeys across it. Pick a flow above to isolate its
            path, or tap any node to see what it does. Dashed lines are side channels — client
            analytics, the cache invalidation, and the out-of-band Storybook deploy.
          </p>
        )}
      </div>
    </div>
  );
};
