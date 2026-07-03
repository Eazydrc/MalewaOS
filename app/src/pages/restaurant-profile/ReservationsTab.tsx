import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { useMyTables } from "@/hooks/useTables";
import { Reservation, STATUS, fc } from "./shared";

export function ReservationsTab({ restaurantId }: { restaurantId: string }) {
  const qc = useQueryClient();
  const { data: reservations, isLoading } = useQuery<Reservation[]>({
    queryKey: ["restaurant-reservations", restaurantId],
    queryFn:  () => api.get(`/reservations/restaurant/${restaurantId}`),
  });
  const { data: tables } = useMyTables();

  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [statusErr, setStatusErr] = useState<string>("");

  async function updateStatus(id: string, status: string) {
    setLoadingId(id);
    setStatusErr("");
    try {
      await api.patch(`/reservations/${id}/status`, { status });
      qc.invalidateQueries({ queryKey: ["restaurant-reservations"] });
    } catch (e: any) {
      setStatusErr(e.message ?? "Erreur lors de la mise à jour");
    } finally {
      setLoadingId(null);
    }
  }

  async function assignTable(id: string, tableId: string) {
    setLoadingId(id);
    setStatusErr("");
    try {
      await api.patch(`/reservations/${id}/table`, { tableId: tableId || null });
      qc.invalidateQueries({ queryKey: ["restaurant-reservations"] });
    } catch (e: any) {
      setStatusErr(e.message ?? "Erreur lors de l'assignation");
    } finally {
      setLoadingId(null);
    }
  }

  if (isLoading) return <div className="space-y-3">{[1,2,3].map(i => <Skeleton key={i} height={90} />)}</div>;

  const pending   = reservations?.filter(r => r.status === "PENDING")   ?? [];
  const confirmed = reservations?.filter(r => r.status === "CONFIRMED") ?? [];
  const others    = reservations?.filter(r => !["PENDING","CONFIRMED"].includes(r.status)) ?? [];

  function Card({ r }: { r: Reservation }) {
    const st = STATUS[r.status] ?? { label: r.status, color: "default" };
    return (
      <div className="card p-4 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="font-bold text-text">{r.user.firstName} {r.user.lastName}</p>
            <p className="text-xs text-text-3">{r.user.email}{r.user.phone ? ` · ${r.user.phone}` : ""}</p>
          </div>
          <Badge variant={st.color as any} size="sm">{st.label}</Badge>
        </div>
        <div className="flex items-center gap-4 text-xs text-text-3">
          <span>📅 {new Date(r.date).toLocaleDateString("fr-FR", { weekday:"short", day:"numeric", month:"short", hour:"2-digit", minute:"2-digit" })}</span>
          <span>👥 {r.partySize} pers.</span>
        </div>
        {r.notes && <p className="text-xs text-text-2 italic bg-surface-2 px-3 py-2 rounded-lg">"{r.notes}"</p>}
        {(r.preOrderItems?.length ?? 0) > 0 && (
          <div className="bg-surface-2 rounded-lg px-3 py-2 space-y-1">
            <p className="text-[10px] font-bold text-text-3 uppercase tracking-wide">🍽️ Pré-commande</p>
            {r.preOrderItems!.map(it => (
              <div key={it.id} className="flex justify-between text-xs text-text-2">
                <span>{it.quantity}× {it.name}</span>
                <span className="font-semibold">{fc(it.priceUsdCents * it.quantity)}</span>
              </div>
            ))}
          </div>
        )}
        {["PENDING", "CONFIRMED"].includes(r.status) && (tables?.length ?? 0) > 0 && (
          <div>
            <label className="text-[10px] font-bold text-text-3 uppercase tracking-wide block mb-1">Table assignée</label>
            <select
              value={r.table?.id ?? ""}
              onChange={(e) => assignTable(r.id, e.target.value)}
              disabled={loadingId === r.id}
              className="w-full text-xs px-2.5 py-2 rounded-xl border border-border bg-surface text-text outline-none focus:border-accent/60"
            >
              <option value="">Aucune table assignée</option>
              {tables?.map((t) => (
                <option key={t.id} value={t.id} disabled={t.seats < r.partySize}>
                  {t.label ?? `Table N°${t.number}`} · {t.seats} place{t.seats > 1 ? "s" : ""}
                  {t.seats < r.partySize ? " (trop petite)" : ""}
                </option>
              ))}
            </select>
          </div>
        )}
        {r.status === "PENDING" && (
          <div className="flex gap-2">
            <button onClick={() => updateStatus(r.id, "CONFIRMED")}
              disabled={loadingId === r.id}
              className="flex-1 py-2 rounded-xl text-xs font-bold bg-green-50 dark:bg-green-900/20 text-green-600 hover:bg-green-100 transition-colors disabled:opacity-50">
              {loadingId === r.id ? "…" : "✓ Confirmer"}
            </button>
            <button onClick={() => updateStatus(r.id, "CANCELLED")}
              disabled={loadingId === r.id}
              className="flex-1 py-2 rounded-xl text-xs font-bold bg-red-50 dark:bg-red-900/20 text-red-600 hover:bg-red-100 transition-colors disabled:opacity-50">
              {loadingId === r.id ? "…" : "✕ Annuler"}
            </button>
          </div>
        )}
        {r.status === "CONFIRMED" && (
          <div className="flex gap-2">
            <button onClick={() => updateStatus(r.id, "COMPLETED")}
              disabled={loadingId === r.id}
              className="flex-1 py-2 rounded-xl text-xs font-bold bg-sky-50 dark:bg-sky-900/20 text-sky-600 hover:bg-sky-100 transition-colors disabled:opacity-50">
              {loadingId === r.id ? "…" : "✓ Terminée"}
            </button>
            <button onClick={() => updateStatus(r.id, "NO_SHOW")}
              disabled={loadingId === r.id}
              className="flex-1 py-2 rounded-xl text-xs font-bold bg-surface-2 text-text-3 hover:bg-surface transition-colors disabled:opacity-50">
              {loadingId === r.id ? "…" : "Absent"}
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-5 max-w-xl">
      {statusErr && (
        <div className="px-4 py-2.5 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
          <p className="text-xs font-semibold text-red-600 dark:text-red-400">{statusErr}</p>
        </div>
      )}
      {pending.length > 0 && <section className="space-y-3"><p className="text-[11px] font-bold text-text-3 uppercase tracking-wide">⏳ En attente ({pending.length})</p>{pending.map(r => <Card key={r.id} r={r} />)}</section>}
      {confirmed.length > 0 && <section className="space-y-3"><p className="text-[11px] font-bold text-text-3 uppercase tracking-wide">✅ Confirmées ({confirmed.length})</p>{confirmed.map(r => <Card key={r.id} r={r} />)}</section>}
      {others.length > 0 && <section className="space-y-3"><p className="text-[11px] font-bold text-text-3 uppercase tracking-wide">📋 Historique</p>{others.map(r => <Card key={r.id} r={r} />)}</section>}
      {!reservations?.length && (
        <div className="card text-center py-16">
          <p className="text-4xl mb-3">📅</p>
          <p className="font-semibold text-text">Aucune réservation</p>
          <p className="text-sm text-text-3 mt-1">Les réservations clients apparaîtront ici</p>
        </div>
      )}
    </div>
  );
}
