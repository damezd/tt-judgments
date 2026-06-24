import { useState, useEffect } from 'react';
import { listCases } from '../api/client';
import { copyText } from './ui';
import { CaseIllustration } from './CaseIllustrations';

const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
const fmtDate = d => {
  const m = (d || '').match(/^(\d{4})-(\d{2})-(\d{2})/);
  return m ? `${+m[3]} ${MONTHS[+m[2] - 1]} ${m[1]}` : (d || '').toUpperCase();
};

// Detect case type from the text we already have, for rail colour / illustration / badge.
function detectType(c) {
  const s = `${c.title || ''} ${c.social_headline || ''} ${c.outcome || ''} ${c.crime_flags || ''}`.toLowerCase();
  if (c.is_crime || /\b(murder|manslaughter|assault|firearm|robbery|rape|sexual|kidnap|fraud|trafficking|criminal|accused|convict|sentenc)/.test(s)) return 'criminal';
  if (/defamation|slander|libel/.test(s)) return 'corporate';
  if (/employ|wrongful dismissal|unfair dismissal|dismiss|trade union|industrial|redundan|labour|worker|sacked|sacking/.test(s)) return 'employment';
  if (/\bland\b|property|compulsory acquisition|acquisition|mortgage|lease|tenanc|landlord|conveyance|estate|deed|possession|squat/.test(s)) return 'property';
  if (/compan|corporate|contract|shareholder|director|breach|partnership|debt|invoice/.test(s)) return 'corporate';
  return 'corporate';
}
function typeLabel(type, c) {
  const s = `${c.title || ''} ${c.social_headline || ''} ${c.outcome || ''}`.toLowerCase();
  if (type === 'employment') return /wrongful dismissal/.test(s) ? 'Wrongful Dismissal' : /unfair dismissal/.test(s) ? 'Unfair Dismissal' : 'Employment';
  if (type === 'property') return /compulsory acquisition/.test(s) ? 'Compulsory Acquisition' : /mortgage/.test(s) ? 'Mortgage' : /lease|tenanc|landlord/.test(s) ? 'Property / Lease' : 'Property';
  if (type === 'corporate') return /defamation|slander|libel/.test(s) ? 'Defamation' : /contract/.test(s) ? 'Contract' : 'Corporate';
  return 'Criminal';
}

// Pull the headline money figure (the reference shows it as a serif amount tag).
function parseAmount(c) {
  const m = `${c.social_headline || ''} ${c.social_post || ''}`.match(/(~\s*\$|\$)\s*([\d][\d,]*(?:\.\d+)?)\s*(k|m|bn|million|billion|thousand)?/i);
  if (!m) return null;
  const sym = m[1].includes('~') ? '~$' : '$';
  const u = (m[3] || '').toLowerCase();
  const unit = u.startsWith('m') ? 'M' : u.startsWith('b') ? 'B' : (u === 'k' || u === 'thousand') ? 'k' : '';
  return { sym, num: m[2], unit: (unit ? unit + ' ' : '') + 'TTD' };
}

const PRIO = { high: ['badge-high', 'HIGH'], medium: ['badge-medium', 'MEDIUM'], low: ['badge-low', 'LOW'] };

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
