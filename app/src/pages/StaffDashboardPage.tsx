import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useAuthStore } from "@/store/auth.store";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Reservation {
  id: string;
  date: string;
  partySize: number;
  notes?: string;
  status: string;
  user: { firstName: string; lastName: string; email: string; phone?: string };
}

interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  priceUsdCents: number;
}

interface Order {
  id: string;
  status: string;
  totalCents: number;
  createdAt: string;
  items: OrderItem[];
  user?: { firstName: string; lastName: string };
  table?: { number: number; label?: string };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fc(cents: number) {
  return (cents / 100).toLocaleString("fr-CD", { maximumFractionDigits: 0 }) + " FC";
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
}

function isToday(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  return d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate();
}

const STATUS_LABEL: Record<string, string> = {
  PENDING:   "En attente",
  CONFIRMED: "Confirmée",
  COMPLETED: "Terminée",
  CANCELLED: "Annulée",
  NO_SHOW:   "Absent",
  ACCEPTED:  "Acceptée",
  PREPARING: "En préparation",
  READY:     "Prête",
  DELIVERED: "Livrée",
};

const STATUS_COLOR: Record<string, string> = {
  PENDING:   "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300",
  CONFIRMED: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  COMPLETED: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
  CANCELLED: "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400",
  NO_SHOW:   "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400",
  ACCEPTED:  "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  PREPARING: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300",
  READY:     "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
  DELIVERED: "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400",
};

// ─── Order status flow buttons ────────────────────────────────────────────────

const ORDER_NEXT: Record<string, { label: string; value: string }[]> = {
  PENDING:   [{ label: "Accepter", value: "ACCEPTED" }],
  ACCEPTED:  [{ label: "En préparation", value: "PREPARING" }],
  PREPARING: [{ label: "Prête", value: "READY" }],
  READY:     [{ label: "Livrée", value: "DELIVERED" }],
  DELIVERED: [],
};

// ─── Main page ────────────────────────────────────────────────────────────────

export function StaffDashboardPage() {
  const user = useAuthStore(s => s.user);
  const qc   = useQueryClient();

  // ── Reservations du jour ──
  const { data: reservations = [], isLoading: loadRes } = useQuery<Reservation[]>({
    queryKey: ["staff-reservations"],
    queryFn:  () => api.get<Reservation[]>("/reservations/restaurant"),
    refetchInterval: 30_000,
  });

  const todayRes = reservations.filter(r => isToday(r.date));

  // ── Commandes en cours ──
  const { data: orders = [], isLoading: loadOrders } = useQuery<Order[]>({
    queryKey: ["staff-orders"],
    queryFn:  () => api.get<Order[]>("/orders/restaurant"),
    refetchInterval: 15_000,
  });

  const activeOrders = orders.filter(o =>
    !["DELIVERED", "CANCELLED"].includes(o.status)
  );

  // ── Mutations ──
  const updateOrderStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      api.patch(`/orders/${id}/status`, { status }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["staff-orders"] }),
  });

  const updateReservationStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      api.patch(`/reservations/${id}/status`, { status }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["staff-reservations"] }),
  });

  return (
    <div className="min-h-screen bg-surface text-text">
      {/* ── Header ── */}
      <header className="sticky top-0 z-20 bg-surface border-b border-border px-4 py-3 flex items-center gap-3">
        <div className="flex-1">
          <p className="text-xs text-text-3">Espace Staff</p>
          <h1 className="text-base font-black text-text">
            {user ? `Bonjour, ${user.firstName}` : "Espace Staff"}
          </h1>
        </div>
        <span className="text-xs font-bold px-2 py-1 rounded-full bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300">
          STAFF
        </span>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-5 space-y-6">

        {/* ── Réservations du jour ── */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-black text-text">Réservations du jour</h2>
            <span className="text-xs text-text-3">{todayRes.length} réservation{todayRes.length !== 1 ? "s" : ""}</span>
          </div>

          {loadRes ? (
            <div className="space-y-2">
              {[1, 2, 3].map(i => (
                <div key={i} className="card p-4 animate-pulse h-20 bg-surface-2" />
              ))}
            </div>
          ) : todayRes.length === 0 ? (
            <div className="card p-6 text-center text-text-3 text-sm">
              Aucune réservation aujourd'hui
            </div>
          ) : (
            <div className="space-y-3">
              {todayRes.map(r => (
                <div key={r.id} className="card p-4 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-bold text-text">
                        {r.user.firstName} {r.user.lastName}
                      </p>
                      <p className="text-xs text-text-3">
                        {formatTime(r.date)} · {r.partySize} pers.
                      </p>
                      {r.notes && (
                        <p className="text-xs text-text-2 mt-1 italic">"{r.notes}"</p>
                      )}
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${STATUS_COLOR[r.status] ?? ""}`}>
                      {STATUS_LABEL[r.status] ?? r.status}
                    </span>
                  </div>
                  {/* Actions */}
                  <div className="flex gap-2 flex-wrap">
                    {r.status === "PENDING" && (
                      <button
                        onClick={() => updateReservationStatus.mutate({ id: r.id, status: "CONFIRMED" })}
                        disabled={updateReservationStatus.isPending}
                        className="text-xs font-bold px-3 py-1 rounded-lg bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-50"
                      >
                        Confirmer
                      </button>
                    )}
                    {r.status === "CONFIRMED" && (
                      <button
                        onClick={() => updateReservationStatus.mutate({ id: r.id, status: "COMPLETED" })}
                        disabled={updateReservationStatus.isPending}
                        className="text-xs font-bold px-3 py-1 rounded-lg bg-green-500 text-white hover:bg-green-600 disabled:opacity-50"
                      >
                        Terminer
                      </button>
                    )}
                    {["PENDING", "CONFIRMED"].includes(r.status) && (
                      <>
                        <button
                          onClick={() => updateReservationStatus.mutate({ id: r.id, status: "NO_SHOW" })}
                          disabled={updateReservationStatus.isPending}
                          className="text-xs font-bold px-3 py-1 rounded-lg bg-zinc-200 text-zinc-700 hover:bg-zinc-300 dark:bg-zinc-700 dark:text-zinc-200 disabled:opacity-50"
                        >
                          Absent
                        </button>
                        <button
                          onClick={() => updateReservationStatus.mutate({ id: r.id, status: "CANCELLED" })}
                          disabled={updateReservationStatus.isPending}
                          className="text-xs font-bold px-3 py-1 rounded-lg bg-red-100 text-red-600 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400 disabled:opacity-50"
                        >
                          Annuler
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* ── Commandes en cours ── */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-black text-text">Commandes en cours</h2>
            <span className="text-xs text-text-3">{activeOrders.length} active{activeOrders.length !== 1 ? "s" : ""}</span>
          </div>

          {loadOrders ? (
            <div className="space-y-2">
              {[1, 2].map(i => (
                <div key={i} className="card p-4 animate-pulse h-24 bg-surface-2" />
              ))}
            </div>
          ) : activeOrders.length === 0 ? (
            <div className="card p-6 text-center text-text-3 text-sm">
              Aucune commande en cours
            </div>
          ) : (
            <div className="space-y-3">
              {activeOrders.map(o => (
                <div key={o.id} className="card p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-bold text-text">
                        {o.table ? `Table ${o.table.number}${o.table.label ? ` · ${o.table.label}` : ""}` : "Commande en ligne"}
                      </p>
                      <p className="text-xs text-text-3">
                        {o.user ? `${o.user.firstName} ${o.user.lastName}` : "Client"} · {formatTime(o.createdAt)}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full block mb-1 ${STATUS_COLOR[o.status] ?? ""}`}>
                        {STATUS_LABEL[o.status] ?? o.status}
                      </span>
                      <span className="text-xs font-black text-accent">{fc(o.totalCents)}</span>
                    </div>
                  </div>

                  {/* Items */}
                  <ul className="space-y-0.5">
                    {o.items.map(item => (
                      <li key={item.id} className="flex justify-between text-xs text-text-2">
                        <span>{item.quantity}× {item.name}</span>
                        <span>{fc(item.priceUsdCents * item.quantity)}</span>
                      </li>
                    ))}
                  </ul>

                  {/* Actions */}
                  {(ORDER_NEXT[o.status] ?? []).length > 0 && (
                    <div className="flex gap-2 flex-wrap">
                      {(ORDER_NEXT[o.status] ?? []).map(action => (
                        <button
                          key={action.value}
                          onClick={() => updateOrderStatus.mutate({ id: o.id, status: action.value })}
                          disabled={updateOrderStatus.isPending}
                          className="text-xs font-bold px-3 py-1 rounded-lg bg-accent text-white hover:opacity-90 disabled:opacity-50"
                        >
                          {action.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

export default StaffDashboardPage;
