import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../theme/theme-context';
import { spacing, type ThemeColors } from '../theme/tokens';

export type StatusTone = 'green' | 'cyan' | 'amber' | 'red' | 'muted' | 'purple';
interface StatusPillProps { label?: string | null; tone?: StatusTone; }
export function StatusPill({ label, tone = 'cyan' }: StatusPillProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const displayLabel = label?.trim() || 'Unknown';
  return <View style={[styles.pill, styles[tone]]}><Text style={[styles.label, styles[`${tone}Text`]]}>{displayLabel.replaceAll('_', ' ')}</Text></View>;
}
const createStyles = (colors: ThemeColors) => StyleSheet.create({
  pill: { alignSelf: 'flex-start', paddingHorizontal: spacing.md, paddingVertical: 6, borderRadius: 999 },
  label: { fontSize: 10, fontWeight: '800', textTransform: 'capitalize' },
  green: { backgroundColor: colors.greenSoft }, cyan: { backgroundColor: colors.cyanSoft }, amber: { backgroundColor: colors.amberSoft }, red: { backgroundColor: colors.redSoft }, muted: { backgroundColor: colors.cardDark }, purple: { backgroundColor: colors.purpleSoft },
  greenText: { color: colors.green }, cyanText: { color: colors.cyan }, amberText: { color: colors.amber }, redText: { color: colors.red }, mutedText: { color: colors.textMuted }, purpleText: { color: colors.purple },
});
