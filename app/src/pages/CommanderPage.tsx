import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { AppLayout } from '@/components/layout/AppLayout';
import { api } from '@/lib/api';
import { MapPin, Navigation } from 'lucide-react';
import { Skeleton } from '@/components/ui/Skeleton';

// ── Types ─────────────────────────────────────────────────────────────────────

interface DeliveryRestaurant {
  id: string;
  name: string;
  imageUrl?: string;
  cuisine?: string;
  restaurantType: string;
  isOpen: boolean;
  rating: number;
  reviewCount: number;
  subscription: string;
  address: string;
  city: string;
  categories: string[];
  priceRange: number;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const PRICE_ICONS = ['', '$', '$$', '$$$', '$$$$'];

function RestaurantCard({ r }: { r: DeliveryRestaurant }) {
  const navigate = useNavigate();
  return (
    <button
      onClick={() => navigate(`/restaurant/${r.id}`)}
      className="card w-full text-left overflow-hidden active:scale-[0.98] transition-transform no-tap"
    >
      {/* Cover */}
      <div className="h-36 bg-surface-2 relative overflow-hidden">
        {r.imageUrl ? (
          <img src={r.imageUrl} alt={r.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-5xl">🍽️</div>
        )}
        {/* Badges */}
        <div className="absolute top-2 left-2 flex gap-1.5">
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${r.isOpen ? 'bg-green-500 text-white' : 'bg-black/60 text-white'}`}>
            {r.isOpen ? '🟢 Ouvert' : '🔴 Fermé'}
          </span>
          {r.restaurantType === 'LES_DEUX' && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-accent text-white">
              Sur place aussi
            </span>
          )}
        </div>
      </div>

      {/* Info */}
      <div className="p-3 space-y-1">
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm font-bold text-text leading-tight">{r.name}</p>
          <span className="text-xs text-text-3 shrink-0">{PRICE_ICONS[r.priceRange] ?? ''}</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-text-3">
          {r.cuisine && <span>{r.cuisine}</span>}
          {r.cuisine && <span>·</span>}
          <span>{r.city}</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs">
          <span className="text-amber-500 font-bold">⭐ {r.rating.toFixed(1)}</span>
          <span className="text-text-3">({r.reviewCount} avis)</span>
          <span className="text-text-3">· 🛵 Livraison</span>
        </div>
        {r.categories?.length > 0 && (
          <div className="flex gap-1 flex-wrap pt-0.5">
            {r.categories.slice(0, 3).map(c => (
              <span key={c} className="px-2 py-0.5 rounded-full bg-surface-2 text-text-3 text-[10px] font-medium">
                {c}
              </span>
            ))}
          </div>
        )}
      </div>
    </button>
  );
}

// ── Bannière commande active ──────────────────────────────────────────────────

interface ActiveOrder {
  id: string;
  status: string;
  restaurant: { name: string };
  deliveryAddress?: string;
}

const ACTIVE_STATUSES = ['PENDING', 'ACCEPTED', 'PREPARING', 'PACKAGING', 'OUT_FOR_DELIVERY'];

function ActiveOrderBanner() {
  const navigate = useNavigate();
  const { data: orders = [] } = useQuery<ActiveOrder[]>({
    queryKey: ['my-orders-active'],
    queryFn: () => api.get('/orders/mine'),
    select: (all: any) => Array.isArray(all)
      ? all.filter((o: any) => ACTIVE_STATUSES.includes(o.status))
      : [],
    refetchInterval: 15000,
  });

  if (orders.length === 0) return null;

  const STATUS_LABEL: Record<string, string> = {
    PENDING:          '⏳ En attente',
    ACCEPTED:         '✅ Acceptée',
    PREPARING:        '👨‍🍳 En préparation',
    PACKAGING:        '📦 Prête',
    OUT_FOR_DELIVERY: '🛵 En route !',
  };

  return (
    <div className="space-y-2">
      {orders.map(order => (
        <button
          key={order.id}
          onClick={() => navigate(`/track/${order.id}`)}
          className={`w-full text-left rounded-2xl p-4 border transition-all active:scale-[0.98] ${
            order.status === 'OUT_FOR_DELIVERY'
              ? 'bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800'
              : 'bg-accent/5 border-accent/20'
          }`}
        >
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 mb-1">
                {order.status === 'OUT_FOR_DELIVERY' && (
                  <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse shrink-0" />
                )}
                <p className="text-sm font-bold text-text truncate">{order.restaurant.name}</p>
              </div>
              <p className={`text-xs font-medium ${
                order.status === 'OUT_FOR_DELIVERY' ? 'text-blue-600 dark:text-blue-400' : 'text-accent'
              }`}>
                {STATUS_LABEL[order.status] ?? order.status}
              </p>
              {order.deliveryAddress && (
                <p className="text-xs text-text-3 mt-0.5 truncate flex items-center gap-1">
                  <MapPin className="w-3 h-3 shrink-0" />
                  {order.deliveryAddress}
                </p>
              )}
            </div>
            <div className={`flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-xl ${
              order.status === 'OUT_FOR_DELIVERY'
                ? 'bg-blue-600 text-white'
                : 'bg-accent text-white'
            }`}>
              <Navigation className="w-3.5 h-3.5" />
              Suivre
            </div>
          </div>
        </button>
      ))}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function CommanderPage() {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'tous' | 'ouvert'>('ouvert');

  const { data: restaurants = [], isLoading } = useQuery<DeliveryRestaurant[]>({
    queryKey: ['delivery-restaurants'],
    queryFn: () => api.get('/restaurants?restaurantType=LIVRAISON&limit=50').then((r: any) => {
      // Fetch also LES_DEUX
      return api.get('/restaurants?limit=100').then((all: any) => {
        const all_data = all.data ?? [];
        return all_data.filter((rest: any) =>
          rest.restaurantType === 'LIVRAISON' || rest.restaurantType === 'LES_DEUX'
        );
      });
    }),
    staleTime: 2 * 60 * 1000,
  });

  const filtered = restaurants.filter(r => {
    const matchSearch = !search ||
      r.name.toLowerCase().includes(search.toLowerCase()) ||
      r.categories?.some(c => c.toLowerCase().includes(search.toLowerCase()));
    const matchFilter = filter === 'tous' || r.isOpen;
    return matchSearch && matchFilter;
  });

  const openCount = restaurants.filter(r => r.isOpen).length;

  return (
    <AppLayout title="Commander 🛵">
      {/* Commandes actives */}
      <ActiveOrderBanner />

      {/* Hero */}
      <div className="card rounded-2xl p-4 bg-gradient-to-br from-accent/10 to-accent/5 border border-accent/20 space-y-1">
        <p className="text-base font-black text-text">Commandez en ligne</p>
        <p className="text-xs text-text-3">
          {openCount > 0
            ? `${openCount} restaurant${openCount > 1 ? 's' : ''} ouvert${openCount > 1 ? 's' : ''} maintenant`
            : 'Restaurants avec livraison à Kinshasa'}
        </p>
      </div>

      {/* Search */}
      <div className="relative">
        <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-3" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Chercher un restaurant, une cuisine…"
          className="w-full h-11 pl-10 pr-4 rounded-2xl border border-border bg-surface-2 text-sm text-text placeholder:text-text-3 outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent/50 transition-all"
        />
      </div>

      {/* Filtres */}
      <div className="flex gap-2">
        {(['ouvert', 'tous'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all ${
              filter === f
                ? 'bg-accent text-white border-accent'
                : 'border-border text-text-3 hover:border-accent/50'
            }`}
          >
            {f === 'ouvert' ? '🟢 Ouverts maintenant' : 'Tous les restaurants'}
          </button>
        ))}
      </div>

      {/* Liste */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} height={200} />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="card rounded-2xl p-10 text-center space-y-3">
          <p className="text-4xl">🛵</p>
          <p className="text-sm font-bold text-text">
            {search ? 'Aucun résultat' : 'Aucun restaurant disponible'}
          </p>
          <p className="text-xs text-text-3">
            {search
              ? 'Essayez un autre terme de recherche'
              : 'Les restaurants avec livraison apparaîtront ici'}
          </p>
          {filter === 'ouvert' && restaurants.length > 0 && (
            <button onClick={() => setFilter('tous')}
              className="text-xs text-accent font-bold underline underline-offset-2">
              Voir tous les restaurants ({restaurants.length})
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-xs text-text-3 font-medium">{filtered.length} restaurant{filtered.length > 1 ? 's' : ''}</p>
          {filtered.map(r => <RestaurantCard key={r.id} r={r} />)}
        </div>
      )}

      {/* Info suivi */}
      <div className="card rounded-2xl p-4 border border-border text-center space-y-1">
        <p className="text-xs font-bold text-text-2">📍 Suivi en temps réel</p>
        <p className="text-[11px] text-text-3">Dès qu'un livreur est assigné à votre commande, suivez sa position en direct</p>
      </div>
    </AppLayout>
  );
}
