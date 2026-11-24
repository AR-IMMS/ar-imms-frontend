import { Box, ChevronRight, Clock3 } from 'lucide-react-native';
import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useTheme } from '../theme/theme-context';
import { radii, shadow, spacing, type ThemeColors } from '../theme/tokens';
import type { Ticket } from '../api/tickets';
import { StatusPill, type StatusTone } from './status-pill';

interface TicketCardProps { ticket: Ticket; onPress?: () => void; }

export function TicketCard({ ticket, onPress }: TicketCardProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const priority = priorityColors(ticket.priorityColor, colors);
  return (
    <Pressable accessibilityHint="Opens ticket details" accessibilityLabel={`${ticket.ticketCode}, ${ticket.title}, ${ticket.priority} priority, ${ticket.status}`} accessibilityRole="button" onPress={onPress} style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
      <View style={styles.content}>
        <View style={styles.topRow}><Text style={styles.code}>#{ticket.ticketCode}</Text><ChevronRight color={colors.textSubtle} size={17} /></View>
        <Text numberOfLines={2} style={styles.title}>{ticket.title}</Text>
        <View style={styles.metaRow}>
          <View style={[styles.priorityPill, { backgroundColor: priority.soft }]}>
            <View style={[styles.dot, { backgroundColor: priority.color }]} /><Text style={[styles.priority, { color: priority.color }]}>{ticket.priority}</Text>
          </View>
          <StatusPill label={ticket.status} tone={statusTone(ticket.status)} />
        </View>
        <View style={styles.metaRow}>
          <View style={styles.meta}><Clock3 color={colors.textSubtle} size={13} /><Text style={styles.metaText}>{relativeTime(ticket.updatedAt)}</Text></View>
          {ticket.assetRef ? <View style={styles.meta}><Box color={colors.textMuted} size={14} /><Text style={styles.metaText}>{ticket.assetRef.code}</Text></View> : null}
        </View>
      </View>
    </Pressable>
  );
}

export function statusTone(status: Ticket['status']): StatusTone {
  if (status === 'CLOSED') return 'green';
  if (status === 'PENDING') return 'amber';
  if (status === 'OPEN') return 'cyan';
  return status === 'NEW' ? 'purple' : 'muted';
}
export function priorityColors(priority: Ticket['priorityColor'], colors: ThemeColors) {
  if (priority === 'critical') return { color: colors.red, soft: colors.redSoft };
  if (priority === 'amber') return { color: colors.amber, soft: colors.amberSoft };
  if (priority === 'cyan') return { color: colors.cyan, soft: colors.cyanSoft };
  if (priority === 'green') return { color: colors.green, soft: colors.greenSoft };
  return { color: colors.textMuted, soft: colors.cardDark };
}

export function relativeTime(value: string) {
  const elapsed = Math.max(0, Date.now() - new Date(value).getTime());
  const hours = Math.floor(elapsed / 3_600_000);
  const minutes = Math.floor(elapsed / 60_000);
  if (minutes < 1) return 'Just updated';
  if (hours < 1) return minutes + 'm ago';
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  card: { flexDirection: 'row', overflow: 'hidden', borderRadius: radii.xl, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.panel, ...shadow },
  pressed: { opacity: 0.82, transform: [{ scale: 0.99 }] },
  dot: { width: 6, height: 6, borderRadius: 3 },
  content: { flex: 1, gap: 10, paddingHorizontal: spacing.lg, paddingVertical: 14 },
  topRow: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', gap: spacing.sm },
  code: { color: colors.textMuted, fontSize: 12, fontWeight: '600', letterSpacing: 0.35 },
  title: { color: colors.text, fontSize: 17, fontWeight: '700', lineHeight: 23 },
  metaRow: { alignItems: 'center', flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  meta: { alignItems: 'center', flexDirection: 'row', gap: 5, flexShrink: 1 },
  metaText: { color: colors.textMuted, fontSize: 11, fontWeight: '600' },
  incident: { color: colors.purple, fontSize: 11, fontWeight: '700' },
  asset: { color: colors.cyan, fontSize: 11, fontWeight: '700' },
  footer: { alignItems: 'center', flexDirection: 'row', gap: spacing.sm, paddingTop: spacing.sm, borderTopWidth: 1, borderTopColor: colors.border },
  priorityPill: { alignItems: 'center', flexDirection: 'row', gap: 5, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999 }, priority: { fontSize: 12, fontWeight: '600' },
});
