import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "@/store/auth.store";
import { api } from "@/lib/api";

/**
 * Page de callback après authentification Google.
 * Le backend redirige ici avec ?code=XXXXXXXXX (code éphémère, TTL 60s).
 * On échange ce code contre des cookies HttpOnly via POST /auth/google/exchange.
 * Les tokens ne transitent jamais en clair dans l'URL ni en localStorage.
 */
export default function AuthCallbackPage() {
  const navigate = useNavigate();
  const { fetchMe, logout } = useAuthStore();
  const done = useRef(false);

  useEffect(() => {
    if (done.current) return;
    done.current = true;

    const params = new URLSearchParams(window.location.search);
    const code   = params.get("code");
    const error  = params.get("error");

    if (error || !code) {
      navigate("/login?error=google_failed", { replace: true });
      return;
    }

    // Le backend pose les cookies HttpOnly et retourne { message: '...' }
    api.post("/auth/google/exchange", { code })
      .then(() => fetchMe())
      .then(() => navigate("/home", { replace: true }))
      .catch(() => {
        logout().finally(() => {
          navigate("/login?error=google_failed", { replace: true });
        });
      });
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-zinc-50 dark:bg-zinc-950">
      <div className="w-10 h-10 rounded-full border-[3px] border-orange-500 border-t-transparent animate-spin" />
      <p className="text-sm font-semibold text-zinc-500">Connexion via Google…</p>
    </div>
  );
}
