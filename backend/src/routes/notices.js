const express = require('express');
const router  = express.Router();
const db      = require('../db');

// ── GET /api/notices ────────────────────────────────────────────────────────
// Gazette legal notices (detention orders, statutory orders, etc.).
router.get('/notices', async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT id, slug, notice_no, ntype, title, act, instrument,
             person_name, alias, address, detained_at, official, official_role,
             date_made, date_published, citation, summary,
             social_headline, social_post, source_file
      FROM notices
      ORDER BY notice_no DESC
    `);
    res.json({ count: rows.length, notices: rows });
  } catch (err) {
    console.error('Notices error:', err);
    res.status(500).json({ error: 'Failed to load notices' });
  }
});

module.exports = router;
