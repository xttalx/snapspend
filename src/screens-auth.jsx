import React from 'react';
import { SnapAPI, showToast } from './api/client';
import { Snap, Avatar, AppBar, I } from './mascot';


export function LoginScreen({ onNav }) {
  const [loading, setLoading] = React.useState(null);

  const signIn = async (provider) => {
    setLoading(provider);
    try {
      await SnapAPI.login({ provider });
      showToast(`Signed in with ${provider}`);
      onNav('home');
    } catch (e) {
      showToast(e.message || 'Sign-in failed');
      onNav('home');
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
              No spreadsheets. No categories to memorize. Snap turns every chat into a tax‑ready record.
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div className="center muted tiny" style={{ marginBottom: 4 }}>
            Welcome! Log in or sign up to begin.
          </div>
          <button className="btn btn--primary btn--block btn--lg" disabled={!!loading} onClick={() => signIn('apple')}>
            <I.apple /> {loading === 'apple' ? 'Signing in…' : 'Continue with Apple'}
          </button>
          <button className="btn btn--ghost btn--block btn--lg" disabled={!!loading} onClick={() => signIn('google')} style={{ background: '#fff', border: '1.5px solid #e4eaf1' }}>
            <I.google /> {loading === 'google' ? 'Signing in…' : 'Continue with Google'}
          </button>
          <button className="btn btn--block" disabled={!!loading} onClick={() => signIn('email')} style={{ background: 'transparent', color: '#5a6f87', fontWeight: 600, padding: '10px' }}>
            {loading === 'email' ? 'Signing in…' : 'Use email instead'}
          </button>
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
        if (!cancelled) {
          setItems([
            { mood: 'wow', title: "You're $340 from your savings goal!", sub: 'Tap to see how', time: '2m', mint: true },
          ]);
        }
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