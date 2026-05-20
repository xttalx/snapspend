import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './app.jsx';
import './styles.css';
import { readSupabaseEnv, initSupabase, getSupabase } from './lib/supabase';
import {
  cleanAuthParamsFromUrl,
  exchangeOAuthCodeIfPresent,
  getOAuthErrorFromUrl,
  hasOAuthCallbackInUrl,
} from './lib/auth-redirect';

const OAUTH_ERROR_KEY = 'snapspend_oauth_error';

/** Handle Google redirect before React mounts so PKCE state is not lost. */
async function bootstrapOAuth() {
  const urlError = getOAuthErrorFromUrl();
  if (urlError) {
    sessionStorage.setItem(OAUTH_ERROR_KEY, urlError);
    cleanAuthParamsFromUrl();
    return;
  }

  const { url, key } = readSupabaseEnv();
  if (!url || !key) return;

  initSupabase(url, key);
  const sb = getSupabase();
  if (!sb || !hasOAuthCallbackInUrl()) return;

  const { error } = await exchangeOAuthCodeIfPresent(sb);
  if (error) {
    sessionStorage.setItem(OAUTH_ERROR_KEY, error.message);
  } else {
    await sb.auth.getSession();
  }
  cleanAuthParamsFromUrl();
}

bootstrapOAuth().then(() => {
  ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
});
