import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { Logo } from './Logo';
import { colors, fonts, tints } from '../theme';

type Props = {
  onDemoLogin: () => void;
  onOtpLogin: () => void;
  onRequestOtp: (phone: string) => Promise<{ ok: boolean; message?: string }>;
  onVerifyOtp: (phone: string, token: string) => Promise<{ ok: boolean; message?: string }>;
  otpEnabled: boolean;
};

type Stage = 'idle' | 'awaitingCode';
type Tone = 'info' | 'error' | 'success';

export function AuthPanel({ onDemoLogin, onOtpLogin, onRequestOtp, onVerifyOtp, otpEnabled }: Props) {
  const [phone, setPhone] = useState('');
  const [token, setToken] = useState('');
  const [stage, setStage] = useState<Stage>('idle');
  const [message, setMessage] = useState<string | null>(null);
  const [messageTone, setMessageTone] = useState<Tone>('info');
  const [loading, setLoading] = useState(false);

  const setStatus = (text: string, tone: Tone) => {
    setMessage(text);
    setMessageTone(tone);
  };

  const requestOtp = async () => {
    setLoading(true);
    const result = await onRequestOtp(phone);
    setLoading(false);
    if (result.ok) {
      setStage('awaitingCode');
      setStatus(result.message ?? 'Codice inviato. Controlla i messaggi.', 'success');
    } else {
      setStatus(result.message ?? 'Impossibile inviare il codice.', 'error');
    }
  };

  const verifyOtp = async () => {
    setLoading(true);
    const result = await onVerifyOtp(phone, token);
    setLoading(false);
    if (result.ok) {
      setStatus(result.message ?? 'Accesso completato.', 'success');
      onOtpLogin();
    } else {
      setStatus(result.message ?? 'Verifica non riuscita. Riprova.', 'error');
    }
  };

  const enterDemo = () => {
    setStatus('', 'info');
    onDemoLogin();
  };

  const editPhone = () => {
    setStage('idle');
    setToken('');
    setStatus('', 'info');
  };

  const phoneValid = phone.trim().length >= 6;
  const tokenValid = token.trim().length >= 4;
  const messageColor =
    messageTone === 'error' ? '#E8C4B8' : messageTone === 'success' ? colors.mint : colors.muted;

  return (
    <LinearGradient colors={[colors.ink, '#0E1115', '#06080A']} style={styles.screen}>
      <StatusBar style="light" />
      <View style={styles.glowOne} pointerEvents="none" />
      <View style={styles.glowTwo} pointerEvents="none" />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.brandRow}>
            <View style={styles.brandDot} />
            <Text style={styles.brandWord}>IO CI SONO · FM</Text>
          </View>

          <View style={styles.heroBlock}>
            <View style={styles.logoSlot}>
              <Logo size={76} />
            </View>
            <Text style={styles.eyebrow}>BENVENUTO</Text>
            <Text style={styles.title}>La serata, prima di uscire.</Text>
            <Text style={styles.copy}>
              Una presenza per notte, conteggi pubblici, avatar solo tra amici. Zero GPS live salvato.
            </Text>
          </View>

          <TouchableOpacity
            onPress={enterDemo}
            disabled={loading}
            style={styles.primaryWrap}
            accessibilityRole="button"
            accessibilityLabel="Entra in modalità demo"
          >
            <LinearGradient
              colors={[colors.acid, colors.amber]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.primary}
            >
              {loading && !otpEnabled ? (
                <ActivityIndicator color={colors.ink} />
              ) : (
                <Text style={styles.primaryText}>Entra in demo</Text>
              )}
            </LinearGradient>
          </TouchableOpacity>
          <Text style={styles.primaryHint}>Esplora con dati locali, senza account.</Text>

          {otpEnabled ? (
            <View style={styles.otpBlock}>
              <View style={styles.divider}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>oppure col telefono</Text>
                <View style={styles.dividerLine} />
              </View>

              {stage === 'idle' ? (
                <View style={styles.field}>
                  <Text style={styles.fieldLabel}>NUMERO DI TELEFONO</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="+39 ..."
                    placeholderTextColor={tints.fog(0.32)}
                    keyboardType="phone-pad"
                    textContentType="telephoneNumber"
                    autoComplete="tel"
                    value={phone}
                    onChangeText={setPhone}
                    accessibilityLabel="Numero di telefono"
                    editable={!loading}
                  />
                  <TouchableOpacity
                    disabled={!phoneValid || loading}
                    onPress={requestOtp}
                    style={[styles.secondary, (!phoneValid || loading) && styles.disabled]}
                    accessibilityRole="button"
                    accessibilityState={{ disabled: !phoneValid || loading }}
                  >
                    {loading ? (
                      <ActivityIndicator color={colors.fog} />
                    ) : (
                      <Text style={styles.secondaryText}>Invia codice</Text>
                    )}
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.field}>
                  <View style={styles.phoneRecap}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.fieldLabel}>CODICE SMS A</Text>
                      <Text style={styles.phoneRecapValue}>{phone}</Text>
                    </View>
                    <TouchableOpacity onPress={editPhone} accessibilityRole="button" accessibilityLabel="Modifica numero">
                      <Text style={styles.linkText}>Modifica</Text>
                    </TouchableOpacity>
                  </View>
                  <TextInput
                    style={[styles.input, styles.codeInput]}
                    placeholder="••••••"
                    placeholderTextColor={tints.fog(0.24)}
                    keyboardType="number-pad"
                    textContentType="oneTimeCode"
                    autoComplete="sms-otp"
                    value={token}
                    onChangeText={setToken}
                    accessibilityLabel="Codice OTP ricevuto via SMS"
                    editable={!loading}
                    maxLength={8}
                  />
                  <TouchableOpacity
                    disabled={!tokenValid || loading}
                    onPress={verifyOtp}
                    style={[styles.secondary, (!tokenValid || loading) && styles.disabled]}
                    accessibilityRole="button"
                    accessibilityState={{ disabled: !tokenValid || loading }}
                  >
                    {loading ? (
                      <ActivityIndicator color={colors.fog} />
                    ) : (
                      <Text style={styles.secondaryText}>Verifica e accedi</Text>
                    )}
                  </TouchableOpacity>
                </View>
              )}
            </View>
          ) : (
            <View style={styles.noticeBox}>
              <Text style={styles.noticeKicker}>OTP non configurato</Text>
              <Text style={styles.noticeText}>
                Aggiungi le credenziali Supabase per abilitare l'accesso col telefono. La demo locale è già pronta.
              </Text>
            </View>
          )}

          {message ? (
            <Text style={[styles.message, { color: messageColor }]} accessibilityLiveRegion="polite">
              {message}
            </Text>
          ) : null}

          <Text style={styles.footer}>Età richiesta 18+ · termini essenziali, niente tracciamento.</Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  screen: {
    flex: 1,
  },
  glowOne: {
    position: 'absolute',
    width: 360,
    height: 360,
    borderRadius: 200,
    backgroundColor: tints.gold(0.1),
    right: -160,
    top: 80,
  },
  glowTwo: {
    position: 'absolute',
    width: 320,
    height: 320,
    borderRadius: 180,
    backgroundColor: tints.copper(0.08),
    left: -150,
    bottom: 60,
  },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 56,
    paddingBottom: 36,
    gap: 18,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  brandDot: {
    width: 8,
    height: 8,
    borderRadius: 999,
    backgroundColor: colors.acid,
  },
  brandWord: {
    color: colors.acid,
    fontFamily: fonts.mono,
    fontSize: 11,
    letterSpacing: 2.4,
    textTransform: 'uppercase',
  },
  heroBlock: {
    marginTop: 8,
  },
  logoSlot: {
    marginBottom: 18,
  },
  eyebrow: {
    color: colors.muted,
    fontFamily: fonts.mono,
    fontSize: 10,
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  title: {
    color: colors.fog,
    fontFamily: fonts.display,
    fontSize: 38,
    letterSpacing: -1.1,
    lineHeight: 40,
  },
  copy: {
    color: colors.sand,
    fontFamily: fonts.body,
    fontSize: 14,
    lineHeight: 21,
    marginTop: 12,
    opacity: 0.86,
  },
  primaryWrap: {
    borderRadius: 22,
    overflow: 'hidden',
    marginTop: 4,
  },
  primary: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 17,
  },
  primaryText: {
    color: colors.ink,
    fontFamily: fonts.display,
    fontSize: 19,
    letterSpacing: -0.3,
  },
  primaryHint: {
    color: colors.muted,
    fontFamily: fonts.mono,
    fontSize: 10,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    textAlign: 'center',
    marginTop: -4,
  },
  otpBlock: {
    gap: 14,
    marginTop: 6,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: tints.fog(0.08),
  },
  dividerText: {
    color: colors.muted,
    fontFamily: fonts.mono,
    fontSize: 9,
    letterSpacing: 1.6,
    textTransform: 'uppercase',
  },
  field: {
    backgroundColor: tints.panel(0.6),
    borderColor: tints.fog(0.06),
    borderWidth: 1,
    borderRadius: 22,
    padding: 16,
    gap: 10,
  },
  fieldLabel: {
    color: colors.muted,
    fontFamily: fonts.mono,
    fontSize: 9,
    letterSpacing: 1.6,
  },
  input: {
    backgroundColor: tints.fog(0.06),
    borderColor: tints.fog(0.1),
    borderWidth: 1,
    borderRadius: 14,
    color: colors.fog,
    fontFamily: fonts.body,
    fontSize: 16,
    paddingHorizontal: 14,
    paddingVertical: 13,
  },
  codeInput: {
    fontFamily: fonts.mono,
    letterSpacing: 6,
    textAlign: 'center',
    fontSize: 22,
  },
  secondary: {
    alignItems: 'center',
    backgroundColor: tints.fog(0.08),
    borderColor: tints.fog(0.12),
    borderRadius: 14,
    borderWidth: 1,
    paddingVertical: 13,
  },
  secondaryText: {
    color: colors.fog,
    fontFamily: fonts.body,
    fontSize: 14,
    letterSpacing: 0.2,
  },
  disabled: {
    opacity: 0.4,
  },
  phoneRecap: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  phoneRecapValue: {
    color: colors.fog,
    fontFamily: fonts.body,
    fontSize: 15,
    marginTop: 4,
  },
  linkText: {
    color: colors.acid,
    fontFamily: fonts.mono,
    fontSize: 11,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
  },
  noticeBox: {
    backgroundColor: tints.panel(0.55),
    borderColor: tints.fog(0.06),
    borderWidth: 1,
    borderRadius: 18,
    padding: 14,
    marginTop: 4,
  },
  noticeKicker: {
    color: colors.acid,
    fontFamily: fonts.mono,
    fontSize: 10,
    letterSpacing: 1.6,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  noticeText: {
    color: colors.sand,
    fontFamily: fonts.body,
    fontSize: 13,
    lineHeight: 19,
  },
  message: {
    fontFamily: fonts.body,
    fontSize: 12,
    lineHeight: 17,
    textAlign: 'center',
    marginTop: 4,
  },
  footer: {
    color: colors.muted,
    fontFamily: fonts.mono,
    fontSize: 9,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    textAlign: 'center',
    marginTop: 12,
  },
});
