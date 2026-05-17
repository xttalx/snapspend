const { getSupabase } = require('../supabase');

const MILE_RATE = parseFloat(process.env.MILE_RATE || '0.67');

function formatExpenseDate(iso) {
  const d = new Date(String(iso).length === 10 ? `${iso}T12:00:00` : iso);
  const today = new Date();
  const ymd = (x) => x.toISOString().slice(0, 10);
  if (ymd(d) === ymd(today)) return 'Today';
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  if (ymd(d) === ymd(yesterday)) return 'Yesterday';
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function mapProfile(row) {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    employment: row.employment,
    industry: row.industry,
    state: row.state,
    deductions: row.deductions || [],
  };
}

async function findUser(userId) {
  const sb = getSupabase();
  const { data, error } = await sb.from('profiles').select('*').eq('id', userId).single();
  if (error) throw error;
  return mapProfile(data);
}

async function seedDemoData(userId) {
  const sb = getSupabase();
  const { count } = await sb.from('expenses').select('*', { count: 'exact', head: true }).eq('user_id', userId);
  if (count > 0) return;

  const expenses = [
    { user_id: userId, vendor: 'Staples', category: 'Office supplies', amount: 62.8, deductible: true, type: 'receipt' },
    { user_id: userId, vendor: 'Adobe Sub', category: 'Software', amount: 20.99, deductible: true, type: 'subscription' },
    { user_id: userId, vendor: 'Client lunch', category: 'Meals (50%)', amount: 45, deductible: true, type: 'meal' },
    { user_id: userId, vendor: 'Coffee', category: 'Personal', amount: 5.4, deductible: false, type: 'other' },
  ];
  await sb.from('expenses').insert(expenses);
  await sb.from('mileage_trips').insert({
    user_id: userId,
    from_place: 'Home',
    to_place: 'Airport (SFO)',
    miles: 18.4,
    duration_min: 24,
    purpose: 'Client meeting',
    status: 'active',
  });
  await sb.from('notifications').insert([
    { user_id: userId, mood: 'wow', title: "You're $340 from your savings goal!", sub: 'Tap to see how', time_label: '2m', mint: true },
    { user_id: userId, mood: 'happy', title: 'Tax estimate updated', sub: 'Check your dashboard', time_label: '1d' },
  ]);
}

async function findOrCreateUser({ provider, name, email }) {
  const sb = getSupabase();
  const loginEmail = email || `${provider}-${Date.now()}@snapspend.local`;

  let { data: existing } = await sb.from('profiles').select('*').eq('email', loginEmail).maybeSingle();

  if (!existing && provider === 'demo') {
    const { data: demo } = await sb.from('profiles').select('*').eq('email', 'alex@demo.snapspend.app').maybeSingle();
    existing = demo;
  }

  if (!existing) {
    const { data: created, error } = await sb.from('profiles').insert({
      name: name || 'Alex',
      email: loginEmail,
      auth_provider: provider,
    }).select().single();
    if (error) throw error;
    existing = created;
    await seedDemoData(existing.id);
  } else if (name && name !== existing.name) {
    const { data: updated } = await sb.from('profiles').update({ name }).eq('id', existing.id).select().single();
    existing = updated || existing;
  }

  return mapProfile(existing);
}

async function updateProfile(userId, data) {
  const sb = getSupabase();
  const patch = {};
  if (data.employment) patch.employment = data.employment;
  if (data.industry) patch.industry = data.industry;
  if (data.state) patch.state = data.state;
  if (data.name) patch.name = data.name;
  if (data.deductions) patch.deductions = data.deductions;

  const { data: row, error } = await sb.from('profiles').update(patch).eq('id', userId).select().single();
  if (error) throw error;
  return mapProfile(row);
}

async function getExpenses(userId, filter) {
  const sb = getSupabase();
  const { data: rows, error } = await sb.from('expenses').select('*').eq('user_id', userId).order('expense_date', { ascending: false });
  if (error) throw error;

  let list = rows || [];
  if (filter === 'Deductible') list = list.filter((e) => e.deductible);
  else if (filter === 'Personal') list = list.filter((e) => !e.deductible);
  else if (filter === 'Mileage') list = list.filter((e) => e.category === 'Mileage' || e.type === 'mileage');
  else if (filter === 'Meals') list = list.filter((e) => e.category.includes('Meal'));

  const monthStart = new Date();
  monthStart.setDate(1);
  const monthExpenses = list.filter((e) => new Date(e.expense_date) >= monthStart);
  const monthTotal = monthExpenses.reduce((s, e) => s + Number(e.amount), 0);
  const taxSaved = monthExpenses.filter((e) => e.deductible).reduce((s, e) => {
    const factor = e.category.includes('Meal') ? 0.5 : 1;
    return s + Number(e.amount) * factor * 0.22;
  }, 0);

  return {
    expenses: list.map((e) => ({
      id: e.id,
      vendor: e.vendor,
      cat: e.category,
      amt: `$${Number(e.amount).toFixed(2)}`,
      amount: Number(e.amount),
      date: formatExpenseDate(e.expense_date),
      deductible: e.deductible,
    })),
    summary: { monthTotal, taxSaved: Math.round(taxSaved * 100) / 100 },
  };
}

async function addExpense(userId, row) {
  const sb = getSupabase();
  const { data, error } = await sb.from('expenses').insert({
    user_id: userId,
    vendor: row.vendor,
    category: row.category,
    amount: row.amount,
    deductible: row.deductible !== false,
    type: row.type || 'other',
    expense_date: row.date || new Date().toISOString().slice(0, 10),
  }).select().single();
  if (error) throw error;
  return data;
}

async function getMileage(userId) {
  const sb = getSupabase();
  const { data: rows, error } = await sb.from('mileage_trips').select('*').eq('user_id', userId).order('trip_date', { ascending: false });
  if (error) throw error;

  const trips = rows || [];
  const active = trips.find((t) => t.status === 'active');
  return {
    activeTrip: active ? {
      id: active.id,
      from: active.from_place,
      to: active.to_place,
      miles: Number(active.miles),
      durationMin: active.duration_min,
      purpose: active.purpose,
      status: active.status,
      date: active.trip_date,
      deduction: Math.round(Number(active.miles) * MILE_RATE * 100) / 100,
    } : null,
    trips: trips.map((t) => ({
      id: t.id,
      from: t.from_place,
      to: t.to_place,
      mi: String(t.miles),
      dt: formatExpenseDate(t.trip_date),
      amt: `$${(Number(t.miles) * MILE_RATE).toFixed(2)}`,
      status: t.status,
      purpose: t.purpose,
    })),
    weekCount: trips.filter((t) => {
      const d = new Date(t.trip_date);
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return d >= weekAgo;
    }).length,
  };
}

async function addMileageTrip(userId, row) {
  const sb = getSupabase();
  const { data, error } = await sb.from('mileage_trips').insert({
    user_id: userId,
    from_place: row.from || 'Current location',
    to_place: row.to || 'Destination',
    miles: row.miles,
    duration_min: row.durationMin || Math.round(row.miles * 1.3),
    purpose: row.purpose || 'Business',
    status: row.status || 'active',
    trip_date: row.date || new Date().toISOString().slice(0, 10),
  }).select().single();
  if (error) throw error;
  return {
    id: data.id,
    from: data.from_place,
    to: data.to_place,
    miles: Number(data.miles),
    durationMin: data.duration_min,
    purpose: data.purpose,
    status: data.status,
    date: data.trip_date,
  };
}

async function stopMileage(userId) {
  const sb = getSupabase();
  const { data: active, error: findErr } = await sb.from('mileage_trips').select('*').eq('user_id', userId).eq('status', 'active').maybeSingle();
  if (findErr) throw findErr;
  if (!active) return null;

  await sb.from('mileage_trips').update({ status: 'completed' }).eq('id', active.id);
  const amount = Math.round(Number(active.miles) * MILE_RATE * 100) / 100;
  await addExpense(userId, {
    vendor: `${active.from_place} → ${active.to_place}`,
    category: 'Mileage',
    amount,
    deductible: true,
    type: 'mileage',
    date: active.trip_date,
  });

  return {
    trip: {
      id: active.id,
      from: active.from_place,
      to: active.to_place,
      miles: Number(active.miles),
    },
    amount,
  };
}

async function updateTripPurpose(tripId, userId, purpose) {
  const sb = getSupabase();
  const { data, error } = await sb.from('mileage_trips').update({ purpose }).eq('id', tripId).eq('user_id', userId).select().single();
  if (error) throw error;
  return data;
}

async function getNotifications(userId) {
  const sb = getSupabase();
  const { data, error } = await sb.from('notifications').select('*').eq('user_id', userId).order('created_at', { ascending: false });
  if (error) throw error;
  return (data || []).map((n) => ({
    id: n.id,
    mood: n.mood,
    title: n.title,
    sub: n.sub,
    time: n.time_label,
    read: n.read,
    mint: n.mint,
  }));
}

async function markNotificationsRead(userId) {
  const sb = getSupabase();
  await sb.from('notifications').update({ read: true, mint: false }).eq('user_id', userId);
}

async function addNotification(userId, row) {
  const sb = getSupabase();
  const { data, error } = await sb.from('notifications').insert({
    user_id: userId,
    mood: row.mood || 'happy',
    title: row.title,
    sub: row.sub || '',
    time_label: row.time || 'now',
    mint: row.mint || false,
  }).select().single();
  if (error) throw error;
  return data;
}

async function computeTaxSummary(userId) {
  const sb = getSupabase();
  const { data: rows, error } = await sb.from('expenses').select('*').eq('user_id', userId).eq('deductible', true);
  if (error) throw error;

  const expenses = rows || [];
  const writeOffs = expenses.reduce((s, e) => {
    const amount = Number(e.amount);
    if (e.category.includes('Meal')) return s + amount * 0.5;
    return s + amount;
  }, 0);
  const liability = Math.max(12000, Math.round(14500 - writeOffs * 0.22));
  const saved = Math.round(writeOffs * 0.22);
  const breakdown = {};
  for (const e of expenses) {
    const amount = Number(e.amount);
    const key = e.category.split('(')[0].trim();
    const amt = e.category.includes('Meal') ? amount * 0.5 : amount;
    breakdown[key] = (breakdown[key] || 0) + amt;
  }
  const breakdownList = Object.entries(breakdown)
    .map(([cat, amt]) => ({ cat, amt: Math.round(amt) }))
    .sort((a, b) => b.amt - a.amt);
  const organizedPct = Math.min(99, 70 + Math.floor(expenses.length * 2));

  return {
    federalEstimate: liability,
    writeOffs: Math.round(writeOffs),
    taxSaved: saved,
    organizedPct,
    greyFlags: 5,
    breakdown: breakdownList,
  };
}

async function getTaxes(userId) {
  const summary = await computeTaxSummary(userId);
  const max = Math.max(...summary.breakdown.map((b) => b.amt), 1);
  return {
    ...summary,
    breakdown: summary.breakdown.map((b) => ({
      ...b,
      pct: Math.round((b.amt / max) * 100),
    })),
  };
}

async function logChat() {
  /* optional: add chat_logs table later */
}

module.exports = {
  MILE_RATE,
  formatExpenseDate,
  findUser,
  findOrCreateUser,
  updateProfile,
  getExpenses,
  addExpense,
  getMileage,
  addMileageTrip,
  stopMileage,
  updateTripPurpose,
  getNotifications,
  markNotificationsRead,
  addNotification,
  getTaxes,
  computeTaxSummary,
  logChat,
};
