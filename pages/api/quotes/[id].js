import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import dynamic from "next/dynamic";
import { normalizeQuote, formatMoney, formatDate } from "../../../lib/normalizeQuote";

function QuoteDetails() {
  const router = useRouter();
  const { id } = router.query;

  const [quote, setQuote] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function fetchQuote() {
    if (!id) return;

    setLoading(true);
    setError("");

    try {
      const res = await fetch(`/api/quotes/${id}`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Quote not found");
      }

      setQuote(normalizeQuote(data));
    } catch (err) {
      console.error("Quote load error:", err);
      setError("This quote could not be loaded.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchQuote();
  }, [id]);

  if (loading) {
    return <main className="quote-detail-page">Loading quote...</main>;
  }

  if (error) {
    return <main className="quote-detail-page quotes-error">{error}</main>;
  }

  if (!quote) {
    return <main className="quote-detail-page">No quote found.</main>;
  }

  const quoteIdFinal = quote.id || id;

  function saveForPrintAndGo() {
    localStorage.setItem("latestEstimate", JSON.stringify(quote));
    router.push("/print");
  }

  return (
    <main className="quote-detail-page">
      <section className="quote-detail-header">
        <div>
          <p className="eyebrow">Firestore Quote</p>
          <h1>Quote #{String(quote.estimateNumber || quoteIdFinal).slice(0, 12)}</h1>
          <p>
            Review this estimate, print a branded PDF, email the quote, or reopen it for editing.
          </p>
        </div>

        <div className="quote-detail-actions">
          <button onClick={fetchQuote} className="quote-action-secondary">
            Refresh
          </button>

          <button className="quote-action-primary" onClick={saveForPrintAndGo}>
            Print / Save PDF
          </button>

          <button className="quote-action-email" onClick={saveForPrintAndGo}>
            Email Quote
          </button>

          <button
            className="quote-action-edit"
            onClick={() => {
              localStorage.setItem(
                "editQuote",
                JSON.stringify({
                  ...quote,
                  updatedAt: new Date().toISOString(),
                })
              );

              router.push(`/edit/${quoteIdFinal}`);
            }}
          >
            Edit Quote
          </button>

          <button
            className="quote-action-secondary"
            onClick={() => router.push(`/quotes/client/${quoteIdFinal}`)}
          >
            Client View
          </button>

          <p className="quote-meta">
            Last updated:{" "}
            {quote.updatedAt
              ? new Date(quote.updatedAt).toLocaleString()
              : "Unknown"}
          </p>
        </div>
      </section>

      <section className="quote-overview-grid">
        <div className="quote-overview-card large">
          <span>Client</span>
          <strong>{quote.client || "Unnamed client"}</strong>
          {quote.jobAddress && <p>{quote.jobAddress}</p>}
        </div>

        <div className="quote-overview-card">
          <span>Status</span>
          <strong>{quote.status}</strong>
        </div>

        <div className="quote-overview-card">
          <span>Email</span>
          <strong>{quote.customerEmail || "None"}</strong>
        </div>

        <div className="quote-overview-card">
          <span>Start Date</span>
          <strong>{quote.startDate ? formatDate(quote.startDate) : "Not set"}</strong>
        </div>

        <div className="quote-overview-card">
          <span>End Date</span>
          <strong>{quote.dueDate ? formatDate(quote.dueDate) : "Not set"}</strong>
        </div>
      </section>

      <section className="quote-document-card">
        <div className="quote-section-title">
          <h2>Items</h2>
          <span>{quote.items.length} item{quote.items.length === 1 ? "" : "s"}</span>
        </div>

        {quote.items.length ? (
          <div className="quote-line-table">
            {quote.items.map((item, index) => (
              <div className="quote-line-row" key={index}>
                <div>
                  <strong>{item.name || "Item"}</strong>
                  <span>
                    Qty: {item.qty} × {formatMoney(item.unitPrice)}
                  </span>
                </div>

                <strong>{formatMoney(item.total)}</strong>
              </div>
            ))}
          </div>
        ) : (
          <p className="quote-empty-text">No items available.</p>
        )}
      </section>

      <section className="quote-document-card">
        <div className="quote-section-title">
          <h2>Labor Tasks</h2>
          <span>{quote.laborTasks.length} task{quote.laborTasks.length === 1 ? "" : "s"}</span>
        </div>

        {quote.laborTasks.length ? (
          <div className="quote-line-table">
            {quote.laborTasks.map((task, index) => (
              <div className="quote-line-row" key={index}>
                <div>
                  <strong>{task.name || "Labor"}</strong>
                  <span>
                    Hours: {task.hours} × {formatMoney(task.rate)}
                  </span>
                </div>

                <strong>{formatMoney(task.total)}</strong>
              </div>
            ))}
          </div>
        ) : (
          <p className="quote-empty-text">No labor tasks available.</p>
        )}
      </section>

      <section className="quote-total-card">
        <h2>Estimate Summary</h2>

        <div className="quote-total-row">
          <span>Materials</span>
          <strong>{formatMoney(quote.totals.materialTotal)}</strong>
        </div>

        <div className="quote-total-row">
          <span>Waste Buffer</span>
          <strong>{formatMoney(quote.totals.wasteAmount)}</strong>
        </div>

        <div className="quote-total-row">
          <span>Labor</span>
          <strong>{formatMoney(quote.totals.laborTotal)}</strong>
        </div>

        <div className="quote-total-row">
          <span>Overhead</span>
          <strong>{formatMoney(quote.totals.overheadAmount)}</strong>
        </div>

        <div className="quote-total-row">
          <span>Profit</span>
          <strong>{formatMoney(quote.totals.profitAmount)}</strong>
        </div>

        <div className="quote-total-row">
          <span>Tax</span>
          <strong>{formatMoney(quote.totals.taxAmount)}</strong>
        </div>

        <div className="quote-grand-total">
          <span>Grand Total</span>
          <strong>{formatMoney(quote.totals.grandTotal)}</strong>
        </div>
      </section>

      {quote.notes && (
        <section className="quote-document-card">
          <div className="quote-section-title">
            <h2>Notes</h2>
          </div>
          <p className="quote-notes">{quote.notes}</p>
        </section>
      )}
    </main>
  );
}

const QuotePage = dynamic(() => Promise.resolve(QuoteDetails), {
  ssr: false,
});

export default QuotePage;
