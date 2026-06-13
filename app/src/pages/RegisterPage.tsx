import { useState, ChangeEvent, FormEvent } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { useRegister } from "@/hooks/useAuth";
import { BASE_URL } from "@/lib/api";

function getStrength(pwd: string): { score: number; label: string; color: string } {
  if (!pwd) return { score: 0, label: "", color: "" };
  let score = 0;
  if (pwd.length >= 8)          score++;
  if (pwd.length >= 12)         score++;
  if (/[A-Z]/.test(pwd))        score++;
  if (/[0-9]/.test(pwd))        score++;
  if (/[^A-Za-z0-9]/.test(pwd)) score++;

  if (score <= 1) return { score: 1, label: "Très faible", color: "#DC2626" };
  if (score === 2) return { score: 2, label: "Faible",      color: "#D97706" };
  if (score === 3) return { score: 3, label: "Moyen",       color: "#F59E0B" };
  if (score === 4) return { score: 4, label: "Fort",        color: "#16A34A" };
  return               { score: 5, label: "Très fort",  color: "#15803D" };
}

const RULES = [
  { id: "len",    label: "8 caractères min.", test: (p: string) => p.length >= 8 },
  { id: "upper",  label: "Une majuscule",     test: (p: string) => /[A-Z]/.test(p) },
  { id: "num",    label: "Un chiffre",        test: (p: string) => /[0-9]/.test(p) },
  { id: "symbol", label: "Un symbole",        test: (p: string) => /[^A-Za-z0-9]/.test(p) },
];

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

function CheckIcon({ ok }: { ok: boolean }) {
  return ok ? (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  ) : (
    <div className="w-3 h-3 rounded-full border-2 border-border-strong" />
  );
}

export default function RegisterPage() {
  const [firstName, setFirstName] = useState("");
  const [lastName,  setLastName]  = useState("");
  const [email,     setEmail]     = useState("");
  const [phone,     setPhone]     = useState("");
  const [password,  setPassword]  = useState("");
  const [confirm,   setConfirm]   = useState("");
  const [showPwd,       setShowPwd]       = useState(false);
  const [showConfirm,   setShowConfirm]   = useState(false);

  const register   = useRegister();
  const strength   = getStrength(password);
  const match      = confirm.length > 0 && password === confirm;
  const mismatch   = confirm.length > 0 && password !== confirm;
  const allRulesOk = RULES.every((r) => r.test(password));
  const canSubmit  = allRulesOk && match && firstName && lastName && email;

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    register.mutate({ firstName, lastName, email, phone: phone || undefined, password });
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
          <p className="text-text-3 text-sm mt-2 font-medium">Créer votre compte</p>
          <div className="inline-flex items-center gap-2 bg-accent-soft text-accent text-xs font-semibold px-4 py-1.5 rounded-full mt-3 border border-accent/15 shadow-pill">
            🎁 +100 points offerts à l'inscription
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="card p-6 space-y-5">

            {/* Google */}
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
              <span className="text-[11px] text-text-3 font-semibold tracking-wide uppercase">ou avec votre email</span>
              <div className="flex-1 h-px bg-border" />
            </div>

            {/* Erreur API */}
            {register.isError && (
              <div className="text-xs text-red-600 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 rounded-lg px-3 py-2 font-medium">
                {(register.error as any)?.message ?? "Une erreur est survenue. Réessayez."}
              </div>
            )}

            {/* Prénom + Nom */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="label">Prénom</label>
                <input
                  type="text"
                  placeholder="Jean-Pierre"
                  value={firstName}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setFirstName(e.target.value)}
                  className="input-base px-3.5 py-2.5"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <label className="label">Nom</label>
                <input
                  type="text"
                  placeholder="Mukendi"
                  value={lastName}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setLastName(e.target.value)}
                  className="input-base px-3.5 py-2.5"
                  required
                />
              </div>
            </div>

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

            {/* Téléphone */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="label">Téléphone <span className="text-text-3 font-normal">(optionnel)</span></label>
                <span className="text-[11px] text-text-3 font-medium">Orange · Airtel</span>
              </div>
              <input
                type="tel"
                placeholder="+243 8XX XXX XXX"
                value={phone}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setPhone(e.target.value)}
                className="input-base px-3.5 py-2.5"
              />
            </div>

            {/* Mot de passe */}
            <div className="space-y-1.5">
              <label className="label">Mot de passe</label>
              <div className="relative">
                <input
                  type={showPwd ? "text" : "password"}
                  placeholder="Créez un mot de passe fort"
                  value={password}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
                  className="input-base px-3.5 py-2.5 pr-10"
                  required
                />
                <button type="button" onClick={() => setShowPwd(!showPwd)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-3 hover:text-text-2 transition-colors no-tap">
                  <EyeIcon open={showPwd} />
                </button>
              </div>

              {/* Indicateur de force */}
              {password.length > 0 && (
                <div className="space-y-2 pt-1 animate-fade-in">
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div key={i} className="h-1 flex-1 rounded-full transition-all duration-300"
                        style={{ background: i <= strength.score ? strength.color : "#E2E2EA" }} />
                    ))}
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold" style={{ color: strength.color }}>{strength.label}</p>
                    <p className="text-xs text-text-3 font-medium">{strength.score}/5</p>
                  </div>
                  <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 pt-0.5">
                    {RULES.map((rule) => (
                      <div key={rule.id} className="flex items-center gap-1.5">
                        <CheckIcon ok={rule.test(password)} />
                        <span className={`text-xs font-medium transition-colors ${rule.test(password) ? "text-success" : "text-text-3"}`}>
                          {rule.label}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Confirmer mot de passe */}
            <div className="space-y-1.5">
              <label className="label">Confirmer le mot de passe</label>
              <div className="relative">
                <input
                  type={showConfirm ? "text" : "password"}
                  placeholder="Répétez votre mot de passe"
                  value={confirm}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setConfirm(e.target.value)}
                  className={`input-base px-3.5 py-2.5 pr-10 ${
                    match    ? "border-success focus:border-success focus:shadow-[0_0_0_3px_rgb(22_163_74/0.14)]" :
                    mismatch ? "border-danger  focus:border-danger  focus:shadow-input-err" :
                               ""
                  }`}
                  required
                />
                <button type="button" onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-3 hover:text-text-2 transition-colors no-tap">
                  <EyeIcon open={showConfirm} />
                </button>
                {match && (
                  <div className="absolute right-10 top-1/2 -translate-y-1/2">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth="3" strokeLinecap="round">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                  </div>
                )}
              </div>
              {mismatch && (
                <p className="flex items-center gap-1.5 text-xs text-danger font-medium animate-fade-in">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>
                  </svg>
                  Les mots de passe ne correspondent pas
                </p>
              )}
              {match && (
                <p className="flex items-center gap-1.5 text-xs text-success font-medium animate-fade-in">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                  Parfait, les mots de passe correspondent
                </p>
              )}
            </div>

            {/* CTA */}
            <Button
              fullWidth
              size="lg"
              type="submit"
              variant={canSubmit ? "primary" : "secondary"}
              disabled={!canSubmit}
              loading={register.isPending}
            >
              {register.isPending
                ? "Création en cours..."
                : canSubmit
                  ? "Créer mon compte — +100 pts 🎁"
                  : "Complétez tous les champs"}
            </Button>

            {/* CGU */}
            <p className="text-[11px] text-text-3 text-center leading-relaxed">
              En créant un compte, vous acceptez nos{" "}
              <a href="/terms" className="text-text-2 underline underline-offset-2 hover:text-text font-medium">Conditions d'utilisation</a>
              {" "}et notre{" "}
              <a href="/privacy" className="text-text-2 underline underline-offset-2 hover:text-text font-medium">Politique de confidentialité</a>.
            </p>
          </div>
        </form>

        <p className="text-center text-sm text-text-3 mt-5 font-medium">
          Déjà un compte ?{" "}
          <Link to="/login" className="text-accent font-bold hover:underline underline-offset-2">
            Se connecter
          </Link>
        </p>
      </div>
    </div>
  );
}
