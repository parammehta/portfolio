import 'shell/reset.css';
import 'shell/global.css';

import { Navbar } from 'components/Navbar';
import { ThemeProvider } from 'components/ThemeProvider';
import { tokens } from 'components/ThemeProvider/theme';
import { VisuallyHidden } from 'components/VisuallyHidden';
import * as Fathom from 'fathom-client';
import { AnimatePresence, LazyMotion, domAnimation, m } from 'framer-motion';
import { usePreventFlash, useLocalStorage } from 'hooks';
import styles from 'shell/App.module.css';
import { initialState, reducer } from 'shell/reducer';
import type { AppContextValue } from 'shell/types';
import type { AppProps } from 'next/app';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { Fragment, createContext, useEffect, useReducer } from 'react';
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
\n\nTaking a peek huh? Check out the source code: https://github.com/parammehta/parammehta.github.io
`;

const App = ({ Component, pageProps }: AppProps) => {
  const [storedTheme] = useLocalStorage('theme', 'dark');
  const [state, dispatch] = useReducer(reducer, initialState);
  const { route, events, asPath } = useRouter();
  const canonicalRoute = route === '/' ? '' : `${asPath}`;
  usePreventFlash();

  useEffect(() => {
    if (process.env.NODE_ENV === 'development') return;

    Fathom.load(process.env.NEXT_PUBLIC_FATHOM_ID, {
      url: process.env.NEXT_PUBLIC_FATHOM_URL,
    });

    const onRouteChangeComplete = () => {
      Fathom.trackPageview({ url: window.location.pathname });
    };

    events.on('routeChangeComplete', onRouteChangeComplete);

    return () => {
      events.off('routeChangeComplete', onRouteChangeComplete);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    console.info(`${repoPrompt}\n\n`);
  }, []);

  useEffect(() => {
    dispatch({ type: 'setTheme', value: (storedTheme || 'dark') as 'light' | 'dark' });
  }, [storedTheme]);

  return (
    <AppContext.Provider value={{ ...state, dispatch }}>
      <ThemeProvider themeId={state.theme}>
        <LazyMotion features={domAnimation}>
          <Fragment>
            <Head>
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
