import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path, Circle, Line } from 'react-native-svg';
import { colors, spacing, radius, shadow } from '../../theme/colors';
import { useLogout, useWallet } from '@elengi/shared';
import { useAuthStore } from '../../store/auth.store';

const USD_TO_CDF = 2800;

// ── Icons ─────────────────────────────────────────────────────────────────────

function ChevronRight() {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={colors.text3} strokeWidth={2} strokeLinecap="round">
      <Path d="M9 18l6-6-6-6" />
    </Svg>
  );
}

// ── Menu Row ──────────────────────────────────────────────────────────────────

function MenuRow({ icon, label, value, onPress, danger }: {
  icon: string; label: string; value?: string; onPress?: () => void; danger?: boolean;
}) {
  return (
    <TouchableOpacity style={s.menuRow} onPress={onPress} activeOpacity={onPress ? 0.7 : 1} disabled={!onPress}>
      <Text style={s.menuIcon}>{icon}</Text>
      <View style={s.menuMid}>
        <Text style={[s.menuLabel, danger && { color: colors.danger }]}>{label}</Text>
        {value ? <Text style={s.menuValue}>{value}</Text> : null}
      </View>
      {onPress ? <ChevronRight /> : null}
    </TouchableOpacity>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────

export default function ProfileScreen({ navigation }: any) {
  const { user, clear } = useAuthStore();
  const { data: wallet } = useWallet();
  const logout = useLogout({ onSuccess: () => clear() });

  const points = wallet?.points ?? user?.points ?? 0;
  const pointsInCdf = Math.floor(points / 20) * 20 * 50;

  const initials = user
    ? `${user.firstName?.[0] ?? ''}${user.lastName?.[0] ?? ''}`.toUpperCase()
    : '?';

  const handleLogout = () => {
    Alert.alert('Déconnexion', 'Voulez-vous vous déconnecter ?', [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Déconnecter', style: 'destructive', onPress: () => logout.mutate() },
    ]);
  };

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.container}>
        <Text style={s.title}>Mon profil</Text>

        {/* Avatar + name */}
        <View style={s.avatarSection}>
          <View style={s.avatar}>
            <Text style={s.avatarText}>{initials}</Text>
          </View>
          <Text style={s.name}>{user?.firstName} {user?.lastName}</Text>
          <Text style={s.email}>{user?.email}</Text>
        </View>

        {/* Stats */}
        <View style={s.statsRow}>
          {[
            { label: 'Points', value: points.toString(), icon: '⭐' },
            { label: 'Valeur', value: `${pointsInCdf.toLocaleString()} FC`, icon: '💰' },
            { label: 'Rôle',   value: user?.role ?? '—', icon: '👤' },
          ].map((stat) => (
            <View key={stat.label} style={s.statCard}>
              <Text style={s.statIcon}>{stat.icon}</Text>
              <Text style={s.statValue} numberOfLines={1}>{stat.value}</Text>
              <Text style={s.statLabel}>{stat.label}</Text>
            </View>
          ))}
        </View>

        {/* Wallet card */}
        <TouchableOpacity
          style={s.walletCard}
          onPress={() => navigation?.navigate('Wallet')}
          activeOpacity={0.85}
        >
          <View>
            <Text style={s.walletLabel}>Solde de points</Text>
            <Text style={s.walletPoints}>{points} pts</Text>
            <Text style={s.walletSub}>1 pt = 50 FC · Min. rachat : 20 pts = 1 000 FC</Text>
          </View>
          <View style={s.walletArrow}>
            <ChevronRight />
          </View>
        </TouchableOpacity>

        {/* Account section */}
        <Text style={s.sectionTitle}>Compte</Text>
        <View style={s.menuCard}>
          <MenuRow icon="✉️" label="Email" value={user?.email} />
          <View style={s.divider} />
          <MenuRow icon="📱" label="Téléphone" value={(user as any)?.phone ?? 'Non renseigné'} />
          <View style={s.divider} />
          <MenuRow icon="🔒" label="Modifier le mot de passe" onPress={() => {}} />
        </View>

        {/* Activity section */}
        <Text style={s.sectionTitle}>Activité</Text>
        <View style={s.menuCard}>
          <MenuRow icon="📅" label="Réservations" onPress={() => navigation?.navigate('reservations')} />
          <View style={s.divider} />
          <MenuRow icon="🛍️" label="Commandes" onPress={() => navigation?.navigate('orders')} />
          <View style={s.divider} />
          <MenuRow icon="⭐" label="Wallet & points" onPress={() => navigation?.navigate('Wallet')} />
        </View>

        {/* Logout */}
        <TouchableOpacity style={s.logoutBtn} onPress={handleLogout} activeOpacity={0.8}>
          <Text style={s.logoutText}>Se déconnecter</Text>
        </TouchableOpacity>

        <Text style={s.version}>Elengi v1.0 · Kinshasa, RDC</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:          { flex: 1, backgroundColor: colors.bg },
  container:     { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xl },
  title:         { fontSize: 24, fontWeight: '800', color: colors.text },
  avatarSection: { alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.md },
  avatar:        { width: 80, height: 80, borderRadius: radius.full, backgroundColor: colors.accentSoft, justifyContent: 'center', alignItems: 'center' },
  avatarText:    { fontSize: 28, fontWeight: '800', color: colors.accent },
  name:          { fontSize: 20, fontWeight: '800', color: colors.text },
  email:         { fontSize: 13, color: colors.text3 },
  statsRow:      { flexDirection: 'row', gap: spacing.sm },
  statCard:      { flex: 1, backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.md, alignItems: 'center', gap: 2, ...shadow.card },
  statIcon:      { fontSize: 20, marginBottom: 2 },
  statValue:     { fontSize: 14, fontWeight: '800', color: colors.text },
  statLabel:     { fontSize: 10, color: colors.text3, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  walletCard:    {
    backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.md,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    borderWidth: 1, borderColor: colors.accent + '33', ...shadow.card,
  },
  walletLabel:   { fontSize: 12, color: colors.text3, marginBottom: 2 },
  walletPoints:  { fontSize: 28, fontWeight: '800', color: colors.accent },
  walletSub:     { fontSize: 11, color: colors.text3, marginTop: 2 },
  walletArrow:   { padding: spacing.sm },
  sectionTitle:  { fontSize: 13, fontWeight: '700', color: colors.text3, textTransform: 'uppercase', letterSpacing: 1, marginTop: spacing.sm },
  menuCard:      { backgroundColor: colors.surface, borderRadius: radius.lg, overflow: 'hidden', ...shadow.card },
  menuRow:       { flexDirection: 'row', alignItems: 'center', padding: spacing.md, gap: spacing.md },
  menuIcon:      { fontSize: 18, width: 24, textAlign: 'center' },
  menuMid:       { flex: 1 },
  menuLabel:     { fontSize: 15, color: colors.text, fontWeight: '600' },
  menuValue:     { fontSize: 12, color: colors.text3, marginTop: 1 },
  divider:       { height: 1, backgroundColor: colors.border, marginLeft: spacing.lg + 24 + spacing.md },
  logoutBtn:     {
    backgroundColor: 'rgba(248,113,113,0.1)', borderRadius: radius.md,
    padding: spacing.md, alignItems: 'center', marginTop: spacing.sm,
    borderWidth: 1, borderColor: 'rgba(248,113,113,0.2)',
  },
  logoutText:    { color: colors.danger, fontWeight: '700', fontSize: 16 },
  version:       { textAlign: 'center', fontSize: 11, color: colors.text3, marginTop: spacing.sm },
});
