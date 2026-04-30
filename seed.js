const db = require('./server/database');

console.log("Seeding database...");

// Insert sample subjects
try {
    db.prepare("INSERT INTO subjects (name, code) VALUES ('Mathematics', 'MATH101')").run();
    db.prepare("INSERT INTO subjects (name, code) VALUES ('History', 'HIST201')").run();
    db.prepare("INSERT INTO subjects (name, code) VALUES ('Science', 'SCI301')").run();
} catch (e) { /* ignore duplicates */ }

// Insert sample students
try {
    db.prepare("INSERT INTO students (name, email) VALUES ('Alice Smith', 'alice@test.com')").run();
    db.prepare("INSERT INTO students (name, email) VALUES ('Bob Jones', 'bob@test.com')").run();
    db.prepare("INSERT INTO students (name, email) VALUES ('Charlie Brown', 'charlie@test.com')").run();
} catch (e) { /* ignore duplicates */ }

// Provide fake attendance data
try {
    const today = new Date().toISOString().split('T')[0];
    
    // Create class
    let classInfo = db.prepare("SELECT id FROM classes WHERE subject_id = 1 AND date = ?").get(today);
    
    if (!classInfo) {
        const insertClass = db.prepare("INSERT INTO classes (subject_id, date) VALUES (1, ?)").run(today);
        classInfo = { id: insertClass.lastInsertRowid };
    }
    
    const class_id = classInfo.id;

    // Mark attendance
    db.prepare("INSERT OR IGNORE INTO attendance (class_id, student_id, status) VALUES (?, ?, ?)").run(class_id, 1, 'Present');
    db.prepare("INSERT OR IGNORE INTO attendance (class_id, student_id, status) VALUES (?, ?, ?)").run(class_id, 2, 'Absent');
    db.prepare("INSERT OR IGNORE INTO attendance (class_id, student_id, status) VALUES (?, ?, ?)").run(class_id, 3, 'Present');
    
} catch (e) { console.log(e.message); }

console.log("Seeding completed! You can now start the server with 'node server/server.js' and login with admin/password");
