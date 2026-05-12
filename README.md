# CuteURL — URL Shortener

<p align="center">
  <img src="https://img.shields.io/badge/Node.js-18%2B-339933?logo=node.js&logoColor=white" alt="Node.js">
  <img src="https://img.shields.io/badge/Express-4.21-000000?logo=express&logoColor=white" alt="Express">
  <img src="https://img.shields.io/badge/SQLite-via_sql.js-003B57?logo=sqlite&logoColor=white" alt="SQLite">
  <img src="https://img.shields.io/badge/EJS-3.1-B4CA65?logo=ejs&logoColor=white" alt="EJS">
  <img src="https://img.shields.io/badge/License-MIT-yellow" alt="License">
  <img src="https://img.shields.io/github/actions/workflow/status/AndRiaBX/cuteurl/ci.yml?branch=master" alt="CI">
  <img src="https://img.shields.io/github/issues/AndRiaBX/cuteurl" alt="Issues">
  <img src="https://img.shields.io/badge/PRs-welcome-brightgreen" alt="PRs Welcome">
</p>

A lightweight URL shortener built with **Node.js**, **Express**, **SQLite** (via `sql.js`), and **EJS** templates. Compact 8-character slugs, visit tracking, and a clean web dashboard.

---

## Features

- **🔗 Shorten URLs** — Compress long URLs into memorable 8-character slugs
- **📊 Visit Tracking** — Each link keeps a click counter
- **🌐 Web Dashboard** — View all links, shorten new ones from the browser
- **🔌 REST API** — Programmatic URL shortening and listing
- **💾 Persistent Storage** — SQLite database stored on disk
- **↪️ 301 Redirects** — SEO-friendly permanent redirects
- **🔒 Parameterized Queries** — No SQL injection risk
- **🐳 Docker Support** — One-command deployment

---

## Screenshots

> _Screenshots coming soon. The web UI features a clean card-based dashboard with a URL input form and a sortable links table._

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Runtime | Node.js 18+ |
| Framework | Express 4.21 |
| Database | SQLite (via sql.js) |
| Templating | EJS 3.1 |
| Slug Generation | nanoid (cryptographic) |
| Container | Docker (multi-stage Alpine) |

---

## Quick Start

```bash
# 1. Clone
git clone https://github.com/AndRiaBX/cuteurl.git
cd cuteurl

# 2. Install dependencies
npm install

# 3. Start server
npm start
```

Server runs on **http://localhost:3000**.

### Verify it works

```bash
# Shorten a URL via API
curl -s -X POST http://localhost:3000/api/shorten \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com"}' | jq .

# Expected output:
# {
#   "slug": "aB3xK9mZ",
#   "original": "https://example.com",
#   "clicks": 0
# }

# Follow the redirect
curl -L -o /dev/null -w "%{http_code} %{redirect_url}" http://localhost:3000/aB3xK9mZ
```

---

## Project Structure

```
cuteurl/
├── src/
│   ├── server.js      # Express app entry point
│   ├── db.js          # SQLite initialization and queries
│   └── routes.js      # Route handlers (web + API)
├── views/
│   ├── index.ejs      # Home page — shorten form + link list
│   └── error.ejs      # Error page
├── test/
│   └── test_app.js    # Test suite (node:test)
├── data/              # SQLite database (auto-created)
├── .github/
│   ├── workflows/
│   │   └── ci.yml     # GitHub Actions CI
│   └── ISSUE_TEMPLATE/
│       ├── bug_report.md
│       └── feature_request.md
├── Dockerfile         # Multi-stage Alpine build
├── package.json
├── CONTRIBUTING.md
└── README.md
```

---

## API Documentation

### `POST /api/shorten` — Shorten a URL

**Request:**
```json
{
  "url": "https://example.com/very/long/path"
}
```

**Success Response (200):**
```json
{
  "slug": "aB3xK9mZ",
  "original": "https://example.com/very/long/path",
  "clicks": 0
}
```

**Error Responses:**

| Status | Condition | Example Response |
|--------|-----------|-----------------|
| `400` | Missing `url` field | `{"error": "Missing \"url\" field."}` |
| `400` | Invalid URL format | `{"error": "Invalid URL format."}` |
| `400` | URL too long (>4096 chars) | `{"error": "URL too long (max 4096 characters)."}` |
| `500` | Internal error | `{"error": "Internal server error."}` |

### `GET /api/links` — List all links

**Success Response (200):**
```json
[
  {
    "id": 1,
    "slug": "aB3xK9mZ",
    "original": "https://example.com/very/long/path",
    "clicks": 5,
    "created_at": "2026-05-12 22:30:00"
  }
]
```

### `GET /:slug` — Redirect to original URL

Redirects with HTTP `301` to the original URL. Returns `404` if slug does not exist.

---

## Development Setup

### Prerequisites

- Node.js 18+ (LTS recommended)
- npm 9+

### Install & run locally

```bash
git clone https://github.com/AndRiaBX/cuteurl.git
cd cuteurl
npm install
npm run dev    # with --watch for auto-restart
```

### Running tests

```bash
npm test                 # Single run
npm run test:watch       # Watch mode
```

Tests use Node.js built-in `node:test` — no external test runner required.

### Environment variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3000` | HTTP server port |
| `NODE_ENV` | — | Set to `test` for in-memory database mode |

---

## Docker Deployment

```bash
# Build image
docker build -t cuteurl .

# Run container
docker run -d \
  --name cuteurl \
  -p 3000:3000 \
  -v cuteurl-data:/app/data \
  cuteurl
```

### Docker Compose

```yaml
version: "3.8"
services:
  cuteurl:
    build: .
    ports:
      - "3000:3000"
    volumes:
      - cuteurl-data:/app/data

volumes:
  cuteurl-data:
```

### Cloud Deployment

**Fly.io:**
```bash
fly launch
fly deploy
```

**Railway / Render:**
- Connect GitHub repository
- Set build command: `npm install`
- Set start command: `npm start`
- Set `PORT` to match platform port

---

## Security

- All SQL queries use **parameterized statements** — no SQL injection risk
- URL validation ensures only `http://` and `https://` protocols are accepted
- Maximum URL length is limited to 4096 characters
- Slugs are generated with `nanoid` — cryptographically random
- Slug collisions are handled with retry logic (up to 10 attempts)

---

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for detailed guidelines on:
- Development setup
- Code style
- PR process
- Issue reporting

---

## License

MIT — see [LICENSE](LICENSE) for details.

---

<p align="center">
  Built with Node.js, Express, and SQLite.
</p>
