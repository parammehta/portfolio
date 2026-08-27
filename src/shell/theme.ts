import type { ThemeId } from './types';

/**
 * Where the visitor's *explicit* theme choice lives.
 *
 * Deliberately not the `theme` key: `refract-ui`'s ThemeProvider writes that
 * one itself on every mount, so it always holds a value and can't distinguish
 * "chose dark" from "never chose anything". Absent here means "follow the
 * system", which is the default until the toggle is pressed.
 */
export const themePreferenceKey = 'themePreference';

/** Matches when the OS/browser is set to light; anything else stays dark. */
export const systemThemeQuery = '(prefers-color-scheme: light)';

/** Theme used before the system preference is known (SSR, no matchMedia). */
export const defaultTheme: ThemeId = 'dark';
