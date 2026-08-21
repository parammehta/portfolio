# Theming System

The theme system itself — design tokens, `ThemeProvider`, `useTheme`, and dark/light
theme colors — now lives entirely in [refract-ui](https://github.com/parammehta/refract-ui)
(`ThemeProvider`, `useTheme`, `tokens`, `tokenStyles` are all exported from the package).
Full token reference and the `ThemeProvider` API are documented in that package's own
[Storybook](https://storybook.parammehta.com) — this page only covers the pieces that
stay in this repo because they're portfolio-specific.

## How It Works

```
refract-ui: theme.ts (token definitions) + ThemeProvider (React Context, generates CSS custom properties)
    |
    v
_document.page.tsx (injects tokenStyles + this site's own fontStyles as inline <style> tags)
    |
    v
Components consume tokens via var(--tokenName) in CSS Modules
```

## Root Provider

Wired up once in `_app.page.tsx`:

```tsx
<ThemeProvider themeId={state.theme}>
  {children}
</ThemeProvider>
```

`state.theme` comes from `AppContext` (see [Layouts and Pages](layouts-and-pages.md#app-shell-srcshell)),
which is itself seeded from `localStorage` via `useLocalStorage('theme', 'dark')`. Nested
`<ThemeProvider themeId="light" as="section">` usages elsewhere in the app flip a subtree
to the opposite theme (e.g. inverted sections) — see `refract-ui`'s Storybook for the full
root-vs-nested behavior.

## useTheme Hook

```ts
import { useTheme } from 'refract-ui';

const theme = useTheme();
// theme.themeId, theme.rgbBackground, theme.colorTextTitle, etc.
```

Returns the full theme token object for the active theme (nearest `ThemeProvider`
ancestor). Used throughout this repo — e.g. `Navbar`'s theme-inversion scroll logic,
`HeroSphere`'s GLSL uniforms, `Code`'s `data-theme` wrapper.

## Flash Prevention

`_document.page.tsx` injects an inline script before React hydrates:

```js
const initialTheme = JSON.parse(localStorage.getItem('theme'));
document.body.dataset.theme = initialTheme || 'dark';
```

This sets the correct `data-theme` attribute before the first paint, preventing a flash of the wrong theme on page load.

## Fonts (site-specific)

Gotham is commercially licensed, so it can't ship inside the public `refract-ui` package —
`refract-ui` only ever sees the generic `--brandFontStack` custom property. This repo
supplies the actual font: `src/shell/fonts.ts` builds `fontStyles`, a string of
`@font-face` declarations (Book/Medium/Bold, each normal + italic, woff2) built with
`refract-ui`'s `squish()` helper, imported once for its side effect in `_app.page.tsx` and
rendered into `<head>` by `_document.page.tsx` alongside `refract-ui`'s `tokenStyles`.
Font display strategy: `block` (invisible text until the font loads).

## Using Tokens in CSS Modules

```css
.heading {
  font-size: var(--fontSizeH2);
  color: var(--colorTextTitle);
  margin-bottom: var(--spaceL);
  transition: color var(--durationM) var(--bezierFastoutSlowin);
}
```

Tokens auto-adjust at breakpoints via `refract-ui`'s responsive overrides — usually no
manual media queries are needed just to resize type.

## Using Tokens in JavaScript

```ts
import { tokens, useTheme } from 'refract-ui';

// Static access to base tokens
const duration = tokens.base.durationM;  // '0.4s'

// Dynamic access to current theme colors
const theme = useTheme();
const bgColor = theme.rgbBackground;  // '17 17 17' or '242 242 242'
```
