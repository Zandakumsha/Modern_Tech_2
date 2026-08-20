import crypto from "node:crypto";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import pool from "../config/db.js";
import { findUserByLogin, findUserByEmail, createUser, getUserById, findEmployeeByEmail, upsertEmployeeUser } from "../models/userModel.js";

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET;
const TOKEN_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "2h";

function getHrCredentials() {
  const email = String(process.env.HR_EMAIL || "").trim().toLowerCase();
  const username = String(process.env.HR_USERNAME || "").trim();
  const password = String(process.env.HR_PASSWORD || "");
  return { email, username, password };
}

function safeEqual(left, right) {
  const a = Buffer.from(String(left));
  const b = Buffer.from(String(right));
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

function hashPassword(password, salt = crypto.randomBytes(16).toString("hex")) {
  return `${salt}:${crypto.scryptSync(password, salt, 64).toString("hex")}`;
}

function verifyPassword(password, storedHash) {
  if (!storedHash || !storedHash.includes(":")) return false;
  const [salt, originalHash] = storedHash.split(":");
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  const a = Buffer.from(hash, "hex");
  const b = Buffer.from(originalHash, "hex");
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

function publicUser(user) {
  return { userId: user.userId ?? null, employeeId: user.employeeId ?? null, username: user.username, email: user.email, role: user.role, avatarUrl: user.avatarUrl || null };
}

function createToken(user, extraClaims = {}) {
  if (!JWT_SECRET) throw new Error("JWT_SECRET is not configured");
  return jwt.sign({ userId: user.userId, employeeId: user.employeeId, role: user.role, email: user.email, ...extraClaims }, JWT_SECRET, { expiresIn: TOKEN_EXPIRES_IN });
}

function validateLoginInput({ username, password, loginType }) {
  const identifier = String(username || "").trim();
  const secret = String(password || "");
  if (!identifier || !secret) return "Username/email and password are required";
  if (!loginType || !["hr", "employee"].includes(loginType)) return "A valid login type is required";
  if (secret.length < 6) return "Password must be at least 6 characters";
  if (identifier.length > 254) return "Username/email is too long";
  return null;
}

async function loginWithHrEnv(identifier, password) {
  const { email, username, password: configuredPassword } = getHrCredentials();
  if (!email && !username || !configuredPassword) {
    throw Object.assign(new Error("HR authentication is not configured on the server"), { statusCode: 503, code: "HR_AUTH_NOT_CONFIGURED" });
  }

  const identifierMatches = (email && safeEqual(identifier.toLowerCase(), email)) || (username && safeEqual(identifier, username));
  if (!identifierMatches || !safeEqual(password, configuredPassword)) {
    throw Object.assign(new Error("Invalid HR username/email or password"), { statusCode: 401, code: "INVALID_HR_CREDENTIALS" });
  }

  // Prefer an existing HR account so /auth/me and other user-scoped APIs
  // have a real database user. The password is still controlled exclusively
  // by HR_PASSWORD in the environment.
  let dbUser = null;
  if (email) dbUser = await findUserByEmail(email);
  if (!dbUser && username) dbUser = await findUserByLogin(username);

  const role = dbUser?.role === "Admin" ? "Admin" : "Manager";
  const user = dbUser || {
    userId: null,
    employeeId: null,
    username: username || email,
    email: email || null,
    role,
    avatarUrl: null,
  };

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
    res.status(201).json({ message: "Account created successfully", token: createToken(user), user: publicUser(user) });
  } catch (error) {
    console.error("Register failed:", error);
    res.status(error.code === "ER_DUP_ENTRY" ? 409 : 500).json({ message: error.code === "ER_DUP_ENTRY" ? "Username or email already exists" : "Error creating account" });
  }
}

export async function login(req, res) {
  const { username, password, loginType } = req.body || {};
  const validationError = validateLoginInput({ username, password, loginType });
  if (validationError) return res.status(400).json({ message: validationError });

  try {
    if (loginType === "hr") {
      const result = await loginWithHrEnv(String(username).trim(), String(password));
      return res.json({ message: "HR login successful", token: result.token, user: publicUser(result.user) });
    }

    const employeeId = String(username).trim();
    if (!/^\d+$/.test(employeeId)) return res.status(400).json({ message: "Employee login requires a numeric Employee ID" });

    const user = await findUserByLogin(employeeId);
    if (!user || user.role !== "Staff" || !verifyPassword(password, user.passwordHash)) {
      return res.status(401).json({ message: "Invalid Employee ID or password" });
    }

    if (!user.employeeId) {
      const employee = await findEmployeeByEmail(user.email);
      if (employee) {
        await pool.query("UPDATE users SET employee_id = ? WHERE user_id = ?", [employee.employeeId, user.userId]);
        user.employeeId = employee.employeeId;
      }
    }

    if (!user.employeeId || String(user.employeeId) !== employeeId) {
      return res.status(403).json({ message: "This account is not linked to the supplied Employee ID" });
    }

    return res.json({ message: "Employee login successful", token: createToken(user), user: publicUser(user) });
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
    if (req.user?.hrAuthenticated && req.user.userId == null) return res.json({ userId: null, employeeId: null, username: req.user.username, email: req.user.email, role: req.user.role, avatarUrl: null });
    const user = await getUserById(req.user.userId);
    if (!user) return res.status(404).json({ message: "User not found" });
    return res.json(publicUser(user));
  } catch (error) {
    console.error("Auth me failed:", error);
    return res.status(500).json({ message: "Error retrieving account" });
  }
}
