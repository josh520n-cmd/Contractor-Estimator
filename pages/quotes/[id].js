import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import dynamic from 'next/dynamic';

function formatMoney(n) { return '$' + Number(n || 0).toFixed(2); }

// Component for quote details, designed to run client-side only
function QuoteDetails({ id }) {
  const router = useRouter();
  const [quoteData, setQuoteData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Function to refetch data
  const refetchData = async () => {
    setLoading(true);
    setError(null);
    setQuoteData(null); // Reset data before refetching

    try {
      // 1. Try fetching from API
      const res = await fetch(`/api/quotes/${id || router.query.id}`); 
      if (res.ok) {
        const data = await res.json();
        setQuoteData(data);
        setLoading(false);
        console.log("Successfully fetched quote from API:", data);
        return;
      } else {
        console.warn(`API fetch failed with status: ${res.status}`);
      }
    } catch (apiError) {
      console.error("Error fetching quote from API:", apiError);
    }

    // 2. If API failed, try localStorage
    if (typeof window !== 'undefined') {
      try {
        const localStorageKey = 'quotes_' + (id || router.query.id);
        console.log("Attempting to read from localStorage with key:", localStorageKey);
        
        // --- NEW LOGGING: Log all localStorage keys ---
        console.log("All keys in localStorage:", Object.keys(localStorage));
        // --- END NEW LOGGING ---

        const localValue = localStorage.getItem(localStorageKey);
        
        if (localValue && localValue !== 'null' && localValue !== 'undefined' && localValue.length > 0) {
          console.log("Found value in localStorage:", localValue);
          const parsed = JSON.parse(localValue);
          console.log("Parsed value from localStorage (before payload construction):", parsed); 

          if (parsed && typeof parsed === 'object') {
            let quotePayload = { items: [], laborTasks: [] }; 

            if (parsed.items && Array.isArray(parsed.items)) {
              quotePayload.items = parsed.items;
              quotePayload.laborTasks = Array.isArray(parsed.laborTasks) ? parsed.laborTasks : [];
              quotePayload.overheadPct = parsed.overheadPct;
              quotePayload.profitPct = parsed.profitPct;
              quotePayload.wastePct = parsed.wastePct;
              quotePayload.taxRate = parsed.taxRate;
              quotePayload.companySettings = parsed.companySettings;
              quotePayload.totals = parsed.totals;
            } else if (parsed.payload && typeof parsed.payload === 'object') {
              quotePayload = {
                ...parsed.payload, 
                items: Array.isArray(parsed.payload.items) ? parsed.payload.items : [], 
                laborTasks: Array.isArray(parsed.payload.laborTasks) ? parsed.payload.laborTasks : [],
              };
            }
            console.log("Constructed quotePayload:", quotePayload); 

            setQuoteData({
              id: id || router.query.id, 
              client: parsed.client || '', 
              notes: parsed.notes || '',   
              payload: quotePayload, 
              startDate: parsed.startDate || '',
              dueDate: parsed.dueDate || '',
            });
            setLoading(false); // Set loading to false here after successful data load
          } else {
            console.error("localStorage data is not a valid object:", parsed);
            setError("Invalid quote data format.");
            setLoading(false); // Set loading to false on error
          }
        } else {
          console.log("No valid value found in localStorage for key:", localStorageKey);
          setError("Quote not found or empty.");
          setLoading(false); // Set loading to false on error
        }
      } catch (localStorageError) {
        console.error("Error reading from localStorage:", localStorageError);
        setError("Could not load quote data from local storage.");
        setLoading(false); // Set loading to false on error
      }
    } else {
      console.error("Quote not found and not in a browser environment for localStorage.");
      setError("Quote not found. Data unavailable.");
      setLoading(false); // Set loading to false on error
    }
  };

  useEffect(() => {
    const currentId = id || router.query.id;
    if (!currentId) return;
    refetchData();
  }, [id, router.query.id]);

  if (loading) {
    return <div className="container">Loading...</div>;
  }

  if (error) {
    return <div className="container error-message">{error}</div>;
  }

  if (!quoteData) {
    return <div className="container">No quote data available.</div>;
  }

  return (
    <main className="container">
      <div className="page-header">
        <div>
          <h1>Quote #{quoteData.id ? quoteData.id.substring(0, 6) : 'N/A'}</h1>
          <p>Client: {quoteData.client || 'N/A'}</p>
          {quoteData.startDate && <p>Start Date: {new Date(quoteData.startDate).toLocaleDateString()}</p>}
          {quoteData.dueDate && <p>Due Date: {new Date(quoteData.dueDate).toLocaleDateString()}</p>}
        </div>
        <button onClick={refetchData} className="secondary">Refresh Quote</button>
      </div>

      {quoteData.payload && Object.keys(quoteData.payload).length > 0 ? (
        <section>
          <h2>Details</h2>
          {quoteData.payload.items && quoteData.payload.items.length > 0 ? (
            <ul>
              {quoteData.payload.items.map((item, index) => (
                <li key={index}>
                  {item.name} - {formatMoney(item.price)}
                </li>
              ))}
            </ul>
          ) : (
            <p>No items in payload.</p>
          )}
        </section>
      ) : (
        <section>
          <h2>Details</h2>
          <p>No details available.</p>
        </section>
      )}


      {quoteData.notes && (
        <section>
          <h2>Notes</h2>
          <p>{quoteData.notes}</p>
        </section>
      )}
    </main>
  );
}

const QuotePage = dynamic(() => Promise.resolve(QuoteDetails), { ssr: false });

export default QuotePage;
