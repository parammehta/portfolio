# Layouts and Pages

Route-specific components in `src/pages/` are page-level shells that compose primitives
from `refract-ui` and this site's own `src/components/` into full pages. Pages under
`src/pages/**/index.page.tsx` (and other `*.page.tsx` files) are thin entry points that
render these layouts.

```
src/pages/index.page.tsx
    └── src/pages/home/Home.tsx
            ├── Intro
            ├── Profile
            └── Contact

src/pages/experience/index.page.tsx
    └── src/pages/experience/ExperienceIndex.tsx   (tabbed company switcher)

src/pages/experience/<company>/index.page.tsx
    └── src/pages/experience/<company>/<Company>.tsx  (built from Experience.tsx blocks)
```

---

## App Shell (`src/shell/`)

### _app.page.tsx

The Next.js custom App wrapper. Provides:
- `AppContext` (global state via `useReducer`, defined in `shell/reducer.ts`/`shell/types.ts`)
- `ThemeProvider` and `LinkProvider` (from `refract-ui`) — `LinkProvider` is wired to
  `shell/NextLinkAdapter.tsx` so `Link`/`Button` route through `next/link` without
  `refract-ui` depending on Next directly
- `LazyMotion` (Framer Motion with `domAnimation`)
- `Navbar`
- Page transitions (`AnimatePresence mode="wait"` with opacity fade)
- A skip-to-content link (`VisuallyHidden` from `refract-ui`)
- Cloudflare Web Analytics beacon (production only, gated on `NEXT_PUBLIC_CLOUDFLARE_ANALYTICS_TOKEN`) and wiring the custom-event sink (`utils/analytics`) to the analytics Worker
- A canonical `<link>` tag derived from the router
- `ScrollRestore` (`shell/ScrollRestore.tsx`)
- Console Easter egg on mount

### reducer.ts

Global state reducer:

| Action | Effect |
|---|---|
| `setTheme` | Sets `state.theme` to the provided value |
| `toggleTheme` | Flips between `'dark'` and `'light'` |
| `toggleMenu` | Toggles `state.menuOpen` |

Initial state: `{ theme: 'dark', menuOpen: false }`. The App component then re-syncs
`theme` from localStorage (via `useLocalStorage`) once it mounts.

### _document.page.tsx

Custom Next.js Document. Sets up:
- `<html lang="en">`
- Font preloads (Gotham Medium + Book, woff2, from `shell/fonts.ts`)
- Inline `<style>` tags for `refract-ui`'s design tokens (`tokenStyles`) and this site's
  font faces (`fontStyles`)
- `<body data-theme="dark">` with an inline script for theme-flash prevention
- `<div id="portal-root">` for modals/overlays

---

## Home Page (`src/pages/home/`)

### Home.tsx

The main landing page. Unlike a normal scrolling document, `Home` is a **snap-scroll
container** (`data-scroll-container`, `onScroll`): each of its three sections —
**Intro**, **Profile**, **Contact** — occupies one full viewport pane, and a column of
dots (`nav.sectionDots`) on the side lets a visitor jump directly to a pane. Scroll
position drives `activeSection` (which dot is lit) and `scrollIndicatorHidden` (whether
Intro's scroll-down affordance shows).

An `IntersectionObserver` (threshold 0.1, one-shot, watching Intro and Profile) builds a
`visibleSections` array that drives each section's entrance animation via a `visible`
prop passed down to `Transition` components.

Experience and Skills, which used to be sections on this page, are now their own routes
(`/experience`, `/skills`) — see below.

### Intro.tsx

Hero pane with:
- `HeroSphere` (dynamically imported 3D background, `ssr: false`)
- "Param Mehta" rendered with `ScrambleReveal`
- A rotating discipline word ("Leader", "Mentor", "Full-Stack", "Coffee ☕") cycling every
  5s via `useInterval`, keyed off the current theme so it resets on theme change
- "View Resume" and "Get in touch" CTAs (desktop and a separate mobile layout)
- A scroll indicator pointing to `/#profile`

### Profile.tsx

"About Me" pane with:
- "Hi there" heading with `ScrambleReveal`
- Bio paragraphs with inline links to `/skills` and `/articles`
- "Send me a message" button linking to `/#contact`
- Profile photo with responsive srcSet and a decorative Devanagari SVG accent

Activates on `visible || focused` for keyboard accessibility.

### Contact.tsx

The contact form, rendered as the home page's third pane (`/#contact`) rather than its
own route. See [Contact Form Spam Protection](patterns.md#contact-form-spam-protection)
in Patterns for the honeypot + Turnstile details. On success it swaps to a "Message Sent"
state with a "Back to top" button; the Footer renders inside this pane.

### HeroSphere.tsx

WebGL animated sphere using raw Three.js (no React Three Fiber):
- `IcosahedronGeometry` (radius 32) with custom GLSL fragment shader
  (`heroSphere.frag.glsl`)
- Framer Motion springs for smooth mouse-follow rotation
- Adaptive quality via `useFps` (drops pixel ratio on low FPS)
- Only animates when in viewport (`useInViewport`)
- Static frame when reduced motion is preferred
- Theme-aware: light setup and the `accentColor` GLSL uniform (synced to the CSS
  `--rgbAccent` token) update in separate effects when the theme changes

---

## Experience Index (`src/pages/experience/ExperienceIndex.tsx`)

Own route (`/experience`). A tabbed company switcher (Intuit / Rivian / Walmart) with a
sliding rail marker (`ResizeObserver`-tracked) that follows the active tab, full roving-
tabindex keyboard navigation (arrow keys, Home/End), and a "See Details" button linking
to the company's detail page. Company/role data comes from `data/experience`. Uses
`ViewportPage` (`components/ViewportPage`) for its breadcrumb/title shell.

## Experience Detail (`src/pages/experience/_shared/`)

### Experience.tsx

A composable building-block system for the per-company experience detail pages. Exports:

| Component | Purpose |
|---|---|
| `ExperienceContainer` | Article wrapper |
| `ExperienceHeader` | Title, description, URL button, roles list |
| `ExperienceSection` | Section with optional background overlay |
| `ExperienceBackground` | Parallax background image with scrim |
| `ExperienceImage` | Reveal-animated image |
| `ExperienceSectionContent` | Content wrapper |
| `ExperienceSectionHeading` | Section heading |
| `ExperienceSectionText` | Section body text |
| `ExperienceTextRow` | Text row with width/alignment options |
| `ExperienceSectionColumns` | Multi-column layout |

This mirrors `components/Page` (see [Components](components.md#page)) almost exactly but
lives next to the pages that use it rather than in `src/components/`, since nothing
outside `src/pages/experience/` reuses it.

Key patterns:
- Parallax via `useParallax(0.6, ...)` on background images
- Staggered role animations (300ms base + 140ms per item)
- Data-attribute-driven styling (`data-light`, `data-full-height`, `data-padding`)

### Experience Pages

Each company has its own page in `src/pages/experience/`:

- `intuit/Intuit.tsx` — Passkeys, Design System, Amazon SSO, Agentic AI, Identity 2.0
- `rivian/Rivian.tsx` — Fleet OS experience
- `walmart/Walmart.tsx` — Walmart Global Tech experience

These are content-heavy, stateless components composing the Experience layout building
blocks. All content is hardcoded JSX.

---

## Contact (`/#contact`)

Not its own route — see [Home Page](#home-page-srcpageshome) above.
`src/pages/contact/index.page.tsx` still exists, but only as a redirect stub for the old
`/contact/` URL (still indexed/linked externally) — it sends visitors on to `/#contact`
rather than rendering a form itself.

## Resume (`src/pages/resume/Resume.tsx`)

Own route (`/resume`). PDF resume viewer built from `components/Page` blocks
(`PageHeader`, `PageSection`, `PageSectionContent`):
- Download / open-in-new-tab / "Design system" (links to refract-ui's Storybook) buttons
- Iframe embed of the PDF on desktop, text fallback on mobile/tablet — the desktop/mobile
  branch is driven by `useSyncExternalStore` over a `matchMedia` query (deliberately not
  `useWindowSize`, whose guessed initial size could otherwise briefly mount and then tear
  down the PDF iframe on a mobile visitor)

## Skills (`src/pages/skills/Skills.tsx`)

Own route (`/skills`). Uses `ViewportPage` for its breadcrumb/title shell. A table of
languages, frameworks, infrastructure/tooling, domains, and soft skills, plus a linked
list of day-to-day development tools (each link click tracked via `trackEvent`).

## Articles (`src/pages/articles/`)

- `index.page.tsx` / `Articles.tsx` — Blog listing page
- `[slug].page.tsx` — Dynamic blog post route (MDX via `mdx-bundler`)
- `_post/Post.tsx`, `_post/PostMarkdown.tsx` — Post layout and MDX-rendering wrapper

### Post.tsx

Blog post layout with:
- Banner image with parallax blur effect (`useParallax(0.004, ...)`)
- Date divider (client-side formatting via `useEffect`/`useSyncExternalStore` to avoid
  hydration mismatch)
- Staggered title word animation (100ms per word)
- Post body (children, rendered via `PostMarkdown`)
- Footer

## 404 (`src/pages/404/`)

Custom not-found page (`404.tsx`).
