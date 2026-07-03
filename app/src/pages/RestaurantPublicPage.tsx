import { useState, useMemo, useCallback, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { AppLayout } from '@/components/layout/AppLayout';
import { useRestaurantPublic } from '@/hooks/useRestaurantPublic';
import { useAuthStore } from '@/store/auth.store';
import { useOrdersSocket } from '@/hooks/useOrdersSocket';
import { usePublicTables } from '@/hooks/useTables';
import { useIsDesktop } from '@/hooks/useIsDesktop';
import { OrderStepper, type OrderStatus } from '@/components/orders/OrderStepper';
import { api } from '@/lib/api';
import { formatPrice } from '@/lib/constants';

interface MyOrder {
  id: string;
  status: OrderStatus;
  createdAt: string;
  totalCents: number;
  isPaid: boolean;
  deliveryAddress?: string | null;
  items: { id: string; name: string; quantity: number }[];
  restaurant: { id: string; name: string; imageUrl?: string };
}

// ── Types panier ──────────────────────────────────────────────────────────────

interface CartItem {
  menuItemId:    string;
  name:          string;
  priceUsdCents: number;
  effectivePrice: number; // promoPrice ?? priceUsdCents
  quantity:      number;
}

const ORDER_TIERS = ['ESSENTIEL', 'CROISSANCE', 'DOMINATION'];

// ── Types locaux ──────────────────────────────────────────────────────────────

type Tab = 'menu' | 'offres' | 'avis' | 'commandes';

// ── Helpers ───────────────────────────────────────────────────────────────────

function StarRow({ rating, max = 5 }: { rating: number; max?: number }) {
  return (
    <span className="flex items-center gap-0.5">
      {Array.from({ length: max }).map((_, i) => (
        <svg key={i} width="12" height="12" viewBox="0 0 24 24" fill={i < Math.round(rating) ? '#F59E0B' : 'none'} stroke="#F59E0B" strokeWidth="1.5">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
        </svg>
      ))}
      <span className="text-xs font-bold text-text-2 ml-1">{rating.toFixed(1)}</span>
    </span>
  );
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
}

// ── Skeleton ──────────────────────────────────────────────────────────────────

function PageSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-52 bg-surface-2 rounded-2xl" />
      <div className="h-24 bg-surface-2 rounded-2xl" />
      <div className="h-12 bg-surface-2 rounded-xl" />
      <div className="space-y-3">
        {[1, 2, 3].map(i => <div key={i} className="h-20 bg-surface-2 rounded-2xl" />)}
      </div>
    </div>
  );
}

// ── Modal réservation ─────────────────────────────────────────────────────────

function ReservationModal({ restaurantId, onClose }: { restaurantId: string; onClose: () => void }) {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const today = new Date().toISOString().split('T')[0];

  const [date, setDate]         = useState(today);
  const [partySize, setPartySize] = useState(2);
  const [notes, setNotes]       = useState('');
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');
  const [success, setSuccess]   = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) {
      navigate('/login');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await api.post('/reservations', { restaurantId, date, partySize, notes: notes.trim() || undefined });
      setSuccess(true);
    } catch (err: any) {
      setError(err?.message ?? 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div
        className="w-full max-w-md bg-bg rounded-t-2xl p-5 space-y-4"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-text">Réserver une table</h3>
          <button onClick={onClose} className="text-text-3 no-tap">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {success ? (
          <div className="text-center py-6 space-y-2">
            <p className="text-3xl">✅</p>
            <p className="text-sm font-bold text-text">Réservation envoyée !</p>
            <p className="text-xs text-text-3">Le restaurant confirmera votre réservation</p>
            <button onClick={onClose} className="mt-2 px-5 py-2 rounded-xl bg-accent text-white text-sm font-bold">
              Fermer
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-text-2">Date</label>
              <input
                type="date"
                min={today}
                value={date}
                onChange={e => setDate(e.target.value)}
                required
                className="input-base w-full px-3 py-2.5"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-text-2">Nombre de personnes</label>
              <select
                value={partySize}
                onChange={e => setPartySize(Number(e.target.value))}
                className="input-base w-full px-3 py-2.5"
              >
                {Array.from({ length: 12 }, (_, i) => i + 1).map(n => (
                  <option key={n} value={n}>{n} personne{n > 1 ? 's' : ''}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-text-2">Notes (optionnel)</label>
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Anniversaire, allergies, préférences…"
                rows={3}
                className="input-base w-full px-3 py-2.5 resize-none"
              />
            </div>
            {error && <p className="text-xs text-red-500">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-accent text-white text-sm font-bold disabled:opacity-50 transition-opacity"
            >
              {loading ? 'Envoi en cours…' : 'Confirmer la réservation'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function RestaurantPublicPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: restaurant, isLoading, error } = useRestaurantPublic(id ?? '');
  const [activeTab, setActiveTab]   = useState<Tab>('menu');
  const [showModal, setShowModal]         = useState(false);
  const [showCart, setShowCart]           = useState(false);
  const [openMyOrderId, setOpenMyOrderId] = useState<string | null>(null);
  const [cart, setCart]                   = useState<Map<string, CartItem>>(new Map());
  const [orderNotes, setOrderNotes]       = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [deliveryLat, setDeliveryLat]     = useState<number | undefined>();
  const [deliveryLng, setDeliveryLng]     = useState<number | undefined>();
  const [ordering, setOrdering]           = useState(false);
  const [orderSuccess, setOrderSuccess]   = useState(false);
  const [orderError, setOrderError]       = useState('');
  const [locating, setLocating]           = useState(false);
  const { user } = useAuthStore();
  const isDesktop = useIsDesktop();

  const canOrder = ORDER_TIERS.includes(restaurant?.subscription ?? '');

  const { data: allMyOrders = [] } = useQuery<MyOrder[]>({
    queryKey: ['my-orders'],
    queryFn: () => api.get('/orders/mine'),
    enabled: !!user,
    staleTime: 15 * 1000,
  });
  const myOrdersHere = allMyOrders.filter(o => o.restaurant.id === id);
  const openMyOrder = myOrdersHere.find(o => o.id === openMyOrderId) ?? null;

  const qc = useQueryClient();
  useOrdersSocket({
    enabled: !!user,
    invalidateKeys: [['my-orders'], ['orders-due', id]],
    playBeep: false,
  });

  const payForOrder = (order: MyOrder) => {
    if (!id) return;
    navigate('/payment', {
      state: {
        amountCents: order.totalCents,
        label: `Commande chez ${restaurant?.name ?? 'le restaurant'}`,
        kind: 'order',
        restaurantId: id,
        orderId: order.id,
        returnTo: `/restaurant/${id}`,
      },
    });
  };

  const cartItems  = useMemo(() => Array.from(cart.values()), [cart]);
  const cartCount  = useMemo(() => cartItems.reduce((s, i) => s + i.quantity, 0), [cartItems]);
  const cartTotal  = useMemo(() => cartItems.reduce((s, i) => s + i.effectivePrice * i.quantity, 0), [cartItems]);

  const addToCart = useCallback((item: any) => {
    const price = item.promoPrice ?? item.priceUsdCents;
    setCart(prev => {
      const next = new Map(prev);
      const existing = next.get(item.id);
      next.set(item.id, existing
        ? { ...existing, quantity: existing.quantity + 1 }
        : { menuItemId: item.id, name: item.name, priceUsdCents: item.priceUsdCents, effectivePrice: price, quantity: 1 }
      );
      return next;
    });
  }, []);

  const removeFromCart = useCallback((itemId: string) => {
    setCart(prev => {
      const next = new Map(prev);
      const existing = next.get(itemId);
      if (!existing) return prev;
      if (existing.quantity <= 1) next.delete(itemId);
      else next.set(itemId, { ...existing, quantity: existing.quantity - 1 });
      return next;
    });
  }, []);

  const canDeliver = restaurant?.restaurantType === 'LIVRAISON' || restaurant?.restaurantType === 'LES_DEUX';
  const canDineIn  = restaurant?.restaurantType === 'SUR_PLACE' || restaurant?.restaurantType === 'LES_DEUX';

  const { data: publicTables = [] } = usePublicTables(id);
  const [serviceType, setServiceType] = useState<'DINE_IN' | 'TAKEAWAY' | 'DELIVERY'>('TAKEAWAY');
  const [tableNumberInput, setTableNumberInput] = useState('');
  const matchedTable = publicTables.find(t => String(t.number) === tableNumberInput.trim());
  const selectedTableId = matchedTable?.id ?? '';
  const isDelivery = serviceType === 'DELIVERY';

  // Choisir un service par défaut cohérent avec le type de restaurant
  useEffect(() => {
    if (!restaurant) return;
    if (restaurant.restaurantType === 'LIVRAISON') setServiceType('DELIVERY');
    else if (canDineIn && publicTables.length > 0) setServiceType('DINE_IN');
    else setServiceType('TAKEAWAY');
  }, [restaurant?.restaurantType, canDineIn, publicTables.length]);

  const [geoError, setGeoError] = useState('');

  const geolocateMe = useCallback(() => {
    setGeoError('');
    if (!navigator.geolocation) {
      setGeoError('Géolocalisation non supportée par ce navigateur');
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      pos => {
        setDeliveryLat(pos.coords.latitude);
        setDeliveryLng(pos.coords.longitude);
        if (!deliveryAddress) setDeliveryAddress('Ma position actuelle');
        setLocating(false);
      },
      err => {
        setLocating(false);
        if (err.code === 1) setGeoError('Permission refusée — autorisez la localisation dans votre navigateur');
        else if (err.code === 2) setGeoError('Position introuvable — vérifiez votre GPS');
        else setGeoError('Délai dépassé — réessayez');
      },
      { enableHighAccuracy: true, timeout: 8000 },
    );
  }, [deliveryAddress]);

  const submitOrder = useCallback(async () => {
    if (!user) { navigate('/login'); return; }
    if (cartItems.length === 0) return;
    if (serviceType === 'DELIVERY' && !deliveryAddress.trim()) {
      setOrderError('Veuillez saisir votre adresse de livraison');
      return;
    }
    if (serviceType === 'DINE_IN' && !selectedTableId) {
      setOrderError('Veuillez renseigner le numéro de votre table');
      return;
    }
    setOrdering(true); setOrderError('');
    try {
      const order = await api.post<{ id: string; totalCents: number; deliveryFeeUsdCents: number }>('/orders', {
        restaurantId: id,
        items: cartItems.map(i => ({ menuItemId: i.menuItemId, quantity: i.quantity })),
        notes: orderNotes || undefined,
        tableId:         serviceType === 'DINE_IN'   ? selectedTableId : undefined,
        deliveryAddress: serviceType === 'DELIVERY'  ? deliveryAddress.trim() : undefined,
        deliveryLat:     serviceType === 'DELIVERY'  ? deliveryLat : undefined,
        deliveryLng:     serviceType === 'DELIVERY'  ? deliveryLng : undefined,
      });
      setCart(new Map());
      setOrderNotes('');

      // Livraison : paiement obligatoire avant transmission au restaurant (séquestre) —
      // on redirige immédiatement vers le paiement, pas de bannière de succès intermédiaire.
      if (serviceType === 'DELIVERY' && order?.id) {
        navigate('/payment', {
          state: {
            amountCents: order.totalCents + order.deliveryFeeUsdCents,
            label: `Commande livraison chez ${restaurant?.name ?? 'le restaurant'}`,
            kind: 'order',
            restaurantId: id,
            orderId: order.id,
            returnTo: `/track/${order.id}`,
          },
        });
        return;
      }

      setOrderSuccess(true);
    } catch (e: any) {
      setOrderError(e.message ?? 'Erreur lors de la commande');
    } finally {
      setOrdering(false);
    }
  }, [user, cartItems, id, orderNotes, navigate, serviceType, selectedTableId, deliveryAddress, deliveryLat, deliveryLng, restaurant?.name]);

  if (isLoading) {
    return (
      <AppLayout showBack title="Restaurant">
        <PageSkeleton />
      </AppLayout>
    );
  }

  if (error || !restaurant) {
    return (
      <AppLayout showBack title="Restaurant">
        <div className="card p-10 text-center space-y-3">
          <p className="text-3xl">😕</p>
          <p className="text-sm font-bold text-text">Restaurant introuvable</p>
          <button
            onClick={() => navigate(-1)}
            className="text-xs font-semibold text-accent underline"
          >
            Retour
          </button>
        </div>
      </AppLayout>
    );
  }

  // Branding DOMINATION — appliqué si les champs sont renseignés
  const isDomBranded = !!(restaurant.primaryColor || restaurant.font);
  const brandStyle: React.CSSProperties = isDomBranded ? {
    '--color-accent':    restaurant.accentColor    ?? restaurant.primaryColor ?? '',
    '--color-primary':   restaurant.primaryColor   ?? '',
    '--color-bg':        restaurant.bgColor        ?? '',
    '--color-text':      restaurant.textColor      ?? '',
    fontFamily:          restaurant.font
      ? `'${restaurant.font.replace('+', ' ')}', sans-serif`
      : undefined,
    backgroundColor:     restaurant.bgColor        ?? undefined,
    color:               restaurant.textColor      ?? undefined,
  } as React.CSSProperties : {};

  const heroImg = restaurant.heroImageUrl ?? restaurant.imageUrl;

  const TYPE_LABEL: Record<string, string> = {
    SUR_PLACE: 'Sur place',
    LIVRAISON: 'Livraison',
    LES_DEUX:  'Sur place & Livraison',
  };

  return (
    <>
      <AppLayout showBack title={restaurant.name}>
        <div style={brandStyle}>

          {/* ── Hero — photo plate, infos en dessous (façon Uber Eats) ── */}
          <div className="relative h-44 -mx-4 -mt-4 overflow-hidden bg-surface-2">
            {heroImg ? (
              <img src={heroImg} alt={restaurant.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-5xl">🍽️</div>
            )}
            <span className={`absolute top-3 right-3 px-2 py-0.5 rounded-full text-[10px] font-bold ${
              restaurant.isOpen ? 'bg-bg/90 text-green-600' : 'bg-bg/90 text-red-600'
            }`}>
              {restaurant.isOpen ? '● Ouvert' : '● Fermé'}
            </span>
          </div>

          <div className="px-1 pt-3 pb-1 space-y-1.5">
            <div className="flex items-start gap-3">
              {restaurant.customLogoUrl && (
                <img src={restaurant.customLogoUrl} alt="Logo"
                  className="w-12 h-12 rounded-xl object-cover border border-border shrink-0 bg-bg" />
              )}
              <div className="flex-1 min-w-0">
                <h1 className="text-xl font-bold text-text leading-tight">{restaurant.name}</h1>
                {restaurant.tagline && <p className="text-xs text-text-3 mt-0.5">{restaurant.tagline}</p>}
              </div>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-text-2 flex-wrap">
              {restaurant.rating !== undefined && (
                <span className="font-semibold text-text">★ {restaurant.rating.toFixed(1)}</span>
              )}
              {restaurant.reviewCount !== undefined && <span className="text-text-3">({restaurant.reviewCount})</span>}
              {restaurant.cuisine && <><span className="text-text-3">·</span><span>{restaurant.cuisine}</span></>}
              {restaurant.restaurantType && <><span className="text-text-3">·</span><span>{TYPE_LABEL[restaurant.restaurantType]}</span></>}
            </div>
          </div>

          {/* ── Bannière promo DOMINATION ── */}
          {restaurant.bannerText && (
            <div className="rounded-2xl overflow-hidden mt-4" style={{ background: restaurant.accentColor ?? 'var(--color-accent)' }}>
              {restaurant.bannerImageUrl && (
                <img src={restaurant.bannerImageUrl} alt="" className="w-full h-24 object-cover" />
              )}
              <div className="px-4 py-3 flex items-center justify-between gap-3">
                <p className="text-sm font-bold text-white leading-tight">{restaurant.bannerText}</p>
                {restaurant.bannerCtaText && (
                  <span className="text-[11px] font-black text-white bg-white/20 px-3 py-1.5 rounded-full whitespace-nowrap shrink-0">
                    {restaurant.bannerCtaText}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* ── Infos rapides ── */}
          <div className="card p-4 space-y-2 mt-4">
            {restaurant.description && (
              <p className="text-xs text-text-2 leading-relaxed">{restaurant.description}</p>
            )}
            {/* Adresse structurée (commune/quartier/numero) ou fallback texte */}
            {(restaurant.address?.commune || restaurant.address?.quartier || restaurant.address?.full) ? (
              <div className="flex items-start gap-2 text-xs text-text-2">
                <span className="text-base shrink-0">📍</span>
                <span>
                  {restaurant.address.commune || restaurant.address.quartier
                    ? [
                        restaurant.address.numero,
                        restaurant.address.quartier,
                        restaurant.address.commune,
                      ].filter(Boolean).join(', ')
                    : restaurant.address.full}
                  {restaurant.address.reference && (
                    <span className="text-text-3 block mt-0.5 italic">{restaurant.address.reference}</span>
                  )}
                </span>
              </div>
            ) : null}
            {restaurant.phone && (
              <a href={`tel:${restaurant.phone}`} className="flex items-center gap-2 text-xs text-accent font-semibold">
                <span className="text-base">📞</span>
                {restaurant.phone}
              </a>
            )}
          </div>

          {/* ── Histoire ── */}
          {restaurant.story && (
            <div className="card p-4 space-y-1">
              <h3 className="text-sm font-bold text-text">Notre histoire</h3>
              <p className="text-xs text-text-2 leading-relaxed">{restaurant.story}</p>
            </div>
          )}

          {/* ── Galerie ── */}
          {(restaurant.gallery?.length ?? 0) > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-bold text-text">Galerie</h3>
              <div className="grid grid-cols-3 gap-2">
                {restaurant.gallery!.map((url, i) => (
                  <div key={i} className="aspect-square rounded-xl overflow-hidden bg-surface-2">
                    <img src={url} alt={`Photo ${i + 1}`} className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Tabs ── */}
          <div className="flex gap-1 bg-surface-2 rounded-xl p-1">
            {([
              { id: 'menu',  label: 'Menu' },
              { id: 'offres', label: 'Offres' },
              { id: 'avis',  label: 'Avis' },
              ...(user ? [{ id: 'commandes', label: `Mes commandes${myOrdersHere.length ? ` (${myOrdersHere.length})` : ''}` }] : []),
            ] as { id: Tab; label: string }[]).map(t => (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all duration-150 no-tap ${
                  activeTab === t.id ? 'bg-bg text-text shadow-card' : 'text-text-3 hover:text-text-2'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* ── TAB MENU ── */}
          {activeTab === 'menu' && (
            <div className="space-y-5 pb-20">
              {(!restaurant.menu?.sections?.length) ? (
                <div className="card p-8 text-center">
                  <p className="text-xl mb-1">🍽️</p>
                  <p className="text-xs text-text-3">Menu non disponible</p>
                </div>
              ) : (
                <>
                {restaurant.menu.sections.length > 1 && (
                  <div className="sticky top-0 z-10 -mx-4 px-4 py-2 bg-bg/95 backdrop-blur border-b border-border flex gap-2 flex-wrap">
                    {restaurant.menu.sections.map(section => (
                      <a
                        key={section.id}
                        href={`#menu-section-${section.id}`}
                        onClick={(e) => {
                          e.preventDefault();
                          document.getElementById(`menu-section-${section.id}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
                        }}
                        className="px-3 py-1.5 bg-surface-2 rounded-full text-xs font-bold text-text-2 hover:text-accent hover:bg-accent/10 transition-colors"
                      >
                        {section.title}
                      </a>
                    ))}
                  </div>
                )}
                {restaurant.menu.sections.map(section => (
                  <div key={section.id} id={`menu-section-${section.id}`} className="space-y-1 scroll-mt-28">
                    <h3 className="text-base font-bold text-text px-1 pb-2">{section.title}</h3>
                    <div className="divide-y divide-border">
                      {section.items.filter(item => item.isAvailable).map(item => {
                        const { cdf } = formatPrice(item.priceUsdCents);
                        const hasPromo = !!item.promoPrice;
                        const qty = cart.get(item.id)?.quantity ?? 0;
                        return (
                          <div key={item.id} className="flex items-start gap-3 py-4">
                            {/* Texte — à gauche, comme Uber Eats */}
                            <div className="flex-1 min-w-0 space-y-1">
                              <p className="text-sm font-bold text-text leading-tight">{item.name}</p>
                              {item.description && <p className="text-xs text-text-3 line-clamp-2">{item.description}</p>}
                              <div className="flex items-center gap-2 pt-0.5">
                                <span className="text-sm font-semibold text-text">
                                  {hasPromo ? formatPrice(item.promoPrice!).cdf : cdf}
                                </span>
                                {hasPromo && <span className="text-xs text-text-3 line-through">{cdf}</span>}
                              </div>
                              <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                                {item.isDailySpecial && <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-surface-2 text-text-2">🌟 Plat du jour</span>}
                                {item.isHot && <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-surface-2 text-text-2">🔥 Populaire</span>}
                                {item.isLastUnits && <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-surface-2 text-text-2">⚡ Derniers</span>}
                              </div>
                            </div>

                            {/* Image — à droite, avec bouton + qui chevauche le coin */}
                            <div className="relative w-24 h-24 shrink-0">
                              <div className="w-full h-full rounded-xl overflow-hidden bg-surface-2">
                                {item.imageUrl ? (
                                  <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-2xl">🍽️</div>
                                )}
                              </div>
                              {canOrder && (
                                qty > 0 ? (
                                  <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-1.5 bg-bg border border-border rounded-full px-1 py-1 shadow-card">
                                    <button onClick={() => removeFromCart(item.id)}
                                      className="w-6 h-6 rounded-full bg-surface-2 text-text font-bold text-sm flex items-center justify-center no-tap active:scale-90 transition-transform">−</button>
                                    <span className="text-xs font-bold text-text w-3 text-center">{qty}</span>
                                    <button onClick={() => addToCart(item)}
                                      className="w-6 h-6 rounded-full bg-text text-bg font-bold text-sm flex items-center justify-center no-tap active:scale-90 transition-transform">+</button>
                                  </div>
                                ) : (
                                  <button
                                    onClick={() => addToCart(item)}
                                    className="absolute -bottom-2 -right-1 w-8 h-8 rounded-full bg-text text-bg font-bold text-lg flex items-center justify-center no-tap active:scale-90 transition-transform shadow-card border-2 border-bg"
                                  >+</button>
                                )
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
                </>
              )}
            </div>
          )}

          {/* ── TAB OFFRES ── */}
          {activeTab === 'offres' && (
            <div className="space-y-3 pb-20">
              {(!restaurant.activeOffers?.length) ? (
                <div className="card p-8 text-center">
                  <p className="text-xl mb-1">🏷️</p>
                  <p className="text-xs text-text-3">Aucune offre active</p>
                </div>
              ) : (
                restaurant.activeOffers.map(offer => (
                  <div key={offer.id} className="card p-4 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">
                          {offer.type === 'FLASH' ? '⚡' : offer.type === 'POINTS' ? '⭐' : '🏷️'}
                        </span>
                        <div>
                          <p className="text-sm font-bold text-text">{offer.title ?? `Offre ${offer.type}`}</p>
                          <p className="text-xs text-text-3">{offer.type}</p>
                        </div>
                      </div>
                      {offer.discountPct && (
                        <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400">
                          -{offer.discountPct}%
                        </span>
                      )}
                      {offer.pointsCost && (
                        <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                          {offer.pointsCost} pts
                        </span>
                      )}
                    </div>
                    {offer.description && (
                      <p className="text-xs text-text-2">{offer.description}</p>
                    )}
                    {offer.expiresAt && (
                      <p className="text-xs text-text-3">
                        Expire le {new Date(offer.expiresAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}
                      </p>
                    )}
                    {offer.maxUses && (
                      <p className="text-xs text-text-3">
                        {offer.usedCount ?? 0} / {offer.maxUses} utilisations
                      </p>
                    )}
                  </div>
                ))
              )}
            </div>
          )}

          {/* ── TAB AVIS ── */}
          {activeTab === 'avis' && (
            <div className="space-y-3 pb-20">
              {(!restaurant.recentReviews?.length) ? (
                <div className="card p-8 text-center">
                  <p className="text-xl mb-1">💬</p>
                  <p className="text-xs text-text-3">Aucun avis pour l'instant</p>
                </div>
              ) : (
                restaurant.recentReviews.map(review => (
                  <div key={review.id} className="card p-4 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-bold text-text">
                          {review.user.firstName} {review.user.lastName[0]}.
                        </p>
                        <p className="text-[10px] text-text-3">{formatDate(review.createdAt)}</p>
                      </div>
                      <StarRow rating={review.rating} />
                    </div>
                    {review.comment && (
                      <p className="text-xs text-text-2 leading-relaxed">{review.comment}</p>
                    )}
                    {review.ownerReply && (
                      <div className="mt-2 pl-3 border-l-2 border-accent/30">
                        <p className="text-[10px] font-bold text-accent mb-0.5">Réponse du restaurant</p>
                        <p className="text-xs text-text-3">{review.ownerReply}</p>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}

          {/* ── TAB COMMANDES (client) ── */}
          {activeTab === 'commandes' && (
            <div className="space-y-3 pb-20">
              {myOrdersHere.length === 0 ? (
                <div className="card p-8 text-center">
                  <p className="text-xl mb-1">🛍️</p>
                  <p className="text-xs text-text-3">Aucune commande dans ce restaurant</p>
                </div>
              ) : (
                myOrdersHere.map(order => {
                  const isTerminal = ['DELIVERED', 'CANCELLED'].includes(order.status);
                  const canPay = !order.isPaid && order.status !== 'CANCELLED';
                  return (
                    <div key={order.id} className="card p-4 space-y-2">
                      <button
                        onClick={() => setOpenMyOrderId(order.id)}
                        className="w-full space-y-1.5 text-left"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-xs text-text-3">
                            {new Date(order.createdAt).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' })}
                          </p>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-text-2">{formatPrice(order.totalCents).cdf}</span>
                            {order.isPaid ? (
                              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-400">✓ Payée</span>
                            ) : (
                              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-yellow-100 text-yellow-700 dark:bg-yellow-950/40 dark:text-yellow-400">Non payée</span>
                            )}
                          </div>
                        </div>
                        <p className="text-xs text-text-2">
                          {order.items.length} article{order.items.length > 1 ? 's' : ''}
                        </p>
                        <p className={`text-[11px] font-semibold ${isTerminal ? (order.status === 'CANCELLED' ? 'text-red-500' : 'text-green-600 dark:text-green-400') : 'text-accent'}`}>
                          {order.status === 'CANCELLED' ? '✕ Annulée' : order.status === 'DELIVERED' ? '✓ Terminée' : 'En cours — voir le détail'}
                        </p>
                      </button>
                      {canPay && (
                        <button
                          onClick={() => payForOrder(order)}
                          className="w-full py-2 rounded-xl bg-accent text-white text-xs font-bold"
                        >
                          💳 Payer cette commande
                        </button>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          )}

        </div>
      </AppLayout>

      {/* ── Sticky bar actions ── */}
      {/* Décalée au-dessus du BottomNav mobile (z-50) pour ne jamais le chevaucher */}
      <div
        className={`fixed left-0 right-0 z-40 p-3 bg-gradient-to-t from-bg via-bg/95 to-transparent pointer-events-none ${isDesktop ? 'bottom-0' : 'bottom-[72px]'}`}
      >
        <div className="pointer-events-auto w-full max-w-md mx-auto flex gap-2">

          {/* Réserver — masqué si livraison pure */}
          {restaurant?.restaurantType !== 'LIVRAISON' && (
            <button
              onClick={() => setShowModal(true)}
              className="flex-1 flex items-center justify-center gap-1.5 py-3 rounded-2xl bg-surface border border-border text-text text-xs font-bold shadow-lg active:scale-[0.98] transition-transform no-tap"
            >
              📅 Réserver
            </button>
          )}

          {/* Commander — TOUJOURS visible */}
          {canOrder ? (
            <button
              onClick={() => setShowCart(true)}
              className="flex-1 flex items-center justify-center gap-1.5 py-3 rounded-2xl bg-accent text-white text-xs font-bold shadow-xl active:scale-[0.98] transition-transform no-tap relative"
            >
              🛒 Commander
              {cartCount > 0 && (
                <span className="absolute -top-1.5 -right-1 bg-white text-accent text-[10px] font-black rounded-full w-5 h-5 flex items-center justify-center shadow">
                  {cartCount}
                </span>
              )}
              {cartCount > 0 && (
                <span className="text-white/80 text-[10px] ml-1">· {formatPrice(cartTotal).cdf}</span>
              )}
            </button>
          ) : (
            <button
              disabled
              className="flex-1 flex flex-col items-center justify-center py-2.5 rounded-2xl bg-surface-2 border border-border text-text-3 text-xs font-bold shadow opacity-60 cursor-not-allowed"
            >
              <span>🛒 Commander</span>
              <span className="text-[9px] font-normal mt-0.5 text-text-3">
                Non disponible pour ce restaurant
              </span>
            </button>
          )}

        </div>
      </div>

      {/* ── Drawer panier ── */}
      {showCart && (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowCart(false)} />
          <div className="relative w-full max-w-lg bg-bg rounded-t-3xl shadow-2xl max-h-[85vh] flex flex-col">
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full bg-border" />
            </div>
            <div className="px-4 pb-2 flex items-center justify-between">
              <h3 className="text-base font-black text-text">Mon panier</h3>
              <button onClick={() => setShowCart(false)} className="text-text-3 p-1">✕</button>
            </div>

            <div className="overflow-y-auto flex-1 px-4 space-y-2 pb-2">
              {orderSuccess ? (
                <div className="py-8 text-center space-y-3">
                  <p className="text-4xl">✅</p>
                  <p className="text-sm font-bold text-text">Commande envoyée !</p>
                  <p className="text-xs text-text-3">Le restaurant a été notifié.</p>
                  <button onClick={() => { setOrderSuccess(false); setShowCart(false); }} className="px-4 py-2 rounded-xl bg-accent text-white text-xs font-bold">Fermer</button>
                </div>
              ) : cartItems.length === 0 ? (
                <div className="py-8 text-center">
                  <p className="text-3xl mb-2">🛒</p>
                  <p className="text-sm text-text-3">Panier vide — ajoutez des plats</p>
                </div>
              ) : (
                <>
                  {cartItems.map(ci => (
                    <div key={ci.menuItemId} className="card p-3 flex items-center gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-text truncate">{ci.name}</p>
                        <p className="text-xs text-accent font-semibold">{formatPrice(ci.effectivePrice * ci.quantity).cdf}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button onClick={() => removeFromCart(ci.menuItemId)} className="w-7 h-7 rounded-full bg-surface-2 border border-border text-text font-bold flex items-center justify-center no-tap">−</button>
                        <span className="text-sm font-black text-text w-4 text-center">{ci.quantity}</span>
                        <button onClick={() => { const item = restaurant?.menu?.sections?.flatMap((s:any) => s.items).find((i:any) => i.id === ci.menuItemId); if (item) addToCart(item); }} className="w-7 h-7 rounded-full bg-accent text-white font-bold flex items-center justify-center no-tap">+</button>
                      </div>
                    </div>
                  ))}

                  {/* Type de service — masqué si restaurant livraison uniquement (choix auto) */}
                  {(canDineIn || (canDeliver && restaurant?.restaurantType !== 'LIVRAISON')) && (
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-text-2">Comment souhaitez-vous commander ?</label>
                      <div className={`grid gap-1.5 ${[canDineIn, true, canDeliver].filter(Boolean).length === 3 ? 'grid-cols-3' : 'grid-cols-2'}`}>
                        {canDineIn && (
                          <button
                            type="button"
                            onClick={() => setServiceType('DINE_IN')}
                            className={`py-2.5 rounded-xl text-xs font-bold transition-all ${serviceType === 'DINE_IN' ? 'bg-accent text-white' : 'bg-surface-2 text-text-2'}`}
                          >
                            🍽️ Sur place
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => setServiceType('TAKEAWAY')}
                          className={`py-2.5 rounded-xl text-xs font-bold transition-all ${serviceType === 'TAKEAWAY' ? 'bg-accent text-white' : 'bg-surface-2 text-text-2'}`}
                        >
                          🛍️ À emporter
                        </button>
                        {canDeliver && (
                          <button
                            type="button"
                            onClick={() => setServiceType('DELIVERY')}
                            className={`py-2.5 rounded-xl text-xs font-bold transition-all ${serviceType === 'DELIVERY' ? 'bg-accent text-white' : 'bg-surface-2 text-text-2'}`}
                          >
                            🛵 Livraison
                          </button>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Choix de la table (si sur place) — astuce : scanner le QR de la table évite cette étape */}
                  {serviceType === 'DINE_IN' && (
                    <div className="space-y-2 rounded-xl bg-accent/5 border border-accent/20 p-3">
                      <label className="text-xs font-semibold text-text flex items-center gap-1">🍽️ N° de votre table *</label>
                      {publicTables.length === 0 ? (
                        <p className="text-[11px] text-text-3">Aucune table configurée — un membre du personnel vous installera.</p>
                      ) : (
                        <>
                          <input
                            type="number"
                            min="1"
                            value={tableNumberInput}
                            onChange={e => setTableNumberInput(e.target.value)}
                            placeholder="Ex : 4"
                            className="input-base w-full px-3 py-2 text-sm"
                          />
                          {tableNumberInput && !matchedTable && (
                            <p className="text-[11px] text-red-500">Aucune table portant ce numéro</p>
                          )}
                          <p className="text-[10px] text-text-3">
                            💡 Le plus simple reste de scanner le QR code affiché sur votre table — la commande s'y rattache automatiquement.
                          </p>
                        </>
                      )}
                    </div>
                  )}

                  {/* Adresse de livraison (si livraison choisie) */}
                  {isDelivery && (
                    <div className="space-y-2 rounded-xl bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 p-3">
                      <label className="text-xs font-semibold text-blue-700 dark:text-blue-300 flex items-center gap-1">
                        📍 Adresse de livraison *
                      </label>
                      <input
                        value={deliveryAddress}
                        onChange={e => setDeliveryAddress(e.target.value)}
                        placeholder="Ex: Av. de la Victoire 12, Gombe…"
                        className="input-base w-full px-3 py-2 text-xs"
                      />
                      <button
                        type="button"
                        onClick={geolocateMe}
                        disabled={locating}
                        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 border-dashed border-blue-400 dark:border-blue-600 text-blue-600 dark:text-blue-400 text-xs font-bold transition-all hover:bg-blue-50 dark:hover:bg-blue-950/40 active:scale-[0.98] disabled:opacity-50 no-tap"
                      >
                        {locating ? (
                          <>
                            <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4"/></svg>
                            Localisation en cours…
                          </>
                        ) : (
                          <>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><circle cx="12" cy="12" r="3"/><path d="M12 1v4M12 19v4M1 12h4M19 12h4"/></svg>
                            Utiliser ma position GPS
                          </>
                        )}
                      </button>
                      {geoError && (
                        <p className="text-[11px] text-red-500 font-medium flex items-center gap-1">⚠️ {geoError}</p>
                      )}
                      {deliveryLat && deliveryLng && !geoError && (
                        <p className="text-[10px] text-green-600 dark:text-green-400 flex items-center gap-1">
                          ✅ GPS capturé — le livreur pourra vous trouver facilement
                        </p>
                      )}
                    </div>
                  )}

                  {/* Notes commande */}
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-text-2">Notes (optionnel)</label>
                    <textarea
                      value={orderNotes}
                      onChange={e => setOrderNotes(e.target.value)}
                      placeholder="Instructions spéciales, allergies…"
                      rows={2}
                      className="input-base w-full px-3 py-2 resize-none text-xs"
                    />
                  </div>

                  {/* Total */}
                  <div className="card p-3 flex items-center justify-between">
                    <span className="text-sm font-bold text-text">Total</span>
                    <div className="text-right">
                      <p className="text-base font-black text-accent">{formatPrice(cartTotal).cdf}</p>
                      <p className="text-xs text-text-3">{formatPrice(cartTotal).usd}</p>
                    </div>
                  </div>

                  {orderError && <p className="text-xs text-red-500 font-semibold">{orderError}</p>}
                </>
              )}
            </div>

            {!orderSuccess && cartItems.length > 0 && (
              <div className="p-4 border-t border-border">
                <button
                  onClick={submitOrder}
                  disabled={ordering}
                  className="w-full py-3.5 rounded-2xl bg-accent text-white text-sm font-bold shadow-lg disabled:opacity-50 transition-opacity no-tap active:scale-[0.98]"
                >
                  {ordering ? 'Envoi en cours…' : `Confirmer la commande · ${formatPrice(cartTotal).cdf}`}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Modal réservation ── */}
      {showModal && id && (
        <ReservationModal restaurantId={id} onClose={() => setShowModal(false)} />
      )}

      {/* ── Modal détail commande ── */}
      {openMyOrder && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setOpenMyOrderId(null)} />
          <div className="relative w-full md:max-w-md bg-bg rounded-t-3xl md:rounded-3xl shadow-2xl max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5">
              <div>
                <p className="text-base font-bold text-text">Détail de la commande</p>
                <p className="text-xs text-text-3 mt-0.5">
                  {new Date(openMyOrder.createdAt).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' })}
                </p>
              </div>
              <button onClick={() => setOpenMyOrderId(null)} className="text-text-3 hover:text-text p-1">✕</button>
            </div>
            <div className="px-5 pb-5 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-lg font-black text-text">{formatPrice(openMyOrder.totalCents).cdf}</span>
                {openMyOrder.isPaid ? (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-400">✓ Payée</span>
                ) : (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700 dark:bg-yellow-950/40 dark:text-yellow-400">Non payée</span>
                )}
              </div>
              <div className="space-y-1.5 border-t border-border pt-3">
                {openMyOrder.items.map(item => (
                  <div key={item.id} className="text-sm text-text-2">× {item.quantity} {item.name}</div>
                ))}
              </div>
              {['DELIVERED', 'CANCELLED'].includes(openMyOrder.status) ? (
                <p className={`text-sm font-semibold border-t border-border pt-4 ${openMyOrder.status === 'CANCELLED' ? 'text-red-500' : 'text-green-600 dark:text-green-400'}`}>
                  {openMyOrder.status === 'CANCELLED' ? '✕ Commande annulée' : '✓ Commande terminée'}
                </p>
              ) : (
                <div className="border-t border-border pt-4">
                  <OrderStepper
                    status={openMyOrder.status}
                    fulfillment={openMyOrder.deliveryAddress ? 'DELIVERY' : 'TAKEAWAY'}
                  />
                </div>
              )}
              {!openMyOrder.isPaid && openMyOrder.status !== 'CANCELLED' && (
                <button
                  onClick={() => payForOrder(openMyOrder)}
                  className="w-full py-3 rounded-xl bg-accent text-white text-sm font-bold"
                >
                  💳 Payer cette commande
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
