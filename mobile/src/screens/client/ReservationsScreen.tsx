import React from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, radius, shadow } from '../../theme/colors';
import { useMyReservations, useCancelReservation } from '@elengi/shared';
import { Reservation } from '@elengi/shared';

const STATUS_LABEL: Record<string, { label: string; color: string }> = {
  PENDING:   { label: 'En attente', color: colors.warning },
  CONFIRMED: { label: 'Confirmée',  color: colors.success },
  COMPLETED: { label: 'Terminée',   color: colors.text3 },
  CANCELLED: { label: 'Annulée',    color: colors.danger },
  NO_SHOW:   { label: 'Absent',     color: colors.danger },
};

export default function ReservationsScreen() {
  const { data: reservations = [], isLoading, refetch } = useMyReservations();
  const cancel = useCancelReservation();

  const renderItem = ({ item }: { item: Reservation }) => {
    const st = STATUS_LABEL[item.status] ?? { label: item.status, color: colors.text3 };
    const date = new Date(item.date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' });

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.resto}>{item.restaurant?.name ?? 'Restaurant'}</Text>
          <Text style={[styles.status, { color: st.color }]}>{st.label}</Text>
        </View>
        <Text style={styles.date}>{date}</Text>
        <Text style={styles.party}>👥 {item.partySize} personne{item.partySize > 1 ? 's' : ''}</Text>
        {item.notes ? <Text style={styles.notes}>📝 {item.notes}</Text> : null}

        {item.status === 'PENDING' || item.status === 'CONFIRMED' ? (
          <TouchableOpacity
            style={styles.cancelBtn}
            onPress={() => cancel.mutate(item.id)}
            disabled={cancel.isPending}
          >
            <Text style={styles.cancelText}>Annuler</Text>
          </TouchableOpacity>
        ) : null}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <Text style={styles.title}>Mes réservations</Text>
      <FlatList
        data={reservations}
        keyExtractor={(r) => r.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor={colors.accent} />}
        renderItem={renderItem}
        ListEmptyComponent={
          !isLoading ? <Text style={styles.empty}>Aucune réservation pour l'instant</Text> : null
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
  date:       { fontSize: 13, color: colors.text2, marginBottom: 4 },
  party:      { fontSize: 13, color: colors.text3 },
  notes:      { fontSize: 13, color: colors.text3, marginTop: 4 },
  cancelBtn:  {
    marginTop: spacing.md, paddingVertical: 8, borderRadius: radius.md,
    backgroundColor: 'rgba(248,113,113,0.1)', alignItems: 'center',
  },
  cancelText: { color: colors.danger, fontWeight: '700', fontSize: 14 },
  empty:      { textAlign: 'center', color: colors.text3, marginTop: 60, fontSize: 15 },
});
