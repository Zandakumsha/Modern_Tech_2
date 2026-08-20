import express from "express";
import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";

import calendarRoutes from "./routes/calendar.routes.js";
import settingsRoutes from "./routes/settings.routes.js";
import dashboardRoutes from "./routes/dashboard.routes.js";
import authRouter from "./routes/auth.routes.js";
import employeeRoutes from "./routes/employees.routes.js";
import notificationsRoutes from "./routes/notifications.routes.js";
import payrollRoutes from "./routes/payroll.routes.js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

const PORT = Number(process.env.PORT) || 5000;

const publicDirectory = path.join(__dirname, "../public");

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API Routes
app.use("/api/auth", authRouter);
app.use("/api/calendar", calendarRoutes);
app.use("/api/settings", settingsRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/employees", employeeRoutes);
app.use("/api/notifications", notificationsRoutes);
app.use("/api/payroll", payrollRoutes);

// Health check
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

// Serve frontend files
app.use(express.static(publicDirectory));

// API 404 handler
app.use("/api", (_req, res) => {
  res.status(404).json({
    message: "API endpoint not found",
  });
});

// Error handler
app.use((error, _req, res, _next) => {
  console.error("Unhandled server error:", error);

  res.status(500).json({
    message: "Internal server error",
    error: process.env.NODE_ENV === "production" ? undefined : error.message,
  });
});

app.listen(PORT, () => {
  console.log(`Modern Tech server running on http://localhost:${PORT}`);
});
