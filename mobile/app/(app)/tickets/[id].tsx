import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import type { File } from 'expo-file-system';
import { ArrowLeft, Box, Camera, Check, Clock3, MessageSquare, ScanLine, X } from 'lucide-react-native';
import { useCallback, useMemo, useRef, useState } from 'react';
import { Alert, AppState, Image, Modal, Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { apiConfig } from '../../../src/api/config';
import { ApiRequestError } from '../../../src/api/client';
import { localDeadline } from '../../../src/api/core-contract';
import {
  evidenceList, prepareEvidence, retrieveEvidence, shareEvidence, transferEvidence, type StagedUpload,
} from '../../../src/api/evidence';
import { operationStorageKey, readOperation, submitOperation, type PendingMutation } from '../../../src/api/ticket-mutations';
import {
  articles, assetName, getTicket, links, nextAction, priorities, type Article, type EvidenceItem, type Ticket,
} from '../../../src/api/tickets';
import { openWebAr } from '../../../src/ar/open-webar';
import { useAuth } from '../../../src/auth/auth-context';
import { ActionButton } from '../../../src/components/action-button';
import { CyberCard } from '../../../src/components/cyber-card';
import { DeadlinePicker } from '../../../src/components/deadline-picker';
import { FieldInput } from '../../../src/components/field-input';
import { Screen } from '../../../src/components/screen';
import { StatusPill } from '../../../src/components/status-pill';
import { priorityColors, statusTone } from '../../../src/components/ticket-card';
import { useTheme } from '../../../src/theme/theme-context';
import { radii, spacing, type ThemeColors } from '../../../src/theme/tokens';

function unavailable(error: unknown) {
  return error instanceof ApiRequestError && [401, 403, 404].includes(error.status ?? 0);
}
function description(error: unknown) {
  return error instanceof Error ? error.message : 'Core did not complete this request.';
}
function remove(file: File | null) {
  try { if (file?.exists) file.delete(); } catch { /* The OS can evict cache files. */ }
}

type Detail = {
  ticket: Ticket;
  context: Awaited<ReturnType<typeof links>> | null;
  assets: { id: string; name: string }[];
  notes: Awaited<ReturnType<typeof articles>> | null;
  files: Awaited<ReturnType<typeof evidenceList>> | null;
};

export default function TicketDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { session } = useAuth();
  return <TicketDetail key={(session?.user.id ?? '') + ':' + id} id={id} />;
}

function TicketDetail({ id }: { id: string }) {
  const { session, core, can } = useAuth();
  const actor = session?.user.id;
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const canWork = can('ticket:work');
  const key = actor && id ? operationStorageKey(core.base, actor, id) : '';
  const [detail, setDetail] = useState<Detail | null>(null);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [note, setNote] = useState('');
  const [deadline, setDeadline] = useState('');
  const [preview, setPreview] = useState<File | null>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const [pending, setPending] = useState<PendingMutation | null>(null);
  const [staged, setStaged] = useState<StagedUpload | null>(null);
  const previewFile = useRef<File | null>(null);
  const inFlight = useRef(false);
  const focused = useRef(false);
  const generation = useRef(0);
  const focusVersion = useRef(0);
  const closePreview = useCallback(() => {
    remove(previewFile.current); previewFile.current = null; setPreview(null);
  }, []);

  const load = useCallback(async () => {
    if (!id || !actor || !focused.current) return;
    const version = ++generation.current;
    setDetail(null);
    setLoading(true);
    setError('');
    try {
      const metadata = await priorities(core).catch(() => []);
      const ticket = await getTicket(core, id, metadata, apiConfig.ticketStateIds);
      const [context, notes, files, receipt] = await Promise.all([
        links(core, id).catch(error => { if (unavailable(error)) throw error; return null; }),
        articles(core, id).catch(error => { if (unavailable(error)) throw error; return null; }),
        evidenceList(core, id).catch(error => { if (unavailable(error)) throw error; return null; }),
        readOperation(key),
      ]);
      const assets = await Promise.all((context?.assets ?? []).map(async asset => ({
        id: asset, name: can('asset:read') ? await assetName(core, asset).catch(() => asset) : asset,
      })));
      if (version === generation.current && focused.current) {
        setDetail({ ticket, context, notes, assets, files });
        setPending(receipt);
      }
    } catch (error) {
      if (version === generation.current && focused.current) {
        setDetail(null); closePreview(); setError(description(error));
      }
    } finally {
      if (version === generation.current && focused.current) setLoading(false);
    }
  }, [actor, id, core, key, closePreview, can]);
  useFocusEffect(useCallback(() => {
    focused.current = true;
    focusVersion.current++;
    void load();
    const wake = AppState.addEventListener('change', state => {
      closePreview();
      if (state === 'active') void load();
      else { generation.current++; focusVersion.current++; setDetail(null); }
    });
    return () => {
      focused.current = false; generation.current++; focusVersion.current++;
      setDetail(null); closePreview();
      wake.remove();
    };
  }, [load, closePreview]));

  const run = async (action: () => Promise<void>) => {
    if (inFlight.current) return;
    const scope = focusVersion.current;
    inFlight.current = true; setBusy(true); setMessage('');
    try { await action(); }
    catch (error) {
      if (scope === focusVersion.current && focused.current) {
        if (unavailable(error)) { setDetail(null); closePreview(); setError(description(error)); }
        else setMessage(description(error));
        setPending(await readOperation(key).catch(() => null));
      }
    } finally {
      inFlight.current = false; setBusy(false); setProgress(null);
    }
  };

  async function mutate(kind: PendingMutation['kind'], payload: PendingMutation['payload'], retry?: PendingMutation) {
    if (!id || !actor || !detail || !canWork) return;
    // A replay must retain the saved payload even after a state read shows it may have applied.
    await getTicket(core, id, [], apiConfig.ticketStateIds).then(fresh => {
      if (!retry && kind === 'status' && fresh.status !== detail.ticket.status) throw new Error('The state changed. Refresh the Ticket.');
    });
    await submitOperation(core, key, actor, id, kind, payload, retry);
    setPending(null);
    if (kind === 'articles') setNote('');
    if (kind === 'status') setDeadline('');
    if (kind === 'evidence/finalize') setStaged(null);
    await load();
    setMessage('Core confirmed the update.');
  }
  function confirmProgress() {
    const action = detail && nextAction(detail.ticket.status);
    if (!action) return;
    const confirm = () => void run(async () => {
      const payload = action.target === 'PENDING' ? { state: action.target, pending_until: localDeadline(deadline) } : { state: action.target };
      await mutate('status', payload);
    });
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      if (window.confirm(action.label + ' in Core?')) confirm();
      return;
    }
    Alert.alert(action.label, 'Update this Ticket in Core?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Confirm', onPress: confirm },
    ]);
  }

  async function upload(source: 'camera' | 'photos' | 'pdf' | 'retry') {
    if (!id || !detail?.files?.enabled || !canWork || pending) return;
    let next = staged;
    if (source !== 'retry') {
      if (source === 'pdf') {
        const result = await DocumentPicker.getDocumentAsync({ type: 'application/pdf', copyToCacheDirectory: true });
        if (result.canceled) return;
        const item = result.assets[0];
        next = await prepareEvidence(core, id, { uri: item.uri, name: item.name, mime: item.mimeType, size: item.size });
      } else {
        const permission = source === 'camera' ? await ImagePicker.requestCameraPermissionsAsync() : await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!permission.granted) throw new Error('Allow camera or photo access to attach Evidence.');
        const result = source === 'camera' ? await ImagePicker.launchCameraAsync({ quality: 0.85 }) : await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.85 });
        if (result.canceled) return;
        const item = result.assets[0];
        next = await prepareEvidence(core, id, { uri: item.uri, name: item.fileName ?? 'field-photo.jpg', mime: item.mimeType, size: item.fileSize });
      }
    }
    if (!next) return;
    setStaged(next);
    setProgress(0);
    await transferEvidence(core, id, next, setProgress);
    await mutate('evidence/finalize', { grant: next.grant });
  }
  async function viewEvidence(item: EvidenceItem, inline: boolean) {
    if (!id) return;
    const scope = focusVersion.current;
    await getTicket(core, id, [], apiConfig.ticketStateIds);
    const file = await retrieveEvidence(core, id, item, inline);
    if (!focused.current || scope !== focusVersion.current) { remove(file); return; }
    if (inline) {
      closePreview();
      previewFile.current = file;
      setPreview(file);
    } else {
      try { await shareEvidence(file, item.mime); }
      finally { remove(file); }
    }
  }
  async function moreNotes(previous: Article[], cursor: string) {
    if (!id || !detail) return;
    const page = await articles(core, id, cursor);
    setDetail(current => current?.ticket.id === id ? { ...current, notes: { ...page, items: [...previous, ...page.items] } } : current);
  }
  async function moreEvidence(previous: EvidenceItem[], cursor: string) {
    if (!id || !detail) return;
    const page = await evidenceList(core, id, cursor);
    setDetail(current => current?.ticket.id === id ? { ...current, files: { ...page, items: [...previous, ...page.items] } } : current);
  }

  const ticket = detail?.ticket;
  const action = ticket && nextAction(ticket.status);
  const priority = ticket && priorityColors(ticket.priorityColor, colors);
  return (
    <Screen refreshing={loading} onRefresh={load}>
      <DetailHeader title={ticket?.ticketCode ?? 'Ticket details'} styles={styles} colors={colors} />
      {!detail || !ticket ? (
        <CyberCard>
          <Text style={styles.muted}>{loading ? 'Loading field workflow...' : error || 'Ticket unavailable.'}</Text>
          {!loading ? <ActionButton label="Retry" variant="secondary" onPress={() => void load()} /> : null}
        </CyberCard>
      ) : (
        <>
          <View style={styles.titleBlock}>
            <View style={styles.pills}>
              <Text style={{ color: priority?.color, backgroundColor: priority?.soft, padding: 6 }}>{ticket.priority}</Text>
              <StatusPill label={ticket.status === 'UNKNOWN' ? 'Unknown state' : ticket.status} tone={statusTone(ticket.status)} />
            </View>
            <Text style={styles.title}>{ticket.title}</Text>
            <Text style={styles.description}>Created {formatDate(ticket.createdAt)} / Updated {formatDate(ticket.updatedAt)}</Text>
          </View>
          <CyberCard>
            <Text style={styles.sectionTitle}>Related Assets</Text>
            {!detail.context ? <Text style={styles.muted}>Links unavailable. Pull to refresh.</Text> : null}
            {detail.context && !detail.assets.length ? <Text style={styles.muted}>No linked Assets.</Text> : null}
            {detail.assets.map(asset => (
              <View key={asset.id} style={styles.assetCard}><Box color={colors.cyan} size={20} />
                <View style={styles.assetCopy}><Text style={styles.assetTitle}>{asset.name}</Text>
                  {asset.name !== asset.id ? <Text style={styles.assetLabel}>{asset.id}</Text> : null}
                </View>
              </View>
            ))}
            {detail.context?.incident ? <Text style={styles.muted}>Incident: {detail.context.incident}</Text> : null}
            {detail.context?.maintenance.map(value => <Text key={value} style={styles.muted}>Maintenance: {value}</Text>)}
          </CyberCard>
          <CyberCard>
            <Text style={styles.sectionTitle}>Work progress</Text>
            <View style={styles.steps}>
              {['NEW', 'OPEN', 'PENDING', 'CLOSED'].map(state => (
                <View key={state} style={styles.step}>
                  <View style={[styles.stepDot, state === ticket.status && styles.stepDotDone]}>{state === ticket.status ? <Check color="#FFFFFF" size={13} /> : null}</View>
                  <Text style={styles.stepLabel}>{state}</Text>
                </View>
              ))}
            </View>
            <View style={styles.timeRow}><Clock3 color={colors.textMuted} size={14} /><Text style={styles.timeText}>{formatDate(ticket.updatedAt)}</Text></View>
            {canWork && action ? (
              <>
                {action.target === 'PENDING' ? <DeadlinePicker value={deadline} onChange={setDeadline} /> : null}
                <ActionButton label={action.label} disabled={busy || Boolean(pending)} onPress={confirmProgress} />
              </>
            ) : null}
          </CyberCard>
          {apiConfig.webarUrl ? (
            <Pressable accessibilityRole="button" style={styles.arAction} onPress={() => void run(() => openWebAr())}>
              <ScanLine color="#FFFFFF" size={22} /><Text style={styles.arTitle}>Open WebAR</Text>
            </Pressable>
          ) : null}
          {pending ? (
            <CyberCard>
              <Text style={styles.muted}>An update is unresolved. Retry the saved request with its original key.</Text>
              <ActionButton disabled={busy || !canWork} label="Retry same request" onPress={() => void run(() => mutate(pending.kind, pending.payload, pending))} />
            </CyberCard>
          ) : null}
          {message ? <Text accessibilityLiveRegion="polite" style={styles.muted}>{message}</Text> : null}
          <CyberCard>
            <View style={styles.sectionHeader}><Text style={styles.sectionTitle}>Field updates</Text><MessageSquare color={colors.cyan} size={20} /></View>
            {canWork ? <>
              <FieldInput label="Add a work note" multiline maxLength={4000} value={note} onChangeText={setNote} style={styles.commentInput} />
              <ActionButton disabled={busy || !note.trim() || Boolean(pending)} label="Post update" variant="secondary" onPress={() => void run(() => mutate('articles', { body: note.trim() }))} />
            </> : null}
            {detail.notes ? (
              <View style={styles.timeline}>
                {detail.notes.items.map(item => <View key={item.id} style={styles.timelineItem}><View style={styles.timelineDot} /><View style={styles.timelineCopy}><Text style={styles.comment}>{item.body ?? 'Internal note'}</Text><Text style={styles.commentMeta}>{formatDate(item.createdAt)}</Text></View></View>)}
                {!detail.notes.items.length ? <Text style={styles.muted}>No internal notes on the loaded page.</Text> : null}
                {detail.notes.nextCursor ? <ActionButton label="Load more notes" disabled={busy} variant="secondary" onPress={() => void run(() => moreNotes(detail.notes!.items, detail.notes!.nextCursor!))} /> : null}
              </View>
            ) : <Text style={styles.muted}>Notes unavailable. Pull to refresh.</Text>}
          </CyberCard>
          <CyberCard>
            <View style={styles.sectionHeader}><Text style={styles.sectionTitle}>Evidence</Text><Camera color={colors.cyan} size={20} /></View>
            {detail.files ? <>
              {detail.files.items.map(item => (
                <View key={item.id} style={styles.assetCard}>
                  <View style={styles.assetCopy}><Text style={styles.assetTitle}>{item.name}</Text><Text style={styles.assetLabel}>{formatDate(item.createdAt)}</Text></View>
                  {item.mime.startsWith('image/') ? <Pressable disabled={busy} accessibilityRole="button" onPress={() => void run(() => viewEvidence(item, true))}><Text style={styles.sectionSubtitle}>Preview</Text></Pressable> : null}
                  <Pressable disabled={busy} accessibilityRole="button" onPress={() => void run(() => viewEvidence(item, false))}><Text style={styles.sectionSubtitle}>Download</Text></Pressable>
                </View>
              ))}
              {!detail.files.items.length ? <Text style={styles.muted}>No Evidence on the loaded page.</Text> : null}
              {detail.files.nextCursor ? <ActionButton label="Load more Evidence" disabled={busy} variant="secondary" onPress={() => void run(() => moreEvidence(detail.files!.items, detail.files!.nextCursor!))} /> : null}
              {detail.files.enabled && canWork ? (
                <>
                  <ActionButton label="Take photo" disabled={busy || Boolean(pending)} variant="secondary" onPress={() => void run(() => upload('camera'))} />
                  <ActionButton label="Choose photo" disabled={busy || Boolean(pending)} variant="secondary" onPress={() => void run(() => upload('photos'))} />
                  <ActionButton label="Choose PDF" disabled={busy || Boolean(pending)} variant="secondary" onPress={() => void run(() => upload('pdf'))} />
                  {staged && !pending ? <ActionButton label="Retry file upload" disabled={busy} variant="secondary" onPress={() => void run(() => upload('retry'))} /> : null}
                  {progress !== null ? <Text accessibilityLiveRegion="polite" style={styles.muted}>Uploading {Math.round(progress * 100)}%</Text> : null}
                </>
              ) : canWork ? <Text style={styles.muted}>Evidence uploads are unavailable.</Text> : null}
            </> : <Text style={styles.muted}>Evidence unavailable. Pull to refresh.</Text>}
          </CyberCard>
        </>
      )}
      <Modal animationType="fade" onRequestClose={closePreview} statusBarTranslucent transparent visible={Boolean(preview)}>
        <View style={styles.previewBackdrop}>
          <Pressable accessibilityLabel="Close image preview" accessibilityRole="button" onPress={closePreview} style={styles.previewClose}><X color="#FFFFFF" size={24} /></Pressable>
          {preview ? <Image resizeMode="contain" source={{ uri: preview.uri }} style={styles.previewImage} /> : null}
        </View>
      </Modal>
    </Screen>
  );
}

function DetailHeader({ title, styles, colors }: { title: string; styles: ReturnType<typeof createStyles>; colors: ThemeColors }) {
  return <View style={styles.header}>
    <Pressable accessibilityRole="button" accessibilityLabel="Back to Tickets" onPress={() => router.canGoBack() ? router.back() : router.replace('/(app)/tickets')} style={styles.headerButton}><ArrowLeft color={colors.text} size={20} /></Pressable>
    <Text style={styles.headerTitle}>{title}</Text>
    <View style={{ width: 42 }} />
  </View>;
}
function formatDate(value: string) {
  const date = new Date(value);
  return Number.isFinite(date.getTime()) ? new Intl.DateTimeFormat('en', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }).format(date) : 'Date unavailable';
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  header: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' }, headerButton: { alignItems: 'center', justifyContent: 'center', width: 42, height: 42, borderRadius: radii.lg, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.panel }, headerTitle: { color: colors.text, fontSize: 15, fontWeight: '900' },
  titleBlock: { gap: spacing.md }, pills: { flexDirection: 'row', gap: spacing.sm }, title: { color: colors.text, fontSize: 26, fontWeight: '900', lineHeight: 32 }, description: { color: colors.textMuted, fontSize: 13, lineHeight: 20 },
  incidentCard: { alignItems: 'center', flexDirection: 'row', gap: spacing.md, padding: spacing.lg, borderRadius: radii.xl, backgroundColor: colors.purpleSoft }, incidentIcon: { alignItems: 'center', justifyContent: 'center', width: 42, height: 42, borderRadius: 15, backgroundColor: colors.panel }, incidentCopy: { flex: 1, gap: 3 }, incidentLabel: { color: colors.purple, fontSize: 8, fontWeight: '900', letterSpacing: 0.7 }, incidentTitle: { color: colors.text, fontSize: 12, fontWeight: '800' },
  assetCard: { alignItems: 'center', flexDirection: 'row', gap: spacing.md, padding: spacing.lg, borderRadius: radii.xl, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.panel }, assetIcon: { alignItems: 'center', justifyContent: 'center', width: 42, height: 42, borderRadius: 15, backgroundColor: colors.cyanSoft }, assetCopy: { flex: 1, gap: 3 }, assetLabel: { color: colors.cyan, fontSize: 8, fontWeight: '900', letterSpacing: 0.7 }, assetTitle: { color: colors.text, fontSize: 13, fontWeight: '800' }, assetRack: { color: colors.textMuted, fontSize: 9 },
  sectionHeader: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' }, sectionTitle: { color: colors.text, fontSize: 15, fontWeight: '900' }, sectionSubtitle: { marginTop: 3, color: colors.textMuted, fontSize: 10 },
  steps: { alignItems: 'flex-start', flexDirection: 'row', marginTop: spacing.sm }, step: { alignItems: 'center', width: 74, gap: 7 }, stepDot: { alignItems: 'center', justifyContent: 'center', width: 26, height: 26, borderRadius: 10, borderWidth: 2, borderColor: colors.border, backgroundColor: colors.cardDark }, stepDotDone: { borderColor: colors.green, backgroundColor: colors.green }, stepLabel: { color: colors.textSubtle, fontSize: 8, fontWeight: '700', textAlign: 'center' }, stepLabelDone: { color: colors.text }, stepLine: { flex: 1, height: 2, marginTop: 12, backgroundColor: colors.border }, stepLineDone: { backgroundColor: colors.green }, timeRow: { alignItems: 'center', alignSelf: 'center', flexDirection: 'row', gap: 5, marginTop: spacing.sm }, timeText: { color: colors.textMuted, fontSize: 10 },
  actionGrid: { flexDirection: 'row', gap: spacing.md }, arAction: { alignItems: 'center', flex: 2, flexDirection: 'row', gap: spacing.md, minHeight: 68, paddingHorizontal: spacing.lg, borderRadius: radii.xl, backgroundColor: colors.hero }, arTitle: { color: '#FFFFFF', fontSize: 13, fontWeight: '900' }, arSubtitle: { marginTop: 2, color: '#9FB1D7', fontSize: 9 }, secondaryAction: { alignItems: 'center', justifyContent: 'center', flex: 1, gap: 5, minHeight: 68, borderRadius: radii.xl, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.panel }, secondaryActionText: { color: colors.cyan, fontSize: 10, fontWeight: '800' },
  commentInput: { minHeight: 90, paddingTop: spacing.md, textAlignVertical: 'top' }, timeline: { gap: spacing.md }, timelineItem: { flexDirection: 'row', gap: spacing.md }, timelineDot: { width: 9, height: 9, marginTop: 5, borderRadius: 5, backgroundColor: colors.cyan }, timelineCopy: { flex: 1, gap: 4, paddingBottom: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border }, commentIdentity: { alignItems: 'center', flexDirection: 'row', flexWrap: 'wrap', gap: 7 }, commentAuthor: { color: colors.cyan, fontSize: 10, fontWeight: '800' }, commentRole: { paddingHorizontal: 7, paddingVertical: 3, borderRadius: 8, color: colors.purple, backgroundColor: colors.purpleSoft, fontSize: 8, fontWeight: '800' }, comment: { color: colors.text, fontSize: 12, lineHeight: 18 }, commentMeta: { color: colors.textSubtle, fontSize: 9 }, muted: { color: colors.textMuted, fontSize: 12 },
  evidenceGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }, evidenceImageButton: { width: 88, height: 88, borderRadius: radii.lg, overflow: 'hidden', backgroundColor: colors.cardDark }, evidenceImage: { width: '100%', height: '100%' }, evidenceFile: { alignItems: 'center', justifyContent: 'center', gap: 5, width: 88, height: 88, padding: spacing.sm, borderRadius: radii.lg, backgroundColor: colors.cardDark }, evidenceName: { color: colors.textMuted, fontSize: 8 },
  previewBackdrop: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.lg, backgroundColor: 'rgba(2, 6, 18, 0.96)' }, previewClose: { position: 'absolute', zIndex: 1, top: 52, right: spacing.lg, alignItems: 'center', justifyContent: 'center', width: 46, height: 46, borderRadius: 23, backgroundColor: 'rgba(255, 255, 255, 0.14)' }, previewImage: { width: '100%', height: '78%' }, previewHint: { position: 'absolute', bottom: 38, color: '#B8C2D8', fontSize: 10, textAlign: 'center' },
});
