import { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/Button";
import { DAYS, DEFAULT_HOURS, OpeningHours } from "@/hooks/useMenu";
import { Restaurant } from "./shared";

export function HorairesTab({ r }: { r: Restaurant }) {
  const qc = useQueryClient();
  const [hours,   setHours]   = useState<OpeningHours>(r.openingHours ?? DEFAULT_HOURS);
  const [loading, setLoading] = useState(false);
  const [saved,   setSaved]   = useState(false);

  useEffect(() => { setHours(r.openingHours ?? DEFAULT_HOURS); }, [r.openingHours]);

  function upd(day: string, field: keyof typeof DEFAULT_HOURS.lun, val: string | boolean) {
    setHours(prev => ({ ...prev, [day]: { ...prev[day], [field]: val } }));
  }

  async function save() {
    setLoading(true); setSaved(false);
    try {
      await api.patch(`/restaurants/${r.id}`, { openingHours: hours });
      await qc.invalidateQueries({ queryKey: ["my-restaurant"] });
      setSaved(true); setTimeout(() => setSaved(false), 3000);
    } finally { setLoading(false); }
  }

  return (
    <div className="space-y-4 max-w-md">
      <p className="text-xs text-text-3">Horaires d'ouverture pour chaque jour de la semaine.</p>
      <div className="card divide-y divide-border/60 p-0 overflow-hidden">
        {DAYS.map(({ key, label }) => {
          const d = hours[key] ?? DEFAULT_HOURS.lun;
          return (
            <div key={key} className={`flex items-center gap-3 px-4 py-3 ${d.closed ? "opacity-50" : ""}`}>
              <span className="w-8 text-xs font-bold text-text shrink-0">{label.slice(0,3)}</span>
              <input type="time" value={d.open} disabled={d.closed}
                onChange={e => upd(key, "open", e.target.value)}
                className="flex-1 px-2 py-1.5 rounded-lg border border-border bg-surface text-xs text-text disabled:opacity-40 outline-none focus:border-accent/60" />
              <span className="text-xs text-text-3">→</span>
              <input type="time" value={d.close} disabled={d.closed}
                onChange={e => upd(key, "close", e.target.value)}
                className="flex-1 px-2 py-1.5 rounded-lg border border-border bg-surface text-xs text-text disabled:opacity-40 outline-none focus:border-accent/60" />
              <button type="button" onClick={() => upd(key, "closed", !d.closed)}
                className={`shrink-0 px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-all ${d.closed ? "bg-red-50 dark:bg-red-900/20 text-red-500 border-red-200" : "bg-green-50 dark:bg-green-900/20 text-green-600 border-green-200"}`}>
                {d.closed ? "Fermé" : "Ouvert"}
              </button>
            </div>
          );
        })}
      </div>
      {saved && <p className="text-xs font-semibold text-green-600 bg-green-50 dark:bg-green-900/20 rounded-xl px-4 py-3">✅ Horaires enregistrés</p>}
      <Button variant="accent" fullWidth loading={loading} onClick={save}>Enregistrer les horaires</Button>
    </div>
  );
}
