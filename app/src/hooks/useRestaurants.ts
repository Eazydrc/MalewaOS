import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';

export interface Restaurant {
  id: string;
  name: string;
  description?: string;
  address: string;
  city: string;
  imageUrl?: string;
  categories: string[];
  priceRange: number;
  rating: number;
  reviewCount: number;
  isOpen: boolean;
}

export interface RestaurantDetail extends Restaurant {
  phone?: string;
  images: string[];
  openingHours?: Record<string, { open: string; close: string; closed: boolean }>;
  menus: Menu[];
  reviews: Review[];
}

export interface Menu {
  id: string;
  name: string;
  sections: MenuSection[];
}

export interface MenuSection {
  id: string;
  title: string;
  order: number;
  items: MenuItem[];
}

export interface MenuItem {
  id: string;
  name: string;
  description?: string;
  priceUsdCents: number;
  imageUrl?: string;
  isAvailable: boolean;
}

export interface Review {
  id: string;
  rating: number;
  comment?: string;
  createdAt: string;
  user: { firstName: string; lastName: string; avatarUrl?: string };
}

interface RestaurantsPage {
  items: Restaurant[];
  total: number;
  page: number;
  pages: number;
}

// ── Hooks ─────────────────────────────────────────────────────────────────────

export function useRestaurants(params?: {
  search?: string;
  category?: string;
  city?: string;
  isOpen?: boolean;
  minRating?: number;
  maxPriceRange?: number;
  limit?: number;
}) {
  const query = new URLSearchParams();
  if (params?.search)        query.set('search',        params.search);
  if (params?.category)      query.set('category',      params.category);
  if (params?.city)          query.set('city',          params.city);
  if (params?.isOpen        !== undefined) query.set('isOpen',        String(params.isOpen));
  if (params?.minRating     !== undefined) query.set('minRating',     String(params.minRating));
  if (params?.maxPriceRange !== undefined) query.set('maxPriceRange', String(params.maxPriceRange));
  query.set('limit', String(params?.limit ?? 20));

  return useQuery({
    queryKey: ['restaurants', params],
    queryFn:  () => api.get<RestaurantsPage>(`/restaurants?${query}`),
    staleTime: 5 * 60 * 1000,
  });
}

export function useRestaurant(id: string) {
  return useQuery({
    queryKey: ['restaurant', id],
    queryFn:  () => api.get<RestaurantDetail>(`/restaurants/${id}`),
    staleTime: 2 * 60 * 1000,
    enabled: !!id,
  });
}
