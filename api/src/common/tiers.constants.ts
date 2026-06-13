/**
 * Subscription tier constants — source unique de vérité.
 * Importer depuis ici plutôt que redéfinir localement dans chaque service.
 */

export const ALL_TIERS = ['DECOUVERTE', 'MAMAN', 'ESSENTIEL', 'CROISSANCE', 'DOMINATION'] as const;

/** Packs payants (tous sauf DÉCOUVERTE) */
export const PAID_TIERS = ['MAMAN', 'ESSENTIEL', 'CROISSANCE', 'DOMINATION'] as const;

/** Packs ESSENTIEL et supérieurs */
export const ESSENTIEL_TIERS = ['ESSENTIEL', 'CROISSANCE', 'DOMINATION'] as const;

/** Packs CROISSANCE et supérieurs (commandes, tables, stats, personnel) */
export const CROISSANCE_TIERS = ['CROISSANCE', 'DOMINATION'] as const;

/** Pack DOMINATION uniquement (analytics avancés, comptes staff, design custom, push) */
export const DOMINATION_TIERS = ['DOMINATION'] as const;

/** Packs autorisant les commandes en ligne (ESSENTIEL+ pour tous les types de restaurant) */
export const ORDER_TIERS = ESSENTIEL_TIERS;

/** Quota plat du jour par tier (null = illimité) */
export const DAILY_SPECIAL_QUOTA: Record<string, number | null> = {
  DECOUVERTE: 0,
  MAMAN:      3,
  ESSENTIEL:  10,
  CROISSANCE: null,
  DOMINATION: null,
};
