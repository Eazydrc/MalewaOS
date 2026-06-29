import { useQuery, useMutation } from '@tanstack/react-query';
import { api } from '@/lib/api';

export type PaymentTier = 'MAMAN' | 'ESSENTIEL' | 'CROISSANCE' | 'DOMINATION';

// Doit correspondre à TIER_PRICES dans api/src/payments/dto/payment.dto.ts
export const TIER_PRICES_CENTS: Record<PaymentTier, number> = {
  MAMAN: 300, ESSENTIEL: 1000, CROISSANCE: 2500, DOMINATION: 4500,
};

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

export type PaymentMethod = 'CARD' | 'MOBILE_MONEY';

export function useInitiatePayment() {
  return useMutation({
    mutationFn: ({ tier, method, phone }: { tier: PaymentTier; method?: PaymentMethod; phone?: string }) =>
      api.post<{ paymentUrl?: string; devMode?: boolean }>('/payments/subscribe', { tier, method, phone }),
  });
}

// ── Paiement des commandes du jour dans un restaurant ──────────────────────────

export interface OrdersDue {
  orderIds: string[];
  totalCents: number;
  count: number;
}

export function useOrdersDue(restaurantId: string | undefined) {
  return useQuery<OrdersDue>({
    queryKey: ['orders-due', restaurantId],
    queryFn: () => api.get(`/payments/orders/due?restaurantId=${restaurantId}`),
    enabled: !!restaurantId,
    staleTime: 10 * 1000,
  });
}

export function usePayOrders() {
  return useMutation({
    mutationFn: ({ restaurantId, method, phone, orderId }: { restaurantId: string; method?: PaymentMethod; phone?: string; orderId?: string }) =>
      api.post<{ paymentUrl?: string; devMode?: boolean }>('/payments/orders/initiate', { restaurantId, method, phone, orderId }),
  });
}
