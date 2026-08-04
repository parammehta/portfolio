# Hooks Reference

All hooks live in `src/hooks/`. Most are re-exported from `src/hooks/index.js` (exception: `useFps` must be imported directly).

---

## useAppContext

```js
const { dispatch, ...state } = useAppContext();
```

Convenience wrapper around `useContext(AppContext)`. Returns the global app state (theme, menuOpen) and dispatch function from the reducer in `_app.page.js`.

---

## useFormInput

```js
const emailInput = useFormInput('');
// Spread onto input: <Input {...emailInput} />
```

**Params:** `initialValue` (string, default `''`)

**Returns:** `{ value, error, onChange, onBlur, onInvalid }`

Manages form input state with HTML5 constraint validation. Tracks dirty state, suppresses native validation popups, validates on blur after interaction, and clears errors as soon as input becomes valid. Designed to be spread onto `<Input>` components.

---

## useFps

```js
import { useFps } from 'hooks/useFps';

const { measureFps, fps, isLowFps } = useFps(true);
```

**Params:** `running` (boolean, default `true`)

**Returns:** `{ measureFps: () => void, fps: MutableRefObject<number>, isLowFps: MutableRefObject<boolean> }`

Measures rendering frame rate. Call `measureFps()` inside an animation loop. Samples every 100ms, keeps a 9-entry sliding window, and flags `isLowFps` when all recent samples are below 60 FPS (clears when all exceed 70). Used by `HeroSphere` and `Model` for adaptive quality.

> Not exported from the barrel file — import directly from `hooks/useFps`.

---

## useHasMounted

```js
const hasMounted = useHasMounted();
```

**Params:** none  
**Returns:** `boolean` — `false` during SSR/initial render, `true` after mount

Hydration-safe flag for client-only rendering. Returns `false` on the server, flips to `true` after `useEffect` fires.

---

## useInViewport

```js
const isVisible = useInViewport(ref, true, { threshold: 0.1 });
```

**Params:**
- `elementRef` — React ref to observe
- `unobserveOnIntersect` — stop observing after first intersection (for one-time animations)
- `options` — `IntersectionObserver` options (default `{}`)
- `shouldObserve` — conditional observation toggle (default `true`)

**Returns:** `boolean` — whether the element is intersecting the viewport

Used extensively for lazy loading (Image, Carousel, Model) and scroll-triggered animations.

---

## useInterval

```js
useInterval(() => {
  setIndex(i => (i + 1) % items.length);
}, 5000);
```

**Params:**
- `callback` — function to call on each tick
- `delay` — interval in ms, or `null` to pause
- `reset` — any value; changing it restarts the interval

**Returns:** nothing (side-effect only)

Declarative `setInterval` (Dan Abramov pattern). Stores latest callback in a ref to avoid stale closures. Used in `Intro` for cycling discipline text.

---

## useLocalStorage

```js
const [theme, setTheme] = useLocalStorage('theme', 'dark');
```

**Params:** `key` (string), `initialValue` (any)

**Returns:** `[storedValue, setValue]` — useState-like tuple persisted to `localStorage`

Reads initial value from localStorage (falls back to `initialValue`). Supports functional updates like `useState`.

---

## useParallax

```js
useParallax(0.6, value => {
  element.current.style.setProperty('--offset', `${value}px`);
});
```

**Params:**
- `multiplier` — scroll position multiplier
- `onChange` — callback receiving the computed offset value

**Returns:** nothing (side-effect only)

Scroll-based parallax effect. Calculates `scrollY * multiplier`, clamps to `[-innerHeight, innerHeight]`, passes to `onChange` on each frame (throttled via rAF). Disabled when user prefers reduced motion.

---

## usePrevious

```js
const prevCount = usePrevious(count);
```

**Params:** `value` (any)

**Returns:** the value from the previous render (`undefined` on first render)

Classic React pattern using a ref updated in `useEffect`.

---

## useScrollToHash

```js
const scrollToHash = useScrollToHash();
scrollToHash('#profile', () => console.log('scrolled'));
```

**Params:** none

**Returns:** `scrollToHash(hash: string, onDone?: () => void) => cleanup`

Smooth-scrolls to a hash anchor element. Uses `scrollIntoView({ behavior: 'smooth' })` (or `'auto'` if reduced motion preferred). Updates the Next.js router path with the hash fragment after scrolling completes. Returns a cleanup function.

---

## useWindowSize

```js
const { width, height } = useWindowSize();
```

**Params:** none

**Returns:** `{ width: number, height: number }`

Tracks browser viewport dimensions. Uses a hidden ruler element technique to get the true `100vh` on iOS Safari (where `window.innerHeight` is unreliable due to the address bar). Updates on `resize` events.
