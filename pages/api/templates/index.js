import { v4 as uuidv4 } from 'uuid'
import db from '../../../lib/db'
const { verifyAuth } = require('../../../lib/auth')

export default function handler(req, res) {
  if (req.method === 'GET') {
    try {
      const auth = verifyAuth(req)
      const user_id = auth ? auth.sub : null
      const rows = user_id
        ? db.prepare('SELECT id, name, created_at FROM templates WHERE user_id = ? ORDER BY created_at DESC').all(user_id)
        : db.prepare('SELECT id, name, created_at FROM templates ORDER BY created_at DESC').all()
      return res.json(rows)
    } catch (e) {
      // Fall back to localStorage
      const storage = require('../../../lib/storage')
      const auth = verifyAuth(req)
      const user_id = auth ? auth.sub : null
      const templates = user_id ? storage.getUserTemplates(user_id) : storage.getAllTemplates()
      const rows = templates.map(t => ({ id: t.id, name: t.name, created_at: t.created_at }))
      return res.json(rows)
    }
  }

  if (req.method === 'POST') {
    const payload = req.body || {}
    const id = uuidv4()
    const now = new Date().toISOString()
    const auth = verifyAuth(req)
    const user_id = auth ? auth.sub : null
    const name = payload.name || 'Template'
    const data = JSON.stringify(payload.data || {})
    try {
      db.prepare('INSERT INTO templates (id,user_id,name,data,created_at) VALUES (?,?,?,?,?)').run(id, user_id, name, data, now)
      return res.status(201).json({ id })
    } catch (e) {
      // Fall back to localStorage
      const storage = require('../../../lib/storage')
      storage.createTemplate(id, user_id, name, data, now)
      return res.status(201).json({ id })
    }
  }

  res.status(405).end()
}
