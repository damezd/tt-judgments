// Shared case presentation helpers (used by the feed cards and the case viewer).

const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
export const fmtDate = d => {
  const m = (d || '').match(/^(\d{4})-(\d{2})-(\d{2})/);
  return m ? `${+m[3]} ${MONTHS[+m[2] - 1]} ${m[1]}` : (d || '').toUpperCase();
};

// Detect case type from the text we already have.
export function detectType(c) {
  const s = `${c.title || ''} ${c.social_headline || ''} ${c.outcome || ''} ${c.crime_flags || ''}`.toLowerCase();
  if (c.is_crime || /\b(murder|manslaughter|assault|firearm|robbery|rape|sexual|kidnap|fraud|trafficking|criminal|accused|convict|sentenc)/.test(s)) return 'criminal';
  if (/defamation|slander|libel/.test(s)) return 'corporate';
  if (/employ|wrongful dismissal|unfair dismissal|dismiss|trade union|industrial|redundan|labour|worker|sacked|sacking/.test(s)) return 'employment';
  if (/\bland\b|property|compulsory acquisition|acquisition|mortgage|lease|tenanc|landlord|conveyance|estate|deed|possession|squat/.test(s)) return 'property';
  if (/compan|corporate|contract|shareholder|director|breach|partnership|debt|invoice/.test(s)) return 'corporate';
  return 'corporate';
}

export function typeLabel(type, c) {
  const s = `${c.title || ''} ${c.social_headline || ''} ${c.outcome || ''}`.toLowerCase();
  if (type === 'employment') return /wrongful dismissal/.test(s) ? 'Wrongful Dismissal' : /unfair dismissal/.test(s) ? 'Unfair Dismissal' : 'Employment';
  if (type === 'property') return /compulsory acquisition/.test(s) ? 'Compulsory Acquisition' : /mortgage/.test(s) ? 'Mortgage' : /lease|tenanc|landlord/.test(s) ? 'Property / Lease' : 'Property';
  if (type === 'corporate') return /defamation|slander|libel/.test(s) ? 'Defamation' : /contract/.test(s) ? 'Contract' : 'Corporate';
  return 'Criminal';
}

// Pull the headline money figure (rendered as a serif amount tag).
export function parseAmount(c) {
  const m = `${c.social_headline || ''} ${c.social_post || ''}`.match(/(~\s*\$|\$)\s*([\d][\d,]*(?:\.\d+)?)\s*(k|m|bn|million|billion|thousand)?/i);
  if (!m) return null;
  const sym = m[1].includes('~') ? '~$' : '$';
  const u = (m[3] || '').toLowerCase();
  const unit = u.startsWith('m') ? 'M' : u.startsWith('b') ? 'B' : (u === 'k' || u === 'thousand') ? 'k' : '';
  return { sym, num: m[2], unit: (unit ? unit + ' ' : '') + 'TTD' };
}

export const PRIO = { high: ['badge-high', 'HIGH'], medium: ['badge-medium', 'MEDIUM'], low: ['badge-low', 'LOW'] };

// Accent colour per case type (matches the rail / illustration tone).
export const ACCENT = { employment: '#c0392b', criminal: '#c0392b', property: '#b7950b', corporate: '#1a5276' };
export const ACCENT_TINT = { employment: '#fdeceb', criminal: '#fdeceb', property: '#fbf3da', corporate: '#eaf1f8' };
