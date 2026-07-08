import React, { useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  RefreshControl, Alert, TextInput, Modal, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, radius, shadow } from '../../theme/colors';
import Icon from '../../components/Icon';
import { useMyOffers, useCreateOffer, useUpdateOffer, useDeleteOffer } from '@elengi/shared';

const TYPES = ['PROMO', 'POINTS', 'FLASH'] as const;

export default function OffersScreen() {
  const { data: offers = [], isLoading, refetch } = useMyOffers();
  const createOffer = useCreateOffer();
  const deleteOffer = useDeleteOffer();

  const [showModal, setShowModal] = useState(false);
  const [type, setType]       = useState<'PROMO'|'POINTS'|'FLASH'>('PROMO');
  const [title, setTitle]     = useState('');
  const [desc, setDesc]       = useState('');
  const [discount, setDiscount] = useState('');
  const [points, setPoints]   = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [maxUses, setMaxUses] = useState('');

  const handleCreate = () => {
    if (!title.trim()) return;
    createOffer.mutate({
      type,
      title: title.trim(),
      description: desc.trim() || undefined,
      discountPct: discount ? parseFloat(discount) : undefined,
      pointsCost: points ? parseInt(points, 10) : undefined,
      expiresAt: expiresAt ? new Date(expiresAt).toISOString() : undefined,
      maxUses: maxUses ? parseInt(maxUses, 10) : undefined,
    });
    setShowModal(false);
    setTitle(''); setDesc(''); setDiscount(''); setPoints(''); setExpiresAt(''); setMaxUses('');
  };

  const typeColor = (t: string) =>
    t === 'PROMO' ? colors.accent : t === 'POINTS' ? colors.success : colors.warning;
  const typeIcon  = (t: string) =>
    t === 'PROMO' ? 'pricetag-outline' : t === 'POINTS' ? 'star-outline' : 'flash-outline';

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.header}>
        <Text style={s.title}>Offres & promotions</Text>
        <TouchableOpacity style={s.addBtn} onPress={() => setShowModal(true)}>
          <Icon name="add" size={20} color={colors.white} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={offers}
        keyExtractor={(o) => o.id}
        contentContainerStyle={{ padding: spacing.md, gap: spacing.md }}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor={colors.accent} />}
        renderItem={({ item }) => (
          <View style={s.card}>
            <View style={s.cardRow}>
              <View style={[s.badge, { backgroundColor: typeColor(item.type) + '22' }]}>
                <Icon name={typeIcon(item.type)} size={14} color={typeColor(item.type)} />
                <Text style={[s.badgeText, { color: typeColor(item.type) }]}>{item.type}</Text>
              </View>
              <TouchableOpacity onPress={() => Alert.alert('Supprimer', `Supprimer cette offre ?`, [
                { text: 'Annuler', style: 'cancel' },
                { text: 'Supprimer', style: 'destructive', onPress: () => deleteOffer.mutate(item.id) },
              ])}>
                <Icon name="trash-outline" size={18} color={colors.danger} />
              </TouchableOpacity>
            </View>
            <Text style={s.cardTitle}>{item.title}</Text>
            {item.description && <Text style={s.cardDesc}>{item.description}</Text>}
            <View style={s.details}>
              {item.discountPct != null && <Text style={s.detail}>-{item.discountPct}%</Text>}
              {item.pointsCost  != null && <Text style={s.detail}>{item.pointsCost} pts</Text>}
              {item.maxUses     != null && <Text style={s.detail}>Max {item.maxUses} utilisations</Text>}
              {item.expiresAt   && (
                <Text style={s.detail}>Expire {new Date(item.expiresAt).toLocaleDateString('fr-FR')}</Text>
              )}
            </View>
          </View>
        )}
        ListEmptyComponent={<Text style={s.empty}>Aucune offre créée</Text>}
      />

      <Modal visible={showModal} transparent animationType="slide">
        <View style={s.overlay}>
          <ScrollView contentContainerStyle={s.modal}>
            <Text style={s.modalTitle}>Nouvelle offre</Text>

            <Text style={s.label}>Type</Text>
            <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16 }}>
              {TYPES.map((t) => (
                <TouchableOpacity
                  key={t}
                  style={[s.typeBtn, type === t && { backgroundColor: typeColor(t) }]}
                  onPress={() => setType(t)}
                >
                  <Text style={[s.typeBtnText, type === t && { color: colors.white }]}>{t}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {[
              { label: 'Titre *', val: title, set: setTitle, placeholder: 'Ex: Happy Hour -20%' },
              { label: 'Description', val: desc, set: setDesc, placeholder: 'Détails optionnels' },
              { label: 'Remise (%)', val: discount, set: setDiscount, placeholder: '20', numeric: true },
              { label: 'Coût points', val: points, set: setPoints, placeholder: '50', numeric: true },
              { label: 'Expire le (YYYY-MM-DD)', val: expiresAt, set: setExpiresAt, placeholder: '2025-12-31' },
              { label: 'Max utilisations', val: maxUses, set: setMaxUses, placeholder: '100', numeric: true },
            ].map(({ label, val, set, placeholder, numeric }) => (
              <View key={label} style={{ marginBottom: 12 }}>
                <Text style={s.label}>{label}</Text>
                <TextInput
                  style={s.input} value={val} onChangeText={set}
                  placeholder={placeholder} placeholderTextColor={colors.text3}
                  keyboardType={numeric ? 'decimal-pad' : 'default'}
                />
              </View>
            ))}

            <TouchableOpacity style={s.btnPrimary} onPress={handleCreate}>
              <Text style={s.btnPrimaryText}>Créer l'offre</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.btnSecondary} onPress={() => setShowModal(false)}>
              <Text style={s.btnSecondaryText}>Annuler</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:         { flex: 1, backgroundColor: colors.bg },
  header:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: spacing.md },
  title:        { fontSize: 22, fontWeight: '800', color: colors.text },
  addBtn:       { backgroundColor: colors.accent, borderRadius: radius.md, padding: spacing.sm },
  card:         { backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.md, ...shadow.card },
  cardRow:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  badge:        { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: radius.sm, paddingHorizontal: 8, paddingVertical: 3 },
  badgeText:    { fontSize: 11, fontWeight: '700' },
  cardTitle:    { fontSize: 16, fontWeight: '700', color: colors.text },
  cardDesc:     { fontSize: 13, color: colors.text2, marginTop: 2 },
  details:      { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 },
  detail:       { fontSize: 12, color: colors.text3, backgroundColor: colors.surface2, borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2 },
  empty:        { textAlign: 'center', color: colors.text3, marginTop: 40 },
  overlay:      { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modal:        { backgroundColor: colors.surface, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl, padding: spacing.lg },
  modalTitle:   { fontSize: 18, fontWeight: '800', color: colors.text, marginBottom: spacing.md },
  label:        { fontSize: 13, color: colors.text2, marginBottom: 4 },
  input:        { backgroundColor: colors.surface2, borderRadius: radius.md, padding: spacing.md, color: colors.text, borderWidth: 1, borderColor: colors.border },
  typeBtn:      { flex: 1, borderWidth: 1, borderColor: colors.border, borderRadius: radius.sm, padding: 8, alignItems: 'center' },
  typeBtnText:  { fontSize: 13, fontWeight: '600', color: colors.text2 },
  btnPrimary:   { backgroundColor: colors.accent, borderRadius: radius.md, padding: spacing.md, alignItems: 'center', marginBottom: spacing.sm },
  btnPrimaryText:{ color: colors.white, fontWeight: '700', fontSize: 16 },
  btnSecondary: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, padding: spacing.md, alignItems: 'center' },
  btnSecondaryText: { color: colors.text2, fontWeight: '600' },
});
