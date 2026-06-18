import { auth } from "../../lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

function formatDate(value) {
  if (!value) return "Unknown";

  try {
    return new Date(value).toLocaleString();
  } catch {
    return value;
  }
}

function formatMoney(value) {
  return "$" + Number(value || 0).toFixed(2);
}

const OWNER_EMAIL = "josh520n@gmail.com";

export default function QuotesListPage() {
  const [quotes, setQuotes] = useState(null);
  const [localQuotes, setLocalQuotes] = useState([]);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [processing, setProcessing] = useState(null);
  const [firebaseUser, setFirebaseUser] = useState(null);

  async function getAuthHeaders(user = auth.currentUser) {
    if (!user) {
      throw new Error("Please sign in first.");
    }

    const token = await user.getIdToken();

    return {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    };
  }

  function loadLocalQuotes(user = auth.currentUser) {
    if (typeof window === "undefined") return;

    if (!user) {
      setLocalQuotes([]);
      return;
    }

    const isOwner =
      String(user.email || "").toLowerCase() === OWNER_EMAIL.toLowerCase();

    const local = Object.entries(localStorage)
      .filter(([key]) => key.startsWith("quotes_"))
      .map(([key, value]) => {
        try {
          const parsed = JSON.parse(value);
          const payload = parsed.payload || parsed;

          const quoteUserId = parsed.userId || payload.userId || "";

          if (!isOwner && quoteUserId !== user.uid) {
            return null;
          }

          return {
            id: parsed.id || key.replace(/^quotes_/, ""),
            quoteId: parsed.quoteId || parsed.id || key.replace(/^quotes_/, ""),
            client: parsed.client || payload.client || "",
            created_at:
              parsed.createdAt ||
              parsed.created_at ||
              payload.createdAt ||
              new Date().toISOString(),
            createdAt:
              parsed.createdAt ||
              parsed.created_at ||
              payload.createdAt ||
              new Date().toISOString(),
            status: payload.status || parsed.status || "Draft",
            total: Number(
              payload?.totals?.grandTotal ||
                parsed?.totals?.grandTotal ||
                payload?.totals?.total ||
                parsed?.total ||
                0
            ),
            userId: quoteUserId,
            payload,
            localOnly: true,
          };
        } catch {
          return null;
        }
      })
      .filter(Boolean);

    setLocalQuotes(local);
  }

  async function loadQuotes(user = auth.currentUser) {
    setError("");

    if (!user) {
      setQuotes([]);
      setError("Please sign in to view saved quotes.");
      return;
    }

    try {
      const headers = await getAuthHeaders(user);

      const res = await fetch("/api/quotes", {
        headers,
      });

      const data = await res.json().catch(() => []);

      if (!res.ok) {
        throw new Error(data.error || "Failed to load quotes");
      }

      setQuotes(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Load quotes error:", err);
      setError("Unable to load quotes right now. Please refresh.");
      setQuotes([]);
    }
  }

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      setFirebaseUser(user);

      if (!user) {
        setQuotes([]);
        setLocalQuotes([]);
        setError("Please sign in to view saved quotes.");
        return;
      }

      await loadQuotes(user);
      loadLocalQuotes(user);
    });

    return () => unsub();
  }, []);

  const combinedQuotes = useMemo(() => {
    const firestoreQuotes = Array.isArray(quotes) ? quotes : [];
    const seen = new Set();

    const combined = [];

    for (const quote of firestoreQuotes) {
      if (!quote?.id) continue;
      seen.add(quote.id);
      combined.push(quote);
    }

    for (const quote of localQuotes) {
      if (!quote?.id || seen.has(quote.id)) continue;
      combined.push(quote);
    }

    return combined;
  }, [quotes, localQuotes]);

  const filteredQuotes = useMemo(() => {
    const term = search.trim().toLowerCase();

    if (!term) return combinedQuotes;

    return combinedQuotes.filter((quote) => {
      const haystack = [
        quote.client,
        quote.id,
        quote.quoteId,
        quote.estimateNumber,
        quote.status,
        quote.created_at,
        quote.createdAt,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return haystack.includes(term);
    });
  }, [combinedQuotes, search]);

  async function downloadBackup() {
    try {
      const headers = firebaseUser ? await getAuthHeaders(firebaseUser) : {};

      const res = await fetch("/api/backup", {
        headers,
      });

      const data = await res.json();

      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: "application/json",
      });

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");

      a.href = url;
      a.download = `contractor-estimator-backup-${new Date()
        .toISOString()
        .slice(0, 10)}.json`;

      a.click();

      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Backup download error:", err);
      alert("Backup failed.");
    }
  }

  async function restoreBackup(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (
      !confirm(
        "Restore this backup? Existing quotes with the same ID may be overwritten."
      )
    ) {
      return;
    }

    try {
      const text = await file.text();
      const backup = JSON.parse(text);
      const headers = firebaseUser ? await getAuthHeaders(firebaseUser) : {
        "Content-Type": "application/json",
      };

      const res = await fetch("/api/restore-backup", {
        method: "POST",
        headers,
        body: JSON.stringify(backup),
      });

      const result = await res.json();

      if (!res.ok) {
        alert(result.error || "Restore failed");
        return;
      }

      alert(`Backup restored. Quotes restored: ${result.restored}`);
      await loadQuotes(firebaseUser);
      loadLocalQuotes(firebaseUser);
    } catch (err) {
      alert(err.message || "Restore failed");
    }
  }

  async function duplicateQuote(id) {
    setProcessing(id);
    setError("");

    try {
      const headers = await getAuthHeaders(firebaseUser);

      const res = await fetch(`/api/quotes/${id}/duplicate`, {
        method: "POST",
        headers,
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.error || "Duplicate failed");
      }

      await loadQuotes(firebaseUser);
      loadLocalQuotes(firebaseUser);
    } catch (err) {
      console.error("Duplicate error:", err);
      setError("Unable to duplicate quote. Please try again.");
    } finally {
      setProcessing(null);
    }
  }

  async function deleteQuote(id) {
    if (!confirm("Delete this quote?")) return;

    setProcessing(id);
    setError("");

    try {
      const headers = await getAuthHeaders(firebaseUser);

      const res = await fetch(`/api/quotes/${id}`, {
        method: "DELETE",
        headers,
      });

      const result = await res.json().catch(() => ({}));

      if (!res.ok) {
        alert(result.error || "Delete failed");
        return;
      }

      localStorage.removeItem("quotes_" + id);

      const latest =
        sessionStorage.getItem("latestEstimate") ||
        localStorage.getItem("latestEstimate");

      if (latest && latest.includes(id)) {
        sessionStorage.removeItem("latestEstimate");
        localStorage.removeItem("latestEstimate");
      }

      setQuotes((prev) =>
        Array.isArray(prev) ? prev.filter((q) => q.id !== id) : []
      );

      setLocalQuotes((prev) => prev.filter((q) => q.id !== id));
    } catch (err) {
      console.error("Delete error:", err);
      alert(err.message || "Delete failed");
    } finally {
      setProcessing(null);
    }
  }

  async function toggleArchive(id, currentStatus) {
    setProcessing(id);
    setError("");

    try {
      const headers = await getAuthHeaders(firebaseUser);
      const newStatus = currentStatus === "archived" ? "active" : "archived";

      const res = await fetch(`/api/quotes/${id}`, {
        method: "PATCH",
        headers,
        body: JSON.stringify({ status: newStatus }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.error || "Archive update failed");
      }

      await loadQuotes(firebaseUser);
      loadLocalQuotes(firebaseUser);
    } catch (err) {
      console.error("Archive error:", err);
      setError("Unable to update quote status. Please try again.");
    } finally {
      setProcessing(null);
    }
  }

  return (
    <main className="saved-quotes-page">
      <section className="saved-quotes-header">
        <div>
          <p className="eyebrow">Saved work</p>
          <h1>Saved Quotes</h1>
          <p>
            Review saved estimates, duplicate past jobs, archive old quotes, and
            keep your work organized.
          </p>
        </div>

        <div className="saved-quotes-actions">
          <Link href="/estimate" className="new-quote-btn">
            + New Estimate
          </Link>

          <button onClick={downloadBackup} className="backup-btn">
            Download Backup
          </button>

          <label className="restore-btn">
            Restore Backup
            <input
              type="file"
              accept=".json,application/json"
              onChange={restoreBackup}
              style={{ display: "none" }}
            />
          </label>
        </div>
      </section>

      <section className="quotes-stats">
        <div className="quote-stat-card">
          <span>Total Quotes</span>
          <strong>{filteredQuotes.length}</strong>
        </div>

        <div className="quote-stat-card">
          <span>Total Value</span>
          <strong>
            {formatMoney(
              filteredQuotes.reduce(
                (sum, quote) => sum + Number(quote.total || 0),
                0
              )
            )}
          </strong>
        </div>

        <div className="quote-stat-card">
          <span>Archived</span>
          <strong>
            {
              filteredQuotes.filter((quote) => quote.status === "archived")
                .length
            }
          </strong>
        </div>
      </section>

      <section className="search-panel-pro">
        <input
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search by client, quote id, status, or date..."
          className="search-input-pro"
        />
      </section>

      {error && <p className="quotes-error">{error}</p>}

      {quotes === null ? (
        <section className="empty-quotes-card">
          <div className="empty-icon">⏳</div>
          <h2>Loading quotes...</h2>
          <p>Pulling your saved estimates now.</p>
        </section>
      ) : filteredQuotes.length === 0 ? (
        <section className="empty-quotes-card">
          <div className="empty-icon">📄</div>
          <h2>No quotes found</h2>

          {combinedQuotes.length > 0 ? (
            <p>Try a different search term.</p>
          ) : (
            <p>
              Use the <Link href="/estimate">estimate builder</Link> to create
              your first quote.
            </p>
          )}

          <Link href="/estimate" className="empty-action-btn">
            Create Estimate
          </Link>
        </section>
      ) : (
        <section className="quotes-grid">
          {filteredQuotes.map((quote) => {
            const isProcessing = processing === quote.id;
            const isArchived = quote.status === "archived";

            return (
              <article
                className={`quote-card ${isArchived ? "archived-card" : ""}`}
                key={quote.id}
              >
                <div className="quote-card-top">
                  <div>
                    <h2>{quote.client || "Unnamed client"}</h2>
                    <p>Quote ID: {String(quote.id).slice(0, 8)}</p>
                    {quote.localOnly && <p>Local backup copy</p>}
                  </div>

                  <span
                    className={`quote-status ${
                      isArchived ? "archived" : "active"
                    }`}
                  >
                    {quote.status || "Active"}
                  </span>
                </div>

                <div className="quote-card-details">
                  <div>
                    <span>Total</span>
                    <strong>{formatMoney(quote.total)}</strong>
                  </div>

                  <div>
                    <span>Date Created</span>
                    <strong>
                      {formatDate(quote.created_at || quote.createdAt)}
                    </strong>
                  </div>
                </div>

                <div className="quote-card-actions">
                  <Link href={`/quotes/${quote.id}`} className="view-quote-btn">
                    Open
                  </Link>

                  <button
                    onClick={() => duplicateQuote(quote.id)}
                    disabled={isProcessing || quote.localOnly}
                    className="edit-quote-btn"
                  >
                    Duplicate
                  </button>

                  <button
                    onClick={() => toggleArchive(quote.id, quote.status)}
                    disabled={isProcessing || quote.localOnly}
                    className="archive-quote-btn"
                  >
                    {isArchived ? "Restore" : "Archive"}
                  </button>

                  <button
                    onClick={() => deleteQuote(quote.id)}
                    disabled={isProcessing}
                    className="delete-quote-btn"
                  >
                    Delete
                  </button>
                </div>
              </article>
            );
          })}
        </section>
      )}
    </main>
  );
}
