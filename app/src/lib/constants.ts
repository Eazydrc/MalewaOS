// ── Devise & Points ───────────────────────────────────────────────────────────
export const USD_TO_CDF   = 2800;          // Taux de référence (mis à jour manuellement)
export const CENTS_TO_USD = 0.01;
export const POINTS_PER_1000_CDF = 1;     // 1 pt par 1 000 FC dépensés
export const POINTS_REDEEM_RATE  = 20;    // 20 pts = 1 000 FC de réduction (5% cashback)
export const SIGNUP_BONUS_POINTS = 100;

// ── Formatage ─────────────────────────────────────────────────────────────────

/** Convertit des centimes USD en francs congolais */
export function centsToCDF(cents: number): number {
  return Math.round((cents / 100) * USD_TO_CDF);
}

/** Formate un montant en FC (ex: "22 400 FC") */
export function formatCDF(cdf: number): string {
  return new Intl.NumberFormat("fr-CD", {
    style: "decimal",
    maximumFractionDigits: 0,
  }).format(cdf) + " FC";
}

/** Formate un montant en USD (ex: "$8.00") */
export function formatUSD(cents: number): string {
  return new Intl.NumberFormat("fr-CD", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(cents / 100);
}

/** Affiche le prix principal en FC avec USD en secondaire */
export function formatPrice(cents: number): { cdf: string; usd: string } {
  return {
    cdf: formatCDF(centsToCDF(cents)),
    usd: formatUSD(cents),
  };
}

/** Valeur en FC d'un nombre de points */
export function pointsToFC(points: number): number {
  return Math.floor(points / POINTS_REDEEM_RATE) * 1000;
}

/** Formate les points avec leur valeur FC */
export function formatPoints(points: number): string {
  const value = pointsToFC(points);
  return `${points} pts${value > 0 ? ` = ${formatCDF(value)}` : ""}`;
}

// ── API ───────────────────────────────────────────────────────────────────────
export const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3001";

// ── Tier helpers ──────────────────────────────────────────────────────────────
export const ESSENTIEL_TIERS  = ['ESSENTIEL', 'CROISSANCE', 'DOMINATION'] as const;
export const CROISSANCE_TIERS = ['CROISSANCE', 'DOMINATION'] as const;
export const DOMINATION_TIERS = ['DOMINATION'] as const;

export function isCroissance(sub: string) { return (CROISSANCE_TIERS as readonly string[]).includes(sub); }
export function isDomination(sub: string) { return sub === 'DOMINATION'; }

export function fc(cents: number): string {
  return (cents / 100).toLocaleString('fr-CD', { maximumFractionDigits: 0 }) + ' FC';
}

export const TIER_COLOR: Record<string, string> = {
  MAMAN:      'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300',
  ESSENTIEL:  'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300',
  CROISSANCE: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300',
  DOMINATION: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
};
