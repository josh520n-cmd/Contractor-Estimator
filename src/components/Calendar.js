import React, { useState, useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction'; // needed for dayClick, etc.

// Import FullCalendar CSS directly here
import '@fullcalendar/common/main.css';
import '@fullcalendar/daygrid/main.css';
import '@fullcalendar/timegrid/main.css';

export default function Calendar() {
  const [events, setEvents] = useState([]);

  useEffect(() => {
    // Fetch events from your API or define them here
    // For now, using dummy data
    setEvents([
      { title: 'Meeting', start: '2023-10-26T10:00:00', end: '2023-10-26T11:00:00' },
      { title: 'Project Deadline', date: '2023-10-28' },
    ]);
  }, []);

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
        // Add other FullCalendar options as needed
      />
    </div>
  );
}
