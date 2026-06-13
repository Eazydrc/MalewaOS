import { useState, FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '@/lib/api';

// ── Helpers ───────────────────────────────────────────────────────────────────

function getStrength(pwd: string) {
  if (!pwd) return { score: 0, label: '', color: '' };
  let score = 0;
  if (pwd.length >= 8)          score++;
  if (pwd.length >= 12)         score++;
  if (/[A-Z]/.test(pwd))        score++;
  if (/[0-9]/.test(pwd))        score++;
  if (/[^A-Za-z0-9]/.test(pwd)) score++;
  if (score <= 1) return { score: 1, label: 'Très faible', color: '#DC2626' };
  if (score === 2) return { score: 2, label: 'Faible',      color: '#D97706' };
  if (score === 3) return { score: 3, label: 'Moyen',       color: '#F59E0B' };
  if (score === 4) return { score: 4, label: 'Fort',        color: '#16A34A' };
  return               { score: 5, label: 'Très fort',  color: '#15803D' };
}

const RULES = [
  { id: 'len',    label: '8 caractères min.', test: (p: string) => p.length >= 8 },
  { id: 'upper',  label: 'Une majuscule',     test: (p: string) => /[A-Z]/.test(p) },
  { id: 'num',    label: 'Un chiffre',        test: (p: string) => /[0-9]/.test(p) },
  { id: 'symbol', label: 'Un symbole',        test: (p: string) => /[^A-Za-z0-9]/.test(p) },
];

function EyeIcon({ open }: { open: boolean }) {
  return open ? (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
      <line x1="1" y1="1" x2="23" y2="23"/>
    </svg>
  ) : (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function RegisterDriverPage() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    firstName: '',
    lastName:  '',
    email:     '',
    phone:     '',
    password:  '',
  });
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');
  const [success, setSuccess] = useState(false);

  const strength = getStrength(form.password);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await api.post('/auth/register-driver', {
        firstName: form.firstName.trim(),
        lastName:  form.lastName.trim(),
        email:     form.email.trim().toLowerCase(),
        phone:     form.phone.trim() || undefined,
        password:  form.password,
      });
      setSuccess(true);
    } catch (err: any) {
      setError(err?.message ?? 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center px-4">
        <div className="w-full max-w-sm space-y-6 text-center">
          <div className="text-6xl">📩</div>
          <div>
            <h1 className="text-xl font-black text-text">Vérifiez votre email</h1>
            <p className="text-sm text-text-2 mt-2">
              Un code de vérification a été envoyé à <strong>{form.email}</strong>.
              Activez votre compte, puis connectez-vous.
            </p>
          </div>
          <button
            onClick={() => navigate('/verify-email')}
            className="w-full py-3 rounded-2xl bg-accent text-white font-bold text-sm"
          >
            Vérifier mon email
          </button>
          <Link to="/login" className="block text-xs text-text-3 hover:text-accent">
            Retour à la connexion
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-sm space-y-6">

        {/* Header */}
        <div className="text-center space-y-2">
          <div className="text-5xl">🛵</div>
          <h1 className="text-2xl font-black text-text">Devenir livreur</h1>
          <p className="text-sm text-text-2">Rejoignez la flotte Elengi</p>
        </div>

        {/* Avantages */}
        <div className="rounded-2xl bg-accent/5 border border-accent/20 p-4 space-y-2">
          {[
            '📍 Carte live — le client voit votre position',
            '📞 Contact direct avec le client',
            '📦 Commandes assignées en temps réel',
            '✅ Confirmation livraison en 1 tap',
          ].map(txt => (
            <div key={txt} className="text-xs text-text-2">{txt}</div>
          ))}
        </div>

        {/* Formulaire */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-text-2">Prénom *</label>
              <input
                value={form.firstName}
                onChange={set('firstName')}
                required
                autoComplete="given-name"
                className="w-full px-3 py-2.5 rounded-xl border border-border bg-surface-2 text-sm text-text focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent/50"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-text-2">Nom *</label>
              <input
                value={form.lastName}
                onChange={set('lastName')}
                required
                autoComplete="family-name"
                className="w-full px-3 py-2.5 rounded-xl border border-border bg-surface-2 text-sm text-text focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent/50"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-text-2">Email *</label>
            <input
              type="email"
              value={form.email}
              onChange={set('email')}
              required
              autoComplete="email"
              className="w-full px-3 py-2.5 rounded-xl border border-border bg-surface-2 text-sm text-text focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent/50"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-text-2">Téléphone (recommandé)</label>
            <input
              type="tel"
              value={form.phone}
              onChange={set('phone')}
              placeholder="+243…"
              autoComplete="tel"
              className="w-full px-3 py-2.5 rounded-xl border border-border bg-surface-2 text-sm text-text focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent/50"
            />
            <p className="text-[10px] text-text-3">Le restaurant et le client pourront vous appeler</p>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-text-2">Mot de passe *</label>
            <div className="relative">
              <input
                type={showPwd ? 'text' : 'password'}
                value={form.password}
                onChange={set('password')}
                required
                autoComplete="new-password"
                className="w-full px-3 py-2.5 pr-10 rounded-xl border border-border bg-surface-2 text-sm text-text focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent/50"
              />
              <button
                type="button"
                onClick={() => setShowPwd(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-text-3"
              >
                <EyeIcon open={showPwd} />
              </button>
            </div>

            {/* Barre de force */}
            {form.password && (
              <div className="space-y-1.5">
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map(i => (
                    <div
                      key={i}
                      className="h-1 flex-1 rounded-full transition-colors"
                      style={{ backgroundColor: i <= strength.score ? strength.color : 'var(--color-border)' }}
                    />
                  ))}
                </div>
                <p className="text-[10px] font-semibold" style={{ color: strength.color }}>
                  {strength.label}
                </p>
                <div className="flex flex-wrap gap-x-3 gap-y-0.5">
                  {RULES.map(r => (
                    <span key={r.id} className={`text-[10px] ${r.test(form.password) ? 'text-green-500' : 'text-text-3'}`}>
                      {r.test(form.password) ? '✓' : '○'} {r.label}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {error && (
            <div className="rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 px-3 py-2 text-xs text-red-600 dark:text-red-400">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || strength.score < 3}
            className="w-full py-3.5 rounded-2xl bg-accent text-white font-bold text-sm disabled:opacity-50 transition-opacity active:scale-[0.98]"
          >
            {loading ? 'Création du compte…' : "S'inscrire comme livreur"}
          </button>
        </form>

        {/* Liens */}
        <div className="text-center space-y-2">
          <p className="text-xs text-text-3">
            Déjà inscrit ?{' '}
            <Link to="/login" className="text-accent font-semibold hover:underline">
              Se connecter
            </Link>
          </p>
          <p className="text-xs text-text-3">
            Vous êtes client ?{' '}
            <Link to="/register" className="text-accent font-semibold hover:underline">
              Inscription standard
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
