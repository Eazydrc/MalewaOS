import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { QRCodeSVG } from "qrcode.react";
import { AppLayout } from "@/components/layout/AppLayout";
import { api } from "@/lib/api";
import { useAuthStore } from "@/store/auth.store";
import { useAvailableDrivers, useFindDriver, useAffiliationCode, useAffiliatedDrivers } from "@/hooks/useDelivery";
import { useOrdersSocket } from "@/hooks/useOrdersSocket";
import { OrderStepper, nextStatus, fulfillmentOf, type OrderStatus, type OrderFulfillment } from "@/components/orders/OrderStepper";
import {
  CheckCircleIcon, ChefHatIcon, BikeIcon, PackageIcon, BellIcon,
  StoreIcon, LockIcon, ReceiptIcon,
} from "@/components/ui/Icon";

interface OrderItem {
  id: string;
  name: string;
  quantity: number;
}

interface RestaurantOrder {
  id: string;
  status: OrderStatus;
  createdAt: string;
  deliveryAddress?: string | null;
  notes?: string | null;
  totalCents: number;
  deliveryFeeUsdCents?: number;
  isPaid: boolean;
  escrowReleased?: boolean;
  verificationCode?: string | null;
  refusalReason?: string | null;
  searchingDriver?: boolean;
  user?: { firstName?: string; lastName?: string; phone?: string };
  table?: { number?: number; label?: string } | null;
  items: OrderItem[];
  assignedDriverId?: string | null;
  assignedDriver?: { id: string; firstName: string; lastName: string; phone?: string } | null;
}

const ACTION_LABEL: Record<OrderStatus, { label: string; icon: typeof CheckCircleIcon }> = {
  PENDING:          { label: "Accepter",        icon: CheckCircleIcon },
  ACCEPTED:         { label: "En cuisine",       icon: ChefHatIcon },
  PREPARING:        { label: "Étape suivante",   icon: CheckCircleIcon },
  PACKAGING:        { label: "En livraison",     icon: BikeIcon },
  OUT_FOR_DELIVERY: { label: "Marquer livrée",   icon: CheckCircleIcon },
  READY:            { label: "Étape suivante",   icon: CheckCircleIcon },
  DELIVERED:        { label: "",                 icon: CheckCircleIcon },
  CANCELLED:        { label: "",                 icon: CheckCircleIcon },
};

function actionMeta(status: OrderStatus, fulfillment: OrderFulfillment) {
  if (status === "PREPARING") return fulfillment === "DELIVERY" ? { label: "Emballage", icon: PackageIcon } : { label: "Prête", icon: BellIcon };
  if (status === "READY") return fulfillment === "TAKEAWAY" ? { label: "Marquer récupérée", icon: PackageIcon } : { label: "Marquer servie", icon: CheckCircleIcon };
  return ACTION_LABEL[status];
}

type SubTab = "dinein" | "takeaway" | "delivery" | "history";

const TAB_META: Record<Exclude<SubTab, "history">, { label: string; icon: typeof StoreIcon; activeClass: string }> = {
  dinein:   { label: "Sur place",   icon: StoreIcon,   activeClass: "bg-accent text-white" },
  takeaway: { label: "À emporter",  icon: PackageIcon, activeClass: "bg-violet-500 text-white" },
  delivery: { label: "Livraison",   icon: BikeIcon,    activeClass: "bg-blue-500 text-white" },
};

const FULFILLMENT_META: Record<OrderFulfillment, { label: string; icon: typeof StoreIcon; color: string }> = {
  DINE_IN:  { label: "Sur place",  icon: StoreIcon,   color: "text-accent bg-accent/10" },
  TAKEAWAY: { label: "À emporter", icon: PackageIcon, color: "text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-950/30" },
  DELIVERY: { label: "Livraison",  icon: BikeIcon,    color: "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/30" },
};

// ── Ligne résumé — vue liste, sans détail ni action pour éviter les erreurs de caisse ──

function OrderSummaryRow({ order, onOpen }: { order: RestaurantOrder; onOpen: () => void }) {
  const fulfillment = fulfillmentOf(order);
  const meta = FULFILLMENT_META[fulfillment];
  const FulfillmentIcon = meta.icon;
  const initials = `${order.user?.firstName?.[0] ?? ""}${order.user?.lastName?.[0] ?? ""}`.toUpperCase();

  return (
    <button
      onClick={onOpen}
      className={`card w-full flex items-center gap-3 p-3.5 text-left hover:bg-surface-2 transition-colors ${order.status === "PENDING" ? "border-l-[3px] border-l-accent" : ""}`}
    >
      <div className="w-9 h-9 rounded-full bg-accent/10 text-accent flex items-center justify-center text-xs font-bold shrink-0">
        {initials || "?"}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-text truncate leading-tight">{order.user?.firstName} {order.user?.lastName}</p>
        <div className="flex items-center gap-2 mt-1">
          <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${meta.color}`}>
            <FulfillmentIcon size={10} />{meta.label}
          </span>
          <span className="text-[11px] text-text-3">
            {new Date(order.createdAt).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
          </span>
        </div>
      </div>
      <div className="text-right shrink-0">
        <p className="text-sm font-bold text-text leading-tight">{(order.totalCents / 100).toFixed(2)} $</p>
        <span className={`inline-block mt-1 text-[9px] font-bold leading-none px-2 py-0.5 rounded-full ${
          order.isPaid ? "bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-400" : "bg-surface-2 text-text-3"
        }`}>
          {order.isPaid ? "Payée" : "Non payée"}
        </span>
      </div>
    </button>
  );
}

// ── Détail complet — ouvert depuis la liste, seul endroit où agir sur la commande ──

function OrderDetailModal({ order, onClose, onAdvance, advancing, drivers, onAssignDriver, assigning, onMarkPaidCash, markingPaid, onRefuse, refusing }: {
  order: RestaurantOrder;
  onClose: () => void;
  onAdvance: (id: string, status: OrderStatus) => void;
  advancing: boolean;
  drivers: { id: string; firstName: string; lastName: string }[];
  onAssignDriver: (orderId: string, driverId: string) => void;
  assigning: boolean;
  onMarkPaidCash: (id: string) => void;
  markingPaid: boolean;
  onRefuse: (id: string, reason: string) => void;
  refusing: boolean;
}) {
  const fulfillment = fulfillmentOf(order);
  const isDelivery = fulfillment === "DELIVERY";
  const next = nextStatus(order.status, fulfillment);
  const canAssignDriver = isDelivery && !order.assignedDriverId && ["ACCEPTED", "PREPARING", "PACKAGING"].includes(order.status);
  const canFindDriver = isDelivery && !order.assignedDriverId && order.status === "PACKAGING";
  const meta = FULFILLMENT_META[fulfillment];
  const FulfillmentIcon = meta.icon;
  const initials = `${order.user?.firstName?.[0] ?? ""}${order.user?.lastName?.[0] ?? ""}`.toUpperCase();
  const [showRefuseForm, setShowRefuseForm] = useState(false);
  const [refuseReason, setRefuseReason] = useState("");
  const [driverMode, setDriverMode] = useState<"choice" | "manual" | null>(null);
  const findDriver = useFindDriver();

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center">
      {/* Overlay — fond sombre complet */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-md" onClick={onClose} />
      {/* Panneau — glassmorphisme */}
      <div className="relative w-full md:max-w-md bg-bg/95 backdrop-blur-xl rounded-t-3xl md:rounded-3xl shadow-2xl max-h-[92vh] overflow-y-auto border border-border/50">
        {/* Poignée scroll mobile */}
        <div className="flex justify-center pt-3 pb-1 md:hidden">
          <div className="w-10 h-1 rounded-full bg-border" />
        </div>
        {/* En-tête */}
        <div className="flex items-center justify-between gap-4 px-5 pt-3 pb-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-11 h-11 rounded-full bg-accent/10 text-accent flex items-center justify-center text-sm font-bold shrink-0">
              {initials || "?"}
            </div>
            <div className="min-w-0">
              <p className="text-base font-bold text-text truncate leading-tight">{order.user?.firstName} {order.user?.lastName}</p>
              <p className="text-xs text-text-3 mt-0.5">
                {new Date(order.createdAt).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" })}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-text-3 hover:text-text p-1 shrink-0">✕</button>
        </div>

        <div className="px-5 pb-28 space-y-4">
          <div className="flex items-center justify-between">
            <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${meta.color}`}>
              <FulfillmentIcon size={13} />
              {fulfillment === "DELIVERY" ? order.deliveryAddress : fulfillment === "DINE_IN" && order.table?.number ? `Table ${order.table.number}` : meta.label}
            </span>
            <div className="text-right">
              <p className="text-lg font-black text-text">{(order.totalCents / 100).toFixed(2)} $</p>
              <span className={`inline-block text-[9px] font-bold px-2 py-0.5 rounded-full ${
                order.isPaid ? "bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-400" : "bg-surface-2 text-text-3"
              }`}>
                {order.isPaid ? "Payée" : "Non payée"}
              </span>
            </div>
          </div>

          {/* Séquestre livraison — fonds bloqués jusqu'à confirmation client */}
          {fulfillment === "DELIVERY" && order.isPaid && (
            <div className={`flex items-center gap-2 text-xs font-semibold px-3 py-2 rounded-xl ${
              order.escrowReleased
                ? "bg-green-50 dark:bg-green-950/20 text-green-700 dark:text-green-400"
                : "bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400"
            }`}>
              {order.escrowReleased
                ? "💰 Fonds disponibles — réception confirmée par le client"
                : "🔒 Fonds bloqués — en attente de confirmation de réception par le client"}
            </div>
          )}

          <div className="space-y-1.5 border-t border-border pt-3">
            {order.items.map((item) => (
              <div key={item.id} className="flex items-center gap-2 text-sm text-text-2">
                <span className="w-5 h-5 rounded-md bg-surface-2 text-text-3 text-[10px] font-bold flex items-center justify-center shrink-0">{item.quantity}</span>
                <span>{item.name}</span>
              </div>
            ))}
          </div>

          {order.notes && <p className="text-xs italic text-text-3 bg-surface-2 rounded-xl px-3 py-2">"{order.notes}"</p>}

          {order.verificationCode && order.status !== "CANCELLED" && (
            <div className="rounded-2xl bg-surface-2 border border-border p-4 space-y-3 text-center">
              <p className="text-xs font-bold text-text-2 uppercase tracking-wider">Code livreur</p>
              <div className="flex justify-center">
                <div className="bg-white p-3 rounded-xl inline-block">
                  <QRCodeSVG value={order.verificationCode} size={140} level="M" />
                </div>
              </div>
              <div>
                <p className="text-2xl font-black tracking-[0.25em] text-text">{order.verificationCode}</p>
                <p className="text-[10px] text-text-3 mt-1">Le livreur scanne ce QR ou entre ce code pour débloquer l'adresse client</p>
              </div>
            </div>
          )}

          {order.status === "CANCELLED" && order.refusalReason && (
            <p className="text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/20 rounded-xl px-3 py-2">
              Refusée — {order.refusalReason}
            </p>
          )}

          <div className="border-t border-border pt-4">
            <OrderStepper status={order.status} fulfillment={fulfillment} />
          </div>

          {order.assignedDriver && (
            <p className="flex items-center gap-2 text-xs text-text-2">
              <BikeIcon size={14} className="shrink-0" />
              Livreur : {order.assignedDriver.firstName} {order.assignedDriver.lastName}
              {order.assignedDriver.phone && (
                <a href={`tel:${order.assignedDriver.phone}`} className="text-accent">📞</a>
              )}
            </p>
          )}

          {order.searchingDriver && (
            <div className="flex items-center gap-2 bg-blue-50 dark:bg-blue-950/20 text-blue-700 dark:text-blue-400 rounded-xl px-3 py-2.5 text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse shrink-0" />
              Recherche d'un livreur à proximité…
            </div>
          )}

          {canAssignDriver && !order.searchingDriver && driverMode === null && (
            <div className="grid grid-cols-2 gap-2">
              {canFindDriver && (
                <button
                  onClick={() => findDriver.mutate(order.id)}
                  disabled={findDriver.isPending}
                  className="py-2.5 rounded-xl text-xs font-bold bg-text text-bg disabled:opacity-50"
                >
                  🔍 Chercher un livreur
                </button>
              )}
              <button
                onClick={() => setDriverMode("manual")}
                className={`py-2.5 rounded-xl text-xs font-bold bg-surface-2 text-text-2 ${!canFindDriver ? "col-span-2" : ""}`}
              >
                ✅ J'ai un livreur
              </button>
            </div>
          )}

          {findDriver.isError && (
            <p className="text-xs text-red-500">{(findDriver.error as any)?.message ?? "Aucun livreur disponible à proximité"}</p>
          )}

          {canAssignDriver && driverMode === "manual" && (
            <select
              defaultValue=""
              disabled={assigning}
              onChange={(e) => e.target.value && onAssignDriver(order.id, e.target.value)}
              className="w-full text-xs rounded-lg border border-border bg-surface px-3 py-2"
            >
              <option value="" disabled>Assigner un livreur…</option>
              {drivers.map((d) => (
                <option key={d.id} value={d.id}>{d.firstName} {d.lastName}</option>
              ))}
            </select>
          )}

          {next && order.status !== "CANCELLED" && (() => {
            const { label, icon: ActionIcon } = actionMeta(order.status, fulfillment);
            return (
              <button
                onClick={() => onAdvance(order.id, next)}
                disabled={advancing}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold bg-accent text-white shadow-btn hover:shadow-btn-hover transition-shadow disabled:opacity-50"
              >
                <ActionIcon size={16} />{label}
              </button>
            );
          })()}

          {order.status === "PENDING" && !showRefuseForm && (
            <button
              onClick={() => setShowRefuseForm(true)}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold bg-surface-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
            >
              Refuser la commande
            </button>
          )}

          {order.status === "PENDING" && showRefuseForm && (
            <div className="space-y-2 bg-surface-2 rounded-xl p-3">
              <label className="text-xs font-semibold text-text-2">Motif du refus (obligatoire)</label>
              <textarea
                value={refuseReason}
                onChange={(e) => setRefuseReason(e.target.value)}
                placeholder="Ex : plat indisponible, restaurant fermé…"
                rows={2}
                className="w-full text-sm rounded-lg border border-border bg-surface px-3 py-2 resize-none"
              />
              <div className="flex gap-2">
                <button
                  onClick={() => { setShowRefuseForm(false); setRefuseReason(""); }}
                  className="flex-1 py-2 rounded-lg text-xs font-bold bg-surface text-text-2"
                >
                  Annuler
                </button>
                <button
                  onClick={() => onRefuse(order.id, refuseReason)}
                  disabled={refusing || !refuseReason.trim()}
                  className="flex-1 py-2 rounded-lg text-xs font-bold bg-red-600 text-white disabled:opacity-50"
                >
                  Confirmer le refus
                </button>
              </div>
            </div>
          )}

          {!order.isPaid && order.status !== "CANCELLED" && (
            <button
              onClick={() => onMarkPaidCash(order.id)}
              disabled={markingPaid}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold bg-green-50 text-green-700 dark:bg-green-950/20 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-950/30 transition-colors disabled:opacity-50"
            >
              <ReceiptIcon size={16} />Marquer payé (espèces)
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Modal livreurs affiliés (restaurant) ──────────────────────────────────────
function AffiliatedDriversModal({ restaurantId, onClose, onSelectDriver }: {
  restaurantId: string;
  onClose: () => void;
  onSelectDriver: (driverId: string, name: string) => void;
}) {
  const { data: codeData } = useAffiliationCode(restaurantId);
  const { data: drivers = [] } = useAffiliatedDrivers(restaurantId);

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-md" onClick={onClose} />
      <div className="relative w-full md:max-w-md bg-bg/95 backdrop-blur-xl rounded-t-3xl md:rounded-3xl shadow-2xl max-h-[90vh] overflow-y-auto border border-border/50">
        <div className="flex justify-center pt-3 pb-1 md:hidden">
          <div className="w-10 h-1 rounded-full bg-border" />
        </div>
        <div className="flex items-center justify-between gap-4 px-5 pt-3 pb-4">
          <div>
            <h2 className="font-bold text-text">Livreurs affiliés</h2>
            <p className="text-xs text-text-3">Partagez ce code pour recruter vos livreurs</p>
          </div>
          <button onClick={onClose} className="text-text-3 p-1">✕</button>
        </div>

        <div className="px-5 pb-28 space-y-4">
          {/* QR code affiliation */}
          {codeData?.code && (
            <div className="rounded-2xl bg-surface-2 border border-border p-4 text-center space-y-3">
              <p className="text-xs font-bold text-text-3 uppercase tracking-wider">Code d'affiliation restaurant</p>
              <div className="flex justify-center">
                <div className="bg-white p-3 rounded-xl">
                  <QRCodeSVG value={codeData.code} size={140} level="M" />
                </div>
              </div>
              <p className="text-2xl font-black tracking-[0.25em] text-text">{codeData.code}</p>
              <p className="text-[10px] text-text-3">Le livreur entre ce code dans son app pour s'affilier à votre restaurant</p>
            </div>
          )}

          {/* Liste livreurs affiliés */}
          {drivers.length === 0 ? (
            <div className="text-center py-6 text-text-3 text-sm">Aucun livreur affilié pour l'instant</div>
          ) : (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-text-3 uppercase tracking-wider">{drivers.length} livreur{drivers.length > 1 ? 's' : ''}</p>
              {drivers.map(a => (
                <div key={a.id} className="flex items-center gap-3 rounded-xl bg-surface-2 p-3">
                  <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center text-base shrink-0">👤</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-text">{a.driver.firstName} {a.driver.lastName}</p>
                    {a.driver.phone && <p className="text-xs text-text-3">{a.driver.phone}</p>}
                    <span className={`text-[10px] font-bold ${a.driver.isAvailableForDelivery ? 'text-green-500' : 'text-text-3'}`}>
                      {a.driver.isAvailableForDelivery ? '● Disponible' : '● Hors ligne'}
                    </span>
                  </div>
                  <button
                    onClick={() => { onSelectDriver(a.driver.id, `${a.driver.firstName} ${a.driver.lastName}`); onClose(); }}
                    className="text-xs px-3 py-1.5 rounded-lg bg-accent text-white font-semibold shrink-0"
                  >
                    Assigner
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function OrdersConsolePage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const qc = useQueryClient();
  const [subTab, setSubTab] = useState<SubTab | string>("received");
  const [openOrderId, setOpenOrderId] = useState<string | null>(null);
  const [showAffiliatedDrivers, setShowAffiliatedDrivers] = useState(false);

  const { data: restaurant } = useQuery({
    queryKey: ["my-restaurant"],
    queryFn: () => api.get<{ id: string; name: string; restaurantType?: string }>("/restaurants/mine"),
    enabled: user?.role === "RESTAURANT" || user?.role === "ADMIN",
  });

  const isDeliveryOnly = restaurant?.restaurantType === "LIVRAISON";

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ["restaurant-orders", restaurant?.id],
    queryFn: () => api.get<RestaurantOrder[]>(`/orders/restaurant/${restaurant!.id}`),
    enabled: !!restaurant?.id,
    staleTime: 30 * 1000,
  });

  const { connected } = useOrdersSocket({ restaurantId: restaurant?.id });

  const { data: drivers = [] } = useAvailableDrivers();

  const updateStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: OrderStatus }) =>
      api.patch(`/orders/${id}/status`, { status }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["restaurant-orders"] }),
  });

  const assignDriver = useMutation({
    mutationFn: ({ orderId, driverId }: { orderId: string; driverId: string }) =>
      api.patch(`/orders/${orderId}/assign-driver`, { driverId }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["restaurant-orders"] }),
  });

  const markPaidCash = useMutation({
    mutationFn: (orderId: string) => api.post(`/payments/orders/${orderId}/mark-paid-cash`, {}),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["restaurant-orders"] });
      setOpenOrderId(null);
    },
  });

  const refuseOrder = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      api.patch(`/orders/${id}/refuse`, { reason }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["restaurant-orders"] });
      setOpenOrderId(null);
    },
  });

  if (!user || (user.role !== "RESTAURANT" && user.role !== "ADMIN")) {
    return (
      <AppLayout title="Commandes">
        <div className="card p-8 text-center space-y-2">
          <LockIcon size={28} className="mx-auto text-text-3" />
          <p className="text-sm font-semibold text-text-2">Accès réservé aux restaurateurs</p>
        </div>
      </AppLayout>
    );
  }

  // ── 3 onglets : Reçues / En cours / Historique ──────────────────────────
  const received  = orders.filter((o) => o.status === "PENDING");
  const inProgress = orders.filter((o) => ["ACCEPTED", "PREPARING", "PACKAGING", "OUT_FOR_DELIVERY", "READY"].includes(o.status));
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const history = orders
    .filter((o) => ["DELIVERED", "CANCELLED"].includes(o.status) && new Date(o.createdAt) >= today)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  type ConsoleTab = "received" | "inprogress" | "history";
  const shownMap: Record<ConsoleTab, RestaurantOrder[]> = { received, inprogress: inProgress, history };
  const shown = shownMap[subTab as ConsoleTab] ?? inProgress;
  const openOrder = orders.find((o) => o.id === openOrderId) ?? null;

  const EMPTY: Record<ConsoleTab, string> = {
    received:   "Aucune nouvelle commande",
    inprogress: "Aucune commande en cours de traitement",
    history:    "Aucune commande traitée aujourd'hui",
  };

  return (
    <AppLayout title={`Commandes — ${restaurant?.name ?? ""}`}>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <button onClick={() => navigate("/dashboard")} className="text-xs text-text-3 hover:text-text">‹ Retour</button>
          <div className="flex items-center gap-2">
            {restaurant?.id && (
              <button
                onClick={() => setShowAffiliatedDrivers(true)}
                className="flex items-center gap-1.5 text-[10px] font-bold px-2 py-1 rounded-full bg-accent/10 text-accent border border-accent/20"
              >
                🔗 Livreurs affiliés
              </button>
            )}
            <span className={`flex items-center gap-1.5 text-[10px] font-bold px-2 py-0.5 rounded-full ${connected ? "bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-400" : "bg-surface-2 text-text-3"}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${connected ? "bg-green-500 animate-pulse" : "bg-text-3"}`} />
              {connected ? "Temps réel" : "Connexion…"}
            </span>
          </div>
        </div>

        {/* ── 3 onglets fixes ── */}
        <div className="flex gap-1 bg-surface-2 rounded-xl p-1">
          {([
            { key: "received",   label: "Reçues",   count: received.length,    dot: received.length > 0 },
            { key: "inprogress", label: "En cours",  count: inProgress.length,  dot: false },
            { key: "history",    label: "Historique", count: history.length,    dot: false },
          ] as { key: ConsoleTab; label: string; count: number; dot: boolean }[]).map(({ key, label, count, dot }) => (
            <button
              key={key}
              onClick={() => setSubTab(key)}
              className={`relative flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-xs font-bold transition-all ${subTab === key ? "bg-bg text-text shadow-card" : "text-text-3"}`}
            >
              {label}
              {count > 0 && (
                <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${dot ? "bg-red-500 text-white" : "bg-surface text-text-3"}`}>
                  {count}
                </span>
              )}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {[1, 2, 3, 4].map((i) => <div key={i} className="h-24 rounded-xl bg-surface-2 animate-pulse" />)}
          </div>
        ) : shown.length === 0 ? (
          <div className="card p-10 text-center space-y-2">
            <CheckCircleIcon size={28} className="mx-auto text-text-3" />
            <p className="text-sm text-text-3">{EMPTY[subTab as ConsoleTab]}</p>
          </div>
        ) : (
          <div className={`grid gap-3 ${subTab === "inprogress" ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-1"}`}>
            {shown.map((order) => (
              <OrderSummaryRow key={order.id} order={order} onOpen={() => setOpenOrderId(order.id)} />
            ))}
          </div>
        )}
      </div>

      {openOrder && (
        <OrderDetailModal
          order={openOrder}
          onClose={() => setOpenOrderId(null)}
          onAdvance={(id, status) => updateStatus.mutate({ id, status })}
          advancing={updateStatus.isPending}
          drivers={drivers}
          onAssignDriver={(orderId, driverId) => assignDriver.mutate({ orderId, driverId })}
          assigning={assignDriver.isPending}
          onMarkPaidCash={(id) => markPaidCash.mutate(id)}
          markingPaid={markPaidCash.isPending}
          onRefuse={(id, reason) => refuseOrder.mutate({ id, reason })}
          refusing={refuseOrder.isPending}
        />
      )}
    </AppLayout>
  );
}
