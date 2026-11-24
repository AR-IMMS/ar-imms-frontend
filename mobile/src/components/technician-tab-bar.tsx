import type { BottomTabBarProps } from 'expo-router/js-tabs';
import { ChartNoAxesColumnIncreasing, ClipboardList, Home, UserRound } from 'lucide-react-native';
import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '../theme/theme-context';
import { spacing, type ThemeColors } from '../theme/tokens';

const visibleRoutes = [
  { name: 'index', label: 'Overview', icon: Home },
  { name: 'tickets/index', label: 'Tickets', icon: ClipboardList },
  { name: 'activity', label: 'History', icon: ChartNoAxesColumnIncreasing },
  { name: 'profile', label: 'Profile', icon: UserRound },
];

type TechnicianTabBarProps = Pick<BottomTabBarProps, 'state' | 'navigateToTab'>;

export function TechnicianTabBar({ state, navigateToTab }: TechnicianTabBarProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const activeRoute = state.routes[state.index]?.name;
  function openTab(name: string) {
    const route = state.routes.find(tab => tab.name === name);
    if (route) navigateToTab(route.key);
  }

  if (activeRoute?.startsWith('ar/')) return null;

  return (
    <View style={[styles.shell, { paddingBottom: Math.max(insets.bottom, 10) }]}>
      <View accessibilityRole="tablist" style={styles.row}>
        {visibleRoutes.map(item => (
          <TabItem key={item.name} {...item}
            active={activeRoute === item.name || (item.name === 'tickets/index' && Boolean(activeRoute?.startsWith('tickets/')))}
            colors={colors} onPress={() => openTab(item.name)} />
        ))}
      </View>
    </View>
  );
}

function TabItem({ label, icon: Icon, active, colors, onPress }: { label: string; icon: typeof Home; active: boolean; colors: ThemeColors; onPress: () => void }) {
  const styles = useMemo(() => createStyles(colors), [colors]);
  return <Pressable accessibilityRole="tab" aria-selected={active} onPress={onPress} style={({ pressed }) => [styles.item, pressed && styles.pressed]}><View style={[styles.iconWrap, active && styles.iconActive]}><Icon color={active ? colors.cyan : colors.textSubtle} size={20} strokeWidth={active ? 2.5 : 2} /></View><Text style={[styles.label, active && styles.labelActive]}>{label}</Text></Pressable>;
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  shell: { position: 'relative', borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: colors.nav },
  row: { flexDirection: 'row', minHeight: 60, paddingTop: 8, paddingHorizontal: spacing.sm },
  item: { alignItems: 'center', flex: 1, gap: 4, minHeight: 54 },
  iconWrap: { alignItems: 'center', justifyContent: 'center', width: 38, height: 30, borderRadius: 13 },
  iconActive: { backgroundColor: colors.cyanSoft },
  label: { color: colors.textSubtle, fontSize: 12, fontWeight: '700' },
  labelActive: { color: colors.cyan, fontWeight: '900' },
  pressed: { opacity: 0.7 },
});
