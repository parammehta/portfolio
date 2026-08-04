# Components Reference

All components live in `src/components/` with a consistent directory structure:

```
ComponentName/
  ComponentName.js          Implementation
  ComponentName.module.css  Styles
  ComponentName.stories.js  Storybook story
  index.js                  Re-export
```

Components are re-exported from `src/components/index.js` for convenient imports.

---

## Button

Polymorphic button/link component.

| Prop | Type | Default | Description |
|---|---|---|---|
| `href` | string | — | If set, renders as a link. External URLs (`://`) render `<a>`, internal use Next.js `Link` |
| `secondary` | boolean | — | Secondary visual style |
| `loading` | boolean | — | Shows animated `Loader` overlay |
| `loadingText` | string | `'loading'` | Screen reader text during loading |
| `icon` | string | — | Leading icon name |
| `iconEnd` | string | — | Trailing icon name |
| `iconOnly` | boolean | — | Hides text, shows only icon |
| `iconHoverShift` | boolean | — | Icon shifts on hover |
| `as` | elementType | — | Override rendered element |

External links automatically get `rel="noopener noreferrer"` and `target="_blank"`.

---

## Carousel

WebGL-powered image carousel with displacement-shader transitions.

| Prop | Type | Default | Description |
|---|---|---|---|
| `width` | number | — | Canvas width |
| `height` | number | — | Canvas height |
| `images` | `Array<{alt, src, srcSet}>` | — | Slide images |
| `placeholder` | string | — | Placeholder shown while textures load |

Features: pointer swipe/drag, keyboard nav (arrow keys), dot navigation, spring-based transitions. Respects reduced motion. Lazy-loads textures when in viewport.

---

## Code

Syntax-highlighted code block with copy button.

Detects language from className (e.g., `language-js`). Renders a language label, `<pre>` block, and a copy-to-clipboard button with check feedback.

---

## ScrambleReveal

Animated text reveal that scrambles through Devanagari glyphs before settling on the target text.

| Prop | Type | Default | Description |
|---|---|---|---|
| `text` | string | — | Final text to reveal |
| `start` | boolean | `true` | Whether to begin the animation |
| `delay` | number | `0` | Delay before animation starts (ms) |

Uses `framer-motion` springs. Directly manipulates `innerHTML` for performance (avoids per-frame React re-renders). Respects reduced motion. Renders a `VisuallyHidden` element with the real text for screen readers.

---

## Divider

Horizontal line with an optional notch accent.

| Prop | Type | Default | Description |
|---|---|---|---|
| `lineWidth` | string | `'100%'` | Line width |
| `lineHeight` | string | `'2px'` | Line thickness |
| `notchWidth` | string | `'90px'` | Notch width |
| `notchHeight` | string | `'10px'` | Notch height |
| `collapsed` | boolean | `false` | Animate to collapsed state |
| `collapseDelay` | number | `0` | Delay before collapse (ms) |
| `notch` | boolean | `true` | Show the notch |
| `light` | boolean | `false` | Light color variant |

---

## Footer

Site footer. Renders copyright with current year and a "Crafted by yours truly" link to `/humans.txt`.

---

## Heading

Polymorphic heading element.

| Prop | Type | Default | Description |
|---|---|---|---|
| `level` | number | `1` | Heading level (0-5). Level 0 renders as `<h1>` with `data-level={0}` |
| `as` | elementType | — | Override element (e.g., `'h3'`) |
| `align` | string | `'auto'` | Text alignment |
| `weight` | string | `'medium'` | Font weight |

---

## Icon

SVG icon component. Looks up icons by name from an internal map.

| Prop | Type | Description |
|---|---|---|
| `icon` | string | Icon name key |

Available icons: `arrowLeft`, `arrowRight`, `articles`, `company`, `check`, `chevronRight`, `close`, `copy`, `error`, `figma`, `github`, `link`, `linkedin`, `menu`, `pause`, `play`, `send`, `skills`, `twitter`.

---

## Image

Responsive image/video component with lazy loading, placeholder fade-out, and reveal animations.

| Prop | Type | Default | Description |
|---|---|---|---|
| `src` | string | — | Image/video source (`.mp4` renders as video) |
| `srcSet` | string/array | — | Responsive image sources |
| `placeholder` | string | — | Low-res placeholder image |
| `reveal` | boolean | — | Enable reveal animation |
| `delay` | number | `0` | Reveal delay (ms) |
| `raised` | boolean | — | Raised shadow style |
| `alt` | string | — | Alt text |
| `sizes` | string | — | Sizes attribute for srcSet |

Videos render as `<video>` (muted, looped, playsInline) with play/pause toggle. Lazy-loads full source when in viewport via `useInViewport`. Respects reduced motion for video autoplay.

---

## Input / TextArea

Form input with floating label, underline focus indicator, and animated error messages.

| Prop | Type | Default | Description |
|---|---|---|---|
| `id` | string | — | Input ID (auto-generated if omitted) |
| `label` | string | — | Floating label text |
| `value` | string | — | Current value |
| `multiline` | boolean | — | Renders `TextArea` instead |
| `error` | string | — | Error message |
| `required` | boolean | — | HTML5 required |
| `maxLength` | number | — | Max character count |

`TextArea` auto-grows based on content, measuring line height and scroll height.

---

## Link

Smart link component.

| Prop | Type | Description |
|---|---|---|
| `href` | string | Destination URL |
| `secondary` | boolean | Secondary style variant |

External URLs (containing `://`), hash links (`#`), and file extensions (`.txt`, `.png`, `.jpg`) render as plain `<a>` tags. Everything else uses Next.js `Link` with `scroll={false}`.

---

## List / ListItem

Thin wrappers around `<ul>`/`<ol>` and `<li>` for consistent styling.

| Prop (List) | Type | Default | Description |
|---|---|---|---|
| `ordered` | boolean | — | Renders `<ol>` instead of `<ul>` |

---

## Loader

Animated loading indicator with three animated spans.

| Prop | Type | Default | Description |
|---|---|---|---|
| `size` | number | `32` | Size in pixels |
| `text` | string | `'Loading...'` | Screen reader text |

Renders a `VisuallyHidden` `aria-live="assertive"` announcement via portal. Falls back to text display when reduced motion is preferred.

---

## Meta

SEO head component.

| Prop | Type | Default | Description |
|---|---|---|---|
| `title` | string | — | Page title |
| `description` | string | — | Meta description |
| `prefix` | string | `'Param Mehta'` | Title prefix (joined with ` \| `) |
| `ogImage` | string | `social-image.png` | OpenGraph image URL |

Outputs OpenGraph and Twitter Card (`summary_large_image`) meta tags.

---

## Model

Three.js 3D device model viewer (phones and laptops).

| Prop | Type | Default | Description |
|---|---|---|---|
| `models` | array | — | Model configs (type, textures, position, etc.) |
| `show` | boolean | `true` | Whether to show the model |
| `showDelay` | number | `0` | Entry animation delay (ms) |
| `cameraPosition` | object | `{x:0, y:0, z:8}` | Camera position |
| `alt` | string | — | Accessible description |

Features: mouse-tracking rotation (framer-motion springs), adaptive quality (drops pixel ratio on low FPS), shadow rendering with blur passes, two animation types (`SpringUp` for phones, `LaptopOpen` for laptops), two-phase texture loading (placeholder then full-res with crossfade).

Device types defined in `deviceModels.js`:
- `phone` — iPhone 11 model (374x512 screen)
- `laptop` — MacBook Pro model (1280x800 screen)

---

## Wordmark

SVG logo/monogram with optional highlight.

| Prop | Type | Description |
|---|---|---|
| `highlight` | boolean | Show highlighted overlay |

Uses `useId()` for unique SVG clip-path IDs.

---

## Navbar

Site navigation header. No props — uses hooks for all state.

**Desktop:** Logo link, horizontal nav links with scroll-spy active state, social icon links, theme toggle.

**Mobile:** Logo, hamburger toggle, animated drawer with nav links and theme toggle.

**Scroll-spy:** On the home route, an `IntersectionObserver` highlights the nav link matching the currently visible section.

**Theme inversion:** On light theme, monitors scroll to detect when nav items overlap `[data-invert]` sections and dynamically flips item themes for contrast.

Navigation data in `navData.js`:
- Nav links: Profile, Experience, Skills, Resume, Articles, Contact
- Social links: Twitter, LinkedIn, GitHub

---

## Section

Generic section wrapper. Polymorphic via `as` prop (default `'div'`). Uses `forwardRef`.

---

## SegmentedControl

Radio-group style segmented control with animated indicator.

| Prop | Type | Description |
|---|---|---|
| `currentIndex` | number | Selected option index |
| `onChange` | function | Called with new index on selection |
| `label` | string | Accessible label |

Options self-register via React Context. Indicator position tracked with `ResizeObserver`. Keyboard nav with arrow keys (roving tabindex pattern).

---

## Table

Thin wrappers around HTML table elements: `Table`, `TableRow`, `TableHead`, `TableBody`, `TableHeadCell`, `TableCell`. Purely presentational.

---

## Text

Polymorphic text component.

| Prop | Type | Default | Description |
|---|---|---|---|
| `size` | string | `'m'` | Text size variant |
| `as` | elementType | `'span'` | Rendered element |
| `align` | string | `'auto'` | Text alignment |
| `weight` | string | `'auto'` | Font weight |
| `secondary` | boolean | — | Secondary color |

---

## Transition

CSS transition orchestrator. Wraps Framer Motion's `AnimatePresence`/`usePresence`.

| Prop | Type | Default | Description |
|---|---|---|---|
| `in` | boolean | — | Whether content is shown |
| `timeout` | number/object | `0` | Duration in ms, or `{enter, exit}` |
| `unmount` | boolean | — | Remove from DOM after exit |
| `onEnter` | function | — | Called when entering starts |
| `onEntered` | function | — | Called when entering completes |
| `onExit` | function | — | Called when exiting starts |
| `onExited` | function | — | Called when exiting completes |

Children is a render function: `(visible: boolean, status: string) => ReactNode`. Status is one of `'entering'`, `'entered'`, `'exiting'`, `'exited'`.

---

## VisuallyHidden

Screen-reader-only element. Hidden via CSS but accessible.

| Prop | Type | Default | Description |
|---|---|---|---|
| `as` | elementType | `'span'` | Rendered element |
| `showOnFocus` | boolean | — | Become visible when focused (for skip links) |
| `visible` | boolean | — | Override to make always visible |
