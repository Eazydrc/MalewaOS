import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client';

export function useMenu() {
  return useQuery<any>({
    queryKey: ['menu', 'mine'],
    queryFn: () => api.get('/menu/mine'),
  });
}

export function usePublicMenu(restaurantId: string) {
  return useQuery<any>({
    queryKey: ['menu', 'public', restaurantId],
    queryFn: () => api.get(`/menu/public/${restaurantId}`),
    enabled: !!restaurantId,
  });
}

export function useCreateSection() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { title: string; order: number }) => api.post('/menu/sections', data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['menu'] }),
  });
}

export function useUpdateSection() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string; title?: string; order?: number }) =>
      api.patch(`/menu/sections/${id}`, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['menu'] }),
  });
}

export function useDeleteSection() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/menu/sections/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['menu'] }),
  });
}

export function useCreateItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      sectionId: string;
      name: string;
      description?: string;
      priceUsdCents: number;
      promoPrice?: number;
      isHot?: boolean;
      isLastUnits?: boolean;
    }) => api.post('/menu/items', data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['menu'] }),
  });
}

export function useUpdateItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string; [key: string]: any }) =>
      api.patch(`/menu/items/${id}`, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['menu'] }),
  });
}

export function useToggleItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.patch(`/menu/items/${id}/toggle`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['menu'] }),
  });
}

export function useDeleteItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/menu/items/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['menu'] }),
  });
}
