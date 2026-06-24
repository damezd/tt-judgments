import { useState, useRef } from 'react';
import { searchPeople } from '../api/client';
import { Badge, CrimeBadge, webSearch, debounce } from './ui';

function PersonCard({ group, onOpenCase }) {
  const [open, setOpen] = useState(group.mentions.length <= 3);
  const roles = [...new Set(group.mentions.map(m => m.kind))];
  const hasCrime = group.mentions.some(m => m.crime_category?.length || m.kind === 'accused');
  return (
    <div className="result-card">
      <div className="flex flex-wrap items-center gap-2">
        <button className="chip" onClick={() => setOpen(o => !o)} type="button">
          <span>{group.name}</span>
          <span className={`chevron ${open ? 'open' : ''}`}>▸</span>
        </button>
        {hasCrime ? <CrimeBadge /> : null}
        <span className="text-xs" style={{ color: '#5b6780' }}>
          {group.mentions.length} case{group.mentions.length !== 1 ? 's' : ''} · {roles.join(', ')}
        </span>
        <a className="pill-link ml-1" href={webSearch(group.name)} target="_blank" rel="noreferrer">Web</a>
      </div>
      {open && (
        <div className="mt-2 flex flex-col gap-2">
          {group.mentions.map((m, i) => (
            <div key={i} className="flex flex-wrap items-center gap-2 text-sm">
              <Badge value={m.value} />
              {m.crime_category?.map((cat, j) => <CrimeBadge key={j} label={cat} />)}
              <button className="font-semibold text-left underline decoration-dotted"
                style={{ color: '#1F3864' }} onClick={() => onOpenCase(m.slug)}>
                {m.title}
              </button>
              <span className="text-xs" style={{ color: '#5b6780' }}>
                {m.citation} · {m.kind}{m.company ? ` of ${m.company}` : ''}{m.role && (m.kind === 'individual' || m.kind === 'accused') ? ` — ${m.role}` : ''}
                {m.offences?.length ? ` · ${m.offences.join('; ')}` : ''}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function PeopleSearch({ onOpenCase }) {
  const [q, setQ] = useState('');
  const [state, setState] = useState(null);

  async function run(term) {
    if (term.trim().length < 2) { setState(null); return; }
    setState({ loading: true });
    try {
      const data = await searchPeople(term);
      setState({ loading: false, ...data });
    } catch (e) {
      if (e.message === 'UNAUTHORIZED') throw e;
      setState({ loading: false, error: 'Search failed — try again.' });
    }
  }
  const live = useRef(debounce(run, 350)).current;

  return (
    <div className="panel-in">
      <div className="glass p-5">
        <label className="block text-xs mb-1.5" style={{ color: 'var(--muted)' }}>
          Search a person (claimant, defendant, director/officer, or named individual)
        </label>
        <div className="flex gap-2">
          <input className="field-input" type="text" placeholder="e.g. Ramlogan, Maraj, Rowley, Warner…"
            value={q} autoFocus
            onChange={e => { setQ(e.target.value); live(e.target.value); }} />
          <button className="btn-primary" onClick={() => run(q)}>Search</button>
        </div>
      </div>

      {state?.loading && <p className="text-center mt-6 text-sm" style={{ color: 'var(--muted)' }}>Searching…</p>}
      {state?.error && <p className="text-center mt-6 text-sm text-red-300">{state.error}</p>}
      {state && !state.loading && !state.error && (
        <div style={{ maxWidth: 980, margin: '0 auto' }}>
          <p className="text-xs mb-1 mt-4" style={{ color: 'var(--muted)' }}>
            {state.count} {state.count === 1 ? 'person' : 'people'} matched
          </p>
          {state.groups.length === 0 && <p className="text-sm" style={{ color: 'var(--muted)' }}>No matches.</p>}
          {state.groups.map((g, i) => <PersonCard key={i} group={g} onOpenCase={onOpenCase} />)}
        </div>
      )}
    </div>
  );
}
