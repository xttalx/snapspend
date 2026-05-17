// app.jsx — SnapSpend prototype + live app mode (?mode=app)

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "homeVariant": "hybrid",
  "userName": "Alex",
  "mintAccent": "#3ddc97"
}/*EDITMODE-END*/;

const IS_APP_MODE = typeof window !== 'undefined' &&
  new URLSearchParams(window.location.search).get('mode') === 'app';

function PhoneArtboard({ initial, t, dark }) {
  const [route, setRoute] = React.useState(initial);
  const nav = (to) => setRoute(to);
  const userName = t?.userName || 'Alex';
  const homeVariant = t?.homeVariant || 'hybrid';

  const ScreenForRoute = ({ which }) => {
    switch (which) {
      case 'login':         return <LoginScreen onNav={nav} />;
      case 'home':          return <HomeScreen variant={homeVariant} onNav={nav} userName={userName} />;
      case 'home-chat':     return <HomeScreen variant="chat"   onNav={nav} userName={userName} />;
      case 'home-hybrid':   return <HomeScreen variant="hybrid" onNav={nav} userName={userName} />;
      case 'home-dock':     return <HomeScreen variant="dock"   onNav={nav} userName={userName} />;
      case 'scan':          return <ScanScreen onNav={nav} />;
      case 'mileage':       return <MileageScreen onNav={nav} />;
      case 'expenses':      return <ExpensesScreen onNav={nav} />;
      case 'profile':       return <ProfileScreen onNav={nav} userName={userName} />;
      case 'taxes':         return <TaxesScreen onNav={nav} />;
      case 'export':        return <ExportScreen onNav={nav} />;
      case 'ask':           return <AskScreen onNav={nav} />;
      case 'notifications': return <NotificationsScreen onNav={nav} />;
      default:              return <HomeScreen variant={homeVariant} onNav={nav} userName={userName} />;
    }
  };

  return (
    <Phone dark={route === 'scan' || dark}>
      <ScreenForRoute which={route} />
    </Phone>
  );
}

function SnapApp() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const [ready, setReady] = React.useState(false);
  const [apiOk, setApiOk] = React.useState(false);

  React.useEffect(() => {
    document.body.classList.add('app-preview');
    return () => document.body.classList.remove('app-preview');
  }, []);

  React.useEffect(() => {
    document.documentElement.style.setProperty('--mint', t.mintAccent);
  }, [t.mintAccent]);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await SnapAPI.health();
        if (!cancelled) setApiOk(true);
        if (!SnapAPI.getToken()) {
          const { user } = await SnapAPI.login({ provider: 'demo', name: t.userName });
          if (!cancelled && user?.name) setTweak('userName', user.name);
        } else {
          const { user } = await SnapAPI.me();
          if (!cancelled && user?.name) setTweak('userName', user.name);
        }
      } catch (e) {
        console.warn('API unavailable, using offline UI', e);
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
      {apiOk && (
        <div className="app-preview__badge">API connected</div>
      )}
      <PhoneArtboard initial="login" t={t} />
    </div>
  );
}

function DesignBoardApp() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);

  React.useEffect(() => {
    document.documentElement.style.setProperty('--mint', t.mintAccent);
    SnapAPI.ensureAuth().catch(() => {});
  }, [t.mintAccent]);

  return (
    <>
      <DesignCanvas>
        <DCSection id="entry" title="01 · Entry" subtitle="Welcome + sign-in. Snap introduces himself.">
          <DCArtboard id="login" label="Login" width={360} height={760}>
            <PhoneArtboard initial="login" t={t} />
          </DCArtboard>
          <DCArtboard id="notifs" label="Notifications" width={360} height={760}>
            <PhoneArtboard initial="notifications" t={t} />
          </DCArtboard>
        </DCSection>

        <DCSection id="home" title="02 · Conversational Home" subtitle="The heart of the app. Try typing — every reply is real. Use Tweaks to switch the layout.">
          <DCArtboard id="home-active" label={`Home · ${t.homeVariant}`} width={360} height={760}>
            <PhoneArtboard initial="home" t={t} />
          </DCArtboard>
          <DCArtboard id="home-chat" label="Variant · Chat-only" width={360} height={760}>
            <PhoneArtboard initial="home-chat" t={t} />
          </DCArtboard>
          <DCArtboard id="home-hybrid" label="Variant · Estimate card" width={360} height={760}>
            <PhoneArtboard initial="home-hybrid" t={t} />
          </DCArtboard>
          <DCArtboard id="home-dock" label="Variant · Bottom dock" width={360} height={760}>
            <PhoneArtboard initial="home-dock" t={t} />
          </DCArtboard>
        </DCSection>

        <DCSection id="capture" title="03 · Capture" subtitle="Snap a receipt or track a drive — both auto-categorize and feed the chat.">
          <DCArtboard id="scan" label="Receipt scan" width={360} height={760}>
            <PhoneArtboard initial="scan" t={t} />
          </DCArtboard>
          <DCArtboard id="mileage" label="Mileage tracking" width={360} height={760}>
            <PhoneArtboard initial="mileage" t={t} />
          </DCArtboard>
        </DCSection>

        <DCSection id="review" title="04 · Review" subtitle="Browse logged expenses, set up your tax profile.">
          <DCArtboard id="expenses" label="Expenses" width={360} height={760}>
            <PhoneArtboard initial="expenses" t={t} />
          </DCArtboard>
          <DCArtboard id="profile" label="Tax profile" width={360} height={760}>
            <PhoneArtboard initial="profile" t={t} />
          </DCArtboard>
        </DCSection>

        <DCSection id="prep" title="05 · Tax Prep & Ask" subtitle="See the estimate, dive into Q&A with Snap, export when ready.">
          <DCArtboard id="taxes" label="Tax estimate" width={360} height={760}>
            <PhoneArtboard initial="taxes" t={t} />
          </DCArtboard>
          <DCArtboard id="ask" label="Ask Snap (deeper chat)" width={360} height={760}>
            <PhoneArtboard initial="ask" t={t} />
          </DCArtboard>
          <DCArtboard id="export" label="Export bundle" width={360} height={760}>
            <PhoneArtboard initial="export" t={t} />
          </DCArtboard>
        </DCSection>
      </DesignCanvas>

      <TweaksPanel>
        <TweakSection label="Home layout" />
        <TweakRadio
          label="Variant"
          value={t.homeVariant}
          options={[
            { value: 'chat',   label: 'Chat' },
            { value: 'hybrid', label: 'Card' },
            { value: 'dock',   label: 'Dock' },
          ]}
          onChange={(v) => setTweak('homeVariant', v)}
        />
        <div style={{ fontSize: 10.5, lineHeight: 1.4, color: 'rgba(41,38,27,.55)', paddingTop: 2 }}>
          • Chat — pure conversation, Snap-first<br/>
          • Card — chat + estimate card on top<br/>
          • Dock — chat + bottom nav for power users
        </div>

        <TweakSection label="Personalize" />
        <TweakText
          label="User name"
          value={t.userName}
          onChange={(v) => setTweak('userName', v)}
        />
        <TweakColor
          label="Accent"
          value={t.mintAccent}
          options={['#3ddc97', '#16b977', '#ffb547', '#7a5af0', '#ff6b6b']}
          onChange={(v) => setTweak('mintAccent', v)}
        />
      </TweaksPanel>
    </>
  );
}

function App() {
  return IS_APP_MODE ? <SnapApp /> : <DesignBoardApp />;
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
