const express = require('express');
const router = express.Router();
const db = require('../database');

// Get overall stats
router.get('/stats', (req, res) => {
    try {
        const totalStudents = db.prepare('SELECT COUNT(*) as count FROM students').get().count;
        const totalSubjects = db.prepare('SELECT COUNT(*) as count FROM subjects').get().count;
        const totalClasses = db.prepare('SELECT COUNT(*) as count FROM classes').get().count;
        
        res.json({ totalStudents, totalSubjects, totalClasses });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get attendance summary per student (overall or filtered by subject)
router.get('/student-summary', (req, res) => {
    const { subject_id } = req.query;
    try {
        let query = `
            SELECT 
                s.id as student_id,
                s.name,
                COUNT(a.id) as total_classes,
                SUM(CASE WHEN a.status = 'Present' THEN 1 ELSE 0 END) as attended,
                SUM(CASE WHEN a.status = 'Absent' THEN 1 ELSE 0 END) as missed,
                ROUND(CAST(SUM(CASE WHEN a.status = 'Present' THEN 1 ELSE 0 END) AS FLOAT) / 
                NULLIF(COUNT(a.id), 0) * 100, 2) as percentage
            FROM students s
            LEFT JOIN attendance a ON s.id = a.student_id
            LEFT JOIN classes c ON a.class_id = c.id
        `;
        
        if (subject_id) {
            query += ` WHERE c.subject_id = ? `;
        }
        
        query += ` GROUP BY s.id `;
        
        const summary = subject_id ? db.prepare(query).all(subject_id) : db.prepare(query).all();
        res.json(summary);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get attendance summary per subject
router.get('/subject-summary', (req, res) => {
    const { student_id } = req.query;
    try {
        let query = `
            SELECT 
                sub.id as subject_id,
                sub.name,
                SUM(CASE WHEN a.status = 'Present' THEN 1 ELSE 0 END) as attended,
                SUM(CASE WHEN a.status = 'Absent' THEN 1 ELSE 0 END) as missed
            FROM subjects sub
            LEFT JOIN classes c ON sub.id = c.subject_id
            LEFT JOIN attendance a ON c.id = a.class_id
        `;
        const params = [];
        if (student_id) {
            query += ` AND a.student_id = ? `;
            params.push(student_id);
        }
        
        query += ` GROUP BY sub.id`;
        const summary = db.prepare(query).all(...params);
        
        const formatted = summary.map(r => ({
            name: r.name,
            attended: r.attended || 0,
            missed: r.missed || 0
        }));
        res.json(formatted);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get detailed breakdown per student per subject
router.get('/detailed-table', (req, res) => {
    try {
        const query = `
            SELECT 
                st.id as student_id,
                st.name as student_name,
                sub.name as subject_name,
                COUNT(c.id) as classes_held,
                SUM(CASE WHEN a.status = 'Present' THEN 1 ELSE 0 END) as classes_attended,
                ROUND(CAST(SUM(CASE WHEN a.status = 'Present' THEN 1 ELSE 0 END) AS FLOAT) / NULLIF(COUNT(c.id), 0) * 100, 2) as percentage
            FROM students st
            CROSS JOIN subjects sub
            LEFT JOIN classes c ON sub.id = c.subject_id
            LEFT JOIN attendance a ON st.id = a.student_id AND c.id = a.class_id
            GROUP BY st.id, sub.id
            ORDER BY st.name ASC, sub.name ASC
        `;
        const records = db.prepare(query).all();
        res.json(records);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
