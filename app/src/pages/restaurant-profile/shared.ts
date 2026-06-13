import type { OpeningHours } from "@/hooks/useMenu";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Restaurant {
  id: string; name: string; description?: string; categories: string[];
  phone?: string; address: string; city: string; imageUrl?: string;
  images: string[]; priceRange: number; rating: number; reviewCount: number;
  isOpen: boolean; isActive: boolean; subscription: string;
  restaurantType?: string;
  openingHours?: OpeningHours;
  // Design DOMINATION
  primaryColor?: string; accentColor?: string; secondaryColor?: string;
  bgColor?: string; textColor?: string;
  customLogoUrl?: string; heroImageUrl?: string;
  tagline?: string; story?: string; font?: string;
  bannerText?: string; bannerImageUrl?: string; bannerCtaText?: string;
  gallery?: string[];
}

export interface Reservation {
  id: string; date: string; partySize: number; notes?: string; status: string;
  user: { firstName: string; lastName: string; email: string; phone?: string };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function fc(cents: number) {
  return (cents / 100).toLocaleString("fr-CD", { maximumFractionDigits: 0 }) + " FC";
}

export const TIER_COLOR: Record<string, string> = {
  MAMAN:      "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300",
  ESSENTIEL:  "bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300",
  CROISSANCE: "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300",
  DOMINATION: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300",
};

export const STATUS: Record<string, { label: string; color: string }> = {
  PENDING:   { label: "En attente", color: "warning" },
  CONFIRMED: { label: "Confirmée",  color: "success" },
  CANCELLED: { label: "Annulée",    color: "danger"  },
  COMPLETED: { label: "Terminée",   color: "default" },
  NO_SHOW:   { label: "Absent",     color: "danger"  },
};

export const CATEGORIES = [
  "Congolaise","Africaine","Internationale","Fast-food",
  "Pizza","Grillades","Street food","Végétarien","Fruits de mer",
];

export type Tab = "menu" | "infos" | "horaires" | "reservations" | "offres" | "avis" | "tables" | "analytics" | "personnel" | "design";

export const ESSENTIEL_TIERS = ["ESSENTIEL", "CROISSANCE", "DOMINATION"];
export const OFFER_TYPE_LABEL: Record<string, string> = { PROMO: "Promo", POINTS: "Points", FLASH: "Flash" };
export const OFFER_TYPE_COLOR: Record<string, string> = {
  PROMO: "bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300",
  POINTS: "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300",
  FLASH: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300",
};
