import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { configureApi, resetAxios, api } from '@elengi/shared';
import { AuthUser } from '@elengi/shared';
import { API_URL } from '../config';

const TOKEN_ACCESS  = 'elengi_access';
const TOKEN_REFRESH = 'elengi_refresh';

// Configuration du client API avec AsyncStorage pour le mobile
configureApi({
  baseUrl: API_URL,
  storage: {
    getAccessToken:  () => AsyncStorage.getItem(TOKEN_ACCESS),
    getRefreshToken: () => AsyncStorage.getItem(TOKEN_REFRESH),
    setTokens: async (access, refresh) => {
      await AsyncStorage.multiSet([[TOKEN_ACCESS, access], [TOKEN_REFRESH, refresh]]);
    },
    clearTokens: async () => {
      await AsyncStorage.multiRemove([TOKEN_ACCESS, TOKEN_REFRESH]);
    },
  },
  onUnauthorized: () => {
    useAuthStore.getState().clear();
  },
});
resetAxios();

interface AuthState {
  user: AuthUser | null;
  isLoading: boolean;
  hasChecked: boolean;
  fetchMe: () => Promise<void>;
  setTokens: (access: string, refresh: string) => Promise<void>;
  clear: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user:       null,
  isLoading:  false,
  hasChecked: false,

  async fetchMe() {
    set({ isLoading: true });
    try {
      const user = await api.get<AuthUser>('/auth/me');
      set({ user, hasChecked: true });
    } catch {
      set({ user: null, hasChecked: true });
    } finally {
      set({ isLoading: false });
    }
  },

  async setTokens(access, refresh) {
    await AsyncStorage.multiSet([[TOKEN_ACCESS, access], [TOKEN_REFRESH, refresh]]);
  },

  async clear() {
    await AsyncStorage.multiRemove([TOKEN_ACCESS, TOKEN_REFRESH]);
    set({ user: null, hasChecked: true });
  },
}));
