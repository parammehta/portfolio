# Theming System

The theme system uses CSS custom properties as its foundation, with React Context for programmatic access.

## How It Works

```
theme.js (token definitions)
    |
    v
ThemeProvider.js (generates CSS custom properties, provides React Context)
    |
    v
_document.page.js (injects token + font CSS as inline <style> tags)
    |
    v
Components consume tokens via var(--tokenName) in CSS Modules
```

## Design Tokens

Defined in `src/components/ThemeProvider/theme.js`.

### Base Tokens

Applied to `:root` via CSS custom properties:

| Category | Examples |
|---|---|
| Colors | `--rgbBlack`, `--rgbWhite` |
| Animation | `--bezierFastoutSlowin`, `--durationXS` through `--durationXL` |
| Typography | `--fontStack` (Gotham), `--systemFontStack`, `--monoFontStack`, `--devanagariFontStack` |
| Font weights | `--fontWeightRegular` (400), `--fontWeightMedium` (500), `--fontWeightBold` (700) |
| Font sizes | `--fontSizeH0` through `--fontSizeH5`, `--fontSizeBodyXL` through `--fontSizeBodyXS` |
| Line heights | `--lineHeightTitle`, `--lineHeightBody` |
| Max widths | `--maxWidthS`, `--maxWidthM`, `--maxWidthL`, `--maxWidthXL` |
| Spacing | `--spaceXS` through `--space5XL` |
| Z-index | `--zIndex0` (0) through `--zIndex5` (64) |

### Responsive Overrides

Tokens adjust at each breakpoint via `@media (max-width)` queries. Breakpoints match `utils/style.js`:

| Breakpoint | Width | Changes |
|---|---|---|
| desktop | 2080px | Slightly reduced H0 |
| laptop | 1680px | Reduced heading sizes |
| tablet | 1040px | Further reductions, tighter spacing |
| mobile | 696px | Smallest heading/body sizes |
| mobileS | 400px | Minimal sizes |

### Theme Colors

Two themes: `dark` and `light`. Applied via `[data-theme]` attribute selectors.

| Token | Dark | Light |
|---|---|---|
| `--rgbBackground` | `17 17 17` | `242 242 242` |
| `--rgbBackgroundLight` | `38 38 38` | `230 230 230` |
| `--rgbPrimary` | `251 146 60` (orange) | `251 146 60` (orange) |
| `--rgbAccent` | `251 146 60` | `251 146 60` |
| `--rgbText` | `255 255 255` | `0 0 0` |
| `--rgbError` | `255 55 102` | `255 0 60` |

Derived properties use CSS `rgb()` with alpha channels for text opacity levels (e.g., `--colorTextTitle`, `--colorTextBody`, `--colorTextLight`).

## ThemeProvider Component

Located at `src/components/ThemeProvider/ThemeProvider.js`.

### Usage

```jsx
// Root provider (in _app.page.js)
<ThemeProvider themeId={storedTheme}>
  {children}
</ThemeProvider>

// Nested provider (for inverted sections)
<ThemeProvider themeId="light" as="section">
  {children}
</ThemeProvider>
```

### Props

| Prop | Type | Default | Description |
|---|---|---|---|
| `themeId` | `'dark' \| 'light'` | `'dark'` | Active theme |
| `theme` | object | — | Token overrides merged on top |
| `as` | elementType | `'div'` | Wrapper element for nested providers |

### Root vs Nested Behavior

- **Root:** Sets `data-theme` on `document.body`, persists to localStorage, sets `<meta name="theme-color">`. Renders children directly (no wrapper element).
- **Nested:** Wraps children in an element with `data-theme` attribute for CSS scoping. Used for sections that need the opposite theme.

## useTheme Hook

```js
import { useTheme } from 'components/ThemeProvider';

const theme = useTheme();
// theme.themeId, theme.rgbBackground, theme.colorTextTitle, etc.
```

Returns the full theme token object for the active theme (nearest ThemeProvider ancestor).

## Flash Prevention

`_document.page.js` injects an inline script before React hydrates:

```js
const theme = localStorage.getItem('theme');
document.body.dataset.theme = theme || 'dark';
```

This sets the correct `data-theme` attribute before the first paint, preventing a flash of the wrong theme on page load.

## Fonts

Gotham font family loaded via `@font-face` declarations injected as inline CSS in `_document.page.js`:

| Weight | Style | File |
|---|---|---|
| 400 (Book) | normal, italic | woff2 |
| 500 (Medium) | normal, italic | woff2 |
| 700 (Bold) | normal, italic | woff2 |

Font display strategy: `block` (invisible text until font loads).

## Using Tokens in CSS Modules

```css
.heading {
  font-size: var(--fontSizeH2);
  color: var(--colorTextTitle);
  margin-bottom: var(--spaceL);
  transition: color var(--durationM) var(--bezierFastoutSlowin);
}

@media (max-width: 696px) {
  /* Tokens auto-adjust via the responsive overrides — 
     usually no manual media queries needed for font sizes */
}
```

## Using Tokens in JavaScript

```js
import { tokens } from 'components/ThemeProvider/theme';
import { useTheme } from 'components/ThemeProvider';

// Static access to base tokens
const duration = tokens.base.durationM;  // '0.4s'

// Dynamic access to current theme colors
const theme = useTheme();
const bgColor = theme.rgbBackground;  // '17 17 17' or '242 242 242'
```
