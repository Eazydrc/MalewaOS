import React, { useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  RefreshControl, Alert, TextInput, Switch, Modal, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, radius, shadow } from '../../theme/colors';
import Icon from '../../components/Icon';
import {
  useMenu, useCreateSection, useDeleteSection,
  useCreateItem, useUpdateItem, useToggleItem, useDeleteItem,
} from '@elengi/shared';

export default function MenuScreen() {
  const { data: menu, isLoading, refetch } = useMenu();
  const createSection = useCreateSection();
  const deleteSection = useDeleteSection();
  const createItem    = useCreateItem();
  const updateItem    = useUpdateItem();
  const toggleItem    = useToggleItem();
  const deleteItem    = useDeleteItem();

  const [newSection, setNewSection]   = useState('');
  const [addItemFor, setAddItemFor]   = useState<string | null>(null);
  const [itemName, setItemName]       = useState('');
  const [itemPrice, setItemPrice]     = useState('');
  const [itemDesc, setItemDesc]       = useState('');
  const [itemPromo, setItemPromo]     = useState('');

  const handleAddSection = () => {
    if (!newSection.trim()) return;
    createSection.mutate({ title: newSection.trim(), order: (menu?.sections?.length ?? 0) + 1 });
    setNewSection('');
  };

  const handleAddItem = () => {
    if (!addItemFor || !itemName.trim() || !itemPrice) return;
    createItem.mutate({
      sectionId: addItemFor,
      name: itemName.trim(),
      description: itemDesc.trim() || undefined,
      priceUsdCents: Math.round(parseFloat(itemPrice) * 100),
      promoPrice: itemPromo ? Math.round(parseFloat(itemPromo) * 100) : undefined,
    });
    setAddItemFor(null);
    setItemName(''); setItemPrice(''); setItemDesc(''); setItemPromo('');
  };

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.header}>
        <Text style={s.title}>Menu digital</Text>
      </View>

      <View style={s.addSection}>
        <TextInput
          style={s.input} value={newSection} onChangeText={setNewSection}
          placeholder="Nouvelle section (ex: Entrées)" placeholderTextColor={colors.text3}
        />
        <TouchableOpacity style={s.addBtn} onPress={handleAddSection}>
          <Icon name="add" size={20} color={colors.white} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={menu?.sections ?? []}
        keyExtractor={(s) => s.id}
        contentContainerStyle={{ padding: spacing.md, gap: spacing.md }}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor={colors.accent} />}
        renderItem={({ item: section }) => (
          <View style={s.section}>
            <View style={s.sectionHeader}>
              <Text style={s.sectionTitle}>{section.title}</Text>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <TouchableOpacity onPress={() => setAddItemFor(section.id)}>
                  <Icon name="add-circle-outline" size={22} color={colors.accent} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => Alert.alert('Supprimer', `Supprimer "${section.title}" ?`, [
                  { text: 'Annuler', style: 'cancel' },
                  { text: 'Supprimer', style: 'destructive', onPress: () => deleteSection.mutate(section.id) },
                ])}>
                  <Icon name="trash-outline" size={22} color={colors.danger} />
                </TouchableOpacity>
              </View>
            </View>

            {section.items?.map((item: any) => (
              <View key={item.id} style={s.item}>
                <View style={{ flex: 1 }}>
                  <Text style={s.itemName}>{item.name}</Text>
                  {item.description && <Text style={s.itemDesc}>{item.description}</Text>}
                  <View style={{ flexDirection: 'row', gap: 8, marginTop: 4 }}>
                    <Text style={s.itemPrice}>{(item.priceUsdCents / 100).toFixed(2)} $</Text>
                    {item.promoPrice && (
                      <Text style={s.itemPromo}>{(item.promoPrice / 100).toFixed(2)} $</Text>
                    )}
                    {item.isHot && <Text style={s.badge}>🔥 Vente chaude</Text>}
                  </View>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Switch
                    value={item.isAvailable ?? true}
                    onValueChange={() => toggleItem.mutate(item.id)}
                    trackColor={{ true: colors.accent, false: colors.border }}
                    thumbColor={colors.white}
                  />
                  <TouchableOpacity onPress={() => Alert.alert('Supprimer', `Supprimer "${item.name}" ?`, [
                    { text: 'Annuler', style: 'cancel' },
                    { text: 'Supprimer', style: 'destructive', onPress: () => deleteItem.mutate(item.id) },
                  ])}>
                    <Icon name="trash-outline" size={18} color={colors.danger} />
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}
        ListEmptyComponent={<Text style={s.empty}>Aucune section — crée ta première section ci-dessus</Text>}
      />

      {/* Modal ajout plat */}
      <Modal visible={!!addItemFor} transparent animationType="slide">
        <View style={s.overlay}>
          <ScrollView contentContainerStyle={s.modal}>
            <Text style={s.modalTitle}>Nouveau plat</Text>
            {[
              { label: 'Nom du plat *', val: itemName, set: setItemName, placeholder: 'Ex: Poulet braisé' },
              { label: 'Prix ($) *', val: itemPrice, set: setItemPrice, placeholder: '5.00', numeric: true },
              { label: 'Prix promo ($)', val: itemPromo, set: setItemPromo, placeholder: '4.00', numeric: true },
              { label: 'Description', val: itemDesc, set: setItemDesc, placeholder: 'Description optionnelle' },
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
            <TouchableOpacity style={s.btnPrimary} onPress={handleAddItem}>
              <Text style={s.btnPrimaryText}>Ajouter le plat</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.btnSecondary} onPress={() => setAddItemFor(null)}>
              <Text style={s.btnSecondaryText}>Annuler</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:          { flex: 1, backgroundColor: colors.bg },
  header:        { padding: spacing.md, paddingBottom: spacing.sm },
  title:         { fontSize: 22, fontWeight: '800', color: colors.text },
  addSection:    { flexDirection: 'row', paddingHorizontal: spacing.md, gap: spacing.sm, marginBottom: spacing.sm },
  input:         { flex: 1, backgroundColor: colors.surface2, borderRadius: radius.md, padding: spacing.md, color: colors.text, borderWidth: 1, borderColor: colors.border },
  addBtn:        { backgroundColor: colors.accent, borderRadius: radius.md, width: 48, alignItems: 'center', justifyContent: 'center' },
  section:       { backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.md, ...shadow.card },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
  sectionTitle:  { fontSize: 16, fontWeight: '700', color: colors.text },
  item:          { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.sm, borderTopWidth: 1, borderTopColor: colors.border },
  itemName:      { fontSize: 14, fontWeight: '600', color: colors.text },
  itemDesc:      { fontSize: 12, color: colors.text3, marginTop: 2 },
  itemPrice:     { fontSize: 13, fontWeight: '700', color: colors.accent },
  itemPromo:     { fontSize: 13, color: colors.success },
  badge:         { fontSize: 11, color: colors.warning },
  empty:         { textAlign: 'center', color: colors.text3, marginTop: 40 },
  overlay:       { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modal:         { backgroundColor: colors.surface, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl, padding: spacing.lg },
  modalTitle:    { fontSize: 18, fontWeight: '800', color: colors.text, marginBottom: spacing.md },
  label:         { fontSize: 13, color: colors.text2, marginBottom: 4 },
  btnPrimary:    { backgroundColor: colors.accent, borderRadius: radius.md, padding: spacing.md, alignItems: 'center', marginBottom: spacing.sm },
  btnPrimaryText:{ color: colors.white, fontWeight: '700', fontSize: 16 },
  btnSecondary:  { borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, padding: spacing.md, alignItems: 'center' },
  btnSecondaryText: { color: colors.text2, fontWeight: '600' },
});
