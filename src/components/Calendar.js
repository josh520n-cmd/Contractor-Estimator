import React, { useState, useEffect } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";

export default function Calendar() {
  const [events, setEvents] = useState([]);

  useEffect(() => {
    const savedEvents = [];

    Object.keys(localStorage).forEach((key) => {
      if (!key.startsWith("quotes_")) return;

      try {
        const quote = JSON.parse(localStorage.getItem(key));
        if (!quote) return;

        const start = quote.startDate || quote.scheduledStartDate;

        const end =
          quote.dueDate || quote.endDate || quote.scheduledEndDate;

        if (!start) return;

        const label =
          quote.client ||
          quote.jobName ||
          quote.projectName ||
          "Estimate";

        const quoteId = quote.id || key.replace("quotes_", "");
        const quoteUrl = `/quotes/${quoteId}`;

        savedEvents.push({
          title: `Start: ${label}`,
          start,
          url: quoteUrl,
          backgroundColor: "#2563eb",
          borderColor: "#2563eb",
        });

        if (end && end !== start) {
          savedEvents.push({
            title: `End: ${label}`,
            start: end,
            url: quoteUrl,
            backgroundColor: "#16a34a",
            borderColor: "#16a34a",
          });
        }
      } catch (err) {
        console.error("Could not load quote for calendar:", key, err);
      }
    });

    setEvents(savedEvents);
  }, []);

  const handleDateClick = (info) => {
    alert("Clicked on: " + info.dateStr);
  };

  return (
    <main className="calendar-page">
      <h1>Calendar</h1>

      <div className="calendar-container">
        <FullCalendar
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          events={events}
          dateClick={handleDateClick}
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
