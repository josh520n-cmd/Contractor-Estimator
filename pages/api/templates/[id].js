import db from '../../../lib/db'

const { verifyAuth } = require('../../../lib/auth')

export default async function handler(req, res) {
  const { id } = req.query

  if (req.method === 'GET') {
    try {
      const row = db
        .prepare('SELECT id,user_id,name,data,created_at FROM templates WHERE id = ?')
        .get(id)

      if (!row) return res.status(404).json({ error: 'Not found' })

      return res.json({
        id: row.id,
        name: row.name,
        data: JSON.parse(row.data || '{}'),
        created_at: row.created_at
      })
    } catch (e) {
      const storage = require('../../../lib/storage')
      const row = storage.getTemplate(id)

      if (!row) return res.status(404).json({ error: 'Not found' })

      return res.json({
        id: row.id,
        name: row.name,
        data: JSON.parse(row.data || '{}'),
        created_at: row.created_at
      })
    }
  }

  if (req.method === 'DELETE') {
    try {
      const auth = await verifyAuth(req)

      const row = db
        .prepare('SELECT id,user_id FROM templates WHERE id = ?')
        .get(id)

      if (!row) return res.status(404).json({ error: 'Not found' })
      if (auth && auth.sub !== row.user_id) {
        return res.status(403).json({ error: 'Forbidden' })
      }

      db.prepare('DELETE FROM templates WHERE id = ?').run(id)
      return res.status(204).end()
    } catch (e) {
      const storage = require('../../../lib/storage')
      const auth = await verifyAuth(req)
      const row = storage.getTemplate(id)

      if (!row) return res.status(404).json({ error: 'Not found' })
      if (auth && auth.sub !== row.user_id) {
        return res.status(403).json({ error: 'Forbidden' })
      }

      storage.deleteTemplate(id)
      return res.status(204).end()
    }
  }

  return res.status(405).end()
}
