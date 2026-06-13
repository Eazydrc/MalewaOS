import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

export interface StaffMember {
  id: string; restaurantId: string;
  firstName: string; lastName: string;
  role: string; phone?: string;
  isActive: boolean; createdAt: string;
  userId?: string | null;
}

export const STAFF_ROLES = ['SERVEUR', 'CUISINIER', 'MANAGER', 'CAISSIER', 'AUTRE'] as const;
export const STAFF_ROLE_LABEL: Record<string, string> = {
  SERVEUR:   '🍽️ Serveur',
  CUISINIER: '👨‍🍳 Cuisinier',
  MANAGER:   '📋 Manager',
  CAISSIER:  '💰 Caissier',
  AUTRE:     '👤 Autre',
};

export function useMyStaff() {
  return useQuery<StaffMember[]>({
    queryKey: ['my-staff'],
    queryFn:  () => api.get('/staff'),
    staleTime: 2 * 60 * 1000,
  });
}

export function useCreateStaff() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: { firstName: string; lastName: string; role: string; phone?: string }) =>
      api.post('/staff', dto),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['my-staff'] }),
  });
}

export function useUpdateStaff() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...dto }: { id: string; isActive?: boolean; role?: string; phone?: string }) =>
      api.patch(`/staff/${id}`, dto),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['my-staff'] }),
  });
}

export function useDeleteStaff() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/staff/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['my-staff'] }),
  });
}

export function useCreateStaffLogin() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, email, password }: { id: string; email: string; password: string }) =>
      api.post(`/staff/${id}/login`, { email, password }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['my-staff'] }),
  });
}

export function useDeleteStaffLogin() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/staff/${id}/login`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['my-staff'] }),
  });
}
