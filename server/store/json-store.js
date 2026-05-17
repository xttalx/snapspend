const fs = require('fs');
const path = require('path');
const { v4: uuid } = require('uuid');

const DB_PATH = path.join(__dirname, '..', 'data.json');
const MILE_RATE = 0.67;

function seed() {
  return {
    users: [],
    expenses: [],
    mileageTrips: [],
    notifications: [],
    chatHistory: [],
  };
}

/** Vercel/serverless filesystems are read-only — use in-memory only */
function canPersistToDisk() {
  if (process.env.VERCEL) return false;
  if (process.env.AWS_LAMBDA_FUNCTION_NAME) return false;
  try {
    fs.accessSync(path.dirname(DB_PATH), fs.constants.W_OK);
    return true;
  } catch {
    return false;
  }
}

function load() {
  if (!canPersistToDisk()) return seed();
  if (!fs.existsSync(DB_PATH)) return seed();
  try {
    return JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
  } catch {
    return seed();
  }
}

let cache = load();

function persist() {
  if (!canPersistToDisk()) return;
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(cache, null, 2));
  } catch (_) {
    /* ignore on read-only FS */
  }
}

function formatExpenseDate(iso) {
  const d = new Date(iso + (String(iso).length === 10 ? 'T12:00:00' : ''));
  const today = new Date();
  const ymd = (x) => x.toISOString().slice(0, 10);
  if (ymd(d) === ymd(today)) return 'Today';
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  if (ymd(d) === ymd(yesterday)) return 'Yesterday';
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function mapUser(u) {
  if (!u) return null;
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    employment: u.employment,
    industry: u.industry,
    state: u.state,
    deductions: u.deductions,
  };
}

async function findUser(userId) {
  return mapUser(cache.users.find((u) => u.id === userId));
}

async function ensureProfile(authUser) {
  const id = authUser.id || uuid();
  let user = cache.users.find((u) => u.id === id);
  if (!user) {
    const email = authUser.email || `${id}@local.dev`;
    user = {
      id,
      name: authUser.user_metadata?.full_name || authUser.user_metadata?.name || email.split('@')[0],
      email,
      employment: '1099',
      industry: 'Creator/Photographer',
      state: 'California',
      deductions: [],
      createdAt: new Date().toISOString(),
    };
    cache.users.push(user);
    persist();
  }
  return mapUser(user);
}

async function findOrCreateUser({ provider, name, email }) {
  const loginEmail = email || `${provider}-${Date.now()}@snapspend.local`;
  let user = cache.users.find((u) => u.email === loginEmail);
  if (!user) {
    user = {
      id: uuid(),
      name: name || loginEmail.split('@')[0],
      email: loginEmail,
      employment: '1099',
      industry: 'Creator/Photographer',
      state: 'California',
      deductions: [],
      createdAt: new Date().toISOString(),
    };
    cache.users.push(user);
    persist();
  } else if (name) {
    user.name = name;
    persist();
  }
  return mapUser(user);
}

async function updateProfile(userId, data) {
  const user = cache.users.find((u) => u.id === userId);
  if (!user) return null;
  Object.assign(user, data);
  if (data.deductions) user.deductions = data.deductions;
  persist();
  return mapUser(user);
}

async function getExpenses(userId, filter) {
  let list = cache.expenses.filter((e) => e.userId === userId);
  if (filter === 'Deductible') list = list.filter((e) => e.deductible);
  else if (filter === 'Personal') list = list.filter((e) => !e.deductible);
  else if (filter === 'Mileage') list = list.filter((e) => e.category === 'Mileage' || e.type === 'mileage');
  else if (filter === 'Meals') list = list.filter((e) => e.category.includes('Meal'));

  const monthStart = new Date();
  monthStart.setDate(1);
  const monthExpenses = list.filter((e) => new Date(e.date) >= monthStart);
  const monthTotal = monthExpenses.reduce((s, e) => s + e.amount, 0);
  const taxSaved = monthExpenses.filter((e) => e.deductible).reduce((s, e) => {
    const factor = e.category.includes('Meal') ? 0.5 : 1;
    return s + e.amount * factor * 0.22;
  }, 0);

  return {
    expenses: list.map((e) => ({
      id: e.id,
      vendor: e.vendor,
      cat: e.category,
      amt: `$${e.amount.toFixed(2)}`,
      amount: e.amount,
      date: formatExpenseDate(e.date),
      deductible: e.deductible,
    })),
    summary: { monthTotal, taxSaved: Math.round(taxSaved * 100) / 100 },
  };
}

async function addExpense(userId, row) {
  const expense = {
    id: uuid(),
    userId,
    vendor: row.vendor,
    category: row.category,
    amount: row.amount,
    deductible: row.deductible !== false,
    type: row.type || 'other',
    date: row.date || new Date().toISOString().slice(0, 10),
    createdAt: new Date().toISOString(),
  };
  cache.expenses.unshift(expense);
  persist();
  return expense;
}

async function getMileage(userId) {
  const trips = cache.mileageTrips.filter((t) => t.userId === userId);
  const active = trips.find((t) => t.status === 'active');
  return {
    activeTrip: active ? { ...active, deduction: Math.round(active.miles * MILE_RATE * 100) / 100 } : null,
    trips: trips.map((t) => ({
      id: t.id,
      from: t.from,
      to: t.to,
      mi: String(t.miles),
      dt: formatExpenseDate(t.date),
      amt: `$${(t.miles * MILE_RATE).toFixed(2)}`,
      status: t.status,
      purpose: t.purpose,
    })),
    weekCount: trips.filter((t) => {
      const d = new Date(t.date);
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return d >= weekAgo;
    }).length,
  };
}

async function addMileageTrip(userId, row) {
  const trip = {
    id: uuid(),
    userId,
    from: row.from || 'Current location',
    to: row.to || 'Destination',
    miles: row.miles,
    durationMin: row.durationMin || Math.round(row.miles * 1.3),
    purpose: row.purpose || 'Business',
    status: row.status || 'active',
    date: row.date || new Date().toISOString().slice(0, 10),
    createdAt: new Date().toISOString(),
  };
  cache.mileageTrips.unshift(trip);
  persist();
  return trip;
}

async function stopMileage(userId) {
  const trip = cache.mileageTrips.find((t) => t.userId === userId && t.status === 'active');
  if (!trip) return null;
  trip.status = 'completed';
  const amount = Math.round(trip.miles * MILE_RATE * 100) / 100;
  await addExpense(userId, {
    vendor: `${trip.from} → ${trip.to}`,
    category: 'Mileage',
    amount,
    deductible: true,
    type: 'mileage',
    date: trip.date,
  });
  persist();
  return { trip, amount };
}

async function updateTripPurpose(tripId, userId, purpose) {
  const trip = cache.mileageTrips.find((t) => t.id === tripId && t.userId === userId);
  if (!trip) return null;
  trip.purpose = purpose;
  persist();
  return trip;
}

async function getNotifications(userId) {
  return cache.notifications.filter((n) => n.userId === userId);
}

async function markNotificationsRead(userId) {
  cache.notifications.forEach((n) => {
    if (n.userId === userId) {
      n.read = true;
      n.mint = false;
    }
  });
  persist();
}

async function addNotification(userId, row) {
  const n = {
    id: uuid(),
    userId,
    mood: row.mood || 'happy',
    title: row.title,
    sub: row.sub || '',
    time: row.time || 'now',
    read: false,
    mint: row.mint || false,
  };
  cache.notifications.unshift(n);
  persist();
  return n;
}

function computeTaxSummary(userId) {
  const expenses = cache.expenses.filter((e) => e.userId === userId && e.deductible);
  const writeOffs = expenses.reduce((s, e) => {
    if (e.category.includes('Meal')) return s + e.amount * 0.5;
    return s + e.amount;
  }, 0);
  const saved = Math.round(writeOffs * 0.22);
  const breakdown = {};
  for (const e of expenses) {
    const key = e.category.split('(')[0].trim();
    const amt = e.category.includes('Meal') ? e.amount * 0.5 : e.amount;
    breakdown[key] = (breakdown[key] || 0) + amt;
  }
  const breakdownList = Object.entries(breakdown)
    .map(([cat, amt]) => ({ cat, amt: Math.round(amt) }))
    .sort((a, b) => b.amt - a.amt);
  const count = expenses.length;
  const organizedPct = count === 0 ? 0 : Math.min(99, 70 + Math.floor(count * 2));
  return {
    federalEstimate: count === 0 ? 0 : Math.max(0, Math.round(14500 - writeOffs * 0.22)),
    writeOffs: Math.round(writeOffs),
    taxSaved: saved,
    organizedPct,
    greyFlags: count === 0 ? 0 : Math.min(5, Math.max(1, 5 - Math.floor(count / 3))),
    breakdown: breakdownList,
    isEmpty: count === 0,
  };
}

async function getTaxes(userId) {
  const summary = computeTaxSummary(userId);
  const max = Math.max(...summary.breakdown.map((b) => b.amt), 1);
  return {
    ...summary,
    breakdown: summary.breakdown.map((b) => ({
      ...b,
      pct: Math.round((b.amt / max) * 100),
    })),
  };
}

async function logChat(userId, channel, message, replies) {
  cache.chatHistory.push({
    id: uuid(),
    userId,
    channel,
    message,
    replies,
    createdAt: new Date().toISOString(),
  });
  persist();
}

module.exports = {
  MILE_RATE,
  formatExpenseDate,
  findUser,
  ensureProfile,
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
