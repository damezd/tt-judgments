import { getToken } from './auth';

const API_BASE = import.meta.env.VITE_API_URL || '';

const sleep = ms => new Promise(r => setTimeout(r, ms));

async function get(path) {
  // Retry transient failures (cold start / redeploy / flaky network) with
  // backoff so the UI self-heals instead of hanging on "Loading…".
  const attempts = 4;
  for (let i = 0; i < attempts; i++) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 12000);
    try {
      const res = await fetch(`${API_BASE}${path}`, {
        headers: { Authorization: `Bearer ${getToken()}` },
        signal: ctrl.signal,
      });
      clearTimeout(timer);
      if (res.status === 401) throw new Error('UNAUTHORIZED');
      if (!res.ok) throw new Error(res.status >= 500 ? '__retry__' : 'Request failed');
      return await res.json();
    } catch (e) {
      clearTimeout(timer);
      if (e.message === 'UNAUTHORIZED' || e.message === 'Request failed') throw e;
      // retryable: timeout (AbortError), network error, or 5xx
      if (i < attempts - 1) { await sleep(800 * 2 ** i); continue; }
      throw new Error('The server took too long to respond — it may be waking up. Please retry.');
    }
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
