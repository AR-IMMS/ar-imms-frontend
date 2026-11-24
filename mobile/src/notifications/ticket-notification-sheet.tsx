import { router } from 'expo-router';
import { CheckCheck, CircleAlert, MessageSquareText, TicketCheck, X } from 'lucide-react-native';
import { useMemo } from 'react';
import { ActivityIndicator, FlatList, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useTheme } from '../theme/theme-context';
import { radii, shadow, spacing, type ThemeColors } from '../theme/tokens';
import { useTicketNotifications } from './notification-context';
import type { TicketNotification, TicketNotificationTone } from './ticket-notifications';

export function TicketNotificationSheet() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { visible, close, notifications, unreadCount, loading, error, refresh, markRead, markAllRead } = useTicketNotifications();

  async function openTicket(item: TicketNotification) {
    if (!(await markRead(item.id))) return;
    close();
    router.push(`/(app)/tickets/${item.ticketId}`);
  }

  return (
    <Modal animationType="slide" transparent visible={visible} onRequestClose={close}>
      <View style={styles.modalRoot}>
        <Pressable accessibilityLabel="Close notifications" onPress={close} style={[StyleSheet.absoluteFill, styles.backdrop]} />
        <SafeAreaView edges={['bottom']} style={styles.sheet}>
          <View style={styles.handle} />
          <View style={styles.header}>
            <View style={styles.headerCopy}><Text style={styles.title}>Notifications</Text><Text style={styles.subtitle}>{unreadCount ? `${unreadCount} unread workflow updates` : error ? 'Updates unavailable' : "You're up to date"}</Text></View>
            <Pressable accessibilityLabel="Close notifications" onPress={close} style={styles.closeButton}><X color={colors.textMuted} size={19} /></Pressable>
          </View>
          <View style={styles.toolbar}>
            <Pressable disabled={!unreadCount} onPress={() => void markAllRead()} style={({ pressed }) => [styles.markButton, pressed && styles.pressed, !unreadCount && styles.disabled]}><CheckCheck color={colors.cyan} size={16} /><Text style={styles.markText}>Mark shown read</Text></Pressable>
            <Pressable onPress={() => void refresh()} style={({ pressed }) => [styles.refreshButton, pressed && styles.pressed]}><Text style={styles.refreshText}>Refresh</Text></Pressable>
          </View>
          {loading && !notifications.length ? <View style={styles.loading}><ActivityIndicator color={colors.cyan} /><Text style={styles.emptyCopy}>Syncing ticket activity...</Text></View> : (
            <FlatList
              data={notifications}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.list}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => <NotificationRow item={item} read={item.read} colors={colors} styles={styles} onPress={() => void openTicket(item)} />}
              ListEmptyComponent={<View style={styles.empty}><TicketCheck color={colors.green} size={30} /><Text accessibilityLiveRegion="polite" style={styles.emptyTitle}>{error ?? 'No Ticket updates yet'}</Text></View>}
            />
          )}
        </SafeAreaView>
      </View>
    </Modal>
  );
}

function NotificationRow({ item, read, colors, styles, onPress }: { item: TicketNotification; read: boolean; colors: ThemeColors; styles: ReturnType<typeof createStyles>; onPress: () => void }) {
  const tone = notificationTone(item.tone, colors);
  const Icon = item.title.includes('note') ? MessageSquareText : item.title.includes('closed') ? TicketCheck : CircleAlert;
  return <Pressable onPress={onPress} style={({ pressed }) => [styles.row, !read && styles.rowUnread, pressed && styles.pressed]}><View style={[styles.icon, { backgroundColor: tone.soft }]}><Icon color={tone.color} size={18} /></View><View style={styles.rowCopy}><View style={styles.rowTitleLine}><Text numberOfLines={1} style={styles.rowTitle}>{item.title}</Text>{!read ? <View style={styles.unreadDot} /> : null}</View><Text style={styles.ticketCode}>{item.ticketCode}</Text><Text numberOfLines={2} style={styles.body}>{item.body}</Text><Text style={styles.time}>{relativeTime(item.createdAt)}</Text></View></Pressable>;
}

function notificationTone(tone: TicketNotificationTone, colors: ThemeColors) {
  return { cyan: { color: colors.cyan, soft: colors.cyanSoft }, purple: { color: colors.purple, soft: colors.purpleSoft }, amber: { color: colors.amber, soft: colors.amberSoft }, green: { color: colors.green, soft: colors.greenSoft }, red: { color: colors.red, soft: colors.redSoft } }[tone];
}

function relativeTime(value: string) { const seconds = Math.max(0, Math.floor((Date.now() - Date.parse(value)) / 1000)); if (seconds < 60) return 'Just now'; if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`; if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`; return `${Math.floor(seconds / 86400)}d ago`; }

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  modalRoot: { flex: 1, justifyContent: 'flex-end' }, backdrop: { backgroundColor: colors.overlay }, sheet: { maxHeight: '82%', minHeight: '58%', overflow: 'hidden', borderTopLeftRadius: radii.xxl, borderTopRightRadius: radii.xxl, borderWidth: 1, borderBottomWidth: 0, borderColor: colors.border, backgroundColor: colors.bgElevated, ...shadow },
  handle: { alignSelf: 'center', width: 42, height: 5, marginTop: spacing.sm, borderRadius: 99, backgroundColor: colors.borderBright }, header: { alignItems: 'center', flexDirection: 'row', gap: spacing.md, paddingHorizontal: spacing.lg, paddingVertical: spacing.md }, headerCopy: { flex: 1 }, title: { color: colors.text, fontSize: 19, fontWeight: '900' }, subtitle: { marginTop: 3, color: colors.textMuted, fontSize: 11, fontWeight: '600' }, closeButton: { alignItems: 'center', justifyContent: 'center', width: 38, height: 38, borderRadius: radii.md, backgroundColor: colors.panelSoft },
  toolbar: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: spacing.lg, paddingBottom: spacing.md }, markButton: { alignItems: 'center', flexDirection: 'row', gap: spacing.sm }, markText: { color: colors.cyan, fontSize: 11, fontWeight: '800' }, refreshButton: { paddingHorizontal: spacing.sm, paddingVertical: spacing.xs }, refreshText: { color: colors.textMuted, fontSize: 11, fontWeight: '700' }, disabled: { opacity: 0.4 }, pressed: { opacity: 0.7 },
  list: { gap: spacing.sm, paddingHorizontal: spacing.md, paddingBottom: spacing.xl }, row: { flexDirection: 'row', gap: spacing.md, padding: spacing.md, borderRadius: radii.lg, borderWidth: 1, borderColor: 'transparent' }, rowUnread: { borderColor: colors.borderBright, backgroundColor: colors.cyanSoft }, icon: { alignItems: 'center', justifyContent: 'center', width: 40, height: 40, borderRadius: radii.md }, rowCopy: { flex: 1 }, rowTitleLine: { alignItems: 'center', flexDirection: 'row', gap: spacing.sm }, rowTitle: { flex: 1, color: colors.text, fontSize: 13, fontWeight: '900' }, unreadDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.cyan }, ticketCode: { marginTop: 3, color: colors.cyan, fontSize: 9, fontWeight: '900' }, body: { marginTop: 4, color: colors.textMuted, fontSize: 11, fontWeight: '600', lineHeight: 17 }, time: { marginTop: 5, color: colors.textSubtle, fontSize: 9, fontWeight: '600' },
  loading: { alignItems: 'center', justifyContent: 'center', flex: 1, gap: spacing.md }, empty: { alignItems: 'center', justifyContent: 'center', paddingVertical: 64, gap: spacing.sm }, emptyTitle: { color: colors.text, fontSize: 14, fontWeight: '900' }, emptyCopy: { color: colors.textMuted, fontSize: 11, textAlign: 'center' },
});
