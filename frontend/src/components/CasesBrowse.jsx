import { useState, useEffect } from 'react';
import { listCases } from '../api/client';
import { Badge, CrimeBadge } from './ui';

export default function CasesBrowse({ onOpenCase, initial }) {
  // `initial` (set when arriving from an Insights tile) pre-applies a filter.
  const [value, setValue] = useState(initial?.value || '');
  const [court, setCourt] = useState('');
  const [q, setQ] = useState('');
  const [crime, setCrime] = useState(!!initial?.crime);
  const [failed, setFailed] = useState(!!initial?.failed);
  const [state, setState] = useState({ loading: true });

  async function load() {
    setState({ loading: true });
    try {
      const data = await listCases({ value, court, q, crime: crime ? '1' : '', failed: failed ? '1' : '' });
      setState({ loading: false, ...data });
    } catch (e) {
      if (e.message === 'UNAUTHORIZED') throw e;
      setState({ loading: false, error: 'Failed to load cases.' });
    }
  }
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [value, court, crime, failed]);

  return (
    <div className="panel-in">
      <div className="glass p-5">
        <div className="flex flex-wrap gap-2 items-end">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs mb-1.5" style={{ color: 'rgba(238,244,255,.8)' }}>Search title / citation / notes</label>
            <input className="field-input" value={q} placeholder="keyword…"
              onChange={e => setQ(e.target.value)} onKeyDown={e => e.key === 'Enter' && load()} />
          </div>
          <div>
            <label className="block text-xs mb-1.5" style={{ color: 'rgba(238,244,255,.8)' }}>Value</label>
            <select className="field-input" value={value} onChange={e => setValue(e.target.value)}>
              <option value="">All</option><option value="high">High</option>
              <option value="medium">Medium</option><option value="low">Low</option>
            </select>
          </div>
          <div>
            <label className="block text-xs mb-1.5" style={{ color: 'rgba(238,244,255,.8)' }}>Court</label>
            <select className="field-input" value={court} onChange={e => setCourt(e.target.value)}>
              <option value="">All</option><option>High Court</option>
              <option>Court of Appeal</option><option>Other</option>
            </select>
          </div>
          <label className="flex items-center gap-1.5 text-xs cursor-pointer pb-2.5" style={{ color: 'rgba(238,244,255,.9)' }}>
            <input type="checkbox" checked={crime} onChange={e => setCrime(e.target.checked)} />
            <span className="badge crime">crime</span> only
          </label>
          <label className="flex items-center gap-1.5 text-xs cursor-pointer pb-2.5" style={{ color: 'rgba(238,244,255,.9)' }}>
            <input type="checkbox" checked={failed} onChange={e => setFailed(e.target.checked)} />
            <span className="badge failed">not retrieved</span> only
          </label>
          <button className="btn-primary" onClick={load}>Apply</button>
        </div>
      </div>

      {state.loading && <p className="text-center mt-6 text-sm" style={{ color: 'rgba(238,244,255,.7)' }}>Loading…</p>}
      {state.error && <p className="text-center mt-6 text-sm text-red-300">{state.error}</p>}
      {state.cases && (
        <div style={{ maxWidth: 980, margin: '0 auto' }}>
          <p className="text-xs mb-1 mt-4" style={{ color: 'rgba(238,244,255,.7)' }}>{state.count} cases</p>
          {state.cases.map(c => (
            <div key={c.id} className="result-card cursor-pointer" onClick={() => onOpenCase(c.slug)}>
              <div className="flex flex-wrap items-center gap-2">
                <Badge value={c.osint_value} />
                {c.fetch_failed ? <span className="badge failed">not retrieved</span> : null}
                {c.is_crime ? <CrimeBadge /> : null}
                <span className="font-bold" style={{ color: '#1F3864' }}>{c.title}</span>
              </div>
              <div className="text-xs mt-1" style={{ color: '#5b6780' }}>
                {[c.citation, c.court, c.case_date].filter(Boolean).join(' · ')}
              </div>
              {c.outcome ? <div className="text-sm mt-1.5" style={{ color: '#39435a' }}>{c.outcome.slice(0, 200)}{c.outcome.length > 200 ? '…' : ''}</div> : null}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
