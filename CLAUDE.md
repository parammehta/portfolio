# Portfolio — parammehta.com

Personal portfolio site for Param Mehta. Next.js static-export app. Shared UI primitives
(Button, Text, Image, Model, Carousel, ThemeProvider, etc.) live in a separate published
package, [refract-ui](https://github.com/parammehta/refract-ui) — this repo only holds
site-specific components (Navbar, Footer, Meta, Page, ArchitectureDiagram, StructuredData,
ViewportPage, Code) and consumes the rest from `node_modules/refract-ui`.

## Quick reference

| What | Command |
|---|---|
| Dev server | `npm run dev` |
| Build | `npm run build` |
| Preview the built site | `npm start` (runs `next start`; run `npm run build` first) |
| Tests (unit + integration) | `npm test` |
| Tests (watch) | `npm run test:watch` |
| Unit tests only | `npm run test:unit` |
| Integration tests only | `npm run test:integration` |
| E2E tests (builds first) | `npm run test:e2e` |
| E2E against existing `.next/` | `npm run test:e2e:only` |
| Lint | `npm run lint` / `npm run stylelint` |
| Typecheck | `npm run typecheck` |
| Deploy site | none — Vercel ships every push to `main` |
| All CI checks locally | `npm run preflight` |
| Verify a deploy is live | `npm run verify:deploy` |
| Deploy analytics Worker | `npm run deploy:worker` |
| Worker tests | `cd worker && npm test` |
| Worker SQL check (live) | `cd worker && CF_API_TOKEN=<token> npm run verify` |

## Node version

**Node 24.12.0** is required (see `.nvmrc`). The shell default may be v16 — always ensure the correct version is on PATH before running any tooling. In Claude Code launch configs, the full nvm path is already set.

## Architecture

- **Framework**: Next.js with `output: 'export'` (static HTML, no SSR at runtime)
- **Pages**: use the `.page.tsx` (or `.page.ts`) extension — `pageExtensions` in `next.config.js` is `['page.tsx', 'page.ts', 'api.ts']`. Regular `.ts`/`.tsx` files in `src/pages/` are non-page helpers.
- **Routing**: file-based via Next.js — `src/pages/index.page.tsx` → `/`, `src/pages/resume/index.page.tsx` → `/resume/`, etc. `trailingSlash: true`, so routes resolve as `route/index.html`. The contact form lives on the home page as an `/#contact` section, not its own route; `src/pages/contact/index.page.tsx` exists only as a redirect stub for the old `/contact/` URL (still indexed/linked externally), which sends visitors on to `/#contact`.
- **Styling**: CSS Modules (`.module.css`). camelCase class names (`selectorClassPattern: ^[a-z][a-zA-Z0-9]+$`).
- **CSS chunking**: `next.config.js` forces every stylesheet into a single chunk shared by all routes. Next otherwise gives each route its own chunk and unloads it the moment the next route commits — which leaves the outgoing page unstyled while it plays its exit animation, stretching it to full width. This depends on the webpack builder (the `--webpack` flag on `dev` and `build`); the `webpack()` hook is ignored under Turbopack, and dropping the flag silently brings the bug back.
- **Imports**: `tsconfig.json` sets `baseUrl: "src"`, so import from `components/Navbar`, `utils/style`, `hooks/useWindowSize`, etc. — no `../` chains needed. Shared primitives (`Text`, `Button`, `Image`, `ThemeProvider`, ...) import from the `refract-ui` package instead, not `components/*`.
- **Component library**: `refract-ui` ([repo](https://github.com/parammehta/refract-ui), [Storybook](https://storybook.parammehta.com)) supplies the primitives extracted from this site. `LinkProvider` (from `refract-ui`) is wired in `_app.page.tsx` with `src/shell/NextLinkAdapter.tsx` so `Link`/`Button` route through `next/link` without the library depending on Next directly. `src/shell/fonts.ts` supplies `--brandFontStack` (Gotham) locally — the library is font-agnostic since Gotham is commercially licensed and can't ship in a public package. `refract-ui/styles.css` is imported once in `_app.page.tsx`; `tokenStyles` (also from `refract-ui`) is inlined into `<head>` in `_document.page.tsx` alongside `fontStyles`.
- **3D**: Three.js for the hero displacement sphere (local, `src/pages/home/HeroSphere.tsx`) and device models / carousel (`refract-ui`'s `Model`/`Carousel`, currently unused on any page but available). Draco decoder and device `.glb` files are copied from `node_modules/refract-ui/dist/assets` to `public/draco/` and `public/models/` at build time by `scripts/draco.js`.
- **SVG**: imported as React components via `@svgr/webpack`. Use `?url` query to force asset URL import instead.
- **Theme**: light/dark follows the visitor's OS (`prefers-color-scheme`) until they press
  the toggle, after which their choice sticks. The choice lives under the `themePreference`
  key (`src/shell/theme.ts`) — deliberately *not* `theme`, which `refract-ui`'s ThemeProvider
  writes on its own every mount and so can never mean "never chose". Resolved twice from the
  same two inputs: by the inline script in `_document.page.tsx` before first paint (no flash
  of the wrong theme), and by `_app.page.tsx` after mount, where `useSystemTheme` keeps
  tracking the OS live. The reducer holds both the rendered `theme` and the explicit
  `themePreference`; a system change is ignored once a preference exists.
- **Analytics**: Cloudflare Web Analytics (client-side beacon in SPA mode, env var `NEXT_PUBLIC_CLOUDFLARE_ANALYTICS_TOKEN`). Custom events go through `utils/analytics`. Custom events are POSTed to a Cloudflare Worker (`worker/`) that records them to a Workers Analytics Engine dataset; CF Web Analytics itself has no event API. Event names live in `analyticsEvents` (`src/utils/analytics.ts`) **and** in the Worker's `ALLOWED_EVENTS` allowlist, which 422s anything else — `src/utils/analyticsEvents.test.ts` asserts the two match, because they silently drifted once and two events were dropped for months.

## Project structure

```
src/
  components/   — site-specific UI only (Navbar, Footer, Meta, Page, ArchitectureDiagram,
                  StructuredData, ViewportPage, Code) — shared primitives live in refract-ui
  hooks/        — custom React hooks (useLocalStorage, useWindowSize, etc. — only ones this
                  site still uses directly; refract-ui has its own copies of the hooks it needs)
  shell/        — app-wide chrome (global CSS, reducer, ScrollRestore, fonts.ts, NextLinkAdapter)
  pages/        — Next.js pages (*.page.tsx) and co-located route components
  utils/        — pure helpers (clamp, date, style, throttle, etc.)
  assets/       — images and static assets imported by components
public/         — static files served at root (favicons, resume PDF, OG images, draco decoder,
                  device .glb models — the latter two populated at build time, see scripts/draco.js;
                  param-mehta-resume.pdf is machine-synced, see "The resume PDF" below)
worker/         — Cloudflare Worker: custom-event sink to Analytics Engine, plus the
                  dashboard it serves at /dashboard (separate deploy via wrangler; has its
                  own `npm test` and `npm run verify` — see worker/README.md)
scripts/        — build-time scripts (sitemap generation, draco/model copy)
```

## The resume PDF

`public/param-mehta-resume.pdf` (served by `src/pages/resume/Resume.tsx`) is **not
maintained here**. It is built from LaTeX in [parammehta/resume](https://github.com/parammehta/resume)
and pushed over by that repo's `Sync PDF to portfolio` CI job, which opens a PR titled
`fix: update resume PDF` on branch `chore/sync-resume-pdf` whenever the resume changes.

- Don't hand-edit the file — the next sync overwrites it. Resume changes go in the `.tex`
  source in the other repo.
- The sync PR is titled `fix:` rather than `chore:` on purpose: `chore:` gets no
  release-please bump, so the release history skips the change. (The PDF itself still goes
  live on merge — Vercel deploys every push to `main` regardless of whether a release is cut.)
- Merging the PR is the manual step — it's what puts the new resume live.

## Component conventions

Each component lives in its own directory:
```
src/components/Navbar/
  Navbar.tsx          — component implementation
  Navbar.module.css  — styles
  index.ts           — re-export
```

No `.stories.tsx` files here — Storybook for these components moved to `refract-ui` along
with the components themselves; `Navbar`/`Footer`/`Code` never had library-shippable
stories since they depend on portfolio-specific data (`AppContext`, nav links, footer copy).

## Linting & formatting

- **ESLint**: flat config (`eslint.config.mjs`) — `@eslint/js` recommended + `eslint-config-next`. Enforces semicolons.
- **Stylelint**: `stylelint-config-standard` + `stylelint-config-css-modules`. camelCase selectors/custom properties.
- **Prettier**: configured via `.prettierrc`.

## Testing

Three layers, each with its own runner and its own job in CI.

### Unit — Jest project `unit`

- Co-located `*.test.ts(x)` files next to the code under test (`src/utils/clamp.test.ts`, `src/components/Text/Text.test.tsx`).
- `jest-environment-jsdom` + React Testing Library, one component or function at a time.
- `npm run test:unit`

### Integration — Jest project `integration`

- Lives in `tests/integration/`. Mounts a **whole page inside the real app shell** (`_app.page.tsx`: theme provider, navbar, skip link, page transition) via the `renderPage()` helper, so routing, providers, and cross-component wiring are covered — not just the page in isolation.
- `tests/integration/setup.ts` is the shared harness and pins the things jsdom or the local machine would otherwise decide for us:
  - **Env is pinned.** `next/jest` loads the repo's `.env`, so without this the suite would pass or fail based on each developer's local config. Tests that need a value (e.g. the Turnstile site key) set it themselves.
  - **`next/router` is `next-router-mock`**, giving each test a real navigable in-memory router.
  - **`WebGLRenderer` is a Proxy stub.** jsdom has no WebGL, so the hero sphere, device models, and carousel would all throw on mount. A Proxy (rather than a hand-written stub) means a newly-used renderer method never fails a page test for an unrelated reason. The rest of Three.js stays real.
  - `IntersectionObserver` / `ResizeObserver` / `matchMedia` stubs, and the `#portal-root` node that `_document.page.tsx` normally supplies.
- `npm run test:integration`

### E2E — Playwright

- Lives in `tests/e2e/`, config in `playwright.config.ts`. Runs against a **production build served by `next start`** — the same command and the same `.next/` output Vercel runs, not a dev server. (It served `build/` with `serve` when the site was a static export; a static file server cannot run the contact form's API route.)
- Two projects: `chromium` (desktop) and `mobile` (Pixel 7). Specs skip themselves where a behaviour only exists on one (e.g. the mobile menu toggle).
- Console-error and failed-request assertions are filtered to same-origin URLs, because analytics and Turnstile are unreachable from CI.
- `npm run test:e2e` builds first; `npm run test:e2e:only` reuses an existing `.next/`.

### Shared config notes

- SVG imports are mocked as React components (`__mocks__/svgMock.js`); `*.svg?url` and other assets as strings (`__mocks__/fileMock.js`).
- `moduleDirectories` includes `src/` to match the `baseUrl` import style.

## CI & the merge gate

`.github/workflows/ci.yml` runs on every PR into `main` (and on pushes to `main`) as five jobs: **Lint & types**, **Unit tests**, **Integration tests**, **Build**, **E2E tests**. `Build` uploads `.next/` as an artifact and `E2E tests` downloads it, so e2e exercises the same bytes CI built rather than rebuilding.

Those five job names are the **required status checks** on `main` — a PR cannot merge until all five are green. That gate is now the *only* thing standing between a commit and production: Vercel deploys `main` on push, so nothing re-runs the suite after merge.

Vercel also builds every pull request as a **preview deployment** at its own URL, which is a second signal alongside CI — a reviewer can click the change before it merges.

## Verification

`npm run preflight` runs everything CI runs, in order, in one command: a
lockfile-vs-node_modules freshness check first (a stale local install produces
failures that look exactly like source bugs), then lint, stylelint, typecheck,
unit, integration, worker tests, and finally build + e2e. It uses
`set -euo pipefail` so a failure inside a pipeline can't be masked by the
exit code of the last command. Export `CF_API_TOKEN` to include the live
Analytics Engine SQL check.

`npm run verify:deploy` asks the deployed site what it is actually serving
rather than trusting a green workflow badge — it compares the served Next.js
build id against `build/BUILD_ID` and can assert that a marker string is
present in the served JS:

```bash
npm run verify:deploy -- --expect contact_cta_click
```

## Deployment

Hosted on **Vercel**, which builds and deploys on its own:
- every push to `main` → production deployment
- every pull request → preview deployment at its own URL

There is no deploy command and no deploy workflow. `vercel.json` holds the security headers;
`src/pages/api/message.api.ts` ships as a Vercel function alongside the prerendered pages.

Storybook is a separate repo/deploy — see [refract-ui](https://github.com/parammehta/refract-ui),
which publishes its own Storybook to `storybook.parammehta.com` from its own CI.

Deployment is decoupled from releases: release-please still versions the repo and writes the
changelog, but Vercel ships on push regardless of whether a release was cut — see [Releases](#releases).

## Releases

Versioning and site deploys are automated with [release-please](https://github.com/googleapis/release-please), split across two workflows (config in `release-please-config.json` + `.release-please-manifest.json`):

- **`.github/workflows/release.yml`** (job _Version & Release_) — runs on every push to `main`.

Flow: push Conventional Commits to `main` → release-please opens/updates a **Release PR** that bumps `package.json` and regenerates `CHANGELOG.md` → `release.yml` **auto-merges that Release PR** (squash) → the merge re-triggers `release.yml`, which tags the commit and **publishes a GitHub Release**.

Versioning only. Vercel deploys every push to `main`, so a change goes live when it merges, not when a release is cut — the Release PR's own merge is simply one more push.

Tags and release titles are plain `vX.Y.Z` (no component prefix) via `include-component-in-tag: false` in the config.

- **Auto-merge means no human gate**: every push to `main` containing a `feat:`/`fix:` (etc.) ships to production automatically. There is no batching/review window — the CI suite is the only gate.
- The merge is scoped to **only** the release-please Release PR (targeted by its exact PR number); it never touches your other PRs.
- Commit type drives the version bump: `fix:` → patch, `feat:` → minor, `feat!:`/`BREAKING CHANGE:` → major.
- Auto-merge requires a **PAT** stored as the `RELEASE_PLEASE_TOKEN` secret (Contents + Pull requests read/write), because actions taken with the default `GITHUB_TOKEN` do not trigger further workflows. The PAT is what lets the Release-PR merge re-trigger `release.yml` to tag and publish; without it the tag and release would never fire.
- The Release PR is merged with `gh pr merge --squash --auto`, which **queues** the merge behind `main`'s required status checks rather than merging immediately (a direct merge would be rejected while CI is pending). This needs the repo-wide **"Allow auto-merge"** setting enabled. `main` requires no PR *reviews* — release-please cannot approve its own PR, and a review requirement would stall every release.
- The CI build re-supplies the `NEXT_PUBLIC_*` values (stored as repo **Variables**) because they are baked in at build time. The **production** values live on the Vercel project, not in GitHub — CI's copies only feed the e2e job.
- Do not hand-edit `CHANGELOG.md`, the `version` in `package.json`, or `.release-please-manifest.json` — release-please owns them.

## Environment variables

See `.env.example`:
- `NEXT_PUBLIC_WEBSITE_URL` — canonical site URL
- `NEXT_PUBLIC_CLOUDFLARE_ANALYTICS_TOKEN` — Cloudflare Web Analytics beacon token (public); if unset, the beacon is never injected
- `NEXT_PUBLIC_ANALYTICS_EVENTS_URL` — URL of the analytics Worker that receives custom events (public); if unset, `trackEvent` no-ops in prod
- `NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_SITE_KEY` — Cloudflare Turnstile site key (public); if unset, the widget and check are skipped entirely (safe for local dev without Turnstile configured)

Server-side variables live on the Vercel project (not in `.env.example`'s public list, and never
in the repo):

| Variable | Purpose |
| --- | --- |
| `PORTFOLIO_AWS_ACCESS_KEY_ID` | IAM user scoped to `ses:SendEmail` |
| `PORTFOLIO_AWS_SECRET_ACCESS_KEY` | — |
| `PORTFOLIO_AWS_REGION` | SES region; defaults to `us-east-1` |
| `CLOUDFLARE_TURNSTILE_SECRET` | Turnstile server key; if unset, Turnstile is not enforced (honeypot still active) |

`message.api.ts` **requires** the two credential variables and throws without them. That is
deliberate: leaving `credentials` unset would hand the job to the AWS SDK's default provider
chain, which reads `~/.aws/credentials` — a local dev server would then send real mail from
whoever's laptop it was running on. It happened once during the migration; hence the guard.

A deploy that forgets the Turnstile secret is silent: the form keeps working, but every
submission passes the security check. Confirm it is actually verifying rather than failing
open — the handler checks the token before it validates the email, so an invalid token plus an
invalid email tells you which branch ran, and neither can reach SES:

```bash
curl -s -X POST https://parammehta.com/api/message/ -H 'Content-Type: application/json' \
  -H 'Origin: https://parammehta.com' \
  -d '{"email":"not-an-email","message":"probe","turnstileToken":"invalid"}'
```

`Security check failed` means the secret is live. `Please enter a valid email address` means it
is unset. Note the **trailing slash**: `trailingSlash: true` applies to API routes too, so
`/api/message` answers with a 308.

The secret's original is in the Cloudflare dashboard under Turnstile → the widget matching
`NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_SITE_KEY` → Settings → Secret Key.

## Security headers

The site's security headers (HSTS, `X-Content-Type-Options`, `X-Frame-Options`,
`Referrer-Policy`, an `upgrade-insecure-requests` CSP) are declared in **`vercel.json`**. The
values were carried over verbatim from the CloudFront response headers policy that served them
before the move, which in turn restored what a since-retired Lambda@Edge used to set.

The CSP is deliberately just `upgrade-insecure-requests` — a real `script-src` policy needs
Next's inline bootstrap, Turnstile, and the analytics beacon accounted for, which is its own
piece of work.

`Cache-Control` is not set here. The retired Lambda@Edge varied it by file extension (a year for
hashed assets, `max-age=0` for everything else), and the CloudFront policy that replaced it
could not vary a header by path. Vercel sets long-lived immutable caching on `/_next/static/*`
itself, so the gap that left is now covered by the platform rather than by config.

## Commit conventions

All commits use [Conventional Commits](https://www.conventionalcommits.org/):

| Prefix | When to use |
|---|---|
| `feat:` | New feature or functionality |
| `fix:` | Bug fix |
| `chore:` | Tooling, deps, config, build |
| `docs:` | Documentation only |
| `style:` | Formatting, whitespace (not CSS) |
| `refactor:` | Code restructure, no behavior change |
| `test:` | Adding or updating tests |

Optional scope in parens: `feat(navbar):`, `fix(contact):`. Keep the subject line under 72 characters, lowercase, no trailing period.

**PR titles must use only `feat:`, `fix:`, or `chore:`** — those three cover everything that lands on `main`. Anything else (`docs:`, `style:`, `refactor:`, `test:`) is fine on individual commits inside the branch, but the PR title (which becomes the squash-merge commit and drives release-please's version bump + changelog entry) has to be one of the three. Use `chore:` as the catch-all for any change that isn't a user-visible feature or bug fix.

These commit types also drive automated versioning and changelog generation — see [Releases](#releases).

## Guidelines for changes

- Keep the static-export constraint in mind — no `getServerSideProps`, no API routes in the Next.js app itself.
- New pages must use the `.page.tsx` (or `.page.ts`) extension or Next.js won't pick them up.
- CSS class names must be camelCase to pass stylelint.
- Do not commit `.env` — use `.env.example` as reference.
- A new component with no portfolio-specific content or data (no `AppContext`, no hardcoded
  copy/nav links) belongs in [refract-ui](https://github.com/parammehta/refract-ui), not
  `src/components/`. Adding it here means duplicating it later.
- If you need to change a `refract-ui` component's behavior, that's a PR against the
  `refract-ui` repo followed by a version bump here (`npm i refract-ui@latest`) — not a
  local patch or a re-implementation in this repo.
- MDX images get their intrinsic size from `src/utils/rehypeImgSize.ts`, a local plugin
  that replaced the unmaintained `rehype-img-size`. `image-size` has open DoS advisories
  with no fixed release, so the plugin calls `disableTypes` on the affected ICNS/JXL/HEIF
  parsers — don't reinstate the package or drop that call.
