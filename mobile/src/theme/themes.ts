/**
 * Delipose — Système de 3 thèmes
 *
 * Palette source (gauche → droite) :
 *   #141926  #1A2636  #1C3248  #1C4157  #1B5368  #1A6272  #197277  #25827A  #3DA898  #5DC4B4
 *
 * OCEAN   → thème principal (dark navy + teal)
 * ABYSSE  → thème sombre (quasi-noir + teal)
 * AURORE  → thème clair (blanc teal + teal foncé)
 */

export type ThemeKey = 'OCEAN' | 'ABYSSE' | 'AURORE';

export interface ColorPalette {
  // Backgrounds
  bg:         string;
  surface:    string;
  surface2:   string;
  surface3:   string;
  // Accent principal
  accent:     string;
  accentDark: string;
  accentSoft: string;
  // Textes
  text:       string;
  text2:      string;
  text3:      string;
  // Utilitaires
  border:     string;
  success:    string;
  danger:     string;
  warning:    string;
  // Gradient teal (surfaces spéciales)
  teal1:      string;
  teal2:      string;
  teal3:      string;
  // Legacy
  white:      string;
  black:      string;
}

// ── OCEAN — Thème principal (navy profond + teal lumineux) ────────────────────
export const OCEAN: ColorPalette = {
  bg:         '#141926',  // extrême gauche palette
  surface:    '#1A2636',  // navy légèrement plus clair
  surface2:   '#1C3248',  // troisième teinte
  surface3:   '#1C4157',  // quatrième — début du teal
  accent:     '#2EC4B6',  // teal lumineux (dérivé extrême droite)
  accentDark: '#1B8A7E',  // teal moyen — hover / pressed
  accentSoft: 'rgba(46,196,182,0.15)',
  text:       '#E4F0F0',  // off-white teinté teal — jamais blanc pur
  text2:      '#7DC0CA',  // teal-gris moyen
  text3:      '#3D7A88',  // teal-gris atténué
  border:     '#1E3A4C',  // frontière subtile
  success:    '#4DD9A4',  // vert menthe
  danger:     '#E05A6B',  // rouge corail
  warning:    '#F59E0B',  // ambre
  teal1:      '#1B5368',  // surface teal-1 (cartes premium)
  teal2:      '#1A6272',  // surface teal-2
  teal3:      '#25827A',  // surface teal-3
  white:      '#E4F0F0',  // off-white (jamais #FFFFFF)
  black:      '#0A0D14',
};

// ── ABYSSE — Thème ultra-sombre ───────────────────────────────────────────────
export const ABYSSE: ColorPalette = {
  bg:         '#090C12',
  surface:    '#0E1420',
  surface2:   '#12192A',
  surface3:   '#162235',
  accent:     '#2EC4B6',  // même teal — claque sur le noir
  accentDark: '#1A7A6E',
  accentSoft: 'rgba(46,196,182,0.12)',
  text:       '#D8ECEC',
  text2:      '#5A9AAA',
  text3:      '#2E6070',
  border:     '#111D28',
  success:    '#4DD9A4',
  danger:     '#E05A6B',
  warning:    '#F59E0B',
  teal1:      '#122A35',
  teal2:      '#153545',
  teal3:      '#1A4850',
  white:      '#D8ECEC',
  black:      '#040608',
};

// ── AURORE — Thème clair ──────────────────────────────────────────────────────
export const AURORE: ColorPalette = {
  bg:         '#EBF5F5',  // très clair, teinté teal
  surface:    '#F5FAFA',
  surface2:   '#FFFFFF',
  surface3:   '#DFF0EF',
  accent:     '#0F7B70',  // teal foncé (contraste sur fond clair)
  accentDark: '#0A5A52',
  accentSoft: 'rgba(15,123,112,0.12)',
  text:       '#0F1926',  // navy foncé comme texte principal
  text2:      '#1A5060',  // teal moyen-foncé
  text3:      '#3D7A88',  // teal atténué
  border:     '#C5E2E5',
  success:    '#0F7B70',
  danger:     '#C0394A',
  warning:    '#D48B06',
  teal1:      '#E0F0F0',
  teal2:      '#CEEAEA',
  teal3:      '#B8E0DF',
  white:      '#F5FAFA',
  black:      '#0F1926',
};

export const THEMES: Record<ThemeKey, ColorPalette> = {
  OCEAN:  OCEAN,
  ABYSSE: ABYSSE,
  AURORE: AURORE,
};

export const THEME_LABELS: Record<ThemeKey, { label: string; emoji: string; desc: string }> = {
  OCEAN:  { label: 'Océan',  emoji: '🌊', desc: 'Navy & teal — thème principal' },
  ABYSSE: { label: 'Abysse', emoji: '🌑', desc: 'Ultra sombre' },
  AURORE: { label: 'Aurore', emoji: '🌅', desc: 'Thème clair' },
};
