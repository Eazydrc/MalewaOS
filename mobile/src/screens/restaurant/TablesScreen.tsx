import React, { useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  RefreshControl, Alert, TextInput, Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, radius, shadow } from '../../theme/colors';
import Icon from '../../components/Icon';
import { useMyTables, useCreateTable, useDeleteTable } from '@elengi/shared';

export default function TablesScreen() {
  const { data: tables = [], isLoading, refetch } = useMyTables();
  const createTable = useCreateTable();
  const deleteTable = useDeleteTable();

  const [showModal, setShowModal] = useState(false);
  const [number, setNumber] = useState('');
  const [label, setLabel]   = useState('');

  const handleCreate = () => {
    if (!number) return;
    createTable.mutate({ number: parseInt(number, 10), label: label.trim() || undefined });
    setShowModal(false);
    setNumber(''); setLabel('');
  };

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.header}>
        <Text style={s.title}>Tables QR</Text>
        <TouchableOpacity style={s.addBtn} onPress={() => setShowModal(true)}>
          <Icon name="add" size={20} color={colors.white} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={tables}
        keyExtractor={(t) => t.id}
        numColumns={2}
        columnWrapperStyle={{ gap: spacing.sm }}
        contentContainerStyle={{ padding: spacing.md, gap: spacing.sm }}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor={colors.accent} />}
        renderItem={({ item }) => (
          <View style={s.card}>
            <Icon name="grid-outline" size={28} color={colors.accent} />
            <Text style={s.tableNum}>Table {item.number}</Text>
            {item.label && <Text style={s.tableLabel}>{item.label}</Text>}
            <Text style={s.qrHint}>QR disponible</Text>
            <TouchableOpacity
              style={s.deleteBtn}
              onPress={() => Alert.alert('Supprimer', `Supprimer la table ${item.number} ?`, [
                { text: 'Annuler', style: 'cancel' },
                { text: 'Supprimer', style: 'destructive', onPress: () => deleteTable.mutate(item.id) },
              ])}
            >
              <Icon name="trash-outline" size={16} color={colors.danger} />
            </TouchableOpacity>
          </View>
        )}
        ListEmptyComponent={<Text style={s.empty}>Aucune table — ajoute ta première table</Text>}
      />

      <Modal visible={showModal} transparent animationType="slide">
        <View style={s.overlay}>
          <View style={s.modal}>
            <Text style={s.modalTitle}>Nouvelle table</Text>
            <Text style={s.label}>Numéro de table *</Text>
            <TextInput
              style={s.input} value={number} onChangeText={setNumber}
              placeholder="1" placeholderTextColor={colors.text3}
              keyboardType="number-pad"
            />
            <Text style={s.label}>Libellé (optionnel)</Text>
            <TextInput
              style={s.input} value={label} onChangeText={setLabel}
              placeholder="Ex: Terrasse, VIP..." placeholderTextColor={colors.text3}
            />
            <TouchableOpacity style={s.btnPrimary} onPress={handleCreate}>
              <Text style={s.btnPrimaryText}>Créer la table</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.btnSecondary} onPress={() => setShowModal(false)}>
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
  addBtn:       { backgroundColor: colors.accent, borderRadius: radius.md, padding: spacing.sm },
  card:         { flex: 1, backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.md, alignItems: 'center', ...shadow.card },
  tableNum:     { fontSize: 16, fontWeight: '800', color: colors.text, marginTop: 8 },
  tableLabel:   { fontSize: 12, color: colors.text3, marginTop: 2 },
  qrHint:       { fontSize: 11, color: colors.success, marginTop: 6 },
  deleteBtn:    { marginTop: 10 },
  empty:        { textAlign: 'center', color: colors.text3, marginTop: 40 },
  overlay:      { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modal:        { backgroundColor: colors.surface, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl, padding: spacing.lg },
  modalTitle:   { fontSize: 18, fontWeight: '800', color: colors.text, marginBottom: spacing.md },
  label:        { fontSize: 13, color: colors.text2, marginBottom: 4 },
  input:        { backgroundColor: colors.surface2, borderRadius: radius.md, padding: spacing.md, color: colors.text, borderWidth: 1, borderColor: colors.border, marginBottom: 12 },
  btnPrimary:   { backgroundColor: colors.accent, borderRadius: radius.md, padding: spacing.md, alignItems: 'center', marginBottom: spacing.sm },
  btnPrimaryText:{ color: colors.white, fontWeight: '700', fontSize: 16 },
  btnSecondary: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, padding: spacing.md, alignItems: 'center' },
  btnSecondaryText: { color: colors.text2, fontWeight: '600' },
});
