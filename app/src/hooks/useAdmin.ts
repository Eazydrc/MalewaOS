import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

// ─── Types ──────────────────────────────────────────────────────────────────

export type AdminRole    = 'CLIENT' | 'RESTAURANT' | 'ADMIN' | 'SUPER_ADMIN';
export type SubTier      = 'DECOUVERTE' | 'MAMAN' | 'ESSENTIEL' | 'CROISSANCE' | 'DOMINATION';
export type OrderStatus  = 'PENDING' | 'ACCEPTED' | 'PREPARING' | 'PACKAGING' | 'OUT_FOR_DELIVERY' | 'READY' | 'DELIVERED' | 'CANCELLED';

export interface AdminUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  role: AdminRole;
  isActive: boolean;
  points: number;
  createdAt: string;
  avatarUrl?: string;
  _count: { reservations: number; orders: number };
}

export interface AdminRestaurant {
  id: string;
  name: string;
  city: string;
  address: string;
  subscription: SubTier;
  subscriptionExpiresAt?: string;
  isActive: boolean;
  isOpen: boolean;
  rating: number;
  reviewCount: number;
  imageUrl?: string;
  createdAt: string;
  owner: { id: string; firstName: string; lastName: string; email: string };
  _count: { reservations: number; orders: number };
}

export interface AdminOrder {
  id: string;
  status: OrderStatus;
  totalCents: number;
  createdAt: string;
  restaurant: { id: string; name: string };
  user: { id: string; firstName: string; lastName: string; email: string };
  _count: { items: number };
}

export interface PageMeta {
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export interface Stats {
  totals: {
    users: number;
    restaurants: number;
    reservations: number;
    orders: number;
    activeRestaurants: number;
  };
  usersByRole: { role: AdminRole; count: number }[];
  restaurantsByTier: { tier: SubTier; count: number }[];
  recentUsers: AdminUser[];
}

// ─── Hooks ──────────────────────────────────────────────────────────────────

export function useAdminStats() {
  return useQuery<Stats>({
    queryKey: ['admin', 'stats'],
    queryFn: () => api.get('/admin/stats'),
    staleTime: 5 * 60 * 1000,
  });
}

export function useAdminUsers(params: {
  search?: string;
  role?: AdminRole;
  page?: number;
}) {
  return useQuery<{ data: AdminUser[]; meta: PageMeta }>({
    queryKey: ['admin', 'users', params],
    queryFn: () => {
      const q = new URLSearchParams();
      if (params.search) q.set('search', params.search);
      if (params.role)   q.set('role', params.role);
      if (params.page)   q.set('page', String(params.page));
      return api.get(`/admin/users?${q}`);
    },
  });
}

export function useAdminRestaurants(params: {
  search?: string;
  subscription?: SubTier;
  page?: number;
}) {
  return useQuery<{ data: AdminRestaurant[]; meta: PageMeta }>({
    queryKey: ['admin', 'restaurants', params],
    queryFn: () => {
      const q = new URLSearchParams();
      if (params.search)       q.set('search', params.search);
      if (params.subscription) q.set('subscription', params.subscription);
      if (params.page)         q.set('page', String(params.page));
      return api.get(`/admin/restaurants?${q}`);
    },
  });
}

export function useAdminOrders(params: {
  search?: string;
  status?: OrderStatus;
  page?: number;
}) {
  return useQuery<{ data: AdminOrder[]; meta: PageMeta }>({
    queryKey: ['admin', 'orders', params],
    queryFn: () => {
      const q = new URLSearchParams();
      if (params.search) q.set('search', params.search);
      if (params.status) q.set('status', params.status);
      if (params.page)   q.set('page', String(params.page));
      return api.get(`/admin/orders?${q}`);
    },
  });
}

export function useChangeUserRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: AdminRole }) =>
      api.patch(`/admin/users/${userId}/role`, { role }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'users'] }),
  });
}

export function useToggleUserStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) => api.patch(`/admin/users/${userId}/status`, {}),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'users'] }),
  });
}

export function useToggleRestaurantStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (restaurantId: string) =>
      api.patch(`/admin/restaurants/${restaurantId}/status`, {}),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'restaurants'] }),
  });
}

export function useChangeRestaurantSubscription() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ restaurantId, subscription }: { restaurantId: string; subscription: SubTier }) =>
      api.patch(`/admin/restaurants/${restaurantId}/subscription`, { subscription }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'restaurants'] }),
  });
}
