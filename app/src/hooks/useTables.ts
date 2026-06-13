import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

export interface RestaurantTable {
  id: string;
  restaurantId: string;
  number: number;
  label?: string;
  isActive: boolean;
  createdAt: string;
}

export function useMyTables() {
  return useQuery<RestaurantTable[]>({
    queryKey: ['my-tables'],
    queryFn: () => api.get('/tables/mine'),
    staleTime: 2 * 60 * 1000,
  });
}

export function useCreateTable() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: { number: number; label?: string }) => api.post('/tables', dto),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['my-tables'] }),
  });
}

export function useDeleteTable() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/tables/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['my-tables'] }),
  });
}
