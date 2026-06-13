import { useQuery, useMutation } from '@tanstack/react-query';
import { api } from '@/lib/api';

export type PaymentTier = 'MAMAN' | 'ESSENTIEL' | 'CROISSANCE' | 'DOMINATION';

export const TIER_INFO: Record<PaymentTier, { price: string; label: string; color: string; features: string[] }> = {
  MAMAN:      { price: '$3/mois',  label: 'Maman',      color: 'text-zinc-600 dark:text-zinc-300',    features: ['Menu digital', 'Réservations', 'QR code', 'Horaires'] },
  ESSENTIEL:  { price: '$10/mois', label: 'Essentiel',  color: 'text-sky-600 dark:text-sky-300',      features: ['+ Offres & promos', 'Badges plats', 'Répondre aux avis'] },
  CROISSANCE: { price: '$25/mois', label: 'Croissance', color: 'text-violet-600 dark:text-violet-300', features: ['+ Commandes en ligne', 'Tables QR', 'Analytics', 'Gestion personnel'] },
  DOMINATION: { price: '$45/mois', label: 'Domination', color: 'text-orange-600 dark:text-orange-300', features: ['+ Analytics avancés', 'Design personnalisé', 'Comptes staff', 'Notifications push'] },
};

export interface Payment {
  id: string;
  tier: string;
  amount: number;
  status: 'PENDING' | 'SUCCESS' | 'FAILED';
  createdAt: string;
}

export function usePaymentHistory() {
  return useQuery<Payment[]>({
    queryKey: ['payment-history'],
    queryFn:  () => api.get('/payments/history'),
    staleTime: 5 * 60 * 1000,
  });
}

export function useInitiatePayment() {
  return useMutation({
    mutationFn: (tier: PaymentTier) => api.post<{ paymentUrl: string }>('/payments/initiate', { tier }),
  });
}
