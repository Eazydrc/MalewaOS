import { useState, FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { useMyOffers, useCreateOffer, useUpdateOffer, useDeleteOffer } from "@/hooks/useOffers";
import { ESSENTIEL_TIERS, OFFER_TYPE_LABEL, OFFER_TYPE_COLOR } from "./shared";

export function OffresTab({ subscription }: { subscription: string }) {
  const { data: offers, isLoading } = useMyOffers();
  const createOffer = useCreateOffer();
  const updateOffer = useUpdateOffer();
  const deleteOffer = useDeleteOffer();

  const isEssentiel = ESSENTIEL_TIERS.includes(subscription);

  const [showForm, setShowForm] = useState(false);
  const [title,    setTitle]    = useState("");
  const [desc,     setDesc]     = useState("");
  const [type,     setType]     = useState<"PROMO"|"POINTS"|"FLASH">("PROMO");
  const [discount, setDiscount] = useState("");
  const [points,   setPoints]   = useState("");
  const [expires,  setExpires]  = useState("");
  const [maxUses,  setMaxUses]  = useState("");
  const [formErr,  setFormErr]  = useState("");

  if (!isEssentiel) {
    return (
      <div className="card text-center py-16 max-w-md">
        <p className="text-4xl mb-3">🎟️</p>
        <p className="font-black text-text text-base">Offres & Promotions</p>
        <p className="text-sm text-text-3 mt-2 max-w-xs mx-auto">Créez des promotions, offres points et flash deals pour fidéliser vos clients.</p>
        <p className="mt-6 px-4 py-2 rounded-xl bg-sky-50 dark:bg-sky-900/20 text-sky-700 dark:text-sky-300 text-xs font-bold inline-block">Disponible dès le pack Essentiel</p>
      </div>
    );
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    setFormErr("");
    if (!title.trim() || !desc.trim() || !expires) { setFormErr("Champs obligatoires manquants"); return; }
    try {
      await createOffer.mutateAsync({
        title: title.trim(), description: desc.trim(), type,
        discountPct:  type === "PROMO"  ? (discount ? Number(discount) : undefined) : undefined,
        pointsCost:   type === "POINTS" ? (points   ? Number(points)   : undefined) : undefined,
        expiresAt:    expires,
        maxUses:      maxUses ? Number(maxUses) : undefined,
      });
      setTitle(""); setDesc(""); setType("PROMO"); setDiscount(""); setPoints(""); setExpires(""); setMaxUses("");
      setShowForm(false);
    } catch (e: any) { setFormErr(e.message ?? "Erreur"); }
  }

  if (isLoading) return <div className="space-y-3">{[1,2].map(i => <Skeleton key={i} height={90} />)}</div>;

  const active  = offers?.filter(o => o.isActive && new Date(o.expiresAt) > new Date()) ?? [];
  const expired = offers?.filter(o => !o.isActive || new Date(o.expiresAt) <= new Date()) ?? [];

  return (
    <div className="space-y-5 max-w-2xl">
      <div className="flex items-center justify-between">
        <p className="text-sm font-bold text-text">{offers?.length ?? 0} offre{(offers?.length ?? 0) !== 1 ? "s" : ""}</p>
        <Button size="sm" variant="accent" onClick={() => setShowForm(v => !v)}>
          {showForm ? "✕ Annuler" : "+ Nouvelle offre"}
        </Button>
      </div>

      {showForm && (
        <form onSubmit={submit} className="card space-y-3 p-4">
          <p className="text-sm font-bold text-text">Créer une offre</p>

          {/* Type */}
          <div className="flex gap-2">
            {(["PROMO","POINTS","FLASH"] as const).map(t => (
              <button key={t} type="button" onClick={() => setType(t)}
                className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-all ${type === t ? "bg-accent text-white border-accent" : "border-border text-text-3 hover:border-accent/40"}`}>
                {t === "PROMO" ? "🏷️ Promo" : t === "POINTS" ? "⭐ Points" : "⚡ Flash"}
              </button>
            ))}
          </div>

          <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Titre de l'offre *" required
            className="w-full px-3 py-2.5 rounded-xl border border-border bg-surface text-sm text-text outline-none focus:border-accent/60" />
          <textarea value={desc} onChange={e => setDesc(e.target.value)} rows={2} placeholder="Description *" required
            className="w-full px-3 py-2.5 rounded-xl border border-border bg-surface text-sm text-text outline-none focus:border-accent/60 resize-none" />

          <div className="grid grid-cols-2 gap-2">
            {type === "PROMO"  && <input type="number" min="1" max="100" value={discount} onChange={e => setDiscount(e.target.value)} placeholder="Réduction %" className="col-span-2 px-3 py-2.5 rounded-xl border border-border bg-surface text-sm text-text outline-none focus:border-accent/60" />}
            {type === "POINTS" && <input type="number" min="1" value={points} onChange={e => setPoints(e.target.value)} placeholder="Coût en points" className="col-span-2 px-3 py-2.5 rounded-xl border border-border bg-surface text-sm text-text outline-none focus:border-accent/60" />}
            <div className="col-span-2 space-y-1">
              <label className="text-[11px] font-bold text-text-3">Date d'expiration *</label>
              <input type="datetime-local" value={expires} onChange={e => setExpires(e.target.value)} required
                className="w-full px-3 py-2.5 rounded-xl border border-border bg-surface text-sm text-text outline-none focus:border-accent/60" />
            </div>
            <input type="number" min="1" value={maxUses} onChange={e => setMaxUses(e.target.value)} placeholder="Max utilisations (opt)"
              className="col-span-2 px-3 py-2.5 rounded-xl border border-border bg-surface text-sm text-text outline-none focus:border-accent/60" />
          </div>

          {formErr && <p className="text-xs text-red-600 bg-red-50 dark:bg-red-900/20 rounded-xl px-3 py-2">{formErr}</p>}
          <Button type="submit" size="sm" variant="accent" loading={createOffer.isPending} fullWidth>Créer l'offre</Button>
        </form>
      )}

      {/* Actives */}
      {active.length > 0 && (
        <section className="space-y-3">
          <p className="text-[11px] font-bold text-text-3 uppercase tracking-wide">✅ Actives ({active.length})</p>
          {active.map(o => (
            <div key={o.id} className="card p-4 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-bold text-text text-sm">{o.title}</p>
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${OFFER_TYPE_COLOR[o.type]}`}>{OFFER_TYPE_LABEL[o.type]}</span>
                  </div>
                  <p className="text-xs text-text-3 mt-0.5 line-clamp-2">{o.description}</p>
                  <div className="flex flex-wrap gap-3 mt-1 text-[11px] text-text-3">
                    {o.discountPct  && <span>🏷️ -{o.discountPct}%</span>}
                    {o.pointsCost   && <span>⭐ {o.pointsCost} pts</span>}
                    {o.maxUses      && <span>🔢 {o.usedCount}/{o.maxUses} utilisations</span>}
                    <span>📅 Exp. {new Date(o.expiresAt).toLocaleDateString("fr-FR")}</span>
                  </div>
                </div>
                <div className="flex gap-1 shrink-0">
                  <button onClick={() => updateOffer.mutate({ id: o.id, isActive: false })}
                    className="p-1.5 rounded-lg text-xs text-text-3 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors" title="Désactiver">⏸️</button>
                  <button onClick={() => deleteOffer.mutate(o.id)}
                    className="p-1.5 rounded-lg text-xs text-text-3 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors" title="Supprimer">🗑️</button>
                </div>
              </div>
            </div>
          ))}
        </section>
      )}

      {/* Inactives/expirées */}
      {expired.length > 0 && (
        <section className="space-y-3">
          <p className="text-[11px] font-bold text-text-3 uppercase tracking-wide">📋 Expirées / Inactives ({expired.length})</p>
          {expired.map(o => (
            <div key={o.id} className="card p-4 opacity-60 space-y-1">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-text text-sm">{o.title}</p>
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${OFFER_TYPE_COLOR[o.type]}`}>{OFFER_TYPE_LABEL[o.type]}</span>
                  </div>
                  <p className="text-[11px] text-text-3 mt-0.5">Exp. {new Date(o.expiresAt).toLocaleDateString("fr-FR")} · {o.usedCount} util.</p>
                </div>
                <button onClick={() => deleteOffer.mutate(o.id)}
                  className="p-1.5 rounded-lg text-text-3 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">🗑️</button>
              </div>
            </div>
          ))}
        </section>
      )}

      {!offers?.length && !showForm && (
        <div className="card text-center py-16">
          <p className="text-4xl mb-3">🎟️</p>
          <p className="font-semibold text-text">Aucune offre</p>
          <p className="text-sm text-text-3 mt-1">Créez votre première promotion pour attirer des clients.</p>
        </div>
      )}
    </div>
  );
}
