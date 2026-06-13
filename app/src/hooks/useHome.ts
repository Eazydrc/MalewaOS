import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface DailySpecialItem {
  id: string;
  name: string;
  description?: string;
  priceUsdCents: number;
  promoPrice?: number;
  imageUrl?: string;
  isDailySpecial: boolean;
  dailySpecialEndsAt?: string;
  restaurant: {
    id: string;
    name: string;
    imageUrl?: string;
    subscription: string;
  };
}

export interface HomeFeed {
  dailySpecials: DailySpecialItem[];
  promoOffers: any[];
  popularRestaurants: any[];
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useHomeFeed() {
  return useQuery<HomeFeed>({
    queryKey: ['home-feed'],
    queryFn: () => api.get('/home/feed'),
    staleTime: 2 * 60 * 1000,
  });
}
