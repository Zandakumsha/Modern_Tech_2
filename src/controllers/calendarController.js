import pool from "../config/db.js";

async function resolveUserId({ userId, username }) {
  if (userId) return Number(userId);
  if (!username) return null;

  const [rows] = await pool.query(
    "SELECT user_id FROM users WHERE username = ? LIMIT 1",
    [username],
  );

  return rows[0]?.user_id ?? null;
}

export async function listEvents(req, res) {
  try {
    const userId = await resolveUserId({
      userId: req.query.userId,
      username: req.query.username,
    });

    if (!userId) return res.status(400).json({ error: "A valid userId or username is required." });

    const [rows] = await pool.query(
      `SELECT event_id AS id,
              DATE_FORMAT(event_date, '%Y-%m-%d') AS eventDate,
              title,
              TIME_FORMAT(event_time, '%H:%i') AS time,
              category,
              description
         FROM calendar_events
        WHERE user_id = ?
        ORDER BY event_date, event_time, event_id`,
      [userId],
    );

    return res.json(rows);
  } catch (error) {
    console.error("Calendar list error:", error);
    return res.status(500).json({ error: "Unable to load calendar events." });
  }
}

export async function createEvent(req, res) {
  try {
    const { userId, username, eventDate, title, time, category = "Work", description = "" } = req.body;
    const resolvedUserId = await resolveUserId({ userId, username });

    if (!resolvedUserId || !eventDate || !title || !time) {
      return res.status(400).json({ error: "userId/username, eventDate, title and time are required." });
    }

    const allowedCategories = new Set(["Work", "Personal", "Urgent"]);
    if (!allowedCategories.has(category)) {
      return res.status(400).json({ error: "Invalid event category." });
    }

    const [result] = await pool.query(
      `INSERT INTO calendar_events (user_id, event_date, title, event_time, category, description)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [resolvedUserId, eventDate, title.trim(), time, category, description.trim()],
    );

    const [rows] = await pool.query(
      `SELECT event_id AS id,
              DATE_FORMAT(event_date, '%Y-%m-%d') AS eventDate,
              title,
              TIME_FORMAT(event_time, '%H:%i') AS time,
              category,
              description
         FROM calendar_events
        WHERE event_id = ?`,
      [result.insertId],
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
    const { userId, username } = req.body;
    const resolvedUserId = await resolveUserId({ userId, username });

    if (!eventId || !resolvedUserId) {
      return res.status(400).json({ error: "A valid event id and user are required." });
    }

    const [result] = await pool.query(
      "DELETE FROM calendar_events WHERE event_id = ? AND user_id = ?",
      [eventId, resolvedUserId],
    );

    if (!result.affectedRows) return res.status(404).json({ error: "Event not found." });

    return res.status(204).send();
  } catch (error) {
    console.error("Calendar delete error:", error);
    return res.status(500).json({ error: "Unable to delete calendar event." });
  }
}
