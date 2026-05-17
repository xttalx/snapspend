// mascot.jsx — "Snap", the friendly SnapSpend mascot
// A soft mint orb with eyes + a receipt tail. Reusable at any size.

function Snap({ size = 40, mood = 'happy', style }) {
  // mood: 'happy' | 'thinking' | 'wow' | 'wink' | 'sleeping'
  const eye = (cx, blink = false) => (
    blink
      ? <line x1={cx-3} y1="42" x2={cx+3} y2="42" stroke="#0a2540" strokeWidth="2.5" strokeLinecap="round" />
      : <ellipse cx={cx} cy="42" rx="2.6" ry={mood === 'wow' ? 4 : 3} fill="#0a2540" />
  );
  const mouth = () => {
    if (mood === 'wow') return <ellipse cx="50" cy="56" rx="5" ry="6" fill="#0a2540" />;
    if (mood === 'thinking') return <path d="M42 56 Q50 54 58 58" stroke="#0a2540" strokeWidth="2.5" fill="none" strokeLinecap="round" />;
    return <path d="M42 54 Q50 62 58 54" stroke="#0a2540" strokeWidth="2.8" fill="none" strokeLinecap="round" />;
  };
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" style={style} aria-hidden="true">
      {/* receipt tail behind the orb */}
      <g transform="translate(58 16) rotate(18)">
        <path d="M0 0 h22 v32 l-3 -3 l-3 3 l-3 -3 l-3 3 l-3 -3 l-3 3 l-3 -3 l-1 3 z"
              fill="#ffffff" stroke="#0a2540" strokeWidth="1.6" strokeLinejoin="round" />
        <line x1="4" y1="8"  x2="18" y2="8"  stroke="#0a2540" strokeWidth="1.4" strokeLinecap="round" opacity=".5" />
        <line x1="4" y1="14" x2="14" y2="14" stroke="#0a2540" strokeWidth="1.4" strokeLinecap="round" opacity=".5" />
      </g>
      {/* body */}
      <circle cx="50" cy="52" r="34" fill="#3ddc97" stroke="#0a2540" strokeWidth="2.5" />
      {/* cheek blush */}
      <ellipse cx="32" cy="58" rx="4" ry="2" fill="#16b977" opacity=".55" />
      <ellipse cx="68" cy="58" rx="4" ry="2" fill="#16b977" opacity=".55" />
      {/* eyes */}
      {eye(40, mood === 'wink')}
      {eye(60)}
      {/* mouth */}
      {mouth()}
      {/* little antenna */}
      <line x1="50" y1="18" x2="50" y2="11" stroke="#0a2540" strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="50" cy="9" r="3" fill="#0a2540" />
    </svg>
  );
}

// Wordmark with mascot
function SnapWordmark({ size = 24 }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <Snap size={size * 1.6} />
      <span style={{
        fontFamily: 'Bricolage Grotesque, Plus Jakarta Sans, sans-serif',
        fontWeight: 700,
        fontSize: size,
        letterSpacing: '-0.02em',
        color: '#0a2540',
      }}>
        snap<span style={{ color: '#16b977' }}>spend</span>
      </span>
    </div>
  );
}

// Status bar icons (signal, wifi, battery)
function StatusBar({ time = '9:41', dark = false }) {
  const col = dark ? '#fff' : '#0a2540';
  return (
    <div className="statusbar">
      <div style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>{time}</div>
      <div className="statusbar__right">
        {/* signal */}
        <svg width="17" height="11" viewBox="0 0 17 11" fill={col} aria-hidden="true">
          <rect x="0"  y="7" width="3" height="4" rx="0.5" />
          <rect x="4.5" y="5" width="3" height="6" rx="0.5" />
          <rect x="9"  y="3" width="3" height="8" rx="0.5" />
          <rect x="13.5" y="0" width="3" height="11" rx="0.5" />
        </svg>
        {/* wifi */}
        <svg width="15" height="11" viewBox="0 0 15 11" fill="none" stroke={col} strokeWidth="1.4" aria-hidden="true">
          <path d="M1 4 Q7.5 -1 14 4" strokeLinecap="round" />
          <path d="M3.5 6.5 Q7.5 3 11.5 6.5" strokeLinecap="round" />
          <circle cx="7.5" cy="9" r="1" fill={col} stroke="none" />
        </svg>
        {/* battery */}
        <svg width="26" height="12" viewBox="0 0 26 12" aria-hidden="true">
          <rect x="0.5" y="0.5" width="22" height="11" rx="2.5" fill="none" stroke={col} strokeOpacity=".5" />
          <rect x="23.5" y="3.5" width="2" height="5" rx="1" fill={col} fillOpacity=".5" />
          <rect x="2" y="2" width="16" height="8" rx="1.5" fill={col} />
        </svg>
      </div>
    </div>
  );
}

// Icon library — line icons in current color
const I = {
  back:   (p={}) => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M15 18l-6-6 6-6"/></svg>,
  close:  (p={}) => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M18 6L6 18M6 6l12 12"/></svg>,
  bell:   (p={}) => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 0 1-3.4 0"/></svg>,
  send:   (p={}) => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/></svg>,
  mic:    (p={}) => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><rect x="9" y="2" width="6" height="12" rx="3"/><path d="M19 10v2a7 7 0 0 1-14 0v-2M12 19v3"/></svg>,
  camera: (p={}) => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>,
  receipt:(p={}) => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M6 2h12v20l-3-2-3 2-3-2-3 2V2z"/><path d="M9 7h6M9 11h6M9 15h4"/></svg>,
  map:    (p={}) => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M1 6v16l7-4 8 4 7-4V2l-7 4-8-4-7 4z"/><path d="M8 2v16M16 6v16"/></svg>,
  pin:    (p={}) => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>,
  chart:  (p={}) => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M3 3v18h18"/><path d="M7 14l4-4 4 4 5-6"/></svg>,
  spark:  (p={}) => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M12 2l2.4 7.6L22 12l-7.6 2.4L12 22l-2.4-7.6L2 12l7.6-2.4z"/></svg>,
  check:  (p={}) => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M5 12l5 5L20 6"/></svg>,
  chev:   (p={}) => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M9 18l6-6-6-6"/></svg>,
  plus:   (p={}) => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" {...p}><path d="M12 5v14M5 12h14"/></svg>,
  home:   (p={}) => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M3 12l9-9 9 9v8a2 2 0 0 1-2 2h-4v-7h-6v7H5a2 2 0 0 1-2-2z"/></svg>,
  wallet: (p={}) => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M20 12V8H4a2 2 0 0 1 0-4h14v4M20 12v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8"/><circle cx="17" cy="14" r="1.5" fill="currentColor"/></svg>,
  bar:    (p={}) => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/></svg>,
  doc:    (p={}) => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M8 13h8M8 17h5"/></svg>,
  user:   (p={}) => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
  apple:  (p={}) => <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" {...p}><path d="M17.05 13.07c-.03-2.95 2.41-4.36 2.52-4.43-1.37-2-3.5-2.27-4.27-2.31-1.82-.18-3.55 1.07-4.48 1.07-.92 0-2.34-1.05-3.85-1.02-1.98.03-3.81 1.15-4.83 2.93-2.06 3.57-.53 8.85 1.48 11.75.98 1.42 2.16 3.02 3.7 2.96 1.49-.06 2.05-.96 3.85-.96 1.8 0 2.31.96 3.88.93 1.6-.03 2.61-1.45 3.59-2.88 1.13-1.65 1.6-3.24 1.62-3.32-.04-.02-3.11-1.19-3.14-4.72zm-2.94-8.66c.82-.99 1.37-2.37 1.22-3.74-1.18.05-2.6.79-3.45 1.78-.76.88-1.42 2.27-1.24 3.62 1.31.1 2.65-.67 3.47-1.66z"/></svg>,
  google: (p={}) => <svg width="18" height="18" viewBox="0 0 24 24" {...p}><path fill="#4285F4" d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.44c-.28 1.5-1.13 2.77-2.41 3.62v3h3.88c2.27-2.09 3.58-5.17 3.58-8.86z"/><path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3c-1.08.73-2.45 1.16-4.05 1.16-3.12 0-5.77-2.11-6.71-4.95H1.28v3.09C3.26 21.3 7.31 24 12 24z"/><path fill="#FBBC05" d="M5.29 14.3c-.24-.73-.38-1.5-.38-2.3s.14-1.57.38-2.3V6.61H1.28C.46 8.24 0 10.06 0 12s.46 3.76 1.28 5.39l4.01-3.09z"/><path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.43-3.43C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.28 6.61l4.01 3.09C6.23 6.86 8.88 4.75 12 4.75z"/></svg>,
  fire:   (p={}) => <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" {...p}><path d="M13.5.67s.74 2.65.74 4.8c0 2.06-1.35 3.73-3.41 3.73-2.07 0-3.63-1.67-3.63-3.73l.03-.36C5.21 7.51 4 10.62 4 14a8 8 0 0 0 16 0C20 9.61 17.41 5.55 13.5.67zM11.71 19c-1.78 0-3.22-1.4-3.22-3.14 0-1.62 1.05-2.76 2.81-3.12 1.77-.36 3.6-1.21 4.62-2.58.39 1.29.59 2.65.59 4.04 0 2.65-2.15 4.8-4.8 4.8z"/></svg>,
  trend:  (p={}) => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M23 6l-9.5 9.5-5-5L1 18"/><path d="M17 6h6v6"/></svg>,
  edit:   (p={}) => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4z"/></svg>,
  trash:  (p={}) => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/></svg>,
  flag:   (p={}) => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1zM4 22V15"/></svg>,
  download:(p={})=> <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>,
};

// Avatar wrapper for mascot in chats
function Avatar({ size = 28, mood }) {
  return (
    <div style={{
      width: size, height: size,
      borderRadius: '50%',
      background: '#e6faf1',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      flexShrink: 0,
      border: '1px solid #0a2540',
    }}>
      <Snap size={size - 4} mood={mood} />
    </div>
  );
}

// Phone-screen shell (no bezel — just rounded rectangle with status bar + content)
function Phone({ children, dark = false, time = '9:41' }) {
  return (
    <div className={`phone${dark ? ' phone--dark' : ''}`}>
      <StatusBar time={time} dark={dark} />
      <div className="screen">{children}</div>
      <div className="home-indicator" />
    </div>
  );
}

// Bottom nav (dock)
function Dock({ active = 'home', onNav }) {
  const tabs = [
    { id: 'home',    label: 'Home',    icon: I.home },
    { id: 'expenses',label: 'Expenses',icon: I.wallet },
  ];
  const tabs2 = [
    { id: 'taxes',   label: 'Taxes',  icon: I.bar },
    { id: 'profile', label: 'Profile',icon: I.user },
  ];
  const btn = (t) => (
    <button key={t.id}
      className={`dock__btn${active === t.id ? ' dock__btn--active' : ''}`}
      onClick={() => onNav && onNav(t.id)}>
      <t.icon />
      <span>{t.label}</span>
    </button>
  );
  return (
    <div className="dock">
      {tabs.map(btn)}
      <button className="dock__fab" onClick={() => onNav && onNav('scan')} aria-label="Scan receipt">
        <I.camera />
      </button>
      {tabs2.map(btn)}
    </div>
  );
}

// App bar
function AppBar({ title, onBack, action }) {
  return (
    <div className="appbar">
      {onBack ? (
        <button className="appbar__back" onClick={onBack} aria-label="Back"><I.back /></button>
      ) : <div style={{ width: 36 }} />}
      <div className="appbar__title">{title}</div>
      {action || <div style={{ width: 36 }} />}
    </div>
  );
}

// Image placeholder (subtle stripes + monospace label) — for things like receipt photos
function ImgPlaceholder({ w = '100%', h = 180, label = 'photo', radius = 14 }) {
  return (
    <div style={{
      width: w, height: h,
      borderRadius: radius,
      background: 'repeating-linear-gradient(45deg, #eef2f7 0 8px, #f7f9fc 8px 16px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: '#5a6f87',
      fontFamily: 'JetBrains Mono, monospace',
      fontSize: 11,
      letterSpacing: 0.4,
    }}>
      [ {label} ]
    </div>
  );
}

Object.assign(window, {
  Snap, SnapWordmark, StatusBar, I, Avatar, Phone, Dock, AppBar, ImgPlaceholder,
});
