import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, Linking, Alert, Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path, Circle, Line } from 'react-native-svg';
import { colors, spacing, radius } from '../../theme/colors';
import { useLogin } from '@elengi/shared';
import { useAuthStore } from '../../store/auth.store';
import { API_URL } from '../../config';

// Enlève /api/v1 pour obtenir la base
const BASE_URL = API_URL.replace('/api/v1', '');

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

export default function LoginScreen({ navigation }: any) {
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [showPwd,  setShowPwd]  = useState(false);
  const { fetchMe } = useAuthStore();

  // Entrance animation
  const headerAnim = useRef(new Animated.Value(0)).current;
  const cardAnim   = useRef(new Animated.Value(0)).current;
  const footerAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.stagger(80, [
      Animated.spring(headerAnim, { toValue: 1, tension: 70, friction: 10, useNativeDriver: true }),
      Animated.spring(cardAnim,   { toValue: 1, tension: 70, friction: 10, useNativeDriver: true }),
      Animated.spring(footerAnim, { toValue: 1, tension: 70, friction: 10, useNativeDriver: true }),
    ]).start();
  }, []);

  const login = useLogin({
    onSuccess: async () => { await fetchMe(); },
    onMfaRequired: (mfaToken: string) => {
      navigation.navigate('Mfa', { mfaToken });
    },
  });

  const handleLogin = () => {
    if (!email || !password) return Alert.alert('Erreur', 'Remplis tous les champs.');
    login.mutate({ email, password });
  };

  const handleGoogle = () => {
    Linking.openURL(`${BASE_URL}/auth/google`).catch(() =>
      Alert.alert('Erreur', 'Impossible d\'ouvrir Google.')
    );
  };

  return (
    <SafeAreaView style={s.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={s.container} keyboardShouldPersistTaps="handled">

          {/* Logo */}
          <Animated.View style={[s.header, {
            opacity: headerAnim,
            transform: [{ translateY: headerAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }],
          }]}>
            <Text style={s.logo}>Deli<Text style={{ color: colors.accent }}>pose</Text></Text>
            <Text style={s.sub}>Bon retour parmi nous</Text>
          </Animated.View>

          <Animated.View style={[s.card, {
            opacity: cardAnim,
            transform: [{ translateY: cardAnim.interpolate({ inputRange: [0, 1], outputRange: [24, 0] }) }],
          }]}>

            {/* Google */}
            <TouchableOpacity style={s.googleBtn} onPress={handleGoogle} activeOpacity={0.8}>
              <GoogleIcon />
              <Text style={s.googleText}>Continuer avec Google</Text>
            </TouchableOpacity>

            {/* Divider */}
            <View style={s.divider}>
              <View style={s.dividerLine} />
              <Text style={s.dividerText}>ou</Text>
              <View style={s.dividerLine} />
            </View>

            {/* Erreur API */}
            {login.isError && (
              <View style={s.errorBox}>
                <Text style={s.errorText}>{(login.error as any)?.message ?? 'Identifiants incorrects'}</Text>
              </View>
            )}

            {/* Email */}
            <View style={s.field}>
              <Text style={s.label}>Email</Text>
              <TextInput
                style={s.input}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                placeholder="jean@example.cd"
                placeholderTextColor={colors.text3}
              />
            </View>

            {/* Mot de passe */}
            <View style={s.field}>
              <View style={s.labelRow}>
                <Text style={s.label}>Mot de passe</Text>
                <TouchableOpacity onPress={() => navigation.navigate('ForgotPassword')}>
                  <Text style={s.forgotLink}>Mot de passe oublié ?</Text>
                </TouchableOpacity>
              </View>
              <View style={s.inputWrap}>
                <TextInput
                  style={[s.input, s.inputPr]}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPwd}
                  placeholder="Votre mot de passe"
                  placeholderTextColor={colors.text3}
                />
                <TouchableOpacity style={s.eyeBtn} onPress={() => setShowPwd(v => !v)}>
                  <EyeIcon open={showPwd} />
                </TouchableOpacity>
              </View>
            </View>

            {/* CTA */}
            <TouchableOpacity
              style={[s.btn, (!email || !password || login.isPending) && s.btnDisabled]}
              onPress={handleLogin}
              disabled={!email || !password || login.isPending}
              activeOpacity={0.85}
            >
              <Text style={s.btnText}>
                {login.isPending ? 'Connexion…' : 'Se connecter'}
              </Text>
            </TouchableOpacity>
          </Animated.View>

          {/* Footer */}
          <Animated.View style={{
            opacity: footerAnim,
            transform: [{ translateY: footerAnim.interpolate({ inputRange: [0, 1], outputRange: [16, 0] }) }],
          }}>
            <TouchableOpacity style={s.footer} onPress={() => navigation.navigate('Register')}>
              <Text style={s.footerText}>
                Pas encore de compte ?{'  '}
                <Text style={s.footerLink}>S'inscrire gratuitement</Text>
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={s.footer} onPress={() => navigation.navigate('RegisterDriver')}>
              <Text style={s.footerText}>
                Vous êtes livreur ?{'  '}
                <Text style={[s.footerLink, { color: colors.text2 }]}>🛵 Espace livreur</Text>
              </Text>
            </TouchableOpacity>
          </Animated.View>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:        { flex: 1, backgroundColor: colors.bg },
  container:   { flexGrow: 1, justifyContent: 'center', padding: spacing.lg },
  header:      { alignItems: 'center', marginBottom: spacing.lg },
  logo:        { fontSize: 36, fontWeight: '900', color: colors.text, letterSpacing: -1 },
  sub:         { fontSize: 13, color: colors.text3, marginTop: 6, fontWeight: '500' },
  card:        { backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.lg, gap: spacing.md },
  googleBtn:   {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 10, height: 48, backgroundColor: colors.bg,
    borderWidth: 1, borderColor: colors.border, borderRadius: radius.md,
  },
  googleText:  { color: colors.text, fontSize: 14, fontWeight: '600' },
  divider:     { flexDirection: 'row', alignItems: 'center', gap: 10 },
  dividerLine: { flex: 1, height: 1, backgroundColor: colors.border },
  dividerText: { fontSize: 11, color: colors.text3, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 },
  errorBox:    {
    backgroundColor: 'rgba(248,113,113,0.1)', borderWidth: 1,
    borderColor: 'rgba(248,113,113,0.3)', borderRadius: radius.sm, padding: 10,
  },
  errorText:   { color: colors.danger, fontSize: 12, fontWeight: '600' },
  field:       { gap: 6 },
  labelRow:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  label:       { fontSize: 13, color: colors.text2, fontWeight: '600' },
  forgotLink:  { fontSize: 11, color: colors.accent, fontWeight: '700' },
  input:       {
    backgroundColor: colors.surface2, borderRadius: radius.md,
    padding: spacing.md, color: colors.text, fontSize: 15,
    borderWidth: 1, borderColor: colors.border,
  },
  inputWrap:   { position: 'relative' },
  inputPr:     { paddingRight: 48 },
  eyeBtn:      { position: 'absolute', right: 14, top: 0, bottom: 0, justifyContent: 'center' },
  btn:         {
    backgroundColor: colors.accent, borderRadius: radius.md,
    paddingVertical: 15, alignItems: 'center', marginTop: 4,
  },
  btnDisabled: { opacity: 0.5 },
  btnText:     { color: colors.white, fontWeight: '700', fontSize: 16 },
  footer:      { marginTop: spacing.sm, alignItems: 'center' },
  footerText:  { color: colors.text3, fontSize: 14, fontWeight: '500' },
  footerLink:  { color: colors.accent, fontWeight: '700' },
});
