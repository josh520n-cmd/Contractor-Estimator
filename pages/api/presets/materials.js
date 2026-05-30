import { v4 as uuidv4 } from 'uuid'
import db from '../../../lib/db'
const { verifyAuth } = require('../../../lib/auth')

export default function handler(req, res) {
  if (req.method === 'GET') {
    try {
      const auth = verifyAuth(req)
      const user_id = auth ? auth.sub : null
      
      const rows = user_id
        ? db.prepare('SELECT id, name, description, qty, unit_price, created_at FROM material_presets WHERE user_id = ? ORDER BY created_at DESC').all(user_id)
        : db.prepare('SELECT id, name, description, qty, unit_price, created_at FROM material_presets ORDER BY created_at DESC').all()
      
      return res.json(rows || [])
    } catch (e) {
      // Fall back to localStorage
      const storage = require('../../../lib/storage')
      const auth = verifyAuth(req)
      const user_id = auth ? auth.sub : null
      const presets = user_id ? storage.getUserMaterialPresets(user_id) : storage.getAllMaterialPresets()
      return res.json(presets || [])
    }
  }

  if (req.method === 'POST') {
    const payload = req.body || {}
    const id = uuidv4()
    const now = new Date().toISOString()
    const auth = verifyAuth(req)
    const user_id = auth ? auth.sub : null
    const name = payload.name || 'Material'
    const description = payload.description || ''
    const qty = payload.qty || 0
    const unit_price = payload.unit_price || 0

    try {
      db.prepare('INSERT INTO material_presets (id,user_id,name,description,qty,unit_price,created_at) VALUES (?,?,?,?,?,?,?)').run(id, user_id, name, description, qty, unit_price, now)
      return res.status(201).json({ id })
    } catch (e) {
      // Fall back to localStorage
      const storage = require('../../../lib/storage')
      storage.createMaterialPreset(id, user_id, name, description, qty, unit_price, now)
      return res.status(201).json({ id })
    }
  }

  res.status(405).end()
}
