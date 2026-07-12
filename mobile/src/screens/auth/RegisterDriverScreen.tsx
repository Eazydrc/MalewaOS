import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path, Circle, Line } from 'react-native-svg';
import { colors, spacing, radius } from '../../theme/colors';
import { api } from '@elengi/shared';

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

export default function RegisterDriverScreen({ navigation }: any) {
  const [firstName, setFirstName] = useState('');
  const [lastName,  setLastName]  = useState('');
  const [email,     setEmail]     = useState('');
  const [phone,     setPhone]     = useState('');
  const [password,  setPassword]  = useState('');
  const [showPwd,   setShowPwd]   = useState(false);
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState('');

  const valid = !!firstName && !!lastName && !!email && !!phone && password.length >= 8;

  const handleSubmit = async () => {
    if (!valid) return;
    setLoading(true);
    setError('');
    try {
      const res = await api.post<{ email: string }>('/auth/register-driver', {
        firstName, lastName, email, phone, password,
      });
      navigation.navigate('VerifyEmail', { email: res.email });
    } catch (err: any) {
      setError(err?.message ?? 'Une erreur est survenue.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={s.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={s.container} keyboardShouldPersistTaps="handled">

          <View style={s.header}>
            <Text style={s.emoji}>🛵</Text>
            <Text style={s.logo}>Espace Livreur</Text>
            <Text style={s.sub}>Rejoignez le réseau de livraison Elengi</Text>
          </View>

          <View style={s.card}>

            {!!error && (
              <View style={s.errorBox}>
                <Text style={s.errorText}>{error}</Text>
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
                <Text style={s.label}>Téléphone</Text>
                <Text style={s.hint}>Orange · Airtel</Text>
              </View>
              <TextInput style={s.input} value={phone} onChangeText={setPhone}
                keyboardType="phone-pad" placeholder="+243 8XX XXX XXX"
                placeholderTextColor={colors.text3} />
            </View>

            <View style={s.field}>
              <Text style={s.label}>Mot de passe</Text>
              <View>
                <TextInput
                  style={[s.input, s.inputPr]}
                  value={password} onChangeText={setPassword}
                  secureTextEntry={!showPwd}
                  placeholder="8 caractères minimum"
                  placeholderTextColor={colors.text3}
                />
                <TouchableOpacity style={s.eyeBtn} onPress={() => setShowPwd(v => !v)}>
                  <EyeIcon open={showPwd} />
                </TouchableOpacity>
              </View>
            </View>

            <View style={s.infoBox}>
              <Text style={s.infoTitle}>Conditions pour devenir livreur</Text>
              <Text style={s.infoText}>• Avoir un vélo, moto ou voiture</Text>
              <Text style={s.infoText}>• Habiter à Kinshasa</Text>
              <Text style={s.infoText}>• Avoir un téléphone Android ou iPhone</Text>
              <Text style={s.infoText}>• Votre compte sera validé sous 24h</Text>
            </View>

            <TouchableOpacity
              style={[s.btn, !valid && s.btnDisabled]}
              onPress={handleSubmit}
              disabled={!valid || loading}
              activeOpacity={0.85}
            >
              <Text style={s.btnText}>
                {loading ? 'Inscription en cours…' : "S'inscrire comme livreur 🛵"}
              </Text>
            </TouchableOpacity>
          </View>

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
  safe:      { flex: 1, backgroundColor: colors.bg },
  container: { flexGrow: 1, justifyContent: 'center', padding: spacing.lg },
  header:    { alignItems: 'center', marginBottom: spacing.lg },
  emoji:     { fontSize: 40, marginBottom: 8 },
  logo:      { fontSize: 26, fontWeight: '800', color: colors.text, letterSpacing: -0.5 },
  sub:       { fontSize: 13, color: colors.text3, marginTop: 6, fontWeight: '500', textAlign: 'center' },
  card:      { backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.lg, gap: spacing.md },
  errorBox:  {
    backgroundColor: 'rgba(248,113,113,0.1)', borderWidth: 1,
    borderColor: 'rgba(248,113,113,0.3)', borderRadius: radius.sm, padding: 10,
  },
  errorText: { color: colors.danger, fontSize: 12, fontWeight: '600' },
  row:       { flexDirection: 'row', gap: spacing.sm },
  field:     { gap: 6 },
  labelRow:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  label:     { fontSize: 13, color: colors.text2, fontWeight: '600' },
  hint:      { fontSize: 11, color: colors.text3, fontWeight: '500' },
  input:     {
    backgroundColor: colors.surface2, borderRadius: radius.md,
    padding: spacing.md, color: colors.text, fontSize: 14,
    borderWidth: 1, borderColor: colors.border,
  },
  inputPr:   { paddingRight: 48 },
  eyeBtn:    { position: 'absolute', right: 14, top: 0, bottom: 0, justifyContent: 'center' },
  infoBox:   {
    backgroundColor: colors.surface2, borderRadius: radius.md, padding: spacing.md,
    borderWidth: 1, borderColor: colors.border, gap: 4,
  },
  infoTitle: { fontSize: 12, color: colors.text2, fontWeight: '700', marginBottom: 2 },
  infoText:  { fontSize: 12, color: colors.text3, lineHeight: 18 },
  btn:       {
    backgroundColor: colors.accent, borderRadius: radius.md,
    paddingVertical: 15, alignItems: 'center',
  },
  btnDisabled: { opacity: 0.5 },
  btnText:   { color: colors.white, fontWeight: '700', fontSize: 16 },
  footer:    { marginTop: spacing.md, alignItems: 'center' },
  footerText: { color: colors.text3, fontSize: 14, fontWeight: '500' },
  footerLink: { color: colors.accent, fontWeight: '700' },
});
