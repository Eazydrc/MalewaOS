import { Skeleton } from "@/components/ui/Skeleton";
import { useMyStats, useAdvancedStats } from "@/hooks/useStats";
import { fc } from "./shared";

function AdvancedAnalyticsSection({ isDomination }: { isDomination: boolean }) {
  const { data: adv, isLoading } = useAdvancedStats(isDomination);

  if (isLoading) return <div className="space-y-3">{[1,2,3].map(i => <Skeleton key={i} height={80} />)}</div>;
  if (!adv) return null;

  function pct(v: number) { return v > 0 ? `+${v.toFixed(1)}%` : v < 0 ? `${v.toFixed(1)}%` : "0%"; }
  function pctColor(v: number) { return v > 0 ? "text-green-600 dark:text-green-400" : v < 0 ? "text-red-500" : "text-text-3"; }

  const maxPeak = Math.max(...adv.peakHours.map(h => h.count), 1);
  const max14   = Math.max(...adv.daily14.map(d => d.revenue), 1);

  return (
    <div className="space-y-4 pt-4 border-t border-border">
      <div className="flex items-center gap-2">
        <span className="text-xs font-black px-3 py-1 rounded-full bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300">👑 DOMINATION</span>
        <p className="text-xs font-bold text-text">Analytics avancés</p>
      </div>

      {/* Comparaisons périodes */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: "Réservations",  week: adv.reservations.weekChange,  month: adv.reservations.monthChange  },
          { label: "Commandes",     week: adv.orders.weekChange,        month: adv.orders.monthChange        },
          { label: "Revenus",       week: adv.revenue.weekChange,       month: adv.revenue.monthChange       },
        ].map(k => (
          <div key={k.label} className="card p-3 space-y-1.5">
            <p className="text-[10px] font-bold text-text-3">{k.label}</p>
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-text-3">7j</span>
              <span className={`text-xs font-black ${pctColor(k.week)}`}>{pct(k.week)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-text-3">30j</span>
              <span className={`text-xs font-black ${pctColor(k.month)}`}>{pct(k.month)}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Taux de conversion */}
      <div className="card p-4 space-y-3">
        <p className="text-xs font-bold text-text-3 uppercase tracking-wide">🎯 Taux de conversion</p>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-[10px] text-text-3 mb-1">Réservations complétées</p>
            <div className="h-2 bg-surface-2 rounded-full overflow-hidden">
              <div className="h-full bg-sky-500 rounded-full" style={{ width: `${adv.conversionRate.reservations}%` }} />
            </div>
            <p className="text-xs font-black text-sky-600 dark:text-sky-400 mt-1">{adv.conversionRate.reservations.toFixed(1)}%</p>
          </div>
          <div>
            <p className="text-[10px] text-text-3 mb-1">Commandes livrées</p>
            <div className="h-2 bg-surface-2 rounded-full overflow-hidden">
              <div className="h-full bg-green-500 rounded-full" style={{ width: `${adv.conversionRate.orders}%` }} />
            </div>
            <p className="text-xs font-black text-green-600 dark:text-green-400 mt-1">{adv.conversionRate.orders.toFixed(1)}%</p>
          </div>
        </div>
      </div>

      {/* Heures de pointe */}
      {adv.peakHours.length > 0 && (
        <div className="card p-4 space-y-3">
          <p className="text-xs font-bold text-text-3 uppercase tracking-wide">⏰ Heures de pointe</p>
          <div className="flex items-end gap-1 h-16">
            {adv.peakHours.map(h => {
              const pctH = maxPeak > 0 ? (h.count / maxPeak) * 100 : 0;
              return (
                <div key={h.hour} className="flex-1 flex flex-col items-center gap-0.5">
                  <div className="w-full rounded-t bg-orange-400/80 dark:bg-orange-500/80 transition-all" style={{ height: `${Math.max(pctH, 4)}%` }} title={`${h.count} cmd`} />
                  <p className="text-[8px] text-text-3">{h.hour}h</p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Graphique 14 jours */}
      {adv.daily14.length > 0 && (
        <div className="card p-4 space-y-3">
          <p className="text-xs font-bold text-text-3 uppercase tracking-wide">📈 14 derniers jours</p>
          <div className="flex items-end gap-1 h-20">
            {adv.daily14.map(d => {
              const pctD = max14 > 0 ? (d.revenue / max14) * 100 : 0;
              const date = new Date(d.date);
              return (
                <div key={d.date} className="flex-1 flex flex-col items-center gap-0.5">
                  <div className="w-full rounded-t bg-violet-400/80 dark:bg-violet-500/80 transition-all" style={{ height: `${Math.max(pctD, 3)}%` }}
                    title={`${fc(d.revenue)} — ${d.orders} cmd — ${d.reservations} rés`} />
                  <p className="text-[8px] text-text-3">{date.getDate()}/{date.getMonth() + 1}</p>
                </div>
              );
            })}
          </div>
          <div className="flex gap-3 text-[10px] text-text-3">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-violet-400 inline-block" /> Revenus</span>
          </div>
        </div>
      )}
    </div>
  );
}

export function AnalyticsTab({ subscription }: { subscription: string }) {
  const { data: stats, isLoading } = useMyStats();
  const isCroissance = ["CROISSANCE", "DOMINATION"].includes(subscription);
  const isDomination = subscription === "DOMINATION";

  if (!isCroissance) return (
    <div className="card text-center py-16 max-w-md">
      <p className="text-4xl mb-3">📊</p>
      <p className="font-black text-text text-base">Analytics</p>
      <p className="text-sm text-text-3 mt-2 max-w-xs mx-auto">Suivez vos performances : réservations, commandes, revenus, plats populaires.</p>
      <p className="mt-6 px-4 py-2 rounded-xl bg-violet-50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-300 text-xs font-bold inline-block">Disponible dès le pack Croissance</p>
    </div>
  );

  if (isLoading) return <div className="space-y-3">{[1,2,3,4].map(i => <Skeleton key={i} height={80} />)}</div>;
  if (!stats)    return null;


  const maxRevenue = Math.max(...stats.dailyOrders.map(d => d.revenue), 1);

  return (
    <div className="space-y-6 max-w-2xl">

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-3">
        {[
          { label: "Réservations ce mois", value: stats.reservations.month, sub: `${stats.reservations.week} cette semaine`, icon: "📅", color: "text-sky-600 dark:text-sky-400" },
          { label: "Commandes ce mois",    value: stats.orders.month,       sub: `${stats.orders.week} cette semaine`,       icon: "📦", color: "text-violet-600 dark:text-violet-400" },
          { label: "Revenus ce mois",      value: fc(stats.revenue.month),  sub: `${fc(stats.revenue.week)} cette semaine`,  icon: "💰", color: "text-green-600 dark:text-green-400" },
          { label: "Note moyenne",         value: stats.restaurant.rating > 0 ? `${stats.restaurant.rating.toFixed(1)} ★` : "—", sub: `${stats.restaurant.reviewCount} avis`, icon: "⭐", color: "text-amber-600 dark:text-amber-400" },
        ].map(k => (
          <div key={k.label} className="card p-4 space-y-1">
            <p className="text-xs text-text-3 font-semibold">{k.icon} {k.label}</p>
            <p className={`text-xl font-black ${k.color}`}>{k.value}</p>
            <p className="text-[11px] text-text-3">{k.sub}</p>
          </div>
        ))}
      </div>

      {/* Graphique commandes 7 jours */}
      {stats.dailyOrders.length > 0 && (
        <div className="card p-4 space-y-3">
          <p className="text-xs font-bold text-text-3 uppercase tracking-wide">📈 Revenus 7 derniers jours</p>
          <div className="flex items-end gap-1.5 h-24">
            {stats.dailyOrders.map(d => {
              const pct = maxRevenue > 0 ? (d.revenue / maxRevenue) * 100 : 0;
              const date = new Date(d.day);
              return (
                <div key={d.day} className="flex-1 flex flex-col items-center gap-1">
                  <div className="w-full rounded-t-lg bg-accent/80 transition-all" style={{ height: `${Math.max(pct, 4)}%` }} title={fc(d.revenue)} />
                  <p className="text-[9px] text-text-3">{date.toLocaleDateString("fr-FR", { weekday: "short" })}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Top plats */}
      {stats.topItems.length > 0 && (
        <div className="card p-4 space-y-3">
          <p className="text-xs font-bold text-text-3 uppercase tracking-wide">🏆 Top plats (30 jours)</p>
          <div className="space-y-2">
            {stats.topItems.map((item, i) => {
              const max = stats.topItems[0].quantity;
              return (
                <div key={item.name} className="flex items-center gap-3">
                  <span className="text-xs font-black text-text-3 w-4">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-text truncate">{item.name}</p>
                    <div className="h-1.5 bg-surface-2 rounded-full mt-1 overflow-hidden">
                      <div className="h-full bg-accent rounded-full" style={{ width: `${(item.quantity / max) * 100}%` }} />
                    </div>
                  </div>
                  <span className="text-xs font-black text-accent shrink-0">{item.quantity}×</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Statuts réservations + commandes */}
      <div className="grid grid-cols-2 gap-3">
        <div className="card p-4 space-y-2">
          <p className="text-xs font-bold text-text-3 uppercase tracking-wide">📅 Réservations</p>
          {Object.entries(stats.reservations.byStatus).map(([s, n]) => (
            <div key={s} className="flex justify-between text-xs">
              <span className="text-text-2">{s}</span>
              <span className="font-black text-text">{n}</span>
            </div>
          ))}
          {!Object.keys(stats.reservations.byStatus).length && <p className="text-xs text-text-3">Aucune donnée</p>}
        </div>
        <div className="card p-4 space-y-2">
          <p className="text-xs font-bold text-text-3 uppercase tracking-wide">📦 Commandes</p>
          {Object.entries(stats.orders.byStatus).map(([s, n]) => (
            <div key={s} className="flex justify-between text-xs">
              <span className="text-text-2">{s}</span>
              <span className="font-black text-text">{n}</span>
            </div>
          ))}
          {!Object.keys(stats.orders.byStatus).length && <p className="text-xs text-text-3">Aucune donnée</p>}
        </div>
      </div>

      {/* DOMINATION — Analytics avancés */}
      {isDomination ? <AdvancedAnalyticsSection isDomination={isDomination} /> : (
        <div className="card p-4 flex items-center gap-3 border border-dashed border-orange-300 dark:border-orange-700">
          <span className="text-2xl">👑</span>
          <div>
            <p className="text-xs font-black text-text">Analytics avancés — Pack Domination</p>
            <p className="text-[11px] text-text-3 mt-0.5">Comparaisons périodes, taux de conversion, heures de pointe, graphique 14 jours.</p>
          </div>
        </div>
      )}
    </div>
  );
}
