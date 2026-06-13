import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

// ── Icône spinner ──────────────────────────────────────────────────────────────

function SpinnerIcon() {
  return (
    <svg
      className="animate-spin text-accent"
      width="40"
      height="40"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
    >
      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
    </svg>
  );
}

// ── Page retour CinetPay ───────────────────────────────────────────────────────

export default function PaiementRetourPage() {
  const navigate        = useNavigate();
  const [seconds, setSeconds] = useState(3);

  useEffect(() => {
    const interval = setInterval(() => {
      setSeconds((s) => {
        if (s <= 1) {
          clearInterval(interval);
          navigate('/dashboard', { replace: true });
          return 0;
        }
        return s - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [navigate]);

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center p-6">
      <div className="w-full max-w-sm space-y-6 text-center">

        {/* Icône spinner */}
        <div className="flex justify-center">
          <SpinnerIcon />
        </div>

        {/* Titre */}
        <div className="space-y-2">
          <h1 className="text-lg font-black text-text">
            Paiement en cours de vérification…
          </h1>
          <p className="text-sm text-text-2 leading-relaxed">
            Le statut de votre abonnement sera mis à jour automatiquement
            une fois le paiement confirmé par CinetPay.
          </p>
        </div>

        {/* Note */}
        <div className="card p-4 bg-surface-2 text-left space-y-1">
          <p className="text-xs font-semibold text-text-2">Que se passe-t-il ?</p>
          <ul className="space-y-1">
            {[
              'CinetPay traite votre paiement Mobile Money',
              'Votre abonnement est activé automatiquement',
              'Un récapitulatif apparaîtra dans votre historique',
            ].map((item) => (
              <li key={item} className="flex items-start gap-2 text-xs text-text-3">
                <span className="mt-0.5 shrink-0 text-accent">•</span>
                {item}
              </li>
            ))}
          </ul>
        </div>

        {/* Compte à rebours */}
        <p className="text-xs text-text-3">
          Redirection vers le tableau de bord dans{' '}
          <span className="font-bold text-text">{seconds}</span>{' '}
          seconde{seconds !== 1 ? 's' : ''}…
        </p>

        {/* Bouton manuel */}
        <button
          onClick={() => navigate('/dashboard', { replace: true })}
          className="text-xs font-semibold text-accent underline underline-offset-2 hover:opacity-80 transition-opacity"
        >
          Aller au tableau de bord maintenant
        </button>
      </div>
    </div>
  );
}
