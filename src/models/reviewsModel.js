import pool from "../config/db.js";

function safeParseArray(value) {
    if (Array.isArray(value)) return value;
    if (typeof value !== "string") return [];
    try {
        const parsed = JSON.parse(value);
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
}


export const getAllReviews = async() => {
    const [rows] = await pool.query(`
        SELECT 
            review_id AS id, 
            employee_id AS employeeId, 
            cycle, 
            status, 
            score, 
            manager, 
            comments, 
            strengths, 
            growth_areas AS growth 
        FROM reviews
    `);
        return rows.map((row) => ({
            ...row,
            score: row.score !== null ? parseFloat(row.score) : null,
            strengths: safeParseArray(row.strengths),
            growth: safeParseArray(row.growth),
        }));
    };
    
    export const createReview = async(data) => {
        const { employeeId, cycle, status, score, manager, comments, strengths, growth_areas } = data;
        
        const [result] = await pool.query(
            `INSERT INTO reviews (employee_id, cycle, status, score, manager, comments, strengths, growth_areas) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`, 
            [
                employeeId, 
                cycle, 
                status, 
                score, 
                manager, 
                comments, 
                JSON.stringify(strengths || []), 
                JSON.stringify(growth_areas || []) 
            ]
        );
        return result;
    };