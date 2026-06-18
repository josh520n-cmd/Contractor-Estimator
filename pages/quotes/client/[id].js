import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import {
  normalizeQuote,
  formatMoney,
  formatDate,
} from "../../../lib/normalizeQuote";

export default function ClientQuoteView() {
  const router = useRouter();
  const { id, token } = router.query;

  const [quote, setQuote] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadQuote() {
    if (!router.isReady || !id) return;

    setLoading(true);
    setError("");

    try {
      const url = token
        ? `/api/client-quote?id=${id}&token=${token}`
        : `/api/quotes/${id}`;

      const res = await fetch(url);
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.error || "Quote not found");
      }

      setQuote(normalizeQuote(data));
    } catch (err) {
      console.error("Client quote load error:", err);
      setError("This estimate is not available.");
      setQuote(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadQuote();
  }, [router.isReady, id, token]);

  if (loading) {
    return <main className="client-page">Loading estimate...</main>;
  }

  if (error) {
    return <main className="client-page">{error}</main>;
  }

  if (!quote) {
    return <main className="client-page">No estimate found.</main>;
  }

  return (
    <main className="client-page">
      <header className="client-header">
        {quote.companySettings?.logo_data && (
          <img
            src={quote.companySettings.logo_data}
            alt="Company Logo"
            className="client-logo"
          />
        )}

        <h1>Estimate</h1>

        <p>{quote.client || "Client"}</p>

        {quote.jobAddress && <p>{quote.jobAddress}</p>}

        {quote.startDate && (
          <p>Start: {formatDate(quote.startDate)}</p>
        )}

        {quote.dueDate && (
          <p>End: {formatDate(quote.dueDate)}</p>
        )}
      </header>

      <section className="client-section">
        <h2>Items</h2>

        {quote.items.length ? (
          quote.items.map((item, index) => (
            <div key={index} className="client-row">
              <span>
                {item.name}
                {item.qty ? ` — Qty ${item.qty}` : ""}
              </span>

              <strong>{formatMoney(item.total)}</strong>
            </div>
          ))
        ) : (
          <p>No items listed.</p>
        )}
      </section>

      <section className="client-section">
        <h2>Labor</h2>

        {quote.laborTasks.length ? (
          quote.laborTasks.map((task, index) => (
            <div key={index} className="client-row">
              <span>
                {task.name}
                {task.hours ? ` — ${task.hours} hrs` : ""}
              </span>

              <strong>{formatMoney(task.total)}</strong>
            </div>
          ))
        ) : (
          <p>No labor listed.</p>
        )}
      </section>

      <section className="client-section">
        <h2>Summary</h2>

        <div className="client-row">
          <span>Materials</span>
          <strong>{formatMoney(quote.totals.materialTotal)}</strong>
        </div>

        <div className="client-row">
          <span>Waste Buffer</span>
          <strong>{formatMoney(quote.totals.wasteAmount)}</strong>
        </div>

        <div className="client-row">
          <span>Labor</span>
          <strong>{formatMoney(quote.totals.laborTotal)}</strong>
        </div>

        <div className="client-row">
          <span>Overhead</span>
          <strong>{formatMoney(quote.totals.overheadAmount)}</strong>
        </div>

        <div className="client-row">
          <span>Profit</span>
          <strong>{formatMoney(quote.totals.profitAmount)}</strong>
        </div>

        <div className="client-row">
          <span>Tax</span>
          <strong>{formatMoney(quote.totals.taxAmount)}</strong>
        </div>
      </section>

      <section className="client-total">
        <h2>Total</h2>
        <strong>{formatMoney(quote.totals.grandTotal)}</strong>
      </section>

      {quote.notes && (
        <section className="client-section">
          <h2>Notes</h2>
          <p>{quote.notes}</p>
        </section>
      )}
    </main>
  );
}
