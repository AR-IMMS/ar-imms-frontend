import { createContext, useContext, useState, useEffect, useCallback, type PropsWithChildren } from 'react';
import { apiConfig } from '../api/config';
import { NativeSession, type AuthUser } from '../api/auth';
import { protectedStore } from './session-storage';

type ScreenSession = { user: AuthUser; accessToken: '' };
interface SessionContext {
  session: ScreenSession | null;
  core: NativeSession;
  loading: boolean;
  mustChange: boolean;
  error: string | null;
  signIn: (identifier: string, password: string) => Promise<boolean>;
  changePassword: (password: string) => Promise<void>;
  signOut: () => Promise<void>;
  can: (permission: string) => boolean;
}
const Context = createContext<SessionContext | null>(null);
export function AuthProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<ScreenSession | null>(null);
  const [mustChange, setMustChange] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [core] = useState(() => {
    const key = 'arimms.core.' + apiConfig.coreApiUrl.replace(/[^a-zA-Z0-9.-]/g, x => '_' + x.charCodeAt(0).toString(16) + '_');
    return new NativeSession(apiConfig.coreApiUrl, {
      read: () => protectedStore.get(key),
      save: (refresh) => protectedStore.set(key, refresh),
      clear: () => protectedStore.remove(key),
    }, () => { setSession(null); setMustChange(false); });
  });
  const apply = useCallback((identity: Awaited<ReturnType<NativeSession['restore']>>) => {
    setMustChange(identity?.change ?? false);
    setSession(identity?.user ? { user: identity.user, accessToken: '' } : null);
    return Boolean(identity?.user);
  }, []);
  useEffect(() => {
    let active = true;
    core.restore().then(identity => { if (active) apply(identity); })
      .catch(() => { if (active) setError('Session could not be restored. Sign in again or check the connection.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [core, apply]);
  const signIn = async (identifier: string, password: string) => {
    setLoading(true); setError(null);
    try { return apply(await core.login(identifier.trim(), password)); }
    finally { setLoading(false); }
  };
  const changePassword = async (password: string) => {
    setLoading(true);
    try { await core.changePassword(password); }
    finally { setLoading(false); }
  };
  const can = useCallback((permission: string) => Boolean(session?.user.permissions.includes(permission)), [session]);
  return <Context.Provider value={{ core, session, mustChange, loading, error, signIn, changePassword,
    signOut: () => core.logout(),
    can,
  }}>{children}</Context.Provider>;
}

export function useAuth() {
  const context = useContext(Context);
  if (!context) throw new Error('AuthProvider is missing.');
  return context;
}
