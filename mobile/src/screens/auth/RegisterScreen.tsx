import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, Linking, Alert, Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path, Circle, Line, Polyline } from 'react-native-svg';
import { colors, spacing, radius } from '../../theme/colors';
import { useRegister } from '@elengi/shared';
import { API_URL } from '../../config';

const BASE_URL = API_URL.replace('/api/v1', '');

function getStrength(pwd: string): { score: number; label: string; color: string } {
  if (!pwd) return { score: 0, label: '', color: '' };
  let score = 0;
  if (pwd.length >= 8)          score++;
  if (pwd.length >= 12)         score++;
  if (/[A-Z]/.test(pwd))        score++;
  if (/[0-9]/.test(pwd))        score++;
  if (/[^A-Za-z0-9]/.test(pwd)) score++;
  if (score <= 1) return { score: 1, label: 'Très faible', color: '#DC2626' };
  if (score === 2) return { score: 2, label: 'Faible',     color: '#D97706' };
  if (score === 3) return { score: 3, label: 'Moyen',      color: '#F59E0B' };
  if (score === 4) return { score: 4, label: 'Fort',       color: '#16A34A' };
  return               { score: 5, label: 'Très fort', color: '#15803D' };
}

const RULES = [
  { id: 'len',    label: '8 caractères min.', test: (p: string) => p.length >= 8 },
  { id: 'upper',  label: 'Une majuscule',     test: (p: string) => /[A-Z]/.test(p) },
  { id: 'num',    label: 'Un chiffre',        test: (p: string) => /[0-9]/.test(p) },
  { id: 'symbol', label: 'Un symbole',        test: (p: string) => /[^A-Za-z0-9]/.test(p) },
];

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

function GoogleIcon() {
  return (
    <Svg width={20} height={20} viewBox="0 0 18 18" fill="none">
      <Path d="M17.64 9.205c0-.639-.057-1.252-.164-1.841H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615Z" fill="#4285F4"/>
      <Path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z" fill="#34A853"/>
      <Path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332Z" fill="#FBBC05"/>
      <Path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58Z" fill="#EA4335"/>
    </Svg>
  );
}

export default function RegisterScreen({ navigation }: any) {
  const [firstName,   setFirstName]   = useState('');
  const [lastName,    setLastName]    = useState('');
  const [email,       setEmail]       = useState('');
  const [phone,       setPhone]       = useState('');
  const [password,    setPassword]    = useState('');
  const [confirm,     setConfirm]     = useState('');
  const [showPwd,     setShowPwd]     = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const headerAnim = useRef(new Animated.Value(0)).current;
  const cardAnim   = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.stagger(100, [
      Animated.spring(headerAnim, { toValue: 1, tension: 70, friction: 10, useNativeDriver: true }),
      Animated.spring(cardAnim,   { toValue: 1, tension: 70, friction: 10, useNativeDriver: true }),
    ]).start();
  }, []);

  const register   = useRegister({ onSuccess: (email) => navigation.navigate('VerifyEmail', { email }) });
  const strength   = getStrength(password);
  const match      = confirm.length > 0 && password === confirm;
  const mismatch   = confirm.length > 0 && password !== confirm;
  const allRulesOk = RULES.every(r => r.test(password));
  const canSubmit  = allRulesOk && match && !!firstName && !!lastName && !!email;

  const handleSubmit = () => {
    if (!canSubmit) return;
    register.mutate({ firstName, lastName, email, phone: phone || undefined, password });
  };

  const handleGoogle = () => {
    Linking.openURL(`${BASE_URL}/auth/google`).catch(() =>
      Alert.alert('Erreur', "Impossible d'ouvrir Google.")
    );
  };

  return (
    <SafeAreaView style={s.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={s.container} keyboardShouldPersistTaps="handled">

          <Animated.View style={[s.header, {
            opacity: headerAnim,
            transform: [{ translateY: headerAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }],
          }]}>
            <Text style={s.logo}>Deli<Text style={{ color: colors.accent }}>pose</Text></Text>
            <Text style={s.sub}>Créer votre compte</Text>
            <View style={s.pill}>
              <Text style={s.pillText}>🎁 +100 points offerts à l'inscription</Text>
            </View>
          </Animated.View>

          <Animated.View style={[s.card, {
            opacity: cardAnim,
            transform: [{ translateY: cardAnim.interpolate({ inputRange: [0, 1], outputRange: [24, 0] }) }],
          }]}>

            <TouchableOpacity style={s.googleBtn} onPress={handleGoogle} activeOpacity={0.8}>
              <GoogleIcon />
              <Text style={s.googleText}>Continuer avec Google</Text>
            </TouchableOpacity>

            <View style={s.divider}>
              <View style={s.dividerLine} />
              <Text style={s.dividerText}>ou avec votre email</Text>
              <View style={s.dividerLine} />
            </View>

            {register.isError && (
              <View style={s.errorBox}>
                <Text style={s.errorText}>{(register.error as any)?.message ?? 'Une erreur est survenue.'}</Text>
              </View>
            )}

            <View style={s.row}>
              <View style={[s.field, { flex: 1 }]}>
                <Text style={s.label}>Prénom</Text>
                <TextInput style={s.input} value={firstName} onChangeText={setFirstName}
                  placeholder="Jean-Pierre" placeholderTextColor={colors.text3} autoCapitalize="words" />
              </View>
              <View style={[s.field, { flex: 1 }]}>
                <Text style={s.label}>Nom</Text>
                <TextInput style={s.input} value={lastName} onChangeText={setLastName}
                  placeholder="Mukendi" placeholderTextColor={colors.text3} autoCapitalize="words" />
              </View>
            </View>

            <View style={s.field}>
              <Text style={s.label}>Email</Text>
              <TextInput style={s.input} value={email} onChangeText={setEmail}
                keyboardType="email-address" autoCapitalize="none"
                placeholder="jean@example.cd" placeholderTextColor={colors.text3} />
            </View>

            <View style={s.field}>
              <View style={s.labelRow}>
                <Text style={s.label}>Téléphone <Text style={s.optional}>(optionnel)</Text></Text>
                <Text style={s.hint}>Orange · Airtel</Text>
              </View>
              <TextInput style={s.input} value={phone} onChangeText={setPhone}
                keyboardType="phone-pad" placeholder="+243 8XX XXX XXX"
                placeholderTextColor={colors.text3} />
            </View>

            <View style={s.field}>
              <Text style={s.label}>Mot de passe</Text>
              <View>
                <TextInput style={[s.input, s.inputPr]} value={password} onChangeText={setPassword}
                  secureTextEntry={!showPwd} placeholder="Créez un mot de passe fort"
                  placeholderTextColor={colors.text3} />
                <TouchableOpacity style={s.eyeBtn} onPress={() => setShowPwd(v => !v)}>
                  <EyeIcon open={showPwd} />
                </TouchableOpacity>
              </View>

              {password.length > 0 && (
                <View style={{ marginTop: 8, gap: 6 }}>
                  <View style={s.strengthBars}>
                    {[1, 2, 3, 4, 5].map(i => (
                      <View key={i} style={[s.strengthBar, {
                        backgroundColor: i <= strength.score ? strength.color : colors.surface3,
                      }]} />
                    ))}
                  </View>
                  <View style={s.labelRow}>
                    <Text style={[s.strengthLabel, { color: strength.color }]}>{strength.label}</Text>
                    <Text style={s.hint}>{strength.score}/5</Text>
                  </View>
                  <View style={s.rulesGrid}>
                    {RULES.map(rule => {
                      const ok = rule.test(password);
                      return (
                        <View key={rule.id} style={s.ruleRow}>
                          {ok ? (
                            <Svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
                              <Polyline points="20 6 9 17 4 12"/>
                            </Svg>
                          ) : (
                            <View style={s.ruleCircle} />
                          )}
                          <Text style={[s.ruleText, ok && { color: colors.success }]}>{rule.label}</Text>
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
                  secureTextEntry={!showConfirm}
                  placeholder="Répétez votre mot de passe"
                  placeholderTextColor={colors.text3}
                />
                <TouchableOpacity style={s.eyeBtn} onPress={() => setShowConfirm(v => !v)}>
                  <EyeIcon open={showConfirm} />
                </TouchableOpacity>
              </View>
              {mismatch && <Text style={s.matchError}>✕ Les mots de passe ne correspondent pas</Text>}
              {match    && <Text style={s.matchOk}>✓ Parfait, les mots de passe correspondent</Text>}
            </View>

            <TouchableOpacity
              style={[s.btn, !canSubmit && s.btnSecondary]}
              onPress={handleSubmit}
              disabled={!canSubmit || register.isPending}
              activeOpacity={0.85}
            >
              <Text style={[s.btnText, !canSubmit && s.btnTextSecondary]}>
                {register.isPending
                  ? 'Création en cours…'
                  : canSubmit
                    ? 'Créer mon compte — +100 pts 🎁'
                    : 'Complétez tous les champs'}
              </Text>
            </TouchableOpacity>

            <Text style={s.cgu}>
              En créant un compte, vous acceptez nos{' '}
              <Text style={s.cguLink}>Conditions d'utilisation</Text>
              {' '}et notre{' '}
              <Text style={s.cguLink}>Politique de confidentialité</Text>.
            </Text>
          </Animated.View>

          <TouchableOpacity style={s.footer} onPress={() => navigation.navigate('Login')}>
            <Text style={s.footerText}>
              Déjà un compte ?{'  '}
              <Text style={s.footerLink}>Se connecter</Text>
            </Text>
          </TouchableOpacity>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:             { flex: 1, backgroundColor: colors.bg },
  container:        { flexGrow: 1, justifyContent: 'center', padding: spacing.lg },
  header:           { alignItems: 'center', marginBottom: spacing.lg },
  logo:             { fontSize: 36, fontWeight: '900', color: colors.text, letterSpacing: -1 },
  sub:              { fontSize: 13, color: colors.text3, marginTop: 6, fontWeight: '500' },
  pill:             {
    marginTop: 10, backgroundColor: 'rgba(232,93,38,0.12)',
    borderRadius: radius.full, paddingHorizontal: 16, paddingVertical: 6,
    borderWidth: 1, borderColor: 'rgba(232,93,38,0.2)',
  },
  pillText:         { color: colors.accent, fontSize: 12, fontWeight: '700' },
  card:             { backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.lg, gap: spacing.md },
  googleBtn:        {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 10, height: 48, backgroundColor: colors.bg,
    borderWidth: 1, borderColor: colors.border, borderRadius: radius.md,
  },
  googleText:       { color: colors.text, fontSize: 14, fontWeight: '600' },
  divider:          { flexDirection: 'row', alignItems: 'center', gap: 10 },
  dividerLine:      { flex: 1, height: 1, backgroundColor: colors.border },
  dividerText:      { fontSize: 11, color: colors.text3, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  errorBox:         {
    backgroundColor: 'rgba(248,113,113,0.1)', borderWidth: 1,
    borderColor: 'rgba(248,113,113,0.3)', borderRadius: radius.sm, padding: 10,
  },
  errorText:        { color: colors.danger, fontSize: 12, fontWeight: '600' },
  row:              { flexDirection: 'row', gap: spacing.sm },
  field:            { gap: 6 },
  labelRow:         { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  label:            { fontSize: 13, color: colors.text2, fontWeight: '600' },
  optional:         { color: colors.text3, fontWeight: '400' },
  hint:             { fontSize: 11, color: colors.text3, fontWeight: '500' },
  input:            {
    backgroundColor: colors.surface2, borderRadius: radius.md,
    padding: spacing.md, color: colors.text, fontSize: 14,
    borderWidth: 1, borderColor: colors.border,
  },
  inputPr:          { paddingRight: 48 },
  inputSuccess:     { borderColor: colors.success },
  inputDanger:      { borderColor: colors.danger },
  eyeBtn:           { position: 'absolute', right: 14, top: 0, bottom: 0, justifyContent: 'center' },
  strengthBars:     { flexDirection: 'row', gap: 4 },
  strengthBar:      { flex: 1, height: 4, borderRadius: 2 },
  strengthLabel:    { fontSize: 12, fontWeight: '700' },
  rulesGrid:        { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  ruleRow:          { flexDirection: 'row', alignItems: 'center', gap: 6, width: '48%' },
  ruleCircle:       { width: 12, height: 12, borderRadius: 6, borderWidth: 2, borderColor: colors.border },
  ruleText:         { fontSize: 11, color: colors.text3, fontWeight: '500', flex: 1 },
  matchOk:          { fontSize: 12, color: colors.success, fontWeight: '600', marginTop: 4 },
  matchError:       { fontSize: 12, color: colors.danger, fontWeight: '600', marginTop: 4 },
  btn:              {
    backgroundColor: colors.accent, borderRadius: radius.md,
    paddingVertical: 15, alignItems: 'center', marginTop: 4,
  },
  btnSecondary:     { backgroundColor: colors.surface2 },
  btnText:          { color: colors.white, fontWeight: '700', fontSize: 15 },
  btnTextSecondary: { color: colors.text3 },
  cgu:              { fontSize: 11, color: colors.text3, textAlign: 'center', lineHeight: 16 },
  cguLink:          { color: colors.text2, textDecorationLine: 'underline', fontWeight: '500' },
  footer:           { marginTop: spacing.md, alignItems: 'center' },
  footerText:       { color: colors.text3, fontSize: 14, fontWeight: '500' },
  footerLink:       { color: colors.accent, fontWeight: '700' },
});
