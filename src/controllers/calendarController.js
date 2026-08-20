import pool from "../config/db.js";

function normaliseUsername(value) {
  const username = String(value || "").trim();
  return username || null;
}

function getUsername(req) {
  return normaliseUsername(req.body?.hr_username || req.query?.hr_username || req.headers["x-hr-username"]);
}

async function getAllEvents() {
  const [rows] = await pool.query(
    `SELECT event_id AS id,
            DATE_FORMAT(event_date, '%Y-%m-%d') AS eventDate,
            title,
            TIME_FORMAT(event_time, '%H:%i') AS time,
            category,
            description,
            hr_username
       FROM calendar_events
      ORDER BY event_date, event_time, event_id`
  );
  return rows;
}

export async function listEvents(req, res) {
  try {
    // No token/user_id is used. Calendar data comes only from MySQL.
    const rows = await getAllEvents();
    return res.json(rows);
  } catch (error) {
    console.error("Calendar list error:", error);
    return res.status(500).json({ error: "Unable to load calendar events." });
  }
}

export async function createEvent(req, res) {
  try {
    const hrUsername = getUsername(req);
    const {
      eventDate,
      event_date,
      title,
      time,
      event_time,
      category = "Work",
      description = ""
    } = req.body || {};

    const date = eventDate || event_date;
    const eventTime = time || event_time;
    const cleanTitle = String(title || "").trim();

    if (!hrUsername || !date || !cleanTitle || !eventTime) {
      return res.status(400).json({
        error: "hr_username, eventDate, title and time are required."
      });
    }

    const allowedCategories = new Set(["Work", "Personal", "Urgent"]);
    if (!allowedCategories.has(category)) {
      return res.status(400).json({ error: "Invalid event category." });
    }

    const [result] = await pool.query(
      `INSERT INTO calendar_events
         (hr_username, event_date, title, event_time, category, description)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        hrUsername,
        date,
        cleanTitle,
        eventTime,
        category,
        String(description || "").trim()
      ]
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
        WHERE event_id = ?`,
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

    if (!Number.isInteger(eventId) || eventId <= 0) {
      return res.status(400).json({ error: "A valid event id is required." });
    }

    const [result] = await pool.query(
      "DELETE FROM calendar_events WHERE event_id = ?",
      [eventId]
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
