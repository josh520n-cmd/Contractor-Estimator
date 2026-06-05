import React, { useState, useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction'; // needed for dayClick, etc.


export default function Calendar() {
  const [events, setEvents] = useState([]);

    useEffect(() => {
        const savedEvents = [];
      
        Object.keys(localStorage).forEach((key) => {
          if (!key.startsWith("quotes_")) return;
      
          try {
            const quote = JSON.parse(localStorage.getItem(key));
            if (!quote) return;
          
            const start =
              quote.startDate ||
              quote.scheduledStartDate;
          
            const end =
              quote.dueDate ||
              quote.endDate ||
              quote.scheduledEndDate;
          
            if (!start) return;
          
            const label =
              quote.client ||
              quote.jobName ||
              quote.projectName ||
              "Estimate";
          
            const quoteUrl = `/quotes/${quote.id || key.replace("quotes_", "")}`;
          
            // Start date event
            savedEvents.push({
              title: `Start: ${label}`,
              start: start,
              url: quoteUrl,
            });
          
            // End date event
            if (end && end !== start) {
              savedEvents.push({
                title: `End: ${label}`,
                start: end,
                url: quoteUrl,
              });
            }
          } catch (err) {
            console.error("Could not load quote for calendar:", key, err);
          }

        }); // closes Object.keys().forEach()

        setEvents(savedEvents);

      }, []); // closes useEffect
         
      

  const handleDateClick = (info) => {
    alert('Clicked on: ' + info.dateStr);
  };

  return (
    <div className="container">
      <h1>Calendar</h1>
      <FullCalendar
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
        initialView="dayGridMonth"
        events={events}
        dateClick={handleDateClick}
        dayMaxEvents={3}
eventClick={(info) => {
  window.location.href = info.event.url;
}}
        // Add other FullCalendar options as needed
      />
    </div>
  );
}
