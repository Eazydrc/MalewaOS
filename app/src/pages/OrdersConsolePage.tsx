import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AppLayout } from "@/components/layout/AppLayout";
import { api } from "@/lib/api";
import { useAuthStore } from "@/store/auth.store";
import { useAvailableDrivers } from "@/hooks/useDelivery";
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
  isPaid: boolean;
  verificationCode?: string | null;
  refusalReason?: string | null;
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
  const meta = FULFILLMENT_META[fulfillment];
  const FulfillmentIcon = meta.icon;
  const initials = `${order.user?.firstName?.[0] ?? ""}${order.user?.lastName?.[0] ?? ""}`.toUpperCase();
  const [showRefuseForm, setShowRefuseForm] = useState(false);
  const [refuseReason, setRefuseReason] = useState("");

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full md:max-w-md bg-bg rounded-t-3xl md:rounded-3xl shadow-2xl max-h-[90vh] overflow-y-auto">
        {/* En-tête */}
        <div className="flex items-center justify-between gap-4 p-5">
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

        <div className="px-5 pb-5 space-y-4">
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
            <div className="flex items-center justify-between bg-surface-2 rounded-xl px-3 py-2.5">
              <span className="text-xs font-semibold text-text-2">Code de vérification</span>
              <span className="text-base font-black tracking-widest text-text">{order.verificationCode}</span>
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

          {canAssignDriver && (
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

export default function OrdersConsolePage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const qc = useQueryClient();
  const [subTab, setSubTab] = useState<SubTab>("dinein");
  const [openOrderId, setOpenOrderId] = useState<string | null>(null);

  const { data: restaurant } = useQuery({
    queryKey: ["my-restaurant"],
    queryFn: () => api.get<{ id: string; name: string }>("/restaurants/mine"),
    enabled: user?.role === "RESTAURANT" || user?.role === "ADMIN",
  });

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

  const active = orders.filter((o) => !["DELIVERED", "CANCELLED"].includes(o.status));
  const dineIn   = active.filter((o) => fulfillmentOf(o) === "DINE_IN");
  const takeaway = active.filter((o) => fulfillmentOf(o) === "TAKEAWAY");
  const delivery = active.filter((o) => fulfillmentOf(o) === "DELIVERY");
  const history = orders
    .filter((o) => ["DELIVERED", "CANCELLED"].includes(o.status))
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const groups: Record<SubTab, RestaurantOrder[]> = { dinein: dineIn, takeaway, delivery, history };
  const shown = groups[subTab];
  const openOrder = orders.find((o) => o.id === openOrderId) ?? null;

  const EMPTY_LABEL: Record<SubTab, string> = {
    dinein: "Aucune commande sur place en cours",
    takeaway: "Aucune commande à emporter en cours",
    delivery: "Aucune commande en livraison en cours",
    history: "Aucune commande traitée pour l'instant",
  };

  return (
    <AppLayout title={`Commandes — ${restaurant?.name ?? ""}`}>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <button onClick={() => navigate("/dashboard")} className="text-xs text-text-3 hover:text-text">‹ Retour au dashboard</button>
          <span className={`flex items-center gap-1.5 text-[10px] font-bold px-2 py-0.5 rounded-full ${connected ? "bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-400" : "bg-surface-2 text-text-3"}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${connected ? "bg-green-500" : "bg-text-3"}`} />
            {connected ? "Temps réel actif" : "Connexion…"}
          </span>
        </div>

        {/* Onglets — segmented control, comme dans le dashboard */}
        <div className="flex gap-1 bg-surface-2 rounded-xl p-1">
          {(Object.keys(TAB_META) as Exclude<SubTab, "history">[]).map((key) => {
            const meta = TAB_META[key];
            const count = groups[key].length;
            return (
              <button
                key={key}
                onClick={() => setSubTab(key)}
                className={`flex-1 flex items-center justify-center gap-1 py-2 rounded-lg text-xs font-semibold transition-all ${subTab === key ? "bg-bg text-text shadow-card" : "text-text-3 hover:text-text-2"}`}
              >
                {meta.label}
                {count > 0 && <span className="px-1.5 py-0.5 rounded-full bg-accent/15 text-accent text-[10px] font-bold">{count}</span>}
              </button>
            );
          })}
          <button
            onClick={() => setSubTab("history")}
            className={`flex-1 flex items-center justify-center gap-1 py-2 rounded-lg text-xs font-semibold transition-all ${subTab === "history" ? "bg-bg text-text shadow-card" : "text-text-3 hover:text-text-2"}`}
          >
            Traitées
            {history.length > 0 && <span className="px-1.5 py-0.5 rounded-full bg-accent/15 text-accent text-[10px] font-bold">{history.length}</span>}
          </button>
        </div>

        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => <div key={i} className="h-16 rounded-xl bg-surface-2 animate-pulse" />)}
          </div>
        ) : shown.length === 0 ? (
          <div className="card p-8 text-center space-y-2">
            <CheckCircleIcon size={28} className="mx-auto text-text-3" />
            <p className="text-sm text-text-3">{EMPTY_LABEL[subTab]}</p>
          </div>
        ) : (
          <div className="space-y-2">
            {(subTab === "history" ? shown.slice(0, 60) : shown).map((order) => (
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
