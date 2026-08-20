import crypto from "node:crypto";
import pool from "../config/db.js";

function getUsername(req) {
  return String(
    req.body?.username ||
      req.query?.username ||
      req.headers["x-username"] ||
      ""
  ).trim();
}

async function resolveUserId(req) {
  const username = getUsername(req);
  if (!username) return null;

  const [rows] = await pool.query(
    "SELECT user_id AS userId FROM users WHERE username = ? LIMIT 1",
    [username]
  );

  if (rows[0]) return rows[0].userId;

  // The current passwordless HR login can use an environment username that
  // is not present in the seed users table. Create a non-login Manager row so
  // tasks can still satisfy the tasks.user_id foreign key.
  const configuredHrUsername = String(process.env.HR_USERNAME || "hrmanager").trim();
  if (username.toLowerCase() !== configuredHrUsername.toLowerCase()) return null;

  const email = String(process.env.HR_EMAIL || `${username}@moderntech.local`)
    .trim()
    .toLowerCase();
  const passwordHash = `disabled:${crypto.randomBytes(32).toString("hex")}`;

  try {
    const [result] = await pool.query(
      `INSERT INTO users (username, email, password_hash, role)
       VALUES (?, ?, ?, 'Manager')`,
      [username, email, passwordHash]
    );
    return result.insertId;
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") {
      const [existing] = await pool.query(
        "SELECT user_id AS userId FROM users WHERE username = ? LIMIT 1",
        [username]
      );
      return existing[0]?.userId || null;
    }
    throw error;
  }
}

function normaliseTask(row) {
  return {
    id: row.task_id,
    title: row.title,
    status: row.status,
    priority: row.priority,
    completed: Boolean(row.completed),
    dueDate: row.created_at ? new Date(row.created_at).toISOString().slice(0, 10) : null,
    type:
      row.priority === "critical"
        ? "Urgent"
        : row.priority === "normal"
          ? "Work"
          : "General",
    assignee: row.username || "—",
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

const taskSelect = `
  SELECT t.task_id, t.title, t.status, t.priority, t.completed,
         t.created_at, t.updated_at, u.username
    FROM tasks t
    JOIN users u ON u.user_id = t.user_id
`;

export async function listTasks(req, res) {
  try {
    const userId = await resolveUserId(req);
    if (!userId) return res.status(400).json({ error: "A valid logged-in username is required." });

    const [rows] = await pool.query(
      `${taskSelect} WHERE t.user_id = ? ORDER BY t.completed ASC, t.created_at DESC, t.task_id DESC`,
      [userId]
    );

    return res.json(rows.map(normaliseTask));
  } catch (error) {
    console.error("Task list error:", error);
    return res.status(500).json({ error: "Unable to load tasks." });
  }
}

export async function createTask(req, res) {
  try {
    const userId = await resolveUserId(req);
    const title = String(req.body?.title || "").trim();
    const status = String(req.body?.status || "pending");
    const priority = String(req.body?.priority || "normal");
    const completed = status === "completed";

    if (!userId) return res.status(400).json({ error: "A valid logged-in username is required." });
    if (!title) return res.status(400).json({ error: "Task title is required." });
    if (!["pending", "progress", "completed"].includes(status)) {
      return res.status(400).json({ error: "Invalid task status." });
    }
    if (!["minor", "normal", "critical"].includes(priority)) {
      return res.status(400).json({ error: "Invalid task priority." });
    }

    const [result] = await pool.query(
      `INSERT INTO tasks (user_id, title, status, priority, completed)
       VALUES (?, ?, ?, ?, ?)`,
      [userId, title, status, priority, completed]
    );

    const [rows] = await pool.query(
      `${taskSelect} WHERE t.task_id = ? AND t.user_id = ? LIMIT 1`,
      [result.insertId, userId]
    );

    return res.status(201).json(normaliseTask(rows[0]));
  } catch (error) {
    console.error("Task create error:", error);
    return res.status(500).json({ error: "Unable to create task." });
  }
}

export async function updateTask(req, res) {
  try {
    const userId = await resolveUserId(req);
    const taskId = Number(req.params.id);
    const title = String(req.body?.title || "").trim();
    const status = String(req.body?.status || "pending");
    const priority = String(req.body?.priority || "normal");
    const completed = status === "completed";

    if (!userId) return res.status(400).json({ error: "A valid logged-in username is required." });
    if (!Number.isInteger(taskId) || taskId <= 0) return res.status(400).json({ error: "A valid task id is required." });
    if (!title) return res.status(400).json({ error: "Task title is required." });
    if (!["pending", "progress", "completed"].includes(status)) return res.status(400).json({ error: "Invalid task status." });
    if (!["minor", "normal", "critical"].includes(priority)) return res.status(400).json({ error: "Invalid task priority." });

    const [result] = await pool.query(
      `UPDATE tasks
          SET title = ?, status = ?, priority = ?, completed = ?
        WHERE task_id = ? AND user_id = ?`,
      [title, status, priority, completed, taskId, userId]
    );

    if (!result.affectedRows) return res.status(404).json({ error: "Task not found." });

    const [rows] = await pool.query(
      `${taskSelect} WHERE t.task_id = ? AND t.user_id = ? LIMIT 1`,
      [taskId, userId]
    );
    return res.json(normaliseTask(rows[0]));
  } catch (error) {
    console.error("Task update error:", error);
    return res.status(500).json({ error: "Unable to update task." });
  }
}

export async function deleteTask(req, res) {
  try {
    const userId = await resolveUserId(req);
    const taskId = Number(req.params.id);

    if (!userId) return res.status(400).json({ error: "A valid logged-in username is required." });
    if (!Number.isInteger(taskId) || taskId <= 0) return res.status(400).json({ error: "A valid task id is required." });

    const [result] = await pool.query(
      "DELETE FROM tasks WHERE task_id = ? AND user_id = ?",
      [taskId, userId]
    );

    if (!result.affectedRows) return res.status(404).json({ error: "Task not found." });
    return res.status(204).send();
  } catch (error) {
    console.error("Task delete error:", error);
    return res.status(500).json({ error: "Unable to delete task." });
  }
}

export async function toggleTask(req, res) {
  try {
    const userId = await resolveUserId(req);
    const taskId = Number(req.params.id);
    const completed = Boolean(req.body?.completed);

    if (!userId) return res.status(400).json({ error: "A valid logged-in username is required." });
    if (!Number.isInteger(taskId) || taskId <= 0) return res.status(400).json({ error: "A valid task id is required." });

    const [result] = await pool.query(
      `UPDATE tasks
          SET completed = ?, status = ?
        WHERE task_id = ? AND user_id = ?`,
      [completed, completed ? "completed" : "pending", taskId, userId]
    );

    if (!result.affectedRows) return res.status(404).json({ error: "Task not found." });

    const [rows] = await pool.query(
      `${taskSelect} WHERE t.task_id = ? AND t.user_id = ? LIMIT 1`,
      [taskId, userId]
    );
    return res.json(normaliseTask(rows[0]));
  } catch (error) {
    console.error("Task completion error:", error);
    return res.status(500).json({ error: "Unable to update task completion." });
  }
}
