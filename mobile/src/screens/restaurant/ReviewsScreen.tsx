import React, { useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  RefreshControl, TextInput, Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, radius, shadow } from '../../theme/colors';
import Icon from '../../components/Icon';
import { useMyReviews, useReplyReview } from '@elengi/shared';

function Stars({ rating }: { rating: number }) {
  return (
    <View style={{ flexDirection: 'row', gap: 2 }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Icon key={i} name={i <= rating ? 'star' : 'star-outline'} size={14} color={colors.warning} />
      ))}
    </View>
  );
}

export default function ReviewsScreen() {
  const { data: reviews = [], isLoading, refetch } = useMyReviews();
  const replyMutation = useReplyReview();
  const [replyFor, setReplyFor] = useState<{ id: string; name: string } | null>(null);
  const [reply, setReply] = useState('');

  const handleReply = () => {
    if (!replyFor || !reply.trim()) return;
    replyMutation.mutate({ id: replyFor.id, reply: reply.trim() });
    setReplyFor(null);
    setReply('');
  };

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.header}>
        <Text style={s.title}>Avis clients</Text>
        <Text style={s.count}>{reviews.length} avis</Text>
      </View>

      <FlatList
        data={reviews}
        keyExtractor={(r) => r.id}
        contentContainerStyle={{ padding: spacing.md, gap: spacing.md }}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor={colors.accent} />}
        renderItem={({ item }) => (
          <View style={s.card}>
            <View style={s.cardHeader}>
              <View>
                <Text style={s.clientName}>
                  {item.user?.firstName} {item.user?.lastName}
                </Text>
                <Text style={s.date}>
                  {new Date(item.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                </Text>
              </View>
              <Stars rating={item.rating} />
            </View>
            {item.comment && <Text style={s.comment}>{item.comment}</Text>}
            {item.ownerReply ? (
              <View style={s.replyBox}>
                <Text style={s.replyLabel}>Votre réponse</Text>
                <Text style={s.replyText}>{item.ownerReply}</Text>
              </View>
            ) : (
              <TouchableOpacity
                style={s.replyBtn}
                onPress={() => setReplyFor({ id: item.id, name: item.user?.firstName })}
              >
                <Icon name="chatbubble-outline" size={16} color={colors.accent} />
                <Text style={s.replyBtnText}>Répondre</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
        ListEmptyComponent={<Text style={s.empty}>Aucun avis pour l'instant</Text>}
      />

      <Modal visible={!!replyFor} transparent animationType="slide">
        <View style={s.overlay}>
          <View style={s.modal}>
            <Text style={s.modalTitle}>Répondre à {replyFor?.name}</Text>
            <TextInput
              style={[s.input, { height: 100, textAlignVertical: 'top' }]}
              value={reply} onChangeText={setReply}
              placeholder="Votre réponse..." placeholderTextColor={colors.text3}
              multiline
            />
            <TouchableOpacity style={s.btnPrimary} onPress={handleReply}>
              <Text style={s.btnPrimaryText}>Envoyer la réponse</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.btnSecondary} onPress={() => setReplyFor(null)}>
              <Text style={s.btnSecondaryText}>Annuler</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:         { flex: 1, backgroundColor: colors.bg },
  header:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: spacing.md },
  title:        { fontSize: 22, fontWeight: '800', color: colors.text },
  count:        { fontSize: 14, color: colors.text3 },
  card:         { backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.md, ...shadow.card },
  cardHeader:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
  clientName:   { fontSize: 15, fontWeight: '700', color: colors.text },
  date:         { fontSize: 12, color: colors.text3, marginTop: 2 },
  comment:      { fontSize: 14, color: colors.text2, lineHeight: 20 },
  replyBox:     { marginTop: 10, backgroundColor: colors.surface2, borderRadius: radius.md, padding: spacing.sm, borderLeftWidth: 3, borderLeftColor: colors.accent },
  replyLabel:   { fontSize: 11, color: colors.accent, fontWeight: '700', marginBottom: 2 },
  replyText:    { fontSize: 13, color: colors.text2 },
  replyBtn:     { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10 },
  replyBtnText: { fontSize: 14, color: colors.accent, fontWeight: '600' },
  empty:        { textAlign: 'center', color: colors.text3, marginTop: 40 },
  overlay:      { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modal:        { backgroundColor: colors.surface, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl, padding: spacing.lg },
  modalTitle:   { fontSize: 18, fontWeight: '800', color: colors.text, marginBottom: spacing.md },
  input:        { backgroundColor: colors.surface2, borderRadius: radius.md, padding: spacing.md, color: colors.text, borderWidth: 1, borderColor: colors.border, marginBottom: 12 },
  btnPrimary:   { backgroundColor: colors.accent, borderRadius: radius.md, padding: spacing.md, alignItems: 'center', marginBottom: spacing.sm },
  btnPrimaryText:{ color: colors.white, fontWeight: '700', fontSize: 16 },
  btnSecondary: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, padding: spacing.md, alignItems: 'center' },
  btnSecondaryText: { color: colors.text2, fontWeight: '600' },
});
