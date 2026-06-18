import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { normalizeQuote } from "../../lib/normalizeQuote";

function formatMoney(n) {
  return "$" + Number(n || 0).toFixed(2);
}

export default function QuotePage() {
  const router = useRouter();
  const { id } = router.query;

  const [quote, setQuote] = useState(null);

  useEffect(() => {
    if (!id) return;

    async function load() {
      const res = await fetch(`/api/quotes/${id}`);
      const data = await res.json();
      setQuote(normalizeQuote(data));
    }

    load();
  }, [id]);

  if (!quote) return <div>Loading...</div>;

  return (
    <main className="quote-page">

      <h1>Quote #{String(quote.estimateNumber).slice(0, 10)}</h1>

      <p>{quote.client}</p>
      <p>{quote.jobAddress}</p>

      {quote.startDate && (
        <p>Start: {new Date(quote.startDate).toLocaleDateString()}</p>
      )}
      {quote.dueDate && (
        <p>End: {new Date(quote.dueDate).toLocaleDateString()}</p>
      )}

      <h2>Items</h2>
      {quote.items.map((i, idx) => (
        <div key={idx}>
          {i.name} — {formatMoney(i.total)}
        </div>
      ))}

      <h2>Labor</h2>
      {quote.laborTasks.map((l, idx) => (
        <div key={idx}>
          {l.name} — {formatMoney(l.total)}
        </div>
      ))}

      <h2>Summary</h2>
      <p>Materials: {formatMoney(quote.totals.materialTotal)}</p>
      <p>Labor: {formatMoney(quote.totals.laborTotal)}</p>
      <p>Overhead: {formatMoney(quote.totals.overheadAmount)}</p>
      <p>Waste: {formatMoney(quote.totals.wasteAmount)}</p>
      <p>Tax: {formatMoney(quote.totals.taxAmount)}</p>
      <h3>Total: {formatMoney(quote.totals.grandTotal)}</h3>
    </main>
  );
}
