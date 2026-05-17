const express = require('express');
const store = require('./store');
const { signToken, verifySupabaseToken, resolveUserId, isSupabaseAuth } = require('./auth');
const { isConfigured } = require('./supabase');
const { supabaseUrl, supabaseAnonKey } = require('./env');
const { homeChatReply, askChatReply, mockScanReceipt } = require('./services/chat');
const anthropic = require('./services/anthropic');

const router = express.Router();

function bearerToken(req) {
  const header = req.headers.authorization || '';
  return header.startsWith('Bearer ') ? header.slice(7) : null;
}

async function auth(req, res, next) {
  const token = bearerToken(req);
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  try {
    const userId = await resolveUserId(token);
    if (!userId) return res.status(401).json({ error: 'Invalid or expired token' });
    req.userId = userId;
    next();
  } catch (e) {
    console.error('auth', e);
    res.status(401).json({ error: 'Unauthorized' });
  }
}

router.get('/health', (_req, res) => {
  const supabase = isConfigured();
  res.json({
    ok: true,
    service: 'snapspend-api',
    database: supabase ? 'supabase' : (process.env.VERCEL ? 'none (set SUPABASE_URL on Vercel)' : 'json'),
    auth: isSupabaseAuth() ? 'supabase' : 'jwt',
    ai: anthropic.isConfigured() ? `anthropic (${anthropic.getModel()})` : 'rules-only',
  });
});

router.get('/auth/config', (_req, res) => {
  const url = supabaseUrl();
  const anonKey = supabaseAnonKey();
  const serverOk = isConfigured();
  res.json({
    supabase: !!(url && anonKey && serverOk),
    supabaseUrl: url || null,
    supabaseAnonKey: anonKey || null,
    hint: serverOk && !anonKey
      ? 'Set VITE_SUPABASE_ANON_KEY (anon/public key) in Vercel env vars'
      : !serverOk
        ? 'Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in Vercel env vars'
        : null,
  });
});

router.post('/auth/session', async (req, res) => {
  try {
    if (!isConfigured()) {
      return res.status(400).json({ error: 'Supabase not configured' });
    }
    const token = bearerToken(req);
    const authUser = await verifySupabaseToken(token);
    if (!authUser) return res.status(401).json({ error: 'Invalid session' });
    const user = await store.ensureProfile(authUser);
    res.json({ user });
  } catch (e) {
    console.error('session', e);
    res.status(500).json({ error: e.message || 'Session failed' });
  }
});

/** Local dev only — when Supabase env vars are not set */
router.post('/auth/login', async (req, res) => {
  try {
    if (isConfigured()) {
      return res.status(400).json({ error: 'Use the app sign-in (Supabase Auth)' });
    }
    if (process.env.VERCEL) {
      return res.status(503).json({
        error: 'Server storage not available. Add SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in Vercel env settings.',
      });
    }
    const { provider = 'email', name, email } = req.body || {};
    const user = await store.findOrCreateUser({ provider, name, email });
    const token = signToken(user.id);
    res.json({ token, user: { id: user.id, name: user.name, email: user.email }, provider });
  } catch (e) {
    console.error('login', e);
    res.status(500).json({ error: e.message || 'Login failed' });
  }
});

router.get('/me', auth, async (req, res) => {
  try {
    const user = await store.findUser(req.userId);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ user });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.get('/profile', auth, async (req, res) => {
  try {
    const user = await store.findUser(req.userId);
    res.json({
      employment: user.employment,
      industry: user.industry,
      state: user.state,
      deductions: user.deductions,
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.put('/profile', auth, async (req, res) => {
  try {
    const user = await store.updateProfile(req.userId, req.body || {});
    res.json({ user });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.get('/expenses', auth, async (req, res) => {
  try {
    const data = await store.getExpenses(req.userId, req.query.filter || 'All');
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.post('/expenses', auth, async (req, res) => {
  try {
    const { vendor, category, amount, deductible = true, type = 'other' } = req.body || {};
    if (!vendor || amount == null) return res.status(400).json({ error: 'vendor and amount required' });
    const expense = await store.addExpense(req.userId, {
      vendor,
      category: category || 'Business expense',
      amount: parseFloat(amount),
      deductible,
      type,
    });
    res.status(201).json({ expense });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.post('/scan', auth, async (req, res) => {
  try {
    const result = await mockScanReceipt(req.userId);
    res.json(result);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.get('/mileage', auth, async (req, res) => {
  try {
    res.json(await store.getMileage(req.userId));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.post('/mileage/stop', auth, async (req, res) => {
  try {
    const result = await store.stopMileage(req.userId);
    if (!result) return res.status(404).json({ error: 'No active trip' });
    res.json(result);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.patch('/mileage/:id', auth, async (req, res) => {
  try {
    const trip = await store.updateTripPurpose(req.params.id, req.userId, req.body.purpose);
    if (!trip) return res.status(404).json({ error: 'Trip not found' });
    res.json({ trip });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.get('/taxes', auth, async (req, res) => {
  try {
    res.json(await store.getTaxes(req.userId));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.get('/notifications', auth, async (req, res) => {
  try {
    const notifications = await store.getNotifications(req.userId);
    res.json({ notifications });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.post('/notifications/read', auth, async (req, res) => {
  try {
    await store.markNotificationsRead(req.userId);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.post('/chat', auth, async (req, res) => {
  try {
    const { message, channel = 'home' } = req.body || {};
    if (!message?.trim()) return res.status(400).json({ error: 'message required' });
    const replies = channel === 'ask'
      ? await askChatReply(req.userId, message)
      : await homeChatReply(req.userId, message);
    await store.logChat(req.userId, channel, message, replies);
    res.json({ replies });
  } catch (e) {
    console.error('chat', e);
    res.status(500).json({ error: e.message });
  }
});

router.post('/export', auth, async (req, res) => {
  try {
    const { items = {} } = req.body || {};
    const user = await store.findUser(req.userId);
    const summary = await store.computeTaxSummary(req.userId);
    const { expenses } = await store.getExpenses(req.userId, 'All');
    const bundle = {
      exportedAt: new Date().toISOString(),
      taxYear: 2025,
      user,
      federalEstimate: summary.federalEstimate,
      expenseCount: expenses.length,
      included: items,
      files: [],
    };
    if (items.schedC) bundle.files.push({ name: 'Schedule_C.pdf', size: '124 KB' });
    if (items.allReceipts) bundle.files.push({ name: 'receipts.zip', size: '8.2 MB' });
    if (items.mileage) bundle.files.push({ name: 'mileage_log.csv', size: '12 KB' });
    if (items.summary) bundle.files.push({ name: 'year_summary.pdf', size: '89 KB' });
    res.json({ ok: true, bundle });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = { router, auth };
