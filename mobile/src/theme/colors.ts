export const colors = {
  bg:         '#0D0E1E',
  surface:    '#14172A',
  surface2:   '#1C2038',
  surface3:   '#262C4A',
  accent:     '#E85D26',
  accentSoft: 'rgba(232,93,38,0.15)',
  text:       '#F0F2FF',
  text2:      '#A8B0D8',
  text3:      '#6B75A8',
  border:     '#323A5C',
  success:    '#4ADE80',
  danger:     '#F87171',
  warning:    '#FBBF24',
  white:      '#FFFFFF',
  black:      '#000000',
} as const;

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
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
} as const;
