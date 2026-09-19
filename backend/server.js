const express = require('express');
const path = require('path');
const cors = require('cors');
require('dotenv').config();

// Ensure database and initial syllabus seed
require('./database/db');
const seedSyllabus = require('./database/seed-syllabus');
try {
  seedSyllabus();
} catch (err) {
  console.error('Initial seed warning:', err.message);
}

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
  origin: true,
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve frontend static files
const frontendPath = path.join(__dirname, '..', 'frontend');
app.use(express.static(frontendPath));

// API Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/profile', require('./routes/profile'));
app.use('/api/study-sessions', require('./routes/study-sessions'));
app.use('/api/syllabus', require('./routes/syllabus'));
app.use('/api/habits', require('./routes/habits'));
app.use('/api/badges', require('./routes/badges'));
app.use('/api/checkins', require('./routes/checkins'));
app.use('/api/analytics', require('./routes/analytics'));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    app: 'GATETrack - GATE CSE Study & Habit Tracker',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// Fallback for direct page visits (SPA/Static page fallback)
app.get('/', (req, res) => {
  res.sendFile(path.join(frontendPath, 'index.html'));
});

// 404 API handler
app.use('/api/*', (req, res) => {
  res.status(404).json({ error: 'API endpoint not found' });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled server error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`=======================================================`);
    console.log(`🚀 GATETrack Server running at http://localhost:${PORT}`);
    console.log(`🎯 Frontend served from: ${frontendPath}`);
    console.log(`=======================================================`);
  });
}

module.exports = app;
