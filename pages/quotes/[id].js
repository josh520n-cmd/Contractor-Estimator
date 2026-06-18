import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import dynamic from "next/dynamic";

function formatMoney(n) {
  return "$" + Number(n || 0).toFixed(2);
}

function QuoteDetails() {
  const router = useRouter();
  const { id } = router.query;

  const [quoteData, setQuoteData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchQuote = async () => {
    if (!id) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/quotes/${id}`);
      if (!res.ok) throw new Error("Failed to load quote");

      const data = await res.json();

      // 🔥 NORMALIZE FIRESTORE DATA (IMPORTANT FIX)
      const payload = data.payload || data || {};

      const normalized = {
        id: data.id || id,
        client: data.client || payload.client || "",
        status: data.status || payload.status || "Draft",

        customerEmail:
          data.customerEmail || payload.customerEmail || "",

        jobAddress:
          data.jobAddress || payload.jobAddress || "",

        startDate:
          data.startDate || payload.startDate || "",

        dueDate:
          data.dueDate || payload.dueDate || "",

        updatedAt:
          data.updatedAt || payload.updatedAt || "",

        notes:
          data.notes || payload.notes || "",

        payload: {
          items: Array.isArray(payload.items) ? payload.items : [],
          laborTasks: Array.isArray(payload.laborTasks) ? payload.laborTasks : [],

          totals: {
            materialTotal: payload?.totals?.materialTotal || 0,
            laborTotal: payload?.totals?.laborTotal || 0,
            overheadAmount: payload?.totals?.overheadAmount || 0,
            wasteAmount: payload?.totals?.wasteAmount || 0,
            taxAmount: payload?.totals?.taxAmount || 0,
            grandTotal: payload?.totals?.grandTotal || 0,
          },

          overheadPct: payload.overheadPct || 0,
          wastePct: payload.wastePct || 0,
          taxRate: payload.taxRate || 0,
        },
      };

      setQuoteData(normalized);
    } catch (err) {
      console.error(err);
      setError("Quote not found in Firestore.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuote();
  }, [id]);

  if (loading) return <main className="quote-detail-page">Loading...</main>;
  if (error) return <main className="quote-detail-page">{error}</main>;
  if (!quoteData) return <main className="quote-detail-page">No quote found</main>;

  const payload = quoteData.payload;

  const items = payload.items;
  const laborTasks = payload.laborTasks;
  const totals = payload.totals;

  return (
    <main className="quote-detail-page">

      {/* HEADER */}
      <section className="quote-detail-header">
        <div>
          <h1>Quote #{quoteData.id.slice(0, 10)}</h1>
          <p>{quoteData.client}</p>
          <p>{quoteData.jobAddress}</p>

          {/* IMPORTANT FOR CALENDAR */}
          {quoteData.startDate && (
            <p>Start: {new Date(quoteData.startDate).toLocaleDateString()}</p>
          )}
          {quoteData.dueDate && (
            <p>End: {new Date(quoteData.dueDate).toLocaleDateString()}</p>
          )}
        </div>

        <div className="quote-detail-actions">
          <button onClick={fetchQuote}>Refresh</button>

          <button
            onClick={() => {
              localStorage.setItem("latestEstimate", JSON.stringify(quoteData));
              router.push("/print");
            }}
          >
            Print
          </button>

          <button
            onClick={() => {
              localStorage.setItem("editQuote", JSON.stringify(quoteData));
              router.push(`/edit/${quoteData.id}`);
            }}
          >
            Edit Quote
          </button>

          <button
            onClick={() => router.push(`/quotes/client/${quoteData.id}`)}
          >
            Client View
          </button>
        </div>
      </section>

      {/* ITEMS */}
      <section className="quote-document-card">
        <h2>Items</h2>

        {items.length ? (
          items.map((item, i) => {
            const total =
              item.total ||
              (item.qty * item.unitPrice) ||
              0;

            return (
              <div key={i}>
                {item.name} — {formatMoney(total)}
              </div>
            );
          })
        ) : (
          <p>No items</p>
        )}
      </section>

      {/* LABOR */}
      <section className="quote-document-card">
        <h2>Labor</h2>

        {laborTasks.length ? (
          laborTasks.map((task, i) => {
            const total =
              task.total ||
              (task.hours * task.rate) ||
              0;

            return (
              <div key={i}>
                {task.name} — {formatMoney(total)}
              </div>
            );
          })
        ) : (
          <p>No labor</p>
        )}
      </section>

      {/* SUMMARY */}
      <section className="quote-total-card">
        <h2>Summary</h2>

        <p>Materials: {formatMoney(totals.materialTotal)}</p>
        <p>Labor: {formatMoney(totals.laborTotal)}</p>
        <p>Overhead: {formatMoney(totals.overheadAmount)}</p>
        <p>Waste: {formatMoney(totals.wasteAmount)}</p>
        <p>Tax: {formatMoney(totals.taxAmount)}</p>

        <h3>Total: {formatMoney(totals.grandTotal)}</h3>
      </section>

      {/* NOTES */}
      {quoteData.notes && (
        <section>
          <h2>Notes</h2>
          <p>{quoteData.notes}</p>
        </section>
      )}
    </main>
  );
}

export default dynamic(() => Promise.resolve(QuoteDetails), {
  ssr: false,
});
