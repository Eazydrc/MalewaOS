import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

export interface RestaurantTable {
  id: string;
  restaurantId: string;
  number: number;
  label?: string;
  seats: number;
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

/** Public — tables d'un restaurant, pour choisir "sur place" en commandant depuis l'appli */
export function usePublicTables(restaurantId: string | undefined) {
  return useQuery<Pick<RestaurantTable, 'id' | 'number' | 'label' | 'seats'>[]>({
    queryKey: ['public-tables', restaurantId],
    queryFn: () => api.get(`/tables/restaurant/${restaurantId}`),
    enabled: !!restaurantId,
    staleTime: 2 * 60 * 1000,
  });
}

export function useCreateTable() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: { number: number; label?: string; seats: number }) => api.post('/tables', dto),
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
