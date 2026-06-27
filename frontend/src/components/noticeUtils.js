// Shared, framework-free helpers for legal-notice rendering (modal + card route).

export const ALLEGATIONS = [
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
// label → Material icon fallback
export const GROUND = {
  'Contract killings': 'dangerous', 'Reprisal attacks': 'local_fire_department', 'Murder / homicide': 'skull',
  'Firearms': 'crisis_alert', 'Drug trafficking': 'medication', 'Vehicle theft': 'directions_car',
  'Extortion': 'paid', 'Robbery': 'shopping_bag', 'Kidnapping': 'person_off', 'Wounding': 'personal_injury',
  'Outstanding warrants': 'gavel', 'Evading police': 'directions_run', 'Gang / OCG activity': 'groups',
};

export function allegationsFrom(text, name) {
  text = text || '';
  if (name) text = text.split(String(name).toUpperCase()).join(name);
  const out = [], seen = new Set();
  for (const [re, label] of ALLEGATIONS) {
    if (!re.test(text) || seen.has(label)) continue;
    seen.add(label);
    out.push({ label, icon: GROUND[label] });
  }
  return out.slice(0, 6);
}

export function gangRole(text) {
  text = text || '';
  let gang = '';
  // Prefer the actual group NAME over the generic "OCG"/"Gang" abbreviation.
  const patterns = [
    /["'“”‘’]([^"'“”‘’]*?\s+Gang)["'“”‘’]/,                 // "Ride Share Ring Gang"
    /\bas\s+the\s+["'“”‘’]?([A-Z][\w'’.\- ]+?\s+Gang)\b/,   // known as the X Gang
    /\b(\d+\s+Gang)\b/,                                      // 7 Gang
    /\b((?:[A-Z][\w'’.\-]+\s+){1,3}Gang)\b/,                // Capitalised … Gang
    /\b(Rasta City|Sixx?|Muslim City|Unruly ISIS)\b/,       // named OCGs without "Gang"
  ];
  for (const re of patterns) { const m = text.match(re); if (m) { gang = m[1].trim(); break; } }
  gang = gang.replace(/^.*faction of the\s+/i, '').replace(/^the\s+/i, '').trim();
  const l = text.toLowerCase();
  let role = '';
  if (/high-ranking|general\b/.test(l)) role = 'Ranking member';
  else if (/leader|principal|head of/.test(l)) role = 'Leader';
  else if (/shooter|gunman|enforcer|hitman/.test(l)) role = 'Shooter / enforcer';
  else if (/affiliate|associate/.test(l)) role = 'Affiliate';
  else if (/\bmember\b/.test(l)) role = 'Member';
  return { gang, role };
}

export const initials = name => (name || '?').split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase();

export const firstSentences = (s, n) => {
  const parts = (s || '').split(/(?<=[.])\s+/);
  let out = '';
  for (const p of parts) { if ((out + ' ' + p).trim().length > n) break; out = (out + ' ' + p).trim(); }
  return out || (s || '').slice(0, n);
};

// Map a notice to a case-style "type" so it reuses the case rail/illustration/badges.
const NOTICE_TYPE = {
  detention_order: { label: 'Detention Order', type: 'criminal' },
  detention_revocation: { label: 'Detention Revoked', type: 'criminal' },
  proceeds_of_crime: { label: 'Proceeds of Crime', type: 'corporate' },
  land_acquisition: { label: 'Land Acquisition', type: 'property' },
  state_lands: { label: 'State Lands', type: 'property' },
  default: { label: 'Legal Notice', type: 'corporate' },
};
export const noticeMeta = n => NOTICE_TYPE[n && n.ntype] || NOTICE_TYPE.default;
