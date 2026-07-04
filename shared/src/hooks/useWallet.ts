import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client';
import { PointTransaction } from '../types';

export interface WalletSummary {
  points: number;
  transactions: PointTransaction[];
}

export function useWallet() {
  return useQuery<WalletSummary>({
    queryKey: ['wallet'],
    queryFn: () => api.get<WalletSummary>('/wallet'),
  });
}

export function useRedeemPoints() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (points: number) => api.post('/wallet/redeem', { points }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['wallet'] });
      qc.invalidateQueries({ queryKey: ['me'] });
    },
  });
}
