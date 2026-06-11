import { doc, setDoc } from 'firebase/firestore'
import { db } from '../../lib/firebase'

export default async function handler(req, res) {
  try {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' })
    }

    const backup = req.body

    if (!backup?.quotes || !Array.isArray(backup.quotes)) {
      return res.status(400).json({ error: 'Invalid backup file' })
    }

    let restored = 0

    for (const quote of backup.quotes) {
      if (!quote.id) continue

      const { id, ...quoteData } = quote

      await setDoc(doc(db, 'quotes', id), {
        ...quoteData,
        restoredAt: new Date().toISOString(),
      }, { merge: true })

      restored++
    }

    return res.status(200).json({
      success: true,
      restored,
    })
  } catch (err) {
    console.error('RESTORE BACKUP ERROR:', err)
    return res.status(500).json({ error: err.message || 'Restore failed' })
  }
}
