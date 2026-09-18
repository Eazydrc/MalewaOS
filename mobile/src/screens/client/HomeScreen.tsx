import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Image,
  ScrollView, FlatList, RefreshControl, Dimensions,
  StatusBar, Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path, Circle, Line, Polyline } from 'react-native-svg';
import { useTheme, spacing, radius, shadow } from '../../theme/colors';
import { useMe, useHomeFeed } from '@elengi/shared';

const { width: SW } = Dimensions.get('window');

const USD_TO_CDF = 2800;
function fmtPrice(cents: number) {
  const cdf = Math.round((cents / 100) * USD_TO_CDF);
  return new Intl.NumberFormat('fr-CD', { style: 'decimal', maximumFractionDigits: 0 }).format(cdf) + ' FC';
}

// ── Icônes inline SVG ────────────────────────────────────────────────────────

function IcoSearch({ color }: { color: string }) {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
      <Circle cx={11} cy={11} r={8} /><Path d="m21 21-4.35-4.35" />
    </Svg>
  );
}
function IcoPin({ color }: { color: string }) {
  return (
    <Svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><Circle cx={12} cy={10} r={3} />
    </Svg>
  );
}
function IcoChevronDown({ color }: { color: string }) {
  return (
    <Svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
      <Polyline points="6 9 12 15 18 9" />
    </Svg>
  );
}
function IcoStar({ color }: { color: string }) {
  return (
    <Svg width={12} height={12} viewBox="0 0 24 24" fill={color} stroke={color} strokeWidth={1}>
      <Path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
    </Svg>
  );
}
function IcoClock({ color }: { color: string }) {
  return (
    <Svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round">
      <Circle cx={12} cy={12} r={10} /><Path d="M12 6v6l4 2" />
    </Svg>
  );
}
function IcoChevronRight({ color }: { color: string }) {
  return (
    <Svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
      <Path d="m9 18 6-6-6-6" />
    </Svg>
  );
}

// ── Catégories ────────────────────────────────────────────────────────────────

const CATS = [
  { label: 'Tout',      emoji: '🍽️', q: '' },
  { label: 'Congolais', emoji: '🍲', q: 'congolais' },
  { label: 'Poulet',    emoji: '🍗', q: 'poulet' },
  { label: 'Pizza',     emoji: '🍕', q: 'pizza' },
  { label: 'Grillades', emoji: '🥩', q: 'grillades' },
  { label: 'Poisson',   emoji: '🐟', q: 'poisson' },
  { label: 'Burger',    emoji: '🍔', q: 'burger' },
  { label: 'Desserts',  emoji: '🍰', q: 'desserts' },
  { label: 'Livraison', emoji: '🛵', q: 'livraison' },
];

// ── Skeleton ─────────────────────────────────────────────────────────────────

function Skeleton({ style }: { style?: any }) {
  const { colors: c } = useTheme();
  const anim = useRef(new Animated.Value(0.45)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 1, duration: 750, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0.45, duration: 750, useNativeDriver: true }),
      ])
    ).start();
  }, []);
  return <Animated.View style={[{ backgroundColor: c.surface2, borderRadius: radius.md }, style, { opacity: anim }]} />;
}

// ── Carte restaurant (style Uber Eats — full width) ───────────────────────────

function RestCard({ r, onPress }: { r: any; onPress: () => void }) {
  const { colors: c } = useTheme();
  const s = mkStyles(c);
  const rating   = r.rating ? (Math.round(r.rating * 10) / 10).toFixed(1) : null;
  const isOpen   = r.isOpen !== false;
  const typeTag  = r.restaurantType === 'LIVRAISON' ? '🛵 Livraison' : r.restaurantType === 'LES_DEUX' ? '🍽️ & 🛵' : '🍽️ Sur place';

  return (
    <TouchableOpacity style={s.restCard} onPress={onPress} activeOpacity={0.9}>
      {/* Image pleine largeur */}
      <View style={s.restImg}>
        {r.imageUrl
          ? <Image source={{ uri: r.imageUrl }} style={StyleSheet.absoluteFillObject} resizeMode="cover" />
          : <View style={[StyleSheet.absoluteFillObject, s.restImgPlaceholder]}><Text style={{ fontSize: 44 }}>🏪</Text></View>}

        {/* Promo badge */}
        {r.hasOffer && (
          <View style={[s.badge, { backgroundColor: c.danger, position: 'absolute', top: 10, left: 10 }]}>
            <Text style={s.badgeText}>Offre dispo</Text>
          </View>
        )}

        {/* Type tag */}
        <View style={s.typeTag}><Text style={s.typeTagText}>{typeTag}</Text></View>

        {/* Fermé overlay */}
        {!isOpen && (
          <View style={s.closedOverlay}>
            <View style={s.closedPill}><Text style={s.closedText}>Fermé</Text></View>
          </View>
        )}
      </View>

      {/* Info */}
      <View style={s.restInfo}>
        <View style={{ flex: 1 }}>
          <Text style={s.restName} numberOfLines={1}>{r.name}</Text>
          {r.cuisine && <Text style={s.restSub} numberOfLines={1}>{r.cuisine}</Text>}

          <View style={s.restMeta}>
            {rating && (
              <View style={s.metaChip}>
                <IcoStar color={c.warning} />
                <Text style={[s.metaText, { color: c.text }]}>{rating}</Text>
                {r.reviewCount ? <Text style={s.metaSub}>({r.reviewCount})</Text> : null}
              </View>
            )}
            <View style={s.metaDot} />
            <View style={s.metaChip}>
              <IcoClock color={c.text3} />
              <Text style={s.metaSub}>20–35 min</Text>
            </View>
            {r.address?.commune && (
              <>
                <View style={s.metaDot} />
                <Text style={s.metaSub} numberOfLines={1}>{r.address.commune}</Text>
              </>
            )}
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

// ── Bannière promo (style Uber Eats hero card) ────────────────────────────────

function PromoCard({ item, onPress }: { item: any; onPress: () => void }) {
  const { colors: c } = useTheme();
  const s = mkStyles(c);
  const img = item.imageUrl ?? item.restaurant?.imageUrl;
  const typeColor = item.type === 'FLASH' ? '#f97316' : item.type === 'POINTS' ? c.warning : c.danger;

  return (
    <TouchableOpacity style={s.promoCard} onPress={onPress} activeOpacity={0.9}>
      <View style={s.promoImg}>
        {img
          ? <Image source={{ uri: img }} style={StyleSheet.absoluteFillObject} resizeMode="cover" />
          : <View style={[StyleSheet.absoluteFillObject, s.promoImgPlaceholder]}><Text style={{ fontSize: 48 }}>🏷️</Text></View>}
        <View style={s.promoGradient} />
        {/* Badge */}
        <View style={[s.badge, { backgroundColor: typeColor, position: 'absolute', top: 12, left: 12 }]}>
          <Text style={s.badgeText}>
            {item.discountPct ? `-${item.discountPct}% OFF` : item.type === 'FLASH' ? '⚡ FLASH' : item.type === 'POINTS' ? '⭐ POINTS' : '✨ Offre'}
          </Text>
        </View>
      </View>
      <View style={s.promoBody}>
        {item.restaurant?.name && <Text style={s.promoResto}>{item.restaurant.name}</Text>}
        <Text style={s.promoTitle} numberOfLines={1}>{item.name ?? item.title ?? 'Offre spéciale'}</Text>
        {item.priceUsdCents && !item.type && (
          <Text style={s.promoPrice}>{fmtPrice(item.promoPrice ?? item.priceUsdCents)}</Text>
        )}
      </View>
    </TouchableOpacity>
  );
}

// ── Section header ─────────────────────────────────────────────────────────────

function SectionHeader({ title, onSeeAll }: { title: string; onSeeAll?: () => void }) {
  const { colors: c } = useTheme();
  const s = mkStyles(c);
  return (
    <View style={s.sectionRow}>
      <Text style={s.sectionTitle}>{title}</Text>
      {onSeeAll && (
        <TouchableOpacity onPress={onSeeAll} style={s.seeAllBtn}>
          <Text style={s.seeAllText}>Tout voir</Text>
          <IcoChevronRight color={c.accent} />
        </TouchableOpacity>
      )}
    </View>
  );
}

// ── Écran ────────────────────────────────────────────────────────────────────

export default function HomeScreen({ navigation }: any) {
  const { colors: c } = useTheme();
  const s = mkStyles(c);
  const { data: user }                     = useMe();
  const { data: feed, isLoading, refetch } = useHomeFeed();
  const [activeCat, setActiveCat]          = useState('');

  const fadeIn = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(fadeIn, { toValue: 1, duration: 320, useNativeDriver: true, delay: 80 }).start();
  }, []);

  const banners = [...(feed?.dailySpecials ?? []), ...(feed?.promoOffers ?? [])];
  const restaurants = (feed?.popularRestaurants ?? []).filter((r: any) =>
    activeCat === '' ? true : (r.cuisine ?? '').toLowerCase().includes(activeCat)
  );
  const firstName = user?.firstName ?? '';

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={c.bg} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor={c.accent} />}
        contentContainerStyle={s.scroll}
        stickyHeaderIndices={[0]}
      >

        {/* ── HEADER STICKY (style Uber Eats) ────────────────────────────── */}
        <View style={s.header}>
          {/* Ligne lieu */}
          <View style={s.locRow}>
            <IcoPin color={c.accent} />
            <Text style={s.locLabel}>Kinshasa</Text>
            <IcoChevronDown color={c.text3} />
            <View style={{ flex: 1 }} />
            <TouchableOpacity style={s.avatar} onPress={() => navigation.navigate('profile')} activeOpacity={0.8}>
              <Text style={s.avatarText}>
                {user ? `${user.firstName?.[0] ?? ''}${user.lastName?.[0] ?? ''}` : '?'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Barre de recherche pill */}
          <TouchableOpacity style={s.searchPill} onPress={() => navigation.navigate('search')} activeOpacity={0.85}>
            <IcoSearch color={c.text3} />
            <Text style={s.searchText}>Restaurants, plats, cuisines…</Text>
          </TouchableOpacity>
        </View>

        {/* ── BODY ───────────────────────────────────────────────────────── */}
        <Animated.View style={{ opacity: fadeIn }}>

          {/* Points fidélité — banner fin style Uber Cash */}
          {user && (user.points ?? 0) > 0 && (
            <TouchableOpacity style={s.pointsBanner} onPress={() => navigation.navigate('reservations')} activeOpacity={0.85}>
              <Text style={{ fontSize: 18 }}>⭐</Text>
              <View style={{ flex: 1 }}>
                <Text style={s.pointsLabel}>Vos points fidélité</Text>
                <Text style={s.pointsVal}>{(user.points ?? 0).toLocaleString()} pts disponibles</Text>
              </View>
              <IcoChevronRight color={c.accent} />
            </TouchableOpacity>
          )}

          {/* Carrousel promos */}
          {isLoading ? (
            <View style={s.promoRow}>
              <Skeleton style={{ width: SW * 0.72, height: 190 }} />
              <Skeleton style={{ width: SW * 0.72, height: 190 }} />
            </View>
          ) : banners.length > 0 ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.promoRow}>
              {banners.map((item: any, i: number) => (
                <PromoCard
                  key={item.id ?? i}
                  item={item}
                  onPress={() => {
                    const id = item.restaurant?.id ?? item.restaurantId;
                    if (id) navigation.navigate('Restaurant', { id });
                  }}
                />
              ))}
            </ScrollView>
          ) : null}

          {/* Catégories — scroll horizontal */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.catRow}>
            {CATS.map(cat => {
              const active = activeCat === cat.q;
              return (
                <TouchableOpacity
                  key={cat.label}
                  style={[s.catPill, active && s.catPillActive]}
                  onPress={() => {
                    if (cat.q === '') {
                      setActiveCat('');
                    } else if (activeCat === cat.q) {
                      navigation.navigate('search', { q: cat.q });
                    } else {
                      setActiveCat(cat.q);
                    }
                  }}
                  activeOpacity={0.8}
                >
                  <Text style={s.catEmoji}>{cat.emoji}</Text>
                  <Text style={[s.catLabel, active && s.catLabelActive]}>{cat.label}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Divider */}
          <View style={s.divider} />

          {/* Restaurants populaires */}
          {isLoading ? (
            <View style={s.listPad}>
              <SectionHeader title="Restaurants populaires" />
              {[1, 2, 3].map(i => (
                <View key={i} style={{ marginBottom: 20 }}>
                  <Skeleton style={{ height: 180, borderRadius: radius.lg, marginBottom: 10 }} />
                  <Skeleton style={{ height: 14, width: '60%', marginBottom: 6 }} />
                  <Skeleton style={{ height: 12, width: '40%' }} />
                </View>
              ))}
            </View>
          ) : restaurants.length > 0 ? (
            <View style={s.listPad}>
              <SectionHeader
                title="Restaurants populaires"
                onSeeAll={() => navigation.navigate('search')}
              />
              {restaurants.map((r: any) => (
                <RestCard
                  key={r.id}
                  r={r}
                  onPress={() => navigation.navigate('Restaurant', { id: r.id })}
                />
              ))}
            </View>
          ) : null}

          {/* Plats du jour */}
          {!isLoading && (feed?.dailySpecials?.length ?? 0) > 0 && (
            <View style={s.listPad}>
              <SectionHeader
                title="Plats du jour ✨"
                onSeeAll={() => navigation.navigate('search')}
              />
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12 }}>
                {feed!.dailySpecials.map((item: any) => (
                  <TouchableOpacity
                    key={item.id}
                    style={s.dishCard}
                    onPress={() => navigation.navigate('Restaurant', { id: item.restaurant.id })}
                    activeOpacity={0.88}
                  >
                    <View style={s.dishImg}>
                      {item.imageUrl
                        ? <Image source={{ uri: item.imageUrl }} style={StyleSheet.absoluteFillObject} resizeMode="cover" />
                        : <View style={[StyleSheet.absoluteFillObject, s.dishImgPlaceholder]}><Text style={{ fontSize: 30 }}>🍽️</Text></View>}
                      {item.promoPrice && (
                        <View style={[s.badge, { backgroundColor: c.danger, position: 'absolute', top: 8, left: 8 }]}>
                          <Text style={s.badgeText}>PROMO</Text>
                        </View>
                      )}
                    </View>
                    <View style={s.dishBody}>
                      <Text style={s.dishName} numberOfLines={2}>{item.name}</Text>
                      <Text style={s.dishPrice}>{fmtPrice(item.promoPrice ?? item.priceUsdCents)}</Text>
                      <Text style={s.dishResto} numberOfLines={1}>{item.restaurant.name}</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

          {/* Empty state */}
          {!isLoading && !feed?.popularRestaurants?.length && !feed?.dailySpecials?.length && (
            <View style={s.empty}>
              <Text style={{ fontSize: 56, marginBottom: 16 }}>🍽️</Text>
              <Text style={s.emptyTitle}>Découvrez Kinshasa</Text>
              <Text style={s.emptySub}>Les restaurants arrivent bientôt</Text>
              <TouchableOpacity style={s.emptyBtn} onPress={() => navigation.navigate('search')} activeOpacity={0.85}>
                <Text style={s.emptyBtnText}>Explorer</Text>
              </TouchableOpacity>
            </View>
          )}

        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

function mkStyles(c: any) {
  return StyleSheet.create({
    safe:   { flex: 1, backgroundColor: c.bg },
    scroll: { paddingBottom: 100 },

    // Header Uber Eats
    header: {
      backgroundColor: c.bg,
      paddingHorizontal: 20,
      paddingTop: 10,
      paddingBottom: 12,
      gap: 12,
      borderBottomWidth: 1,
      borderBottomColor: c.border,
    },
    locRow:    { flexDirection: 'row', alignItems: 'center', gap: 6 },
    locLabel:  { fontSize: 15, fontWeight: '800', color: c.text },
    avatar:    {
      width: 36, height: 36, borderRadius: 18,
      backgroundColor: c.accent,
      alignItems: 'center', justifyContent: 'center',
    },
    avatarText: { color: c.black, fontWeight: '900', fontSize: 12 },

    // Search pill pleine largeur
    searchPill: {
      flexDirection: 'row', alignItems: 'center', gap: 10,
      backgroundColor: c.surface,
      borderRadius: radius.full,
      paddingHorizontal: 16, paddingVertical: 13,
      borderWidth: 1, borderColor: c.border,
    },
    searchText: { fontSize: 14, color: c.text3, flex: 1 },

    // Points banner fin (style Uber Cash)
    pointsBanner: {
      flexDirection: 'row', alignItems: 'center', gap: 12,
      backgroundColor: c.surface,
      marginHorizontal: 20, marginTop: 16,
      borderRadius: radius.lg,
      paddingHorizontal: 16, paddingVertical: 12,
      borderWidth: 1, borderColor: c.accentSoft,
    },
    pointsLabel: { fontSize: 11, color: c.text3, fontWeight: '600' },
    pointsVal:   { fontSize: 13, fontWeight: '800', color: c.accent, marginTop: 1 },

    // Carrousel promos
    promoRow: { paddingHorizontal: 20, gap: 12, paddingTop: 16, paddingBottom: 4 },
    promoCard: {
      width: SW * 0.72, borderRadius: radius.lg, overflow: 'hidden',
      backgroundColor: c.surface, ...shadow.card,
    },
    promoImg:         { height: 140 },
    promoImgPlaceholder: { backgroundColor: c.surface2, alignItems: 'center', justifyContent: 'center' },
    promoGradient:    {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: 'rgba(0,0,0,0.25)',
    },
    promoBody:  { padding: 12 },
    promoResto: { fontSize: 10, color: c.text3, fontWeight: '600', marginBottom: 2 },
    promoTitle: { fontSize: 14, fontWeight: '800', color: c.text },
    promoPrice: { fontSize: 12, color: c.accent, fontWeight: '700', marginTop: 4 },

    // Catégories scroll horizontal
    catRow:      { paddingHorizontal: 20, gap: 8, paddingTop: 16, paddingBottom: 8 },
    catPill:     {
      flexDirection: 'row', alignItems: 'center', gap: 6,
      paddingHorizontal: 14, paddingVertical: 8,
      borderRadius: radius.full,
      backgroundColor: c.surface,
      borderWidth: 1, borderColor: c.border,
    },
    catPillActive: {
      backgroundColor: c.accent,
      borderColor: c.accent,
    },
    catEmoji:      { fontSize: 15 },
    catLabel:      { fontSize: 13, fontWeight: '700', color: c.text2 },
    catLabelActive: { color: c.black },

    divider:  { height: 8, backgroundColor: c.surface, marginTop: 8 },

    // Liste restaurants
    listPad:  { paddingHorizontal: 20, paddingTop: 20, gap: 0 },
    sectionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
    sectionTitle: { fontSize: 18, fontWeight: '900', color: c.text },
    seeAllBtn:  { flexDirection: 'row', alignItems: 'center', gap: 2 },
    seeAllText: { fontSize: 13, color: c.accent, fontWeight: '700' },

    // Carte restaurant full width (Uber Eats style)
    restCard:   {
      marginBottom: 24,
      borderRadius: radius.xl,
      overflow: 'hidden',
      backgroundColor: c.surface,
      ...shadow.card,
    },
    restImg:    { height: 180 },
    restImgPlaceholder: { backgroundColor: c.surface2, alignItems: 'center', justifyContent: 'center' },
    typeTag:    {
      position: 'absolute', bottom: 10, right: 10,
      backgroundColor: 'rgba(0,0,0,0.65)',
      borderRadius: radius.full,
      paddingHorizontal: 8, paddingVertical: 3,
    },
    typeTagText: { color: '#fff', fontSize: 9, fontWeight: '700' },
    closedOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.45)', alignItems: 'center', justifyContent: 'center' },
    closedPill: { backgroundColor: 'rgba(0,0,0,0.75)', borderRadius: radius.full, paddingHorizontal: 14, paddingVertical: 5 },
    closedText: { color: '#fff', fontSize: 12, fontWeight: '900' },

    restInfo:  { padding: 14 },
    restName:  { fontSize: 16, fontWeight: '900', color: c.text, marginBottom: 3 },
    restSub:   { fontSize: 12, color: c.text3, marginBottom: 8 },
    restMeta:  { flexDirection: 'row', alignItems: 'center', gap: 4 },
    metaChip:  { flexDirection: 'row', alignItems: 'center', gap: 3 },
    metaText:  { fontSize: 12, fontWeight: '700' },
    metaSub:   { fontSize: 11, color: c.text3 },
    metaDot:   { width: 3, height: 3, borderRadius: 2, backgroundColor: c.text3 },

    // Plats du jour
    dishCard: {
      width: 150, borderRadius: radius.lg, overflow: 'hidden',
      backgroundColor: c.surface, ...shadow.card,
    },
    dishImg:  { height: 110 },
    dishImgPlaceholder: { backgroundColor: c.surface2, alignItems: 'center', justifyContent: 'center' },
    dishBody: { padding: 10 },
    dishName: { fontSize: 12, fontWeight: '800', color: c.text, lineHeight: 16 },
    dishPrice: { fontSize: 12, fontWeight: '700', color: c.accent, marginTop: 4 },
    dishResto: { fontSize: 10, color: c.text3, marginTop: 2 },

    // Badges
    badge:     { paddingHorizontal: 8, paddingVertical: 3, borderRadius: radius.full },
    badgeText: { color: '#fff', fontSize: 9, fontWeight: '900' },

    // Empty
    empty:     { alignItems: 'center', paddingTop: 60, paddingHorizontal: 40, gap: 8 },
    emptyTitle: { fontSize: 20, fontWeight: '900', color: c.text },
    emptySub:   { fontSize: 14, color: c.text3, textAlign: 'center' },
    emptyBtn:   { marginTop: 16, backgroundColor: c.accent, borderRadius: radius.full, paddingHorizontal: 32, paddingVertical: 14 },
    emptyBtnText: { color: c.black, fontWeight: '900', fontSize: 15 },
  });
}
