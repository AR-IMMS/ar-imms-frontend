import { useMemo } from 'react';
import { Text, TextInput, TextInputProps, StyleSheet, View } from 'react-native';
import { useTheme } from '../theme/theme-context';
import { radii, spacing, type ThemeColors } from '../theme/tokens';

interface FieldInputProps extends TextInputProps { label: string; }
export function FieldInput({ label, style, ...props }: FieldInputProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  return <View style={styles.wrap}><Text style={styles.label}>{label}</Text><TextInput placeholderTextColor={colors.textSubtle} style={[styles.input, style]} {...props} /></View>;
}
const createStyles = (colors: ThemeColors) => StyleSheet.create({
  wrap: { gap: spacing.sm },
  label: { color: colors.textMuted, fontSize: 12, fontWeight: '700' },
  input: { minHeight: 56, paddingHorizontal: spacing.lg, borderRadius: radii.lg, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.cardDark, color: colors.text, fontSize: 15 },
});
