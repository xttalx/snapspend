import React from 'react';
import { SnapAPI } from './api/client';
import { getSupabase } from './lib/supabase';
import { Snap, Phone } from './mascot';
import { HomeScreen } from './home';
import { LoginScreen, NotificationsScreen } from './screens-auth';
import { ScanScreen, MileageScreen } from './screens-capture';
import {
  ExpensesScreen, ProfileScreen, TaxesScreen, ExportScreen, AskScreen,
} from './screens-tax';

const HOME_VARIANT = 'hybrid';

function PhoneShell({ route, onNav, userName, onSignedIn }) {
  const screen = (() => {
    switch (route) {
      case 'login':
        return <LoginScreen onNav={onNav} onSignedIn={onSignedIn} />;
      case 'home':
        return <HomeScreen variant={HOME_VARIANT} onNav={onNav} userName={userName} />;
      case 'scan':
        return <ScanScreen onNav={onNav} />;
      case 'mileage':
        return <MileageScreen onNav={onNav} />;
      case 'expenses':
        return <ExpensesScreen onNav={onNav} />;
      case 'profile':
        return <ProfileScreen onNav={onNav} />;
      case 'taxes':
        return <TaxesScreen onNav={onNav} />;
      case 'export':
        return <ExportScreen onNav={onNav} />;
      case 'ask':
        return <AskScreen onNav={onNav} />;
      case 'notifications':
        return <NotificationsScreen onNav={onNav} />;
      default:
        return <HomeScreen variant={HOME_VARIANT} onNav={onNav} userName={userName} />;
    }
  })();

  return (
    <Phone dark={route === 'scan'}>
      {screen}
    </Phone>
  );
}

export default function App() {
  const [ready, setReady] = React.useState(false);
  const [apiOk, setApiOk] = React.useState(false);
  const [route, setRoute] = React.useState('login');
  const [userName, setUserName] = React.useState('there');

  const handleSignedIn = React.useCallback((user) => {
    if (user?.name) setUserName(user.name.split(' ')[0]);
    setRoute('home');
  }, []);

  React.useEffect(() => {
    document.body.classList.add('app-preview');
    return () => document.body.classList.remove('app-preview');
  }, []);

  React.useEffect(() => {
    let cancelled = false;
    let authSub = null;

    async function restoreSession() {
      try {
        await SnapAPI.health();
        if (!cancelled) setApiOk(true);

        const cfg = await SnapAPI.getAuthConfig();
        const sb = getSupabase();

        if (sb) {
          const applySession = async (session) => {
            if (!session?.access_token) {
              SnapAPI.setToken(null);
              if (!cancelled) setRoute('login');
              return;
            }
            SnapAPI.setToken(session.access_token);
            try {
              const { user } = await SnapAPI.syncSession();
              if (!cancelled) handleSignedIn(user);
            } catch {
              SnapAPI.setToken(null);
              if (!cancelled) setRoute('login');
            }
          };

          const { data: { session } } = await sb.auth.getSession();
          await applySession(session);

          const { data: { subscription } } = sb.auth.onAuthStateChange((_event, sess) => {
            if (sess?.access_token) {
              SnapAPI.setToken(sess.access_token);
              SnapAPI.syncSession()
                .then(({ user }) => { if (!cancelled) handleSignedIn(user); })
                .catch(() => {});
            } else {
              SnapAPI.setToken(null);
              if (!cancelled) setRoute('login');
            }
          });
          authSub = subscription;
        } else if (SnapAPI.getToken()) {
          const { user } = await SnapAPI.me();
          if (!cancelled) handleSignedIn(user);
        }
      } catch (e) {
        console.warn('API unavailable', e);
      } finally {
        if (!cancelled) setReady(true);
      }
    }

    restoreSession();
    return () => {
      cancelled = true;
      authSub?.unsubscribe();
    };
  }, [handleSignedIn]);

  if (!ready) {
    return (
      <div className="app-preview__loader">
        <Snap size={56} mood="thinking" />
        <div style={{ marginTop: 16, fontWeight: 600, color: '#5a6f87' }}>Loading SnapSpend…</div>
      </div>
    );
  }

  return (
    <div className="app-preview__frame">
      {apiOk && <div className="app-preview__badge">API connected</div>}
      <PhoneShell
        route={route}
        onNav={setRoute}
        userName={userName}
        onSignedIn={handleSignedIn}
      />
    </div>
  );
}
