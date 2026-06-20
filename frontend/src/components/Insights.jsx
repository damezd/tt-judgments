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

export default function Insights({ onOpenCase }) {
  const [d, setD] = useState(null);
  const [err, setErr] = useState('');
  useEffect(() => { getInsights().then(setD).catch(() => setErr('Failed to load insights.')); }, []);

  if (err) return <p className="text-center mt-6 text-red-300">{err}</p>;
  if (!d) return <p className="text-center mt-6 text-sm" style={{ color: 'rgba(238,244,255,.7)' }}>Loading…</p>;

  const t = d.totals;
  const maxJudge = Math.max(...d.byJudge.map(j => j.n), 1);
  const maxCourt = Math.max(...d.byCourt.map(c => c.n), 1);
  const maxEnt   = Math.max(...d.recurringEntities.map(e => e.cases), 1);

  return (
    <div className="panel-in" style={{ maxWidth: 1000, margin: '0 auto' }}>
      <div className="grid gap-3 mb-4" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(120px,1fr))' }}>
        <div className="stat"><div className="num">{fmt(t.total)}</div><div className="lbl">Total cases</div></div>
        <div className="stat"><div className="num" style={{ color: '#9b2412' }}>{fmt(t.high)}</div><div className="lbl">High value</div></div>
        <div className="stat"><div className="num" style={{ color: '#1e4e86' }}>{fmt(t.medium)}</div><div className="lbl">Medium</div></div>
        <div className="stat"><div className="num" style={{ color: '#54606f' }}>{fmt(t.low)}</div><div className="lbl">Low</div></div>
        <div className="stat"><div className="num" style={{ color: '#7a5310' }}>{fmt(t.failed)}</div><div className="lbl">Not retrieved</div></div>
      </div>

      <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(300px,1fr))' }}>
        <div className="result-card">
          <h3 className="font-extrabold mb-2" style={{ color: '#1F3864' }}>Recurring entities (in &gt; 1 case)</h3>
          {d.recurringEntities.length === 0 && <p className="text-sm" style={{ color: '#5b6780' }}>None.</p>}
          {d.recurringEntities.map((e, i) => (
            <Bar key={i} label={`${e.name}${e.is_bank ? ' (bank/FI)' : ''}`} n={e.cases} max={maxEnt} sub={`${e.cases} cases`} />
          ))}
        </div>

        <div className="result-card">
          <h3 className="font-extrabold mb-2" style={{ color: '#1F3864' }}>Caseload by judge</h3>
          {d.byJudge.map((j, i) => <Bar key={i} label={j.judge} n={j.n} max={maxJudge} />)}
        </div>

        <div className="result-card">
          <h3 className="font-extrabold mb-2" style={{ color: '#1F3864' }}>By court</h3>
          {d.byCourt.map((c, i) => <Bar key={i} label={c.court_type} n={c.n} max={maxCourt} />)}
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
