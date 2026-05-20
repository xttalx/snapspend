import React from 'react';
import { SnapAPI, showToast } from './api/client';
import { getSupabase } from './lib/supabase';
import { getAuthRedirectUrl } from './lib/auth-redirect';
import { Snap, Avatar, AppBar, I } from './mascot';

export function LoginScreen({ onNav, onSignedIn }) {
  const [loading, setLoading] = React.useState(null);
  const [showEmail, setShowEmail] = React.useState(false);
  const [mode, setMode] = React.useState('signin');
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [devMode, setDevMode] = React.useState(false);
  const [configHint, setConfigHint] = React.useState(null);

  React.useEffect(() => {
    SnapAPI.getAuthConfig().then((cfg) => {
      setDevMode(!cfg.supabase);
      setConfigHint(cfg.hint || null);
    });
  }, []);

  const finishSignIn = async () => {
    const { user } = await SnapAPI.syncSession();
    showToast(`Welcome, ${user.name.split(' ')[0]}!`);
    if (onSignedIn) onSignedIn(user);
    else onNav('home');
  };

  const signInGoogle = async () => {
    const sb = getSupabase();
    if (!sb) {
      showToast('Google sign-in is not configured yet');
      return;
    }
    setLoading('google');
    try {
      const redirectTo = getAuthRedirectUrl();
      const { error } = await sb.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo,
          queryParams: { access_type: 'online', prompt: 'select_account' },
        },
      });
      if (error) throw error;
    } catch (e) {
      showToast(e.message || 'Google sign-in failed');
      setLoading(null);
    }
  };

  const submitEmail = async (e) => {
    e.preventDefault();
    const sb = getSupabase();
    if (!sb) {
      showToast(
        configHint
          || 'Sign-in is not configured. Add VITE_SUPABASE_ANON_KEY on Vercel and redeploy.'
      );
      return;
    }

    if (!email.trim() || !password) {
      showToast('Enter email and password');
      return;
    }

    setLoading('email');
    try {
      if (mode === 'signup') {
        const { error } = await sb.auth.signUp({ email: email.trim(), password });
        if (error) throw error;
        showToast('Check your email to confirm your account, then sign in.');
        setMode('signin');
        return;
      }
      const { error } = await sb.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (error) throw error;
      await finishSignIn();
    } catch (err) {
      showToast(err.message || 'Sign-in failed');
    } finally {
      setLoading(null);
    }
  };

  return (
    <>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '40px 28px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 24 }}>
          <Snap size={68} mood="wow" />
          <div>
            <div style={{
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              color: '#16b977',
              marginBottom: 14,
            }}>
              meet snap, your tax buddy
            </div>
            <h1 style={{
              fontFamily: 'Bricolage Grotesque, sans-serif',
              fontSize: 38,
              fontWeight: 700,
              letterSpacing: '-0.025em',
              lineHeight: 1.02,
              margin: 0,
            }}>
              Just tell me<br/>what you spent.
            </h1>
            <p className="muted" style={{ fontSize: 15, marginTop: 14, lineHeight: 1.5 }}>
              Sign in to save your spending. Every chat becomes a tax-ready record — yours alone.
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {!showEmail ? (
            <>
              <button
                className="btn btn--ghost btn--block btn--lg"
                disabled={!!loading}
                onClick={signInGoogle}
                style={{ background: '#fff', border: '1.5px solid #e4eaf1' }}
              >
                <I.google /> {loading === 'google' ? 'Redirecting…' : 'Continue with Google'}
              </button>
              <button
                className="btn btn--block"
                disabled={!!loading}
                onClick={() => setShowEmail(true)}
                style={{ background: 'transparent', color: '#5a6f87', fontWeight: 600, padding: '10px' }}
              >
                Use email instead
              </button>
              {devMode && (
                <button
                  className="btn btn--block tiny muted"
                  disabled={!!loading}
                  onClick={async () => {
                    setLoading('dev');
                    try {
                      const { user } = await SnapAPI.login({ provider: 'email', email: 'dev@local.test', name: 'Dev' });
                      if (onSignedIn) onSignedIn(user);
                    } catch (err) {
                      showToast(err.message);
                    } finally {
                      setLoading(null);
                    }
                  }}
                >
                  Dev sign-in (no Supabase)
                </button>
              )}
            </>
          ) : (
            <form onSubmit={submitEmail} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <input
                className="composer__input"
                type="email"
                placeholder="Email"
                value={email}
                onChange={(ev) => setEmail(ev.target.value)}
                autoComplete="email"
                required
              />
              <input
                className="composer__input"
                type="password"
                placeholder="Password"
                value={password}
                onChange={(ev) => setPassword(ev.target.value)}
                autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                required
                minLength={6}
              />
              <button type="submit" className="btn btn--primary btn--block btn--lg" disabled={!!loading}>
                {loading === 'email' ? 'Please wait…' : mode === 'signup' ? 'Create account' : 'Sign in'}
              </button>
              <button
                type="button"
                className="btn btn--block"
                style={{ background: 'transparent', color: '#5a6f87', fontWeight: 600 }}
                onClick={() => setMode(mode === 'signup' ? 'signin' : 'signup')}
              >
                {mode === 'signup' ? 'Already have an account? Sign in' : 'New here? Create account'}
              </button>
              <button
                type="button"
                className="btn btn--block tiny muted"
                onClick={() => setShowEmail(false)}
              >
                Back
              </button>
            </form>
          )}
          {configHint && (
            <div className="tiny center" style={{ marginTop: 8, lineHeight: 1.5, color: '#c44' }}>
              {configHint}
            </div>
          )}
          <div className="tiny muted center" style={{ marginTop: 6, lineHeight: 1.5 }}>
            By continuing you agree to our Terms & Privacy.
          </div>
        </div>
      </div>
    </>
  );
}

export function NotificationsScreen({ onNav }) {
  const [items, setItems] = React.useState([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await SnapAPI.ensureAuth();
        const { notifications } = await SnapAPI.getNotifications();
        if (!cancelled) setItems(notifications);
      } catch (_) {
        if (!cancelled) setItems([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const markRead = async () => {
    try {
      await SnapAPI.markNotificationsRead();
      setItems((list) => list.map((it) => ({ ...it, read: true, mint: false })));
      showToast('All notifications marked read');
    } catch (_) {
      showToast('Could not update notifications');
    }
  };

  return (
    <>
      <AppBar
        title="NOTIFICATIONS"
        onBack={() => onNav('home')}
        action={<button className="appbar__action appbar__action--ghost" style={{ fontSize: 12, fontWeight: 700, color: '#16b977', width: 'auto', padding: '0 8px' }} onClick={markRead}>Mark read</button>}
      />
      <div className="screen-scroll" style={{ padding: '0 18px 24px' }}>
        {loading ? (
          <div className="center muted" style={{ padding: 40 }}>Loading…</div>
        ) : items.length === 0 ? (
          <div className="center muted" style={{ padding: 48, lineHeight: 1.5 }}>
            <Snap size={48} mood="happy" />
            <p style={{ marginTop: 16 }}>No notifications yet.<br/>Snap will notify you about tax wins here.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {items.map((it, i) => (
              <div key={it.id || i} className="card" style={{
                padding: 14,
                display: 'flex', gap: 12, alignItems: 'flex-start',
                background: it.mint && !it.read ? '#e6faf1' : '#fff',
                borderColor: it.mint && !it.read ? 'transparent' : '#e4eaf1',
                opacity: it.read ? 0.7 : 1,
              }}>
                <Avatar size={36} mood={it.mood} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 14, lineHeight: 1.3 }}>{it.title}</div>
                  <div className="tiny muted" style={{ marginTop: 2 }}>{it.sub}</div>
                </div>
                <div className="tiny muted" style={{ flexShrink: 0 }}>{it.time}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
