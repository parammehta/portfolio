import { useEffect } from 'react';

interface StyleSheetEntry {
  element: Element;
  href: string | null;
}

// Temporary fix to avoid flash of unstyled content (FOUC) during route transitions.
// Keep an eye on this issue and remove this code when resolved: https://github.com/vercel/next.js/issues/17464
export const usePreventFlash = (): void => {
  useEffect(() => {
    // Gather all server-side rendered stylesheet entries.
    let ssrPageStyleSheetsEntries: StyleSheetEntry[] = Array.from(
      document.querySelectorAll('link[rel="stylesheet"][data-n-p]')
    ).map(element => ({
      element,
      href: element.getAttribute('href'),
    }));

    // Remove the `data-n-p` attribute to prevent Next.js from removing it early.
    ssrPageStyleSheetsEntries.forEach(({ element }) =>
      element.removeAttribute('data-n-p')
    );

    const fixedStyleHrefs: string[] = [];

    const mutationHandler = (mutations: MutationRecord[]) => {
      // Gather all <style data-n-href="/..."> elements.
      const newStyleEntries: StyleSheetEntry[] = mutations
        .filter(
          ({ target }) =>
            target.nodeName === 'STYLE' && (target as Element).hasAttribute('data-n-href')
        )
        .map(({ target }) => ({
          element: target as Element,
          href: (target as Element).getAttribute('data-n-href'),
        }));

      // Cycle through them and either:
      // - Remove the `data-n-href` attribute to prevent Next.js from removing it early.
      // - Remove the element if it's already present.
      newStyleEntries.forEach(({ element, href }) => {
        const styleExists = href !== null && fixedStyleHrefs.includes(href);

        if (styleExists) {
          element.remove();
        } else {
          if (href !== null) {
            element.setAttribute('data-fouc-fix-n-href', href);
          }
          element.removeAttribute('data-n-href');
          if (href !== null) {
            fixedStyleHrefs.push(href);
          }
        }
      });

      // Cycle through the server-side rendered stylesheets and remove the ones that
      // are already present as inline <style> tags added by Next.js, so that we don't have duplicate styles.
      ssrPageStyleSheetsEntries = ssrPageStyleSheetsEntries.reduce<StyleSheetEntry[]>(
        (entries, entry) => {
          const { element, href } = entry;
          const styleExists = href !== null && fixedStyleHrefs.includes(href);

          if (styleExists) {
            element.remove();
          } else {
            entries.push(entry);
          }

          return entries;
        },
        []
      );
    };

    const observer = new MutationObserver(mutationHandler);

    observer.observe(document.head, {
      subtree: true,
      attributeFilter: ['media'],
    });

    return () => observer.disconnect();
  }, []);
};
