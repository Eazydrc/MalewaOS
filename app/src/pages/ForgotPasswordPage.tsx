export default function ForgotPasswordPage() {
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
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
          </div>
          <h2 className="text-xl font-bold text-text">Récupérer mon compte</h2>
          <p className="text-text-3 text-sm mt-1">
            Entrez votre email pour recevoir un code de vérification
          </p>
        </div>

        <div className="card p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-2 mb-1.5">
              Adresse email
            </label>
            <input
              type="email"
              placeholder="jean@example.cd"
              className="w-full px-4 py-3 bg-bg border border-border rounded-lg text-sm text-text placeholder:text-text-3 focus:outline-none focus:border-text focus:shadow-input transition-all"
            />
            <p className="text-xs text-text-3 mt-1.5">
              Un code à 6 chiffres vous sera envoyé à cette adresse.
            </p>
          </div>

          <button className="w-full py-3 bg-text text-white text-sm font-semibold rounded-lg hover:bg-dark transition-colors">
            Envoyer le code
          </button>
        </div>

        {/* Sécurité info */}
        <div className="mt-4 p-3 bg-surface-2 rounded-lg border border-border">
          <p className="text-xs text-text-3 text-center leading-relaxed">
            🔒 Le code expire après <strong className="text-text-2">10 minutes</strong> et ne peut être utilisé qu'<strong className="text-text-2">une seule fois</strong>. Maximum 3 tentatives.
          </p>
        </div>

        <p className="text-center text-sm text-text-3 mt-4">
          <a href="/login" className="text-accent font-medium hover:underline">
            ← Retour à la connexion
          </a>
        </p>

      </div>
    </div>
  );
}
