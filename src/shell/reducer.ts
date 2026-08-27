import { defaultTheme } from './theme';
import type { AppAction, AppState } from './types';

export const initialState: AppState = {
  menuOpen: false,
  theme: defaultTheme,
  themePreference: null,
};

export function reducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    // A stored, explicit choice being restored on mount.
    case 'setTheme':
      return { ...state, theme: action.value, themePreference: action.value };
    // The OS preference, which only wins while the visitor hasn't picked one.
    case 'setSystemTheme':
      if (state.themePreference) return state;
      return { ...state, theme: action.value };
    case 'toggleTheme': {
      const newThemeId = state.theme === 'dark' ? 'light' : 'dark';
      return { ...state, theme: newThemeId, themePreference: newThemeId };
    }
    case 'toggleMenu':
      return { ...state, menuOpen: !state.menuOpen };
    default: {
      // AppAction is an exhaustive union, so this only fires if a caller
      // bypasses the type (e.g. `dispatch(x as AppAction)`). Return the
      // current state rather than throwing — an unrecognized action
      // shouldn't white-screen the app, and the message at least identifies
      // what reached the reducer.
      const unknownAction = action as { type: string };
      console.error(`reducer: unknown action type "${unknownAction.type}"`);
      return state;
    }
  }
}
