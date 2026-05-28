import { useState, useMemo } from 'react'
import { useRouter } from 'next/router'

function formatMoney(n) {
  return '$' + Number(n || 0).toFixed(2)
}

export default function EstimateForm() {
  const router = useRouter()
  const [items, setItems] = useState([
    { desc: 'Example item', qty: 1, unit: 100 }
  ])
  const [laborHours, setLaborHours] = useState(0)
  const [laborRate, setLaborRate] = useState(50)
  const [overheadPct, setOverheadPct] = useState(10)
  const [profitPct, setProfitPct] = useState(10)
  const [wastePct, setWastePct] = useState(5)
  const [client, setClient] = useState('')
  const [notes, setNotes] = useState('')

  const materialTotal = useMemo(() => items.reduce((s, it) => s + (Number(it.qty) || 0) * (Number(it.unit) || 0), 0), [items])
  const wasteAmount = (wastePct / 100) * materialTotal
  const laborTotal = (Number(laborHours) || 0) * (Number(laborRate) || 0)
  const directTotal = materialTotal + wasteAmount + laborTotal
  const overheadAmount = (overheadPct / 100) * directTotal
  const profitAmount = (profitPct / 100) * (directTotal + overheadAmount)
  const grandTotal = directTotal + overheadAmount + profitAmount

  function setItem(index, field, value) {
    const next = items.slice()
    next[index] = { ...next[index], [field]: value }
    setItems(next)
  }

  function addItem() {
    setItems([...items, { desc: '', qty: 1, unit: 0 }])
  }

  function removeItem(i) {
    setItems(items.filter((_, idx) => idx !== i))
  }

  function previewQuote() {
    const data = {
      client,
      notes,
      items,
      laborHours,
      laborRate,
      overheadPct,
      profitPct,
      wastePct,
      totals: {
        materialTotal,
        wasteAmount,
        laborTotal,
        overheadAmount,
        profitAmount,
        grandTotal
      },
      createdAt: new Date().toISOString()
    }
    try {
      localStorage.setItem('latestEstimate', JSON.stringify(data))
    } catch (e) {}
    router.push('/print')
  }

  async function saveQuote() {
    const payload = {
      client,
      notes,
      items,
      laborHours,
      laborRate,
      overheadPct,
      profitPct,
      wastePct,
      totals: {
        materialTotal,
        wasteAmount,
        laborTotal,
        overheadAmount,
        profitAmount,
        grandTotal
      }
    }

    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
    const headers = { 'content-type': 'application/json' }
    if (token) headers['Authorization'] = `Bearer ${token}`
    const res = await fetch('/api/quotes', { method: 'POST', headers, body: JSON.stringify(payload) })
    if (res.ok) {
      const { id } = await res.json()
      try { localStorage.setItem('latestEstimate', JSON.stringify({ ...payload, createdAt: new Date().toISOString() })) } catch (e) {}
      router.push(`/quotes/${id}`)
    } else {
      alert('Save failed')
    }
  }

  // Templates
  const [templates, setTemplates] = useState([])
  async function loadTemplates() {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
    const headers = {}
    if (token) headers['Authorization'] = `Bearer ${token}`
    const res = await fetch('/api/templates', { headers })
    if (res.ok) setTemplates(await res.json())
  }

  async function saveTemplate() {
    const name = prompt('Template name')
    if (!name) return
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
    const headers = { 'content-type': 'application/json' }
    if (token) headers['Authorization'] = `Bearer ${token}`
    const payload = { name, data: { items, laborHours, laborRate, overheadPct, profitPct, wastePct } }
    const res = await fetch('/api/templates', { method: 'POST', headers, body: JSON.stringify(payload) })
    if (res.ok) loadTemplates()
  }

  async function applyTemplate(id) {
    const res = await fetch(`/api/templates/${id}`)
    if (!res.ok) return
    const json = await res.json()
    const d = json.data || {}
    setItems(d.items || [])
    setLaborHours(d.laborHours || 0)
    setLaborRate(d.laborRate || 50)
    setOverheadPct(d.overheadPct || 10)
    setProfitPct(d.profitPct || 10)
    setWastePct(d.wastePct || 5)
  }

  return (
    <div className="estimator">
      <section className="meta">
        <label>Client name<input value={client} onChange={e => setClient(e.target.value)} placeholder="Client or job name"/></label>
        <label>Notes<textarea value={notes} onChange={e => setNotes(e.target.value)} /></label>
      </section>

      <section className="items">
        <h2>Materials</h2>
        <table>
          <thead>
            <tr><th>Description</th><th>Qty</th><th>Unit</th><th>Line</th><th></th></tr>
          </thead>
          <tbody>
            {items.map((it, i) => (
              <tr key={i}>
                <td><input value={it.desc} onChange={e => setItem(i, 'desc', e.target.value)} /></td>
                <td><input type="number" value={it.qty} onChange={e => setItem(i, 'qty', e.target.value)} /></td>
                <td><input type="number" value={it.unit} onChange={e => setItem(i, 'unit', e.target.value)} /></td>
                <td>{formatMoney((Number(it.qty)||0)*(Number(it.unit)||0))}</td>
                <td><button onClick={() => removeItem(i)}>Remove</button></td>
              </tr>
            ))}
          </tbody>
        </table>
        <button onClick={addItem}>Add material</button>
      </section>

      <section className="labor">
        <h2>Labor</h2>
        <label>Hours<input type="number" value={laborHours} onChange={e => setLaborHours(e.target.value)} /></label>
        <label>Rate<input type="number" value={laborRate} onChange={e => setLaborRate(e.target.value)} /></label>
      </section>

      <section className="margins">
        <label>Waste %<input type="number" value={wastePct} onChange={e => setWastePct(e.target.value)} /></label>
        <label>Overhead %<input type="number" value={overheadPct} onChange={e => setOverheadPct(e.target.value)} /></label>
        <label>Profit %<input type="number" value={profitPct} onChange={e => setProfitPct(e.target.value)} /></label>
      </section>

      <section className="totals">
        <h2>Estimate Summary</h2>
        <div>Materials: <strong>{formatMoney(materialTotal)}</strong></div>
        <div>Waste buffer ({wastePct}%): <strong>{formatMoney(wasteAmount)}</strong></div>
        <div>Labor: <strong>{formatMoney(laborTotal)}</strong></div>
        <div>Overhead ({overheadPct}%): <strong>{formatMoney(overheadAmount)}</strong></div>
        <div>Profit ({profitPct}%): <strong>{formatMoney(profitAmount)}</strong></div>
        <div className="grand">Total Estimate: <strong>{formatMoney(grandTotal)}</strong></div>
      </section>

      <section className="actions">
        <button onClick={previewQuote}>Preview / Print</button>
        <button onClick={saveQuote} className="primary">Save Quote</button>
        <button onClick={saveTemplate}>Save Template</button>
        <button onClick={loadTemplates}>Load Templates</button>
        {templates.length > 0 && (
          <select onChange={e => applyTemplate(e.target.value)}>
            <option value="">Apply template...</option>
            {templates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        )}
      </section>
    </div>
  )
}
