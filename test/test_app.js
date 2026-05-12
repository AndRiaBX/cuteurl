/**
 * CuteURL test suite — tests URL shortening, redirection, stats, and error handling.
 * Uses Node.js built-in `node:test` (no external test runner needed).
 */
const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');

const { initTestDb, getDb } = require('../src/db');

// We'll start the server manually with a test db
let server;
let baseUrl;

async function makeRequest(method, path, body) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: '127.0.0.1',
      port: 0, // will be overridden by baseUrl
      path,
      method,
      headers: body ? { 'Content-Type': 'application/json' } : {},
    };

    // Parse baseUrl
    const url = new URL(baseUrl);
    options.port = url.port;

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          headers: res.headers,
          body: data,
          json: () => {
            try { return JSON.parse(data); } catch { return null; }
          },
        });
      });
    });

    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

describe('CuteURL', () => {
  before(async () => {
    // Use in-memory test DB
    await initTestDb();

    // Start server on random port
    const express = require('express');
    const path = require('path');
    const { router } = require('../src/routes');

    const app = express();
    app.set('view engine', 'ejs');
    app.set('views', path.join(__dirname, '..', 'views'));
    app.use(express.urlencoded({ extended: true }));
    app.use(express.json());
    app.use('/', router);

    return new Promise((resolve) => {
      server = app.listen(0, '127.0.0.1', () => {
        const port = server.address().port;
        baseUrl = `http://127.0.0.1:${port}`;
        resolve();
      });
    });
  });

  after(() => {
    if (server) server.close();
  });

  describe('API: POST /api/shorten', () => {
    it('should shorten a valid URL', async () => {
      const res = await makeRequest('POST', '/api/shorten', { url: 'https://example.com/very/long/path' });
      assert.equal(res.status, 200);
      const data = res.json();
      assert.ok(data.slug);
      assert.equal(data.slug.length, 8);
      assert.equal(data.original, 'https://example.com/very/long/path');
      assert.equal(data.clicks, 0);
    });

    it('should reject empty URL', async () => {
      const res = await makeRequest('POST', '/api/shorten', {});
      assert.equal(res.status, 400);
      assert.ok(res.json().error);
    });

    it('should reject invalid URL format', async () => {
      const res = await makeRequest('POST', '/api/shorten', { url: 'not-a-url' });
      assert.equal(res.status, 400);
      assert.ok(res.json().error);
    });

    it('should reject non-http/https URL', async () => {
      const res = await makeRequest('POST', '/api/shorten', { url: 'ftp://files.example.com' });
      assert.equal(res.status, 400);
      assert.ok(res.json().error);
    });

    it('should reject extremely long URL', async () => {
      const longUrl = 'https://example.com/' + 'x'.repeat(5000);
      const res = await makeRequest('POST', '/api/shorten', { url: longUrl });
      assert.equal(res.status, 400);
      assert.ok(res.json().error);
    });
  });

  describe('API: GET /api/links', () => {
    it('should list all links', async () => {
      const res = await makeRequest('GET', '/api/links');
      assert.equal(res.status, 200);
      const data = res.json();
      assert.ok(Array.isArray(data));
      // We created one link in the previous test
      assert.ok(data.length >= 1);
    });
  });

  describe('Redirection: GET /:slug', () => {
    it('should redirect to the original URL', async () => {
      // First create a link
      const createRes = await makeRequest('POST', '/api/shorten', { url: 'https://example.com/redirect-test' });
      const { slug } = createRes.json();

      // Now follow redirect (with follow: false using manual request)
      const res = await makeRequest('GET', `/${slug}`);
      assert.equal(res.status, 301);
      assert.equal(res.headers.location, 'https://example.com/redirect-test');
    });

    it('should return 404 for unknown slug', async () => {
      const res = await makeRequest('GET', '/nonexistent');
      assert.equal(res.status, 404);
    });

    it('should increment click count on redirect', async () => {
      const createRes = await makeRequest('POST', '/api/shorten', { url: 'https://example.com/click-test' });
      const { slug } = createRes.json();

      // Visit twice
      await makeRequest('GET', `/${slug}`);
      await makeRequest('GET', `/${slug}`);

      // Check clicks
      const linksRes = await makeRequest('GET', '/api/links');
      const links = linksRes.json();
      const link = links.find(l => l.slug === slug);
      assert.ok(link);
      assert.equal(link.clicks, 2);
    });
  });

  describe('Web UI: GET /', () => {
    it('should serve the home page', async () => {
      const res = await makeRequest('GET', '/');
      assert.equal(res.status, 200);
      assert.ok(res.body.includes('<!DOCTYPE html>'));
    });
  });
});
