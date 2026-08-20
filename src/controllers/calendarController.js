import pool from "../config/db.js";

function authenticatedUsername(req) {
  const username = String(req.user?.username || "").trim();
  return username || null;
}

export async function listEvents(req, res) {
  try {
    const hrUsername = authenticatedUsername(req);

    if (!hrUsername) {
      return res.status(401).json({ error: "Authenticated HR username is required." });
    }

    const [rows] = await pool.query(
      `SELECT event_id AS id,
              DATE_FORMAT(event_date, '%Y-%m-%d') AS eventDate,
              title,
              TIME_FORMAT(event_time, '%H:%i') AS time,
              category,
              description,
              hr_username
         FROM calendar_events
        WHERE hr_username = ?
        ORDER BY event_date, event_time, event_id`,
      [hrUsername],
    );

    return res.json(rows);
  } catch (error) {
    console.error("Calendar list error:", error);
    return res.status(500).json({ error: "Unable to load calendar events." });
  }
}

export async function createEvent(req, res) {
  try {
    const hrUsername = authenticatedUsername(req);
    const { eventDate, title, time, category = "Work", description = "" } = req.body || {};

    if (!hrUsername || !eventDate || !String(title || "").trim() || !time) {
      return res.status(400).json({ error: "eventDate, title and time are required." });
    }

    const allowedCategories = new Set(["Work", "Personal", "Urgent"]);
    if (!allowedCategories.has(category)) {
      return res.status(400).json({ error: "Invalid event category." });
    }

    const [result] = await pool.query(
      `INSERT INTO calendar_events
         (hr_username, event_date, title, event_time, category, description)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [hrUsername, eventDate, String(title).trim(), time, category, String(description || "").trim()],
    );

    const [rows] = await pool.query(
      `SELECT event_id AS id,
              DATE_FORMAT(event_date, '%Y-%m-%d') AS eventDate,
              title,
              TIME_FORMAT(event_time, '%H:%i') AS time,
              category,
              description,
              hr_username
         FROM calendar_events
        WHERE event_id = ? AND hr_username = ?`,
      [result.insertId, hrUsername],
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
    const hrUsername = authenticatedUsername(req);

    if (!Number.isInteger(eventId) || eventId <= 0 || !hrUsername) {
      return res.status(400).json({ error: "A valid event id and authenticated HR user are required." });
    }

    const [result] = await pool.query(
      "DELETE FROM calendar_events WHERE event_id = ? AND hr_username = ?",
      [eventId, hrUsername],
    );

    if (!result.affectedRows) {
      return res.status(404).json({ error: "Event not found." });
    }

    return res.status(204).send();
  } catch (error) {
    console.error("Calendar delete error:", error);
    return res.status(500).json({ error: "Unable to delete calendar event." });
  }
}
