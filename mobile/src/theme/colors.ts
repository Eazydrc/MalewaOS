/**
 * Export statique du thème OCEAN (défaut).
 * Les écrans qui n'utilisent pas useTheme() reçoivent toujours le thème principal.
 * Pour le changement de thème dynamique : import { useTheme } from './ThemeContext'
 */
import { OCEAN } from './themes';

export const colors = OCEAN;

export const spacing = {
  xs:  4,
  sm:  8,
  md:  16,
  lg:  24,
  xl:  32,
  xxl: 48,
} as const;

export const radius = {
  sm:  8,
  md:  12,
  lg:  16,
  xl:  24,
  full: 999,
} as const;

export const shadow = {
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 8,
  },
  strong: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 14,
  },
} as const;

// Re-exports for screens that use useTheme()
export type { ColorPalette, ThemeKey } from './themes';
export { useTheme } from './ThemeContext';
