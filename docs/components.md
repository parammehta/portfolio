# Components Reference

`src/components/` now holds only **site-specific** components — ones that depend on
portfolio content (`AppContext`, nav links, footer copy) or this site's routing. Every
shared, content-agnostic primitive (Button, Text, Image, Model, Carousel, ThemeProvider,
Heading, Icon, Input/TextArea, Link, List, Loader, Section, SegmentedControl, Table,
Transition, VisuallyHidden, Wordmark, Divider, ScrambleReveal, and more) was extracted into
[refract-ui](https://github.com/parammehta/refract-ui), a separately published/versioned
package. Its props and behavior are documented in that package's own
[Storybook](https://storybook.parammehta.com) — this file doesn't duplicate them.

Each component here lives in its own directory:

```
ComponentName/
  ComponentName.tsx          Implementation
  ComponentName.module.css  Styles
  index.ts                  Re-export
```

There are no `.stories.tsx` files in this repo — Storybook for shareable components moved
to refract-ui along with the components themselves. None of the components below ever had
library-shippable stories anyway, since they depend on portfolio-specific data.

---

## ArchitectureDiagram

Interactive diagram of this site's infrastructure (client, edge/CDN, storage, API,
external services, CI/CD), used on the `/articles/anatomy-of-this-site` post. Renders a
positioned node graph with animated SVG connector paths.

- A `SegmentedControl` (from refract-ui) switches between an overview and three flows —
  page load, contact form submit, and deploy — each highlighting the nodes/edges involved.
- Clicking a node toggles isolation of just that node's connected edges and shows its
  detail text in a live-region panel below the diagram.
- Below a `560px` container width the board switches to a stacked, non-scaled list of
  nodes (`compact` mode) instead of shrinking the diagram past legibility.
- Connector paths are recomputed from `offsetLeft`/`offsetTop` measurements (immune to the
  CSS `transform: scale` used to fit the board) on mount, resize (via `ResizeObserver`),
  and once web fonts finish loading.

No props — the node/edge/flow data is hardcoded for this site's own architecture.

---

## Code

Syntax-highlighted code block wrapper with a copy button, used inside MDX blog posts.

- Detects language from a `className` like `language-js` (the convention `mdx-bundler`'s
  highlighter emits) and renders it as a label.
- Renders the given `<pre>`/children via the `className`/other DOM props spread onto a
  `<pre>` element, plus an icon-only `Button` (from refract-ui) that copies the block's
  `textContent` to the clipboard and swaps a copy icon for a check icon for two seconds.

---

## Footer

Site footer. Renders copyright with the current year and a "Crafted by yours truly" link
to `/humans.txt`.

| Prop | Type | Description |
|---|---|---|
| `className` | string | Optional extra class |

---

## Meta

SEO head component (wraps `next/head`).

| Prop | Type | Default | Description |
|---|---|---|---|
| `title` | string | — | Page title |
| `description` | string | — | Meta description |
| `prefix` | string | `'Param Mehta'` | Title prefix (joined with ` \| `) |
| `ogImage` | string | `social-image.png` | OpenGraph image URL |
| `ogType` | `'website' \| 'article'` | `'website'` | OpenGraph type |
| `publishedTime` | string | — | ISO date; only rendered when `ogType` is `'article'` |

Outputs OpenGraph and Twitter Card (`summary_large_image`) meta tags. The canonical
`og:url` is derived from the router the same way `_app.page.tsx` computes its `<link
rel="canonical">`, so the two always agree.

---

## Navbar

Site navigation header. No props — uses hooks (`useAppContext`, `useScrollToHash`,
`useWindowSize`) and the router for all state.

**Desktop:** Logo link, horizontal nav links with scroll-spy active state, social icon
links, theme toggle.

**Mobile:** Logo, hamburger toggle (`NavToggle`), animated drawer with nav links and theme
toggle.

**Scroll-spy:** On the home route, an `IntersectionObserver` highlights the nav link
matching the currently visible `/#hash` section (tracked via `hashIds` derived from
`navData.ts`).

**Theme inversion:** On light theme, monitors scroll to detect when nav items overlap
`[data-invert]` sections and dynamically flips item themes for contrast.

Navigation data in `navData.ts`:
- Nav links: Profile (`/#profile`), Experience (`/experience`), Skills (`/skills`), Resume
  (`/resume`), Articles (`/articles`), Contact (`/#contact`)
- Social links: Twitter, LinkedIn, GitHub

Sub-components in the same directory: `NavToggle` (hamburger button), `NavbarSubmenu`
(`NavGroup`, unused by any current link but kept for a future submenu), `ThemeToggle`.

---

## Page

A composable building-block system for long-form, normally-scrolling pages (articles,
posts, resume, experience detail pages). Exports (all in `src/components/Page/Page.tsx`):

| Component | Purpose |
|---|---|
| `PageHeader` | Title (`ScrambleReveal`), description, optional link button, optional breadcrumbs and role list |
| `PageContainer` | `<article>` wrapper |
| `PageSection` | Section with optional background overlay, `light`/`fullHeight`/`padding` data attributes |
| `PageBackground` | Parallax background image with scrim (`useParallax(0.6, ...)`) |
| `PageImage` | Reveal-animated image |
| `PageSectionContent` | Content wrapper (`width` data attribute) |
| `PageSectionHeading` | Section heading |
| `PageSectionText` | Section body text |
| `PageTextRow` | Text row with width/alignment/justify options |
| `PageSectionColumns` | Multi-column layout |

Used by the Resume page and the experience index. The near-identical
`Experience*`-prefixed set in `src/pages/experience/_shared/Experience.tsx` follows the
same pattern for the per-company experience detail pages, but lives alongside those pages
rather than in `src/components/` since it isn't reused elsewhere — see
[Layouts and Pages](layouts-and-pages.md#experience-detail-srcpagesexperience_shared).

---

## StructuredData

Injects JSON-LD structured data into `<head>` via `next/head`.

| Prop | Type | Description |
|---|---|---|
| `schema` | `object \| object[]` | JSON-LD schema object(s), serialized with `JSON.stringify` |

Used with schema builders in `utils/structuredData.ts` (e.g. `personSchema`).

---

## ViewportPage

Shell for routes that must fit exactly one viewport: breadcrumbs and a title
(`ScrambleReveal`) at the top, then a content region that takes whatever height is left.

| Prop | Type | Description |
|---|---|---|
| `title` | string | Page title |
| `breadcrumbs` | `BreadcrumbItem[]` | Optional breadcrumb trail (type from refract-ui) |
| `className` | string | Optional extra class |
| `children` | ReactNode | Content region |

Since these routes have no parent `IntersectionObserver` to reveal them, the entrance
animation is driven off mount (`requestAnimationFrame` before flipping `visible`) instead.
Used by the Skills and Experience index pages. Routes with inherently long content use
`components/Page` instead and scroll normally.
