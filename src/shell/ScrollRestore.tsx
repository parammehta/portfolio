import { useIsPresent } from 'framer-motion';
import { useRouter } from 'next/router';
import { useEffect } from 'react';

export const ScrollRestore = () => {
  const isPresent = useIsPresent();
  const { asPath, beforePopState } = useRouter();

  useEffect(() => {
    window.history.scrollRestoration = 'manual';
  }, []);

  useEffect(() => {
    beforePopState(state => {
      state.options.scroll = false;
      return true;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!isPresent) return;
    const hash = asPath.split('#')[1];
    const targetElement = document.getElementById(hash);

    if (hash && targetElement) {
      // scrollIntoView rather than window.scrollTo: the home page scrolls an
      // inner container, where the document itself never scrolls and scrollTo
      // would silently do nothing. This walks every scrollable ancestor, and
      // `block: 'start'` lands exactly on a scroll-snap point.
      targetElement.scrollIntoView({ block: 'start', behavior: 'auto' });
      targetElement.focus({ preventScroll: true });
    } else {
      // Assigning scrollTop rather than calling scrollTo: same effect, and it
      // works under jsdom, which doesn't implement Element.prototype.scrollTo.
      const container = document.querySelector<HTMLElement>('[data-scroll-container]');
      if (container) container.scrollTop = 0;
      window.scrollTo(0, 0);
      document.body.focus({ preventScroll: true });
    }
  }, [asPath, isPresent]);

  return null;
};
