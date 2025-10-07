// Sections.jsx
import React, { useState, useEffect } from "react";
import "../styles/Schedule.css";

export default function Sections() {
  // --- Time helpers (Asia/Manila) ---
  const getManilaTime = () => {
    const now = new Date();
    return new Date(
      now.toLocaleString("en-US", { timeZone: "Asia/Manila" })
    );
  };

  // --- State ---
  const [currentTime, setCurrentTime] = useState(getManilaTime());
  const [currentMonth, setCurrentMonth] = useState(currentTime.getMonth());
  const [currentYear, setCurrentYear] = useState(currentTime.getFullYear());
  const [selectedDay, setSelectedDay] = useState(null);
  const [events, setEvents] = useState([]);
  const [formData, setFormData] = useState({
    title: "",
    start: "10:00",
    end: "11:00",
  });

  // Update the clock every minute
  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(getManilaTime()), 60000);
    return () => clearInterval(interval);
  }, []);

  // Load events
  useEffect(() => {
    fetch("/api/events")
      .then((res) => res.json())
      .then((data) => setEvents(data))
      .catch((err) => console.error("Failed to load events:", err));
  }, []);

  // --- Derived values ---
  const monthName = new Date(currentYear, currentMonth).toLocaleString(
    "en-US",
    { month: "long" }
  );
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const hours = Array.from({ length: 24 }, (_, i) =>
    i.toString().padStart(2, "0") + ":00"
  );

  const currentManilaDay = currentTime.getDate();
  const currentManilaHour = currentTime.getHours();
  const isCurrentMonth =
    currentYear === currentTime.getFullYear() &&
    currentMonth === currentTime.getMonth();

  // --- Actions ---
  const changeMonth = (offset) => {
    let newMonth = currentMonth + offset;
    let newYear = currentYear;
    if (newMonth < 0) {
      newMonth = 11;
      newYear--;
    } else if (newMonth > 11) {
      newMonth = 0;
      newYear++;
    }
    setCurrentMonth(newMonth);
    setCurrentYear(newYear);
    setSelectedDay(null);
  };

  const handleSelectDay = (day) => {
    setSelectedDay(day);
    setFormData({ title: "", start: "10:00", end: "11:00" });
  };

  const addEvent = (e) => {
    e.preventDefault();
    if (!selectedDay) return alert("Please select a day first.");

    const [sh, sm] = formData.start.split(":").map(Number);
    const [eh, em] = formData.end.split(":").map(Number);
    const startMin = sh * 60 + (sm || 0);
    const endMin = eh * 60 + (em || 0);
    if (endMin <= startMin) return alert("End time must be after start time.");

    const newEvent = {
      year: currentYear,
      month: currentMonth,
      day: selectedDay,
      start: formData.start,
      end: formData.end,
      title: formData.title,
    };

    fetch("/api/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newEvent),
    })
      .then((res) => res.json())
      .then((data) => {
        setEvents((prev) => [
          ...prev,
          { ...newEvent, id: data.id || Date.now() },
        ]);
        setSelectedDay(null);
      })
      .catch((err) => console.error("Failed to save event:", err));
  };

  const handleDeleteEvent = (id) => {
    if (!window.confirm("Delete this event?")) return;
    fetch(`/api/events?id=${id}`, { method: "DELETE" })
      .then((res) => res.json())
      .then(() => setEvents((prev) => prev.filter((e) => e.id !== id)))
      .catch((err) => console.error("Failed to delete event:", err));
  };

  // --- Render ---
  return (
    <div className="schedule-container">
      {/* Header (month switcher) */}
      <div className="schedule-header">
        <button onClick={() => changeMonth(-1)}>←</button>
        <h2>
          {monthName} {currentYear}
        </h2>
        <button onClick={() => changeMonth(1)}>→</button>
      </div>

      <div className="schedule-grid-wrapper">
        {/* GRID HEADER */}
        <div
          className="schedule-grid-header"
          style={{
            display: "grid",
            gridTemplateColumns: "var(--label-w, 120px) repeat(24, 1fr)",
            columnGap: 0,
          }}
        >
          <div className="grid-label">Day</div>

          {/* One merged cell for Sleep 0:00–08:00 */}
          <div
            className="grid-hour sleep-merged"
            style={{ gridColumn: "2 / span 8", textAlign: "center" }}
          >
            0:00–08:00 Sleep
          </div>

          {/* Hour labels from 08:00 → 23:00 */}
          {hours.slice(8).map((hour) => (
            <div key={hour} className="grid-hour">
              {hour}
            </div>
          ))}
        </div>

        {/* GRID ROWS */}
        {Array.from({ length: daysInMonth }, (_, i) => {
          const day = i + 1;
          const isWeekend = [0, 6].includes(
            new Date(currentYear, currentMonth, day).getDay()
          );

          const dayEvents = events.filter(
            (ev) =>
              ev.day === day &&
              ev.year === currentYear &&
              ev.month === currentMonth
          );

          return (
            <div
              key={day}
              className={`schedule-grid-row ${
                selectedDay === day ? "selected-day" : ""
              }`}
              onClick={() => handleSelectDay(day)}
              style={{
                position: "relative",
                display: "grid",
                gridTemplateColumns: "var(--label-w, 120px) repeat(24, 1fr)",
                columnGap: 0,
              }}
            >
              {/* Day label */}
              <div className={`grid-label ${isWeekend ? "weekend-day" : ""}`}>
                {monthName.slice(0, 3)} {day}
              </div>

              {/* 24 hour cells */}
              {hours.map((_, index) => {
                const isPast =
                  isCurrentMonth &&
                  (day < currentManilaDay ||
                    (day === currentManilaDay && index < currentManilaHour));

                const cellClasses = [
                  "grid-hour",
                  index < 8 ? "sleep-cell" : "",
                  isPast ? "past-cell" : "",
                  isWeekend ? "weekend-cell" : "",
                ]
                  .filter(Boolean)
                  .join(" ");

                return <div key={index} className={cellClasses} />;
              })}

              {/* Event blocks (positioned with minute-precision across 24h) */}
              {dayEvents.map((ev) => {
                const [sh, sm] = ev.start.split(":").map(Number);
                const [eh, em] = ev.end.split(":").map(Number);

                const startMin = sh * 60 + (sm || 0);
                const endMin = eh * 60 + (em || 0);
                const totalMin = 24 * 60;

                if (endMin <= startMin) return null;

                const leftPct = (startMin / totalMin) * 100;
                const widthPct = ((endMin - startMin) / totalMin) * 100;

                return (
                  <div
                    key={ev.id}
                    className="event-block"
                    style={{
                      position: "absolute",
                      top: 4,
                      height: "calc(100% - 8px)",
                      zIndex: 2,
                      left: `calc(${leftPct}% + var(--label-w, 120px))`,
                      width: `calc(${widthPct}% - 2px)`,
                    }}
                    title={`${ev.title} (${ev.start}–${ev.end})`}
                    onDoubleClick={(e) => {
                      e.stopPropagation();
                      handleDeleteEvent(ev.id);
                    }}
                  >
                    {ev.title || `${ev.start}–${ev.end}`}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>

      {/* Add Event form */}
      {selectedDay && (
        <div className="event-form-section">
          <h3>
            Add Event — {monthName} {selectedDay}, {currentYear}
          </h3>
          <form onSubmit={addEvent} className="event-form">
            <input
              type="text"
              placeholder="Activity name"
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              required
            />
            <div className="time-inputs">
              <label>Start:</label>
              <input
                type="time"
                value={formData.start}
                onChange={(e) =>
                  setFormData({ ...formData, start: e.target.value })
                }
                required
              />
              <label>End:</label>
              <input
                type="time"
                value={formData.end}
                onChange={(e) =>
                  setFormData({ ...formData, end: e.target.value })
                }
                required
              />
            </div>
            <button type="submit">Add Event</button>
          </form>
        </div>
      )}
    </div>
  );
}
