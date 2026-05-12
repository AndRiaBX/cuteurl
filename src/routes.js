const express = require('express');
const { nanoid } = require('nanoid');
const { getDb, saveDb } = require('./db');

const router = express.Router();

const SLUG_LENGTH = 8;
const MAX_URL_LENGTH = 4096;

function isValidUrl(str) {
  try {
    const url = new URL(str);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

// Helper: format db rows to link objects
function formatLinks(rows) {
  if (!rows.length || !rows[0].values.length) return [];
  return rows[0].values.map(v => ({
    id: v[0], slug: v[1], original: v[2], clicks: v[3], created_at: v[4]
  }));
}

// Helper: parameterized query returning rows as objects
function queryAll(db, sql, params = []) {
  const stmt = db.prepare(sql);
  if (params.length) stmt.bind(params);
  const results = [];
  while (stmt.step()) results.push(stmt.getAsObject());
  stmt.free();
  return results;
}

// Home — list all links
router.get('/', (req, res) => {
  try {
    const db = getDb();
    const rows = db.exec('SELECT * FROM links ORDER BY created_at DESC');
    const links = formatLinks(rows);
    res.render('index', { links, error: null, slug: null });
  } catch (err) {
    console.error(err);
    res.render('error', { message: 'Failed to load links.' });
  }
});

// Shorten via form POST
router.post('/', (req, res) => {
  try {
    const original = (req.body.url || '').trim();
    const db = getDb();

    if (!original) {
      const rows = db.exec('SELECT * FROM links ORDER BY created_at DESC');
      return res.render('index', { links: formatLinks(rows), error: 'URL is required.', slug: null });
    }
    if (!isValidUrl(original)) {
      const rows = db.exec('SELECT * FROM links ORDER BY created_at DESC');
      return res.render('index', { links: formatLinks(rows), error: 'Invalid URL. Must start with http:// or https://.', slug: null });
    }
    if (original.length > MAX_URL_LENGTH) {
      const rows = db.exec('SELECT * FROM links ORDER BY created_at DESC');
      return res.render('index', { links: formatLinks(rows), error: `URL too long (max ${MAX_URL_LENGTH} characters).`, slug: null });
    }

    // Generate unique slug (parameterized query — no SQL injection)
    let slug;
    for (let attempt = 0; attempt < 10; attempt++) {
      slug = nanoid(SLUG_LENGTH);
      const existing = queryAll(db, 'SELECT id FROM links WHERE slug = ?', [slug]);
      if (!existing.length) break;
    }

    db.run('INSERT INTO links (slug, original) VALUES (?, ?)', [slug, original]);
    saveDb();

    const rows = db.exec('SELECT * FROM links ORDER BY created_at DESC');
    res.render('index', { links: formatLinks(rows), error: null, slug });
  } catch (err) {
    console.error(err);
    res.render('error', { message: 'Failed to shorten URL.' });
  }
});

// API: shorten
router.post('/api/shorten', (req, res) => {
  try {
    const original = (req.body.url || '').trim();
    if (!original) {
      return res.status(400).json({ error: 'Missing "url" field.' });
    }
    if (!isValidUrl(original)) {
      return res.status(400).json({ error: 'Invalid URL format.' });
    }
    if (original.length > MAX_URL_LENGTH) {
      return res.status(400).json({ error: `URL too long (max ${MAX_URL_LENGTH} characters).` });
    }

    const db = getDb();
    // Generate unique slug (parameterized — no SQL injection)
    let slug;
    for (let attempt = 0; attempt < 10; attempt++) {
      slug = nanoid(SLUG_LENGTH);
      const existing = queryAll(db, 'SELECT id FROM links WHERE slug = ?', [slug]);
      if (!existing.length) break;
    }

    db.run('INSERT INTO links (slug, original) VALUES (?, ?)', [slug, original]);
    saveDb();
    res.json({ slug, original, clicks: 0 });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// API: list all
router.get('/api/links', (req, res) => {
  try {
    const db = getDb();
    const rows = db.exec('SELECT * FROM links ORDER BY created_at DESC');
    res.json(formatLinks(rows));
  } catch (err) {
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// Redirect (parameterized query — no SQL injection)
router.get('/:slug', (req, res) => {
  try {
    const db = getDb();
    const results = queryAll(db, 'SELECT * FROM links WHERE slug = ?', [req.params.slug]);
    if (!results.length) {
      return res.status(404).render('error', { message: 'Link not found.' });
    }
    const link = results[0];
    db.run('UPDATE links SET clicks = clicks + 1 WHERE id = ?', [link.id]);
    saveDb();
    res.redirect(301, link.original);
  } catch (err) {
    console.error(err);
    res.status(500).render('error', { message: 'Redirect failed.' });
  }
});

module.exports = { router };
