const express = require('express');
const router = express.Router();
const db = require('../database');

// Get all subjects
router.get('/', (req, res) => {
    try {
        const subjects = db.prepare('SELECT * FROM subjects').all();
        res.json(subjects);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Add a new subject
router.post('/', (req, res) => {
    const { name, code } = req.body;
    try {
        const info = db.prepare('INSERT INTO subjects (name, code) VALUES (?, ?)').run(name, code);
        res.status(201).json({ id: info.lastInsertRowid, name, code });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// Update a subject
router.put('/:id', (req, res) => {
    const { name, code } = req.body;
    try {
        db.prepare('UPDATE subjects SET name = ?, code = ? WHERE id = ?').run(name, code, req.params.id);
        res.json({ message: "Subject updated successfully" });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// Delete a subject
router.delete('/:id', (req, res) => {
    try {
        db.prepare('DELETE FROM subjects WHERE id = ?').run(req.params.id);
        res.json({ message: "Subject deleted successfully" });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

module.exports = router;
