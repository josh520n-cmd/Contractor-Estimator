import { useEffect, useState } from 'react'

function formatMoney(n) { return '$' + Number(n || 0).toFixed(2) }

export default function Print() {
  const [data, setData] = useState(null)

  useEffect(() => {
    try {
      const raw = localStorage.getItem('latestEstimate')
      if (raw) setData(JSON.parse(raw))
    } catch (e) {}
  }, [])

  if (!data) return <main className="container"><p>No quote found. Create an estimate first.</p></main>

  const { client, items, laborTasks = [], notes, totals, createdAt, companySettings = {}, taxRate = 0 } = data

  return (
    <main className="printable">
      <div className="print-actions">
        <button onClick={() => window.print()}>Print / Save PDF</button>
      </div>

      <div className="print-header">
        {companySettings.logo_data && (
          <img src={companySettings.logo_data} alt="Logo" className="company-logo" />
        )}
        <div className="company-info">
          {companySettings.company_name && (
            <div className="company-name">{companySettings.company_name}</div>
          )}
          {companySettings.company_address && (
            <div className="company-address">{companySettings.company_address}</div>
          )}
          {companySettings.company_phone && (
            <div className="company-phone">{companySettings.company_phone}</div>
          )}
        </div>
      </div>

      <header>
        <h1>Quote</h1>
        <div>Client: <strong>{client}</strong></div>
        <div>Date: <strong>{new Date(createdAt).toLocaleString()}</strong></div>
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
        {taxRate > 0 && <div>Tax ({taxRate}%): <strong>{formatMoney(totals.taxAmount)}</strong></div>}
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
