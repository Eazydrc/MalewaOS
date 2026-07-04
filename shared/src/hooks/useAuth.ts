import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client';
import { AuthUser } from '../types';

export function useMe() {
  return useQuery<AuthUser>({
    queryKey: ['me'],
    queryFn: () => api.get<AuthUser>('/auth/me'),
    retry: false,
    staleTime: 5 * 60 * 1000,
  });
}

export function useLogin(opts?: {
  onMfaRequired?: (mfaToken: string) => void;
  onSuccess?: (user: AuthUser) => void;
}) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { email: string; password: string }) =>
      api.post<{ mfaRequired?: true; mfaToken?: string } | { message: string }>('/auth/login', data),
    onSuccess: async (res) => {
      if ('mfaRequired' in res && res.mfaRequired && res.mfaToken) {
        opts?.onMfaRequired?.(res.mfaToken);
        return;
      }
      const user = await api.get<AuthUser>('/auth/me');
      qc.setQueryData(['me'], user);
      opts?.onSuccess?.(user);
    },
  });
}

export function useRegister(opts?: { onSuccess?: (email: string) => void }) {
  return useMutation({
    mutationFn: (data: { firstName: string; lastName: string; email: string; phone?: string; password: string }) =>
      api.post<{ message: string; email: string }>('/auth/register', data),
    onSuccess: (res) => opts?.onSuccess?.(res.email),
  });
}

export function useLogout(opts?: { onSuccess?: () => void }) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.post('/auth/logout'),
    onSuccess: () => {
      qc.clear();
      opts?.onSuccess?.();
    },
  });
}

export function useForgotPassword() {
  return useMutation({
    mutationFn: (email: string) => api.post('/auth/forgot-password', { email }),
  });
}

export function useResetPassword(opts?: { onSuccess?: () => void }) {
  return useMutation({
    mutationFn: (data: { email: string; code: string; newPassword: string }) =>
      api.post('/auth/reset-password', data),
    onSuccess: () => opts?.onSuccess?.(),
  });
}

export function useVerifyEmail(opts?: { onSuccess?: () => void }) {
  return useMutation({
    mutationFn: (data: { email: string; code: string }) =>
      api.post('/auth/verify-email', data),
    onSuccess: () => opts?.onSuccess?.(),
  });
}
