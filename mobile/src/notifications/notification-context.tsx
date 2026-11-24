import {
  createContext,
  type PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { AppState } from 'react-native';

import { useAuth } from '../auth/auth-context';
import {
  fetchTicketNotifications,
  readTicketNotifications,
  type TicketNotification,
} from './ticket-notifications';

interface TicketNotificationContextValue {
  notifications: TicketNotification[];
  unreadCount: number;
  loading: boolean;
  error: string | null;
  visible: boolean;
  open: () => void;
  close: () => void;
  refresh: () => Promise<void>;
  markRead: (notificationId: string) => Promise<boolean>;
  markAllRead: () => Promise<boolean>;
}

const TicketNotificationContext =
  createContext<TicketNotificationContextValue | null>(null);
const empty = { items: [] as TicketNotification[], unreadCount: 0 };

export function TicketNotificationProvider({ children }: PropsWithChildren) {
  const { session, core } = useAuth();
  const actor = session?.user.userId;
  const [visibleFor, setVisibleFor] = useState<string>();
  const [snapshot, setSnapshot] = useState<{
    actor: string;
    inbox: Awaited<ReturnType<typeof fetchTicketNotifications>>;
    loading: boolean;
    error: string | null;
  }>();
  const requests = useRef({ revision: 0, epoch: 0 });
  const current = snapshot?.actor === actor ? snapshot : undefined;
  const inbox = current?.inbox ?? empty;

  const refresh = useCallback(async () => {
    if (!actor) return;
    const request = ++requests.current.revision;
    setSnapshot((previous) => ({
      actor,
      inbox: previous?.actor === actor ? previous.inbox : empty,
      loading: true,
      error: null,
    }));
    try {
      const next = await fetchTicketNotifications(core);
      if (request === requests.current.revision)
        setSnapshot({ actor, inbox: next, loading: false, error: null });
    } catch {
      if (request === requests.current.revision)
        setSnapshot({
          actor,
          inbox: empty,
          loading: false,
          error: 'Could not load Ticket notifications.',
        });
    }
  }, [actor, core]);

  useEffect(() => {
    if (!actor) return;
    const activeRequests = requests.current;
    const first = setTimeout(() => void refresh(), 0);
    const timer = setInterval(() => {
      if (AppState.currentState === 'active') void refresh();
    }, 60_000);
    const foreground = AppState.addEventListener('change', (state) => {
      if (state === 'active') void refresh();
    });
    return () => {
      activeRequests.revision++;
      activeRequests.epoch++;
      clearTimeout(first);
      clearInterval(timer);
      foreground.remove();
    };
  }, [actor, refresh]);

  const mark = async (ids: string[]) => {
    if (!actor) return false;
    if (!ids.length) return true;
    const epoch = requests.current.epoch;
    try {
      await readTicketNotifications(core, ids);
      if (epoch !== requests.current.epoch) return false;
      await refresh();
      return epoch === requests.current.epoch;
    } catch {
      if (epoch === requests.current.epoch) {
        requests.current.revision++;
        setSnapshot({
          actor,
          inbox: empty,
          loading: false,
          error: 'Could not mark notifications as read.',
        });
      }
      return false;
    }
  };

  return (
    <TicketNotificationContext.Provider
      value={{
        notifications: inbox.items,
        unreadCount: inbox.unreadCount,
        loading: current?.loading ?? false,
        error: current?.error ?? null,
        visible: Boolean(actor && visibleFor === actor),
        open: () => {
          setVisibleFor(actor);
          void refresh();
        },
        close: () => setVisibleFor(undefined),
        refresh,
        markRead: (id) =>
          mark(
            inbox.items.some((item) => item.id === id && !item.read) ? [id] : []
          ),
        markAllRead: () =>
          mark(inbox.items.filter((item) => !item.read).map((item) => item.id)),
      }}
    >
      {children}
    </TicketNotificationContext.Provider>
  );
}

export function useTicketNotifications() {
  const context = useContext(TicketNotificationContext);
  if (!context)
    throw new Error(
      'useTicketNotifications must be used inside TicketNotificationProvider.'
    );
  return context;
}
