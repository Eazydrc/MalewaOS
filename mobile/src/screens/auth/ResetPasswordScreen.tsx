import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path, Circle, Line, Polyline } from 'react-native-svg';
import { colors, spacing, radius } from '../../theme/colors';
import { useResetPassword } from '@elengi/shared';

const RULES = [
  { id: 'len',    label: '8 caractères min.', test: (p: string) => p.length >= 8 },
  { id: 'upper',  label: 'Une majuscule',     test: (p: string) => /[A-Z]/.test(p) },
  { id: 'symbol', label: 'Un symbole',        test: (p: string) => /[^A-Za-z0-9]/.test(p) },
];

function getStrength(pwd: string) {
  let score = 0;
  if (pwd.length >= 8)          score++;
  if (pwd.length >= 12)         score++;
  if (/[A-Z]/.test(pwd))        score++;
  if (/[0-9]/.test(pwd))        score++;
  if (/[^A-Za-z0-9]/.test(pwd)) score++;
  if (score <= 1) return { score: 1, color: '#DC2626' };
  if (score === 2) return { score: 2, color: '#D97706' };
  if (score === 3) return { score: 3, color: '#F59E0B' };
  if (score === 4) return { score: 4, color: '#16A34A' };
  return               { score: 5, color: '#15803D' };
}

function EyeIcon({ open }: { open: boolean }) {
  return open ? (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={colors.text3} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
      <Line x1={1} y1={1} x2={23} y2={23}/>
    </Svg>
  ) : (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={colors.text3} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
      <Circle cx={12} cy={12} r={3}/>
    </Svg>
  );
}

export default function ResetPasswordScreen({ navigation, route }: any) {
  const { email, code } = route.params as { email: string; code: string };
  const [pwd,      setPwd]      = useState('');
  const [confirm,  setConfirm]  = useState('');
  const [showPwd,  setShowPwd]  = useState(false);
  const [showConf, setShowConf] = useState(false);

  const reset    = useResetPassword({ onSuccess: () => {
    Alert.alert('Succès', 'Mot de passe réinitialisé. Vous pouvez vous connecter.', [
      { text: 'Se connecter', onPress: () => navigation.navigate('Login') },
    ]);
  }});

  const strength = getStrength(pwd);
  const match    = confirm.length > 0 && pwd === confirm;
  const mismatch = confirm.length > 0 && pwd !== confirm;
  const valid    = RULES.every(r => r.test(pwd)) && match;

  return (
    <SafeAreaView style={s.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={s.container} keyboardShouldPersistTaps="handled">

          <View style={s.header}>
            <Text style={s.title}>Nouveau mot de passe</Text>
            <Text style={s.desc}>Choisissez un mot de passe fort pour sécuriser votre compte.</Text>
          </View>

          <View style={s.card}>

            {reset.isError && (
              <View style={s.errorBox}>
                <Text style={s.errorText}>{(reset.error as any)?.message ?? 'Une erreur est survenue.'}</Text>
              </View>
            )}

            <View style={s.field}>
              <Text style={s.label}>Nouveau mot de passe</Text>
              <View>
                <TextInput
                  style={[s.input, s.inputPr]}
                  value={pwd} onChangeText={setPwd}
                  secureTextEntry={!showPwd}
                  placeholder="Nouveau mot de passe"
                  placeholderTextColor={colors.text3}
                />
                <TouchableOpacity style={s.eyeBtn} onPress={() => setShowPwd(v => !v)}>
                  <EyeIcon open={showPwd} />
                </TouchableOpacity>
              </View>

              {pwd.length > 0 && (
                <View style={{ marginTop: 8, gap: 6 }}>
                  <View style={s.bars}>
                    {[1, 2, 3, 4, 5].map(i => (
                      <View key={i} style={[s.bar, { backgroundColor: i <= strength.score ? strength.color : colors.surface3 }]} />
                    ))}
                  </View>
                  <View style={s.rulesGrid}>
                    {RULES.map(r => {
                      const ok = r.test(pwd);
                      return (
                        <View key={r.id} style={s.ruleRow}>
                          {ok ? (
                            <Svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
                              <Polyline points="20 6 9 17 4 12"/>
                            </Svg>
                          ) : (
                            <View style={s.ruleCircle} />
                          )}
                          <Text style={[s.ruleText, ok && { color: colors.success }]}>{r.label}</Text>
                        </View>
                      );
                    })}
                  </View>
                </View>
              )}
            </View>

            <View style={s.field}>
              <Text style={s.label}>Confirmer le mot de passe</Text>
              <View>
                <TextInput
                  style={[s.input, s.inputPr, match && s.inputSuccess, mismatch && s.inputDanger]}
                  value={confirm} onChangeText={setConfirm}
                  secureTextEntry={!showConf}
                  placeholder="Confirmez le mot de passe"
                  placeholderTextColor={colors.text3}
                />
                <TouchableOpacity style={s.eyeBtn} onPress={() => setShowConf(v => !v)}>
                  <EyeIcon open={showConf} />
                </TouchableOpacity>
              </View>
              {mismatch && <Text style={s.matchError}>✕ Les mots de passe ne correspondent pas</Text>}
              {match    && <Text style={s.matchOk}>✓ Parfait</Text>}
            </View>

            <TouchableOpacity
              style={[s.btn, !valid && s.btnDisabled]}
              onPress={() => reset.mutate({ email, code, newPassword: pwd })}
              disabled={!valid || reset.isPending}
              activeOpacity={0.85}
            >
              <Text style={s.btnText}>
                {reset.isPending ? 'Réinitialisation…' : 'Réinitialiser le mot de passe'}
              </Text>
            </TouchableOpacity>

            <View style={s.noteBox}>
              <Text style={s.noteText}>🔒 Toutes vos sessions actives seront déconnectées pour votre sécurité.</Text>
            </View>

          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:        { flex: 1, backgroundColor: colors.bg },
  container:   { flexGrow: 1, justifyContent: 'center', padding: spacing.lg },
  header:      { alignItems: 'center', marginBottom: spacing.lg },
  title:       { fontSize: 24, fontWeight: '800', color: colors.text, marginBottom: 8 },
  desc:        { fontSize: 13, color: colors.text3, textAlign: 'center', lineHeight: 20 },
  card:        { backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.lg, gap: spacing.md },
  errorBox:    {
    backgroundColor: 'rgba(248,113,113,0.1)', borderWidth: 1,
    borderColor: 'rgba(248,113,113,0.3)', borderRadius: radius.sm, padding: 10,
  },
  errorText:   { color: colors.danger, fontSize: 12, fontWeight: '600' },
  field:       { gap: 6 },
  label:       { fontSize: 13, color: colors.text2, fontWeight: '600' },
  input:       {
    backgroundColor: colors.surface2, borderRadius: radius.md,
    padding: spacing.md, color: colors.text, fontSize: 15,
    borderWidth: 1, borderColor: colors.border,
  },
  inputPr:     { paddingRight: 48 },
  inputSuccess: { borderColor: colors.success },
  inputDanger:  { borderColor: colors.danger },
  eyeBtn:      { position: 'absolute', right: 14, top: 0, bottom: 0, justifyContent: 'center' },
  bars:        { flexDirection: 'row', gap: 4 },
  bar:         { flex: 1, height: 4, borderRadius: 2 },
  rulesGrid:   { gap: 6 },
  ruleRow:     { flexDirection: 'row', alignItems: 'center', gap: 6 },
  ruleCircle:  { width: 12, height: 12, borderRadius: 6, borderWidth: 2, borderColor: colors.border },
  ruleText:    { fontSize: 12, color: colors.text3, fontWeight: '500' },
  matchOk:     { fontSize: 12, color: colors.success, fontWeight: '600', marginTop: 2 },
  matchError:  { fontSize: 12, color: colors.danger, fontWeight: '600', marginTop: 2 },
  btn:         {
    backgroundColor: colors.accent, borderRadius: radius.md,
    paddingVertical: 15, alignItems: 'center',
  },
  btnDisabled: { opacity: 0.5 },
  btnText:     { color: colors.white, fontWeight: '700', fontSize: 16 },
  noteBox:     {
    backgroundColor: colors.surface2, borderRadius: radius.md, padding: spacing.md,
    borderWidth: 1, borderColor: colors.border,
  },
  noteText:    { fontSize: 12, color: colors.text3, lineHeight: 18, textAlign: 'center' },
});
