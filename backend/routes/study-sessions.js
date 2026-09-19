const express = require('express');
const router = express.Router();
const db = require('../database/db');
const { authenticateToken } = require('../middleware/auth');
const { formatDate, addDays, getUserStudyStreak } = require('../services/streak-service');
const { evaluateUserBadges } = require('../services/badge-service');

/**
 * POST /api/study-sessions
 * Record a completed study session
 */
router.post('/', authenticateToken, (req, res) => {
  try {
    const userId = req.user.id;
    const { subject_id, topic_id, start_time, end_time, duration_seconds, notes } = req.body;

    if (!duration_seconds || duration_seconds <= 0) {
      return res.status(400).json({ error: 'Session duration must be greater than 0 seconds.' });
    }

    const startTime = start_time || new Date(Date.now() - duration_seconds * 1000).toISOString();
    const endTime = end_time || new Date().toISOString();

    const insertStmt = db.prepare(`
      INSERT INTO study_sessions (user_id, subject_id, topic_id, started_at, ended_at, duration_seconds, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    const result = insertStmt.run(
      userId,
      subject_id ? parseInt(subject_id, 10) : null,
      topic_id ? parseInt(topic_id, 10) : null,
      startTime,
      endTime,
      Math.round(duration_seconds),
      notes ? notes.trim() : ''
    );

    // Evaluate badges
    const newBadges = evaluateUserBadges(userId);

    // Fetch the newly inserted session with subject and topic names
    const newSession = db.prepare(`
      SELECT ss.*, s.name as subject_name, t.name as topic_name
      FROM study_sessions ss
      LEFT JOIN subjects s ON ss.subject_id = s.id
      LEFT JOIN topics t ON ss.topic_id = t.id
      WHERE ss.id = ?
    `).get(result.lastInsertRowid);

    return res.status(201).json({
      message: 'Study session saved successfully! 🎉',
      session: newSession,
      unlockedBadges: newBadges
    });
  } catch (err) {
    console.error('Save study session error:', err);
    return res.status(500).json({ error: 'Failed to save study session.' });
  }
});

/**
 * GET /api/study-sessions
 * Retrieve study history with optional filter: 'today', 'week', 'month', 'all'
 */
router.get('/', authenticateToken, (req, res) => {
  try {
    const userId = req.user.id;
    const { filter = 'all' } = req.query;

    let dateCondition = '';
    const params = [userId];

    const today = formatDate(new Date());

    if (filter === 'today') {
      dateCondition = 'AND date(ss.started_at) = ?';
      params.push(today);
    } else if (filter === 'week') {
      const weekStart = addDays(today, -6);
      dateCondition = 'AND date(ss.started_at) >= ?';
      params.push(weekStart);
    } else if (filter === 'month') {
      const monthStart = addDays(today, -29);
      dateCondition = 'AND date(ss.started_at) >= ?';
      params.push(monthStart);
    }

    const sessions = db.prepare(`
      SELECT 
        ss.id,
        ss.subject_id,
        ss.topic_id,
        ss.started_at,
        ss.ended_at,
        ss.duration_seconds,
        ss.notes,
        ss.created_at,
        s.name as subject_name,
        t.name as topic_name
      FROM study_sessions ss
      LEFT JOIN subjects s ON ss.subject_id = s.id
      LEFT JOIN topics t ON ss.topic_id = t.id
      WHERE ss.user_id = ? ${dateCondition}
      ORDER BY ss.started_at DESC
      LIMIT 100
    `).all(...params);

    const totalDurationSeconds = sessions.reduce((acc, curr) => acc + (curr.duration_seconds || 0), 0);

    return res.json({
      filter,
      totalSessions: sessions.length,
      totalDurationSeconds,
      sessions
    });
  } catch (err) {
    console.error('Fetch study sessions error:', err);
    return res.status(500).json({ error: 'Failed to fetch study history.' });
  }
});

/**
 * GET /api/study-sessions/stats
 * Quick metrics for dashboard & timer header
 */
router.get('/stats', authenticateToken, (req, res) => {
  try {
    const userId = req.user.id;
    const today = formatDate(new Date());
    const weekStart = addDays(today, -6);

    // Today's total seconds
    const todayRow = db.prepare(`
      SELECT COALESCE(SUM(duration_seconds), 0) as today_seconds
      FROM study_sessions
      WHERE user_id = ? AND date(started_at) = ?
    `).get(userId, today);

    // Week's total seconds
    const weekRow = db.prepare(`
      SELECT COALESCE(SUM(duration_seconds), 0) as week_seconds
      FROM study_sessions
      WHERE user_id = ? AND date(started_at) >= ?
    `).get(userId, weekStart);

    // All time stats
    const allRow = db.prepare(`
      SELECT 
        COUNT(*) as total_sessions,
        COALESCE(SUM(duration_seconds), 0) as total_seconds
      FROM study_sessions
      WHERE user_id = ?
    `).get(userId);

    const streak = getUserStudyStreak(userId);

    return res.json({
      todaySeconds: todayRow.today_seconds || 0,
      weekSeconds: weekRow.week_seconds || 0,
      totalSeconds: allRow.total_seconds || 0,
      totalSessions: allRow.total_sessions || 0,
      currentStreak: streak.currentStreak,
      bestStreak: streak.bestStreak
    });
  } catch (err) {
    console.error('Study stats error:', err);
    return res.status(500).json({ error: 'Failed to calculate study statistics.' });
  }
});

module.exports = router;
