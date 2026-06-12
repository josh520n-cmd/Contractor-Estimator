import { useEffect, useRef, useState } from 'react'
import { auth } from '../../lib/firebase'

function formatMoney(n) { return '$' + Number(n || 0).toFixed(2) }

export default function Print() {
  const [data, setData] = useState(null)
  const printRef = useRef(null)
  const [sending, setSending] = useState(false)
  const [processedLogoData, setProcessedLogoData] = useState(null)

  useEffect(() => {
    try {
      const raw = localStorage.getItem('latestEstimate')
      if (raw) setData(JSON.parse(raw))
    } catch (e) {}
  }, [])

  useEffect(() => {
    if (data?.companySettings?.logo_data) {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 200; // Max width for the logo
        const MAX_HEIGHT = 200; // Max height for the logo
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        // Convert to JPEG with reduced quality
        const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.7);
        setProcessedLogoData(compressedDataUrl);
      };
      img.src = data.companySettings.logo_data;
    } else {
      setProcessedLogoData(null);
    }
  }, [data?.companySettings?.logo_data]);

  if (!data) return <main className="container"><p>No quote found. Create an estimate first.</p></main>

  const {
    client,
    phone,
    customerEmail,
    jobAddress,
    startDate,
    dueDate,
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

  async function emailPdf() {
    if (!data?.customerEmail) {
      alert("No customer email found.")
      return
    }
  
    try {
      setSending(true)
  
      const html2pdf = (await import("html2pdf.js")).default
  
      const worker = html2pdf()
        .set({
          margin: 0.5,
          filename: `${estimateNumber || "estimate"}.pdf`,
          image: { type: "jpeg", quality: 0.98 },
          html2canvas: { scale: 2 },
          jsPDF: { unit: "in", format: "letter", orientation: "portrait" },
        })
        .from(printRef.current)
        .toPdf()
  
      const pdfBase64 = await worker.outputPdf("datauristring")
  
      const res = await fetch("/api/send-quote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: data.customerEmail || data.email,
          contractorEmail: auth.currentUser?.email || '',
          client: data.client,
          estimateNumber:
            data.estimateNumber ||
            data.estimateId ||
            data.id ||
            data.quoteId ||
            '',
          jobAddress:
            data.jobAddress ||
            data.address ||
            data.customerAddress ||
            data.projectAddress ||
            '',
          totals: data.totals,
          pdfBase64,
        }),
      })
  
      if (!res.ok) {
        const text = await res.text()

        let message = "Email failed"
        
        try {
          const err = JSON.parse(text)
          message = err.error || message
        } catch {
          message = text || message
        }
        
        throw new Error(message)
      }
  
      alert("Quote emailed successfully.")
    } catch (err) {
      alert(err.message || "Email failed")
    } finally {
      setSending(false)
    }
  }

  return (
    <main className="printable">
     <div className="print-actions no-print">
  <button onClick={() => window.print()}>Print / Save PDF</button>
  <button onClick={emailPdf} disabled={sending}>
    {sending ? "Sending..." : "Email PDF"}
  </button>
  
</div>
<div ref={printRef}>
  <div className="print-header">
        {processedLogoData && (
          <img src={processedLogoData} alt="Logo" className="company-logo" />
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
        {customerEmail && <div>Email: <strong>{customerEmail}</strong></div>}
        {jobAddress && <div>Job Address: <strong>{jobAddress}</strong></div>}
        {estimateNumber && <div>Estimate #: <strong>{estimateNumber}</strong></div>}
        {status && <div>Status: <strong>{status}</strong></div>}
        {startDate && (
  <div>Start Date: <strong>{startDate}</strong></div>
)}

{dueDate && (
  <div>Due Date: <strong>{dueDate}</strong></div>
)}
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
  <p>{notes || 'Work will be completed as described in this estimate.'}</p>

  <h3>Payment Terms</h3>
  <p>
  Total agreed price: {formatMoney(totals?.grandTotal || 0)}.
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
</div>
    </main>
  )
}