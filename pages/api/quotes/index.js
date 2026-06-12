import { collection, addDoc, getDocs, query, orderBy } from 'firebase/firestore'
import { db } from '../../lib/firebase'

function parseEstimateNumber(value) {
  if (!value) return null
  const match = /^est[-.](\d{4,6})$/i.exec(value)
  return match ? Number(match[1]) : null
}

function getNextEstimateNumberFromQuotes(quotes) {
  let maxNumber = 1000

  for (const quote of quotes) {
    const current = parseEstimateNumber(quote.estimateNumber)
    if (current != null && current > maxNumber) maxNumber = current
  }

  return `Est-${maxNumber + 1}`
}

export default async function handler(req, res) {
  try {
    if (req.method === 'GET') {
      const q = query(collection(db, 'quotes'), orderBy('createdAt', 'desc'))
      const snap = await getDocs(q)

      const quotes = snap.docs.map(docSnap => {
        const data = docSnap.data()
        const totals = data.totals || data.payload?.totals || {}

        return {
          id: docSnap.id,
          ...data,
          client: data.client || data.payload?.client || '',
          created_at: data.createdAt || data.created_at || '',
          status: data.status || data.payload?.status || '',
          estimateNumber: data.estimateNumber || data.payload?.estimateNumber || '',
          total: Number(totals.grandTotal || totals.total || 0),
          startDate: data.startDate || data.payload?.startDate || '',
          dueDate: data.dueDate || data.payload?.dueDate || '',
        }
      })

      return res.status(200).json(quotes)
    }

    if (req.method === 'POST') {
      const payload = req.body || {}

      const existingSnap = await getDocs(collection(db, 'quotes'))
      const existingQuotes = existingSnap.docs.map(docSnap => docSnap.data())

      const savedPayload = {
        ...payload,
        estimateNumber:
          payload.estimateNumber || getNextEstimateNumberFromQuotes(existingQuotes),
        createdAt: new Date().toISOString(),
      }

      const docRef = await addDoc(collection(db, 'quotes'), savedPayload)

      return res.status(201).json({
        id: docRef.id,
        ...savedPayload,
      })
    }

    return res.status(405).json({ error: 'Method not allowed' })
  } catch (err) {
    console.error('QUOTES API ERROR:', err)
    return res.status(500).json({
      error: err.message || 'Quotes API failed',
    })
  }
}
