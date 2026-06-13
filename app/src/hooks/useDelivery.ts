import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface Driver {
  id: string;
  firstName: string;
  lastName: string;
  phone?: string;
  avatarUrl?: string;
}

export interface TrackingData {
  orderId: string;
  status: string;
  deliveryAddress?: string;
  deliveryLat?: number;
  deliveryLng?: number;
  driverLat?: number;
  driverLng?: number;
  driverLastSeen?: string;
  driver?: Driver;
  restaurant: {
    name: string;
    lat?: number;
    lng?: number;
    address: string;
  };
}

export interface DriverOrder {
  id: string;
  status: string;
  totalCents: number;
  notes?: string;
  deliveryAddress?: string;
  deliveryLat?: number;
  deliveryLng?: number;
  createdAt: string;
  restaurant: {
    id: string;
    name: string;
    imageUrl?: string;
    lat?: number;
    lng?: number;
    address: string;
  };
  user: {
    firstName: string;
    lastName: string;
    phone?: string;
  };
  items: {
    id: string;
    name: string;
    quantity: number;
    priceUsdCents: number;
  }[];
}

// ── Client tracking ───────────────────────────────────────────────────────────

export function useOrderTracking(orderId: string, enabled = true) {
  return useQuery<TrackingData>({
    queryKey: ['order-tracking', orderId],
    queryFn: () => api.get(`/orders/${orderId}/tracking`),
    enabled: !!orderId && enabled,
    refetchInterval: 5000,      // Polling toutes les 5s
    staleTime: 0,               // Toujours re-fetch
  });
}

// ── Driver ────────────────────────────────────────────────────────────────────

export function useDriverOrders() {
  return useQuery<DriverOrder[]>({
    queryKey: ['driver-orders'],
    queryFn: () => api.get('/orders/driver/mine'),
    refetchInterval: 15000,     // Polling toutes les 15s
    staleTime: 0,
  });
}

export function useAvailableDrivers() {
  return useQuery<Driver[]>({
    queryKey: ['drivers-available'],
    queryFn: () => api.get('/orders/drivers/available'),
    staleTime: 60 * 1000,
  });
}

export function useAssignDriver(orderId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (driverId: string) =>
      api.patch(`/orders/${orderId}/assign-driver`, { driverId }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['restaurant-orders'] });
      qc.invalidateQueries({ queryKey: ['order-tracking', orderId] });
    },
  });
}

export function useDriverPickup(orderId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.patch(`/orders/${orderId}/driver/pickup`, {}),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['driver-orders'] }),
  });
}

export function useDriverDeliver(orderId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.patch(`/orders/${orderId}/driver/deliver`, {}),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['driver-orders'] }),
  });
}

export function useUpdateDriverLocation() {
  return useMutation({
    mutationFn: ({ orderId, lat, lng }: { orderId: string; lat: number; lng: number }) =>
      api.put(`/orders/${orderId}/driver/location`, { lat, lng }),
  });
}
