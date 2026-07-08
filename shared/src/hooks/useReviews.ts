import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client';

export function useMyReviews() {
  return useQuery<any[]>({
    queryKey: ['reviews', 'mine'],
    queryFn: () => api.get('/reviews/mine'),
  });
}

export function usePublicReviews(restaurantId: string) {
  return useQuery<any[]>({
    queryKey: ['reviews', 'public', restaurantId],
    queryFn: () => api.get(`/reviews/restaurant/${restaurantId}`),
    enabled: !!restaurantId,
  });
}

export function useReplyReview() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reply }: { id: string; reply: string }) =>
      api.patch(`/reviews/${id}/reply`, { reply }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['reviews'] }),
  });
}
