import { router } from 'expo-router';
import { CheckCircle2, CircleAlert, RotateCcw, Search, X } from 'lucide-react-native';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { useAssignedTickets } from '../../../src/api/use-assigned-tickets';
import type { State } from '../../../src/api/tickets';
import { AppHeader } from '../../../src/components/app-header';
import { Screen } from '../../../src/components/screen';
import { TicketCard } from '../../../src/components/ticket-card';
import { useTheme } from '../../../src/theme/theme-context';
import { radii, spacing, type ThemeColors } from '../../../src/theme/tokens';
type QueueFilter = 'ALL' | State;
const filters: { key: QueueFilter; label: string }[] = [{ key: 'ALL', label: 'All active' }, { key: 'NEW', label: 'New' }, { key: 'OPEN', label: 'Open' }, { key: 'PENDING', label: 'Pending' }];

export default function TicketListScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [filter, setFilter] = useState<QueueFilter>('ALL');
  const [query, setQuery] = useState('');
  const [search, setSearch] = useState('');
  const [priority, setPriority] = useState<number>();
  const searchValid = !query.trim() || /^[\p{L}\p{N} ]{1,80}$/u.test(query.trim());
  useEffect(() => { const timer = setTimeout(() => setSearch(query.trim()), 300); return () => clearTimeout(timer); }, [query]);
  const { tickets, catalog, loading, error, refresh: loadTickets, more } = useAssignedTickets({
    state: filter === 'ALL' ? undefined : filter, priority, search: searchValid && search ? search : undefined,
  }, true);
  const visible = tickets.filter(ticket => ticket.status !== 'CLOSED');
  const hasActiveFilter = filter !== 'ALL' || Boolean(query.trim()) || priority !== undefined;

  return (
    <Screen refreshing={loading} onRefresh={loadTickets}>
      <AppHeader title="Tickets" subtitle="Assigned to me" compact />

      <View style={styles.intro}>
        <Text style={styles.eyebrow}>MY FIELD QUEUE</Text>
        <View style={styles.introRow}><Text style={styles.heading}>Work to handle</Text><Text style={styles.priorityHint}>Priority first</Text></View>
      </View>

      <View style={styles.search}>
        <Search color={colors.textSubtle} size={19} />
        <TextInput
          accessibilityLabel="Search tickets"
          value={query}
          onChangeText={setQuery}
          placeholder="Search by Ticket title"
          placeholderTextColor={colors.textSubtle}
          returnKeyType="search" maxLength={80}
          style={styles.searchInput}
        />
        {query ? <Pressable accessibilityLabel="Clear search" onPress={() => setQuery('')} style={styles.clearSearch}><X color={colors.textMuted} size={17} /></Pressable> : null}
      </View>

      <ScrollView horizontal contentContainerStyle={styles.filters} showsHorizontalScrollIndicator={false} style={styles.filterScroller}>
        {filters.map((item) => (
          <Pressable key={item.key} onPress={() => setFilter(item.key)} style={[styles.filter, filter === item.key && styles.filterActive]}>
            <Text style={[styles.filterText, filter === item.key && styles.filterTextActive]}>{item.label}</Text>
          </Pressable>
        ))}
      </ScrollView>

      <ScrollView horizontal contentContainerStyle={styles.filters} showsHorizontalScrollIndicator={false} style={styles.filterScroller}>
        <Pressable onPress={() => setPriority(undefined)} style={[styles.filter, priority === undefined && styles.filterActive]}><Text style={styles.filterText}>All priorities</Text></Pressable>
        {catalog.map(p => <Pressable key={p.id} onPress={() => setPriority(p.id)} style={[styles.filter, priority === p.id && styles.filterActive]}><Text style={styles.filterText}>{p.label}</Text></Pressable>)}
      </ScrollView>
      {!searchValid ? <Text style={styles.error}>Search titles with letters, numbers or spaces.</Text> : null}
      <View style={styles.resultRow}>
        <Text style={styles.result}>{visible.length + ' loaded'}</Text>
        {hasActiveFilter ? <Pressable onPress={() => { setFilter('ALL'); setQuery(''); setPriority(undefined); }} style={styles.resetFilter}><RotateCcw color={colors.cyan} size={14} /><Text style={styles.resetText}>Reset</Text></Pressable> : <Text style={styles.resultHint}>Updated queue</Text>}
      </View>

      {error ? (
        <View style={styles.errorBox}><CircleAlert color={colors.red} size={19} /><View style={styles.errorCopy}><Text style={styles.errorTitle}>Tickets unavailable</Text><Text numberOfLines={2} style={styles.error}>{error}</Text></View><Pressable accessibilityLabel="Retry loading tickets" onPress={() => void loadTickets()} style={styles.retry}><RotateCcw color={colors.red} size={17} /></Pressable></View>
      ) : null}

      <View accessibilityLabel="Assigned Ticket results" style={styles.list}>
        {loading && !visible.length ? <View accessibilityLabel="Loading tickets" style={[styles.empty, { minHeight: 125 }]} /> : null}
        {visible.map((ticket) => <TicketCard key={ticket.id} ticket={ticket} onPress={() => router.push(`/(app)/tickets/${ticket.id}`)} />)}
        {more ? <Pressable disabled={loading} onPress={() => void more()} style={styles.emptyAction}><Text style={styles.emptyActionText}>Load more</Text></Pressable> : null}
        {!loading && !error && visible.length === 0 ? (
          <View style={styles.empty}>
            <View style={styles.emptyIcon}><CheckCircle2 color={colors.green} size={25} /></View>
            <Text style={styles.emptyTitle}>{hasActiveFilter ? 'No matching tickets' : 'Your queue is clear'}</Text>
            <Text style={styles.emptyCopy}>{hasActiveFilter ? 'Try another search or reset the active filters.' : 'Pull to refresh your assigned queue.'}</Text>
            {hasActiveFilter ? <Pressable onPress={() => { setFilter('ALL'); setQuery(''); setPriority(undefined); }} style={styles.emptyAction}><Text style={styles.emptyActionText}>Show all active</Text></Pressable> : null}
          </View>
        ) : null}
      </View>
    </Screen>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  intro: { gap: 4 }, eyebrow: { color: colors.cyan, fontSize: 10, fontWeight: '900', letterSpacing: 1.2 }, introRow: { alignItems: 'flex-end', flexDirection: 'row', justifyContent: 'space-between', gap: spacing.md }, heading: { color: colors.text, fontSize: 27, fontWeight: '900' }, priorityHint: { paddingBottom: 4, color: colors.textMuted, fontSize: 11, fontWeight: '700' },
  search: { alignItems: 'center', flexDirection: 'row', gap: spacing.sm, minHeight: 50, paddingHorizontal: spacing.lg, borderRadius: radii.lg, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.panel }, searchInput: { flex: 1, minHeight: 48, color: colors.text, fontSize: 14 }, clearSearch: { alignItems: 'center', justifyContent: 'center', width: 36, height: 36, borderRadius: radii.md, backgroundColor: colors.cardDark },
  filterScroller: { flexGrow: 0, flexShrink: 0, height: 42 }, filters: { alignItems: 'center', gap: spacing.sm, minHeight: 42, paddingRight: spacing.lg }, filter: { alignItems: 'center', justifyContent: 'center', height: 38, paddingHorizontal: spacing.lg, borderRadius: 999, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.panel }, filterActive: { borderColor: colors.cyan, backgroundColor: colors.cyanSoft }, filterText: { color: colors.textMuted, fontSize: 11, fontWeight: '700' }, filterTextActive: { color: colors.cyan, fontWeight: '900' },
  resultRow: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', minHeight: 28 }, result: { color: colors.text, fontSize: 13, fontWeight: '900' }, resultHint: { color: colors.textMuted, fontSize: 11 }, resetFilter: { alignItems: 'center', flexDirection: 'row', gap: 5, minHeight: 36, paddingHorizontal: spacing.sm }, resetText: { color: colors.cyan, fontSize: 11, fontWeight: '800' }, list: { gap: spacing.md },
  errorBox: { alignItems: 'center', flexDirection: 'row', gap: spacing.sm, padding: spacing.md, borderRadius: radii.lg, borderWidth: 1, borderColor: colors.red, backgroundColor: colors.redSoft }, errorCopy: { flex: 1, gap: 2 }, errorTitle: { color: colors.red, fontSize: 12, fontWeight: '900' }, error: { color: colors.textMuted, fontSize: 11 }, retry: { alignItems: 'center', justifyContent: 'center', width: 40, height: 40, borderRadius: radii.md },
  empty: { alignItems: 'center', gap: spacing.sm, paddingHorizontal: spacing.xl, paddingVertical: 42, borderRadius: radii.xl, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.panel }, emptyIcon: { alignItems: 'center', justifyContent: 'center', width: 52, height: 52, borderRadius: 18, backgroundColor: colors.greenSoft }, emptyTitle: { color: colors.text, fontSize: 16, fontWeight: '900' }, emptyCopy: { maxWidth: 280, color: colors.textMuted, fontSize: 12, lineHeight: 18, textAlign: 'center' }, emptyAction: { minHeight: 40, justifyContent: 'center', paddingHorizontal: spacing.lg, borderRadius: radii.md, backgroundColor: colors.cyanSoft }, emptyActionText: { color: colors.cyan, fontSize: 11, fontWeight: '900' },
});
