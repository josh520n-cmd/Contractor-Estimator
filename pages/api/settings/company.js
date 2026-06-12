const { verifyAuth } = require('../../../lib/auth')
const { initializeApp, getApps, cert } = require('firebase-admin/app')
const { getFirestore } = require('firebase-admin/firestore')

if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')
    })
  })
}

const adminDb = getFirestore()

const emptySettings = {
  logo_data: null,
  tax_rate: 0,
  company_name: '',
  company_address: '',
  company_phone: ''
}

export default async function handler(req, res) {
  const auth = await verifyAuth(req)
  const user_id = auth ? auth.sub : null

  if (!user_id) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  const ref = adminDb.collection('company_settings').doc(user_id)

  if (req.method === 'GET') {
    const snap = await ref.get()

    if (!snap.exists) {
      return res.json(emptySettings)
    }

    return res.json({
      ...emptySettings,
      ...snap.data()
    })
  }

  if (req.method === 'PUT') {
    const payload = req.body || {}
    const now = new Date().toISOString()

    const data = {
      logo_data: payload.logo_data || null,
      tax_rate: Number(payload.tax_rate || 0),
      company_name: payload.company_name || '',
      company_address: payload.company_address || '',
      company_phone: payload.company_phone || '',
      updated_at: now
    }

    const snap = await ref.get()

    if (!snap.exists) {
      data.created_at = now
      data.user_id = user_id
    }

    await ref.set(data, { merge: true })

    return res.json({ updated: true })
  }

  return res.status(405).end()
}
