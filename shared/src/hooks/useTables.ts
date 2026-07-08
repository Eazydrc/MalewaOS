import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client';

export function useMyTables() {
  return useQuery<any[]>({
    queryKey: ['tables', 'mine'],
    queryFn: () => api.get('/tables/mine'),
  });
}

export function useCreateTable() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { number: number; label?: string }) => api.post('/tables', data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tables'] }),
  });
}

export function useDeleteTable() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/tables/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tables'] }),
  });
}
