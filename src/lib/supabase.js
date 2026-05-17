import { createBrowserClient } from '@supabase/ssr';

let client = null;

/** Read Vite / Supabase-dashboard env names (local build-time fallback). */
export function readSupabaseEnv() {
  const url =
    import.meta.env.VITE_SUPABASE_URL
    || import.meta.env.NEXT_PUBLIC_SUPABASE_URL
    || import.meta.env.REACT_APP_SUPABASE_URL
    || '';
  const key =
    import.meta.env.VITE_SUPABASE_ANON_KEY
    || import.meta.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
    || import.meta.env.REACT_APP_SUPABASE_PUBLISHABLE_KEY
    || '';
  return { url: url.trim(), key: key.trim() };
}

export function initSupabase(url, anonKey) {
  if (!url || !anonKey) return null;
  if (!client) {
    client = createBrowserClient(url, anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    });
  }
  return client;
}

export function getSupabase() {
  return client;
}
