import type { Dispatch } from 'react';

export type ThemeId = 'light' | 'dark';

export interface AppState {
  menuOpen: boolean;
  /** The theme actually rendered — an explicit choice, or the system's. */
  theme: ThemeId;
  /** The visitor's explicit choice; `null` means "follow the system". */
  themePreference: ThemeId | null;
}

export type AppAction =
  | { type: 'setTheme'; value: ThemeId }
  | { type: 'setSystemTheme'; value: ThemeId }
  | { type: 'toggleTheme' }
  | { type: 'toggleMenu' };

export interface AppContextValue extends AppState {
  dispatch: Dispatch<AppAction>;
}
