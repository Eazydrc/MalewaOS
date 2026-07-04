import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client';
import { Order } from '../types';

export interface DriverStatus {
  available: boolean;
  lat?: number;
  lng?: number;
}

export interface ActiveDelivery {
  orderId: string;
  status: string;
  restaurantName: string;
  restaurantAddress: string;
  clientAddress: string;
  totalCents: number;
  deliveryFeeCents: number;
  distanceKm?: number;
  etaMinutes?: number;
}

// ── Livreur ───────────────────────────────────────────────────────────────────

export function useDriverStatus() {
  return useQuery<DriverStatus>({
    queryKey: ['driver', 'status'],
    queryFn: () => api.get<DriverStatus>('/delivery/driver/status'),
    refetchInterval: 30000,
  });
}

export function useToggleAvailability() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { available: boolean; lat?: number; lng?: number }) =>
      api.post('/delivery/driver/availability', data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['driver'] }),
  });
}

export function useActiveDeliveries() {
  return useQuery<ActiveDelivery[]>({
    queryKey: ['driver', 'active'],
    queryFn: () => api.get<ActiveDelivery[]>('/delivery/driver/active'),
    refetchInterval: 15000,
  });
}

export function useAcceptDelivery() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (orderId: string) => api.post(`/delivery/accept/${orderId}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['driver'] }),
  });
}

export function useUpdateDeliveryStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ orderId, status }: { orderId: string; status: string }) =>
      api.patch(`/delivery/${orderId}/status`, { status }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['driver', 'orders'] }),
  });
}

export function useDriverHistory() {
  return useQuery<Order[]>({
    queryKey: ['driver', 'history'],
    queryFn: () => api.get<Order[]>('/delivery/driver/history'),
  });
}

// ── Restaurant (chercher un livreur) ─────────────────────────────────────────

export function useRequestDriver() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (orderId: string) => api.post(`/delivery/request/${orderId}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['orders'] }),
  });
}
