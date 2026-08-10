# Portfolio — parammehta.com

Personal portfolio site for Param Mehta. Next.js static-export app with Storybook component library.

## Quick reference

| What | Command |
|---|---|
| Dev server | `npm run dev` |
| Storybook | `npm run storybook` (port 9009) |
| Build (static export) | `npm run build` |
| Tests | `npm test` |
| Tests (watch) | `npm run test:watch` |
| Deploy site | `npm run deploy` |
| Deploy Storybook | `npm run deploy:storybook` |
| Deploy API functions | `npm run deploy:functions` |

## Node version

**Node 24.12.0** is required (see `.nvmrc`). The shell default may be v16 — always ensure the correct version is on PATH before running any tooling. In Claude Code launch configs, the full nvm path is already set.

## Architecture

- **Framework**: Next.js with `output: 'export'` (static HTML, no SSR at runtime)
- **Pages**: use the `.page.tsx` (or `.page.ts`) extension — `pageExtensions` in `next.config.js` is `['page.tsx', 'page.ts', 'api.ts']`. Regular `.ts`/`.tsx` files in `src/pages/` are non-page helpers.
- **Routing**: file-based via Next.js — `src/pages/index.page.tsx` → `/`, `src/pages/contact/index.page.tsx` → `/contact/`, etc. `trailingSlash: true`, so routes resolve as `route/index.html`.
- **Styling**: CSS Modules (`.module.css`). camelCase class names (`selectorClassPattern: ^[a-z][a-zA-Z0-9]+$`).
- **Imports**: `jsconfig.json` sets `baseUrl: "src"`, so import from `components/Button`, `utils/style`, `hooks/useWindowSize`, etc. — no `../` chains needed.
- **3D**: Three.js for the hero displacement sphere and device models. Draco decoder is copied to `public/draco/` at build time.
- **SVG**: imported as React components via `@svgr/webpack`. Use `?url` query to force asset URL import instead.
- **Analytics**: Fathom (client-side, env var `NEXT_PUBLIC_FATHOM_ID`).

## Project structure

```
src/
  components/   — reusable UI (Button, Navbar, Image, Model, Page, etc.)
  hooks/        — custom React hooks
  shell/        — app-wide chrome (global CSS, reducer, ScrollRestore)
  pages/        — Next.js pages (*.page.tsx) and co-located route components
  utils/        — pure helpers (clamp, date, style, throttle, etc.)
  assets/       — images and static assets imported by components
public/         — static files served at root (favicons, resume PDF, OG images, draco decoder)
functions/      — serverless API functions (separate deploy via serverless framework)
scripts/        — build-time scripts (sitemap generation, draco copy, CloudFront invalidation)
```

## Component conventions

Each component lives in its own directory:
```
src/components/Button/
  Button.js          — component implementation
  Button.module.css  — styles
  Button.stories.js  — Storybook story
  index.js           — re-export
```

## Linting & formatting

- **ESLint**: flat config (`eslint.config.mjs`) — `@eslint/js` recommended + `eslint-config-next` + `eslint-plugin-storybook`. Enforces semicolons.
- **Stylelint**: `stylelint-config-standard` + `stylelint-config-css-modules`. camelCase selectors/custom properties.
- **Prettier**: configured via `.prettierrc`.

## Testing

- **Jest** with `jest-environment-jsdom` and React Testing Library.
- SVG imports are mocked as React components (`__mocks__/svgMock.js`), other assets as strings (`__mocks__/fileMock.js`).
- `moduleDirectories` includes `src/` to match the `baseUrl` import style.

## Deployment

Static site deployed to S3 + CloudFront:
- `npm run build` → `next build` then moves `out/` to `build/`
- `npm run deploy` → syncs `build/` to S3, invalidates CloudFront cache
- Storybook builds to `build-storybook/`, deployed to a separate S3 bucket

The site deploy also runs automatically on release — see [Releases](#releases). The `npm run deploy` scripts remain available for manual/out-of-band deploys.

## Releases

Versioning and site deploys are automated with [release-please](https://github.com/googleapis/release-please), split across two workflows (config in `release-please-config.json` + `.release-please-manifest.json`):

- **`.github/workflows/release.yml`** (job _Version & Release_) — runs on every push to `main`.
- **`.github/workflows/deploy.yml`** (job _Build & Deploy_) — runs on the `release: published` event (or manual `workflow_dispatch`).

Flow: push Conventional Commits to `main` → release-please opens/updates a **Release PR** that bumps `package.json` and regenerates `CHANGELOG.md` → `release.yml` **auto-merges that Release PR** (squash) → the merge re-triggers `release.yml`, which tags the commit and **publishes a GitHub Release** → that published-release event triggers `deploy.yml` (build + `aws s3 sync` + CloudFront invalidation). Deploy runs only when a release is actually cut, not on every push.

Tags and release titles are plain `vX.Y.Z` (no component prefix) via `include-component-in-tag: false` in the config.

- **Auto-merge means no human gate**: every push to `main` containing a `feat:`/`fix:` (etc.) ships to production automatically. There is no batching/review window.
- The merge is scoped to **only** the release-please Release PR (targeted by its exact PR number); it never touches your other PRs.
- Commit type drives the version bump: `fix:` → patch, `feat:` → minor, `feat!:`/`BREAKING CHANGE:` → major.
- Auto-merge requires a **PAT** stored as the `RELEASE_PLEASE_TOKEN` secret (Contents + Pull requests read/write), because actions taken with the default `GITHUB_TOKEN` do not trigger further workflows. The PAT is what lets (1) the Release-PR merge re-trigger `release.yml` to tag/publish, and (2) the published GitHub Release fire the `release` event that `deploy.yml` listens for — otherwise the release/tag/deploy would never fire. (The direct squash merge needs no repo-wide "Allow auto-merge" setting.)
- The CI build re-supplies the `NEXT_PUBLIC_*` values (stored as repo **Variables**) because they are baked in at build time for the static export. AWS credentials are stored as repo **Secrets** (`AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`). The CloudFront distribution ID and S3 bucket are hardcoded in the deploy scripts, so they need no secrets.
- Scope is the **site only** — the `functions/` Lambda is deployed separately via `npm run deploy:functions`.
- Do not hand-edit `CHANGELOG.md`, the `version` in `package.json`, or `.release-please-manifest.json` — release-please owns them.

## Environment variables

See `.env.example`:
- `NEXT_PUBLIC_WEBSITE_URL` — canonical site URL
- `NEXT_PUBLIC_API_URL` — API endpoint for contact form / functions (`https://api.parammehta.com`)
- `NEXT_PUBLIC_FATHOM_ID` / `NEXT_PUBLIC_FATHOM_URL` — analytics
- `NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_SITE_KEY` — Cloudflare Turnstile site key (public); if unset, the widget and check are skipped entirely (safe for local dev without Turnstile configured)

The Lambda (`functions/`) also requires a secret at deploy time — pass it as an env var:
```bash
CLOUDFLARE_TURNSTILE_SECRET=<secret> npm run deploy:functions
```
The secret is stored as a Lambda environment variable via `serverless.yml`'s `${env:CLOUDFLARE_TURNSTILE_SECRET, ''}` reference. If the variable is absent the Lambda skips Turnstile verification (honeypot still active).

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
