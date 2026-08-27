import { initialState, reducer } from './reducer';

describe('reducer', () => {
  describe('theme', () => {
    it('follows the system preference while the visitor has not chosen one', () => {
      const state = reducer(initialState, { type: 'setSystemTheme', value: 'light' });

      expect(state.theme).toBe('light');
      expect(state.themePreference).toBeNull();
    });

    it('keeps following the system as it changes back and forth', () => {
      const light = reducer(initialState, { type: 'setSystemTheme', value: 'light' });
      const dark = reducer(light, { type: 'setSystemTheme', value: 'dark' });

      expect(dark.theme).toBe('dark');
    });

    it('stops following the system once the toggle has been used', () => {
      const chosen = reducer(
        reducer(initialState, { type: 'setSystemTheme', value: 'light' }),
        { type: 'toggleTheme' }
      );

      expect(chosen.theme).toBe('dark');
      expect(chosen.themePreference).toBe('dark');

      // The OS flipping to light must not undo the visitor's choice.
      expect(reducer(chosen, { type: 'setSystemTheme', value: 'light' }).theme).toBe(
        'dark'
      );
    });

    it('treats a restored stored theme as an explicit choice', () => {
      const restored = reducer(initialState, { type: 'setTheme', value: 'light' });

      expect(restored.themePreference).toBe('light');
      expect(reducer(restored, { type: 'setSystemTheme', value: 'dark' }).theme).toBe(
        'light'
      );
    });
  });
});
