import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { useAuthStore } from "@/store/auth.store";
import { useHomeFeed } from "@/hooks/useHome";
import { formatPrice } from "@/lib/constants";
import { TIER_COLOR } from "@/lib/constants";

// ── Skeleton ──────────────────────────────────────────────────────────────────

function CarouselSkeleton({ count = 3, width = 200 }: { count?: number; width?: number }) {
  return (
    <div className="flex gap-3 overflow-hidden">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="animate-pulse bg-surface-2 rounded-2xl shrink-0"
          style={{ width, height: width === 280 ? 220 : 180 }}
        />
      ))}
    </div>
  );
}

// ── Daily Special Card ────────────────────────────────────────────────────────

function DailySpecialCard({ item, onClick }: { item: any; onClick: () => void }) {
  const { cdf, usd } = formatPrice(item.promoPrice ?? item.priceUsdCents);
  const hasPromo = !!item.promoPrice;
  const tierCls = TIER_COLOR[item.restaurant.subscription] ?? TIER_COLOR.MAMAN;

  return (
    <button
      onClick={onClick}
      className="carousel-card w-[280px] card overflow-hidden text-left active:scale-[0.97] transition-transform no-tap"
    >
      {/* Photo */}
      <div className="relative h-36 bg-surface-2 overflow-hidden">
        {item.imageUrl ? (
          <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-3xl">🍽️</div>
        )}
        <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500 text-white shadow">
          Aujourd'hui
        </span>
      </div>

      {/* Infos */}
      <div className="p-3 space-y-1.5">
        <p className="text-sm font-bold text-text leading-tight line-clamp-1">{item.name}</p>
        <div className="flex items-center gap-1.5">
          {item.restaurant.imageUrl && (
            <img src={item.restaurant.imageUrl} alt="" className="w-4 h-4 rounded-full object-cover" />
          )}
          <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${tierCls}`}>
            {item.restaurant.name}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-sm font-black text-accent">{cdf}</span>
          <span className="text-xs text-text-3">({usd})</span>
          {hasPromo && (
            <span className="text-[10px] line-through text-text-3">
              {formatPrice(item.priceUsdCents).cdf}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}

// ── Promo Offer Card ──────────────────────────────────────────────────────────

function PromoCard({ offer, onClick }: { offer: any; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="carousel-card w-[200px] card overflow-hidden text-left active:scale-[0.97] transition-transform no-tap"
    >
      <div className="relative h-28 bg-surface-2 overflow-hidden">
        {offer.restaurant?.imageUrl ? (
          <img src={offer.restaurant.imageUrl} alt={offer.restaurant?.name ?? ''} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-3xl">
            {offer.type === 'FLASH' ? '⚡' : offer.type === 'POINTS' ? '⭐' : '🏷️'}
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        {offer.discountPct && (
          <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-500 text-white shadow">
            -{offer.discountPct}%
          </span>
        )}
        {offer.pointsCost && (
          <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500 text-white shadow">
            {offer.pointsCost} pts
          </span>
        )}
        {offer.restaurant?.name && (
          <p className="absolute bottom-1.5 left-2 right-2 text-[11px] font-bold text-white truncate">{offer.restaurant.name}</p>
        )}
      </div>
      <div className="p-2.5 space-y-0.5">
        <p className="text-xs font-bold text-text line-clamp-2">{offer.title ?? offer.description ?? 'Offre spéciale'}</p>
        {offer.expiresAt && (
          <p className="text-[10px] text-text-3">
            Expire le {new Date(offer.expiresAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
          </p>
        )}
      </div>
    </button>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function HomePage() {
  const navigate  = useNavigate();
  const { user }  = useAuthStore();
  const [search, setSearch] = useState('');

  const { data: feed, isLoading, error } = useHomeFeed();

  const handleSearch = useCallback(() => {
    const q = search.trim();
    navigate(q ? `/search?q=${encodeURIComponent(q)}` : '/search');
  }, [search, navigate]);

  const handleGeolocate = useCallback(() => {
    navigate('/search?geo=1');
  }, [navigate]);

  const MIN_REDEEM = 20;
  const ptsToNext  = user ? MIN_REDEEM - (user.points % MIN_REDEEM) : MIN_REDEEM;

  return (
    <AppLayout
      headerRight={
        <button
          onClick={() => navigate('/profile')}
          className="w-8 h-8 rounded-full bg-accent text-white flex items-center justify-center text-sm font-bold no-tap active:scale-95 transition-transform shadow-pill"
        >
          {user ? `${user.firstName[0]}${user.lastName[0]}` : '?'}
        </button>
      }
    >
      {/* ── Points banner ── */}
      <div
        className="card p-4 flex items-center justify-between gap-3"
        style={{ borderColor: 'rgb(var(--color-accent) / 0.20)', background: 'rgb(var(--color-accent-soft))' }}
      >
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'rgb(var(--color-accent))' }}>
            Vos points fidélité
          </p>
          <p className="text-2xl font-black tracking-tighter text-text mt-0.5">
            {(user?.points ?? 0).toLocaleString()} <span className="text-sm font-semibold text-text-2">pts</span>
          </p>
          <p className="text-xs text-text-3 mt-0.5">
            {ptsToNext < MIN_REDEEM
              ? `Encore ${ptsToNext} pts pour une réduction de 1 000 FC`
              : 'Échangez vos points dans le Wallet !'}
          </p>
        </div>
        <button
          onClick={() => navigate('/wallet')}
          className="shrink-0 w-14 h-14 rounded-2xl flex items-center justify-center active:scale-95 transition-transform no-tap"
          style={{ background: 'rgb(var(--color-accent) / 0.12)', border: '1px solid rgb(var(--color-accent) / 0.20)' }}
        >
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#E85D26" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
          </svg>
        </button>
      </div>

      {/* ── Hero ── */}
      <div className="card p-5 space-y-3 bg-gradient-to-br from-surface to-surface-2">
        <div>
          <h1 className="text-xl font-black text-text tracking-tight">Trouvez votre table à Kinshasa</h1>
          <p className="text-sm text-text-2 mt-1">Des centaines de restaurants vous attendent</p>
        </div>

        {/* Search bar */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-text-3" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input
              type="search"
              value={search}
              onChange={e => setSearch(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
              placeholder="Restaurant, cuisine, quartier..."
              className="input-base py-2.5 pl-9 pr-3 w-full"
            />
          </div>
          <button
            onClick={handleSearch}
            className="px-4 py-2.5 rounded-xl bg-accent text-white text-sm font-bold hover:bg-accent/90 transition-colors no-tap"
          >
            OK
          </button>
        </div>

        <button
          onClick={handleGeolocate}
          className="flex items-center gap-2 text-xs font-semibold text-accent hover:underline no-tap"
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <circle cx="12" cy="12" r="3"/><path d="M12 1v4M12 19v4M1 12h4M19 12h4"/>
          </svg>
          Me localiser
        </button>
      </div>

      {/* ── Error ── */}
      {error && (
        <div className="card p-4 border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20">
          <p className="text-sm text-red-600 dark:text-red-400 font-medium">
            Impossible de charger le fil d'actualité. Vérifiez votre connexion.
          </p>
        </div>
      )}

      {/* ── Plats du jour ── */}
      {!error && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-text">Plats du jour ✨</h2>
            <button
              onClick={() => navigate('/search')}
              className="text-xs font-semibold text-accent no-tap"
            >
              Voir tout →
            </button>
          </div>

          {isLoading ? (
            <CarouselSkeleton count={3} width={280} />
          ) : (feed?.dailySpecials?.length ?? 0) === 0 ? (
            <div className="card p-6 text-center">
              <p className="text-xl mb-1">🌟</p>
              <p className="text-xs text-text-3">Aucun plat du jour pour l'instant</p>
            </div>
          ) : (
            <div
              className="flex gap-3 overflow-x-auto pb-2"
              style={{ scrollSnapType: 'x mandatory', scrollbarWidth: 'none' }}
            >
              {feed!.dailySpecials.map(item => (
                <div key={item.id} style={{ scrollSnapAlign: 'start', flexShrink: 0 }}>
                  <DailySpecialCard
                    item={item}
                    onClick={() => navigate(`/restaurant/${item.restaurant.id}`)}
                  />
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* ── Offres & Promos ── */}
      {!error && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-text">Offres & Promos 🏷️</h2>
          </div>

          {isLoading ? (
            <CarouselSkeleton count={4} width={200} />
          ) : (feed?.promoOffers?.length ?? 0) === 0 ? (
            <div className="card p-6 text-center">
              <p className="text-xl mb-1">🏷️</p>
              <p className="text-xs text-text-3">Aucune offre active pour l'instant</p>
            </div>
          ) : (
            <div
              className="flex gap-3 overflow-x-auto pb-2"
              style={{ scrollSnapType: 'x mandatory', scrollbarWidth: 'none' }}
            >
              {feed!.promoOffers.map((offer: any) => (
                <div key={offer.id} style={{ scrollSnapAlign: 'start', flexShrink: 0 }}>
                  <PromoCard
                    offer={offer}
                    onClick={() => offer.restaurant?.id && navigate(`/restaurant/${offer.restaurant.id}`)}
                  />
                </div>
              ))}
            </div>
          )}
        </section>
      )}

    </AppLayout>
  );
}
