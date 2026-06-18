import { useEffect, useState } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import { normalizeQuote } from "../lib/normalizeQuote";

export default function Calendar() {
  const [events, setEvents] = useState([]);

  useEffect(() => {
    async function loadCalendarEvents() {
      const eventList = [];
      const seen = new Set();

      try {
        const res = await fetch("/api/quotes");

        if (res.ok) {
          const quotes = await res.json();

          quotes.forEach((raw) => {
            const quote = normalizeQuote(raw);

            if (!quote.id) return;
            seen.add(quote.id);

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
        }
      } catch (err) {
        console.error("Failed to load Firestore quotes for calendar:", err);
      }

      if (typeof window !== "undefined") {
        Object.keys(localStorage).forEach((key) => {
          if (!key.startsWith("quotes_")) return;

          try {
            const raw = JSON.parse(localStorage.getItem(key));
            const quote = normalizeQuote({
              id: raw.id || key.replace("quotes_", ""),
              ...raw,
            });

            if (!quote.id || seen.has(quote.id)) return;

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
          } catch (err) {
            console.error("Could not load local quote for calendar:", key, err);
          }
        });
      }

      setEvents(eventList);
    }

    loadCalendarEvents();
  }, []);

  return (
    <main className="calendar-page">
      <h1>Calendar</h1>

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
