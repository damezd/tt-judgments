import { getToken } from './auth';

const API_BASE = import.meta.env.VITE_API_URL || '';

async function get(path) {
  // Abort slow requests so the UI can show an error/retry instead of hanging
  // forever (e.g. while the backend is redeploying or cold-starting).
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 25000);
  try {
    const res = await fetch(`${API_BASE}${path}`, {
      headers: { Authorization: `Bearer ${getToken()}` },
      signal: ctrl.signal,
    });
    if (res.status === 401) throw new Error('UNAUTHORIZED');
    if (!res.ok) throw new Error('Request failed');
    return res.json();
  } catch (e) {
    if (e.name === 'AbortError') throw new Error('The server took too long to respond — it may be waking up. Please retry.');
    throw e;
  } finally {
    clearTimeout(timer);
  }
}

export const searchPeople   = (q)   => get(`/api/search/people?q=${encodeURIComponent(q)}`);
export const searchEntities = (q)   => get(`/api/search/entities?q=${encodeURIComponent(q)}`);
export const listCases      = (p={})=> {
  const qs = new URLSearchParams(Object.entries(p).filter(([, v]) => v)).toString();
  return get(`/api/cases${qs ? '?' + qs : ''}`);
};
export const getCase        = (slug)=> get(`/api/cases/${encodeURIComponent(slug)}`);
export const getInsights    = ()    => get('/api/insights');
export const getNetwork     = ()    => get('/api/network');
export const getCrime       = ()    => get('/api/crime');
