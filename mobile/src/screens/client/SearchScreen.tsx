import React, { useState, useCallback } from 'react';
import {
  View, Text, TextInput, FlatList, TouchableOpacity, StyleSheet,
  Image, Modal, ScrollView, Pressable, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle, Line, Path } from 'react-native-svg';
import { colors, spacing, radius, shadow } from '../../theme/colors';
import { usePublicRestaurants } from '@elengi/shared';

// ── Icons ─────────────────────────────────────────────────────────────────────

function SearchIcon() {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={colors.text3} strokeWidth={2} strokeLinecap="round">
      <Circle cx={11} cy={11} r={8} />
      <Line x1={21} y1={21} x2={16.65} y2={16.65} />
    </Svg>
  );
}

function CloseIcon({ color: c = colors.text3 }: { color?: string }) {
  return (
    <Svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={2.5} strokeLinecap="round">
      <Line x1={18} y1={6} x2={6} y2={18} /><Line x1={6} y1={6} x2={18} y2={18} />
    </Svg>
  );
}

function FilterIcon({ color: c = colors.text2 }: { color?: string }) {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Line x1={4} y1={6} x2={20} y2={6} />
      <Circle cx={9} cy={6} r={2} fill={c} stroke="none" />
      <Line x1={4} y1={12} x2={20} y2={12} />
      <Circle cx={15} cy={12} r={2} fill={c} stroke="none" />
      <Line x1={4} y1={18} x2={20} y2={18} />
      <Circle cx={11} cy={18} r={2} fill={c} stroke="none" />
    </Svg>
  );
}

// ── Constants ─────────────────────────────────────────────────────────────────

const CUISINES = ['Congolaise', 'Grillades', 'Poisson', 'Végétarien', 'Fusion', 'Street food', 'Italienne', 'Libanaise'];
type RestaurantType = 'SUR_PLACE' | 'LIVRAISON' | 'LES_DEUX';
const TYPE_LABELS: Record<RestaurantType, string> = {
  SUR_PLACE: 'Sur place',
  LIVRAISON: 'Livraison',
  LES_DEUX:  'Sur place & Livraison',
};

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ── Restaurant Card ───────────────────────────────────────────────────────────

function RestaurantCard({ r, onPress }: { r: any; onPress: () => void }) {
  const cuisine = r.cuisine ?? (Array.isArray(r.categories) ? r.categories.join(' · ') : '');
  const isDelivery = r.restaurantType === 'LIVRAISON' || r.restaurantType === 'LES_DEUX';

  return (
    <TouchableOpacity style={s.card} onPress={onPress} activeOpacity={0.85}>
      <View style={s.cardImg}>
        {r.logoUrl || r.imageUrl ? (
          <Image source={{ uri: r.logoUrl ?? r.imageUrl }} style={StyleSheet.absoluteFillObject} resizeMode="cover" />
        ) : (
          <Text style={{ fontSize: 32 }}>🍽️</Text>
        )}
        {!r.isOpen && (
          <View style={s.closedOverlay}>
            <Text style={s.closedLabel}>Fermé</Text>
          </View>
        )}
        {isDelivery && r.isOpen && (
          <View style={s.deliveryBadge}>
            <Text style={s.deliveryText}>🛵 Livraison</Text>
          </View>
        )}
      </View>
      <View style={s.cardInfo}>
        <Text style={s.cardName} numberOfLines={1}>{r.name}</Text>
        <View style={s.cardMeta}>
          {typeof r.rating === 'number' && r.rating > 0 && (
            <Text style={s.rating}>★ {r.rating.toFixed(1)}</Text>
          )}
          {!!cuisine && <Text style={s.cuisine} numberOfLines={1}>{cuisine}</Text>}
        </View>
        {r.distance !== undefined && isFinite(r.distance) && (
          <Text style={s.distance}>{r.distance.toFixed(1)} km</Text>
        )}
        {!!r.priceRange && <Text style={s.priceRange}>{'$'.repeat(r.priceRange)}</Text>}
      </View>
    </TouchableOpacity>
  );
}

// ── Pill ──────────────────────────────────────────────────────────────────────

function Pill({
  label, active, onPress, activeColor,
}: { label: string; active: boolean; onPress: () => void; activeColor?: string }) {
  return (
    <TouchableOpacity
      style={[s.pill, active && { backgroundColor: activeColor ?? colors.text, borderColor: activeColor ?? colors.text }]}
      onPress={onPress}
      activeOpacity={0.75}
    >
      <Text style={[s.pillText, active && { color: activeColor ? colors.white : colors.bg }]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────

export default function SearchScreen({ navigation }: any) {
  const [query,          setQuery]          = useState('');
  const [showFilters,    setShowFilters]    = useState(false);
  const [cuisine,        setCuisine]        = useState<string | undefined>();
  const [restaurantType, setRestaurantType] = useState<RestaurantType | undefined>();
  const [openNow,        setOpenNow]        = useState(false);
  const [minRating,      setMinRating]      = useState<number | undefined>();
  const [maxPrice,       setMaxPrice]       = useState<number | undefined>();
  const [maxDistKm,      setMaxDistKm]      = useState<number | undefined>();
  const [userLocation,   setUserLocation]   = useState<{ lat: number; lng: number } | undefined>();
  const [geoLoading,     setGeoLoading]     = useState(false);
  const [geoError,       setGeoError]       = useState('');

  const activeFilterCount = [cuisine, restaurantType, openNow || undefined, minRating, maxPrice, maxDistKm].filter(Boolean).length;

  const { data, isLoading } = usePublicRestaurants({
    search:   query.trim() || undefined,
    category: cuisine,
    limit:    50,
  });

  const applyFilters = useCallback((items: any[]) => {
    let result = items ?? [];
    if (restaurantType) result = result.filter((r: any) => r.restaurantType === restaurantType);
    if (openNow)        result = result.filter((r: any) => r.isOpen);
    if (minRating)      result = result.filter((r: any) => (r.rating ?? 0) >= minRating!);
    if (maxPrice)       result = result.filter((r: any) => !r.priceRange || r.priceRange <= maxPrice!);
    if (userLocation) {
      result = result
        .map((r: any) => ({
          ...r,
          distance: r.lat && r.lng ? haversineKm(userLocation.lat, userLocation.lng, r.lat, r.lng) : Infinity,
        }))
        .sort((a: any, b: any) => a.distance - b.distance);
      if (maxDistKm) result = result.filter((r: any) => (r.distance ?? Infinity) <= maxDistKm!);
    }
    return result;
  }, [restaurantType, openNow, minRating, maxPrice, userLocation, maxDistKm]);

  const results = applyFilters((data as any)?.items ?? data ?? []);

  const handleGeolocate = () => {
    setGeoLoading(true);
    setGeoError('');
    // React Native Geolocation API
    const Geo = require('@react-native-community/geolocation').default;
    Geo.getCurrentPosition(
      (pos: any) => { setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }); setGeoLoading(false); },
      () => { setGeoError('Position indisponible'); setGeoLoading(false); },
      { timeout: 10000 },
    );
  };

  const resetFilters = () => {
    setCuisine(undefined); setRestaurantType(undefined); setOpenNow(false);
    setMinRating(undefined); setMaxPrice(undefined); setMaxDistKm(undefined);
  };

  return (
    <SafeAreaView style={s.safe}>
      {/* Header */}
      <View style={s.header}>
        <View style={s.searchRow}>
          <View style={s.searchWrap}>
            <View style={{ justifyContent: 'center' }}><SearchIcon /></View>
            <TextInput
              style={s.searchInput}
              placeholder="Restaurant, cuisine, quartier…"
              placeholderTextColor={colors.text3}
              value={query}
              onChangeText={setQuery}
              autoFocus
            />
            {!!query && (
              <TouchableOpacity style={{ padding: 4 }} onPress={() => setQuery('')}>
                <CloseIcon />
              </TouchableOpacity>
            )}
          </View>
          <TouchableOpacity
            style={[s.filterBtn, activeFilterCount > 0 && s.filterBtnActive]}
            onPress={() => setShowFilters(true)}
            activeOpacity={0.8}
          >
            <FilterIcon color={activeFilterCount > 0 ? colors.bg : colors.text2} />
            {activeFilterCount > 0 && (
              <View style={s.filterBadge}>
                <Text style={s.filterBadgeText}>{activeFilterCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        <View style={s.metaRow}>
          <Text style={s.resultCount}>
            {isLoading ? 'Recherche…' : `${results.length} restaurant${results.length !== 1 ? 's' : ''}`}
          </Text>
          <TouchableOpacity onPress={handleGeolocate} disabled={geoLoading} style={s.geoBtn}>
            <Svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke={colors.accent} strokeWidth={2.5} strokeLinecap="round">
              <Circle cx={12} cy={12} r={3} /><Path d="M12 1v4M12 19v4M1 12h4M19 12h4" />
            </Svg>
            <Text style={s.geoText}>
              {geoLoading ? 'Localisation…' : userLocation ? 'Localisé ✓' : 'Me localiser'}
            </Text>
          </TouchableOpacity>
        </View>
        {!!geoError && <Text style={s.geoError}>{geoError}</Text>}
      </View>

      {/* Results */}
      <FlatList
        data={results}
        keyExtractor={(r) => r.id}
        contentContainerStyle={s.list}
        numColumns={2}
        columnWrapperStyle={s.row}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <RestaurantCard r={item} onPress={() => navigation.navigate('Restaurant', { id: item.id })} />
        )}
        ListEmptyComponent={
          !isLoading ? (
            <View style={s.empty}>
              <Text style={{ fontSize: 32, marginBottom: 8 }}>🔍</Text>
              <Text style={s.emptyTitle}>Aucun résultat</Text>
              <Text style={s.emptySub}>Essayez d'autres mots-clés ou supprimez des filtres</Text>
            </View>
          ) : null
        }
      />

      {/* Filters Modal */}
      <Modal visible={showFilters} transparent animationType="slide" onRequestClose={() => setShowFilters(false)}>
        <Pressable style={s.backdrop} onPress={() => setShowFilters(false)} />
        <View style={s.sheet}>
          <View style={s.handle} />
          <View style={s.sheetHeader}>
            <Text style={s.sheetTitle}>Filtres</Text>
            <TouchableOpacity onPress={() => setShowFilters(false)}>
              <CloseIcon color={colors.text3} />
            </TouchableOpacity>
          </View>

          <ScrollView style={{ flex: 1 }} contentContainerStyle={s.sheetBody} showsVerticalScrollIndicator={false}>
            <Text style={s.filterLabel}>Cuisine</Text>
            <View style={s.pillRow}>
              {CUISINES.map(c => (
                <Pill key={c} label={c} active={cuisine === c}
                  onPress={() => setCuisine(prev => prev === c ? undefined : c)} />
              ))}
            </View>

            <Text style={s.filterLabel}>Type de service</Text>
            <View style={s.pillRow}>
              {(Object.entries(TYPE_LABELS) as [RestaurantType, string][]).map(([key, label]) => (
                <Pill key={key} label={label} active={restaurantType === key}
                  onPress={() => setRestaurantType(prev => prev === key ? undefined : key)} />
              ))}
            </View>

            <TouchableOpacity
              style={[s.toggleRow, openNow && s.toggleActive]}
              onPress={() => setOpenNow(v => !v)}
            >
              <Text style={[s.toggleText, openNow && { color: colors.white }]}>Ouvert maintenant</Text>
              {openNow && <Text style={{ color: colors.white }}>✓</Text>}
            </TouchableOpacity>

            <Text style={s.filterLabel}>Note minimum</Text>
            <View style={s.pillRow}>
              {[null, 3, 3.5, 4, 4.5].map(v => (
                <Pill key={v ?? 'all'} label={v === null ? 'Tous' : `★ ${v}+`}
                  active={minRating === (v ?? undefined)}
                  onPress={() => setMinRating(v ?? undefined)}
                  activeColor="#F59E0B" />
              ))}
            </View>

            <Text style={s.filterLabel}>Gamme de prix</Text>
            <View style={s.pillRow}>
              {[null, 1, 2, 3, 4].map(v => (
                <Pill key={v ?? 'all'} label={v === null ? 'Tous' : '$'.repeat(v)}
                  active={maxPrice === (v ?? undefined)}
                  onPress={() => setMaxPrice(v ?? undefined)} />
              ))}
            </View>

            {userLocation && (
              <>
                <Text style={s.filterLabel}>Distance maximum</Text>
                <View style={s.pillRow}>
                  {[null, 1, 2, 5, 10].map(v => (
                    <Pill key={v ?? 'all'} label={v === null ? 'Tous' : `${v} km`}
                      active={maxDistKm === (v ?? undefined)}
                      onPress={() => setMaxDistKm(v ?? undefined)}
                      activeColor="#3B82F6" />
                  ))}
                </View>
              </>
            )}
          </ScrollView>

          <View style={s.sheetFooter}>
            <TouchableOpacity style={s.resetBtn} onPress={resetFilters}>
              <Text style={s.resetText}>Réinitialiser</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.applyBtn} onPress={() => setShowFilters(false)}>
              <Text style={s.applyText}>Voir les résultats</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:          { flex: 1, backgroundColor: colors.bg },
  header:        { paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: spacing.sm, gap: spacing.sm },
  searchRow:     { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  searchWrap:    {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.surface2, borderRadius: radius.lg,
    paddingHorizontal: spacing.md, gap: spacing.sm,
  },
  searchInput:   { flex: 1, color: colors.text, fontSize: 15, paddingVertical: 12 },
  filterBtn:     {
    width: 46, height: 46, borderRadius: radius.md,
    backgroundColor: colors.surface2, borderWidth: 1, borderColor: colors.border,
    justifyContent: 'center', alignItems: 'center',
  },
  filterBtnActive:    { backgroundColor: colors.text, borderColor: colors.text },
  filterBadge:   {
    position: 'absolute', top: -6, right: -6,
    width: 18, height: 18, borderRadius: 9,
    backgroundColor: colors.accent, justifyContent: 'center', alignItems: 'center',
  },
  filterBadgeText: { color: colors.white, fontSize: 10, fontWeight: '700' },
  metaRow:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  resultCount:   { fontSize: 12, color: colors.text3, fontWeight: '600' },
  geoBtn:        { flexDirection: 'row', alignItems: 'center', gap: 4 },
  geoText:       { fontSize: 12, color: colors.accent, fontWeight: '700' },
  geoError:      { fontSize: 11, color: colors.danger },
  list:          { padding: spacing.lg, paddingTop: spacing.sm },
  row:           { justifyContent: 'space-between', marginBottom: spacing.md },
  card:          { width: '48%' as any },
  cardImg:       {
    width: '100%', aspectRatio: 4 / 3,
    borderRadius: radius.lg, backgroundColor: colors.surface2,
    overflow: 'hidden', justifyContent: 'center', alignItems: 'center', marginBottom: spacing.sm,
  },
  closedOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' },
  closedLabel:   { color: colors.white, fontSize: 11, fontWeight: '700', backgroundColor: 'rgba(0,0,0,0.6)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: radius.full },
  deliveryBadge: { position: 'absolute', top: 8, left: 8, backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: radius.full, paddingHorizontal: 6, paddingVertical: 3 },
  deliveryText:  { color: colors.white, fontSize: 9, fontWeight: '600' },
  cardInfo:      { gap: 2 },
  cardName:      { fontSize: 13, fontWeight: '700', color: colors.text, lineHeight: 18 },
  cardMeta:      { flexDirection: 'row', alignItems: 'center', gap: 4, flexWrap: 'wrap' },
  rating:        { fontSize: 11, color: '#F59E0B', fontWeight: '700' },
  cuisine:       { fontSize: 11, color: colors.text3, flex: 1 },
  distance:      { fontSize: 11, color: colors.text3 },
  priceRange:    { fontSize: 11, color: colors.text3 },
  empty:         { alignItems: 'center', marginTop: 60, padding: spacing.lg },
  emptyTitle:    { fontSize: 16, fontWeight: '700', color: colors.text, marginBottom: 4 },
  emptySub:      { fontSize: 13, color: colors.text3, textAlign: 'center' },
  backdrop:      { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.5)' } as any,
  sheet:         {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: colors.bg, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl,
    maxHeight: '85%', paddingBottom: spacing.xl,
  },
  handle:        { width: 36, height: 4, backgroundColor: colors.border, borderRadius: 2, alignSelf: 'center', marginTop: 12, marginBottom: 8 },
  sheetHeader:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.lg, paddingBottom: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border },
  sheetTitle:    { fontSize: 16, fontWeight: '700', color: colors.text },
  sheetBody:     { padding: spacing.lg, gap: spacing.md, paddingBottom: 0 },
  filterLabel:   { fontSize: 12, fontWeight: '700', color: colors.text2, marginBottom: 6, marginTop: 4 },
  pillRow:       { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  pill:          { paddingHorizontal: 12, paddingVertical: 7, borderRadius: radius.md, backgroundColor: colors.surface2, borderWidth: 1, borderColor: colors.border },
  pillText:      { fontSize: 12, fontWeight: '600', color: colors.text2 },
  toggleRow:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: spacing.md, borderRadius: radius.md, backgroundColor: colors.surface2, borderWidth: 1, borderColor: colors.border },
  toggleActive:  { backgroundColor: '#16A34A', borderColor: '#16A34A' },
  toggleText:    { fontSize: 13, fontWeight: '600', color: colors.text2 },
  sheetFooter:   { flexDirection: 'row', gap: spacing.sm, padding: spacing.lg, paddingTop: spacing.md, borderTopWidth: 1, borderTopColor: colors.border },
  resetBtn:      { flex: 1, paddingVertical: 13, borderRadius: radius.md, backgroundColor: colors.surface2, alignItems: 'center' },
  resetText:     { fontSize: 14, fontWeight: '700', color: colors.text2 },
  applyBtn:      { flex: 1, paddingVertical: 13, borderRadius: radius.md, backgroundColor: colors.text, alignItems: 'center' },
  applyText:     { fontSize: 14, fontWeight: '700', color: colors.bg },
});
