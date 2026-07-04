import React from 'react';
import { View, Text, FlatList, StyleSheet, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, radius, shadow } from '../../theme/colors';
import { useMyOrders } from '@elengi/shared';
import { Order } from '@elengi/shared';

const STATUS_LABEL: Record<string, { label: string; color: string; emoji: string }> = {
  PENDING:   { label: 'En attente',   color: colors.warning, emoji: '⏳' },
  ACCEPTED:  { label: 'Acceptée',     color: colors.success, emoji: '✅' },
  PREPARING: { label: 'En préparation', color: colors.warning, emoji: '👨‍🍳' },
  READY:     { label: 'Prête',        color: colors.success, emoji: '🛍️' },
  DELIVERED: { label: 'Livrée',       color: colors.text3,   emoji: '🎉' },
  CANCELLED: { label: 'Annulée',      color: colors.danger,  emoji: '❌' },
};

export default function OrdersScreen() {
  const { data: orders = [], isLoading, refetch } = useMyOrders();

  const renderItem = ({ item }: { item: Order }) => {
    const st = STATUS_LABEL[item.status] ?? { label: item.status, color: colors.text3, emoji: '•' };
    const total = `${(item.totalCents / 100).toFixed(2)} $`;
    const date = new Date(item.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.resto}>{item.restaurant?.name ?? 'Restaurant'}</Text>
          <Text style={[styles.status, { color: st.color }]}>{st.emoji} {st.label}</Text>
        </View>
        <Text style={styles.date}>{date}</Text>

        {item.items.map((i) => (
          <Text key={i.id} style={styles.item}>• {i.quantity}× {i.name}</Text>
        ))}

        <View style={styles.footer}>
          <Text style={styles.total}>Total : <Text style={{ color: colors.accent }}>{total}</Text></Text>
          {item.deliveryFeeCents ? (
            <Text style={styles.fee}>Livraison : {(item.deliveryFeeCents / 100).toFixed(2)} $</Text>
          ) : null}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <Text style={styles.title}>Mes commandes</Text>
      <FlatList
        data={orders}
        keyExtractor={(o) => o.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor={colors.accent} />}
        renderItem={renderItem}
        ListEmptyComponent={
          !isLoading ? <Text style={styles.empty}>Aucune commande pour l'instant</Text> : null
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:       { flex: 1, backgroundColor: colors.bg },
  title:      { fontSize: 24, fontWeight: '800', color: colors.text, padding: spacing.lg, paddingBottom: spacing.sm },
  list:       { padding: spacing.lg, gap: spacing.md, paddingTop: 0 },
  card:       { backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.md, ...shadow.card },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  resto:      { fontSize: 16, fontWeight: '700', color: colors.text, flex: 1 },
  status:     { fontSize: 12, fontWeight: '700' },
  date:       { fontSize: 12, color: colors.text3, marginBottom: spacing.sm },
  item:       { fontSize: 13, color: colors.text2, marginBottom: 2 },
  footer:     { marginTop: spacing.sm, paddingTop: spacing.sm, borderTopWidth: 1, borderTopColor: colors.border },
  total:      { fontSize: 15, fontWeight: '700', color: colors.text },
  fee:        { fontSize: 12, color: colors.text3, marginTop: 2 },
  empty:      { textAlign: 'center', color: colors.text3, marginTop: 60, fontSize: 15 },
});
