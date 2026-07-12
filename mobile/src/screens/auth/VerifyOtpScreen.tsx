import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, radius } from '../../theme/colors';
import { api } from '@elengi/shared';

const CODE_LEN = 6;

export default function VerifyOtpScreen({ navigation, route }: any) {
  const { email, mode } = route.params as { email: string; mode: 'reset' };
  const [code,     setCode]     = useState<string[]>(Array(CODE_LEN).fill(''));
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');
  const [attempts, setAttempts] = useState(0);
  const [seconds,  setSeconds]  = useState(600); // 10 min
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
  };

  const handleKeyDown = (e: any, i: number) => {
    if (e.nativeEvent.key === 'Backspace' && !code[i] && i > 0) {
      inputs.current[i - 1]?.focus();
    }
  };

  const handleVerify = async () => {
    const otp = code.join('');
    if (otp.length < CODE_LEN) return;
    setLoading(true);
    setError('');
    try {
      await api.post('/auth/verify-otp', { email, code: otp });
      navigation.navigate('ResetPassword', { email, code: otp });
    } catch (err: any) {
      const msg = err?.message ?? 'Code incorrect.';
      setError(msg);
      setAttempts(a => a + 1);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setCode(Array(CODE_LEN).fill(''));
    setSeconds(600);
    setError('');
    try {
      await api.post('/auth/forgot-password', { email });
      Alert.alert('Code envoyé', 'Un nouveau code vous a été envoyé.');
    } catch {}
  };

  const full = code.every(c => !!c);

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.container}>

        <View style={s.header}>
          <Text style={s.title}>Vérification</Text>
          <Text style={s.desc}>
            Entrez le code à 6 chiffres envoyé à{'\n'}
            <Text style={{ color: colors.text, fontWeight: '700' }}>{email}</Text>
          </Text>
        </View>

        {error ? (
          <View style={s.errorBox}>
            <Text style={s.errorText}>{error}</Text>
          </View>
        ) : null}

        {attempts >= 2 && (
          <View style={s.warnBox}>
            <Text style={s.warnText}>⚠ Plus qu'une tentative avant le blocage</Text>
          </View>
        )}

        <View style={s.otpRow}>
          {code.map((digit, i) => (
            <TextInput
              key={i}
              ref={el => { inputs.current[i] = el; }}
              style={[s.otpInput, !!digit && s.otpFilled]}
              value={digit}
              onChangeText={v => handleChange(v, i)}
              onKeyPress={e => handleKeyDown(e, i)}
              keyboardType="number-pad"
              maxLength={1}
              selectTextOnFocus
            />
          ))}
        </View>

        <View style={s.timerRow}>
          <Text style={s.timerText}>
            {seconds > 0
              ? `Code valide pendant ${display}`
              : 'Code expiré'}
          </Text>
        </View>

        <TouchableOpacity
          style={[s.btn, (!full || loading) && s.btnDisabled]}
          onPress={handleVerify}
          disabled={!full || loading}
          activeOpacity={0.85}
        >
          <Text style={s.btnText}>{loading ? 'Vérification…' : 'Vérifier le code'}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={s.resend} onPress={handleResend} disabled={seconds > 540}>
          <Text style={[s.resendText, seconds > 540 && { color: colors.text3 }]}>
            {seconds > 540 ? `Renvoyer dans ${display}` : 'Renvoyer le code'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={s.back} onPress={() => navigation.goBack()}>
          <Text style={s.backText}>← Changer l'email</Text>
        </TouchableOpacity>

      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:      { flex: 1, backgroundColor: colors.bg },
  container: { flex: 1, padding: spacing.lg, justifyContent: 'center' },
  header:    { alignItems: 'center', marginBottom: spacing.xl },
  title:     { fontSize: 26, fontWeight: '800', color: colors.text, marginBottom: 12 },
  desc:      { fontSize: 14, color: colors.text3, textAlign: 'center', lineHeight: 22 },
  errorBox:  {
    backgroundColor: 'rgba(248,113,113,0.1)', borderWidth: 1,
    borderColor: 'rgba(248,113,113,0.3)', borderRadius: radius.sm,
    padding: 10, marginBottom: spacing.md,
  },
  errorText: { color: colors.danger, fontSize: 12, fontWeight: '600', textAlign: 'center' },
  warnBox:   {
    backgroundColor: 'rgba(251,191,36,0.1)', borderWidth: 1,
    borderColor: 'rgba(251,191,36,0.3)', borderRadius: radius.sm,
    padding: 10, marginBottom: spacing.md,
  },
  warnText:  { color: colors.warning, fontSize: 12, fontWeight: '600', textAlign: 'center' },
  otpRow:    { flexDirection: 'row', justifyContent: 'center', gap: spacing.sm, marginBottom: spacing.md },
  otpInput:  {
    width: 46, height: 56, borderRadius: radius.md,
    backgroundColor: colors.surface, borderWidth: 2, borderColor: colors.border,
    textAlign: 'center', fontSize: 22, fontWeight: '700', color: colors.text,
  },
  otpFilled: { borderColor: colors.accent, backgroundColor: 'rgba(232,93,38,0.08)' },
  timerRow:  { alignItems: 'center', marginBottom: spacing.lg },
  timerText: { fontSize: 13, color: colors.text3, fontWeight: '500' },
  btn:       {
    backgroundColor: colors.accent, borderRadius: radius.md,
    paddingVertical: 15, alignItems: 'center', marginBottom: spacing.md,
  },
  btnDisabled: { opacity: 0.5 },
  btnText:   { color: colors.white, fontWeight: '700', fontSize: 16 },
  resend:    { alignItems: 'center', paddingVertical: 8, marginBottom: spacing.sm },
  resendText: { color: colors.accent, fontSize: 14, fontWeight: '600' },
  back:      { alignItems: 'center' },
  backText:  { color: colors.text3, fontSize: 13, fontWeight: '500' },
});
