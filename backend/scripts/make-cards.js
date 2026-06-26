#!/usr/bin/env node
// Batch-render InsightTT notice cards to PNG files.
//
// Reads backend/scripts/data/notices.json directly (no DB needed) so it can run
// anywhere the renderer's native deps are installed. Maps the JSON `type` field
// to the `ntype` column the renderer expects, then writes one PNG per notice.
//
// Usage:
//   node scripts/make-cards.js                 # all detention orders → ./out
//   node scripts/make-cards.js --type all      # every notice
//   node scripts/make-cards.js --limit 6       # first 6 only
//   node scripts/make-cards.js --slug elijah   # notices whose slug/name match
//   node scripts/make-cards.js --out /path/dir --width 1080
//
const fs = require('fs');
const path = require('path');
const { renderNoticeCard } = require('../src/card');

const NOTICES = require('./data/notices.json');

function arg(name, def) {
  const i = process.argv.indexOf('--' + name);
  if (i === -1) return def;
  const v = process.argv[i + 1];
  return v && !v.startsWith('--') ? v : true;
}

const typeFilter = arg('type', 'detention_order'); // 'detention_order' | 'all' | <type>
const limit      = parseInt(arg('limit', '0'), 10) || 0;
const slugMatch  = (arg('slug', '') || '').toString().toLowerCase();
const width      = parseInt(arg('width', '0'), 10) || 0; // 0 = native 1080
const outDir     = (arg('out', '') || path.join(__dirname, '..', 'out')).toString();

const slugify = s => String(s || '')
  .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60);

let rows = NOTICES
  // Detention orders only carry a person + allegations, which the card needs.
  .filter(n => typeFilter === 'all' ? true : n.type === typeFilter)
  .filter(n => !slugMatch || (
    (n.person_name || '').toLowerCase().includes(slugMatch) ||
    (n.alias || '').toLowerCase().includes(slugMatch) ||
    slugify(n.person_name || n.title).includes(slugMatch)
  ));

if (limit) rows = rows.slice(0, limit);

fs.mkdirSync(outDir, { recursive: true });
console.log(`Rendering ${rows.length} card(s) → ${outDir}${width ? ` @ ${width}px` : ''}`);

let ok = 0, fail = 0;
for (const raw of rows) {
  // The renderer reads `ntype`; the JSON source uses `type`.
  const n = { ...raw, ntype: raw.type, slug: slugify(raw.person_name || raw.title) };
  const file = path.join(outDir, `notice-${String(raw.notice_no).padStart(4, '0')}-${n.slug}.png`);
  try {
    const png = renderNoticeCard(n, width ? { width } : {});
    fs.writeFileSync(file, png);
    ok++;
    process.stdout.write('.');
  } catch (e) {
    fail++;
    console.error(`\n  ✗ #${raw.notice_no} ${raw.person_name}: ${e.message}`);
  }
}
console.log(`\nDone. ${ok} rendered, ${fail} failed.`);
