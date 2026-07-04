import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform, Alert, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, radius } from '../../theme/colors';
import { useRegister } from '@elengi/shared';

export default function RegisterScreen({ navigation }: any) {
  const [firstName, setFirstName] = useState('');
  const [lastName,  setLastName]  = useState('');
  const [email,     setEmail]     = useState('');
  const [phone,     setPhone]     = useState('');
  const [password,  setPassword]  = useState('');

  const register = useRegister({
    onSuccess: (email) => {
      Alert.alert('Compte créé !', `Un code de vérification a été envoyé à ${email}.`);
      navigation.navigate('Login');
    },
  });

  const handleRegister = () => {
    if (!firstName || !lastName || !email || !password)
      return Alert.alert('Erreur', 'Remplis tous les champs obligatoires.');
    register.mutate({ firstName, lastName, email, phone, password });
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <Text style={styles.logo}>Elengi</Text>
          <Text style={styles.subtitle}>Créer un compte</Text>

          <View style={styles.card}>
            {[
              { label: 'Prénom *', value: firstName, set: setFirstName, placeholder: 'Jean' },
              { label: 'Nom *',    value: lastName,  set: setLastName,  placeholder: 'Dupont' },
              { label: 'Email *',  value: email,     set: setEmail,     placeholder: 'jean@email.com', type: 'email-address' as any },
              { label: 'Téléphone', value: phone,    set: setPhone,     placeholder: '+243 XX XXX XXXX', type: 'phone-pad' as any },
            ].map(({ label, value, set, placeholder, type }) => (
              <View key={label}>
                <Text style={styles.label}>{label}</Text>
                <TextInput
                  style={styles.input}
                  value={value}
                  onChangeText={set}
                  placeholder={placeholder}
                  placeholderTextColor={colors.text3}
                  keyboardType={type ?? 'default'}
                  autoCapitalize={type === 'email-address' ? 'none' : 'words'}
                />
              </View>
            ))}

            <Text style={styles.label}>Mot de passe *</Text>
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              placeholder="Min. 8 caractères"
              placeholderTextColor={colors.text3}
            />

            {register.error && (
              <Text style={styles.error}>{(register.error as Error).message}</Text>
            )}

            <TouchableOpacity
              style={[styles.btn, register.isPending && styles.btnDisabled]}
              onPress={handleRegister}
              disabled={register.isPending}
            >
              <Text style={styles.btnText}>
                {register.isPending ? 'Création…' : "Créer mon compte"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => navigation.navigate('Login')} style={styles.link}>
              <Text style={styles.linkText}>Déjà un compte ? <Text style={{ color: colors.accent }}>Se connecter</Text></Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:      { flex: 1, backgroundColor: colors.bg },
  container: { flexGrow: 1, justifyContent: 'center', padding: spacing.lg },
  logo:      { fontSize: 40, fontWeight: '800', color: colors.accent, textAlign: 'center', marginBottom: 8 },
  subtitle:  { fontSize: 16, color: colors.text3, textAlign: 'center', marginBottom: spacing.xl },
  card:      { backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.lg },
  label:     { fontSize: 13, color: colors.text2, marginBottom: 6, marginTop: spacing.sm },
  input:     {
    backgroundColor: colors.surface2, borderRadius: radius.md,
    padding: spacing.md, color: colors.text, fontSize: 15,
    borderWidth: 1, borderColor: colors.border,
  },
  error:     { color: colors.danger, fontSize: 13, marginTop: spacing.sm },
  btn:       {
    backgroundColor: colors.accent, borderRadius: radius.md,
    padding: spacing.md, alignItems: 'center', marginTop: spacing.lg,
  },
  btnDisabled: { opacity: 0.6 },
  btnText:   { color: colors.white, fontWeight: '700', fontSize: 16 },
  link:      { marginTop: spacing.md, alignItems: 'center' },
  linkText:  { color: colors.text2, fontSize: 14 },
});
