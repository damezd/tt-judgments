const express = require('express');
const router  = express.Router();
const db      = require('../db');

// ── GET /api/cases?value=&court=&q= ─────────────────────────────────────────
router.get('/cases', async (req, res) => {
  const value = (req.query.value || '').trim().toLowerCase();
  const court = (req.query.court || '').trim();
  const q     = (req.query.q     || '').trim();

  try {
    const cond = [];
    const params = [];
    if (value && ['high', 'medium', 'low'].includes(value)) { cond.push('osint_value = ?'); params.push(value); }
    if (court) { cond.push('court_type = ?'); params.push(court); }
    if (q)     { cond.push('(title LIKE ? OR citation LIKE ? OR osint_notes LIKE ?)'); params.push(`%${q}%`, `%${q}%`, `%${q}%`); }

    const where = cond.length ? `WHERE ${cond.join(' AND ')}` : '';
    const sql = `
      SELECT id, slug, title, citation, court, court_type, case_date,
             osint_value, fetch_failed, outcome
      FROM cases
      ${where}
      ORDER BY FIELD(osint_value,'high','medium','low'), case_date DESC, title
      LIMIT 500
    `;
    const [rows] = await db.query(sql, params);
    res.json({ count: rows.length, cases: rows });
  } catch (err) {
    console.error('Cases list error:', err);
    res.status(500).json({ error: 'Failed to load cases' });
  }
});

// ── GET /api/cases/:slug ────────────────────────────────────────────────────
router.get('/cases/:slug', async (req, res) => {
  try {
    const [[c]] = await db.query('SELECT * FROM cases WHERE slug = ? OR id = ?', [req.params.slug, req.params.slug]);
    if (!c) return res.status(404).json({ error: 'Case not found' });

    const [people]     = await db.query('SELECT name, kind, role, note, company FROM people WHERE case_id = ?', [c.id]);
    const [companies]  = await db.query('SELECT name, role, directors, ownership_notes, is_bank FROM companies WHERE case_id = ?', [c.id]);
    const [financials] = await db.query('SELECT amount, currency, what_it_is FROM financials WHERE case_id = ?', [c.id]);
    const [properties] = await db.query('SELECT description, lease_terms, rent, landlord, tenant, outcome FROM properties WHERE case_id = ?', [c.id]);

    res.json({
      ...c,
      judges:     splitList(c.judges),
      claimants:  splitList(c.claimants),
      defendants: splitList(c.defendants),
      related_litigation: splitList(c.related_litigation),
      people, companies, financials, properties,
    });
  } catch (err) {
    console.error('Case detail error:', err);
    res.status(500).json({ error: 'Failed to load case' });
  }
});

function splitList(s) {
  if (!s) return [];
  return s.split('||').map(x => x.trim()).filter(Boolean);
}

module.exports = router;
