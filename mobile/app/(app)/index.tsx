import { router } from 'expo-router';
import { ArrowRight, CheckCircle2, CircleAlert, Clock3, QrCode, RotateCcw } from 'lucide-react-native';
import { useMemo } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { useAssignedTickets } from '../../src/api/use-assigned-tickets';
import { useAuth } from '../../src/auth/auth-context';
import { AppHeader } from '../../src/components/app-header';
import { CyberCard } from '../../src/components/cyber-card';
import { Screen } from '../../src/components/screen';
import { PriorityBars, TicketStatusChart } from '../../src/components/ticket-charts';
import { TicketCard } from '../../src/components/ticket-card';
import { useTheme } from '../../src/theme/theme-context';
import { radii, spacing, type ThemeColors } from '../../src/theme/tokens';
import type { Ticket } from '../../src/api/tickets';

export default function OverviewScreen() {
  const { session } = useAuth();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { tickets, loading, error, refresh: loadDashboard } = useAssignedTickets();
  const myTickets = tickets.filter(ticket => ticket.status !== 'CLOSED');
  const nextTickets = [...myTickets].sort((a, b) => urgency(b) - urgency(a) || Date.parse(b.updatedAt) - Date.parse(a.updatedAt)).slice(0, 3);
  const urgent = myTickets.filter(ticket => urgency(ticket) >= 3).length;
  const completed = tickets.filter(ticket => ticket.status === 'CLOSED').length;

  return (
    <Screen refreshing={loading} onRefresh={loadDashboard}>
      <AppHeader />
      <View style={styles.headingRow}>
        <View style={styles.headingCopy}>
          <Text style={styles.heading}>Good day, {firstName(session?.user.fullName)}</Text>
          <Text style={styles.headingSubtitle}>{formatDate()}</Text>
        </View>
      </View>

      {error ? (
        <View style={styles.errorBox}>
          <CircleAlert color={colors.red} size={19} />
          <View style={styles.errorCopy}><Text style={styles.errorTitle}>Workspace could not sync</Text><Text numberOfLines={2} style={styles.error}>{error}</Text></View>
          <Pressable accessibilityLabel="Retry dashboard sync" onPress={() => void loadDashboard()} style={styles.retry}><RotateCcw color={colors.red} size={17} /></Pressable>
        </View>
      ) : null}

      {loading && !tickets.length ? <CyberCard><ActivityIndicator accessibilityLabel="Loading assignments" color={colors.cyan} /></CyberCard> : null}
      {!error && (!loading || tickets.length > 0) ? <>
      <View style={styles.hero}>
        <View style={styles.heroTop}>
          <View style={styles.livePill}><Text style={styles.liveText}>ASSIGNED WORK</Text></View>
          <Text style={styles.heroCount}>{myTickets.length ? `${myTickets.length} active` : 'Available'}</Text>
        </View>
        <Text style={styles.heroTitle}>{myTickets.length ? 'Your queue is ready' : 'No assigned work'}</Text>
        <Text style={styles.heroCopy}>{myTickets.length ? nextActionCopy(nextTickets[0], urgent) : 'You are available for a new assignment or an asset scan.'}</Text>
        <Pressable
          onPress={() => myTickets.length ? router.push(`/(app)/tickets/${nextTickets[0].id}`) : router.push('/(app)/ar/scan')}
          style={({ pressed }) => [styles.heroAction, pressed && styles.pressed]}
        >
          {myTickets.length ? <Clock3 color="#FFFFFF" size={17} /> : <QrCode color="#FFFFFF" size={17} />}
          <Text style={styles.heroActionText}>{myTickets.length ? 'Open next ticket' : 'Scan an asset'}</Text>
          <ArrowRight color="#FFFFFF" size={16} />
        </Pressable>
        <View style={styles.heroStats}>
          <HeroStat icon={Clock3} label="Active (loaded)" value={myTickets.length} />
          <HeroStat icon={CircleAlert} label="Urgent (loaded)" value={urgent} />
          <HeroStat icon={CheckCircle2} label="Closed (loaded)" value={completed} last />
        </View>
      </View>

      <SectionHeader title="My next tickets" subtitle="Ordered by operational priority" action="View all" onPress={() => router.push('/(app)/tickets')} />
      <View style={styles.list}>
        {nextTickets.length ? nextTickets.map((ticket) => <TicketCard key={ticket.id} ticket={ticket} onPress={() => router.push(`/(app)/tickets/${ticket.id}`)} />) : <EmptyAssignment onScan={() => router.push('/(app)/ar/scan')} />}
      </View>

      <SectionHeader title="Ticket flow" subtitle="From loaded assignments" />
      <CyberCard><TicketStatusChart tickets={tickets} /></CyberCard>
      {myTickets.length ? <><SectionHeader title="Priority pressure" subtitle="From loaded assignments" /><CyberCard><PriorityBars tickets={myTickets} /></CyberCard></> : null}
      </> : null}
    </Screen>
  );

  function HeroStat({ icon: Icon, label, value, last }: { icon: typeof Clock3; label: string; value: number; last?: boolean }) {
    return <View style={[styles.heroStat, last && styles.heroStatLast]}><Icon color="#AFC1FF" size={16} /><View><Text style={styles.heroStatValue}>{value}</Text><Text style={styles.heroStatLabel}>{label}</Text></View></View>;
  }
  function EmptyAssignment({ onScan }: { onScan: () => void }) {
    return <View style={styles.empty}><View style={styles.emptyIcon}><CheckCircle2 color={colors.green} size={24} /></View><View style={styles.emptyCopy}><Text style={styles.emptyTitle}>You are available</Text><Text style={styles.emptyText}>No active tickets are assigned to you.</Text></View><Pressable onPress={onScan} style={styles.emptyAction}><QrCode color={colors.cyan} size={16} /><Text style={styles.emptyActionText}>Scan asset</Text></Pressable></View>;
  }
}

function SectionHeader({ title, subtitle, action, onPress }: { title: string; subtitle?: string; action?: string; onPress?: () => void }) {
  const { colors } = useTheme();
  return <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', gap: 12 }}><View style={{ flex: 1 }}><Text style={{ color: colors.text, fontSize: 20, fontWeight: '900' }}>{title}</Text>{subtitle ? <Text style={{ color: colors.textMuted, fontSize: 12, marginTop: 3 }}>{subtitle}</Text> : null}</View>{action ? <Pressable accessibilityRole="button" onPress={onPress} style={{ flexDirection: 'row', alignItems: 'center', gap: 4, minHeight: 36 }}><Text style={{ color: colors.cyan, fontSize: 12, fontWeight: '800' }}>{action}</Text><ArrowRight color={colors.cyan} size={15} /></Pressable> : null}</View>;
}

function urgency(ticket: Ticket) { return { neutral: 0, green: 1, cyan: 2, amber: 3, critical: 4 }[ticket.priorityColor]; }
function nextActionCopy(ticket: Ticket | undefined, urgent: number) {
  if (urgent) return urgent + ' urgent assignments in the loaded queue.';
  return ticket ? 'Continue with ' + ticket.ticketCode + ' when ready.' : '';
}
function firstName(name?: string) { return name?.trim().split(/\s+/).slice(-1)[0] ?? 'Technician'; }
function formatDate() { return new Intl.DateTimeFormat('en', { weekday: 'long', day: '2-digit', month: 'short' }).format(new Date()); }

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  headingRow: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' }, headingCopy: { flex: 1 }, eyebrow: { color: colors.cyan, fontSize: 10, fontWeight: '900', letterSpacing: 1.2 }, heading: { marginTop: 4, color: colors.text, fontSize: 24, fontWeight: '700' }, headingSubtitle: { marginTop: 4, color: colors.textMuted, fontSize: 12, fontWeight: '600' },
  errorBox: { alignItems: 'center', flexDirection: 'row', gap: spacing.sm, padding: spacing.md, borderRadius: radii.lg, borderWidth: 1, borderColor: colors.red, backgroundColor: colors.redSoft }, errorCopy: { flex: 1, gap: 2 }, errorTitle: { color: colors.red, fontSize: 12, fontWeight: '900' }, error: { color: colors.textMuted, fontSize: 11 }, retry: { alignItems: 'center', justifyContent: 'center', width: 40, height: 40, borderRadius: radii.md },
  hero: { gap: spacing.md, padding: spacing.xl, overflow: 'hidden', borderRadius: radii.xxl, backgroundColor: colors.hero }, heroTop: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' }, livePill: { alignItems: 'center', flexDirection: 'row', gap: 6, paddingHorizontal: 9, paddingVertical: 6, borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.09)' }, liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#4BE0A5' }, liveText: { color: '#C7D4EE', fontSize: 11, fontWeight: '700', letterSpacing: 0.7 }, heroCount: { color: '#AFC1E8', fontSize: 11, fontWeight: '800' }, heroTitle: { color: '#FFFFFF', fontSize: 25, fontWeight: '700' }, heroCopy: { color: '#C5D0E8', fontSize: 13, lineHeight: 19 }, heroAction: { alignItems: 'center', alignSelf: 'flex-start', flexDirection: 'row', gap: spacing.sm, minHeight: 44, paddingHorizontal: spacing.lg, borderRadius: radii.md, backgroundColor: colors.blue }, heroActionText: { color: '#FFFFFF', fontSize: 12, fontWeight: '900' }, pressed: { opacity: 0.82, transform: [{ scale: 0.99 }] },
  heroStats: { flexDirection: 'row', paddingTop: spacing.xs, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.1)' }, heroStat: { alignItems: 'flex-start', flex: 1, paddingHorizontal: 6, gap: 4, paddingTop: spacing.md, borderRightWidth: 1, borderRightColor: 'rgba(255,255,255,0.1)' }, heroStatLast: { borderRightWidth: 0 }, heroStatValue: { color: '#FFFFFF', fontSize: 15, fontWeight: '900' }, heroStatLabel: { color: '#8EA5D6', fontSize: 11 },
  list: { gap: spacing.md }, empty: { alignItems: 'center', flexDirection: 'row', gap: spacing.md, padding: spacing.lg, borderRadius: radii.xl, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.panel }, emptyIcon: { alignItems: 'center', justifyContent: 'center', width: 48, height: 48, borderRadius: 17, backgroundColor: colors.greenSoft }, emptyCopy: { flex: 1, gap: 3 }, emptyTitle: { color: colors.text, fontSize: 14, fontWeight: '900' }, emptyText: { color: colors.textMuted, fontSize: 11 }, emptyAction: { alignItems: 'center', flexDirection: 'row', gap: 5, minHeight: 40, paddingHorizontal: spacing.sm }, emptyActionText: { color: colors.cyan, fontSize: 10, fontWeight: '900' },
  teamList: { overflow: 'hidden', borderRadius: radii.xl, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.panel }, teamRow: { alignItems: 'center', flexDirection: 'row', gap: spacing.md, padding: spacing.lg, borderBottomWidth: 1, borderBottomColor: colors.border }, teamRowLast: { borderBottomWidth: 0 }, teamAvatar: { alignItems: 'center', justifyContent: 'center', width: 44, height: 44, borderRadius: 16, backgroundColor: colors.purpleSoft }, teamInitial: { color: colors.purple, fontSize: 12, fontWeight: '900' }, teamCopy: { flex: 1, gap: 3 }, teamNameRow: { alignItems: 'center', flexDirection: 'row', gap: spacing.sm }, teamName: { flex: 1, color: colors.text, fontSize: 13, fontWeight: '900' }, teamMetrics: { color: colors.text, fontSize: 10, fontWeight: '700' }, teamTask: { color: colors.textMuted, fontSize: 10 }, workloadPill: { alignItems: 'center', flexDirection: 'row', gap: 4, paddingHorizontal: 8, paddingVertical: 5, borderRadius: 999 }, workloadDot: { width: 5, height: 5, borderRadius: 3 }, workloadLabel: { fontSize: 11, fontWeight: '700' }, teamEmpty: { alignItems: 'center', flexDirection: 'row', gap: spacing.md, padding: spacing.lg }, teamEmptyCopyWrap: { flex: 1 }, teamEmptyTitle: { color: colors.text, fontSize: 13, fontWeight: '800' }, teamEmptyCopy: { marginTop: 3, color: colors.textMuted, fontSize: 11 },
});
