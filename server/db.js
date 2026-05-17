const fs = require('fs');
const path = require('path');
const { v4: uuid } = require('uuid');

const DB_PATH = path.join(__dirname, 'data.json');

const MILE_RATE = 0.67;

function seed() {
  const now = new Date().toISOString();
  return {
    users: [
      {
        id: 'user-1',
        name: 'Alex',
        email: 'alex@example.com',
        employment: '1099',
        industry: 'Creator/Photographer',
        state: 'California',
        deductions: ['camera', 'software', 'office'],
        createdAt: now,
      },
    ],
    sessions: [],
    expenses: [
      { id: uuid(), userId: 'user-1', vendor: 'Staples', category: 'Office supplies', amount: 62.8, deductible: true, type: 'receipt', date: '2026-03-24', createdAt: now },
      { id: uuid(), userId: 'user-1', vendor: 'Adobe Sub', category: 'Software', amount: 20.99, deductible: true, type: 'subscription', date: '2026-03-24', createdAt: now },
      { id: uuid(), userId: 'user-1', vendor: 'Client lunch', category: 'Meals (50%)', amount: 45, deductible: true, type: 'meal', date: '2026-03-23', createdAt: now },
      { id: uuid(), userId: 'user-1', vendor: 'SFO drive', category: 'Mileage', amount: 12.32, deductible: true, type: 'mileage', date: '2026-03-23', createdAt: now },
      { id: uuid(), userId: 'user-1', vendor: 'Coffee', category: 'Personal', amount: 5.4, deductible: false, type: 'other', date: '2026-03-22', createdAt: now },
      { id: uuid(), userId: 'user-1', vendor: 'Notion Plus', category: 'Software', amount: 10, deductible: true, type: 'subscription', date: '2026-03-21', createdAt: now },
      { id: uuid(), userId: 'user-1', vendor: 'WeWork day pass', category: 'Office', amount: 29, deductible: true, type: 'office', date: '2026-03-20', createdAt: now },
      { id: uuid(), userId: 'user-1', vendor: 'Camera lens', category: 'Equipment', amount: 340, deductible: true, type: 'equipment', date: '2026-03-18', createdAt: now },
    ],
    mileageTrips: [
      { id: uuid(), userId: 'user-1', from: 'Home', to: 'Airport (SFO)', miles: 18.4, durationMin: 24, purpose: 'Client meeting', status: 'active', date: '2026-03-24', createdAt: now },
      { id: uuid(), userId: 'user-1', from: 'Studio', to: 'Client (SoMa)', miles: 6.2, durationMin: 18, purpose: 'Client meeting', status: 'completed', date: '2026-03-22', createdAt: now },
      { id: uuid(), userId: 'user-1', from: 'Office', to: 'Trade show', miles: 24.1, durationMin: 42, purpose: 'Conference', status: 'completed', date: '2026-03-17', createdAt: now },
    ],
    notifications: [
      { id: uuid(), userId: 'user-1', mood: 'wow', title: "You're $340 from your savings goal!", sub: 'Tap to see how', time: '2m', read: false, mint: true },
      { id: uuid(), userId: 'user-1', mood: 'thinking', title: 'Found 3 receipts you forgot to categorize', sub: 'Last seen Mar 24', time: '1h', read: false },
      { id: uuid(), userId: 'user-1', mood: 'happy', title: 'Mileage logged: Airport drive', sub: '18.4 mi · $12.32 saved', time: '3h', read: false },
      { id: uuid(), userId: 'user-1', mood: 'happy', title: 'Tax estimate updated', sub: '$14,500 · down $120 this week', time: '1d', read: false },
      { id: uuid(), userId: 'user-1', mood: 'wow', title: 'Quarterly estimated tax due Apr 15', sub: 'Snap can file this for you', time: '2d', read: false },
    ],
    chatHistory: [],
  };
}

function load() {
  if (!fs.existsSync(DB_PATH)) {
    const data = seed();
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
    return data;
  }
  return JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
}

function save(data) {
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
}

let cache = load();

function getDb() {
  return cache;
}

function persist() {
  save(cache);
}

function resetDb() {
  cache = seed();
  persist();
}

function findUser(userId) {
  return cache.users.find((u) => u.id === userId);
}

function getSession(token) {
  const session = cache.sessions.find((s) => s.token === token);
  if (!session) return null;
  if (new Date(session.expiresAt) < new Date()) return null;
  return session;
}

function formatExpenseDate(iso) {
  const d = new Date(iso + (iso.length === 10 ? 'T12:00:00' : ''));
  const today = new Date();
  const ymd = (x) => x.toISOString().slice(0, 10);
  if (ymd(d) === ymd(today)) return 'Today';
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  if (ymd(d) === ymd(yesterday)) return 'Yesterday';
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function computeTaxSummary(userId) {
  const expenses = cache.expenses.filter((e) => e.userId === userId && e.deductible);
  const writeOffs = expenses.reduce((s, e) => {
    if (e.category.includes('Meals')) return s + e.amount * 0.5;
    return s + e.amount;
  }, 0);
  const liability = Math.max(12000, Math.round(14500 - writeOffs * 0.22));
  const saved = Math.round(writeOffs * 0.22);
  const breakdown = {};
  for (const e of expenses) {
    const key = e.category.split('(')[0].trim();
    const amt = e.category.includes('Meals') ? e.amount * 0.5 : e.amount;
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

module.exports = {
  DB_PATH,
  MILE_RATE,
  getDb,
  persist,
  resetDb,
  findUser,
  getSession,
  formatExpenseDate,
  computeTaxSummary,
  uuid,
};
