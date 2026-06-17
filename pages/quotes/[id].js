import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import dynamic from 'next/dynamic';

function formatMoney(n) {
  return '$' + Number(n || 0).toFixed(2);
}

function QuoteDetails({ id }) {
  const router = useRouter();
  const quoteId = id || router.query.id;

  const [quoteData, setQuoteData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchQuote = async () => {
    if (!quoteId) return;

    setLoading(true);
    setError(null);
    setQuoteData(null);

    try {
      const res = await fetch(`/api/quotes/${quoteId}`);

      if (!res.ok) {
        throw new Error(`Firestore fetch failed (${res.status})`);
      }

      const data = await res.json();

      if (!data) {
        throw new Error("Quote not found in Firestore");
      }

      setQuoteData({
        ...data,
        ...(data.payload || {}),
        customerEmail:
          data.customerEmail ||
          data.payload?.customerEmail ||
          ''
      });

    } catch (err) {
      console.error(err);
      setError("This quote does not exist in Firestore.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuote();
  }, [quoteId]);

  if (loading) {
    return <main className="quote-detail-page">Loading quote...</main>;
  }

  if (error) {
    return <main className="quote-detail-page quotes-error">{error}</main>;
  }

  if (!quoteData) {
    return <main className="quote-detail-page">No quote found.</main>;
  }

  const payload = quoteData.payload || quoteData;

  const items = Array.isArray(payload.items) ? payload.items : [];
  const laborTasks = Array.isArray(payload.laborTasks) ? payload.laborTasks : [];
  const totals = payload.totals || {};

  const quoteIdFinal = quoteData.id || quoteId;

  const clientName =
    quoteData.client ||
    payload.client ||
    "Unnamed client";

  const jobAddress =
    quoteData.jobAddress ||
    payload.jobAddress ||
    "";

  const customerEmail =
    quoteData.customerEmail ||
    payload.customerEmail ||
    "";

  const status =
    quoteData.status ||
    payload.status ||
    "Draft";

  return (
    <main className="quote-detail-page">

      {/* HEADER */}
      <section className="quote-detail-header">
        <div>
          <p className="eyebrow">Firestore Quote</p>
          <h1>Quote #{quoteIdFinal.slice(0, 10)}</h1>
          <p>Live data pulled directly from Firestore database.</p>
        </div>

        <div className="quote-detail-actions">
          <button onClick={fetchQuote} className="quote-action-secondary">
            Refresh
          </button>

          <button
            className="quote-action-primary"
            onClick={() => {
              localStorage.setItem("latestEstimate", JSON.stringify(quoteData));
              router.push("/print");
            }}
          >
            Print / Save PDF
          </button>

          <button
            className="quote-action-email"
            onClick={() => {
              localStorage.setItem("latestEstimate", JSON.stringify(quoteData));
              router.push("/print");
            }}
          >
            Email Quote
          </button>

          <button
            className="quote-action-edit"
            onClick={() => {
              const updated = {
                ...quoteData,
                updatedAt: new Date().toISOString()
              };

              localStorage.setItem("editQuote", JSON.stringify(updated));
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
            Last updated: {quoteData.updatedAt
              ? new Date(quoteData.updatedAt).toLocaleString()
              : "Unknown"}
          </p>
        </div>
      </section>

      {/* OVERVIEW */}
      <section className="quote-overview-grid">
        <div className="quote-overview-card large">
          <span>Client</span>
          <strong>{clientName}</strong>
          {jobAddress && <p>{jobAddress}</p>}
        </div>

        <div className="quote-overview-card">
          <span>Status</span>
          <strong>{status}</strong>
        </div>

        <div className="quote-overview-card">
          <span>Email</span>
          <strong>{customerEmail || "None"}</strong>
        </div>
      </section>

      {/* ITEMS */}
      <section className="quote-document-card">
        <div className="quote-section-title">
          <h2>Items</h2>
          <span>{items.length}</span>
        </div>

        {items.length ? (
          <div className="quote-line-table">
            {items.map((item, i) => {
              const qty = Number(item.qty || item.quantity || 1);

              const unit =
                Number(
                  item.unitPrice ||
                  item.unit_price ||
                  item.unit ||
                  item.cost ||
                  item.rate ||
                  item.price ||
                  0
                );

              const total =
                item.total ??
                item.lineTotal ??
                (qty * unit);

              return (
                <div className="quote-line-row" key={i}>
                  <div>
                    <strong>{item.name || "Item"}</strong>
                    <span>Qty: {qty}</span>
                  </div>

                  <strong>{formatMoney(total)}</strong>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="quote-empty-text">No items found.</p>
        )}
      </section>

      {/* LABOR */}
      <section className="quote-document-card">
        <div className="quote-section-title">
          <h2>Labor</h2>
          <span>{laborTasks.length}</span>
        </div>

        {laborTasks.length ? (
          <div className="quote-line-table">
            {laborTasks.map((task, i) => {
              const hours = Number(task.hours || task.qty || 0);

              const rate =
                Number(
                  task.rate ||
                  task.unit ||
                  task.unitRate ||
                  task.cost ||
                  task.price ||
                  0
                );

              const total =
                task.total ??
                task.lineTotal ??
                (hours * rate);

              return (
                <div className="quote-line-row" key={i}>
                  <div>
                    <strong>{task.name || "Labor"}</strong>
                    <span>Hours: {hours}</span>
                  </div>

                  <strong>{formatMoney(total)}</strong>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="quote-empty-text">No labor tasks found.</p>
        )}
      </section>

      {/* TOTALS */}
      <section className="quote-total-card">
  <h2>Summary</h2>

  <div className="quote-total-row">
    <span>Materials</span>
    <strong>{formatMoney(totals.materialTotal || 0)}</strong>
  </div>

  <div className="quote-total-row">
    <span>Labor</span>
    <strong>{formatMoney(totals.laborTotal || 0)}</strong>
  </div>

  <div className="quote-total-row">
    <span>Overhead</span>
    <strong>{formatMoney(totals.overheadAmount || 0)}</strong>
  </div>

  <div className="quote-total-row">
    <span>Waste Buffer</span>
    <strong>{formatMoney(totals.wasteAmount || 0)}</strong>
  </div>

  <div className="quote-total-row">
    <span>Tax</span>
    <strong>{formatMoney(totals.taxAmount || 0)}</strong>
  </div>

  <div className="quote-grand-total">
    <span>Grand Total</span>
    <strong>{formatMoney(totals.grandTotal || 0)}</strong>
  </div>
</section>
      {/* NOTES */}
      {quoteData.notes && (
        <section className="quote-document-card">
          <div className="quote-section-title">
            <h2>Notes</h2>
          </div>
          <p className="quote-notes">{quoteData.notes}</p>
        </section>
      )}

    </main>
  );
}

const QuotePage = dynamic(() => Promise.resolve(QuoteDetails), {
  ssr: false,
});

export default QuotePage;
