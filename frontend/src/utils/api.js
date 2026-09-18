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
const REQUEST_TIMEOUT_MS = 45000;

function checkGatewayError(res) {
  if (res.status === 524 || res.status === 504) {
    throw new Error(`The server took too long to respond (HTTP ${res.status}). The operation may still finish; check its result before retrying.`);
  }
  if (res.status === 413) {
    throw new Error('The selected file is too large for the server (HTTP 413). Choose a smaller file.');
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Session Storage Helpers (per-tab isolation)
// ─────────────────────────────────────────────────────────────────────────────

export function saveSession(loginResp, storage = sessionStorage) {
  storage.setItem('accessToken', loginResp.accessToken);
  storage.setItem('refreshToken', loginResp.refreshToken);
  storage.setItem('user', JSON.stringify({
    userId: loginResp.userId,
    fullName: loginResp.fullName,
    email: loginResp.email,
    roles: loginResp.roles,
    permissions: loginResp.permissions,
    profilePhotoUrl: loginResp.profilePhotoUrl || null,
    userCode: loginResp.userCode,
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
  sessionStorage.removeItem('isImpersonating');
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

  checkGatewayError(res);
  if (!res.ok) {
    if (res.status === 400 || res.status === 401 || res.status === 403) {
      clearSession();
      window.location.href = '/workwise/login';
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
    window.location.href = '/workwise/login';
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
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    let res;

    try {
      res = await fetch(`${API_BASE}${endpoint}`, {
        method,
        headers: {
          ...(!(body instanceof FormData) && { 'Content-Type': 'application/json' }),
          ...(tok && { Authorization: `Bearer ${tok}` }),
        },
        ...(body && { body: body instanceof FormData ? body : JSON.stringify(body) }),
        signal: controller.signal,
      });
    } catch (err) {
      if (err.name === 'AbortError') {
        throw new Error(`The server did not respond within ${REQUEST_TIMEOUT_MS / 1000} seconds. Check whether the change was saved before trying again.`);
      }
      throw err;
    } finally {
      clearTimeout(timeoutId);
    }

    if (res.status === 401) return { __status: 401 };

    checkGatewayError(res);

    // Handle empty / non-JSON responses (e.g. 401/403 HTML error pages)
    const text = await res.text();
    if (!text || !text.trim()) {
      throw new Error(`Server returned empty response (HTTP ${res.status})`);
    }

    let data;
    try {
      data = JSON.parse(text);
    } catch {
      throw new Error(`Invalid JSON from server (HTTP ${res.status})`);
    }

    if (!res.ok || !data.success) throw new Error(data.error || 'Request failed');
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
  if (!roles || !Array.isArray(roles)) return 'executive';
  if (roles.includes('Admin')) return 'admin';
  if (roles.includes('Manager')) return 'manager';
  if (roles.includes('Team Leader')) return 'team-leader';
  if (roles.includes('Executive') || roles.includes('Employee')) return 'executive';
  // For any other dynamic/custom role, generate a clean prefix
  const firstRole = roles[0];
  if (firstRole) {
    return firstRole.toLowerCase().trim().replace(/\s+/g, '-');
  }
  return 'executive';
}

export async function refreshCurrentUser() {
  try {
    const data = await apiCall('/auth/me');
    if (data) {
      sessionStorage.setItem('user', JSON.stringify({
        userId: data.userId,
        fullName: data.fullName,
        email: data.email,
        roles: data.roles,
        permissions: data.permissions,
        profilePhotoUrl: data.profilePhotoUrl || null,
        userCode: data.userCode,
      }));
      window.dispatchEvent(new Event('user_profile_updated'));
      return data;
    }
  } catch (err) {
    console.error('Failed to refresh current user profile:', err);
    throw err;
  }
}
export default apiCall;



