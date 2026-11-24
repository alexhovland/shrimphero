import type { SupabaseClient } from '@supabase/supabase-js';

export const SUPABASE_URL = ((import.meta.env.VITE_SUPABASE_URL as string | undefined) || '').replace(/\/+$/, '');
export const SUPABASE_KEY = (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined) || '';
export const configured = Boolean(SUPABASE_URL && SUPABASE_KEY);

// The anonymous login is kept in this browser's local storage under this key:
// that is the person's "account". Only the public anon key is ever used.
const STORAGE_KEY = 'shrimphero-auth';

export function hasStoredSession(): boolean {
  try {
    return window.localStorage.getItem(STORAGE_KEY) !== null;
  } catch {
    return false;
  }
}

// The Supabase library is loaded only when it is needed (signing in, or a
// returning visitor with a saved login). Public numbers use plain fetch.
let client: Promise<SupabaseClient> | null = null;

export function getSupabase(): Promise<SupabaseClient> {
  if (!client) {
    client = import('@supabase/supabase-js').then(({ createClient }) =>
      createClient(SUPABASE_URL || 'http://localhost', SUPABASE_KEY || 'missing-key', {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: false,
          storageKey: STORAGE_KEY,
        },
      }),
    );
  }
  return client;
}
