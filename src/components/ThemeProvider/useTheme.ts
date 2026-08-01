import { useContext } from 'react';
import { ThemeContext } from './ThemeProvider';
import type { ThemeTokens } from './theme';

export function useTheme(): ThemeTokens | Record<string, never> {
  const currentTheme = useContext(ThemeContext);
  return currentTheme;
}
