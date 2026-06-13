import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface MenuItem {
  id: string;
  name: string;
  description?: string;
  priceUsdCents: number;
  promoPrice?: number;
  imageUrl?: string;
  isAvailable: boolean;
  isHot: boolean;
  isLastUnits: boolean;
  order: number;
}

export interface MenuSection {
  id: string;
  title: string;
  order: number;
  items: MenuItem[];
}

export interface Menu {
  id: string;
  name: string;
  sections: MenuSection[];
}

export type DayHours = { open: string; close: string; closed: boolean };
export type OpeningHours = Record<string, DayHours>;

export const DAYS = [
  { key: 'lun', label: 'Lundi' },
  { key: 'mar', label: 'Mardi' },
  { key: 'mer', label: 'Mercredi' },
  { key: 'jeu', label: 'Jeudi' },
  { key: 'ven', label: 'Vendredi' },
  { key: 'sam', label: 'Samedi' },
  { key: 'dim', label: 'Dimanche' },
];

export const DEFAULT_HOURS: OpeningHours = {
  lun: { open: '08:00', close: '22:00', closed: false },
  mar: { open: '08:00', close: '22:00', closed: false },
  mer: { open: '08:00', close: '22:00', closed: false },
  jeu: { open: '08:00', close: '22:00', closed: false },
  ven: { open: '08:00', close: '22:00', closed: false },
  sam: { open: '10:00', close: '23:00', closed: false },
  dim: { open: '10:00', close: '23:00', closed: true },
};

// ─── Hooks ────────────────────────────────────────────────────────────────────

export function useMenu() {
  return useQuery<Menu>({
    queryKey: ['my-menu'],
    queryFn: () => api.get('/menu'),
    staleTime: 2 * 60 * 1000,
  });
}

export function useCreateSection() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: { title: string }) => api.post('/menu/sections', dto),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['my-menu'] }),
  });
}

export function useUpdateSection() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...dto }: { id: string; title?: string }) =>
      api.patch(`/menu/sections/${id}`, dto),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['my-menu'] }),
  });
}

export function useDeleteSection() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/menu/sections/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['my-menu'] }),
  });
}

export function useCreateItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ sectionId, ...dto }: {
      sectionId: string; name: string; description?: string;
      priceUsdCents: number; promoPrice?: number; imageUrl?: string;
      isHot?: boolean; isLastUnits?: boolean;
    }) => api.post(`/menu/sections/${sectionId}/items`, dto),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['my-menu'] }),
  });
}

export function useUpdateItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...dto }: {
      id: string; name?: string; description?: string;
      priceUsdCents?: number; promoPrice?: number; imageUrl?: string;
      isAvailable?: boolean; isHot?: boolean; isLastUnits?: boolean;
    }) => api.patch(`/menu/items/${id}`, dto),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['my-menu'] }),
  });
}

export function useToggleItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.patch(`/menu/items/${id}/toggle`, {}),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['my-menu'] }),
  });
}

export function useDeleteItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/menu/items/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['my-menu'] }),
  });
}

export function useToggleDailySpecial() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, isDailySpecial, endsAt }: { id: string; isDailySpecial: boolean; endsAt?: string }) =>
      api.patch(`/menu/items/${id}/daily`, { isDailySpecial, endsAt }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['menu'] });
      qc.invalidateQueries({ queryKey: ['daily-special-status'] });
    },
  });
}
