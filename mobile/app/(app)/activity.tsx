import { router } from 'expo-router';
import { History } from 'lucide-react-native';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useAssignedTickets } from '../../src/api/use-assigned-tickets';
import type { Ticket } from '../../src/api/tickets';
import { ActionButton } from '../../src/components/action-button';
import { AppHeader } from '../../src/components/app-header';
import { CyberCard } from '../../src/components/cyber-card';
import { Screen } from '../../src/components/screen';
import { TicketCard } from '../../src/components/ticket-card';
import { useTheme } from '../../src/theme/theme-context';
import { spacing } from '../../src/theme/tokens';

export default function ActivityScreen() {
  const { colors } = useTheme();
  const { tickets, loading, error, refresh, more } = useAssignedTickets({ state: 'CLOSED' });
  const days = new Map<string, Ticket[]>();
  const format = new Intl.DateTimeFormat('en', { dateStyle: 'long' });
  for (const ticket of [...tickets].sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt))) {
    const day = format.format(new Date(ticket.updatedAt));
    const group = days.get(day);
    if (group) group.push(ticket);
    else days.set(day, [ticket]);
  }
  return <Screen refreshing={loading} onRefresh={refresh}>
    <AppHeader title="Work history" subtitle="Completed field work" compact />
    <CyberCard><View style={styles.row}><History size={24} color={colors.cyan} />
      <View style={styles.copy}><Text style={[styles.title, { color: colors.text }]}>Completed tickets</Text>
        <Text style={{ color: colors.textMuted }}>{loading ? 'Loading history…' : error ? 'History unavailable' : tickets.length + ' loaded · By last update'}</Text></View>
    </View></CyberCard>
    {loading ? <ActivityIndicator accessibilityLabel="Loading history" color={colors.cyan} /> : null}
    {error ? <CyberCard><Text style={{ color: colors.red }}>{error}</Text><ActionButton label="Retry" variant="secondary" onPress={() => void refresh()} /></CyberCard> : null}
    {Array.from(days, ([day, items]) => <View key={day} style={styles.group}>
      <Text accessibilityRole="header" style={[styles.day, { color: colors.textMuted }]}>{day}</Text>
      {items.map(ticket => <TicketCard key={ticket.id} ticket={ticket} onPress={() => router.push(`/(app)/tickets/${ticket.id}`)} />)}
    </View>)}
    {more ? <ActionButton label="Load more" variant="secondary" disabled={loading} onPress={() => void more()} /> : null}
    {!loading && !error && !tickets.length ? <CyberCard><Text style={{ color: colors.textMuted }}>Your completed Tickets will appear here.</Text></CyberCard> : null}
  </Screen>;
}
const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: spacing.md, alignItems: 'center' },
  copy: { flex: 1, gap: 4 }, title: { fontSize: 21, fontWeight: '700' },
  group: { gap: spacing.sm }, day: { fontSize: 14, fontWeight: '600' },
});
