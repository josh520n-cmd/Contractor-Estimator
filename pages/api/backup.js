import { collection, getDocs } from 'firebase/firestore'
import { db } from '../../lib/firebase'

export default async function handler(req, res) {
  try {
    if (req.method !== 'GET') {
      return res.status(405).json({ error: 'Method not allowed' })
    }

    const snap = await getDocs(collection(db, 'quotes'))

    const quotes = snap.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }))

    return res.status(200).json({
      exportedAt: new Date().toISOString(),
      count: quotes.length,
      quotes,
    })
  } catch (err) {
    console.error('BACKUP ERROR:', err)
    return res.status(500).json({ error: err.message || 'Backup failed' })
  }
}
