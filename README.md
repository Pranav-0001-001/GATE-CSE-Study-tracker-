# GATETrack

A study and habit tracker I built for GATE CSE preparation. You can log your study time, mark syllabus topics as done, track daily habits, and see how your preparation is going over time.

Built with Node.js, Express, SQLite and plain HTML/CSS/JavaScript.

## What it does

- **Dashboard**: shows today's study time, syllabus progress, current streak and habit completion. It also has a quick timer, a habit checklist and a daily check-in.
- **Study timer**: a stopwatch that keeps running even if you refresh the page. Every session is saved with its subject, topic and notes, and you can filter your history by today, week, month or all time.
- **Syllabus tracker**: all 11 GATE CSE subjects with 101 topics. Mark each topic as not started, in progress or completed, and the progress bars update on their own.
- **Habits**: add your own daily habits (like "Solve 30 PYQs") and keep track of your current and best streaks.
- **Analytics**: weekly study hours, time per subject, syllabus progress and habit consistency.
- **Badges**: small rewards for streaks, total study hours and syllabus progress.
- **Light and dark theme**, and it works on mobile too.

## Tech stack

| Part | What I used |
|---|---|
| Frontend | HTML, CSS, vanilla JavaScript |
| Backend | Node.js, Express |
| Database | SQLite (built-in `node:sqlite`) |
| Auth | bcryptjs for passwords, JWT for login |

## Running it locally

You need **Node.js 22 or newer**, because the project uses the built-in `node:sqlite` module.

```bash
git clone https://github.com/YOUR-USERNAME/YOUR-REPO.git
cd YOUR-REPO
npm install
```

Create a `.env` file in the project root (you can copy `.env.example`):

```
PORT=3000
NODE_ENV=development
JWT_SECRET=put_any_long_random_string_here
DATABASE_PATH=./backend/database/gatetrack.db
```

Start the app:

```bash
npm start
```

Then open http://localhost:3000 and register an account. The syllabus and badges are added to the database automatically the first time the server starts.

## Tests

With the server running, open another terminal and run:

```bash
npm run test:api
```

It goes through registration, login, syllabus, timer sessions, habits, check-ins, analytics and badges.

## Project structure

```
backend/
  database/     database setup and syllabus seed
  middleware/   login/JWT check
  routes/       API routes (auth, profile, study sessions, syllabus, habits, badges, check-ins, analytics)
  services/     streak, badge and insight logic
  server.js

frontend/
  *.html        pages (login, dashboard, timer, syllabus, habits, analytics, profile)
  css/          styles
  js/           one script per page, plus shared helpers

test-api.js
package.json
```

## API routes

All routes except register and login need a valid token.

| Route | What it does |
|---|---|
| `/api/auth` | register, login, logout, current user |
| `/api/profile` | get and update profile |
| `/api/study-sessions` | save sessions, get history and stats |
| `/api/syllabus` | get subjects and topics, update topic status, overall progress |
| `/api/habits` | create, edit, delete, toggle for today, history |
| `/api/checkins` | daily reflection |
| `/api/badges` | all badges and the ones you've unlocked |
| `/api/analytics` | study, habit and syllabus stats and insights |

## Ideas for later

- PYQ practice tracker with accuracy per topic
- Mock test analyzer
- Flashcards with spaced repetition
- Study planner with an exam date countdown
