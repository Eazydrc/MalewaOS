import { useRef, useState, KeyboardEvent, ChangeEvent, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { api } from "@/lib/api";
import { useAuthStore } from "@/store/auth.store";

export default function VerifyEmailPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const email = params.get("email") ?? "";

  const { fetchMe } = useAuthStore();

  const [otp,      setOtp]      = useState<string[]>(["", "", "", "", "", ""]);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState("");
  const [resent,   setResent]   = useState(false);
  const [countdown, setCountdown] = useState(60);

  const inputs = useRef<(HTMLInputElement | null)[]>([]);

  // Countdown pour "Renvoyer"
  useEffect(() => {
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  if (!email) {
    navigate("/register", { replace: true });
    return null;
  }

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
      await api.post("/auth/verify-email", { email, code });
      await fetchMe();
      navigate("/home", { replace: true });
    } catch (err: any) {
      setError(err.message ?? "Code incorrect");
      setOtp(["", "", "", "", "", ""]);
      inputs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    if (countdown > 0) return;
    try {
      await api.post("/auth/resend-verification", { email });
      setResent(true);
      setCountdown(60);
      setTimeout(() => setResent(false), 3000);
    } catch { /* silencieux */ }
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
              <rect width="20" height="16" x="2" y="4" rx="2"/>
              <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
            </svg>
          </div>

          <h2 className="text-xl font-bold text-zinc-900 dark:text-white">Vérifiez votre email</h2>
          <p className="text-zinc-500 text-sm mt-1.5">
            Code envoyé à <strong className="text-zinc-700 dark:text-zinc-300">{email}</strong>
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

          {/* Countdown */}
          <p className="text-center text-xs text-zinc-400 mb-5">
            ⏱ Le code expire dans <strong className="text-zinc-600 dark:text-zinc-300">10 min</strong>
          </p>

          {/* Erreur */}
          {error && (
            <div className="mb-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl px-4 py-2.5">
              <p className="text-xs font-semibold text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          {/* Succès renvoi */}
          {resent && (
            <div className="mb-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl px-4 py-2.5">
              <p className="text-xs font-semibold text-green-600 dark:text-green-400">✅ Nouveau code envoyé !</p>
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
            ) : "Activer mon compte"}
          </button>
        </div>

        {/* Renvoyer */}
        <p className="text-center text-sm text-zinc-500 mt-5">
          Pas reçu le code ?{" "}
          {countdown > 0 ? (
            <span className="text-zinc-400">Renvoyer dans {countdown}s</span>
          ) : (
            <button onClick={handleResend} className="text-orange-500 font-semibold hover:underline">
              Renvoyer
            </button>
          )}
        </p>

        <p className="text-center text-sm text-zinc-400 mt-2">
          <a href="/register" className="hover:underline">← Changer d'adresse email</a>
        </p>
      </div>
    </div>
  );
}
