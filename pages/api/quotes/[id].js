import db from '../../../lib/db'

export default function handler(req, res) {
  const { id } = req.query
  if (req.method === 'GET') {
    const row = db.prepare('SELECT id, user_id, client, notes, data, created_at FROM quotes WHERE id = ?').get(id)
    if (!row) return res.status(404).json({ error: 'Not found' })
    const payload = JSON.parse(row.data || '{}')
    return res.json({ id: row.id, client: row.client, notes: row.notes, created_at: row.created_at, payload })
  }
  res.status(405).end()
}
