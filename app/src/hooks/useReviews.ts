import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, BASE_URL } from '@/lib/api';

export interface Review {
  id: string;
  rating: number;
  comment?: string;
  ownerReply?: string;
  repliedAt?: string;
  createdAt: string;
  user: { firstName: string; lastName: string; avatarUrl?: string };
}

export function useMyReviews() {
  return useQuery<Review[]>({
    queryKey: ['my-reviews'],
    queryFn: () => api.get('/reviews/mine'),
    staleTime: 2 * 60 * 1000,
  });
}

export function usePublicReviews(restaurantId: string) {
  return useQuery<Review[]>({
    queryKey: ['public-reviews', restaurantId],
    queryFn: async () => {
      const res = await fetch(
        `${BASE_URL}/reviews/restaurant/${restaurantId}`
      );
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!restaurantId,
    staleTime: 2 * 60 * 1000,
  });
}

export function useCreateReview() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: { restaurantId: string; rating: number; comment?: string }) =>
      api.post('/reviews', dto),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['public-reviews'] }),
  });
}

export function useReplyReview() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reply }: { id: string; reply: string }) =>
      api.patch(`/reviews/${id}/reply`, { reply }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['my-reviews'] }),
  });
}
