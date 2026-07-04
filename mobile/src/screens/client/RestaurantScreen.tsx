import React, { useState } from 'react';
import {
  View, Text, Image, SectionList, TouchableOpacity,
  StyleSheet, ScrollView, StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, radius, shadow } from '../../theme/colors';
import { usePublicRestaurant, usePublicMenu, usePublicOffers } from '@elengi/shared';
import { MenuItem } from '@elengi/shared';

export default function RestaurantScreen({ route, navigation }: any) {
  const { id } = route.params;
  const [tab, setTab] = useState<'menu' | 'offres' | 'avis'>('menu');

  const { data: restaurant } = usePublicRestaurant(id);
  const { data: menu }       = usePublicMenu(id);
  const { data: offers = [] } = usePublicOffers(id);

  const sections = (menu?.sections ?? []).map((s) => ({
    title: s.title,
    data:  s.items.filter((i) => i.isAvailable),
  }));

  const fmtPrice = (cents: number) => `${(cents / 100).toFixed(2)} $`;

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <StatusBar barStyle="light-content" backgroundColor={colors.bg} />

      {/* Cover */}
      <View style={styles.cover}>
        {restaurant?.coverUrl ? (
          <Image source={{ uri: restaurant.coverUrl }} style={StyleSheet.absoluteFillObject} resizeMode="cover" />
        ) : (
          <View style={[StyleSheet.absoluteFillObject, { backgroundColor: colors.surface2, justifyContent: 'center', alignItems: 'center' }]}>
            <Text style={{ fontSize: 60 }}>🍽️</Text>
          </View>
        )}
        <TouchableOpacity style={styles.back} onPress={() => navigation.goBack()}>
          <Text style={{ color: colors.white, fontSize: 20 }}>←</Text>
        </TouchableOpacity>
      </View>

      {/* Info */}
      <View style={styles.info}>
        <Text style={styles.name}>{restaurant?.name ?? '…'}</Text>
        <Text style={styles.sub}>{restaurant?.category ?? 'Restaurant'} · {restaurant?.address ?? 'Kinshasa'}</Text>
        {restaurant?.description ? <Text style={styles.desc}>{restaurant.description}</Text> : null}
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{restaurant?.isOpen ? '🟢 Ouvert' : '🔴 Fermé'}</Text>
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        {(['menu', 'offres', 'avis'] as const).map((t) => (
          <TouchableOpacity key={t} style={[styles.tabBtn, tab === t && styles.tabActive]} onPress={() => setTab(t)}>
            <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>
              {t === 'menu' ? 'Menu' : t === 'offres' ? 'Offres' : 'Avis'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Content */}
      {tab === 'menu' && (
        <SectionList
          sections={sections}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderSectionHeader={({ section }) => (
            <Text style={styles.sectionTitle}>{section.title}</Text>
          )}
          renderItem={({ item }) => <MenuItemCard item={item} fmtPrice={fmtPrice} />}
          ListEmptyComponent={<Text style={styles.empty}>Aucun plat disponible</Text>}
        />
      )}

      {tab === 'offres' && (
        <ScrollView contentContainerStyle={styles.list}>
          {offers.length === 0
            ? <Text style={styles.empty}>Aucune offre active</Text>
            : offers.map((o) => (
              <View key={o.id} style={styles.offerCard}>
                <Text style={styles.offerTitle}>{o.title}</Text>
                {o.discountPct && <Text style={styles.offerSub}>-{o.discountPct}% de réduction</Text>}
                {o.pointsCost  && <Text style={styles.offerSub}>{o.pointsCost} points</Text>}
                {o.description && <Text style={styles.offerDesc}>{o.description}</Text>}
              </View>
            ))}
        </ScrollView>
      )}

      {tab === 'avis' && (
        <View style={styles.list}>
          <Text style={styles.empty}>Les avis arrivent bientôt</Text>
        </View>
      )}
    </SafeAreaView>
  );
}

function MenuItemCard({ item, fmtPrice }: { item: MenuItem; fmtPrice: (n: number) => string }) {
  return (
    <View style={styles.menuCard}>
      <View style={{ flex: 1 }}>
        <View style={styles.menuRow}>
          <Text style={styles.menuName}>{item.name}</Text>
          <View style={styles.badges}>
            {item.isHot       && <Text style={styles.hotBadge}>🔥</Text>}
            {item.isLastUnits && <Text style={styles.lastBadge}>⚡</Text>}
          </View>
        </View>
        {item.description ? <Text style={styles.menuDesc} numberOfLines={2}>{item.description}</Text> : null}
        <View style={styles.priceRow}>
          {item.promoPrice ? (
            <>
              <Text style={styles.promoPrice}>{fmtPrice(item.promoPrice)}</Text>
              <Text style={styles.originalPrice}>{fmtPrice(item.priceUsdCents)}</Text>
            </>
          ) : (
            <Text style={styles.price}>{fmtPrice(item.priceUsdCents)}</Text>
          )}
        </View>
      </View>
      {item.imageUrl && (
        <Image source={{ uri: item.imageUrl }} style={styles.menuImg} resizeMode="cover" />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  safe:         { flex: 1, backgroundColor: colors.bg },
  cover:        { height: 220 },
  back:         {
    position: 'absolute', top: 48, left: spacing.lg,
    backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: radius.full,
    width: 40, height: 40, justifyContent: 'center', alignItems: 'center',
  },
  info:         { padding: spacing.lg, paddingBottom: spacing.sm },
  name:         { fontSize: 24, fontWeight: '800', color: colors.text },
  sub:          { fontSize: 14, color: colors.text3, marginTop: 2 },
  desc:         { fontSize: 14, color: colors.text2, marginTop: 8, lineHeight: 20 },
  badge:        { marginTop: 8 },
  badgeText:    { fontSize: 13, color: colors.text2 },
  tabs:         {
    flexDirection: 'row', paddingHorizontal: spacing.lg,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  tabBtn:       { paddingVertical: spacing.sm, marginRight: spacing.lg, borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabActive:    { borderBottomColor: colors.accent },
  tabText:      { fontSize: 15, color: colors.text3, fontWeight: '600' },
  tabTextActive:{ color: colors.accent },
  list:         { padding: spacing.lg, gap: spacing.sm },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: colors.text2, marginTop: spacing.md, marginBottom: spacing.sm },
  menuCard:     {
    backgroundColor: colors.surface, borderRadius: radius.md,
    padding: spacing.md, flexDirection: 'row', gap: spacing.md, ...shadow.card,
  },
  menuRow:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  menuName:     { fontSize: 15, fontWeight: '700', color: colors.text, flex: 1 },
  menuDesc:     { fontSize: 13, color: colors.text3, marginTop: 4, lineHeight: 18 },
  menuImg:      { width: 72, height: 72, borderRadius: radius.sm },
  badges:       { flexDirection: 'row', gap: 4 },
  hotBadge:     { fontSize: 16 },
  lastBadge:    { fontSize: 16 },
  priceRow:     { flexDirection: 'row', gap: spacing.sm, marginTop: 8, alignItems: 'center' },
  price:        { fontSize: 15, fontWeight: '700', color: colors.accent },
  promoPrice:   { fontSize: 15, fontWeight: '700', color: colors.success },
  originalPrice:{ fontSize: 13, color: colors.text3, textDecorationLine: 'line-through' },
  offerCard:    { backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.md },
  offerTitle:   { fontSize: 16, fontWeight: '700', color: colors.text },
  offerSub:     { fontSize: 14, color: colors.accent, marginTop: 4 },
  offerDesc:    { fontSize: 13, color: colors.text3, marginTop: 4 },
  empty:        { textAlign: 'center', color: colors.text3, marginTop: 40, fontSize: 15 },
});
