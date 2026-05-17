const { isConfigured } = require('../supabase');
const jsonStore = require('./json-store');
const supabaseStore = require('./supabase-store');

function getStore() {
  return isConfigured() ? supabaseStore : jsonStore;
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
