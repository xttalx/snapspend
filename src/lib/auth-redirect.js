/**
 * OAuth redirect URL must match Supabase → Authentication → URL Configuration
 * (e.g. http://localhost:5173/** and https://your-app.vercel.app/**).
 */
export function getAuthRedirectUrl() {
  const configured =
    import.meta.env.VITE_APP_URL
    || import.meta.env.NEXT_PUBLIC_SITE_URL
    || import.meta.env.VITE_SITE_URL;
  if (configured) {
    return String(configured).trim().replace(/\/$/, '');
  }
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }
  return '';
}

/** Read Supabase/Gotrue error from the URL after a failed OAuth redirect. */
export function getOAuthErrorFromUrl() {
  if (typeof window === 'undefined') return null;
  const params = new URLSearchParams(window.location.search);
  const hash = new URLSearchParams(window.location.hash.replace(/^#/, ''));
  const error =
    params.get('error_description')
    || hash.get('error_description')
    || params.get('error')
    || hash.get('error');
  if (!error) return null;
  try {
    return decodeURIComponent(error.replace(/\+/g, ' '));
  } catch {
    return error;
  }
}

export function hasOAuthCallbackInUrl() {
  if (typeof window === 'undefined') return false;
  const params = new URLSearchParams(window.location.search);
  const hash = new URLSearchParams(window.location.hash.replace(/^#/, ''));
  return !!(params.get('code') || hash.get('access_token') || hash.get('code'));
}

const EXCHANGED_KEY = 'snapspend_oauth_code_done';

/** Exchange PKCE code once (React StrictMode runs bootstrap twice in dev). */
export async function exchangeOAuthCodeIfPresent(sb) {
  const params = new URLSearchParams(window.location.search);
  const code = params.get('code');
  if (!code) return { error: null };

  if (sessionStorage.getItem(`${EXCHANGED_KEY}:${code}`)) {
    await sb.auth.getSession();
    return { error: null };
  }

  const { error } = await sb.auth.exchangeCodeForSession(code);
  if (!error) {
    sessionStorage.setItem(`${EXCHANGED_KEY}:${code}`, '1');
  }
  return { error };
}

/** Remove auth query/hash from the address bar after handling the callback. */
export function cleanAuthParamsFromUrl() {
  if (typeof window === 'undefined') return;
  const path = window.location.pathname || '/';
  window.history.replaceState({}, document.title, path);
}
