import React, { useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  RefreshControl, Modal, Pressable,
} from 'react-native';
import { FadeSlide } from '../../components/animations';
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

type Tab = 'upcoming' | 'past';

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', {
    weekday: 'long', day: 'numeric', month: 'long',
    hour: '2-digit', minute: '2-digit',
  });
}

export default function ReservationsScreen() {
  const { data: reservations = [], isLoading, refetch } = useMyReservations();
  const cancel = useCancelReservation();
  const [tab, setTab] = useState<Tab>('upcoming');
  const [cancelTarget, setCancelTarget] = useState<string | null>(null);

  const now = new Date();
  const upcoming = reservations.filter((r: any) =>
    new Date(r.date) >= now && r.status !== 'CANCELLED' && r.status !== 'NO_SHOW',
  );
  const past = reservations.filter((r: any) =>
    new Date(r.date) < now || r.status === 'CANCELLED' || r.status === 'NO_SHOW',
  );
  const items = tab === 'upcoming' ? upcoming : past;

  const confirmCancel = () => {
    if (!cancelTarget) return;
    cancel.mutate(cancelTarget, { onSuccess: () => setCancelTarget(null) });
  };

  const renderItem = ({ item }: { item: Reservation }) => {
    const st = STATUS_LABEL[item.status] ?? { label: item.status, color: colors.text3 };
    const canCancel = item.status === 'PENDING' || item.status === 'CONFIRMED';

    return (
      <View style={s.card}>
        <View style={s.cardHeader}>
          <Text style={s.resto} numberOfLines={1}>{item.restaurant?.name ?? 'Restaurant'}</Text>
          <View style={[s.statusBadge, { backgroundColor: st.color + '22' }]}>
            <Text style={[s.statusText, { color: st.color }]}>{st.label}</Text>
          </View>
        </View>

        <Text style={s.date}>{fmtDate(item.date)}</Text>

        <View style={s.detailRow}>
          <Text style={s.detailText}>👥 {item.partySize} personne{item.partySize > 1 ? 's' : ''}</Text>
          {item.notes ? <Text style={s.detailText} numberOfLines={1}>📝 {item.notes}</Text> : null}
        </View>

        {canCancel && (
          <TouchableOpacity style={s.cancelBtn} onPress={() => setCancelTarget(item.id)}>
            <Text style={s.cancelText}>Annuler la réservation</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={s.safe}>
      <FadeSlide>
      <Text style={s.title}>Mes réservations</Text>

      <View style={s.tabs}>
        {(['upcoming', 'past'] as Tab[]).map((t) => (
          <TouchableOpacity key={t} style={[s.tabBtn, tab === t && s.tabActive]} onPress={() => setTab(t)}>
            <Text style={[s.tabText, tab === t && s.tabTextActive]}>
              {t === 'upcoming'
                ? `À venir${upcoming.length ? ` (${upcoming.length})` : ''}`
                : `Passées${past.length ? ` (${past.length})` : ''}`}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={items}
        keyExtractor={(r) => r.id}
        contentContainerStyle={s.list}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor={colors.accent} />}
        renderItem={renderItem}
        ListEmptyComponent={
          !isLoading ? (
            <View style={s.empty}>
              <Text style={{ fontSize: 40, marginBottom: 12 }}>{tab === 'upcoming' ? '📅' : '🕐'}</Text>
              <Text style={s.emptyTitle}>
                {tab === 'upcoming' ? 'Aucune réservation à venir' : 'Aucune réservation passée'}
              </Text>
              <Text style={s.emptySub}>
                {tab === 'upcoming' ? 'Explorez nos restaurants et réservez une table' : 'Votre historique apparaîtra ici'}
              </Text>
            </View>
          ) : null
        }
      />

      {/* Cancel confirmation modal */}
      <Modal visible={!!cancelTarget} transparent animationType="fade" onRequestClose={() => setCancelTarget(null)}>
        <Pressable style={s.backdrop} onPress={() => setCancelTarget(null)} />
        <View style={s.modalWrap}>
          <View style={s.modal}>
            <Text style={{ fontSize: 36, marginBottom: 4 }}>⚠️</Text>
            <Text style={s.modalTitle}>Annuler la réservation ?</Text>
            <Text style={s.modalSub}>Cette action est irréversible. Le restaurant sera notifié.</Text>
            <View style={s.modalBtns}>
              <TouchableOpacity style={s.keepBtn} onPress={() => setCancelTarget(null)}>
                <Text style={s.keepText}>Garder</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[s.confirmCancelBtn, cancel.isPending && { opacity: 0.6 }]}
                onPress={confirmCancel}
                disabled={cancel.isPending}
              >
                <Text style={s.confirmCancelText}>{cancel.isPending ? 'Annulation…' : 'Annuler'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </FadeSlide>
      </Modal>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:              { flex: 1, backgroundColor: colors.bg },
  title:             { fontSize: 24, fontWeight: '800', color: colors.text, padding: spacing.lg, paddingBottom: spacing.sm },
  tabs:              { flexDirection: 'row', paddingHorizontal: spacing.lg, borderBottomWidth: 1, borderBottomColor: colors.border, marginBottom: 4 },
  tabBtn:            { paddingVertical: spacing.sm, marginRight: spacing.lg, borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabActive:         { borderBottomColor: colors.accent },
  tabText:           { fontSize: 14, color: colors.text3, fontWeight: '600' },
  tabTextActive:     { color: colors.accent },
  list:              { padding: spacing.lg, gap: spacing.md, paddingTop: spacing.md },
  card:              { backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.md, ...shadow.card, gap: spacing.sm },
  cardHeader:        { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  resto:             { fontSize: 16, fontWeight: '700', color: colors.text, flex: 1, marginRight: spacing.sm },
  statusBadge:       { paddingHorizontal: 8, paddingVertical: 3, borderRadius: radius.full },
  statusText:        { fontSize: 11, fontWeight: '700' },
  date:              { fontSize: 13, color: colors.text2, textTransform: 'capitalize' },
  detailRow:         { flexDirection: 'row', gap: spacing.md, flexWrap: 'wrap' },
  detailText:        { fontSize: 13, color: colors.text3 },
  cancelBtn:         { paddingVertical: 10, borderRadius: radius.md, backgroundColor: 'rgba(248,113,113,0.1)', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(248,113,113,0.2)' },
  cancelText:        { color: colors.danger, fontWeight: '700', fontSize: 13 },
  empty:             { alignItems: 'center', marginTop: 60, padding: spacing.lg },
  emptyTitle:        { fontSize: 16, fontWeight: '700', color: colors.text, marginBottom: 6 },
  emptySub:          { fontSize: 13, color: colors.text3, textAlign: 'center' },
  backdrop:          { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.6)' } as any,
  modalWrap:         { flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.lg },
  modal:             { backgroundColor: colors.surface, borderRadius: radius.xl, padding: spacing.lg, alignItems: 'center', width: '100%', gap: spacing.sm, ...shadow.card },
  modalTitle:        { fontSize: 18, fontWeight: '800', color: colors.text, textAlign: 'center' },
  modalSub:          { fontSize: 13, color: colors.text3, textAlign: 'center', lineHeight: 20 },
  modalBtns:         { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm, width: '100%' },
  keepBtn:           { flex: 1, paddingVertical: 13, borderRadius: radius.md, backgroundColor: colors.surface2, alignItems: 'center' },
  keepText:          { fontSize: 14, fontWeight: '700', color: colors.text2 },
  confirmCancelBtn:  { flex: 1, paddingVertical: 13, borderRadius: radius.md, backgroundColor: 'rgba(248,113,113,0.15)', alignItems: 'center', borderWidth: 1, borderColor: colors.danger },
  confirmCancelText: { fontSize: 14, fontWeight: '700', color: colors.danger },
});
