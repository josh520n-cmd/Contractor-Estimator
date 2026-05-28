import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import db from '../../../lib/db'

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret'

export default function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()
  const { email, password } = req.body || {}
  if (!email || !password) return res.status(400).json({ error: 'email and password required' })

  const user = db.prepare('SELECT id,email,password,name FROM users WHERE email = ?').get(email)
  if (!user) return res.status(401).json({ error: 'Invalid credentials' })

  const ok = bcrypt.compareSync(password, user.password)
  if (!ok) return res.status(401).json({ error: 'Invalid credentials' })

  const token = jwt.sign({ sub: user.id, email: user.email }, JWT_SECRET, { expiresIn: '30d' })
  res.json({ id: user.id, email: user.email, name: user.name, token })
}
