const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const dbPath = path.resolve(process.env.DB_PATH || './finpac.db');

let db;

// sql.js works fully in-memory, but we persist to disk on every write
// so data survives restarts — same as a file-based DB
function loadDb(SQL) {
  if (fs.existsSync(dbPath)) {
    const fileBuffer = fs.readFileSync(dbPath);
    db = new SQL.Database(fileBuffer);
  } else {
    db = new SQL.Database();
  }
  db.run('PRAGMA foreign_keys = ON;');
}

function saveDb() {
  const data = db.export();
  fs.writeFileSync(dbPath, Buffer.from(data));
}

// Mimic better-sqlite3's synchronous API so the rest of the code stays identical
const dbProxy = {
  prepare: (sql) => ({
    run: (...params) => {
      db.run(sql, params);
      saveDb();
      // Return lastInsertRowid
      const row = db.exec('SELECT last_insert_rowid() as id');
      return { lastInsertRowid: row[0]?.values[0][0] ?? null };
    },
    get: (...params) => {
      const stmt = db.prepare(sql);
      stmt.bind(params);
      if (stmt.step()) {
        const row = stmt.getAsObject();
        stmt.free();
        return row;
      }
      stmt.free();
      return undefined;
    },
    all: (...params) => {
      const results = db.exec(sql, params);
      if (!results.length) return [];
      const { columns, values } = results[0];
      return values.map((row) =>
        Object.fromEntries(columns.map((col, i) => [col, row[i]]))
      );
    },
  }),
  exec: (sql) => {
    db.run(sql);
    saveDb();
  },
};

// Initialize synchronously using a top-level await workaround
// sql.js requires async init — we expose a promise the app waits on
let resolveReady;
const readyPromise = new Promise((res) => { resolveReady = res; });

initSqlJs().then((SQL) => {
  loadDb(SQL);
  resolveReady();
});

dbProxy.ready = readyPromise;

module.exports = dbProxy;
