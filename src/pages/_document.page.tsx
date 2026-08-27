import GothamBook from 'assets/fonts/gotham-book.woff2';
import GothamMedium from 'assets/fonts/gotham-medium.woff2';
import { theme, tokenStyles } from 'refract-ui';
import { fontStyles } from 'shell/fonts';
import { Head, Html, Main, NextScript } from 'next/document';
import { defaultTheme, systemThemeQuery, themePreferenceKey } from 'shell/theme';

// Runs before first paint, so the page never renders in one theme and flips to
// the other. Order of preference: the visitor's stored choice, then what their
// OS asks for, then the site default. Kept in sync with the React state by
// `_app.page.tsx`, which resolves the same two inputs after mount.
const initialThemeScript = `
  (function () {
    var themeId = '${defaultTheme}';

    try {
      themeId =
        JSON.parse(localStorage.getItem('${themePreferenceKey}')) ||
        (window.matchMedia('${systemThemeQuery}').matches ? 'light' : 'dark');
    } catch (error) {
      // Storage can be unavailable (private mode, blocked cookies); the
      // default is already in hand, so there is nothing to recover.
    }

    document.body.dataset.theme = themeId;

    var themeColor = document.querySelector('meta[name="theme-color"]');
    if (themeColor) {
      themeColor.content =
        themeId === 'light'
          ? 'rgb(${theme.light.rgbBackground})'
          : 'rgb(${theme.dark.rgbBackground})';
    }
  })();
`;

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        {/* Next auto-injects a charset meta into every page's <head> when none
            is declared via next/head, so a literal one here just duplicates it. */}
        {/* Corrected to the resolved theme's background by the inline script
            below, and kept current afterwards by refract-ui's ThemeProvider. */}
        <meta name="theme-color" content={`rgb(${theme.dark.rgbBackground})`} />
        <link rel="manifest" href="/manifest.json" />
        <link rel="shortcut icon" href="/favicon.png" type="image/png" />
        <link rel="shortcut icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/icon-256.png" />
        <link type="text/plain" rel="author" href="/humans.txt" />

        <link rel="preload" href={GothamMedium} as="font" crossOrigin="anonymous" />
        <link rel="preload" href={GothamBook} as="font" crossOrigin="anonymous" />
        <style dangerouslySetInnerHTML={{ __html: fontStyles }} />
        <style dangerouslySetInnerHTML={{ __html: tokenStyles }} />
      </Head>
      <body data-theme={defaultTheme} tabIndex={-1}>
        <script dangerouslySetInnerHTML={{ __html: initialThemeScript }} />
        <Main />
        <NextScript />
        <div id="portal-root" />
      </body>
    </Html>
  );
}
