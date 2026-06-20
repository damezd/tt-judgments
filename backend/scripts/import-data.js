/**
 * Import the OSINT judgment knowledge base into MySQL.
 *
 * Usage:
 *   cd backend
 *   node scripts/import-data.js                 # imports every *.json in scripts/data
 *   node scripts/import-data.js path/to/file.json [more.json ...]
 *
 * Each JSON file is an array of case objects in the shape produced by the
 * OSINT extraction (see scripts/data/batch2.json).
 */

require('dotenv').config();
const fs    = require('fs');
const path  = require('path');
const mysql = require('mysql2/promise');

const DATA_DIR = path.join(__dirname, 'data');
const SCHEMA   = fs.readFileSync(path.join(__dirname, '../../database/schema.sql'), 'utf8');

const files = process.argv.slice(2).length
  ? process.argv.slice(2)
  : fs.readdirSync(DATA_DIR).filter(f => f.endsWith('.json')).map(f => path.join(DATA_DIR, f));

const list  = a => (Array.isArray(a) ? a : []).map(x => String(x).trim()).filter(Boolean).join('||');
const slugify = s => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 70);
const courtType = c => /appeal/i.test(c || '') ? 'Court of Appeal' : (/high court/i.test(c || '') ? 'High Court' : 'Other');
const isBank = (name, banks) => {
  const n = name.toLowerCase();
  return banks.some(b => b.toLowerCase().includes(n.split('(')[0].trim()) || n.includes(b.toLowerCase().split('(')[0].trim()))
    || /\b(bank|credit union|insurance|finance|mortgage)\b/.test(n);
};

(async () => {
  const db = await mysql.createConnection({ uri: process.env.MYSQL_URL, multipleStatements: true });
  console.log('Ensuring schema...');
  await db.query(SCHEMA);

  // Clear (children cascade, but be explicit for clarity)
  await db.query('SET FOREIGN_KEY_CHECKS=0');
  for (const t of ['people', 'companies', 'financials', 'properties', 'cases']) await db.query(`TRUNCATE TABLE ${t}`);
  await db.query('SET FOREIGN_KEY_CHECKS=1');

  let nCases = 0, nPeople = 0, nCo = 0, nFin = 0, nProp = 0;
  const usedSlugs = new Set();

  for (const file of files) {
    const data = JSON.parse(fs.readFileSync(file, 'utf8'));
    const batch = /batch1|92/.test(path.basename(file)) ? 1 : 2;
    console.log(`Importing ${data.length} cases from ${path.basename(file)} (batch ${batch})...`);

    for (const d of data) {
      let slug = slugify(d.citation || d.title) || ('case-' + (nCases + 1));
      while (usedSlugs.has(slug)) slug += '-x';
      usedSlugs.add(slug);

      const [r] = await db.query(
        `INSERT INTO cases (slug,batch,title,case_date,citation,court,court_type,judges,claimants,defendants,outcome,osint_value,osint_notes,related_litigation,url,fetch_failed)
         VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
        [slug, batch, d.title || '', d.date || '', d.citation || '', d.court || '', courtType(d.court),
         list(d.judges), list(d.claimants), list(d.defendants), d.outcome || '',
         d.osint_value || 'low', d.osint_notes || '', list(d.related_litigation), d.url || '', d.fetch_failed ? 1 : 0]
      );
      const caseId = r.insertId;
      nCases++;

      const banks = d.banks_financial_institutions || [];

      // people: claimants / defendants / individuals / directors
      const peopleRows = [];
      for (const n of (d.claimants || [])) peopleRows.push([caseId, n, 'claimant', '', '', '']);
      for (const n of (d.defendants || [])) peopleRows.push([caseId, n, 'defendant', '', '', '']);
      for (const i of (d.individuals || [])) peopleRows.push([caseId, i.name || '', 'individual', i.role || '', i.note || i.notes || '', '']);
      for (const co of (d.companies || [])) {
        for (const dir of (co.directors_officers || [])) peopleRows.push([caseId, dir, 'director', 'Director/officer of ' + (co.name || ''), '', co.name || '']);
      }
      for (const row of peopleRows.filter(r => r[1])) {
        await db.query('INSERT INTO people (case_id,name,kind,role,note,company) VALUES (?,?,?,?,?,?)', row);
        nPeople++;
      }

      // companies / banks
      for (const co of (d.companies || [])) {
        await db.query('INSERT INTO companies (case_id,name,role,directors,ownership_notes,is_bank) VALUES (?,?,?,?,?,?)',
          [caseId, co.name || '', co.role || '', list(co.directors_officers), co.ownership_notes || '', isBank(co.name || '', banks) ? 1 : 0]);
        nCo++;
      }
      for (const b of banks) {
        // add bank as a company node if not already present by name
        await db.query('INSERT INTO companies (case_id,name,role,directors,ownership_notes,is_bank) VALUES (?,?,?,?,?,1)',
          [caseId, b, 'Bank / financial institution', '', '']);
        nCo++;
      }

      for (const f of (d.financial_figures || [])) {
        await db.query('INSERT INTO financials (case_id,amount,currency,what_it_is) VALUES (?,?,?,?)',
          [caseId, String(f.amount || ''), f.currency || '', f.what_it_is || '']);
        nFin++;
      }
      for (const p of (d.property_lease || [])) {
        await db.query('INSERT INTO properties (case_id,description,lease_terms,rent,landlord,tenant,outcome) VALUES (?,?,?,?,?,?,?)',
          [caseId, p.address_or_description || '', p.lease_terms || '', p.rent || '', p.landlord || '', p.tenant || '', p.outcome || '']);
        nProp++;
      }
    }
  }

  console.log(`\nDone. cases=${nCases} people=${nPeople} companies/banks=${nCo} financials=${nFin} properties=${nProp}`);
  await db.end();
})().catch(e => { console.error(e); process.exit(1); });
