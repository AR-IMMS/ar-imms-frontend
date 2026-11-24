import { ArrowRight, Clock3, Play } from 'lucide-react-native';
import { useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { localDeadline } from '../api/core-contract';
import { nextAction, type Ticket } from '../api/tickets';
import { useTheme } from '../theme/theme-context';
import { radii, spacing } from '../theme/tokens';
import { ActionButton } from './action-button';
import { DeadlinePicker } from './deadline-picker';
import { StatusPill } from './status-pill';
import { statusTone } from './ticket-card';

export function StatusTransitionConfirmation({ ticket, busy, onCancel, onConfirm }: {
  ticket: Ticket;
  busy: boolean;
  onCancel: () => void;
  onConfirm: (deadline: string) => void;
}) {
  const { colors } = useTheme();
  const { bottom } = useSafeAreaInsets();
  const [deadline, setDeadline] = useState('');
  const action = nextAction(ticket.status);
  if (!action) return null;
  const pending = action.target === 'PENDING';
  const Icon = pending ? Clock3 : Play;
  let validation = '';
  if (pending) {
    try { localDeadline(deadline); }
    catch { validation = 'Choose a future date and time.'; }
  }
  return <Modal visible transparent animationType="none" onRequestClose={() => { if (!busy) onCancel(); }}>
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={[styles.backdrop, { backgroundColor: colors.overlay }]}>
      <View accessibilityViewIsModal style={[styles.sheet, { backgroundColor: colors.panel, paddingBottom: Math.max(bottom, spacing.lg) }]}>
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.content}>
          <View style={styles.row}><View style={[styles.icon, { backgroundColor: colors.cyanSoft }]}><Icon size={22} color={colors.cyan} /></View>
            <Text accessibilityRole="header" style={[styles.heading, { color: colors.text }]}>{action.label}</Text></View>
          <View style={[styles.summary, { backgroundColor: colors.panelSoft }]}>
            <Text style={[styles.number, { color: colors.textMuted }]}>Ticket #{ticket.ticketCode}</Text>
            <Text style={[styles.title, { color: colors.text }]}>{ticket.title}</Text>
            <View style={styles.row}><StatusPill label={ticket.status} tone={statusTone(ticket.status)} />
              <ArrowRight accessibilityLabel="changes to" size={16} color={colors.textMuted} />
              <StatusPill label={action.target} tone={statusTone(action.target)} /></View>
          </View>
          <Text style={[styles.copy, { color: colors.textMuted }]}>{pending ? 'Pause work on this Ticket until the local deadline you select.' : ticket.status === 'NEW' ? 'Start working on this Ticket and move it to Open.' : 'Resume work on this pending Ticket and move it back to Open.'}</Text>
          {pending ? <View pointerEvents={busy ? 'none' : 'auto'}><DeadlinePicker value={deadline} onChange={setDeadline} /></View> : null}
          {deadline && validation ? <Text accessibilityLiveRegion="polite" style={{ color: colors.red }}>{validation}</Text> : null}
          <ActionButton label={busy ? 'Updating Ticket…' : action.label} disabled={busy || Boolean(validation)} onPress={() => onConfirm(deadline)} />
          <ActionButton label="Cancel" variant="secondary" disabled={busy} onPress={onCancel} />
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  </Modal>;
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: 'flex-end', alignItems: 'center' },
  sheet: { width: '100%', maxWidth: 520, maxHeight: '92%', borderTopLeftRadius: radii.xl, borderTopRightRadius: radii.xl },
  content: { gap: spacing.md, padding: spacing.lg },
  row: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: spacing.sm },
  icon: { width: 40, height: 40, borderRadius: radii.md, alignItems: 'center', justifyContent: 'center' },
  heading: { fontSize: 22, fontWeight: '700' },
  summary: { padding: spacing.lg, borderRadius: radii.md, gap: spacing.sm },
  number: { fontSize: 13, fontWeight: '600', fontVariant: ['tabular-nums'] },
  title: { fontSize: 18, lineHeight: 24, fontWeight: '700' },
  copy: { fontSize: 15, lineHeight: 22 },
});
