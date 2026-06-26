import { useState, useEffect } from 'react';
import { getNotices, fetchNoticeCard } from '../api/client';
import { copyText, toast } from './ui';
import { fmtDate } from './caseMeta';
import { MI } from './materialIcons';
import heroImg from '../assets/hero.png';

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

// ── Light editorial poster (detention detail) ──
const L = { paper: '#f0ece3', card: '#ffffff', line: '#e3ddd0', ink: '#211c16', sub: '#6f665b', amber: '#b8763a', disc: '#2b2620', tint: '#f4ece0', footer: '#16100e', fInk: '#f0ece3', fSub: '#9a9088' };

// duotone SVG illustrations (0..100 box), amber fill — match the share card
function Illus({ kind, color = L.amber, size = 80 }) {
  const inner = {
    pistol: <><path fill={color} d="M5 40 h67 q3 0 3 3 v8 q0 2 -2 2 h-9 v-4 h-4 v4 h-9 q-1 5 -6 7 l-5 23 q-1 3 -4 3 h-8 q-4 0 -3 -4 l5 -22 h-2 q-13 0 -13 -12 v-6 q0 -4 4 -5z" /><rect x="1" y="40" width="5" height="6" rx="1" fill={color} /></>,
    kidnap: <><circle cx="50" cy="22" r="13" fill={color} /><path fill={color} d="M30 80 q0 -34 20 -34 q20 0 20 34 z" /><g stroke={L.tint} strokeWidth="3" fill="none"><path d="M33 58 h34" /><path d="M31 68 h38" /></g><rect x="46" y="54" width="8" height="20" rx="2" fill={L.tint} /></>,
    gang: <>{[[28, 0.9], [72, 0.9], [50, 1.05]].map(([x, sc], i) => <g key={i} transform={`translate(${x},0) scale(${sc})`}><circle cx="0" cy="22" r="11" fill={color} /><path fill={color} d="M-17 80 q0 -28 17 -28 q17 0 17 28 z" /></g>)}</>,
    justice: <><circle cx="50" cy="15" r="9" fill={color} /><path fill={color} d="M40 90 q-2 -54 10 -54 q12 0 10 54 z" /><rect x="48" y="20" width="4" height="44" fill={color} /><rect x="20" y="30" width="60" height="3.5" rx="1.5" fill={color} /><rect x="26" y="22" width="4" height="9" fill={color} /><rect x="70" y="22" width="4" height="9" fill={color} /><g stroke={color} strokeWidth="2" fill="none"><path d="M28 33 l-7 13 h14 z" /><path d="M72 33 l-7 13 h14 z" /></g><path fill={color} d="M14 46 a7 5 0 0 0 14 0 z" /><path fill={color} d="M58 46 a7 5 0 0 0 14 0 z" /></>,
  }[kind];
  if (!inner) return null;
  return <svg viewBox="0 0 100 100" width={size} height={size} style={{ display: 'block' }}>{inner}</svg>;
}
const ART_KEY = { 'Firearms': 'pistol', 'Kidnapping': 'kidnap', 'Gang / OCG activity': 'gang' };

function Headline({ text, name }) {
  if (name && text && text.toLowerCase().includes(name.toLowerCase())) {
    const i = text.toLowerCase().indexOf(name.toLowerCase());
    return <>{text.slice(0, i)}<span style={{ color: L.amber }}>{text.slice(i, i + name.length)}</span>{text.slice(i + name.length)}</>;
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
  const grounds = (isPerson ? allegationsFrom(n.summary, n.person_name) : []).slice(0, 3);
  const intro = firstSentences(n.social_post || n.summary, 170);
  const inFull = firstSentences(n.summary || n.social_post, 520);
  const copyPost = () => copyText(`${n.social_headline ? n.social_headline + '\n\n' : ''}${n.social_post || n.summary || ''}`);

  return (
    <div onClick={onClose}
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.7)', zIndex: 1000, display: 'flex', justifyContent: 'center', alignItems: 'flex-start', overflow: 'auto', padding: '4vh 10px' }}>
      <svg width="0" height="0" style={{ position: 'absolute' }}><filter id="noticeGold" colorInterpolationFilters="sRGB"><feColorMatrix type="matrix" values="1.05 0.35 0 0 0.03  0.78 0.32 0 0 0.02  0.22 0.05 0 0 0  0 0 0 1 0" /></filter></svg>
      <div onClick={e => e.stopPropagation()} className="panel-in"
        style={{ width: '100%', maxWidth: 460, background: L.paper, color: L.ink, borderRadius: 18, overflow: 'hidden', boxShadow: '0 30px 70px rgba(0,0,0,.45)' }}>

        {/* HERO */}
        <div style={{ position: 'relative', padding: '20px 20px 22px', overflow: 'hidden', minHeight: 300, background: L.paper }}>
          {/* gold-toned figure photo, anchored right; fades into the cream headline zone */}
          {isPerson && (
            <div style={{ position: 'absolute', top: 0, right: 0, bottom: 0, width: '60%', pointerEvents: 'none',
              backgroundImage: `url(${heroImg})`, backgroundSize: 'cover', backgroundPosition: 'center 20%', filter: 'url(#noticeGold)' }} />
          )}
          <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none',
            background: `linear-gradient(90deg, ${L.paper} 36%, rgba(240,236,227,0.5) 58%, rgba(240,236,227,0) 80%), linear-gradient(0deg, ${L.paper} 1%, rgba(240,236,227,0) 26%)` }} />

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', position: 'relative' }}>
            <div>
              <div style={{ fontFamily: 'DM Serif Display, Georgia, serif', fontSize: 22, lineHeight: 1 }}>Insight<span style={{ color: L.amber }}>TT</span></div>
              <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 8, letterSpacing: '.14em', color: L.amber, textTransform: 'uppercase', marginTop: 3 }}>Court Judgments</div>
            </div>
            <button onClick={onClose} aria-label="Close" style={{ background: L.card, border: `1px solid ${L.line}`, color: L.ink, width: 30, height: 30, borderRadius: '50%', fontSize: 18, cursor: 'pointer', lineHeight: 1 }}>×</button>
          </div>

          {/* citation ribbon */}
          <div style={{ display: 'inline-block', marginTop: 14, background: L.amber, color: '#fff', fontFamily: 'JetBrains Mono, monospace', fontSize: 9, fontWeight: 600, letterSpacing: '.06em', padding: '5px 10px', borderRadius: 4, position: 'relative' }}>
            {(n.citation || `${t.label} · No. ${n.notice_no}`).toUpperCase()}
          </div>

          <h2 style={{ position: 'relative', marginTop: 14, fontFamily: 'DM Serif Display, Georgia, serif', fontSize: 30, lineHeight: 1.12, fontWeight: 400, maxWidth: isPerson ? 250 : undefined }}>
            <Headline text={n.social_headline || n.title} name={n.person_name} />
          </h2>
          <div style={{ width: 56, height: 4, borderRadius: 2, background: L.amber, marginTop: 12 }} />
          <p style={{ position: 'relative', marginTop: 12, fontSize: 13, lineHeight: 1.55, color: L.sub, maxWidth: isPerson ? 250 : 360 }}>
            {intro}
          </p>
          <div style={{ marginTop: 12, display: 'flex', gap: 16, alignItems: 'center' }}>
            <button onClick={copyPost} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', color: L.sub, fontFamily: 'JetBrains Mono, monospace', fontSize: 10, letterSpacing: '.06em', textTransform: 'uppercase', cursor: 'pointer', padding: 0 }}>
              <MIcon name="bookmark" color={L.sub} size={15} /> Copy post
            </button>
            {onShare && (
              <button onClick={onShare} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', color: L.amber, fontFamily: 'JetBrains Mono, monospace', fontSize: 10, letterSpacing: '.06em', textTransform: 'uppercase', cursor: 'pointer', padding: 0 }}>
              <MIcon name="public" color={L.amber} size={15} /> Share card ↗
            </button>
            )}
          </div>
        </div>

        <div style={{ padding: '0 18px 20px', display: 'flex', flexDirection: 'column', gap: 18 }}>
          {/* PROFILE CARD (white) */}
          {isPerson && (
            <div style={{ background: L.card, border: `1px solid ${L.line}`, borderRadius: 16, padding: 16, display: 'flex', alignItems: 'center', gap: 13, marginTop: 4 }}>
              <div style={{ flex: '0 0 52px', width: 52, height: 52, borderRadius: '50%', background: L.disc, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 18 }}>{initials(n.person_name)}</div>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontSize: 16, fontWeight: 800, lineHeight: 1.1, color: L.ink, textTransform: 'uppercase' }}>{n.person_name}</div>
                <div style={{ fontSize: 12.5, color: L.sub, marginTop: 3 }}>{(role || gang) ? `${[role, gang].filter(Boolean).join(' • ')} (alleged)` : 'Named in detention order'}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 9, paddingTop: 9, borderTop: `1px solid ${L.line}`, fontSize: 12, color: L.ink }}>
                  <MIcon name="lock" color={L.amber} size={16} /> Detained under the {(n.act || 'Anti-Gang Act, 2021').replace(/^The\s+/i, '')}
                </div>
              </div>
            </div>
          )}

          {/* GROUND CIRCLES */}
          {grounds.length > 0 && (
            <div style={{ display: 'flex', justifyContent: grounds.length < 3 ? 'space-evenly' : 'space-between', gap: 8 }}>
              {grounds.map((g, i) => (
                <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: '0 0 auto', width: 124 }}>
                  <div style={{ position: 'relative', width: 116, height: 116, borderRadius: '50%', background: L.tint, border: `1px solid ${L.line}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {ART_KEY[g.label] ? <Illus kind={ART_KEY[g.label]} size={78} /> : <MIcon name={g.icon || 'shield'} color={L.amber} size={56} />}
                    <span style={{ position: 'absolute', top: 6, left: 6, width: 26, height: 26, borderRadius: '50%', background: L.amber, color: '#fff', fontFamily: 'JetBrains Mono, monospace', fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{String(i + 1).padStart(2, '0')}</span>
                  </div>
                  <div style={{ marginTop: 10, fontSize: 12, fontWeight: 800, textTransform: 'uppercase', textAlign: 'center', color: L.ink, lineHeight: 1.2 }}>{g.label}</div>
                </div>
              ))}
            </div>
          )}

          {/* IN FULL */}
          <div>
            <div style={{ display: 'inline-block', background: L.amber, color: '#fff', fontFamily: 'JetBrains Mono, monospace', fontSize: 11, fontWeight: 600, letterSpacing: '.08em', padding: '5px 12px', borderRadius: 4 }}>IN FULL</div>
            <div style={{ display: 'flex', gap: 10, marginTop: 12, alignItems: 'flex-start' }}>
              <p style={{ flex: 1, fontSize: 13, lineHeight: 1.6, color: L.ink, margin: 0 }}>{inFull}</p>
              <div style={{ flex: '0 0 110px', opacity: 0.9 }}><Illus kind="justice" size={110} /></div>
            </div>
          </div>
        </div>

        {/* FOOTER */}
        <div style={{ background: L.footer, color: L.fInk, padding: '16px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ width: 30, height: 30, borderRadius: '50%', background: L.amber, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><MIcon name="balance" color={L.footer} size={18} /></span>
            <div>
              <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12, fontWeight: 600, letterSpacing: '.02em' }}>STAY INFORMED. STAY SAFE.</div>
              <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: L.fSub, marginTop: 2 }}>Real Judgments. Real Impact.</div>
            </div>
          </div>
          <div style={{ textAlign: 'right', fontFamily: 'JetBrains Mono, monospace', fontSize: 9.5, color: L.fSub, maxWidth: 150 }}>
            Follow <span style={{ color: L.amber }}>@InsightTT</span> for more court updates
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
