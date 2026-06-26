#!/usr/bin/env node
/**
 * Batch-render InsightTT notice cards to PNG by screenshotting the SAME React
 * poster the app uses (frontend `?card=1` render route) with Playwright.
 * Single source of truth: the layout lives only in NoticePoster.jsx.
 *
 * Prereqs:
 *   1. Build the frontend:  cd frontend && npm run build
 *   2. Run with Playwright available, e.g.
 *      NODE_PATH=$(npm root -g) node scripts/make-cards.js --type detention_order --limit 6
 *
 * Usage flags:
 *   --type detention_order|all|<type>   (default detention_order)
 *   --limit N        only the first N
 *   --slug str       match person_name / alias / slug
 *   --out dir        output dir (default ./out)
 */
const fs = require('fs');
const path = require('path');
const http = require('http');
const { chromium } = require('playwright');

const DIST = path.join(__dirname, '..', '..', 'frontend', 'dist');
const NOTICES = require('./data/notices.json');

function arg(name, def) {
  const i = process.argv.indexOf('--' + name);
  if (i === -1) return def;
  const v = process.argv[i + 1];
  return v && !v.startsWith('--') ? v : true;
}
const typeFilter = arg('type', 'detention_order');
const limit = parseInt(arg('limit', '0'), 10) || 0;
const slugMatch = (arg('slug', '') || '').toString().toLowerCase();
const outDir = (arg('out', '') || path.join(__dirname, '..', 'out')).toString();
const slugify = s => String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60);

const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.woff2': 'font/woff2', '.woff': 'font/woff', '.ttf': 'font/ttf', '.svg': 'image/svg+xml', '.json': 'application/json', '.ico': 'image/x-icon' };
function serveDist() {
  return new Promise((resolve, reject) => {
    if (!fs.existsSync(path.join(DIST, 'index.html'))) return reject(new Error(`frontend not built — run "cd frontend && npm run build" (looked in ${DIST})`));
    const srv = http.createServer((req, res) => {
      let u = decodeURIComponent(req.url.split('?')[0]);
      if (u === '/') u = '/index.html';
      const file = path.join(DIST, u);
      fs.readFile(file, (e, d) => {
        if (e) { // SPA fallback
          fs.readFile(path.join(DIST, 'index.html'), (e2, d2) => e2 ? (res.writeHead(404), res.end()) : (res.writeHead(200, { 'Content-Type': 'text/html' }), res.end(d2)));
          return;
        }
        res.writeHead(200, { 'Content-Type': MIME[path.extname(file)] || 'application/octet-stream' });
        res.end(d);
      });
    });
    srv.listen(0, () => resolve(srv));
  });
}

(async () => {
  let rows = NOTICES
    .filter(n => typeFilter === 'all' ? true : n.type === typeFilter)
    .filter(n => !slugMatch || (
      (n.person_name || '').toLowerCase().includes(slugMatch) ||
      (n.alias || '').toLowerCase().includes(slugMatch) ||
      slugify(n.person_name || n.title).includes(slugMatch)
    ));
  if (limit) rows = rows.slice(0, limit);

  fs.mkdirSync(outDir, { recursive: true });
  const srv = await serveDist();
  const port = srv.address().port;
  const browser = await chromium.launch();
  console.log(`Rendering ${rows.length} card(s) → ${outDir}`);

  let ok = 0, fail = 0;
  for (const raw of rows) {
    const n = { ...raw, ntype: raw.type, slug: slugify(raw.person_name || raw.title) };
    const file = path.join(outDir, `notice-${String(raw.notice_no).padStart(4, '0')}-${n.slug}.png`);
    try {
      const page = await browser.newPage({ viewport: { width: 1120, height: 1400 }, deviceScaleFactor: 1 });
      await page.addInitScript(notice => { window.__NOTICE__ = notice; }, n);
      await page.goto(`http://localhost:${port}/?card=1`, { waitUntil: 'networkidle' });
      await page.waitForFunction(() => window.__cardReady === true, { timeout: 8000 }).catch(() => {});
      await page.waitForTimeout(150);
      const el = await page.$('#card-root');
      await el.screenshot({ path: file });
      await page.close();
      ok++; process.stdout.write('.');
    } catch (e) {
      fail++; console.error(`\n  ✗ #${raw.notice_no} ${raw.person_name}: ${e.message}`);
    }
  }
  await browser.close();
  srv.close();
  console.log(`\nDone. ${ok} rendered, ${fail} failed.`);
})().catch(e => { console.error(e); process.exit(1); });
