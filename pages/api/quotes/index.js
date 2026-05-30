import { v4 as uuidv4 } from 'uuid'
import db from '../../../lib/db'
import storage from '../../../lib/storage'
const { verifyAuth } = require('../../../lib/auth')

function parseEstimateNumber(value) {
  if (!value) return null
  const match = /^est[-.](\d{4,6})$/i.exec(value)
  return match ? Number(match[1]) : null
}

function serializeRow(row) {
  const payload = JSON.parse(row.data || '{}')
  const totals = payload?.totals || {}
  return {
    id: row.id,
    client: row.client,
    created_at: row.created_at,
    status: payload?.status || '',
    estimateNumber: payload?.estimateNumber || '',
    total: Number(totals.grandTotal || totals.total || 0)
  }
}

function getNextEstimateNumberFromRows(rows) {
  let maxNumber = 1000
  for (const row of rows) {
    try {
      const payload = JSON.parse(row.data || '{}')
      const current = parseEstimateNumber(payload?.estimateNumber)
      if (current != null && current > maxNumber) maxNumber = current
    } catch (e) {}
  }
  return `Est-${maxNumber + 1}`
}

function getNextEstimateNumber(user_id) {
  try {
    const rows = user_id
      ? db.prepare('SELECT data FROM quotes WHERE user_id = ?').all(user_id)
      : db.prepare('SELECT data FROM quotes').all()
    return getNextEstimateNumberFromRows(rows)
  } catch (e) {
    const rows = storage.getAllQuotes().filter(q => !user_id || q.user_id === user_id)
    return getNextEstimateNumberFromRows(rows)
  }
}

export default function handler(req, res) {
  if (req.method === 'GET') {
    const auth = verifyAuth(req)
    const user_id = auth ? auth.sub : null

    try {
      const rows = user_id
        ? db.prepare('SELECT id, client, created_at, data FROM quotes WHERE user_id = ? ORDER BY created_at DESC').all(user_id)
        : db.prepare('SELECT id, client, created_at, data FROM quotes ORDER BY created_at DESC').all()
      return res.json(rows.map(serializeRow))
    } catch (e) {
      // Fall back to localStorage
      const rows = storage.getAllQuotes()
        .filter(q => !user_id || q.user_id === user_id)
        .map(q => {
          const payload = JSON.parse(q.data || '{}')
          const totals = payload?.totals || {}
          return {
            id: q.id,
            client: q.client,
            created_at: q.created_at,
            status: payload?.status || '',
            total: Number(totals.grandTotal || totals.total || 0)
          }
        })
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
    const savedPayload = { ...payload }
    if (!savedPayload.estimateNumber) {
      savedPayload.estimateNumber = getNextEstimateNumber(user_id)
    }
    const data = JSON.stringify(savedPayload)
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
