// routes/payroll.routes.js
import express from 'express';
import {
  getAllPayroll,
  getPayrollByEmployee,
  createCustomPayslip,
} from '../controllers/payrollController.js';

const router = express.Router();

// TODO: once Person 2's shared middleware is on main, protect these routes, e.g.:
// import { authenticate } from '../middleware/auth.js';
// import { validate } from '../middleware/validate.js';
// router.use(authenticate);

// GET  /api/payroll             -> all employees + their latest payroll record
router.get('/', getAllPayroll);

// GET  /api/payroll/:employeeId -> one employee's latest payroll record + computed payslip
router.get('/:employeeId', getPayrollByEmployee);

// POST /api/payroll             -> Custom Payroll Calculator (payroll.html form, empId >= 11)
router.post('/', createCustomPayslip);

export default router;