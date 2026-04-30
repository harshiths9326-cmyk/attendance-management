const express = require('express');
const router = express.Router();
const db = require('../database');

// Get all classes
router.get('/classes', (req, res) => {
    try {
        const classes = db.prepare(`
            SELECT c.*, s.name as subject_name 
            FROM classes c
            JOIN subjects s ON c.subject_id = s.id
            ORDER BY c.date DESC
        `).all();
        res.json(classes);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Create a new class session for attendance marking
router.post('/class', (req, res) => {
    const { subject_id, date } = req.body;
    try {
        // Check if class already exists for this subject and date
        let classRecord = db.prepare('SELECT * FROM classes WHERE subject_id = ? AND date = ?').get(subject_id, date);
        
        if (!classRecord) {
            const info = db.prepare('INSERT INTO classes (subject_id, date) VALUES (?, ?)').run(subject_id, date);
            classRecord = { id: info.lastInsertRowid, subject_id, date };
        }
        res.status(201).json(classRecord);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// Mark attendance
router.post('/', (req, res) => {
    const { class_id, student_id, status } = req.body;
    try {
        db.prepare(`
            INSERT INTO attendance (class_id, student_id, status)
            VALUES (?, ?, ?)
            ON CONFLICT(class_id, student_id) 
            DO UPDATE SET status = excluded.status
        `).run(class_id, student_id, status);
        res.json({ message: "Attendance marked successfully" });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// Get attendance for a specific class
router.get('/class/:class_id', (req, res) => {
    try {
        const records = db.prepare(`
            SELECT a.*, s.name as student_name 
            FROM attendance a
            JOIN students s ON a.student_id = s.id
            WHERE a.class_id = ?
        `).all(req.params.class_id);
        res.json(records);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get comprehensive attendance history with optional filters
router.get('/history', (req, res) => {
    const { date, student_id, subject_id } = req.query;
    let query = `
        SELECT a.id, a.status, c.date, s.name as subject_name, st.name as student_name
        FROM attendance a
        JOIN classes c ON a.class_id = c.id
        JOIN subjects s ON c.subject_id = s.id
        JOIN students st ON a.student_id = st.id
        WHERE 1=1
    `;
    const params = [];
    if (date) { query += ' AND c.date = ?'; params.push(date); }
    if (student_id) { query += ' AND a.student_id = ?'; params.push(student_id); }
    if (subject_id) { query += ' AND c.subject_id = ?'; params.push(subject_id); }
    
    query += ' ORDER BY c.date DESC, st.name ASC';
    try {
        const records = db.prepare(query).all(...params);
        res.json(records);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get all dates that have any class (for highlighting calendar)
router.get('/active-dates', (req, res) => {
    try {
        const records = db.prepare('SELECT DISTINCT date FROM classes').all();
        const dates = records.map(r => r.date);
        res.json(dates);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Export attendance history as CSV
router.get('/export', (req, res) => {
    try {
        const records = db.prepare(`
            SELECT c.date, s.name as subject_name, st.name as student_name, a.status
            FROM attendance a
            JOIN classes c ON a.class_id = c.id
            JOIN subjects s ON c.subject_id = s.id
            JOIN students st ON a.student_id = st.id
            ORDER BY c.date DESC, s.name ASC, st.name ASC
        `).all();

        let csv = 'Date,Subject,Student,Status\n';
        records.forEach(r => {
            csv += `"${r.date}","${r.subject_name}","${r.student_name}","${r.status}"\n`;
        });

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename="attendance_export.csv"');
        res.send(csv);
    } catch (err) {
        res.status(500).send('Error generating export');
    }
});

module.exports = router;
