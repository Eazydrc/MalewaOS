import type { CSSProperties } from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { usePublicOffers } from "@/hooks/useOffers";

// Page publique — aucune auth requise, accessible via QR code

const API = import.meta.env.VITE_API_URL ?? "http://localhost:3001/api/v1";
const ESSENTIEL_TIERS = ["ESSENTIEL", "CROISSANCE", "DOMINATION"];

const OFFER_TYPE_COLOR: Record<string, string> = {
  PROMO:  "bg-sky-50 dark:bg-sky-900/20 text-sky-700 dark:text-sky-300 border-sky-200 dark:border-sky-800",
  POINTS: "bg-violet-50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-300 border-violet-200 dark:border-violet-800",
  FLASH:  "bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-800",
};

function fc(cents: number) {
  return `$${(cents / 100).toFixed(2)}`;
}

function StarIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" stroke="none">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
    </svg>
  );
}

function OffersSection({ restaurantId }: { restaurantId: string }) {
  const { data: offers } = usePublicOffers(restaurantId);
  const active = offers?.filter(o => o.isActive && new Date(o.expiresAt) > new Date()) ?? [];
  if (!active.length) return null;
  return (
    <div className="px-4 mt-3">
      <p className="text-[11px] font-bold text-text-3 uppercase tracking-widest mb-2">🎟️ Offres en cours</p>
      <div className="grid grid-cols-1 gap-2">
        {active.map(o => (
          <div key={o.id} className={`border rounded-2xl p-3 space-y-1 ${OFFER_TYPE_COLOR[o.type] ?? ""}`}>
            <p className="font-black text-sm leading-tight">{o.title}</p>
            <p className="text-xs opacity-80 line-clamp-2">{o.description}</p>
            <div className="flex items-center gap-2 flex-wrap pt-0.5 text-[10px] font-bold opacity-70">
              {o.discountPct  && <span>-{o.discountPct}% de réduction</span>}
              {o.pointsCost   && <span>⭐ {o.pointsCost} points</span>}
              <span>Jusqu'au {new Date(o.expiresAt).toLocaleDateString("fr-FR")}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function PublicMenuPage() {
  const { restaurantId } = useParams<{ restaurantId: string }>();

  const { data, isLoading, isError } = useQuery({
    queryKey: ["public-menu", restaurantId],
    queryFn: async () => {
      const res = await fetch(`${API}/menu/public/${restaurantId}`);
      if (!res.ok) throw new Error("Restaurant introuvable");
      return res.json() as Promise<{ restaurant: any; menu: any }>;
    },
    enabled: !!restaurantId,
    staleTime: 2 * 60 * 1000,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-accent border-t-transparent animate-spin" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="min-h-screen bg-bg flex flex-col items-center justify-center gap-3 p-6 text-center">
        <p className="text-4xl">🍽️</p>
        <p className="font-bold text-text">Restaurant introuvable</p>
        <p className="text-sm text-text-3">Le QR code ne correspond à aucun restaurant actif.</p>
      </div>
    );
  }

  const { restaurant, menu } = data;
  const hasOffers  = ESSENTIEL_TIERS.includes(restaurant.subscription);
  const customLogo = restaurant.customLogoUrl ?? null;

  // Validate hex colors before injecting as CSS vars (prevent XSS / open redirect)
  const isHex = (v: string | null): v is string => !!v && /^#[0-9A-Fa-f]{6}$/.test(v);
  const primary = isHex(restaurant.primaryColor) ? restaurant.primaryColor : null;
  const accent  = isHex(restaurant.accentColor)  ? restaurant.accentColor  : null;

  // CSS vars override — only for DOMINATION restaurants with custom colors
  const brandVars = primary ? ({
    "--brand-primary": primary,
    "--brand-accent":  accent ?? primary,
  } as CSSProperties) : {};

  return (
    <div className="min-h-screen bg-bg" style={brandVars}>

      {/* ── Header restaurant ── */}
      <div className="relative">
        {restaurant.imageUrl ? (
          <div className="h-44 overflow-hidden">
            <img src={restaurant.imageUrl} alt={restaurant.name} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
          </div>
        ) : (
          <div
            className={`h-32 flex items-center px-5 gap-4${!primary ? " bg-gradient-to-br from-accent/20 to-accent/5" : ""}`}
            style={primary ? { background: primary } : undefined}>
            {customLogo && (
              <img src={customLogo} alt="Logo" className="h-16 w-16 rounded-2xl object-cover shadow-lg bg-white/20" />
            )}
          </div>
        )}

        <div className={`absolute bottom-0 left-0 right-0 p-4 ${restaurant.imageUrl ? "text-white" : "text-text"}`}>
          <div className="flex items-end justify-between gap-2">
            <div className="min-w-0">
              <h1 className="text-xl font-black truncate">{restaurant.name}</h1>
              <p className={`text-xs mt-0.5 truncate ${restaurant.imageUrl ? "text-white/80" : "text-text-3"}`}>
                {restaurant.address}
              </p>
            </div>
            <div className="shrink-0 flex flex-col items-end gap-1">
              <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                restaurant.isOpen
                  ? "bg-green-500 text-white"
                  : "bg-zinc-600 text-white"
              }`}>
                {restaurant.isOpen ? "🟢 Ouvert" : "🔴 Fermé"}
              </span>
              {restaurant.rating > 0 && (
                <span className={`flex items-center gap-1 text-xs font-semibold ${restaurant.imageUrl ? "text-white/90" : "text-text-2"}`}>
                  <StarIcon /> {restaurant.rating.toFixed(1)}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Infos rapides ── */}
      {restaurant.categories?.length > 0 && (
        <div className="px-4 py-3 flex gap-2 flex-wrap">
          {restaurant.categories.map((cat: string) => (
            <span key={cat} className="px-3 py-1 bg-surface-2 rounded-full text-xs font-medium text-text-2">
              {cat}
            </span>
          ))}
        </div>
      )}

      {/* ── Description + localisation ── */}
      {(restaurant.description || restaurant.address || restaurant.structuredAddress || restaurant.phone) && (
        <div className="px-4 pb-3 space-y-2">
          {restaurant.description && (
            <p className="text-sm text-text-2 leading-relaxed">{restaurant.description}</p>
          )}
          {(restaurant.structuredAddress?.commune || restaurant.structuredAddress?.quartier || restaurant.address) && (
            <div className="flex items-start gap-2 text-xs text-text-2">
              <span className="text-sm shrink-0">📍</span>
              <span>
                {restaurant.structuredAddress?.commune || restaurant.structuredAddress?.quartier
                  ? [
                      restaurant.structuredAddress?.numero,
                      restaurant.structuredAddress?.quartier,
                      restaurant.structuredAddress?.commune,
                    ].filter(Boolean).join(', ')
                  : restaurant.address}
                {restaurant.structuredAddress?.reference && (
                  <span className="block text-text-3 italic mt-0.5">{restaurant.structuredAddress.reference}</span>
                )}
              </span>
            </div>
          )}
          {restaurant.phone && (
            <a href={`tel:${restaurant.phone}`} className="flex items-center gap-2 text-xs text-accent font-semibold">
              <span className="text-sm">📞</span>{restaurant.phone}
            </a>
          )}
        </div>
      )}

      {/* ── Offres ESSENTIEL+ ── */}
      {hasOffers && restaurantId && <OffersSection restaurantId={restaurantId} />}

      {/* ── Navigation rapide par section ── */}
      {menu?.sections?.length > 1 && (
        <div className="sticky top-0 z-10 bg-bg/95 backdrop-blur border-b border-border px-4 py-2 flex gap-2 flex-wrap">
          {menu.sections.map((section: any) => (
            <a
              key={section.id}
              href={`#section-${section.id}`}
              onClick={(e) => {
                e.preventDefault();
                document.getElementById(`section-${section.id}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
              }}
              className="px-3 py-1.5 bg-surface-2 rounded-full text-xs font-bold text-text-2 hover:text-accent hover:bg-accent/10 transition-colors"
            >
              {section.title}
            </a>
          ))}
        </div>
      )}

      {/* ── Menu ── */}
      <div className="px-4 pb-24 space-y-6 mt-2">
        {(!menu || menu.sections?.length === 0) ? (
          <div className="py-16 text-center">
            <p className="text-3xl mb-3">🍽️</p>
            <p className="text-sm font-semibold text-text-2">Menu en cours de préparation</p>
            <p className="text-xs text-text-3 mt-1">Revenez bientôt !</p>
          </div>
        ) : (
          menu.sections.map((section: any) => (
            <div key={section.id} id={`section-${section.id}`} className="scroll-mt-16">
              {/* Titre section */}
              <div className="flex items-center gap-3 mb-3">
                <h2 className="text-base font-black text-text">{section.title}</h2>
                <div className="flex-1 h-px bg-border" />
                <span className="text-xs text-text-3">{section.items.length} plats</span>
              </div>

              {/* Items — texte à gauche, photo à droite (façon Uber Eats) */}
              <div className="divide-y divide-border">
                {section.items.map((item: any) => (
                  <div key={item.id} className="flex items-start gap-3 py-4">
                    {/* Infos */}
                    <div className="flex-1 min-w-0 space-y-1">
                      <p className="font-bold text-text text-sm leading-tight">{item.name}</p>
                      {item.description && (
                        <p className="text-xs text-text-3 line-clamp-2">{item.description}</p>
                      )}
                      {item.promoPrice != null ? (
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm font-semibold text-text">{fc(item.promoPrice)}</span>
                          <span className="text-xs text-text-3 line-through">{fc(item.priceUsdCents)}</span>
                        </div>
                      ) : (
                        <span className="text-sm font-semibold text-text">{fc(item.priceUsdCents)}</span>
                      )}
                      <div className="flex flex-wrap gap-1.5 pt-0.5">
                        {item.isHot && (
                          <span className="px-1.5 py-0.5 bg-surface-2 text-text-2 rounded text-[10px] font-bold">🔥 Populaire</span>
                        )}
                        {item.isLastUnits && (
                          <span className="px-1.5 py-0.5 bg-surface-2 text-text-2 rounded text-[10px] font-bold">⚡ Derniers</span>
                        )}
                      </div>
                    </div>

                    {/* Image */}
                    <div className="w-24 h-24 rounded-xl overflow-hidden shrink-0 bg-surface-2">
                      {item.imageUrl ? (
                        <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-2xl">🍽️</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      {/* ── Footer ── */}
      <div className="fixed bottom-0 left-0 right-0 bg-bg/90 backdrop-blur border-t border-border px-4 py-3">
        <p className="text-center text-xs text-text-3">
          Propulsé par <span className="font-bold text-accent">Elengi</span> 🍽️
        </p>
      </div>
    </div>
  );
}
