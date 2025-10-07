import React, { useState, useEffect } from "react";
import "../styles/Schedule.css";

export default function Schedule() {
  // 🕐 Get Manila time
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

  // 🕒 Update Manila time every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(getManilaTime());
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  // 🟢 Load all events from Cloudflare D1
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

  // 🟢 Add new event to D1
  const addEvent = (e) => {
    e.preventDefault();
    if (!selectedDay) return alert("Please select a day first.");

    const [sh, sm] = formData.start.split(":").map(Number);
    const [eh, em] = formData.end.split(":").map(Number);
    const startIndex = sh;
    const endIndex = eh + (em > 0 ? 1 : 0);

    if (endIndex <= startIndex)
      return alert("End time must be after start time.");

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

  // 🗑️ Delete an event from D1
  const handleDeleteEvent = (id) => {
    if (!window.confirm("Delete this event?")) return;

    fetch(`/api/events?id=${id}`, { method: "DELETE" })
      .then((res) => res.json())
      .then(() => {
        setEvents((prev) => prev.filter((e) => e.id !== id));
      })
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

      <div className="table-wrapper">
        <table className="schedule-table">
          <thead>
            <tr>
              <th>Day</th>
              {hours.map((hour) => (
                <th key={hour}>{hour}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: daysInMonth }, (_, i) => {
              const day = i + 1;
              const isWeekend =
                [0, 6].includes(
                  new Date(currentYear, currentMonth, day).getDay()
                ); // Sunday(0) or Saturday(6)
              return (
                <tr
                  key={day}
                  onClick={() => handleSelectDay(day)}
                  className={selectedDay === day ? "selected-day" : ""}
                >
                  <td
                    className={`day-label ${isWeekend ? "weekend-day" : ""}`}
                  >
                    {monthName.slice(0, 3)} {day}
                  </td>

                  {hours.map((_, hourIndex) => {
                    const match = events.find(
                      (ev) =>
                        ev.day === day &&
                        ev.year === currentYear &&
                        ev.month === currentMonth &&
                        hourIndex >= parseInt(ev.start.split(":")[0]) &&
                        hourIndex < parseInt(ev.end.split(":")[0])
                    );

                    const isPast =
                      isCurrentMonth &&
                      (day < currentManilaDay ||
                        (day === currentManilaDay &&
                          hourIndex < currentManilaHour));

                    return (
                      <td
                        key={hourIndex}
                        className={`schedule-cell 
                          ${isPast ? "past-cell" : ""} 
                          ${isWeekend ? "weekend-cell" : ""}`}
                      >
                        {match &&
                          hourIndex === parseInt(match.start.split(":")[0]) && (
                            <div
                              className="event-block"
                              style={{
                                gridColumn: `span ${
                                  parseInt(match.end.split(":")[0]) -
                                  parseInt(match.start.split(":")[0])
                                }`,
                                width: `${
                                  (parseInt(match.end.split(":")[0]) -
                                    parseInt(match.start.split(":")[0])) *
                                  70
                                }px`,
                              }}
                              onDoubleClick={() =>
                                handleDeleteEvent(match.id)
                              }
                            >
                              {match.title}
                            </div>
                          )}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
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
