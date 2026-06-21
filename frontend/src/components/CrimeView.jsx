import { useEffect, useState, useMemo } from 'react';
import { getCrime } from '../api/client';
import { Badge, CrimeBadge, webSearch } from './ui';

function PersonCard({ group, onOpenCase }) {
  const [open, setOpen] = useState(group.mentions.length <= 3);
  return (
    <div className="result-card">
      <div className="flex flex-wrap items-center gap-2">
        <button className="chip" onClick={() => setOpen(o => !o)} type="button">
          <span>{group.name}</span>
          <span className={`chevron ${open ? 'open' : ''}`}>▸</span>
        </button>
        {group.categories.map((c, i) => <CrimeBadge key={i} label={c} />)}
        <span className="text-xs" style={{ color: '#5b6780' }}>
          {group.mentions.length} case{group.mentions.length !== 1 ? 's' : ''}
        </span>
        <a className="pill-link ml-1" href={webSearch(group.name)} target="_blank" rel="noreferrer">Web</a>
      </div>
      {open && (
        <div className="mt-2 flex flex-col gap-2">
          {group.mentions.map((m, i) => (
            <div key={i} className="flex flex-wrap items-center gap-2 text-sm">
              <Badge value={m.value} />
              <button className="font-semibold text-left underline decoration-dotted"
                style={{ color: '#1F3864' }} onClick={() => onOpenCase(m.slug)}>
                {m.title}
              </button>
              <span className="text-xs" style={{ color: '#5b6780' }}>
                {m.citation}{m.role ? ` · ${m.role}` : ''}{m.offences?.length ? ` · ${m.offences.join('; ')}` : ''}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function CrimeView({ onOpenCase }) {
  const [d, setD] = useState(null);
  const [err, setErr] = useState('');
  const [q, setQ] = useState('');
  const [cat, setCat] = useState('');

  useEffect(() => { getCrime().then(setD).catch(() => setErr('Failed to load crime data.')); }, []);

  const filtered = useMemo(() => {
    if (!d) return [];
    const term = q.trim().toLowerCase();
    return d.people.filter(p =>
      (!term || p.name.toLowerCase().includes(term)) &&
      (!cat || p.categories.includes(cat))
    );
  }, [d, q, cat]);

  if (err) return <p className="text-center mt-6 text-red-300">{err}</p>;
  if (!d) return <p className="text-center mt-6 text-sm" style={{ color: 'rgba(238,244,255,.7)' }}>Loading…</p>;

  return (
    <div className="panel-in">
      <div className="glass p-5">
        <div className="flex flex-wrap items-center gap-3 mb-3">
          <span className="text-sm" style={{ color: 'rgba(238,244,255,.9)' }}>
            <b>{d.count}</b> people tied to criminal matters across <b>{d.crimeCases}</b> cases
          </span>
        </div>
        <div className="flex flex-wrap gap-2 items-end">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs mb-1.5" style={{ color: 'rgba(238,244,255,.8)' }}>Search name</label>
            <input className="field-input" value={q} placeholder="e.g. surname…" onChange={e => setQ(e.target.value)} />
          </div>
          <div>
            <label className="block text-xs mb-1.5" style={{ color: 'rgba(238,244,255,.8)' }}>Offence category</label>
            <select className="field-input" value={cat} onChange={e => setCat(e.target.value)}>
              <option value="">All</option>
              {d.categories.map(c => <option key={c.name} value={c.name}>{c.name} ({c.n})</option>)}
            </select>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 980, margin: '0 auto' }}>
        <p className="text-xs mb-1 mt-4" style={{ color: 'rgba(238,244,255,.7)' }}>
          {filtered.length} {filtered.length === 1 ? 'person' : 'people'}
        </p>
        {filtered.length === 0 && <p className="text-sm" style={{ color: 'rgba(238,244,255,.7)' }}>No matches.</p>}
        {filtered.map((g, i) => <PersonCard key={i} group={g} onOpenCase={onOpenCase} />)}
      </div>
    </div>
  );
}
