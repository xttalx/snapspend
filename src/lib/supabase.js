import { createClient } from '@supabase/supabase-js';

let client = null;
let clientSignature = '';

/** Prefer legacy anon JWT (eyJ…) — required for reliable Google OAuth in many projects. */
export function pickAnonKey(...candidates) {
  const keys = candidates.map((k) => String(k || '').trim()).filter(Boolean);
  return keys.find((k) => k.startsWith('eyJ')) || keys[0] || '';
}

/** Read Vite / Supabase-dashboard env names (local build-time fallback). */
export function readSupabaseEnv() {
  const url = (
    import.meta.env.VITE_SUPABASE_URL
    || import.meta.env.NEXT_PUBLIC_SUPABASE_URL
    || import.meta.env.REACT_APP_SUPABASE_URL
    || ''
  ).trim();
  const key = pickAnonKey(
    import.meta.env.VITE_SUPABASE_ANON_KEY,
    import.meta.env.SUPABASE_ANON_KEY,
    import.meta.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    import.meta.env.REACT_APP_SUPABASE_PUBLISHABLE_KEY,
  );
  return { url, key };
}

export function initSupabase(url, anonKey) {
  if (!url || !anonKey) return null;
  const signature = `${url}|${anonKey.slice(0, 12)}`;
  if (client && clientSignature === signature) return client;

  client = createClient(url, anonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      flowType: 'pkce',
    },
  });
  clientSignature = signature;
  return client;
}

export function getSupabase() {
  return client;
}

export function resetSupabase() {
  client = null;
  clientSignature = '';
}
