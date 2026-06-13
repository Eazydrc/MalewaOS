import { useState, ChangeEvent, FormEvent } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { useLogin } from "@/hooks/useAuth";
import { BASE_URL } from "@/lib/api";

function EyeIcon({ open }: { open: boolean }) {
  return open ? (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
      <line x1="1" y1="1" x2="23" y2="23"/>
    </svg>
  ) : (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>
  );
}

export default function LoginPage() {
  const [showPwd, setShowPwd]   = useState(false);
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const login = useLogin();

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    login.mutate({ email, password });
  }

  return (
    <div className="min-h-screen bg-surface-gradient flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm animate-slide-up">

        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-block">
            <span className="text-3xl font-black tracking-tighter text-text">
              Elen<span className="text-gradient-accent">gi</span>
            </span>
          </Link>
          <p className="text-text-3 text-sm mt-2 font-medium">Bon retour parmi nous</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="card p-6 space-y-5">

            {/* Google OAuth */}
            <a
              href={`${BASE_URL}/auth/google`}
              className="w-full flex items-center justify-center gap-3 h-11 bg-bg border border-border rounded-xl text-sm font-semibold text-text hover:border-border-strong hover:bg-surface active:scale-[0.98] transition-all duration-150 shadow-[0_1px_2px_rgb(0_0_0/0.06),inset_0_1px_0_rgb(255_255_255/0.8)] no-tap"
            >
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path d="M17.64 9.205c0-.639-.057-1.252-.164-1.841H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615Z" fill="#4285F4"/>
                <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z" fill="#34A853"/>
                <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332Z" fill="#FBBC05"/>
                <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58Z" fill="#EA4335"/>
              </svg>
              Continuer avec Google
            </a>

            {/* Divider */}
            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-border" />
              <span className="text-[11px] text-text-3 font-semibold tracking-wide uppercase">ou</span>
              <div className="flex-1 h-px bg-border" />
            </div>

            {/* Erreur API */}
            {login.isError && (
              <p className="text-xs text-red-500 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 rounded-lg px-3 py-2 font-medium">
                {(login.error as any)?.message ?? 'Identifiants incorrects'}
              </p>
            )}

            {/* Email */}
            <div className="space-y-1.5">
              <label className="label">Email</label>
              <input
                type="email"
                placeholder="jean@example.cd"
                value={email}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                className="input-base px-3.5 py-2.5"
                required
              />
            </div>

            {/* Mot de passe */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="label">Mot de passe</label>
                <Link to="/forgot-password" className="text-[11px] text-accent font-semibold hover:underline underline-offset-2">
                  Mot de passe oublié ?
                </Link>
              </div>
              <div className="relative">
                <input
                  type={showPwd ? "text" : "password"}
                  placeholder="Votre mot de passe"
                  value={password}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
                  className="input-base px-3.5 py-2.5 pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPwd(!showPwd)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-3 hover:text-text-2 transition-colors no-tap"
                >
                  <EyeIcon open={showPwd} />
                </button>
              </div>
            </div>

            <Button
              fullWidth
              size="lg"
              type="submit"
              disabled={!email || !password}
              loading={login.isPending}
            >
              Se connecter
            </Button>
          </div>
        </form>

        <p className="text-center text-sm text-text-3 mt-5 font-medium">
          Pas encore de compte ?{" "}
          <Link to="/register" className="text-accent font-bold hover:underline underline-offset-2">
            S'inscrire gratuitement
          </Link>
        </p>

        <p className="text-center text-xs text-text-3 mt-2">
          Vous êtes livreur ?{" "}
          <Link to="/register-driver" className="text-text-2 font-semibold hover:underline underline-offset-2">
            🛵 Espace livreur
          </Link>
        </p>
      </div>
    </div>
  );
}
