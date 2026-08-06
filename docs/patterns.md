# Conventions and Patterns

Cross-cutting patterns used throughout the codebase.

---

## Data-Attribute Styling

Components use `data-*` attributes instead of conditional class names for visual variants:

```jsx
<div
  className={styles.button}
  data-loading={loading}
  data-secondary={secondary}
  data-icon-only={iconOnly}
>
```

```css
.button[data-secondary='true'] {
  background: transparent;
}
```

This keeps the JS clean (no class concatenation logic) and makes CSS selectors explicit about what they target.

---

## CSS Custom Properties via `cssProps`

Dynamic values are passed to CSS through inline custom properties using the `cssProps` utility:

```jsx
<div style={cssProps({ delay: 300, width: 100 })}>
// Produces: style="--delay: 300ms; --width: 100px;"
```

```css
.element {
  transition-delay: var(--delay);
  width: var(--width);
}
```

Auto-conversion rules:
- Keys containing `delay` → ms suffix
- Other numeric values (except `opacity`) → px suffix
- `opacity` stays as-is

---

## Scroll-Triggered Animations

Sections animate in when they enter the viewport. The pattern:

1. **Home.js** creates refs for each section and an `IntersectionObserver` (threshold 0.1, one-shot)
2. Observed sections are added to a `visibleSections` state array
3. Each section receives a `visible` boolean prop
4. Sections pass `visible` to `Transition` components, which drive CSS transitions via `data-visible` or status-based class names

```jsx
// In Home.js
const profileRef = useRef();
const isVisible = (ref) => visibleSections.includes(ref.current);

<Profile visible={isVisible(profileRef)} sectionRef={profileRef} />
```

---

## Transition Component Pattern

The `Transition` component bridges React state and CSS animations:

```jsx
<Transition in={visible} timeout={0}>
  {(visible, status) => (
    <div data-visible={visible} data-status={status}>
      {/* status: 'entering' | 'entered' | 'exiting' | 'exited' */}
    </div>
  )}
</Transition>
```

CSS drives the actual animation:

```css
.element {
  opacity: 0;
  transform: translateY(20px);
  transition: opacity 0.6s, transform 0.6s;
}
.element[data-visible='true'] {
  opacity: 1;
  transform: translateY(0);
}
```

---

## Staggered Entry Animations

Multiple elements animate in with increasing delays:

```jsx
{roles.map((role, index) => (
  <li key={role} style={cssProps({ delay: initDelay + 300 + index * 140 })}>
    {role}
  </li>
))}
```

```css
.role {
  opacity: 0;
  transition: opacity 0.8s var(--bezierFastoutSlowin);
  transition-delay: var(--delay);
}
.role[data-visible='true'] {
  opacity: 1;
}
```

---

## Polymorphic Components

Several components accept an `as` prop to change the rendered element:

```jsx
<Section as="article">         {/* renders <article> */}
<Text as="p" size="l">         {/* renders <p> */}
<Heading as="h3" level={2}>    {/* renders <h3> with h2 styling */}
<VisuallyHidden as="div">      {/* renders <div> */}
```

All use `forwardRef` for ref forwarding.

---

## Dynamic Imports for Heavy Components

Three.js components are code-split with `next/dynamic`:

```jsx
const HeroSphere = dynamic(() =>
  import('./HeroSphere').then(mod => mod.HeroSphere)
);

const Model = dynamic(() =>
  import('components/Model').then(mod => mod.Model)
);
```

This keeps the initial bundle small since Three.js and 3D models are only loaded when needed.

---

## Reduced Motion Support

Every animated component checks `useReducedMotion()` from Framer Motion:

- **ScrambleReveal** — skips scramble animation, shows final text immediately
- **HeroSphere** — renders a single static frame instead of animating
- **Carousel** — disables displacement transitions
- **Model** — skips entry animations, sets positions directly
- **Loader** — shows text instead of animated dots
- **useParallax** — disabled entirely
- **useScrollToHash** — uses `behavior: 'auto'` instead of `'smooth'`

---

## Adaptive Quality (3D)

The `useFps` hook monitors frame rate in animation loops:

```jsx
const { measureFps, isLowFps } = useFps(isAnimating);

// In animation loop
function animate() {
  measureFps();
  if (isLowFps.current) {
    renderer.setPixelRatio(0.5);  // Drop quality
  }
}
```

Used by `HeroSphere` and `Model` to maintain smooth performance on lower-end devices.

---

## Smart Links

The `Link` component auto-detects link type:

| Pattern | Behavior |
|---|---|
| Contains `://` | Plain `<a>` with `target="_blank"` and `rel="noreferrer noopener"` |
| Starts with `#` | Plain `<a>` (hash link) |
| Ends with `.txt`, `.png`, `.jpg` | Plain `<a>` (file link) |
| Everything else | Next.js `Link` with `scroll={false}` |

The `Button` component follows the same pattern.

---

## Viewport-Aware Lazy Loading

Heavy resources (images, textures, 3D models) only load when their container enters the viewport:

```jsx
const inViewport = useInViewport(canvasRef, true, { threshold: 0.2 });

useEffect(() => {
  if (inViewport) {
    loadTextures();
  }
}, [inViewport]);
```

The `unobserveOnIntersect` parameter (second arg, `true`) means the observer disconnects after the first intersection — resources load once and stay loaded.

---

## Contact Form Spam Protection

The contact form uses two complementary layers:

### 1. Honeypot field

A hidden "Name" field is placed in the DOM but invisible to real users:

```jsx
<Input
  className={styles.botkiller}  // display: none in CSS
  label="Name"
  {...name}
/>
```

If a bot fills it in, both the client (`Contact.js`) and the Lambda (`functions/index.js`) silently pretend to succeed without sending.

### 2. Cloudflare Turnstile

A managed Turnstile widget loads after the page is interactive (`next/script` with `strategy="afterInteractive"`). Real users pass automatically with no friction; bots are challenged:

```jsx
useEffect(() => {
  if (!scriptLoaded || !turnstileRef.current) return;
  turnstileWidgetId.current = window.turnstile.render(turnstileRef.current, {
    sitekey: process.env.NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_SITE_KEY,
    callback: setTurnstileToken,
    theme: 'auto',
  });
}, [scriptLoaded]);
```

The resulting token is submitted with the form and verified server-side in the Lambda before SES is called:

```js
const verifyRes = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
  method: 'POST',
  body: JSON.stringify({ secret: process.env.CLOUDFLARE_TURNSTILE_SECRET, response: turnstileToken }),
});
const { success } = await verifyRes.json();
if (!success) return res.status(400).json({ error: 'Security check failed.' });
```

If `NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_SITE_KEY` is absent (local dev without Turnstile configured) the widget is not rendered and the check is skipped. The Lambda similarly skips verification when `CLOUDFLARE_TURNSTILE_SECRET` is unset.

---

## Theme-Aware 3D Rendering

Three.js scenes react to theme changes:

- Light intensities differ between dark and light themes
- The `accentColor` GLSL uniform syncs with the CSS `--rgbAccent` token
- Separate `useEffect` hooks handle light setup and accent color updates

---

## Hydration Safety

Several patterns prevent SSR/client mismatches:

| Pattern | Used For |
|---|---|
| `useHasMounted()` | Gating client-only rendering (portals, video) |
| `useSyncExternalStore` | Client detection in Resume page |
| Client-side `useEffect` for dates | Locale-dependent `formatDate` in Post |
| `_document.page.js` inline script | Setting `data-theme` before hydration |
