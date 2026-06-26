import { useState, useEffect } from 'react';
import { getNotices } from '../api/client';
import { copyText } from './ui';
import { fmtDate } from './caseMeta';

const TYPE = {
  detention_order: { label: 'Detention Order', tag: 'Emergency Powers', accent: '#c0392b', tint: '#fdeceb' },
  detention_revocation: { label: 'Detention Revoked', tag: 'Emergency Powers', accent: '#1e8449', tint: '#e9f7ef' },
  proceeds_of_crime: { label: 'Proceeds of Crime', tag: 'Seized Assets', accent: '#1a5276', tint: '#eaf1f8' },
  default: { label: 'Legal Notice', tag: 'Gazette', accent: '#1a1814', tint: '#efece5' },
};

// ── parse the alleged grounds into labelled findings (each with a supporting line) ──
const ALLEGATIONS = [
  [/contract killing/i, 'Contract killings'],
  [/reprisal/i, 'Reprisal attacks'],
  [/double homicide|homicide|\bmurder|to kill|assassinat/i, 'Murder / homicide'],
  [/firearm|illegal gun|ammunition|high-powered|rounds of/i, 'Firearms'],
  [/cocaine|marijuana|narcotic|\bdrug|trafficking/i, 'Drug trafficking'],
  [/motor vehicle|larceny ring|car[- ]theft|vehicle theft/i, 'Vehicle theft'],
  [/extortion|demanding money|menaces/i, 'Extortion'],
  [/robbery/i, 'Robbery'],
  [/kidnap/i, 'Kidnapping'],
  [/wounding|grievous/i, 'Wounding'],
  [/outstanding warrant|warrants/i, 'Outstanding warrants'],
  [/evade|evading|escape|avoided police/i, 'Evading police'],
  [/gang|organised crim|organized crim|\bocg\b|\bicg\b/i, 'Gang / OCG activity'],
];
function allegationsFrom(text, name) {
  text = text || '';
  if (name) text = text.split(name.toUpperCase()).join(name);
  const sentences = text.split(/(?<=[.])\s+/);
  const out = [];
  const seen = new Set();
  for (const [re, label] of ALLEGATIONS) {
    if (!re.test(text)) continue;
    let ev = '';
    for (const s of sentences) { if (re.test(s)) { ev = s.trim(); break; } }
    if (ev && seen.has(ev)) ev = '';
    else if (ev) seen.add(ev);
    if (ev.length > 165) ev = ev.slice(0, 162).trimEnd() + '…';
    out.push({ label, ev });
  }
  return out.slice(0, 6);
}
function gangRole(text) {
  text = text || '';
  let gang = '';
  const gm = text.match(/[“"]([^”"]*?(?:Gang|OCG))[”"]/) || text.match(/\b(\d+\s+Gang)\b/) ||
    text.match(/\b(Resistance Gang|Six Gang|Seven Gang|Rasta City|[A-Z][\w'.]+\s+Gang)\b/);
  if (gm) gang = gm[1].replace(/^.*faction of the\s+/i, '');
  const l = text.toLowerCase();
  let role = '';
  if (/high-ranking|general\b/.test(l)) role = 'Ranking member';
  else if (/leader|principal|head of/.test(l)) role = 'Leader';
  else if (/shooter|gunman|enforcer|hitman/.test(l)) role = 'Shooter / enforcer';
  else if (/affiliate|associate/.test(l)) role = 'Affiliate';
  else if (/\bmember\b/.test(l)) role = 'Member';
  return { gang, role };
}
function initials(name) {
  return (name || '?').split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase();
}

function NoticeArt({ no, accent, tint }) {
  return (
    <svg viewBox="0 0 430 168" xmlns="http://www.w3.org/2000/svg">
      <rect width="430" height="168" fill={tint} />
      <g stroke={accent} strokeWidth="1" opacity="0.18">
        <line x1="40" y1="40" x2="86" y2="40" /><line x1="40" y1="128" x2="86" y2="128" />
        <line x1="344" y1="40" x2="390" y2="40" /><line x1="344" y1="128" x2="390" y2="128" />
      </g>
      <rect x="120" y="20" width="190" height="132" rx="3" fill="#fff" stroke={accent} strokeWidth="2" />
      <rect x="120" y="20" width="190" height="24" rx="3" fill={accent} />
      <text x="215" y="36" textAnchor="middle" fontFamily="JetBrains Mono, monospace" fontSize="11" fill="#fff" letterSpacing="2" fontWeight="600">LEGAL NOTICE</text>
      <text x="200" y="86" textAnchor="middle" fontFamily="DM Serif Display, Georgia, serif" fontSize="34" fill={accent}>No. {no}</text>
      <g fill={accent} opacity="0.14">
        <rect x="138" y="98" width="120" height="5" rx="2" />
        <rect x="138" y="110" width="150" height="5" rx="2" />
        <rect x="138" y="122" width="96" height="5" rx="2" />
        <rect x="138" y="134" width="134" height="5" rx="2" />
      </g>
      <circle cx="296" cy="120" r="22" fill="#fff" stroke={accent} strokeWidth="2" />
      <circle cx="296" cy="120" r="15" fill="none" stroke={accent} strokeWidth="1" opacity="0.7" />
      <path d="M296 109 l3.2 6.6 7.2 0.9 -5.3 5 1.3 7.1 -6.4 -3.5 -6.4 3.5 1.3 -7.1 -5.3 -5 7.2 -0.9 z" fill={accent} opacity="0.85" />
      <path d="M288 140 l8 6 8 -6 0 14 -8 -5 -8 5 z" fill={accent} opacity="0.8" />
    </svg>
  );
}

// The "second insight card" — the alleged grounds, broken down.
function NoticeDetail({ n, onClose }) {
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  if (!n) return null;
  const t = TYPE[n.ntype] || TYPE.default;
  const isPerson = !!n.person_name;
  const { gang, role } = gangRole(n.summary);
  const allegs = allegationsFrom(n.summary, n.person_name);
  const aliases = (n.alias || '').split(';').map(s => s.trim()).filter(Boolean);
  const copyPost = () => copyText(`${n.social_headline ? n.social_headline + '\n\n' : ''}${n.social_post || n.summary || ''}`);

  return (
    <div onClick={onClose}
      style={{ position: 'fixed', inset: 0, background: 'rgba(3,8,20,.6)', zIndex: 1000, display: 'flex', justifyContent: 'center', alignItems: 'flex-start', overflow: 'auto', padding: '5vh 12px' }}>
      <div onClick={e => e.stopPropagation()} className="glass panel-in" style={{ width: '100%', maxWidth: 720, padding: 0, overflow: 'hidden' }}>

        <div style={{ background: t.accent, color: '#fff', padding: '13px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12, letterSpacing: 1 }}>{t.label.toUpperCase()} · NO. {n.notice_no}</span>
          <button onClick={onClose} aria-label="Close" style={{ background: 'transparent', border: 'none', color: '#fff', fontSize: 24, lineHeight: 1, cursor: 'pointer', padding: 0 }}>×</button>
        </div>

        <div style={{ padding: 20, background: 'rgba(255,255,255,.93)', color: '#0f172a' }}>
          <h2 className="font-extrabold" style={{ fontSize: '1.32rem', lineHeight: 1.22, marginBottom: 6 }}>{n.social_headline || n.title}</h2>
          <p style={{ fontSize: 12, color: '#5b6780', marginBottom: 14 }}>{[n.citation, fmtDate(n.date_published)].filter(Boolean).join(' · ')}</p>

          {/* WHO */}
          {isPerson && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 14px', borderRadius: 12, background: t.tint, border: `1px solid ${t.accent}33`, marginBottom: 16 }}>
              <div style={{ flex: '0 0 56px', width: 56, height: 56, borderRadius: '50%', background: t.accent, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'DM Serif Display, Georgia, serif', fontSize: 22 }}>{initials(n.person_name)}</div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 18, fontWeight: 800, lineHeight: 1.1 }}>{n.person_name}</div>
                {aliases.length ? <div style={{ fontSize: 13, color: t.accent, marginTop: 2 }}>aka “{aliases.join('”, “')}”</div> : null}
                {(role || gang) ? <div style={{ fontSize: 13, color: '#475569', marginTop: 3 }}>{[role, gang].filter(Boolean).join(' · ')} (alleged)</div> : null}
              </div>
            </div>
          )}

          {/* INFOGRAPHIC = the alleged grounds, broken down */}
          {allegs.length ? (
            <>
              <div style={{ fontSize: 10.5, textTransform: 'uppercase', letterSpacing: 1, color: t.accent, fontWeight: 700, marginBottom: 9 }}>Alleged grounds for detention</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: 10, marginBottom: 16 }}>
                {allegs.map((a, i) => (
                  <div key={i} style={{ border: '1px solid var(--border)', borderRadius: 10, padding: '12px 13px', background: 'rgba(255,255,255,.6)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: a.ev ? 6 : 0 }}>
                      <span style={{ flex: '0 0 22px', width: 22, height: 22, borderRadius: '50%', background: t.accent, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700 }}>{i + 1}</span>
                      <span style={{ fontSize: 13.5, fontWeight: 700, color: t.accent }}>{a.label}</span>
                    </div>
                    {a.ev ? <div style={{ fontSize: 13, lineHeight: 1.45, color: '#334155' }}>{a.ev}</div> : null}
                  </div>
                ))}
              </div>
            </>
          ) : null}

          {/* full narrative */}
          {(n.social_post || n.summary) ? (
            <div style={{ border: '1px solid var(--border)', borderRadius: 10, padding: '12px 14px', background: 'rgba(255,255,255,.6)' }}>
              <div style={{ fontSize: 10.5, textTransform: 'uppercase', letterSpacing: 1, color: t.accent, fontWeight: 700, marginBottom: 6 }}>{allegs.length ? 'In full' : 'Summary'}</div>
              <div style={{ fontSize: 13.5, lineHeight: 1.55, color: '#10131a', whiteSpace: 'pre-line' }}>{n.social_post || n.summary}</div>
            </div>
          ) : null}

          <div style={{ display: 'flex', gap: 8, marginTop: 14, alignItems: 'center' }}>
            <button className="pill-link" onClick={copyPost}>Copy post</button>
            <button className="pill-link" onClick={() => copyText(`${n.title} — ${n.citation}`)}>Copy ref</button>
            {n.source_file ? <span style={{ marginLeft: 'auto', fontSize: 11, color: '#94a3b8' }}>{n.source_file}</span> : null}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function NoticesBrowse() {
  const [state, setState] = useState({ loading: true });
  const [selected, setSelected] = useState(null);

  async function load() {
    setState({ loading: true });
    try {
      const data = await getNotices();
      setState({ loading: false, ...data });
    } catch (e) {
      if (e.message === 'UNAUTHORIZED') throw e;
      setState({ loading: false, error: e.message || 'Failed to load notices.' });
    }
  }
  useEffect(() => { load(); /* eslint-disable-next-line */ }, []);

  const share = (n) => {
    const text = `${n.social_headline || n.title} — InsightTT`;
    if (navigator.share) navigator.share({ title: 'InsightTT', text }).catch(() => {});
    else copyText(text);
  };

  return (
    <div className="panel-in">
      <div className="feed" style={{ padding: '4px 0 16px' }}>
        <div className="section-label">Gazette · Legal Notices</div>

        {state.loading && <p style={{ textAlign: 'center', color: 'var(--muted)', fontSize: 13, padding: '24px 0' }}>Loading…</p>}
        {state.error && (
          <div style={{ textAlign: 'center', padding: '24px 0' }}>
            <p style={{ color: 'var(--red)', fontSize: 13 }}>{state.error}</p>
            <button className="btn-secondary" style={{ marginTop: 12, fontSize: 13 }} onClick={load}>Retry</button>
          </div>
        )}
        {state.notices && state.notices.length === 0 && !state.loading && (
          <p style={{ textAlign: 'center', color: 'var(--muted)', fontSize: 13, padding: '24px 0' }}>No notices on record.</p>
        )}

        {(state.notices || []).map(n => {
          const t = TYPE[n.ntype] || TYPE.default;
          const body = n.social_post || n.summary || '';
          const excerpt = body.length > 200 ? body.slice(0, 200).trimEnd() + '…' : body;
          return (
            <article
              key={n.id}
              className="case-card"
              style={{ cursor: 'pointer' }}
              onClick={() => setSelected(n)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => { if (e.key === 'Enter') setSelected(n); }}
            >
              <div className="rail" style={{ background: t.accent }} />
              <div className="card-illustration"><NoticeArt no={n.notice_no} accent={t.accent} tint={t.tint} /></div>
              <div className="card-body">
                <div className="badge-row">
                  <span className="badge" style={{ background: t.tint, color: t.accent, border: `1px solid ${t.accent}40` }}>{t.label}</span>
                  <span className="badge" style={{ background: 'var(--bg)', color: 'var(--muted)', border: '1px solid var(--border)' }}>{t.tag}</span>
                </div>
                <div className="card-headline">{n.social_headline || n.title}</div>
                {excerpt && <div className="card-excerpt">{excerpt}</div>}
                <div style={{ fontSize: 11.5, color: 'var(--muted)', marginTop: 6 }}>Tap to break down the grounds →</div>
              </div>
              <div className="card-footer">
                <span className="card-date">{n.citation}</span>
                <button className="share-btn" onClick={(e) => { e.stopPropagation(); share(n); }}>Share · @insighttt</button>
              </div>
            </article>
          );
        })}
      </div>

      {selected && <NoticeDetail n={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}
