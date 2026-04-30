// Check auth
if (!localStorage.getItem('auth') && window.location.pathname !== '/login.html') {
    window.location.href = '/login.html';
}

document.getElementById('logoutBtn')?.addEventListener('click', () => {
    localStorage.removeItem('auth');
    window.location.href = '/login.html';
});

// Navigation
document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', (e) => {
        e.preventDefault();
        
        // Find closest a tag in case they click the icon inside it
        const targetEl = e.target.closest('a');
        if(!targetEl) return;
        
        document.querySelectorAll('.nav-item').forEach(nav => nav.classList.remove('active'));
        targetEl.classList.add('active');
        
        document.querySelectorAll('.view-section').forEach(sec => sec.classList.add('hidden'));
        const targetId = targetEl.getAttribute('data-target');
        document.getElementById(targetId).classList.remove('hidden');
        
        if (targetId === 'students') loadStudents();
        if (targetId === 'subjects') loadSubjects();
        if (targetId === 'attendance') loadCalendarView();
        if (targetId === 'records') buildRecordsSetup();
        if (targetId === 'dashboard') loadDashboard();
    });
});

// Modals
function openModal(id) { document.getElementById(id).classList.remove('hidden'); }
function closeModal(id) { document.getElementById(id).classList.add('hidden'); }

// Initial Load
if (window.location.pathname === '/' || window.location.pathname === '/index.html') {
    loadDashboard();
}

// ============== DASHBOARD ==============
let globalDetailedData = [];

async function loadDashboard() {
    try {
        const statsRes = await fetch('/api/dashboard/stats');
        const stats = await statsRes.json();
        document.getElementById('stat-students').innerText = stats.totalStudents;
        document.getElementById('stat-subjects').innerText = stats.totalSubjects;
        document.getElementById('stat-classes').innerText = stats.totalClasses;

        const summaryRes = await fetch('/api/dashboard/student-summary');
        const summary = await summaryRes.json();
        
        const detailedRes = await fetch('/api/dashboard/detailed-table');
        globalDetailedData = await detailedRes.json();
        
        // Populate Student Pills
        const stuRes = await fetch('/api/students');
        const students = await stuRes.json();
        const studentPills = document.getElementById('studentPills');
        studentPills.innerHTML = '<button class="btn btn-small primary-btn" onclick="filterDashboardChart(\'\', this)">Overall</button>';
        students.forEach(s => {
            studentPills.innerHTML += `<button class="btn btn-small" style="background:rgba(0,0,0,0.1);" onclick="filterDashboardChart(${s.id}, this)">${s.name}</button>`;
        });
        
        filterDashboardChart('', studentPills.firstElementChild);
        
        // Populate alerts
        const alertsList = document.getElementById('alertsList');
        alertsList.innerHTML = '';
        summary.forEach(student => {
            if (student.percentage !== null && student.percentage < 75) {
                const li = document.createElement('li');
                li.innerHTML = `<strong>${student.name}</strong> - ${student.percentage}% attendance`;
                alertsList.appendChild(li);
            }
        });
    } catch (err) { console.error('Error loading dashboard', err); }
}

window.filterDashboardChart = async function(student_id, btnElement) {
    if (btnElement) {
        // Handle active styling
        const btns = document.getElementById('studentPills').querySelectorAll('button');
        btns.forEach(b => {
             b.className = 'btn btn-small';
             b.style.background = 'rgba(0,0,0,0.1)';
             b.style.color = 'inherit';
        });
        btnElement.className = 'btn btn-small primary-btn';
        btnElement.style.background = 'var(--primary)';
        btnElement.style.color = 'white';
    }

    let url = '/api/dashboard/subject-summary';
    if(student_id) url += `?student_id=${student_id}`;
    
    // Render the table using globalDetailedData
    const tbody = document.querySelector('#dashboardDetailedTable tbody');
    if (tbody && globalDetailedData) {
        tbody.innerHTML = '';
        const filteredData = student_id 
            ? globalDetailedData.filter(d => d.student_id === student_id)
            : globalDetailedData;
            
        filteredData.forEach(r => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${r.student_name}</td>
                <td>${r.subject_name}</td>
                <td>${r.classes_held}</td>
                <td>${r.classes_attended}</td>
                <td style="color:${r.percentage !== null && r.percentage < 75 ? 'var(--danger)' : 'var(--success)'}; font-weight:bold;">
                    ${r.percentage === null ? 'N/A' : r.percentage + '%'}
                </td>
            `;
            tbody.appendChild(tr);
        });
    }

    try {
        const subjectRes = await fetch(url);
        const subjectSummary = await subjectRes.json();
        if(window.updateChart) {
            window.updateChart(subjectSummary);
        }
    } catch(err) { console.error(err); }
}

// ============== STUDENTS ==============
async function loadStudents() {
    try {
        const res = await fetch('/api/students');
        const students = await res.json();
        const tbody = document.querySelector('#studentsTable tbody');
        tbody.innerHTML = '';
        students.forEach(s => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${s.id}</td>
                <td>${s.name}</td>
                <td>${s.email}</td>
                <td>
                    <button class="btn btn-small btn-danger" onclick="deleteStudent(${s.id})">Delete</button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    } catch(err) { console.error(err); }
}

document.getElementById('studentForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('sName').value;
    const email = document.getElementById('sEmail').value;
    try {
        const res = await fetch('/api/students', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ name, email })
        });
        if (!res.ok) {
            const obj = await res.json();
            alert("Error adding student: " + (obj.error || "Unknown"));
            return;
        }
        closeModal('studentModal');
        e.target.reset();
        loadStudents();
    } catch(err) { console.error(err); alert("Failed to connect"); }
});

window.deleteStudent = async function(id) {
    if(confirm('Are you sure?')) {
        await fetch(`/api/students/${id}`, { method: 'DELETE' });
        loadStudents();
    }
}

// ============== SUBJECTS ==============
async function loadSubjects() {
    try {
        const res = await fetch('/api/subjects');
        const subjects = await res.json();
        const tbody = document.querySelector('#subjectsTable tbody');
        tbody.innerHTML = '';
        subjects.forEach(s => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${s.id}</td>
                <td>${s.name}</td>
                <td>${s.code}</td>
                <td>
                    <button class="btn btn-small btn-danger" onclick="deleteSubject(${s.id})">Delete</button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    } catch(err) { console.error(err); }
}

document.getElementById('subjectForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('subName').value;
    const code = document.getElementById('subCode').value;
    try {
        const res = await fetch('/api/subjects', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ name, code })
        });
        if (!res.ok) {
            const obj = await res.json();
            alert("Error adding subject: " + (obj.error || "Unknown"));
            return;
        }
        closeModal('subjectModal');
        e.target.reset();
        loadSubjects();
    } catch(err) { console.error(err); alert("Failed to connect"); }
});

window.deleteSubject = async function(id) {
    if(confirm('Are you sure?')) {
        await fetch(`/api/subjects/${id}`, { method: 'DELETE' });
        loadSubjects();
    }
}

// ============== CALENDAR & ATTENDANCE ==============
let currentDate = new Date();
let activeDates = []; 

async function loadCalendarView() {
    try {
        const adRes = await fetch('/api/attendance/active-dates');
        activeDates = await adRes.json();
        renderCalendar();
    } catch(err) { console.error(err); }
}

function renderCalendar() {
    const monthYear = document.getElementById('monthYearDisplay');
    const daysGrid = document.getElementById('calendarDays');
    
    // Set headers
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    monthYear.innerText = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });
    
    const firstDayIndex = new Date(year, month, 1).getDay();
    const lastDate = new Date(year, month + 1, 0).getDate();
    
    daysGrid.innerHTML = '';
    
    // empty blocks
    for(let i=0; i<firstDayIndex; i++) {
        const emptyDiv = document.createElement('div');
        emptyDiv.classList.add('calendar-day', 'empty');
        daysGrid.appendChild(emptyDiv);
    }
    
    // days
    for(let i=1; i<=lastDate; i++) {
        const dayDiv = document.createElement('div');
        dayDiv.classList.add('calendar-day');
        dayDiv.innerHTML = `<span class="day-number">${i}</span>`;
        
        // format date as YYYY-MM-DD cleanly using local numbers
        const dateString = `${year}-${String(month+1).padStart(2,'0')}-${String(i).padStart(2,'0')}`;
        
        if (activeDates.includes(dateString)) {
            dayDiv.innerHTML += `<div class="day-indicator active"></div>`;
        } else {
            dayDiv.innerHTML += `<div class="day-indicator"></div>`;
        }
        
        dayDiv.addEventListener('click', () => openDayModal(dateString));
        daysGrid.appendChild(dayDiv);
    }
}

document.getElementById('prevMonth')?.addEventListener('click', () => {
    currentDate.setMonth(currentDate.getMonth() - 1);
    renderCalendar();
});
document.getElementById('nextMonth')?.addEventListener('click', () => {
    currentDate.setMonth(currentDate.getMonth() + 1);
    renderCalendar();
});

let selectedCalendarDate = '';

async function openDayModal(dateString) {
    selectedCalendarDate = dateString;
    document.getElementById('modalDateHeader').innerText = `Marking Attendance: ${dateString}`;
    document.getElementById('attendanceMarkingArea').classList.add('hidden');
    
    // Populate subjects as visible pills
    try {
        const res = await fetch('/api/subjects');
        const subjects = await res.json();
        const pillsContainer = document.getElementById('attendanceSubjectPills');
        pillsContainer.innerHTML = '';
        subjects.forEach(s => {
            const btn = document.createElement('button');
            btn.className = 'btn btn-small';
            btn.style.background = 'rgba(0,0,0,0.1)';
            btn.innerText = s.name;
            btn.onclick = () => window.startAttendanceCalendar(s.id, s.name, btn);
            pillsContainer.appendChild(btn);
        });
        openModal('attendanceModal');
    } catch(err) { console.error(err); }
}

window.startAttendanceCalendar = async function(subject_id, subjectNameFull, btnElement) {
    if(btnElement) {
        const btns = document.getElementById('attendanceSubjectPills').querySelectorAll('button');
        btns.forEach(b => {
             b.className = 'btn btn-small';
             b.style.background = 'rgba(0,0,0,0.1)';
             b.style.color = 'inherit';
        });
        btnElement.className = 'btn btn-small primary-btn';
        btnElement.style.background = 'var(--primary)';
        btnElement.style.color = 'white';
    }
    const date = selectedCalendarDate;
    if (!subject_id || !date) return alert("Select subject");

    try {
        // Create or get class
        const classRes = await fetch('/api/attendance/class', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ subject_id, date })
        });
        const classData = await classRes.json();
        
        const studentsRes = await fetch('/api/students');
        const students = await studentsRes.json();

        // Fetch existing attendance for this class
        const attRes = await fetch(`/api/attendance/class/${classData.id}`);
        const existingAtt = await attRes.json();
        
        const existingMap = {};
        existingAtt.forEach(a => existingMap[a.student_id] = a.status);

        document.getElementById('attendanceMarkingArea').classList.remove('hidden');
        document.getElementById('currentClassInfo').innerText = `Marking ${subjectNameFull} on ${date}`;
        
        const tbody = document.querySelector('#attendanceMarkingTable tbody');
        tbody.innerHTML = '';
        
        students.forEach(s => {
            const tr = document.createElement('tr');
            const status = existingMap[s.id] || 'Not Marked';
            tr.innerHTML = `
                <td>${s.name}</td>
                <td>
                    <button class="btn btn-small btn-success" onclick="markStudent(${classData.id}, ${s.id}, 'Present')">Present</button>
                    <button class="btn btn-small btn-danger" onclick="markStudent(${classData.id}, ${s.id}, 'Absent')">Absent</button>
                </td>
                <td id="status-${s.id}" style="color: ${status === 'Present' ? 'var(--success)' : status === 'Absent' ? 'var(--danger)' : ''}; font-weight: 600;">${status}</td>
            `;
            tbody.appendChild(tr);
        });
        
        // active highlight
        if(!activeDates.includes(selectedCalendarDate)) {
            activeDates.push(selectedCalendarDate);
            renderCalendar();
        }

    } catch(err) { console.error(err); }
}

window.markStudent = async function(class_id, student_id, status) {
    try {
        await fetch('/api/attendance', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ class_id, student_id, status })
        });
        const statusEl = document.getElementById(`status-${student_id}`);
        statusEl.innerText = status;
        statusEl.style.color = status === 'Present' ? 'var(--success)' : 'var(--danger)';
    } catch(err) { console.error(err); }
}

// ============== RECORDS ==============
async function buildRecordsSetup() {
    try {
        const subRes = await fetch('/api/subjects');
        const subjects = await subRes.json();
        const subSel = document.getElementById('filterSubject');
        subSel.innerHTML = '<option value="">All Subjects</option>';
        subjects.forEach(s => {
            const opt = document.createElement('option');
            opt.value = s.id;
            opt.innerText = s.name;
            subSel.appendChild(opt);
        });

        const stuRes = await fetch('/api/students');
        const students = await stuRes.json();
        const stuSel = document.getElementById('filterStudent');
        stuSel.innerHTML = '<option value="">All Students</option>';
        students.forEach(s => {
            const opt = document.createElement('option');
            opt.value = s.id;
            opt.innerText = s.name;
            stuSel.appendChild(opt);
        });
        
        fetchRecords();
    } catch(err) { console.error(err); }
}

window.fetchRecords = async function() {
    const date = document.getElementById('filterDate').value;
    const subject_id = document.getElementById('filterSubject').value;
    const student_id = document.getElementById('filterStudent').value;
    
    let url = '/api/attendance/history?';
    if(date) url += `date=${date}&`;
    if(subject_id) url += `subject_id=${subject_id}&`;
    if(student_id) url += `student_id=${student_id}&`;

    try {
        const res = await fetch(url);
        const records = await res.json();
        const tbody = document.querySelector('#recordsTable tbody');
        tbody.innerHTML = '';
        
        if(records.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;">No records found.</td></tr>';
            return;
        }

        records.forEach(r => {
            const tr = document.createElement('tr');
            const statColor = r.status === 'Present' ? 'var(--success)' : 'var(--danger)';
            tr.innerHTML = `
                <td>${r.date}</td>
                <td>${r.student_name}</td>
                <td>${r.subject_name}</td>
                <td style="color: ${statColor}; font-weight: 600;">${r.status}</td>
            `;
            tbody.appendChild(tr);
        });
    } catch(err) { console.error(err); }
}
