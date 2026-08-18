import pool from "../config/db.js";

export async function findEmployeeUserById(employeeId) {
  const [rows] = await pool.query(`
    SELECT user_id AS userId, employee_id AS employeeId, username, email,
           password_hash AS passwordHash, role, avatar_url AS avatarUrl
    FROM users
    WHERE employee_id = ? AND role = 'Staff'
    LIMIT 1
  `, [employeeId]);
  return rows[0] || null;
}

export async function upsertEmployeeUser({ employeeId, email, passwordHash }) {
  const [result] = await pool.query(`
    INSERT INTO users (employee_id, username, email, password_hash, role)
    VALUES (?, ?, ?, ?, 'Staff')
    ON DUPLICATE KEY UPDATE
      email = VALUES(email),
      password_hash = VALUES(password_hash),
      role = 'Staff'
  `, [employeeId, String(employeeId), email, passwordHash]);

  if (result.insertId) return getUserById(result.insertId);
  return findEmployeeUserById(employeeId);
}

export async function getUserById(userId) {
  const [rows] = await pool.query(`
    SELECT user_id AS userId, employee_id AS employeeId, username, email,
           role, avatar_url AS avatarUrl
    FROM users
    WHERE user_id = ?
    LIMIT 1
  `, [userId]);
  return rows[0] || null;
}
