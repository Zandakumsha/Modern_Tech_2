import pool from "../config/db.js";

function ownerFor(req) {
  const configured = String(process.env.HR_USERNAME || "").trim();
  const supplied = String(req.body?.hr_username ?? req.query?.hr_username ?? req.user?.username ?? "").trim();
  if (configured && supplied && supplied.toLowerCase() !== configured.toLowerCase()) return null;
  return supplied || configured || null;
}
const fields = "SELECT event_id AS id, DATE_FORMAT(event_date, '%Y-%m-%d') AS eventDate, title, TIME_FORMAT(event_time, '%H:%i') AS time, category, description FROM calendar_events";

export async function listEvents(req, res) {
  const owner = ownerFor(req);
  if (!owner) return res.status(400).json({ error: "HR username is required. Configure HR_USERNAME on the server." });
  try {
    const [rows] = await pool.query(fields + " WHERE hr_username = ? ORDER BY event_date, event_time, event_id", [owner]);
    return res.json(rows);
  } catch (error) {
    console.error("Calendar list error:", error);
    return res.status(500).json({ error: "Unable to load calendar events. Apply the calendar ownership migration." });
  }
}

export async function createEvent(req, res) {
  const owner = ownerFor(req);
  if (!owner) return res.status(400).json({ error: "HR username is required. Configure HR_USERNAME on the server." });
  const body = req.body || {};
  const date = String(body.eventDate ?? body.event_date ?? "").trim();
  const time = String(body.time ?? body.event_time ?? "").trim();
  const title = String(body.title ?? "").trim();
  const category = String(body.category ?? "Work").trim();
  const description = String(body.description ?? "").trim();
  const dateValue = new Date(date + "T00:00:00Z");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || Number.isNaN(dateValue.getTime()) || dateValue.toISOString().slice(0, 10) !== date) return res.status(400).json({ error: "A valid event date is required." });
  if (!title || title.length > 200) return res.status(400).json({ error: "Enter an event title of 1–200 characters." });
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) return res.status(400).json({ error: "A valid event time is required." });
  if (!["Work", "Personal", "Urgent"].includes(category)) return res.status(400).json({ error: "Invalid event category." });
  try {
    const [result] = await pool.query("INSERT INTO calendar_events (hr_username, event_date, title, event_time, category, description) VALUES (?, ?, ?, ?, ?, ?)", [owner, date, title, time, category, description]);
    const [rows] = await pool.query(fields + " WHERE event_id = ? AND hr_username = ?", [result.insertId, owner]);
    return res.status(201).json(rows[0]);
  } catch (error) {
    console.error("Calendar create error:", error);
    return res.status(500).json({ error: "Unable to save the event. Apply the calendar ownership migration." });
  }
}

export async function deleteEvent(req, res) {
  const owner = ownerFor(req);
  const id = Number(req.params.id);
  if (!owner) return res.status(400).json({ error: "HR username is required." });
  if (!Number.isSafeInteger(id) || id <= 0) return res.status(400).json({ error: "A valid event id is required." });
  try {
    const [result] = await pool.query("DELETE FROM calendar_events WHERE event_id = ? AND hr_username = ?", [id, owner]);
    if (!result.affectedRows) return res.status(404).json({ error: "Event not found." });
    return res.status(204).send();
  } catch (error) {
    console.error("Calendar delete error:", error);
    return res.status(500).json({ error: "Unable to delete the event. Apply the calendar ownership migration." });
  }
}
