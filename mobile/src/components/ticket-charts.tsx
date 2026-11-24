import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../theme/theme-context';
import { spacing, type ThemeColors } from '../theme/tokens';
import type { Ticket } from '../api/tickets';

const keys: { status: Ticket['status']; label: string; color: keyof ThemeColors }[] = [
  { status: 'OPEN', label: 'Open', color: 'cyan' },
  { status: 'NEW', label: 'New', color: 'purple' },
  { status: 'PENDING', label: 'Pending', color: 'amber' },
  { status: 'CLOSED', label: 'Closed', color: 'green' },
];

export function TicketStatusChart({ tickets }: { tickets: Ticket[] }) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const counts = Object.fromEntries(keys.map(({ status }) => [status, tickets.filter((ticket) => ticket.status === status).length])) as Record<Ticket['status'], number>;
  const total = Math.max(1, keys.reduce((sum, { status }) => sum + counts[status], 0));
  return (
    <View style={styles.wrap}>
      <View style={styles.bar}>{keys.map(({ status, color }) => {
        const count = counts[status];
        return count ? <View key={status} style={{ flex: count / total, backgroundColor: colors[color] as string }} /> : null;
      })}</View>
      <View style={styles.legend}>{keys.map(({ status, label, color }) => {
        const count = counts[status];
        return <View key={status} style={styles.legendItem}><View style={[styles.dot, { backgroundColor: colors[color] as string }]} /><View><Text style={styles.legendValue}>{count}</Text><Text style={styles.legendLabel}>{label}</Text></View></View>;
      })}</View>
    </View>
  );
}

export function PriorityBars({ tickets }: { tickets: Ticket[] }) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const groups = new Map<string, { label: string; count: number; color: string }>();
  for (const ticket of tickets) {
    const color = { green: colors.green, cyan: colors.cyan, amber: colors.amber, critical: colors.red, neutral: colors.textMuted }[ticket.priorityColor];
    const existing = groups.get(ticket.priority);
    groups.set(ticket.priority, { label: ticket.priority, count: (existing?.count ?? 0) + 1, color });
  }
  const values = [...groups.values()];
  const max = Math.max(1, ...values.map((item) => item.count));
  return <View style={styles.priorityList}>{values.map((item) => <View key={item.label} style={styles.priorityRow}><Text style={styles.priorityLabel}>{item.label}</Text><View style={styles.track}><View style={[styles.fill, { width: `${Math.max(item.count ? 12 : 0, item.count / max * 100)}%`, backgroundColor: item.color }]} /></View><Text style={styles.count}>{item.count}</Text></View>)}</View>;
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  wrap: { gap: spacing.lg },
  bar: { flexDirection: 'row', overflow: 'hidden', height: 12, borderRadius: 999, backgroundColor: colors.cardDark },
  legend: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.sm },
  legendItem: { alignItems: 'center', flexDirection: 'row', gap: 6 },
  dot: { width: 7, height: 7, borderRadius: 4 },
  legendValue: { color: colors.text, fontSize: 13, fontWeight: '900' },
  legendLabel: { color: colors.textMuted, fontSize: 9, fontWeight: '600' },
  priorityList: { gap: spacing.md },
  priorityRow: { alignItems: 'center', flexDirection: 'row', gap: spacing.sm },
  priorityLabel: { width: 52, color: colors.textMuted, fontSize: 10, fontWeight: '700' },
  track: { flex: 1, height: 8, overflow: 'hidden', borderRadius: 999, backgroundColor: colors.cardDark },
  fill: { height: '100%', borderRadius: 999 },
  count: { width: 18, color: colors.text, fontSize: 11, fontWeight: '900', textAlign: 'right' },
});
