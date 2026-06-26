import { useState, useEffect } from 'react';
import { getNotices, fetchNoticeCard } from '../api/client';
import { copyText, toast } from './ui';
import { fmtDate } from './caseMeta';
import { MI } from './materialIcons';

const TYPE = {
  detention_order: { label: 'Detention Order', tag: 'Emergency Powers', accent: '#c0392b', tint: '#fdeceb' },
  detention_revocation: { label: 'Detention Revoked', tag: 'Emergency Powers', accent: '#1e8449', tint: '#e9f7ef' },
  proceeds_of_crime: { label: 'Proceeds of Crime', tag: 'Seized Assets', accent: '#1a5276', tint: '#eaf1f8' },
  default: { label: 'Legal Notice', tag: 'Gazette', accent: '#1a1814', tint: '#efece5' },
};

// ── alleged grounds → label + supporting sentence ──
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
// label → Material icon + a short "key insight"
const GROUND = {
  'Contract killings':   { icon: 'dangerous',            insight: 'Killings allegedly carried out for hire.' },
  'Reprisal attacks':    { icon: 'local_fire_department', insight: 'Tit-for-tat violence between rival groups.' },
  'Murder / homicide':   { icon: 'skull',                insight: 'Alleged involvement in killings.' },
  'Firearms':            { icon: 'crisis_alert',         insight: 'Access to weapons raises the threat to public safety.' },
  'Drug trafficking':    { icon: 'medication',           insight: 'Narcotics trade funds organised crime.' },
  'Vehicle theft':       { icon: 'directions_car',       insight: 'Stolen-vehicle ring activity.' },
  'Extortion':           { icon: 'paid',                 insight: 'Demanding money with menaces.' },
  'Robbery':             { icon: 'shopping_bag',         insight: 'Armed robbery is a core allegation.' },
  'Kidnapping':          { icon: 'person_off',           insight: 'Kidnapping for ransom is a core allegation.' },
  'Wounding':            { icon: 'personal_injury',      insight: 'Violent assault causing injury.' },
  'Outstanding warrants':{ icon: 'gavel',                insight: 'Wanted on existing warrants.' },
  'Evading police':      { icon: 'directions_run',       insight: 'Allegedly evading lawful arrest.' },
  'Gang / OCG activity': { icon: 'groups',               insight: 'OCGs operate in networks — disrupting one member impacts the whole.' },
};

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
    if (ev.length > 150) ev = ev.slice(0, 147).trimEnd() + '…';
    out.push({ label, ev, ...GROUND[label] });
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
const initials = name => (name || '?').split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase();
const firstSentences = (s, n) => {
  const parts = (s || '').split(/(?<=[.])\s+/);
  let out = '';
  for (const p of parts) { if ((out + ' ' + p).trim().length > n) break; out = (out + ' ' + p).trim(); }
  return out || (s || '').slice(0, n);
};

// Material Symbols icon (inline)
function MIcon({ name, color = 'currentColor', size = 22 }) {
  return <svg viewBox="0 -960 960 960" width={size} height={size} fill={color} style={{ display: 'block' }}
    aria-hidden="true" dangerouslySetInnerHTML={{ __html: MI[name] || MI.shield }} />;
}

// Feed-card illustration (light)
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
        <rect x="138" y="98" width="120" height="5" rx="2" /><rect x="138" y="110" width="150" height="5" rx="2" />
        <rect x="138" y="122" width="96" height="5" rx="2" /><rect x="138" y="134" width="134" height="5" rx="2" />
      </g>
      <circle cx="296" cy="120" r="22" fill="#fff" stroke={accent} strokeWidth="2" />
      <circle cx="296" cy="120" r="15" fill="none" stroke={accent} strokeWidth="1" opacity="0.7" />
      <path d="M296 109 l3.2 6.6 7.2 0.9 -5.3 5 1.3 7.1 -6.4 -3.5 -6.4 3.5 1.3 -7.1 -5.3 -5 7.2 -0.9 z" fill={accent} opacity="0.85" />
      <path d="M288 140 l8 6 8 -6 0 14 -8 -5 -8 5 z" fill={accent} opacity="0.8" />
    </svg>
  );
}

// ── Dark infographic poster (detention detail) ──
const D = { bg: '#16100e', panel: '#221915', line: '#3a2b25', red: '#e23d2e', redDim: '#7d241b', text: '#f4ece8', mut: '#a99c95' };
const BIGPIC = [
  ['public', 'Organised crime affects communities through violence, fear and instability.'],
  ['verified_user', 'Strong laws plus enforcement build safer communities.'],
  ['balance', 'The justice system is acting to hold OCG members accountable.'],
];

function Headline({ text, name }) {
  if (name && text && text.toLowerCase().includes(name.toLowerCase())) {
    const i = text.toLowerCase().indexOf(name.toLowerCase());
    return <>{text.slice(0, i)}<span style={{ color: D.red }}>{text.slice(i, i + name.length)}</span>{text.slice(i + name.length)}</>;
  }
  return <>{text}</>;
}

function NoticeDetail({ n, onClose, onShare }) {
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);
  if (!n) return null;

  const t = TYPE[n.ntype] || TYPE.default;
  const isPerson = !!n.person_name;
  const { gang, role } = gangRole(n.summary);
  const grounds = isPerson ? allegationsFrom(n.summary, n.person_name) : [];
  const aliases = (n.alias || '').split(';').map(s => s.trim()).filter(Boolean);
  const heroIcon = n.ntype === 'proceeds_of_crime' ? 'paid' : 'lock';
  const copyPost = () => copyText(`${n.social_headline ? n.social_headline + '\n\n' : ''}${n.social_post || n.summary || ''}`);

  const card = { background: D.panel, border: `1px solid ${D.line}`, borderRadius: 14, padding: 16 };
  const numBadge = i => (
    <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, fontWeight: 700, color: '#fff', background: D.red, borderRadius: 6, padding: '2px 7px', letterSpacing: 1 }}>
      {String(i).padStart(2, '0')}
    </span>
  );
  const iconChip = name => (
    <span style={{ flex: '0 0 38px', width: 38, height: 38, borderRadius: '50%', background: 'rgba(226,61,46,.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <MIcon name={name} color={D.red} size={22} />
    </span>
  );

  let no = 0;
  return (
    <div onClick={onClose}
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.7)', zIndex: 1000, display: 'flex', justifyContent: 'center', alignItems: 'flex-start', overflow: 'auto', padding: '4vh 10px' }}>
      <div onClick={e => e.stopPropagation()} className="panel-in"
        style={{ width: '100%', maxWidth: 460, background: D.bg, color: D.text, borderRadius: 18, overflow: 'hidden', boxShadow: '0 30px 70px rgba(0,0,0,.6)' }}>

        {/* HERO */}
        <div style={{ position: 'relative', padding: '18px 18px 20px', overflow: 'hidden',
          background: `radial-gradient(120% 90% at 88% 0%, ${D.redDim} 0%, rgba(125,36,27,0) 55%), ${D.bg}` }}>
          {/* prison-bar motif + faded icon */}
          <div style={{ position: 'absolute', top: 0, right: 0, bottom: 0, width: 150, opacity: 0.16, pointerEvents: 'none',
            backgroundImage: `repeating-linear-gradient(90deg, ${D.text} 0 2px, transparent 2px 16px)` }} />
          <div style={{ position: 'absolute', top: 24, right: 14, opacity: 0.12, pointerEvents: 'none' }}>
            <MIcon name={heroIcon} color={D.text} size={120} />
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', position: 'relative' }}>
            <div>
              <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 13, fontWeight: 600, letterSpacing: '.05em' }}>Insight<span style={{ color: D.red }}>TT</span></div>
              <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 8, letterSpacing: '.12em', color: D.mut, textTransform: 'uppercase' }}>Court Judgments</div>
            </div>
            <button onClick={onClose} aria-label="Close" style={{ background: 'rgba(255,255,255,.1)', border: 'none', color: '#fff', width: 30, height: 30, borderRadius: '50%', fontSize: 18, cursor: 'pointer', lineHeight: 1 }}>×</button>
          </div>

          {/* citation ribbon */}
          <div style={{ display: 'inline-block', marginTop: 16, background: D.red, color: '#fff', fontFamily: 'JetBrains Mono, monospace', fontSize: 9, fontWeight: 600, letterSpacing: '.06em', padding: '5px 10px', borderRadius: 4, position: 'relative' }}>
            {(n.citation || `${t.label} · No. ${n.notice_no}`).toUpperCase()}
          </div>

          <h2 style={{ position: 'relative', marginTop: 14, fontSize: 27, lineHeight: 1.08, fontWeight: 800, letterSpacing: '-.01em', textTransform: 'uppercase' }}>
            <Headline text={n.social_headline || n.title} name={n.person_name} />
          </h2>
          <p style={{ position: 'relative', marginTop: 12, fontSize: 13, lineHeight: 1.55, color: D.mut, maxWidth: 360 }}>
            {firstSentences(n.social_post || n.summary, 220)}
          </p>
          <div style={{ marginTop: 12, display: 'flex', gap: 16, alignItems: 'center' }}>
            <button onClick={copyPost} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', color: D.mut, fontFamily: 'JetBrains Mono, monospace', fontSize: 10, letterSpacing: '.06em', textTransform: 'uppercase', cursor: 'pointer', padding: 0 }}>
              <MIcon name="bookmark" color={D.mut} size={15} /> Copy post
            </button>
            {onShare && (
              <button onClick={onShare} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', color: D.red, fontFamily: 'JetBrains Mono, monospace', fontSize: 10, letterSpacing: '.06em', textTransform: 'uppercase', cursor: 'pointer', padding: 0 }}>
              <MIcon name="public" color={D.red} size={15} /> Share card ↗
            </button>
            )}
          </div>
        </div>

        <div style={{ padding: '4px 14px 14px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          {/* PERSON CARD */}
          {isPerson && (
            <div style={{ ...card, display: 'flex', alignItems: 'center', gap: 13 }}>
              <div style={{ flex: '0 0 52px', width: 52, height: 52, borderRadius: '50%', background: D.red, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'DM Serif Display, Georgia, serif', fontSize: 21 }}>{initials(n.person_name)}</div>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontSize: 17, fontWeight: 800, lineHeight: 1.1 }}>{n.person_name}</div>
                {aliases.length ? <div style={{ fontSize: 12.5, color: D.red, marginTop: 2 }}>aka “{aliases.join('”, “')}”</div> : null}
                {(role || gang) ? <div style={{ fontSize: 12.5, color: D.mut, marginTop: 2 }}>{[role, gang].filter(Boolean).join(' · ')} (alleged)</div> : null}
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8, paddingTop: 8, borderTop: `1px solid ${D.line}`, fontSize: 12, color: D.text }}>
                  <MIcon name="lock" color={D.red} size={16} /> Detained under the {n.act || 'Emergency Powers Regulations, 2026'}
                </div>
              </div>
            </div>
          )}

          {/* GROUND CARDS */}
          {grounds.map((g, i) => {
            no = i + 1;
            return (
              <div key={i} style={card}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 9 }}>
                  {numBadge(no)}
                  {iconChip(g.icon || 'shield')}
                  <span style={{ fontSize: 14.5, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.02em', color: D.text }}>{g.label}</span>
                </div>
                {g.ev ? <div style={{ fontSize: 12.5, lineHeight: 1.5, color: D.mut }}>{g.ev}</div> : null}
                {g.insight ? (
                  <div style={{ display: 'flex', gap: 8, marginTop: 11, background: 'rgba(226,61,46,.1)', border: `1px solid ${D.redDim}55`, borderRadius: 9, padding: '8px 10px' }}>
                    <MIcon name="lightbulb" color={D.red} size={16} />
                    <span style={{ fontSize: 11.5, lineHeight: 1.4, color: D.text }}><b style={{ color: D.red }}>Key insight:</b> {g.insight}</span>
                  </div>
                ) : null}
              </div>
            );
          })}

          {/* LEGAL BASIS */}
          <div style={card}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 9 }}>
              {numBadge(no + 1)}{iconChip('balance')}
              <span style={{ fontSize: 14.5, fontWeight: 800, textTransform: 'uppercase', color: D.text }}>Legal basis</span>
            </div>
            <div style={{ fontSize: 12.5, lineHeight: 1.5, color: D.mut }}>
              Detention is granted under the <b style={{ color: D.text }}>{n.act || 'Emergency Powers Regulations, 2026'}</b>
              {n.official ? `, ordered by ${n.official}${n.official_role ? `, ${n.official_role}` : ''}.` : '.'}
            </div>
            <div style={{ marginTop: 9, fontSize: 11.5, color: D.text }}><b style={{ color: D.red }}>Purpose:</b> prevent further criminal activity and protect the public.</div>
          </div>

          {/* THE BIG PICTURE */}
          <div style={card}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 11 }}>
              {numBadge(no + 2)}{iconChip('public')}
              <span style={{ fontSize: 14.5, fontWeight: 800, textTransform: 'uppercase', color: D.text }}>The big picture</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
              {BIGPIC.map(([ic, txt], i) => (
                <div key={i} style={{ display: 'flex', gap: 9, alignItems: 'flex-start' }}>
                  <MIcon name={ic} color={D.red} size={17} />
                  <span style={{ fontSize: 12, lineHeight: 1.45, color: D.mut }}>{txt}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* FOOTER */}
        <div style={{ borderTop: `1px solid ${D.line}`, padding: '14px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
          <div>
            <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: '.03em' }}>STAY INFORMED. STAY SAFE.</div>
            <div style={{ fontSize: 10, color: D.mut, marginTop: 2 }}>Real judgments. Real impact.</div>
          </div>
          <div style={{ textAlign: 'right', fontSize: 9.5, color: D.mut, fontFamily: 'JetBrains Mono, monospace', maxWidth: 180 }}>
            Follow <span style={{ color: D.red }}>@InsightTT</span> for court updates
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

  // Generate the editorial card image and share it (native sheet) or download it.
  const share = async (n) => {
    try {
      toast('Building card…');
      const blob = await fetchNoticeCard(n.slug);
      const file = new File([blob], `insighttt-notice-${n.notice_no}.png`, { type: 'image/png' });
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], title: 'InsightTT', text: n.social_headline || n.title });
      } else {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = file.name; document.body.appendChild(a); a.click();
        a.remove(); URL.revokeObjectURL(url);
        toast('Card downloaded');
      }
    } catch (e) {
      if (e.message === 'UNAUTHORIZED') throw e;
      copyText(`${n.social_headline || n.title} — InsightTT`);
      toast('Shared text (image unavailable)');
    }
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
            <article key={n.id} className="case-card" style={{ cursor: 'pointer' }} onClick={() => setSelected(n)}
              role="button" tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter') setSelected(n); }}>
              <div className="rail" style={{ background: t.accent }} />
              <div className="card-illustration"><NoticeArt no={n.notice_no} accent={t.accent} tint={t.tint} /></div>
              <div className="card-body">
                <div className="badge-row">
                  <span className="badge" style={{ background: t.tint, color: t.accent, border: `1px solid ${t.accent}40` }}>{t.label}</span>
                  <span className="badge" style={{ background: 'var(--bg)', color: 'var(--muted)', border: '1px solid var(--border)' }}>{t.tag}</span>
                </div>
                <div className="card-headline">{n.social_headline || n.title}</div>
                {excerpt && <div className="card-excerpt">{excerpt}</div>}
                <div style={{ fontSize: 11.5, color: 'var(--muted)', marginTop: 6 }}>Tap for the full breakdown →</div>
              </div>
              <div className="card-footer">
                <span className="card-date">{n.citation}</span>
                <button className="share-btn" onClick={(e) => { e.stopPropagation(); share(n); }}>Share · @insighttt</button>
              </div>
            </article>
          );
        })}
      </div>

      {selected && <NoticeDetail n={selected} onClose={() => setSelected(null)} onShare={() => share(selected)} />}
    </div>
  );
}
