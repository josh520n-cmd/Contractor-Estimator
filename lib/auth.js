const { initializeApp, getApps, cert } = require('firebase-admin/app')
const { getAuth } = require('firebase-admin/auth')

if (!getApps().length) {
  initializeApp()
}

async function verifyAuth(req) {
  const header = req.headers.authorization || ''
  const token = header.startsWith('Bearer ') ? header.slice(7) : null

  if (!token) return null

  try {
    const decoded = await getAuth().verifyIdToken(token)
    return {
      sub: decoded.uid,
      email: decoded.email || ''
    }
  } catch (e) {
    console.error('Firebase token verify failed:', e.message)
    return null
  }
}

module.exports = { verifyAuth }
