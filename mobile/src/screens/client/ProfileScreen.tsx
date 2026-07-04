import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, radius } from '../../theme/colors';
import { useLogout } from '@elengi/shared';
import { useAuthStore } from '../../store/auth.store';
import { useWallet } from '@elengi/shared';

export default function ProfileScreen() {
  const { user, clear } = useAuthStore();
  const { data: wallet } = useWallet();

  const logout = useLogout({ onSuccess: () => clear() });

  const handleLogout = () => {
    Alert.alert('Déconnexion', 'Voulez-vous vous déconnecter ?', [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Déconnecter', style: 'destructive', onPress: () => logout.mutate() },
    ]);
  };

  const rows = [
    { label: 'Prénom',  value: user?.firstName },
    { label: 'Nom',     value: user?.lastName },
    { label: 'Email',   value: user?.email },
    { label: 'Rôle',    value: user?.role },
  ];

  return (
    <SafeAreaView style={styles.safe}>
      <Text style={styles.title}>Mon profil</Text>

      {/* Avatar */}
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>
          {user ? `${user.firstName[0]}${user.lastName[0]}`.toUpperCase() : '?'}
        </Text>
      </View>

      {/* Points */}
      <View style={styles.pointsCard}>
        <Text style={styles.pointsLabel}>Mes points fidélité</Text>
        <Text style={styles.pointsValue}>⭐ {wallet?.points ?? user?.points ?? 0} pts</Text>
        <Text style={styles.pointsSub}>1 pt = 50 FC · Min. rachat : 20 pts = 1 000 FC</Text>
      </View>

      {/* Infos */}
      <View style={styles.card}>
        {rows.map(({ label, value }) => (
          <View key={label} style={styles.row}>
            <Text style={styles.rowLabel}>{label}</Text>
            <Text style={styles.rowValue}>{value ?? '—'}</Text>
          </View>
        ))}
      </View>

      {/* Logout */}
      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
        <Text style={styles.logoutText}>Se déconnecter</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:        { flex: 1, backgroundColor: colors.bg, padding: spacing.lg },
  title:       { fontSize: 24, fontWeight: '800', color: colors.text, marginBottom: spacing.lg },
  avatar:      {
    width: 80, height: 80, borderRadius: radius.full,
    backgroundColor: colors.accentSoft, justifyContent: 'center', alignItems: 'center',
    alignSelf: 'center', marginBottom: spacing.lg,
  },
  avatarText:  { fontSize: 28, fontWeight: '800', color: colors.accent },
  pointsCard:  {
    backgroundColor: colors.surface, borderRadius: radius.lg,
    padding: spacing.md, alignItems: 'center', marginBottom: spacing.md,
  },
  pointsLabel: { fontSize: 13, color: colors.text3, marginBottom: 4 },
  pointsValue: { fontSize: 28, fontWeight: '800', color: colors.accent },
  pointsSub:   { fontSize: 11, color: colors.text3, marginTop: 4 },
  card:        { backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.md, marginBottom: spacing.md },
  row:         { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.border },
  rowLabel:    { fontSize: 14, color: colors.text3 },
  rowValue:    { fontSize: 14, color: colors.text, fontWeight: '600' },
  logoutBtn:   {
    backgroundColor: 'rgba(248,113,113,0.1)', borderRadius: radius.md,
    padding: spacing.md, alignItems: 'center',
  },
  logoutText:  { color: colors.danger, fontWeight: '700', fontSize: 16 },
});
