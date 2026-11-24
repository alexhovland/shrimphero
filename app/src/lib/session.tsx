import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import type { Session } from '@supabase/supabase-js';
import { configured, getSupabase, hasStoredSession } from './supabase';
import { getMyRank, type MyRank } from './api';

// One anonymous Supabase login per browser. No email, no password.
// Later, "save my progress with email" can link an email to this same user
// with supabase.auth.updateUser({ email }), keeping every entry. Email sign-ups
// stay off in Supabase until that is built.

type SessionState = {
  session: Session | null;
  me: MyRank | null;
  /** true once we know whether this browser is signed in and, if so, its nickname */
  ready: boolean;
  signIn: (captchaToken: string) => Promise<void>;
  refreshMe: () => Promise<void>;
  signOut: () => Promise<void>;
};

const Ctx = createContext<SessionState | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [me, setMe] = useState<MyRank | null>(null);
  const [ready, setReady] = useState(false);

  const refreshMe = useCallback(async () => {
    if (!hasStoredSession()) {
      setMe(null);
      return;
    }
    try {
      setMe(await getMyRank());
    } catch {
      setMe(null);
    }
  }, []);

  useEffect(() => {
    // Nobody signed in from this browser yet: no need to load the library.
    if (!configured || !hasStoredSession()) {
      setReady(true);
      return;
    }
    let unsubscribe = () => {};
    getSupabase().then(async (supabase) => {
      const { data } = await supabase.auth.getSession();
      setSession(data.session);
      if (data.session) await refreshMe();
      setReady(true);
      const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => setSession(s));
      unsubscribe = () => sub.subscription.unsubscribe();
    }, () => setReady(true));
    return () => unsubscribe();
  }, [refreshMe]);

  const signIn = useCallback(async (captchaToken: string) => {
    const supabase = await getSupabase();
    const { data, error } = await supabase.auth.signInAnonymously({ options: { captchaToken } });
    if (error) {
      // Supabase's own reason (for example "Anonymous sign-ins are disabled"), for whoever opens the console.
      console.warn('Sign-in refused by Supabase:', error.code || '', error.message);
      throw new Error('sign_in_failed');
    }
    setSession(data.session);
  }, []);

  const signOut = useCallback(async () => {
    const supabase = await getSupabase();
    await supabase.auth.signOut({ scope: 'local' });
    setSession(null);
    setMe(null);
  }, []);

  return <Ctx.Provider value={{ session, me, ready, signIn, refreshMe, signOut }}>{children}</Ctx.Provider>;
}

export function useSession() {
  const v = useContext(Ctx);
  if (!v) throw new Error('SessionProvider missing');
  return v;
}
