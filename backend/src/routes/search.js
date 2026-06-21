const express = require('express');
const router  = express.Router();
const db      = require('../db');

// ── GET /api/search/people?q= ───────────────────────────────────────────────
// Search every named person (claimant, defendant, individual, director/officer)
// across all cases. Results are grouped by person name; each group lists the
// cases that person appears in. Mirrors the tt-address "group on the server"
// pattern but keyed on person rather than address.
router.get('/search/people', async (req, res) => {
  const q = (req.query.q || '').trim();
  if (q.length < 2) return res.json({ count: 0, groups: [] });

  try {
    const sql = `
      SELECT p.name, p.kind, p.role, p.note, p.company, p.offences, p.crime_category,
             c.id AS case_id, c.slug, c.title, c.citation, c.court,
             c.case_date, c.osint_value, c.url
      FROM people p
      JOIN cases c ON c.id = p.case_id
      WHERE p.name LIKE ?
      ORDER BY p.name, FIELD(c.osint_value,'high','medium','low'), c.case_date DESC
      LIMIT 500
    `;
    const [rows] = await db.query(sql, [`%${q}%`]);

    const splitList = s => (s ? s.split('||').map(x => x.trim()).filter(Boolean) : []);
    const map = new Map();
    for (const r of rows) {
      const key = r.name.toLowerCase();
      if (!map.has(key)) map.set(key, { name: r.name, mentions: [] });
      map.get(key).mentions.push({
        kind: r.kind, role: r.role, note: r.note, company: r.company,
        offences: splitList(r.offences), crime_category: splitList(r.crime_category),
        case_id: r.case_id, slug: r.slug, title: r.title, citation: r.citation,
        court: r.court, date: r.case_date, value: r.osint_value, url: r.url,
      });
    }
    const groups = Array.from(map.values())
      .sort((a, b) => b.mentions.length - a.mentions.length || a.name.localeCompare(b.name));
    res.json({ count: groups.length, groups });
  } catch (err) {
    console.error('People search error:', err);
    res.status(500).json({ error: 'Search failed' });
  }
});

// ── GET /api/search/entities?q= ─────────────────────────────────────────────
// Search companies & banks/FIs; group by entity name with their cases + directors.
router.get('/search/entities', async (req, res) => {
  const q = (req.query.q || '').trim();
  if (q.length < 2) return res.json({ count: 0, groups: [] });

  try {
    const sql = `
      SELECT co.name, co.role, co.directors, co.ownership_notes, co.is_bank,
             c.id AS case_id, c.slug, c.title, c.citation, c.osint_value, c.url
      FROM companies co
      JOIN cases c ON c.id = co.case_id
      WHERE co.name LIKE ?
      ORDER BY co.name, FIELD(c.osint_value,'high','medium','low')
      LIMIT 500
    `;
    const [rows] = await db.query(sql, [`%${q}%`]);

    const map = new Map();
    for (const r of rows) {
      // canonical-ish key (drop parentheticals + legal suffixes)
      const key = r.name.toLowerCase().replace(/\(.*?\)/g, '')
        .replace(/\b(limited|ltd|company|co|incorporated|inc)\b/g, '').replace(/[^a-z0-9]/g, '').trim();
      if (!map.has(key)) {
        map.set(key, { name: r.name, is_bank: !!r.is_bank, cases: [] });
      }
      const g = map.get(key);
      if (r.name.length < g.name.length) g.name = r.name; // prefer shorter canonical label
      g.cases.push({
        case_id: r.case_id, slug: r.slug, title: r.title, citation: r.citation,
        value: r.osint_value, url: r.url, role: r.role,
        directors: r.directors, ownership_notes: r.ownership_notes,
      });
    }
    const groups = Array.from(map.values())
      .sort((a, b) => b.cases.length - a.cases.length || a.name.localeCompare(b.name));
    res.json({ count: groups.length, groups });
  } catch (err) {
    console.error('Entity search error:', err);
    res.status(500).json({ error: 'Search failed' });
  }
});

module.exports = router;
