const jwt = require('jsonwebtoken')

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret'

function verifyAuth(req) {
  const h = req.headers && (req.headers.authorization || req.headers.Authorization)
  if (!h) return null
  const parts = h.split(' ')
  if (parts.length !== 2) return null
  const token = parts[1]
  try {
    const decoded = jwt.verify(token, JWT_SECRET)
    return decoded
  } catch (e) {
    return null
  }
}

module.exports = { verifyAuth }
