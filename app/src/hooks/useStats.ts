import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

export interface RestaurantStats {
  restaurant: { id: string; name: string; subscription: string; rating: number; reviewCount: number };
  reservations: { total: number; week: number; month: number; byStatus: Record<string, number> };
  orders:       { total: number; week: number; month: number; byStatus: Record<string, number> };
  revenue:      { week: number; month: number; total: number };
  topItems:     { name: string; quantity: number }[];
  dailyOrders:  { day: string; count: number; revenue: number }[];
}

export interface AdvancedStats {
  reservations: { thisWeek: number; lastWeek: number; weekChange: number; thisMonth: number; lastMonth: number; monthChange: number };
  orders:       { thisWeek: number; lastWeek: number; weekChange: number; thisMonth: number; lastMonth: number; monthChange: number };
  revenue:      { thisWeek: number; lastWeek: number; weekChange: number; thisMonth: number; lastMonth: number; monthChange: number };
  conversionRate: { reservations: number; orders: number };
  peakHours:    { hour: number; count: number }[];
  daily14:      { date: string; revenue: number; orders: number; reservations: number }[];
}

export function useMyStats() {
  return useQuery<RestaurantStats>({
    queryKey: ['my-stats'],
    queryFn:  () => api.get('/stats/mine'),
    staleTime: 5 * 60 * 1000,
  });
}

export function useAdvancedStats(enabled = true) {
  return useQuery<AdvancedStats>({
    queryKey: ['my-stats-advanced'],
    queryFn:  () => api.get('/stats/mine/advanced'),
    staleTime: 5 * 60 * 1000,
    enabled,
  });
}
