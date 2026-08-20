// import pool from "../config/db.js";

// //Retrieves all employees
// export const getAllEmployee = async () => {
//     const [rows] = await pool.query('SELECT * FROM employees');
//     return rows;
// }

// // Fetches employee by it's id
// export const getEmployeeById = async (employee_id) => {
//     const [rows] = await pool.query('SELECT * FROM employees WHERE employee_id = ? ', [employee_id]);
//     return rows[0] || null;
// }
// // Creates / Adds an employee
// export const createEmployee = async (name, position, department, salary, employment_history, contact) => {
//     const [result] = await pool.query('INSERT INTO employees (name, position, department, salary, employment_history, contact) VALUES (?, ?, ?, ?, ?, ?) ', [name, position, department, salary, employment_history, contact]);
//     return result;
// }

// // Updates employee record
// export const updateEmployee = async (employee_id, name, position, department, salary, employment_history, contact) => {
//     const [result] = await pool.query('UPDATE employees SET name = ?, position = ?, salary = ?, employmemt_history =?, contact = ? WHERE employee_id = ? ', [name, position, department, salary, employment_history, contact, employee_id]);
//     return result;
// }

// // Delete employee record
// export const deleteEmployee = async (employee_id) => {
//     const [result] = await pool.query('DELETE FROM employees WHERE employee_id = ?', [employee_id]);
//     return result;
// }

