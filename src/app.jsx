import React from 'react';
import { SnapAPI } from './api/client';
import { Snap, Phone } from './mascot';
import { HomeScreen } from './home';
import { LoginScreen, NotificationsScreen } from './screens-auth';
import { ScanScreen, MileageScreen } from './screens-capture';
import {
  ExpensesScreen, ProfileScreen, TaxesScreen, ExportScreen, AskScreen,
} from './screens-tax';

const HOME_VARIANT = 'hybrid';

function PhoneShell({ initial, userName }) {
  const [route, setRoute] = React.useState(initial);
  const nav = (to) => setRoute(to);

  const screen = (() => {
    switch (route) {
      case 'login': return <LoginScreen onNav={nav} />;
      case 'home': return <HomeScreen variant={HOME_VARIANT} onNav={nav} userName={userName} />;
      case 'scan': return <ScanScreen onNav={nav} />;
      case 'mileage': return <MileageScreen onNav={nav} />;
      case 'expenses': return <ExpensesScreen onNav={nav} />;
      case 'profile': return <ProfileScreen onNav={nav} />;
      case 'taxes': return <TaxesScreen onNav={nav} />;
      case 'export': return <ExportScreen onNav={nav} />;
      case 'ask': return <AskScreen onNav={nav} />;
      case 'notifications': return <NotificationsScreen onNav={nav} />;
      default: return <HomeScreen variant={HOME_VARIANT} onNav={nav} userName={userName} />;
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
  const [userName, setUserName] = React.useState('Alex');

  React.useEffect(() => {
    document.body.classList.add('app-preview');
    return () => document.body.classList.remove('app-preview');
  }, []);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await SnapAPI.health();
        if (!cancelled) setApiOk(true);
        if (!SnapAPI.getToken()) {
          const { user } = await SnapAPI.login({ provider: 'demo', name: userName });
          if (!cancelled && user?.name) setUserName(user.name);
        } else {
          const { user } = await SnapAPI.me();
          if (!cancelled && user?.name) setUserName(user.name);
        }
      } catch (e) {
        console.warn('API unavailable', e);
      } finally {
        if (!cancelled) setReady(true);
      }
    })();
    return () => { cancelled = true; };
  }, []);

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
      <PhoneShell initial="login" userName={userName} />
    </div>
  );
}
