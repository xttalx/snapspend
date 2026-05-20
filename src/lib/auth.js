import { SnapAPI } from '../api/client';
import { getSupabase, initSupabase, readSupabaseEnv } from './supabase';
import { getAuthRedirectUrl } from './auth-redirect';

/** Load Supabase client from build-time env and /api/auth/config. */
export async function ensureSupabaseClient() {
  const local = readSupabaseEnv();
  if (local.url && local.key) {
    initSupabase(local.url, local.key);
  }

  const cfg = await SnapAPI.getAuthConfig();
  if (cfg.supabaseUrl && cfg.supabaseAnonKey) {
    initSupabase(cfg.supabaseUrl, cfg.supabaseAnonKey);
  }

  const sb = getSupabase();
  if (!sb) {
    throw new Error(
      cfg.hint
      || 'Sign-in is not configured. Add SUPABASE_ANON_KEY (legacy anon JWT, eyJ…) to .env and Vercel.',
    );
  }
  return { sb, cfg };
}

/** Copy Supabase session token into SnapAPI and create/load app profile. */
export async function connectAppSession() {
  const { sb } = await ensureSupabaseClient();
  const { data: { session } } = await sb.auth.getSession();
  if (!session?.access_token) {
    throw new Error('Not signed in');
  }
  SnapAPI.setToken(session.access_token);
  return SnapAPI.syncSession();
}

export async function signInWithGoogle() {
  const { sb } = await ensureSupabaseClient();
  const redirectTo = getAuthRedirectUrl();
  const { data, error } = await sb.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo,
      skipBrowserRedirect: false,
      queryParams: { access_type: 'online', prompt: 'select_account' },
    },
  });
  if (error) throw error;
  if (data?.url) {
    window.location.assign(data.url);
  }
}

export async function signInWithEmail(email, password) {
  const { sb } = await ensureSupabaseClient();
  const { data, error } = await sb.auth.signInWithPassword({
    email: email.trim(),
    password,
  });
  if (error) throw error;
  if (!data.session?.access_token) {
    throw new Error('Sign-in succeeded but no session was returned. Try again.');
  }
  SnapAPI.setToken(data.session.access_token);
  return connectAppSession();
}

export async function signUpWithEmail(email, password, name = '') {
  const { sb } = await ensureSupabaseClient();
  const meta = name.trim() ? { full_name: name.trim(), name: name.trim() } : undefined;
  const { data, error } = await sb.auth.signUp({
    email: email.trim(),
    password,
    options: {
      emailRedirectTo: getAuthRedirectUrl(),
      data: meta,
    },
  });
  if (error) throw error;

  if (data.session?.access_token) {
    SnapAPI.setToken(data.session.access_token);
    return { needsEmailConfirmation: false, ...(await connectAppSession()) };
  }

  return {
    needsEmailConfirmation: true,
    user: data.user,
  };
}

export async function signOut() {
  const sb = getSupabase();
  if (sb) await sb.auth.signOut();
  SnapAPI.setToken(null);
}
