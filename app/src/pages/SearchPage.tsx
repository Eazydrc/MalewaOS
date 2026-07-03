import { useState, useDeferredValue, useCallback, lazy, Suspense } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { useRestaurants } from "@/hooks/useRestaurants";
import { useRestaurantsMap } from "@/hooks/useRestaurantPublic";

// ── Lazy import map (avoid SSR / leaflet issues) ──────────────────────────────
// npm install leaflet react-leaflet @types/leaflet
const RestaurantMap = lazy(() => import('@/components/Map/RestaurantMap'));

// ── Types ─────────────────────────────────────────────────────────────────────

type ViewMode = 'list' | 'map';
type RestaurantType = 'SUR_PLACE' | 'LIVRAISON' | 'LES_DEUX';

const CUISINES = ['Congolaise', 'Grillades', 'Poisson', 'Végétarien', 'Fusion', 'Street food', 'Italienne', 'Libanaise'];
const TYPE_LABELS: Record<RestaurantType, string> = {
  SUR_PLACE: 'Sur place',
  LIVRAISON: 'Livraison',
  LES_DEUX:  'Sur place & Livraison',
};

// ── Haversine ─────────────────────────────────────────────────────────────────

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ── Skeleton ──────────────────────────────────────────────────────────────────

function ListSkeleton() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {[1, 2, 3, 4, 5, 6].map(i => (
        <div key={i} className="animate-pulse bg-surface-2 rounded-2xl h-44" />
      ))}
    </div>
  );
}

// ── Restaurant Card — style Uber Eats ────────────────────────────────────────

function RestaurantCard({ r, onClick }: { r: any; onClick: () => void }) {
  const cuisine = r.cuisine ?? (Array.isArray(r.categories) ? r.categories.join(' · ') : '');
  const hasRating = typeof r.rating === 'number' && r.rating > 0;
  const isDelivery = r.restaurantType === 'LIVRAISON' || r.restaurantType === 'LES_DEUX';

  return (
    <button
      onClick={onClick}
      className="w-full text-left active:scale-[0.98] transition-transform no-tap group"
    >
      {/* Image avec overlay gradient */}
      <div className="relative w-full rounded-2xl overflow-hidden bg-surface-2" style={{ aspectRatio: '4/3' }}>
        {r.imageUrl ? (
          <img
            src={r.imageUrl}
            alt={r.name}
            className="w-full h-full object-cover group-active:brightness-90 transition-all"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-5xl">🍽️</div>
        )}

        {/* Gradient bas pour lisibilité future */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />

        {/* Badge fermé uniquement (ouvert = pas de badge, plus propre) */}
        {!r.isOpen && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center rounded-2xl">
            <span className="px-3 py-1 bg-black/70 text-white text-xs font-bold rounded-full backdrop-blur-sm">
              Fermé
            </span>
          </div>
        )}

        {/* Badge livraison */}
        {isDelivery && r.isOpen && (
          <span className="absolute top-2.5 left-2.5 flex items-center gap-1 px-2 py-1 bg-black/60 backdrop-blur-sm text-white text-[10px] font-semibold rounded-full">
            🛵 Livraison
          </span>
        )}
      </div>

      {/* Infos sous l'image */}
      <div className="pt-2.5 pb-1 px-0.5 space-y-1">
        <p className="text-sm font-bold text-text leading-snug">{r.name}</p>

        <div className="flex items-center gap-1.5 flex-wrap">
          {hasRating && (
            <span className="flex items-center gap-0.5 text-amber-400 text-xs font-bold">
              ★ {r.rating.toFixed(1)}
            </span>
          )}
          {hasRating && (cuisine || r.distance !== undefined) && (
            <span className="text-text-3 text-xs">·</span>
          )}
          {cuisine && (
            <span className="text-xs text-text-3 truncate max-w-[120px]">{cuisine}</span>
          )}
          {r.distance !== undefined && isFinite(r.distance) && (
            <>
              <span className="text-text-3 text-xs">·</span>
              <span className="text-xs text-text-3 shrink-0">{r.distance.toFixed(1)} km</span>
            </>
          )}
        </div>

        {r.priceRange && (
          <p className="text-xs text-text-3">{'$'.repeat(r.priceRange)}</p>
        )}
      </div>
    </button>
  );
}

// ── Drawer bas (vue map) ──────────────────────────────────────────────────────

function MapDrawer({ results, navigate }: { results: any[]; navigate: (path: string) => void }) {
  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-[1000] bg-bg border-t border-border rounded-t-2xl overflow-y-auto"
      style={{ height: '40vh', maxHeight: '40vh' }}
    >
      <div className="w-10 h-1 rounded-full bg-border mx-auto mt-2 mb-3" />
      {results.length === 0 ? (
        <div className="p-6 text-center">
          <p className="text-sm text-text-3">Aucun restaurant sur cette zone</p>
        </div>
      ) : (
        <div className="px-4 space-y-2 pb-4">
          <p className="text-xs text-text-3 font-semibold mb-2">{results.length} restaurant{results.length > 1 ? 's' : ''}</p>
          {results.map(r => (
            <button
              key={r.id}
              onClick={() => navigate(`/restaurant/${r.id}`)}
              className="w-full card p-3 flex items-center gap-3 text-left active:scale-[0.98] transition-transform no-tap"
            >
              <div className="w-12 h-12 rounded-xl bg-surface-2 overflow-hidden shrink-0">
                {r.imageUrl ? (
                  <img src={r.imageUrl} alt={r.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-lg">🍽️</div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-text truncate">{r.name}</p>
                <p className="text-xs text-text-3 truncate">
                  {r.cuisine ?? (Array.isArray(r.categories) ? r.categories.join(' · ') : '')}
                </p>
              </div>
              <span className={`shrink-0 px-2 py-0.5 rounded-full text-[9px] font-bold ${
                r.isOpen
                  ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400'
                  : 'bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-400'
              }`}>
                {r.isOpen ? 'Ouvert' : 'Fermé'}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function SearchPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [viewMode, setViewMode]       = useState<ViewMode>('list');
  const [query, setQuery]             = useState(searchParams.get('q') ?? '');
  const [cuisine, setCuisine]         = useState<string | undefined>();
  const [restaurantType, setRestaurantType] = useState<RestaurantType | undefined>();
  const [openNow, setOpenNow]         = useState(false);
  const [minRating, setMinRating]     = useState<number | undefined>();
  const [maxPrice, setMaxPrice]       = useState<number | undefined>();
  const [maxDistKm, setMaxDistKm]     = useState<number | undefined>();
  const [showFilters, setShowFilters] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | undefined>(
    searchParams.get('geo') === '1' ? undefined : undefined,
  );
  const [geoLoading, setGeoLoading]   = useState(false);
  const [geoError, setGeoError]       = useState('');

  const activeFilterCount = [cuisine, restaurantType, openNow, minRating, maxPrice, maxDistKm]
    .filter(Boolean).length;

  const deferredQuery = useDeferredValue(query);

  // ── Données liste ──
  const { data: listData, isLoading: listLoading } = useRestaurants({
    search:   deferredQuery.trim() || undefined,
    category: cuisine,
    isOpen:   openNow ? true : undefined,
    limit:    50,
  });

  // ── Données map ──
  const { data: mapData, isLoading: mapLoading } = useRestaurantsMap();

  // ── Filtrage client ──
  const applyClientFilters = useCallback((items: any[]) => {
    let result = items ?? [];
    if (restaurantType) result = result.filter((r: any) => r.restaurantType === restaurantType);
    if (openNow)        result = result.filter((r: any) => r.isOpen);
    if (minRating)      result = result.filter((r: any) => (r.rating ?? 0) >= minRating);
    if (maxPrice)       result = result.filter((r: any) => !r.priceRange || r.priceRange <= maxPrice);
    if (cuisine) result = result.filter((r: any) =>
      r.cuisine?.toLowerCase().includes(cuisine.toLowerCase()) ||
      (Array.isArray(r.categories) && r.categories.some((c: string) => c.toLowerCase().includes(cuisine.toLowerCase())))
    );
    if (userLocation) {
      result = result
        .map((r: any) => ({
          ...r,
          distance: r.lat && r.lng
            ? haversineKm(userLocation.lat, userLocation.lng, r.lat, r.lng)
            : Infinity,
        }))
        .sort((a: any, b: any) => a.distance - b.distance);

      if (maxDistKm) {
        result = result.filter((r: any) => (r.distance ?? Infinity) <= maxDistKm);
      }
    }
    return result;
  }, [restaurantType, openNow, cuisine, userLocation, minRating, maxPrice, maxDistKm]);

  const listResults  = applyClientFilters(listData?.items ?? []);
  const mapResults   = applyClientFilters(mapData ?? []);
  const isStale      = query !== deferredQuery;

  // ── Géolocalisation ──
  const handleGeolocate = useCallback(() => {
    if (!navigator.geolocation) {
      setGeoError('Géolocalisation non supportée par ce navigateur');
      return;
    }
    setGeoLoading(true);
    setGeoError('');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setGeoLoading(false);
      },
      () => {
        setGeoError('Impossible d\'obtenir votre position');
        setGeoLoading(false);
      },
      { timeout: 10000 },
    );
  }, []);

  return (
    <AppLayout showBack title="Explorer">

      {/* ── Barre de recherche + filtres ── */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-3" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            type="search"
            autoFocus
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Restaurant, cuisine, quartier..."
            className="input-base py-3 pl-10 pr-10 w-full"
          />
          {query && (
            <button onClick={() => setQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-3 no-tap">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          )}
        </div>

        {/* Bouton filtres — toujours visible, juste à côté de la recherche */}
        <button
          onClick={() => setShowFilters(true)}
          className={`relative shrink-0 w-12 rounded-xl border flex items-center justify-center no-tap active:scale-95 transition-all ${
            activeFilterCount > 0 ? 'bg-text text-bg border-text' : 'bg-surface-2 text-text-2 border-border'
          }`}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="4" y1="6" x2="20" y2="6"/><circle cx="9" cy="6" r="2" fill="currentColor" stroke="none"/>
            <line x1="4" y1="12" x2="20" y2="12"/><circle cx="15" cy="12" r="2" fill="currentColor" stroke="none"/>
            <line x1="4" y1="18" x2="20" y2="18"/><circle cx="11" cy="18" r="2" fill="currentColor" stroke="none"/>
          </svg>
          {activeFilterCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-accent text-white text-[10px] font-bold flex items-center justify-center">
              {activeFilterCount}
            </span>
          )}
        </button>
      </div>

      {/* ── Toggle Map / Liste ── */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex gap-1 bg-surface-2 rounded-xl p-1">
          <button
            onClick={() => setViewMode('list')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all no-tap ${
              viewMode === 'list' ? 'bg-bg text-text shadow-card' : 'text-text-3'
            }`}
          >
            Liste
          </button>
          <button
            onClick={() => setViewMode('map')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all no-tap ${
              viewMode === 'map' ? 'bg-bg text-text shadow-card' : 'text-text-3'
            }`}
          >
            Carte
          </button>
        </div>

        {/* Géoloc bouton */}
        <button
          onClick={handleGeolocate}
          disabled={geoLoading}
          className="flex items-center gap-1.5 text-xs font-semibold text-accent no-tap disabled:opacity-50"
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <circle cx="12" cy="12" r="3"/><path d="M12 1v4M12 19v4M1 12h4M19 12h4"/>
          </svg>
          {geoLoading ? 'Localisation…' : userLocation ? 'Localisé' : 'Me localiser'}
        </button>
      </div>

      {geoError && <p className="text-xs text-red-500">{geoError}</p>}

      {/* ── Modal filtres — tout au même endroit, accessible immédiatement ── */}
      {showFilters && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowFilters(false)} />
          <div className="relative w-full md:max-w-md bg-bg rounded-t-3xl md:rounded-3xl shadow-2xl max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 pb-3">
              <p className="text-base font-bold text-text">Filtres</p>
              <button onClick={() => setShowFilters(false)} className="text-text-3 hover:text-text p-1">✕</button>
            </div>

            <div className="px-5 pb-5 space-y-5">
              {/* Cuisines — grille, pas de scroll */}
              <div className="space-y-1.5">
                <p className="text-xs font-semibold text-text-2">Cuisine</p>
                <div className="flex flex-wrap gap-2">
                  {CUISINES.map(c => (
                    <button
                      key={c}
                      onClick={() => setCuisine(prev => prev === c ? undefined : c)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all no-tap ${
                        cuisine === c ? 'bg-text text-bg border-text' : 'bg-surface-2 text-text-2 border-border'
                      }`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>

              {/* Type de service */}
              <div className="space-y-1.5">
                <p className="text-xs font-semibold text-text-2">Type de service</p>
                <div className="flex flex-wrap gap-2">
                  {(Object.entries(TYPE_LABELS) as [RestaurantType, string][]).map(([key, label]) => (
                    <button
                      key={key}
                      onClick={() => setRestaurantType(prev => prev === key ? undefined : key)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all no-tap ${
                        restaurantType === key ? 'bg-text text-bg border-text' : 'bg-surface-2 text-text-2 border-border'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Ouvert maintenant */}
              <button
                onClick={() => setOpenNow(prev => !prev)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-semibold border transition-all no-tap ${
                  openNow ? 'bg-green-600 text-white border-green-600' : 'bg-surface-2 text-text-2 border-border'
                }`}
              >
                Ouvert maintenant
                <span>{openNow ? '✓' : ''}</span>
              </button>

              {/* Note minimum */}
              <div className="space-y-1.5">
                <p className="text-xs font-semibold text-text-2">Note minimum</p>
                <div className="flex flex-wrap gap-2">
                  {[null, 3, 3.5, 4, 4.5].map((v) => (
                    <button
                      key={v ?? 'all'}
                      onClick={() => setMinRating(v ?? undefined)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all no-tap ${
                        minRating === (v ?? undefined) ? 'bg-amber-500 text-white border-amber-500' : 'bg-surface-2 text-text-2 border-border'
                      }`}
                    >
                      {v === null ? 'Tous' : `★ ${v}+`}
                    </button>
                  ))}
                </div>
              </div>

              {/* Gamme de prix */}
              <div className="space-y-1.5">
                <p className="text-xs font-semibold text-text-2">Gamme de prix</p>
                <div className="flex flex-wrap gap-2">
                  {[null, 1, 2, 3, 4].map((v) => (
                    <button
                      key={v ?? 'all'}
                      onClick={() => setMaxPrice(v ?? undefined)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all no-tap ${
                        maxPrice === (v ?? undefined) ? 'bg-text text-bg border-text' : 'bg-surface-2 text-text-2 border-border'
                      }`}
                    >
                      {v === null ? 'Tous' : '$'.repeat(v)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Distance max (si géolocalisé) */}
              {userLocation && (
                <div className="space-y-1.5">
                  <p className="text-xs font-semibold text-text-2">Distance maximum</p>
                  <div className="flex flex-wrap gap-2">
                    {[null, 1, 2, 5, 10].map((v) => (
                      <button
                        key={v ?? 'all'}
                        onClick={() => setMaxDistKm(v ?? undefined)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all no-tap ${
                          maxDistKm === (v ?? undefined) ? 'bg-blue-500 text-white border-blue-500' : 'bg-surface-2 text-text-2 border-border'
                        }`}
                      >
                        {v === null ? 'Tous' : `${v} km`}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => { setCuisine(undefined); setRestaurantType(undefined); setOpenNow(false); setMinRating(undefined); setMaxPrice(undefined); setMaxDistKm(undefined); }}
                  className="flex-1 py-2.5 rounded-xl text-sm font-bold bg-surface-2 text-text-2"
                >
                  Réinitialiser
                </button>
                <button
                  onClick={() => setShowFilters(false)}
                  className="flex-1 py-2.5 rounded-xl text-sm font-bold bg-text text-bg"
                >
                  Voir les résultats
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Vue MAP ── */}
      {viewMode === 'map' && (
        <>
          <div style={{ height: 'calc(60vh - 200px)', minHeight: 300, position: 'relative' }}>
            <Suspense fallback={
              <div className="w-full h-full bg-surface-2 rounded-xl flex items-center justify-center">
                <p className="text-sm text-text-3">Chargement de la carte…</p>
              </div>
            }>
              {mapLoading ? (
                <div className="w-full h-full bg-surface-2 rounded-xl animate-pulse" />
              ) : (
                <RestaurantMap
                  restaurants={mapResults.map((r: any) => ({
                    id: r.id,
                    name: r.name,
                    lat: r.lat ?? -4.3217,
                    lng: r.lng ?? 15.3222,
                    cuisine: r.cuisine ?? (Array.isArray(r.categories) ? r.categories[0] : ''),
                    restaurantType: r.restaurantType ?? 'SUR_PLACE',
                    isOpen: r.isOpen ?? false,
                    rating: r.rating,
                    imageUrl: r.imageUrl,
                    subscription: r.subscription ?? 'MAMAN',
                  }))}
                  userLocation={userLocation}
                />
              )}
            </Suspense>
          </div>
          <MapDrawer results={mapResults} navigate={navigate} />
        </>
      )}

      {/* ── Vue LISTE ── */}
      {viewMode === 'list' && (
        <div className="space-y-3">
          <p className={`text-xs text-text-3 font-semibold transition-opacity ${isStale ? 'opacity-50' : ''}`}>
            {listLoading || isStale
              ? 'Recherche en cours…'
              : `${listResults.length} restaurant${listResults.length !== 1 ? 's' : ''} trouvé${listResults.length !== 1 ? 's' : ''}`}
          </p>

          {listLoading ? (
            <ListSkeleton />
          ) : listResults.length === 0 ? (
            <div className="card p-10 text-center space-y-2">
              <p className="text-3xl">🔍</p>
              <p className="text-sm font-bold text-text">Aucun résultat</p>
              <p className="text-xs text-text-3">Essayez d'autres mots-clés ou supprimez des filtres</p>
            </div>
          ) : (
            <div className={`grid grid-cols-2 md:grid-cols-3 gap-x-3 gap-y-5 transition-opacity ${isStale ? 'opacity-60' : ''}`}>
              {listResults.map((r: any) => (
                <RestaurantCard
                  key={r.id}
                  r={r}
                  onClick={() => navigate(`/restaurant/${r.id}`)}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </AppLayout>
  );
}
