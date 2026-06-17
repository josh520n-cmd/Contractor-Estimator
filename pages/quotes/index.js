import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'

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
  const router = useRouter()
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
router.reload()
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
    <main className="saved-quotes-page">
      <section className="saved-quotes-header">
        <div>
          <p className="eyebrow">Saved work</p>
          <h1>Saved Quotes</h1>
          <p>Review saved estimates, duplicate past jobs, archive old quotes, and keep your work organized.</p>
        </div>
  
        <div className="saved-quotes-actions">
          <Link href="/estimate" className="new-quote-btn">
            + New Estimate
          </Link>
  
          <button onClick={downloadBackup} className="backup-btn">
            Download Backup
          </button>
  
          <label className="restore-btn">
            Restore Backup
            <input
              type="file"
              accept=".json,application/json"
              onChange={restoreBackup}
              style={{ display: "none" }}
            />
          </label>
        </div>
      </section>
  
      <section className="quotes-stats">
        <div className="quote-stat-card">
          <span>Total Quotes</span>
          <strong>{filteredQuotes.length}</strong>
        </div>
  
        <div className="quote-stat-card">
          <span>Total Value</span>
          <strong>
            {formatMoney(
              filteredQuotes.reduce((sum, quote) => sum + Number(quote.total || 0), 0)
            )}
          </strong>
        </div>
  
        <div className="quote-stat-card">
          <span>Archived</span>
          <strong>
            {filteredQuotes.filter((quote) => quote.status === "archived").length}
          </strong>
        </div>
      </section>
  
      <section className="search-panel-pro">
        <input
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search by client, quote id, status, or date..."
          className="search-input-pro"
        />
      </section>
  
      {error && <p className="quotes-error">{error}</p>}
  
      {quotes === null ? (
        <section className="empty-quotes-card">
          <div className="empty-icon">⏳</div>
          <h2>Loading quotes...</h2>
          <p>Pulling your saved estimates now.</p>
        </section>
      ) : filteredQuotes.length === 0 ? (
        <section className="empty-quotes-card">
          <div className="empty-icon">📄</div>
          <h2>No quotes found</h2>
          {quotes.length > 0 ? (
            <p>Try a different search term.</p>
          ) : (
            <p>
              Use the <Link href="/estimate">estimate builder</Link> to create your first quote.
            </p>
          )}
  
          <Link href="/estimate" className="empty-action-btn">
            Create Estimate
          </Link>
        </section>
      ) : (
        <section className="quotes-grid">
          {filteredQuotes.map((quote) => {
            const isProcessing = processing === quote.id
            const isArchived = quote.status === "archived"
  
            return (
              <article
                className={`quote-card ${isArchived ? "archived-card" : ""}`}
                key={quote.id}
              >
                <div className="quote-card-top">
                  <div>
                    <h2>{quote.client || "Unnamed client"}</h2>
                    <p>Quote ID: {quote.id.slice(0, 8)}</p>
                  </div>
  
                  <span className={`quote-status ${isArchived ? "archived" : "active"}`}>
                    {quote.status || "Active"}
                  </span>
                </div>
  
                <div className="quote-card-details">
                  <div>
                    <span>Total</span>
                    <strong>{formatMoney(quote.total)}</strong>
                  </div>
  
                  <div>
                    <span>Date Created</span>
                    <strong>{formatDate(quote.created_at)}</strong>
                  </div>
                </div>
  
                <div className="quote-card-actions">
                  <Link href={`/quotes/${quote.id}`} className="view-quote-btn">
                    Open
                  </Link>
  
                  <button
                    onClick={() => duplicateQuote(quote.id)}
                    disabled={isProcessing}
                    className="edit-quote-btn"
                  >
                    Duplicate
                  </button>
  
                  <button
                    onClick={() => toggleArchive(quote.id, quote.status)}
                    disabled={isProcessing}
                    className="archive-quote-btn"
                  >
                    {isArchived ? "Restore" : "Archive"}
                  </button>
  
                  <button
                    onClick={() => deleteQuote(quote.id)}
                    disabled={isProcessing}
                    className="delete-quote-btn"
                  >
                    Delete
                  </button>
                </div>
              </article>
            )
          })}
        </section>
      )}
    </main>
  )
}
