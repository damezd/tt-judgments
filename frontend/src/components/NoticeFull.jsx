import { copyText, lookupAddress } from './ui';
import { allegationsFrom, gangRole, noticeMeta } from './noticeUtils';

function Section({ title, children }) {
  return (
    <div className="mb-4">
      <h3 className="text-xs font-extrabold uppercase tracking-wide mb-1.5" style={{ color: '#1F3864' }}>{title}</h3>
      {children}
    </div>
  );
}

export default function NoticeFull({ n, onClose }) {
  if (!n) return null;
  const meta = noticeMeta(n);
  const { gang, role } = gangRole(n.summary);
  const grounds = allegationsFrom(n.summary, n.person_name);
  const aliases = (n.alias || '').split(/[;]/).map(s => s.trim()).filter(Boolean);

  return (
    <div onClick={onClose}
      style={{ position: 'fixed', inset: 0, background: 'rgba(3,8,20,.6)', zIndex: 1100, display: 'flex', justifyContent: 'center', alignItems: 'flex-start', overflow: 'auto', padding: '5vh 12px' }}>
      <div onClick={e => e.stopPropagation()} className="glass panel-in" style={{ width: '100%', maxWidth: 820, padding: 22 }}>
        <div className="flex justify-between items-start gap-3 mb-2">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <span className={`badge badge-type-${meta.type}`}>{meta.label}</span>
              {grounds.length ? <span className="badge badge-high">{grounds[0].label}</span> : null}
            </div>
            <h2 className="font-extrabold" style={{ fontSize: '1.3rem', lineHeight: 1.2 }}>{n.person_name || n.title}</h2>
            <p className="text-xs mt-1" style={{ color: 'var(--muted)' }}>
              {[n.citation, (n.act || '').replace(/^The\s+/i, ''), n.date_published || n.date_made].filter(Boolean).join(' · ')}
            </p>
          </div>
          <button className="btn-secondary text-sm px-3 py-1.5" onClick={onClose}>Close</button>
        </div>

        <div className="rounded-2xl p-4 mt-2" style={{ background: 'rgba(255,255,255,.93)', color: '#0f172a' }}>
          {(n.social_headline || n.social_post) ? (
            <div className="social-card mb-4">
              {n.social_headline ? <div className="headline">{n.social_headline}</div> : null}
              {n.social_post ? <div className="post">{n.social_post}</div> : null}
              {n.social_post ? (
                <button className="pill-link mt-2" onClick={() => copyText(`${n.social_headline ? n.social_headline + '\n\n' : ''}${n.social_post}`)}>Copy post</button>
              ) : null}
            </div>
          ) : null}

          {n.person_name ? (
            <Section title="Detained Person">
              <p className="kv mb-1">
                <b>{n.person_name}</b>
                {aliases.length ? <span style={{ color: '#5b6780' }}> · aka “{aliases.join('”, “')}”</span> : null}
                {(role || gang) ? <span> {[role, gang].filter(Boolean).map((x, i) => <span key={i} className="badge crime ml-1">{x}</span>)} <span style={{ color: '#5b6780' }}>(alleged)</span></span> : null}
              </p>
              {n.address ? <p className="kv mb-0.5"><b>Address:</b> {n.address}</p> : null}
              {n.detained_at ? <p className="kv mb-0.5"><b>Detained at:</b> {n.detained_at}</p> : null}
              <button className="pill-link mt-1" onClick={() => lookupAddress(n.person_name)}>Look up in TT-Address ↗</button>
            </Section>
          ) : null}

          {grounds.length ? (
            <Section title="Alleged Grounds">
              <p className="kv">{grounds.map((g, i) => <span key={i} className="badge crime mr-1 mb-1" style={{ display: 'inline-block' }}>{g.label}</span>)}</p>
            </Section>
          ) : null}

          <Section title="Legal Basis">
            <p className="kv mb-0.5"><b>Instrument:</b> {n.instrument || 'Detention Order'}</p>
            {n.act ? <p className="kv mb-0.5"><b>Act:</b> {n.act}</p> : null}
            {n.official ? <p className="kv mb-0.5"><b>Ordered by:</b> {n.official}{n.official_role ? `, ${n.official_role}` : ''}</p> : null}
          </Section>

          {n.summary ? <Section title="Summary"><p className="kv" style={{ lineHeight: 1.55 }}>{n.summary}</p></Section> : null}

          <Section title="Gazette Reference">
            <p className="kv">{[n.citation, `Legal Notice No. ${n.notice_no}`, n.date_published || n.date_made].filter(Boolean).join(' · ')}</p>
          </Section>

          <div className="flex gap-2 mt-3">
            <button className="pill-link" onClick={() => copyText(`${n.person_name || n.title} — Legal Notice No. ${n.notice_no} — ${n.citation || ''}`)}>Copy ref</button>
          </div>
        </div>
      </div>
    </div>
  );
}
