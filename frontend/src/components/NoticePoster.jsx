// Single-source-of-truth notice poster, designed at a fixed 1080×1350.
// Rendered scaled-down inside the in-app modal and screenshotted full-size
// (html-to-image in the browser; Playwright in the batch script).
import { MI } from './materialIcons';
import { allegationsFrom, gangRole, initials, firstSentences } from './noticeUtils';
import heroImg from '../assets/hero.png';
import murderIcon from '../assets/icons/murder.png';
import contractIcon from '../assets/icons/contract.png';
import reprisalIcon from '../assets/icons/reprisal.png';
import drugsIcon from '../assets/icons/drugs.png';
import carIcon from '../assets/icons/car.png';
import extortionIcon from '../assets/icons/extortion.png';
import robberyIcon from '../assets/icons/robbery.png';
import woundingIcon from '../assets/icons/wounding.png';

export const POSTER_W = 1080, POSTER_H = 1350;
const L = { paper: '#efe7db', card: '#fff', line: '#e3ddd0', ink: '#211c16', sub: '#6f665b', amber: '#b8763a', navy: '#22323f', tint: '#f4ece0', footer: '#16100e', fInk: '#efe7db', fSub: '#9a9088' };

// raster icons from the supplied set (8 grounds)
const ICON_IMG = {
  'Murder / homicide': murderIcon, 'Contract killings': contractIcon, 'Reprisal attacks': reprisalIcon,
  'Drug trafficking': drugsIcon, 'Vehicle theft': carIcon, 'Extortion': extortionIcon,
  'Robbery': robberyIcon, 'Wounding': woundingIcon,
};
// SVG illustrations for the grounds NOT in the supplied set
const ART_KEY = { 'Firearms': 'pistol', 'Kidnapping': 'kidnap', 'Gang / OCG activity': 'gang' };
function Illus({ kind, size }) {
  const N = L.navy, O = L.amber;
  const inner = {
    pistol: <><path fill={N} d="M5 40 h67 q3 0 3 3 v8 q0 2 -2 2 h-9 v-4 h-4 v4 h-9 q-1 5 -6 7 l-5 23 q-1 3 -4 3 h-8 q-4 0 -3 -4 l5 -22 h-2 q-13 0 -13 -12 v-6 q0 -4 4 -5z" /><rect x="1" y="40" width="5" height="6" rx="1" fill={N} /><g stroke={O} strokeWidth="2" strokeLinecap="round"><path d="M3 40 l-3 -4" /><path d="M2 47 h-4" /><path d="M3 54 l-3 4" /></g></>,
    kidnap: <><circle cx="50" cy="22" r="13" fill={N} /><path fill={N} d="M30 80 q0 -34 20 -34 q20 0 20 34 z" /><g stroke={O} strokeWidth="4" fill="none"><path d="M32 58 h36" /><path d="M30 69 h40" /></g><circle cx="50" cy="63" r="4" fill={O} /></>,
    gang: <>{[[28, 0.9, N], [72, 0.9, N], [50, 1.05, O]].map(([x, sc, c], i) => <g key={i} transform={`translate(${x},0) scale(${sc})`}><circle cx="0" cy="22" r="11" fill={c} /><path fill={c} d="M-17 80 q0 -28 17 -28 q17 0 17 28 z" /></g>)}</>,
    justice: <><circle cx="50" cy="15" r="9" fill={O} /><path fill={O} d="M40 90 q-2 -54 10 -54 q12 0 10 54 z" /><rect x="48" y="20" width="4" height="44" fill={O} /><rect x="20" y="30" width="60" height="3.5" rx="1.5" fill={O} /><rect x="26" y="22" width="4" height="9" fill={O} /><rect x="70" y="22" width="4" height="9" fill={O} /><g stroke={O} strokeWidth="2" fill="none"><path d="M28 33 l-7 13 h14 z" /><path d="M72 33 l-7 13 h14 z" /></g><path fill={O} d="M14 46 a7 5 0 0 0 14 0 z" /><path fill={O} d="M58 46 a7 5 0 0 0 14 0 z" /></>,
  }[kind];
  return <svg viewBox="0 0 100 100" width={size} height={size} style={{ display: 'block' }}>{inner}</svg>;
}
function MIcon({ name, color, size }) {
  return <svg viewBox="0 -960 960 960" width={size} height={size} fill={color} dangerouslySetInnerHTML={{ __html: MI[name] || MI.shield }} />;
}

// Headline with the subject's name highlighted in amber
function Headline({ text, name }) {
  if (name && text && text.toLowerCase().includes(name.toLowerCase())) {
    const i = text.toLowerCase().indexOf(name.toLowerCase());
    return <>{text.slice(0, i)}<span style={{ color: L.amber }}>{text.slice(i, i + name.length)}</span>{text.slice(i + name.length)}</>;
  }
  return <>{text}</>;
}

export default function NoticePoster({ n }) {
  if (!n) return null;
  const isPerson = !!n.person_name;
  const { gang, role } = gangRole(n.summary);
  const grounds = (isPerson ? allegationsFrom(n.summary, n.person_name) : []).slice(0, 3);
  const intro = firstSentences(n.social_post || n.summary, 175);
  const inFull = firstSentences(n.summary || n.social_post, 620);
  const act = (n.act || 'Anti-Gang Act, 2021').replace(/^The\s+/i, '');

  // keep the headline punchy: drop a verbose trailing "— clause" when long
  let headline = n.social_headline || n.title || '';
  if (headline.split(/\s+/).filter(Boolean).length > 12) {
    const parts = headline.split(/\s[—–-]\s/);
    if (parts.length > 1) {
      const nameTok = (n.person_name || '').toLowerCase().split(/\s+/).map(w => w.replace(/[^a-z]/g, '')).filter(t => t.length > 2);
      headline = parts.find(p => p.toLowerCase().split(/\s+/).some(w => nameTok.includes(w.replace(/[^a-z]/g, '')))) || parts[0];
    }
  }

  return (
    <div style={{ position: 'relative', width: POSTER_W, height: POSTER_H, background: L.paper, color: L.ink, overflow: 'hidden', fontFamily: 'Inter, Arial, sans-serif' }}>
      <svg width="0" height="0" style={{ position: 'absolute' }}><filter id="posterGold" colorInterpolationFilters="sRGB"><feColorMatrix type="matrix" values="1.05 0.35 0 0 0.03  0.78 0.32 0 0 0.02  0.22 0.05 0 0 0  0 0 0 1 0" /></filter></svg>

      {/* HERO */}
      <div style={{ position: 'relative', height: 470, padding: 56 }}>
        {isPerson && <div style={{ position: 'absolute', top: 0, right: 0, bottom: 0, width: '46%', backgroundImage: `url(${heroImg})`, backgroundSize: 'cover', backgroundPosition: 'center 20%', filter: 'url(#posterGold)' }} />}
        <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(90deg, ${L.paper} 40%, rgba(239,231,219,0.45) 62%, rgba(239,231,219,0) 82%), linear-gradient(0deg, ${L.paper} 1%, rgba(239,231,219,0) 24%)` }} />

        <div style={{ position: 'relative', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontFamily: 'DM Serif Display, Georgia, serif', fontSize: 40, lineHeight: 1 }}>Insight<span style={{ color: L.amber }}>TT</span></div>
            <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 14, letterSpacing: '.18em', color: L.amber, textTransform: 'uppercase', marginTop: 5 }}>Court Judgments</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: L.card, border: `1px solid ${L.line}`, borderRadius: 20, padding: '8px 16px' }}>
            <MIcon name="gavel" color={L.amber} size={18} />
            <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 13, fontWeight: 600 }}>{(n.ntype || 'legal notice').replace(/_/g, ' ').toUpperCase()}</span>
          </div>
        </div>

        <div style={{ position: 'relative', display: 'inline-block', marginTop: 22, background: L.amber, color: '#fff', fontFamily: 'JetBrains Mono, monospace', fontSize: 14, fontWeight: 600, letterSpacing: '.05em', padding: '7px 14px', borderRadius: 4 }}>
          {(n.citation || `${(n.ntype || 'legal notice').replace(/_/g, ' ')} · No. ${n.notice_no}`).toUpperCase()}
        </div>

        <h1 style={{ position: 'relative', margin: '22px 0 0', fontFamily: 'DM Serif Display, Georgia, serif', fontWeight: 400, fontSize: 56, lineHeight: 1.12, maxWidth: 500 }}>
          <Headline text={headline} name={n.person_name} />
        </h1>
        <div style={{ width: 90, height: 6, borderRadius: 3, background: L.amber, margin: '20px 0 0' }} />
        <p style={{ position: 'relative', margin: '18px 0 0', fontSize: 23, lineHeight: 1.5, color: L.sub, maxWidth: 500 }}>{intro}</p>

        {isPerson && (
          <div style={{ position: 'absolute', right: 56, bottom: -38, width: 440, background: L.card, border: `1px solid ${L.line}`, borderRadius: 18, padding: 22, display: 'flex', alignItems: 'center', gap: 18, boxShadow: '0 12px 30px rgba(0,0,0,.08)' }}>
            <div style={{ flex: '0 0 76px', width: 76, height: 76, borderRadius: '50%', background: L.navy, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 28 }}>{initials(n.person_name)}</div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ fontSize: 24, fontWeight: 800, lineHeight: 1.05, textTransform: 'uppercase' }}>{n.person_name}</div>
              <div style={{ fontSize: 17, color: L.sub, marginTop: 4 }}>{(role || gang) ? `${[role, gang].filter(Boolean).join(' • ')} (alleged)` : 'Named in detention order'}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12, paddingTop: 12, borderTop: `1px solid ${L.line}`, fontSize: 16 }}>
                <MIcon name="lock" color={L.amber} size={20} /> Detained under the {act}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* BODY */}
      <div style={{ padding: '90px 56px 0' }}>
        {grounds.length > 0 && (
          <div style={{ display: 'flex', justifyContent: grounds.length < 3 ? 'space-evenly' : 'space-between' }}>
            {grounds.map((g, i) => (
              <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 300 }}>
                <div style={{ position: 'relative', width: 200, height: 200, borderRadius: '50%', background: L.tint, border: `1px solid ${L.line}`, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                  {ICON_IMG[g.label]
                    ? <img src={ICON_IMG[g.label]} alt="" width={200} height={200} style={{ objectFit: 'cover' }} />
                    : (ART_KEY[g.label] ? <Illus kind={ART_KEY[g.label]} size={132} /> : <MIcon name={g.icon || 'shield'} color={L.amber} size={96} />)}
                  <span style={{ position: 'absolute', top: 12, left: 12, width: 44, height: 44, borderRadius: '50%', background: L.amber, color: '#fff', fontFamily: 'JetBrains Mono, monospace', fontSize: 18, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{String(i + 1).padStart(2, '0')}</span>
                </div>
                <div style={{ marginTop: 18, fontSize: 22, fontWeight: 800, textTransform: 'uppercase', textAlign: 'center', lineHeight: 1.15 }}>{g.label}</div>
              </div>
            ))}
          </div>
        )}

        <div style={{ marginTop: 56 }}>
          <div style={{ display: 'inline-block', background: L.amber, color: '#fff', fontFamily: 'JetBrains Mono, monospace', fontSize: 18, fontWeight: 600, letterSpacing: '.1em', padding: '8px 18px', borderRadius: 5 }}>IN FULL</div>
          <div style={{ display: 'flex', gap: 24, marginTop: 22, alignItems: 'flex-start' }}>
            <p style={{ flex: 1, fontSize: 23, lineHeight: 1.62, margin: 0 }}>{inFull}</p>
            <div style={{ flex: '0 0 210px', opacity: 0.92 }}><Illus kind="justice" size={210} /></div>
          </div>
        </div>
      </div>

      {/* FOOTER */}
      <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, background: L.footer, color: L.fInk, padding: '26px 56px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <span style={{ width: 50, height: 50, borderRadius: '50%', background: L.amber, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><MIcon name="balance" color={L.footer} size={28} /></span>
          <div style={{ fontFamily: 'JetBrains Mono, monospace' }}>
            <div style={{ fontSize: 20, fontWeight: 600 }}>STAY INFORMED. STAY SAFE.</div>
            <div style={{ fontSize: 15, color: L.fSub, marginTop: 3 }}>Real Judgments. Real Impact.</div>
          </div>
        </div>
        <div style={{ textAlign: 'right', fontFamily: 'JetBrains Mono, monospace', fontSize: 15, color: L.fSub, maxWidth: 280 }}>
          Follow <span style={{ color: L.amber }}>@InsightTT</span> for more<br />court updates and legal insights.
        </div>
      </div>
    </div>
  );
}
