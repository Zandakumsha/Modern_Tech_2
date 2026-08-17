import crypto from "node:crypto";
import jwt from "jsonwebtoken";
import pool from "../config/db.js";
import { findUserByLogin, findUserByEmail, createUser, getUserById, findEmployeeByEmail } from "../models/userModel.js";

const JWT_SECRET = process.env.JWT_SECRET || "change-this-secret-in-env";
const TOKEN_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "2h";

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
  return { userId: user.userId, employeeId: user.employeeId, username: user.username, email: user.email, role: user.role, avatarUrl: user.avatarUrl || null };
}

function createToken(user) {
  return jwt.sign({ userId: user.userId, employeeId: user.employeeId, role: user.role, email: user.email }, JWT_SECRET, { expiresIn: TOKEN_EXPIRES_IN });
}

export async function register(req, res) {
  const { username, email, password } = req.body || {};
  if (!username?.trim() || !email?.trim() || !password) return res.status(400).json({ message: "Username, email and password are required" });
  if (password.length < 6) return res.status(400).json({ message: "Password must be at least 6 characters" });

  const normalizedEmail = email.trim().toLowerCase();
  try {
    if (await findUserByEmail(normalizedEmail)) return res.status(409).json({ message: "An account already exists for this email" });

    const employee = await findEmployeeByEmail(normalizedEmail);
    const user = await createUser({
      employeeId: employee?.employeeId || null,
      username: username.trim(),
      email: normalizedEmail,
      passwordHash: hashPassword(password),
      role: "Staff",
    });

    res.status(201).json({ message: "Account created successfully", token: createToken(user), user: publicUser(user) });
  } catch (error) {
    console.error("Register failed:", error);
    res.status(error.code === "ER_DUP_ENTRY" ? 409 : 500).json({ message: error.code === "ER_DUP_ENTRY" ? "Username or email already exists" : "Error creating account", error: error.message });
  }
}

export async function login(req, res) {
  const { username, password } = req.body || {};
  if (!username?.trim() || !password) return res.status(400).json({ message: "Username/email and password are required" });

  try {
    const user = await findUserByLogin(username.trim());
    if (!user || !verifyPassword(password, user.passwordHash)) return res.status(401).json({ message: "Invalid username/email or password" });

    if (!user.employeeId) {
      const employee = await findEmployeeByEmail(user.email);
      if (employee) {
        await pool.query("UPDATE users SET employee_id = ? WHERE user_id = ?", [employee.employeeId, user.userId]);
        user.employeeId = employee.employeeId;
      }
    }

    res.json({ message: "Login successful", token: createToken(user), user: publicUser(user) });
  } catch (error) {
    console.error("Login failed:", error);
    res.status(500).json({ message: "Error during login", error: error.message });
  }
}

export async function me(req, res) {
  try {
    const user = await getUserById(req.user.userId);
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(publicUser(user));
  } catch (error) {
    console.error("Auth me failed:", error);
    res.status(500).json({ message: "Error retrieving account", error: error.message });
  }
}
