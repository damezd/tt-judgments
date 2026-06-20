const API_BASE = import.meta.env.VITE_API_URL || '';

export async function login(password) {
  let res;
  try {
    res = await fetch(`${API_BASE}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    });
  } catch {
    throw new Error('Unable to reach the login server. Check VITE_API_URL and backend status.');
  }

  let data = null;
  try { data = await res.json(); } catch { data = null; }

  if (!res.ok) {
    if (res.status === 401) throw new Error(data?.error || 'Incorrect password. Try again.');
    if (res.status === 404) throw new Error('Login endpoint not found. Check VITE_API_URL.');
    throw new Error(data?.error || `Login failed with status ${res.status}.`);
  }

  const { token } = data || {};
  if (!token) throw new Error('Login succeeded but no token was returned.');

  localStorage.setItem('ttj_token', token);
  return token;
}

export function logout()   { localStorage.removeItem('ttj_token'); }
export function getToken() { return localStorage.getItem('ttj_token'); }
