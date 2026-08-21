import GothamBoldItalic from 'assets/fonts/gotham-bold-italic.woff2';
import GothamBold from 'assets/fonts/gotham-bold.woff2';
import GothamBookItalic from 'assets/fonts/gotham-book-italic.woff2';
import GothamBook from 'assets/fonts/gotham-book.woff2';
import GothamMediumItalic from 'assets/fonts/gotham-medium-italic.woff2';
import GothamMedium from 'assets/fonts/gotham-medium.woff2';
import { squish } from 'refract-ui';

// Gotham is commercially licensed, so it lives here rather than in the
// component library — the library only ever sees `--brandFontStack`.
export const fontStyles = squish(`
  @font-face {
    font-family: Gotham;
    font-weight: 400;
    src: url(${GothamBook}) format('woff2');
    font-display: block;
    font-style: normal;
  }

  @font-face {
    font-family: Gotham;
    font-weight: 400;
    src: url(${GothamBookItalic}) format('woff2');
    font-display: block;
    font-style: italic;
  }

  @font-face {
    font-family: Gotham;
    font-weight: 500;
    src: url(${GothamMedium}) format('woff2');
    font-display: block;
    font-style: normal;
  }

  @font-face {
    font-family: Gotham;
    font-weight: 500;
    src: url(${GothamMediumItalic}) format('woff2');
    font-display: block;
    font-style: italic;
  }

  @font-face {
    font-family: Gotham;
    font-weight: 700;
    src: url(${GothamBold}) format('woff2');
    font-display: block;
    font-style: normal;
  }

  @font-face {
    font-family: Gotham;
    font-weight: 700;
    src: url(${GothamBoldItalic}) format('woff2');
    font-display: block;
    font-style: italic;
  }
`);
