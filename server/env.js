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
  return first(
    'VITE_SUPABASE_ANON_KEY',
    'REACT_APP_SUPABASE_PUBLISHABLE_KEY',
    'SUPABASE_ANON_KEY',
    'SUPABASE_PUBLISHABLE_KEY',
  );
}

module.exports = {
  supabaseUrl,
  supabaseServiceRoleKey,
  supabaseAnonKey,
};
