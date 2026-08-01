import type { Dispatch } from 'react';

export type ThemeId = 'light' | 'dark';

export interface AppState {
  menuOpen: boolean;
  theme: ThemeId;
}

export type AppAction =
  | { type: 'setTheme'; value: ThemeId }
  | { type: 'toggleTheme' }
  | { type: 'toggleMenu' };

export interface AppContextValue extends AppState {
  dispatch: Dispatch<AppAction>;
}
