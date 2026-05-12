# CuteURL — URL Shortener

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/Node.js-18%2B-green)](https://nodejs.org)
[![Express](https://img.shields.io/badge/Express-4.21%2B-lightgrey)](https://expressjs.com)
[![GitHub issues](https://img.shields.io/github/issues/AndRiaBX/cuteurl)](https://github.com/AndRiaBX/cuteurl/issues)

A lightweight URL shortener built with **Node.js**, **Express**, **SQLite** (via `sql.js`), and **EJS** templates. Compact 8-character slugs, visit tracking, and a clean web dashboard.

## Features

- **Shorten URLs** — Compress long URLs into memorable 8-character slugs
- **Visit Tracking** — Each link keeps a click counter
- **Web Dashboard** — View all links, shorten new ones from the browser
- **REST API** — Programmatic URL shortening and listing
- **Persistent Storage** — SQLite database stored on disk
- **301 Redirects** — SEO-friendly permanent redirects

## Quick Start

```bash
npm install
npm start
```

Server runs on **http://localhost:3000**.

## Usage

### Web UI

Open `http://localhost:3000` in a browser. Paste a URL and click "Shorten".

### API

```bash
# Shorten a URL
curl -X POST http://localhost:3000/api/shorten \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com/very/long/path"}'

# Response
{"slug":"aB3xK9mZ","original":"https://example.com/very/long/path","clicks":0}

# Visit shortened URL (redirects)
curl -L http://localhost:3000/aB3xK9mZ

# List all links
curl http://localhost:3000/api/links
```

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
├── data/              # SQLite database (auto-created)
├── package.json
└── README.md
```

## Security

- All SQL queries use **parameterized statements** — no SQL injection risk
- URL validation ensures only `http://` and `https://` protocols are accepted
- Maximum URL length is limited to 4096 characters
- Slugs are generated with `nanoid` — cryptographically random

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing`)
5. Open a Pull Request

## License

MIT — see [LICENSE](LICENSE) for details.

---

*Built with Node.js, Express, and SQLite.*
