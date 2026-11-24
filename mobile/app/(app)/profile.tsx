import { CheckCircle2, HelpCircle, LogOut, Moon, ShieldCheck, Sun, UserRound } from 'lucide-react-native';
import { useMemo } from 'react';
import { Pressable, StyleSheet, Switch, Text, View } from 'react-native';

import { useAuth } from '../../src/auth/auth-context';
import { AppHeader } from '../../src/components/app-header';
import { Screen } from '../../src/components/screen';
import { useTheme } from '../../src/theme/theme-context';
import { radii, spacing, type ThemeColors } from '../../src/theme/tokens';

export default function ProfileScreen() {
  const { session, signOut } = useAuth();
  const { colors, isDark, toggleTheme } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const initials = (session?.user.fullName ?? 'Technician').split(/\s+/).slice(-2).map((part) => part[0]).join('').toUpperCase();

  return (
    <Screen>
      <AppHeader title="Profile & settings" subtitle="Technician account" compact showThemeToggle={false} />

      <View style={styles.profileCard}>
        <View style={styles.avatar}><Text style={styles.avatarText}>{initials}</Text><View style={styles.verified}><CheckCircle2 color="#FFFFFF" size={12} /></View></View>
        <View style={styles.profileCopy}>
          <Text numberOfLines={1} style={styles.name}>{session?.user.fullName ?? 'Field technician'}</Text>
          <Text numberOfLines={1} style={styles.email}>{session?.user.email}</Text>
          <View style={styles.role}><ShieldCheck color={colors.cyan} size={13} /><Text style={styles.roleText}>Maintenance technician</Text></View>
        </View>
      </View>

      <View>
        <Text style={styles.sectionLabel}>APPEARANCE</Text>
        <View style={styles.group}>
          <View style={styles.row}>
            <View style={[styles.rowIcon, { backgroundColor: colors.purpleSoft }]}>{isDark ? <Moon color={colors.purple} size={19} /> : <Sun color={colors.purple} size={19} />}</View>
            <View style={styles.rowCopy}><Text style={styles.rowTitle}>Color mode</Text><Text style={styles.rowSubtitle}>{isDark ? 'Dark mode for low-light field work' : 'Light mode for bright environments'}</Text></View>
            <View style={styles.switchSlot}><Switch accessibilityLabel="Dark mode" value={isDark} onValueChange={toggleTheme} trackColor={{ false: colors.border, true: colors.cyan }} thumbColor="#FFFFFF" style={styles.switch} /></View>
          </View>
        </View>
      </View>

      <View>
        <Text style={styles.sectionLabel}>ACCOUNT</Text>
        <View style={styles.group}>
          <InfoRow icon={UserRound} title="Account" subtitle={session?.user.username ?? 'Technician'} />
          <InfoRow icon={ShieldCheck} title="Workflow access" subtitle={`${session?.user.permissions.length ?? 0} permissions`} />
          <InfoRow icon={HelpCircle} title="Field guide" subtitle="Ticket, scanner and WebAR guidance" last />
        </View>
      </View>

      <Pressable accessibilityRole="button" onPress={() => void signOut()} style={({ pressed }) => [styles.signOut, pressed && styles.pressed]}><LogOut color={colors.red} size={18} /><Text style={styles.signOutText}>Sign out</Text></Pressable>
      <Text style={styles.version}>AR-IMMS Field · Version 0.1.0</Text>
    </Screen>
  );

  function InfoRow({ icon: Icon, title, subtitle, last }: { icon: typeof UserRound; title: string; subtitle: string; last?: boolean }) {
    return <View style={[styles.row, !last && styles.rowBorder]}><View style={styles.rowIcon}><Icon color={colors.cyan} size={19} /></View><View style={styles.rowCopy}><Text style={styles.rowTitle}>{title}</Text><Text style={styles.rowSubtitle}>{subtitle}</Text></View></View>;
  }
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  profileCard: { alignItems: 'center', flexDirection: 'row', gap: spacing.lg, padding: spacing.lg, borderRadius: radii.xl, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.panel },
  avatar: { alignItems: 'center', justifyContent: 'center', width: 68, height: 68, borderRadius: 24, backgroundColor: colors.cyanSoft }, avatarText: { color: colors.cyan, fontSize: 20, fontWeight: '900' }, verified: { position: 'absolute', right: -3, bottom: -3, alignItems: 'center', justifyContent: 'center', width: 23, height: 23, borderRadius: 9, borderWidth: 3, borderColor: colors.panel, backgroundColor: colors.green },
  profileCopy: { flex: 1, alignItems: 'flex-start', gap: 4 }, name: { maxWidth: '100%', color: colors.text, fontSize: 19, fontWeight: '900' }, email: { maxWidth: '100%', color: colors.textMuted, fontSize: 12 }, role: { alignItems: 'center', flexDirection: 'row', gap: 5, marginTop: 4, paddingHorizontal: spacing.sm, paddingVertical: 6, borderRadius: 999, backgroundColor: colors.cyanSoft }, roleText: { color: colors.cyan, fontSize: 9, fontWeight: '800' },
  sectionLabel: { marginBottom: spacing.sm, marginLeft: spacing.xs, color: colors.textSubtle, fontSize: 10, fontWeight: '900', letterSpacing: 1.1 }, group: { overflow: 'hidden', borderRadius: radii.xl, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.panel },
  row: { alignItems: 'center', flexDirection: 'row', gap: spacing.md, minHeight: 68, paddingHorizontal: spacing.lg, paddingVertical: spacing.md }, rowBorder: { borderBottomWidth: 1, borderBottomColor: colors.border }, rowIcon: { alignItems: 'center', justifyContent: 'center', width: 40, height: 40, borderRadius: 14, backgroundColor: colors.cyanSoft }, rowCopy: { flex: 1, gap: 3 }, rowTitle: { color: colors.text, fontSize: 13, fontWeight: '800' }, rowSubtitle: { color: colors.textMuted, fontSize: 11, lineHeight: 16 }, switchSlot: { alignSelf: 'stretch', alignItems: 'center', justifyContent: 'center', width: 54 }, switch: { alignSelf: 'center', transform: [{ scale: 0.86 }] },
  signOut: { alignItems: 'center', alignSelf: 'center', justifyContent: 'center', flexDirection: 'row', gap: spacing.sm, minHeight: 46, paddingHorizontal: spacing.xl, borderRadius: radii.lg, borderWidth: 1, borderColor: colors.redSoft, backgroundColor: colors.redSoft }, signOutText: { color: colors.red, fontSize: 12, fontWeight: '900' }, pressed: { opacity: 0.72, transform: [{ scale: 0.98 }] }, version: { color: colors.textSubtle, fontSize: 10, textAlign: 'center' },
});
