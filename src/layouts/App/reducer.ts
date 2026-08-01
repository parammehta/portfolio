import type { AppAction, AppState } from './types';

export const initialState: AppState = {
  menuOpen: false,
  theme: 'dark',
};

export function reducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'setTheme':
      return { ...state, theme: action.value };
    case 'toggleTheme': {
      const newThemeId = state.theme === 'dark' ? 'light' : 'dark';
      return { ...state, theme: newThemeId };
    }
    case 'toggleMenu':
      return { ...state, menuOpen: !state.menuOpen };
    default:
      throw new Error();
  }
}
