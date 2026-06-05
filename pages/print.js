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

  const {
    client,
    phone,
    email,
    jobAddress,
    estimateNumber,
    status,
    items,
    laborTasks = [],
    notes,
    totals,
    createdAt,
    companySettings = {},
    taxRate = 0
  } = data

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
        {phone && <div>Phone: <strong>{phone}</strong></div>}
        {email && <div>Email: <strong>{email}</strong></div>}
        {jobAddress && <div>Job Address: <strong>{jobAddress}</strong></div>}
        {estimateNumber && <div>Estimate #: <strong>{estimateNumber}</strong></div>}
        {status && <div>Status: <strong>{status}</strong></div>}
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
      <section className="contract-section">
  <h2>Work Authorization Agreement</h2>

  <p>
    By signing below, the customer approves this estimate and authorizes the
    contractor to begin the work described in this document.
  </p>

  <h3>Scope of Work</h3>
  <p>{estimate.notes || 'Work will be completed as described in this estimate.'}</p>

  <h3>Payment Terms</h3>
  <p>
    Total agreed price: {formatMoney(estimate.totals?.grandTotal || 0)}.
    Payment is due according to the agreement between customer and contractor.
  </p>

  <h3>Change Orders</h3>
  <p>
    Any work not listed in this estimate may require a written change order
    and may increase the final price.
  </p>

  <h3>Customer Responsibilities</h3>
  <p>
    Customer agrees to provide access to the job site and approve any required
    changes before additional work begins.
  </p>

  <h3>Signatures</h3>

  <div className="signature-row">
    <div>
      <div className="signature-line"></div>
      <p>Customer Signature</p>
    </div>

    <div>
      <div className="signature-line"></div>
      <p>Date</p>
    </div>
  </div>

  <div className="signature-row">
    <div>
      <div className="signature-line"></div>
      <p>Contractor Signature</p>
    </div>

    <div>
      <div className="signature-line"></div>
      <p>Date</p>
    </div>
  </div>
</section>
    </main>
  )
}
