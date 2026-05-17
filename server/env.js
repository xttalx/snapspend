/** Resolve env vars (supports Vercel names users often set by mistake). */

function first(...keys) {
  for (const key of keys) {
    const v = process.env[key];
    if (v && String(v).trim()) return String(v).trim();
  }
  return '';
}

function supabaseUrl() {
  return first(
    'SUPABASE_URL',
    'VITE_SUPABASE_URL',
    'REACT_APP_SUPABASE_URL',
  );
}

function supabaseServiceRoleKey() {
  return first(
    'SUPABASE_SERVICE_ROLE_KEY',
    'SUPABASE_SECRET_KEY',
    'SUPABASE_SERVICE_KEY',
  );
}

function supabaseAnonKey() {
  // Legacy JWT anon (eyJ…) — most reliable for browser OAuth/sign-in
  const legacy = first('SUPABASE_ANON_KEY', 'VITE_SUPABASE_ANON_KEY_LEGACY');
  if (legacy.startsWith('eyJ')) return legacy;
  return first(
    'VITE_SUPABASE_ANON_KEY',
    'REACT_APP_SUPABASE_PUBLISHABLE_KEY',
    'SUPABASE_PUBLISHABLE_KEY',
  );
}

function describeClientKey(key) {
  if (!key) {
    return {
      format: 'missing',
      hint: 'Set SUPABASE_ANON_KEY (legacy anon JWT) or VITE_SUPABASE_ANON_KEY in Vercel.',
    };
  }
  if (key.startsWith('eyJ')) return { format: 'legacy-jwt', hint: null };
  if (key.startsWith('sb_publishable_')) {
    return {
      format: 'publishable',
      hint:
        'If sign-in shows "Invalid API key", use the legacy anon key instead: Supabase → Project Settings → API → anon public (starts with eyJ).',
    };
  }
  return {
    format: 'unknown',
    hint: 'Anon key should be the legacy anon JWT (eyJ…) or publishable key (sb_publishable_…).',
  };
}

module.exports = {
  supabaseUrl,
  supabaseServiceRoleKey,
  supabaseAnonKey,
  describeClientKey,
};
