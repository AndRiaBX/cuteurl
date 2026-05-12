import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { app } from '../src/server.js';
import { initDb } from '../src/db.js';

const TEST_URL = 'https://example.com/cuteurl-test';
let server;
let baseUrl;

async function jsonRequest(method, path, body = null) {
  const url = new URL(path, baseUrl);
  const opts = { method, headers: {} };
  if (body) {
    opts.headers['Content-Type'] = 'application/json';
    opts.body = JSON.stringify(body);
  }
  const res = await fetch(url, opts);
  // Read body as text first to avoid consumption conflicts
  const text = await res.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    data = text;
  }
  return { status: res.status, data };
}

async function rawRequest(method, path) {
  const url = new URL(path, baseUrl);
  const res = await fetch(url, { method, redirect: 'manual' });
  return { status: res.status, headers: res.headers, location: res.headers.get('location') };
}

describe('cuteurl API', () => {
  before(async () => {
    await initDb();
    server = http.createServer(app);
    await new Promise(resolve => server.listen(0, resolve));
    const addr = server.address();
    baseUrl = `http://localhost:${addr.port}`;
  });

  after(() => {
    server.close();
  });

  it('POST /api/shorten — creates a short URL', async () => {
    const { status, data } = await jsonRequest('POST', '/api/shorten', { url: TEST_URL });

    assert.equal(status, 200);
    assert.ok(data.slug, 'should return a slug');
    assert.equal(data.slug.length, 8, 'slug should be 8 characters');
    assert.equal(data.original, TEST_URL);
    assert.equal(data.clicks, 0);
  });

  it('GET /:slug — redirects to the original URL', async () => {
    const { data: created } = await jsonRequest('POST', '/api/shorten', { url: TEST_URL });
    assert.ok(created.slug);

    const { status, location } = await rawRequest('GET', `/${created.slug}`);

    assert.equal(status, 301);
    assert.equal(location, TEST_URL);
  });

  it('GET /api/stats/:slug — returns link stats', async () => {
    const { data: created } = await jsonRequest('POST', '/api/shorten', { url: TEST_URL });
    assert.ok(created.slug);

    // Visit the link once to increment clicks
    await rawRequest('GET', `/${created.slug}`);

    const { status, data } = await jsonRequest('GET', `/api/stats/${created.slug}`);

    assert.equal(status, 200);
    assert.equal(data.slug, created.slug);
    assert.equal(data.original, TEST_URL);
    assert.ok(data.clicks >= 1, 'clicks should be at least 1 after one visit');
    assert.ok(data.created_at, 'should have created_at timestamp');
  });

  it('POST /api/shorten — rejects invalid URL', async () => {
    const { status, data } = await jsonRequest('POST', '/api/shorten', { url: 'not-a-url' });

    assert.equal(status, 400);
    assert.ok(data.error, 'should return error message');
  });

  it('POST /api/shorten — rejects empty URL', async () => {
    const { status, data } = await jsonRequest('POST', '/api/shorten', { url: '' });

    assert.equal(status, 400);
    assert.ok(data.error, 'should return error message');
  });

  it('POST /api/shorten — rejects missing url field', async () => {
    const { status, data } = await jsonRequest('POST', '/api/shorten', {});

    assert.equal(status, 400);
    assert.ok(data.error, 'should return error message');
  });

  it('GET /nonexistent — returns 404 for missing slug', async () => {
    const { status, data } = await jsonRequest('GET', '/nonexistent-slug');

    assert.equal(status, 404);
    // Route renders HTML, so data is a string
    assert.ok(typeof data === 'string', 'should return HTML');
    assert.ok(data.includes('Link not found'), 'should mention "Link not found"');
  });

  it('GET /api/stats/:slug — returns 404 JSON for missing slug', async () => {
    const { status, data } = await jsonRequest('GET', '/api/stats/nonexistent');

    assert.equal(status, 404);
    assert.equal(data.error, 'Link not found.');
  });
});
