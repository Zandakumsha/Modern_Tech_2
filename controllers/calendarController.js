import pool from "../config/db.js";

const fields = "SELECT event_id AS id, DATE_FORMAT(event_date, '%Y-%m-%d') AS eventDate, title, TIME_FORMAT(event_time, '%H:%i') AS time, category, description FROM calendar_events";

export async function listEvents(req, res) {
  try {
    const [rows] = await pool.query(fields + " ORDER BY event_date, event_time, event_id");
    return res.json(rows);
  } catch (error) {
    console.error("Calendar list error:", error);
    return res.status(500).json({ error: "Unable to load calendar events." });
  }
}

export async function createEvent(req, res) {
  const body = req.body || {};
  const date = String(body.eventDate ?? body.event_date ?? "").trim();
  const time = String(body.time ?? body.event_time ?? "").trim();
  const title = String(body.title ?? "").trim();
  const category = String(body.category ?? "Work").trim();
  const description = String(body.description ?? "").trim();
  const dateValue = new Date(date + "T00:00:00Z");

  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || Number.isNaN(dateValue.getTime()) || dateValue.toISOString().slice(0, 10) !== date) {
    return res.status(400).json({ error: "A valid event date is required." });
  }
  if (!title || title.length > 200) return res.status(400).json({ error: "Enter an event title of 1–200 characters." });
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) return res.status(400).json({ error: "A valid event time is required." });
  if (!["Work", "Personal", "Urgent"].includes(category)) return res.status(400).json({ error: "Invalid event category." });

  try {
    const [result] = await pool.query(
      "INSERT INTO calendar_events (event_date, title, event_time, category, description) VALUES (?, ?, ?, ?, ?)",
      [date, title, time, category, description],
    );
    const [rows] = await pool.query(fields + " WHERE event_id = ?", [result.insertId]);
    return res.status(201).json(rows[0]);
  } catch (error) {
    console.error("Calendar create error:", error);
    const schemaError = ["ER_NO_SUCH_TABLE", "ER_BAD_FIELD_ERROR", "ER_WRONG_VALUE", "ER_TRUNCATED_WRONG_VALUE"].includes(error.code);\n    return res.status(500).json({ error: schemaError ? "The calendar_events database table is missing or does not match the required schema. Run database/calendar-events-migration.sql against the configured database." : "Unable to save the event. Check the server logs for the database error.", code: process.env.NODE_ENV === "production" ? undefined : error.code });
  }
}

export async function deleteEvent(req, res) {
  const id = Number(req.params.id);
  if (!Number.isSafeInteger(id) || id <= 0) return res.status(400).json({ error: "A valid event id is required." });
  try {
    const [result] = await pool.query("DELETE FROM calendar_events WHERE event_id = ?", [id]);
    if (!result.affectedRows) return res.status(404).json({ error: "Event not found." });
    return res.status(204).send();
  } catch (error) {
    console.error("Calendar delete error:", error);
    return res.status(500).json({ error: "Unable to delete the event." });
  }
}
