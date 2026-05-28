const path = require('path')
const fs = require('fs')

const dataDir = path.join(process.cwd(), 'data')
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir)

// Try to use better-sqlite3 native driver; otherwise provide a lightweight JSON fallback.
let db = null
try {
  const moduleName = 'better-sqlite3'
  const requireFn = eval('require')
  const Database = requireFn(moduleName)
  const dbFile = path.join(dataDir, 'db.sqlite')
  db = new Database(dbFile)

  // Users
  db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE,
    password TEXT,
    name TEXT,
    created_at TEXT
  );
  `)

  // Quotes
  db.exec(`
  CREATE TABLE IF NOT EXISTS quotes (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    client TEXT,
    notes TEXT,
    data TEXT,
    created_at TEXT
  );
  `)

  // Templates
  db.exec(`
  CREATE TABLE IF NOT EXISTS templates (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    name TEXT,
    data TEXT,
    created_at TEXT
  );
  `)
} catch (e) {
  // Fallback: simple JSON-backed store for local dev / tests when native module isn't available.
  const storeFile = path.join(dataDir, 'db.json')
  let store = { users: [], quotes: [], templates: [] }
  try { if (fs.existsSync(storeFile)) store = JSON.parse(fs.readFileSync(storeFile, 'utf8')) } catch (e) {}

  function persist() { try { fs.writeFileSync(storeFile, JSON.stringify(store, null, 2)) } catch (e) {} }

  function matchInsert(sql, params) {
    // naive insert handler: inspect SQL to determine table and push params in order
    if (/INSERT INTO users/i.test(sql)) {
      const [id, email, password, name, created_at] = params
      store.users.push({ id, email, password, name, created_at })
      persist()
    } else if (/INSERT INTO quotes/i.test(sql)) {
      const [id, user_id, client, notes, data, created_at] = params
      store.quotes.push({ id, user_id, client, notes, data, created_at })
      persist()
    } else if (/INSERT INTO templates/i.test(sql)) {
      const [id, user_id, name, data, created_at] = params
      store.templates.push({ id, user_id, name, data, created_at })
      persist()
    }
  }

  function makeStatement(sql) {
    return {
      get: function(param) {
        if (/SELECT id FROM users WHERE email/i.test(sql)) {
          return store.users.find(u => u.email === param) || null
        }
        if (/SELECT id, user_id, client, notes, data, created_at FROM quotes WHERE id = \?/i.test(sql)) {
          return store.quotes.find(q => q.id === param) || null
        }
        if (/SELECT id, client, created_at FROM quotes ORDER BY created_at DESC/i.test(sql)) {
          // not used with params
          return store.quotes.slice().sort((a,b) => b.created_at.localeCompare(a.created_at))[0] || null
        }
        if (/SELECT id,user_id,name,data,created_at FROM templates WHERE id = \?/i.test(sql)) {
          return store.templates.find(t => t.id === param) || null
        }
        return null
      },
      all: function() {
        if (/SELECT id, client, created_at FROM quotes ORDER BY created_at DESC/i.test(sql)) {
          return store.quotes.slice().sort((a,b) => b.created_at.localeCompare(a.created_at)).map(q => ({ id: q.id, client: q.client, created_at: q.created_at }))
        }
        if (/SELECT id, name, created_at FROM templates ORDER BY created_at DESC/i.test(sql)) {
          return store.templates.slice().sort((a,b) => b.created_at.localeCompare(a.created_at)).map(t => ({ id: t.id, name: t.name, created_at: t.created_at }))
        }
        return []
      },
      run: function(...params) {
        matchInsert(sql, params)
        return { changes: 1 }
      }
    }
  }

  db = {
    prepare: makeStatement,
    exec: function(sql) {
      // ignore create table in fallback
      return
    }
  }
}

module.exports = db
