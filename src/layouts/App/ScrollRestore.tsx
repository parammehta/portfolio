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
      window.scrollTo(0, targetElement.offsetTop);
      targetElement.focus({ preventScroll: true });
    } else {
      window.scrollTo(0, 0);
      document.body.focus({ preventScroll: true });
    }
  }, [asPath, isPresent]);

  return null;
};
