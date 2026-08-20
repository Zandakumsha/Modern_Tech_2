import pool from "../config/db.js";

async function resolveUserId(req) {
  const userId = Number(req.user?.userId);
  if (Number.isInteger(userId) && userId > 0) {
    const [rows] = await pool.query("SELECT user_id, username FROM users WHERE user_id = ? LIMIT 1", [userId]);
    if (rows[0]) return rows[0];
  }

  const username = String(req.user?.username || req.body?.hr_username || "").trim();
  if (username) {
    const [rows] = await pool.query("SELECT user_id, username FROM users WHERE username = ? OR email = ? LIMIT 1", [username, username]);
    if (rows[0]) return rows[0];
  }

  return null;
}

export async function listEvents(req, res) {
  try {
    const user = await resolveUserId(req);
    if (!user) return res.status(400).json({ error: "The logged-in account is not linked to a database user." });
    const [rows] = await pool.query(
      `SELECT event_id AS id, DATE_FORMAT(event_date, '%Y-%m-%d') AS eventDate,
              title, TIME_FORMAT(event_time, '%H:%i') AS time,
              category, description, hr_username
         FROM calendar_events WHERE user_id = ?
        ORDER BY event_date, event_time, event_id`, [user.user_id]);
    return res.json(rows);
  } catch (error) {
    console.error("Calendar list error:", error);
    return res.status(500).json({ error: "Unable to load calendar events." });
  }
}

export async function createEvent(req, res) {
  try {
    const user = await resolveUserId(req);
    const { eventDate, event_date, title, time, event_time, category = "Work", description = "" } = req.body || {};
    const date = String(eventDate || event_date || "").trim();
    const eventTime = String(time || event_time || "").trim();
    const cleanTitle = String(title || "").trim();

    if (!user) return res.status(400).json({ error: "The logged-in account is not linked to a database user. Run the calendar migration and log in again." });
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return res.status(400).json({ error: "A valid event date is required." });
    if (!cleanTitle) return res.status(400).json({ error: "An event title is required." });
    if (!/^\d{2}:\d{2}$/.test(eventTime)) return res.status(400).json({ error: "A valid event time is required." });
    if (!new Set(["Work", "Personal", "Urgent"]).has(category)) return res.status(400).json({ error: "Invalid event category." });

    const [result] = await pool.query(
      `INSERT INTO calendar_events (user_id, hr_username, event_date, title, event_time, category, description)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [user.user_id, user.username, date, cleanTitle, eventTime, category, String(description || "").trim()]);

    const [rows] = await pool.query(
      `SELECT event_id AS id, DATE_FORMAT(event_date, '%Y-%m-%d') AS eventDate,
              title, TIME_FORMAT(event_time, '%H:%i') AS time,
              category, description, hr_username
         FROM calendar_events WHERE event_id = ? AND user_id = ?`, [result.insertId, user.user_id]);
    return res.status(201).json(rows[0]);
  } catch (error) {
    console.error("Calendar create error:", error);
    return res.status(500).json({ error: `Unable to create calendar event: ${error.message}` });
  }
}

export async function deleteEvent(req, res) {
  try {
    const eventId = Number(req.params.id);
    const user = await resolveUserId(req);
    if (!Number.isInteger(eventId) || eventId <= 0) return res.status(400).json({ error: "A valid event id is required." });
    if (!user) return res.status(400).json({ error: "The logged-in account is not linked to a database user." });
    const [result] = await pool.query("DELETE FROM calendar_events WHERE event_id = ? AND user_id = ?", [eventId, user.user_id]);
    if (!result.affectedRows) return res.status(404).json({ error: "Event not found." });
    return res.status(204).send();
  } catch (error) {
    console.error("Calendar delete error:", error);
    return res.status(500).json({ error: "Unable to delete calendar event." });
  }
}
