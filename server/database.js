const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.resolve(__dirname, 'attendance.db');
const db = new Database(dbPath, { verbose: console.log });

// Create Tables
const initDB = () => {
    // Enable foreign keys
    db.pragma('foreign_keys = ON');

    // Users table for login (basic auth)
    db.exec(`
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE,
            password TEXT
        )
    `);

    // Students table
    db.exec(`
        CREATE TABLE IF NOT EXISTS students (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT UNIQUE,
            enrollment_date DATE DEFAULT (date('now'))
        )
    `);

    // Subjects/Courses table
    db.exec(`
        CREATE TABLE IF NOT EXISTS subjects (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL UNIQUE,
            code TEXT UNIQUE
        )
    `);

    // Classes table (to track total classes for a subject)
    db.exec(`
        CREATE TABLE IF NOT EXISTS classes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            subject_id INTEGER NOT NULL,
            date DATE NOT NULL,
            FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE
        )
    `);

    // Attendance table
    db.exec(`
        CREATE TABLE IF NOT EXISTS attendance (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            class_id INTEGER NOT NULL,
            student_id INTEGER NOT NULL,
            status TEXT CHECK(status IN ('Present', 'Absent')) NOT NULL,
            FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE,
            FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
            UNIQUE(class_id, student_id) -- Prevent duplicate attendance for same student in same class
        )
    `);

    console.log("Database tables initialized successfully.");
    
    // Add default user if not exists
    const adminCheck = db.prepare('SELECT id FROM users WHERE username = ?').get('admin');
    if (!adminCheck) {
        // Warning: This is plain text for simplicity and beginner-friendliness. 
        // In real apps, ALWAYS hash passwords with bcrypt.
        db.prepare('INSERT INTO users (username, password) VALUES (?, ?)').run('admin', 'password');
    }
};

initDB();

module.exports = db;
