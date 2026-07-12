import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, radius } from '../../theme/colors';
import { useVerifyEmail, api } from '@elengi/shared';
import { useAuthStore } from '../../store/auth.store';

const CODE_LEN = 6;
const RESEND_DELAY = 60;

export default function VerifyEmailScreen({ navigation, route }: any) {
  const { email } = route.params as { email: string };
  const { fetchMe } = useAuthStore();
  const [code,     setCode]    = useState<string[]>(Array(CODE_LEN).fill(''));
  const [seconds,  setSeconds] = useState(RESEND_DELAY);
  const [success,  setSuccess] = useState(false);
  const [resent,   setResent]  = useState(false);
  const inputs = useRef<(TextInput | null)[]>([]);

  const verify = useVerifyEmail({
    onSuccess: async () => {
      setSuccess(true);
      await fetchMe();
    },
  });

  useEffect(() => {
    if (seconds <= 0) return;
    const t = setInterval(() => setSeconds(s => s - 1), 1000);
    return () => clearInterval(t);
  }, [seconds]);

  const handleChange = (val: string, i: number) => {
    const digit = val.replace(/[^0-9]/g, '').slice(-1);
    const next  = [...code];
    next[i]     = digit;
    setCode(next);
    if (digit && i < CODE_LEN - 1) inputs.current[i + 1]?.focus();
    if (digit && i === CODE_LEN - 1) {
      const full = [...next].join('');
      if (full.length === CODE_LEN) verify.mutate({ email, code: full });
    }
  };

  const handleKeyDown = (e: any, i: number) => {
    if (e.nativeEvent.key === 'Backspace' && !code[i] && i > 0) {
      inputs.current[i - 1]?.focus();
    }
  };

  const handleResend = async () => {
    try {
      await api.post('/auth/resend-verification', { email });
      setSeconds(RESEND_DELAY);
      setResent(true);
      setCode(Array(CODE_LEN).fill(''));
      setTimeout(() => setResent(false), 3000);
    } catch {}
  };

  const full = code.every(c => !!c);

  if (success) {
    return (
      <SafeAreaView style={s.safe}>
        <View style={s.center}>
          <Text style={s.successIcon}>✓</Text>
          <Text style={s.successTitle}>Email vérifié !</Text>
          <Text style={s.successDesc}>Votre compte est actif. Bienvenue sur Elengi !</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.container}>

        <View style={s.header}>
          <Text style={s.title}>Vérifiez votre email</Text>
          <Text style={s.desc}>
            Entrez le code à 6 chiffres envoyé à{'\n'}
            <Text style={{ color: colors.text, fontWeight: '700' }}>{email}</Text>
          </Text>
        </View>

        {verify.isError && (
          <View style={s.errorBox}>
            <Text style={s.errorText}>{(verify.error as any)?.message ?? 'Code incorrect.'}</Text>
          </View>
        )}

        {resent && (
          <View style={s.successBox}>
            <Text style={s.successBoxText}>✓ Nouveau code envoyé !</Text>
          </View>
        )}

        <View style={s.otpRow}>
          {code.map((digit, i) => (
            <TextInput
              key={i}
              ref={el => { inputs.current[i] = el; }}
              style={[s.otpInput, !!digit && s.otpFilled, verify.isError && s.otpError]}
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

        <TouchableOpacity
          style={[s.btn, (!full || verify.isPending) && s.btnDisabled]}
          onPress={() => verify.mutate({ email, code: code.join('') })}
          disabled={!full || verify.isPending}
          activeOpacity={0.85}
        >
          <Text style={s.btnText}>{verify.isPending ? 'Vérification…' : 'Vérifier'}</Text>
        </TouchableOpacity>

        <View style={s.resendRow}>
          {seconds > 0 ? (
            <Text style={s.timerText}>
              Renvoyer dans <Text style={{ color: colors.text2, fontWeight: '700' }}>{seconds}s</Text>
            </Text>
          ) : (
            <TouchableOpacity onPress={handleResend}>
              <Text style={s.resendLink}>Renvoyer le code</Text>
            </TouchableOpacity>
          )}
        </View>

      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:         { flex: 1, backgroundColor: colors.bg },
  container:    { flex: 1, padding: spacing.lg, justifyContent: 'center' },
  center:       { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.lg },
  header:       { alignItems: 'center', marginBottom: spacing.xl },
  title:        { fontSize: 26, fontWeight: '800', color: colors.text, marginBottom: 12 },
  desc:         { fontSize: 14, color: colors.text3, textAlign: 'center', lineHeight: 22 },
  errorBox:     {
    backgroundColor: 'rgba(248,113,113,0.1)', borderWidth: 1,
    borderColor: 'rgba(248,113,113,0.3)', borderRadius: radius.sm,
    padding: 10, marginBottom: spacing.md,
  },
  errorText:    { color: colors.danger, fontSize: 12, fontWeight: '600', textAlign: 'center' },
  successBox:   {
    backgroundColor: 'rgba(74,222,128,0.1)', borderWidth: 1,
    borderColor: 'rgba(74,222,128,0.3)', borderRadius: radius.sm,
    padding: 10, marginBottom: spacing.md,
  },
  successBoxText: { color: colors.success, fontSize: 12, fontWeight: '600', textAlign: 'center' },
  otpRow:       { flexDirection: 'row', justifyContent: 'center', gap: spacing.sm, marginBottom: spacing.lg },
  otpInput:     {
    width: 46, height: 56, borderRadius: radius.md,
    backgroundColor: colors.surface, borderWidth: 2, borderColor: colors.border,
    textAlign: 'center', fontSize: 22, fontWeight: '700', color: colors.text,
  },
  otpFilled:    { borderColor: colors.accent, backgroundColor: 'rgba(232,93,38,0.08)' },
  otpError:     { borderColor: colors.danger },
  btn:          {
    backgroundColor: colors.accent, borderRadius: radius.md,
    paddingVertical: 15, alignItems: 'center', marginBottom: spacing.md,
  },
  btnDisabled:  { opacity: 0.5 },
  btnText:      { color: colors.white, fontWeight: '700', fontSize: 16 },
  resendRow:    { alignItems: 'center', paddingVertical: 8 },
  timerText:    { fontSize: 13, color: colors.text3 },
  resendLink:   { color: colors.accent, fontSize: 14, fontWeight: '600' },
  successIcon:  { fontSize: 64, color: colors.success, marginBottom: spacing.lg },
  successTitle: { fontSize: 26, fontWeight: '800', color: colors.text, marginBottom: 8 },
  successDesc:  { fontSize: 14, color: colors.text3, textAlign: 'center', lineHeight: 22 },
});
