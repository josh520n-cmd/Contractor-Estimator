import { useEffect, useState } from "react";

export default function Calendar() {
  const [events, setEvents] = useState([]);

  useEffect(() => {
    const saved = [];

    Object.keys(localStorage).forEach((key) => {
      if (!key.startsWith("quotes_")) return;

      try {
        const q = JSON.parse(localStorage.getItem(key));
        const payload = q.payload || q;

        const start =
          payload.startDate ||
          payload.scheduledStartDate ||
          q.startDate;

        const end =
          payload.dueDate ||
          payload.endDate ||
          q.dueDate;

        const label = q.client || payload.client || "Estimate";

        const url = `/quotes/${q.id || key.replace("quotes_", "")}`;

        if (start) {
          saved.push({
            title: `Start: ${label}`,
            start,
            url,
          });
        }

        if (end) {
          saved.push({
            title: `End: ${label}`,
            start: end,
            url,
          });
        }
      } catch (e) {}
    });

    setEvents(saved);
  }, []);

  return (
    <div className="calendar">
      <h1>Calendar</h1>
      <pre>{JSON.stringify(events, null, 2)}</pre>
    </div>
  );
}
