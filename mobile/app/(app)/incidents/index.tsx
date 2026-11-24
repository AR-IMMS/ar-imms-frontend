import { router } from 'expo-router';
import { AlertTriangle, ShieldAlert, Siren } from 'lucide-react-native';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { listIncidents } from '../../../src/api/incidents';
import { useAuth } from '../../../src/auth/auth-context';
import { BrandHeader } from '../../../src/components/brand-header';
import { CyberCard } from '../../../src/components/cyber-card';
import { DashboardCard } from '../../../src/components/dashboard-card';
import { MetricCoin } from '../../../src/components/metric-coin';
import { Screen } from '../../../src/components/screen';
import { StatusPill } from '../../../src/components/status-pill';
import { colors, spacing, typography } from '../../../src/theme/tokens';
import type { IncidentProps, IncidentSeverity } from '../../../src/types/incident';

function severityTone(severity: IncidentSeverity) {
  if (severity === 'CRITICAL') return 'red';
  if (severity === 'HIGH') return 'amber';
  if (severity === 'MEDIUM') return 'cyan';
  return 'green';
}

export default function IncidentListScreen() {
  const { session } = useAuth();
  const [incidents, setIncidents] = useState<IncidentProps[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const criticalCount = useMemo(
    () => incidents.filter((incident) => incident.severity === 'CRITICAL').length,
    [incidents],
  );

  const accessToken = session?.accessToken;
  const loadIncidents = useCallback(async () => {
    if (!accessToken) return;
    setLoading(true);
    setError(null);

    try {
      setIncidents(await listIncidents(accessToken));
    } catch (caught) {
      setIncidents([]);
      setError(caught instanceof Error ? caught.message : 'Could not load incidents.');
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    const task = setTimeout(() => { void loadIncidents(); }, 0);
    return () => clearTimeout(task);
  }, [loadIncidents]);

  return (
    <Screen refreshing={loading} onRefresh={loadIncidents}>
      <BrandHeader
        eyebrow="Data territory"
        title="Incident flow"
        subtitle="Open operational context before dispatching field work."
      />

      <DashboardCard title="Control overview" action={loading ? 'Syncing' : 'More >'}>
        <View style={styles.metricsRow}>
          <MetricCoin icon={Siren} label="Incidents" value={`${incidents.length}`} />
          <MetricCoin icon={ShieldAlert} label="Critical" value={`${criticalCount}`} tone="purple" />
          <MetricCoin icon={AlertTriangle} label="Tickets" value="Flow" tone="amber" />
        </View>
      </DashboardCard>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <View style={styles.list}>
        {!error && incidents.length === 0 ? (
          <Text style={styles.empty}>No incidents found.</Text>
        ) : null}
        {incidents.map((incident, index) => (
          <Pressable
            key={incident.id}
            onPress={() => router.push(`/(app)/incidents/${incident.id}`)}
          >
            <CyberCard compact style={styles.incidentCard}>
              <View style={styles.cardTop}>
                <View style={[styles.iconBubble, bubbleStyle(index)]}>
                  <Siren color={colors.text} size={18} />
                </View>
                <View style={styles.titleBlock}>
                  <Text style={styles.code}>{incident.incidentCode}</Text>
                  <Text numberOfLines={1} style={styles.title}>
                    {incident.title}
                  </Text>
                </View>
                <StatusPill label={incident.severity} tone={severityTone(incident.severity)} />
              </View>
              <Text numberOfLines={2} style={styles.description}>
                {incident.description ?? 'No incident description recorded.'}
              </Text>
              <View style={styles.pills}>
                <StatusPill label={incident.status} tone="purple" />
                <StatusPill label={`${incident.ticketCount} tickets`} tone="cyan" />
              </View>
            </CyberCard>
          </Pressable>
        ))}
      </View>
    </Screen>
  );
}

function bubbleStyle(index: number) {
  const colorsByIndex = [colors.cyanSoft, colors.purpleSoft, colors.amberSoft, colors.redSoft];
  return { backgroundColor: colorsByIndex[index % colorsByIndex.length] };
}

const styles = StyleSheet.create({
  metricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  list: {
    gap: spacing.md,
  },
  incidentCard: {
    gap: spacing.sm,
  },
  cardTop: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
  },
  iconBubble: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 42,
    height: 42,
    borderRadius: 16,
  },
  titleBlock: {
    flex: 1,
  },
  code: {
    color: colors.textSubtle,
    fontSize: typography.micro,
    fontWeight: '900',
  },
  title: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '900',
  },
  description: {
    color: colors.textMuted,
    fontSize: 12,
    lineHeight: 18,
  },
  pills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  error: {
    color: colors.amber,
    fontSize: 13,
    fontWeight: '700',
  },
  empty: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
  },
});
