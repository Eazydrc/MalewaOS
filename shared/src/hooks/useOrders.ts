import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client';
import { Order } from '../types';

export function useMyOrders() {
  return useQuery<Order[]>({
    queryKey: ['orders', 'mine'],
    queryFn: () => api.get<Order[]>('/orders/mine'),
  });
}

export function useOrder(id: string) {
  return useQuery<Order>({
    queryKey: ['order', id],
    queryFn: () => api.get<Order>(`/orders/${id}`),
    enabled: !!id,
    refetchInterval: 15000,
  });
}

export function useCreateOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      restaurantId: string;
      type: string;
      tableId?: string;
      items: { menuItemId: string; quantity: number }[];
      notes?: string;
      deliveryAddress?: string;
    }) => api.post<Order>('/orders', data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['orders'] }),
  });
}

export function useRestaurantOrders() {
  return useQuery<Order[]>({
    queryKey: ['orders', 'restaurant'],
    queryFn: () => api.get<Order[]>('/orders/restaurant'),
    refetchInterval: 20000,
  });
}

export function useUpdateOrderStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      api.patch(`/orders/${id}/status`, { status }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['orders'] }),
  });
}
