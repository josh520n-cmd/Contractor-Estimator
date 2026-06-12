import { v4 as uuidv4 } from 'uuid'
import db from '../../../../lib/db'
const { verifyAuth } = require('../../../../lib/auth')

export default async function handler(req, res) {
  const { id } = req.query

  if (req.method === 'POST') {
    const row = db.prepare('SELECT id, user_id, client, notes, data, created_at FROM quotes WHERE id = ?').get(id)
    if (!row) return res.status(404).json({ error: 'Not found' })

    const newId = uuidv4()
    const now = new Date().toISOString()
    const auth = await verifyAuth(req)
    const user_id = auth ? auth.sub : row.user_id
    
    // Create a copy with modified client name
    const clientName = (row.client || 'Quote') + ' (Copy)'
    const data = row.data

    db.prepare('INSERT INTO quotes (id,user_id,client,notes,data,created_at) VALUES (?,?,?,?,?,?)').run(newId, user_id, clientName, row.notes, data, now)
    return res.status(201).json({ id: newId })
  }

  res.status(405).end()
}
