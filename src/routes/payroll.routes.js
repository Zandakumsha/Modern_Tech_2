// routes/payroll.routes.js
import express from 'express';
import {
  getAllPayroll,
  getPayrollByEmployee,
  createCustomPayslip,
  getPositionsDepartments,
} from '../controllers/payrollController.js';

const router = express.Router();

router.get('/', getAllPayroll);
router.get('/options/positions-departments', getPositionsDepartments);
router.get('/:employeeId', getPayrollByEmployee);
router.post('/', createCustomPayslip);

export default router;
