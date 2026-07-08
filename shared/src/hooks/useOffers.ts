import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client';

export function useMyOffers() {
  return useQuery<any[]>({
    queryKey: ['offers', 'mine'],
    queryFn: () => api.get('/offers/mine'),
  });
}

export function usePublicOffers(restaurantId: string) {
  return useQuery<any[]>({
    queryKey: ['offers', 'public', restaurantId],
    queryFn: () => api.get(`/offers/public/${restaurantId}`),
    enabled: !!restaurantId,
  });
}

export function useCreateOffer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => api.post('/offers', data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['offers'] }),
  });
}

export function useUpdateOffer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string; [key: string]: any }) =>
      api.patch(`/offers/${id}`, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['offers'] }),
  });
}

export function useDeleteOffer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/offers/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['offers'] }),
  });
}
