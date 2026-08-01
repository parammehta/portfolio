import GothamBoldItalic from 'assets/fonts/gotham-bold-italic.woff2';
import GothamBold from 'assets/fonts/gotham-bold.woff2';
import GothamBookItalic from 'assets/fonts/gotham-book-italic.woff2';
import GothamBook from 'assets/fonts/gotham-book.woff2';
import GothamMediumItalic from 'assets/fonts/gotham-medium-italic.woff2';
import GothamMedium from 'assets/fonts/gotham-medium.woff2';
import { useHasMounted } from 'hooks';
import Head from 'next/head';
import { createContext, useEffect, type ElementType, type ReactNode } from 'react';
import { classes, media } from 'utils/style';
import { theme, tokens, type ThemeTokens } from './theme';
import { useTheme } from './useTheme';

export type ThemeId = 'dark' | 'light';

export const ThemeContext = createContext<ThemeTokens | Record<string, never>>({});

interface ThemeProviderProps {
  themeId?: ThemeId;
  theme?: Partial<ThemeTokens>;
  children?: ReactNode;
  className?: string;
  as?: ElementType;
  [key: string]: unknown;
}

export const ThemeProvider = ({
  themeId = 'dark',
  theme: themeOverrides,
  children,
  className,
  as: Component = 'div',
  ...rest
}: ThemeProviderProps) => {
  const currentTheme = { ...theme[themeId], ...themeOverrides };
  const parentTheme = useTheme();
  const isRootProvider = !parentTheme.themeId;
  const hasMounted = useHasMounted();

  useEffect(() => {
    if (isRootProvider && hasMounted) {
      window.localStorage.setItem('theme', JSON.stringify(themeId));
      document.body.dataset.theme = themeId;
    }
  }, [themeId, isRootProvider, hasMounted]);

  return (
    <ThemeContext.Provider value={currentTheme}>
      {isRootProvider && (
        <>
          <Head>
            <meta name="theme-color" content={`rgb(${currentTheme.rgbBackground})`} />
          </Head>
          {children}
        </>
      )}
      {!isRootProvider && (
        <Component
          className={classes('theme-provider', className)}
          data-theme={themeId}
          {...rest}
        >
          {children}
        </Component>
      )}
    </ThemeContext.Provider>
  );
};

export function squish(styles: string): string {
  return styles.replace(/\s\s+/g, ' ');
}

export function createThemeProperties(themeObj: Record<string, string | number>): string {
  return squish(
    Object.keys(themeObj)
      .filter(key => key !== 'themeId')
      .map(key => `--${key}: ${themeObj[key]};`)
      .join('\n\n')
  );
}

export function createThemeStyleObject(themeObj: Record<string, string | number>): Record<string, string | number> {
  const style: Record<string, string | number> = {};

  for (const key of Object.keys(themeObj)) {
    if (key !== 'themeId') {
      style[`--${key}`] = themeObj[key];
    }
  }

  return style;
}

export function createMediaTokenProperties(): string {
  return squish(
    (Object.keys(media) as Array<keyof typeof media>)
      .map(key => {
        return `
        @media (max-width: ${media[key]}px) {
          :root {
            ${createThemeProperties(tokens[key] as unknown as Record<string, string | number>)}
          }
        }
      `;
      })
      .join('\n')
  );
}

export const tokenStyles = squish(`
  :root {
    ${createThemeProperties(tokens.base as unknown as Record<string, string | number>)}
  }

  ${createMediaTokenProperties()}

  [data-theme='dark'] {
    ${createThemeProperties(theme.dark)}
  }

  [data-theme='light'] {
    ${createThemeProperties(theme.light)}
  }
`);

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
