import { useState, FormEvent, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { QRCodeSVG, QRCodeCanvas } from "qrcode.react";
import { ImageUpload } from "@/components/ui/ImageUpload";
import { Restaurant, TIER_COLOR, CATEGORIES } from "./shared";

export function InfosTab({ r }: { r: Restaurant }) {
  const qc = useQueryClient();
  const [name,    setName]  = useState(r.name);
  const [desc,    setDesc]  = useState(r.description ?? "");
  const [address, setAddr]  = useState(r.address);
  const [city,    setCity]  = useState(r.city);
  const [phone,   setPhone] = useState(r.phone ?? "");
  const [img,     setImg]   = useState(r.imageUrl ?? "");
  const [cats,    setCats]  = useState<string[]>(r.categories);
  const [range,   setRange] = useState(r.priceRange);
  const [isOpen,  setOpen]  = useState(r.isOpen);
  const [restType, setRestType] = useState(r.restaurantType ?? "SUR_PLACE");
  const [loading, setLoad]  = useState(false);
  const [saved,   setSaved] = useState(false);
  const [err,     setErr]   = useState("");

  useEffect(() => {
    setName(r.name); setDesc(r.description ?? ""); setAddr(r.address);
    setCity(r.city); setPhone(r.phone ?? ""); setImg(r.imageUrl ?? "");
    setCats(r.categories); setRange(r.priceRange); setOpen(r.isOpen);
    setRestType(r.restaurantType ?? "SUR_PLACE");
  }, [r]);

  async function save(e: FormEvent) {
    e.preventDefault();
    setLoad(true); setErr(""); setSaved(false);
    try {
      await api.patch(`/restaurants/${r.id}`, {
        name, description: desc, address, city,
        phone: phone || undefined, imageUrl: img || undefined,
        categories: cats, priceRange: range, isOpen,
        restaurantType: restType,
      });
      await qc.invalidateQueries({ queryKey: ["my-restaurant"] });
      setSaved(true); setTimeout(() => setSaved(false), 3000);
    } catch (e: any) { setErr(e.message ?? "Erreur"); }
    finally { setLoad(false); }
  }

  return (
    <form onSubmit={save} className="space-y-5 max-w-xl">
      {/* Abonnement */}
      <div className="flex items-center justify-between px-4 py-3 rounded-2xl bg-surface border border-border">
        <div>
          <p className="text-[11px] font-bold text-text-3 uppercase tracking-wide">Abonnement</p>
          <p className="text-xs text-text-2 mt-0.5">Contactez un admin pour modifier</p>
        </div>
        <span className={`px-3 py-1 rounded-lg text-[11px] font-black uppercase tracking-wider ${TIER_COLOR[r.subscription] ?? ""}`}>
          {r.subscription}
        </span>
      </div>

      {/* QR Code menu */}
      {(() => {
        const qrUrl = `${window.location.origin}/r/${r.id}`;
        const isDom = r.subscription === "DOMINATION";
        const qrColor = (isDom && r.primaryColor) ? r.primaryColor : "#000000";
        const hasLogo = isDom && !!r.customLogoUrl;
        return (
          <div className="rounded-2xl bg-surface border border-border p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold text-text-3 uppercase tracking-wide">QR Code menu</p>
                <p className="text-xs text-text-2 mt-0.5">Imprimez et placez sur les tables</p>
              </div>
              {isDom && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300">
                  👑 Brandé
                </span>
              )}
            </div>
            <div className="flex flex-col items-center gap-3">
              <div className="p-4 bg-white rounded-2xl shadow-card">
                <QRCodeSVG
                  value={qrUrl}
                  size={160}
                  level={hasLogo ? "H" : "M"}
                  fgColor={qrColor}
                  includeMargin={false}
                  imageSettings={hasLogo ? {
                    src: r.customLogoUrl!,
                    height: 38,
                    width: 38,
                    excavate: true,
                    crossOrigin: "anonymous",
                  } : undefined}
                />
              </div>
              {/* Canvas caché PNG */}
              <div className="hidden">
                <QRCodeCanvas
                  id="infos-qr-canvas"
                  value={qrUrl}
                  size={400}
                  level={hasLogo ? "H" : "M"}
                  fgColor={qrColor}
                  includeMargin
                  imageSettings={hasLogo ? {
                    src: r.customLogoUrl!,
                    height: 96,
                    width: 96,
                    excavate: true,
                    crossOrigin: "anonymous",
                  } : undefined}
                />
              </div>
              <p className="text-[10px] text-text-3 text-center break-all">{qrUrl}</p>
              <div className="flex gap-2 w-full">
                <button
                  type="button"
                  onClick={() => navigator.clipboard?.writeText(qrUrl).then(() => alert("Lien copié !"))}
                  className="flex-1 py-2 rounded-xl bg-surface-2 border border-border text-xs font-bold text-text-2 hover:bg-surface transition-colors"
                >
                  🔗 Copier le lien
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const canvas = document.getElementById("infos-qr-canvas") as HTMLCanvasElement;
                    if (!canvas) return;
                    const a = document.createElement("a");
                    a.href = canvas.toDataURL("image/png");
                    a.download = `qr-${r.name.toLowerCase().replace(/\s+/g, "-")}.png`;
                    a.click();
                  }}
                  className="flex-1 py-2 rounded-xl bg-accent/10 text-accent text-xs font-bold hover:bg-accent/20 transition-colors"
                >
                  ⬇ Télécharger
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Toggle ouvert */}
      <div className="flex items-center justify-between px-4 py-3.5 rounded-2xl border border-border bg-surface">
        <div>
          <p className="text-sm font-semibold text-text">Restaurant ouvert</p>
          <p className="text-xs text-text-3 mt-0.5">Visible dans les recherches</p>
        </div>
        <button type="button" onClick={() => setOpen(v => !v)}
          className={`relative w-11 h-6 rounded-full transition-colors ${isOpen ? "bg-green-500" : "bg-zinc-300 dark:bg-zinc-600"}`}>
          <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${isOpen ? "translate-x-5" : "translate-x-0.5"}`} />
        </button>
      </div>

      {/* Type de service */}
      <div className="space-y-2">
        <label className="text-xs font-bold text-text-3 uppercase tracking-wide">Type de service</label>
        <div className="grid grid-cols-3 gap-2">
          {(["SUR_PLACE", "LIVRAISON", "LES_DEUX"] as const).map(t => {
            const meta: Record<string, { label: string; emoji: string }> = {
              SUR_PLACE: { label: "Sur place",            emoji: "🪑" },
              LIVRAISON: { label: "Livraison",            emoji: "🛵" },
              LES_DEUX:  { label: "Sur place + Livraison",emoji: "🪑🛵" },
            };
            const m = meta[t];
            return (
              <button key={t} type="button" onClick={() => setRestType(t)}
                className={`py-2.5 px-2 rounded-xl text-xs font-bold border transition-all flex flex-col items-center gap-1 ${
                  restType === t
                    ? "bg-accent text-white border-accent"
                    : "border-border text-text-3 hover:border-accent/50"
                }`}>
                <span className="text-base">{m.emoji.split(" ")[0]}</span>
                <span className="leading-tight text-center">{m.label}</span>
              </button>
            );
          })}
        </div>
        {(restType === "LIVRAISON" || restType === "LES_DEUX") && (
          <p className="text-[11px] text-accent font-medium bg-accent/10 rounded-lg px-3 py-2">
            ✅ Commande en ligne activée dès le pack MAMAN
          </p>
        )}
      </div>

      {/* Photo */}
      <ImageUpload
        value={img}
        onChange={setImg}
        shape="wide"
        size="lg"
        label="Photo du restaurant"
        placeholder="Ajouter une photo de couverture"
      />

      {/* Infos */}
      <div className="space-y-3">
        <p className="text-xs font-bold text-text-3 uppercase tracking-wide">Informations</p>
        <Input label="Nom du restaurant" value={name} onChange={e => setName(e.target.value)} required />
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-text-3">Description</label>
          <textarea value={desc} onChange={e => setDesc(e.target.value)} rows={3} placeholder="Décrivez votre restaurant..."
            className="w-full px-4 py-2.5 rounded-xl border border-border bg-surface text-sm text-text outline-none focus:border-accent/60 resize-none" />
        </div>
        <Input label="Téléphone" type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+243 8XX XXX XXX" />
      </div>

      {/* Localisation */}
      <div className="space-y-3">
        <p className="text-xs font-bold text-text-3 uppercase tracking-wide">Localisation</p>
        <Input label="Adresse" value={address} onChange={e => setAddr(e.target.value)} required />
        <Input label="Ville" value={city} onChange={e => setCity(e.target.value)} />
      </div>

      {/* Prix */}
      <div className="space-y-2">
        <p className="text-xs font-bold text-text-3 uppercase tracking-wide">Gamme de prix</p>
        <div className="flex gap-2">
          {[1,2,3].map(p => (
            <button key={p} type="button" onClick={() => setRange(p)}
              className={`flex-1 py-2 rounded-xl text-sm font-bold border transition-all ${range === p ? "bg-accent text-white border-accent" : "border-border text-text-3 hover:border-accent/40"}`}>
              {"$".repeat(p)}
            </button>
          ))}
        </div>
      </div>

      {/* Catégories */}
      <div className="space-y-2">
        <p className="text-xs font-bold text-text-3 uppercase tracking-wide">Catégories</p>
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map(cat => (
            <button key={cat} type="button"
              onClick={() => setCats(p => p.includes(cat) ? p.filter(c => c !== cat) : [...p, cat])}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${cats.includes(cat) ? "bg-accent text-white border-accent" : "border-border text-text-3 hover:border-accent/40"}`}>
              {cat}
            </button>
          ))}
        </div>
      </div>

      {err   && <p className="text-xs font-semibold text-red-600 bg-red-50 dark:bg-red-900/20 rounded-xl px-4 py-3">{err}</p>}
      {saved && <p className="text-xs font-semibold text-green-600 bg-green-50 dark:bg-green-900/20 rounded-xl px-4 py-3">✅ Enregistré</p>}
      <Button type="submit" variant="accent" fullWidth loading={loading}>Enregistrer</Button>
    </form>
  );
}
