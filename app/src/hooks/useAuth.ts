import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { useAuthStore } from '../store/auth.store';

interface RegisterData {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  password: string;
}

interface LoginData {
  email: string;
  password: string;
}

// ── Inscription ───────────────────────────────────────────────────────────────
// Le backend crée le compte (inactif), on redirige vers la page de vérification email.

export function useRegister() {
  const navigate = useNavigate();

  return useMutation({
    mutationFn: (data: RegisterData) =>
      api.post<{ message: string; email: string }>('/auth/register', data),
    onSuccess: (res) => {
      navigate(`/verify-email?email=${encodeURIComponent(res.email)}`);
    },
  });
}

// ── Connexion ─────────────────────────────────────────────────────────────────
// CLIENT/RESTAURANT → cookies posés, on fetchMe puis on redirige selon le rôle.
// ADMIN/SUPER_ADMIN  → pas de cookies, le backend retourne { mfaRequired, mfaToken }.

export function useLogin() {
  const { fetchMe } = useAuthStore();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: (data: LoginData) =>
      api.post<
        { mfaRequired: true; mfaToken: string } |
        { message: string }
      >('/auth/login', data),
    onSuccess: async (res) => {
      if ('mfaRequired' in res && res.mfaRequired) {
        navigate(`/auth/mfa?token=${encodeURIComponent(res.mfaToken)}`);
        return;
      }
      // Cookies posés côté serveur — on hydrate le store puis on redirige selon le rôle
      await fetchMe();
      const { user } = useAuthStore.getState();
      if (user?.role === 'RESTAURANT') {
        navigate('/dashboard');
      } else if (user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN') {
        navigate('/admin');
      } else {
        navigate('/home');
      }
    },
  });
}

// ── Mot de passe oublié ───────────────────────────────────────────────────────

export function useForgotPassword() {
  return useMutation({
    mutationFn: (email: string) =>
      api.post<{ message: string }>('/auth/forgot-password', { email }),
  });
}

// ── Vérification OTP ──────────────────────────────────────────────────────────

export function useVerifyOtp() {
  return useMutation({
    mutationFn: (data: { email: string; code: string; purpose: string }) =>
      api.post<{ verified: boolean }>('/auth/verify-otp', data),
  });
}

// ── Réinitialisation de mot de passe ─────────────────────────────────────────

export function useResetPassword() {
  const navigate = useNavigate();
  return useMutation({
    mutationFn: (data: { email: string; code: string; newPassword: string }) =>
      api.post<{ message: string }>('/auth/reset-password', data),
    onSuccess: () => navigate('/login'),
  });
}

// ── Déconnexion ───────────────────────────────────────────────────────────────

export function useLogout() {
  const { logout } = useAuthStore();
  const navigate = useNavigate();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: () => logout(),
    onSuccess: () => {
      qc.clear();
      navigate('/login');
    },
  });
}
