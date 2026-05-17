// api-client.js — SnapSpend REST client (global SnapAPI)

const SnapAPI = (() => {
  const TOKEN_KEY = 'snapspend_token';

  function baseUrl() {
    if (typeof window !== 'undefined' && window.SNAP_API_BASE) {
      return window.SNAP_API_BASE.replace(/\/$/, '');
    }
    return '';
  }

  function getToken() {
    try {
      return localStorage.getItem(TOKEN_KEY);
    } catch {
      return null;
    }
  }

  function setToken(token) {
    try {
      if (token) localStorage.setItem(TOKEN_KEY, token);
      else localStorage.removeItem(TOKEN_KEY);
    } catch (_) {}
  }

  async function request(path, options = {}) {
    const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
    const token = getToken();
    if (token) headers.Authorization = `Bearer ${token}`;

    const res = await fetch(`${baseUrl()}${path}`, { ...options, headers });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const err = new Error(data.error || res.statusText || 'Request failed');
      err.status = res.status;
      err.data = data;
      throw err;
    }
    return data;
  }

  async function ensureAuth() {
    if (!getToken()) {
      const data = await request('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ provider: 'demo' }),
      });
      setToken(data.token);
    }
  }

  return {
    getToken,
    setToken,
    ensureAuth,
    health: () => request('/api/health'),
    login: async (body = {}) => {
      const data = await request('/api/auth/login', { method: 'POST', body: JSON.stringify(body) });
      setToken(data.token);
      return data;
    },
    logout: () => {
      setToken(null);
    },
    me: () => request('/api/me'),
    getProfile: () => request('/api/profile'),
    saveProfile: (body) => request('/api/profile', { method: 'PUT', body: JSON.stringify(body) }),
    getExpenses: (filter = 'All') => request(`/api/expenses?filter=${encodeURIComponent(filter)}`),
    createExpense: (body) => request('/api/expenses', { method: 'POST', body: JSON.stringify(body) }),
    scanReceipt: () => request('/api/scan', { method: 'POST', body: '{}' }),
    getMileage: () => request('/api/mileage'),
    stopMileage: () => request('/api/mileage/stop', { method: 'POST', body: '{}' }),
    setTripPurpose: (id, purpose) =>
      request(`/api/mileage/${id}`, { method: 'PATCH', body: JSON.stringify({ purpose }) }),
    getTaxes: () => request('/api/taxes'),
    getNotifications: () => request('/api/notifications'),
    markNotificationsRead: () => request('/api/notifications/read', { method: 'POST', body: '{}' }),
    chat: (message, channel = 'home') =>
      request('/api/chat', { method: 'POST', body: JSON.stringify({ message, channel }) }),
    exportBundle: (items) =>
      request('/api/export', { method: 'POST', body: JSON.stringify({ items }) }),
  };
})();

function showToast(message) {
  const el = document.createElement('div');
  el.className = 'toast';
  el.textContent = message;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 3200);
}

Object.assign(window, { SnapAPI, showToast });
