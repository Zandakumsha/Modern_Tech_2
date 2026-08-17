import pool from "../config/db.js";

export async function findUserByLogin(identifier) {
  const [rows] = await pool.query(`
    SELECT user_id AS userId, employee_id AS employeeId, username, email,
           password_hash AS passwordHash, role, avatar_url AS avatarUrl
    FROM users
    WHERE username = ? OR email = ?
    LIMIT 1
  `, [identifier, identifier]);
  return rows[0] || null;
}

export async function findUserByEmail(email) {
  const [rows] = await pool.query(`
    SELECT user_id AS userId, employee_id AS employeeId, username, email,
           password_hash AS passwordHash, role, avatar_url AS avatarUrl
    FROM users
    WHERE LOWER(email) = LOWER(?)
    LIMIT 1
  `, [email]);
  return rows[0] || null;
}

export async function createUser({ employeeId, username, email, passwordHash, role = "Staff", avatarUrl = null }) {
  const [result] = await pool.query(`
    INSERT INTO users (employee_id, username, email, password_hash, role, avatar_url)
    VALUES (?, ?, ?, ?, ?, ?)
  `, [employeeId || null, username, email, passwordHash, role, avatarUrl]);
  return getUserById(result.insertId);
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

export async function findEmployeeByEmail(email) {
  const [rows] = await pool.query(`
    SELECT employee_id AS employeeId, name, contact
    FROM employees
    WHERE LOWER(contact) = LOWER(?)
    LIMIT 1
  `, [email]);
  return rows[0] || null;
}
