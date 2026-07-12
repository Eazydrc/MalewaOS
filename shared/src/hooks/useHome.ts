import { useQuery } from '@tanstack/react-query';
import { api } from '../api/client';

export interface DailySpecialItem {
  id: string;
  name: string;
  description?: string;
  priceUsdCents: number;
  promoPrice?: number;
  imageUrl?: string;
  restaurant: { id: string; name: string; imageUrl?: string };
}

export interface HomeFeed {
  dailySpecials: DailySpecialItem[];
  promoOffers: any[];
  popularRestaurants: any[];
}

export function useHomeFeed() {
  return useQuery<HomeFeed>({
    queryKey: ['home-feed'],
    queryFn: () => api.get('/home/feed'),
    staleTime: 2 * 60 * 1000,
  });
}
