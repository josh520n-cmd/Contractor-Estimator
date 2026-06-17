import { useEffect, useState } from "react";
import { useRouter } from "next/router";

function formatMoney(n) {
  return "$" + Number(n || 0).toFixed(2);
}

export default function ClientQuoteView() {
  const router = useRouter();
  const { id } = router.query;

  const [quote, setQuote] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadQuote = async () => {
    if (!id) return;

    setLoading(true);

    try {
      const res = await fetch(`/api/quotes/${id}`);

      if (!res.ok) {
        throw new Error("Quote not found");
      }

      const data = await res.json();
      setQuote(data);

    } catch (err) {
      console.error(err);
      setError("This estimate is not available.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadQuote();
  }, [id]);

  if (loading) {
    return <main className="client-page">Loading estimate...</main>;
  }

  if (error) {
    return <main className="client-page">{error}</main>;
  }

  if (!quote) {
    return <main className="client-page">No estimate found.</main>;
  }

  const payload = quote.payload || quote;

  const items = payload.items || [];
  const labor = payload.laborTasks || [];
  const totals = payload.totals || {};

  const client = quote.client || payload.client || "Client";
  const address = quote.jobAddress || payload.jobAddress || "";

  return (
    <main className="client-page">

      <header className="client-header">
        <h1>Estimate</h1>
        <p>{client}</p>
        {address && <p>{address}</p>}
      </header>

      <section className="client-section">
        <h2>Items</h2>

        {items.length ? items.map((i, idx) => (
          <div key={idx} className="client-row">
            <span>{i.name || "Item"}</span>
            <strong>{formatMoney(i.total || 0)}</strong>
          </div>
        )) : <p>No items listed.</p>}
      </section>

      <section className="client-section">
        <h2>Labor</h2>

        {labor.length ? labor.map((l, idx) => (
          <div key={idx} className="client-row">
            <span>{l.name || "Labor"}</span>
            <strong>{formatMoney(l.total || 0)}</strong>
          </div>
        )) : <p>No labor listed.</p>}
      </section>

      <section className="client-total">
        <h2>Total</h2>
        <strong>{formatMoney(totals.grandTotal || 0)}</strong>
      </section>

    </main>
  );
}

