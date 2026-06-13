import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { useAuthStore } from '../store/auth.store';

export interface WalletSummary {
  points: number;
  redeemableFC: number;
  nextTierPoints: number;
  progress: number;
  minRedeem: number;
}

export interface PointTransaction {
  id: string;
  amount: number;
  type: 'EARN' | 'REDEEM' | 'BONUS' | 'EXPIRY' | 'REFUND';
  reason: string;
  createdAt: string;
}

interface HistoryPage {
  items: PointTransaction[];
  total: number;
  page: number;
  pages: number;
}

export function useWalletSummary() {
  return useQuery({
    queryKey: ['wallet', 'summary'],
    queryFn:  () => api.get<WalletSummary>('/wallet'),
  });
}

export function useWalletHistory(page = 1) {
  return useQuery({
    queryKey: ['wallet', 'history', page],
    queryFn:  () => api.get<HistoryPage>(`/wallet/history?page=${page}`),
  });
}

export function useRedeemPoints() {
  const qc = useQueryClient();
  const { updatePoints } = useAuthStore();

  return useMutation({
    mutationFn: (points: number) =>
      api.post<{ remainingPoints: number; amountFC: number; pointsSpent: number }>(
        '/wallet/redeem',
        { points },
      ),
    onSuccess: ({ remainingPoints }) => {
      updatePoints(remainingPoints);
      qc.invalidateQueries({ queryKey: ['wallet'] });
    },
  });
}
