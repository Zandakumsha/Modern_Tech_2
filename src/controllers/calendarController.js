import pool from "../config/db.js";

export async function listEvents(req, res) {
  try {
    const [rows] = await pool.query(
      `SELECT event_id AS id, DATE_FORMAT(event_date, '%Y-%m-%d') AS eventDate,
              title, TIME_FORMAT(event_time, '%H:%i') AS time,
              category, description
         FROM calendar_events
        ORDER BY event_date, event_time, event_id`
    );
    return res.json(rows);
  } catch (error) {
    console.error("Calendar list error:", error);
    return res.status(500).json({ error: "Unable to load calendar events." });
  }
}

export async function createEvent(req, res) {
  try {
    const { eventDate, event_date, title, time, event_time, category = "Work", description = "" } = req.body || {};
    const date = String(eventDate || event_date || "").trim();
    const eventTime = String(time || event_time || "").trim();
    const cleanTitle = String(title || "").trim();

    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return res.status(400).json({ error: "A valid event date is required." });
    if (!cleanTitle) return res.status(400).json({ error: "An event title is required." });
    if (!/^\d{2}:\d{2}$/.test(eventTime)) return res.status(400).json({ error: "A valid event time is required." });
    if (!new Set(["Work", "Personal", "Urgent"]).has(category)) return res.status(400).json({ error: "Invalid event category." });

    const [result] = await pool.query(
      `INSERT INTO calendar_events (event_date, title, event_time, category, description)
       VALUES (?, ?, ?, ?, ?)`,
      [date, cleanTitle, eventTime, category, String(description || "").trim()]
    );

    const [rows] = await pool.query(
      `SELECT event_id AS id, DATE_FORMAT(event_date, '%Y-%m-%d') AS eventDate,
              title, TIME_FORMAT(event_time, '%H:%i') AS time,
              category, description
         FROM calendar_events WHERE event_id = ?`,
      [result.insertId]
    );
    return res.status(201).json(rows[0]);
  } catch (error) {
    console.error("Calendar create error:", error);
    return res.status(500).json({ error: "Unable to create calendar event." });
  }
}

export async function deleteEvent(req, res) {
  try {
    const eventId = Number(req.params.id);
    if (!Number.isInteger(eventId) || eventId <= 0) return res.status(400).json({ error: "A valid event id is required." });
    const [result] = await pool.query("DELETE FROM calendar_events WHERE event_id = ?", [eventId]);
    if (!result.affectedRows) return res.status(404).json({ error: "Event not found." });
    return res.status(204).send();
  } catch (error) {
    console.error("Calendar delete error:", error);
    return res.status(500).json({ error: "Unable to delete calendar event." });
  }
}
