import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import {
  normalizeQuote,
  formatMoney,
  formatDate,
} from "../../lib/normalizeQuote";

function fetchWithTimeout(url, options = {}, timeout = 10000) {
  return Promise.race([
    fetch(url, options),
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Quote load timed out")), timeout)
    ),
  ]);
}

export default function QuoteDetailsPage() {
  const router = useRouter();
  const { id } = router.query;

  const [quote, setQuote] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadQuote() {
    if (!router.isReady || !id) return;

    setLoading(true);
    setError("");

    try {
      const res = await fetchWithTimeout(`/api/quotes/${id}`);

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.error || "Quote could not be loaded");
      }

      setQuote(normalizeQuote(data));
    } catch (err) {
      console.error("QUOTE PAGE LOAD ERROR:", err);
      setError(err.message || "Quote could not be loaded");
      setQuote(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadQuote();
  }, [router.isReady, id]);

  function goToPrint() {
    if (!quote) return;

    localStorage.setItem("latestEstimate", JSON.stringify(quote));
    router.push("/print");
  }

  function goToEdit() {
    if (!quote) return;

    localStorage.setItem("editQuote", JSON.stringify(quote));
    router.push(`/edit/${quote.id || id}`);
  }

  if (loading) {
    return (
      <main className="quote-detail-page">
        <p>Loading estimate...</p>
      </main>
    );
  }

  if (error) {
    return (
      <main className="quote-detail-page">
        <section className="quote-document-card">
          <h1>Estimate failed to load</h1>
          <p>{error}</p>

          <button onClick={loadQuote} className="quote-action-primary">
            Try Again
          </button>

          <button
            onClick={() => router.push("/quotes")}
            className="quote-action-secondary"
          >
            Back to Saved Quotes
          </button>
        </section>
      </main>
    );
  }

  if (!quote) {
    return (
      <main className="quote-detail-page">
        <p>No estimate found.</p>
      </main>
    );
  }

  const quoteId = quote.id || id;

  return (
    <main className="quote-detail-page">
      <section className="quote-detail-header">
        <div>
          <p className="eyebrow">Estimate</p>
          <h1>{quote.estimateNumber || quoteId}</h1>
          <p>
            Review this estimate, print it, email it, or open the client view.
          </p>
        </div>

        <div className="quote-detail-actions">
          <button onClick={loadQuote} className="quote-action-secondary">
            Refresh
          </button>

          <button onClick={goToPrint} className="quote-action-primary">
            Print / Save PDF
          </button>

          <button onClick={goToPrint} className="quote-action-email">
            Email Quote
          </button>

          <button onClick={goToEdit} className="quote-action-edit">
            Edit Quote
          </button>

          <button
            onClick={() => router.push(`/quotes/client/${quoteId}`)}
            className="quote-action-secondary"
          >
            Client View
          </button>
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
          <strong>{quote.status || "Draft"}</strong>
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
          <span>Due Date</span>
          <strong>{quote.dueDate ? formatDate(quote.dueDate) : "Not set"}</strong>
        </div>
      </section>

      <section className="quote-document-card">
        <div className="quote-section-title">
          <h2>Items</h2>
          <span>{quote.items.length}</span>
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
          <p className="quote-empty-text">No items listed.</p>
        )}
      </section>

      <section className="quote-document-card">
        <div className="quote-section-title">
          <h2>Labor</h2>
          <span>{quote.laborTasks.length}</span>
        </div>

        {quote.laborTasks.length ? (
          <div className="quote-line-table">
            {quote.laborTasks.map((task, index) => (
              <div className="quote-line-row" key={index}>
                <div>
                  <strong>{task.name || "Labor"}</strong>
                  <span>
                    {task.hours} hrs × {formatMoney(task.rate)}
                  </span>
                </div>
                <strong>{formatMoney(task.total)}</strong>
              </div>
            ))}
          </div>
        ) : (
          <p className="quote-empty-text">No labor listed.</p>
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
          <h2>Notes</h2>
          <p>{quote.notes}</p>
        </section>
      )}
    </main>
  );
}
