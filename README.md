# CuteURL — URL Shortener

A lightweight URL shortener built with **Node.js**, **Express**, **SQLite** (via `better-sqlite3`), and **EJS** templates.

## Features

- Shorten long URLs to compact 8-character slugs
- Redirect with HTTP 301 on visit
- View all links on a simple web dashboard
- Track visit counts per link
- Persistent SQLite storage

## Setup

```bash
npm install
npm start
```

Server runs on `http://localhost:3000`.

## Usage

**Web UI:** Open `http://localhost:3000` in a browser. Paste a URL and click "Shorten".

**API:**
```bash
# Shorten a URL
curl -X POST http://localhost:3000/api/shorten \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com/very/long/path"}'

# Response: {"slug":"aB3xK9mZ","original":"https://example.com/very/long/path","clicks":0}

# Visit shortened URL (redirects)
curl -L http://localhost:3000/aB3xK9mZ
```

## Structure

```
cuteurl/
├── src/
│   ├── server.js      # Express app entry point
│   ├── db.js          # SQLite init + queries
│   └── routes.js      # Route handlers
├── views/
│   ├── index.ejs      # Home page (shorten form + list)
│   └── error.ejs      # Error page
├── package.json
└── README.md
```
