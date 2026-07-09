import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client';
import { Restaurant, Review } from '../types';

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

// ── Restaurant owner ───────────────────────────────────────────────────────────

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
