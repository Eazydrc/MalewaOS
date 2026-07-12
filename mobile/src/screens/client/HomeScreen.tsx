import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Image,
  ScrollView, FlatList, RefreshControl, Dimensions,
  StatusBar, Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path, Circle } from 'react-native-svg';
import { colors, spacing, radius, shadow } from '../../theme/colors';
import { useMe, useHomeFeed } from '@elengi/shared';

const { width: SCREEN_W } = Dimensions.get('window');

const USD_TO_CDF = 2800;
function formatPrice(cents: number) {
  const cdf = Math.round((cents / 100) * USD_TO_CDF);
  return new Intl.NumberFormat('fr-CD', { style: 'decimal', maximumFractionDigits: 0 }).format(cdf) + ' FC';
}

// ── Icônes ────────────────────────────────────────────────────────────────────

function SearchIcon() {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={colors.text3} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
      <Circle cx={11} cy={11} r={8}/>
      <Path d="m21 21-4.35-4.35"/>
    </Svg>
  );
}

function ChevronRightIcon() {
  return (
    <Svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={colors.accent} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
      <Path d="m9 18 6-6-6-6"/>
    </Svg>
  );
}

function StarIcon() {
  return (
    <Svg width={11} height={11} viewBox="0 0 24 24" fill={colors.warning} stroke={colors.warning} strokeWidth={1}>
      <Path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
    </Svg>
  );
}

function MapPinIcon() {
  return (
    <Svg width={11} height={11} viewBox="0 0 24 24" fill="none" stroke={colors.text3} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
      <Circle cx={12} cy={10} r={3}/>
    </Svg>
  );
}

// ── Catégories ────────────────────────────────────────────────────────────────

const CATS = [
  { label: 'Congolais', emoji: '🍲', q: 'congolais' },
  { label: 'Poulet',    emoji: '🍗', q: 'poulet' },
  { label: 'Pizza',     emoji: '🍕', q: 'pizza' },
  { label: 'Grillades', emoji: '🥩', q: 'grillades' },
  { label: 'Poisson',   emoji: '🐟', q: 'poisson' },
  { label: 'Burger',    emoji: '🍔', q: 'burger' },
  { label: 'Desserts',  emoji: '🍰', q: 'desserts' },
  { label: 'Livraison', emoji: '🛵', q: 'livraison' },
];

// ── Carrousel auto-boucle ─────────────────────────────────────────────────────

function AutoCarousel({ items, navigation }: { items: any[]; navigation: any }) {
  const [idx, setIdx]   = useState(0);
  const timer           = useRef<ReturnType<typeof setInterval> | null>(null);
  const scrollRef       = useRef<ScrollView>(null);

  const scrollTo = useCallback((i: number) => {
    scrollRef.current?.scrollTo({ x: i * (SCREEN_W - spacing.lg * 2), animated: true });
    setIdx(i);
  }, []);

  const resetTimer = useCallback(() => {
    if (timer.current) clearInterval(timer.current);
    if (items.length > 1) {
      timer.current = setInterval(() => {
        setIdx(cur => {
          const next = (cur + 1) % items.length;
          scrollRef.current?.scrollTo({ x: next * (SCREEN_W - spacing.lg * 2), animated: true });
          return next;
        });
      }, 4000);
    }
  }, [items.length]);

  useEffect(() => {
    resetTimer();
    return () => { if (timer.current) clearInterval(timer.current); };
  }, [resetTimer]);

  if (!items.length) return null;

  const slideW = SCREEN_W - spacing.lg * 2;

  return (
    <View>
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        scrollEventThrottle={16}
        onMomentumScrollEnd={e => {
          const i = Math.round(e.nativeEvent.contentOffset.x / slideW);
          setIdx(i);
          resetTimer();
        }}
        style={{ borderRadius: radius.lg, overflow: 'hidden' }}
      >
        {items.map((item, i) => (
          <TouchableOpacity
            key={item.id ?? i}
            activeOpacity={0.95}
            style={{ width: slideW }}
            onPress={() => {
              const id = item.restaurant?.id ?? item.restaurantId;
              if (id) navigation.navigate('Restaurant', { id });
            }}
          >
            <View style={s.bannerSlide}>
              {(item.imageUrl ?? item.restaurant?.imageUrl) ? (
                <Image
                  source={{ uri: item.imageUrl ?? item.restaurant?.imageUrl }}
                  style={StyleSheet.absoluteFillObject}
                  resizeMode="cover"
                />
              ) : (
                <View style={[StyleSheet.absoluteFillObject, s.bannerPlaceholder]}>
                  <Text style={{ fontSize: 50 }}>{item.type ? '🏷️' : '🍽️'}</Text>
                </View>
              )}
              <View style={s.bannerGradient} />

              {/* Badge type */}
              <View style={s.bannerTopLeft}>
                {item.discountPct ? (
                  <View style={[s.badge, { backgroundColor: '#ef4444' }]}>
                    <Text style={s.badgeText}>-{item.discountPct}% OFF</Text>
                  </View>
                ) : item.type === 'FLASH' ? (
                  <View style={[s.badge, { backgroundColor: '#f97316' }]}>
                    <Text style={s.badgeText}>⚡ FLASH</Text>
                  </View>
                ) : item.type === 'POINTS' ? (
                  <View style={[s.badge, { backgroundColor: '#f59e0b' }]}>
                    <Text style={s.badgeText}>⭐ POINTS</Text>
                  </View>
                ) : (
                  <View style={[s.badge, { backgroundColor: '#f59e0b' }]}>
                    <Text style={s.badgeText}>✨ Plat du jour</Text>
                  </View>
                )}
              </View>

              {/* Info bas */}
              <View style={s.bannerBottom}>
                {item.restaurant?.name && (
                  <Text style={s.bannerRestaurant}>{item.restaurant.name}</Text>
                )}
                <Text style={s.bannerTitle} numberOfLines={1}>
                  {item.name ?? item.title ?? 'Offre spéciale'}
                </Text>
                {item.priceUsdCents && !item.type && (
                  <Text style={s.bannerPrice}>{formatPrice(item.promoPrice ?? item.priceUsdCents)}</Text>
                )}
                {item.expiresAt && (
                  <Text style={s.bannerExpiry}>
                    Expire le {new Date(item.expiresAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                  </Text>
                )}
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Dots */}
      {items.length > 1 && (
        <View style={s.dots}>
          {items.map((_, i) => (
            <TouchableOpacity key={i} onPress={() => { scrollTo(i); resetTimer(); }}>
              <View style={[s.dot, i === idx && s.dotActive]} />
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}

// ── Carte restaurant ──────────────────────────────────────────────────────────

function RestaurantCard({ r, onPress }: { r: any; onPress: () => void }) {
  const stars     = r.rating ? Math.round(r.rating * 10) / 10 : null;
  const isOpen    = r.isOpen !== false;
  const typeLabel = r.restaurantType === 'LIVRAISON'
    ? '🛵 Livraison'
    : r.restaurantType === 'LES_DEUX'
      ? '🍽️ & 🛵'
      : '🍽️ Sur place';

  return (
    <TouchableOpacity style={s.restCard} onPress={onPress} activeOpacity={0.87}>
      <View style={s.restCardImg}>
        {r.imageUrl ? (
          <Image source={{ uri: r.imageUrl }} style={StyleSheet.absoluteFillObject} resizeMode="cover" />
        ) : (
          <View style={[StyleSheet.absoluteFillObject, s.restCardPlaceholder]}>
            <Text style={{ fontSize: 36 }}>🏪</Text>
          </View>
        )}
        {!isOpen && (
          <View style={s.closedOverlay}>
            <Text style={s.closedText}>Fermé</Text>
          </View>
        )}
        <View style={s.restTypeTag}>
          <Text style={s.restTypeText}>{typeLabel}</Text>
        </View>
      </View>
      <View style={s.restCardBody}>
        <Text style={s.restCardName} numberOfLines={1}>{r.name}</Text>
        {r.cuisine && <Text style={s.restCardSub} numberOfLines={1}>{r.cuisine}</Text>}
        <View style={s.restCardMeta}>
          {stars ? (
            <View style={s.restMeta}>
              <StarIcon />
              <Text style={s.restMetaText}>{stars.toFixed(1)}</Text>
              {r.reviewCount ? <Text style={s.restMetaSub}>({r.reviewCount})</Text> : null}
            </View>
          ) : null}
          {r.address?.commune ? (
            <View style={s.restMeta}>
              <MapPinIcon />
              <Text style={s.restMetaSub} numberOfLines={1}>{r.address.commune}</Text>
            </View>
          ) : null}
        </View>
      </View>
    </TouchableOpacity>
  );
}

// ── Squelette de chargement ───────────────────────────────────────────────────

function Skeleton({ style }: { style?: any }) {
  const anim = useRef(new Animated.Value(0.4)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0.4, duration: 800, useNativeDriver: true }),
      ])
    ).start();
  }, []);
  return <Animated.View style={[{ backgroundColor: colors.surface2, borderRadius: radius.md }, style, { opacity: anim }]} />;
}

// ── Écran principal ───────────────────────────────────────────────────────────

export default function HomeScreen({ navigation }: any) {
  const { data: user }                      = useMe();
  const { data: feed, isLoading, refetch }  = useHomeFeed();

  const bodyAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.spring(bodyAnim, { toValue: 1, tension: 60, friction: 12, useNativeDriver: true, delay: 120 } as any).start();
  }, []);

  const hour      = new Date().getHours();
  const greeting  = hour < 12 ? 'Bonjour' : hour < 18 ? 'Bon après-midi' : 'Bonsoir';
  const firstName = user?.firstName ?? '';
  const banners   = [...(feed?.dailySpecials ?? []), ...(feed?.promoOffers ?? [])];

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={colors.bg} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor={colors.accent} />}
        contentContainerStyle={s.scroll}
        stickyHeaderIndices={[0]}
      >

        {/* ── HEADER STICKY ─────────────────────────────────────────────────── */}
        <View style={s.header}>
          <View style={s.headerTop}>
            <View>
              <Text style={s.greetingText}>{greeting} 👋</Text>
              <Text style={s.headerName}>
                {firstName ? firstName : 'Bienvenue sur Delipose'}
              </Text>
            </View>
            <TouchableOpacity
              style={s.avatar}
              onPress={() => navigation.navigate('profile')}
              activeOpacity={0.8}
            >
              <Text style={s.avatarText}>
                {user ? `${user.firstName?.[0] ?? ''}${user.lastName?.[0] ?? ''}` : '?'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Barre de recherche décorative → Search */}
          <TouchableOpacity
            style={s.searchBar}
            onPress={() => navigation.navigate('search')}
            activeOpacity={0.8}
          >
            <SearchIcon />
            <Text style={s.searchPlaceholder}>Restaurant, cuisine, quartier…</Text>
            <View style={s.searchBtn}>
              <Text style={s.searchBtnText}>Chercher</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* ── BODY ──────────────────────────────────────────────────────────── */}
        <Animated.View style={[s.body, {
          opacity: bodyAnim,
          transform: [{ translateY: bodyAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }],
        }]}>

          {/* Points fidélité */}
          {user && (
            <TouchableOpacity
              style={s.pointsCard}
              onPress={() => navigation.navigate('reservations')}
              activeOpacity={0.85}
            >
              <View>
                <Text style={s.pointsLabel}>Vos points fidélité</Text>
                <Text style={s.pointsValue}>
                  {(user.points ?? 0).toLocaleString()}{' '}
                  <Text style={s.pointsUnit}>pts</Text>
                </Text>
              </View>
              <View style={s.pointsIcon}>
                <Text style={{ fontSize: 24 }}>⭐</Text>
              </View>
            </TouchableOpacity>
          )}

          {/* Grand carrousel promos/plats du jour */}
          {isLoading ? (
            <Skeleton style={{ height: 200, borderRadius: radius.lg }} />
          ) : banners.length > 0 ? (
            <AutoCarousel items={banners} navigation={navigation} />
          ) : null}

          {/* Catégories */}
          <View>
            <Text style={s.sectionTitle}>Parcourir</Text>
            <View style={s.catsGrid}>
              {CATS.map(cat => (
                <TouchableOpacity
                  key={cat.label}
                  style={s.catCell}
                  onPress={() => navigation.navigate('search', { q: cat.q || cat.label })}
                  activeOpacity={0.8}
                >
                  <Text style={s.catEmoji}>{cat.emoji}</Text>
                  <Text style={s.catLabel}>{cat.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Restaurants populaires */}
          {isLoading ? (
            <View>
              <Text style={s.sectionTitle}>Restaurants populaires</Text>
              <View style={s.restGrid}>
                <Skeleton style={{ height: 200, flex: 1 }} />
                <Skeleton style={{ height: 200, flex: 1 }} />
              </View>
            </View>
          ) : (feed?.popularRestaurants?.length ?? 0) > 0 ? (
            <View>
              <View style={s.sectionRow}>
                <Text style={s.sectionTitle}>Restaurants populaires</Text>
                <TouchableOpacity style={s.seeAll} onPress={() => navigation.navigate('search')}>
                  <Text style={s.seeAllText}>Tout voir</Text>
                  <ChevronRightIcon />
                </TouchableOpacity>
              </View>
              <View style={s.restGrid}>
                {feed!.popularRestaurants.map((r: any) => (
                  <RestaurantCard
                    key={r.id}
                    r={r}
                    onPress={() => navigation.navigate('Restaurant', { id: r.id })}
                  />
                ))}
              </View>
            </View>
          ) : null}

          {/* Plats du jour */}
          {isLoading ? null : (feed?.dailySpecials?.length ?? 0) > 0 ? (
            <View>
              <View style={s.sectionRow}>
                <Text style={s.sectionTitle}>Plats du jour ✨</Text>
                <TouchableOpacity onPress={() => navigation.navigate('search')}>
                  <Text style={s.seeAllText}>Voir tout →</Text>
                </TouchableOpacity>
              </View>
              <View style={s.restGrid}>
                {feed!.dailySpecials.map((item: any) => (
                  <TouchableOpacity
                    key={item.id}
                    style={s.dishCard}
                    onPress={() => navigation.navigate('Restaurant', { id: item.restaurant.id })}
                    activeOpacity={0.87}
                  >
                    <View style={s.dishCardImg}>
                      {item.imageUrl ? (
                        <Image source={{ uri: item.imageUrl }} style={StyleSheet.absoluteFillObject} resizeMode="cover" />
                      ) : (
                        <View style={[StyleSheet.absoluteFillObject, s.dishPlaceholder]}>
                          <Text style={{ fontSize: 28 }}>🍽️</Text>
                        </View>
                      )}
                      <View style={[s.badge, s.badgeTopLeft, { backgroundColor: '#f59e0b' }]}>
                        <Text style={s.badgeText}>Aujourd'hui</Text>
                      </View>
                      {item.promoPrice && (
                        <View style={[s.badge, s.badgeTopRight, { backgroundColor: '#ef4444' }]}>
                          <Text style={s.badgeText}>PROMO</Text>
                        </View>
                      )}
                    </View>
                    <View style={s.dishCardBody}>
                      <Text style={s.dishName} numberOfLines={1}>{item.name}</Text>
                      <Text style={s.dishPrice}>{formatPrice(item.promoPrice ?? item.priceUsdCents)}</Text>
                      <Text style={s.dishResto} numberOfLines={1}>{item.restaurant.name}</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          ) : null}

          {/* Offres & Promos */}
          {!isLoading && (feed?.promoOffers?.length ?? 0) > 0 && (
            <View>
              <Text style={s.sectionTitle}>Offres & Promos 🏷️</Text>
              <View style={s.offersList}>
                {feed!.promoOffers.map((offer: any) => (
                  <TouchableOpacity
                    key={offer.id}
                    style={s.offerCard}
                    onPress={() => offer.restaurant?.id && navigation.navigate('Restaurant', { id: offer.restaurant.id })}
                    activeOpacity={0.87}
                  >
                    <View style={s.offerThumb}>
                      {offer.restaurant?.imageUrl ? (
                        <Image source={{ uri: offer.restaurant.imageUrl }} style={StyleSheet.absoluteFillObject} resizeMode="cover" />
                      ) : (
                        <Text style={{ fontSize: 24 }}>
                          {offer.type === 'FLASH' ? '⚡' : offer.type === 'POINTS' ? '⭐' : '🏷️'}
                        </Text>
                      )}
                    </View>
                    <View style={s.offerBody}>
                      <View style={s.offerBadges}>
                        {offer.discountPct ? (
                          <View style={[s.badge, { backgroundColor: '#ef4444' }]}>
                            <Text style={s.badgeText}>-{offer.discountPct}%</Text>
                          </View>
                        ) : null}
                        {offer.type === 'FLASH' ? (
                          <View style={[s.badge, { backgroundColor: '#f97316' }]}>
                            <Text style={s.badgeText}>⚡ FLASH</Text>
                          </View>
                        ) : offer.type === 'POINTS' ? (
                          <View style={[s.badge, { backgroundColor: '#f59e0b' }]}>
                            <Text style={s.badgeText}>⭐ POINTS</Text>
                          </View>
                        ) : null}
                      </View>
                      <Text style={s.offerTitle} numberOfLines={1}>
                        {offer.title ?? offer.description ?? 'Offre spéciale'}
                      </Text>
                      <Text style={s.offerResto} numberOfLines={1}>{offer.restaurant?.name}</Text>
                    </View>
                    <ChevronRightIcon />
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* Empty state */}
          {!isLoading &&
            !feed?.dailySpecials?.length &&
            !feed?.promoOffers?.length &&
            !feed?.popularRestaurants?.length && (
            <View style={s.emptyState}>
              <Text style={s.emptyEmoji}>🍽️</Text>
              <Text style={s.emptyTitle}>Découvrez Kinshasa</Text>
              <Text style={s.emptyDesc}>Les restaurants arrivent bientôt</Text>
              <TouchableOpacity
                style={s.emptyBtn}
                onPress={() => navigation.navigate('search')}
                activeOpacity={0.85}
              >
                <Text style={s.emptyBtnText}>Explorer les restaurants</Text>
              </TouchableOpacity>
            </View>
          )}

        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  safe:             { flex: 1, backgroundColor: colors.bg },
  scroll:           { paddingBottom: 100 },

  // Header sticky
  header:           {
    backgroundColor: 'rgba(13,14,30,0.96)',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
    gap: spacing.sm,
  },
  headerTop:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  greetingText:     { fontSize: 11, fontWeight: '700', color: colors.text3, letterSpacing: 0.3 },
  headerName:       { fontSize: 18, fontWeight: '900', color: colors.text, letterSpacing: -0.3 },
  avatar:           {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: colors.accent,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText:       { color: colors.white, fontWeight: '900', fontSize: 13 },
  searchBar:        {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: colors.surface2, borderRadius: radius.lg,
    paddingHorizontal: spacing.md, paddingVertical: 11,
  },
  searchPlaceholder: { flex: 1, fontSize: 13, color: colors.text3 },
  searchBtn:        {
    backgroundColor: colors.accent, borderRadius: radius.md,
    paddingHorizontal: 10, paddingVertical: 4,
  },
  searchBtnText:    { color: colors.white, fontSize: 11, fontWeight: '700' },

  // Body
  body:             { padding: spacing.lg, gap: spacing.xl },

  // Points
  pointsCard:       {
    backgroundColor: colors.surface, borderRadius: radius.lg,
    padding: spacing.md, flexDirection: 'row',
    alignItems: 'center', justifyContent: 'space-between',
    ...shadow.card,
  },
  pointsLabel:      { fontSize: 11, color: colors.text3, fontWeight: '600', marginBottom: 4 },
  pointsValue:      { fontSize: 26, fontWeight: '900', color: colors.text },
  pointsUnit:       { fontSize: 14, fontWeight: '600', color: colors.text3 },
  pointsIcon:       {
    width: 48, height: 48, borderRadius: radius.md,
    backgroundColor: colors.surface2,
    alignItems: 'center', justifyContent: 'center',
  },

  // Carrousel
  bannerSlide:      { height: 200, borderRadius: radius.lg, overflow: 'hidden', backgroundColor: colors.surface2 },
  bannerPlaceholder: { alignItems: 'center', justifyContent: 'center' },
  bannerGradient:   {
    ...StyleSheet.absoluteFillObject,
    // simulate gradient with a semi-transparent overlay
    backgroundColor: 'transparent',
  },
  bannerTopLeft:    { position: 'absolute', top: 12, left: 12, flexDirection: 'row', gap: 6 },
  bannerBottom:     { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 14,
    backgroundColor: 'rgba(0,0,0,0)',
  },
  bannerRestaurant: { fontSize: 10, color: 'rgba(255,255,255,0.65)', fontWeight: '600', marginBottom: 2 },
  bannerTitle:      { fontSize: 17, fontWeight: '900', color: colors.white, lineHeight: 22 },
  bannerPrice:      { fontSize: 12, color: 'rgba(255,255,255,0.75)', fontWeight: '600', marginTop: 3 },
  bannerExpiry:     { fontSize: 10, color: 'rgba(255,255,255,0.55)', marginTop: 2 },
  dots:             { flexDirection: 'row', justifyContent: 'center', marginTop: 8, gap: 6 },
  dot:              { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.35)' },
  dotActive:        { width: 18, backgroundColor: colors.accent },

  // Badges
  badge:            { paddingHorizontal: 8, paddingVertical: 3, borderRadius: radius.full },
  badgeText:        { color: colors.white, fontSize: 9, fontWeight: '900' },
  badgeTopLeft:     { position: 'absolute', top: 8, left: 8 },
  badgeTopRight:    { position: 'absolute', top: 8, right: 8 },

  // Section
  sectionTitle:     { fontSize: 15, fontWeight: '900', color: colors.text },
  sectionRow:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  seeAll:           { flexDirection: 'row', alignItems: 'center', gap: 2 },
  seeAllText:       { color: colors.accent, fontSize: 12, fontWeight: '700' },

  // Catégories
  catsGrid:         { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 },
  catCell:          {
    width: '22%', alignItems: 'center', paddingVertical: 12,
    borderRadius: radius.lg, backgroundColor: colors.surface, ...shadow.card,
  },
  catEmoji:         { fontSize: 22 },
  catLabel:         { fontSize: 9, fontWeight: '700', color: colors.text2, marginTop: 4 },

  // Restaurant grid
  restGrid:         { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 10 },
  restCard:         {
    width: (SCREEN_W - spacing.lg * 2 - 10) / 2,
    backgroundColor: colors.surface, borderRadius: radius.lg,
    overflow: 'hidden', ...shadow.card,
  },
  restCardImg:      { height: 130 },
  restCardPlaceholder: { backgroundColor: colors.surface2, alignItems: 'center', justifyContent: 'center' },
  closedOverlay:    {
    ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center', justifyContent: 'center',
  },
  closedText:       { color: colors.white, fontSize: 11, fontWeight: '900',
    backgroundColor: 'rgba(0,0,0,0.7)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.full,
  },
  restTypeTag:      {
    position: 'absolute', top: 8, right: 8,
    backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: radius.full,
    paddingHorizontal: 6, paddingVertical: 2,
  },
  restTypeText:     { color: colors.white, fontSize: 8, fontWeight: '700' },
  restCardBody:     { padding: 10 },
  restCardName:     { fontSize: 13, fontWeight: '900', color: colors.text },
  restCardSub:      { fontSize: 10, color: colors.text3, marginTop: 1 },
  restCardMeta:     { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 6 },
  restMeta:         { flexDirection: 'row', alignItems: 'center', gap: 3 },
  restMetaText:     { fontSize: 11, fontWeight: '700', color: colors.text },
  restMetaSub:      { fontSize: 9, color: colors.text3 },

  // Plats du jour
  dishCard:         {
    width: (SCREEN_W - spacing.lg * 2 - 10) / 2,
    backgroundColor: colors.surface, borderRadius: radius.lg,
    overflow: 'hidden', ...shadow.card,
  },
  dishCardImg:      { height: 110 },
  dishPlaceholder:  { backgroundColor: colors.surface2, alignItems: 'center', justifyContent: 'center' },
  dishCardBody:     { padding: 10 },
  dishName:         { fontSize: 12, fontWeight: '900', color: colors.text },
  dishPrice:        { fontSize: 12, fontWeight: '700', color: colors.accent, marginTop: 2 },
  dishResto:        { fontSize: 10, color: colors.text3, marginTop: 2 },

  // Offres
  offersList:       { gap: 8, marginTop: 4 },
  offerCard:        {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: colors.surface, borderRadius: radius.lg,
    padding: spacing.md, ...shadow.card,
  },
  offerThumb:       {
    width: 64, height: 64, borderRadius: radius.md,
    backgroundColor: colors.surface2, overflow: 'hidden',
    alignItems: 'center', justifyContent: 'center',
  },
  offerBody:        { flex: 1, gap: 4 },
  offerBadges:      { flexDirection: 'row', gap: 4 },
  offerTitle:       { fontSize: 13, fontWeight: '900', color: colors.text },
  offerResto:       { fontSize: 11, color: colors.text3 },

  // Empty
  emptyState:       { alignItems: 'center', paddingTop: 40, gap: 12 },
  emptyEmoji:       { fontSize: 52 },
  emptyTitle:       { fontSize: 18, fontWeight: '900', color: colors.text },
  emptyDesc:        { fontSize: 13, color: colors.text3 },
  emptyBtn:         {
    backgroundColor: colors.accent, borderRadius: radius.md,
    paddingHorizontal: 24, paddingVertical: 12, marginTop: 4,
  },
  emptyBtnText:     { color: colors.white, fontWeight: '700', fontSize: 14 },
});
