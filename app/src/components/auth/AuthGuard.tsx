import { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/auth.store';

// Routes accessibles aux STAFF (pas de redirection automatique vers /staff)
const STAFF_ALLOWED_PATHS = ['/staff'];

interface Props {
  children: React.ReactNode;
}

function Spinner() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <div className="w-8 h-8 rounded-full border-2 border-orange-500 border-t-transparent animate-spin" />
    </div>
  );
}

// ── Routes protégées ─────────────────────────────────────────────────────────
// Vérifie la session via cookie HttpOnly (appel à /auth/me).
// La vérification n'est faite qu'une fois au démarrage (hasChecked).

export function AuthGuard({ children }: Props) {
  const { isAuthenticated, hasChecked, isLoading, fetchMe, user } = useAuthStore();
  const location = useLocation();

  useEffect(() => {
    if (!hasChecked) fetchMe();
  }, [hasChecked, fetchMe]);

  // Vérification initiale en cours → spinner
  if (!hasChecked || isLoading) return <Spinner />;

  // Pas authentifié → login (avec mémorisation de la destination)
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // STAFF → redirige vers /staff si pas déjà sur une route autorisée
  if (user?.role === 'STAFF' && !STAFF_ALLOWED_PATHS.some(p => location.pathname.startsWith(p))) {
    return <Navigate to="/staff" replace />;
  }

  return <>{children}</>;
}

// ── Routes publiques (login, register…) ──────────────────────────────────────
// Si l'utilisateur est déjà connecté, redirige vers /home.

export function GuestGuard({ children }: Props) {
  const { isAuthenticated, hasChecked, isLoading, fetchMe, user } = useAuthStore();

  useEffect(() => {
    if (!hasChecked) fetchMe();
  }, [hasChecked, fetchMe]);

  if (!hasChecked || isLoading) return <Spinner />;

  if (isAuthenticated) {
    return <Navigate to={user?.role === 'STAFF' ? '/staff' : '/home'} replace />;
  }

  return <>{children}</>;
}
