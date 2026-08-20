import pool from "../config/db.js";

async function resolveUserId({ userId, username, employeeId }) {
  const numericUserId = Number(userId);
  if (Number.isInteger(numericUserId) && numericUserId > 0) {
    const [rows] = await pool.query(
      "SELECT user_id FROM users WHERE user_id = ? LIMIT 1",
      [numericUserId],
    );
    if (rows[0]) return rows[0].user_id;
  }

  if (employeeId) {
    const numericEmployeeId = Number(employeeId);
    if (Number.isInteger(numericEmployeeId) && numericEmployeeId > 0) {
      const [rows] = await pool.query(
        "SELECT user_id FROM users WHERE employee_id = ? LIMIT 1",
        [numericEmployeeId],
      );
      if (rows[0]) return rows[0].user_id;
    }
  }

  if (username) {
    const [rows] = await pool.query(
      "SELECT user_id FROM users WHERE username = ? LIMIT 1",
      [String(username).trim()],
    );
    if (rows[0]) return rows[0].user_id;

    // feature/autha supports the environment-based HR login (hr-env),
    // which does not have a row in users. Use the existing Admin/Manager
    // account as the database owner for HR calendar events.
    const hrUsername = process.env.HR_USERNAME || "hrmanager";
    if (String(username).trim().toLowerCase() === hrUsername.toLowerCase()) {
      const [managerRows] = await pool.query(
        "SELECT user_id FROM users WHERE role IN ('Manager', 'Admin') ORDER BY role = 'Manager' DESC, user_id LIMIT 1",
      );
      if (managerRows[0]) return managerRows[0].user_id;
    }
  }

  return null;
}

export async function listEvents(req, res) {
  try {
    const userId = await resolveUserId({
      userId: req.query.userId,
      username: req.query.username,
      employeeId: req.query.employeeId,
    });

    if (!userId) return res.status(400).json({ error: "A valid user account is required." });

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
    const { userId, username, employeeId, eventDate, title, time, category = "Work", description = "" } = req.body;
    const resolvedUserId = await resolveUserId({ userId, username, employeeId });

    if (!resolvedUserId || !eventDate || !String(title || "").trim() || !time) {
      return res.status(400).json({ error: "A valid user, event date, title and time are required." });
    }

    const allowedCategories = new Set(["Work", "Personal", "Urgent"]);
    if (!allowedCategories.has(category)) {
      return res.status(400).json({ error: "Invalid event category." });
    }

    const [result] = await pool.query(
      `INSERT INTO calendar_events (user_id, event_date, title, event_time, category, description)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [resolvedUserId, eventDate, String(title).trim(), time, category, String(description || "").trim()],
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
    const { userId, username, employeeId } = req.body;
    const resolvedUserId = await resolveUserId({ userId, username, employeeId });

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
