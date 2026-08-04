# Layouts and Pages

## Layout System

Layouts in `src/layouts/` are page-level shells that compose components into full pages. Pages in `src/pages/` are thin entry points that render layouts.

```
src/pages/index.page.js
    └── src/layouts/Home/Home.js
            ├── Intro
            ├── Profile
            ├── ExperienceGroup (x3)
            │     └── ExperienceSummary (x N)
            ├── Skills
            └── Footer
```

---

## App Shell (`src/layouts/App/`)

### _app.page.js

The Next.js custom App wrapper. Provides:
- `AppContext` (global state via `useReducer`)
- `ThemeProvider` (dark/light theming)
- `LazyMotion` (Framer Motion with `domAnimation`)
- `Navbar`
- Page transitions (`AnimatePresence mode="wait"` with opacity fade)
- Fathom analytics (production only)
- Console Easter egg on mount

### reducer.js

Global state reducer:

| Action | Effect |
|---|---|
| `setTheme` | Sets `state.theme` to the provided value |
| `toggleTheme` | Flips between `'dark'` and `'light'` |
| `toggleMenu` | Toggles `state.menuOpen` |

Initial state: `{ menuOpen: false }`. Theme is initialized from localStorage in the App component.

### _document.page.js

Custom Next.js Document. Sets up:
- `<html lang="en">`
- Font preloads (Gotham Medium + Book, woff2)
- Inline `<style>` tags for design tokens and font faces
- `<body data-theme="dark">` with inline script for theme flash prevention
- `<div id="portal-root">` for modals/overlays

---

## Home Page (`src/layouts/Home/`)

### Home.js

The main landing page. Renders sections in order:

1. **Intro** — Hero with 3D sphere, name, and rotating subtitle
2. **Profile** — "About Me" with bio and photo
3. **Experience** — Section header + three company groups
4. **Skills** — Tech table + tools list
5. **Footer**

Uses two `IntersectionObserver` instances:
- One watches 13 section refs (threshold 0.1, one-shot) to build a `visibleSections` array for scroll-triggered animations
- One toggles `scrollIndicatorHidden` when the intro leaves the viewport

All experience content is declared inline in JSX props.

### Intro.js

Hero section with:
- `DisplacementSphere` (dynamically imported 3D background)
- "Param Mehta" rendered with `DecoderText`
- Rotating discipline words ("Leader", "Mentor", "Full-Stack", "Coffee") cycling every 5s via `useInterval`
- Scroll indicator pointing to `/#profile`

Re-transitions the entire section when theme changes (keyed on `theme.themeId`).

### Profile.js

"About Me" section with:
- "Hi there" heading with `DecoderText`
- Bio paragraphs with inline links
- "Send me a message" button linking to `/contact`
- Profile photo with responsive srcSet
- Decorative Devanagari SVG

Activates on `visible || focused` for keyboard accessibility.

### ExperienceGroup.js

Company wrapper showing:
- Company logo (with optional `invertOnDark` for dark-mode CSS filter)
- Children (ExperienceSummary cards)
- Divider at the end

Uses `data-first` attribute on the first group for CSS spacing.

### ExperienceSummary.js

Individual role card with:
- Details column: title, date range, bulleted description (split on `. `), "See Details" button
- Preview column: dynamically imported 3D device `Model` with screen textures
- `alternate` prop flips the column order

### DisplacementSphere.js

WebGL animated sphere using raw Three.js (no React Three Fiber):
- `SphereGeometry` (32 radius, 128x128 segments)
- Custom GLSL shaders with `time` and `accentColor` uniforms
- Framer Motion springs for smooth mouse-follow rotation
- Adaptive quality via `useFps` (drops pixel ratio to 0.5 on low FPS)
- Only animates when in viewport
- Static frame when reduced motion is preferred

### SectionHeader.js

Standalone section header with optional eyebrow tag (Divider + label) and `DecoderText` heading.

### Skills.js

Pure presentational section with:
- "Skills" heading with `DecoderText`
- Tech table (Languages, Frameworks, Infrastructure, Domains, Soft Skills)
- Development tools list with external links

---

## Experience Detail (`src/layouts/Experience/`)

### Experience.js

A composable building-block system for experience detail pages. Exports:

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

Key patterns:
- Parallax via `useParallax(0.6, ...)` on background images
- Staggered role animations (300ms base + 140ms per item)
- Data-attribute-driven styling (`data-light`, `data-full-height`, `data-padding`)

### Experience Pages

Each company has its own page in `src/pages/experience/`:

- `intuit/Intuit.js` — Passkeys, Design System, Amazon SSO, Agentic AI, Identity 2.0
- `rivian/Rivian.js` — Fleet OS experience
- `walmart/Walmart.js` — Walmart Global Tech experience

These are content-heavy, stateless components composing the Experience layout building blocks. All content is hardcoded JSX.

---

## Project Detail (`src/layouts/Project/`)

### Project.js

Identical composable system to Experience.js but with `Project`-prefixed exports. Separate CSS module. Reused by the Resume page.

---

## Blog (`src/layouts/Post/`)

### Post.js

Blog post layout with:
- Banner image with parallax blur effect (`useParallax(0.004, ...)`)
- Date divider (client-only formatting via `useEffect` to avoid hydration mismatch)
- Staggered title word animation (100ms per word)
- Post body (children)
- Footer

---

## Other Pages

### Contact (`src/pages/contact/Contact.js`)

Contact form with:
- Email input + message textarea (using `useFormInput`)
- Hidden honeypot field for bot detection
- POST to `NEXT_PUBLIC_API_URL/message`
- Success/error states with animated transitions
- Staggered form element entry animations

### Resume (`src/pages/resume/Resume.js`)

PDF resume viewer:
- Iframe embed on desktop, text fallback on mobile/tablet
- Uses `useSyncExternalStore` for hydration-safe client detection
- Reuses Project layout components

### Articles (`src/pages/articles/`)

- `index.page.js` — Blog listing page
- `[slug].page.js` — Dynamic blog post route (MDX via `mdx-bundler`)

### 404 (`src/pages/404/`)

Custom not-found page.
