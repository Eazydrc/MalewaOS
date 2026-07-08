import React from 'react';
import { View, Text, ScrollView, StyleSheet, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, radius, shadow } from '../../theme/colors';
import Icon from '../../components/Icon';
import { useMyStats } from '@elengi/shared';

function KpiCard({ label, value, sub, icon, color }: {
  label: string; value: string | number; sub?: string; icon: string; color: string;
}) {
  return (
    <View style={[s.kpiCard, { flex: 1 }]}>
      <View style={[s.kpiIcon, { backgroundColor: color + '22' }]}>
        <Icon name={icon} size={22} color={color} />
      </View>
      <Text style={s.kpiVal}>{value}</Text>
      <Text style={s.kpiLabel}>{label}</Text>
      {sub && <Text style={s.kpiSub}>{sub}</Text>}
    </View>
  );
}

export default function AnalyticsScreen() {
  const { data: stats, isLoading, refetch } = useMyStats();

  const week = stats?.week ?? {};
  const month = stats?.month ?? {};

  const revenueDays: { day: string; amount: number }[] = stats?.revenueLast7Days ?? [];
  const topItems: { name: string; count: number }[] = stats?.topItems ?? [];

  const maxRevenue = Math.max(...revenueDays.map((d) => d.amount), 1);

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView
        contentContainerStyle={{ padding: spacing.md, gap: spacing.lg }}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor={colors.accent} />}
      >
        <Text style={s.title}>Analytics</Text>

        {/* Section semaine */}
        <Text style={s.sectionLabel}>Cette semaine</Text>
        <View style={s.row}>
          <KpiCard label="Réservations" value={week.reservations ?? 0} icon="calendar-outline" color={colors.accent} />
          <KpiCard label="Commandes" value={week.orders ?? 0} icon="bag-outline" color={colors.success} />
        </View>
        <View style={s.row}>
          <KpiCard label="Revenus" value={`${((week.revenueCents ?? 0) / 100).toFixed(0)} $`} icon="cash-outline" color={colors.warning} />
          <KpiCard label="Avis" value={week.reviews ?? 0} icon="star-outline" color={colors.text2} />
        </View>

        {/* Section mois */}
        <Text style={s.sectionLabel}>Ce mois</Text>
        <View style={s.row}>
          <KpiCard label="Réservations" value={month.reservations ?? 0} icon="calendar-outline" color={colors.accent} />
          <KpiCard label="Commandes" value={month.orders ?? 0} icon="bag-outline" color={colors.success} />
        </View>
        <View style={s.row}>
          <KpiCard label="Revenus" value={`${((month.revenueCents ?? 0) / 100).toFixed(0)} $`} icon="cash-outline" color={colors.warning} />
          <KpiCard label="Note moy." value={month.avgRating ? month.avgRating.toFixed(1) : '—'} icon="star" color={colors.warning} />
        </View>

        {/* Graphe revenus 7j */}
        {revenueDays.length > 0 && (
          <View style={s.card}>
            <Text style={s.cardTitle}>Revenus 7 derniers jours</Text>
            <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 6, height: 80, marginTop: spacing.sm }}>
              {revenueDays.map((d, i) => {
                const h = Math.max((d.amount / maxRevenue) * 72, 4);
                return (
                  <View key={i} style={{ flex: 1, alignItems: 'center' }}>
                    <View style={[s.bar, { height: h }]} />
                    <Text style={s.barLabel}>{d.day}</Text>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* Top plats */}
        {topItems.length > 0 && (
          <View style={s.card}>
            <Text style={s.cardTitle}>Top plats vendus</Text>
            {topItems.slice(0, 5).map((item, i) => (
              <View key={i} style={s.topRow}>
                <Text style={s.topRank}>#{i + 1}</Text>
                <Text style={s.topName} numberOfLines={1}>{item.name}</Text>
                <Text style={s.topCount}>{item.count}×</Text>
              </View>
            ))}
          </View>
        )}

        {!stats && !isLoading && (
          <Text style={s.empty}>Analytics disponibles à partir de CROISSANCE</Text>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:         { flex: 1, backgroundColor: colors.bg },
  title:        { fontSize: 22, fontWeight: '800', color: colors.text },
  sectionLabel: { fontSize: 13, fontWeight: '700', color: colors.text3, textTransform: 'uppercase', letterSpacing: 1 },
  row:          { flexDirection: 'row', gap: spacing.sm },
  kpiCard:      { backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.md, alignItems: 'center', ...shadow.card },
  kpiIcon:      { borderRadius: radius.full, padding: 10, marginBottom: 8 },
  kpiVal:       { fontSize: 22, fontWeight: '800', color: colors.text },
  kpiLabel:     { fontSize: 11, color: colors.text3, textAlign: 'center', marginTop: 2 },
  kpiSub:       { fontSize: 11, color: colors.success },
  card:         { backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.md, ...shadow.card },
  cardTitle:    { fontSize: 16, fontWeight: '700', color: colors.text },
  bar:          { width: '100%', backgroundColor: colors.accent, borderRadius: 4 },
  barLabel:     { fontSize: 9, color: colors.text3, marginTop: 2 },
  topRow:       { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, borderTopWidth: 1, borderTopColor: colors.border },
  topRank:      { fontSize: 13, fontWeight: '800', color: colors.accent, width: 28 },
  topName:      { flex: 1, fontSize: 13, color: colors.text },
  topCount:     { fontSize: 13, fontWeight: '700', color: colors.text3 },
  empty:        { textAlign: 'center', color: colors.text3, marginTop: 40 },
});
