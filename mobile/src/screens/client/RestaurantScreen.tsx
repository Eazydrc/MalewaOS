import React, { useState } from 'react';
import {
  View, Text, Image, TouchableOpacity,
  StyleSheet, ScrollView, StatusBar, Linking, Alert,
} from 'react-native';
import { colors, spacing, radius, shadow } from '../../theme/colors';
import { usePublicRestaurant, usePublicMenu, usePublicOffers, usePublicReviews } from '@elengi/shared';
import { MenuItem } from '@elengi/shared';

const USD_TO_CDF = 2800;

function fmtPrice(cents: number) {
  return `${Math.round((cents / 100) * USD_TO_CDF).toLocaleString()} FC`;
}

function fmtHour(t?: string) {
  if (!t) return '—';
  const [h, m] = t.split(':');
  return `${h}h${m ?? '00'}`;
}

const DAYS: Record<string, string> = {
  monday: 'Lundi', tuesday: 'Mardi', wednesday: 'Mercredi',
  thursday: 'Jeudi', friday: 'Vendredi', saturday: 'Samedi', sunday: 'Dimanche',
};
const DAY_ORDER = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

function MenuItemCard({ item }: { item: MenuItem }) {
  return (
    <View style={s.menuCard}>
      <View style={{ flex: 1 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Text style={s.menuName}>{item.name}</Text>
          <View style={{ flexDirection: 'row', gap: 4 }}>
            {item.isHot && <Text style={{ fontSize: 14 }}>🔥</Text>}
            {item.isLastUnits && <Text style={{ fontSize: 14 }}>⚡</Text>}
          </View>
        </View>
        {item.description ? <Text style={s.menuDesc} numberOfLines={2}>{item.description}</Text> : null}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: 8 }}>
          {item.promoPrice ? (
            <>
              <Text style={s.promoPrice}>{fmtPrice(item.promoPrice)}</Text>
              <Text style={s.origPrice}>{fmtPrice(item.priceUsdCents)}</Text>
            </>
          ) : (
            <Text style={s.price}>{fmtPrice(item.priceUsdCents)}</Text>
          )}
        </View>
      </View>
      {item.imageUrl && (
        <Image source={{ uri: item.imageUrl }} style={s.menuImg} resizeMode="cover" />
      )}
    </View>
  );
}

function ReviewCard({ review }: { review: any }) {
  const stars = '★'.repeat(review.rating) + '☆'.repeat(5 - review.rating);
  return (
    <View style={s.reviewCard}>
      <View style={s.reviewHeader}>
        <View style={s.reviewAvatar}>
          <Text style={s.reviewAvatarText}>{(review.user?.firstName?.[0] ?? '?').toUpperCase()}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={s.reviewName}>{review.user?.firstName ?? 'Client'}</Text>
          <Text style={{ fontSize: 12, color: '#F59E0B' }}>{stars}</Text>
        </View>
        <Text style={s.reviewDate}>
          {new Date(review.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
        </Text>
      </View>
      {review.comment ? <Text style={s.reviewComment}>{review.comment}</Text> : null}
      {review.ownerReply ? (
        <View style={s.ownerReply}>
          <Text style={s.ownerReplyLabel}>Réponse du restaurant</Text>
          <Text style={s.ownerReplyText}>{review.ownerReply}</Text>
        </View>
      ) : null}
    </View>
  );
}

export default function RestaurantScreen({ route, navigation }: any) {
  const { id } = route.params;
  const [tab, setTab] = useState<'menu' | 'offres' | 'avis' | 'infos'>('menu');

  const { data: restaurant } = usePublicRestaurant(id);
  const { data: menu }       = usePublicMenu(id);
  const { data: offers = [] } = usePublicOffers(id);
  const { data: reviews = [] } = usePublicReviews(id);

  const sections = (menu?.sections ?? []).map((sec: any) => ({
    title: sec.title,
    data:  sec.items.filter((i: any) => i.isAvailable),
  }));

  const avgRating = reviews.length > 0
    ? (reviews.reduce((sum: number, r: any) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : null;

  const openMaps = () => {
    if (!restaurant?.address) return;
    const q = encodeURIComponent(`${restaurant.name}, ${restaurant.address}, Kinshasa`);
    Linking.openURL(`https://maps.google.com/?q=${q}`).catch(() =>
      Alert.alert('Erreur', 'Impossible d\'ouvrir Google Maps'),
    );
  };

  const hours: Record<string, any> = restaurant?.openingHours ?? {};

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      {/* Cover */}
      <View style={s.cover}>
        {restaurant?.coverUrl ? (
          <Image source={{ uri: restaurant.coverUrl }} style={StyleSheet.absoluteFillObject} resizeMode="cover" />
        ) : (
          <View style={[StyleSheet.absoluteFillObject, { backgroundColor: colors.surface2, justifyContent: 'center', alignItems: 'center' }]}>
            <Text style={{ fontSize: 64 }}>🍽️</Text>
          </View>
        )}
        <View style={s.coverOverlay} />
        <TouchableOpacity style={s.back} onPress={() => navigation.goBack()}>
          <Text style={{ color: colors.white, fontSize: 22, fontWeight: '600' }}>←</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={{ flex: 1 }} stickyHeaderIndices={[1]} showsVerticalScrollIndicator={false}>
        {/* Info block */}
        <View style={s.infoBlock}>
          <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm }}>
            <View style={{ flex: 1 }}>
              <Text style={s.name}>{restaurant?.name ?? '…'}</Text>
              <Text style={s.sub}>{restaurant?.category ?? 'Restaurant'} · {restaurant?.address ?? 'Kinshasa'}</Text>
            </View>
            <View style={[s.openBadge, { backgroundColor: restaurant?.isOpen ? 'rgba(74,222,128,0.15)' : 'rgba(248,113,113,0.15)' }]}>
              <Text style={[s.openBadgeText, { color: restaurant?.isOpen ? colors.success : colors.danger }]}>
                {restaurant?.isOpen ? '🟢 Ouvert' : '🔴 Fermé'}
              </Text>
            </View>
          </View>

          <View style={s.statsRow}>
            {avgRating && (
              <View style={s.statItem}>
                <Text style={s.statVal}>★ {avgRating}</Text>
                <Text style={s.statLbl}>{reviews.length} avis</Text>
              </View>
            )}
            {restaurant?.priceRange && (
              <View style={s.statItem}>
                <Text style={s.statVal}>{'$'.repeat(restaurant.priceRange)}</Text>
                <Text style={s.statLbl}>Prix</Text>
              </View>
            )}
            <TouchableOpacity style={s.statItem} onPress={openMaps}>
              <Text style={s.statVal}>📍</Text>
              <Text style={[s.statLbl, { color: colors.accent }]}>Carte</Text>
            </TouchableOpacity>
          </View>

          {restaurant?.description ? <Text style={s.desc}>{restaurant.description}</Text> : null}
        </View>

        {/* Tabs (sticky) */}
        <View style={s.tabs}>
          {(['menu', 'offres', 'avis', 'infos'] as const).map((t) => (
            <TouchableOpacity key={t} style={[s.tabBtn, tab === t && s.tabActive]} onPress={() => setTab(t)}>
              <Text style={[s.tabText, tab === t && s.tabTextActive]}>
                {t === 'menu' ? 'Menu' : t === 'offres' ? 'Offres' : t === 'avis' ? 'Avis' : 'Infos'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Tab: Menu */}
        {tab === 'menu' && (
          <View style={s.tabContent}>
            {sections.length === 0 ? (
              <Text style={s.empty}>Aucun plat disponible</Text>
            ) : sections.map((sec: any) => (
              <View key={sec.title}>
                <Text style={s.sectionTitle}>{sec.title}</Text>
                {sec.data.map((item: any) => <MenuItemCard key={item.id} item={item} />)}
              </View>
            ))}
          </View>
        )}

        {/* Tab: Offres */}
        {tab === 'offres' && (
          <View style={s.tabContent}>
            {offers.length === 0 ? (
              <Text style={s.empty}>Aucune offre active</Text>
            ) : offers.map((o: any) => (
              <View key={o.id} style={s.offerCard}>
                <View style={s.offerBadge}>
                  <Text style={s.offerBadgeText}>{o.type}</Text>
                </View>
                <Text style={s.offerTitle}>{o.title}</Text>
                {o.discountPct && <Text style={s.offerSub}>-{o.discountPct}% de réduction</Text>}
                {o.pointsCost && <Text style={s.offerSub}>🎯 {o.pointsCost} points</Text>}
                {o.description && <Text style={s.offerDesc}>{o.description}</Text>}
              </View>
            ))}
          </View>
        )}

        {/* Tab: Avis */}
        {tab === 'avis' && (
          <View style={s.tabContent}>
            {reviews.length === 0 ? (
              <Text style={s.empty}>Aucun avis pour l'instant</Text>
            ) : (
              <>
                {avgRating && (
                  <View style={{ alignItems: 'center', paddingVertical: spacing.md, gap: 4 }}>
                    <Text style={{ fontSize: 48, fontWeight: '900', color: colors.text }}>{avgRating}</Text>
                    <Text style={{ fontSize: 20, color: '#F59E0B' }}>{'★'.repeat(Math.round(parseFloat(avgRating)))}</Text>
                    <Text style={{ fontSize: 13, color: colors.text3 }}>{reviews.length} avis</Text>
                  </View>
                )}
                {reviews.map((r: any) => <ReviewCard key={r.id} review={r} />)}
              </>
            )}
          </View>
        )}

        {/* Tab: Infos */}
        {tab === 'infos' && (
          <View style={s.tabContent}>
            <View style={s.infoCard}>
              <Text style={s.infoCardTitle}>📍 Adresse</Text>
              <Text style={s.infoCardVal}>{restaurant?.address ?? '—'}</Text>
              {restaurant?.city && <Text style={s.infoCardVal}>{restaurant.city}</Text>}
              <TouchableOpacity onPress={openMaps}>
                <Text style={s.mapsLink}>Ouvrir dans Google Maps →</Text>
              </TouchableOpacity>
            </View>

            {restaurant?.phone && (
              <View style={s.infoCard}>
                <Text style={s.infoCardTitle}>📞 Téléphone</Text>
                <TouchableOpacity onPress={() => Linking.openURL(`tel:${restaurant.phone}`)}>
                  <Text style={[s.infoCardVal, { color: colors.accent }]}>{restaurant.phone}</Text>
                </TouchableOpacity>
              </View>
            )}

            <View style={s.infoCard}>
              <Text style={s.infoCardTitle}>🕐 Horaires</Text>
              {DAY_ORDER.map((day) => {
                const h = hours[day];
                const todayName = new Date().toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
                const isToday = todayName === day;
                return (
                  <View key={day} style={[s.hoursRow, isToday && s.hoursRowToday]}>
                    <Text style={[s.hoursDay, isToday && { color: colors.accent, fontWeight: '700' }]}>
                      {DAYS[day]}
                    </Text>
                    <Text style={[s.hoursTime, isToday && { color: colors.accent }]}>
                      {h?.isOpen === false ? 'Fermé' : h ? `${fmtHour(h.open)} – ${fmtHour(h.close)}` : '—'}
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Sticky CTA */}
      <View style={s.ctaBar}>
        <TouchableOpacity
          style={[s.ctaBtn, !restaurant?.isOpen && s.ctaBtnDisabled]}
          disabled={!restaurant?.isOpen}
          activeOpacity={0.85}
        >
          <Text style={s.ctaBtnText}>
            {restaurant?.isOpen ? '📅 Réserver une table' : '🔴 Restaurant fermé'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  cover:          { height: 240 },
  coverOverlay:   { position: 'absolute', top: 0, left: 0, right: 0, height: 80, backgroundColor: 'rgba(0,0,0,0.3)' },
  back:           { position: 'absolute', top: 52, left: spacing.lg, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: radius.full, width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  infoBlock:      { backgroundColor: colors.bg, padding: spacing.lg, gap: spacing.md },
  name:           { fontSize: 22, fontWeight: '800', color: colors.text, lineHeight: 28 },
  sub:            { fontSize: 13, color: colors.text3, marginTop: 2 },
  openBadge:      { paddingHorizontal: 10, paddingVertical: 5, borderRadius: radius.full },
  openBadgeText:  { fontSize: 12, fontWeight: '700' },
  statsRow:       { flexDirection: 'row', gap: spacing.lg },
  statItem:       { alignItems: 'center', gap: 2 },
  statVal:        { fontSize: 14, fontWeight: '700', color: colors.text },
  statLbl:        { fontSize: 10, color: colors.text3, fontWeight: '600' },
  desc:           { fontSize: 14, color: colors.text2, lineHeight: 22 },
  tabs:           { flexDirection: 'row', backgroundColor: colors.bg, borderBottomWidth: 1, borderBottomColor: colors.border, paddingHorizontal: spacing.sm },
  tabBtn:         { flex: 1, paddingVertical: spacing.sm, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabActive:      { borderBottomColor: colors.accent },
  tabText:        { fontSize: 13, color: colors.text3, fontWeight: '600' },
  tabTextActive:  { color: colors.accent },
  tabContent:     { padding: spacing.lg, gap: spacing.md },
  sectionTitle:   { fontSize: 15, fontWeight: '700', color: colors.text2, marginBottom: spacing.sm, marginTop: spacing.sm },
  menuCard:       { backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.md, flexDirection: 'row', gap: spacing.md, ...shadow.card },
  menuName:       { fontSize: 14, fontWeight: '700', color: colors.text, flex: 1 },
  menuDesc:       { fontSize: 12, color: colors.text3, marginTop: 4, lineHeight: 18 },
  menuImg:        { width: 72, height: 72, borderRadius: radius.sm },
  price:          { fontSize: 14, fontWeight: '700', color: colors.accent },
  promoPrice:     { fontSize: 14, fontWeight: '700', color: colors.success },
  origPrice:      { fontSize: 12, color: colors.text3, textDecorationLine: 'line-through' },
  offerCard:      { backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.md, ...shadow.card, gap: 4 },
  offerBadge:     { alignSelf: 'flex-start', backgroundColor: colors.accentSoft, borderRadius: radius.full, paddingHorizontal: 8, paddingVertical: 2 },
  offerBadgeText: { fontSize: 10, fontWeight: '700', color: colors.accent },
  offerTitle:     { fontSize: 15, fontWeight: '700', color: colors.text },
  offerSub:       { fontSize: 13, color: colors.accent },
  offerDesc:      { fontSize: 13, color: colors.text3 },
  reviewCard:     { backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.md, ...shadow.card, gap: spacing.sm },
  reviewHeader:   { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  reviewAvatar:   { width: 36, height: 36, borderRadius: radius.full, backgroundColor: colors.accentSoft, justifyContent: 'center', alignItems: 'center' },
  reviewAvatarText: { fontSize: 14, fontWeight: '800', color: colors.accent },
  reviewName:     { fontSize: 14, fontWeight: '700', color: colors.text },
  reviewDate:     { fontSize: 11, color: colors.text3 },
  reviewComment:  { fontSize: 14, color: colors.text2, lineHeight: 20 },
  ownerReply:     { backgroundColor: colors.surface2, borderRadius: radius.md, padding: spacing.md, borderLeftWidth: 3, borderLeftColor: colors.accent },
  ownerReplyLabel:{ fontSize: 11, fontWeight: '700', color: colors.accent, marginBottom: 4 },
  ownerReplyText: { fontSize: 13, color: colors.text2, lineHeight: 18 },
  infoCard:       { backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.md, ...shadow.card, gap: spacing.sm },
  infoCardTitle:  { fontSize: 14, fontWeight: '700', color: colors.text },
  infoCardVal:    { fontSize: 14, color: colors.text2 },
  mapsLink:       { fontSize: 13, color: colors.accent, fontWeight: '600', marginTop: 4 },
  hoursRow:       { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 7, borderBottomWidth: 1, borderBottomColor: colors.border + '44' },
  hoursRowToday:  { backgroundColor: colors.accentSoft, marginHorizontal: -spacing.md, paddingHorizontal: spacing.md },
  hoursDay:       { fontSize: 13, color: colors.text2, fontWeight: '500' },
  hoursTime:      { fontSize: 13, color: colors.text3 },
  empty:          { textAlign: 'center', color: colors.text3, marginTop: 40, fontSize: 15 },
  ctaBar:         { padding: spacing.lg, paddingBottom: spacing.xl, backgroundColor: colors.bg, borderTopWidth: 1, borderTopColor: colors.border },
  ctaBtn:         { backgroundColor: colors.accent, borderRadius: radius.lg, paddingVertical: 15, alignItems: 'center', ...shadow.card },
  ctaBtnDisabled: { backgroundColor: colors.surface2, opacity: 0.7 },
  ctaBtnText:     { color: colors.white, fontWeight: '800', fontSize: 16 },
});
