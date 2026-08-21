# Architecture Overview

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js (static export via `output: 'export'`) |
| Language | TypeScript |
| UI | React 18 |
| Shared UI primitives | [refract-ui](https://github.com/parammehta/refract-ui) (published npm package; [Storybook](https://storybook.parammehta.com)) |
| Styling | CSS Modules (`.module.css`) with CSS custom properties |
| Animation | Framer Motion (`framer-motion`) |
| 3D | Three.js + three-stdlib (Draco GLTF loader) |
| Blog | MDX via `mdx-bundler` |
| Analytics | Cloudflare Web Analytics (client-side beacon) + a custom-event Cloudflare Worker (`worker/`) |
| Contact API | AWS Lambda + API Gateway (REST), Node 20, `functions/` |
| Email | AWS SES (`us-east-1`) |
| Spam protection | Cloudflare Turnstile (managed widget) + honeypot field |
| Testing | Jest + React Testing Library (unit + integration) and Playwright (e2e) |
| Linting | ESLint (flat config) + Stylelint + Prettier |
| Hosting | AWS S3 + CloudFront |

## Build Pipeline

```
next build --webpack
    |
    v
Static HTML export (out/)
    |
    v
Moved to build/
    |
    v
aws s3 sync --delete build/ s3://parammehta-portfolio-site
    |
    v
CloudFront cache invalidation
```

Build-time scripts in `scripts/` run during webpack compilation:
- `generate-sitemap.js` — generates `public/sitemap.xml`
- `draco.js` — copies the Draco decoder WASM and device `.glb` models from `node_modules/refract-ui/dist/assets` to `public/draco/` and `public/models/`

`next.config.js` also collapses every stylesheet into a single CSS chunk shared by all routes (a `styles` `cacheGroup` on `optimization.splitChunks`). See [Rendering Strategy](#rendering-strategy) for why. It is cheaper than the per-route default here — merging drops the rules each route chunk duplicated, so one ~107KB (18KB gzipped) file replaces ~144KB across eleven, fetched once for the whole site.

Both `dev` and `build` pass `--webpack`. That is load-bearing: the `webpack()` hook is ignored under Turbopack, so dropping the flag would silently discard the chunking above along with the SVG, shader, and asset loaders.

## Project Structure

```
src/
  components/     Site-specific UI only (Navbar, Footer, Meta, Page, ArchitectureDiagram,
                   StructuredData, ViewportPage, Code) — shared primitives (Button, Text,
                   Image, Model, Carousel, ThemeProvider, etc.) live in refract-ui
  hooks/          Custom React hooks this site still uses directly (viewport, scroll, form,
                   performance) — refract-ui has its own copies of the hooks it needs
  shell/          App-wide chrome: global CSS, reducer, ScrollRestore, fonts.ts, NextLinkAdapter
  pages/          Next.js pages (*.page.tsx) and co-located route components
    experience/   Per-company experience detail pages
    articles/     Blog listing and [slug] detail
    home/         Home page sections (Intro, Profile, Contact)
    resume/       PDF resume viewer
    skills/       Skills page
  utils/          Pure helper functions
  assets/         Images and static assets imported by components

public/           Static files served at root (draco decoder + device .glb models are
                   populated at build time from refract-ui, see scripts/draco.js)
functions/        Serverless API (contact form backend, separate deploy)
worker/           Cloudflare Worker: custom-event sink to Analytics Engine (separate deploy)
scripts/          Build-time node scripts
```

## Page Extension Convention

Next.js is configured with `pageExtensions: ['page.tsx', 'page.ts', 'api.ts']`. Only files ending in `.page.tsx`/`.page.ts` are treated as routes. This allows co-locating non-page components (like `Home.tsx`) alongside their page entry point (`index.page.tsx`) without them becoming routes.

## Import Resolution

`tsconfig.json` sets `baseUrl: "src"`, so imports resolve relative to `src/`:

```ts
import { Navbar } from 'components/Navbar';
import { clamp } from 'utils/clamp';
import { useInViewport } from 'hooks';
```

Shared primitives (`Text`, `Button`, `Image`, `ThemeProvider`, ...) import from the `refract-ui` package instead:

```ts
import { Button, Text, ThemeProvider } from 'refract-ui';
```

## Global State

Minimal global state managed via `useReducer` in `_app.page.tsx`, exposed through `AppContext`:

| State | Type | Purpose |
|---|---|---|
| `theme` | `'dark' \| 'light'` | Current color theme, persisted to localStorage |
| `menuOpen` | `boolean` | Mobile nav drawer open/closed |

Actions: `setTheme`, `toggleTheme`, `toggleMenu`. Initial state is `{ theme: 'dark', menuOpen: false }`; the App component then syncs `theme` from localStorage on mount via `useLocalStorage`.

## Rendering Strategy

- **Static export only** — no `getServerSideProps` or API routes within the Next.js app.
- **Page transitions** — `AnimatePresence mode="wait"` wraps page components with opacity fade. This keeps the outgoing page mounted after the route commits, so it depends on the single shared CSS chunk from the [Build Pipeline](#build-pipeline): with per-route chunks Next unloads the outgoing route's styles on commit, and the exiting page loses its grid and `max-width` and stretches to full width. Long-standing Next issue [#17464](https://github.com/vercel/next.js/issues/17464).
- **Theme flash prevention** — `_document.page.tsx` injects an inline script that reads localStorage before React hydrates, setting `data-theme` on `<body>` to avoid a flash of the wrong theme.

## Deployment Targets

| Target | Infrastructure | Command |
|---|---|---|
| Main site | S3 `parammehta-portfolio-site` → CloudFront | `npm run deploy` |
| API functions | Lambda + API Gateway → `api.parammehta.com` | `cd functions && CLOUDFLARE_TURNSTILE_SECRET=<secret> npm run deploy` |
| Analytics Worker | Cloudflare Workers | `npm run deploy:worker` |

Storybook for the shared component library is a separate deploy out of this repo entirely — see [refract-ui](https://github.com/parammehta/refract-ui), which publishes its own Storybook to `storybook.parammehta.com` from its own CI.

## Contact Form API

The contact form backend lives in `functions/` and is deployed separately via the Serverless Framework (v3).

| Resource | Detail |
|---|---|
| Lambda function | `parammehta-portfolio-production-api` (`us-east-1`, `arm64`) |
| API Gateway | REST API `a6bwt3cky9`, stage `production` |
| Custom domain | `api.parammehta.com` → CloudFront distribution `d26zddtw9cku0h.cloudfront.net` |
| ACM cert | `api.parammehta.com` (`us-east-1`) |
| SES identity | `param.mehta95@gmail.com` (verified) |
| Runtime | Node 20 (`nodejs20.x`) |

CORS is restricted to `https://parammehta.com` and `https://www.parammehta.com`. To test locally, use a REST client directly against the raw API Gateway URL or temporarily add `http://localhost:3000` to the `ORIGINS` array in `functions/index.js`.
