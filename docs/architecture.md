# Architecture Overview

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js (prerendered pages + one API route) |
| Language | TypeScript |
| UI | React 18 |
| Shared UI primitives | [refract-ui](https://github.com/parammehta/refract-ui) (published npm package; [Storybook](https://storybook.parammehta.com)) |
| Styling | CSS Modules (`.module.css`) with CSS custom properties |
| Animation | Framer Motion (`framer-motion`) |
| 3D | Three.js + three-stdlib (Draco GLTF loader) |
| Blog | MDX via `mdx-bundler` |
| Analytics | Cloudflare Web Analytics (client-side beacon) + a custom-event Cloudflare Worker (`worker/`) |
| Contact API | Vercel function, `src/pages/api/message.api.ts` |
| Email | AWS SES (`us-east-1`) |
| Spam protection | Cloudflare Turnstile (managed widget) + honeypot field |
| Testing | Jest + React Testing Library (unit + integration) and Playwright (e2e) |
| Linting | ESLint (flat config) + Stylelint + Prettier |
| Hosting | Vercel |

## Build Pipeline

```
push to main
    |
    v
Vercel build  ->  next build --webpack
    |
    v
.next/ : prerendered HTML for every page
         + one function for /api/message
    |
    v
Vercel CDN (production)
```

Pull requests take the same path to a preview deployment on its own URL instead of production.

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

- **Prerendered by default** — every page is static at build time (`getStaticProps`/`getStaticPaths`); no `getServerSideProps`. The single exception is `/api/message`, the contact form endpoint, which runs per request.
- **Page transitions** — `AnimatePresence mode="wait"` wraps page components with opacity fade. This keeps the outgoing page mounted after the route commits, so it depends on the single shared CSS chunk from the [Build Pipeline](#build-pipeline): with per-route chunks Next unloads the outgoing route's styles on commit, and the exiting page loses its grid and `max-width` and stretches to full width. Long-standing Next issue [#17464](https://github.com/vercel/next.js/issues/17464).
- **Theme flash prevention** — `_document.page.tsx` injects an inline script that reads localStorage before React hydrates, setting `data-theme` on `<body>` to avoid a flash of the wrong theme.

## Deployment Targets

| Target | Infrastructure | Command |
|---|---|---|
| Main site + contact API | Vercel | none — deploys on push to `main` |
| Analytics Worker | Cloudflare Workers | `npm run deploy:worker` |

Storybook for the shared component library is a separate deploy out of this repo entirely — see [refract-ui](https://github.com/parammehta/refract-ui), which publishes its own Storybook to `storybook.parammehta.com` from its own CI.

## Contact Form API

The contact form backend is `src/pages/api/message.api.ts`, deployed with the site as a Vercel
function. It was an Express app on AWS Lambda behind API Gateway at `api.parammehta.com` until the
site moved off S3; a static host cannot run server code, which is the only reason it lived apart.

| Resource | Detail |
|---|---|
| Endpoint | `POST /api/message/` (same origin as the site) |
| SES identity | `param.mehta95@gmail.com` (verified, `us-east-1`) |
| Credentials | `PORTFOLIO_AWS_ACCESS_KEY_ID` / `PORTFOLIO_AWS_SECRET_ACCESS_KEY` on the Vercel project |
| Spam controls | Cloudflare Turnstile (when `CLOUDFLARE_TURNSTILE_SECRET` is set) + honeypot field |

The **trailing slash is required**: `trailingSlash: true` in `next.config.js` applies to API routes
as well as pages, so `POST /api/message` answers with a 308 to `/api/message/`.

Requests are accepted from `https://parammehta.com`, `https://www.parammehta.com`, any
`*.vercel.app` preview origin, and callers that send no `Origin` header at all. The origin check is
enforced in the handler rather than by CORS: now that the endpoint is same-origin, a cross-site POST
still reaches it and the browser withholds only the response — which does not un-send an email.

The AWS credentials are mandatory. The handler refuses to construct an SES client without them
instead of falling back to the SDK's default provider chain, which would read `~/.aws/credentials`
and let a local dev server send real mail from the developer's own account.
