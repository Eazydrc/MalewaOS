import { useState, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { useRestaurantPublic } from '@/hooks/useRestaurantPublic';
import { useAuthStore } from '@/store/auth.store';
import { api } from '@/lib/api';
import { formatPrice } from '@/lib/constants';

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

type Tab = 'menu' | 'offres' | 'avis';

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

  const canOrder = ORDER_TIERS.includes(restaurant?.subscription ?? '');

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

  const isDelivery = restaurant?.restaurantType === 'LIVRAISON' || restaurant?.restaurantType === 'LES_DEUX';

  const geolocateMe = useCallback(() => {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      pos => {
        setDeliveryLat(pos.coords.latitude);
        setDeliveryLng(pos.coords.longitude);
        if (!deliveryAddress) setDeliveryAddress('Ma position actuelle');
        setLocating(false);
      },
      () => setLocating(false),
      { enableHighAccuracy: true, timeout: 8000 },
    );
  }, [deliveryAddress]);

  const submitOrder = useCallback(async () => {
    if (!user) { navigate('/login'); return; }
    if (cartItems.length === 0) return;
    if (isDelivery && !deliveryAddress.trim()) {
      setOrderError('Veuillez saisir votre adresse de livraison');
      return;
    }
    setOrdering(true); setOrderError('');
    try {
      const order = await api.post<{ id: string }>('/orders', {
        restaurantId: id,
        items: cartItems.map(i => ({ menuItemId: i.menuItemId, quantity: i.quantity })),
        notes: orderNotes || undefined,
        deliveryAddress: isDelivery ? deliveryAddress.trim() : undefined,
        deliveryLat:     isDelivery ? deliveryLat : undefined,
        deliveryLng:     isDelivery ? deliveryLng : undefined,
      });
      setOrderSuccess(true);
      setCart(new Map());
      setOrderNotes('');
      // Naviguer vers le tracking après un court délai
      if (isDelivery && order?.id) {
        setTimeout(() => navigate(`/track/${order.id}`), 1500);
      }
    } catch (e: any) {
      setOrderError(e.message ?? 'Erreur lors de la commande');
    } finally {
      setOrdering(false);
    }
  }, [user, cartItems, id, orderNotes, navigate, isDelivery, deliveryAddress, deliveryLat, deliveryLng]);

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

          {/* ── Hero ── */}
          <div className="relative h-52 -mx-4 -mt-4 overflow-hidden bg-surface-2">
            {heroImg ? (
              <img src={heroImg} alt={restaurant.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-5xl">🍽️</div>
            )}
            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

            {/* Infos sur l'image */}
            <div className="absolute bottom-0 left-0 right-0 p-4 space-y-2">
              <div className="flex items-start gap-2 flex-wrap">
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  restaurant.isOpen
                    ? 'bg-green-500/90 text-white'
                    : 'bg-red-500/90 text-white'
                }`}>
                  {restaurant.isOpen ? '🟢 Ouvert' : '🔴 Fermé'}
                </span>
                {restaurant.restaurantType && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/20 text-white backdrop-blur-sm">
                    {TYPE_LABEL[restaurant.restaurantType]}
                  </span>
                )}
              </div>
              <div className="flex items-end gap-3">
                {/* Logo brandé DOMINATION */}
                {restaurant.customLogoUrl && (
                  <img src={restaurant.customLogoUrl} alt="Logo"
                    className="w-14 h-14 rounded-2xl object-cover border-2 border-white/60 shadow-lg shrink-0 bg-white" />
                )}
                <div>
                  <h1 className="text-xl font-black text-white leading-tight">{restaurant.name}</h1>
                  {restaurant.tagline && (
                    <p className="text-xs text-white/80 mt-0.5">{restaurant.tagline}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-3">
                {restaurant.cuisine && (
                  <span className="text-xs text-white/70">{restaurant.cuisine}</span>
                )}
                {restaurant.rating && (
                  <span className="flex items-center gap-0.5 text-amber-400 text-xs font-bold">
                    ★ {restaurant.rating.toFixed(1)}
                    {restaurant.reviewCount && (
                      <span className="text-white/60 font-normal ml-0.5">({restaurant.reviewCount})</span>
                    )}
                  </span>
                )}
              </div>
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
                restaurant.menu.sections.map(section => (
                  <div key={section.id} className="space-y-2">
                    <h3 className="text-sm font-bold text-text border-b border-border pb-1">{section.title}</h3>
                    <div className="space-y-2">
                      {section.items.filter(item => item.isAvailable).map(item => {
                        const { cdf, usd } = formatPrice(item.priceUsdCents);
                        const hasPromo = !!item.promoPrice;
                        return (
                          <div key={item.id} className="card p-3 flex gap-3">
                            {item.imageUrl && (
                              <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0 bg-surface-2">
                                <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                              </div>
                            )}
                            <div className="flex-1 min-w-0 space-y-1">
                              <div className="flex items-start gap-1.5 flex-wrap">
                                <p className="text-sm font-bold text-text leading-tight flex-1">{item.name}</p>
                                {item.isDailySpecial && <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 shrink-0">🌟 Plat du jour</span>}
                                {item.isHot && <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 shrink-0">🔥</span>}
                                {item.isLastUnits && <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 shrink-0">⚡ Dernières unités</span>}
                              </div>
                              {item.description && <p className="text-xs text-text-3 line-clamp-2">{item.description}</p>}
                              <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-black text-accent">
                                    {hasPromo ? formatPrice(item.promoPrice!).cdf : cdf}
                                  </span>
                                  {hasPromo && <span className="text-xs text-text-3 line-through">{cdf}</span>}
                                </div>
                                {/* Boutons panier — uniquement si le restaurant accepte les commandes */}
                                {canOrder && (
                                  <div className="flex items-center gap-2 shrink-0">
                                    {cart.get(item.id) ? (
                                      <>
                                        <button
                                          onClick={() => removeFromCart(item.id)}
                                          className="w-7 h-7 rounded-full bg-surface-2 border border-border text-text font-bold text-base flex items-center justify-center no-tap active:scale-90 transition-transform"
                                        >−</button>
                                        <span className="text-sm font-black text-accent w-4 text-center">{cart.get(item.id)!.quantity}</span>
                                        <button
                                          onClick={() => addToCart(item)}
                                          className="w-7 h-7 rounded-full bg-accent text-white font-bold text-base flex items-center justify-center no-tap active:scale-90 transition-transform"
                                        >+</button>
                                      </>
                                    ) : (
                                      <button
                                        onClick={() => addToCart(item)}
                                        className="w-7 h-7 rounded-full bg-accent text-white font-bold text-lg flex items-center justify-center no-tap active:scale-90 transition-transform shadow-sm"
                                      >+</button>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))
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

        </div>
      </AppLayout>

      {/* ── Sticky bar actions ── */}
      <div className="fixed bottom-0 left-0 right-0 z-40 p-3 bg-gradient-to-t from-bg via-bg/95 to-transparent pointer-events-none">
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
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowCart(false)} />
          <div className="absolute bottom-0 left-0 right-0 bg-bg rounded-t-3xl shadow-2xl max-h-[80vh] flex flex-col">
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

                  {/* Adresse de livraison (si restaurant LIVRAISON ou LES_DEUX) */}
                  {isDelivery && (
                    <div className="space-y-2 rounded-xl bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 p-3">
                      <label className="text-xs font-semibold text-blue-700 dark:text-blue-300 flex items-center gap-1">
                        📍 Adresse de livraison *
                      </label>
                      <div className="flex gap-2">
                        <input
                          value={deliveryAddress}
                          onChange={e => setDeliveryAddress(e.target.value)}
                          placeholder="Ex: Av. de la Victoire 12, Gombe…"
                          className="input-base flex-1 px-3 py-2 text-xs"
                        />
                        <button
                          type="button"
                          onClick={geolocateMe}
                          disabled={locating}
                          className="px-3 py-2 rounded-xl bg-blue-600 text-white text-xs font-semibold shrink-0 disabled:opacity-60 active:scale-95"
                          title="Ma position GPS"
                        >
                          {locating ? '...' : '📡'}
                        </button>
                      </div>
                      {deliveryLat && deliveryLng && (
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
    </>
  );
}
