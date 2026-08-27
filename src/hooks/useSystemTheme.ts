import { useEffect, useState } from 'react';
import { defaultTheme, systemThemeQuery } from 'shell/theme';
import type { ThemeId } from 'shell/types';

/**
 * The theme the visitor's OS/browser is asking for, kept live — changing the
 * system appearance while the tab is open updates it without a reload.
 *
 * Starts at the default rather than reading matchMedia during render so the
 * server render and the first client render agree; the effect below resolves
 * the real value immediately after mount. The pre-paint value the visitor
 * actually sees is set by the inline script in `_document.page.tsx`.
 */
export function useSystemTheme(): ThemeId {
  const [systemTheme, setSystemTheme] = useState<ThemeId>(defaultTheme);

  useEffect(() => {
    const query = window.matchMedia(systemThemeQuery);
    const apply = () => setSystemTheme(query.matches ? 'light' : 'dark');

    apply();
    query.addEventListener('change', apply);
    return () => query.removeEventListener('change', apply);
  }, []);

  return systemTheme;
}
