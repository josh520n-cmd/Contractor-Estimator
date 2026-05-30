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

  // Material Presets
  db.exec(`
  CREATE TABLE IF NOT EXISTS material_presets (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    name TEXT,
    description TEXT,
    qty REAL,
    unit_price REAL,
    created_at TEXT
  );
  `)

  // Company Settings (logo, tax rates, etc.)
  db.exec(`
  CREATE TABLE IF NOT EXISTS company_settings (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    logo_data TEXT,
    tax_rate REAL,
    company_name TEXT,
    company_address TEXT,
    company_phone TEXT,
    created_at TEXT,
    updated_at TEXT
  );
  `)

  // Subscriptions
  db.exec(`
  CREATE TABLE IF NOT EXISTS subscriptions (
    id TEXT PRIMARY KEY,
    user_id TEXT UNIQUE,
    plan TEXT,
    status TEXT,
    stripe_customer_id TEXT,
    stripe_subscription_id TEXT,
    free_estimates_used INTEGER,
    created_at TEXT,
    updated_at TEXT,
    expires_at TEXT
  );
  `)
} catch (e) {
  // Fallback: simple JSON-backed store for local dev / tests when native module isn't available.
  const storeFile = path.join(dataDir, 'db.json')
  let store = { users: [], quotes: [], templates: [], material_presets: [], company_settings: [], subscriptions: [] }
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
    } else if (/INSERT INTO material_presets/i.test(sql)) {
      const [id, user_id, name, description, qty, unit_price, created_at] = params
      store.material_presets.push({ id, user_id, name, description, qty, unit_price, created_at })
      persist()
    } else if (/INSERT INTO company_settings/i.test(sql)) {
      const [id, user_id, logo_data, tax_rate, company_name, company_address, company_phone, created_at, updated_at] = params
      store.company_settings.push({ id, user_id, logo_data, tax_rate, company_name, company_address, company_phone, created_at, updated_at })
      persist()
    } else if (/INSERT INTO subscriptions/i.test(sql)) {
      const [id, user_id, plan, status, stripe_customer_id, stripe_subscription_id, free_estimates_used, created_at, updated_at, expires_at] = params
      store.subscriptions.push({ id, user_id, plan, status, stripe_customer_id, stripe_subscription_id, free_estimates_used, created_at, updated_at, expires_at })
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
        if (/SELECT id FROM company_settings WHERE user_id = \?/i.test(sql)) {
          return store.company_settings.find(s => s.user_id === param) || null
        }
        if (/SELECT id, user_id, logo_data, tax_rate, company_name, company_address, company_phone, created_at, updated_at FROM company_settings WHERE user_id = \?/i.test(sql)) {
          return store.company_settings.find(s => s.user_id === param) || null
        }
        if (/SELECT \* FROM subscriptions WHERE user_id = \?/i.test(sql)) {
          return store.subscriptions.find(s => s.user_id === param) || null
        }
        if (/SELECT id, plan, status, free_estimates_used, expires_at FROM subscriptions WHERE user_id = \?/i.test(sql)) {
          return store.subscriptions.find(s => s.user_id === param) || null
        }
        return null
      },
      all: function(param) {
        if (/SELECT id, client, created_at FROM quotes ORDER BY created_at DESC/i.test(sql)) {
          return store.quotes.slice().sort((a,b) => b.created_at.localeCompare(a.created_at)).map(q => ({ id: q.id, client: q.client, created_at: q.created_at }))
        }
        if (/SELECT id, name, created_at FROM templates ORDER BY created_at DESC/i.test(sql)) {
          return store.templates.slice().sort((a,b) => b.created_at.localeCompare(a.created_at)).map(t => ({ id: t.id, name: t.name, created_at: t.created_at }))
        }
        if (/SELECT id, name, description, qty, unit_price, created_at FROM material_presets WHERE user_id = \?/i.test(sql)) {
          return store.material_presets.filter(m => m.user_id === param).sort((a,b) => b.created_at.localeCompare(a.created_at))
        }
        if (/SELECT id, name, description, qty, unit_price, created_at FROM material_presets ORDER BY created_at DESC/i.test(sql)) {
          return store.material_presets.slice().sort((a,b) => b.created_at.localeCompare(a.created_at))
        }
        if (/SELECT COUNT/i.test(sql) && /FROM quotes WHERE user_id/i.test(sql)) {
          const count = store.quotes.filter(q => q.user_id === param).length
          return [{ count }]
        }
        return []
      },
      run: function(...params) {
        if (/UPDATE quotes SET client/i.test(sql)) {
          const [client, notes, data, id] = params
          const q = store.quotes.find(q => q.id === id)
          if (q) {
            q.client = client
            q.notes = notes
            q.data = data
            persist()
          }
        } else if (/UPDATE company_settings SET/i.test(sql)) {
          const [logo_data, tax_rate, company_name, company_address, company_phone, updated_at, user_id] = params
          const s = store.company_settings.find(s => s.user_id === user_id)
          if (s) {
            s.logo_data = logo_data
            s.tax_rate = tax_rate
            s.company_name = company_name
            s.company_address = company_address
            s.company_phone = company_phone
            s.updated_at = updated_at
            persist()
          }
        } else if (/UPDATE subscriptions SET/i.test(sql)) {
          const updateMatch = sql.match(/UPDATE subscriptions SET (.+) WHERE/i)
          if (updateMatch) {
            const updates = updateMatch[1].split(',').map(u => u.trim())
            const sub = store.subscriptions.find(s => s.user_id === params[params.length - 1])
            if (sub) {
              updates.forEach((update, idx) => {
                const field = update.split('=')[0].trim()
                if (field === 'plan') sub.plan = params[idx]
                if (field === 'status') sub.status = params[idx]
                if (field === 'free_estimates_used') sub.free_estimates_used = params[idx]
                if (field === 'updated_at') sub.updated_at = params[idx]
                if (field === 'expires_at') sub.expires_at = params[idx]
              })
              persist()
            }
          }
        } else {
          matchInsert(sql, params)
        }
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
