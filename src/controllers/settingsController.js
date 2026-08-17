import pool from "../config/db.js";

async function resolveUserId({ userId, username }) {
  if (userId) return Number(userId);
  if (!username) return null;
  const [rows] = await pool.query("SELECT user_id FROM users WHERE username = ? LIMIT 1", [username]);
  return rows[0]?.user_id ?? null;
}

export async function getSettings(req, res) {
  try {
    const userId = await resolveUserId(req.query);
    if (!userId) return res.status(400).json({ error: "A valid userId or username is required." });

    const [[preferences]] = await pool.query(
      `SELECT user_id AS userId, dark_mode AS darkMode, color_theme AS colorTheme,
              email_notifications AS emailNotifications, push_notifications AS pushNotifications,
              attendance_alerts AS attendanceAlerts
         FROM user_preferences WHERE user_id = ?`,
      [userId],
    );

    const [[user]] = await pool.query(
      `SELECT user_id AS userId, username, email, role, avatar_url AS avatar
         FROM users WHERE user_id = ?`,
      [userId],
    );

    const [[company]] = await pool.query(
      `SELECT company_id AS companyId, company_name AS companyName, industry, email, phone
         FROM company_settings ORDER BY company_id LIMIT 1`,
    );

    return res.json({ user, company: company || null, preferences: preferences || null });
  } catch (error) {
    console.error("Settings get error:", error);
    return res.status(500).json({ error: "Unable to load settings." });
  }
}

export async function updateCompany(req, res) {
  try {
    const { companyName = "", industry = "", email = "", phone = "" } = req.body;
    const [rows] = await pool.query("SELECT company_id FROM company_settings ORDER BY company_id LIMIT 1");

    if (rows[0]) {
      await pool.query(
        `UPDATE company_settings SET company_name = ?, industry = ?, email = ?, phone = ? WHERE company_id = ?`,
        [companyName.trim(), industry.trim(), email.trim(), phone.trim(), rows[0].company_id],
      );
    } else {
      await pool.query(
        `INSERT INTO company_settings (company_name, industry, email, phone) VALUES (?, ?, ?, ?)`,
        [companyName.trim(), industry.trim(), email.trim(), phone.trim()],
      );
    }

    return res.json({ message: "Company details saved." });
  } catch (error) {
    console.error("Company update error:", error);
    return res.status(500).json({ error: "Unable to save company details." });
  }
}

export async function updatePreferences(req, res) {
  try {
    const userId = await resolveUserId(req.body);
    if (!userId) return res.status(400).json({ error: "A valid userId or username is required." });

    const {
      darkMode = false,
      colorTheme = "default",
      emailNotifications = true,
      pushNotifications = true,
      attendanceAlerts = true,
    } = req.body;

    const allowedThemes = new Set(["default", "blue", "green", "purple", "red", "orange"]);
    if (!allowedThemes.has(colorTheme)) return res.status(400).json({ error: "Invalid color theme." });

    await pool.query(
      `INSERT INTO user_preferences
        (user_id, dark_mode, color_theme, email_notifications, push_notifications, attendance_alerts)
       VALUES (?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
        dark_mode = VALUES(dark_mode), color_theme = VALUES(color_theme),
        email_notifications = VALUES(email_notifications), push_notifications = VALUES(push_notifications),
        attendance_alerts = VALUES(attendance_alerts)`,
      [userId, !!darkMode, colorTheme, !!emailNotifications, !!pushNotifications, !!attendanceAlerts],
    );

    return res.json({ message: "Preferences saved." });
  } catch (error) {
    console.error("Preferences update error:", error);
    return res.status(500).json({ error: "Unable to save preferences." });
  }
}
