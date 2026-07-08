import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client';

export function useMyRestaurant() {
  return useQuery<any>({
    queryKey: ['restaurant', 'mine'],
    queryFn: () => api.get('/restaurants/mine'),
  });
}

export function useUpdateMyRestaurant() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => api.patch('/restaurants/mine', data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['restaurant', 'mine'] }),
  });
}

export function useUpdateHours() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (hours: any) => api.put('/restaurants/mine/hours', { hours }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['restaurant', 'mine'] }),
  });
}
