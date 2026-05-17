const { createClient } = require('@supabase/supabase-js');
const { supabaseUrl, supabaseServiceRoleKey } = require('./env');

let client = null;

function isConfigured() {
  return !!(supabaseUrl() && supabaseServiceRoleKey());
}

function getSupabase() {
  if (!isConfigured()) return null;
  if (!client) {
    client = createClient(
      supabaseUrl(),
      supabaseServiceRoleKey(),
      { auth: { persistSession: false, autoRefreshToken: false } }
    );
  }
  return client;
}

module.exports = { getSupabase, isConfigured };
