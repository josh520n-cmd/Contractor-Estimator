import { v4 as uuidv4 } from 'uuid'
import db from '../../../lib/db'
const { verifyAuth } = require('../../../lib/auth')

export default function handler(req, res) {
  if (req.method === 'GET') {
    try {
      const rows = db.prepare('SELECT id, client, created_at FROM quotes ORDER BY created_at DESC').all()
      return res.json(rows)
    } catch (e) {
      // Fall back to localStorage
      const rows = storage.getAllQuotes().map(q => ({ id: q.id, client: q.client, created_at: q.created_at }))
      return res.json(rows)
    }
  }

  if (req.method === 'POST') {
    const payload = req.body || {}
    const id = uuidv4()
    const now = new Date().toISOString()
    const auth = verifyAuth(req)
    const user_id = auth ? auth.sub : null
    const client = payload.client || ''
    const notes = payload.notes || ''
    const data = JSON.stringify(payload)
    try {
      db.prepare('INSERT INTO quotes (id,user_id,client,notes,data,created_at) VALUES (?,?,?,?,?,?)').run(id, user_id, client, notes, data, now)
      return res.status(201).json({ id })
    } catch (e) {
      // Fall back to localStorage
      storage.createQuote(id, user_id, client, notes, data, now)
      return res.status(201).json({ id })
    }
  }

  res.status(405).end()
}
