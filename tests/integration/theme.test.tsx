import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { themePreferenceKey } from 'shell/theme';
import { renderPage } from './renderPage';

const Stub = () => <p>stub page</p>;

/**
 * The shared setup stubs `matchMedia` as "nothing matches"; these tests need to
 * say what the OS is actually asking for, and to change that answer mid-test.
 */
const setSystemTheme = (themeId: 'light' | 'dark') => {
  const listeners = new Set<() => void>();

  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: (query: string) => ({
      // A getter, because a real MediaQueryList keeps `matches` current — the
      // listener below fires and the handler re-reads it.
      get matches() {
        return query.includes('light') && themeId === 'light';
      },
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: (_: string, listener: () => void) => listeners.add(listener),
      removeEventListener: (_: string, listener: () => void) =>
        listeners.delete(listener),
      dispatchEvent: () => false,
    }),
  });

  // Flips the OS preference on an already-mounted app, the way changing the
  // system appearance with the tab open does.
  return (next: 'light' | 'dark') => {
    themeId = next;
    listeners.forEach(listener => listener());
  };
};

describe('theme', () => {
  beforeEach(() => {
    window.localStorage.clear();
    delete document.body.dataset.theme;
  });

  it('renders in the system theme when the visitor has never chosen one', async () => {
    setSystemTheme('light');
    renderPage(Stub);

    await waitFor(() => expect(document.body.dataset.theme).toBe('light'));
  });

  it('tracks the system theme changing while the page is open', async () => {
    const changeSystemTheme = setSystemTheme('light');
    renderPage(Stub);

    await waitFor(() => expect(document.body.dataset.theme).toBe('light'));

    changeSystemTheme('dark');
    await waitFor(() => expect(document.body.dataset.theme).toBe('dark'));
  });

  it('prefers a stored choice over the system theme', async () => {
    window.localStorage.setItem(themePreferenceKey, JSON.stringify('dark'));
    setSystemTheme('light');
    renderPage(Stub);

    await waitFor(() => expect(document.body.dataset.theme).toBe('dark'));
  });

  it('stores the choice made with the toggle, and stops following the system', async () => {
    const changeSystemTheme = setSystemTheme('light');
    renderPage(Stub);

    await waitFor(() => expect(document.body.dataset.theme).toBe('light'));

    await userEvent.click(screen.getAllByRole('button', { name: 'Toggle theme' })[0]);

    await waitFor(() => expect(document.body.dataset.theme).toBe('dark'));
    expect(window.localStorage.getItem(themePreferenceKey)).toBe(JSON.stringify('dark'));

    // Already opted out: the OS re-announcing light must not take the page back.
    changeSystemTheme('light');
    await new Promise(resolve => setTimeout(resolve, 0));
    expect(document.body.dataset.theme).toBe('dark');
  });
});
