import React, { useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  RefreshControl, Alert, TextInput, Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, radius, shadow } from '../../theme/colors';
import Icon from '../../components/Icon';
import { useMyStaff, useCreateStaff, useDeleteStaff } from '@elengi/shared';

const ROLES = ['SERVEUR', 'CUISINIER', 'MANAGER', 'CAISSIER'] as const;
type StaffRole = typeof ROLES[number];

const ROLE_ICONS: Record<StaffRole, string> = {
  SERVEUR: 'person-outline',
  CUISINIER: 'restaurant-outline',
  MANAGER: 'briefcase-outline',
  CAISSIER: 'cash-outline',
};

export default function StaffScreen() {
  const { data: staff = [], isLoading, refetch } = useMyStaff();
  const createStaff = useCreateStaff();
  const deleteStaff = useDeleteStaff();

  const [showModal, setShowModal] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName]   = useState('');
  const [role, setRole]           = useState<StaffRole>('SERVEUR');
  const [phone, setPhone]         = useState('');

  const handleCreate = () => {
    if (!firstName.trim() || !lastName.trim()) return;
    createStaff.mutate({ firstName: firstName.trim(), lastName: lastName.trim(), role, phone: phone.trim() || undefined });
    setShowModal(false);
    setFirstName(''); setLastName(''); setPhone('');
  };

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.header}>
        <Text style={s.title}>Personnel</Text>
        <TouchableOpacity style={s.addBtn} onPress={() => setShowModal(true)}>
          <Icon name="add" size={20} color={colors.white} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={staff}
        keyExtractor={(m) => m.id}
        contentContainerStyle={{ padding: spacing.md, gap: spacing.md }}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor={colors.accent} />}
        renderItem={({ item }) => (
          <View style={s.card}>
            <View style={[s.avatar, { backgroundColor: item.isActive ? colors.accent + '22' : colors.border + '33' }]}>
              <Icon name={ROLE_ICONS[item.role as StaffRole] ?? 'person-outline'} size={24} color={item.isActive ? colors.accent : colors.text3} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.name}>{item.firstName} {item.lastName}</Text>
              <Text style={s.role}>{item.role} {item.isActive ? '· Actif' : '· Inactif'}</Text>
              {item.phone && <Text style={s.phone}>{item.phone}</Text>}
            </View>
            <TouchableOpacity onPress={() => Alert.alert('Supprimer', `Supprimer ${item.firstName} ?`, [
              { text: 'Annuler', style: 'cancel' },
              { text: 'Supprimer', style: 'destructive', onPress: () => deleteStaff.mutate(item.id) },
            ])}>
              <Icon name="trash-outline" size={18} color={colors.danger} />
            </TouchableOpacity>
          </View>
        )}
        ListEmptyComponent={<Text style={s.empty}>Aucun membre du personnel</Text>}
      />

      <Modal visible={showModal} transparent animationType="slide">
        <View style={s.overlay}>
          <View style={s.modal}>
            <Text style={s.modalTitle}>Nouveau membre</Text>

            <Text style={s.label}>Rôle</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
              {ROLES.map((r) => (
                <TouchableOpacity
                  key={r}
                  style={[s.roleBtn, role === r && s.roleBtnActive]}
                  onPress={() => setRole(r)}
                >
                  <Text style={[s.roleBtnText, role === r && s.roleBtnTextActive]}>{r}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {[
              { label: 'Prénom *', val: firstName, set: setFirstName, placeholder: 'Jean' },
              { label: 'Nom *', val: lastName, set: setLastName, placeholder: 'Dupont' },
              { label: 'Téléphone', val: phone, set: setPhone, placeholder: '+243...', numeric: true },
            ].map(({ label, val, set, placeholder, numeric }) => (
              <View key={label} style={{ marginBottom: 12 }}>
                <Text style={s.label}>{label}</Text>
                <TextInput
                  style={s.input} value={val} onChangeText={set}
                  placeholder={placeholder} placeholderTextColor={colors.text3}
                  keyboardType={numeric ? 'phone-pad' : 'default'}
                />
              </View>
            ))}

            <TouchableOpacity style={s.btnPrimary} onPress={handleCreate}>
              <Text style={s.btnPrimaryText}>Ajouter le membre</Text>
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
  safe:            { flex: 1, backgroundColor: colors.bg },
  header:          { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: spacing.md },
  title:           { fontSize: 22, fontWeight: '800', color: colors.text },
  addBtn:          { backgroundColor: colors.accent, borderRadius: radius.md, padding: spacing.sm },
  card:            { flexDirection: 'row', alignItems: 'center', gap: spacing.md, backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.md, ...shadow.card },
  avatar:          { width: 48, height: 48, borderRadius: radius.full, alignItems: 'center', justifyContent: 'center' },
  name:            { fontSize: 15, fontWeight: '700', color: colors.text },
  role:            { fontSize: 13, color: colors.text3, marginTop: 2 },
  phone:           { fontSize: 12, color: colors.text2, marginTop: 2 },
  empty:           { textAlign: 'center', color: colors.text3, marginTop: 40 },
  overlay:         { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modal:           { backgroundColor: colors.surface, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl, padding: spacing.lg },
  modalTitle:      { fontSize: 18, fontWeight: '800', color: colors.text, marginBottom: spacing.md },
  label:           { fontSize: 13, color: colors.text2, marginBottom: 4 },
  input:           { backgroundColor: colors.surface2, borderRadius: radius.md, padding: spacing.md, color: colors.text, borderWidth: 1, borderColor: colors.border },
  roleBtn:         { borderWidth: 1, borderColor: colors.border, borderRadius: radius.sm, paddingHorizontal: 12, paddingVertical: 6 },
  roleBtnActive:   { backgroundColor: colors.accent, borderColor: colors.accent },
  roleBtnText:     { fontSize: 12, fontWeight: '600', color: colors.text2 },
  roleBtnTextActive:{ color: colors.white },
  btnPrimary:      { backgroundColor: colors.accent, borderRadius: radius.md, padding: spacing.md, alignItems: 'center', marginBottom: spacing.sm },
  btnPrimaryText:  { color: colors.white, fontWeight: '700', fontSize: 16 },
  btnSecondary:    { borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, padding: spacing.md, alignItems: 'center' },
  btnSecondaryText:{ color: colors.text2, fontWeight: '600' },
});
