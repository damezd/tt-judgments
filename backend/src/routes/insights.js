const express = require('express');
const router  = express.Router();
const db      = require('../db');

// ── GET /api/insights ───────────────────────────────────────────────────────
// Cross-case analytics used by the dashboard.
router.get('/insights', async (req, res) => {
  try {
    const [[totals]] = await db.query(`
      SELECT
        COUNT(*) AS total,
        SUM(osint_value='high')   AS high,
        SUM(osint_value='medium') AS medium,
        SUM(osint_value='low')    AS low,
        SUM(fetch_failed=1)       AS failed
      FROM cases
    `);

    // Property, land & lease matters — addresses, commercial leases, rents, outcomes.
    const [properties] = await db.query(`
      SELECT p.description, p.lease_terms, p.rent, p.landlord, p.tenant, p.outcome,
             c.title, c.slug
      FROM properties p JOIN cases c ON c.id = p.case_id
      WHERE p.description <> '' OR p.rent <> '' OR p.lease_terms <> ''
      ORDER BY (p.rent <> '') DESC, CHAR_LENGTH(p.description) DESC
    `);

    // Recurring entities (companies/banks) across >1 case, using a canonical key.
    const [companies] = await db.query('SELECT name, is_bank, case_id FROM companies');
    const canon = n => n.toLowerCase().replace(/\(.*?\)/g, '')
      .replace(/\b(limited|ltd|company|co|incorporated|inc)\b/g, '').replace(/[^a-z0-9]/g, '').trim();
    const emap = new Map();
    for (const r of companies) {
      const k = canon(r.name);
      if (!k) continue;
      if (!emap.has(k)) emap.set(k, { name: r.name, is_bank: !!r.is_bank, cases: new Set() });
      const e = emap.get(k);
      if (r.name.length < e.name.length) e.name = r.name;
      e.cases.add(r.case_id);
    }
    const recurringEntities = Array.from(emap.values())
      .map(e => ({ name: e.name, is_bank: e.is_bank, cases: e.cases.size }))
      .filter(e => e.cases > 1)
      .sort((a, b) => b.cases - a.cases);

    // Top financial figures (TTD) for context.
    const [fins] = await db.query(`
      SELECT f.amount, f.what_it_is, c.title, c.slug
      FROM financials f JOIN cases c ON c.id=f.case_id
      WHERE f.currency='TTD' AND f.amount REGEXP '^[0-9.]+$'
    `);
    const topFigures = fins
      .map(f => ({ amount: parseFloat(f.amount), what: f.what_it_is, title: f.title, slug: f.slug }))
      .filter(f => !isNaN(f.amount))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 8);

    res.json({
      totals: {
        total: +totals.total, high: +totals.high, medium: +totals.medium,
        low: +totals.low, failed: +totals.failed,
      },
      recurringEntities, topFigures, properties,
    });
  } catch (err) {
    console.error('Insights error:', err);
    res.status(500).json({ error: 'Failed to load insights' });
  }
});

module.exports = router;
