import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

// ── Types ─────────────────────────────────────────────────────────────────────

interface DailySpecialStatusProps {
  used: number;
  quota: number | null;
  isUnlimited: boolean;
  resetsAt?: string;
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useDailySpecialStatus() {
  return useQuery({
    queryKey: ['daily-special-status'],
    queryFn: () => api.get('/menu/daily-special/status'),
    staleTime: 60 * 1000,
  });
}

// ── Composant ─────────────────────────────────────────────────────────────────

export function DailySpecialCountdown({ used, quota, isUnlimited, resetsAt }: DailySpecialStatusProps) {
  // Si illimité
  if (isUnlimited) {
    return (
      <div className="card p-4 space-y-1">
        <div className="flex items-center justify-between">
          <p className="text-sm font-bold text-text">Plats du jour</p>
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
            Illimité ∞
          </span>
        </div>
        <p className="text-xs text-text-3">Mettez autant de plats du jour que vous souhaitez</p>
      </div>
    );
  }

  if (quota === null) return null;

  const remaining  = quota - used;
  const pct        = quota > 0 ? (remaining / quota) * 100 : 0;
  const isExceeded = used >= quota;

  // Couleur de la barre selon le % restant
  const barColor =
    pct > 50  ? 'bg-green-500' :
    pct > 20  ? 'bg-orange-400' :
                'bg-red-500';

  return (
    <div className="card p-4 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-bold text-text">Plats du jour</p>
        {isExceeded && (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400">
            ⚠️ Quota atteint
          </span>
        )}
      </div>

      {/* Barre de progression */}
      <div className="space-y-1.5">
        <div className="w-full h-2.5 bg-surface-2 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${barColor}`}
            style={{ width: `${Math.min(100, (used / quota) * 100)}%` }}
          />
        </div>
        <div className="flex items-center justify-between text-xs text-text-3">
          <span>{used} utilisé{used !== 1 ? 's' : ''} sur {quota} ce mois</span>
          <span className={`font-semibold ${isExceeded ? 'text-red-500' : 'text-text-2'}`}>
            {Math.max(0, remaining)} restant{remaining > 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {resetsAt && (
        <p className="text-[10px] text-text-3">
          Recharge le {new Date(resetsAt).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })}
        </p>
      )}
    </div>
  );
}

// ── Wrapper avec data ─────────────────────────────────────────────────────────

export function DailySpecialCountdownWidget() {
  const { data, isLoading } = useDailySpecialStatus();

  if (isLoading) {
    return <div className="card h-20 animate-pulse bg-surface-2" />;
  }

  if (!data) return null;

  const status = data as any;
  return (
    <DailySpecialCountdown
      used={status.used ?? 0}
      quota={status.quota ?? null}
      isUnlimited={status.isUnlimited ?? false}
      resetsAt={status.resetsAt}
    />
  );
}
