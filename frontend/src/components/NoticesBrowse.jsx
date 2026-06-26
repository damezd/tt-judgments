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

// Short tile label + icon per allegation (visual, Instagram-style breakdown).
const SHORT = {
  'Contract killings': 'Contract kill', 'Reprisal attacks': 'Reprisals', 'Murder / homicide': 'Homicide',
  'Firearms': 'Firearms', 'Drug trafficking': 'Drugs', 'Vehicle theft': 'Vehicle theft',
  'Extortion': 'Extortion', 'Robbery': 'Robbery', 'Kidnapping': 'Kidnapping', 'Wounding': 'Wounding',
  'Outstanding warrants': 'Warrants', 'Evading police': 'Evading', 'Gang / OCG activity': 'Gang / OCG',
};
const ICON = {
  'Contract killings': 'target', 'Reprisal attacks': 'flame', 'Murder / homicide': 'skull',
  'Firearms': 'gun', 'Drug trafficking': 'pill', 'Vehicle theft': 'car', 'Extortion': 'money',
  'Robbery': 'bag', 'Kidnapping': 'kidnap', 'Wounding': 'knife', 'Outstanding warrants': 'doc',
  'Evading police': 'run', 'Gang / OCG activity': 'gang',
};
function Icon({ name, color, size = 30 }) {
  const p = { fill: 'none', stroke: color, strokeWidth: 1.7, strokeLinecap: 'round', strokeLinejoin: 'round' };
  const set = {
    gun: <><rect x="2.5" y="8" width="12.5" height="3.3" rx="0.6" fill={color} /><path d="M10.6 11.3h4.1l-1.5 5.1a1 1 0 0 1-.96.7h-1.2a1 1 0 0 1-.95-1.3z" fill={color} /><path fill="none" stroke={color} strokeWidth="1.4" strokeLinecap="round" d="M9.6 11.6a2.2 2.2 0 0 0 1.7 2.5" /></>,
    skull: <><path {...p} d="M5 11a7 7 0 0 1 14 0v3l-1.5 1.4V18h-2v-1.6h-1V18h-2v-1.6h-1V18h-2v-2.6L6.5 14z" /><circle cx="9.2" cy="11" r="1.3" fill={color} stroke="none" /><circle cx="14.8" cy="11" r="1.3" fill={color} stroke="none" /></>,
    target: <><circle {...p} cx="12" cy="12" r="8" /><circle {...p} cx="12" cy="12" r="3.2" /><path {...p} d="M12 1.5v3.5M12 19v3.5M1.5 12h3.5M19 12h3.5" /></>,
    flame: <path {...p} d="M12 3c3.5 4 5 6 5 9a5 5 0 1 1-10 0c0-2 .8-3.2 2-4.2.2 1.4 1 2.2 2 2.2-.6-2.2-1.4-4.4 1-7z" />,
    pill: <g transform="rotate(45 12 12)"><rect {...p} x="3" y="9" width="18" height="6" rx="3" /><path d="M3 9h9v6H6a3 3 0 0 1-3-3z" fill={color} opacity="0.22" /><path stroke={color} strokeWidth="1.7" strokeLinecap="round" d="M12 9v6" /></g>,
    car: <><path {...p} d="M4 13l1.8-4.5h12.4L20 13v4h-2.5M6.5 17H4v-4M9.5 17h5" /><circle {...p} cx="7.5" cy="17.3" r="1.7" /><circle {...p} cx="16.5" cy="17.3" r="1.7" /></>,
    money: <><circle {...p} cx="12" cy="12" r="8.4" /><path {...p} d="M12 6.8v10.4M9.6 9.4a2.4 2 0 0 1 4.8 0c0 2.4-4.8 1.6-4.8 3.9a2.4 2 0 0 0 4.8.3" /></>,
    bag: <><path {...p} d="M7 8.5h10l1.8 11H5.2z" /><path {...p} d="M9 8.5a3 3 0 0 1 6 0" /><path fill="none" stroke={color} strokeWidth="1.4" strokeLinecap="round" d="M12 12v4.4M10.7 13a1.3 1 0 0 1 2.6 0c0 1.3-2.6 .7-2.6 2a1.3 1 0 0 0 2.6 .2" /></>,
    kidnap: <><circle {...p} cx="12" cy="7" r="3" /><path {...p} d="M6 20v-1a6 6 0 0 1 12 0v1" /><path {...p} d="M8.8 7h6.4" /></>,
    knife: <><path d="M3.5 16.5L13 7q1.8-1.8 3.4-.2L7 16.8z" fill={color} opacity="0.9" /><path {...p} d="M7.2 17l2.6 2.6" /><path {...p} d="M12.2 7.8l1.8 1.8" /></>,
    doc: <><rect {...p} x="6" y="3" width="12" height="18" rx="1.5" /><path {...p} d="M9 8h6M9 12h6M9 16h3.5" /></>,
    run: <><circle {...p} cx="14" cy="5" r="2" /><path {...p} d="M5.5 21l3.5-5 2.5 2 1.6-3.6L9.2 11l-3 1" /><path {...p} d="M11 14.5l3.6 1 2 4.5" /></>,
    gang: <><circle {...p} cx="12" cy="6" r="2.3" /><circle {...p} cx="6" cy="9" r="2" /><circle {...p} cx="18" cy="9" r="2" /><path {...p} d="M8.4 19a3.6 3.6 0 0 1 7.2 0M2.5 18a3 3 0 0 1 5-2M21.5 18a3 3 0 0 0-5-2" /></>,
    alert: <><path {...p} d="M12 3l9 16H3z" /><path {...p} d="M12 10v4M12 16.4v.2" /></>,
  };
  return <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true">{set[name] || set.alert}</svg>;
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

          {/* INFOGRAPHIC = alleged grounds as visual icon tiles */}
          {allegs.length ? (
            <>
              <div style={{ fontSize: 10.5, textTransform: 'uppercase', letterSpacing: 1, color: t.accent, fontWeight: 700, marginBottom: 9 }}>Alleged grounds for detention</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(96px, 1fr))', gap: 9, marginBottom: 16 }}>
                {allegs.map((a, i) => (
                  <div key={i} title={a.ev || a.label}
                    style={{ border: `1px solid ${t.accent}26`, borderRadius: 12, padding: '12px 6px 10px', background: t.tint, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 7, textAlign: 'center' }}>
                    <Icon name={ICON[a.label] || 'alert'} color={t.accent} size={30} />
                    <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.04em', textTransform: 'uppercase', color: t.accent, lineHeight: 1.2 }}>{SHORT[a.label] || a.label}</span>
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
