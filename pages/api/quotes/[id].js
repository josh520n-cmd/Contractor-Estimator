import { doc, getDoc, updateDoc, deleteDoc } from 'firebase/firestore'
import { db } from '../../../lib/firebase'

export default async function handler(req, res) {
  const { id } = req.query

  if (!id) {
    return res.status(400).json({ error: 'Missing quote id' })
  }

  try {
    const quoteRef = doc(db, 'quotes', id)

    if (req.method === 'GET') {
      const snap = await getDoc(quoteRef)

      if (!snap.exists()) {
        return res.status(404).json({ error: 'Quote not found' })
      }

      const data = snap.data()

      return res.status(200).json({
        id: snap.id,
        ...data,
        payload: data.payload || data
      })
    }

    if (req.method === 'PUT' || req.method === 'PATCH') {
      const payload = req.body || {}

      await updateDoc(quoteRef, {
        ...payload,
        updatedAt: new Date().toISOString()
      })

      return res.status(200).json({
        id,
        updated: true
      })
    }

    if (req.method === 'DELETE') {
      await deleteDoc(quoteRef)

      return res.status(200).json({
        id,
        deleted: true
      })
    }

    return res.status(405).json({ error: 'Method not allowed' })
  } catch (err) {
    console.error('QUOTE API ERROR:', err)

    return res.status(500).json({
      error: err.message || 'Quote API failed'
    })
  }
}
