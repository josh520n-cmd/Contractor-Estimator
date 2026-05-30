import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'

function formatMoney(n) { return '$' + Number(n || 0).toFixed(2) }

export default function QuotePage() {
  const router = useRouter()
  const { id } = router.query
  const [data, setData] = useState(null)

  useEffect(() => {
    if (!id) return

    async function loadQuote() {
      try {
        const res = await fetch(`/api/quotes/${id}`)
        if (!res.ok) throw new Error('Quote not found')
        const json = await res.json()
        setData(json)
      } catch (e) {
        if (typeof window !== 'undefined') {
          const localValue = localStorage.getItem('quotes_' + id)
          if (localValue) {
            try {
              const parsed = JSON.parse(localValue)
              const payload = parsed.payload || parsed
              setData({
                id,
                client: parsed.client || payload.client || '',
                notes: parsed.notes || payload.notes || '',
                created_at: parsed.createdAt || parsed.created_at || new Date().toISOString(),
                payload
              })
              return
            } catch (err) {
              console.error('Failed to parse local quote', err)
            }
          }
        }
        setData({ error: 'Quote not found' })
      }
    }

    loadQuote()
  }, [id])

  async function duplicateQuote() {
    const res = await fetch(`/api/quotes/${id}/duplicate`, { method: 'POST' })
    if (res.ok) {
      const { id: newId } = await res.json()
      router.push(`/quotes/${newId}`)
    } else {
      alert('Duplicate failed')
    }
  }

  function editQuote() {
    router.push(`/edit/${id}`)
  }

  if (!data) return <main className="container"><p>Loading...</p></main>
  if (data.error) return <main className="container"><p>{data.error}</p></main>

  const { client, notes, created_at, payload = {} } = data
  const items = payload.items || []
  const laborTasks = payload.laborTasks || []
  const totals = payload.totals || {}
  const phone = data.phone || payload.phone || ''
  const email = data.email || payload.email || ''
  const jobAddress = data.jobAddress || payload.jobAddress || ''
  const estimateNumber = data.estimateNumber || payload.estimateNumber || ''
  const statusValue = data.status || payload.status || ''
  const companySettings = payload.companySettings || {}

  return (
    <main className="printable">
      <div className="print-actions">
        <button onClick={() => window.location.href = `/api/quotes/${id}/pdf`}>Download PDF</button>
        <button onClick={() => window.open(`/api/quotes/${id}/pdf`, '_blank')}>Open PDF</button>
        <button onClick={editQuote} className="secondary">Edit Quote</button>
        <button onClick={duplicateQuote} className="secondary">Duplicate Quote</button>
        <button onClick={() => router.push('/print')}>Preview from local</button>
      </div>
      <header>
        <h1>Saved Quote</h1>
        {companySettings.company_name && (
          <div style={{ marginBottom: '12px' }}>
            <strong>{companySettings.company_name}</strong>
            {companySettings.company_address && <div>{companySettings.company_address}</div>}
            {companySettings.company_phone && <div>{companySettings.company_phone}</div>}
          </div>
        )}
        <div>Client: <strong>{client}</strong></div>
        {phone && <p>Phone: {phone}</p>}
        {email && <p>Email: {email}</p>}
        {jobAddress && <p>Job Address: {jobAddress}</p>}
        {estimateNumber && <p>Estimate #: {estimateNumber}</p>}
        {statusValue && <p>Status: {statusValue}</p>}
        <div>Date: <strong>{new Date(created_at).toLocaleString()}</strong></div>
      </header>

      <section>
        <h2>Items</h2>
        <table className="print-table">
          <thead><tr><th>Description</th><th>Qty</th><th>Unit</th><th>Line</th></tr></thead>
          <tbody>
            {items.map((it, i) => (
              <tr key={i}><td>{it.desc}</td><td>{it.qty}</td><td>{formatMoney(it.unit)}</td><td>{formatMoney((Number(it.qty)||0)*(Number(it.unit)||0))}</td></tr>
            ))}
          </tbody>
        </table>
      </section>

      {laborTasks.length > 0 && (
        <section>
          <h2>Labor Tasks</h2>
          <table className="print-table">
            <thead><tr><th>Description</th><th>Hours</th><th>Rate</th><th>Line</th></tr></thead>
            <tbody>
              {laborTasks.map((task, i) => (
                <tr key={i}>
                  <td>{task.desc}</td>
                  <td>{task.hours}</td>
                  <td>{formatMoney(task.rate)}</td>
                  <td>{formatMoney((Number(task.hours)||0)*(Number(task.rate)||0))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      <section>
        <h2>Summary</h2>
        <div>Materials: <strong>{formatMoney(totals.materialTotal)}</strong></div>
        <div>Waste buffer: <strong>{formatMoney(totals.wasteAmount)}</strong></div>
        <div>Labor: <strong>{formatMoney(totals.laborTotal)}</strong></div>
        <div>Overhead: <strong>{formatMoney(totals.overheadAmount)}</strong></div>
        <div>Profit: <strong>{formatMoney(totals.profitAmount)}</strong></div>
        {payload.taxRate > 0 && <div>Tax: <strong>{formatMoney(totals.taxAmount)}</strong></div>}
        <div className="grand">Total: <strong>{formatMoney(totals.grandTotal)}</strong></div>
      </section>

      {notes && (
        <section>
          <h2>Notes</h2>
          <p>{notes}</p>
        </section>
      )}
    </main>
  )
}
