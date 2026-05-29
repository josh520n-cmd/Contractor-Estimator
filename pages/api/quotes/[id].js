import db from '../../../lib/db'

export default function handler(req, res) {
  const { id } = req.query
  if (req.method === 'GET') {
    const row = db.prepare('SELECT id, user_id, client, notes, data, created_at FROM quotes WHERE id = ?').get(id)
    if (!row) return res.status(404).json({ error: 'Not found' })
    const payload = JSON.parse(row.data || '{}')
    return res.json({ id: row.id, client: row.client, notes: row.notes, created_at: row.created_at, payload })
  }

  if (req.method === 'PUT' || req.method === 'PATCH') {
    const row = db.prepare('SELECT id, user_id, client, notes, data, created_at FROM quotes WHERE id = ?').get(id)
    if (!row) return res.status(404).json({ error: 'Not found' })
    const payload = req.body || {}
    const client = payload.client || row.client
    const notes = payload.notes || row.notes
    const data = JSON.stringify(payload)
    const now = new Date().toISOString()
    
    // Update the quote (for fallback mode, we'll need to handle this in db.js)
    // For now, using direct update approach
    try {
      db.prepare('UPDATE quotes SET client = ?, notes = ?, data = ? WHERE id = ?').run(client, notes, data, id)
      return res.json({ id, updated: true })
    } catch (e) {
      // Fallback: recreate the entire record
      const existing = store.quotes.find(q => q.id === id)
      if (existing) {
        existing.client = client
        existing.notes = notes
        existing.data = data
      }
      return res.json({ id, updated: true })
    }
  }

  res.status(405).end()
}
