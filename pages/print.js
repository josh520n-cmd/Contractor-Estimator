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

  const { client, items, notes, totals, createdAt } = data

  return (
    <main className="printable">
      <div className="print-actions">
        <button onClick={() => window.print()}>Print / Save PDF</button>
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

      <section>
        <h2>Summary</h2>
        <div>Materials: <strong>{formatMoney(totals.materialTotal)}</strong></div>
        <div>Waste buffer: <strong>{formatMoney(totals.wasteAmount)}</strong></div>
        <div>Labor: <strong>{formatMoney(totals.laborTotal)}</strong></div>
        <div>Overhead: <strong>{formatMoney(totals.overheadAmount)}</strong></div>
        <div>Profit: <strong>{formatMoney(totals.profitAmount)}</strong></div>
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
