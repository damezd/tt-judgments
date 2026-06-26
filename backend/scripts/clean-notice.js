// Normalise legal-notice records whose `alias` captured a full "also known as"
// chain from the Gazette (e.g. "DALE SIMMONS also known as “MATTHEW") and leaked
// that blob into `social_headline`. Used both for a one-time fix of notices.json
// and inside the importer so future refreshes stay clean. No-ops on clean records.

// The Gazette source always spells it out ("also known as"); match only that to
// avoid false hits on names that merely contain the letters a-k-a (e.g. "BAKA").
const AKA = /also known as/i;

// Reduce an alias to the street name: the segment after the last "also known as",
// stripped of quotes. Clean aliases (e.g. "STICKMAN") pass through unchanged.
function cleanAlias(alias) {
  if (!alias) return '';
  if (!AKA.test(alias)) return alias.trim();
  const seg = alias.split(AKA).pop();
  return seg.replace(/[‘’“”"']/g, '').trim();
}

const titleCase = s => s.replace(/\w\S*/g, t => t[0].toUpperCase() + t.slice(1).toLowerCase());

// Strip the garbled quoted alias blob from a headline and re-insert a clean
// 'Nickname' right after the person's name. Only touches malformed headlines.
function cleanHeadline(headline, name, nick) {
  if (!headline || !AKA.test(headline)) return headline || '';
  let s = headline
    // remove everything from the opening quote of the alias blob up to " detained"
    .replace(/['‘’“”][^]*?also known as.*?(?= detained)/i, '')
    .replace(/\s{2,}/g, ' ')
    .replace(/\s+([,.])/g, '$1')
    .trim();
  const nt = nick ? titleCase(nick) : '';
  if (nt && name && s.includes(name) && !new RegExp(`['‘"]${nt}`, 'i').test(s)) {
    s = s.replace(name, `${name} '${nt}'`);
  }
  return s;
}

// Return a normalised copy of a notice record (alias + social_headline cleaned).
function normalizeNotice(n) {
  if (!n) return n;
  const alias = cleanAlias(n.alias);
  return { ...n, alias, social_headline: cleanHeadline(n.social_headline, n.person_name, alias) };
}

module.exports = { cleanAlias, cleanHeadline, normalizeNotice };
