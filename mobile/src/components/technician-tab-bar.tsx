import type { BottomTabBarProps } from 'expo-router/js-tabs';
import { ChartNoAxesColumnIncreasing, ClipboardList, Home, ScanLine, UserRound } from 'lucide-react-native';
import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '../theme/theme-context';
import { shadow, spacing, type ThemeColors } from '../theme/tokens';

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
      <View style={styles.row}>
        {visibleRoutes.slice(0, 2).map((item) => <TabItem key={item.name} {...item} active={activeRoute === item.name} colors={colors} onPress={() => openTab(item.name)} />)}
        <View style={styles.centerSlot} />
        {visibleRoutes.slice(2).map((item) => <TabItem key={item.name} {...item} active={activeRoute === item.name} colors={colors} onPress={() => openTab(item.name)} />)}
      </View>
      <Pressable accessibilityHint="Opens the camera to scan an asset QR" accessibilityLabel="Scan asset QR" accessibilityRole="button" onPress={() => openTab('ar/scan')} style={({ pressed }) => [styles.scanButton, pressed && styles.pressed]}>
        <ScanLine color="#FFFFFF" size={26} strokeWidth={2.3} />
      </Pressable>
      <Text pointerEvents="none" style={styles.scanLabel}>Scan asset</Text>
    </View>
  );
}

function TabItem({ label, icon: Icon, active, colors, onPress }: { label: string; icon: typeof Home; active: boolean; colors: ThemeColors; onPress: () => void }) {
  const styles = useMemo(() => createStyles(colors), [colors]);
  return <Pressable accessibilityRole="button" onPress={onPress} style={styles.item}><View style={[styles.iconWrap, active && styles.iconActive]}><Icon color={active ? colors.cyan : colors.textSubtle} size={20} strokeWidth={active ? 2.5 : 2} /></View><Text style={[styles.label, active && styles.labelActive]}>{label}</Text></Pressable>;
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  shell: { position: 'relative', borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: colors.nav, ...shadow },
  row: { flexDirection: 'row', minHeight: 68, paddingTop: 8, paddingHorizontal: spacing.sm },
  item: { alignItems: 'center', flex: 1, gap: 4, minHeight: 54 },
  centerSlot: { flex: 1 },
  iconWrap: { alignItems: 'center', justifyContent: 'center', width: 38, height: 30, borderRadius: 13 },
  iconActive: { backgroundColor: colors.cyanSoft },
  label: { color: colors.textSubtle, fontSize: 10, fontWeight: '700' },
  labelActive: { color: colors.cyan, fontWeight: '900' },
  scanButton: { position: 'absolute', top: -22, left: '50%', marginLeft: -29, alignItems: 'center', justifyContent: 'center', width: 58, height: 58, borderRadius: 22, borderWidth: 4, borderColor: colors.bg, backgroundColor: colors.cyan, shadowColor: colors.cyan, shadowOpacity: 0.18, shadowRadius: 10, shadowOffset: { width: 0, height: 6 }, elevation: 9 },
  scanLabel: { position: 'absolute', top: 42, left: '50%', width: 76, marginLeft: -38, color: colors.cyan, fontSize: 9, fontWeight: '900', textAlign: 'center' },
  pressed: { transform: [{ scale: 0.94 }] },
});
