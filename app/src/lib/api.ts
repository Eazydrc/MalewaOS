// ── Client HTTP centralisé ───────────────────────────────────────────────────
// Les tokens JWT sont dans des cookies HttpOnly — jamais en localStorage.
// credentials: 'include' est requis pour que le navigateur envoie les cookies.

// En Electron, l'URL peut être surchargée via localStorage (setApiUrl IPC → reload)
function resolveBaseUrl(): string {
  if (typeof window !== 'undefined' && (window as any).electronAPI?.isElectron) {
    const saved = localStorage.getItem('elengi_api_url');
    if (saved) return saved;
  }
  return import.meta.env.VITE_API_URL ?? 'http://localhost:3001/api/v1';
}

export const BASE_URL = resolveBaseUrl();

class ApiError extends Error {
  constructor(
    public status: number,
    public message: string,
    public data?: unknown,
  ) {
    super(message);
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers,
    credentials: 'include', // Envoie toujours les cookies (access_token + refresh_token)
  });

  // Auto-refresh transparent si le access_token a expiré
  // Sauf pour les endpoints auth eux-mêmes (login, register…) — on propage le vrai message
  const isAuthEndpoint = path.startsWith('/auth/login') || path.startsWith('/auth/register') ||
    path.startsWith('/auth/verify') || path.startsWith('/auth/forgot') ||
    path.startsWith('/auth/reset') || path.startsWith('/auth/mfa') ||
    path.startsWith('/auth/resend');

  if (res.status === 401 && !isAuthEndpoint) {
    const refreshed = await tryRefresh();
    if (refreshed) {
      // Réessaie la requête originale (les nouveaux cookies sont posés)
      const retried = await fetch(`${BASE_URL}${path}`, {
        ...options,
        headers,
        credentials: 'include',
      });
      if (!retried.ok) throw await toError(retried);
      if (retried.status === 204) return undefined as T;
      return retried.json() as Promise<T>;
    }
    // Refresh impossible → redirection login (seulement si pas déjà sur une page publique)
    const pub = ['/login', '/register', '/forgot-password', '/reset-password', '/verify-email'];
    if (!pub.some(p => window.location.pathname.startsWith(p))) {
      window.location.href = '/login';
    }
    throw new ApiError(401, 'Session expirée');
  }

  if (!res.ok) throw await toError(res);
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

async function toError(res: Response): Promise<ApiError> {
  let data: any;
  try { data = await res.json(); } catch { data = null; }
  return new ApiError(res.status, data?.message ?? res.statusText, data);
}

// Appelle POST /auth/refresh — le browser envoie refresh_token cookie automatiquement
async function tryRefresh(): Promise<boolean> {
  try {
    const res = await fetch(`${BASE_URL}/auth/refresh`, {
      method:      'POST',
      headers:     { 'Content-Type': 'application/json' },
      credentials: 'include',
    });
    return res.ok;
  } catch {
    return false;
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

export const api = {
  get:    <T>(path: string) => request<T>(path, { method: 'GET' }),
  post:   <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'POST', body: body !== undefined ? JSON.stringify(body) : undefined }),
  patch:  <T>(path: string, body: unknown) =>
    request<T>(path, { method: 'PATCH', body: JSON.stringify(body) }),
  put:    <T>(path: string, body: unknown) =>
    request<T>(path, { method: 'PUT', body: JSON.stringify(body) }),
  delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
};

export { ApiError };
