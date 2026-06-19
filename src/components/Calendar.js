import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../../lib/firebase";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import { normalizeQuote } from "../../lib/normalizeQuote";

export default function Calendar() {
  const [events, setEvents] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        setEvents([]);
        setError("Please sign in to view your schedule.");
        setLoading(false);
        return;
      }

      await loadCalendarEvents(firebaseUser);
    });

    return () => unsubscribe();
  }, []);

  async function loadCalendarEvents(firebaseUser) {
    setLoading(true);
    setError("");

    try {
      const token = await firebaseUser.getIdToken(true);

      const res = await fetch("/api/quotes", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      const data = await res.json().catch(() => []);

      if (!res.ok) {
        throw new Error(data.error || "Failed to load calendar quotes.");
      }

      const eventList = [];

      data.forEach((raw) => {
        const quote = normalizeQuote(raw);

        if (!quote.id) return;

        const label =
          quote.client ||
          quote.estimateNumber ||
          "Estimate";

        const url = `/quotes/${quote.id}`;

        if (quote.startDate) {
          eventList.push({
            title: `Start: ${label}`,
            start: quote.startDate,
            url,
            backgroundColor: "#2563eb",
            borderColor: "#2563eb",
          });
        }

        if (quote.dueDate && quote.dueDate !== quote.startDate) {
          eventList.push({
            title: `End: ${label}`,
            start: quote.dueDate,
            url,
            backgroundColor: "#16a34a",
            borderColor: "#16a34a",
          });
        }
      });

      setEvents(eventList);
    } catch (err) {
      console.error("Calendar load error:", err);
      setError(err.message || "Unable to load your schedule right now.");
      setEvents([]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="calendar-page">
      <h1>Calendar</h1>

      {loading && <p>Loading schedule...</p>}

      {error && <p className="quotes-error">{error}</p>}

      <div className="calendar-container">
        <FullCalendar
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          events={events}
          dayMaxEvents={3}
          height="auto"
          eventClick={(info) => {
            info.jsEvent.preventDefault();

            if (info.event.url) {
              window.location.href = info.event.url;
            }
          }}
        />
      </div>
    </main>
  );
}
