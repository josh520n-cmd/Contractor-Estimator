import { useEffect, useState } from 'react'
import Link from 'next/link'

function formatDate(value) {
  try {
    return new Date(value).toLocaleString()
  } catch {
    return value
  }
}

export default function QuotesListPage() {
  const [quotes, setQuotes] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
    const headers = token ? { Authorization: `Bearer ${token}` } : {}

    fetch('/api/quotes', { headers })
      .then(async (res) => {
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || 'Failed to load quotes')
        setQuotes(data)
      })
      .catch((err) => {
        console.error(err)
        setError('Unable to load quotes right now. Please refresh.')
        setQuotes([])
      })
  }, [])

  return (
    <main className="container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', marginBottom: '18px' }}>
        <div>
          <h1>Your Quotes</h1>
          <p>Review saved estimates and open them for editing or download.</p>
        </div>
        <Link href="/" className="primary">
          Create New Estimate
        </Link>
      </div>

      {error && <p style={{ color: '#b00', marginBottom: '18px' }}>{error}</p>}

      {quotes === null ? (
        <p>Loading quotes…</p>
      ) : quotes.length === 0 ? (
        <section className="estimator">
          <p>No saved quotes found.</p>
          <p>
            Use the <Link href="/">estimate builder</Link> to create your first quote.
          </p>
        </section>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Quote</th>
              <th>Client</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {quotes.map((quote) => (
              <tr key={quote.id}>
                <td>
                  <Link href={`/quotes/${quote.id}`}>
                    {quote.id.slice(0, 8)}
                  </Link>
                </td>
                <td>{quote.client || 'Unnamed client'}</td>
                <td>{formatDate(quote.created_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </main>
  )
}
