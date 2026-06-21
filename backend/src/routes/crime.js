const express = require('express');
const router  = express.Router();
const db      = require('../db');

const splitList = s => (s ? s.split('||').map(x => x.trim()).filter(Boolean) : []);

// ── GET /api/crime ───────────────────────────────────────────────────────────
// Everyone tied to a criminal matter (firearms, drugs, and other serious
// offences). Grouped by person, each with their offences, categories, and the
// cases they appear in. Also returns the list of crime-flagged cases.
router.get('/crime', async (req, res) => {
  try {
    const [accused] = await db.query(`
      SELECT p.name, p.role, p.note, p.offences, p.crime_category,
             c.id AS case_id, c.slug, c.title, c.citation, c.case_date,
             c.osint_value, c.url, c.crime_flags
      FROM people p
      JOIN cases c ON c.id = p.case_id
      WHERE p.kind = 'accused' OR (p.crime_category IS NOT NULL AND p.crime_category <> '')
      ORDER BY p.name, FIELD(c.osint_value,'high','medium','low'), c.case_date DESC
    `);

    const map = new Map();
    const catCount = {};
    for (const r of accused) {
      const cats = splitList(r.crime_category);
      for (const cat of cats) catCount[cat] = (catCount[cat] || 0) + 1;
      const key = r.name.toLowerCase();
      if (!map.has(key)) map.set(key, { name: r.name, categories: new Set(), mentions: [] });
      const g = map.get(key);
      cats.forEach(c2 => g.categories.add(c2));
      g.mentions.push({
        role: r.role, note: r.note,
        offences: splitList(r.offences), crime_category: cats,
        case_id: r.case_id, slug: r.slug, title: r.title, citation: r.citation,
        date: r.case_date, value: r.osint_value, url: r.url,
      });
    }
    const people = Array.from(map.values())
      .map(g => ({ name: g.name, categories: Array.from(g.categories), mentions: g.mentions }))
      .sort((a, b) => b.mentions.length - a.mentions.length || a.name.localeCompare(b.name));

    const [[counts]] = await db.query("SELECT COUNT(*) AS cases FROM cases WHERE is_crime = 1");

    res.json({
      count: people.length,
      crimeCases: +counts.cases,
      categories: Object.entries(catCount).map(([name, n]) => ({ name, n })).sort((a, b) => b.n - a.n),
      people,
    });
  } catch (err) {
    console.error('Crime route error:', err);
    res.status(500).json({ error: 'Failed to load crime data' });
  }
});

module.exports = router;
