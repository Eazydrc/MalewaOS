import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';

export interface Reservation {
  id: string;
  date: string;
  partySize: number;
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED' | 'NO_SHOW';
  notes?: string;
  createdAt: string;
  restaurant: {
    id: string;
    name: string;
    address: string;
    imageUrl?: string;
    phone?: string;
  };
  user: {
    id: string;
    firstName: string;
    lastName: string;
    phone?: string;
  };
  table?: {
    id: string;
    number: string;
    label?: string;
    seats: number;
  };
  preOrderItems?: {
    id: string;
    menuItemId: string;
    name: string;
    priceUsdCents: number;
    quantity: number;
  }[];
}

export function useMyReservations() {
  return useQuery({
    queryKey: ['reservations', 'mine'],
    queryFn:  () => api.get<Reservation[]>('/reservations'),
  });
}

export function useReservation(id: string) {
  return useQuery({
    queryKey: ['reservation', id],
    queryFn:  () => api.get<Reservation>(`/reservations/${id}`),
    enabled: !!id,
  });
}

export function useCreateReservation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      restaurantId: string;
      date: string;
      partySize: number;
      notes?: string;
      items?: { menuItemId: string; quantity: number }[];
    }) => api.post<Reservation>('/reservations', data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['reservations'] }),
  });
}

export function useCancelReservation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete<Reservation>(`/reservations/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['reservations'] }),
  });
}
