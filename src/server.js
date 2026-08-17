import express from "express";
import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";
import employeesRouter from "./routes/employees.routes.js";

// Load environment variables before the database module is used.
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const publicDirectory = path.join(__dirname, "../public");

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API routes
app.use("/api/employees", employeesRouter);

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", message: "Modern Tech API is running" });
});

// Serve the frontend after API routes.
app.use(express.static(publicDirectory));

app.get("/", (req, res) => {
  res.sendFile(path.join(publicDirectory, "index.html"));
});

// JSON 404 for API calls.
app.use("/api", (req, res) => {
  res.status(404).json({ message: "API endpoint not found" });
});

// Central error handler.
app.use((error, req, res, next) => {
  console.error("Unhandled server error:", error);

  if (res.headersSent) return next(error);

  res.status(500).json({
    message: "Internal server error",
    error: process.env.NODE_ENV === "production" ? undefined : error.message,
  });
});

app.listen(PORT, () => {
  console.log(`Modern Tech server running on http://localhost:${PORT}`);
});
