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

const C = { bg: '#15110e', panel: '#29211a', line: '#42352b', ink: '#efe7db', mut: '#b3a89c', red: '#cf3a2b',
  cream: '#efe7db', creamLine: '#d8cdbd', dark: '#1a1310', darkMut: '#6e5f52' };
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
  'Contract killings': { icon: 'dangerous', short: ['Allegedly ordered or carried out killings for payment on behalf of the network.'], key: 'Murder-for-hire alleged.' },
  'Reprisal attacks': { icon: 'local_fire_department', short: ['Tied to tit-for-tat shootings between rival gangs, fuelling cycles of violence.'], key: 'Cycle of retaliation.' },
  'Murder / homicide': { icon: 'skull', short: ['Alleged involvement in one or more killings linked to gang activity.'], key: 'Most serious allegation.' },
  'Firearms': { icon: 'crisis_alert', short: ['Alleged access to firearms and ammunition, including high-powered weapons.'], key: 'Raises public-safety risk.' },
  'Drug trafficking': { icon: 'medication', short: ['Linked to the narcotics trade that finances and sustains organised crime.'], key: 'Funds organised crime.' },
  'Vehicle theft': { icon: 'directions_car', short: ['Connected to a stolen-vehicle and larceny ring operating across the area.'], key: 'Larceny network.' },
  'Extortion': { icon: 'paid', short: ['Accused of demanding money with menaces, intimidating residents and businesses.'], key: 'Community intimidation.' },
  'Robbery': { icon: 'shopping_bag', short: ['Tied to armed robberies carried out by members of the group.'], key: 'A core allegation.' },
  'Kidnapping': { icon: 'person_off', short: ['Allegedly involved in kidnapping for ransom, a core charge in the order.'], key: 'A core allegation.' },
  'Wounding': { icon: 'personal_injury', short: ['Linked to violent assaults causing serious injury to victims.'], key: 'Public-safety threat.' },
  'Gang / OCG': { icon: 'groups', short: ['Named as an active member of an organised crime group in the region.'], key: 'Networks amplify harm.' },
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

// wrap a string to lines of at most `max` chars (word-aware)
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
  const W = 1080, H = 1350, M = 60;
  const person = n.person_name || '';
  const grounds = person ? allegationsFrom(n.summary, person) : [];
  const { gang, role } = gangRole(n.summary);
  const headline = n.social_headline || n.title || '';

  let s = `<rect width="${W}" height="${H}" fill="${C.bg}"/>`;
  s += `<defs>
    <linearGradient id="ts" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#000" stop-opacity="0.6"/><stop offset="1" stop-color="#000" stop-opacity="0"/></linearGradient>
    <linearGradient id="hf" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="${C.bg}" stop-opacity="1"/><stop offset="0.62" stop-color="${C.bg}" stop-opacity="0"/></linearGradient>
    <linearGradient id="bf" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${C.bg}" stop-opacity="0"/><stop offset="1" stop-color="${C.bg}" stop-opacity="1"/></linearGradient></defs>`;

  // ── HERO: photo (blood-moon figure) anchored RIGHT, headline space LEFT ─────
  const HERO = 470;
  const photoW = 440, photoX = W - photoW;
  s += `<image x="${photoX}" y="0" width="${photoW}" height="${HERO}" href="data:image/png;base64,${HERO_B64}" preserveAspectRatio="xMidYMid slice"/>`;
  // fade the photo's left edge into the dark headline zone
  s += `<rect x="${photoX}" y="0" width="280" height="${HERO}" fill="url(#hf)"/>`;
  s += `<rect x="0" y="0" width="${W}" height="150" fill="url(#ts)"/>`;
  s += `<rect x="0" y="${HERO - 150}" width="${W}" height="150" fill="url(#bf)"/>`;

  // brand + ribbon (top-left), kicker tag (top-right)
  s += T(M, 60, 'Insight', { size: 24, f: MON, w: 600 }) + T(M + 78, 60, 'TT', { size: 24, f: MON, w: 600, fill: C.red });
  s += T(M + 2, 84, 'COURT JUDGMENTS', { size: 10, f: MON, fill: C.mut, ls: '3' });
  const ribbon = (n.citation || `${(n.ntype || 'legal notice').replace(/_/g, ' ')} · No. ${n.notice_no}`).toUpperCase();
  const rlines = wrap(ribbon, 30).slice(0, 2);
  const rw = Math.min(360, 14 + Math.max(...rlines.map(l => l.length)) * 6.7);
  s += `<rect x="${M}" y="104" width="${rw}" height="${10 + rlines.length * 18}" rx="3" fill="${C.red}"/>`;
  rlines.forEach((l, i) => s += T(M + 10, 122 + i * 18, l, { size: 10, f: MON, fill: '#fff', w: 600 }));

  // ── HEADLINE: big uppercase, bottom-left of hero, subject NAME in red ──────
  const zoneW = photoX - M - 28;
  const nameTokens = person.toLowerCase().split(/\s+/).map(w => w.replace(/[^a-z]/g, '')).filter(t => t.length > 2);
  const isNameTok = tok => { const c = tok.toLowerCase().replace(/[^a-z]/g, ''); return !!c && nameTokens.some(t => t === c || (c.length > 3 && t.includes(c)) || (t.length > 3 && c.includes(t))); };
  // Keep it punchy: if the headline has dash-separated clauses, use the clause
  // that names the subject (drops verbose trailing context).
  let hsrc = headline;
  const parts = headline.split(/\s[—–-]\s/);
  if (parts.length > 1) hsrc = parts.find(p => p.toLowerCase().split(/\s+/).some(w => nameTokens.includes(w.replace(/[^a-z]/g, '')))) || parts[0];
  const tokens = hsrc.toUpperCase().split(/\s+/).filter(Boolean);
  // Pick the largest size that fits within 4 lines (else the largest within 5).
  const layouts = [60, 54, 50, 46, 42, 38].map(size => {
    const maxC = Math.floor(zoneW / (size * 0.60));
    const ls = []; let cur = [], len = 0;
    for (const tok of tokens) {
      const add = (len ? len + 1 : 0) + tok.length;
      if (cur.length && add > maxC) { ls.push(cur); cur = [tok]; len = tok.length; }
      else { cur.push(tok); len = add; }
    }
    if (cur.length) ls.push(cur);
    return { size, ls };
  });
  const pick = layouts.find(L => L.ls.length <= 4) || layouts.find(L => L.ls.length <= 5) || layouts[layouts.length - 1];
  const hsize = pick.size, hlines = pick.ls.slice(0, 5);
  const lh = hsize * 1.04;
  const firstBase = (HERO - 46) - (hlines.length - 1) * lh;
  hlines.forEach((line, i) => {
    const runs = line.map(tok => `<tspan fill="${isNameTok(tok) ? C.red : C.ink}">${esc(tok)} </tspan>`).join('');
    s += `<text x="${M}" y="${firstBase + i * lh}" font-family="${SAN}" font-size="${hsize}" font-weight="800" letter-spacing="-1.5">${runs}</text>`;
  });

  // ── SECTION A: summary (left) + cream profile card (right) ─────────────────
  const aY = HERO + 34;
  const profW = 392, profX = W - M - profW, sumW = profX - M - 28;
  // summary paragraph
  const sum = (n.summary || n.social_post || '').replace(/\s+/g, ' ').trim();
  wrap(sum, Math.floor(sumW / 8.6)).slice(0, 5).forEach((ln, i) => s += T(M, aY + 18 + i * 25, ln, { size: 16, fill: '#cfc6bb' }));

  // cream profile card
  if (person) {
    const ph = 168, py = aY - 6;
    s += `<rect x="${profX}" y="${py}" width="${profW}" height="${ph}" rx="14" fill="${C.cream}" stroke="${C.creamLine}"/>`;
    s += `<circle cx="${profX + 46}" cy="${py + 50}" r="30" fill="${C.red}"/>` + T(profX + 46, py + 59, initials(person), { size: 24, w: 800, fill: '#fff', anc: 'middle' });
    const nm = person.toUpperCase();
    const nmSize = Math.max(12.5, Math.min(19, (profW - 104) / (nm.length * 0.64)));
    s += T(profX + 90, py + 44, nm, { size: nmSize, w: 800, fill: C.dark });
    const sub = [role, gang].filter(Boolean).join(' · ');
    s += T(profX + 90, py + 68, (sub ? sub + ' (alleged)' : 'Named in detention order').slice(0, 30), { size: 13.5, fill: C.darkMut });
    s += `<rect x="${profX + 20}" y="${py + 96}" width="${profW - 40}" height="1" fill="${C.creamLine}"/>`;
    s += cuffs(profX + 24, py + 112, 26, C.red);
    s += T(profX + 62, py + 124, 'Detained under the', { size: 14, fill: C.darkMut })
       + T(profX + 62, py + 145, (n.act ? n.act.replace(/^The\s+/, '') : 'Anti-Gang Act, 2021').slice(0, 28), { size: 14.5, w: 700, fill: C.dark });
  }

  // ── numbered/iconed card helpers ──────────────────────────────────────────
  const gap = 18;
  const box = (x, y, w, h) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="14" fill="${C.panel}" stroke="${C.line}"/>`;
  const numTag = (x, y, num) => `<rect x="${x}" y="${y}" width="30" height="26" rx="5" fill="${C.red}"/>` + T(x + 15, y + 18, num, { size: 13, f: MON, w: 700, fill: '#fff', anc: 'middle' });
  const iconDisc = (cx, cy, icon, label) => {
    let g = `<circle cx="${cx}" cy="${cy}" r="27" fill="${C.red}"/>`;
    g += (label === 'Firearms') ? gun(cx - 15, cy - 14, 30, C.dark) : ico(icon || 'shield', cx - 15, cy - 15, 30, C.dark);
    return g;
  };
  const keyStrip = (x, y, w, txt) => {
    let g = `<rect x="${x}" y="${y}" width="${w}" height="46" rx="9" fill="rgba(207,58,43,0.12)"/>`;
    g += ico('lightbulb', x + 14, y + 9, 16, C.red);
    g += T(x + 38, y + 19, 'KEY INSIGHT', { size: 9, f: MON, fill: C.red, ls: '1', w: 700 });
    wrap(txt, Math.floor((w - 44) / 5.6)).slice(0, 1).forEach(l => g += T(x + 38, y + 37, l, { size: 11.5, fill: C.ink }));
    return g;
  };

  // ── 3-up grounds row ───────────────────────────────────────────────────────
  let gy = aY + 196;
  if (grounds.length) {
    const col = (W - 2 * M - 2 * gap) / 3, rh = 250;
    grounds.forEach((g, idx) => {
      const x = M + idx * (col + gap);
      s += box(x, gy, col, rh);
      s += numTag(x + 20, gy + 20, '0' + (idx + 1));
      s += iconDisc(x + 46, gy + 96, g.icon, g.label);
      wrap(g.label.toUpperCase(), 11).slice(0, 2).forEach((l, i) => s += T(x + 84, gy + 90 + i * 20, l, { size: 16, w: 800 }));
      const dtxt = (g.short || []).join(' ');
      wrap(dtxt, Math.floor((col - 40) / 6.4)).slice(0, 3).forEach((l, i) => s += T(x + 22, gy + 150 + i * 20, l, { size: 13, fill: C.mut }));
      s += keyStrip(x + 14, gy + rh - 58, col - 28, g.key);
    });
    gy += rh + gap;
  }

  // ── 2-up row: legal basis + big picture ────────────────────────────────────
  const col2 = (W - 2 * M - gap) / 2, rh2 = 232;
  s += box(M, gy, col2, rh2);
  {
    s += numTag(M + 20, gy + 20, '04');
    s += iconDisc(M + 46, gy + 96, 'balance', 'Legal basis');
    s += T(M + 84, gy + 100, 'LEGAL BASIS', { size: 17, w: 800 });
    const act = n.act || 'Anti-Gang Act, 2021';
    wrap('Detention is granted under the ' + act.replace(/^The\s+/, '') + '.', Math.floor((col2 - 44) / 6.0)).slice(0, 4)
      .forEach((l, i) => s += T(M + 22, gy + 150 + i * 19, l, { size: 13, fill: C.mut }));
    s += keyStrip(M + 14, gy + rh2 - 58, col2 - 28, 'Prevent further crime; protect the public.');
  }
  const bx = M + col2 + gap;
  s += box(bx, gy, col2, rh2);
  {
    s += `<g fill="${C.ink}" opacity="0.06" transform="translate(${bx + col2 - 116},${gy + 70})"><circle cx="48" cy="10" r="9"/><path d="M48 20 L70 96 H26 Z"/><rect x="46.5" y="20" width="3" height="50"/><rect x="16" y="36" width="64" height="3"/><path d="M16 39 l-7 13 h14 z"/><path d="M80 39 l-7 13 h14 z"/></g>`;
    s += numTag(bx + 20, gy + 20, '05');
    s += iconDisc(bx + 46, gy + 96, 'public', 'Big picture');
    s += T(bx + 84, gy + 100, 'THE BIG PICTURE', { size: 17, w: 800 });
    [['gavel', 'Organised crime drives fear and violence.'], ['verified_user', 'Strong enforcement = safer communities.'], ['balance', 'Courts are holding OCGs to account.']]
      .forEach(([icn, txt], i) => { const by = gy + 150 + i * 24; s += ico(icn, bx + 20, by - 13, 16, C.red) + T(bx + 44, by, txt, { size: 12.5, fill: C.mut }); });
  }
  gy += rh2;

  // ── footer ─────────────────────────────────────────────────────────────────
  const fy = H - 56;
  s += `<rect x="${M}" y="${fy - 6}" width="${W - 2 * M}" height="2" fill="${C.red}"/>`;
  s += T(M, fy + 22, 'STAY INFORMED. STAY SAFE.', { size: 14, f: MON, fill: C.red, w: 600, ls: '0.5' });
  s += T(M, fy + 42, 'Real Judgments. Real Impact.', { size: 12, f: MON, fill: C.mut });
  s += T(W - M - 26, fy + 22, 'Follow @InsightTT for more', { size: 12, f: MON, fill: C.ink, anc: 'end' });
  s += T(W - M - 26, fy + 42, 'court updates and legal insights.', { size: 11.5, f: MON, fill: C.mut, anc: 'end' });
  s += ico('bookmark', W - M - 18, fy + 18, 20, C.mut);

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
