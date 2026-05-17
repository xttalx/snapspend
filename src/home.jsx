import React from 'react';
import { SnapAPI } from './api/client';
import { Snap, SnapWordmark, Avatar, I, Phone, Dock } from './mascot';


const SAMPLE_CHAT = [
  { kind: 'ai', text: "Hey Alex 👋  Ready to log today's spending?", mood: 'happy' },
  { kind: 'ai', text: "Just tell me what you spent — receipt, mileage, anything.", mood: 'happy' },
];

const QUICK_PROMPTS = [
  "$24 lunch with client",
  "Drove to airport",
  "Scan a receipt",
  "How much can I deduct?",
];

// Simulated AI reply — pattern-matches input, returns 1–2 reply bubbles
export function aiReply(input) {
  const x = input.toLowerCase();
  const amt = (x.match(/\$?(\d+(?:\.\d+)?)/) || [])[1];

  if (/lunch|coffee|dinner|food|meal/.test(x)) {
    return [
      { kind: 'ai', mood: 'thinking', text: `Got it — $${amt || '24'} on a meal. Was this with a client or for the team?` },
      { kind: 'ai-card', card: {
        title: 'Logged a meal',
        amount: `$${amt || '24.00'}`,
        category: 'Meals (50% deductible)',
        tax: '~$5.40 saved',
        schedule: 'Schedule C · Line 24b',
      }},
    ];
  }
  if (/drove|drive|mile|airport|trip/.test(x)) {
    return [
      { kind: 'ai', mood: 'wow', text: `Nice — I'll start tracking that drive. Tap "Track now" to use GPS, or tell me the miles.` },
      { kind: 'ai-card', card: {
        title: 'Mileage logged',
        amount: '18.4 mi',
        category: 'Business travel',
        tax: '~$12.32 deduction',
        schedule: '$0.67 / mile · IRS rate',
      }},
    ];
  }
  if (/scan|receipt|photo/.test(x)) {
    return [
      { kind: 'ai', mood: 'happy', text: `Opening the camera — point it at your receipt and I'll handle the rest.` },
      { kind: 'open-scan' },
    ];
  }
  if (/deduct|tax|save|estimate/.test(x)) {
    return [
      { kind: 'ai', mood: 'wow', text: `You've got $2,850 in potential write-offs this year. Want me to break it down?` },
      { kind: 'ai-card', card: {
        title: 'Tax estimate',
        amount: '$14,500',
        category: 'Federal liability',
        tax: '−$2,850 in write-offs',
        schedule: '90% organized · 5 grey flags',
      }},
    ];
  }
  return [
    { kind: 'ai', mood: 'thinking', text: `Got it — "${input.slice(0, 40)}". How much did it cost, and was it for work?` },
  ];
}

// ─────────────────────────────────────────────────────────────
// HomeScreen — variant: 'chat' | 'hybrid' | 'dock'
// ─────────────────────────────────────────────────────────────
export function HomeScreen({ variant = 'hybrid', onNav, userName = 'Alex' }) {
  const [taxSummary, setTaxSummary] = React.useState(null);
  const [messages, setMessages] = React.useState(() => {
    if (variant === 'chat') {
      return [
        { kind: 'ai', mood: 'happy', text: `Hey ${userName}! 👋` },
        { kind: 'ai', mood: 'happy', text: "I'm Snap. What did you spend today? Tell me in your own words — I'll handle the tax stuff." },
      ];
    }
    return [
      { kind: 'ai', mood: 'happy', text: `Hey ${userName}! Ready to log something?` },
    ];
  });
  const [draft, setDraft] = React.useState('');
  const [typing, setTyping] = React.useState(false);
  const scrollerRef = React.useRef(null);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await SnapAPI.ensureAuth();
        const tax = await SnapAPI.getTaxes();
        if (!cancelled) setTaxSummary(tax);
      } catch (_) {}
    })();
    return () => { cancelled = true; };
  }, [messages.length]);

  const send = async (textArg) => {
    const text = (textArg ?? draft).trim();
    if (!text) return;
    setDraft('');
    setMessages((m) => [...m, { kind: 'user', text }]);
    setTyping(true);
    try {
      await SnapAPI.ensureAuth();
      const { replies } = await SnapAPI.chat(text, 'home');
      setMessages((m) => [...m, ...replies]);
      if (replies.some((r) => r.kind === 'open-scan')) {
        setTimeout(() => onNav && onNav('scan'), 900);
      }
      const tax = await SnapAPI.getTaxes();
      setTaxSummary(tax);
    } catch (_) {
      const reply = aiReply(text);
      setMessages((m) => [...m, ...reply]);
      if (reply.some((r) => r.kind === 'open-scan')) {
        setTimeout(() => onNav && onNav('scan'), 900);
      }
    } finally {
      setTyping(false);
    }
  };

  // auto-scroll
  React.useEffect(() => {
    const el = scrollerRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, typing]);

  return (
    <>
      {/* ───────── HEADER ───────── */}
      {variant === 'chat' ? (
        <div className="appbar" style={{ paddingBottom: 6 }}>
          <SnapWordmark size={17} />
          <button className="appbar__action" onClick={() => onNav && onNav('notifications')} aria-label="Notifications">
            <I.bell />
          </button>
        </div>
      ) : (
        <div className="appbar" style={{ paddingBottom: 4 }}>
          <div className="row" style={{ gap: 10 }}>
            <Avatar size={36} mood="happy" />
            <div>
              <div style={{ fontWeight: 700, fontSize: 15, lineHeight: 1.1 }}>Hi, {userName}</div>
              <div className="tiny muted">Tax Day · 47 days away</div>
            </div>
          </div>
          <button className="appbar__action" onClick={() => onNav && onNav('notifications')} aria-label="Notifications">
            <I.bell />
            <span style={{
              position: 'absolute', top: 8, right: 8,
              width: 8, height: 8, borderRadius: '50%',
              background: '#3ddc97', border: '2px solid #fff',
            }} />
          </button>
        </div>
      )}

      {/* ───────── HYBRID: estimate card on top ───────── */}
      {variant === 'hybrid' && (
        <div style={{ padding: '0 18px 12px' }}>
          <div className="card card--dark" style={{ borderRadius: 18 }} onClick={() => onNav && onNav('taxes')}>
            <div className="row row--between" style={{ alignItems: 'flex-start' }}>
              <div>
                <div className="card__label">Current tax estimate</div>
                <div className="amt" style={{ fontSize: 32, marginTop: 4 }}>${(taxSummary?.federalEstimate ?? 14500).toLocaleString()}</div>
              </div>
              <div className="chip chip--mint" style={{ fontSize: 11, padding: '4px 10px' }}>
                <I.trend /> ${(taxSummary?.taxSaved ?? 2850).toLocaleString()} saved
              </div>
            </div>
            <div className="row" style={{ marginTop: 12, gap: 14 }}>
              <div style={{ flex: 1 }}>
                <div className="tiny" style={{ color: 'rgba(255,255,255,.6)' }}>Liability</div>
                <div className="amt" style={{ fontSize: 14 }}>${(taxSummary?.federalEstimate ?? 14500).toLocaleString()}</div>
              </div>
              <div style={{ width: 1, height: 28, background: 'rgba(255,255,255,.15)' }} />
              <div style={{ flex: 1 }}>
                <div className="tiny" style={{ color: 'rgba(255,255,255,.6)' }}>Write-offs</div>
                <div className="amt" style={{ fontSize: 14, color: '#3ddc97' }}>${(taxSummary?.writeOffs ?? 2850).toLocaleString()}</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ───────── DOCK variant: small estimate strip + tile shortcuts ───────── */}
      {variant === 'dock' && (
        <div style={{ padding: '0 18px 12px' }}>
          <div className="row" style={{
            background: '#e6faf1', borderRadius: 14, padding: '10px 14px', gap: 10,
          }}>
            <I.spark style={{ color: '#16b977' }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, fontSize: 13.5 }}>You've saved <span className="amt">${(taxSummary?.writeOffs ?? 2850).toLocaleString()}</span> in write-offs</div>
              <div className="tiny muted">{taxSummary?.organizedPct ?? 90}% organized · keep going!</div>
            </div>
            <I.chev />
          </div>
        </div>
      )}

      {/* ───────── CHAT ───────── */}
      <div className="screen-scroll" ref={scrollerRef}>
        <div className="chat">
          {messages.map((m, i) => <ChatMessage key={i} m={m} onNav={onNav} />)}
          {typing && (
            <div className="bubble-row bubble-row--ai">
              <Avatar size={26} mood="thinking" />
              <div className="bubble bubble--ai"><div className="dots"><span/><span/><span/></div></div>
            </div>
          )}
        </div>
      </div>

      {/* ───────── QUICK REPLIES (above composer) ───────── */}
      {!typing && messages.length < 4 && (
        <div className="quick">
          {QUICK_PROMPTS.map((p) => (
            <button key={p} className="chip" onClick={() => send(p)}>{p}</button>
          ))}
        </div>
      )}

      {/* ───────── COMPOSER ───────── */}
      <div className="composer">
        <button className="composer__btn composer__btn--ghost" onClick={() => onNav && onNav('scan')} aria-label="Scan receipt">
          <I.camera />
        </button>
        <input
          className="composer__input"
          placeholder="What did you spend?"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') send(); }}
        />
        {draft.trim() ? (
          <button className="composer__btn" onClick={() => send()} aria-label="Send">
            <I.send />
          </button>
        ) : (
          <button className="composer__btn composer__btn--ghost" aria-label="Voice">
            <I.mic />
          </button>
        )}
      </div>

      {/* ───────── DOCK variant adds bottom nav ───────── */}
      {variant === 'dock' && <Dock active="home" onNav={onNav} />}
    </>
  );
}

// One chat message — handles all kinds
export function ChatMessage({ m, onNav }) {
  if (m.kind === 'user') {
    return (
      <div className="bubble-row bubble-row--user">
        <div className="bubble bubble--user">{m.text}</div>
      </div>
    );
  }
  if (m.kind === 'ai') {
    return (
      <div className="bubble-row bubble-row--ai">
        <Avatar size={26} mood={m.mood} />
        <div className="bubble bubble--ai">{m.text}</div>
      </div>
    );
  }
  if (m.kind === 'ai-card') {
    const c = m.card;
    return (
      <div className="bubble-row bubble-row--ai">
        <Avatar size={26} mood="happy" />
        <div className="bubble bubble--card" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div className="row row--between">
            <div style={{ fontWeight: 700, fontSize: 14 }}>{c.title}</div>
            <I.check style={{ color: '#16b977' }} />
          </div>
          <div className="amt" style={{ fontSize: 24 }}>{c.amount}</div>
          <div className="chip chip--mint" style={{ alignSelf: 'flex-start' }}>{c.category}</div>
          <div className="row row--between tiny muted" style={{ marginTop: 2 }}>
            <span>{c.schedule}</span>
            <span style={{ color: '#16b977', fontWeight: 700 }}>{c.tax}</span>
          </div>
          <div className="row" style={{ gap: 6, marginTop: 4 }}>
            <button className="btn btn--ghost btn--sm" style={{ padding: '7px 12px' }}>
              <I.edit /> Edit
            </button>
            <button className="btn btn--mint btn--sm" style={{ padding: '7px 12px', marginLeft: 'auto' }}>
              <I.check /> Looks good
            </button>
          </div>
        </div>
      </div>
    );
  }
  if (m.kind === 'open-scan') {
    return (
      <div className="bubble-row bubble-row--ai">
        <Avatar size={26} mood="wow" />
        <button className="bubble bubble--card" style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', border: '1px solid #0a2540' }} onClick={() => onNav && onNav('scan')}>
          <I.camera />
          <span style={{ fontWeight: 600 }}>Open camera</span>
          <I.chev style={{ marginLeft: 'auto' }} />
        </button>
      </div>
    );
  }
  return null;
}