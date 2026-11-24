import { Bell, Moon, Sun } from 'lucide-react-native';
import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useAuth } from '../auth/auth-context';
import { useTheme } from '../theme/theme-context';
import { radii, spacing, type ThemeColors } from '../theme/tokens';
import { useTicketNotifications } from '../notifications/notification-context';

interface AppHeaderProps { title?: string; subtitle?: string; compact?: boolean; showThemeToggle?: boolean; }

export function AppHeader({ title, subtitle, compact, showThemeToggle = true }: AppHeaderProps) {
  const { session } = useAuth();
  const { colors, isDark, toggleTheme } = useTheme();
  const { unreadCount, open } = useTicketNotifications();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const initials = (session?.user.fullName ?? 'Technician').split(/\s+/).slice(-2).map((part) => part[0]).join('').toUpperCase();

  return (
    <View style={styles.header}>
      <View style={styles.identity}>
        <View style={styles.avatar}><Text style={styles.avatarText}>{initials}</Text><View style={styles.online} /></View>
        <View style={styles.copy}>
          <Text style={styles.kicker}>{subtitle ?? 'Field technician'}</Text>
          <Text numberOfLines={1} style={[styles.name, compact && styles.compactName]}>{title ?? session?.user.fullName ?? 'Technician'}</Text>
        </View>
      </View>
      <View style={styles.actions}>
        {showThemeToggle ? (
          <Pressable accessibilityLabel="Toggle color theme" onPress={toggleTheme} style={styles.iconButton}>
            {isDark ? <Sun color={colors.text} size={18} /> : <Moon color={colors.text} size={18} />}
          </Pressable>
        ) : null}
        <Pressable accessibilityLabel={`Notifications${unreadCount ? `, ${unreadCount} unread` : ''}`} onPress={open} style={styles.iconButton}><Bell color={colors.text} size={18} />{unreadCount ? <View style={styles.badge}><Text style={styles.badgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text></View> : null}</Pressable>
      </View>
    </View>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  header: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', gap: spacing.md, minHeight: 58, paddingVertical: spacing.xs },
  identity: { alignItems: 'center', flex: 1, flexDirection: 'row', gap: spacing.md },
  avatar: { alignItems: 'center', justifyContent: 'center', width: 46, height: 46, borderRadius: 18, backgroundColor: colors.cyanSoft },
  avatarText: { color: colors.cyan, fontSize: 14, fontWeight: '900' },
  online: { position: 'absolute', right: -1, bottom: -1, width: 12, height: 12, borderRadius: 6, borderWidth: 2, borderColor: colors.bg, backgroundColor: colors.green },
  copy: { flex: 1, gap: 2 },
  kicker: { color: colors.textMuted, fontSize: 11, fontWeight: '600' },
  name: { color: colors.text, fontSize: 18, fontWeight: '900' },
  compactName: { fontSize: 16 },
  actions: { flexDirection: 'row', gap: spacing.sm },
  iconButton: { alignItems: 'center', justifyContent: 'center', width: 42, height: 42, borderRadius: radii.lg, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.panel },
  badge: { position: 'absolute', top: 4, right: 3, alignItems: 'center', justifyContent: 'center', minWidth: 17, height: 17, paddingHorizontal: 4, borderRadius: 9, borderWidth: 1.5, borderColor: colors.panel, backgroundColor: colors.red },
  badgeText: { color: '#FFFFFF', fontSize: 8, fontWeight: '900' },
});
