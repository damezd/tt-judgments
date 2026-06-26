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

// ── GET /api/notices/:slug/card.png ──────────────────────────────────────────
// Server-rendered 1080×1350 shareable card for a notice.
router.get('/notices/:slug/card.png', async (req, res) => {
  try {
    const [[n]] = await db.query('SELECT * FROM notices WHERE slug = ? OR id = ?', [req.params.slug, req.params.slug]);
    if (!n) return res.status(404).json({ error: 'Notice not found' });
    // Lazy-load the renderer so a missing native binary can't crash the server at boot.
    const { renderNoticeCard } = require('../card');
    const png = renderNoticeCard(n);
    res.set('Content-Type', 'image/png');
    res.set('Cache-Control', 'public, max-age=86400');
    res.send(png);
  } catch (err) {
    console.error('Card render error:', err);
    res.status(500).json({ error: 'Card render failed' });
  }
});

module.exports = router;
