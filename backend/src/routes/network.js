const express = require('express');
const router  = express.Router();
const db      = require('../db');

// ── GET /api/network ────────────────────────────────────────────────────────
// Returns nodes + edges for the corporate-network graph.
// Node types: case | company | bank | group | person (director or party).
router.get('/network', async (req, res) => {
  try {
    const [cases]     = await db.query('SELECT id, slug, title, citation, osint_value, url FROM cases');
    const [companies] = await db.query('SELECT case_id, name, role, directors, ownership_notes, is_bank FROM companies');
    const [people]    = await db.query('SELECT case_id, name, kind FROM people');

    const nodes = new Map();
    const edges = [];
    const seenEdge = new Set();
    const addEdge = (s, t, r) => {
      if (s === t) return;
      const k = `${s}|${t}|${r}`;
      if (seenEdge.has(k)) return;
      seenEdge.add(k); edges.push([s, t, r]);
    };
    const canon = n => n.toLowerCase().replace(/\(.*?\)/g, '')
      .replace(/\b(limited|ltd|company|co|incorporated|inc|cooperative|society)\b/g, '').replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();
    const label = n => n.replace(/\(.*?\)/g, '').replace(/\s+/g, ' ').trim().slice(0, 46);

    for (const c of cases) {
      nodes.set('CASE::' + c.id, { id: 'CASE::' + c.id, label: c.title.slice(0, 50), type: 'case', value: c.osint_value, slug: c.slug, citation: c.citation || '', url: c.url || '' });
    }
    for (const co of companies) {
      const key = canon(co.name);
      const id = 'ENT::' + key;
      if (!nodes.has(id)) nodes.set(id, { id, label: label(co.name), type: co.is_bank ? 'bank' : 'company', cases: new Set() });
      nodes.get(id).cases.add(co.case_id);
      addEdge(id, 'CASE::' + co.case_id, 'in case');
      const dirs = (co.directors || '').split('||').map(s => s.replace(/\(.*?\)/g, '').trim()).filter(Boolean);
      for (const d of dirs) {
        const pid = 'P::' + d.toLowerCase();
        if (!nodes.has(pid)) nodes.set(pid, { id: pid, label: d.slice(0, 36), type: 'person', role: 'director' });
        else nodes.get(pid).role = 'director';
        addEdge(pid, id, 'director/officer');
      }
      if (/junior sammy/i.test((co.ownership_notes || '') + (co.role || ''))) {
        const gid = 'GRP::junior sammy';
        if (!nodes.has(gid)) nodes.set(gid, { id: gid, label: 'Junior Sammy Group of Companies', type: 'group' });
        addEdge(id, gid, 'member of');
      }
    }
    for (const p of people) {
      const pid = 'P::' + p.name.toLowerCase();
      if (!nodes.has(pid)) nodes.set(pid, { id: pid, label: p.name.slice(0, 36), type: 'person', role: 'party' });
      addEdge(pid, 'CASE::' + p.case_id, 'party/person');
    }

    const deg = {};
    for (const [s, t] of edges) { deg[s] = (deg[s] || 0) + 1; deg[t] = (deg[t] || 0) + 1; }
    const out = [];
    for (const n of nodes.values()) {
      if (n.cases) { n.ncase = n.cases.size; delete n.cases; }
      n.deg = deg[n.id] || 0;
      out.push(n);
    }
    res.json({ nodes: out, edges });
  } catch (err) {
    console.error('Network error:', err);
    res.status(500).json({ error: 'Failed to build network' });
  }
});

module.exports = router;
