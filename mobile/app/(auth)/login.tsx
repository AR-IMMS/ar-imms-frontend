import { router } from 'expo-router';
import { Fingerprint, ScanLine, ShieldCheck } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, Text, View } from 'react-native';

import { useAuth } from '../../src/auth/auth-context';
import { ActionButton } from '../../src/components/action-button';
import { FieldInput } from '../../src/components/field-input';
import { Screen } from '../../src/components/screen';
import { useTheme } from '../../src/theme/theme-context';
import { radii, spacing, type ThemeColors } from '../../src/theme/tokens';

export default function LoginScreen() {
  const { signIn, changePassword, mustChange, loading, error } = useAuth();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  async function login() {
    setFormError(null);
    try {
      if (mustChange) {
        if (password.length < 12 || password !== confirmation) { setFormError('Use at least 12 characters and confirm your password.'); return; }
        await changePassword(password);
        setPassword(''); setConfirmation('');
        setFormError('Password updated. Sign in with the new password.');
        return;
      }
      if (!email.trim() || !password) return;
      const authenticated = await signIn(email, password);
      setPassword('');
      if (authenticated) router.replace('/(app)');
    } catch (caught) {
      setFormError(caught instanceof Error ? caught.message : 'Sign in failed. Please try again.');
    }
  }

  return (
    <Screen>
      <KeyboardAvoidingView behavior={Platform.select({ ios: 'padding', android: undefined })} style={styles.wrap}>
        <View style={styles.visual}>
          <View style={styles.brandIcon}><ScanLine color="#FFFFFF" size={32} /></View>
          <Text style={styles.brand}>AR-IMMS Field</Text>
          <Text style={styles.tagline}>Technician workspace for faster, safer maintenance.</Text>
          <View style={styles.trust}><ShieldCheck color="#9FB7FF" size={15} /><Text style={styles.trustText}>Secure field operations</Text></View>
        </View>
        <View style={styles.form}>
          <View><Text style={styles.welcome}>{mustChange ? 'Change your password' : 'Welcome back'}</Text><Text style={styles.copy}>Sign in with your technician account.</Text></View>
          {!mustChange ? <FieldInput autoCapitalize="none" label="Username or email" value={email} onChangeText={(value) => { setEmail(value); setFormError(null); }} /> : null}
          <FieldInput label={mustChange ? 'New password' : 'Password'} secureTextEntry value={password} onChangeText={(value) => { setPassword(value); setFormError(null); }} />
          {mustChange ? <FieldInput label="Confirm password" secureTextEntry value={confirmation} onChangeText={setConfirmation} /> : null}
          {formError || error ? <View accessibilityLiveRegion="polite" style={styles.errorBox}><Text style={styles.error}>{formError ?? error}</Text></View> : null}
          <ActionButton disabled={loading || (!mustChange && !email.trim()) || !password} icon={Fingerprint} label={loading ? 'Please wait...' : mustChange ? 'Set new password' : 'Sign in securely'} onPress={() => void login()} />
        </View>
        <View style={styles.footer}>
          <Text style={styles.footerText}>AR-assisted infrastructure maintenance</Text>
          <Text style={styles.version}>Version 1.0.0</Text>
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  wrap: { flex: 1, justifyContent: 'center', gap: spacing.xl },
  visual: { alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.xxl, borderRadius: radii.xxl, backgroundColor: colors.hero },
  brandIcon: { alignItems: 'center', justifyContent: 'center', width: 68, height: 68, borderRadius: 24, backgroundColor: colors.cyan },
  brand: { color: '#FFFFFF', fontSize: 25, fontWeight: '900' },
  tagline: { maxWidth: 280, color: '#AFC0DF', fontSize: 12, lineHeight: 18, textAlign: 'center' },
  trust: { alignItems: 'center', flexDirection: 'row', gap: 6, marginTop: spacing.sm },
  trustText: { color: '#9FB7FF', fontSize: 9, fontWeight: '800', letterSpacing: 0.6 },
  form: { gap: spacing.lg, padding: spacing.xl, borderRadius: radii.xxl, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.panel },
  welcome: { color: colors.text, fontSize: 22, fontWeight: '900' },
  copy: { marginTop: 4, color: colors.textMuted, fontSize: 12 },
  errorBox: { paddingHorizontal: spacing.md, paddingVertical: 10, borderRadius: radii.md, backgroundColor: colors.redSoft },
  error: { color: colors.red, fontSize: 12, fontWeight: '800', textAlign: 'center' },
  footer: { alignItems: 'center', gap: 4 },
  footerText: { color: colors.textSubtle, fontSize: 10, textAlign: 'center' },
  version: { color: colors.textMuted, fontSize: 10, fontWeight: '700', letterSpacing: 0.4, textAlign: 'center' },
});
