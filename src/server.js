import express from "express";
import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";
import employeesRouter from "./routes/employees.routes.js";
import authRouter from "./routes/auth.routes.js";
import payrollRouter from "./routes/payroll.routes.js";
import reviewRoutes from "./routes/reviews.routes.js";
import attendanceRouter from "./routes/attendance.route.js";
import calendarRouter from "./routes/calendar.routes.js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const PORT = Number(process.env.PORT) || 5000;
const publicDirectory = path.join(__dirname, "../public");

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api/auth", authRouter);
app.use("/api/employees", employeesRouter);
app.use("/api/payroll", payrollRouter);
app.use("/api/reviews", reviewRoutes);
app.use("/api/attendance", attendanceRouter);
app.use("/api/calendar", calendarRouter);

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", message: "Modern Tech API is running" });
});

app.use(express.static(publicDirectory));

app.get("/", (req, res) => {
  res.sendFile(path.join(publicDirectory, "index.html"));
});

app.use("/api", (req, res) => res.status(404).json({ message: "API endpoint not found" }));

app.use((error, req, res, next) => {
  console.error("Unhandled server error:", error);
  if (res.headersSent) return next(error);
  res.status(500).json({ message: "Internal server error", error: process.env.NODE_ENV === "production" ? undefined : error.message });
});

app.listen(PORT, () => console.log(`Modern Tech server running on http://localhost:${PORT}`));
