# Full-Stack Attendance Management

This is a beautiful glassmorphism-based, full-stack Attendance application built for beginners to easily understand.

## Features
- Complete CRUD for Students and Subjects.
- Attendance marking per class/date.
- Dashboard with Chart.js analytics and Low-Attendance alerts (<75%).
- Uses basic user authentication.
- Responsive, premium UI.

## Tech Stack
- **Frontend**: Vanilla Javascript, HTML5, CSS3 Setup, Chart.js (No complex builds).
- **Backend**: Node.js, Express.js.
- **Database**: SQLite3 (using `better-sqlite3` for synchronous speed and ease).

## Requirements
- Node.js (v14 or higher)

## Installation & Running Locally

1. **Install dependencies**
   Open your terminal in this directory and run:
   ```bash
   npm install
   ```

2. **Initialize Database with Dummy Data**
   ```bash
   node seed.js
   ```

3. **Start the Express Server**
   ```bash
   node server/server.js
   ```

4. **Open in Browser**
   Go to: `http://localhost:3000`

## Login Details
**Username**: `admin`
**Password**: `password`
