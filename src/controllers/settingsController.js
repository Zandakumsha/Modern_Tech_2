import pool from "../config/db.js";

async function resolveUserId({ userId, username }) {
  if (userId && String(userId) !== "hr-env") {
    const id = Number(userId);
    return Number.isInteger(id) && id > 0 ? id : null;
  }
  if (!username || username === "hrmanager") return null;
  const [rows] = await pool.query("SELECT user_id FROM users WHERE username = ? LIMIT 1", [username]);
  return rows[0]?.user_id ?? null;
}

const defaultPreferences = { darkMode: false, colorTheme: "default", emailNotifications: true, pushNotifications: true, attendanceAlerts: true };

export async function getSettings(req, res) {
  try {
    const isHrEnv = String(req.query.userId || "") === "hr-env" || req.query.username === "hrmanager";
    const userId = await resolveUserId(req.query);
    let user;
    let preferences;

    if (isHrEnv) {
      user = { userId: "hr-env", username: "hrmanager", email: "hr@moderntech.com", role: "Manager", avatar: null };
      preferences = defaultPreferences;
    } else {
      if (!userId) return res.status(400).json({ error: "A valid userId or username is required." });
      const [[dbUser]] = await pool.query(`SELECT user_id AS userId, username, email, role, avatar_url AS avatar FROM users WHERE user_id = ?`, [userId]);
      const [[dbPreferences]] = await pool.query(`SELECT user_id AS userId, dark_mode AS darkMode, color_theme AS colorTheme, email_notifications AS emailNotifications, push_notifications AS pushNotifications, attendance_alerts AS attendanceAlerts FROM user_preferences WHERE user_id = ?`, [userId]);
      user = dbUser || null;
      preferences = dbPreferences || defaultPreferences;
    }

    const [[company]] = await pool.query(`SELECT company_id AS companyId, company_name AS companyName, industry, email, phone FROM company_settings ORDER BY company_id LIMIT 1`);
    return res.json({ user, company: company || null, preferences });
  } catch (error) {
    console.error("Settings get error:", error);
    return res.status(500).json({ error: "Unable to load settings." });
  }
}

export async function updateCompany(req, res) {
  try {
    const { companyName = "Modern Tech", industry = "Technology / HR Solutions", email = "info@moderntech.co.za", phone = "+27 (21) 555-0192" } = req.body || {};
    const values = [String(companyName).trim(), String(industry).trim(), String(email).trim(), String(phone).trim()];
    const [rows] = await pool.query("SELECT company_id FROM company_settings ORDER BY company_id LIMIT 1");
    if (rows[0]) await pool.query(`UPDATE company_settings SET company_name = ?, industry = ?, email = ?, phone = ? WHERE company_id = ?`, [...values, rows[0].company_id]);
    else await pool.query(`INSERT INTO company_settings (company_name, industry, email, phone) VALUES (?, ?, ?, ?)`, values);
    return res.json({ message: "Company details saved." });
  } catch (error) {
    console.error("Company update error:", error);
    return res.status(500).json({ error: "Unable to save company details." });
  }
}

export async function updatePreferences(req, res) {
  try {
    const body = req.body || {};
    const isHrEnv = String(body.userId || "") === "hr-env" || body.username === "hrmanager";
    const userId = await resolveUserId(body);
    const { darkMode = false, colorTheme = "default", emailNotifications = true, pushNotifications = true, attendanceAlerts = true } = body;
    const allowedThemes = new Set(["default", "blue", "green", "purple", "red", "orange"]);
    if (!allowedThemes.has(colorTheme)) return res.status(400).json({ error: "Invalid color theme." });
    if (isHrEnv) return res.json({ message: "HR preferences saved." });
    if (!userId) return res.status(400).json({ error: "A valid userId or username is required." });
    await pool.query(`INSERT INTO user_preferences (user_id, dark_mode, color_theme, email_notifications, push_notifications, attendance_alerts) VALUES (?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE dark_mode=VALUES(dark_mode), color_theme=VALUES(color_theme), email_notifications=VALUES(email_notifications), push_notifications=VALUES(push_notifications), attendance_alerts=VALUES(attendance_alerts)`, [userId, !!darkMode, colorTheme, !!emailNotifications, !!pushNotifications, !!attendanceAlerts]);
    return res.json({ message: "Preferences saved." });
  } catch (error) {
    console.error("Preferences update error:", error);
    return res.status(500).json({ error: "Unable to save preferences." });
  }
}
