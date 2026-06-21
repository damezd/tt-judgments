import { useState, useEffect } from 'react';
import { getCase } from '../api/client';
import { Badge, CrimeBadge, copyText } from './ui';

function Section({ title, children }) {
  return (
    <div className="mb-4">
      <h3 className="text-xs font-extrabold uppercase tracking-wide mb-1.5" style={{ color: '#1F3864' }}>{title}</h3>
      {children}
    </div>
  );
}

export default function CaseDetail({ slug, onClose }) {
  const [c, setC] = useState(null);
  const [err, setErr] = useState('');

  useEffect(() => {
    let alive = true;
    getCase(slug).then(d => alive && setC(d)).catch(() => alive && setErr('Failed to load case.'));
    return () => { alive = false; };
  }, [slug]);

  return (
    <div onClick={onClose}
      style={{ position: 'fixed', inset: 0, background: 'rgba(3,8,20,.6)', zIndex: 40, display: 'flex', justifyContent: 'center', alignItems: 'flex-start', overflow: 'auto', padding: '5vh 12px' }}>
      <div onClick={e => e.stopPropagation()} className="glass panel-in"
        style={{ width: '100%', maxWidth: 820, padding: 22 }}>
        {!c && !err && <p style={{ color: 'rgba(238,244,255,.8)' }}>Loading…</p>}
        {err && <p className="text-red-300">{err}</p>}
        {c && (
          <>
            <div className="flex justify-between items-start gap-3 mb-2">
              <div>
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <Badge value={c.osint_value} />
                  {c.fetch_failed ? <span className="badge failed">not retrieved</span> : null}
                  {c.is_crime ? (c.crime_flags?.length
                    ? c.crime_flags.map((f, i) => <CrimeBadge key={i} label={f} />)
                    : <CrimeBadge />) : null}
                </div>
                <h2 className="font-extrabold" style={{ fontSize: '1.3rem', lineHeight: 1.2 }}>{c.title}</h2>
                <p className="text-xs mt-1" style={{ color: 'rgba(238,244,255,.7)' }}>
                  {[c.citation, c.court, c.case_date].filter(Boolean).join(' · ')}
                </p>
              </div>
              <button className="btn-secondary text-sm px-3 py-1.5" onClick={onClose}>Close</button>
            </div>

            <div className="rounded-2xl p-4 mt-2" style={{ background: 'rgba(255,255,255,.93)', color: '#0f172a' }}>
              {(c.social_headline || c.social_post) ? (
                <div className="social-card mb-4">
                  {c.social_headline ? <div className="headline">{c.social_headline}</div> : null}
                  {c.social_post ? <div className="post">{c.social_post}</div> : null}
                  {c.social_post ? (
                    <button className="pill-link mt-2" onClick={() => copyText(`${c.social_headline ? c.social_headline + '\n\n' : ''}${c.social_post}`)}>Copy post</button>
                  ) : null}
                </div>
              ) : null}

              {c.people?.filter(p => p.kind === 'accused').length ? (
                <Section title="Criminal Charges / Accused">
                  {c.people.filter(p => p.kind === 'accused').map((p, i) => (
                    <p className="kv mb-1" key={i}>
                      <b>{p.name}</b>{p.role ? ` — ${p.role}` : ''}
                      {p.crime_category ? <span> {p.crime_category.split('||').filter(Boolean).map((cat, j) => <span key={j} className="badge crime ml-1">{cat}</span>)}</span> : null}
                      {p.offences ? <span style={{ color: '#5b6780' }}> · {p.offences.split('||').filter(Boolean).join('; ')}</span> : null}
                      {p.note ? <span style={{ color: '#5b6780' }}> · {p.note}</span> : null}
                    </p>
                  ))}
                </Section>
              ) : null}

              {c.judges?.length ? <Section title="Judge(s)"><p className="kv">{c.judges.join('; ')}</p></Section> : null}
              <Section title="Parties">
                <p className="kv"><b>Claimants:</b> {c.claimants?.join('; ') || '—'}</p>
                <p className="kv"><b>Defendants:</b> {c.defendants?.join('; ') || '—'}</p>
              </Section>

              {c.companies?.length ? (
                <Section title="Companies / Entities">
                  {c.companies.map((co, i) => (
                    <p className="kv mb-1" key={i}>
                      <b>{co.name}</b>{co.is_bank ? ' (bank/FI)' : ''}{co.role ? ` — ${co.role}` : ''}
                      {co.directors ? <span> · directors: {co.directors.split('||').join(', ')}</span> : null}
                      {co.ownership_notes ? <span style={{ color: '#5b6780' }}> · {co.ownership_notes}</span> : null}
                    </p>
                  ))}
                </Section>
              ) : null}

              {c.people?.filter(p => p.kind === 'individual').length ? (
                <Section title="Named Individuals">
                  {c.people.filter(p => p.kind === 'individual').map((p, i) => (
                    <p className="kv mb-0.5" key={i}><b>{p.name}</b>{p.role ? ` — ${p.role}` : ''}{p.note ? <span style={{ color: '#5b6780' }}> · {p.note}</span> : null}</p>
                  ))}
                </Section>
              ) : null}

              {c.financials?.length ? (
                <Section title="Financial Figures">
                  {c.financials.map((f, i) => (
                    <p className="kv mb-0.5" key={i}><b>{f.currency} {f.amount}</b> — {f.what_it_is}</p>
                  ))}
                </Section>
              ) : null}

              {c.properties?.length ? (
                <Section title="Property / Lease">
                  {c.properties.map((p, i) => (
                    <p className="kv mb-1" key={i}><b>{p.description}</b>
                      {p.rent ? ` · rent: ${p.rent}` : ''}{p.landlord ? ` · landlord: ${p.landlord}` : ''}{p.tenant ? ` · tenant: ${p.tenant}` : ''}
                      {p.outcome ? <span style={{ color: '#5b6780' }}> · {p.outcome}</span> : null}</p>
                  ))}
                </Section>
              ) : null}

              {c.related_litigation?.length ? <Section title="Related Litigation"><p className="kv">{c.related_litigation.join('; ')}</p></Section> : null}
              {c.outcome ? <Section title="Outcome"><p className="kv">{c.outcome}</p></Section> : null}
              {c.practical_takeaways?.length ? (
                <Section title="Practical Takeaways">
                  <ul className="takeaways">{c.practical_takeaways.map((t, i) => <li key={i}>{t}</li>)}</ul>
                </Section>
              ) : null}
              {c.osint_notes ? <Section title="OSINT Notes"><p className="kv">{c.osint_notes}</p></Section> : null}

              <div className="flex gap-2 mt-3">
                {c.url ? <a className="pill-link" href={c.url} target="_blank" rel="noreferrer">Source PDF</a> : null}
                <button className="pill-link" onClick={() => copyText(`${c.title} — ${c.citation} — ${c.url}`)}>Copy ref</button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
