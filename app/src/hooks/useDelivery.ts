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
  verificationCode?: string;
  deliveryCode?: string;
  escrowReleased?: boolean;
  isPaid?: boolean;
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
  verificationCode?: string;
  deliveryCode?: string;
  escrowReleased?: boolean;
  driverEarningsCents?: number;
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

export interface DeliveryRequest {
  id: string;
  status: string;
  deliveryAddress: string;
  deliveryLat?: number;
  deliveryLng?: number;
  deliveryFeeUsdCents: number;
  driverEarningsCents: number;
  createdAt: string;
  isClaimed: boolean;
  isClaimedByMe: boolean;
  restaurant: {
    id: string;
    name: string;
    imageUrl?: string;
    lat?: number;
    lng?: number;
    address: string;
  };
}

export interface DriverStats {
  today: {
    count: number;
    earningsCents: number;
    deliveries: { id: string; driverEarningsCents: number; restaurant: { name: string }; escrowReleasedAt: string }[];
  };
  week: {
    count: number;
    earningsCents: number;
  };
  month: {
    count: number;
    earningsCents: number;
  };
}

export interface DriverAffiliation {
  id: string;
  restaurantId: string;
  restaurant: { id: string; name: string; imageUrl?: string; address: string };
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

// ── Matching livreur (façon Yango) ──────────────────────────────────────────────

export function useFindDriver() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (orderId: string) => api.post<{ driversNotified: number }>(`/orders/${orderId}/find-driver`, {}),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['restaurant-orders'] }),
  });
}

export function useAcceptDelivery() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (orderId: string) => api.post(`/orders/${orderId}/accept-delivery`, {}),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['driver-orders'] }),
  });
}

export function useConfirmDelivery(orderId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (code: string) => api.post(`/orders/${orderId}/confirm-delivery`, { code }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['order-tracking', orderId] });
      qc.invalidateQueries({ queryKey: ['my-orders'] });
    },
  });
}

export function useDriverScanPickup(orderId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (code: string) => api.post<{
      deliveryAddress: string; deliveryLat?: number; deliveryLng?: number; deliveryCode: string;
    }>(`/orders/${orderId}/driver/scan-pickup`, { code }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['driver-orders'] }),
  });
}

export function useReportProblem(orderId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (reason: string) => api.post(`/orders/${orderId}/report-problem`, { reason }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['order-tracking', orderId] }),
  });
}

export function useSetDriverAvailability() {
  return useMutation({
    mutationFn: ({ isAvailable, lat, lng }: { isAvailable: boolean; lat?: number; lng?: number }) =>
      api.patch<{ id: string; isAvailableForDelivery: boolean }>('/orders/drivers/availability', { isAvailable, lat, lng }),
  });
}

export function useDeliveryRequests(enabled = true) {
  return useQuery<DeliveryRequest[]>({
    queryKey: ['delivery-requests'],
    queryFn: () => api.get('/orders/driver/requests'),
    enabled,
    refetchInterval: 10000,
    staleTime: 0,
  });
}

export function useClaimDelivery() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (orderId: string) => api.post(`/orders/${orderId}/claim`, {}),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['delivery-requests'] }),
  });
}

export function useDriverStats(enabled = true) {
  return useQuery<DriverStats>({
    queryKey: ['driver-stats'],
    queryFn: () => api.get('/orders/driver/stats'),
    enabled,
    refetchInterval: 30000,
    staleTime: 60000,
  });
}

export function useDriverAffiliations() {
  return useQuery<DriverAffiliation[]>({
    queryKey: ['driver-affiliations'],
    queryFn: () => api.get('/orders/driver/affiliations'),
    staleTime: 60000,
  });
}

export function useJoinAffiliation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (code: string) => api.post<{ restaurantName: string }>('/orders/driver/affiliations/join', { code }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['driver-affiliations'] }),
  });
}

export function useLeaveAffiliation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (restaurantId: string) => api.delete(`/orders/driver/affiliations/${restaurantId}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['driver-affiliations'] }),
  });
}

export function useAffiliationCode(restaurantId: string, enabled = true) {
  return useQuery<{ code: string }>({
    queryKey: ['affiliation-code', restaurantId],
    queryFn: () => api.get(`/orders/restaurant/${restaurantId}/affiliation-code`),
    enabled: !!restaurantId && enabled,
    staleTime: Infinity,
  });
}

export function useAffiliatedDrivers(restaurantId: string, enabled = true) {
  return useQuery<{ id: string; driver: { id: string; firstName: string; lastName: string; phone?: string; isAvailableForDelivery: boolean } }[]>({
    queryKey: ['affiliated-drivers', restaurantId],
    queryFn: () => api.get(`/orders/restaurant/${restaurantId}/affiliated-drivers`),
    enabled: !!restaurantId && enabled,
    staleTime: 30000,
  });
}
