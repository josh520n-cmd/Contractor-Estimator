import { useEffect, useRef, useState } from "react";
import { normalizeQuote } from "../lib/normalizeQuote";

function formatMoney(n) {
  return "$" + Number(n || 0).toFixed(2);
}

export default function Print() {
  const [quote, setQuote] = useState(null);
  const ref = useRef(null);

  useEffect(() => {
    document.body.dataset.print = "true";

    try {
      const raw = localStorage.getItem("latestEstimate");
      if (raw) setQuote(normalizeQuote(JSON.parse(raw)));
    } catch (e) {
      console.error(e);
    }

    return () => {
      document.body.removeAttribute("data-print");
    };
  }, []);

  if (!quote) return <div>Loading...</div>;

  return (
    <main ref={ref} className="print-page">

      <h1>Quote #{String(quote.estimateNumber).slice(0, 10)}</h1>

      <p>{quote.client}</p>
      <p>{quote.jobAddress}</p>

      {quote.startDate && (
        <p>Start: {new Date(quote.startDate).toLocaleDateString()}</p>
      )}
      {quote.dueDate && (
        <p>End: {new Date(quote.dueDate).toLocaleDateString()}</p>
      )}

      <hr />

      <h2>Items</h2>
      {quote.items.map((i, idx) => (
        <div key={idx}>
          {i.name || "Item"} — {formatMoney(i.total)}
        </div>
      ))}

      <h2>Labor</h2>
      {quote.laborTasks.map((l, idx) => (
        <div key={idx}>
          {l.name || "Labor"} — {formatMoney(l.total)}
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
