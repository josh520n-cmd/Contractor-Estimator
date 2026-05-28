import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { v4 as uuidv4 } from 'uuid'
import db from '../../../lib/db'

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret'

export default function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()
  const { email, password, name } = req.body || {}
  if (!email || !password) return res.status(400).json({ error: 'email and password required' })

  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email)
  if (existing) return res.status(409).json({ error: 'User exists' })

  const hashed = bcrypt.hashSync(password, 10)
  const id = uuidv4()
  const now = new Date().toISOString()
  db.prepare('INSERT INTO users (id,email,password,name,created_at) VALUES (?,?,?,?,?)').run(id, email, hashed, name || '', now)

  const token = jwt.sign({ sub: id, email }, JWT_SECRET, { expiresIn: '30d' })
  res.status(201).json({ id, email, name, token })
}
