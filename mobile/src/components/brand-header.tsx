import { router, type Href } from 'expo-router';
import { ChevronLeft, Grid2X2, MoreHorizontal } from 'lucide-react-native';
import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../theme/theme-context';
import { radii, spacing, type ThemeColors } from '../theme/tokens';

interface BrandHeaderProps { eyebrow?: string; title: string; subtitle?: string; back?: boolean; backHref?: Href; showStatusRow?: boolean; }
export function BrandHeader({ eyebrow, title, subtitle, back, backHref }: BrandHeaderProps) {
  const { colors } = useTheme(); const styles = useMemo(() => createStyles(colors), [colors]);
  return <View style={styles.wrap}><View style={styles.navRow}><Pressable style={styles.iconButton} onPress={() => backHref ? router.replace(backHref) : back ? router.back() : router.push('/(app)')}>{back ? <ChevronLeft color={colors.text} size={20} /> : <Grid2X2 color={colors.text} size={18} />}</Pressable><View style={styles.titleBlock}>{eyebrow ? <Text style={styles.eyebrow}>{eyebrow}</Text> : null}<Text numberOfLines={1} style={styles.title}>{title}</Text></View><View style={styles.iconButton}><MoreHorizontal color={colors.text} size={20} /></View></View>{subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}</View>;
}
const createStyles = (colors: ThemeColors) => StyleSheet.create({ wrap: { gap: spacing.md, paddingBottom: spacing.sm }, navRow: { alignItems: 'center', flexDirection: 'row', gap: spacing.md }, iconButton: { alignItems: 'center', justifyContent: 'center', width: 42, height: 42, borderRadius: radii.lg, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.panel }, titleBlock: { flex: 1, alignItems: 'center' }, eyebrow: { color: colors.cyan, fontSize: 9, fontWeight: '800', textTransform: 'uppercase' }, title: { color: colors.text, fontSize: 16, fontWeight: '900' }, subtitle: { color: colors.textMuted, fontSize: 12, lineHeight: 18, textAlign: 'center' } });
