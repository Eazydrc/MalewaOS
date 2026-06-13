import { useState, FormEvent, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/Button";
import { QRCodeSVG, QRCodeCanvas } from "qrcode.react";
import { ImageUpload } from "@/components/ui/ImageUpload";
import { Restaurant } from "./shared";

const GOOGLE_FONTS = [
  { id: "default",   label: "Par défaut",    family: "inherit" },
  { id: "Poppins",   label: "Poppins",       family: "'Poppins', sans-serif" },
  { id: "Playfair+Display", label: "Playfair",family: "'Playfair Display', serif" },
  { id: "Montserrat",label: "Montserrat",    family: "'Montserrat', sans-serif" },
  { id: "Lora",      label: "Lora",          family: "'Lora', serif" },
  { id: "Nunito",    label: "Nunito",        family: "'Nunito', sans-serif" },
  { id: "Raleway",   label: "Raleway",       family: "'Raleway', sans-serif" },
  { id: "Oswald",    label: "Oswald",        family: "'Oswald', sans-serif" },
  { id: "Pacifico",  label: "Pacifico",      family: "'Pacifico', cursive" },
  { id: "Inter",     label: "Inter",         family: "'Inter', sans-serif" },
  { id: "Ubuntu",    label: "Ubuntu",        family: "'Ubuntu', sans-serif" },
];

function ColorPicker({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="space-y-1.5">
      <label className="text-[11px] font-bold text-text-3 uppercase tracking-wide">{label}</label>
      <div className="flex items-center gap-2">
        <input type="color" value={value} onChange={e => onChange(e.target.value)}
          className="w-10 h-10 rounded-xl border border-border cursor-pointer bg-surface p-0.5 shrink-0" />
        <input value={value} onChange={e => onChange(e.target.value)} maxLength={7}
          className="flex-1 px-3 py-2 rounded-xl border border-border bg-surface text-sm text-text outline-none focus:border-accent/60 font-mono" />
      </div>
    </div>
  );
}

export function DesignTab({ r }: { r: Restaurant }) {
  const qc = useQueryClient();
  const isDomination = r.subscription === "DOMINATION";

  const [primaryColor,   setPrimary]   = useState(r.primaryColor   ?? "#E85D26");
  const [accentColor,    setAccent]    = useState(r.accentColor     ?? "#E85D26");
  const [secondaryColor, setSecondary] = useState(r.secondaryColor  ?? "#F5F5F5");
  const [bgColor,        setBg]        = useState(r.bgColor         ?? "#FFFFFF");
  const [textColor,      setText]      = useState(r.textColor       ?? "#1A1A1A");
  const [logoUrl,        setLogoUrl]   = useState(r.customLogoUrl   ?? "");
  const [heroUrl,        setHeroUrl]   = useState(r.heroImageUrl    ?? "");
  const [tagline,        setTagline]   = useState(r.tagline         ?? "");
  const [story,          setStory]     = useState(r.story           ?? "");
  const [font,           setFont]      = useState(r.font            ?? "default");
  const [bannerText,     setBannerText]= useState(r.bannerText      ?? "");
  const [bannerImg,      setBannerImg] = useState(r.bannerImageUrl  ?? "");
  const [bannerCta,      setBannerCta] = useState(r.bannerCtaText   ?? "");
  const [gallery,        setGallery]   = useState<string[]>(r.gallery ?? []);
  const [saving, setSaving] = useState(false);
  const [saved,  setSaved]  = useState(false);
  const [err,    setErr]    = useState("");

  // Charger la police sélectionnée dans le DOM
  useEffect(() => {
    const f = GOOGLE_FONTS.find(f => f.id === font);
    if (!f || f.id === "default") return;
    const id = `gfont-${f.id}`;
    if (!document.getElementById(id)) {
      const link = document.createElement("link");
      link.id   = id;
      link.rel  = "stylesheet";
      link.href = `https://fonts.googleapis.com/css2?family=${f.id.replace("+", "+")}:wght@400;600;700;900&display=swap`;
      document.head.appendChild(link);
    }
  }, [font]);

  async function save(e: FormEvent) {
    e.preventDefault(); setErr(""); setSaved(false);
    setSaving(true);
    try {
      await api.patch(`/restaurants/${r.id}`, {
        primaryColor,   accentColor,    secondaryColor, bgColor,  textColor,
        customLogoUrl:  logoUrl  || null,
        heroImageUrl:   heroUrl  || null,
        tagline:        tagline  || null,
        story:          story    || null,
        font:           font === "default" ? null : font,
        bannerText:     bannerText || null,
        bannerImageUrl: bannerImg  || null,
        bannerCtaText:  bannerCta  || null,
        gallery,
      });
      qc.invalidateQueries({ queryKey: ["my-restaurant"] });
      setSaved(true); setTimeout(() => setSaved(false), 3000);
    } catch (e: any) { setErr(e.message ?? "Erreur"); }
    finally { setSaving(false); }
  }

  const fontFamily = GOOGLE_FONTS.find(f => f.id === font)?.family ?? "inherit";

  if (!isDomination) return (
    <div className="card text-center py-16 space-y-4">
      <p className="text-5xl">🎨</p>
      <div>
        <p className="font-black text-text text-base">Design DOMINATION</p>
        <p className="text-sm text-text-3 mt-1.5 leading-relaxed px-4">
          Page publique entièrement brandée — hero, couleurs, police, galerie, histoire, bannière promo.
        </p>
      </div>
      <div className="grid grid-cols-2 gap-2 px-2 text-left">
        {["🖼️ Photo hero plein écran","🎨 Palette couleurs complète","✍️ Police personnalisée","📸 Galerie 20 photos","📖 Section Notre histoire","🏷️ Bannière promotionnelle","🖼️ Logo au centre du QR code","👑 Page à votre image"].map(f => (
          <div key={f} className="flex items-center gap-1.5 text-[11px] text-text-2 font-medium">
            <span>{f}</span>
          </div>
        ))}
      </div>
      <div className="px-4 py-3 rounded-xl bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300 text-xs font-bold">
        👑 Disponible en pack Domination — $45/mois
      </div>
    </div>
  );

  return (
    <form onSubmit={save} className="space-y-5">

      {/* Badge */}
      <div className="flex items-center gap-2">
        <span className="text-[11px] font-black px-3 py-1 rounded-full bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300">👑 DOMINATION</span>
        <p className="text-xs text-text-3">Design personnalisé</p>
      </div>

      {/* ── Aperçu live ── */}
      <div className="card overflow-hidden border border-border">
        <p className="text-[10px] font-bold text-text-3 uppercase tracking-wide px-4 pt-3 pb-2">Aperçu de votre page publique</p>
        <div style={{ background: bgColor, fontFamily, color: textColor }}>
          {/* Hero */}
          <div className="relative h-32 overflow-hidden" style={{ background: primaryColor }}>
            {heroUrl && <img src={heroUrl} alt="" className="absolute inset-0 w-full h-full object-cover" />}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
            <div className="absolute bottom-2 left-3 flex items-center gap-2">
              {logoUrl ? (
                <img src={logoUrl} alt="" className="w-8 h-8 rounded-full object-cover border-2 border-white" />
              ) : (
                <div className="w-8 h-8 rounded-full border-2 border-white flex items-center justify-center font-black text-sm" style={{ background: primaryColor, color: "#fff" }}>
                  {r.name[0]}
                </div>
              )}
              <div>
                <p className="text-white font-black text-xs leading-tight">{r.name}</p>
                {tagline && <p className="text-white/70 text-[9px] leading-tight">{tagline}</p>}
              </div>
            </div>
          </div>
          {/* Bannière promo */}
          {bannerText && (
            <div className="px-3 py-2 text-center text-[11px] font-bold" style={{ background: accentColor, color: "#fff" }}>
              {bannerText} {bannerCta && <span className="underline ml-1">{bannerCta}</span>}
            </div>
          )}
          {/* Boutons */}
          <div className="p-3 flex gap-2">
            <div className="flex-1 py-1.5 rounded-xl text-center text-[10px] font-bold text-white" style={{ background: accentColor }}>🛒 Commander</div>
            <div className="flex-1 py-1.5 rounded-xl text-center text-[10px] font-bold border" style={{ color: primaryColor, borderColor: primaryColor + "66" }}>📅 Réserver</div>
          </div>
        </div>
      </div>

      {/* ── Identité visuelle ── */}
      <div className="card p-4 space-y-4">
        <p className="text-xs font-bold text-text-3 uppercase tracking-wide">Identité visuelle</p>
        <div className="flex gap-4 items-start">
          <div className="space-y-1">
            <p className="text-[11px] font-semibold text-text-2">Logo</p>
            <ImageUpload value={logoUrl} onChange={setLogoUrl} shape="round" size="sm" placeholder="Logo" />
          </div>
          <div className="flex-1">
            <ImageUpload value={heroUrl} onChange={setHeroUrl} shape="wide" size="sm" label="Photo hero" placeholder="Photo de couverture plein écran" />
          </div>
        </div>
        <div className="space-y-1.5">
          <label className="text-[11px] font-bold text-text-3 uppercase tracking-wide">Accroche</label>
          <input value={tagline} onChange={e => setTagline(e.target.value)}
            placeholder="ex: La meilleure cuisine congolaise de Kinshasa"
            className="w-full px-3 py-2.5 rounded-xl border border-border bg-surface text-sm text-text outline-none focus:border-accent/60" />
        </div>
      </div>

      {/* ── Palette couleurs ── */}
      <div className="card p-4 space-y-4">
        <p className="text-xs font-bold text-text-3 uppercase tracking-wide">Palette couleurs</p>
        <div className="grid grid-cols-2 gap-3">
          <ColorPicker label="Principale"  value={primaryColor}   onChange={setPrimary} />
          <ColorPicker label="Accent"      value={accentColor}    onChange={setAccent} />
          <ColorPicker label="Secondaire"  value={secondaryColor} onChange={setSecondary} />
          <ColorPicker label="Fond"        value={bgColor}        onChange={setBg} />
        </div>
        <ColorPicker label="Texte"         value={textColor}      onChange={setText} />
      </div>

      {/* ── Police ── */}
      <div className="card p-4 space-y-3">
        <p className="text-xs font-bold text-text-3 uppercase tracking-wide">Police de caractères</p>
        <div className="grid grid-cols-2 gap-2">
          {GOOGLE_FONTS.map(f => (
            <button key={f.id} type="button" onClick={() => setFont(f.id)}
              className={`px-3 py-2.5 rounded-xl border text-sm text-left transition-all ${font === f.id ? "border-accent bg-accent/5 text-accent font-bold" : "border-border text-text-2 hover:border-accent/40"}`}
              style={{ fontFamily: f.family }}>
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Bannière promo ── */}
      <div className="card p-4 space-y-3">
        <p className="text-xs font-bold text-text-3 uppercase tracking-wide">Bannière promotionnelle</p>
        <input value={bannerText} onChange={e => setBannerText(e.target.value)}
          placeholder="ex: -20% ce weekend sur toutes les grillades 🔥"
          className="w-full px-3 py-2.5 rounded-xl border border-border bg-surface text-sm text-text outline-none focus:border-accent/60" />
        <input value={bannerCta} onChange={e => setBannerCta(e.target.value)}
          placeholder="Texte du bouton (ex: En profiter →)"
          className="w-full px-3 py-2.5 rounded-xl border border-border bg-surface text-sm text-text outline-none focus:border-accent/60" />
        <ImageUpload value={bannerImg} onChange={setBannerImg} shape="wide" size="sm" placeholder="Image de bannière (optionnel)" />
      </div>

      {/* ── Notre histoire ── */}
      <div className="card p-4 space-y-3">
        <p className="text-xs font-bold text-text-3 uppercase tracking-wide">Notre histoire</p>
        <p className="text-[11px] text-text-3">Ce texte apparaît en section storytelling sur votre page publique.</p>
        <textarea value={story} onChange={e => setStory(e.target.value)} rows={5}
          placeholder="Racontez l'histoire de votre restaurant — vos origines, votre passion, votre équipe..."
          className="w-full px-3 py-2.5 rounded-xl border border-border bg-surface text-sm text-text outline-none focus:border-accent/60 resize-none leading-relaxed" />
      </div>

      {/* ── Galerie photos ── */}
      <div className="card p-4 space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-xs font-bold text-text-3 uppercase tracking-wide">Galerie photos</p>
          <span className="text-[10px] text-text-3">{gallery.length}/20</span>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {gallery.map((url, i) => (
            <div key={i} className="relative aspect-square rounded-xl overflow-hidden bg-surface-2 group">
              <img src={url} alt="" className="w-full h-full object-cover" />
              <button type="button"
                onClick={() => setGallery(g => g.filter((_, j) => j !== i))}
                className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/60 text-white text-[10px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                ✕
              </button>
            </div>
          ))}
          {gallery.length < 20 && (
            <ImageUpload
              shape="square" size="sm"
              placeholder="+"
              onChange={url => { if (url) setGallery(g => [...g, url]); }}
            />
          )}
        </div>
        {gallery.length === 0 && (
          <p className="text-[11px] text-text-3">Ajoutez jusqu'à 20 photos pour montrer l'ambiance de votre restaurant.</p>
        )}
      </div>

      {/* ── QR Code brandé ── */}
      <div className="card p-4 space-y-3">
        <div>
          <p className="text-xs font-bold text-text-3 uppercase tracking-wide">QR Code brandé</p>
          <p className="text-[11px] text-text-3 mt-0.5">
            Votre QR code aux couleurs de votre restaurant{logoUrl ? ", avec votre logo au centre" : " — ajoutez un logo pour le personnaliser davantage"}.
          </p>
        </div>
        <div className="flex flex-col items-center gap-3">
          {/* Aperçu visible */}
          <div className="p-4 bg-white rounded-2xl shadow-card">
            <QRCodeSVG
              value={`${window.location.origin}/r/${r.id}`}
              size={180}
              level="H"
              fgColor={primaryColor}
              includeMargin={false}
              imageSettings={logoUrl ? {
                src: logoUrl,
                height: 44,
                width: 44,
                excavate: true,
                crossOrigin: "anonymous",
              } : undefined}
            />
          </div>
          {/* Canvas caché pour export PNG */}
          <div className="hidden">
            <QRCodeCanvas
              id="branded-qr-canvas"
              value={`${window.location.origin}/r/${r.id}`}
              size={512}
              level="H"
              fgColor={primaryColor}
              includeMargin
              imageSettings={logoUrl ? {
                src: logoUrl,
                height: 128,
                width: 128,
                excavate: true,
                crossOrigin: "anonymous",
              } : undefined}
            />
          </div>
          <button
            type="button"
            onClick={() => {
              const canvas = document.getElementById("branded-qr-canvas") as HTMLCanvasElement;
              if (!canvas) return;
              const a = document.createElement("a");
              a.href = canvas.toDataURL("image/png");
              a.download = `qr-${r.name.toLowerCase().replace(/\s+/g, "-")}.png`;
              a.click();
            }}
            className="w-full py-2.5 rounded-xl bg-accent/10 text-accent text-xs font-bold hover:bg-accent/20 transition-colors"
          >
            ⬇ Télécharger le QR code (PNG)
          </button>
        </div>
      </div>

      {err   && <p className="text-xs text-red-600 bg-red-50 dark:bg-red-900/20 rounded-xl px-3 py-2">{err}</p>}
      {saved && <p className="text-xs text-green-700 bg-green-50 dark:bg-green-900/20 rounded-xl px-3 py-2">✅ Design sauvegardé — visible sur votre page publique !</p>}
      <Button type="submit" variant="accent" loading={saving} fullWidth>Sauvegarder le design</Button>
    </form>
  );
}
