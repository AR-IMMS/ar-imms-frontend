import { PropsWithChildren, useMemo } from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { useTheme } from '../theme/theme-context';
import { radii, shadow, spacing, type ThemeColors } from '../theme/tokens';

interface CyberCardProps extends PropsWithChildren { style?: ViewStyle | ViewStyle[]; active?: boolean; compact?: boolean; }
export function CyberCard({ children, style, active, compact }: CyberCardProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  return <View style={[styles.card, compact && styles.compact, active && styles.active, style]}>{children}</View>;
}
const createStyles = (colors: ThemeColors) => StyleSheet.create({
  card: { gap: spacing.md, padding: 18, borderRadius: radii.xl, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.panel, ...shadow },
  compact: { padding: 14, borderRadius: radii.lg },
  active: { borderColor: colors.borderBright, backgroundColor: colors.panelStrong },
});
