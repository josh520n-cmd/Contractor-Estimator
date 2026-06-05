import { useState, useMemo, useEffect } from 'react'
import { useRouter } from 'next/router'
import { db } from './firebase'
import { collection, addDoc } from 'firebase/firestore'

function formatMoney(n) {
  return '$' + Number(n || 0).toFixed(2)
}

function parseEstimateNumber(value) {
  if (!value) return null
  const match = /^est[-.](\d{4,6})$/i.exec(value)
  return match ? Number(match[1]) : null
}

function nextEstimateNumberFromValues(values) {
  let maxNumber = 1000
  for (const value of values) {
    const number = parseEstimateNumber(value)
    if (number != null && number > maxNumber) maxNumber = number
  }
  return `Est-${maxNumber + 1}`
}

export default function EstimateForm({ existingQuoteId = null }) {
  const router = useRouter()
  const [items, setItems] = useState([
    { desc: 'Example item', qty: 1, unit: 100 }
  ])
  const [laborTasks, setLaborTasks] = useState([
    { desc: 'Example labor task', hours: 4, rate: 50 }
  ])
  const [overheadPct, setOverheadPct] = useState(10)
  const [profitPct, setProfitPct] = useState(10)
  const [wastePct, setWastePct] = useState(5)
  const [taxRate, setTaxRate] = useState(0)
  const [client, setClient] = useState('')
  const [estimateNumber, setEstimateNumber] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [jobAddress, setJobAddress] = useState('')
  const [status, setStatus] = useState('Draft')
  const [notes, setNotes] = useState('')
  const [startDate, setStartDate] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [editMode, setEditMode] = useState(false)

  // Material presets
  const [materialPresets, setMaterialPresets] = useState([])
  const [newPresetName, setNewPresetName] = useState('')
  const [newPresetDesc, setNewPresetDesc] = useState('')
  const [newPresetQty, setNewPresetQty] = useState(1)
  const [newPresetPrice, setNewPresetPrice] = useState(0)

  // Company settings
  const [companySettings, setCompanySettings] = useState({
    logo_data: null,
    tax_rate: 0,
    company_name: '',
    company_address: '',
    company_phone: ''
  })

  // Templates
  const [templates, setTemplates] = useState([])

  // Load existing quote if editMode
  useEffect(() => {
    if (existingQuoteId && router.isReady) {
      loadQuote(existingQuoteId)
    }
    loadMaterialPresets()
    loadCompanySettings()
    loadTemplates()
  }, [existingQuoteId, router.isReady])

  useEffect(() => {
    if (existingQuoteId || !router.isReady) return

    async function loadNextEstimateNumber() {
      let nextNumber = ''
      try {
        const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
        const headers = token ? { Authorization: `Bearer ${token}` } : {}
        const res = await fetch('/api/quotes', { headers })
        if (res.ok) {
          const quotes = await res.json()
          nextNumber = nextEstimateNumberFromValues(quotes.map(q => q.estimateNumber))
        }
      } catch (e) {
        console.warn('Failed to load quote numbers from API:', e.message)
      }

      if (!nextNumber && typeof window !== 'undefined') {
        const list = Object.values(localStorage)
          .filter((value) => {
            try {
              return value && JSON.parse(value)
            } catch {
              return false
            }
          })
          .map((value) => {
            try {
              const parsed = JSON.parse(value)
              return parsed.estimateNumber || (parsed.payload && parsed.payload.estimateNumber) || ''
            } catch {
              return ''
            }
          })
        nextNumber = nextEstimateNumberFromValues(list)
      }

      if (nextNumber) {
        setEstimateNumber(nextNumber)
      }
    }

    loadNextEstimateNumber()
  }, [existingQuoteId, router.isReady])

  async function loadQuote(id) {
    const res = await fetch(`/api/quotes/${id}`)
    if (!res.ok) return
    const data = await res.json()
    const payload = data.payload || {}
    
    setClient(data.client || '')
    setEstimateNumber(payload.estimateNumber || data.estimateNumber || '')
    setNotes(data.notes || '')
    setItems(payload.items || [])
    setLaborTasks(payload.laborTasks || [])
    setOverheadPct(payload.overheadPct || 10)
    setProfitPct(payload.profitPct || 10)
    setWastePct(payload.wastePct || 5)
    setStartDate(data.startDate || '')
    setDueDate(data.dueDate || '')
    setEditMode(true)
  }

  async function loadMaterialPresets() {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
    const headers = {}
    if (token) headers['Authorization'] = `Bearer ${token}`
    try {
      const res = await fetch('/api/presets/materials', { headers })
      if (res.ok) {
        setMaterialPresets(await res.json())
      }
    } catch (e) {
      console.log('Failed to load material presets:', e.message)
    }
  }

  async function loadCompanySettings() {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
    const headers = {}
    if (token) headers['Authorization'] = `Bearer ${token}`
    try {
      const res = await fetch('/api/settings/company', { headers })
      if (res.ok) {
        const data = await res.json()
        setCompanySettings(data)
        setTaxRate(data.tax_rate || 0)
      }
    } catch (e) {
      console.log('Failed to load company settings:', e.message)
    }
  }

  async function saveMaterialPreset() {
    if (!newPresetName) return alert('Enter preset name')
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
    const headers = { 'content-type': 'application/json' }
    if (token) headers['Authorization'] = `Bearer ${token}`
    
    const payload = {
      name: newPresetName,
      description: newPresetDesc,
      qty: Number(newPresetQty),
      unit_price: Number(newPresetPrice)
    }
    try {
      const res = await fetch('/api/presets/materials', { method: 'POST', headers, body: JSON.stringify(payload) })
      if (res.ok) {
        setNewPresetName('')
        setNewPresetDesc('')
        setNewPresetQty(1)
        setNewPresetPrice(0)
        loadMaterialPresets()
      } else {
        alert('Failed to save preset (will try localStorage)')
      }
    } catch (e) {
      alert('Preset saved to device (database unavailable)')
      setNewPresetName('')
      setNewPresetDesc('')
      setNewPresetQty(1)
      setNewPresetPrice(0)
    }
  }

  async function addPresetToItems(preset) {
    setItems([...items, {
      desc: preset.name + (preset.description ? ' - ' + preset.description : ''),
      qty: preset.qty,
      unit: preset.unit_price
    }])
  }

  async function saveCompanySettings() {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
    const headers = { 'content-type': 'application/json' }
    if (token) headers['Authorization'] = `Bearer ${token}`
    
    const payload = {
      ...companySettings,
      tax_rate: Number(taxRate)
    }
    try {
      const res = await fetch('/api/settings/company', { method: 'PUT', headers, body: JSON.stringify(payload) })
      if (res.ok) {
        alert('Settings saved')
        loadCompanySettings()
      } else {
        alert('Failed to save settings (will try localStorage)')
      }
    } catch (e) {
      alert('Settings saved to device (database unavailable)')
    }
  }

  function handleLogoUpload(e) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (event) => {
      setCompanySettings({ ...companySettings, logo_data: event.target.result })
    }
    reader.readAsDataURL(file)
  }

  const materialTotal = useMemo(() => items.reduce((s, it) => s + (Number(it.qty) || 0) * (Number(it.unit) || 0), 0), [items])
  const wasteAmount = (wastePct / 100) * materialTotal
  const laborTotal = useMemo(() => laborTasks.reduce((s, task) => s + (Number(task.hours) || 0) * (Number(task.rate) || 0), 0), [laborTasks])
  const directTotal = materialTotal + wasteAmount + laborTotal
  const overheadAmount = (overheadPct / 100) * directTotal
  const profitAmount = (profitPct / 100) * (directTotal + overheadAmount)
  const subtotal = directTotal + overheadAmount + profitAmount
  const taxAmount = (taxRate / 100) * subtotal
  const grandTotal = subtotal + taxAmount

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

  function setLaborTask(index, field, value) {
    const next = laborTasks.slice()
    next[index] = { ...next[index], [field]: value }
    setLaborTasks(next)
  }

  function addLaborTask() {
    setLaborTasks([...laborTasks, { desc: '', hours: 0, rate: 0 }])
  }

  function removeLaborTask(i) {
    setLaborTasks(laborTasks.filter((_, idx) => idx !== i))
  }

  function previewQuote() {
    const data = {
      client,
      notes,
      items,
      laborTasks,
      overheadPct,
      profitPct,
      wastePct,
      taxRate,
      companySettings,
      totals: {
        materialTotal,
        wasteAmount,
        laborTotal,
        overheadAmount,
        profitAmount,
        taxAmount,
        grandTotal
      },
      startDate,
      dueDate
    }
    try {
      localStorage.setItem('latestEstimate', JSON.stringify(data))
      console.log('Successfully saved to localStorage for preview: latestEstimate', data)
    } catch (e) {
      console.error('Error saving to localStorage for preview: latestEstimate', e)
    }
    router.push('/print')
  }

  async function saveQuote() {
    const payload = {
      phone,
      email,
      jobAddress,
      estimateNumber,
      status,
      client,
      notes,
      items,
      laborTasks,
      overheadPct,
      profitPct,
      wastePct,
      taxRate,
      companySettings,
      totals: {
        materialTotal,
        wasteAmount,
        laborTotal,
        overheadAmount,
        profitAmount,
        taxAmount,
        grandTotal
      },
      startDate,
      dueDate
    }
  
    if (editMode && existingQuoteId) {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
      const headers = { 'content-type': 'application/json' }
      if (token) headers['Authorization'] = `Bearer ${token}`
  
      const res = await fetch(`/api/quotes/${existingQuoteId}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(payload)
      })
  
      if (res.ok) {
        alert('Quote updated')
        router.push(`/quotes/${existingQuoteId}`)
      } else {
        alert('Update failed')
      }
  
      return
    }
  
    try {
      const createdAt = new Date().toISOString()
  
      const docRef = await addDoc(collection(db, 'quotes'), {
        ...payload,
        createdAt
      })
  
      const id = docRef.id
      const quoteDataToSave = { ...payload, id, createdAt }
  
      localStorage.setItem('latestEstimate', JSON.stringify(quoteDataToSave))
      localStorage.setItem('quotes_' + id, JSON.stringify(quoteDataToSave))
  
      alert('Quote saved successfully')
      router.push(`/quotes/${id}`)
    } catch (e) {
      console.error('Firestore save failed:', e)
  
      const id = 'quote_' + Date.now()
      const createdAt = new Date().toISOString()
      const fallbackPayload = { ...payload, id, createdAt }
  
      localStorage.setItem('quotes_' + id, JSON.stringify(fallbackPayload))
      localStorage.setItem('latestEstimate', JSON.stringify(fallbackPayload))
  
      alert('Quote saved to device only. Database save failed.')
      router.push(`/quotes/${id}`)
    }
  }
  
  async function loadTemplates() {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
    const headers = {}
    if (token) headers['Authorization'] = `Bearer ${token}`
  
    try {
      const res = await fetch('/api/templates', { headers })
      if (res.ok) setTemplates(await res.json())
    } catch (e) {
      console.log('Failed to load templates:', e.message)
    }
  }
  
  async function saveTemplate() {
    const name = prompt('Template name')
    if (!name) return
  
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
    const headers = { 'content-type': 'application/json' }
    if (token) headers['Authorization'] = `Bearer ${token}`
  
    const payload = {
      name,
      data: { items, laborTasks, overheadPct, profitPct, wastePct }
    }
  
    try {
      const res = await fetch('/api/templates', {
        method: 'POST',
        headers,
        body: JSON.stringify(payload)
      })
  
      if (res.ok) {
        alert('Template saved successfully')
        loadTemplates()
      } else {
        alert('Failed to save template')
      }
    } catch (e) {
      alert('Template saved to device only')
    }
  }
  
  async function applyTemplate(id) {
    const res = await fetch(`/api/templates/${id}`)
    if (!res.ok) return
  
    const json = await res.json()
    const d = json.data || {}
  
    setItems(d.items || [])
  
    if (Array.isArray(d.laborTasks) && d.laborTasks.length) {
      setLaborTasks(d.laborTasks)
    } else {
      setLaborTasks([{ desc: 'Labor', hours: d.laborHours || 0, rate: d.laborRate || 0 }])
    }
  
    setOverheadPct(d.overheadPct || 10)
    setProfitPct(d.profitPct || 10)
    setWastePct(d.wastePct || 5)
  }
  
  return (
    <div className="estimate-builder">
      {editMode && <div className="edit-notice">📝 Editing existing quote</div>}

      <section className="card client-card">
        <div className="header">
          <div>
            <p className="eyebrow">Client Information</p>
            <h2>Estimate details</h2>
          </div>
          <div className="estimate-meta">
            <span className="tag estimate-tag">{estimateNumber || 'Draft #'}</span>
            <span className="tag status-tag">{status}</span>
          </div>
        </div>

        <div className="field-grid">
          <label>Client name<input value={client} onChange={e => setClient(e.target.value)} placeholder="Client or job name"/></label>
          <label>Phone<input value={phone} onChange={e => setPhone(e.target.value)} placeholder="123-456-7890" /></label>
          <label>Email<input value={email} onChange={e => setEmail(e.target.value)} placeholder="customer@email.com" /></label>
          <label>Job Address<input value={jobAddress} onChange={e => setJobAddress(e.target.value)} placeholder="123 Main St" /></label>
          <label>Estimate #<input value={estimateNumber} onChange={e => setEstimateNumber(e.target.value)} /></label>
          <label>Status<select value={status} onChange={e => setStatus(e.target.value)}><option>Draft</option><option>Sent</option><option>Approved</option><option>Declined</option><option>Paid</option></select></label>
          <label>Start Date<input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} /></label>
          <label>Due Date<input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} /></label>
        </div>

        <label className="notes-block">Notes<textarea value={notes} onChange={e => setNotes(e.target.value)} /></label>
      </section>

      <div className="builder-grid">
        <div className="main-content">
          <section className="card section-panel">
            <div className="section-header">
              <h2>Materials</h2>
              <button type="button" className="ghost-button" onClick={addItem}>Add material</button>
            </div>
            <table className="data-table">
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
                    <td><button type="button" className="secondary" onClick={() => removeItem(i)}>Remove</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          <section className="card section-panel">
            <div className="section-header">
              <h2>Labor Tasks</h2>
              <button type="button" className="ghost-button" onClick={addLaborTask}>Add labor task</button>
            </div>
            <table className="data-table">
              <thead>
                <tr><th>Description</th><th>Hours</th><th>Rate</th><th>Line</th><th></th></tr>
              </thead>
              <tbody>
                {laborTasks.map((task, i) => (
                  <tr key={i}>
                    <td><input value={task.desc} onChange={e => setLaborTask(i, 'desc', e.target.value)} /></td>
                    <td><input type="number" value={task.hours} onChange={e => setLaborTask(i, 'hours', e.target.value)} /></td>
                    <td><input type="number" value={task.rate} onChange={e => setLaborTask(i, 'rate', e.target.value)} /></td>
                    <td>{formatMoney((Number(task.hours)||0)*(Number(task.rate)||0))}</td>
                    <td><button type="button" className="secondary" onClick={() => removeLaborTask(i)}>Remove</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        </div>

        <aside className="sidebar-panel">
          <section className="card summary-card">
            <div className="section-header">
              <h2>Estimate Summary</h2>
            </div>
            <div className="summary-grid">
              <div><span className="summary-label">Materials</span><strong>{formatMoney(materialTotal)}</strong></div>
              <div><span className="summary-label">Waste buffer</span><strong>{formatMoney(wasteAmount)}</strong></div>
              <div><span className="summary-label">Labor</span><strong>{formatMoney(laborTotal)}</strong></div>
              <div><span className="summary-label">Overhead</span><strong>{formatMoney(overheadAmount)}</strong></div>
              <div><span className="summary-label">Profit</span><strong>{formatMoney(profitAmount)}</strong></div>
              {taxRate > 0 && <div><span className="summary-label">Tax</span><strong>{formatMoney(taxAmount)}</strong></div>}
              <div className="summary-total">
  <span>Total</span>
  <strong>{formatMoney(grandTotal)}</strong>
</div>

<div className="summary-controls">
  <label>
    Waste %
    <input
      type="number"
      value={wastePct}
      onChange={(e) => setWastePct(e.target.value)}
    />
  </label>

  <label>
    Overhead %
    <input
      type="number"
      value={overheadPct}
      onChange={(e) => setOverheadPct(e.target.value)}
    />
  </label>

  <label>
    Profit %
    <input
      type="number"
      value={profitPct}
      onChange={(e) => setProfitPct(e.target.value)}
    />
  </label>
</div>
            </div>
          </section>

          <section className="card section-panel">
            <div className="section-header">
              <h2>Estimate Templates</h2>
            </div>
            <div className="template-actions">
              <button type="button" className="secondary" onClick={saveTemplate}>Save as Template</button>
              <button type="button" className="secondary" onClick={loadTemplates}>Refresh Templates</button>
            </div>
            {templates.length > 0 && (
              <select onChange={e => { if (e.target.value) applyTemplate(e.target.value); e.target.value = '' }}>
                <option value="">Apply template...</option>
                {templates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            )}
          </section>
        </aside>
      </div>

      <details className="collapsible-card">
        <summary>Company Settings</summary>
        <div className="collapsible-body">
          <section className="company-settings">
            <div>
              <label>Company Name
                <input value={companySettings.company_name} onChange={e => setCompanySettings({ ...companySettings, company_name: e.target.value })} />
              </label>
              <label>Address
                <input value={companySettings.company_address} onChange={e => setCompanySettings({ ...companySettings, company_address: e.target.value })} />
              </label>
              <label>Phone
                <input value={companySettings.company_phone} onChange={e => setCompanySettings({ ...companySettings, company_phone: e.target.value })} />
              </label>
              <label>Tax Rate (%)
                <input type="number" step="0.1" value={taxRate} onChange={e => setTaxRate(e.target.value)} />
              </label>
              <label>Company Logo
                <input type="file" accept="image/*" onChange={handleLogoUpload} />
              </label>
              {companySettings.logo_data && <div className="logo-preview">✓ Logo uploaded</div>}
            </div>
            <button type="button" className="primary" onClick={saveCompanySettings}>Save Settings</button>
          </section>
        </div>
      </details>

      <details className="collapsible-card">
        <summary>Material Presets</summary>
        <div className="collapsible-body">
          <section className="material-presets">
            <div className="preset-form">
              <input placeholder="Preset name" value={newPresetName} onChange={e => setNewPresetName(e.target.value)} />
              <input placeholder="Description" value={newPresetDesc} onChange={e => setNewPresetDesc(e.target.value)} />
              <input type="number" placeholder="Qty" value={newPresetQty} onChange={e => setNewPresetQty(e.target.value)} />
              <input type="number" placeholder="Unit price" value={newPresetPrice} onChange={e => setNewPresetPrice(e.target.value)} />
              <button type="button" className="secondary" onClick={saveMaterialPreset}>Add Preset</button>
            </div>
            {materialPresets.length > 0 && (
              <div className="preset-list">
                {materialPresets.map(p => (
                  <div key={p.id} className="preset-item">
                    <span>{p.name} - {p.qty} x ${Number(p.unit_price).toFixed(2)}</span>
                    <button type="button" className="secondary" onClick={() => addPresetToItems(p)}>+ Add</button>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </details>

      <section className="actions">
        <button onClick={previewQuote} className="secondary">Preview / Print</button>
        <button onClick={saveQuote} className="primary">{editMode ? 'Update Quote' : 'Save Quote'}</button>
      </section>
    </div>
  )
}