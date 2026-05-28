import db from '../../../lib/db'
const { verifyAuth } = require('../../../lib/auth')

export default function handler(req, res) {
  const { id } = req.query
  if (req.method === 'GET') {
    const row = db.prepare('SELECT id,user_id,name,data,created_at FROM templates WHERE id = ?').get(id)
    if (!row) return res.status(404).json({ error: 'Not found' })
    return res.json({ id: row.id, name: row.name, data: JSON.parse(row.data || '{}'), created_at: row.created_at })
  }

  if (req.method === 'DELETE') {
    const auth = verifyAuth(req)
    const row = db.prepare('SELECT id,user_id FROM templates WHERE id = ?').get(id)
    if (!row) return res.status(404).json({ error: 'Not found' })
    if (auth && auth.sub !== row.user_id) return res.status(403).json({ error: 'Forbidden' })
    db.prepare('DELETE FROM templates WHERE id = ?').run(id)
    return res.status(204).end()
  }

  res.status(405).end()
}
