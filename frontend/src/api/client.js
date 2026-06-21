import { getToken } from './auth';

const API_BASE = import.meta.env.VITE_API_URL || '';

async function get(path) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { Authorization: `Bearer ${getToken()}` },
  });
  if (res.status === 401) throw new Error('UNAUTHORIZED');
  if (!res.ok) throw new Error('Request failed');
  return res.json();
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
