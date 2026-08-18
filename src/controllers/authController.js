import crypto from "node:crypto";
import jwt from "jsonwebtoken";
import pool from "../config/db.js";
import { findEmployeeUserById, getUserById, upsertEmployeeUser } from "../models/userModel.js";

const JWT_SECRET = process.env.JWT_SECRET || "change-this-secret-in-env";
const TOKEN_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "2h";
const HR_USERNAME = process.env.HR_USERNAME || "hrmanager";
const HR_EMAIL = (process.env.HR_EMAIL || "hr@moderntech.com").trim().toLowerCase();
const HR_PASSWORD = process.env.HR_PASSWORD || "change-this-hr-password";
const PASSWORDLESS = process.env.NODE_ENV !== "production" && process.env.AUTH_PASSWORDLESS !== "false";

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

function safeEqual(left, right) {
  const a = Buffer.from(String(left || ""));
  const b = Buffer.from(String(right || ""));
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

function publicUser(user) {
  return {
    userId: user.userId,
    employeeId: user.employeeId,
    username: user.username,
    email: user.email,
    role: user.role,
    avatarUrl: user.avatarUrl || null,
  };
}

function createToken(user) {
  return jwt.sign(
    {
      userId: user.userId || null,
      employeeId: user.employeeId || null,
      role: user.role,
      email: user.email,
    },
    JWT_SECRET,
    { expiresIn: TOKEN_EXPIRES_IN }
  );
}

function hrUser() {
  return {
    userId: "hr-env",
    employeeId: null,
    username: HR_USERNAME,
    email: HR_EMAIL,
    role: "Manager",
    avatarUrl: null,
  };
}

async function employeeForPasswordlessLogin(id) {
  // feature/autha uses the existing employees table as the source of employee access.
  // Do not query the users table here: this branch can authenticate employees before
  // separate user credentials have been provisioned.
  const [rows] = await pool.query(
    `SELECT employee_id AS employeeId, name, contact
     FROM employees
     WHERE employee_id = ?
     LIMIT 1`,
    [id]
  );

  const employee = rows[0];
  if (!employee) return null;

  return {
    userId: `employee-${employee.employeeId}`,
    employeeId: employee.employeeId,
    username: employee.name || String(employee.employeeId),
    email: employee.contact || null,
    role: "Staff",
    avatarUrl: null,
  };
}

export async function login(req, res) {
  const { role, employeeId, username, password } = req.body || {};

  if (!role) return res.status(400).json({ message: "Select Employee or HR Manager" });

  try {
    if (role === "hr") {
      const identifier = String(username || "").trim().toLowerCase();
      const validIdentifier =
        safeEqual(identifier, HR_USERNAME.toLowerCase()) || safeEqual(identifier, HR_EMAIL);

      if (!validIdentifier) {
        return res.status(401).json({ message: "Invalid HR Manager username or email" });
      }

      if (!PASSWORDLESS && !safeEqual(password, HR_PASSWORD)) {
        return res.status(401).json({ message: "Invalid HR Manager credentials" });
      }

      const user = hrUser();
      return res.json({
        message: "HR Manager login successful",
        token: createToken(user),
        user: publicUser(user),
      });
    }

    if (role !== "employee") {
      return res.status(400).json({ message: "Invalid account type" });
    }

    const id = Number(employeeId);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ message: "Enter a valid employee ID" });
    }

    const user = PASSWORDLESS
      ? await employeeForPasswordlessLogin(id)
      : await findEmployeeUserById(id);

    if (!user) return res.status(401).json({ message: "Employee ID not found" });

    if (!PASSWORDLESS && !verifyPassword(password, user.passwordHash)) {
      return res.status(401).json({ message: "Invalid employee ID or password" });
    }

    return res.json({
      message: "Employee login successful",
      token: createToken(user),
      user: publicUser(user),
    });
  } catch (error) {
    console.error("Login failed:", error);
    return res.status(500).json({
      message: "Error during login",
      error: process.env.NODE_ENV === "production" ? undefined : error.message,
    });
  }
}

export async function provisionEmployee(req, res) {
  const { employeeId, password } = req.body || {};
  const id = Number(employeeId);

  if (!Number.isInteger(id) || id <= 0 || !password || password.length < 8) {
    return res.status(400).json({
      message: "Employee ID and a password of at least 8 characters are required",
    });
  }

  try {
    const [rows] = await pool.query(
      "SELECT employee_id AS employeeId, contact FROM employees WHERE employee_id = ? LIMIT 1",
      [id]
    );
    const employee = rows[0];
    if (!employee) return res.status(404).json({ message: "Employee not found" });

    const user = await upsertEmployeeUser({
      employeeId: id,
      email: employee.contact,
      passwordHash: hashPassword(password),
    });

    return res.status(201).json({
      message: "Employee login credentials saved",
      user: publicUser(user),
    });
  } catch (error) {
    console.error("Employee provisioning failed:", error);
    return res.status(error.code === "ER_DUP_ENTRY" ? 409 : 500).json({
      message:
        error.code === "ER_DUP_ENTRY"
          ? "Employee credentials conflict with another account"
          : "Error creating employee credentials",
      error: error.message,
    });
  }
}

export async function me(req, res) {
  if (req.user.userId === "hr-env") return res.json(publicUser(hrUser()));

  if (String(req.user.userId || "").startsWith("employee-")) {
    return res.json({
      userId: req.user.userId,
      employeeId: req.user.employeeId,
      username: String(req.user.employeeId),
      email: req.user.email || null,
      role: "Staff",
      avatarUrl: null,
    });
  }

  try {
    const user = await getUserById(req.user.userId);
    if (!user) return res.status(404).json({ message: "User not found" });
    return res.json(publicUser(user));
  } catch (error) {
    console.error("Auth me failed:", error);
    return res.status(500).json({ message: "Error retrieving account", error: error.message });
  }
}
