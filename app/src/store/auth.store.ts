import { create } from 'zustand';
import { api } from '../lib/api';

export interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  points: number;
  avatarUrl?: string;
  isActive: boolean;
}

interface AuthState {
  user:            AuthUser | null;
  isLoading:       boolean;
  isAuthenticated: boolean;
  hasChecked:      boolean; // Vrai une fois que /auth/me a été appelé au démarrage

  fetchMe:      () => Promise<void>;
  logout:       () => Promise<void>;
  updatePoints: (points: number) => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user:            null,
  isLoading:       false,
  isAuthenticated: false,
  hasChecked:      false,

  async fetchMe() {
    // Évite les appels concurrents
    if (get().isLoading) return;
    set({ isLoading: true });
    try {
      const user = await api.get<AuthUser>('/auth/me');
      set({ user, isAuthenticated: true, hasChecked: true });
    } catch {
      set({ user: null, isAuthenticated: false, hasChecked: true });
    } finally {
      set({ isLoading: false });
    }
  },

  async logout() {
    try {
      // Le backend révoque le refresh token et efface les cookies
      await api.post('/auth/logout');
    } catch { /* silencieux — les cookies seront expirés de toute façon */ }
    set({ user: null, isAuthenticated: false, hasChecked: true });
  },

  updatePoints(points) {
    const user = get().user;
    if (user) set({ user: { ...user, points } });
  },
}));
