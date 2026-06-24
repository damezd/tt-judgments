import { useState, useRef } from 'react';
import { searchEntities } from '../api/client';
import { Badge, webSearch, debounce } from './ui';

function EntityCard({ group, onOpenCase }) {
  const [open, setOpen] = useState(true);
  const directors = [...new Set(group.cases.flatMap(c => (c.directors || '').split('||')).map(s => s.trim()).filter(Boolean))];
  return (
    <div className="result-card">
      <div className="flex flex-wrap items-center gap-2">
        <button className="chip" onClick={() => setOpen(o => !o)} type="button">
          <span>{group.name}</span>
          <span className={`chevron ${open ? 'open' : ''}`}>▸</span>
        </button>
        <span className="text-xs" style={{ color: '#5b6780' }}>
          {group.is_bank ? 'bank / FI' : 'company'} · {group.cases.length} case{group.cases.length !== 1 ? 's' : ''}
        </span>
        <a className="pill-link ml-1" href={webSearch(group.name)} target="_blank" rel="noreferrer">Web</a>
      </div>
      {open && (
        <div className="mt-2 flex flex-col gap-1.5">
          {directors.length > 0 && (
            <div className="text-xs" style={{ color: '#39435a' }}>
              <b>Directors / officers seen:</b> {directors.join(', ')}
            </div>
          )}
          {group.cases.map((c, i) => (
            <div key={i} className="flex flex-wrap items-center gap-2 text-sm">
              <Badge value={c.value} />
              <button className="font-semibold text-left underline decoration-dotted"
                style={{ color: '#1F3864' }} onClick={() => onOpenCase(c.slug)}>{c.title}</button>
              <span className="text-xs" style={{ color: '#5b6780' }}>{c.citation}{c.role ? ` · ${c.role}` : ''}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function EntitySearch({ onOpenCase }) {
  const [q, setQ] = useState('');
  const [state, setState] = useState(null);

  async function run(term) {
    if (term.trim().length < 2) { setState(null); return; }
    setState({ loading: true });
    try {
      const data = await searchEntities(term);
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
          Search a company, bank or financial institution
        </label>
        <div className="flex gap-2">
          <input className="field-input" type="text" placeholder="e.g. NIDCO, TTMF, Maraj Gold, Massy…"
            value={q} autoFocus onChange={e => { setQ(e.target.value); live(e.target.value); }} />
          <button className="btn-primary" onClick={() => run(q)}>Search</button>
        </div>
      </div>

      {state?.loading && <p className="text-center mt-6 text-sm" style={{ color: 'var(--muted)' }}>Searching…</p>}
      {state?.error && <p className="text-center mt-6 text-sm text-red-300">{state.error}</p>}
      {state && !state.loading && !state.error && (
        <div style={{ maxWidth: 980, margin: '0 auto' }}>
          <p className="text-xs mb-1 mt-4" style={{ color: 'var(--muted)' }}>{state.count} entit{state.count === 1 ? 'y' : 'ies'} matched</p>
          {state.groups.length === 0 && <p className="text-sm" style={{ color: 'var(--muted)' }}>No matches.</p>}
          {state.groups.map((g, i) => <EntityCard key={i} group={g} onOpenCase={onOpenCase} />)}
        </div>
      )}
    </div>
  );
}
