import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, Modal, Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Polygon } from 'react-native-svg';
import { colors, spacing, radius, shadow } from '../../theme/colors';
import { useWallet, useRedeemPoints } from '@elengi/shared';

const POINTS_TO_FC = 50;

// ── Transaction icon config ───────────────────────────────────────────────────

const TX_CONFIG: Record<string, { icon: string; color: string; sign: string }> = {
  EARN:   { icon: '↑', color: '#16A34A', sign: '+' },
  BONUS:  { icon: '⭐', color: '#F59E0B', sign: '+' },
  REFUND: { icon: '↩', color: '#3B82F6', sign: '+' },
  REDEEM: { icon: '↓', color: '#DC2626', sign: ''  },
  EXPIRY: { icon: '⏱', color: '#71717A', sign: ''  },
};

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
}

// ── Redeem Modal ──────────────────────────────────────────────────────────────

function RedeemModal({
  points, onConfirm, onClose, loading,
}: { points: number; onConfirm: (pts: number) => void; onClose: () => void; loading: boolean }) {
  const [selected, setSelected] = useState(20);
  const maxMultiples = Math.floor(points / 20);
  const options = Array.from({ length: Math.min(maxMultiples, 10) }, (_, i) => (i + 1) * 20);

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={s.backdrop} onPress={onClose} />
      <View style={s.redeemSheet}>
        <View style={s.handle} />
        <View style={{ alignItems: 'center', gap: spacing.xs, marginBottom: spacing.md }}>
          <Text style={{ fontSize: 28 }}>💰</Text>
          <Text style={s.redeemTitle}>Échanger des points</Text>
          <Text style={s.redeemSub}>20 pts = 1 000 FC de réduction</Text>
        </View>

        <Text style={s.redeemLabel}>Nombre de points à échanger</Text>
        <View style={s.pillRow}>
          {options.map((opt) => (
            <TouchableOpacity
              key={opt}
              style={[s.pill, selected === opt && s.pillActive]}
              onPress={() => setSelected(opt)}
              activeOpacity={0.7}
            >
              <Text style={[s.pillText, selected === opt && s.pillTextActive]}>{opt} pts</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={s.redeemValue}>
          <Text style={s.redeemValueLabel}>Valeur obtenue</Text>
          <Text style={s.redeemValueAmount}>{(selected * POINTS_TO_FC).toLocaleString()} FC</Text>
        </View>

        <View style={s.redeemBtns}>
          <TouchableOpacity style={s.cancelBtn} onPress={onClose} disabled={loading}>
            <Text style={s.cancelText}>Annuler</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[s.confirmBtn, loading && { opacity: 0.6 }]}
            onPress={() => onConfirm(selected)}
            disabled={loading}
          >
            <Text style={s.confirmText}>{loading ? 'Traitement…' : 'Confirmer'}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────

export default function WalletScreen({ navigation }: any) {
  const { data: wallet, isLoading } = useWallet();
  const redeemMutation = useRedeemPoints();
  const [showRedeem, setShowRedeem] = useState(false);

  const points      = wallet?.points ?? 0;
  const minRedeem   = 20;
  const remainder   = points % minRedeem;
  const progress    = remainder / minRedeem;
  const canRedeem   = points >= minRedeem;
  const redeemableFC = Math.floor(points / minRedeem) * minRedeem * POINTS_TO_FC;
  const history     = wallet?.transactions ?? [];

  function handleRedeem(pts: number) {
    redeemMutation.mutate(pts, { onSuccess: () => setShowRedeem(false) });
  }

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.headerRow}>
        <TouchableOpacity onPress={() => navigation?.goBack()} style={s.backBtn}>
          <Text style={s.backText}>←</Text>
        </TouchableOpacity>
        <Text style={s.title}>Wallet</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.container}>
        {/* Points card */}
        <View style={s.pointsCard}>
          <View style={s.pointsTop}>
            <View>
              <Text style={s.pointsLabel}>Solde de points</Text>
              <Text style={s.pointsValue}>{points.toLocaleString()}</Text>
              <Text style={s.pointsSub}>points fidélité</Text>
            </View>
            <View style={s.starIcon}>
              <Svg width={26} height={26} viewBox="0 0 24 24" fill="none" stroke={colors.accent} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
                <Polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </Svg>
            </View>
          </View>

          {/* Progress bar */}
          <View style={s.progressSection}>
            <View style={s.progressLabels}>
              <Text style={s.progressLeft}>Prochain échange</Text>
              <Text style={s.progressRight}>{remainder}/{minRedeem} pts</Text>
            </View>
            <View style={s.progressBar}>
              <View style={[s.progressFill, { width: `${Math.round(progress * 100)}%` as any }]} />
            </View>
            <Text style={s.progressHint}>
              {minRedeem - remainder} pts manquants pour {(minRedeem * POINTS_TO_FC).toLocaleString()} FC de réduction
            </Text>
          </View>

          {/* Redeem zone */}
          {canRedeem && (
            <View style={s.redeemZone}>
              <View>
                <Text style={s.redeemZoneLabel}>Disponible à l'échange</Text>
                <Text style={s.redeemZoneAmount}>{redeemableFC.toLocaleString()} FC</Text>
              </View>
              <TouchableOpacity style={s.redeemTrigger} onPress={() => setShowRedeem(true)}>
                <Text style={s.redeemTriggerText}>Échanger</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Quick stats */}
        <View style={s.statsRow}>
          {[
            { icon: '⭐', value: points.toLocaleString(), label: 'Points' },
            { icon: '💰', value: `${redeemableFC.toLocaleString()} FC`, label: 'Valeur' },
            { icon: '📋', value: history.length.toString(), label: 'Transactions' },
          ].map((stat) => (
            <View key={stat.label} style={s.statCard}>
              <Text style={s.statIcon}>{stat.icon}</Text>
              <Text style={s.statValue} numberOfLines={1} adjustsFontSizeToFit>{stat.value}</Text>
              <Text style={s.statLabel}>{stat.label}</Text>
            </View>
          ))}
        </View>

        {/* History */}
        <Text style={s.historyTitle}>Historique</Text>
        {isLoading ? (
          <View style={s.historyCard}>
            {[1, 2, 3].map((i) => (
              <View key={i} style={[s.txRow, { opacity: 0.4 }]}>
                <View style={[s.txIcon, { backgroundColor: colors.surface2 }]} />
                <View style={{ flex: 1, gap: 6 }}>
                  <View style={{ height: 12, backgroundColor: colors.surface2, borderRadius: 4, width: '70%' }} />
                  <View style={{ height: 10, backgroundColor: colors.surface2, borderRadius: 4, width: '40%' }} />
                </View>
              </View>
            ))}
          </View>
        ) : history.length === 0 ? (
          <View style={s.emptyHistory}>
            <Text style={{ fontSize: 28, marginBottom: 8 }}>📋</Text>
            <Text style={s.emptyTitle}>Aucune transaction</Text>
            <Text style={s.emptySub}>Vos gains et échanges apparaîtront ici</Text>
          </View>
        ) : (
          <View style={s.historyCard}>
            {history.map((tx: any, idx: number) => {
              const cfg = TX_CONFIG[tx.type] ?? TX_CONFIG.EARN;
              const isPositive = tx.amount > 0;
              return (
                <React.Fragment key={tx.id}>
                  {idx > 0 && <View style={s.txDivider} />}
                  <View style={s.txRow}>
                    <View style={[s.txIcon, { backgroundColor: cfg.color + '22' }]}>
                      <Text style={[s.txIconText, { color: cfg.color }]}>{cfg.icon}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={s.txReason} numberOfLines={1}>{tx.reason ?? tx.description}</Text>
                      <Text style={s.txDate}>{fmtDate(tx.createdAt)}</Text>
                    </View>
                    <Text style={[s.txAmount, { color: isPositive ? '#16A34A' : '#DC2626' }]}>
                      {isPositive ? '+' : ''}{tx.amount} pts
                    </Text>
                  </View>
                </React.Fragment>
              );
            })}
          </View>
        )}

        {redeemMutation.isError && (
          <View style={s.errorBox}>
            <Text style={s.errorText}>
              {(redeemMutation.error as any)?.message ?? "Erreur lors de l'échange"}
            </Text>
          </View>
        )}
      </ScrollView>

      {showRedeem && (
        <RedeemModal
          points={points}
          onClose={() => setShowRedeem(false)}
          onConfirm={handleRedeem}
          loading={redeemMutation.isPending}
        />
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:              { flex: 1, backgroundColor: colors.bg },
  headerRow:         { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: spacing.lg, paddingBottom: spacing.sm },
  backBtn:           { width: 40, height: 40, justifyContent: 'center' },
  backText:          { fontSize: 22, color: colors.text, fontWeight: '600' },
  title:             { fontSize: 20, fontWeight: '800', color: colors.text },
  container:         { padding: spacing.lg, gap: spacing.md, paddingTop: 0, paddingBottom: spacing.xl },
  pointsCard:        { backgroundColor: colors.surface, borderRadius: radius.xl, padding: spacing.lg, gap: spacing.md, ...shadow.card },
  pointsTop:         { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  pointsLabel:       { fontSize: 12, color: colors.text3, fontWeight: '600', marginBottom: 4 },
  pointsValue:       { fontSize: 40, fontWeight: '900', color: colors.text, letterSpacing: -1 },
  pointsSub:         { fontSize: 13, color: colors.text3, marginTop: 2 },
  starIcon:          { width: 52, height: 52, borderRadius: radius.lg, backgroundColor: colors.accentSoft, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: colors.accent + '33' },
  progressSection:   { gap: 6 },
  progressLabels:    { flexDirection: 'row', justifyContent: 'space-between' },
  progressLeft:      { fontSize: 12, color: colors.text3, fontWeight: '500' },
  progressRight:     { fontSize: 12, fontWeight: '700', color: colors.text },
  progressBar:       { height: 8, backgroundColor: colors.surface2, borderRadius: radius.full, overflow: 'hidden' },
  progressFill:      { height: '100%', borderRadius: radius.full, backgroundColor: colors.accent },
  progressHint:      { fontSize: 11, color: colors.text3 },
  redeemZone:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: 'rgba(74,222,128,0.08)', borderRadius: radius.md, padding: spacing.md, borderWidth: 1, borderColor: 'rgba(74,222,128,0.2)' },
  redeemZoneLabel:   { fontSize: 12, fontWeight: '600', color: colors.success },
  redeemZoneAmount:  { fontSize: 18, fontWeight: '800', color: colors.success, marginTop: 2 },
  redeemTrigger:     { backgroundColor: colors.accent, borderRadius: radius.md, paddingHorizontal: spacing.md, paddingVertical: 9 },
  redeemTriggerText: { color: colors.white, fontWeight: '700', fontSize: 13 },
  statsRow:          { flexDirection: 'row', gap: spacing.sm },
  statCard:          { flex: 1, backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.md, alignItems: 'center', gap: 4, ...shadow.card },
  statIcon:          { fontSize: 20 },
  statValue:         { fontSize: 13, fontWeight: '800', color: colors.text, textAlign: 'center' },
  statLabel:         { fontSize: 10, color: colors.text3, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  historyTitle:      { fontSize: 16, fontWeight: '700', color: colors.text },
  historyCard:       { backgroundColor: colors.surface, borderRadius: radius.lg, overflow: 'hidden', ...shadow.card },
  txRow:             { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.md },
  txDivider:         { height: 1, backgroundColor: colors.border, marginLeft: spacing.md + 36 + spacing.md },
  txIcon:            { width: 36, height: 36, borderRadius: radius.md, justifyContent: 'center', alignItems: 'center' },
  txIconText:        { fontSize: 14, fontWeight: '700' },
  txReason:          { fontSize: 14, fontWeight: '600', color: colors.text },
  txDate:            { fontSize: 11, color: colors.text3, marginTop: 2 },
  txAmount:          { fontSize: 14, fontWeight: '700' },
  emptyHistory:      { backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.xl, alignItems: 'center', ...shadow.card },
  emptyTitle:        { fontSize: 15, fontWeight: '700', color: colors.text2 },
  emptySub:          { fontSize: 12, color: colors.text3, marginTop: 4, textAlign: 'center' },
  errorBox:          { backgroundColor: 'rgba(248,113,113,0.1)', borderRadius: radius.md, padding: spacing.md, borderWidth: 1, borderColor: colors.danger + '33' },
  errorText:         { fontSize: 13, color: colors.danger, fontWeight: '600', textAlign: 'center' },
  // Redeem modal
  backdrop:          { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.5)' } as any,
  redeemSheet:       {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: colors.bg, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl,
    padding: spacing.lg, paddingBottom: spacing.xxl, gap: spacing.md,
  },
  handle:            { width: 36, height: 4, backgroundColor: colors.border, borderRadius: 2, alignSelf: 'center', marginBottom: spacing.sm },
  redeemTitle:       { fontSize: 18, fontWeight: '800', color: colors.text },
  redeemSub:         { fontSize: 13, color: colors.text3 },
  redeemLabel:       { fontSize: 12, fontWeight: '700', color: colors.text2 },
  pillRow:           { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  pill:              { paddingHorizontal: 14, paddingVertical: 8, borderRadius: radius.lg, backgroundColor: colors.surface2, borderWidth: 1, borderColor: colors.border },
  pillActive:        { backgroundColor: colors.accent, borderColor: colors.accent },
  pillText:          { fontSize: 13, fontWeight: '700', color: colors.text2 },
  pillTextActive:    { color: colors.white },
  redeemValue:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: 'rgba(74,222,128,0.08)', borderRadius: radius.md, padding: spacing.md, borderWidth: 1, borderColor: 'rgba(74,222,128,0.2)' },
  redeemValueLabel:  { fontSize: 13, fontWeight: '600', color: colors.success },
  redeemValueAmount: { fontSize: 16, fontWeight: '800', color: colors.success },
  redeemBtns:        { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },
  cancelBtn:         { flex: 1, paddingVertical: 13, borderRadius: radius.md, backgroundColor: colors.surface2, alignItems: 'center' },
  cancelText:        { fontSize: 14, fontWeight: '700', color: colors.text2 },
  confirmBtn:        { flex: 1, paddingVertical: 13, borderRadius: radius.md, backgroundColor: colors.accent, alignItems: 'center' },
  confirmText:       { fontSize: 14, fontWeight: '700', color: colors.white },
});
