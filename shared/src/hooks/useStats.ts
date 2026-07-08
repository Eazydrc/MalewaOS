import { useQuery } from '@tanstack/react-query';
import { api } from '../api/client';

export function useMyStats() {
  return useQuery<any>({
    queryKey: ['stats', 'mine'],
    queryFn: () => api.get('/stats/mine'),
  });
}

export function useMyAdvancedStats() {
  return useQuery<any>({
    queryKey: ['stats', 'mine', 'advanced'],
    queryFn: () => api.get('/stats/mine/advanced'),
  });
}
