// server.js
//
// NOTE: This is a minimal working scaffold so the team can actually run
// and test the API locally. Person 4 owns server.js / repo structure per
// the team roles doc — treat this as a starting point to merge/replace,
// not a final version. Swap in real auth/validate middleware usage once
// confirmed with Person 2.
//
// Written as ESM to match package.json's "type": "module".

import 'dotenv/config';
import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import payrollRoutes from './routes/payroll.routes.js';
// Uncomment these one at a time once you've confirmed each file exists and
// exports a valid express.Router() with `export default router;` — if any
// of them still use CommonJS (require/module.exports), Node will throw a
// clear error naming that exact file, since ESM imports are static.
// import employeesRoutes from './routes/employees.routes.js';
// import authRoutes from './routes/auth.routes.js';
// import attendanceRoutes from './routes/attendance.routes.js';
// import reviewsRoutes from './routes/reviews.routes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// --- core middleware ---
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --- serve the frontend directly, so payroll.html's relative fetch("/api/...") calls
//     resolve to this same server. Open http://localhost:5000/payroll.html instead of
//     using Live Server on a different port — avoids needing CORS entirely. ---
app.use(express.static(path.join(__dirname, '..', 'public')));

// --- API routes ---
app.use('/api/payroll', payrollRoutes);
// app.use('/api/employees', employeesRoutes);
// app.use('/api/auth', authRoutes);
// app.use('/api/attendance', attendanceRoutes);
// app.use('/api/reviews', reviewsRoutes);

// --- health check ---
app.get('/api/health', (req, res) => {
  res.json({ success: true, status: 'ok' });
});

// --- centralized error handler (must be last) ---
// Uncomment once confirmed errorHandler.js exports a default 4-arg function
// (err, req, res, next) using ESM `export default`.
// import errorHandler from './middleware/errorHandler.js';
// app.use(errorHandler);

// fallback error handler until the shared one above is wired in
app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({
    success: false,
    error: err.message || 'Internal server error',
  });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});