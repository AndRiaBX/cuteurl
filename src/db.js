const path = require('path');
const fs = require('fs');

const DATA_DIR = path.join(__dirname, '..', 'data');
const DB_PATH = path.join(DATA_DIR, 'cuteurl.db');

let db = null;
let sqlPromise = null;
let _isTestDb = false;

async function initDb() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    const initSqlJs = require('sql.js');
    const SQL = await initSqlJs();

    if (fs.existsSync(DB_PATH)) {
      const buffer = fs.readFileSync(DB_PATH);
      db = new SQL.Database(buffer);
    } else {
      db = new SQL.Database();
    }

    db.run(`CREATE TABLE IF NOT EXISTS links (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      slug TEXT UNIQUE NOT NULL,
      original TEXT NOT NULL,
      clicks INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now'))
    )`);

    saveDb();
    return db;
  } catch (err) {
    console.error('[cuteurl/db] Failed to initialize database:', err);
    throw err;
  }
}

function saveDb() {
  if (!db || _isTestDb) return;
  try {
    const data = db.export();
    const buffer = Buffer.from(data);
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(DB_PATH, buffer);
  } catch (err) {
    console.error('[cuteurl/db] Failed to persist database:', err);
  }
}

function getDb() {
  if (!db) throw new Error('Database not initialized. Call initDb() first.');
  return db;
}

/**
 * For testing: create an in-memory database (no file I/O).
 */
async function initTestDb() {
  const initSqlJs = require('sql.js');
  const SQL = await initSqlJs();
  db = new SQL.Database();
  db.run(`CREATE TABLE IF NOT EXISTS links (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    slug TEXT UNIQUE NOT NULL,
    original TEXT NOT NULL,
    clicks INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now'))
  )`);
  _isTestDb = true;
  return db;
}

module.exports = { initDb, getDb, saveDb, initTestDb };
