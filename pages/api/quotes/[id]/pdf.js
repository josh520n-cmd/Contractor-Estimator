import db from '../../../../lib/db'
import PDFDocument from 'pdfkit'

export default function handler(req, res) {
  const { id } = req.query
  const row = db.prepare('SELECT id, user_id, client, notes, data, created_at FROM quotes WHERE id = ?').get(id)
  if (!row) return res.status(404).json({ error: 'Not found' })
  const payload = JSON.parse(row.data || '{}')

  const doc = new PDFDocument({ size: 'A4', margin: 40 })
  res.setHeader('Content-Type', 'application/pdf')
  res.setHeader('Content-Disposition', `attachment; filename="quote-${id}.pdf"`)
  doc.pipe(res)

  // Add logo if available
  if (payload.companySettings?.logo_data) {
    try {
      const logoBuffer = Buffer.from(payload.companySettings.logo_data.split(',')[1], 'base64')
      doc.image(logoBuffer, 40, 40, { width: 100, height: 100 })
      doc.moveDown(3)
    } catch (e) {}
  }

  // Add company info header
  if (payload.companySettings?.company_name) {
    doc.fontSize(16).text(payload.companySettings.company_name, { align: 'left' })
    if (payload.companySettings.company_address) {
      doc.fontSize(10).text(payload.companySettings.company_address)
    }
    if (payload.companySettings.company_phone) {
      doc.text(payload.companySettings.company_phone)
    }
    doc.moveDown()
  }

  doc.fontSize(18).text('Quote', { align: 'left' })
  doc.moveDown()
  doc.fontSize(12).text(`Client: ${row.client}`)
  doc.text(`Date: ${new Date(row.created_at).toLocaleString()}`)
  doc.moveDown()

  doc.text('Items:')
  const items = payload.items || []
  items.forEach(it => {
    const line = `${it.desc} — ${it.qty} x $${Number(it.unit).toFixed(2)} = $${(Number(it.qty)||0)*(Number(it.unit)||0)} `
    doc.text(line)
  })

  doc.moveDown()
  const totals = payload.totals || {}
  const laborTasks = Array.isArray(payload.laborTasks) ? payload.laborTasks : []
  if (laborTasks.length > 0) {
    doc.text('Labor tasks:')
    laborTasks.forEach(task => {
      const taskTotal = (Number(task.hours) || 0) * (Number(task.rate) || 0)
      doc.text(`  ${task.desc} — ${task.hours}h @ $${Number(task.rate).toFixed(2)} = $${taskTotal.toFixed(2)}`)
    })
    doc.text(`Labor total: $${Number(totals.laborTotal||0).toFixed(2)}`)
  } else {
    doc.text(`Labor: $${Number(totals.laborTotal||0).toFixed(2)}`)
  }
  doc.text(`Materials: $${Number(totals.materialTotal||0).toFixed(2)}`)
  doc.text(`Waste: $${Number(totals.wasteAmount||0).toFixed(2)}`)
  doc.text(`Overhead: $${Number(totals.overheadAmount||0).toFixed(2)}`)
  doc.text(`Profit: $${Number(totals.profitAmount||0).toFixed(2)}`)
  if (payload.taxRate > 0) {
    doc.text(`Tax (${payload.taxRate}%): $${Number(totals.taxAmount||0).toFixed(2)}`)
  }
  doc.moveDown()
  doc.fontSize(18).text(`Total: $${Number(totals.grandTotal||0).toFixed(2)}`)

  if (row.notes) {
    doc.addPage().fontSize(12).text('Notes:')
    doc.text(row.notes)
  }

  doc.end()
}
