import { v4 as uuidv4 } from 'uuid'
import db from '../../../lib/db'
const { verifyAuth } = require('../../../lib/auth')

export default function handler(req, res) {
  const auth = verifyAuth(req)
  const user_id = auth ? auth.sub : null
  
  if (!user_id) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  if (req.method === 'GET') {
    try {
      const row = db.prepare('SELECT id, user_id, logo_data, tax_rate, company_name, company_address, company_phone, created_at, updated_at FROM company_settings WHERE user_id = ?').get(user_id)
      if (!row) return res.json({ logo_data: null, tax_rate: 0, company_name: '', company_address: '', company_phone: '' })
      return res.json(row)
    } catch (e) {
      // Fall back to localStorage
      const storage = require('../../../lib/storage')
      const row = storage.getCompanySettings(user_id)
      if (!row) return res.json({ logo_data: null, tax_rate: 0, company_name: '', company_address: '', company_phone: '' })
      return res.json(row)
    }
  }

  if (req.method === 'PUT') {
    try {
      const payload = req.body || {}
      const now = new Date().toISOString()
      
      // Check if settings exist
      const existing = db.prepare('SELECT id FROM company_settings WHERE user_id = ?').get(user_id)
      
      if (existing) {
        db.prepare('UPDATE company_settings SET logo_data = ?, tax_rate = ?, company_name = ?, company_address = ?, company_phone = ?, updated_at = ? WHERE user_id = ?')
          .run(payload.logo_data || null, payload.tax_rate || 0, payload.company_name || '', payload.company_address || '', payload.company_phone || '', now, user_id)
      } else {
        const id = uuidv4()
        db.prepare('INSERT INTO company_settings (id,user_id,logo_data,tax_rate,company_name,company_address,company_phone,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?)')
          .run(id, user_id, payload.logo_data || null, payload.tax_rate || 0, payload.company_name || '', payload.company_address || '', payload.company_phone || '', now, now)
      }
      
      return res.json({ updated: true })
    } catch (e) {
      // Fall back to localStorage
      const storage = require('../../../lib/storage')
      const payload = req.body || {}
      const now = new Date().toISOString()
      
      const existing = storage.getCompanySettings(user_id)
      if (existing) {
        storage.updateCompanySettings(user_id, payload.logo_data || null, payload.tax_rate || 0, payload.company_name || '', payload.company_address || '', payload.company_phone || '', now)
      } else {
        const id = uuidv4()
        storage.createCompanySettings(id, user_id, payload.logo_data || null, payload.tax_rate || 0, payload.company_name || '', payload.company_address || '', payload.company_phone || '', now, now)
      }
      
      return res.json({ updated: true })
    }
  }

  res.status(405).end()
}
