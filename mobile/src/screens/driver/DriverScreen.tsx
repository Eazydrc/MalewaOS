import React, { useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, Switch, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, radius, shadow } from '../../theme/colors';
import {
  useDriverStatus, useToggleAvailability,
  useActiveDeliveries, useUpdateDeliveryStatus, useDriverHistory,
} from '@elengi/shared';
import { ActiveDelivery } from '@elengi/shared';

const DELIVERY_STATUS_NEXT: Record<string, { next: string; label: string }> = {
  ACCEPTED:  { next: 'PREPARING', label: 'Aller chercher' },
  PREPARING: { next: 'READY',     label: 'Colis récupéré' },
  READY:     { next: 'DELIVERED', label: 'Livré ✓' },
};

export default function DriverScreen() {
  const [tab, setTab] = useState<'live' | 'history'>('live');

  const { data: status,  refetch: refetchStatus }   = useDriverStatus();
  const { data: actives = [], isLoading, refetch } = useActiveDeliveries();
  const { data: history = [] }                       = useDriverHistory();

  const toggle    = useToggleAvailability();
  const updStatus = useUpdateDeliveryStatus();

  const handleToggle = (val: boolean) => {
    toggle.mutate({ available: val });
  };

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Tableau livreur</Text>
          <Text style={styles.sub}>{actives.length} livraison{actives.length !== 1 ? 's' : ''} active{actives.length !== 1 ? 's' : ''}</Text>
        </View>
        <View style={styles.toggleRow}>
          <Text style={[styles.toggleLabel, { color: status?.available ? colors.success : colors.text3 }]}>
            {status?.available ? 'En ligne' : 'Hors ligne'}
          </Text>
          <Switch
            value={status?.available ?? false}
            onValueChange={handleToggle}
            trackColor={{ false: colors.surface3, true: colors.success }}
            thumbColor={colors.white}
          />
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        {(['live', 'history'] as const).map((t) => (
          <TouchableOpacity key={t} style={[styles.tabBtn, tab === t && styles.tabActive]} onPress={() => setTab(t)}>
            <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>
              {t === 'live' ? '🛵 En cours' : '📋 Historique'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {tab === 'live' && (
        <FlatList
          data={actives}
          keyExtractor={(d) => d.orderId}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor={colors.accent} />}
          renderItem={({ item }) => (
            <ActiveCard
              delivery={item}
              onNext={() => {
                const nx = DELIVERY_STATUS_NEXT[item.status];
                if (nx) updStatus.mutate({ orderId: item.orderId, status: nx.next });
              }}
            />
          )}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyEmoji}>🛵</Text>
              <Text style={styles.emptyText}>
                {status?.available ? 'En attente de courses…' : 'Passez en ligne pour recevoir des courses'}
              </Text>
            </View>
          }
        />
      )}

      {tab === 'history' && (
        <FlatList
          data={history}
          keyExtractor={(o) => o.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <View style={styles.histCard}>
              <Text style={styles.histResto}>{item.restaurant?.name ?? 'Restaurant'}</Text>
              <Text style={styles.histDate}>{new Date(item.createdAt).toLocaleDateString('fr-FR')}</Text>
              <Text style={styles.histFee}>Gain : {((item.deliveryFeeCents ?? 0) / 100).toFixed(2)} $</Text>
            </View>
          )}
          ListEmptyComponent={<Text style={styles.emptyText}>Aucune livraison terminée</Text>}
        />
      )}
    </SafeAreaView>
  );
}

function ActiveCard({ delivery, onNext }: { delivery: ActiveDelivery; onNext: () => void }) {
  const nx = DELIVERY_STATUS_NEXT[delivery.status];
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>{delivery.restaurantName}</Text>
        <Text style={styles.cardStatus}>{delivery.status}</Text>
      </View>

      <View style={styles.route}>
        <Text style={styles.routeLabel}>📍 Départ</Text>
        <Text style={styles.routeAddr}>{delivery.restaurantAddress}</Text>
        <View style={styles.routeLine} />
        <Text style={styles.routeLabel}>📦 Destination</Text>
        <Text style={styles.routeAddr}>{delivery.clientAddress}</Text>
      </View>

      <View style={styles.stats}>
        <Text style={styles.stat}>💰 {(delivery.deliveryFeeCents / 100).toFixed(2)} $</Text>
        {delivery.distanceKm && <Text style={styles.stat}>📏 {delivery.distanceKm.toFixed(1)} km</Text>}
        {delivery.etaMinutes && <Text style={styles.stat}>⏱ ~{delivery.etaMinutes} min</Text>}
      </View>

      {nx && (
        <TouchableOpacity style={styles.nextBtn} onPress={onNext}>
          <Text style={styles.nextText}>{nx.label}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  safe:         { flex: 1, backgroundColor: colors.bg },
  header:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: spacing.lg },
  title:        { fontSize: 22, fontWeight: '800', color: colors.text },
  sub:          { fontSize: 13, color: colors.text3, marginTop: 2 },
  toggleRow:    { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  toggleLabel:  { fontSize: 13, fontWeight: '700' },
  tabs:         { flexDirection: 'row', paddingHorizontal: spacing.lg, borderBottomWidth: 1, borderBottomColor: colors.border },
  tabBtn:       { paddingVertical: spacing.sm, marginRight: spacing.lg, borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabActive:    { borderBottomColor: colors.accent },
  tabText:      { fontSize: 15, color: colors.text3, fontWeight: '600' },
  tabTextActive:{ color: colors.accent },
  list:         { padding: spacing.lg, gap: spacing.md },
  card:         { backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.md, ...shadow.card },
  cardHeader:   { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.sm },
  cardTitle:    { fontSize: 16, fontWeight: '700', color: colors.text, flex: 1 },
  cardStatus:   { fontSize: 12, color: colors.warning, fontWeight: '700' },
  route:        { marginVertical: spacing.sm },
  routeLabel:   { fontSize: 11, color: colors.text3, fontWeight: '700', textTransform: 'uppercase' },
  routeAddr:    { fontSize: 14, color: colors.text, marginBottom: 6 },
  routeLine:    { width: 2, height: 12, backgroundColor: colors.border, marginLeft: 6, marginVertical: 2 },
  stats:        { flexDirection: 'row', gap: spacing.md, marginTop: spacing.sm },
  stat:         { fontSize: 13, color: colors.text2 },
  nextBtn:      { marginTop: spacing.md, backgroundColor: colors.accent, borderRadius: radius.md, padding: 12, alignItems: 'center' },
  nextText:     { color: colors.white, fontWeight: '700', fontSize: 15 },
  histCard:     { backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.md },
  histResto:    { fontSize: 15, fontWeight: '700', color: colors.text },
  histDate:     { fontSize: 12, color: colors.text3, marginTop: 2 },
  histFee:      { fontSize: 13, color: colors.success, marginTop: 4 },
  empty:        { alignItems: 'center', paddingTop: 80, gap: spacing.md },
  emptyEmoji:   { fontSize: 48 },
  emptyText:    { fontSize: 15, color: colors.text3, textAlign: 'center' },
});
