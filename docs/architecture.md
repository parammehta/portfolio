# Architecture Overview

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js (static export via `output: 'export'`) |
| UI | React 18 |
| Styling | CSS Modules (`.module.css`) with CSS custom properties |
| Animation | Framer Motion (`framer-motion`) |
| 3D | Three.js + three-stdlib (Draco GLTF loader) |
| Blog | MDX via `mdx-bundler` |
| Analytics | Fathom (client-side) |
| Contact API | AWS Lambda + API Gateway (REST), Node 20, `functions/` |
| Email | AWS SES (`us-east-1`) |
| Spam protection | Cloudflare Turnstile (managed widget) + honeypot field |
| Testing | Jest + React Testing Library |
| Component dev | Storybook 10 |
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
- `draco.js` — copies Draco decoder WASM to `public/draco/`

## Project Structure

```
src/
  components/     Reusable UI components (Button, Navbar, Image, Model, etc.)
  hooks/          Custom React hooks (viewport, scroll, form, performance)
  layouts/        Page-level layout shells
    App/          Global app wrapper, reducer, CSS reset
    Home/         Home page sections (Intro, Profile, Experience, Skills)
    Experience/   Experience detail page building blocks
    Post/         Blog post layout
    Project/      Project detail page building blocks
  pages/          Next.js pages (*.page.js extension)
    experience/   Per-company experience detail pages
    articles/     Blog listing and [slug] detail
    contact/      Contact form
    resume/       PDF resume viewer
  utils/          Pure helper functions
  assets/         Images and static assets imported by components

public/           Static files served at root
functions/        Serverless API (contact form backend, separate deploy)
scripts/          Build-time node scripts
```

## Page Extension Convention

Next.js is configured with `pageExtensions: ['page.js', 'api.js']`. Only files ending in `.page.js` are treated as routes. This allows co-locating non-page components (like `Contact.js`) alongside their page entry point (`index.page.js`) without them becoming routes.

## Import Resolution

`jsconfig.json` sets `baseUrl: "src"`, so imports resolve relative to `src/`:

```js
import { Button } from 'components/Button';
import { clamp } from 'utils/clamp';
import { useInViewport } from 'hooks';
```

## Global State

Minimal global state managed via `useReducer` in `_app.page.js`, exposed through `AppContext`:

| State | Type | Purpose |
|---|---|---|
| `theme` | `'dark' \| 'light'` | Current color theme, persisted to localStorage |
| `menuOpen` | `boolean` | Mobile nav drawer open/closed |

Actions: `setTheme`, `toggleTheme`, `toggleMenu`.

## Rendering Strategy

- **Static export only** — no `getServerSideProps` or API routes within the Next.js app.
- **Page transitions** — `AnimatePresence mode="wait"` wraps page components with opacity fade.
- **Theme flash prevention** — `_document.page.js` injects an inline script that reads localStorage before React hydrates, setting `data-theme` on `<body>` to avoid a flash of the wrong theme.
- **FOUC fix** — `useFoucFix` hook works around a Next.js bug where server-rendered stylesheets are removed too early during route transitions.

## Deployment Targets

| Target | Infrastructure | Command |
|---|---|---|
| Main site | S3 `parammehta-portfolio-site` → CloudFront | `npm run deploy` |
| Storybook | S3 `parammehta-portfolio-storybook` → CloudFront | `npm run deploy:storybook` |
| API functions | Lambda + API Gateway → `api.parammehta.com` | `cd functions && CLOUDFLARE_TURNSTILE_SECRET=<secret> npm run deploy` |

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
