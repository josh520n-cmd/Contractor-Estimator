import { useState, useMemo, useEffect } from 'react'
import { useRouter } from 'next/router'
import { auth } from '../../lib/firebase'
import { onAuthStateChanged } from 'firebase/auth'
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
  const [customerEmail, setCustomerEmail] = useState('')
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
    
    tax_rate: 0,
  
  

  })

  // Templates
  const [templates, setTemplates] = useState([])
  const [usageStatus, setUsageStatus] = useState(null)
  // Load existing quote if editMode
  useEffect(() => {
    if (!router.isReady) return
  
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (existingQuoteId) {
        await loadQuote(existingQuoteId)
      }
  
      if (user) {
        await loadCompanySettings(user)
        await loadUsageStatus(user)
      }
  
      loadMaterialPresets()
      loadTemplates()
    })
  
    return () => unsub()
  }, [existingQuoteId, router.isReady])
  useEffect(() => {
    if (existingQuoteId || !router.isReady) return
  
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) return
  
      let nextNumber = ''
  
      try {
        const token = await user.getIdToken()
  
        const res = await fetch('/api/quotes', {
          headers: {
            Authorization: `Bearer ${token}`
          }
        })
  
        if (res.ok) {
          const quotes = await res.json()
  
          nextNumber = nextEstimateNumberFromValues(
            quotes.map(q => q.estimateNumber)
          )
        }
      } catch (e) {
        console.warn('Failed to load quote numbers from API:', e.message)
      }
  
      if (nextNumber) {
        setEstimateNumber(nextNumber)
      }
    })
  
    return () => unsub()
  }, [existingQuoteId, router.isReady])



  async function loadQuote(id) {
    const res = await fetch(`/api/quotes/${id}`)
    if (!res.ok) return
    const data = await res.json()
    const payload = data.payload || {}
    
    setPhone(data.phone || payload.phone || '')
    setCustomerEmail(data.customerEmail || payload.customerEmail || '')
    setJobAddress(data.jobAddress || payload.jobAddress || '')
    setStatus(data.status || payload.status || 'Draft')
    setClient(data.client || '')
    setEstimateNumber(payload.estimateNumber || data.estimateNumber || '')
    setNotes(data.notes || '')
    setItems(payload.items || [])
    setLaborTasks(payload.laborTasks || [])
    setOverheadPct(payload.overheadPct || 10)
    setProfitPct(payload.profitPct || 10)
    setWastePct(payload.wastePct || 5)
    setStartDate(data.startDate || payload.startDate || '')
    setDueDate(data.dueDate || payload.dueDate || '')
    setEditMode(true)
  }

  async function getFirebaseHeaders(includeJson = false) {
    const user = auth.currentUser
  
    if (!user) {
      return includeJson
        ? { 'Content-Type': 'application/json' }
        : {}
    }
  
    const token = await user.getIdToken()
  
    return includeJson
      ? {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        }
      : {
          Authorization: `Bearer ${token}`
        }
  }

  async function getPresetAuthHeaders(includeJson = false) {
    const user = auth.currentUser
  
    if (!user) {
      throw new Error('You must be signed in to use material presets.')
    }
  
    const token = await user.getIdToken()
  
    const headers = {
      Authorization: `Bearer ${token}`
    }
  
    if (includeJson) {
      headers['Content-Type'] = 'application/json'
    }
  
    return headers
  }
  
  async function loadMaterialPresets() {
    try {
      const headers = await getPresetAuthHeaders(false)
  
      const res = await fetch('/api/presets/materials', {
        headers
      })
  
      const data = await res.json().catch(() => [])
  
      if (!res.ok) {
        console.warn('Failed to load material presets:', data.error || res.status)
        setMaterialPresets([])
        return
      }
  
      setMaterialPresets(Array.isArray(data) ? data : [])
    } catch (e) {
      console.log('Failed to load material presets:', e.message)
      setMaterialPresets([])
    }
  }
  
  async function saveMaterialPreset() {
    if (!newPresetName.trim()) {
      return alert('Enter preset name')
    }
  
    const payload = {
      name: newPresetName.trim(),
      description: newPresetDesc || '',
      qty: Number(newPresetQty) || 0,
      unit_price: Number(newPresetPrice) || 0
    }
  
    try {
      const headers = await getPresetAuthHeaders(true)
  
      const res = await fetch('/api/presets/materials', {
        method: 'POST',
        headers,
        body: JSON.stringify(payload)
      })
  
      const data = await res.json().catch(() => ({}))
  
      if (!res.ok) {
        alert(data.error || 'Failed to save preset.')
        return
      }
  
      setNewPresetName('')
      setNewPresetDesc('')
      setNewPresetQty(1)
      setNewPresetPrice(0)
  
      await loadMaterialPresets()
    } catch (e) {
      console.error('Preset save failed:', e)
      alert(e.message || 'Failed to save preset.')
    }
  }

  async function loadCompanySettings(user = auth.currentUser) {
    if (!user) {
      console.log('No Firebase user found for estimate company settings')
      return
    }
  
    const token = await user.getIdToken()
  
    try {
      const res = await fetch('/api/settings/company', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })
  
      if (res.ok) {
        const data = await res.json()
        console.log('ESTIMATE FORM COMPANY SETTINGS:', data)
  
        setCompanySettings({
          logo_data: data.logo_data || null,
          tax_rate: data.tax_rate ?? 0,
          company_name: data.company_name || '',
          company_address: data.company_address || '',
          company_phone: data.company_phone || ''
        })
  
        setTaxRate(Number(data.tax_rate ?? 0))
      }
    } catch (e) {
      console.log('Failed to load company settings:', e.message)
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
    const payload = {
      ...companySettings,
      tax_rate: Number(taxRate)
    }
  
    try {
      const headers = await getFirebaseHeaders(true)
  
      const res = await fetch('/api/settings/company', {
        method: 'PUT',
        headers,
        body: JSON.stringify(payload)
      })
  
      if (res.ok) {
        alert('Settings saved')
        loadCompanySettings()
      } else {
        alert('Failed to save settings')
      }
    } catch (e) {
      console.error('Settings save failed:', e)
      alert('Settings save failed')
    }
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
      customerEmail,
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
      sessionStorage.setItem('latestEstimate', JSON.stringify(data))
      localStorage.removeItem('latestEstimate')
      console.log('Successfully saved to sessionStorage for preview: latestEstimate', data)
    } catch (e) {
      console.error('Error saving to localStorage for preview: latestEstimate', e)
    }
    router.push('/print')
  }

  async function loadUsageStatus(user = auth.currentUser) {
    if (!user) {
      setUsageStatus(null)
      return
    }
  
    try {
      const token = await user.getIdToken()
  
      const res = await fetch('/api/usage/status', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })
  
      const data = await res.json().catch(() => null)
  
      if (res.ok) {
        setUsageStatus(data)
      }
    } catch (err) {
      console.warn('Failed to load usage status:', err.message)
    }
  }

  async function startCheckout() {
    try {
      const headers = await getFirebaseHeaders(true)
  
      const res = await fetch('/api/billing/create-checkout-session', {
        method: 'POST',
        headers
      })
  
      const data = await res.json().catch(() => ({}))
  
      if (!res.ok || !data.url) {
        alert(data.error || 'Unable to start checkout.')
        return
      }
  
      window.location.href = data.url
    } catch (err) {
      console.error('Checkout start failed:', err)
      alert('Unable to start checkout.')
    }
  }
  
  async function openBillingPortal() {
    try {
      const headers = await getFirebaseHeaders(true)
  
      const res = await fetch('/api/billing/create-portal-session', {
        method: 'POST',
        headers
      })
  
      const data = await res.json().catch(() => ({}))
  
      if (!res.ok || !data.url) {
        alert(data.error || 'Unable to open billing portal.')
        return
      }
  
      window.location.href = data.url
    } catch (err) {
      console.error('Billing portal failed:', err)
      alert('Unable to open billing portal.')
    }
  }

  async function saveQuote() {
    const currentUser = auth.currentUser
  
    if (!currentUser) {
      alert('Please log in before saving quotes.')
      router.push('/login')
      return
    }
  
    const createdAt = new Date().toISOString()
    const safeCompanySettings = { ...(companySettings || {}) }
  
    const payload = {
      userId: currentUser.uid,
      ownerEmail: currentUser.email || '',
  
      phone,
      customerEmail,
      email: customerEmail,
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
  
      companySettings: safeCompanySettings,
  
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
      dueDate,
  
      createdAt,
      updatedAt: createdAt
    }
  
    try {
      const headers = await getFirebaseHeaders(true)
  
      if (editMode && existingQuoteId) {
        const res = await fetch(`/api/quotes/${existingQuoteId}`, {
          method: 'PUT',
          headers,
          body: JSON.stringify(payload)
        })
  
        const result = await res.json().catch(() => ({}))
  
        if (res.ok) {
          alert('Quote updated')
          router.push(`/quotes/${existingQuoteId}`)
        } else {
          alert(result.error || 'Update failed')
        }
  
        return
      }
  
      const res = await fetch('/api/quotes', {
        method: 'POST',
        headers,
        body: JSON.stringify(payload)
      })
  
      const result = await res.json().catch(() => ({}))
  
      if (!res.ok) {
        if (res.status === 402 || result.code === 'FREE_LIMIT_REACHED') {
          await loadUsageStatus(currentUser)

          const upgradeNow = confirm(
            (result.error || 'Free quote limit reached.') +
              '\n\nUpgrade to Pro for unlimited quotes at $39/month?'
          )
          
          if (upgradeNow) {
            await startCheckout()
          }
          
          return
        }
  
        alert(result.error || 'Quote save failed')
        return
      }
  
      sessionStorage.setItem('latestEstimate', JSON.stringify(result))
      localStorage.removeItem('latestEstimate')
  
      try {
        localStorage.setItem('quotes_' + result.id, JSON.stringify(result))
      } catch {
        // Firestore/API is source of truth. Ignore browser storage overflow.
      }
  
      await loadUsageStatus(currentUser)
  
      alert('Quote saved successfully')
      router.push(`/quotes/${result.id}`)
    } catch (e) {
      console.error('Quote save failed:', e)
      alert(e.message || 'Quote save failed')
    }
  }
  
  async function loadTemplates() {
    try {
      const user = auth.currentUser
  
      if (!user) {
        console.warn('No user found while loading templates')
        return
      }
  
      const token = await user.getIdToken()
  
      const res = await fetch('/api/templates', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })
  
      const data = await res.json().catch(() => [])
  
      console.log('TEMPLATES LOAD RESPONSE:', res.status, data)
  
      if (res.ok) {
        const list = Array.isArray(data)
          ? data
          : Array.isArray(data.templates)
            ? data.templates
            : []
  
        setTemplates(list)
      } else {
        console.warn('Failed to load templates:', data.error || res.status)
      }
    } catch (e) {
      console.log('Failed to load templates:', e.message)
    }
  }
  
  async function saveTemplate() {
    const name = prompt('Template name')
    if (!name) return
  
    try {
      const user = auth.currentUser
  
      if (!user) {
        alert('Please sign in before saving templates.')
        return
      }
  
      const token = await user.getIdToken()
  
      const payload = {
        name,
        userId: user.uid,
        ownerEmail: user.email || '',
        data: {
          items,
          laborTasks,
          overheadPct,
          profitPct,
          wastePct,
          taxRate
        }
      }
  
      const res = await fetch('/api/templates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      })
  
      const data = await res.json().catch(() => ({}))
  
      console.log('TEMPLATE SAVE RESPONSE:', res.status, data)
  
      if (res.ok) {
        alert('Template saved successfully')
        await loadTemplates()
      } else {
        alert(data.error || 'Failed to save template')
      }
    } catch (e) {
      console.error('Template save failed:', e)
      alert('Template save failed')
    }
  }
  
  async function applyTemplate(id) {
    try {
      const user = auth.currentUser
  
      if (!user) {
        alert('Please sign in before applying templates.')
        return
      }
  
      const token = await user.getIdToken()
  
      const res = await fetch(`/api/templates/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })
  
      const json = await res.json().catch(() => ({}))
  
      console.log('APPLY TEMPLATE RESPONSE:', res.status, json)
  
      if (!res.ok) {
        alert(json.error || 'Failed to apply template')
        return
      }
  
      const template = json.template || json
      const d = template.data || {}
  
      setItems(Array.isArray(d.items) ? d.items : [])
  
      if (Array.isArray(d.laborTasks) && d.laborTasks.length) {
        setLaborTasks(d.laborTasks)
      } else {
        setLaborTasks([
          { desc: 'Labor', hours: d.laborHours || 0, rate: d.laborRate || 0 }
        ])
      }
  
      setOverheadPct(d.overheadPct ?? 10)
      setProfitPct(d.profitPct ?? 10)
      setWastePct(d.wastePct ?? 5)
      setTaxRate(d.taxRate ?? taxRate)
    } catch (e) {
      console.error('Apply template failed:', e)
      alert('Failed to apply template')
    }
  }
  
  return (
    <div className="estimate-builder">
      {editMode && <div className="edit-notice">📝 Editing existing quote</div>}

      <section className="card client-card">
  <div className="estimate-header">
    <h2>Estimate details</h2>

    <div className="estimate-meta">
      <span className="tag estimate-tag">
        {estimateNumber || 'Draft #'}
      </span>
      <span className="tag status-tag">
        {status}
      </span>
    </div>
  </div>

        <div className="field-grid">
          <label>Client name<input value={client} onChange={e => setClient(e.target.value)} placeholder="Client or job name"/></label>
          <label>Phone<input value={phone} onChange={e => setPhone(e.target.value)} placeholder="123-456-7890" /></label>
          <label>Customer Email
  <input
    value={customerEmail}
    onChange={e => setCustomerEmail(e.target.value)}
    placeholder="customer@email.com"
  />
</label>
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
  <label>
  Tax %
  <input
    type="number"
    value={taxRate}
    onChange={(e) => setTaxRate(e.target.value)}
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

      {usageStatus && !usageStatus.unlimited && (
  <div className="usage-banner">
    <div>
      <strong>Free plan:</strong>{" "}
      {usageStatus.count} / {usageStatus.freeLimit} quotes used.{" "}
      {usageStatus.remaining > 0
        ? `${usageStatus.remaining} remaining.`
        : "Upgrade required to create more quotes."}
    </div>

    <button type="button" className="btn-save" onClick={startCheckout}>
      Upgrade to Pro — $39/mo
    </button>
  </div>
)}

{usageStatus?.unlimited && (
  <div className="usage-banner">
    <div>
      <strong>
        {usageStatus.plan === "owner" ? "Owner account" : "Paid plan"}:
      </strong>{" "}
      Unlimited quotes enabled.
    </div>

    {usageStatus.plan !== "owner" && (
      <button type="button" className="secondary" onClick={openBillingPortal}>
        Manage Billing
      </button>
    )}
  </div>
)}

<section className="actions">
  <button onClick={previewQuote} className="btn-print">
    Preview / Print
  </button>

  <button
    onClick={saveQuote}
    className="btn-save"
    disabled={!editMode && usageStatus && usageStatus.canCreate === false}
  >
    {editMode ? 'Update Quote' : 'Save Quote'}
  </button>
</section>
    </div>
  )
}