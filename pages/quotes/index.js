import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'

function formatDate(value) {
  try {
    return new Date(value).toLocaleString()
  } catch {
    return value
  }
}

function formatMoney(value) {
  return '$' + Number(value || 0).toFixed(2)
}

export default function QuotesListPage() {
  const [quotes, setQuotes] = useState(null)
  const [localQuotes, setLocalQuotes] = useState([])
  const [search, setSearch] = useState('')
  const [error, setError] = useState('')
  const [processing, setProcessing] = useState(null)

  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
  const headers = token ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' }

  function loadLocalQuotes() {
    if (typeof window === 'undefined') return

    const local = Object.entries(localStorage)
      .filter(([key]) => key.startsWith('quotes_'))
      .map(([key, value]) => {
        try {
          const parsed = JSON.parse(value)
          const payload = parsed.payload || parsed
          return {
            id: key.replace(/^quotes_/, ''),
            client: parsed.client || payload.client || '',
            created_at: parsed.createdAt || parsed.created_at || new Date().toISOString(),
            status: payload.status || '',
            total: Number(payload?.totals?.grandTotal || payload?.totals?.total || 0),
            payload
          }
        } catch (e) {
          return null
        }
      })
      .filter(Boolean)

    setLocalQuotes(local)
  }

  async function loadQuotes() {
    setError('')
    try {
      const res = await fetch('/api/quotes', { headers })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to load quotes')
      setQuotes(data)
    } catch (err) {
      console.error(err)
      setError('Unable to load quotes right now. Please refresh.')
      setQuotes([])
    }
  }

  useEffect(() => {
    loadQuotes()
    loadLocalQuotes()
  }, [])

  const filteredQuotes = useMemo(() => {
    const merged = quotes === null
      ? localQuotes
      : [
          ...quotes,
          ...localQuotes.filter((local) => !quotes.some((quote) => quote.id === local.id))
        ]

    const query = search.trim().toLowerCase()
    if (!query) return merged
    return merged.filter((quote) => {
      const id = quote.id.toLowerCase()
      const client = (quote.client || '').toLowerCase()
      const status = (quote.status || '').toLowerCase()
      const date = formatDate(quote.created_at).toLowerCase()
      return id.includes(query) || client.includes(query) || status.includes(query) || date.includes(query)
    })
  }, [quotes, localQuotes, search])

  async function downloadBackup() {
    const res = await fetch('/api/backup')
    const data = await res.json()
  
    const blob = new Blob(
      [JSON.stringify(data, null, 2)],
      { type: 'application/json' }
    )
  
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `contractor-estimator-backup-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
  
    URL.revokeObjectURL(url)
  }

  async function restoreBackup(e) {
    const file = e.target.files?.[0]
    if (!file) return
  
    if (!confirm('Restore this backup? Existing quotes with the same ID may be overwritten.')) {
      return
    }
  
    try {
      const text = await file.text()
      const backup = JSON.parse(text)
  
      const res = await fetch('/api/restore-backup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(backup),
      })
  
      const result = await res.json()
  
      if (!res.ok) {
        alert(result.error || 'Restore failed')
        return
      }
  
      alert(`Backup restored. Quotes restored: ${result.restored}`)
      await loadQuotes()
    } catch (err) {
      alert(err.message || 'Restore failed')
    }
  }

  async function duplicateQuote(id) {
    setProcessing(id)
    try {
      const res = await fetch(`/api/quotes/${id}/duplicate`, { method: 'POST', headers })
      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || 'Duplicate failed')
      }
      await loadQuotes()
    } catch (err) {
      console.error(err)
      setError('Unable to duplicate quote. Please try again.')
    } finally {
      setProcessing(null)
    }
  }

  async function deleteQuote(id) {
    console.log("DELETE ID:", id)
  
    if (!confirm("Delete this quote?")) return
  
    const res = await fetch(`/api/quotes/${id}`, {
      method: "DELETE"
    })
  
    console.log("DELETE STATUS:", res.status)
  
    const result = await res.json()
console.log("DELETE RESPONSE:", result)

if (!res.ok) {
  alert(result.error || 'Delete failed')
  return
}
    localStorage.removeItem('quotes_' + id)

const latest = localStorage.getItem('latestEstimate')
if (latest && latest.includes(id)) {
  localStorage.removeItem('latestEstimate')
}
    setQuotes(prev => prev.filter(q => q.id !== id))
    const router = useRouter()
  }
  async function toggleArchive(id, currentStatus) {
    setProcessing(id)
    try {
      const newStatus = currentStatus === 'archived' ? 'active' : 'archived'
      const res = await fetch(`/api/quotes/${id}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ status: newStatus })
      })
      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || 'Archive update failed')
      }
      await loadQuotes()
    } catch (err) {
      console.error(err)
      setError('Unable to update quote status. Please try again.')
    } finally {
      setProcessing(null)
    }
  }

  return (
    <main className="container quotes-page">
      <div className="page-header">
        <div>
          <h1>Your Quotes</h1>
          <p>Review saved estimates and open them for editing or download.</p>
        </div>
        <Link href="/" className="primary">
          Create New Estimate
        </Link>
        <button onClick={downloadBackup} className="secondary">
  Download Backup
</button>
<label className="secondary" style={{ display: 'inline-block', padding: '10px 14px', cursor: 'pointer' }}>
  Restore Backup
  <input
    type="file"
    accept=".json,application/json"
    onChange={restoreBackup}
    style={{ display: 'none' }}
  />
</label>
      </div>

      <div className="search-panel">
        <input
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search by client, quote id, status, or date"
          className="search-input"
        />
      </div>

      {error && <p style={{ color: '#b00', marginBottom: '18px' }}>{error}</p>}

      {quotes === null ? (
        <p>Loading quotes…</p>
      ) : filteredQuotes.length === 0 ? (
        <section className="estimator">
          <p>No quotes found.</p>
          {quotes.length > 0 ? (
            <p>Try a different search term.</p>
          ) : (
            <p>
              Use the <Link href="/">estimate builder</Link> to create your first quote.
            </p>
          )}
        </section>
      ) : (
        <table className="quote-list-table">
          <thead>
            <tr>
              <th>Quote</th>
              <th>Client</th>
              <th>Status</th>
              <th>Total</th>
              <th>Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredQuotes.map((quote) => {
              const isProcessing = processing === quote.id
              const isArchived = quote.status === 'archived'
              return (
                <tr key={quote.id} className={isArchived ? 'archived-row' : ''}>
                  <td>
                    <Link href={`/quotes/${quote.id}`}>
                      {quote.id.slice(0, 8)}
                    </Link>
                  </td>
                  <td>{quote.client || 'Unnamed client'}</td>
                  <td>{quote.status || 'Unknown'}</td>
                  <td>{formatMoney(quote.total)}</td>
                  <td>{formatDate(quote.created_at)}</td>
                  <td className="table-actions">
                    <Link href={`/quotes/${quote.id}`} className="secondary">
                      Open
                    </Link>
                    <button onClick={() => duplicateQuote(quote.id)} disabled={isProcessing} className="secondary">
                      Duplicate
                    </button>
                    <button onClick={() => deleteQuote(quote.id)} disabled={isProcessing} className="secondary">
                      Delete
                    </button>
                    <button onClick={() => toggleArchive(quote.id, quote.status)} disabled={isProcessing} className="secondary">
                      {isArchived ? 'Restore' : 'Archive'}
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      )}
    </main>
  )
}
