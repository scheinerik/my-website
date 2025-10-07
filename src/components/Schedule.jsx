import React, { useState, useEffect } from "react";
import "../styles/Schedule.css";

export default function Schedule() {
  const getManilaTime = () => {
    const now = new Date();
    return new Date(now.toLocaleString("en-US", { timeZone: "Asia/Manila" }));
  };

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

  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(getManilaTime()), 60000);
    return () => clearInterval(interval);
  }, []);

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
  const hours = Array.from({ length: 24 }, (_, i) =>
    i.toString().padStart(2, "0") + ":00"
  );

  const currentManilaDay = currentTime.getDate();
  const currentManilaHour = currentTime.getHours();
  const isCurrentMonth =
    currentYear === currentTime.getFullYear() &&
    currentMonth === currentTime.getMonth();

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
    setSelectedDay(null);
  };

  const handleSelectDay = (day) => {
    setSelectedDay(day);
    setFormData({ title: "", start: "10:00", end: "11:00" });
  };

  const addEvent = (e) => {
    e.preventDefault();
    if (!selectedDay) return alert("Please select a day first.");

    const [sh] = formData.start.split(":").map(Number);
    const [eh] = formData.end.split(":").map(Number);
    if (eh <= sh) return alert("End time must be after start time.");

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

  return (
    <div className="schedule-container">
      <div className="schedule-header">
        <button onClick={() => changeMonth(-1)}>←</button>
        <h2>
          {monthName} {currentYear}
        </h2>
        <button onClick={() => changeMonth(1)}>→</button>
      </div>

      <div className="schedule-grid-wrapper">
        <div className="schedule-grid-header">
          <div className="grid-label">Day</div>
          {hours.map((hour) => (
            <div
              key={hour}
              className={`grid-hour ${parseInt(hour) < 8 ? "sleep-hour" : ""}`}
            >
              {parseInt(hour) < 8 ? "Sleep" : hour}
            </div>
          ))}
        </div>

        {Array.from({ length: daysInMonth }, (_, i) => {
          const day = i + 1;
          const isWeekend = [0, 6].includes(
            new Date(currentYear, currentMonth, day).getDay()
          );

          return (
            <div
              key={day}
              className={`schedule-grid-row ${
                selectedDay === day ? "selected-day" : ""
              }`}
              onClick={() => handleSelectDay(day)}
            >
              <div
                className={`grid-label ${isWeekend ? "weekend-day" : ""}`}
              >
                {monthName.slice(0, 3)} {day}
              </div>

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
                ].join(" ");
                return <div key={index} className={cellClasses}></div>;
              })}

              {events
                .filter(
                  (ev) =>
                    ev.day === day &&
                    ev.year === currentYear &&
                    ev.month === currentMonth
                )
                .map((ev) => {
                  const startHour = parseInt(ev.start.split(":")[0]);
                  const endHour = parseInt(ev.end.split(":")[0]);
                  return (
                    <div
                      key={ev.id}
                      className="event-block"
                      style={{
                        gridColumn: `${startHour + 2} / ${endHour + 2}`,
                      }}
                      onDoubleClick={() => handleDeleteEvent(ev.id)}
                    >
                      {ev.title}
                    </div>
                  );
                })}
            </div>
          );
        })}
      </div>

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
