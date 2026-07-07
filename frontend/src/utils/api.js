/**
 * src/utils/api.js
 *
 * Shared API utility for the Arrow Data Tech portal.
 *
 * WHY sessionStorage?
 * ------------------
 * localStorage is shared across ALL tabs in the same browser origin.
 * When a second user logs in on a different tab, their token overwrites
 * the first user's token, causing the first user to get logged out.
 *
 * sessionStorage is ISOLATED per browser tab. Each tab has its own
 * session storage, so multiple users can be logged in simultaneously
 * in different tabs without interfering with each other.
 */

export const API_BASE = process.env.REACT_APP_API_URL || 'https://arrowdatatech.com/api';

// ─────────────────────────────────────────────────────────────────────────────
// Impersonation Support
// ─────────────────────────────────────────────────────────────────────────────
try {
  const impToken = localStorage.getItem('impersonateToken');
  if (impToken) {
    sessionStorage.setItem('accessToken', impToken);

    const impRefresh = localStorage.getItem('impersonateRefresh');
    if (impRefresh) {
      sessionStorage.setItem('refreshToken', impRefresh);
    }

    const impUser = localStorage.getItem('impersonateUser');
    if (impUser) {
      sessionStorage.setItem('user', impUser);
    }

    sessionStorage.setItem('isImpersonating', 'true');

    // Clear from localStorage immediately to isolate this session to this tab only
    localStorage.removeItem('impersonateToken');
    localStorage.removeItem('impersonateRefresh');
    localStorage.removeItem('impersonateUser');
  }
} catch (e) {
  console.warn('Failed to migrate impersonation session:', e);
}

// ─────────────────────────────────────────────────────────────────────────────
// Session Storage Helpers (per-tab isolation)
// ─────────────────────────────────────────────────────────────────────────────

export function saveSession(loginResp) {
  sessionStorage.setItem('accessToken', loginResp.accessToken);
  sessionStorage.setItem('refreshToken', loginResp.refreshToken);
  sessionStorage.setItem('user', JSON.stringify({
    userId: loginResp.userId,
    fullName: loginResp.fullName,
    email: loginResp.email,
    roles: loginResp.roles,
    permissions: loginResp.permissions,
  }));
}

export function getAccessToken() {
  return sessionStorage.getItem('accessToken');
}

export function getRefreshToken() {
  return sessionStorage.getItem('refreshToken');
}

export function getCurrentUser() {
  const raw = sessionStorage.getItem('user');
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
}

export function clearSession() {
  sessionStorage.removeItem('accessToken');
  sessionStorage.removeItem('refreshToken');
  sessionStorage.removeItem('user');
}

// ─────────────────────────────────────────────────────────────────────────────
// Token Refresh
// ─────────────────────────────────────────────────────────────────────────────

let isRefreshing = false;
let refreshQueue = [];

async function doRefresh() {
  const refreshToken = getRefreshToken();
  if (!refreshToken) throw new Error('No refresh token');

  let res;
  try {
    res = await fetch(`${API_BASE}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });
  } catch (err) {
    // Network error/CORS/fetch failure: do not log out, just throw error to let caller retry
    throw new Error('Network error. Failed to refresh session.');
  }

  if (!res.ok) {
    if (res.status === 400 || res.status === 401 || res.status === 403) {
      clearSession();
      window.location.href = '/';
      throw new Error('Session expired. Please log in again.');
    }
    throw new Error(`Server error during refresh (HTTP ${res.status})`);
  }

  let json;
  try {
    json = await res.json();
  } catch (err) {
    throw new Error('Invalid response from server during refresh');
  }

  if (!json.success) {
    clearSession();
    window.location.href = '/';
    throw new Error('Session expired. Please log in again.');
  }

  saveSession(json.data);
  return json.data.accessToken;
}

// ─────────────────────────────────────────────────────────────────────────────
// Core API Call — with automatic token refresh on 401
// ─────────────────────────────────────────────────────────────────────────────

export const apiCall = async (endpoint, method = 'GET', body = null) => {
  const token = getAccessToken();

  const makeRequest = async (tok) => {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(tok && { Authorization: `Bearer ${tok}` }),
      },
      ...(body && { body: JSON.stringify(body) }),
    });

    // Handle empty / non-JSON responses (e.g. 401/403 HTML error pages)
    const text = await res.text();
    if (!text || !text.trim()) {
      if (res.status === 401) return { __status: 401 };
      throw new Error(`Server returned empty response (HTTP ${res.status})`);
    }

    let data;
    try {
      data = JSON.parse(text);
    } catch {
      throw new Error(`Invalid JSON from server (HTTP ${res.status})`);
    }

    if (res.status === 401) return { __status: 401 };
    if (!data.success) throw new Error(data.error || 'Request failed');
    return data.data;
  };

  let result = await makeRequest(token);

  // If 401, attempt a single token refresh then retry
  if (result && result.__status === 401) {
    if (!isRefreshing) {
      isRefreshing = true;
      try {
        const newToken = await doRefresh();
        isRefreshing = false;
        refreshQueue.forEach(cb => cb(newToken));
        refreshQueue = [];
        result = await makeRequest(newToken);
      } catch (err) {
        isRefreshing = false;
        refreshQueue.forEach(cb => cb(null));
        refreshQueue = [];
        throw err;
      }
    } else {
      // Wait for the ongoing refresh
      const newToken = await new Promise((resolve) => {
        refreshQueue.push(resolve);
      });
      if (!newToken) throw new Error('Session expired. Please log in again.');
      result = await makeRequest(newToken);
    }
  }

  if (result && result.__status) {
    throw new Error('Unauthorized. Please log in again.');
  }

  return result;
};

export function getRolePrefix(roles) {
  if (!roles || !Array.isArray(roles)) return 'employee';
  if (roles.includes('Admin')) return 'admin';
  if (roles.includes('Manager')) return 'manager';
  if (roles.includes('Team Leader')) return 'team-leader';
  if (roles.includes('Employee')) return 'employee';
  return 'employee';
}

export default apiCall;

