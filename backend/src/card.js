// Server-side renderer for InsightTT notice cards (1080×1350 PNG).
// Light editorial format: cream paper, serif headline, amber accent, duotone
// SVG illustrations. Powers the in-app "Share image" endpoint + Drive batch.
const fs = require('fs');
const path = require('path');
const { Resvg } = require('@resvg/resvg-js');
const { MI } = require('./materialIcons');

const ASSETS = path.join(__dirname, '..', 'assets');
const HERO_B64 = fs.readFileSync(path.join(ASSETS, 'hero.png')).toString('base64');
const FONT_FILES = [
  'inter-latin-400-normal.ttf', 'inter-latin-600-normal.ttf', 'inter-latin-700-normal.ttf',
  'inter-latin-800-normal.ttf', 'jetbrains-mono-latin-500-normal.ttf', 'jetbrains-mono-latin-600-normal.ttf',
  'dm-serif-display-latin-400-normal.ttf',
].map(f => path.join(ASSETS, 'fonts', f));

const C = {
  paper: '#efe7db', card: '#ffffff', line: '#e3ddd0', ink: '#211c16', sub: '#6f665b',
  amber: '#b8763a', amberDeep: '#9a5f2b', tint: '#f4ece0', disc: '#2b2620',
  footer: '#16100e', fInk: '#efe7db', fSub: '#9a9088',
};
const SER = 'DM Serif Display, Georgia, serif', SAN = 'Inter, Arial, sans-serif', MON = 'JetBrains Mono, monospace';
const esc = s => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;');
const T = (x, y, s, { size = 16, f = SAN, fill = C.ink, w, anc = 'start', ls } = {}) =>
  `<text x="${x}" y="${y}" font-family="${f}" font-size="${size}" fill="${fill}" ${w ? `font-weight="${w}"` : ''} text-anchor="${anc}" ${ls ? `letter-spacing="${ls}"` : ''}>${esc(s)}</text>`;
const ico = (n, x, y, size, color, op = 1) => `<svg x="${x}" y="${y}" width="${size}" height="${size}" viewBox="0 -960 960 960" fill="${color}" opacity="${op}">${MI[n] || MI.shield || ''}</svg>`;
const cuffs = (x, y, sz, color) => `<g transform="translate(${x},${y}) scale(${sz / 24})" fill="none" stroke="${color}" stroke-width="2"><circle cx="6.5" cy="15" r="4.3"/><circle cx="17.5" cy="15" r="4.3"/><path d="M10.6 12.3a3 3 0 0 1 2.8 0"/></g>`;

// ── duotone illustrations (drawn in a 0..100 box, single amber fill) ──────────
const ART = {
  pistol: c => `<path fill="${c}" d="M5 40 h67 q3 0 3 3 v8 q0 2 -2 2 h-9 v-4 h-4 v4 h-9 q-1 5 -6 7 l-5 23 q-1 3 -4 3 h-8 q-4 0 -3 -4 l5 -22 h-2 q-13 0 -13 -12 v-6 q0 -4 4 -5z"/><rect x="1" y="40" width="5" height="6" rx="1" fill="${c}"/>`,
  kidnap: c => `<circle cx="50" cy="22" r="13" fill="${c}"/><path fill="${c}" d="M30 80 q0 -34 20 -34 q20 0 20 34 z"/><g stroke="${C.tint}" stroke-width="3" fill="none"><path d="M33 58 h34"/><path d="M31 68 h38"/></g><rect x="46" y="54" width="8" height="20" rx="2" fill="${C.tint}"/>`,
  gang: c => {
    const fig = (x, s) => `<g transform="translate(${x},0) scale(${s})"><circle cx="0" cy="22" r="11" fill="${c}"/><path fill="${c}" d="M-17 80 q0 -28 17 -28 q17 0 17 28 z"/></g>`;
    return fig(28, 0.9) + fig(72, 0.9) + fig(50, 1.05);
  },
  murder: c => `<path fill="${c}" d="M50 14 q-25 0 -25 27 q0 13 9 19 v7 q0 5 5 5 h3 v-7 h4 v7 h6 v-7 h4 v7 h3 q5 0 5 -5 v-7 q9 -6 9 -19 q0 -27 -25 -27z"/><circle cx="40" cy="42" r="6.5" fill="${C.tint}"/><circle cx="60" cy="42" r="6.5" fill="${C.tint}"/><path d="M50 50 l-4 9 h8z" fill="${C.tint}"/>`,
  contract: c => `<circle cx="50" cy="50" r="30" fill="none" stroke="${c}" stroke-width="6"/><g stroke="${c}" stroke-width="6" stroke-linecap="round"><path d="M50 8 v16"/><path d="M50 76 v16"/><path d="M8 50 h16"/><path d="M76 50 h16"/></g><circle cx="50" cy="50" r="6" fill="${c}"/>`,
  reprisal: c => `<path fill="${c}" d="M53 10 q3 17 14 27 q11 12 6 29 q-5 16 -23 17 q-20 -1 -23 -22 q-1 -13 10 -22 q-2 11 6 13 q-7 -17 10 -42z"/><path fill="${C.tint}" d="M50 55 q7 4 7 13 q0 8 -7 10 q-7 -2 -7 -10 q0 -7 7 -13z"/>`,
  drugs: c => `<path fill="${c}" d="M38 28 h24 l-5 9 h-14z"/><rect x="34" y="34" width="32" height="44" rx="7" fill="${c}"/><g fill="${C.tint}"><circle cx="45" cy="48" r="3.2"/><circle cx="56" cy="53" r="3.2"/><circle cx="47" cy="61" r="3.2"/><circle cx="57" cy="66" r="3.2"/></g>`,
  car: c => `<path fill="${c}" d="M8 60 l9 -16 q2 -4 7 -4 h28 q4 0 7 3 l11 13 9 2 q4 1 4 5 v5 h-84z"/><path fill="${C.tint}" d="M30 44 l4 -7 h16 l6 7z"/><circle cx="30" cy="65" r="10" fill="${c}"/><circle cx="70" cy="65" r="10" fill="${c}"/><circle cx="30" cy="65" r="4.5" fill="${C.tint}"/><circle cx="70" cy="65" r="4.5" fill="${C.tint}"/>`,
  extortion: c => `<rect x="18" y="38" width="64" height="36" rx="4" fill="${c}"/><circle cx="50" cy="56" r="12" fill="${C.tint}"/><path d="M50 48 v16 M55 52 q-9 -3 -9 3 q0 4 9 4.5 q9 .5 9 5 q0 6 -9 3" stroke="${c}" stroke-width="2.6" fill="none" stroke-linecap="round"/><g fill="${C.tint}"><circle cx="26" cy="46" r="2.4"/><circle cx="74" cy="66" r="2.4"/></g>`,
  robbery: c => `<rect x="34" y="28" width="32" height="7" rx="3" fill="${c}"/><path fill="${c}" d="M37 35 h26 l-6 8 q15 9 15 25 q0 14 -22 14 q-22 0 -22 -14 q0 -16 15 -25z"/><path d="M50 52 v22 M55 57 q-8 -3 -8 2.5 q0 4 8 4.5 q8 .5 8 5 q0 5.5 -8 3" stroke="${C.tint}" stroke-width="3" fill="none" stroke-linecap="round"/>`,
  wounding: c => `<path fill="${c}" d="M22 74 l40 -40 q5 -5 9 -1 q4 4 -1 9 l-40 40z"/><path fill="${c}" d="M18 70 l8 8 -6 6 q-3 3 -6 0 l-2 -2 q-3 -3 0 -6z"/><path fill="${C.tint}" d="M30 66 l30 -30 q2 -2 3 -1 l-31 33z"/>`,
  justice: c => `<circle cx="50" cy="15" r="9" fill="${c}"/><path fill="${c}" d="M40 90 q-2 -54 10 -54 q12 0 10 54 z"/><rect x="48" y="20" width="4" height="44" fill="${c}"/><rect x="20" y="30" width="60" height="3.5" rx="1.5" fill="${c}"/><rect x="26" y="22" width="4" height="9" fill="${c}"/><rect x="70" y="22" width="4" height="9" fill="${c}"/><g stroke="${c}" stroke-width="2" fill="none"><path d="M28 33 l-7 13 h14 z"/><path d="M72 33 l-7 13 h14 z"/></g><path fill="${c}" d="M14 46 a7 5 0 0 0 14 0 z"/><path fill="${c}" d="M58 46 a7 5 0 0 0 14 0 z"/>`,
};
// ground label → illustration key (else fall back to a Material glyph)
const ART_KEY = {
  'Firearms': 'pistol', 'Kidnapping': 'kidnap', 'Gang / OCG': 'gang', 'Murder / homicide': 'murder',
  'Contract killings': 'contract', 'Reprisal attacks': 'reprisal', 'Drug trafficking': 'drugs',
  'Vehicle theft': 'car', 'Extortion': 'extortion', 'Robbery': 'robbery', 'Wounding': 'wounding',
};
const drawArt = (label, icon, x, y, size, color) => ART[ART_KEY[label]]
  ? `<svg x="${x}" y="${y}" width="${size}" height="${size}" viewBox="0 0 100 100">${ART[ART_KEY[label]](color)}</svg>`
  : ico(icon || 'shield', x + size * 0.12, y + size * 0.12, size * 0.76, color);

// ── allegation grounds ────────────────────────────────────────────────────────
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
  'Contract killings': 'dangerous', 'Reprisal attacks': 'local_fire_department', 'Murder / homicide': 'skull',
  'Firearms': 'crisis_alert', 'Drug trafficking': 'medication', 'Vehicle theft': 'directions_car',
  'Extortion': 'paid', 'Robbery': 'shopping_bag', 'Kidnapping': 'person_off', 'Wounding': 'personal_injury',
  'Gang / OCG': 'groups',
};
function allegationsFrom(text, name) {
  text = text || '';
  if (name) text = text.split(String(name).toUpperCase()).join(name);
  const out = [], seen = new Set();
  for (const [re, label] of ALLEGATIONS) {
    if (!re.test(text) || seen.has(label)) continue;
    seen.add(label);
    out.push({ label, icon: GROUND[label] });
  }
  return out.slice(0, 3);
}
function gangRole(text) {
  text = text || '';
  let gang = '';
  const gm = text.match(/[“"]([^”"]*?(?:Gang|OCG))[”"]/) || text.match(/\b([A-Z][\w'.]+\s+Gang)\b/);
  if (gm) gang = gm[1];
  const l = text.toLowerCase();
  const role = /high-ranking|general\b/.test(l) ? 'Ranking member' : /leader|principal|head of/.test(l) ? 'Leader'
    : /shooter|gunman|enforcer|hitman/.test(l) ? 'Shooter / enforcer' : /\bmember\b/.test(l) ? 'Member' : '';
  return { gang, role };
}
const initials = name => (name || '?').split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase();
function wrap(text, max) {
  const out = []; let cur = '';
  for (const w of String(text || '').split(/\s+/).filter(Boolean)) {
    if ((cur + ' ' + w).trim().length > max) { if (cur) out.push(cur.trim()); cur = w; }
    else cur = (cur + ' ' + w).trim();
  }
  if (cur) out.push(cur.trim());
  return out;
}

function buildSvg(n) {
  const W = 1080, H = 1350, M = 56;
  const person = n.person_name || '';
  const grounds = person ? allegationsFrom(n.summary, person) : [];
  const { gang, role } = gangRole(n.summary);
  const headline = n.social_headline || n.title || '';

  let s = `<rect width="${W}" height="${H}" fill="${C.paper}"/>`;
  s += `<defs>
    <filter id="gold" color-interpolation-filters="sRGB"><feColorMatrix type="matrix" values="1.05 0.35 0 0 0.03  0.78 0.32 0 0 0.02  0.22 0.05 0 0 0  0 0 0 1 0"/></filter>
    <linearGradient id="fadeL" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="${C.paper}" stop-opacity="1"/><stop offset="1" stop-color="${C.paper}" stop-opacity="0"/></linearGradient>
    <linearGradient id="fadeB" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${C.paper}" stop-opacity="0"/><stop offset="1" stop-color="${C.paper}" stop-opacity="1"/></linearGradient></defs>`;

  // ── HERO photo (gold-toned), top-right ──────────────────────────────────────
  const HERO = 452, photoW = 486, photoX = W - photoW;
  s += `<image x="${photoX}" y="0" width="${photoW}" height="${HERO}" href="data:image/png;base64,${HERO_B64}" preserveAspectRatio="xMidYMid slice" filter="url(#gold)"/>`;
  s += `<rect x="${photoX}" y="0" width="170" height="${HERO}" fill="url(#fadeL)"/>`;
  s += `<rect x="${photoX}" y="${HERO - 120}" width="${photoW}" height="120" fill="url(#fadeB)"/>`;

  // brand
  s += `<text x="${M}" y="62" font-family="${SER}" font-size="32" fill="${C.ink}">Insight<tspan fill="${C.amber}">TT</tspan></text>`;
  s += T(M + 2, 84, 'COURT JUDGMENTS', { size: 11, f: MON, fill: C.amber, ls: '3' });
  // top-right pill
  const pill = (n.ntype || 'legal notice').replace(/_/g, ' ').toUpperCase();
  const pw = 28 + pill.length * 8.2;
  s += `<rect x="${W - M - pw}" y="40" width="${pw}" height="32" rx="16" fill="${C.card}" stroke="${C.line}"/>`;
  s += ico('gavel', W - M - pw + 12, 48, 16, C.amber) + T(W - M - pw + 34, 60, pill, { size: 11, f: MON, fill: C.ink, w: 600 });
  // amber citation ribbon
  const ribbon = (n.citation || `${pill} · No. ${n.notice_no}`).toUpperCase();
  const rl = wrap(ribbon, 30).slice(0, 2);
  const rw = Math.min(370, 16 + Math.max(...rl.map(l => l.length)) * 6.7);
  s += `<rect x="${M}" y="100" width="${rw}" height="${10 + rl.length * 18}" rx="3" fill="${C.amber}"/>`;
  rl.forEach((l, i) => s += T(M + 10, 118 + i * 18, l, { size: 10, f: MON, fill: '#fff', w: 600 }));

  // ── HEADLINE (serif, mixed case, name in amber) ─────────────────────────────
  const zoneW = photoX - M - 20;
  const nameTok = person.toLowerCase().split(/\s+/).map(w => w.replace(/[^a-z]/g, '')).filter(t => t.length > 2);
  const isName = tok => { const c = tok.toLowerCase().replace(/[^a-z]/g, ''); return !!c && nameTok.some(t => t === c || (c.length > 3 && t.includes(c)) || (t.length > 3 && c.includes(t))); };
  // keep punchy: drop a verbose trailing "— clause" when the headline is long
  let hsrc = headline;
  if (headline.split(/\s+/).filter(Boolean).length > 12) {
    const parts = headline.split(/\s[—–-]\s/);
    if (parts.length > 1) hsrc = parts.find(p => p.toLowerCase().split(/\s+/).some(w => nameTok.includes(w.replace(/[^a-z]/g, '')))) || parts[0];
  }
  const toks = hsrc.split(/\s+/).filter(Boolean);
  const layouts = [48, 44, 40, 36, 32].map(size => {
    const maxC = Math.floor(zoneW / (size * 0.50));
    const ls = []; let cur = [], len = 0;
    for (const tk of toks) { const add = (len ? len + 1 : 0) + tk.length; if (cur.length && add > maxC) { ls.push(cur); cur = [tk]; len = tk.length; } else { cur.push(tk); len = add; } }
    if (cur.length) ls.push(cur);
    return { size, ls };
  });
  const pick = layouts.find(L => L.ls.length <= 4) || layouts[layouts.length - 1];
  const hsize = pick.size, hlines = pick.ls.slice(0, 5), lh = hsize * 1.12;
  let y = 168 + hsize;
  hlines.forEach((line, i) => {
    const runs = line.map(tk => `<tspan fill="${isName(tk) ? C.amber : C.ink}">${esc(tk)} </tspan>`).join('');
    s += `<text x="${M}" y="${y + i * lh}" font-family="${SER}" font-size="${hsize}">${runs}</text>`;
  });
  let hy = y + (hlines.length - 1) * lh;
  s += `<rect x="${M}" y="${hy + 18}" width="66" height="4" rx="2" fill="${C.amber}"/>`;

  // intro blurb (left) — short; the long account goes in IN FULL below
  const sum = (n.summary || n.social_post || '').replace(/\s+/g, ' ').trim();
  const firstSents = (txt, max) => { const ps = txt.split(/(?<=[.])\s+/); let o = ''; for (const p of ps) { if ((o + ' ' + p).trim().length > max) break; o = (o + ' ' + p).trim(); } return o || txt.slice(0, max); };
  const intro = firstSents((n.social_post || sum).replace(/\s+/g, ' ').trim(), 180);
  let sy = hy + 50;
  wrap(intro, Math.floor(zoneW / 8.4)).slice(0, 3).forEach((l, i) => s += T(M, sy + i * 25, l, { size: 15.5, fill: C.sub }));

  // ── profile card (white), right, under the hero ─────────────────────────────
  if (person) {
    const pX = photoX + 6, pW = W - M - pX, pY = HERO - 64, pH = 152;
    s += `<rect x="${pX}" y="${pY}" width="${pW}" height="${pH}" rx="16" fill="${C.card}" stroke="${C.line}"/>`;
    s += `<circle cx="${pX + 46}" cy="${pY + 48}" r="28" fill="${C.disc}"/>` + T(pX + 46, pY + 56, initials(person), { size: 21, w: 800, fill: '#fff', anc: 'middle' });
    const nm = person.toUpperCase();
    const nmSize = Math.max(13, Math.min(19, (pW - 100) / (nm.length * 0.62)));
    s += T(pX + 86, pY + 44, nm, { size: nmSize, w: 800, fill: C.ink });
    const sub = [role, gang].filter(Boolean).join(' • ');
    s += T(pX + 86, pY + 68, (sub ? sub + ' (alleged)' : 'Named in detention order').slice(0, 32), { size: 13.5, fill: C.sub });
    s += `<rect x="${pX + 20}" y="${pY + 92}" width="${pW - 40}" height="1" fill="${C.line}"/>`;
    s += cuffs(pX + 22, pY + 108, 26, C.amber);
    s += T(pX + 60, pY + 120, 'Detained under the', { size: 13, fill: C.sub })
       + T(pX + 60, pY + 140, (n.act ? n.act.replace(/^The\s+/i, '') : 'Anti-Gang Act, 2021').slice(0, 30), { size: 14, w: 700, fill: C.ink });
  }

  // ── grounds: 3-up illustrated circles ───────────────────────────────────────
  let gy = Math.max(sy + 3 * 25, HERO + 100) + 34;
  if (grounds.length) {
    const colW = (W - 2 * M) / 3, R = 84;
    const startX = M + (3 - grounds.length) * colW / 2; // centre when < 3
    grounds.forEach((g, i) => {
      const cx = startX + colW * i + colW / 2, cy = gy + R;
      s += `<circle cx="${cx}" cy="${cy}" r="${R}" fill="${C.tint}" stroke="${C.line}"/>`;
      s += drawArt(g.label, g.icon, cx - 56, cy - 56, 112, C.amber);
      s += `<circle cx="${cx - R + 18}" cy="${cy - R + 18}" r="16" fill="${C.amber}"/>` + T(cx - R + 18, cy - R + 23, '0' + (i + 1), { size: 12, f: MON, w: 700, fill: '#fff', anc: 'middle' });
      s += T(cx, cy + R + 34, g.label.toUpperCase(), { size: 16, w: 800, fill: C.ink, anc: 'middle' });
    });
    gy += R * 2 + 64;
  }

  // ── IN FULL: body text (left) + Lady Justice (right) ────────────────────────
  s += `<rect x="${M}" y="${gy}" width="92" height="28" rx="4" fill="${C.amber}"/>` + T(M + 14, gy + 19, 'IN FULL', { size: 12, f: MON, w: 600, fill: '#fff', ls: '1' });
  s += `<svg x="${W - M - 220}" y="${gy + 6}" width="220" height="260" viewBox="0 0 100 100" opacity="0.9">${ART.justice(C.amber)}</svg>`;
  const bodyW = W - 2 * M - 230;
  const cpl = Math.floor(bodyW / 8.0);
  let body = firstSents(sum, cpl * 9); // end on a sentence within ~9 lines
  if (body.length < sum.length && !/[.!?]$/.test(body)) body = body.replace(/\s+\S*$/, '') + ' …';
  wrap(body, cpl).slice(0, 10).forEach((l, i) => s += T(M, gy + 56 + i * 25, l, { size: 15, fill: C.ink }));

  // ── footer (dark bar) ───────────────────────────────────────────────────────
  const fH = 92, fy = H - fH;
  s += `<rect x="0" y="${fy}" width="${W}" height="${fH}" fill="${C.footer}"/>`;
  s += `<circle cx="${M + 16}" cy="${fy + 46}" r="16" fill="${C.amber}"/>` + ico('balance', M + 6, fy + 36, 20, C.footer);
  s += T(M + 44, fy + 42, 'STAY INFORMED. STAY SAFE.', { size: 15, f: MON, fill: C.fInk, w: 600 });
  s += T(M + 44, fy + 64, 'Real Judgments. Real Impact.', { size: 12, f: MON, fill: C.fSub });
  s += T(W - M - 26, fy + 42, 'Follow @InsightTT for more', { size: 12.5, f: MON, fill: C.fInk, anc: 'end' });
  s += T(W - M - 26, fy + 64, 'court updates and legal insights.', { size: 11.5, f: MON, fill: C.fSub, anc: 'end' });
  s += ico('bookmark', W - M - 18, fy + 36, 20, C.amber);

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">${s}</svg>`;
}

function renderNoticeCard(n, { width } = {}) {
  const svg = buildSvg(n);
  const opts = { font: { loadSystemFonts: false, fontFiles: FONT_FILES, defaultFontFamily: 'Inter' } };
  if (width) opts.fitTo = { mode: 'width', value: width };
  const r = new Resvg(svg, opts);
  return r.render().asPng();
}

module.exports = { renderNoticeCard, buildSvg };
