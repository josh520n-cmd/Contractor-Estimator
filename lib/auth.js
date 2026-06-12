const jwt = require('jsonwebtoken')

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret'

let firebaseAdminReady = false
let adminAuth = null

try {
  const { initializeApp, getApps, cert } = require('firebase-admin/app')
  const { getAuth } = require('firebase-admin/auth')

  if (!getApps().length) {
    console.log('PROJECT_ID:', process.env.FIREBASE_PROJECT_ID)
console.log('CLIENT_EMAIL_EXISTS:', !!process.env.FIREBASE_CLIENT_EMAIL)
console.log('PRIVATE_KEY_EXISTS:', !!process.env.FIREBASE_PRIVATE_KEY)
    initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')
      })
    })
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
