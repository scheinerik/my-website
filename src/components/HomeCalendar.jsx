import React, { useState, useEffect } from "react";
import "../styles/HomeCalendar.css";

export default function HomeCalendar() {
  const getManilaTime = () => {
    const now = new Date();
    return new Date(now.toLocaleString("en-US", { timeZone: "Asia/Manila" }));
  };

  const [currentTime, setCurrentTime] = useState(getManilaTime());
  const [currentMonth, setCurrentMonth] = useState(currentTime.getMonth());
  const [currentYear, setCurrentYear] = useState(currentTime.getFullYear());
  const [events, setEvents] = useState([]);

  useEffect(() => {
    fetch("/api/events")
      .then((res) => res.json())
      .then((data) => setEvents(data))
      .catch((err) => console.error("Failed to load events:", err));
  }, []);

  const monthName = new Date(currentYear, currentMonth).toLocaleString("en-US", {
    month: "long",
  });

  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

  const changeMonth = (offset) => {
    let newMonth = currentMonth + offset;
    let newYear = currentYear;
    if (newMonth < 0) {
      newMonth = 11;
      newYear--;
    }
    if (newMonth > 11) {
      newMonth = 0;
      newYear++;
    }
    setCurrentMonth(newMonth);
    setCurrentYear(newYear);
  };

  return (
    <div className="home-calendar">
      <div className="calendar-header">
        <button onClick={() => changeMonth(-1)}>←</button>
        <h3>
          {monthName} {currentYear}
        </h3>
        <button onClick={() => changeMonth(1)}>→</button>
      </div>

      <div className="calendar-grid">
        {Array.from({ length: daysInMonth }, (_, i) => {
          const day = i + 1;

          const dayEvents = events.filter(
            (ev) =>
              ev.day === day &&
              ev.year === currentYear &&
              ev.month === currentMonth
          );

          // calculate total used hours
          const totalHoursUsed = dayEvents.reduce((sum, ev) => {
            const start = parseInt(ev.start.split(":")[0]);
            const end = parseInt(ev.end.split(":")[0]);
            return sum + (end - start);
          }, 0);

          const freeHours = Math.max(8 - totalHoursUsed, 0);
          const isFullDay = totalHoursUsed >= 8;

          return (
            <div
              key={day}
              className={`calendar-day ${isFullDay ? "full" : ""}`}
              title={
                isFullDay
                  ? `Full (8h used)`
                  : `${freeHours}h free (${totalHoursUsed}h used)`
              }
              onClick={() => (window.location.href = "/schedule")}
            >
              <div className="day-number">{day}</div>
              {isFullDay ? (
                <div className="status full">Full</div>
              ) : (
                <div className="status free">{freeHours}h free</div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
