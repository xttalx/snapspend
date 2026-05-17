const store = require('../store');
const anthropic = require('./anthropic');

function parseAmount(text) {
  const m = text.match(/\$?(\d+(?:\.\d+)?)/);
  return m ? parseFloat(m[1]) : null;
}

/** Fast path for clear intents — also works without Anthropic */
async function homeChatReplyRules(userId, text) {
  const x = text.toLowerCase();
  const amt = parseAmount(text);
  const MILE_RATE = store.MILE_RATE;

  if (/lunch|coffee|dinner|food|meal/.test(x)) {
    const amount = amt || 24;
    const created = await store.addExpense(userId, {
      vendor: 'Client lunch',
      category: 'Meals (50%)',
      amount,
      deductible: true,
      type: 'meal',
    });
    return [
      { kind: 'ai', mood: 'thinking', text: `Got it — $${amount} on a meal. Was this with a client or for the team?` },
      {
        kind: 'ai-card',
        card: {
          title: 'Logged a meal',
          amount: `$${amount.toFixed(2)}`,
          category: 'Meals (50% deductible)',
          tax: `~$${(amount * 0.5 * 0.22).toFixed(2)} saved`,
          schedule: 'Schedule C · Line 24b',
          expenseId: created.id,
        },
      },
    ];
  }

  if (/drove|drive|mile|airport|trip/.test(x)) {
    const miles = amt && amt < 200 ? amt : 18.4;
    const deduction = Math.round(miles * MILE_RATE * 100) / 100;
    const trip = await store.addMileageTrip(userId, { miles, purpose: 'Business', status: 'active' });
    return [
      { kind: 'ai', mood: 'wow', text: `Nice — I'll start tracking that drive. Tap "Track now" to use GPS, or tell me the miles.` },
      {
        kind: 'ai-card',
        card: {
          title: 'Mileage logged',
          amount: `${miles} mi`,
          category: 'Business travel',
          tax: `~$${deduction.toFixed(2)} deduction`,
          schedule: `$${MILE_RATE} / mile · IRS rate`,
          tripId: trip.id,
        },
      },
    ];
  }

  if (/scan|receipt|photo/.test(x)) {
    return [
      { kind: 'ai', mood: 'happy', text: `Opening the camera — point it at your receipt and I'll handle the rest.` },
      { kind: 'open-scan' },
    ];
  }

  if (/deduct|tax|save|estimate/.test(x)) {
    const t = await store.computeTaxSummary(userId);
    return [
      { kind: 'ai', mood: 'wow', text: `You've got $${t.writeOffs.toLocaleString()} in potential write-offs this year. Want me to break it down?` },
      {
        kind: 'ai-card',
        card: {
          title: 'Tax estimate',
          amount: `$${t.federalEstimate.toLocaleString()}`,
          category: 'Federal liability',
          tax: `−$${t.taxSaved.toLocaleString()} in write-offs`,
          schedule: `${t.organizedPct}% organized · ${t.greyFlags} grey flags`,
        },
      },
    ];
  }

  return null;
}

async function askChatReplyRules(userId, text) {
  const lower = text.toLowerCase();
  const tax = await store.computeTaxSummary(userId);
  const top = tax.breakdown[0];

  if (/home office|office/.test(lower)) {
    return [
      { kind: 'ai', mood: 'thinking', text: 'Yes! Since you work from home and have a dedicated workspace, you can deduct part of your rent, utilities, and internet.' },
      {
        kind: 'ai-stat',
        stat: { label: 'Estimated home-office deduction', val: '$1,840 / year', sub: 'Based on 1 room · 120 sqft · used 100% for business' },
      },
      { kind: 'ai', mood: 'happy', text: 'Want me to set this up automatically in your profile?' },
    ];
  }
  if (/biggest|most/.test(lower)) {
    return [
      { kind: 'ai', mood: 'wow', text: `${top?.cat || 'Equipment'} is your biggest write-off this year.` },
      {
        kind: 'ai-stat',
        stat: {
          label: `Top category · ${top?.cat || 'Equipment'}`,
          val: `$${top?.amt || 980} deducted`,
          sub: 'From your logged expenses',
        },
      },
    ];
  }
  if (/quarter/.test(lower)) {
    const q = Math.round(tax.federalEstimate / 4);
    return [
      { kind: 'ai', mood: 'thinking', text: `Yes — at your income level, you'll owe ~$${q.toLocaleString()} per quarter. Q1 is due April 15.` },
      { kind: 'ai', mood: 'happy', text: 'I can remind you when payment is due. Just say the word.' },
    ];
  }
  return null;
}

async function homeChatReply(userId, text) {
  if (anthropic.isConfigured()) {
    try {
      const rules = await homeChatReplyRules(userId, text);
      if (rules) return rules;
      return await anthropic.chatWithAnthropic(userId, text, 'home');
    } catch (e) {
      console.warn('Anthropic home chat fallback:', e.message);
    }
  }
  const rules = await homeChatReplyRules(userId, text);
  if (rules) return rules;
  return [{ kind: 'ai', mood: 'thinking', text: `Got it — "${text.slice(0, 40)}". How much did it cost, and was it for work?` }];
}

async function askChatReply(userId, text) {
  if (anthropic.isConfigured()) {
    try {
      const rules = await askChatReplyRules(userId, text);
      if (rules) return rules;
      return await anthropic.chatWithAnthropic(userId, text, 'ask');
    } catch (e) {
      console.warn('Anthropic ask chat fallback:', e.message);
    }
  }
  const rules = await askChatReplyRules(userId, text);
  if (rules) return rules;
  return [
    { kind: 'ai', mood: 'thinking', text: 'Good question! Based on your profile, most work-related purchases under $2,500 are immediately deductible.' },
    { kind: 'ai', mood: 'happy', text: "Tell me what it is and I'll give you a yes/no." },
  ];
}

async function mockScanReceipt(userId) {
  const scan = {
    vendor: 'STAPLES',
    amount: 62.8,
    date: new Date().toISOString().slice(0, 10),
    category: 'Office supplies',
    deductible: true,
    lineItems: [
      { name: 'Printer Paper', price: 8.99 },
      { name: 'USB-C Cable', price: 24.99 },
      { name: 'Folder Pack', price: 12.5 },
      { name: 'Pens (12)', price: 11.2 },
    ],
    subtotal: 57.68,
    tax: 5.12,
  };
  const created = await store.addExpense(userId, {
    vendor: 'Staples',
    category: scan.category,
    amount: scan.amount,
    deductible: true,
    type: 'receipt',
    date: scan.date,
  });
  await store.addNotification(userId, {
    mood: 'happy',
    title: 'Receipt logged: Staples',
    sub: `$${scan.amount.toFixed(2)} · Office supplies`,
    time: 'now',
  });
  return { ...scan, expenseId: created.id };
}

module.exports = { homeChatReply, askChatReply, mockScanReceipt };
