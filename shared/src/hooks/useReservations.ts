import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client';
import { Reservation } from '../types';

export function useMyReservations() {
  return useQuery<Reservation[]>({
    queryKey: ['reservations', 'mine'],
    queryFn: () => api.get<Reservation[]>('/reservations'),
  });
}

export function useReservation(id: string) {
  return useQuery<Reservation>({
    queryKey: ['reservation', id],
    queryFn: () => api.get<Reservation>(`/reservations/${id}`),
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

// Hook pour vue restaurant
export function useRestaurantReservations() {
  return useQuery<Reservation[]>({
    queryKey: ['reservations', 'restaurant'],
    queryFn: () => api.get<Reservation[]>('/reservations/restaurant'),
    refetchInterval: 30000,
  });
}

export function useUpdateReservationStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      api.patch(`/reservations/${id}/status`, { status }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['reservations'] }),
  });
}
