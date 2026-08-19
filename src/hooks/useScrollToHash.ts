import { useReducedMotion } from 'framer-motion';
import { useRouter } from 'next/router';
import { useCallback, useRef } from 'react';

export function useScrollToHash() {
  const scrollTimeout = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const { asPath, push } = useRouter();
  const reduceMotion = useReducedMotion();

  const scrollToHash = useCallback(
    (hash: string, onDone?: () => void) => {
      const id = hash.split('#')[1];
      const targetElement = document.getElementById(id);
      const route = asPath.split('#')[0];
      const newPath = `${route}#${id}`;

      targetElement?.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth' });

      // The home page scrolls an inner container rather than the document, and
      // scroll events don't bubble — listening on window there would never fire,
      // so `onDone` would never run and the hash would never reach the URL.
      const scroller: HTMLElement | Window =
        targetElement?.closest<HTMLElement>('[data-scroll-container]') ?? window;

      const handleScroll = () => {
        clearTimeout(scrollTimeout.current);

        scrollTimeout.current = setTimeout(() => {
          scroller.removeEventListener('scroll', handleScroll);

          if (window.location.pathname === route) {
            onDone?.();
            push(newPath, undefined, { scroll: false });
          }
        }, 50);
      };

      scroller.addEventListener('scroll', handleScroll);

      return () => {
        scroller.removeEventListener('scroll', handleScroll);
        clearTimeout(scrollTimeout.current);
      };
    },
    [push, reduceMotion, asPath]
  );

  return scrollToHash;
}
