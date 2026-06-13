import { useRef, useState, KeyboardEvent, ChangeEvent, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { api } from "@/lib/api";
import { useAuthStore } from "@/store/auth.store";

export default function MfaPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const mfaToken = params.get("token") ?? "";

  const { fetchMe } = useAuthStore();

  const [otp,     setOtp]     = useState<string[]>(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");

  const inputs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (!mfaToken) navigate("/login", { replace: true });
  }, [mfaToken, navigate]);

  if (!mfaToken) return null;

  function handleChange(index: number, e: ChangeEvent<HTMLInputElement>) {
    const val = e.target.value.replace(/\D/g, "").slice(-1);
    const next = [...otp];
    next[index] = val;
    setOtp(next);
    if (val && index < 5) inputs.current[index + 1]?.focus();
  }

  function handleKeyDown(index: number, e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputs.current[index - 1]?.focus();
    }
  }

  async function handleSubmit() {
    const code = otp.join("");
    if (code.length !== 6) return;
    setLoading(true);
    setError("");
    try {
      await api.post("/auth/mfa/verify", { mfaToken, code });
      await fetchMe();
      navigate("/admin", { replace: true });
    } catch (err: any) {
      setError(err.message ?? "Code incorrect");
      setOtp(["", "", "", "", "", ""]);
      inputs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  }

  const filled = otp.every(d => d !== "");

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">

        {/* Logo */}
        <div className="text-center mb-8">
          <a href="/" className="text-2xl font-black tracking-tighter text-zinc-900 dark:text-white">
            Elen<span className="text-orange-500">gi</span>
          </a>

          <div className="w-14 h-14 bg-orange-100 dark:bg-orange-900/30 rounded-2xl flex items-center justify-center mx-auto mt-6 mb-4">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#f97316" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect width="18" height="11" x="3" y="11" rx="2" ry="2"/>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
          </div>

          <h2 className="text-xl font-bold text-zinc-900 dark:text-white">Vérification à deux facteurs</h2>
          <p className="text-zinc-500 text-sm mt-1.5">
            Un code de sécurité a été envoyé à votre adresse email administrateur.
          </p>
        </div>

        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm">

          {/* OTP inputs */}
          <div className="flex gap-2 justify-center mb-5">
            {otp.map((digit, i) => (
              <input
                key={i}
                ref={el => { inputs.current[i] = el; }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={e => handleChange(i, e)}
                onKeyDown={e => handleKeyDown(i, e)}
                className={`w-12 h-14 text-center text-xl font-bold rounded-xl border-2 bg-zinc-50 dark:bg-zinc-800 transition-all outline-none
                  ${digit
                    ? "border-orange-500 text-zinc-900 dark:text-white"
                    : "border-zinc-200 dark:border-zinc-700 text-zinc-400"}
                  focus:border-orange-500`}
              />
            ))}
          </div>

          {/* Expiry notice */}
          <p className="text-center text-xs text-zinc-400 mb-5">
            ⏱ Ce code expire dans <strong className="text-zinc-600 dark:text-zinc-300">5 min</strong>
          </p>

          {/* Erreur */}
          {error && (
            <div className="mb-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl px-4 py-2.5">
              <p className="text-xs font-semibold text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          {/* Bouton vérifier */}
          <button
            onClick={handleSubmit}
            disabled={!filled || loading}
            className={`w-full py-3 rounded-xl text-sm font-bold transition-all ${
              filled && !loading
                ? "bg-orange-500 text-white hover:bg-orange-600 active:scale-95"
                : "bg-zinc-100 dark:bg-zinc-800 text-zinc-400 cursor-not-allowed"
            }`}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                Vérification…
              </span>
            ) : "Confirmer l'accès"}
          </button>
        </div>

        <p className="text-center text-sm text-zinc-400 mt-5">
          <a href="/login" className="hover:underline">← Retour à la connexion</a>
        </p>
      </div>
    </div>
  );
}
