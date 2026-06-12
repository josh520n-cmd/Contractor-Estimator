import { auth } from '../../lib/firebase'
import { useEffect, useState } from 'react'

export default function Settings() {
  const [settings, setSettings] = useState({
    logo_data: null,
    tax_rate: 0,
    company_name: '',
    company_address: '',
    company_phone: ''
  })

  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadSettings()
  }, [])

  async function loadSettings() {
    const token = await auth.currentUser?.getIdToken()

    if (!token) {
      console.log('No token found for company settings')
      setLoading(false)
      return
    }

    const res = await fetch('/api/settings/company', {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })

    const data = await res.json()
    console.log('LOADED COMPANY SETTINGS:', data)

    setSettings({
      logo_data: data.logo_data || null,
      tax_rate: data.tax_rate ?? 0,
      company_name: data.company_name || '',
      company_address: data.company_address || '',
      company_phone: data.company_phone || ''
    })

    setLoading(false)
  }

  function handleChange(e) {
    const { name, value } = e.target
    setSettings(prev => ({
      ...prev,
      [name]: value
    }))
  }

  function handleLogoUpload(e) {
    const file = e.target.files?.[0]
    if (!file) return

    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg']

    if (!allowedTypes.includes(file.type)) {
      alert('Invalid file type. Please upload PNG, JPG, or JPEG.')
      return
    }

    if (file.size > 500000) {
      alert('Logo is too large. Maximum logo size is 500 KB.')
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      setSettings(prev => ({
        ...prev,
        logo_data: reader.result
      }))
    }
    reader.readAsDataURL(file)
  }

  function removeLogo() {
    setSettings(prev => ({
      ...prev,
      logo_data: null
    }))
  }

  async function saveSettings() {
    const token = await auth.currentUser?.getIdToken()

    if (!token) {
      alert('You must be signed in to save settings.')
      return
    }

    setSaving(true)

    try {
      const res = await fetch('/api/settings/company', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          ...settings,
          tax_rate: Number(settings.tax_rate || 0)
        })
      })

      const data = await res.json()

      if (!res.ok) {
        alert(data.error || 'Settings failed to save')
        return
      }

      alert('Company settings saved')
      await loadSettings()
    } catch (err) {
      alert(err.message || 'Settings failed to save')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <main className="container">
        <section className="card">
          <h1>Loading company settings...</h1>
        </section>
      </main>
    )
  }

  return (
    <main className="container">
      <section className="card" style={{ maxWidth: 760, width: '100%' }}>
        <h1>Company Settings</h1>
        <p>
          Add your company information and logo. These details will appear on
          your estimates and PDFs.
        </p>

        <div style={{ marginTop: 24 }}>
          <h2>Company Logo</h2>
          <p style={{ color: '#64748b', marginBottom: 12 }}>
            Recommended: square PNG or JPG logo. Maximum file size: 500 KB.
            Supported file types: PNG, JPG, JPEG.
          </p>

          {settings.logo_data && (
            <div style={{ marginBottom: 16 }}>
              <img
                src={settings.logo_data}
                alt="Company Logo"
                style={{
                  maxWidth: 180,
                  maxHeight: 120,
                  objectFit: 'contain',
                  border: '1px solid #e2e8f0',
                  borderRadius: 12,
                  padding: 10,
                  background: '#fff'
                }}
              />

              <div style={{ marginTop: 10 }}>
                <button type="button" onClick={removeLogo} className="secondary">
                  Remove Logo
                </button>
              </div>
            </div>
          )}

          <input
            type="file"
            accept="image/png,image/jpeg,image/jpg"
            onChange={handleLogoUpload}
          />
        </div>

        <div className="field-grid" style={{ marginTop: 24 }}>
          <label>
            Company Name
            <input
              name="company_name"
              value={settings.company_name}
              onChange={handleChange}
              placeholder="ABC Roofing LLC"
            />
          </label>

          <label>
            Company Phone
            <input
              name="company_phone"
              value={settings.company_phone}
              onChange={handleChange}
              placeholder="555-555-5555"
            />
          </label>

          <label>
            Company Address
            <input
              name="company_address"
              value={settings.company_address}
              onChange={handleChange}
              placeholder="123 Main St, City, State"
            />
          </label>

          <label>
            Default Tax Rate (%)
            <input
              name="tax_rate"
              type="number"
              step="0.01"
              value={settings.tax_rate}
              onChange={handleChange}
              placeholder="0"
            />
          </label>
        </div>

        <div style={{ marginTop: 24 }}>
          <button onClick={saveSettings} disabled={saving} className="primary">
            {saving ? 'Saving...' : 'Save Company Settings'}
          </button>
        </div>
      </section>
    </main>
  )
}
