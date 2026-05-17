const jwt = require('jsonwebtoken');
const { getSupabase, isConfigured } = require('./supabase');

const JWT_SECRET = process.env.JWT_SECRET || 'dev-only-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '30d';

function signToken(userId) {
  return jwt.sign({ sub: userId }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

function verifyToken(token) {
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    return payload.sub;
  } catch {
    return null;
  }
}

/** Verify Supabase access token; returns auth user or null */
async function verifySupabaseToken(token) {
  if (!isConfigured() || !token) return null;
  const sb = getSupabase();
  const { data: { user }, error } = await sb.auth.getUser(token);
  if (error || !user) return null;
  return user;
}

async function resolveUserId(token) {
  if (isConfigured()) {
    const user = await verifySupabaseToken(token);
    return user?.id || null;
  }
  return verifyToken(token);
}

module.exports = {
  signToken,
  verifyToken,
  verifySupabaseToken,
  resolveUserId,
  isSupabaseAuth: isConfigured,
};
