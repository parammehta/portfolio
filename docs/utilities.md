# Utilities Reference

All utilities live in `src/utils/`. Import via the `baseUrl`:

```ts
import { clamp } from 'utils/clamp';
import { cssProps, classes, media } from 'utils/style';
```

Two former members of this module — `image` (`loadImageFromSrcSet`, `srcSetToString`,
`generateImage`, `resolveSrcFromSrcSet`) and `delay` (async sleep) — moved to
[refract-ui](https://github.com/parammehta/refract-ui) along with the components that
used them (`Image`, `Carousel`, `Model`). Import them from `refract-ui` if you need them;
they're no longer duplicated here.

---

## clamp

```ts
clamp(value, boundOne, boundTwo?)
```

Clamps a number within bounds. With two bounds, clamps between them (order-agnostic). With one bound, clamps to a maximum of `boundOne`.

```ts
clamp(15, 0, 10);  // 10
clamp(-5, 0, 10);  // 0
clamp(15, 10);     // 10
```

---

## date

```ts
formatDate(date)
```

Formats a date string or Date object using `toLocaleDateString` with full month name, 2-digit day, and numeric year.

```ts
formatDate('2024-03-15');  // "March 15, 2024"
```

---

## mdx

Server-side utility for MDX blog posts.

- `POSTS_PATH` — absolute path to `src/posts` directory
- `postFilePaths` — array of `.md`/`.mdx` filenames found at build time

---

## structuredData

Builds JSON-LD schema objects consumed by `components/StructuredData` (see
[Components](components.md#structureddata)).

### personSchema

```ts
personSchema();
```

Builds a `Person` schema for the homepage: name, `NEXT_PUBLIC_WEBSITE_URL`, job title, and
`sameAs` links pulled from `Navbar`'s `socialLinks` (excluding the Storybook link).

### blogPostingSchema

```ts
blogPostingSchema({ title, description, datePublished, image, url });
```

Builds a `BlogPosting` schema for an article page.

---

## style

### media

Breakpoint map:

```ts
{
  desktop: 2080,
  laptop: 1680,
  tablet: 1040,
  mobile: 696,
  mobileS: 400,
}
```

### pxToNum / numToPx

```ts
pxToNum('16px');  // 16
numToPx(16);      // '16px'
```

### pxToRem

```ts
pxToRem(32);  // '2rem'  (divides by 16)
```

### msToNum / numToMs

```ts
msToNum('300ms');  // 300
numToMs(300);      // '300ms'
```

### rgbToThreeColor

```ts
rgbToThreeColor('255 128 0');  // [1, 0.502, 0]
```

Converts space-separated RGB string to Three.js-compatible 0-1 float array.

### cssProps

```ts
cssProps({ delay: 300, opacity: 0.5, width: 100 }, existingStyle);
// { '--delay': '300ms', '--opacity': 0.5, '--width': '100px', ...existingStyle }
```

Converts an object to CSS custom property style object. Auto-converts numeric values: `delay` keys become `ms`, other numerics (except `opacity`) become `px`.

### classes

```ts
classes(styles.button, isActive && styles.active, className);
// Joins truthy values with spaces, filters out falsy
```

Simple classnames utility for concatenating CSS module classes.

`refract-ui` has its own internal copy of `style.ts` (used by its own components) — this
one is this site's, and the two are not shared.

---

## three

Three.js setup and cleanup helpers.

### Loaders

- `getModelLoader(decoderPath = '/draco/')` — returns a `GLTFLoader` configured with the
  Draco decoder, constructed lazily on first call and cached per decoder path (so
  importing this module has no side effect)
- `textureLoader` — shared `TextureLoader` instance

### Cleanup functions

```ts
cleanScene(scene);       // Disposes all mesh geometries and materials in a scene
cleanMaterial(material); // Disposes a material and all its texture properties
cleanRenderer(renderer); // Disposes and nulls a WebGL renderer
removeLights(lights);    // Removes an array of lights from their parents
```

### Traversal

```ts
const child = getChild('Screen', gltfScene);
```

Traverses a Three.js object tree and returns the first child matching the name.

`refract-ui` has its own internal copy of `three.ts` (used by its `Model`/`Carousel`
components) — this one is only used by this site's `HeroSphere`.

---

## throttle

```ts
const throttled = throttle(handleScroll, 100);
```

Classic throttle: invokes `func` at most once per `timeFrame` milliseconds, dropping intermediate calls.

---

## timecode

### formatTimecode

```ts
formatTimecode(90061000);  // "25:01:01:00"
```

Converts milliseconds to `HH:MM:SS:CC` format (centiseconds).

### zeroPrefix

```ts
zeroPrefix(5);  // "05"
```

Pads single-digit numbers with a leading zero.

---

## analytics

Custom-event instrumentation — see
[Custom Event Analytics](patterns.md#custom-event-analytics) in Patterns for the full
picture (pageviews are handled separately by the Cloudflare Web Analytics beacon).

```ts
import { analyticsEvents, trackEvent } from 'utils/analytics';

trackEvent(analyticsEvents.contactSubmit);
trackEvent(analyticsEvents.navLinkClick, { label: 'Skills' });
```

- `analyticsEvents` — the fixed set of event names used across the app
- `trackEvent(name, props?)` — fires an event through the currently-installed sink; safe
  to call anywhere, never throws
- `setAnalyticsSink(sink | null)` — swaps the destination; `_app.page.tsx` calls this once
  on mount to point at the analytics Worker in production
- `createBeaconSink(url)` — builds a sink that POSTs to the given URL via
  `navigator.sendBeacon` (falling back to `fetch(..., { keepalive: true })`)
