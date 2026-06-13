import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/Button";
import { useWalletSummary, useWalletHistory, useRedeemPoints } from "@/hooks/useWallet";

const POINTS_TO_FC = 50; // 1 pt = 50 FC (cohérent avec le backend)

// ── Skeleton ──────────────────────────────────────────────────────────────────
function WalletSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="card p-5 space-y-4">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <div className="h-2.5 bg-surface-2 rounded w-24" />
            <div className="h-8 bg-surface-2 rounded w-32" />
            <div className="h-2 bg-surface-2 rounded w-20" />
          </div>
          <div className="w-14 h-14 rounded-2xl bg-surface-2" />
        </div>
        <div className="space-y-2">
          <div className="flex justify-between">
            <div className="h-2 bg-surface-2 rounded w-28" />
            <div className="h-2 bg-surface-2 rounded w-16" />
          </div>
          <div className="h-2 bg-surface-2 rounded-full w-full" />
          <div className="h-2 bg-surface-2 rounded w-40" />
        </div>
      </div>
      <div className="grid grid-cols-3 gap-3">
        {[1,2,3].map(i => <div key={i} className="card p-3 h-20 bg-surface-2 rounded-2xl" />)}
      </div>
    </div>
  );
}

// ── Modal d'échange ───────────────────────────────────────────────────────────
function RedeemModal({
  points,
  onConfirm,
  onClose,
  loading,
}: {
  points: number;
  onConfirm: (pts: number) => void;
  onClose: () => void;
  loading: boolean;
}) {
  const [selected, setSelected] = useState(20);
  const maxMultiples = Math.floor(points / 20);
  const options = Array.from({ length: Math.min(maxMultiples, 10) }, (_, i) => (i + 1) * 20);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm px-4 pb-6">
      <div className="w-full max-w-sm bg-bg border border-border rounded-2xl p-5 shadow-xl space-y-4 animate-slide-up">
        <div className="text-center space-y-1">
          <p className="text-xl">💰</p>
          <p className="text-sm font-bold text-text">Échanger des points</p>
          <p className="text-xs text-text-3">20 pts = 1 000 FC de réduction</p>
        </div>

        {/* Sélecteur de points */}
        <div className="space-y-2">
          <label className="label">Nombre de points à échanger</label>
          <div className="flex gap-2 flex-wrap">
            {options.map(opt => (
              <button
                key={opt}
                onClick={() => setSelected(opt)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all no-tap ${
                  selected === opt
                    ? "bg-accent text-white border-accent"
                    : "bg-surface-2 text-text-2 border-border hover:border-border-strong"
                }`}
              >
                {opt} pts
              </button>
            ))}
          </div>
          <div className="flex items-center justify-between px-3 py-2.5 rounded-xl bg-success-soft border border-success/15">
            <span className="text-xs font-semibold text-success">Valeur obtenue</span>
            <span className="text-sm font-black text-success">{(selected * POINTS_TO_FC).toLocaleString()} FC</span>
          </div>
        </div>

        <div className="flex gap-2">
          <Button variant="secondary" className="flex-1" onClick={onClose} disabled={loading}>
            Annuler
          </Button>
          <Button variant="accent" className="flex-1" onClick={() => onConfirm(selected)} loading={loading}>
            Confirmer
          </Button>
        </div>
      </div>
    </div>
  );
}

// ── Type badge ────────────────────────────────────────────────────────────────
const TX_CONFIG: Record<string, { icon: string; color: string; bg: string; sign: string }> = {
  EARN:   { icon: "↑", color: "#16A34A", bg: "rgb(22 163 74 / 0.08)",  sign: "+" },
  BONUS:  { icon: "⭐", color: "#F59E0B", bg: "rgb(245 158 11 / 0.08)", sign: "+" },
  REFUND: { icon: "↩", color: "#3B82F6", bg: "rgb(59 130 246 / 0.08)", sign: "+" },
  REDEEM: { icon: "↓", color: "#DC2626", bg: "rgb(220 38 38 / 0.08)",  sign: ""  },
  EXPIRY: { icon: "⏱", color: "#71717A", bg: "rgb(113 113 122 / 0.08)", sign: "" },
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });
}

// ── Page principale ───────────────────────────────────────────────────────────
export default function WalletPage() {
  const [showRedeem, setShowRedeem] = useState(false);

  const { data: summary, isLoading: loadingSummary } = useWalletSummary();
  const { data: historyData, isLoading: loadingHistory } = useWalletHistory();
  const redeemMutation = useRedeemPoints();

  const points       = summary?.points       ?? 0;
  const minRedeem    = summary?.minRedeem    ?? 20;
  const progress     = summary?.progress     ?? 0;
  const redeemableFC = summary?.redeemableFC ?? 0;
  const canRedeem    = points >= minRedeem;

  const history = historyData?.items ?? [];

  function handleRedeem(pts: number) {
    redeemMutation.mutate(pts, {
      onSuccess: () => setShowRedeem(false),
    });
  }

  if (loadingSummary) return <AppLayout title="Wallet"><WalletSkeleton /></AppLayout>;

  return (
    <AppLayout title="Wallet">

      {/* ── Solde principal ── */}
      <div className="card p-5 space-y-4">
        <div className="flex items-start justify-between">
          <div>
            <p className="label">Solde de points</p>
            <p className="text-4xl font-black tracking-tighter text-text">{points.toLocaleString()}</p>
            <p className="text-sm text-text-3 font-medium mt-1">points fidélité</p>
          </div>
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center"
            style={{ background: "rgb(var(--color-accent) / 0.12)", border: "1px solid rgb(var(--color-accent) / 0.20)" }}
          >
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#E85D26" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
            </svg>
          </div>
        </div>

        {/* Barre de progression */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-text-3 font-medium">Prochain échange</span>
            <span className="font-bold text-text">{points % minRedeem}/{minRedeem} pts</span>
          </div>
          <div className="h-2 bg-surface-2 rounded-full overflow-hidden border border-border/40">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${progress * 100}%`, background: "linear-gradient(90deg, #F5784A, #E85D26)" }}
            />
          </div>
          <p className="text-[11px] text-text-3">
            {minRedeem - (points % minRedeem)} pts manquants pour {(minRedeem * POINTS_TO_FC).toLocaleString()} FC de réduction
          </p>
        </div>

        {/* Zone échangeable */}
        {canRedeem && (
          <div
            className="flex items-center justify-between p-3 rounded-xl"
            style={{ background: "rgb(var(--color-success-soft))", border: "1px solid rgb(var(--color-success) / 0.15)" }}
          >
            <div>
              <p className="text-xs font-semibold text-success">Disponible à l'échange</p>
              <p className="text-lg font-black text-success mt-0.5">
                {redeemableFC.toLocaleString()} FC
              </p>
            </div>
            <Button size="sm" variant="accent" onClick={() => setShowRedeem(true)}>
              Échanger
            </Button>
          </div>
        )}
      </div>

      {/* ── Stats rapides ── */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Points",        value: points.toLocaleString(),                      icon: "⭐" },
          { label: "Valeur",        value: `${redeemableFC.toLocaleString()} FC`,        icon: "💰" },
          { label: "Transactions",  value: historyData?.total?.toString() ?? "0",        icon: "📋" },
        ].map(stat => (
          <div key={stat.label} className="card p-3 text-center space-y-1">
            <p className="text-lg">{stat.icon}</p>
            <p className="text-xs font-bold text-text">{stat.value}</p>
            <p className="text-[10px] text-text-3 font-semibold uppercase tracking-wide">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* ── Historique ── */}
      <section className="space-y-3">
        <h2 className="text-base font-bold tracking-tight text-text">Historique</h2>

        {loadingHistory ? (
          <div className="card divide-y divide-border/60 p-0 overflow-hidden animate-pulse">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex items-center gap-3 px-4 py-3.5">
                <div className="w-9 h-9 rounded-xl bg-surface-2 shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-2.5 bg-surface-2 rounded w-3/4" />
                  <div className="h-2 bg-surface-2 rounded w-1/2" />
                </div>
                <div className="h-3 bg-surface-2 rounded w-12" />
              </div>
            ))}
          </div>
        ) : history.length === 0 ? (
          <div className="card p-8 text-center">
            <p className="text-2xl mb-2">📋</p>
            <p className="text-sm font-semibold text-text-2">Aucune transaction</p>
            <p className="text-xs text-text-3 mt-1">Vos gains et échanges de points apparaîtront ici</p>
          </div>
        ) : (
          <div className="card divide-y divide-border/60 p-0 overflow-hidden">
            {history.map(tx => {
              const cfg = TX_CONFIG[tx.type] ?? TX_CONFIG.EARN;
              const isPositive = tx.amount > 0;
              return (
                <div key={tx.id} className="flex items-center gap-3 px-4 py-3.5">
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 text-sm font-bold"
                    style={{ background: cfg.bg, color: cfg.color }}
                  >
                    {cfg.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-text truncate">{tx.reason}</p>
                    <p className="text-xs text-text-3 mt-0.5">{formatDate(tx.createdAt)}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p
                      className="text-sm font-bold"
                      style={{ color: isPositive ? "#16A34A" : "#DC2626" }}
                    >
                      {isPositive ? "+" : ""}{tx.amount} pts
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ── Erreur échange ── */}
      {redeemMutation.isError && (
        <div className="card p-3 border-danger/30 bg-danger-soft">
          <p className="text-xs font-semibold text-danger text-center">
            {(redeemMutation.error as any)?.message ?? "Erreur lors de l'échange"}
          </p>
        </div>
      )}

      {/* ── Modal échange ── */}
      {showRedeem && (
        <RedeemModal
          points={points}
          onClose={() => setShowRedeem(false)}
          onConfirm={handleRedeem}
          loading={redeemMutation.isPending}
        />
      )}
    </AppLayout>
  );
}
