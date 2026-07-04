import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';

export interface TokenStorage {
  getAccessToken: () => Promise<string | null>;
  getRefreshToken: () => Promise<string | null>;
  setTokens: (access: string, refresh: string) => Promise<void>;
  clearTokens: () => Promise<void>;
}

// Adapter web — cookies HttpOnly gérés par le navigateur (pas de stockage JS)
export const webTokenStorage: TokenStorage = {
  getAccessToken:  async () => null,
  getRefreshToken: async () => null,
  setTokens:       async () => {},
  clearTokens:     async () => {},
};

let _storage: TokenStorage = webTokenStorage;
let _baseUrl = 'http://192.168.11.111:3001/api/v1';
let _onUnauthorized: (() => void) | null = null;

export function configureApi(opts: {
  baseUrl?: string;
  storage?: TokenStorage;
  onUnauthorized?: () => void;
}) {
  if (opts.baseUrl) _baseUrl = opts.baseUrl;
  if (opts.storage) _storage = opts.storage;
  if (opts.onUnauthorized) _onUnauthorized = opts.onUnauthorized;
}

function createAxios(): AxiosInstance {
  const instance = axios.create({
    baseURL: _baseUrl,
    withCredentials: true, // cookies pour le web
    headers: { 'Content-Type': 'application/json' },
  });

  // Injecte le token Bearer si disponible (mobile)
  instance.interceptors.request.use(async (config) => {
    const token = await _storage.getAccessToken();
    if (token) {
      config.headers = config.headers ?? {};
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  });

  // Auto-refresh sur 401
  let isRefreshing = false;
  let queue: Array<(token: string | null) => void> = [];

  instance.interceptors.response.use(
    (res) => res,
    async (error) => {
      const original = error.config as AxiosRequestConfig & { _retry?: boolean };
      const isAuthEndpoint = original.url?.match(/\/auth\/(login|register|verify|forgot|reset|mfa|resend|refresh)/);

      if (error.response?.status === 401 && !original._retry && !isAuthEndpoint) {
        if (isRefreshing) {
          return new Promise((resolve, reject) => {
            queue.push((token) => {
              if (token) {
                original.headers = { ...original.headers, Authorization: `Bearer ${token}` };
                resolve(instance(original));
              } else {
                reject(error);
              }
            });
          });
        }

        original._retry = true;
        isRefreshing = true;

        try {
          const refreshToken = await _storage.getRefreshToken();
          const res = await axios.post(`${_baseUrl}/auth/refresh`, {}, {
            withCredentials: true,
            headers: refreshToken ? { Authorization: `Bearer ${refreshToken}` } : {},
          });

          const newAccess = res.data?.accessToken;
          const newRefresh = res.data?.refreshToken;
          if (newAccess && newRefresh) {
            await _storage.setTokens(newAccess, newRefresh);
          }

          queue.forEach((cb) => cb(newAccess ?? null));
          queue = [];
          isRefreshing = false;

          if (newAccess) {
            original.headers = { ...original.headers, Authorization: `Bearer ${newAccess}` };
          }
          return instance(original);
        } catch {
          queue.forEach((cb) => cb(null));
          queue = [];
          isRefreshing = false;
          await _storage.clearTokens();
          _onUnauthorized?.();
          return Promise.reject(error);
        }
      }

      const msg = error.response?.data?.message ?? error.message ?? 'Erreur réseau';
      return Promise.reject(new Error(Array.isArray(msg) ? msg.join(', ') : msg));
    },
  );

  return instance;
}

// Instance partagée — recréée si configureApi est appelé
let _instance: AxiosInstance = createAxios();

export function getAxios() {
  return _instance;
}

export function resetAxios() {
  _instance = createAxios();
}

export const api = {
  get:    <T>(path: string) => _instance.get<T>(path).then((r) => r.data),
  post:   <T>(path: string, body?: unknown) => _instance.post<T>(path, body).then((r) => r.data),
  patch:  <T>(path: string, body: unknown) => _instance.patch<T>(path, body).then((r) => r.data),
  put:    <T>(path: string, body: unknown) => _instance.put<T>(path, body).then((r) => r.data),
  delete: <T>(path: string) => _instance.delete<T>(path).then((r) => r.data),
};
