import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, radius } from '../../theme/colors';
import { api, storeTokens } from '@elengi/shared';
import { useAuthStore } from '../../store/auth.store';

const CODE_LEN = 6;

export default function MfaScreen({ navigation, route }: any) {
  const { mfaToken } = route.params as { mfaToken: string };
  const { fetchMe } = useAuthStore();
  const [code,    setCode]    = useState<string[]>(Array(CODE_LEN).fill(''));
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');
  const [seconds, setSeconds] = useState(300); // 5 min
  const inputs = useRef<(TextInput | null)[]>([]);

  useEffect(() => {
    if (seconds <= 0) return;
    const t = setInterval(() => setSeconds(s => s - 1), 1000);
    return () => clearInterval(t);
  }, [seconds]);

  const display = `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;

  const handleChange = (val: string, i: number) => {
    const digit = val.replace(/[^0-9]/g, '').slice(-1);
    const next  = [...code];
    next[i]     = digit;
    setCode(next);
    if (digit && i < CODE_LEN - 1) inputs.current[i + 1]?.focus();
    if (digit && i === CODE_LEN - 1) {
      const full = [...next].join('');
      if (full.length === CODE_LEN) handleVerify(full);
    }
  };

  const handleKeyDown = (e: any, i: number) => {
    if (e.nativeEvent.key === 'Backspace' && !code[i] && i > 0) {
      inputs.current[i - 1]?.focus();
    }
  };

  const handleVerify = async (otp?: string) => {
    const c = otp ?? code.join('');
    if (c.length < CODE_LEN) return;
    setLoading(true);
    setError('');
    try {
      const res = await api.post<{ accessToken?: string; refreshToken?: string }>('/auth/mfa/verify', {
        mfaToken,
        code: c,
      });
      if (res.accessToken && res.refreshToken) {
        await storeTokens(res.accessToken, res.refreshToken);
      }
      await fetchMe();
    } catch (err: any) {
      setError(err?.message ?? 'Code incorrect ou expiré.');
    } finally {
      setLoading(false);
    }
  };

  const full = code.every(c => !!c);

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.container}>

        <View style={s.header}>
          <View style={s.badge}>
            <Text style={s.badgeText}>🔐 Administration</Text>
          </View>
          <Text style={s.title}>Authentification à deux facteurs</Text>
          <Text style={s.desc}>
            Entrez le code à 6 chiffres envoyé à votre email administrateur.
          </Text>
        </View>

        {error ? (
          <View style={s.errorBox}>
            <Text style={s.errorText}>{error}</Text>
          </View>
        ) : null}

        <View style={s.otpRow}>
          {code.map((digit, i) => (
            <TextInput
              key={i}
              ref={el => { inputs.current[i] = el; }}
              style={[s.otpInput, !!digit && s.otpFilled, !!error && s.otpError]}
              value={digit}
              onChangeText={v => handleChange(v, i)}
              onKeyPress={e => handleKeyDown(e, i)}
              keyboardType="number-pad"
              maxLength={1}
              selectTextOnFocus
              autoFocus={i === 0}
            />
          ))}
        </View>

        <View style={s.timerRow}>
          <Text style={[s.timerText, seconds <= 60 && { color: colors.danger }]}>
            {seconds > 0 ? `Expire dans ${display}` : 'Code expiré — reconnectez-vous'}
          </Text>
        </View>

        <TouchableOpacity
          style={[s.btn, (!full || loading || seconds <= 0) && s.btnDisabled]}
          onPress={() => handleVerify()}
          disabled={!full || loading || seconds <= 0}
          activeOpacity={0.85}
        >
          <Text style={s.btnText}>{loading ? 'Vérification…' : 'Accéder au panneau admin'}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={s.back} onPress={() => navigation.navigate('Login')}>
          <Text style={s.backText}>← Retour à la connexion</Text>
        </TouchableOpacity>

      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:      { flex: 1, backgroundColor: colors.bg },
  container: { flex: 1, padding: spacing.lg, justifyContent: 'center' },
  header:    { alignItems: 'center', marginBottom: spacing.xl },
  badge:     {
    backgroundColor: 'rgba(232,93,38,0.12)', borderRadius: radius.full,
    paddingHorizontal: 14, paddingVertical: 6,
    borderWidth: 1, borderColor: 'rgba(232,93,38,0.25)', marginBottom: spacing.md,
  },
  badgeText: { color: colors.accent, fontSize: 12, fontWeight: '700' },
  title:     { fontSize: 22, fontWeight: '800', color: colors.text, marginBottom: 10, textAlign: 'center' },
  desc:      { fontSize: 13, color: colors.text3, textAlign: 'center', lineHeight: 20 },
  errorBox:  {
    backgroundColor: 'rgba(248,113,113,0.1)', borderWidth: 1,
    borderColor: 'rgba(248,113,113,0.3)', borderRadius: radius.sm,
    padding: 10, marginBottom: spacing.md,
  },
  errorText: { color: colors.danger, fontSize: 12, fontWeight: '600', textAlign: 'center' },
  otpRow:    { flexDirection: 'row', justifyContent: 'center', gap: spacing.sm, marginBottom: spacing.md },
  otpInput:  {
    width: 46, height: 56, borderRadius: radius.md,
    backgroundColor: colors.surface, borderWidth: 2, borderColor: colors.border,
    textAlign: 'center', fontSize: 22, fontWeight: '700', color: colors.text,
  },
  otpFilled: { borderColor: colors.accent, backgroundColor: 'rgba(232,93,38,0.08)' },
  otpError:  { borderColor: colors.danger },
  timerRow:  { alignItems: 'center', marginBottom: spacing.lg },
  timerText: { fontSize: 13, color: colors.text3, fontWeight: '500' },
  btn:       {
    backgroundColor: colors.accent, borderRadius: radius.md,
    paddingVertical: 15, alignItems: 'center', marginBottom: spacing.md,
  },
  btnDisabled: { opacity: 0.5 },
  btnText:   { color: colors.white, fontWeight: '700', fontSize: 16 },
  back:      { alignItems: 'center' },
  backText:  { color: colors.text3, fontSize: 13, fontWeight: '500' },
});
