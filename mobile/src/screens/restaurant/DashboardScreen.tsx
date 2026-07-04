import React, { useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, radius, shadow } from '../../theme/colors';
import { useRestaurantReservations, useUpdateReservationStatus, useRestaurantOrders, useUpdateOrderStatus } from '@elengi/shared';
import { Reservation, Order } from '@elengi/shared';

export default function DashboardScreen() {
  const [tab, setTab] = useState<'reservations' | 'orders'>('reservations');

  const { data: reservations = [], isLoading: rLoading, refetch: rRefetch } = useRestaurantReservations();
  const { data: orders = [],       isLoading: oLoading, refetch: oRefetch } = useRestaurantOrders();
  const updateRes   = useUpdateReservationStatus();
  const updateOrder = useUpdateOrderStatus();

  const pendingRes    = reservations.filter((r) => r.status === 'PENDING').length;
  const pendingOrders = orders.filter((o) => ['PENDING', 'ACCEPTED', 'PREPARING'].includes(o.status)).length;

  return (
    <SafeAreaView style={styles.safe}>
      <Text style={styles.title}>Dashboard restaurant</Text>

      {/* KPIs */}
      <View style={styles.kpis}>
        <View style={styles.kpi}>
          <Text style={styles.kpiVal}>{pendingRes}</Text>
          <Text style={styles.kpiLabel}>Réservations en attente</Text>
        </View>
        <View style={styles.kpi}>
          <Text style={styles.kpiVal}>{pendingOrders}</Text>
          <Text style={styles.kpiLabel}>Commandes actives</Text>
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        {(['reservations', 'orders'] as const).map((t) => (
          <TouchableOpacity key={t} style={[styles.tabBtn, tab === t && styles.tabActive]} onPress={() => setTab(t)}>
            <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>
              {t === 'reservations' ? '📅 Réservations' : '🛍️ Commandes'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {tab === 'reservations' && (
        <FlatList
          data={reservations}
          keyExtractor={(r) => r.id}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={rLoading} onRefresh={rRefetch} tintColor={colors.accent} />}
          renderItem={({ item }: { item: Reservation }) => (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardName}>{item.user?.firstName} {item.user?.lastName}</Text>
                <Text style={styles.cardDate}>{new Date(item.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</Text>
              </View>
              <Text style={styles.cardSub}>👥 {item.partySize} personnes · {item.status}</Text>

              {item.status === 'PENDING' && (
                <View style={styles.actions}>
                  <TouchableOpacity style={styles.btnConfirm} onPress={() => updateRes.mutate({ id: item.id, status: 'CONFIRMED' })}>
                    <Text style={styles.btnConfirmText}>Confirmer</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.btnCancel} onPress={() => updateRes.mutate({ id: item.id, status: 'CANCELLED' })}>
                    <Text style={styles.btnCancelText}>Refuser</Text>
                  </TouchableOpacity>
                </View>
              )}
              {item.status === 'CONFIRMED' && (
                <View style={styles.actions}>
                  <TouchableOpacity style={styles.btnConfirm} onPress={() => updateRes.mutate({ id: item.id, status: 'COMPLETED' })}>
                    <Text style={styles.btnConfirmText}>Terminée</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.btnCancel} onPress={() => updateRes.mutate({ id: item.id, status: 'NO_SHOW' })}>
                    <Text style={styles.btnCancelText}>No-show</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}
          ListEmptyComponent={<Text style={styles.empty}>Aucune réservation</Text>}
        />
      )}

      {tab === 'orders' && (
        <FlatList
          data={orders}
          keyExtractor={(o) => o.id}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={oLoading} onRefresh={oRefetch} tintColor={colors.accent} />}
          renderItem={({ item }: { item: Order }) => {
            const NEXT: Record<string, string> = { PENDING: 'ACCEPTED', ACCEPTED: 'PREPARING', PREPARING: 'READY', READY: 'DELIVERED' };
            const NEXT_LABEL: Record<string, string> = { PENDING: 'Accepter', ACCEPTED: 'Préparer', PREPARING: 'Prête', READY: 'Livré' };
            return (
              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <Text style={styles.cardName}>Commande #{item.id.slice(-6).toUpperCase()}</Text>
                  <Text style={styles.cardDate}>{item.status}</Text>
                </View>
                {item.items.map((i) => (
                  <Text key={i.id} style={styles.cardSub}>• {i.quantity}× {i.name}</Text>
                ))}
                <Text style={{ color: colors.accent, fontWeight: '700', marginTop: 6 }}>
                  {(item.totalCents / 100).toFixed(2)} $
                </Text>
                {NEXT[item.status] && (
                  <TouchableOpacity
                    style={[styles.btnConfirm, { marginTop: spacing.sm }]}
                    onPress={() => updateOrder.mutate({ id: item.id, status: NEXT[item.status] })}
                  >
                    <Text style={styles.btnConfirmText}>{NEXT_LABEL[item.status]}</Text>
                  </TouchableOpacity>
                )}
              </View>
            );
          }}
          ListEmptyComponent={<Text style={styles.empty}>Aucune commande</Text>}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:          { flex: 1, backgroundColor: colors.bg },
  title:         { fontSize: 22, fontWeight: '800', color: colors.text, padding: spacing.lg, paddingBottom: spacing.sm },
  kpis:          { flexDirection: 'row', paddingHorizontal: spacing.lg, gap: spacing.md, marginBottom: spacing.md },
  kpi:           { flex: 1, backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.md, alignItems: 'center' },
  kpiVal:        { fontSize: 32, fontWeight: '800', color: colors.accent },
  kpiLabel:      { fontSize: 11, color: colors.text3, textAlign: 'center', marginTop: 4 },
  tabs:          { flexDirection: 'row', paddingHorizontal: spacing.lg, borderBottomWidth: 1, borderBottomColor: colors.border },
  tabBtn:        { paddingVertical: spacing.sm, marginRight: spacing.lg, borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabActive:     { borderBottomColor: colors.accent },
  tabText:       { fontSize: 15, color: colors.text3, fontWeight: '600' },
  tabTextActive: { color: colors.accent },
  list:          { padding: spacing.lg, gap: spacing.md },
  card:          { backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.md, ...shadow.card },
  cardHeader:    { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  cardName:      { fontSize: 15, fontWeight: '700', color: colors.text, flex: 1 },
  cardDate:      { fontSize: 12, color: colors.text3 },
  cardSub:       { fontSize: 13, color: colors.text2, marginTop: 2 },
  actions:       { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },
  btnConfirm:    { flex: 1, backgroundColor: colors.success, borderRadius: radius.md, padding: 10, alignItems: 'center' },
  btnConfirmText:{ color: colors.black, fontWeight: '700', fontSize: 14 },
  btnCancel:     { flex: 1, backgroundColor: 'rgba(248,113,113,0.15)', borderRadius: radius.md, padding: 10, alignItems: 'center' },
  btnCancelText: { color: colors.danger, fontWeight: '700', fontSize: 14 },
  empty:         { textAlign: 'center', color: colors.text3, marginTop: 40, fontSize: 15 },
});
