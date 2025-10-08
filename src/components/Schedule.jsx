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
    repeat: "none",
    repeatCount: 1, // how many days/weeks/months to repeat
  });

  // Update current time every minute
  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(getManilaTime()), 60000);
    return () => clearInterval(interval);
  }, []);

  // Load events from API
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
    setFormData({
      title: "",
      start: "10:00",
      end: "11:00",
      repeat: "none",
      repeatCount: 1,
    });
  };

  // Add event (with repeat support)
  const addEvent = (e) => {
    e.preventDefault();
    if (!selectedDay) return alert("Please select a day first.");

    const [sh] = formData.start.split(":").map(Number);
    const [eh] = formData.end.split(":").map(Number);
    if (eh <= sh) return alert("End time must be after start time.");

    const newEvents = [];
    const repeatGroupId = formData.repeat !== "none" ? Date.now() : null;

    const baseEvent = {
      year: currentYear,
      month: currentMonth,
      day: selectedDay,
      start: formData.start,
      end: formData.end,
      title: formData.title,
      repeat: formData.repeat,
      repeatId: repeatGroupId,
    };
    newEvents.push(baseEvent);

    // Generate repeating events
    if (formData.repeat !== "none") {
      const repeatCount = Math.min(
        Math.max(parseInt(formData.repeatCount) || 1, 1),
        365
      ); // limit to max 1 year worth

      for (let i = 1; i <= repeatCount; i++) {
        const date = new Date(currentYear, currentMonth, selectedDay);

        if (formData.repeat === "daily") {
          date.setDate(date.getDate() + i);
        } else if (formData.repeat === "weekly") {
          date.setDate(date.getDate() + i * 7);
        } else if (formData.repeat === "monthly") {
          date.setMonth(date.getMonth() + i);
        }

        newEvents.push({
          year: date.getFullYear(),
          month: date.getMonth(),
          day: date.getDate(),
          start: formData.start,
          end: formData.end,
          title: formData.title,
          repeat: formData.repeat,
          repeatId: repeatGroupId,
        });
      }
    }

    // Save all events
    newEvents.forEach((ev) => {
      fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(ev),
      })
        .then((res) => res.json())
        .then((data) =>
          setEvents((prev) => [
            ...prev,
            { ...ev, id: data.id || Date.now() + Math.random() },
          ])
        )
        .catch((err) => console.error("Failed to save event:", err));
    });

    setSelectedDay(null);
  };

  // Delete event (single or all repeats)
  const handleDeleteEvent = (id) => {
    const targetEvent = events.find((e) => e.id === id);
    if (!targetEvent) return;

    if (targetEvent.repeat && targetEvent.repeat !== "none" && targetEvent.repeatId) {
      const choice = window.confirm(
        "This event is part of a repeating series.\n\nClick OK to delete ALL repeated events, or Cancel to delete only this one."
      );

      if (choice) {
        fetch(`/api/events?repeatId=${targetEvent.repeatId}`, { method: "DELETE" })
          .then((res) => res.json())
          .then(() =>
            setEvents((prev) => prev.filter((e) => e.repeatId !== targetEvent.repeatId))
          )
          .catch((err) => console.error("Failed to delete repeat series:", err));
        return;
      }
    }

    fetch(`/api/events?id=${id}`, { method: "DELETE" })
      .then((res) => res.json())
      .then(() => setEvents((prev) => prev.filter((e) => e.id !== id)))
      .catch((err) => console.error("Failed to delete event:", err));
  };

  return (
    <div className="schedule-container">
      {/* Month Navigation */}
      <div className="schedule-header">
        <button onClick={() => changeMonth(-1)}>←</button>
        <h2>
          {monthName} {currentYear}
        </h2>
        <button onClick={() => changeMonth(1)}>→</button>
      </div>

      {/* Grid Header */}
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

        {/* Daily Rows */}
        {Array.from({ length: daysInMonth }, (_, i) => {
          const day = i + 1;
          const isWeekend = [0, 6].includes(
            new Date(currentYear, currentMonth, day).getDay()
          );

          const dayEvents = events
            .filter(
              (ev) =>
                ev.day === day &&
                ev.year === currentYear &&
                ev.month === currentMonth
            )
            .sort(
              (a, b) =>
                parseInt(a.start.split(":")[0]) -
                parseInt(b.start.split(":")[0])
            );

          const totalHoursUsed = dayEvents.reduce((sum, ev) => {
            const start = parseInt(ev.start.split(":")[0]);
            const end = parseInt(ev.end.split(":")[0]);
            return sum + (end - start);
          }, 0);

          const isFullDay = totalHoursUsed >= 8;

          return (
            <div
              key={day}
              className={`schedule-grid-row ${
                selectedDay === day ? "selected-day" : ""
              } ${isFullDay ? "full-day" : ""}`}
              onClick={() => handleSelectDay(day)}
            >
              <div className={`grid-label ${isWeekend ? "weekend-day" : ""}`}>
                {monthName.slice(0, 3)} {day}
              </div>

              {/* Build cells */}
              {(() => {
                const cells = [];
                let currentHour = 0;

                for (const ev of dayEvents) {
                  const start = parseInt(ev.start.split(":")[0]);
                  const end = parseInt(ev.end.split(":")[0]);

                  // Fill blank cells before event
                  for (; currentHour < start; currentHour++) {
                    const isPast =
                      isCurrentMonth &&
                      (day < currentManilaDay ||
                        (day === currentManilaDay &&
                          currentHour < currentManilaHour));

                    const cellClasses = [
                      "grid-hour",
                      currentHour < 8 ? "sleep-cell" : "",
                      isPast ? "past-cell" : "",
                      isWeekend ? "weekend-cell" : "",
                    ].join(" ");

                    cells.push(
                      <div
                        key={`cell-${day}-${currentHour}`}
                        className={cellClasses}
                      ></div>
                    );
                  }

                  // Event block
                  cells.push(
                    <div
                      key={`event-${day}-${ev.id}`}
                      className="event-block"
                      style={{
                        gridColumn: `span ${end - start}`,
                      }}
                      onDoubleClick={() => handleDeleteEvent(ev.id)}
                    >
                      {ev.title}
                      {ev.repeat !== "none" && (
                        <span className="repeat-icon"> 🔁</span>
                      )}
                    </div>
                  );

                  currentHour = end;
                }

                // Fill remaining cells
                for (; currentHour < 24; currentHour++) {
                  const isPast =
                    isCurrentMonth &&
                    (day < currentManilaDay ||
                      (day === currentManilaDay &&
                        currentHour < currentManilaHour));

                  const cellClasses = [
                    "grid-hour",
                    currentHour < 8 ? "sleep-cell" : "",
                    isPast ? "past-cell" : "",
                    isWeekend ? "weekend-cell" : "",
                  ].join(" ");

                  cells.push(
                    <div
                      key={`cell-${day}-${currentHour}`}
                      className={cellClasses}
                    ></div>
                  );
                }

                return cells;
              })()}
            </div>
          );
        })}
      </div>

      {/* Add Event Form */}
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

              <label>Repeat:</label>
              <select
                value={formData.repeat}
                onChange={(e) =>
                  setFormData({ ...formData, repeat: e.target.value })
                }
              >
                <option value="none">No Repeat</option>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>

              {formData.repeat !== "none" && (
                <>
                  <label>Repeat For:</label>
                  <input
                    type="number"
                    min="1"
                    max="365"
                    value={formData.repeatCount}
                    onChange={(e) =>
                      setFormData({ ...formData, repeatCount: e.target.value })
                    }
                    style={{ width: "80px" }}
                  />
                  <span style={{ marginLeft: "4px" }}>
                    {formData.repeat === "daily"
                      ? "days"
                      : formData.repeat === "weekly"
                      ? "weeks"
                      : "months"}
                  </span>
                </>
              )}
            </div>

            <button type="submit">Add Event</button>
          </form>
        </div>
      )}
    </div>
  );
}
