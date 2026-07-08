import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  RefreshControl, FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, radius, shadow } from '../../theme/colors';
import Icon from '../../components/Icon';
import { useQuery } from '@tanstack/react-query';
import { api } from '@elengi/shared';

function useAdminStats() {
  return useQuery<any>({
    queryKey: ['admin', 'stats'],
    queryFn: () => api.get('/admin/stats'),
  });
}

function useAdminUsers() {
  return useQuery<any[]>({
    queryKey: ['admin', 'users'],
    queryFn: () => api.get('/admin/users'),
  });
}

function useAdminRestaurants() {
  return useQuery<any[]>({
    queryKey: ['admin', 'restaurants'],
    queryFn: () => api.get('/admin/restaurants'),
  });
}

const TABS = ['Stats', 'Utilisateurs', 'Restaurants'] as const;

function KpiCard({ label, value, icon, color }: { label: string; value: string | number; icon: string; color: string }) {
  return (
    <View style={[a.kpiCard, { flex: 1 }]}>
      <View style={[a.kpiIcon, { backgroundColor: color + '22' }]}>
        <Icon name={icon} size={20} color={color} />
      </View>
      <Text style={a.kpiVal}>{value}</Text>
      <Text style={a.kpiLabel}>{label}</Text>
    </View>
  );
}

export default function AdminScreen() {
  const [tab, setTab] = useState<typeof TABS[number]>('Stats');
  const { data: stats,   isLoading: sLoad, refetch: sRefetch } = useAdminStats();
  const { data: users   = [], isLoading: uLoad, refetch: uRefetch } = useAdminUsers();
  const { data: restos  = [], isLoading: rLoad, refetch: rRefetch } = useAdminRestaurants();

  const isLoading = sLoad || uLoad || rLoad;
  const refetch   = () => { sRefetch(); uRefetch(); rRefetch(); };

  return (
    <SafeAreaView style={a.safe}>
      <View style={a.header}>
        <Text style={a.title}>Administration</Text>
        <View style={[a.badge, { backgroundColor: colors.accent + '22' }]}>
          <Text style={[a.badgeText, { color: colors.accent }]}>SUPER ADMIN</Text>
        </View>
      </View>

      <View style={a.tabs}>
        {TABS.map((t) => (
          <TouchableOpacity key={t} style={[a.tabBtn, tab === t && a.tabActive]} onPress={() => setTab(t)}>
            <Text style={[a.tabText, tab === t && a.tabTextActive]}>{t}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {tab === 'Stats' && (
        <ScrollView
          contentContainerStyle={{ padding: spacing.md, gap: spacing.md }}
          refreshControl={<RefreshControl refreshing={sLoad} onRefresh={sRefetch} tintColor={colors.accent} />}
        >
          <View style={{ flexDirection: 'row', gap: spacing.sm }}>
            <KpiCard label="Utilisateurs" value={stats?.totalUsers ?? '—'} icon="people-outline" color={colors.accent} />
            <KpiCard label="Restaurants" value={stats?.totalRestaurants ?? '—'} icon="storefront-outline" color={colors.success} />
          </View>
          <View style={{ flexDirection: 'row', gap: spacing.sm }}>
            <KpiCard label="Réservations" value={stats?.totalReservations ?? '—'} icon="calendar-outline" color={colors.warning} />
            <KpiCard label="Commandes" value={stats?.totalOrders ?? '—'} icon="bag-outline" color={colors.text2} />
          </View>
          <View style={a.card}>
            <Text style={a.cardTitle}>Revenus totaux</Text>
            <Text style={a.bigStat}>
              {stats?.totalRevenueCents != null ? `${(stats.totalRevenueCents / 100).toFixed(0)} $` : '—'}
            </Text>
          </View>
        </ScrollView>
      )}

      {tab === 'Utilisateurs' && (
        <FlatList
          data={users}
          keyExtractor={(u) => u.id}
          contentContainerStyle={{ padding: spacing.md, gap: spacing.sm }}
          refreshControl={<RefreshControl refreshing={uLoad} onRefresh={uRefetch} tintColor={colors.accent} />}
          renderItem={({ item }) => (
            <View style={a.listItem}>
              <View style={[a.avatar, { backgroundColor: colors.accent + '22' }]}>
                <Text style={{ color: colors.accent, fontWeight: '800', fontSize: 16 }}>
                  {(item.firstName?.[0] ?? item.email[0]).toUpperCase()}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={a.itemName}>{item.firstName} {item.lastName}</Text>
                <Text style={a.itemSub}>{item.email}</Text>
              </View>
              <View style={[a.roleBadge, { backgroundColor: item.isActive ? colors.success + '22' : colors.border + '55' }]}>
                <Text style={[a.roleBadgeText, { color: item.isActive ? colors.success : colors.text3 }]}>{item.role}</Text>
              </View>
            </View>
          )}
          ListEmptyComponent={<Text style={a.empty}>Aucun utilisateur</Text>}
        />
      )}

      {tab === 'Restaurants' && (
        <FlatList
          data={restos}
          keyExtractor={(r) => r.id}
          contentContainerStyle={{ padding: spacing.md, gap: spacing.sm }}
          refreshControl={<RefreshControl refreshing={rLoad} onRefresh={rRefetch} tintColor={colors.accent} />}
          renderItem={({ item }) => (
            <View style={a.listItem}>
              <View style={[a.avatar, { backgroundColor: colors.surface2 }]}>
                <Icon name="storefront-outline" size={22} color={colors.accent} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={a.itemName}>{item.name}</Text>
                <Text style={a.itemSub}>{item.owner?.email}</Text>
              </View>
              <View style={[a.roleBadge, { backgroundColor: colors.accent + '22' }]}>
                <Text style={[a.roleBadgeText, { color: colors.accent }]}>{item.subscription}</Text>
              </View>
            </View>
          )}
          ListEmptyComponent={<Text style={a.empty}>Aucun restaurant</Text>}
        />
      )}
    </SafeAreaView>
  );
}

const a = StyleSheet.create({
  safe:           { flex: 1, backgroundColor: colors.bg },
  header:         { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: spacing.md },
  title:          { fontSize: 22, fontWeight: '800', color: colors.text },
  badge:          { borderRadius: radius.sm, paddingHorizontal: 8, paddingVertical: 3 },
  badgeText:      { fontSize: 11, fontWeight: '800' },
  tabs:           { flexDirection: 'row', paddingHorizontal: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border },
  tabBtn:         { paddingVertical: spacing.sm, marginRight: spacing.lg, borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabActive:      { borderBottomColor: colors.accent },
  tabText:        { fontSize: 14, color: colors.text3, fontWeight: '600' },
  tabTextActive:  { color: colors.accent },
  kpiCard:        { backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.md, alignItems: 'center', ...shadow.card },
  kpiIcon:        { borderRadius: radius.full, padding: 8, marginBottom: 6 },
  kpiVal:         { fontSize: 22, fontWeight: '800', color: colors.text },
  kpiLabel:       { fontSize: 11, color: colors.text3, textAlign: 'center', marginTop: 2 },
  card:           { backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.md, ...shadow.card },
  cardTitle:      { fontSize: 15, fontWeight: '700', color: colors.text2 },
  bigStat:        { fontSize: 36, fontWeight: '800', color: colors.accent, marginTop: 4 },
  listItem:       { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.md },
  avatar:         { width: 44, height: 44, borderRadius: radius.full, alignItems: 'center', justifyContent: 'center' },
  itemName:       { fontSize: 14, fontWeight: '700', color: colors.text },
  itemSub:        { fontSize: 12, color: colors.text3, marginTop: 2 },
  roleBadge:      { borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2 },
  roleBadgeText:  { fontSize: 11, fontWeight: '700' },
  empty:          { textAlign: 'center', color: colors.text3, marginTop: 40 },
});
