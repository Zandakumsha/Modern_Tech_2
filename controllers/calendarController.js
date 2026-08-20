import pool from "../config/db.js";

async function resolveUserId({ userId, username, employeeId }) {
  const numericUserId = Number(userId);
  if (Number.isInteger(numericUserId) && numericUserId > 0) {
    const [rows] = await pool.query("SELECT user_id FROM users WHERE user_id = ? LIMIT 1", [numericUserId]);
    if (rows[0]) return rows[0].user_id;
  }

  if (employeeId) {
    const numericEmployeeId = Number(employeeId);
    if (Number.isInteger(numericEmployeeId) && numericEmployeeId > 0) {
      const [rows] = await pool.query("SELECT user_id FROM users WHERE employee_id = ? LIMIT 1", [numericEmployeeId]);
      if (rows[0]) return rows[0].user_id;
    }
  }

  if (username) {
    const cleanUsername = String(username).trim();
    const [rows] = await pool.query("SELECT user_id FROM users WHERE username = ? OR email = ? LIMIT 1", [cleanUsername, cleanUsername]);
    if (rows[0]) return rows[0].user_id;

    const hrUsername = process.env.HR_USERNAME || "hrmanager";
    if (cleanUsername.toLowerCase() === hrUsername.toLowerCase()) {
      const [managerRows] = await pool.query("SELECT user_id FROM users WHERE role IN ('Manager', 'Admin') ORDER BY CASE WHEN role = 'Manager' THEN 0 ELSE 1 END, user_id LIMIT 1");
      if (managerRows[0]) return managerRows[0].user_id;
    }
  }

  return null;
}

function getRequestIdentity(req) {
  const body = req.body || {};
  const query = req.query || {};
  return {
    userId: body.userId ?? query.userId,
    username: body.username ?? query.username,
    employeeId: body.employeeId ?? query.employeeId,
  };
}

export async function listEvents(req, res) {
  try {
    const userId = await resolveUserId(getRequestIdentity(req));
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
    const { userId, username, employeeId } = getRequestIdentity(req);
    const { eventDate, title, time, category = "Work", description = "" } = req.body || {};
    const resolvedUserId = await resolveUserId({ userId, username, employeeId });
    const cleanTitle = String(title || "").trim();
    const cleanDate = String(eventDate || "").trim();
    const cleanTime = String(time || "").trim();

    if (!resolvedUserId) return res.status(400).json({ error: "A valid logged-in user account is required." });
    if (!/^\d{4}-\d{2}-\d{2}$/.test(cleanDate)) return res.status(400).json({ error: "A valid event date is required." });
    if (!cleanTitle) return res.status(400).json({ error: "An event title is required." });
    if (!/^\d{2}:\d{2}$/.test(cleanTime)) return res.status(400).json({ error: "A valid event time is required." });

    const allowedCategories = new Set(["Work", "Personal", "Urgent"]);
    if (!allowedCategories.has(category)) return res.status(400).json({ error: "Invalid event category." });

    const [result] = await pool.query(
      `INSERT INTO calendar_events (user_id, event_date, title, event_time, category, description)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [resolvedUserId, cleanDate, cleanTitle, cleanTime, category, String(description || "").trim()],
    );

    const [rows] = await pool.query(
      `SELECT event_id AS id,
              DATE_FORMAT(event_date, '%Y-%m-%d') AS eventDate,
              title,
              TIME_FORMAT(event_time, '%H:%i') AS time,
              category,
              description
         FROM calendar_events
        WHERE event_id = ? AND user_id = ?`,
      [result.insertId, resolvedUserId],
    );

    return res.status(201).json(rows[0]);
  } catch (error) {
    console.error("Calendar create error:", error);
    const message = process.env.NODE_ENV === "production" ? "Unable to create calendar event." : `Unable to create calendar event: ${error.message}`;
    return res.status(500).json({ error: message });
  }
}

export async function deleteEvent(req, res) {
  try {
    const eventId = Number(req.params.id);
    const resolvedUserId = await resolveUserId(getRequestIdentity(req));
    if (!eventId || !resolvedUserId) return res.status(400).json({ error: "A valid event id and user are required." });

    const [result] = await pool.query("DELETE FROM calendar_events WHERE event_id = ? AND user_id = ?", [eventId, resolvedUserId]);
    if (!result.affectedRows) return res.status(404).json({ error: "Event not found." });
    return res.status(204).send();
  } catch (error) {
    console.error("Calendar delete error:", error);
    return res.status(500).json({ error: "Unable to delete calendar event." });
  }
}
