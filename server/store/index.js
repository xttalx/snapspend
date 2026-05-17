const { isConfigured } = require('../supabase');

let jsonStore = null;
let supabaseStore = null;

function getJsonStore() {
  if (!jsonStore) jsonStore = require('./json-store');
  return jsonStore;
}

function getSupabaseStore() {
  if (!supabaseStore) supabaseStore = require('./supabase-store');
  return supabaseStore;
}

function getStore() {
  if (isConfigured()) return getSupabaseStore();
  return getJsonStore();
}

const storeProxy = new Proxy({}, {
  get(_target, prop) {
    const store = getStore();
    const val = store[prop];
    if (typeof val === 'function') return val.bind(store);
    return val;
  },
});

storeProxy.usingSupabase = () => isConfigured();
module.exports = storeProxy;
