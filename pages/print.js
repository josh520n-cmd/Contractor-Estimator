import { useEffect, useRef, useState } from "react";
import { auth } from "../lib/firebase";
import { normalizeQuote, formatMoney, formatDate } from "../lib/normalizeQuote";

export default function Print() {
  const [quote, setQuote] = useState(null);
  const [sending, setSending] = useState(false);
  const printRef = useRef(null);

  useEffect(() => {
    document.body.setAttribute("data-print", "true");

    try {
      const raw = localStorage.getItem("latestEstimate");
      if (raw) {
        setQuote(normalizeQuote(JSON.parse(raw)));
      }
    } catch (err) {
      console.error("Print load error:", err);
    }

    return () => {
      document.body.removeAttribute("data-print");
    };
  }, []);

  if (!quote) {
    return (
      <main className="print-page">
        <p>No estimate found. Go back to a quote and choose Print / Save PDF.</p>
      </main>
    );
  }

  async function emailPdf() {
    if (!quote.customerEmail) {
      alert("No customer email found.");
      return;
    }

    try {
      setSending(true);

      const html2pdf = (await import("html2pdf.js")).default;

      const worker = html2pdf()
        .set({
          margin: 0.5,
          filename: `${quote.estimateNumber || "estimate"}.pdf`,
          image: { type: "jpeg", quality: 0.98 },
          html2canvas: { scale: 2 },
          jsPDF: { unit: "in", format: "letter", orientation: "portrait" },
        })
        .from(printRef.current)
        .toPdf();

      const pdfBase64 = await worker.outputPdf("datauristring");

      const res = await fetch("/api/send-quote", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...quote,
          contractorEmail: auth?.currentUser?.email || "",
          pdfBase64,
        }),
      });

      const result = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(result.error || "Email failed");
      }

      alert("Quote emailed successfully.");
    } catch (err) {
      console.error("Email PDF error:", err);
      alert(err.message || "Email failed");
    } finally {
      setSending(false);
    }
  }

  return (
    <main className="print-page">
      <div className="print-actions no-print">
        <button onClick={() => window.print()}>
          Print / Save PDF
        </button>

        <button onClick={emailPdf} disabled={sending}>
          {sending ? "Sending..." : "Email Quote"}
        </button>
      </div>

      <div ref={printRef} className="print-document">
        <div className="print-header">
          {quote.companySettings?.logo_data && (
            <img
              src={quote.companySettings.logo_data}
              alt="Company Logo"
              className="company-logo"
            />
          )}

          <div className="company-info">
            {quote.companySettings?.company_name && (
              <div className="company-name">
                {quote.companySettings.company_name}
              </div>
            )}

            {quote.companySettings?.company_address && (
              <div>{quote.companySettings.company_address}</div>
            )}

            {quote.companySettings?.company_phone && (
              <div>{quote.companySettings.company_phone}</div>
            )}
          </div>
        </div>

        <header className="print-client-info">
          <h1>Estimate #{String(quote.estimateNumber || quote.id || "").slice(0, 12)}</h1>

          {quote.client && <p><strong>{quote.client}</strong></p>}
          {quote.phone && <p>Phone: {quote.phone}</p>}
          {quote.customerEmail && <p>Email: {quote.customerEmail}</p>}
          {quote.jobAddress && <p>Job Address: {quote.jobAddress}</p>}

          {quote.startDate && <p>Start: {formatDate(quote.startDate)}</p>}
          {quote.dueDate && <p>End: {formatDate(quote.dueDate)}</p>}
        </header>

        <hr />

        <section>
          <h2>Items</h2>

          {quote.items.length ? (
            quote.items.map((item, index) => (
              <div key={index} className="print-row">
                <span>
                  {item.name || "Item"} — Qty {item.qty} × {formatMoney(item.unitPrice)}
                </span>
                <strong>{formatMoney(item.total)}</strong>
              </div>
            ))
          ) : (
            <p>No items listed.</p>
          )}
        </section>

        <section>
          <h2>Labor</h2>

          {quote.laborTasks.length ? (
            quote.laborTasks.map((task, index) => (
              <div key={index} className="print-row">
                <span>
                  {task.name || "Labor"} — {task.hours} hrs × {formatMoney(task.rate)}
                </span>
                <strong>{formatMoney(task.total)}</strong>
              </div>
            ))
          ) : (
            <p>No labor listed.</p>
          )}
        </section>

        <section className="print-summary">
          <h2>Summary</h2>

          <div className="print-row">
            <span>Materials</span>
            <strong>{formatMoney(quote.totals.materialTotal)}</strong>
          </div>

          <div className="print-row">
            <span>Waste Buffer</span>
            <strong>{formatMoney(quote.totals.wasteAmount)}</strong>
          </div>

          <div className="print-row">
            <span>Labor</span>
            <strong>{formatMoney(quote.totals.laborTotal)}</strong>
          </div>

          <div className="print-row">
            <span>Overhead</span>
            <strong>{formatMoney(quote.totals.overheadAmount)}</strong>
          </div>

          <div className="print-row">
            <span>Profit</span>
            <strong>{formatMoney(quote.totals.profitAmount)}</strong>
          </div>

          <div className="print-row">
            <span>Tax</span>
            <strong>{formatMoney(quote.totals.taxAmount)}</strong>
          </div>

          <div className="print-row print-total">
            <span>Total</span>
            <strong>{formatMoney(quote.totals.grandTotal)}</strong>
          </div>
        </section>

        {quote.notes && (
          <section>
            <h2>Notes</h2>
            <p>{quote.notes}</p>
          </section>
        )}
      </div>
    </main>
  );
}
