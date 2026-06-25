import { useState, useEffect } from 'react';
import { listCases } from '../api/client';
import { copyText } from './ui';
import { CaseIllustration } from './CaseIllustrations';
import { detectType, typeLabel, parseAmount, fmtDate, PRIO } from './caseMeta';

export default function CasesBrowse({ onOpenCase, initial, onCount }) {
  // `initial` (set when arriving from an Insights tile) pre-applies a filter.
  const [court, setCourt] = useState('');
  const [type, setType] = useState('');
  const [crime, setCrime] = useState(!!initial?.crime);
  const [failed, setFailed] = useState(!!initial?.failed);
  const [value] = useState(initial?.value || '');   // seeded from Insights drilldown; applied silently
  const [state, setState] = useState({ loading: true });

  async function load() {
    setState({ loading: true });
    try {
      const data = await listCases({ value, court, crime: crime ? '1' : '', failed: failed ? '1' : '' });
      setState({ loading: false, ...data });
    } catch (e) {
      if (e.message === 'UNAUTHORIZED') throw e;
      setState({ loading: false, error: e.message || 'Failed to load cases.' });
    }
  }
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [value, court, crime, failed]);

  const shown = (state.cases || []).filter(c => !type || detectType(c) === type);
  useEffect(() => { if (state.cases) onCount?.(shown.length); /* eslint-disable-next-line */ }, [state.cases, type]);

  return (
    <div className="panel-in">
      {/* FILTER BAR */}
      <div className="filter-bar">
        <div className="filter-row">
          <select className="filter-select" value={court} onChange={e => setCourt(e.target.value)}>
            <option value="">All Courts</option>
            <option value="High Court">High Court</option>
            <option value="Court of Appeal">Court of Appeal</option>
            <option value="Other">Other</option>
          </select>
          <select className="filter-select" value={type} onChange={e => setType(e.target.value)}>
            <option value="">All Types</option>
            <option value="employment">Employment</option>
            <option value="property">Property</option>
            <option value="corporate">Corporate</option>
            <option value="criminal">Criminal</option>
          </select>
        </div>
        <div className="filter-row">
          <label className={`filter-chip chip-crime ${crime ? '' : 'off'}`}>
            <input type="checkbox" checked={crime} onChange={e => setCrime(e.target.checked)} /> Crime only
          </label>
          <label className={`filter-chip chip-notretrieved ${failed ? '' : 'off'}`}>
            <input type="checkbox" checked={failed} onChange={e => setFailed(e.target.checked)} /> Not retrieved only
          </label>
          <button className="apply-btn" onClick={load}>Apply</button>
        </div>
      </div>

      {/* FEED */}
      <div className="feed">
        <div className="section-label">Latest judgments</div>

        {state.loading && <p style={{ textAlign: 'center', color: 'var(--muted)', fontSize: 13, padding: '24px 0' }}>Loading…</p>}
        {state.error && (
          <div style={{ textAlign: 'center', padding: '24px 0' }}>
            <p style={{ color: 'var(--red)', fontSize: 13 }}>{state.error}</p>
            <button className="btn-secondary" style={{ marginTop: 12, fontSize: 13 }} onClick={load}>Retry</button>
          </div>
        )}
        {state.cases && shown.length === 0 && !state.loading && (
          <p style={{ textAlign: 'center', color: 'var(--muted)', fontSize: 13, padding: '24px 0' }}>No matching cases.</p>
        )}

        {shown.map(c => {
          const t = detectType(c);
          const [prioClass, prioLabel] = PRIO[(c.osint_value || 'low').toLowerCase()] || PRIO.low;
          const amount = parseAmount(c);
          const headline = c.social_headline || c.title;
          const bodyText = c.social_post || c.outcome || '';
          const excerpt = bodyText.length > 180 ? bodyText.slice(0, 180).trimEnd() + '…' : bodyText;
          return (
            <article key={c.id} className={`case-card type-${t}`} onClick={() => onOpenCase(c.slug)}>
              <div className="rail" />
              <div className="card-illustration"><CaseIllustration type={t} /></div>
              <div className="card-body">
                <div className="badge-row">
                  <span className={`badge ${prioClass}`}>{prioLabel}</span>
                  <span className={`badge badge-type-${t}`}>{typeLabel(t, c)}</span>
                  {c.fetch_failed ? <span className="badge badge-medium">Not retrieved</span> : null}
                </div>
                {amount && (
                  <div className="amount-tag">
                    <span className="sym">{amount.sym}</span>{amount.num}<span className="unit">{amount.unit}</span>
                  </div>
                )}
                <div className="card-headline">{headline}</div>
                {excerpt && <div className="card-excerpt">{excerpt}</div>}
              </div>
              <div className="card-footer">
                <span className="card-date">{fmtDate(c.case_date)}</span>
                <button
                  className="share-btn"
                  onClick={e => { e.stopPropagation(); copyText(`${headline} — InsightTT`); }}
                >Share · @insighttt</button>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
