import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, BASE_URL } from '@/lib/api';

export interface Offer {
  id: string;
  restaurantId: string;
  title: string;
  description: string;
  type: 'PROMO' | 'POINTS' | 'FLASH';
  discountPct?: number;
  pointsCost?: number;
  expiresAt: string;
  maxUses?: number;
  usedCount: number;
  isActive: boolean;
  createdAt: string;
}

export function useMyOffers() {
  return useQuery<Offer[]>({
    queryKey: ['my-offers'],
    queryFn: () => api.get('/offers/mine'),
    staleTime: 2 * 60 * 1000,
  });
}

export function usePublicOffers(restaurantId: string) {
  return useQuery<Offer[]>({
    queryKey: ['public-offers', restaurantId],
    queryFn: async () => {
      const res = await fetch(
        `${BASE_URL}/offers/public/${restaurantId}`
      );
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!restaurantId,
    staleTime: 2 * 60 * 1000,
  });
}

export function useCreateOffer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: {
      title: string; description: string; type: string;
      discountPct?: number; pointsCost?: number;
      expiresAt: string; maxUses?: number;
    }) => api.post('/offers', dto),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['my-offers'] }),
  });
}

export function useUpdateOffer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...dto }: { id: string; isActive?: boolean; title?: string; description?: string }) =>
      api.patch(`/offers/${id}`, dto),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['my-offers'] }),
  });
}

export function useDeleteOffer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/offers/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['my-offers'] }),
  });
}
