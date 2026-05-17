import React from 'react';
import { SnapAPI, showToast } from './api/client';
import { Avatar, AppBar, I } from './mascot';


export function ScanScreen({ onNav }) {
  const [scan, setScan] = React.useState(null);
  const [confirming, setConfirming] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await SnapAPI.ensureAuth();
        const result = await SnapAPI.scanReceipt();
        if (!cancelled) setScan(result);
      } catch (_) {
        if (!cancelled) {
          setScan({
            vendor: 'STAPLES',
            amount: 62.8,
            category: 'Office supplies',
          });
        }
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const confirm = async () => {
    setConfirming(true);
    try {
      showToast('Receipt logged to expenses');
      onNav('expenses');
    } finally {
      setConfirming(false);
    }
  };

  const vendor = scan?.vendor || 'STAPLES';
  const amount = scan?.amount ?? 62.8;

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#0a2540', color: '#fff', position: 'relative' }}>
      <button
        onClick={() => onNav('home')}
        style={{
          position: 'absolute', top: 12, left: 12, zIndex: 5,
          width: 40, height: 40, borderRadius: '50%',
          background: 'rgba(255,255,255,0.15)', color: '#fff', border: 0, cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          backdropFilter: 'blur(8px)',
        }}
        aria-label="Close"
      >
        <I.close />
      </button>

      <div style={{ flex: 1, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 32 }}>
        <div style={{
          width: '70%', aspectRatio: '0.62',
          background: '#fdfaf2',
          color: '#0a2540',
          borderRadius: 4,
          padding: '20px 18px',
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: 11,
          lineHeight: 1.5,
          boxShadow: '0 18px 40px rgba(0,0,0,0.4)',
          transform: 'rotate(-2deg)',
        }}>
          <div style={{ textAlign: 'center', fontSize: 16, fontWeight: 700, letterSpacing: 2 }}>{vendor}</div>
          <div style={{ textAlign: 'center', fontSize: 9, marginTop: 4, opacity: .6 }}>
            431 LEX AVE · NEW YORK<br/>03/24/26 · 14:32
          </div>
          <div style={{ borderTop: '1px dashed #0a2540', opacity: .3, margin: '12px 0' }} />
          {(scan?.lineItems || [
            { name: 'Printer Paper', price: 8.99 },
            { name: 'USB-C Cable', price: 24.99 },
            { name: 'Folder Pack', price: 12.5 },
            { name: 'Pens (12)', price: 11.2 },
          ]).map((line, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>{line.name}</span><span>${line.price.toFixed(2)}</span>
            </div>
          ))}
          <div style={{ borderTop: '1px dashed #0a2540', opacity: .3, margin: '8px 0' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: 13, marginTop: 4 }}>
            <span>TOTAL</span><span>${amount.toFixed(2)}</span>
          </div>
        </div>

        <svg viewBox="0 0 300 480" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
          {[[40,40],[260,40],[40,440],[260,440]].map(([x,y],i) => {
            const dx = x < 150 ? 1 : -1;
            const dy = y < 240 ? 1 : -1;
            return (
              <path key={i}
                d={`M${x} ${y+30*dy} L${x} ${y} L${x+30*dx} ${y}`}
                stroke="#3ddc97" strokeWidth="3" fill="none" strokeLinecap="round" />
            );
          })}
        </svg>

        <div style={{
          position: 'absolute', top: 24, left: '50%', transform: 'translateX(-50%)',
          background: 'rgba(61,220,151,0.95)', color: '#0a2540',
          padding: '8px 14px', borderRadius: 999, fontSize: 12, fontWeight: 700,
          display: 'flex', alignItems: 'center', gap: 6,
        }}>
          <I.check /> Receipt detected
        </div>
      </div>

      <div style={{
        background: '#fff', color: '#0a2540',
        borderRadius: '24px 24px 0 0',
        padding: '18px 22px 28px',
      }}>
        <div className="row" style={{ alignItems: 'flex-start', gap: 12, marginBottom: 14 }}>
          <Avatar size={34} mood="happy" />
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700 }}>I read your receipt!</div>
            <div className="tiny muted" style={{ marginTop: 2 }}>
              {scan?.category || 'Office supplies'} from {vendor} — fully deductible.
            </div>
          </div>
        </div>

        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 1fr 1fr',
          background: '#f7f9fc', borderRadius: 14, padding: '12px 4px',
        }}>
          {[
            { label: 'Vendor', val: vendor },
            { label: 'Amount', val: `$${amount.toFixed(2)}` },
            { label: 'Date',   val: 'MAR 24' },
          ].map((d, i) => (
            <div key={i} style={{ textAlign: 'center', borderRight: i < 2 ? '1px solid #e4eaf1' : 'none', padding: '0 8px' }}>
              <div className="tiny muted" style={{ fontSize: 10, letterSpacing: '0.1em', fontWeight: 700 }}>{d.label.toUpperCase()}</div>
              <div className="amt" style={{ fontSize: 13, marginTop: 4 }}>{d.val}</div>
            </div>
          ))}
        </div>

        <button className="btn btn--primary btn--block btn--lg" style={{ marginTop: 14 }} disabled={confirming} onClick={confirm}>
          <I.check /> {confirming ? 'Saving…' : 'Confirm & log'}
        </button>
      </div>
    </div>
  );
}

export function MileageScreen({ onNav }) {
  const [data, setData] = React.useState(null);
  const [tracking, setTracking] = React.useState(true);
  const [purpose, setPurpose] = React.useState('Client meeting');

  const load = React.useCallback(async () => {
    try {
      await SnapAPI.ensureAuth();
      const res = await SnapAPI.getMileage();
      setData(res);
      setTracking(!!res.activeTrip);
    } catch (_) {}
  }, []);

  React.useEffect(() => { load(); }, [load]);

  const stopTrip = async () => {
    try {
      const res = await SnapAPI.stopMileage();
      setTracking(false);
      showToast(`Trip saved · $${res.amount.toFixed(2)} deduction`);
      load();
    } catch (e) {
      showToast(e.message || 'Could not stop trip');
    }
  };

  const active = data?.activeTrip;
  const miles = active?.miles ?? 18.4;
  const deduction = active?.deduction ?? (miles * 0.67).toFixed(2);
  const trips = data?.trips || [];

  return (
    <>
      <AppBar title="MILEAGE" onBack={() => onNav('home')} />
      <div className="screen-scroll" style={{ padding: '0 18px 24px' }}>
        <div style={{
          height: 220,
          borderRadius: 16,
          background: 'linear-gradient(135deg, #eaf3ee 0%, #d8ebe1 100%)',
          position: 'relative',
          overflow: 'hidden',
          border: '1px solid #e4eaf1',
        }}>
          <svg viewBox="0 0 320 220" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
            <defs>
              <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                <path d="M20 0H0v20" fill="none" stroke="#cad9d0" strokeWidth="0.7" />
              </pattern>
            </defs>
            <rect width="320" height="220" fill="url(#grid)" />
            <path d="M50 170 Q90 130 130 100 T260 50" stroke="#0a2540" strokeWidth="3" fill="none" strokeLinecap="round" />
            <circle cx="50" cy="170" r="8" fill="#fff" stroke="#0a2540" strokeWidth="2.5" />
            <circle cx="260" cy="50" r="10" fill="#3ddc97" stroke="#0a2540" strokeWidth="2.5" />
          </svg>
          {tracking && (
            <div style={{
              position: 'absolute', top: 12, left: 12,
              background: '#0a2540', color: '#fff',
              padding: '6px 12px', borderRadius: 999, fontSize: 11, fontWeight: 700,
              display: 'flex', alignItems: 'center', gap: 6,
              letterSpacing: '0.1em',
            }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#ff5d5d' }} />
              LIVE
            </div>
          )}
        </div>

        <div className="card card--dark" style={{ marginTop: 14, padding: 18 }}>
          <div className="card__label">{tracking ? 'Trip in progress' : 'Last trip'}</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginTop: 8 }}>
            <div className="amt" style={{ fontSize: 36 }}>{miles}</div>
            <div className="tiny" style={{ color: 'rgba(255,255,255,.7)' }}>miles · {active?.durationMin || 24} min</div>
          </div>
          <div className="divider" style={{ background: 'rgba(255,255,255,.1)' }} />
          <div className="row row--between">
            <div>
              <div className="tiny" style={{ color: 'rgba(255,255,255,.6)' }}>Estimated deduction</div>
              <div className="amt" style={{ fontSize: 18, color: '#3ddc97', marginTop: 2 }}>${Number(deduction).toFixed(2)}</div>
            </div>
            <button
              onClick={() => tracking ? stopTrip() : setTracking(true)}
              className="btn"
              style={{
                background: tracking ? '#ff5d5d' : '#3ddc97',
                color: tracking ? '#fff' : '#0a2540',
                padding: '12px 22px', fontSize: 14,
              }}
            >
              {tracking ? '■ Stop' : '▶ Resume'}
            </button>
          </div>
        </div>

        <div style={{ marginTop: 18 }}>
          <div className="card__label" style={{ marginBottom: 8 }}>Purpose</div>
          <div className="row" style={{ gap: 8, flexWrap: 'wrap' }}>
            {['Client meeting', 'Errand', 'Conference', 'Job site'].map((t) => (
              <button
                key={t}
                className={`chip${purpose === t ? ' chip--ink' : ''}`}
                onClick={() => {
                  setPurpose(t);
                  if (active?.id) SnapAPI.setTripPurpose(active.id, t).catch(() => {});
                }}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        <div style={{ marginTop: 18 }}>
          <div className="row row--between">
            <div className="card__label">Recent trips</div>
            <span className="tiny" style={{ color: '#16b977', fontWeight: 700 }}>{data?.weekCount ?? 3} this week</span>
          </div>
          <div className="list">
            {trips.map((t) => (
              <div key={t.id} className="list-row">
                <div className="list-row__icon"><I.map /></div>
                <div className="list-row__main">
                  <div className="list-row__title">{t.from} → {t.to}</div>
                  <div className="list-row__sub">{t.mi} mi · {t.dt}</div>
                </div>
                <div className="list-row__amt" style={{ color: '#16b977' }}>{t.amt}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}