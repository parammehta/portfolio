import 'shell/reset.css';
import 'shell/global.css';

import { Navbar } from 'components/Navbar';
import { ThemeProvider } from 'components/ThemeProvider';
import { tokens } from 'components/ThemeProvider/theme';
import { VisuallyHidden } from 'components/VisuallyHidden';
import { AnimatePresence, LazyMotion, domAnimation, m } from 'framer-motion';
import { useLocalStorage } from 'hooks';
import styles from 'shell/App.module.css';
import { initialState, reducer } from 'shell/reducer';
import type { AppContextValue } from 'shell/types';
import type { AppProps } from 'next/app';
import Head from 'next/head';
import Script from 'next/script';
import { useRouter } from 'next/router';
import { Fragment, createContext, useEffect, useReducer } from 'react';
import {
  cloudflareBeaconConfig,
  cloudflareBeaconSrc,
  createBeaconSink,
  setAnalyticsSink,
} from 'utils/analytics';
import { msToNum } from 'utils/style';
import { ScrollRestore } from '../shell/ScrollRestore';

export const AppContext = createContext<AppContextValue>({
  ...initialState,
  dispatch: () => {},
});

const repoPrompt = `
 _____
|  ___|  /\u005C  /\u005C
| |      \u005C \u005C \u005C \u005C
|_|    /\u005C \u005C \u005C \u005C \u005C
\n\nTaking a peek huh? Check out the source code: https://github.com/parammehta/portfolio
`;

let repoPromptLogged = false;

const App = ({ Component, pageProps }: AppProps) => {
  const [storedTheme] = useLocalStorage('theme', 'dark');
  const [state, dispatch] = useReducer(reducer, initialState);
  const { route, asPath } = useRouter();
  const canonicalRoute = route === '/' ? '' : `${asPath}`;

  // Cloudflare Web Analytics. The beacon runs in SPA mode, so it hooks history
  // itself and reports client-side route changes without any help from us.
  // Unset token (local dev, CI, tests) means the script is never rendered.
  const analyticsToken = process.env.NEXT_PUBLIC_CLOUDFLARE_ANALYTICS_TOKEN;
  const analyticsEnabled = !!analyticsToken && process.env.NODE_ENV !== 'development';

  // Route custom events to the analytics Worker (Cloudflare Analytics Engine).
  // Unset URL or dev leaves the default sink (dev-log / prod no-op) in place.
  useEffect(() => {
    const eventsUrl = process.env.NEXT_PUBLIC_ANALYTICS_EVENTS_URL;
    if (!eventsUrl || process.env.NODE_ENV === 'development') return;

    setAnalyticsSink(createBeaconSink(eventsUrl));
    return () => setAnalyticsSink(null);
  }, []);

  useEffect(() => {
    if (!repoPromptLogged) {
      repoPromptLogged = true;
      console.info(`${repoPrompt}\n\n`);
    }
  }, []);

  useEffect(() => {
    dispatch({ type: 'setTheme', value: (storedTheme || 'dark') as 'light' | 'dark' });
  }, [storedTheme]);

  return (
    <AppContext.Provider value={{ ...state, dispatch }}>
      <ThemeProvider themeId={state.theme}>
        <LazyMotion features={domAnimation}>
          <Fragment>
            {analyticsEnabled && (
              <Script
                src={cloudflareBeaconSrc}
                strategy="afterInteractive"
                data-cf-beacon={cloudflareBeaconConfig(analyticsToken)}
              />
            )}
            <Head>
              <meta name="viewport" content="width=device-width, initial-scale=1" />
              <link
                rel="canonical"
                href={`${process.env.NEXT_PUBLIC_WEBSITE_URL}${canonicalRoute}`}
              />
            </Head>
            <VisuallyHidden
              showOnFocus
              as="a"
              className={styles.skip}
              href="#MainContent"
            >
              Skip to main content
            </VisuallyHidden>
            <Navbar />
            <main className={styles.app} tabIndex={-1} id="MainContent">
              <AnimatePresence mode="wait">
                <m.div
                  key={route}
                  className={styles.page}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{
                    type: 'tween',
                    ease: 'linear',
                    duration: msToNum(tokens.base.durationS) / 1000,
                    delay: 0.1,
                  }}
                >
                  <ScrollRestore />
                  <Component {...pageProps} />
                </m.div>
              </AnimatePresence>
            </main>
          </Fragment>
        </LazyMotion>
      </ThemeProvider>
    </AppContext.Provider>
  );
};

export default App;
