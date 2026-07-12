import React, { useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, RefreshControl, TouchableOpacity, Alert } from 'react-native';
import { FadeSlide } from '../../components/animations';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, radius, shadow } from '../../theme/colors';
import { useMyOrders } from '@elengi/shared';
import { Order } from '@elengi/shared';
import { api } from '@elengi/shared';
import { useQueryClient } from '@tanstack/react-query';

const USD_TO_CDF = 2800;

const STATUS_LABEL: Record<string, { label: string; color: string; emoji: string }> = {
  PENDING:   { label: 'En attente',     color: colors.warning, emoji: '⏳' },
  ACCEPTED:  { label: 'Acceptée',       color: colors.success, emoji: '✅' },
  PREPARING: { label: 'En préparation', color: colors.warning, emoji: '👨‍🍳' },
  READY:     { label: 'Prête',          color: colors.success, emoji: '🛍️' },
  DELIVERED: { label: 'Livrée',         color: colors.text3,   emoji: '🎉' },
  CANCELLED: { label: 'Annulée',        color: colors.danger,  emoji: '❌' },
};

const ACTIVE_STATUSES = ['PENDING', 'ACCEPTED', 'PREPARING', 'READY'];

function fmtCdf(usdCents: number) {
  return `${Math.round((usdCents / 100) * USD_TO_CDF).toLocaleString()} FC`;
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
}

export default function OrdersScreen() {
  const { data: orders = [], isLoading, refetch } = useMyOrders();
  const qc = useQueryClient();

  // Auto-refetch every 15s for active orders
  useEffect(() => {
    const hasActive = orders.some((o) => ACTIVE_STATUSES.includes(o.status));
    if (!hasActive) return;
    const interval = setInterval(() => {
      qc.invalidateQueries({ queryKey: ['my-orders'] });
    }, 15000);
    return () => clearInterval(interval);
  }, [orders, qc]);

  const active  = orders.filter((o: any) => ACTIVE_STATUSES.includes(o.status));
  const history = orders.filter((o: any) => !ACTIVE_STATUSES.includes(o.status));

  const handleConfirmDelivery = async (orderId: string) => {
    Alert.alert(
      'Confirmer la réception',
      'Confirmez-vous avoir bien reçu votre commande ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Confirmer',
          onPress: async () => {
            try {
              await api.post(`/orders/${orderId}/confirm`);
              qc.invalidateQueries({ queryKey: ['my-orders'] });
            } catch {
              Alert.alert('Erreur', 'Impossible de confirmer la réception');
            }
          },
        },
      ],
    );
  };

  const renderOrder = (item: Order, isActive: boolean) => {
    const st = STATUS_LABEL[item.status] ?? { label: item.status, color: colors.text3, emoji: '•' };
    const totalCdf = fmtCdf(item.totalCents);

    return (
      <View key={item.id} style={[s.card, isActive && s.cardActive]}>
        <View style={s.cardHeader}>
          <Text style={s.resto} numberOfLines={1}>{item.restaurant?.name ?? 'Restaurant'}</Text>
          <View style={[s.statusBadge, { backgroundColor: st.color + '22' }]}>
            <Text style={[s.statusText, { color: st.color }]}>{st.emoji} {st.label}</Text>
          </View>
        </View>

        <Text style={s.date}>{fmtDate(item.createdAt)}</Text>

        <View style={s.itemsBlock}>
          {item.items?.map((i) => (
            <Text key={i.id} style={s.orderItem}>• {i.quantity}× {i.name}</Text>
          ))}
        </View>

        <View style={s.footer}>
          <Text style={s.total}>Total : <Text style={{ color: colors.accent }}>{totalCdf}</Text></Text>
          {item.deliveryFeeCents ? (
            <Text style={s.fee}>+ {fmtCdf(item.deliveryFeeCents)} livraison</Text>
          ) : null}
        </View>

        {/* Delivery confirmation block for READY orders */}
        {item.status === 'READY' && (
          <TouchableOpacity
            style={s.confirmBtn}
            onPress={() => handleConfirmDelivery(item.id)}
          >
            <Text style={s.confirmText}>✓ Confirmer la réception</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  const allSections = [
    ...(active.length > 0 ? [{ type: 'header', label: 'En cours' }, ...active.map((o) => ({ type: 'order', data: o, isActive: true }))] : []),
    ...(history.length > 0 ? [{ type: 'header', label: 'Historique' }, ...history.map((o) => ({ type: 'order', data: o, isActive: false }))] : []),
  ];

  return (
    <SafeAreaView style={s.safe}>
      <FadeSlide>
      <Text style={s.title}>Mes commandes</Text>
      <FlatList
        data={allSections}
        keyExtractor={(item, idx) => item.type === 'header' ? `h-${idx}` : (item as any).data.id}
        contentContainerStyle={s.list}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor={colors.accent} />}
        renderItem={({ item }) => {
          if (item.type === 'header') {
            return <Text style={s.sectionTitle}>{(item as any).label}</Text>;
          }
          return renderOrder((item as any).data, (item as any).isActive);
        }}
        ListEmptyComponent={
          !isLoading ? (
            <View style={s.empty}>
              <Text style={{ fontSize: 40, marginBottom: 12 }}>🛍️</Text>
              <Text style={s.emptyTitle}>Aucune commande</Text>
              <Text style={s.emptySub}>Vos commandes apparaîtront ici</Text>
            </View>
          ) : null
        }
      />
      </FadeSlide>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:         { flex: 1, backgroundColor: colors.bg },
  title:        { fontSize: 24, fontWeight: '800', color: colors.text, padding: spacing.lg, paddingBottom: spacing.sm },
  list:         { padding: spacing.lg, paddingTop: spacing.sm, gap: spacing.sm },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: colors.text2, marginTop: spacing.sm, marginBottom: spacing.xs },
  card:         { backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.md, ...shadow.card, gap: spacing.sm },
  cardActive:   { borderLeftWidth: 3, borderLeftColor: colors.accent },
  cardHeader:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  resto:        { fontSize: 15, fontWeight: '700', color: colors.text, flex: 1, marginRight: spacing.sm },
  statusBadge:  { paddingHorizontal: 8, paddingVertical: 3, borderRadius: radius.full },
  statusText:   { fontSize: 11, fontWeight: '700' },
  date:         { fontSize: 12, color: colors.text3 },
  itemsBlock:   { gap: 2 },
  orderItem:    { fontSize: 13, color: colors.text2 },
  footer:       { paddingTop: spacing.sm, borderTopWidth: 1, borderTopColor: colors.border },
  total:        { fontSize: 14, fontWeight: '700', color: colors.text },
  fee:          { fontSize: 12, color: colors.text3, marginTop: 2 },
  confirmBtn:   {
    paddingVertical: 11, borderRadius: radius.md,
    backgroundColor: 'rgba(74,222,128,0.12)', alignItems: 'center',
    borderWidth: 1, borderColor: 'rgba(74,222,128,0.3)',
  },
  confirmText:  { color: colors.success, fontWeight: '700', fontSize: 13 },
  empty:        { alignItems: 'center', marginTop: 60, padding: spacing.lg },
  emptyTitle:   { fontSize: 16, fontWeight: '700', color: colors.text, marginBottom: 6 },
  emptySub:     { fontSize: 13, color: colors.text3, textAlign: 'center' },
});
