import { router, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Link2, ShieldAlert } from 'lucide-react-native';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { getIncident } from '../../../src/api/incidents';
import { useAuth } from '../../../src/auth/auth-context';
import { CyberCard } from '../../../src/components/cyber-card';
import { Screen } from '../../../src/components/screen';
import { StatusPill } from '../../../src/components/status-pill';
import { useTheme } from '../../../src/theme/theme-context';
import { radii, spacing, type ThemeColors } from '../../../src/theme/tokens';
import type { IncidentProps } from '../../../src/types/incident';

export default function IncidentDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>(); const { session } = useAuth(); const { colors } = useTheme(); const styles = useMemo(() => createStyles(colors), [colors]); const [incident, setIncident] = useState<IncidentProps | null>(null); const [loading, setLoading] = useState(false);
  const accessToken = session?.accessToken;
  const load = useCallback(async () => {
    if (!accessToken || !id) return;
    setLoading(true);
    try {
      setIncident(await getIncident(id, accessToken));
    } catch (caught) {
      Alert.alert('Incident unavailable', caught instanceof Error ? caught.message : 'Could not load incident.');
    } finally {
      setLoading(false);
    }
  }, [id, accessToken]);
  useEffect(() => {
    const task = setTimeout(() => { void load(); }, 0);
    return () => clearTimeout(task);
  }, [load]);
  return <Screen refreshing={loading} onRefresh={load}><View style={styles.header}><Pressable onPress={() => router.back()} style={styles.back}><ArrowLeft color={colors.text} size={20} /></Pressable><Text style={styles.headerTitle}>Incident context</Text><View style={styles.back}><ShieldAlert color={colors.purple} size={19} /></View></View>{incident ? <><View style={styles.hero}><Text style={styles.code}>{incident.incidentCode}</Text><Text style={styles.title}>{incident.title}</Text><Text style={styles.description}>{incident.description ?? 'No incident description recorded.'}</Text><View style={styles.pills}><StatusPill label={incident.severity} tone={incident.severity === 'CRITICAL' ? 'red' : 'amber'} /><StatusPill label={incident.status} tone="purple" /></View></View><CyberCard><View style={styles.sectionRow}><View style={styles.linkIcon}><Link2 color={colors.cyan} size={19} /></View><View><Text style={styles.sectionTitle}>Linked field work</Text><Text style={styles.sectionCopy}>{incident.ticketIds.length} tickets created from this incident</Text></View></View>{incident.ticketIds.map((ticketId) => <Pressable key={ticketId} onPress={() => router.push(`/(app)/tickets/${ticketId}`)} style={styles.ticketLink}><Text style={styles.ticketText}>{ticketId}</Text><Text style={styles.open}>Open</Text></Pressable>)}</CyberCard></> : <CyberCard><Text style={styles.description}>Loading incident context…</Text></CyberCard>}</Screen>;
}
const createStyles = (colors: ThemeColors) => StyleSheet.create({ header: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' }, back: { alignItems: 'center', justifyContent: 'center', width: 42, height: 42, borderRadius: radii.lg, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.panel }, headerTitle: { color: colors.text, fontSize: 15, fontWeight: '900' }, hero: { gap: spacing.md, padding: spacing.xl, borderRadius: radii.xxl, backgroundColor: colors.hero }, code: { color: '#9FB7FF', fontSize: 9, fontWeight: '900', letterSpacing: 1 }, title: { color: '#FFFFFF', fontSize: 25, fontWeight: '900', lineHeight: 31 }, description: { color: colors.textMuted, fontSize: 12, lineHeight: 19 }, pills: { flexDirection: 'row', gap: spacing.sm }, sectionRow: { alignItems: 'center', flexDirection: 'row', gap: spacing.md }, linkIcon: { alignItems: 'center', justifyContent: 'center', width: 42, height: 42, borderRadius: 15, backgroundColor: colors.cyanSoft }, sectionTitle: { color: colors.text, fontSize: 14, fontWeight: '900' }, sectionCopy: { marginTop: 3, color: colors.textMuted, fontSize: 10 }, ticketLink: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', padding: spacing.md, borderRadius: radii.lg, backgroundColor: colors.cardDark }, ticketText: { color: colors.text, fontSize: 11, fontWeight: '800' }, open: { color: colors.cyan, fontSize: 10, fontWeight: '900' } });
