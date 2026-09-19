# GATETrack - GATE CSE Study & Habit Tracker 🎓

**GATETrack** is a production-quality, full-stack, responsive web application specifically built for **GATE Computer Science & Information Technology (CSE)** aspirants. It empowers students to track their preparation hours, manage daily study habits, maintain streaks, systematically cover the official GATE CSE syllabus topic-by-topic, and view data-driven analytics to maximize their score.

---

## 🚀 Key Features

### 1. 📊 Interactive Dashboard
- **Dynamic Greeting**: Automatically adapts to morning, afternoon, or evening with personalized student name.
- **Top 4 Real-time Metrics**:
  - **Study Time Today** (e.g. `4h 32m`)
  - **Syllabus Progress** (e.g. `67%`)
  - **Current Preparation Streak** (e.g. `🔥 12 days`)
  - **Habit Completion** (e.g. `85%`)
- **Quick Study Timer**: Directly start, pause, resume, and finish study sessions with Subject and Topic selectors.
- **Today's Habits Checklist**: Quick completion toggle with streak counts.
- **Recent Study Sessions**: Log of recent sessions with duration and timestamps.
- **Preparation Insights**: Data-driven suggestions based on actual study patterns.
- **Daily Reflection Check-in**: Rate preparation (1–5 mood emojis), record daily accomplishments, and set tomorrow's focus.

### 2. ⏱️ Precision Study Stopwatch (`timer.html`)
- High-precision stopwatch based on timestamp differentials (`Date.now()`), unaffected by browser tab throttles or background delays.
- **Crash / Refresh Recovery**: Running sessions are automatically stored in `localStorage` and seamlessly restored upon page refresh.
- **Detailed Session Logging**: Log subject, topic, start/end timestamps, elapsed duration, and personal notes.
- **Study History & Filtering**: Filter past sessions by **Today**, **This week**, **This month**, or **All time**, with total time calculated dynamically.

### 3. 📚 Full Official GATE CSE Syllabus Tracker (`syllabus.html`)
- Pre-seeded with all **11 Official GATE CSE Subjects** and **101 Granular Topics**:
  1. **General Aptitude (GA)**
  2. **Engineering Mathematics (EM)**
  3. **Digital Logic (DL)**
  4. **Computer Organization & Architecture (COA)**
  5. **Programming and Data Structures (PDS)**
  6. **Algorithms (ALGO)**
  7. **Theory of Computation (TOC)**
  8. **Compiler Design (CD)**
  9. **Operating Systems (OS)**
  10. **Databases (DBMS)**
  11. **Computer Networks (CN)**
- **Three-State Progress Management**:
  - `☐ Not Started`
  - `◐ In Progress`
  - `✓ Completed`
- **Automatic Calculation**: Overall and subject-wise completion percentages update automatically without manual input.

### 4. 🎯 Habit Tracker & Streaks (`habits.html`)
- Manage custom habits (e.g., *Study 6 hours*, *Solve 30 PYQs*, *Revise Formulas*, *Physical Exercise*).
- Daily checklist interface with today's date banner.
- Real streak calculation based on actual calendar days (tracks current streak and best streak).
- Create custom habits with name, description, target, and icons.
- Delete habits with confirmation dialogs.

### 5. 🏆 Milestone & Badge Reward System (`profile.html`)
- Clean, non-distracting reward badges earned through consistency:
  - **Streak Milestones**: *Getting Started* (3d), *One Week Strong* (7d), *Consistency* (14d), *Discipline* (30d), *Unstoppable* (50d), *Legend* (100d).
  - **Study Hours**: *First 10 Hours* (10h), *Study Warrior* (50h), *Century* (100h), *Deep Work* (250h), *GATE Machine* (500h).
  - **Syllabus Mastery**: *First Step* (1 topic), *Halfway Mark* (50%), *Syllabus Champion* (100%).
- Automatic evaluation and toast notifications upon unlocking.

### 6. 📈 Data-Driven Analytics (`analytics.html`)
- **Weekly Study Time Chart**: Bar chart representing hours studied per day across the past 7 days.
- **Subject-wise Study Distribution**: Share of total hours spent on each subject.
- **Syllabus Progress Breakdown**: Subject-by-subject completion bars.
- **Habit Consistency Rate**: Daily habit completion percentages over the past week.
- **Reflection History**: Chronological log of past daily check-ins.
- **Empirical Insights**: Honest statistics comparing week-over-week growth and identifying top focus subjects.

### 7. 🌗 Modern Light & Dark Theme System
- Complete theme switching with zero page flashing (anti-FOUC).
- Persisted locally and synchronized to the user's database profile.

### 8. 📱 Responsive Multi-Device Design
- **Desktop**: Left navigation sidebar with user profile, theme toggle, and logout button.
- **Mobile**: Thumb-friendly bottom navigation bar, large touch targets, single-column responsive cards, and zero horizontal scrolling.

---

## 🛠️ Technology Stack

| Layer | Technology | Details |
|---|---|---|
| **Frontend** | HTML5, CSS3, Vanilla JavaScript | Semantic HTML, CSS Variables, Flexbox, Grid, Fetch API |
| **Backend** | Node.js, Express.js | Clean REST API architecture, modular route structure |
| **Database** | SQLite (`node:sqlite`) | Built-in Node 24 SQLite `DatabaseSync` engine (zero C++ compile errors) |
| **Security** | `bcryptjs`, `jsonwebtoken` | Password hashing with 10 salt rounds, JWT authentication |
| **Styling** | Custom CSS Design System | Modern study planner aesthetic, light and dark themes |

---

## 📁 Project Structure

```
Gate cs tracker og/
│
├── backend/
│   ├── database/
│   │   ├── db.js                 # SQLite database initialization & table schema
│   │   ├── seed-syllabus.js      # Complete GATE CSE 11 subjects seed script
│   │   └── gatetrack.db          # Persistent SQLite database file
│   ├── middleware/
│   │   └── auth.js               # JWT verification & route guard middleware
│   ├── routes/
│   │   ├── auth.js               # /api/auth (register, login, logout, me)
│   │   ├── profile.js            # /api/profile (get, update)
│   │   ├── study-sessions.js     # /api/study-sessions (CRUD, stats, history)
│   │   ├── syllabus.js           # /api/syllabus (list, user progress, status update)
│   │   ├── habits.js             # /api/habits (CRUD, toggle completion, streaks)
│   │   ├── badges.js             # /api/badges (badge catalog, check & unlock)
│   │   ├── checkins.js           # /api/checkins (daily reflections, rating)
│   │   └── analytics.js          # /api/analytics (weekly hours, subjects, insights)
│   ├── services/
│   │   ├── streak-service.js     # Calendar streak calculation engine
│   │   ├── badge-service.js      # Milestone & badge evaluation logic
│   │   └── insight-service.js    # Data-driven improvement insights generator
│   └── server.js                 # Express server & static frontend serving
│
├── frontend/
│   ├── index.html                # Entry point (smart router)
│   ├── login.html                # User login page
│   ├── register.html             # User registration page
│   ├── dashboard.html            # Core overview, quick timer, checklist
│   ├── timer.html                # Stopwatch and session history page
│   ├── syllabus.html             # GATE CSE syllabus tracker
│   ├── habits.html               # Daily habits tracker
│   ├── analytics.html            # Performance charts and reflection log
│   ├── profile.html              # Student profile, settings & badge gallery
│   ├── css/
│   │   ├── global.css            # Design tokens, variables, typography, buttons
│   │   ├── layout.css            # Desktop sidebar & mobile bottom navigation
│   │   ├── auth.css              # Authentication form cards
│   │   ├── dashboard.css         # Dashboard grid & quick timer styles
│   │   ├── timer.css             # Stopwatch UI & history timeline
│   │   ├── syllabus.css          # Syllabus accordions & status pills
│   │   ├── habits.css            # Habits checklist & streak tags
│   │   ├── analytics.css         # Bar charts & horizontal progress meters
│   │   ├── profile.css           # Profile identity & badge tiles
│   │   └── responsive.css        # Breakpoints (320px, 414px, 768px, 1024px)
│   └── js/
│       ├── api.js                # Fetch wrapper, JWT storage, toast notifications
│       ├── theme.js              # Theme switcher (anti-FOUC)
│       ├── navigation.js         # Navigation active highlighter & user snippet
│       ├── auth.js               # Login and registration validation
│       ├── dashboard.js          # Dashboard controller & quick timer
│       ├── timer.js              # High-precision stopwatch controller
│       ├── syllabus.js           # Syllabus tracker & progress calculator
│       ├── habits.js             # Daily habit checklist & streaks
│       ├── analytics.js          # Analytics charts & insights renderer
│       └── profile.js            # Profile updater & badge catalog
│
├── package.json
├── .env.example
├── .env
├── test-api.js                   # Automated end-to-end test suite
└── README.md
```

---

## ⚙️ Installation & Local Setup

### 1. Prerequisites
- **Node.js**: v18+ (Node.js v22+ or v24+ recommended with built-in `node:sqlite`)
- **npm**: v9+

### 2. Clone or Navigate to Project
```bash
cd "c:\Users\prana\OneDrive\Desktop\Gate cs tracker og"
```

### 3. Install Dependencies
```bash
npm install
```
*(On Windows PowerShell, if execution policy restricts npm, use `npm.cmd install`)*

### 4. Configure Environment Variables
A `.env` file is created with defaults. You can customize port and secret:
```ini
PORT=3000
NODE_ENV=development
JWT_SECRET=gatetrack_super_secret_jwt_key_2026_cse_aspirant
DATABASE_PATH=./backend/database/gatetrack.db
```

### 5. Seed the GATE CSE Syllabus & Badges
*(The server also seeds automatically on startup, but you can re-run at any time)*:
```bash
node backend/database/seed-syllabus.js
```

---

## 🏃 Starting the Application

### Start Server
```bash
npm start
```
Or directly:
```bash
node backend/server.js
```

The application will start at:
👉 **`http://localhost:3000`**

Open `http://localhost:3000` in your web browser.

---

## 🧪 Running Automated Tests

To run the complete end-to-end verification suite:
```bash
npm run test:api
```
Or:
```bash
node test-api.js
```

This tests:
1. Server health check
2. User registration and bcrypt password hashing
3. Authentication and JWT generation
4. Syllabus retrieval across all 11 subjects and 101 topics
5. Topic completion and automated percentage calculation
6. Timer session recording and duration aggregation
7. Daily habit completion and streak calculation
8. Daily reflection check-in submission
9. Real data analytics and insight generation
10. Badge milestone unlocking
11. Profile update and theme persistence

---

## 🌐 API Overview

### Authentication (`/api/auth`)
- `POST /api/auth/register`: Create a new student account (hashes password, seeds starter habits).
- `POST /api/auth/login`: Authenticate with email/password and receive JWT token.
- `POST /api/auth/logout`: Clear session.
- `GET /api/auth/me`: Get current authenticated user details.

### Study Sessions (`/api/study-sessions`)
- `POST /api/study-sessions`: Record a study session (`subject_id`, `topic_id`, `duration_seconds`, `notes`).
- `GET /api/study-sessions?filter={today|week|month|all}`: Retrieve session history with subject/topic joins.
- `GET /api/study-sessions/stats`: Get today's study seconds, weekly hours, and total sessions.

### Syllabus (`/api/syllabus`)
- `GET /api/syllabus`: Fetch all 11 subjects with nested topics and user completion status.
- `GET /api/syllabus/progress`: Get overall completion percentages and status counts.
- `PUT /api/syllabus/topics/:id`: Update topic status (`not_started`, `in_progress`, `completed`).

### Habits (`/api/habits`)
- `GET /api/habits`: List user habits with today's completion status and streaks.
- `POST /api/habits`: Create a custom habit.
- `PUT /api/habits/:id`: Update habit details.
- `DELETE /api/habits/:id`: Delete habit and history.
- `POST /api/habits/:id/toggle`: Toggle completion for today.
- `GET /api/habits/:id/history`: Past 30-day completions for a habit.

### Analytics (`/api/analytics`)
- `GET /api/analytics/overview`: High-level metrics and data-driven insights.
- `GET /api/analytics/study`: Past 7-day study distribution and subject breakdown.
- `GET /api/analytics/habits`: Past 7-day habit completion rates.
- `GET /api/analytics/syllabus`: Subject-wise syllabus completion percentages.

### Daily Check-ins (`/api/checkins`)
- `POST /api/checkins`: Submit daily reflection (`rating`, `accomplishments`, `tomorrow_focus`).
- `GET /api/checkins`: Retrieve past check-in history.
- `GET /api/checkins/today`: Status of today's check-in.

### Badges (`/api/badges`)
- `GET /api/badges`: Catalog of all badges with current user unlocked state.
- `GET /api/badges/user`: Unlocked badges for current user.

---

## 📱 Verification of the Core Student Loop

1. **Register**: Go to `http://localhost:3000/register.html` and register a new account.
2. **Dashboard**: Notice the welcoming greeting, 0h study time, 0% syllabus, 0-day streak.
3. **Quick Timer**: Select a subject (e.g. *Operating Systems*) and topic (*Processes and threads*), start the timer, let it run, and click **Finish Session**.
4. **Syllabus**: Visit the **GATE Syllabus** page, expand *Operating Systems*, and mark *Processes and threads* as **Completed**. Watch the subject and overall progress bars update automatically.
5. **Habits**: Go to the **Habits** page and check off *Solve 30 PYQs* and *Revise Formulas*. Watch the habit streak increase.
6. **Analytics**: Visit the **Analytics** page to see your real study hours logged in the weekly bar chart and your newly generated insight cards.
7. **Profile**: Check your profile to see your total hours and view the **"First Step"** badge unlocked!

---

## 🔮 Future Improvements
- **PYQ Practice Tracker**: Filterable bank of past 15 years GATE CSE questions with accuracy rate tracking.
- **Full-length Mock Test Analyzer**: Sectional and full-length test score analysis with negative mark deductions.
- **Spaced Repetition Flashcards**: Automated revision reminder schedule for formulas and difficult algorithms.
- **Personalized Study Planner**: Target exam date countdown with daily topic quotas.
