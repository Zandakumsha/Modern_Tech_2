import crypto from "node:crypto";
import dotenv from "dotenv";
import pool from "../src/config/db.js";
import { upsertEmployeeUser } from "../src/models/userModel.js";

dotenv.config();

const [employeeIdArg, password] = process.argv.slice(2);
const employeeId = Number(employeeIdArg);

if (!Number.isInteger(employeeId) || employeeId <= 0 || !password || password.length < 8) {
  console.error("Usage: node scripts/provision-employee.js <employee-id> <password>");
  console.error("Password must be at least 8 characters.");
  process.exit(1);
}

const salt = crypto.randomBytes(16).toString("hex");
const passwordHash = `${salt}:${crypto.scryptSync(password, salt, 64).toString("hex")}`;

try {
  const [rows] = await pool.query("SELECT employee_id AS employeeId, contact FROM employees WHERE employee_id = ? LIMIT 1", [employeeId]);
  const employee = rows[0];
  if (!employee) throw new Error(`Employee ${employeeId} was not found.`);

  await upsertEmployeeUser({ employeeId, email: employee.contact, passwordHash });
  console.log(`Employee ${employeeId} credentials are ready. Sign in with Employee ID ${employeeId}.`);
} finally {
  await pool.end();
}
