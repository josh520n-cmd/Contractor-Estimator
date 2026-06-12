const jwt = require('jsonwebtoken')

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret'

let firebaseAdminReady = false
let adminAuth = null

try {
  const { initializeApp, getApps } = require('firebase-admin/app')
  const { getAuth } = require('firebase-admin/auth')

  if (!getApps().length) {
    initializeApp()
  }

  adminAuth = getAuth()
  firebaseAdminReady = true
} catch (e) {
  console.error('Firebase Admin unavailable:', e.message)
}

async function verifyAuth(req) {
  const header = req.headers.authorization || ''
  const token = header.startsWith('Bearer ') ? header.slice(7) : null

  if (!token) return null

  if (firebaseAdminReady && adminAuth) {
    try {
      const decoded = await adminAuth.verifyIdToken(token)
      return {
        sub: decoded.uid,
        email: decoded.email || ''
      }
    } catch (e) {
      console.error('Firebase token verify failed:', e.message)
    }
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET)
    return decoded
  } catch (e) {
    console.error('JWT verify failed:', e.message)
    return null
  }
}

module.exports = { verifyAuth }
