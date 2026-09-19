const express = require('express');
const router = express.Router();
const db = require('../database/db');
const { authenticateToken } = require('../middleware/auth');
const { formatDate, addDays, getUserStudyStreak } = require('../services/streak-service');
const { generateInsights } = require('../services/insight-service');

/**
 * GET /api/analytics/overview
 * Top-level metrics and data-driven insights
 */
router.get('/overview', authenticateToken, (req, res) => {
  try {
    const userId = req.user.id;
    const today = formatDate(new Date());

    // 1. Study time & sessions
    const studyTotals = db.prepare(`
      SELECT 
        COUNT(*) as total_sessions,
        COALESCE(SUM(duration_seconds), 0) as total_seconds,
        COUNT(DISTINCT date(started_at)) as distinct_days
      FROM study_sessions
      WHERE user_id = ?
    `).get(userId);

    const totalSeconds = studyTotals.total_seconds || 0;
    const totalHours = Number((totalSeconds / 3600).toFixed(1));
    const totalSessions = studyTotals.total_sessions || 0;
    const distinctDays = Math.max(1, studyTotals.distinct_days || 1);
    const avgDailyHours = totalSeconds > 0 ? Number((totalHours / distinctDays).toFixed(1)) : 0;

    // 2. Streaks
    const streak = getUserStudyStreak(userId);

    // 3. Syllabus progress
    const totalTopics = db.prepare('SELECT COUNT(*) as total FROM topics').get().total || 1;
    const completedTopics = db.prepare(`
      SELECT COUNT(*) as completed FROM user_topic_progress
      WHERE user_id = ? AND status = 'completed'
    `).get(userId).completed || 0;
    const syllabusPercentage = Math.round((completedTopics / totalTopics) * 100);

    // 4. Habit completion percentage today
    const totalHabits = db.prepare('SELECT COUNT(*) as count FROM habits WHERE user_id = ? AND is_active = 1').get(userId).count || 0;
    const completedHabitsToday = db.prepare(`
      SELECT COUNT(*) as count FROM habit_completions
      WHERE user_id = ? AND completion_date = ?
    `).get(userId, today).count || 0;
    const habitCompletionToday = totalHabits > 0 ? Math.round((completedHabitsToday / totalHabits) * 100) : 0;

    // 5. Dynamic improvement insights
    const insights = generateInsights(userId);

    return res.json({
      metrics: {
        totalHours,
        totalSeconds,
        totalSessions,
        avgDailyHours,
        currentStreak: streak.currentStreak,
        bestStreak: streak.bestStreak,
        syllabusPercentage,
        completedTopics,
        totalTopics,
        habitCompletionToday,
        totalHabits
      },
      insights
    });
  } catch (err) {
    console.error('Analytics overview error:', err);
    return res.status(500).json({ error: 'Failed to generate analytics overview.' });
  }
});

/**
 * GET /api/analytics/study
 * Weekly distribution (past 7 days) and subject-wise study time
 */
router.get('/study', authenticateToken, (req, res) => {
  try {
    const userId = req.user.id;
    const today = formatDate(new Date());

    // Past 7 days array
    const past7Days = [];
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    for (let i = 6; i >= 0; i--) {
      const dateStr = addDays(today, -i);
      const [y, m, d] = dateStr.split('-').map(Number);
      const dayDate = new Date(y, m - 1, d);
      past7Days.push({
        date: dateStr,
        dayName: dayNames[dayDate.getDay()],
        label: `${dayNames[dayDate.getDay()]} (${d})`,
        seconds: 0,
        hours: 0
      });
    }

    const weeklySessions = db.prepare(`
      SELECT date(started_at) as session_date, COALESCE(SUM(duration_seconds), 0) as day_seconds
      FROM study_sessions
      WHERE user_id = ? AND date(started_at) >= ? AND date(started_at) <= ?
      GROUP BY date(started_at)
    `).all(userId, past7Days[0].date, today);

    const weeklyMap = {};
    for (const r of weeklySessions) {
      weeklyMap[r.session_date] = r.day_seconds;
    }

    past7Days.forEach(day => {
      const secs = weeklyMap[day.date] || 0;
      day.seconds = secs;
      day.hours = Number((secs / 3600).toFixed(2));
    });

    // Subject-wise breakdown
    const subjectRows = db.prepare(`
      SELECT 
        s.id,
        s.name,
        s.code,
        COALESCE(SUM(ss.duration_seconds), 0) as total_seconds
      FROM subjects s
      LEFT JOIN study_sessions ss ON s.id = ss.subject_id AND ss.user_id = ?
      GROUP BY s.id
      ORDER BY total_seconds DESC, s.display_order ASC
    `).all(userId);

    const totalStudySecs = subjectRows.reduce((acc, curr) => acc + curr.total_seconds, 0);

    const subjectStats = subjectRows.map(s => {
      const hours = Number((s.total_seconds / 3600).toFixed(1));
      const percentage = totalStudySecs > 0 ? Math.round((s.total_seconds / totalStudySecs) * 100) : 0;
      return {
        id: s.id,
        name: s.name,
        code: s.code,
        seconds: s.total_seconds,
        hours,
        percentage
      };
    });

    return res.json({
      past7Days,
      totalWeeklyHours: Number((past7Days.reduce((a, b) => a + b.seconds, 0) / 3600).toFixed(1)),
      subjectStats
    });
  } catch (err) {
    console.error('Study analytics error:', err);
    return res.status(500).json({ error: 'Failed to generate study charts data.' });
  }
});

/**
 * GET /api/analytics/habits
 * 7-day habit completion rates & habit breakdown
 */
router.get('/habits', authenticateToken, (req, res) => {
  try {
    const userId = req.user.id;
    const today = formatDate(new Date());

    const past7Days = [];
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    const totalActiveHabits = db.prepare(`
      SELECT COUNT(*) as count FROM habits WHERE user_id = ? AND is_active = 1
    `).get(userId).count || 0;

    for (let i = 6; i >= 0; i--) {
      const dateStr = addDays(today, -i);
      const [y, m, d] = dateStr.split('-').map(Number);
      const dayDate = new Date(y, m - 1, d);

      const completedOnDate = db.prepare(`
        SELECT COUNT(*) as count
        FROM habit_completions
        WHERE user_id = ? AND completion_date = ?
      `).get(userId, dateStr).count || 0;

      const rate = totalActiveHabits > 0 ? Math.round((completedOnDate / totalActiveHabits) * 100) : 0;

      past7Days.push({
        date: dateStr,
        dayName: dayNames[dayDate.getDay()],
        label: dayNames[dayDate.getDay()],
        completedCount: completedOnDate,
        totalHabits: totalActiveHabits,
        completionPercentage: rate
      });
    }

    return res.json({ past7Days, totalActiveHabits });
  } catch (err) {
    console.error('Habits analytics error:', err);
    return res.status(500).json({ error: 'Failed to generate habits analytics.' });
  }
});

/**
 * GET /api/analytics/syllabus
 * Subject-by-subject syllabus completion metrics
 */
router.get('/syllabus', authenticateToken, (req, res) => {
  try {
    const userId = req.user.id;

    const subjects = db.prepare(`
      SELECT id, name, code, display_order
      FROM subjects
      ORDER BY display_order ASC
    `).all();

    const subjectProgress = subjects.map(s => {
      const totalTopics = db.prepare('SELECT COUNT(*) as total FROM topics WHERE subject_id = ?').get(s.id).total || 0;
      const completedTopics = db.prepare(`
        SELECT COUNT(*) as completed
        FROM user_topic_progress utp
        JOIN topics t ON utp.topic_id = t.id
        WHERE utp.user_id = ? AND t.subject_id = ? AND utp.status = 'completed'
      `).get(userId, s.id).completed || 0;

      const percentage = totalTopics > 0 ? Math.round((completedTopics / totalTopics) * 100) : 0;

      return {
        id: s.id,
        name: s.name,
        code: s.code,
        totalTopics,
        completedTopics,
        percentage
      };
    });

    return res.json({ subjectProgress });
  } catch (err) {
    console.error('Syllabus analytics error:', err);
    return res.status(500).json({ error: 'Failed to generate syllabus analytics.' });
  }
});

module.exports = router;
