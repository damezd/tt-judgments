import { useEffect, useState } from 'react';
import { getInsights } from '../api/client';

const fmt = n => Number(n).toLocaleString();

function Bar({ label, n, max, sub, onClick }) {
  return (
    <div className="mb-1.5">
      <div className="flex justify-between text-sm" style={{ color: '#0f172a' }}>
        <button className="text-left underline decoration-dotted" style={{ color: onClick ? '#1F3864' : '#0f172a' }}
          onClick={onClick} disabled={!onClick}>{label}</button>
        <span className="font-bold">{sub ?? n}</span>
      </div>
      <div style={{ background: '#e6ecf5', borderRadius: 8, height: 8, overflow: 'hidden' }}>
        <div style={{ width: `${(n / max) * 100}%`, height: '100%', background: 'linear-gradient(120deg,#0a84ff,#2fb9ff)' }} />
      </div>
    </div>
  );
}

// Trim a string to n chars on a word/punctuation boundary.
const shorten = (s, n) => {
  s = (s || '').trim();
  if (s.length <= n) return s;
  return s.slice(0, n).replace(/[\s,;(]+\S*$/, '') + '…';
};
// Headline location (drop deed numbers / parentheticals), short rent, short status.
const propName   = p => shorten((p.description || p.title || '').split(/[;(]/)[0], 56) || '—';
const propRent   = p => shorten(p.rent, 24) || '—';
const propStatus = p => shorten((p.outcome || '').split(/[.;]/)[0], 52) || '—';

function Tile({ num, label, color, onClick }) {
  return (
    <button type="button" className="stat" onClick={onClick}
      title={onClick ? `Show ${label.toLowerCase()} cases` : undefined}>
      <div className="num" style={{ color }}>{num}</div>
      <div className="lbl">{label}</div>
    </button>
  );
}

export default function Insights({ onOpenCase, onFilterCases }) {
  const [d, setD] = useState(null);
  const [err, setErr] = useState('');
  useEffect(() => { getInsights().then(setD).catch(() => setErr('Failed to load insights.')); }, []);

  if (err) return <p className="text-center mt-6 text-red-300">{err}</p>;
  if (!d) return <p className="text-center mt-6 text-sm" style={{ color: 'rgba(238,244,255,.7)' }}>Loading…</p>;

  const t = d.totals;
  const props = d.properties || [];
  const maxEnt = Math.max(...d.recurringEntities.map(e => e.cases), 1);

  return (
    <div className="panel-in" style={{ maxWidth: 1000, margin: '0 auto' }}>
      <div className="grid gap-3 mb-4" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(120px,1fr))' }}>
        <Tile num={fmt(t.total)}  label="Total cases"    onClick={() => onFilterCases?.({})} />
        <Tile num={fmt(t.high)}   label="High value"     color="#9b2412" onClick={() => onFilterCases?.({ value: 'high' })} />
        <Tile num={fmt(t.medium)} label="Medium"         color="#1e4e86" onClick={() => onFilterCases?.({ value: 'medium' })} />
        <Tile num={fmt(t.low)}    label="Low"            color="#54606f" onClick={() => onFilterCases?.({ value: 'low' })} />
        <Tile num={fmt(t.crime)}  label="Crime-flagged"  color="#8e1414" onClick={() => onFilterCases?.({ crime: true })} />
        <Tile num={fmt(t.failed)} label="Not retrieved"  color="#7a5310" onClick={() => onFilterCases?.({ failed: true })} />
      </div>

      <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(300px,1fr))' }}>
        <div className="result-card" style={{ gridColumn: '1 / -1' }}>
          <h3 className="font-extrabold mb-2" style={{ color: '#1F3864' }}>
            Property, land &amp; lease matters
            <span className="text-xs font-semibold ml-2" style={{ color: '#5b6780' }}>{props.length} on record</span>
          </h3>
          {props.length === 0 && <p className="text-sm" style={{ color: '#5b6780' }}>None recorded.</p>}
          {props.length > 0 && (
            <div style={{ overflowX: 'auto' }}>
              <table className="itable">
                <thead>
                  <tr><th>Property / land</th><th>Rent</th><th>Outcome</th></tr>
                </thead>
                <tbody>
                  {props.map((p, i) => (
                    <tr key={i} onClick={() => onOpenCase(p.slug)}>
                      <td style={{ fontWeight: 600, color: '#1F3864' }}>{propName(p)}</td>
                      <td style={{ color: '#3a4a66', whiteSpace: 'nowrap' }}>{propRent(p)}</td>
                      <td style={{ color: '#5b6780' }}>{propStatus(p)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="result-card">
          <h3 className="font-extrabold mb-2" style={{ color: '#1F3864' }}>Recurring entities (in &gt; 1 case)</h3>
          {d.recurringEntities.length === 0 && <p className="text-sm" style={{ color: '#5b6780' }}>None.</p>}
          {d.recurringEntities.map((e, i) => (
            <Bar key={i} label={`${e.name}${e.is_bank ? ' (bank/FI)' : ''}`} n={e.cases} max={maxEnt} sub={`${e.cases} cases`} />
          ))}
        </div>

        <div className="result-card">
          <h3 className="font-extrabold mb-2" style={{ color: '#1F3864' }}>Largest figures (TTD)</h3>
          {d.topFigures.map((f, i) => (
            <div key={i} className="flex justify-between gap-2 text-sm mb-1">
              <button className="text-left underline decoration-dotted" style={{ color: '#1F3864' }}
                onClick={() => onOpenCase(f.slug)}>{f.what.slice(0, 46)}</button>
              <span className="font-bold whitespace-nowrap">TT${fmt(f.amount)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
