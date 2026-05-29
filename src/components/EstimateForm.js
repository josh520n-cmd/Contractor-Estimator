import { useState, useMemo, useEffect } from 'react'
import { useRouter } from 'next/router'

function formatMoney(n) {
  return '$' + Number(n || 0).toFixed(2)
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
  const [notes, setNotes] = useState('')
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

  async function loadQuote(id) {
    const res = await fetch(`/api/quotes/${id}`)
    if (!res.ok) return
    const data = await res.json()
    const payload = data.payload || {}
    
    setClient(data.client || '')
    setNotes(data.notes || '')
    setItems(payload.items || [])
    setLaborTasks(payload.laborTasks || [])
    setOverheadPct(payload.overheadPct || 10)
    setProfitPct(payload.profitPct || 10)
    setWastePct(payload.wastePct || 5)
    setEditMode(true)
  }

  async function loadMaterialPresets() {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
    const headers = {}
    if (token) headers['Authorization'] = `Bearer ${token}`
    try {
      const res = await fetch('/api/presets/materials', { headers })
      if (res.ok) setMaterialPresets(await res.json())
    } catch (e) {}
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
    } catch (e) {}
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
    const res = await fetch('/api/presets/materials', { method: 'POST', headers, body: JSON.stringify(payload) })
    if (res.ok) {
      setNewPresetName('')
      setNewPresetDesc('')
      setNewPresetQty(1)
      setNewPresetPrice(0)
      loadMaterialPresets()
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
    const res = await fetch('/api/settings/company', { method: 'PUT', headers, body: JSON.stringify(payload) })
    if (res.ok) {
      alert('Settings saved')
      loadCompanySettings()
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
      }
    }

    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
    const headers = { 'content-type': 'application/json' }
    if (token) headers['Authorization'] = `Bearer ${token}`
    
    if (editMode && existingQuoteId) {
      const res = await fetch(`/api/quotes/${existingQuoteId}`, { method: 'PUT', headers, body: JSON.stringify(payload) })
      if (res.ok) {
        alert('Quote updated')
        router.push(`/quotes/${existingQuoteId}`)
      } else {
        alert('Update failed')
      }
    } else {
      const res = await fetch('/api/quotes', { method: 'POST', headers, body: JSON.stringify(payload) })
      if (res.ok) {
        const { id } = await res.json()
        try { localStorage.setItem('latestEstimate', JSON.stringify({ ...payload, createdAt: new Date().toISOString() })) } catch (e) {}
        router.push(`/quotes/${id}`)
      } else {
        alert('Save failed')
      }
    }
  }

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
    const payload = { name, data: { items, laborTasks, overheadPct, profitPct, wastePct } }
    const res = await fetch('/api/templates', { method: 'POST', headers, body: JSON.stringify(payload) })
    if (res.ok) loadTemplates()
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
    <div className="estimator">
      {editMode && <div className="edit-notice">📝 Editing existing quote</div>}

      <section className="meta">
        <label>Client name<input value={client} onChange={e => setClient(e.target.value)} placeholder="Client or job name"/></label>
        <label>Notes<textarea value={notes} onChange={e => setNotes(e.target.value)} /></label>
      </section>

      <section className="company-settings">
        <h3>Company Settings</h3>
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
          <button onClick={saveCompanySettings}>Save Settings</button>
        </div>
      </section>

      <section className="material-presets">
        <h3>Material Presets</h3>
        <div className="preset-form">
          <input placeholder="Preset name" value={newPresetName} onChange={e => setNewPresetName(e.target.value)} />
          <input placeholder="Description" value={newPresetDesc} onChange={e => setNewPresetDesc(e.target.value)} />
          <input type="number" placeholder="Qty" value={newPresetQty} onChange={e => setNewPresetQty(e.target.value)} />
          <input type="number" placeholder="Unit price" value={newPresetPrice} onChange={e => setNewPresetPrice(e.target.value)} />
          <button onClick={saveMaterialPreset}>Add Preset</button>
        </div>
        {materialPresets.length > 0 && (
          <div className="preset-list">
            {materialPresets.map(p => (
              <div key={p.id} className="preset-item">
                <span>{p.name} - {p.qty} x ${Number(p.unit_price).toFixed(2)}</span>
                <button onClick={() => addPresetToItems(p)}>+ Add to items</button>
              </div>
            ))}
          </div>
        )}
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
        <h2>Labor Tasks</h2>
        <table>
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
                <td><button onClick={() => removeLaborTask(i)}>Remove</button></td>
              </tr>
            ))}
          </tbody>
        </table>
        <button onClick={addLaborTask}>Add labor task</button>
      </section>

      <section className="margins">
        <label>Waste %<input type="number" value={wastePct} onChange={e => setWastePct(e.target.value)} /></label>
        <label>Overhead %<input type="number" value={overheadPct} onChange={e => setOverheadPct(e.target.value)} /></label>
        <label>Profit %<input type="number" value={profitPct} onChange={e => setProfitPct(e.target.value)} /></label>
        <label>Tax %<input type="number" step="0.1" value={taxRate} onChange={e => setTaxRate(e.target.value)} /></label>
      </section>

      <section className="totals">
        <h2>Estimate Summary</h2>
        <div>Materials: <strong>{formatMoney(materialTotal)}</strong></div>
        <div>Waste buffer ({wastePct}%): <strong>{formatMoney(wasteAmount)}</strong></div>
        <div>Labor: <strong>{formatMoney(laborTotal)}</strong></div>
        <div>Overhead ({overheadPct}%): <strong>{formatMoney(overheadAmount)}</strong></div>
        <div>Profit ({profitPct}%): <strong>{formatMoney(profitAmount)}</strong></div>
        {taxRate > 0 && <div>Tax ({taxRate}%): <strong>{formatMoney(taxAmount)}</strong></div>}
        <div className="grand">Total Estimate: <strong>{formatMoney(grandTotal)}</strong></div>
      </section>

      <section className="templates">
        <h3>Estimate Templates</h3>
        <button onClick={saveTemplate}>Save as Template</button>
        <button onClick={loadTemplates}>Refresh Templates</button>
        {templates.length > 0 && (
          <select onChange={e => { if (e.target.value) applyTemplate(e.target.value); e.target.value = '' }}>
            <option value="">Apply template...</option>
            {templates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        )}
      </section>

      <section className="actions">
        <button onClick={previewQuote}>Preview / Print</button>
        <button onClick={saveQuote} className="primary">{editMode ? 'Update Quote' : 'Save Quote'}</button>
      </section>
    </div>
  )
}
