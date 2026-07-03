import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface PublicRestaurant {
  id: string;
  name: string;
  tagline?: string;
  description?: string;
  story?: string;
  imageUrl?: string;
  heroImageUrl?: string;
  cuisine: string;
  restaurantType: 'SUR_PLACE' | 'LIVRAISON' | 'LES_DEUX';
  isOpen: boolean;
  rating?: number;
  reviewCount?: number;
  subscription: string;
  primaryColor?: string;
  accentColor?: string;
  secondaryColor?: string;
  textColor?: string;
  bgColor?: string;
  customLogoUrl?: string;
  font?: string;
  bannerText?: string;
  bannerImageUrl?: string;
  bannerCtaText?: string;
  address: {
    commune?: string | null;
    quartier?: string | null;
    numero?: string | null;
    reference?: string | null;
    full?: string | null;
  };
  phone?: string;
  lat?: number;
  lng?: number;
  gallery?: string[];
  menu?: {
    sections: {
      id: string;
      title: string;
      items: {
        id: string;
        name: string;
        description?: string;
        priceUsdCents: number;
        promoPrice?: number;
        imageUrl?: string;
        isAvailable: boolean;
        isHot: boolean;
        isLastUnits: boolean;
        isDailySpecial?: boolean;
        dailySpecialEndsAt?: string;
      }[];
    }[];
  };
  activeOffers?: {
    id: string;
    type: string;
    title?: string;
    description?: string;
    discountPct?: number;
    pointsCost?: number;
    expiresAt?: string;
    maxUses?: number;
    usedCount?: number;
  }[];
  recentReviews?: {
    id: string;
    rating: number;
    comment?: string;
    ownerReply?: string;
    repliedAt?: string;
    createdAt: string;
    user: { firstName: string; lastName: string };
  }[];
}

// ── Hooks ─────────────────────────────────────────────────────────────────────

export function useRestaurantPublic(id: string) {
  return useQuery<PublicRestaurant>({
    queryKey: ['restaurant-public', id],
    queryFn: () => api.get(`/restaurants/${id}/public`),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
}

export function useRestaurantsMap() {
  return useQuery<any[]>({
    queryKey: ['restaurants-map'],
    queryFn: () => api.get('/restaurants/map'),
    staleTime: 5 * 60 * 1000,
  });
}
