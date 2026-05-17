import { createClient } from '@supabase/supabase-js';

let client = null;

export function initSupabase(url, anonKey) {
  if (!url || !anonKey) return null;
  if (!client) {
    client = createClient(url, anonKey, {
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
