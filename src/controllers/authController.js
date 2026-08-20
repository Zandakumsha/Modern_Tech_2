import crypto from "node:crypto";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import pool from "../config/db.js";
import { findUserByLogin, findUserByEmail, createUser, getUserById, findEmployeeByEmail, upsertEmployeeUser } from "../models/userModel.js";

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET;
const TOKEN_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "2h";

function getHrCredentials() {
  return {
    email: String(process.env.HR_EMAIL || "").trim().toLowerCase(),
    username: String(process.env.HR_USERNAME || "").trim(),
    password: String(process.env.HR_PASSWORD || ""),
  };
}

function safeEqual(left, right) {
  const a = Buffer.from(String(left));
  const b = Buffer.from(String(right));
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

function hashPassword(password, salt = crypto.randomBytes(16).toString("hex")) {
  return `${salt}:${crypto.scryptSync(password, salt, 64).toString("hex")}`;
}

function publicUser(user) {
  return {
    userId: user.userId ?? null,
    employeeId: user.employeeId ?? null,
    username: user.username,
    email: user.email,
    role: user.role,
    avatarUrl: user.avatarUrl || null,
  };
}

function createToken(user, extraClaims = {}) {
  if (!JWT_SECRET) throw new Error("JWT_SECRET is not configured");
  return jwt.sign(
    { userId: user.userId, employeeId: user.employeeId, role: user.role, email: user.email, ...extraClaims },
    JWT_SECRET,
    { expiresIn: TOKEN_EXPIRES_IN }
  );
}

function validateIdentifier(value) {
  const identifier = String(value || "").trim();
  if (!identifier) return "Employee ID is required";
  if (!/^\d+$/.test(identifier)) return "Employee ID must contain numbers only";
  if (identifier.length > 20) return "Employee ID is invalid";
  return null;
}

async function loginWithHrEnv(identifier, password) {
  const { email, username, password: configuredPassword } = getHrCredentials();
  if ((!email && !username) || !configuredPassword) {
    throw Object.assign(new Error("HR authentication is not configured on the server"), { statusCode: 503, code: "HR_AUTH_NOT_CONFIGURED" });
  }

  const identifierMatches = (email && safeEqual(identifier.toLowerCase(), email)) || (username && safeEqual(identifier, username));
  if (!identifierMatches || !safeEqual(password, configuredPassword)) {
    throw Object.assign(new Error("Invalid HR username/email or password"), { statusCode: 401, code: "INVALID_HR_CREDENTIALS" });
  }

  let dbUser = null;
  if (email) dbUser = await findUserByEmail(email);
  if (!dbUser && username) dbUser = await findUserByLogin(username);

  const role = dbUser?.role === "Admin" ? "Admin" : "Manager";
  const user = dbUser || { userId: null, employeeId: null, username: username || email, email: email || null, role, avatarUrl: null };
  return { user, token: createToken(user, { authSource: "env", hrAuthenticated: true }) };
}

export async function register(req, res) {
  const { username, email, password } = req.body || {};
  if (!username?.trim() || !email?.trim() || !password) return res.status(400).json({ message: "Username, email and password are required" });
  if (password.length < 6) return res.status(400).json({ message: "Password must be at least 6 characters" });

  const normalizedEmail = email.trim().toLowerCase();
  try {
    if (await findUserByEmail(normalizedEmail)) return res.status(409).json({ message: "An account already exists for this email" });
    const employee = await findEmployeeByEmail(normalizedEmail);
    const user = await createUser({ employeeId: employee?.employeeId || null, username: username.trim(), email: normalizedEmail, passwordHash: hashPassword(password), role: "Staff" });
    return res.status(201).json({ message: "Account created successfully", token: createToken(user), user: publicUser(user) });
  } catch (error) {
    console.error("Register failed:", error);
    return res.status(error.code === "ER_DUP_ENTRY" ? 409 : 500).json({ message: error.code === "ER_DUP_ENTRY" ? "Username or email already exists" : "Error creating account" });
  }
}

export async function login(req, res) {
  const { username, password, loginType } = req.body || {};

  try {
    if (loginType === "hr") {
      const identifier = String(username || "").trim();
      const secret = String(password || "");
      if (!identifier || !secret) return res.status(400).json({ message: "HR username/email and password are required" });
      if (identifier.length > 254) return res.status(400).json({ message: "HR username/email is too long" });
      const result = await loginWithHrEnv(identifier, secret);
      return res.json({ message: "HR login successful", token: result.token, user: publicUser(result.user) });
    }

    if (loginType !== "employee") return res.status(400).json({ message: "A valid login type is required" });

    // Employee authentication intentionally requires only the Employee ID.
    const employeeId = String(username || "").trim();
    const validationError = validateIdentifier(employeeId);
    if (validationError) return res.status(400).json({ message: validationError });

    const [rows] = await pool.query(
      `SELECT employee_id AS employeeId, name, contact
       FROM employees
       WHERE employee_id = ?
       LIMIT 1`,
      [Number(employeeId)]
    );
    const employee = rows[0];
    if (!employee) return res.status(401).json({ message: "Employee ID not found" });

    // If a database user already exists, retain its identity details. The
    // Employee ID itself is the authentication factor for the employee portal.
    const existingUser = await pool.query(
      `SELECT user_id AS userId, employee_id AS employeeId, username, email, role, avatar_url AS avatarUrl
       FROM users
       WHERE employee_id = ? AND role = 'Staff'
       LIMIT 1`,
      [Number(employeeId)]
    );
    const dbUser = existingUser[0][0];
    const user = dbUser || {
      userId: null,
      employeeId: employee.employeeId,
      username: String(employee.employeeId),
      email: employee.contact,
      role: "Staff",
      avatarUrl: null,
    };

    const token = createToken(user, { authSource: "employee-id", employeeAuthenticated: true });
    return res.json({ message: "Employee login successful", token, user: publicUser(user) });
  } catch (error) {
    const status = Number.isInteger(error.statusCode) ? error.statusCode : 500;
    if (status >= 500) console.error("Login failed:", error);
    else console.warn("Login rejected:", error.code || error.message);
    return res.status(status).json({ message: status === 503 ? "HR authentication is unavailable. Contact the system administrator." : error.message || "Authentication failed" });
  }
}

export async function provisionEmployee(req, res) {
  const { employeeId, password } = req.body || {};
  const id = Number(employeeId);
  if (!Number.isInteger(id) || id <= 0 || !password || password.length < 8) return res.status(400).json({ message: "Employee ID and a password of at least 8 characters are required" });
  try {
    const [rows] = await pool.query("SELECT employee_id AS employeeId, contact FROM employees WHERE employee_id = ? LIMIT 1", [id]);
    const employee = rows[0];
    if (!employee) return res.status(404).json({ message: "Employee not found" });
    const user = await upsertEmployeeUser({ employeeId: id, email: employee.contact, passwordHash: hashPassword(password) });
    return res.status(201).json({ message: "Employee login credentials saved", user: publicUser(user) });
  } catch (error) {
    console.error("Employee provisioning failed:", error);
    return res.status(error.code === "ER_DUP_ENTRY" ? 409 : 500).json({ message: error.code === "ER_DUP_ENTRY" ? "Employee credentials conflict with another account" : "Error creating employee credentials" });
  }
}

export async function me(req, res) {
  try {
    if (req.user?.hrAuthenticated && req.user.userId == null) {
      return res.json({ userId: null, employeeId: null, username: req.user.username, email: req.user.email, role: req.user.role, avatarUrl: null });
    }
    if (req.user?.employeeAuthenticated && req.user.userId == null) {
      const [rows] = await pool.query(
        `SELECT employee_id AS employeeId, name, contact FROM employees WHERE employee_id = ? LIMIT 1`,
        [req.user.employeeId]
      );
      const employee = rows[0];
      if (!employee) return res.status(404).json({ message: "Employee record no longer exists" });
      return res.json({ userId: null, employeeId: employee.employeeId, username: String(employee.employeeId), email: employee.contact, role: "Staff", avatarUrl: null, name: employee.name });
    }
    const user = await getUserById(req.user.userId);
    if (!user) return res.status(404).json({ message: "User not found" });
    return res.json(publicUser(user));
  } catch (error) {
    console.error("Auth me failed:", error);
    return res.status(500).json({ message: "Error retrieving account" });
  }
}
