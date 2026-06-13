import { useRef, useState, KeyboardEvent, ChangeEvent } from "react";

export default function VerifyOtpPage() {
  const [otp, setOtp] = useState<string[]>(["", "", "", "", "", ""]);
  const inputs = useRef<(HTMLInputElement | null)[]>([]);

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

  const filled = otp.every((d) => d !== "");

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center px-4">
      <div className="w-full max-w-sm animate-slide-up">

        {/* Header */}
        <div className="text-center mb-8">
          <a href="/" className="text-2xl font-bold text-text tracking-tight">
            Elen<span className="text-accent">gi</span>
          </a>
          <div className="w-12 h-12 bg-accent-soft rounded-2xl flex items-center justify-center mx-auto mt-6 mb-4">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#E85D26" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.65 3.4 2 2 0 0 1 3.62 1.22h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.69 2.81a2 2 0 0 1-.45 2.11L7.91 8.96a16 16 0 0 0 6.13 6.13l1.27-1.27a2 2 0 0 1 2.11-.45c.91.33 1.85.56 2.81.69a2 2 0 0 1 1.77 2.01Z"/>
            </svg>
          </div>
          <h2 className="text-xl font-bold text-text">Vérification par email</h2>
          <p className="text-text-3 text-sm mt-1">
            Code envoyé à <strong className="text-text-2">jean@example.cd</strong>
          </p>
        </div>

        <div className="card p-6">

          {/* Champs OTP */}
          <div className="flex gap-2 justify-center mb-6">
            {otp.map((digit, i) => (
              <input
                key={i}
                ref={(el) => { inputs.current[i] = el; }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(i, e)}
                onKeyDown={(e) => handleKeyDown(i, e)}
                className={`w-12 h-14 text-center text-xl font-bold border rounded-lg bg-bg transition-all focus:outline-none focus:shadow-input
                  ${digit ? "border-text text-text" : "border-border text-text-3"}
                  focus:border-text`}
              />
            ))}
          </div>

          {/* Countdown */}
          <div className="flex items-center justify-center gap-1.5 mb-5">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#A1A1AA" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>
            </svg>
            <span className="text-xs text-text-3">
              Le code expire dans <strong className="text-text-2">09:45</strong>
            </span>
          </div>

          <button
            disabled={!filled}
            className={`w-full py-3 text-sm font-semibold rounded-lg transition-colors
              ${filled
                ? "bg-text text-white hover:bg-dark"
                : "bg-surface-2 text-text-3 cursor-not-allowed"}`}
          >
            Vérifier le code
          </button>

          {/* Tentatives restantes */}
          <div className="mt-4 p-2.5 bg-warning-soft rounded-lg">
            <p className="text-xs text-center text-warning font-medium">
              ⚠️ 3 tentatives maximum — il vous reste <strong>3 essais</strong>
            </p>
          </div>
        </div>

        {/* Renvoyer le code */}
        <p className="text-center text-sm text-text-3 mt-4">
          Pas reçu le code ?{" "}
          <button className="text-accent font-medium hover:underline">
            Renvoyer
          </button>
        </p>

        <p className="text-center text-sm text-text-3 mt-2">
          <a href="/forgot-password" className="text-text-3 hover:underline">
            ← Changer d'email
          </a>
        </p>

      </div>
    </div>
  );
}
