import { LucideIcon } from 'lucide-react-native';
import { useMemo } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';

import { useTheme } from '../theme/theme-context';
import { radii, shadow, spacing, type ThemeColors } from '../theme/tokens';

interface ActionButtonProps { label: string; onPress: () => void; icon?: LucideIcon; variant?: 'primary' | 'secondary' | 'danger'; disabled?: boolean; }

export function ActionButton({ label, onPress, icon: Icon, variant = 'primary', disabled }: ActionButtonProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  return (
    <Pressable accessibilityRole="button" accessibilityState={{ disabled }} disabled={disabled} style={({ pressed }) => [styles.button, styles[variant], pressed && styles.pressed, disabled && styles.disabled]} onPress={onPress}>
      {Icon ? <Icon color={variant === 'primary' ? '#FFFFFF' : variant === 'danger' ? colors.red : colors.text} size={18} /> : null}
      <Text style={[styles.label, variant === 'primary' && styles.primaryLabel, variant === 'danger' && styles.dangerLabel]}>{label}</Text>
    </Pressable>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  button: { alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: spacing.sm, minHeight: 52, paddingHorizontal: spacing.lg, borderRadius: radii.lg, borderWidth: 1 },
  primary: { backgroundColor: colors.cyan, borderColor: colors.cyan, ...shadow },
  secondary: { backgroundColor: colors.panel, borderColor: colors.border },
  danger: { backgroundColor: colors.redSoft, borderColor: colors.redSoft },
  pressed: { opacity: 0.78, transform: [{ scale: 0.985 }] },
  disabled: { opacity: 0.42 },
  label: { color: colors.text, fontSize: 13, fontWeight: '800' },
  primaryLabel: { color: '#FFFFFF' },
  dangerLabel: { color: colors.red },
});
