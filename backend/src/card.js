// Server-side renderer for InsightTT notice cards (1080×1350 PNG).
// Powers both the in-app "Share image" endpoint and Drive batch generation.
const fs = require('fs');
const path = require('path');
const { Resvg } = require('@resvg/resvg-js');
const { MI } = require('./materialIcons');

const ASSETS = path.join(__dirname, '..', 'assets');
const HERO_B64 = fs.readFileSync(path.join(ASSETS, 'hero.png')).toString('base64');
const FONT_FILES = [
  'inter-latin-400-normal.ttf', 'inter-latin-600-normal.ttf', 'inter-latin-700-normal.ttf',
  'inter-latin-800-normal.ttf', 'jetbrains-mono-latin-500-normal.ttf', 'jetbrains-mono-latin-600-normal.ttf',
].map(f => path.join(ASSETS, 'fonts', f));

const C = { bg: '#15110e', panel: '#211b16', line: '#3a3029', ink: '#efe7db', mut: '#a2978c', red: '#cf3a2b' };
const SAN = 'Inter, Arial, sans-serif', MON = 'JetBrains Mono, monospace';
const esc = s => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;');
const T = (x, y, s, { size = 16, f = SAN, fill = C.ink, w, anc = 'start', ls } = {}) =>
  `<text x="${x}" y="${y}" font-family="${f}" font-size="${size}" fill="${fill}" ${w ? `font-weight="${w}"` : ''} text-anchor="${anc}" ${ls ? `letter-spacing="${ls}"` : ''}>${esc(s)}</text>`;
const ico = (n, x, y, size, color, op = 1) => `<svg x="${x}" y="${y}" width="${size}" height="${size}" viewBox="0 -960 960 960" fill="${color}" opacity="${op}">${MI[n] || MI.shield || ''}</svg>`;
const gun = (x, y, sz, color) => `<g transform="translate(${x},${y}) scale(${sz / 24})" fill="${color}"><rect x="2.5" y="8" width="12.5" height="3.4" rx="0.6"/><path d="M10.6 11.4h4.1l-1.5 5.1a1 1 0 0 1-.96.7h-1.2a1 1 0 0 1-.95-1.3z"/><path fill="none" stroke="${color}" stroke-width="1.5" d="M9.5 11.7a2.3 2.3 0 0 0 1.8 2.6"/></g>`;
const cuffs = (x, y, sz, color) => `<g transform="translate(${x},${y}) scale(${sz / 24})" fill="none" stroke="${color}" stroke-width="2"><circle cx="6.5" cy="15" r="4.3"/><circle cx="17.5" cy="15" r="4.3"/><path d="M10.6 12.3a3 3 0 0 1 2.8 0"/></g>`;

const ALLEGATIONS = [
  [/contract killing/i, 'Contract killings'], [/reprisal/i, 'Reprisal attacks'],
  [/double homicide|homicide|\bmurder|to kill|assassinat/i, 'Murder / homicide'],
  [/firearm|illegal gun|ammunition|high-powered|rounds of/i, 'Firearms'],
  [/cocaine|marijuana|narcotic|\bdrug|trafficking/i, 'Drug trafficking'],
  [/motor vehicle|larceny ring|car[- ]theft|vehicle theft/i, 'Vehicle theft'],
  [/extortion|demanding money|menaces/i, 'Extortion'], [/robbery/i, 'Robbery'],
  [/kidnap/i, 'Kidnapping'], [/wounding|grievous/i, 'Wounding'],
  [/gang|organised crim|organized crim|\bocg\b|\bicg\b/i, 'Gang / OCG'],
];
const GROUND = {
  'Contract killings': { icon: 'dangerous', short: ['Killings allegedly', 'carried out for hire.'], key: 'Murder-for-hire alleged.' },
  'Reprisal attacks': { icon: 'local_fire_department', short: ['Tit-for-tat violence', 'between rival groups.'], key: 'Cycle of retaliation.' },
  'Murder / homicide': { icon: 'skull', short: ['Alleged involvement', 'in killings.'], key: 'Most serious allegation.' },
  'Firearms': { icon: 'crisis_alert', short: ['Alleged firearm and', 'ammunition access.'], key: 'Raises public-safety risk.' },
  'Drug trafficking': { icon: 'medication', short: ['Narcotics trade ties.'], key: 'Funds organised crime.' },
  'Vehicle theft': { icon: 'directions_car', short: ['Stolen-vehicle ring.'], key: 'Larceny network.' },
  'Extortion': { icon: 'paid', short: ['Demanding money', 'with menaces.'], key: 'Community intimidation.' },
  'Robbery': { icon: 'shopping_bag', short: ['Armed robbery alleged.'], key: 'A core allegation.' },
  'Kidnapping': { icon: 'person_off', short: ['Tied to kidnapping', 'for ransom.'], key: 'A core allegation.' },
  'Wounding': { icon: 'personal_injury', short: ['Violent assault', 'causing injury.'], key: 'Public-safety threat.' },
  'Gang / OCG': { icon: 'groups', short: ['Named an active', 'member of an OCG.'], key: 'Networks amplify harm.' },
};
function allegationsFrom(text, name) {
  text = text || '';
  if (name) text = text.split(String(name).toUpperCase()).join(name);
  const out = [], seen = new Set();
  for (const [re, label] of ALLEGATIONS) {
    if (!re.test(text) || seen.has(label)) continue;
    seen.add(label);
    out.push({ label, ...GROUND[label] });
  }
  return out.slice(0, 3);
}
function gangRole(text) {
  text = text || '';
  let gang = '';
  const gm = text.match(/[“"]([^”"]*?(?:Gang|OCG))[”"]/) || text.match(/\b([A-Z][\w'.]+\s+Gang)\b/);
  if (gm) gang = gm[1];
  const l = text.toLowerCase();
  let role = /high-ranking|general\b/.test(l) ? 'Ranking member' : /leader|principal|head of/.test(l) ? 'Leader'
    : /shooter|gunman|enforcer|hitman/.test(l) ? 'Shooter / enforcer' : /\bmember\b/.test(l) ? 'Member' : '';
  return { gang, role };
}
const initials = name => (name || '?').split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase();

function buildSvg(n) {
  const W = 1080, H = 1350, M = 60;
  const person = n.person_name || '';
  const grounds = person ? allegationsFrom(n.summary, person) : [];
  const { gang, role } = gangRole(n.summary);
  const headline = n.social_headline || n.title || '';
  const aliases = (n.alias || '').split(';').map(s => s.trim()).filter(Boolean);

  let s = `<rect width="${W}" height="${H}" fill="${C.bg}"/>`;
  s += `<defs>
    <linearGradient id="ts" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#000" stop-opacity="0.55"/><stop offset="1" stop-color="#000" stop-opacity="0"/></linearGradient>
    <linearGradient id="bf" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${C.bg}" stop-opacity="0"/><stop offset="1" stop-color="${C.bg}" stop-opacity="1"/></linearGradient></defs>`;

  const HERO = 500;
  s += `<image x="0" y="0" width="${W}" height="${HERO}" href="data:image/png;base64,${HERO_B64}" preserveAspectRatio="xMidYMin slice"/>`;
  s += `<rect x="0" y="0" width="${W}" height="120" fill="url(#ts)"/><rect x="0" y="${HERO - 130}" width="${W}" height="130" fill="url(#bf)"/>`;
  s += T(M, 64, 'Insight', { size: 25, f: MON, w: 600 }) + T(M + 82, 64, 'TT', { size: 25, f: MON, w: 600, fill: C.red });
  s += T(W - M, 60, 'INVESTIGATION', { size: 11, f: MON, fill: '#d8cfc6', anc: 'end', ls: '3' });
  const ribbon = (n.citation || `${(n.ntype || 'legal notice').replace(/_/g, ' ')} · No. ${n.notice_no}`).toUpperCase();
  s += `<rect x="${M}" y="86" width="320" height="22" rx="3" fill="${C.red}"/>` + T(M + 10, 101, ribbon.slice(0, 40), { size: 10, f: MON, fill: '#fff', w: 600 });

  // profile card
  const pcy = HERO - 36, pch = 82;
  if (person) {
    s += `<rect x="${M}" y="${pcy}" width="${W - 2 * M}" height="${pch}" rx="12" fill="${C.panel}" stroke="${C.line}"/>`;
    s += `<circle cx="${M + 48}" cy="${pcy + 41}" r="28" fill="${C.red}"/>` + T(M + 48, pcy + 49, initials(person), { size: 24, w: 800, fill: '#fff', anc: 'middle' });
    s += T(M + 92, pcy + 36, person.toUpperCase(), { size: 21, w: 800 });
    s += T(M + 92, pcy + 60, [role, gang].filter(Boolean).join(' • ') ? `${[role, gang].filter(Boolean).join(' • ')} (alleged)` : 'Named in detention order', { size: 14, fill: C.mut });
    s += cuffs(W - M - 196, pcy + 28, 24, C.red) + T(W - M - 164, pcy + 46, 'Detained — Anti-Gang Act', { size: 12.5, f: MON, fill: C.ink });
  }

  // headline
  let y = (person ? pcy + pch : HERO) + 52;
  s += T(M, y, (n.ntype === 'detention_order' ? 'DETENTION ORDER' : (n.ntype || 'legal notice').replace(/_/g, ' ').toUpperCase()), { size: 12, f: MON, fill: C.red, ls: '3' });
  y += 38;
  // headline: up to 3 lines, name highlighted red if present
  const words = headline.split(' ');
  const lines = []; let cur = '';
  for (const w of words) { if ((cur + ' ' + w).trim().length > 30) { lines.push(cur.trim()); cur = w; } else cur = (cur + ' ' + w).trim(); }
  if (cur) lines.push(cur.trim());
  lines.slice(0, 3).forEach((ln, i) => {
    const isName = person && ln.toLowerCase().includes(person.split(' ')[0].toLowerCase());
    s += T(M, y + i * 40, ln, { size: 33, w: 800, fill: isName ? C.red : C.ink });
  });
  y += Math.min(lines.length, 3) * 40 + 6;
  // summary
  const sum = (n.summary || n.social_post || '').replace(/\s+/g, ' ').trim();
  const sw = sum.split(' '); const sl = []; let sc = '';
  for (const w of sw) { if ((sc + ' ' + w).trim().length > 64) { sl.push(sc.trim()); sc = w; } else sc = (sc + ' ' + w).trim(); }
  if (sc) sl.push(sc.trim());
  sl.slice(0, 2).forEach((ln, i) => s += T(M, y + i * 24, ln, { size: 15.5, fill: C.mut }));
  y += Math.min(sl.length, 2) * 24 + 18;

  const chip = (cx, cy, r = 22) => `<circle cx="${cx}" cy="${cy}" r="${r}" fill="rgba(207,58,43,0.15)"/>`;
  const box = (x, w, h) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="12" fill="${C.panel}" stroke="${C.line}"/>`;
  const gap = 16;

  // 3-up grounds row
  if (grounds.length) {
    const col = (W - 2 * M - 2 * gap) / 3, rh = 196;
    grounds.forEach((g, idx) => {
      const x = M + idx * (col + gap);
      s += box(x, col, rh);
      const cx = x + 28, cy = y + 36;
      const draw = g.icon === 'gun' || g.label === 'Firearms' ? gun(cx - 12, cy - 11, 24, C.red) : ico(g.icon || 'shield', cx - 12, cy - 12, 24, C.red);
      s += chip(cx, cy) + draw;
      s += T(x + 22, y + 70, '0' + (idx + 1), { size: 12, f: MON, fill: C.red, w: 700 });
      s += T(x + 22, y + 92, g.label.toUpperCase(), { size: 15, w: 800 });
      (g.short || []).forEach((ln, i) => s += T(x + 22, y + 114 + i * 18, ln, { size: 12.5, fill: C.mut }));
      const ky = y + rh - 30;
      s += `<rect x="${x + 12}" y="${ky - 14}" width="${col - 24}" height="40" rx="8" fill="rgba(207,58,43,0.10)" stroke="${C.red}" stroke-opacity="0.35"/>`;
      s += ico('lightbulb', x + 20, ky - 8, 14, C.red) + T(x + 40, ky + 3, 'KEY INSIGHT', { size: 8.5, f: MON, fill: C.red, ls: '1', w: 700 });
      s += T(x + 20, ky + 19, g.key, { size: 11, fill: C.ink });
    });
    y += rh + gap;
  }

  // 2-up row: legal basis + big picture
  const col2 = (W - 2 * M - gap) / 2, rh2 = 196;
  s += box(M, col2, rh2);
  {
    const cx = M + 28, cy = y + 36; s += chip(cx, cy) + ico('balance', cx - 12, cy - 12, 24, C.red);
    s += T(M + 22, y + 70, '04', { size: 12, f: MON, fill: C.red, w: 700 }) + T(M + 22, y + 92, 'LEGAL BASIS', { size: 16, w: 800 });
    const act = n.act || 'Anti-Gang Act, 2021';
    s += T(M + 22, y + 114, 'Detention granted under', { size: 12.5, fill: C.mut }) + T(M + 22, y + 132, ('the ' + act).slice(0, 30) + '.', { size: 12.5, fill: C.mut });
    const ky = y + rh2 - 30;
    s += `<rect x="${M + 12}" y="${ky - 14}" width="${col2 - 24}" height="40" rx="8" fill="rgba(207,58,43,0.10)" stroke="${C.red}" stroke-opacity="0.35"/>`;
    s += ico('shield', M + 20, ky - 8, 14, C.red) + T(M + 40, ky + 3, 'PURPOSE', { size: 8.5, f: MON, fill: C.red, ls: '1', w: 700 });
    s += T(M + 20, ky + 19, 'Prevent further crime; protect the public.', { size: 11, fill: C.ink });
  }
  const bx = M + col2 + gap;
  s += box(bx, col2, rh2);
  {
    s += `<g fill="${C.ink}" opacity="0.06" transform="translate(${bx + col2 - 120},${y + 64})"><circle cx="48" cy="10" r="9"/><path d="M48 20 L70 96 H26 Z"/><rect x="46.5" y="20" width="3" height="50"/><rect x="16" y="36" width="64" height="3"/><path d="M16 39 l-7 13 h14 z"/><path d="M80 39 l-7 13 h14 z"/></g>`;
    const cx = bx + 28, cy = y + 36; s += chip(cx, cy) + ico('public', cx - 12, cy - 12, 24, C.red);
    s += T(bx + 22, y + 70, '05', { size: 12, f: MON, fill: C.red, w: 700 }) + T(bx + 22, y + 92, 'THE BIG PICTURE', { size: 16, w: 800 });
    [['gavel', 'Organised crime drives fear'], ['verified_user', 'Enforcement = safer streets'], ['balance', 'Courts holding OCGs to account']]
      .forEach(([icn, txt], i) => { const by = y + 116 + i * 24; s += ico(icn, bx + 20, by - 13, 15, C.red) + T(bx + 42, by, txt, { size: 12, fill: C.mut }); });
  }
  y += rh2;

  // footer
  const fy = H - 38;
  s += `<rect x="${M}" y="${fy - 20}" width="${W - 2 * M}" height="1.5" fill="${C.red}"/>`;
  s += T(M, fy + 2, 'InsightTT', { size: 14, f: MON, w: 600 }) + T(M + 74, fy + 2, '· Court Judgments', { size: 12, f: MON, fill: C.mut });
  s += T(W - M, fy + 2, 'STAY INFORMED. STAY SAFE.', { size: 11, f: MON, fill: C.red, anc: 'end', ls: '1' });

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">${s}</svg>`;
}

function renderNoticeCard(n) {
  const svg = buildSvg(n);
  const r = new Resvg(svg, { font: { loadSystemFonts: false, fontFiles: FONT_FILES, defaultFontFamily: 'Inter' } });
  return r.render().asPng();
}

module.exports = { renderNoticeCard, buildSvg };
