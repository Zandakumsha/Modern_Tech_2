import express from "express";
import dotenv from "dotenv";
import calendarRoutes from "./routes/calendar.routes.js";
import settingsRoutes from "./routes/settings.routes.js";
import dashboardRoutes from "./routes/dashboard.routes.js";

dotenv.config();

const app = express();
// Modern Tech uses port 5000 for the complete application.
// Set PORT=5000 in .env to override this if needed.
const PORT = Number(process.env.PORT) || 5000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve every frontend page from the same Express server and port.
app.use(express.static("public"));

app.get("/api/health", (_req, res) => res.json({ status: "ok" }));
app.use("/api/calendar", calendarRoutes);
app.use("/api/settings", settingsRoutes);
app.use("/api/dashboard", dashboardRoutes);

app.use((error, _req, res, _next) => {
  console.error(error);
  res.status(500).json({ error: "Internal server error" });
});

app.listen(PORT, () => {
  console.log(`Modern Tech server running on port ${PORT}`);
});
