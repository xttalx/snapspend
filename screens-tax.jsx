// screens-tax.jsx — Expenses list, Tax profile, Tax estimate, Export, AI chat

// ─────────────────────────────────────────────────────────────
// EXPENSES LIST
// ─────────────────────────────────────────────────────────────
function ExpensesScreen({ onNav }) {
  const [filter, setFilter] = React.useState('All');
  const [expenses, setExpenses] = React.useState([]);
  const [summary, setSummary] = React.useState({ monthTotal: 0, taxSaved: 0 });
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await SnapAPI.ensureAuth();
        const res = await SnapAPI.getExpenses(filter);
        if (!cancelled) {
          setExpenses(res.expenses);
          setSummary(res.summary);
        }
      } catch (_) {}
      finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [filter]);

  const filtered = expenses;
  const total = summary.monthTotal || filtered.reduce((s, e) => s + (e.amount || parseFloat(String(e.amt).replace('$', ''))), 0);

  return (
    <>
      <AppBar
        title="EXPENSES"
        onBack={() => onNav('home')}
        action={<button className="appbar__action"><I.plus /></button>}
      />
      <div style={{ padding: '0 18px 10px' }}>
        <div className="card card--mint" style={{ padding: 14 }}>
          <div className="row row--between">
            <div>
              <div className="card__label">This month</div>
              <div className="amt" style={{ fontSize: 24, marginTop: 4 }}>${total.toFixed(2)}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div className="card__label">Tax saved</div>
              <div className="amt" style={{ fontSize: 18, color: '#16b977', marginTop: 4 }}>${(summary.taxSaved || 0).toFixed(2)}</div>
            </div>
          </div>
        </div>

        <div className="row" style={{ gap: 8, marginTop: 12, overflowX: 'auto', paddingBottom: 2 }}>
          {['All', 'Deductible', 'Personal', 'Mileage', 'Meals'].map((f) => (
            <button key={f}
              onClick={() => setFilter(f)}
              className={`chip${filter === f ? ' chip--ink' : ''}`}
              style={{ flexShrink: 0 }}>
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="screen-scroll" style={{ padding: '0 18px 24px' }}>
        {loading && <div className="center muted" style={{ padding: 20 }}>Loading expenses…</div>}
        <div className="list">
          {filtered.map((e, i) => (
            <div key={e.id || i} className="list-row" onClick={() => onNav('home')} style={{ cursor: 'pointer' }}>
              <div className="list-row__icon" style={{
                background: e.deductible ? '#e6faf1' : '#f7f9fc',
                color: e.deductible ? '#16b977' : '#5a6f87',
              }}>
                <I.receipt />
              </div>
              <div className="list-row__main">
                <div className="list-row__title">{e.vendor}</div>
                <div className="list-row__sub">
                  {e.cat} · {e.date}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div className="list-row__amt">{e.amt}</div>
                {e.deductible && <div className="tiny" style={{ color: '#16b977', fontWeight: 700 }}>Deductible</div>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

// ─────────────────────────────────────────────────────────────
// TAX PROFILE
// ─────────────────────────────────────────────────────────────
function ProfileScreen({ onNav }) {
  const [emp, setEmp] = React.useState('1099');
  const [industry, setIndustry] = React.useState('Creator/Photographer');
  const [state, setState] = React.useState('California');
  const [deds, setDeds] = React.useState(new Set(['camera', 'software', 'office']));
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await SnapAPI.ensureAuth();
        const p = await SnapAPI.getProfile();
        if (cancelled) return;
        if (p.employment) setEmp(p.employment);
        if (p.industry) setIndustry(p.industry);
        if (p.state) setState(p.state);
        if (p.deductions) setDeds(new Set(p.deductions));
      } catch (_) {}
    })();
    return () => { cancelled = true; };
  }, []);

  const toggle = (k) => {
    const next = new Set(deds);
    next.has(k) ? next.delete(k) : next.add(k);
    setDeds(next);
  };

  const empOptions = [
    { id: 'w2',   label: 'W-2',     sub: 'Employee' },
    { id: '1099', label: '1099',    sub: 'Freelancer' },
    { id: 'biz',  label: 'Small Biz', sub: 'Owner' },
  ];
  const dedOptions = [
    { id: 'camera',   label: 'Camera & lenses', icon: '📷' },
    { id: 'software', label: 'Software',        icon: '💻' },
    { id: 'office',   label: 'Home office',     icon: '🏠' },
    { id: 'mileage',  label: 'Mileage',         icon: '🚗' },
    { id: 'meals',    label: 'Client meals',    icon: '🍽' },
    { id: 'travel',   label: 'Travel',          icon: '✈' },
  ];

  return (
    <>
      <AppBar title="TAX PROFILE" onBack={() => onNav('home')} />
      <div className="screen-scroll" style={{ padding: '0 18px 24px' }}>
        <div className="hero" style={{ padding: '0 0 14px' }}>
          <h1 style={{ fontSize: 26 }}>Tell me about<br/>your work.</h1>
          <p style={{ marginTop: 6 }}>Snap uses this to surface the right deductions automatically.</p>
        </div>

        {/* employment status */}
        <div style={{ marginTop: 10 }}>
          <div className="row row--between" style={{ marginBottom: 8 }}>
            <span className="card__label">Employment status</span>
            <div style={{ width: 32, height: 18, borderRadius: 999, background: '#3ddc97', position: 'relative' }}>
              <span style={{ position: 'absolute', right: 2, top: 2, width: 14, height: 14, borderRadius: '50%', background: '#fff' }} />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
            {empOptions.map((o) => (
              <button key={o.id}
                onClick={() => setEmp(o.id)}
                className="card"
                style={{
                  textAlign: 'center', padding: '14px 8px',
                  background: emp === o.id ? '#e6faf1' : '#fff',
                  borderColor: emp === o.id ? '#16b977' : '#e4eaf1',
                  borderWidth: emp === o.id ? 2 : 1,
                  cursor: 'pointer',
                }}>
                <div style={{ fontWeight: 700, fontSize: 13 }}>{o.label}</div>
                <div className="tiny muted">{o.sub}</div>
              </button>
            ))}
          </div>
        </div>

        {/* industry */}
        <div style={{ marginTop: 18 }}>
          <div className="card__label" style={{ marginBottom: 8 }}>Industry</div>
          <div className="row row--between input" style={{ cursor: 'pointer' }}>
            <span style={{ fontWeight: 600 }}>{industry}</span>
            <I.chev style={{ transform: 'rotate(90deg)', color: '#5a6f87' }} />
          </div>
        </div>

        {/* state */}
        <div style={{ marginTop: 14 }}>
          <div className="card__label" style={{ marginBottom: 8 }}>State filing</div>
          <div className="row row--between input" style={{ cursor: 'pointer' }}>
            <span style={{ fontWeight: 600 }}>{state}</span>
            <I.chev style={{ transform: 'rotate(90deg)', color: '#5a6f87' }} />
          </div>
        </div>

        {/* deductions */}
        <div style={{ marginTop: 18 }}>
          <div className="card__label" style={{ marginBottom: 8 }}>Deduction checklist</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {dedOptions.map((d) => {
              const on = deds.has(d.id);
              return (
                <button key={d.id}
                  onClick={() => toggle(d.id)}
                  className="card"
                  style={{
                    textAlign: 'left', padding: 12, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: 10,
                    background: on ? '#e6faf1' : '#fff',
                    borderColor: on ? '#16b977' : '#e4eaf1',
                    borderWidth: on ? 2 : 1,
                  }}>
                  <span style={{ fontSize: 22 }}>{d.icon}</span>
                  <span style={{ fontWeight: 600, fontSize: 13, flex: 1 }}>{d.label}</span>
                  {on && <I.check style={{ color: '#16b977' }} />}
                </button>
              );
            })}
          </div>
        </div>

        <button
          className="btn btn--primary btn--block btn--lg"
          style={{ marginTop: 22 }}
          disabled={saving}
          onClick={async () => {
            setSaving(true);
            try {
              await SnapAPI.saveProfile({
                employment: emp,
                industry,
                state,
                deductions: [...deds],
              });
              showToast('Profile saved');
              onNav('home');
            } catch (e) {
              showToast(e.message || 'Save failed');
            } finally {
              setSaving(false);
            }
          }}
        >
          {saving ? 'Saving…' : 'Save profile'}
        </button>
      </div>
    </>
  );
}

// ─────────────────────────────────────────────────────────────
// TAX ESTIMATE (dashboard)
// ─────────────────────────────────────────────────────────────
function TaxesScreen({ onNav }) {
  const [tax, setTax] = React.useState(null);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await SnapAPI.ensureAuth();
        const res = await SnapAPI.getTaxes();
        if (!cancelled) setTax(res);
      } catch (_) {}
    })();
    return () => { cancelled = true; };
  }, []);

  const breakdown = tax?.breakdown?.length ? tax.breakdown : [
    { cat: 'Software', amt: 420, pct: 24 },
    { cat: 'Equipment', amt: 980, pct: 56 },
  ];
  const max = Math.max(...breakdown.map((b) => b.amt), 1);

  return (
    <>
      <AppBar
        title="TAXES"
        onBack={() => onNav('home')}
        action={<button className="appbar__action"><I.chart /></button>}
      />
      <div className="screen-scroll" style={{ padding: '0 18px 24px' }}>
        {/* Big number */}
        <div className="card card--dark" style={{ padding: 20, borderRadius: 18 }}>
          <div className="card__label">2025 federal estimate</div>
          <div className="amt" style={{ fontSize: 44, marginTop: 6 }}>${(tax?.federalEstimate ?? 14500).toLocaleString()}</div>
          <div className="row" style={{ marginTop: 4, gap: 8 }}>
            <span className="chip chip--mint" style={{ padding: '4px 10px' }}>
              <I.trend /> ${(tax?.writeOffs ?? 2850).toLocaleString()} in write-offs
            </span>
          </div>
          <div style={{ marginTop: 14 }}>
            <div className="row row--between tiny" style={{ color: 'rgba(255,255,255,.7)', marginBottom: 6 }}>
              <span>Q1 progress</span><span>{tax?.organizedPct ?? 90}% organized</span>
            </div>
            <div className="progress" style={{ background: 'rgba(255,255,255,.15)' }}>
              <div className="progress__fill" style={{ width: `${tax?.organizedPct ?? 90}%` }} />
            </div>
          </div>
        </div>

        {/* Snap insight */}
        <div className="card" style={{ marginTop: 12, padding: 14, display: 'flex', gap: 12, alignItems: 'flex-start' }}>
          <Avatar size={36} mood="wow" />
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: 14 }}>You're crushing it 🔥</div>
            <div className="tiny muted" style={{ marginTop: 2 }}>
              You've found <b style={{ color: '#16b977' }}>$340 more</b> in deductions than this time last year.
            </div>
          </div>
        </div>

        {/* breakdown chart */}
        <div style={{ marginTop: 18 }}>
          <div className="card__label" style={{ marginBottom: 10 }}>Write-offs by category</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {breakdown.map((b) => (
              <div key={b.cat}>
                <div className="row row--between tiny" style={{ marginBottom: 4 }}>
                  <span style={{ fontWeight: 600, color: '#0a2540' }}>{b.cat}</span>
                  <span className="amt">${b.amt}</span>
                </div>
                <div style={{ height: 8, background: '#f7f9fc', borderRadius: 999, overflow: 'hidden' }}>
                  <div style={{ width: `${b.amt / max * 100}%`, height: '100%', background: '#3ddc97', borderRadius: 999 }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* next steps */}
        <div style={{ marginTop: 18 }}>
          <div className="card__label" style={{ marginBottom: 8 }}>Next steps</div>
          <div className="list" style={{ background: '#fff', border: '1px solid #e4eaf1', borderRadius: 14, padding: '0 14px' }}>
            <div className="list-row" onClick={() => onNav('expenses')} style={{ cursor: 'pointer' }}>
              <div className="list-row__icon" style={{ background: '#e6faf1', color: '#16b977' }}><I.flag /></div>
              <div className="list-row__main">
                <div className="list-row__title">Resolve 5 grey flags</div>
                <div className="list-row__sub">Snap needs help categorizing</div>
              </div>
              <I.chev style={{ color: '#5a6f87' }} />
            </div>
            <div className="list-row" onClick={() => onNav('export')} style={{ cursor: 'pointer' }}>
              <div className="list-row__icon" style={{ background: '#e6faf1', color: '#16b977' }}><I.download /></div>
              <div className="list-row__main">
                <div className="list-row__title">Export tax bundle</div>
                <div className="list-row__sub">Schedule C, receipts, summary</div>
              </div>
              <I.chev style={{ color: '#5a6f87' }} />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

// ─────────────────────────────────────────────────────────────
// EXPORT TAX BUNDLE
// ─────────────────────────────────────────────────────────────
function ExportScreen({ onNav }) {
  const [items, setItems] = React.useState({ schedC: true, allReceipts: false, mileage: true, summary: true });
  const [tax, setTax] = React.useState(null);
  const [exporting, setExporting] = React.useState(false);
  const toggle = (k) => setItems({ ...items, [k]: !items[k] });

  React.useEffect(() => {
    SnapAPI.ensureAuth().then(() => SnapAPI.getTaxes()).then(setTax).catch(() => {});
  }, []);

  return (
    <>
      <AppBar title="TAX PREP & EXPORT" onBack={() => onNav('taxes')} />
      <div className="screen-scroll" style={{ padding: '0 18px 24px' }}>
        {/* Banner */}
        <div className="card" style={{ background: '#0a2540', color: '#fff', padding: 16, borderColor: 'transparent' }}>
          <div style={{ fontSize: 11, letterSpacing: '0.14em', fontWeight: 700, opacity: .65 }}>
            TAX YEAR 2025 REVIEW
          </div>
          <div className="row" style={{ marginTop: 8, gap: 12 }}>
            <div className="amt" style={{ fontSize: 22 }}>90%</div>
            <div style={{ flex: 1 }}>
              <div className="progress" style={{ background: 'rgba(255,255,255,.15)' }}>
                <div className="progress__fill" style={{ width: '90%' }} />
              </div>
              <div className="tiny" style={{ color: 'rgba(255,255,255,.7)', marginTop: 4 }}>
                Almost ready — 5 grey flags to resolve.
              </div>
            </div>
          </div>
        </div>

        {/* numbered steps */}
        <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[
            { n: 1, t: 'Organize receipts',     btn: 'Review all',     done: true,  onClick: () => onNav('expenses') },
            { n: 2, t: 'Resolve 5 grey areas',  btn: 'Resolve flags',  done: false },
            { n: 3, t: 'Export tax bundle',     btn: 'Pick what to export', done: false },
          ].map((s) => (
            <div key={s.n} className="card" style={{ padding: 14 }}>
              <div className="row" style={{ gap: 12 }}>
                <div style={{
                  width: 32, height: 32, borderRadius: '50%',
                  background: s.done ? '#3ddc97' : '#e6faf1',
                  color: s.done ? '#0a2540' : '#16b977',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 700, fontSize: 14,
                }}>
                  {s.done ? <I.check /> : s.n}
                </div>
                <div style={{ flex: 1, fontWeight: 700, fontSize: 15 }}>{s.t}</div>
              </div>
              <button
                onClick={s.onClick}
                className="btn btn--block"
                style={{
                  marginTop: 10,
                  background: s.done ? '#f7f9fc' : '#0a2540',
                  color: s.done ? '#5a6f87' : '#fff',
                  fontSize: 13, padding: '11px',
                }}>
                {s.btn}
              </button>
            </div>
          ))}
        </div>

        {/* export options */}
        <div className="card" style={{ marginTop: 14, padding: 16 }}>
          <div className="card__label" style={{ marginBottom: 12 }}>Include in export</div>
          {[
            { id: 'schedC',      label: 'Schedule C (PDF)',  sub: 'Pre-filled IRS form' },
            { id: 'allReceipts', label: 'All receipts (ZIP)',sub: '142 photos · 8.2 MB' },
            { id: 'mileage',     label: 'Mileage log (CSV)', sub: '6,124 mi tracked' },
            { id: 'summary',     label: 'Year summary (PDF)',sub: 'For your accountant' },
          ].map((o) => (
            <div key={o.id} className="row" style={{ gap: 12, padding: '10px 0', borderBottom: '1px solid #eef2f7' }}>
              <button onClick={() => toggle(o.id)} style={{
                width: 22, height: 22, borderRadius: 6,
                border: '1.5px solid ' + (items[o.id] ? '#0a2540' : '#cbd6e0'),
                background: items[o.id] ? '#0a2540' : '#fff',
                color: '#fff', cursor: 'pointer', padding: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}>
                {items[o.id] && <I.check />}
              </button>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{o.label}</div>
                <div className="tiny muted">{o.sub}</div>
              </div>
            </div>
          ))}

          <button className="btn btn--block" style={{ marginTop: 14, background: '#f7f9fc', color: '#0a2540', fontSize: 14 }}>
            Send to TurboTax / accountant →
          </button>
        </div>

        <div className="row row--between" style={{ marginTop: 18, padding: '0 4px' }}>
          <span className="muted">Final estimate</span>
          <span className="amt" style={{ fontSize: 18 }}>${(tax?.federalEstimate ?? 14500).toLocaleString()}</span>
        </div>

        <button
          className="btn btn--mint btn--block btn--lg"
          style={{ marginTop: 12 }}
          disabled={exporting}
          onClick={async () => {
            setExporting(true);
            try {
              const res = await SnapAPI.exportBundle(items);
              const names = res.bundle?.files?.map((f) => f.name).join(', ') || 'bundle';
              showToast(`Exported: ${names}`);
            } catch (e) {
              showToast(e.message || 'Export failed');
            } finally {
              setExporting(false);
            }
          }}
        >
          <I.download /> {exporting ? 'Exporting…' : 'Export selected'}
        </button>
      </div>
    </>
  );
}

// ─────────────────────────────────────────────────────────────
// AI CHAT (deeper Q&A — separate from home)
// ─────────────────────────────────────────────────────────────
function AskScreen({ onNav }) {
  const [messages, setMessages] = React.useState([
    { kind: 'ai', mood: 'happy', text: "Ask me anything about your taxes. I've already read all your receipts and trips this year." },
  ]);
  const [draft, setDraft] = React.useState('');
  const [typing, setTyping] = React.useState(false);
  const scroller = React.useRef(null);

  const SUGGESTED = [
    "Can I deduct my home office?",
    "What's my biggest write-off?",
    "Should I file quarterly?",
    "Is this expense deductible?",
  ];

  const send = async (textArg) => {
    const text = (textArg ?? draft).trim();
    if (!text) return;
    setDraft('');
    setMessages((m) => [...m, { kind: 'user', text }]);
    setTyping(true);
    try {
      await SnapAPI.ensureAuth();
      const { replies } = await SnapAPI.chat(text, 'ask');
      setMessages((m) => [...m, ...replies]);
    } catch (_) {
      const lower = text.toLowerCase();
      let reply = [{ kind: 'ai', mood: 'happy', text: "Tell me what it is and I'll give you a yes/no." }];
      if (/home office|office/.test(lower)) {
        reply = [
          { kind: 'ai', mood: 'thinking', text: 'Yes! Since you work from home, you can deduct part of your rent and utilities.' },
        ];
      }
      setMessages((m) => [...m, ...reply]);
    } finally {
      setTyping(false);
    }
  };

  React.useEffect(() => {
    const el = scroller.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, typing]);

  return (
    <>
      <AppBar title="ASK SNAP" onBack={() => onNav('home')} />
      <div className="screen-scroll" ref={scroller}>
        <div className="chat">
          {messages.map((m, i) => {
            if (m.kind === 'ai-stat') {
              return (
                <div key={i} className="bubble-row bubble-row--ai">
                  <Avatar size={26} mood="wow" />
                  <div className="bubble bubble--card" style={{ background: '#0a2540', color: '#fff', borderColor: 'transparent' }}>
                    <div className="tiny" style={{ color: 'rgba(255,255,255,.65)', letterSpacing: '0.1em', fontWeight: 700, textTransform: 'uppercase' }}>
                      {m.stat.label}
                    </div>
                    <div className="amt" style={{ fontSize: 22, marginTop: 4, color: '#3ddc97' }}>{m.stat.val}</div>
                    <div className="tiny" style={{ color: 'rgba(255,255,255,.7)', marginTop: 4 }}>{m.stat.sub}</div>
                  </div>
                </div>
              );
            }
            return <ChatMessage key={i} m={m} onNav={onNav} />;
          })}
          {typing && (
            <div className="bubble-row bubble-row--ai">
              <Avatar size={26} mood="thinking" />
              <div className="bubble bubble--ai"><div className="dots"><span/><span/><span/></div></div>
            </div>
          )}
        </div>
      </div>

      {messages.length < 3 && (
        <div className="quick">
          {SUGGESTED.map((s) => (
            <button key={s} className="chip" onClick={() => send(s)}>{s}</button>
          ))}
        </div>
      )}

      <div className="composer">
        <input
          className="composer__input"
          placeholder="Ask Snap anything about taxes…"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') send(); }}
        />
        <button className={`composer__btn${draft.trim() ? '' : ' composer__btn--ghost'}`} onClick={() => send()} aria-label="Send">
          {draft.trim() ? <I.send /> : <I.mic />}
        </button>
      </div>
    </>
  );
}

Object.assign(window, { ExpensesScreen, ProfileScreen, TaxesScreen, ExportScreen, AskScreen });
