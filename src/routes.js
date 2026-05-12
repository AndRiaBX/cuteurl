const express = require('express');
const { nanoid } = require('nanoid');
const { getDb, saveDb } = require('./db');

const router = express.Router();

const SLUG_LENGTH = 8;

function isValidUrl(str) {
  try {
    const url = new URL(str);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

// Home — list all links
router.get('/', (req, res) => {
  try {
    const db = getDb();
    const rows = db.exec('SELECT * FROM links ORDER BY created_at DESC');
    const links = rows.length > 0 ? rows[0].values.map(v => ({
      id: v[0], slug: v[1], original: v[2], clicks: v[3], created_at: v[4]
    })) : [];
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
      const links = rows.length > 0 ? rows[0].values.map(v => ({
        id: v[0], slug: v[1], original: v[2], clicks: v[3], created_at: v[4]
      })) : [];
      return res.render('index', { links, error: 'URL is required.', slug: null });
    }
    if (!isValidUrl(original)) {
      const rows = db.exec('SELECT * FROM links ORDER BY created_at DESC');
      const links = rows.length > 0 ? rows[0].values.map(v => ({
        id: v[0], slug: v[1], original: v[2], clicks: v[3], created_at: v[4]
      })) : [];
      return res.render('index', { links, error: 'Invalid URL. Must start with http:// or https://.', slug: null });
    }

    let slug;
    for (let attempt = 0; attempt < 10; attempt++) {
      slug = nanoid(SLUG_LENGTH);
      const existing = db.exec(`SELECT id FROM links WHERE slug = '${slug}'`);
      if (!existing.length || !existing[0].values.length) break;
    }

    db.run('INSERT INTO links (slug, original) VALUES (?, ?)', [slug, original]);
    saveDb();

    const rows = db.exec('SELECT * FROM links ORDER BY created_at DESC');
    const links = rows.length > 0 ? rows[0].values.map(v => ({
      id: v[0], slug: v[1], original: v[2], clicks: v[3], created_at: v[4]
    })) : [];
    res.render('index', { links, error: null, slug });
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

    const db = getDb();
    let slug;
    for (let attempt = 0; attempt < 10; attempt++) {
      slug = nanoid(SLUG_LENGTH);
      const existing = db.exec(`SELECT id FROM links WHERE slug = '${slug}'`);
      if (!existing.length || !existing[0].values.length) break;
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
    const links = rows.length > 0 ? rows[0].values.map(v => ({
      id: v[0], slug: v[1], original: v[2], clicks: v[3], created_at: v[4]
    })) : [];
    res.json(links);
  } catch (err) {
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// Redirect
router.get('/:slug', (req, res) => {
  try {
    const db = getDb();
    const rows = db.exec(`SELECT * FROM links WHERE slug = '${req.params.slug}'`);
    if (!rows.length || !rows[0].values.length) {
      return res.status(404).render('error', { message: 'Link not found.' });
    }
    const link = rows[0].values[0];
    db.run('UPDATE links SET clicks = clicks + 1 WHERE id = ?', [link[0]]);
    saveDb();
    res.redirect(301, link[2]);
  } catch (err) {
    console.error(err);
    res.status(500).render('error', { message: 'Redirect failed.' });
  }
});

module.exports = { router };
