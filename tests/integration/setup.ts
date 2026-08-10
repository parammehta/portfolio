// Browser APIs the app touches on mount that jsdom does not implement.
// Unit tests render leaf components and don't need these; integration tests
// mount whole pages inside the app shell, which does.

// next/jest loads the repo's .env files, so without this the suite would pass
// or fail depending on what each developer happens to have configured locally.
// Pin the public env to fixed test values; individual tests opt back in.
process.env.NEXT_PUBLIC_WEBSITE_URL = 'https://test.parammehta.com';
process.env.NEXT_PUBLIC_API_URL = 'https://api.test.parammehta.com';
process.env.NEXT_PUBLIC_FATHOM_ID = '';
process.env.NEXT_PUBLIC_FATHOM_URL = '';
delete process.env.NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_SITE_KEY;

// jsdom has no WebGL context, so any component that spins up a Three.js
// renderer (hero sphere, device models, carousel) would throw on mount. Swap
// only the renderer for a no-op; the rest of Three.js stays real.
jest.mock('three', () => {
  const three = jest.requireActual('three');

  // A Proxy rather than a hand-written stub: the renderer surface these
  // components touch is wide and keeps growing, and every missing method would
  // otherwise fail a page test for a reason that has nothing to do with the page.
  function MockWebGLRenderer(this: Record<string, unknown>) {
    const target: Record<string, unknown> = {
      domElement: document.createElement('canvas'),
      shadowMap: { enabled: false, type: null },
      capabilities: { getMaxAnisotropy: () => 1, isWebGL2: true },
      outputColorSpace: three.SRGBColorSpace,
      toneMapping: three.NoToneMapping,
    };

    return new Proxy(target, {
      get(obj, prop) {
        if (prop in obj) return obj[prop as string];
        return () => undefined;
      },
      set(obj, prop, value) {
        obj[prop as string] = value;
        return true;
      },
    });
  }

  return { ...three, WebGLRenderer: MockWebGLRenderer };
});

// The whole app shell reads the pages router; next-router-mock gives every
// integration test a real, navigable in-memory router.
// eslint-disable-next-line @typescript-eslint/no-require-imports
jest.mock('next/router', () => require('next-router-mock'));

class MockObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords() {
    return [];
  }
}

Object.defineProperty(window, 'IntersectionObserver', {
  writable: true,
  value: MockObserver,
});

Object.defineProperty(window, 'ResizeObserver', {
  writable: true,
  value: MockObserver,
});

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }),
});

// `_document.page.tsx` is not part of a client-side render, so recreate the
// portal target that Loader (and anything else portalling) expects to exist.
beforeEach(() => {
  if (!document.getElementById('portal-root')) {
    const portalRoot = document.createElement('div');
    portalRoot.id = 'portal-root';
    document.body.appendChild(portalRoot);
  }
});

window.scrollTo = () => {};
Element.prototype.scrollIntoView = () => {};

// framer-motion and the scroll-driven navbar both read layout boxes; jsdom
// reports zeroes, which is fine, but `getBoundingClientRect` must exist on
// every element type the shell measures.
if (!Element.prototype.getBoundingClientRect) {
  Element.prototype.getBoundingClientRect = () =>
    ({ top: 0, bottom: 0, left: 0, right: 0, width: 0, height: 0 }) as DOMRect;
}
