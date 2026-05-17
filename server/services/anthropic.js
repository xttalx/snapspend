const store = require('../store');

const API_URL = 'https://api.anthropic.com/v1/messages';

function isConfigured() {
  return !!process.env.ANTHROPIC_API_KEY;
}

function getModel() {
  return process.env.ANTHROPIC_MODEL || 'claude-haiku-4-5-20251001';
}

function extractJson(text) {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const raw = fenced ? fenced[1].trim() : text.trim();
  const start = raw.indexOf('{');
  const end = raw.lastIndexOf('}');
  if (start === -1 || end === -1) throw new Error('No JSON in model response');
  return JSON.parse(raw.slice(start, end + 1));
}

async function buildContext(userId) {
  const user = await store.findUser(userId);
  const tax = await store.computeTaxSummary(userId);
  const { expenses } = await store.getExpenses(userId, 'All');
  const recent = expenses.slice(0, 6).map((e) => `${e.vendor} ${e.amt} (${e.cat})`).join('; ');
  return {
    userName: user?.name || 'Alex',
    employment: user?.employment || '1099',
    industry: user?.industry || 'Creator',
    federalEstimate: tax.federalEstimate,
    writeOffs: tax.writeOffs,
    taxSaved: tax.taxSaved,
    organizedPct: tax.organizedPct,
    recentExpenses: recent || 'none yet',
  };
}

const REPLY_SCHEMA = `Return ONLY valid JSON (no markdown) in this shape:
{
  "replies": [
    { "kind": "ai", "mood": "happy|thinking|wow", "text": "string" },
    { "kind": "ai-card", "card": { "title": "", "amount": "", "category": "", "tax": "", "schedule": "" } },
    { "kind": "ai-stat", "stat": { "label": "", "val": "", "sub": "" } },
    { "kind": "open-scan" }
  ],
  "actions": [
    { "type": "expense", "vendor": "", "amount": 0, "category": "", "deductible": true, "expenseType": "meal" },
    { "type": "mileage", "miles": 0, "purpose": "Business" },
    { "type": "open_scan" }
  ]
}
Use 1-3 reply bubbles. Include ai-card when logging spending or showing tax stats.
actions is optional; use expense when user states a purchase, mileage for drives, open_scan for receipt requests.`;

async function callClaude({ system, userMessage }) {
  const res = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: getModel(),
      max_tokens: 1024,
      system,
      messages: [{ role: 'user', content: userMessage }],
    }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = data.error?.message || data.message || res.statusText;
    throw new Error(`Anthropic API: ${msg}`);
  }

  const text = data.content?.find((b) => b.type === 'text')?.text;
  if (!text) throw new Error('Empty response from Anthropic');
  return extractJson(text);
}

async function runActions(userId, actions = []) {
  const replies = [];
  for (const action of actions) {
    if (action.type === 'expense' && action.amount > 0) {
      const created = await store.addExpense(userId, {
        vendor: action.vendor || 'Expense',
        category: action.category || 'Business expense',
        amount: parseFloat(action.amount),
        deductible: action.deductible !== false,
        type: action.expenseType || 'other',
      });
      replies.push({
        kind: 'ai-card',
        card: {
          title: action.cardTitle || 'Logged expense',
          amount: `$${parseFloat(action.amount).toFixed(2)}`,
          category: action.category || 'Business expense',
          tax: action.taxNote || '~tax saved',
          schedule: action.schedule || 'Schedule C',
          expenseId: created.id,
        },
      });
    }
    if (action.type === 'mileage' && action.miles > 0) {
      const miles = parseFloat(action.miles);
      const trip = await store.addMileageTrip(userId, {
        miles,
        purpose: action.purpose || 'Business',
        status: 'active',
      });
      const deduction = (miles * store.MILE_RATE).toFixed(2);
      replies.push({
        kind: 'ai-card',
        card: {
          title: 'Mileage logged',
          amount: `${miles} mi`,
          category: 'Business travel',
          tax: `~$${deduction} deduction`,
          schedule: `$${store.MILE_RATE} / mile · IRS rate`,
          tripId: trip.id,
        },
      });
    }
    if (action.type === 'open_scan') {
      replies.push({ kind: 'open-scan' });
    }
  }
  return replies;
}

async function chatWithAnthropic(userId, message, channel) {
  const ctx = await buildContext(userId);
  const mode = channel === 'ask' ? 'tax Q&A' : 'conversational expense logging';

  const system = `You are Snap, a friendly tax buddy in the SnapSpend app. Mode: ${mode}.
User: ${ctx.userName} (${ctx.employment}, ${ctx.industry}).
Tax estimate: $${ctx.federalEstimate.toLocaleString()} liability, $${ctx.writeOffs.toLocaleString()} write-offs, $${ctx.taxSaved.toLocaleString()} saved, ${ctx.organizedPct}% organized.
Recent expenses: ${ctx.recentExpenses}.
Be concise, warm, practical. Not a CPA — suggest estimates only.
${REPLY_SCHEMA}`;

  const parsed = await callClaude({ system, userMessage: message });
  const actionReplies = await runActions(userId, parsed.actions || []);
  const modelReplies = Array.isArray(parsed.replies) ? parsed.replies : [];

  const merged = [...modelReplies];
  for (const ar of actionReplies) {
    if (ar.kind === 'open-scan' && !merged.some((r) => r.kind === 'open-scan')) {
      merged.push(ar);
    } else if (ar.kind === 'ai-card') {
      merged.push(ar);
    }
  }

  if (merged.length === 0) {
    merged.push({ kind: 'ai', mood: 'happy', text: "I'm here — tell me what you spent or ask a tax question." });
  }

  return merged;
}

module.exports = { isConfigured, chatWithAnthropic, getModel };
