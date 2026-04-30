const express = require('express');
const router = express.Router();
const db = require('../database');

// Get all students
router.get('/', (req, res) => {
    try {
        const students = db.prepare('SELECT * FROM students').all();
        res.json(students);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Add a new student
router.post('/', (req, res) => {
    const { name, email } = req.body;
    try {
        const info = db.prepare('INSERT INTO students (name, email) VALUES (?, ?)').run(name, email);
        res.status(201).json({ id: info.lastInsertRowid, name, email });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// Update a student
router.put('/:id', (req, res) => {
    const { name, email } = req.body;
    try {
        db.prepare('UPDATE students SET name = ?, email = ? WHERE id = ?').run(name, email, req.params.id);
        res.json({ message: "Student updated successfully" });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// Delete a student
router.delete('/:id', (req, res) => {
    try {
        db.prepare('DELETE FROM students WHERE id = ?').run(req.params.id);
        res.json({ message: "Student deleted successfully" });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

module.exports = router;
