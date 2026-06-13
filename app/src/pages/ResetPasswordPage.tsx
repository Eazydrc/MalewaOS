import { useState } from "react";

export default function ResetPasswordPage() {
  const [show, setShow] = useState({ pwd: false, confirm: false });

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center px-4">
      <div className="w-full max-w-sm animate-slide-up">

        {/* Header */}
        <div className="text-center mb-8">
          <a href="/" className="text-2xl font-bold text-text tracking-tight">
            Elen<span className="text-accent">gi</span>
          </a>
          <div className="w-12 h-12 bg-success-soft rounded-2xl flex items-center justify-center mx-auto mt-6 mb-4">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>
          </div>
          <h2 className="text-xl font-bold text-text">Nouveau mot de passe</h2>
          <p className="text-text-3 text-sm mt-1">
            Choisissez un mot de passe sécurisé
          </p>
        </div>

        <div className="card p-6 space-y-4">

          {/* Nouveau mot de passe */}
          <div>
            <label className="block text-sm font-medium text-text-2 mb-1.5">
              Nouveau mot de passe
            </label>
            <div className="relative">
              <input
                type={show.pwd ? "text" : "password"}
                placeholder="Minimum 8 caractères"
                className="w-full px-4 py-3 pr-12 bg-bg border border-border rounded-lg text-sm text-text placeholder:text-text-3 focus:outline-none focus:border-text focus:shadow-input transition-all"
              />
              <button
                type="button"
                onClick={() => setShow((s) => ({ ...s, pwd: !s.pwd }))}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-text-3 hover:text-text-2"
              >
                {show.pwd ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                )}
              </button>
            </div>

            {/* Indicateur de force */}
            <div className="mt-2 space-y-1">
              <div className="flex gap-1">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className={`h-1 flex-1 rounded-full ${i <= 1 ? "bg-danger" : "bg-border"}`} />
                ))}
              </div>
              <p className="text-xs text-text-3">Ajoutez des chiffres et symboles pour renforcer</p>
            </div>
          </div>

          {/* Confirmer mot de passe */}
          <div>
            <label className="block text-sm font-medium text-text-2 mb-1.5">
              Confirmer le mot de passe
            </label>
            <div className="relative">
              <input
                type={show.confirm ? "text" : "password"}
                placeholder="Répétez le mot de passe"
                className="w-full px-4 py-3 pr-12 bg-bg border border-border rounded-lg text-sm text-text placeholder:text-text-3 focus:outline-none focus:border-text focus:shadow-input transition-all"
              />
              <button
                type="button"
                onClick={() => setShow((s) => ({ ...s, confirm: !s.confirm }))}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-text-3 hover:text-text-2"
              >
                {show.confirm ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                )}
              </button>
            </div>
          </div>

          {/* Règles de sécurité */}
          <div className="p-3 bg-surface-2 rounded-lg space-y-1.5">
            {[
              "Minimum 8 caractères",
              "Au moins une majuscule",
              "Au moins un chiffre",
            ].map((rule) => (
              <div key={rule} className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full border border-border flex items-center justify-center flex-shrink-0">
                  <div className="w-1.5 h-1.5 rounded-full bg-border" />
                </div>
                <span className="text-xs text-text-3">{rule}</span>
              </div>
            ))}
          </div>

          <button className="w-full py-3 bg-text text-white text-sm font-semibold rounded-lg hover:bg-dark transition-colors">
            Réinitialiser le mot de passe
          </button>
        </div>

        {/* Note sécurité */}
        <div className="mt-4 p-3 bg-surface-2 rounded-lg border border-border">
          <p className="text-xs text-text-3 text-center leading-relaxed">
            🔒 Toutes vos sessions actives seront <strong className="text-text-2">déconnectées</strong> après la réinitialisation.
          </p>
        </div>

      </div>
    </div>
  );
}
