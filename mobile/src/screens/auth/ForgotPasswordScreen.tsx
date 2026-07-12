import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path, Rect, Circle } from 'react-native-svg';
import { colors, spacing, radius } from '../../theme/colors';
import { useForgotPassword } from '@elengi/shared';

function LockIcon() {
  return (
    <Svg width={40} height={40} viewBox="0 0 24 24" fill="none" stroke={colors.accent} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <Rect x={3} y={11} width={18} height={11} rx={2} ry={2}/>
      <Path d="M7 11V7a5 5 0 0 1 10 0v4"/>
    </Svg>
  );
}

export default function ForgotPasswordScreen({ navigation }: any) {
  const [email, setEmail]   = useState('');
  const [sent,  setSent]    = useState(false);
  const forgot = useForgotPassword();

  const handleSend = () => {
    if (!email) return;
    forgot.mutate(email, {
      onSuccess: () => {
        setSent(true);
        navigation.navigate('VerifyOtp', { email, mode: 'reset' });
      },
    });
  };

  return (
    <SafeAreaView style={s.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={s.container} keyboardShouldPersistTaps="handled">

          <View style={s.iconWrap}>
            <View style={s.iconBg}>
              <LockIcon />
            </View>
          </View>

          <Text style={s.title}>Mot de passe oublié ?</Text>
          <Text style={s.desc}>
            Entrez votre adresse email. Nous vous enverrons un code à 6 chiffres pour réinitialiser votre mot de passe.
          </Text>

          <View style={s.card}>
            {forgot.isError && (
              <View style={s.errorBox}>
                <Text style={s.errorText}>{(forgot.error as any)?.message ?? 'Une erreur est survenue.'}</Text>
              </View>
            )}

            <View style={s.field}>
              <Text style={s.label}>Adresse email</Text>
              <TextInput
                style={s.input}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                placeholder="jean@example.cd"
                placeholderTextColor={colors.text3}
                autoFocus
              />
            </View>

            <TouchableOpacity
              style={[s.btn, (!email || forgot.isPending) && s.btnDisabled]}
              onPress={handleSend}
              disabled={!email || forgot.isPending}
              activeOpacity={0.85}
            >
              <Text style={s.btnText}>
                {forgot.isPending ? 'Envoi en cours…' : 'Envoyer le code'}
              </Text>
            </TouchableOpacity>

            <View style={s.infoBox}>
              <Text style={s.infoTitle}>Informations de sécurité</Text>
              <Text style={s.infoText}>• Le code expire dans 10 minutes</Text>
              <Text style={s.infoText}>• Maximum 3 tentatives autorisées</Text>
              <Text style={s.infoText}>• Vérifiez vos spams si vous ne recevez rien</Text>
            </View>
          </View>

          <TouchableOpacity style={s.back} onPress={() => navigation.goBack()}>
            <Text style={s.backText}>← Retour à la connexion</Text>
          </TouchableOpacity>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:      { flex: 1, backgroundColor: colors.bg },
  container: { flexGrow: 1, justifyContent: 'center', padding: spacing.lg },
  iconWrap:  { alignItems: 'center', marginBottom: spacing.lg },
  iconBg:    {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: 'rgba(232,93,38,0.1)',
    borderWidth: 1, borderColor: 'rgba(232,93,38,0.2)',
    alignItems: 'center', justifyContent: 'center',
  },
  title:     { fontSize: 24, fontWeight: '800', color: colors.text, textAlign: 'center', marginBottom: 10 },
  desc:      { fontSize: 14, color: colors.text3, textAlign: 'center', lineHeight: 22, marginBottom: spacing.lg },
  card:      { backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.lg, gap: spacing.md },
  errorBox:  {
    backgroundColor: 'rgba(248,113,113,0.1)', borderWidth: 1,
    borderColor: 'rgba(248,113,113,0.3)', borderRadius: radius.sm, padding: 10,
  },
  errorText: { color: colors.danger, fontSize: 12, fontWeight: '600' },
  field:     { gap: 6 },
  label:     { fontSize: 13, color: colors.text2, fontWeight: '600' },
  input:     {
    backgroundColor: colors.surface2, borderRadius: radius.md,
    padding: spacing.md, color: colors.text, fontSize: 15,
    borderWidth: 1, borderColor: colors.border,
  },
  btn:       {
    backgroundColor: colors.accent, borderRadius: radius.md,
    paddingVertical: 15, alignItems: 'center',
  },
  btnDisabled: { opacity: 0.5 },
  btnText:   { color: colors.white, fontWeight: '700', fontSize: 16 },
  infoBox:   {
    backgroundColor: colors.surface2, borderRadius: radius.md, padding: spacing.md,
    borderWidth: 1, borderColor: colors.border, gap: 6,
  },
  infoTitle: { fontSize: 12, color: colors.text2, fontWeight: '700', marginBottom: 2 },
  infoText:  { fontSize: 12, color: colors.text3, lineHeight: 18 },
  back:      { marginTop: spacing.lg, alignItems: 'center' },
  backText:  { color: colors.accent, fontSize: 14, fontWeight: '600' },
});
