import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { useMyReservations, useCancelReservation, Reservation } from "@/hooks/useReservations";

const STATUS_CONFIG: Record<string, { label: string; variant: "success" | "warning" | "default" | "danger" }> = {
  CONFIRMED: { label: "Confirmée",  variant: "success" },
  PENDING:   { label: "En attente", variant: "warning" },
  COMPLETED: { label: "Terminée",   variant: "default" },
  CANCELLED: { label: "Annulée",    variant: "danger"  },
  NO_SHOW:   { label: "Absent",     variant: "danger"  },
};

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" });
}

function formatTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
}

// Modal de confirmation d'annulation
function CancelModal({ onConfirm, onClose, loading }: { onConfirm: () => void; onClose: () => void; loading: boolean }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm px-4 pb-6">
      <div className="w-full max-w-sm bg-bg border border-border rounded-2xl p-5 shadow-xl space-y-4 animate-slide-up">
        <div className="text-center space-y-2">
          <p className="text-2xl">⚠️</p>
          <p className="text-sm font-bold text-text">Annuler la réservation ?</p>
          <p className="text-xs text-text-3">Cette action est irréversible. Vous pourrez faire une nouvelle réservation à tout moment.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" className="flex-1" onClick={onClose} disabled={loading}>
            Garder
          </Button>
          <Button variant="ghost" className="flex-1 text-danger hover:bg-danger-soft" onClick={onConfirm} loading={loading}>
            Annuler quand même
          </Button>
        </div>
      </div>
    </div>
  );
}

// Skeleton
function ReservationSkeleton() {
  return (
    <div className="card p-0 overflow-hidden animate-pulse">
      <div className="flex items-center gap-3 p-4 border-b border-border/60">
        <div className="w-12 h-12 rounded-xl bg-surface-2" />
        <div className="flex-1 space-y-2">
          <div className="h-3 bg-surface-2 rounded w-3/4" />
          <div className="h-2.5 bg-surface-2 rounded w-1/2" />
        </div>
        <div className="w-16 h-6 bg-surface-2 rounded-full" />
      </div>
      <div className="px-4 py-3 grid grid-cols-2 gap-3">
        {[1,2,3,4].map(i => (
          <div key={i} className="space-y-1.5">
            <div className="h-2 bg-surface-2 rounded w-1/2" />
            <div className="h-2.5 bg-surface-2 rounded w-3/4" />
          </div>
        ))}
      </div>
    </div>
  );
}

const TABS = ["À venir", "Passées"];

export default function ReservationsPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("À venir");
  const [cancelTarget, setCancelTarget] = useState<string | null>(null);

  const { data: reservations = [], isLoading } = useMyReservations();
  const cancelMutation = useCancelReservation();

  const upcoming = reservations.filter(r => !["COMPLETED", "CANCELLED", "NO_SHOW"].includes(r.status));
  const past     = reservations.filter(r => ["COMPLETED", "CANCELLED", "NO_SHOW"].includes(r.status));
  const displayed = activeTab === "À venir" ? upcoming : past;

  function handleCancel(id: string) {
    cancelMutation.mutate(id, {
      onSuccess: () => setCancelTarget(null),
    });
  }

  return (
    <AppLayout title="Réservations">

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-surface-2 border border-border rounded-xl">
        {TABS.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all duration-150 no-tap ${
              activeTab === tab
                ? "bg-bg text-text shadow-[0_1px_3px_rgb(0_0_0/0.08)]"
                : "text-text-3 hover:text-text-2"
            }`}
          >
            {tab}
            {tab === "À venir" && upcoming.length > 0 && (
              <span className="ml-1.5 inline-flex items-center justify-center w-4 h-4 rounded-full bg-accent text-white text-[9px] font-bold">
                {upcoming.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Contenu */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2].map(i => <ReservationSkeleton key={i} />)}
        </div>
      ) : displayed.length === 0 ? (
        <div className="card p-10 text-center space-y-3">
          <p className="text-3xl">🗓️</p>
          <p className="text-sm font-bold text-text">
            {activeTab === "À venir" ? "Aucune réservation à venir" : "Aucune réservation passée"}
          </p>
          <p className="text-xs text-text-3">
            {activeTab === "À venir" ? "Réservez votre première table pour commencer" : "Vos réservations terminées apparaîtront ici"}
          </p>
          {activeTab === "À venir" && (
            <Button size="sm" variant="accent" onClick={() => navigate("/home")} className="mx-auto mt-2">
              Explorer les restaurants
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {displayed.map((res: Reservation) => {
            const cfg = STATUS_CONFIG[res.status] ?? { label: res.status, variant: "default" as const };
            const canCancel = res.status === "PENDING" || res.status === "CONFIRMED";
            return (
              <div key={res.id} className="card p-0 overflow-hidden">

                {/* Header restaurant */}
                <div className="flex items-center gap-3 p-4 border-b border-border/60">
                  <img
                    src={res.restaurant.imageUrl ?? ""}
                    alt={res.restaurant.name}
                    className="w-12 h-12 rounded-xl object-cover border border-border bg-surface-2"
                    onError={e => {
                      (e.target as HTMLImageElement).src =
                        `https://placehold.co/48x48/F1F1F5/9999B0?text=${encodeURIComponent(res.restaurant.name[0])}`;
                    }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-text truncate">{res.restaurant.name}</p>
                    <p className="text-xs text-text-3 mt-0.5 truncate">{res.restaurant.address}</p>
                  </div>
                  <Badge variant={cfg.variant} size="sm">{cfg.label}</Badge>
                </div>

                {/* Détails */}
                <div className="px-4 py-3 grid grid-cols-2 gap-3">
                  {[
                    { label: "Date",     value: formatDate(res.date), icon: "📅" },
                    { label: "Heure",    value: formatTime(res.date), icon: "🕐" },
                    { label: "Couverts", value: `${res.partySize} personne${res.partySize > 1 ? "s" : ""}`, icon: "👥" },
                    { label: "Adresse",  value: res.restaurant.address.split(",")[0], icon: "📍" },
                  ].map(d => (
                    <div key={d.label}>
                      <p className="text-[10px] font-semibold text-text-3 uppercase tracking-wide">{d.label}</p>
                      <p className="text-xs font-semibold text-text mt-0.5 truncate">{d.icon} {d.value}</p>
                    </div>
                  ))}
                </div>

                {/* Notes */}
                {res.notes && (
                  <div className="mx-4 mb-3 px-3 py-2 rounded-lg bg-surface-2 border border-border">
                    <p className="text-xs text-text-3 italic">"{res.notes}"</p>
                  </div>
                )}

                {/* Actions */}
                {canCancel && (
                  <div className="flex gap-2 px-4 pb-4">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="flex-1 text-danger hover:bg-danger-soft"
                      onClick={() => setCancelTarget(res.id)}
                    >
                      Annuler
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      className="flex-1"
                      onClick={() => navigate(`/restaurant/${res.restaurant.id}`)}
                    >
                      Voir le restaurant
                    </Button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* CTA */}
      <Button fullWidth size="lg" variant="primary" onClick={() => navigate("/home")}>
        + Nouvelle réservation
      </Button>

      {/* Modal annulation */}
      {cancelTarget && (
        <CancelModal
          onClose={() => setCancelTarget(null)}
          onConfirm={() => handleCancel(cancelTarget)}
          loading={cancelMutation.isPending}
        />
      )}
    </AppLayout>
  );
}
