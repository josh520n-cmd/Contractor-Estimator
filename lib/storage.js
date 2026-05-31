/**
 * Fallback storage utility for when database is unavailable.
 * Stores data in browser localStorage and file-based JSON (server-side).
 */

const fs = require('fs')
const path = require('path')

const dataDir = path.join(process.cwd(), 'data')
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir)

const storageFile = path.join(dataDir, 'localStorage.json')

// Initialize storage
let storage = {
  quotes: [],
  templates: [],
  material_presets: [],
  company_settings: []
}

function loadStorage() {
  try {
    if (fs.existsSync(storageFile)) {
      const data = fs.readFileSync(storageFile, 'utf8')
      storage = JSON.parse(data)
    }
  } catch (e) {
    console.error('Failed to load storage:', e)
  }
  return storage
}

function saveStorage() {
  try {
    fs.writeFileSync(storageFile, JSON.stringify(storage, null, 2))
  } catch (e) {
    console.error('Failed to save storage:', e)
  }
}

// Load on module init
loadStorage()

module.exports = {
  // Quotes
  getQuote(id) {
    return storage.quotes.find(q => q.id === id) || null
  },

  getAllQuotes() {
    return storage.quotes.slice().sort((a, b) => b.created_at.localeCompare(a.created_at))
  },

  createQuote(id, user_id, client, notes, data, created_at, startDate, dueDate) {
    storage.quotes.push({ id, user_id, client, notes, data, created_at, startDate, dueDate })
    saveStorage()
    return { id, user_id, client, notes, data, created_at, startDate, dueDate }
  },

  updateQuote(id, client, notes, data, startDate, dueDate) {
    const quote = storage.quotes.find(q => q.id === id)
    if (quote) {
      quote.client = client
      quote.notes = notes
      quote.data = data
      quote.startDate = startDate
      quote.dueDate = dueDate
      saveStorage()
      return quote
    }
    return null
  },

  deleteQuote(id) {
    storage.quotes = storage.quotes.filter(q => q.id !== id)
    saveStorage()
  },

  // Templates
  getTemplate(id) {
    return storage.templates.find(t => t.id === id) || null
  },

  getAllTemplates() {
    return storage.templates.slice().sort((a, b) => b.created_at.localeCompare(a.created_at))
  },

  getUserTemplates(user_id) {
    return storage.templates
      .filter(t => t.user_id === user_id)
      .sort((a, b) => b.created_at.localeCompare(a.created_at))
  },

  createTemplate(id, user_id, name, data, created_at) {
    storage.templates.push({ id, user_id, name, data, created_at })
    saveStorage()
    return { id, user_id, name, data, created_at }
  },

  deleteTemplate(id) {
    storage.templates = storage.templates.filter(t => t.id !== id)
    saveStorage()
  },

  // Material Presets
  getMaterialPreset(id) {
    return storage.material_presets.find(m => m.id === id) || null
  },

  getAllMaterialPresets() {
    return storage.material_presets.slice().sort((a, b) => b.created_at.localeCompare(a.created_at))
  },

  getUserMaterialPresets(user_id) {
    return storage.material_presets
      .filter(m => m.user_id === user_id)
      .sort((a, b) => b.created_at.localeCompare(a.created_at))
  },

  createMaterialPreset(id, user_id, name, description, qty, unit_price, created_at) {
    storage.material_presets.push({ id, user_id, name, description, qty, unit_price, created_at })
    saveStorage()
    return { id, user_id, name, description, qty, unit_price, created_at }
  },

  deleteMaterialPreset(id) {
    storage.material_presets = storage.material_presets.filter(m => m.id !== id)
    saveStorage()
  },

  // Company Settings
  getCompanySettings(user_id) {
    return storage.company_settings.find(s => s.user_id === user_id) || null
  },

  createCompanySettings(id, user_id, logo_data, tax_rate, company_name, company_address, company_phone, created_at, updated_at) {
    storage.company_settings.push({ id, user_id, logo_data, tax_rate, company_name, company_address, company_phone, created_at, updated_at })
    saveStorage()
    return { id, user_id, logo_data, tax_rate, company_name, company_address, company_phone, created_at, updated_at }
  },

  updateCompanySettings(user_id, logo_data, tax_rate, company_name, company_address, company_phone, updated_at) {
    const settings = storage.company_settings.find(s => s.user_id === user_id)
    if (settings) {
      settings.logo_data = logo_data
      settings.tax_rate = tax_rate
      settings.company_name = company_name
      settings.company_address = company_address
      settings.company_phone = company_phone
      settings.updated_at = updated_at
      saveStorage()
      return settings
    }
    return null
  }
}
