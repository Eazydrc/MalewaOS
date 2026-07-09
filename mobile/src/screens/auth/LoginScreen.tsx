import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform, Alert, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, radius } from '../../theme/colors';
import { useLogin } from '@elengi/shared';
import { useAuthStore } from '../../store/auth.store';

export default function LoginScreen({ navigation }: any) {
  const [email, setEmail]       = useState(__DEV__ ? 'maman@test.cd' : '');
  const [password, setPassword] = useState(__DEV__ ? 'Test1234!' : '');
  const { fetchMe }             = useAuthStore();

  const login = useLogin({
    onSuccess: async () => { await fetchMe(); },
    onMfaRequired: () => Alert.alert('MFA requis', 'Vérification en 2 étapes désactivée pour les tests.'),
  });

  const handleLogin = () => {
    if (!email || !password) return Alert.alert('Erreur', 'Remplis tous les champs.');
    login.mutate({ email, password });
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <Text style={styles.logo}>Elengi</Text>
          <Text style={styles.subtitle}>Connexion à votre compte</Text>

          <View style={styles.card}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              placeholder="votre@email.com"
              placeholderTextColor={colors.text3}
            />

            <Text style={styles.label}>Mot de passe</Text>
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              placeholder="••••••••"
              placeholderTextColor={colors.text3}
            />

            {login.error && (
              <Text style={styles.error}>{(login.error as Error).message}</Text>
            )}

            <TouchableOpacity
              style={[styles.btn, login.isPending && styles.btnDisabled]}
              onPress={handleLogin}
              disabled={login.isPending}
            >
              <Text style={styles.btnText}>
                {login.isPending ? 'Connexion…' : 'Se connecter'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => navigation.navigate('Register')} style={styles.link}>
              <Text style={styles.linkText}>Pas encore de compte ? <Text style={{ color: colors.accent }}>S'inscrire</Text></Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:     { flex: 1, backgroundColor: colors.bg },
  container:{ flexGrow: 1, justifyContent: 'center', padding: spacing.lg },
  logo:     { fontSize: 40, fontWeight: '800', color: colors.accent, textAlign: 'center', marginBottom: 8 },
  subtitle: { fontSize: 16, color: colors.text3, textAlign: 'center', marginBottom: spacing.xl },
  card:     { backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.lg },
  label:    { fontSize: 13, color: colors.text2, marginBottom: 6, marginTop: spacing.sm },
  input:    {
    backgroundColor: colors.surface2, borderRadius: radius.md,
    padding: spacing.md, color: colors.text, fontSize: 15,
    borderWidth: 1, borderColor: colors.border,
  },
  error:    { color: colors.danger, fontSize: 13, marginTop: spacing.sm },
  btn:      {
    backgroundColor: colors.accent, borderRadius: radius.md,
    padding: spacing.md, alignItems: 'center', marginTop: spacing.lg,
  },
  btnDisabled: { opacity: 0.6 },
  btnText:  { color: colors.white, fontWeight: '700', fontSize: 16 },
  link:     { marginTop: spacing.md, alignItems: 'center' },
  linkText: { color: colors.text2, fontSize: 14 },
});
