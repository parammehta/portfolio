import { render } from '@testing-library/react';
import type { RenderResult } from '@testing-library/react';
import type { AppProps } from 'next/app';
import type { ComponentType } from 'react';
import mockRouter from 'next-router-mock';
import App from 'pages/_app.page';

/**
 * Mounts a page component inside the real app shell (`_app.page.tsx`) — theme
 * provider, navbar, skip link, page transition — the way a visitor gets it.
 * That shell is what separates these from the co-located unit tests: a page
 * can render fine in isolation and still break once the router, providers, or
 * navbar are in play.
 */
export const renderPage = (
  // Pages declare their own prop shapes; the caller supplies matching
  // `pageProps`, exactly as `getStaticProps` would at build time.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  Component: ComponentType<any>,
  { route = '/', pageProps = {} }: { route?: string; pageProps?: object } = {}
): RenderResult => {
  mockRouter.setCurrentUrl(route);

  return render(
    <App
      Component={Component}
      pageProps={pageProps}
      router={mockRouter as unknown as AppProps['router']}
    />
  );
};

export { mockRouter };
