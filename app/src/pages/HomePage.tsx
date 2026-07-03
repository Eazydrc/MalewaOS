import { useState, useCallback, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { useAuthStore } from "@/store/auth.store";
import { useHomeFeed } from "@/hooks/useHome";
import { formatPrice } from "@/lib/constants";
import { MapPin, Star, ChevronRight, Search } from "lucide-react";

// ── Carrousel auto-boucle ──────────────────────────────────────────────────────
function AutoCarousel({ items, renderSlide, interval = 4000 }: {
  items: any[];
  renderSlide: (item: any) => React.ReactNode;
  interval?: number;
}) {
  const [idx, setIdx]   = useState(0);
  const timer           = useRef<ReturnType<typeof setInterval> | null>(null);
  const touchX          = useRef<number | null>(null);

  const go = useCallback((n: number) => setIdx((c) => (c + n + items.length) % items.length), [items.length]);

  function resetTimer() {
    if (timer.current) clearInterval(timer.current);
    if (items.length > 1) timer.current = setInterval(() => go(1), interval);
  }

  useEffect(() => {
    if (items.length <= 1) return;
    timer.current = setInterval(() => go(1), interval);
    return () => { if (timer.current) clearInterval(timer.current); };
  }, [items.length, interval]);

  if (!items.length) return null;

  return (
    <div className="relative"
      onTouchStart={e => { touchX.current = e.touches[0].clientX; }}
      onTouchEnd={e => {
        if (touchX.current === null) return;
        const d = touchX.current - e.changedTouches[0].clientX;
        if (Math.abs(d) > 40) { go(d > 0 ? 1 : -1); resetTimer(); }
        touchX.current = null;
      }}>
      {renderSlide(items[idx])}
      {items.length > 1 && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
          {items.map((_, i) => (
            <button key={i} onClick={() => { setIdx(i); resetTimer(); }}
              className="rounded-full transition-all duration-300"
              style={{
                width: i === idx ? 18 : 6, height: 6,
                background: i === idx ? 'rgb(var(--color-accent))' : 'rgba(255,255,255,0.35)',
              }} />
          ))}
        </div>
      )}
    </div>
  );
}

// ── Banner promo ───────────────────────────────────────────────────────────────
function PromoBanner({ item, onClick }: { item: any; onClick: () => void }) {
  const isOffer = !!item.type;
  return (
    <button onClick={onClick} className="w-full no-tap active:opacity-90 transition-opacity">
      <div className="relative rounded-2xl overflow-hidden" style={{ height: 200 }}>
        {(item.imageUrl || item.restaurant?.imageUrl) ? (
          <img src={item.imageUrl ?? item.restaurant?.imageUrl} alt={item.name ?? item.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-5xl bg-surface-2">
            {isOffer ? '🏷️' : '🍽️'}
          </div>
        )}
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.1) 55%, transparent 100%)' }} />

        <div className="absolute top-3 left-3 flex gap-1.5">
          {isOffer ? (
            item.discountPct ? (
              <span className="px-2.5 py-1 rounded-full text-[10px] font-black text-white" style={{ background: '#ef4444' }}>-{item.discountPct}% OFF</span>
            ) : item.type === 'FLASH' ? (
              <span className="px-2.5 py-1 rounded-full text-[10px] font-black text-white" style={{ background: '#f97316' }}>⚡ FLASH</span>
            ) : (
              <span className="px-2.5 py-1 rounded-full text-[10px] font-black text-white" style={{ background: '#f59e0b' }}>⭐ POINTS</span>
            )
          ) : (
            <span className="px-2.5 py-1 rounded-full text-[10px] font-black text-white" style={{ background: '#f59e0b' }}>✨ Plat du jour</span>
          )}
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-4 text-left">
          {item.restaurant?.name && (
            <p className="text-white/60 text-[10px] font-semibold mb-0.5">{item.restaurant.name}</p>
          )}
          <p className="text-white font-black text-lg leading-tight line-clamp-1">
            {item.name ?? item.title ?? 'Offre spéciale'}
          </p>
          {!isOffer && item.priceUsdCents && (
            <p className="text-white/80 text-xs font-semibold mt-0.5">{formatPrice(item.promoPrice ?? item.priceUsdCents).cdf}</p>
          )}
          {isOffer && item.expiresAt && (
            <p className="text-white/60 text-[10px] mt-0.5">
              Expire le {new Date(item.expiresAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
            </p>
          )}
        </div>
      </div>
    </button>
  );
}

// ── Catégories ─────────────────────────────────────────────────────────────────
const CATS = [
  { label: 'Congolais', emoji: '🍲', q: 'congolais' },
  { label: 'Poulet',    emoji: '🍗', q: 'poulet' },
  { label: 'Pizza',     emoji: '🍕', q: 'pizza' },
  { label: 'Grillades', emoji: '🥩', q: 'grillades' },
  { label: 'Poisson',   emoji: '🐟', q: 'poisson' },
  { label: 'Burger',    emoji: '🍔', q: 'burger' },
  { label: 'Desserts',  emoji: '🍰', q: 'desserts' },
  { label: 'Livraison', emoji: '🛵', q: '', type: 'LIVRAISON' },
];

// ── Carte restaurant ───────────────────────────────────────────────────────────
function RestaurantCard({ r, onClick }: { r: any; onClick: () => void }) {
  const stars = r.rating ? Math.round(r.rating * 10) / 10 : null;
  const isOpen = r.isOpen !== false;
  const typeLabel = r.restaurantType === 'LIVRAISON' ? '🛵 Livraison' : r.restaurantType === 'LES_DEUX' ? '🍽️ Sur place & livraison' : '🍽️ Sur place';

  return (
    <button onClick={onClick} className="w-full text-left no-tap active:scale-[0.99] transition-transform">
      <div className="rounded-2xl overflow-hidden" style={{ background: 'rgb(var(--color-surface))', boxShadow: 'var(--shadow-card)' }}>
        <div className="relative" style={{ height: 140 }}>
          {r.imageUrl
            ? <img src={r.imageUrl} alt={r.name} className="w-full h-full object-cover" />
            : <div className="w-full h-full flex items-center justify-center text-4xl bg-surface-2">🏪</div>
          }
          {!isOpen && (
            <div className="absolute inset-0 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.5)' }}>
              <span className="px-3 py-1.5 rounded-full text-xs font-black text-white" style={{ background: 'rgba(0,0,0,0.7)' }}>Fermé</span>
            </div>
          )}
          <div className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-full text-[10px] font-bold text-white"
            style={{ background: 'rgba(0,0,0,0.6)' }}>
            {typeLabel}
          </div>
        </div>

        <div className="px-3 py-2.5">
          <p className="font-black text-sm truncate text-text">{r.name}</p>
          {r.cuisine && <p className="text-xs truncate mt-0.5 text-text-3">{r.cuisine}</p>}
          <div className="flex items-center gap-3 mt-2">
            {stars && (
              <div className="flex items-center gap-1">
                <Star className="w-3 h-3 fill-current text-warning" />
                <span className="text-xs font-bold text-text">{stars.toFixed(1)}</span>
                {r.reviewCount && <span className="text-[10px] text-text-3">({r.reviewCount})</span>}
              </div>
            )}
            {r.address?.commune && (
              <div className="flex items-center gap-1 min-w-0">
                <MapPin className="w-3 h-3 shrink-0 text-text-3" />
                <span className="text-[10px] truncate text-text-3">{r.address.commune}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </button>
  );
}

// ── Page principale ────────────────────────────────────────────────────────────
export default function HomePage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [search, setSearch] = useState('');

  const { data: feed, isLoading } = useHomeFeed();

  const handleSearch = useCallback(() => {
    const q = search.trim();
    navigate(q ? `/search?q=${encodeURIComponent(q)}` : '/search');
  }, [search, navigate]);

  const bannerItems = [
    ...(feed?.dailySpecials ?? []),
    ...(feed?.promoOffers   ?? []),
  ];

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Bonjour' : hour < 18 ? 'Bon après-midi' : 'Bonsoir';
  const firstName = user?.firstName ?? '';

  return (
    <AppLayout noPadding noHeader>
    <div className="min-h-screen bg-bg">

      {/* ── HEADER STICKY ── */}
      <div className="sticky top-0 z-20 px-4 pt-4 pb-3"
        style={{ background: 'rgb(var(--color-bg) / 0.95)', backdropFilter: 'blur(12px)' }}>

        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-xs font-semibold text-text-3">{greeting} 👋</p>
            <p className="text-lg font-black leading-tight text-text">
              {firstName ? firstName : 'Bienvenue sur Elengi'}
            </p>
          </div>
          <button onClick={() => navigate('/profile')}
            className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-black text-white no-tap active:scale-95 transition-transform"
            style={{ background: 'var(--btn-primary)', boxShadow: 'var(--shadow-btn)' }}>
            {user ? `${user.firstName[0]}${user.lastName[0]}` : '?'}
          </button>
        </div>

        <button onClick={() => navigate('/search')}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl no-tap bg-surface-2">
          <Search className="w-4 h-4 shrink-0 text-text-3" />
          <span className="text-sm text-text-3">Restaurant, cuisine, quartier…</span>
          <div className="ml-auto px-2.5 py-1 rounded-lg text-xs font-bold text-white"
            style={{ background: 'rgb(var(--color-accent))' }}>
            Chercher
          </div>
        </button>
      </div>

      <div className="px-4 space-y-6 pt-4 pb-28">

        {/* ── Points fidélité ── */}
        {user && (
          <button onClick={() => navigate('/wallet')} className="w-full no-tap">
            <div className="rounded-2xl p-4 flex items-center justify-between gap-3"
              style={{ background: 'var(--card-gradient)', boxShadow: 'var(--shadow-card)' }}>
              <div>
                <p className="text-xs font-semibold text-text-3">Vos points fidélité</p>
                <p className="text-2xl font-black text-text mt-0.5">
                  {(user.points ?? 0).toLocaleString()} <span className="text-sm font-semibold text-text-3">pts</span>
                </p>
              </div>
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-surface-3">
                <span className="text-2xl">⭐</span>
              </div>
            </div>
          </button>
        )}

        {/* ── Grand carrousel ── */}
        {isLoading ? (
          <div className="rounded-2xl skeleton" style={{ height: 200 }} />
        ) : bannerItems.length > 0 ? (
          <section>
            <AutoCarousel
              items={bannerItems}
              interval={4000}
              renderSlide={(item) => (
                <PromoBanner item={item} onClick={() => {
                  const id = item.restaurant?.id ?? item.restaurantId;
                  if (id) navigate(`/restaurant/${id}`);
                }} />
              )}
            />
          </section>
        ) : null}

        {/* ── Catégories ── */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-black text-text">Parcourir</h2>
          </div>
          <div className="grid grid-cols-4 gap-2.5">
            {CATS.map(cat => (
              <button key={cat.label}
                onClick={() => navigate(`/search?q=${encodeURIComponent(cat.q || cat.label)}`)}
                className="flex flex-col items-center gap-1.5 py-3 rounded-2xl no-tap active:scale-95 transition-transform bg-surface"
                style={{ boxShadow: 'var(--shadow-card)' }}>
                <span className="text-2xl">{cat.emoji}</span>
                <span className="text-[10px] font-bold text-text-2">{cat.label}</span>
              </button>
            ))}
          </div>
        </section>

        {/* ── Restaurants populaires ── */}
        {!isLoading && (feed?.popularRestaurants?.length ?? 0) > 0 && (
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-black text-text">Restaurants populaires</h2>
              <button onClick={() => navigate('/search')} className="flex items-center gap-1 text-xs font-bold no-tap text-accent">
                Tout voir <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {feed!.popularRestaurants.map((r: any) => (
                <RestaurantCard key={r.id} r={r} onClick={() => navigate(`/restaurant/${r.id}`)} />
              ))}
            </div>
          </section>
        )}

        {/* ── Plats du jour ── */}
        {!isLoading && (feed?.dailySpecials?.length ?? 0) > 0 && (
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-black text-text">Plats du jour ✨</h2>
              <button onClick={() => navigate('/search')} className="text-xs font-bold no-tap text-accent">Voir tout →</button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {feed!.dailySpecials.map((item: any) => (
                <button key={item.id}
                  onClick={() => navigate(`/restaurant/${item.restaurant.id}`)}
                  className="text-left no-tap active:scale-[0.98] transition-transform">
                  <div className="rounded-2xl overflow-hidden bg-surface" style={{ boxShadow: 'var(--shadow-card)' }}>
                    <div className="relative" style={{ height: 110 }}>
                      {item.imageUrl
                        ? <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                        : <div className="w-full h-full flex items-center justify-center text-3xl bg-surface-2">🍽️</div>
                      }
                      <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full text-[9px] font-black text-white" style={{ background: '#f59e0b' }}>
                        Aujourd'hui
                      </span>
                      {item.promoPrice && (
                        <span className="absolute top-2 right-2 px-2 py-0.5 rounded-full text-[9px] font-black text-white" style={{ background: '#ef4444' }}>
                          PROMO
                        </span>
                      )}
                    </div>
                    <div className="p-2.5">
                      <p className="text-xs font-black truncate text-text">{item.name}</p>
                      <p className="text-xs font-bold mt-0.5 text-accent">{formatPrice(item.promoPrice ?? item.priceUsdCents).cdf}</p>
                      <p className="text-[10px] truncate mt-0.5 text-text-3">{item.restaurant.name}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </section>
        )}

        {/* ── Offres & Promos ── */}
        {!isLoading && (feed?.promoOffers?.length ?? 0) > 0 && (
          <section className="pb-4">
            <h2 className="text-base font-black mb-3 text-text">Offres & Promos 🏷️</h2>
            <div className="space-y-2.5">
              {feed!.promoOffers.map((offer: any) => (
                <button key={offer.id}
                  onClick={() => offer.restaurant?.id && navigate(`/restaurant/${offer.restaurant.id}`)}
                  className="w-full text-left no-tap active:scale-[0.99] transition-transform">
                  <div className="rounded-2xl overflow-hidden flex items-center gap-3 p-3 bg-surface"
                    style={{ boxShadow: 'var(--shadow-card)' }}>
                    <div className="w-16 h-16 rounded-xl shrink-0 overflow-hidden bg-surface-2">
                      {offer.restaurant?.imageUrl
                        ? <img src={offer.restaurant.imageUrl} alt="" className="w-full h-full object-cover" />
                        : <div className="w-full h-full flex items-center justify-center text-2xl">
                            {offer.type === 'FLASH' ? '⚡' : offer.type === 'POINTS' ? '⭐' : '🏷️'}
                          </div>
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        {offer.discountPct && (
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-black text-white" style={{ background: '#ef4444' }}>-{offer.discountPct}%</span>
                        )}
                        {offer.type === 'FLASH' && (
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-black text-white" style={{ background: '#f97316' }}>⚡ FLASH</span>
                        )}
                        {offer.type === 'POINTS' && (
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-black text-white" style={{ background: '#f59e0b' }}>⭐ POINTS</span>
                        )}
                      </div>
                      <p className="text-sm font-black truncate text-text">{offer.title ?? offer.description ?? 'Offre spéciale'}</p>
                      <p className="text-xs truncate mt-0.5 text-text-3">{offer.restaurant?.name}</p>
                    </div>
                    <ChevronRight className="w-4 h-4 shrink-0 text-text-3" />
                  </div>
                </button>
              ))}
            </div>
          </section>
        )}

        {/* Empty state */}
        {!isLoading && !feed?.dailySpecials?.length && !feed?.promoOffers?.length && !feed?.popularRestaurants?.length && (
          <div className="pt-8 text-center space-y-3 pb-8">
            <div className="text-5xl">🍽️</div>
            <p className="font-black text-base text-text">Découvrez Kinshasa</p>
            <p className="text-sm text-text-3">Les restaurants arrivent bientôt</p>
            <button onClick={() => navigate('/search')}
              className="px-6 py-3 rounded-xl text-white text-sm font-black"
              style={{ background: 'rgb(var(--color-accent))' }}>
              Explorer les restaurants
            </button>
          </div>
        )}

      </div>
    </div>
    </AppLayout>
  );
}
