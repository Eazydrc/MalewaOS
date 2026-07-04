import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client';
import { Restaurant, Menu, Offer, Review } from '../types';

// ── Public ─────────────────────────────────────────────────────────────────────

export function usePublicRestaurants(params?: { search?: string; category?: string }) {
  const qs = new URLSearchParams();
  if (params?.search) qs.set('search', params.search);
  if (params?.category) qs.set('category', params.category);
  const query = qs.toString() ? `?${qs}` : '';
  return useQuery<Restaurant[]>({
    queryKey: ['restaurants', 'public', params],
    queryFn: () => api.get<Restaurant[]>(`/restaurants${query}`),
  });
}

export function usePublicRestaurant(id: string) {
  return useQuery<Restaurant>({
    queryKey: ['restaurant', 'public', id],
    queryFn: () => api.get<Restaurant>(`/restaurants/${id}`),
    enabled: !!id,
  });
}

export function usePublicMenu(restaurantId: string) {
  return useQuery<Menu>({
    queryKey: ['menu', 'public', restaurantId],
    queryFn: () => api.get<Menu>(`/menu/public/${restaurantId}`),
    enabled: !!restaurantId,
  });
}

export function usePublicOffers(restaurantId: string) {
  return useQuery<Offer[]>({
    queryKey: ['offers', 'public', restaurantId],
    queryFn: () => api.get<Offer[]>(`/offers/public/${restaurantId}`),
    enabled: !!restaurantId,
  });
}

export function usePublicReviews(restaurantId: string) {
  return useQuery<Review[]>({
    queryKey: ['reviews', 'public', restaurantId],
    queryFn: () => api.get<Review[]>(`/reviews/restaurant/${restaurantId}`),
    enabled: !!restaurantId,
  });
}

// ── Restaurant owner ───────────────────────────────────────────────────────────

export function useMyRestaurant() {
  return useQuery<Restaurant>({
    queryKey: ['restaurant', 'mine'],
    queryFn: () => api.get<Restaurant>('/restaurants/mine'),
  });
}

export function useUpdateRestaurant() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Restaurant>) => api.patch('/restaurants/mine', data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['restaurant'] }),
  });
}

// ── Avis ──────────────────────────────────────────────────────────────────────

export function useCreateReview() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { restaurantId: string; rating: number; comment?: string }) =>
      api.post<Review>('/reviews', data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['reviews'] }),
  });
}
