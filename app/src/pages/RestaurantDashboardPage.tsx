import { useState, lazy, Suspense } from "react";
import { useNavigate } from "react-router-dom";

const DailySpecialCountdownWidget = lazy(() =>
  import('@/components/DailySpecialCountdown').then(m => ({ default: m.DailySpecialCountdownWidget }))
);
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/Button";
import { api } from "@/lib/api";
import { useAuthStore } from "@/store/auth.store";
import { useNotifications } from "@/hooks/useNotifications";
import { useIsDesktop } from "@/hooks/useIsDesktop";
import { PackageIcon, LockIcon } from "@/components/ui/Icon";

// ── Icons ─────────────────────────────────────────────────────────────────────

function StarIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="none">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
    </svg>
  );
}
function CalendarIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
      <line x1="16" y1="2" x2="16" y2="6"/>
      <line x1="8" y1="2" x2="8" y2="6"/>
      <line x1="3" y1="10" x2="21" y2="10"/>
    </svg>
  );
}
function OrderIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
      <line x1="3" y1="6" x2="21" y2="6"/>
      <path d="M16 10a4 4 0 0 1-8 0"/>
    </svg>
  );
}
function MenuIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="3" y1="12" x2="21" y2="12"/>
      <line x1="3" y1="6" x2="21" y2="6"/>
      <line x1="3" y1="18" x2="21" y2="18"/>
    </svg>
  );
}
function ChevronRight() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 18 15 12 9 6"/>
    </svg>
  );
}
function CreditCardIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/>
      <line x1="1" y1="10" x2="23" y2="10"/>
    </svg>
  );
}

// ── Config ───────────────────────────────────────────────────────────────────

const TIER_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  MAMAN:      { label: "Maman",      color: "#71717A", bg: "rgb(113 113 122 / 0.10)" },
  ESSENTIEL:  { label: "Essentiel",  color: "#3B82F6", bg: "rgb(59 130 246 / 0.10)"  },
  CROISSANCE: { label: "Croissance", color: "#8B5CF6", bg: "rgb(139 92 246 / 0.10)"  },
  DOMINATION: { label: "Domination", color: "#E85D26", bg: "rgb(232 93 38 / 0.10)"   },
};

const STATUS_COLORS: Record<string, string> = {
  PENDING:          "bg-yellow-100 text-yellow-700 dark:bg-yellow-950/40 dark:text-yellow-400",
  CONFIRMED:        "bg-green-100  text-green-700  dark:bg-green-950/40  dark:text-green-400",
  COMPLETED:        "bg-surface-2  text-text-3",
  CANCELLED:        "bg-red-100    text-red-700    dark:bg-red-950/40    dark:text-red-400",
  NO_SHOW:          "bg-red-100    text-red-700    dark:bg-red-950/40    dark:text-red-400",
  ACCEPTED:         "bg-blue-100   text-blue-700   dark:bg-blue-950/40   dark:text-blue-400",
  PREPARING:        "bg-purple-100 text-purple-700 dark:bg-purple-950/40 dark:text-purple-400",
  PACKAGING:        "bg-orange-100 text-orange-700 dark:bg-orange-950/40 dark:text-orange-400",
  OUT_FOR_DELIVERY: "bg-indigo-100 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-400",
  READY:            "bg-green-100  text-green-700  dark:bg-green-950/40  dark:text-green-400",
  DELIVERED:        "bg-surface-2  text-text-3",
};

const STATUS_LABEL: Record<string, string> = {
  PENDING:   "En attente",
  CONFIRMED: "Confirmée",
  COMPLETED: "Terminée",
  CANCELLED: "Annulée",
  NO_SHOW:   "Absent",
  ACCEPTED:  "Acceptée",
  PREPARING: "En préparation",
  READY:     "Prête à servir",
  DELIVERED: "Livrée",
};

// Statut suivant pour réservations
const RES_NEXT: Record<string, { label: string; status: string; color: string } | null> = {
  PENDING:   { label: "✅ Confirmer",  status: "CONFIRMED", color: "bg-green-500 text-white" },
  CONFIRMED: { label: "✔ Terminée",   status: "COMPLETED", color: "bg-zinc-600 text-white" },
  COMPLETED: null,
  CANCELLED: null,
  NO_SHOW:   null,
};

type Tab = "overview" | "reservations";

// ── Notification Banner ───────────────────────────────────────────────────────

function NotifBanner() {
  const { supported, permission, subscribed, loading, subscribe } = useNotifications();
  if (!supported || permission === 'denied' || subscribed || permission === 'granted') return null;
  return (
    <div className="card p-3 flex items-center gap-3 border border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-900/20">
      <span className="text-xl">🔔</span>
      <div className="flex-1">
        <p className="text-xs font-bold text-text">Activer les notifications</p>
        <p className="text-[11px] text-text-3">Soyez alerté en temps réel des nouvelles réservations et commandes.</p>
      </div>
      <button
        onClick={subscribe}
        disabled={loading}
        className="shrink-0 px-3 py-1.5 rounded-xl bg-accent text-white text-xs font-bold hover:bg-accent/90 disabled:opacity-50"
      >
        {loading ? '…' : 'Activer'}
      </button>
    </div>
  );
}

// ── Skeleton ─────────────────────────────────────────────────────────────────

function DashboardSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="card h-48 bg-surface-2" />
      <div className="grid grid-cols-2 gap-3">
        {[1,2,3,4].map(i => <div key={i} className="card h-20 bg-surface-2" />)}
      </div>
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function RestaurantDashboardPage() {
  const navigate  = useNavigate();
  const { user }  = useAuthStore();
  const qc        = useQueryClient();
  const [tab, setTab] = useState<Tab>("overview");
  const isDesktop = useIsDesktop();

  interface MyRestaurant {
    id: string; name: string; address: string; imageUrl?: string;
    isOpen: boolean; isActive: boolean; subscription: string;
    restaurantType?: string;
    rating?: number; reviewCount?: number;
  }

  const { data: restaurant, isLoading } = useQuery<MyRestaurant>({
    queryKey: ["my-restaurant"],
    queryFn:  () => api.get<MyRestaurant>("/restaurants/mine"),
    enabled:  user?.role === "RESTAURANT" || user?.role === "ADMIN",
  });

  const toggleOpen = useMutation({
    mutationFn: (r: MyRestaurant) =>
      api.patch(`/restaurants/${r.id}`, { isOpen: !r.isOpen }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["my-restaurant"] }),
  });

  const hasOrdering = ["ESSENTIEL", "CROISSANCE", "DOMINATION"].includes(restaurant?.subscription ?? "");

  const { data: reservations = [], isLoading: loadingRes } = useQuery({
    queryKey: ["restaurant-reservations", restaurant?.id],
    queryFn:  () => api.get<any[]>(`/reservations/restaurant/${restaurant!.id}`),
    enabled:  !!restaurant?.id,
    staleTime: 30 * 1000,
  });

  const { data: orders = [], isLoading: loadingOrders } = useQuery({
    queryKey: ["restaurant-orders", restaurant?.id],
    queryFn:  () => api.get<any[]>(`/orders/restaurant/${restaurant!.id}`),
    enabled:  !!restaurant?.id && hasOrdering,
    staleTime: 30 * 1000,
  });

  // Mise à jour statut réservation
  const updateResStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      api.patch(`/reservations/${id}/status`, { status }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["restaurant-reservations"] }),
  });

  // Annuler réservation
  const cancelRes = useMutation({
    mutationFn: (id: string) =>
      api.patch(`/reservations/${id}/status`, { status: "CANCELLED" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["restaurant-reservations"] }),
  });

  if (!user || (user.role !== "RESTAURANT" && user.role !== "ADMIN")) {
    return (
      <AppLayout title="Espace restaurant">
        <div className="card p-8 text-center">
          <p className="text-2xl mb-2">🔒</p>
          <p className="text-sm font-semibold text-text-2">Accès réservé aux restaurateurs</p>
        </div>
      </AppLayout>
    );
  }

  if (isLoading) return <AppLayout title="Dashboard"><DashboardSkeleton /></AppLayout>;

  if (!restaurant) {
    return (
      <AppLayout title="Dashboard">
        <div className="card p-8 text-center space-y-3">
          <p className="text-2xl">🍽️</p>
          <p className="text-sm font-bold text-text">Aucun restaurant configuré</p>
          <Button size="sm" variant="accent" onClick={() => navigate("/home")} className="mx-auto">
            Retour à l'accueil
          </Button>
        </div>
      </AppLayout>
    );
  }

  const tier     = restaurant.subscription ?? "MAMAN";
  const tierInfo = TIER_CONFIG[tier] ?? TIER_CONFIG.MAMAN;

  // Compteurs pour badges
  const pendingOrders = orders.filter((o: any) => o.status === "PENDING").length;
  const pendingRes    = reservations.filter((r: any) => r.status === "PENDING").length;
  const activeOrders  = orders.filter((o: any) => !['DELIVERED','CANCELLED'].includes(o.status));

  // ── Layout Desktop 3 colonnes ─────────────────────────────────────────────
  if (isDesktop) {
    return (
      <AppLayout title={`Dashboard — ${restaurant.name}`}>
        {/* Statut + actions rapides */}
        <div className="flex items-center justify-between gap-4 pb-2 border-b border-border">
          <div className="flex items-center gap-3">
            <span className="px-3 py-1 rounded-full text-xs font-bold" style={{ color: tierInfo.color, background: tierInfo.bg }}>
              {tierInfo.label}
            </span>
            <span className={`px-3 py-1 rounded-full text-xs font-bold ${restaurant.isOpen ? 'bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-400' : 'bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400'}`}>
              {restaurant.isOpen ? '🟢 Ouvert' : '🔴 Fermé'}
            </span>
            {pendingOrders > 0 && (
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-yellow-100 text-yellow-700 dark:bg-yellow-950/40 dark:text-yellow-400 animate-pulse">
                ⚡ {pendingOrders} commande{pendingOrders > 1 ? 's' : ''} en attente
              </span>
            )}
            {pendingRes > 0 && (
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400">
                📅 {pendingRes} réservation{pendingRes > 1 ? 's' : ''} en attente
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => toggleOpen.mutate(restaurant)}
              disabled={toggleOpen.isPending}
              className={`px-4 py-2 rounded-xl text-sm font-bold transition-all disabled:opacity-50 ${restaurant.isOpen ? 'bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-950/30 dark:text-red-400' : 'bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-950/30 dark:text-green-400'}`}
            >
              {restaurant.isOpen ? 'Fermer le restaurant' : 'Ouvrir le restaurant'}
            </button>
            <button
              onClick={() => navigate("/mon-restaurant")}
              className="px-4 py-2 rounded-xl text-sm font-bold bg-surface-2 border border-border text-text hover:bg-surface-3 transition-all"
            >
              ⚙️ Gérer
            </button>
          </div>
        </div>

        {/* 3 colonnes */}
        <div className="grid grid-cols-3 gap-6">

          {/* ── Colonne 1 : Accès Commandes ── */}
          <div className="col-span-1 space-y-3">
            <h2 className="font-bold text-text flex items-center gap-2">
              <span className="w-2 h-2 bg-orange-500 rounded-full animate-pulse" />
              Commandes
            </h2>

            {!hasOrdering ? (
              <div className="card p-5 text-center space-y-2">
                <LockIcon size={22} className="mx-auto text-text-3" />
                <p className="text-xs text-text-3">Pack ESSENTIEL+ requis</p>
                <button onClick={() => navigate("/abonnement")} className="text-xs text-accent underline">Passer au pack supérieur</button>
              </div>
            ) : (
              <button
                onClick={() => navigate("/commandes")}
                className="w-full card p-6 flex flex-col items-center gap-2 text-center hover:bg-surface-2 transition-colors relative"
              >
                {activeOrders.length > 0 && (
                  <span className="absolute top-3 right-3 min-w-[22px] h-[22px] px-1 rounded-full bg-red-500 text-white text-xs font-bold flex items-center justify-center animate-pulse">
                    {activeOrders.length}
                  </span>
                )}
                <PackageIcon size={28} className="text-accent" />
                <p className="text-sm font-bold text-text">Ouvrir l'écran de réception</p>
                <p className="text-xs text-text-3">
                  {loadingOrders ? "Chargement…" : activeOrders.length > 0
                    ? `${activeOrders.length} commande${activeOrders.length > 1 ? "s" : ""} en cours`
                    : "Aucune commande en cours"}
                </p>
              </button>
            )}
          </div>

          {/* ── Colonne 2 : Réservations ── */}
          <div className="col-span-1 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-text">📅 Réservations</h2>
              <span className="text-xs text-text-3">{reservations.filter((r: any) => r.status === 'PENDING').length} en attente</span>
            </div>

            {loadingRes ? (
              <div className="space-y-2">{[1,2].map(i => <div key={i} className="h-24 rounded-xl bg-surface-2 animate-pulse" />)}</div>
            ) : reservations.length === 0 ? (
              <div className="card p-5 text-center space-y-2">
                <p className="text-2xl">📭</p>
                <p className="text-xs text-text-3">Aucune réservation</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[calc(100vh-220px)] overflow-y-auto pr-1">
                {reservations.slice(0, 15).map((r: any) => (
                  <div key={r.id} className={`card p-3 space-y-2 ${r.status === 'PENDING' ? 'ring-1 ring-blue-400/40' : ''}`}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-text">{r.user?.firstName} {r.user?.lastName}</p>
                        <p className="text-[10px] text-text-3">
                          {new Date(r.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })} · {r.partySize} pers.
                        </p>
                        {r.notes && <p className="text-[10px] text-text-3 truncate italic">{r.notes}</p>}
                      </div>
                      <span className={`shrink-0 px-1.5 py-0.5 rounded-full text-[9px] font-bold ${STATUS_COLORS[r.status] ?? ''}`}>
                        {r.status}
                      </span>
                    </div>
                    {r.status === 'PENDING' && (
                      <div className="flex gap-1.5">
                        <button
                          onClick={() => updateResStatus.mutate({ id: r.id, status: 'CONFIRMED' })}
                          className="flex-1 py-1 rounded-lg text-[10px] font-bold bg-green-500 text-white"
                        >✓ Confirmer</button>
                        <button
                          onClick={() => cancelRes.mutate(r.id)}
                          className="flex-1 py-1 rounded-lg text-[10px] font-bold bg-red-100 text-red-700 dark:bg-red-950/30 dark:text-red-400"
                        >✗ Refuser</button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ── Colonne 3 : Stats + infos ── */}
          <div className="col-span-1 space-y-3">
            <h2 className="font-bold text-text">📊 Vue d'ensemble</h2>

            {/* Statut ouvert/fermé */}
            <div className="card p-4 space-y-3">
              <p className="text-xs font-semibold text-text-3 uppercase tracking-wider">Restaurant</p>
              <div className="flex items-center gap-3">
                {restaurant.imageUrl && (
                  <img src={restaurant.imageUrl} className="w-10 h-10 rounded-xl object-cover" alt="" />
                )}
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-text text-sm truncate">{restaurant.name}</p>
                  <p className="text-xs text-text-3 truncate">{restaurant.address}</p>
                </div>
              </div>
              {restaurant.rating !== undefined && (
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-amber-500 font-bold">★ {restaurant.rating.toFixed(1)}</span>
                  <span className="text-text-3 text-xs">({restaurant.reviewCount ?? 0} avis)</span>
                </div>
              )}
            </div>

            {/* Résumé du jour */}
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: 'Commandes', value: orders.length, color: 'text-orange-500' },
                { label: 'Réservations', value: reservations.length, color: 'text-blue-500' },
                { label: 'En attente', value: pendingOrders + pendingRes, color: 'text-yellow-500', urgent: (pendingOrders + pendingRes) > 0 },
                { label: 'CA estimé', value: `$${(orders.reduce((s: number, o: any) => s + o.totalCents, 0) / 100).toFixed(0)}`, color: 'text-green-500' },
              ].map(s => (
                <div key={s.label} className={`card p-3 text-center ${s.urgent ? 'ring-1 ring-yellow-400/50' : ''}`}>
                  <p className={`text-xl font-black ${s.color}`}>{s.value}</p>
                  <p className="text-[10px] text-text-3 mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>

            {/* Liens rapides */}
            <div className="card p-3 space-y-1">
              <p className="text-xs font-semibold text-text-3 uppercase tracking-wider mb-2">Accès rapide</p>
              {[
                { label: '🍽️ Gérer le menu',      to: '/mon-restaurant?tab=menu' },
                { label: '📊 Analytics',           to: '/mon-restaurant?tab=analytics' },
                { label: '👥 Personnel',           to: '/mon-restaurant?tab=personnel' },
                { label: '💳 Mon abonnement',      to: '/abonnement' },
              ].map(l => (
                <button
                  key={l.label}
                  onClick={() => navigate(l.to)}
                  className="w-full text-left text-xs text-text-2 hover:text-accent px-2 py-1.5 rounded-lg hover:bg-surface-2 transition-colors"
                >
                  {l.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Dashboard">

      {/* ── Banner notifications push ── */}
      <NotifBanner />

      {/* ── Carte restaurant ── */}
      <div className="card overflow-hidden">
        {restaurant.imageUrl && (
          <div className="h-28 bg-surface-2 overflow-hidden">
            <img src={restaurant.imageUrl} alt={restaurant.name} className="w-full h-full object-cover" />
          </div>
        )}
        <div className="p-4 space-y-3">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h2 className="font-bold text-text text-base leading-tight truncate">{restaurant.name}</h2>
              <p className="text-xs text-text-3 mt-0.5 truncate">{restaurant.address}</p>
            </div>
            <span className="shrink-0 px-2.5 py-1 rounded-full text-[11px] font-bold"
              style={{ color: tierInfo.color, background: tierInfo.bg }}>
              {tierInfo.label}
            </span>
          </div>

          {/* Toggle ouvert / fermé */}
          <button
            onClick={() => restaurant && toggleOpen.mutate(restaurant)}
            disabled={toggleOpen.isPending}
            className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl border transition-all ${
              restaurant.isOpen
                ? "bg-success-soft border-success/20 text-success"
                : "bg-surface-2 border-border text-text-3"
            }`}
          >
            <span className="text-sm font-bold">
              {restaurant.isOpen ? "🟢 Ouvert maintenant" : "🔴 Fermé"}
            </span>
            <span className="text-xs font-semibold underline underline-offset-2">
              {toggleOpen.isPending ? "…" : restaurant.isOpen ? "Fermer" : "Ouvrir"}
            </span>
          </button>

          {/* Stats — cliquables */}
          <div className="grid grid-cols-3 gap-2">
            {[
              {
                label: "Note", value: restaurant.rating?.toFixed(1) ?? "—",
                sub: `${restaurant.reviewCount ?? 0} avis`, icon: <StarIcon />,
                onClick: () => navigate("/mon-restaurant"),
              },
              {
                label: "Réservations",
                value: loadingRes ? "…" : String(reservations.length || "0"),
                sub: pendingRes > 0 ? `${pendingRes} en attente` : "total",
                icon: <CalendarIcon size={14} />,
                onClick: () => setTab("reservations"),
                urgent: pendingRes > 0,
              },
              {
                label: "Commandes",
                value: !hasOrdering ? "🔒" : loadingOrders ? "…" : String(orders.length || "0"),
                sub: !hasOrdering ? "Essentiel+" : pendingOrders > 0 ? `${pendingOrders} en attente` : "total",
                icon: <OrderIcon size={14} />,
                onClick: hasOrdering ? () => navigate("/commandes") : undefined,
                urgent: pendingOrders > 0,
              },
            ].map(s => (
              <button
                key={s.label}
                onClick={s.onClick}
                disabled={!s.onClick}
                className={`card-glass rounded-xl p-3 text-center transition-all active:scale-95 no-tap ${s.onClick ? "hover:bg-surface-2 cursor-pointer" : "cursor-default"} ${s.urgent ? "ring-1 ring-red-400/50 bg-red-50/50 dark:bg-red-950/10" : ""}`}
              >
                <div className={`mx-auto w-fit mb-1 ${s.urgent ? "text-red-500" : "text-accent"}`}>{s.icon}</div>
                <p className="text-base font-black text-text tracking-tight">{s.value}</p>
                <p className={`text-[10px] font-medium ${s.urgent ? "text-red-500 font-bold" : "text-text-3"}`}>{s.sub}</p>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Plat du jour countdown ── */}
      {['MAMAN','ESSENTIEL','CROISSANCE','DOMINATION'].includes(restaurant?.subscription ?? '') && (
        <Suspense fallback={null}>
          <DailySpecialCountdownWidget />
        </Suspense>
      )}

      {/* ── Raccourcis rapides (toujours visibles) ── */}
      <div className="grid grid-cols-3 gap-2">
        <button
          onClick={() => navigate("/mon-restaurant")}
          className="card p-3 flex flex-col items-center gap-1.5 text-center active:scale-[0.97] transition-transform no-tap"
        >
          <span className="w-9 h-9 rounded-xl bg-accent/10 flex items-center justify-center text-accent">
            <MenuIcon size={18} />
          </span>
          <span className="text-[11px] font-semibold text-text-2">Mon menu</span>
        </button>

        <button
          onClick={() => setTab("reservations")}
          className={`card p-3 flex flex-col items-center gap-1.5 text-center active:scale-[0.97] transition-transform no-tap relative ${tab === "reservations" ? "ring-1 ring-accent" : ""}`}
        >
          {pendingRes > 0 && (
            <span className="absolute top-2 right-2 w-4 h-4 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center">
              {pendingRes}
            </span>
          )}
          <span className="w-9 h-9 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500">
            <CalendarIcon size={18} />
          </span>
          <span className="text-[11px] font-semibold text-text-2">Réservations</span>
        </button>

        <button
          onClick={() => hasOrdering ? navigate("/commandes") : undefined}
          className={`card p-3 flex flex-col items-center gap-1.5 text-center active:scale-[0.97] transition-transform no-tap relative ${!hasOrdering ? "opacity-50" : ""}`}
        >
          {activeOrders.length > 0 && (
            <span className="absolute top-2 right-2 w-4 h-4 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center">
              {activeOrders.length}
            </span>
          )}
          <span className="w-9 h-9 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-500">
            <OrderIcon size={18} />
          </span>
          <span className="text-[11px] font-semibold text-text-2">Commandes</span>
          {!hasOrdering && <span className="text-[9px] text-text-3">🔒 Essentiel+</span>}
        </button>
      </div>

      {/* ── Abonnement ── */}
      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={() => navigate("/abonnement")}
          className="card p-3 flex items-center gap-3 w-full text-left active:scale-[0.99] transition-transform no-tap"
        >
          <span className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: TIER_CONFIG[tier]?.bg ?? "rgb(113 113 122 / 0.10)", color: TIER_CONFIG[tier]?.color ?? "#71717A" }}>
            <CreditCardIcon size={18} />
          </span>
          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-bold text-text">Mon abonnement</p>
            <p className="text-[10px] text-text-3">Plan : <span className="font-semibold" style={{ color: TIER_CONFIG[tier]?.color }}>{tierInfo.label}</span></p>
          </div>
          <ChevronRight />
        </button>

        <button
          onClick={() => navigate("/abonnement/cinetpay")}
          className="card p-3 flex items-center gap-3 w-full text-left active:scale-[0.99] transition-transform no-tap"
        >
          <span className="w-9 h-9 rounded-xl bg-accent/10 flex items-center justify-center shrink-0 text-accent">
            <CreditCardIcon size={18} />
          </span>
          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-bold text-text">Gérer l'abonnement</p>
            <p className="text-[10px] text-text-3">Payer via CinetPay</p>
          </div>
          <ChevronRight />
        </button>
      </div>

      {/* ── Actions urgentes ── */}
      {(pendingRes > 0 || pendingOrders > 0) && (
        <div className="space-y-2">
          {pendingRes > 0 && (
            <button
              onClick={() => setTab("reservations")}
              className="w-full card p-3.5 flex items-center gap-3 text-left ring-1 ring-yellow-400/40 bg-yellow-50/50 dark:bg-yellow-950/10 active:scale-[0.98] transition-transform no-tap"
            >
              <span className="w-9 h-9 rounded-xl bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center text-lg shrink-0">📅</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-text">
                  {pendingRes} réservation{pendingRes > 1 ? "s" : ""} en attente
                </p>
                <p className="text-xs text-text-3">Appuyez pour confirmer ou annuler</p>
              </div>
              <ChevronRight />
            </button>
          )}
          {pendingOrders > 0 && hasOrdering && (
            <button
              onClick={() => navigate("/commandes")}
              className="w-full card p-3.5 flex items-center gap-3 text-left ring-1 ring-orange-400/40 bg-orange-50/50 dark:bg-orange-950/10 active:scale-[0.98] transition-transform no-tap"
            >
              <span className="w-9 h-9 rounded-xl bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center text-lg shrink-0">🛍️</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-text">
                  {pendingOrders} commande{pendingOrders > 1 ? "s" : ""} en attente
                </p>
                <p className="text-xs text-text-3">Appuyez pour accepter</p>
              </div>
              <ChevronRight />
            </button>
          )}
        </div>
      )}

      {/* ── Tabs ── */}
      <div className="flex gap-1 bg-surface-2 rounded-xl p-1">
        {([
          { id: "overview",     label: "Aperçu" },
          { id: "reservations", label: "Réservations" },
        ] as { id: Tab; label: string }[]).map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all duration-150 no-tap ${
              tab === t.id ? "bg-bg text-text shadow-card" : "text-text-3 hover:text-text-2"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Aperçu ── */}
      {tab === "overview" && (
        <div className="space-y-4">
          {/* Résumé activité */}
          <div className="card p-4 space-y-3">
            <h3 className="text-sm font-bold text-text">Activité récente</h3>
            <button
              onClick={() => setTab("reservations")}
              className="w-full flex items-center justify-between py-2 border-b border-border last:border-0"
            >
              <div className="flex items-center gap-3">
                <span className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-500">
                  <CalendarIcon size={15} />
                </span>
                <div className="text-left">
                  <p className="text-sm font-semibold text-text">Réservations</p>
                  <p className="text-xs text-text-3">
                    {pendingRes > 0 ? `${pendingRes} en attente` : "Aucune en attente"}
                  </p>
                </div>
              </div>
              <ChevronRight />
            </button>
            {hasOrdering && (
              <button
                onClick={() => navigate("/commandes")}
                className="w-full flex items-center justify-between py-2"
              >
                <div className="flex items-center gap-3">
                  <span className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center text-orange-500">
                    <OrderIcon size={15} />
                  </span>
                  <div className="text-left">
                    <p className="text-sm font-semibold text-text">Commandes</p>
                    <p className="text-xs text-text-3">
                      {pendingOrders > 0 ? `${pendingOrders} en attente` : "Aucune en attente"}
                    </p>
                  </div>
                </div>
                <ChevronRight />
              </button>
            )}
          </div>

          {/* CTA upgrade si pas commandes */}
          {!hasOrdering && (
            <div className="card p-4 border-dashed" style={{ borderColor: "rgb(var(--color-accent) / 0.3)" }}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: "rgb(var(--color-accent-soft))" }}>
                  <OrderIcon />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-text">Activer la commande en ligne</p>
                  <p className="text-xs text-text-3 mt-0.5">Disponible dès l'abonnement Croissance ($25/mois)</p>
                </div>
                <Button size="sm" variant="accent" onClick={() => navigate("/abonnement")}>Upgrader</Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Réservations ── */}
      {tab === "reservations" && (
        <div className="space-y-3">
          {loadingRes ? (
            <div className="space-y-3 animate-pulse">
              {[1,2,3].map(i => <div key={i} className="card h-28 bg-surface-2" />)}
            </div>
          ) : reservations.length === 0 ? (
            <div className="card p-6 text-center space-y-3">
              <p className="text-3xl">📅</p>
              <div>
                <p className="text-sm font-bold text-text">Aucune réservation</p>
                <p className="text-xs text-text-3 mt-1">Partagez votre lien pour recevoir des réservations</p>
              </div>
              <button
                onClick={() => {
                  const url = `${window.location.origin}/r/${restaurant.id}`;
                  navigator.clipboard?.writeText(url).then(() => alert("Lien copié !"));
                }}
                className="mx-auto flex items-center gap-1.5 px-4 py-2 rounded-xl bg-accent/10 text-accent text-xs font-bold hover:bg-accent/20 transition-colors"
              >
                🔗 Copier mon lien
              </button>
            </div>
          ) : (
            reservations.map((r: any) => {
              const nextAction = RES_NEXT[r.status] ?? null;
              return (
                <div key={r.id} className="card p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-text">
                        {r.user?.firstName} {r.user?.lastName}
                      </p>
                      <div className="flex items-center gap-3 text-xs text-text-3 mt-1">
                        <span>👥 {r.partySize} pers.</span>
                        <span>📅 {new Date(r.date).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" })}</span>
                      </div>
                      {r.notes && <p className="text-xs text-text-3 italic mt-1">"{r.notes}"</p>}
                    </div>
                    <span className={`shrink-0 px-2 py-0.5 rounded-full text-[10px] font-bold ${STATUS_COLORS[r.status] ?? ""}`}>
                      {STATUS_LABEL[r.status] ?? r.status}
                    </span>
                  </div>
                  {/* Actions */}
                  {(nextAction || r.status === "PENDING") && (
                    <div className="flex gap-2">
                      {nextAction && (
                        <button
                          onClick={() => updateResStatus.mutate({ id: r.id, status: nextAction.status })}
                          disabled={updateResStatus.isPending}
                          className={`flex-1 py-2 rounded-xl text-xs font-bold transition-opacity ${nextAction.color} disabled:opacity-50`}
                        >
                          {nextAction.label}
                        </button>
                      )}
                      {r.status === "PENDING" && (
                        <button
                          onClick={() => cancelRes.mutate(r.id)}
                          disabled={cancelRes.isPending}
                          className="px-3 py-2 rounded-xl text-xs font-bold bg-red-100 text-red-600 dark:bg-red-950/40 dark:text-red-400 disabled:opacity-50"
                        >
                          ✕ Annuler
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {/* ── Commandes ── */}
    </AppLayout>
  );
}
