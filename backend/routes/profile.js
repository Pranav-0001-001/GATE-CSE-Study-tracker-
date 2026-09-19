const express = require('express');
const router = express.Router();
const db = require('../database/db');
const { authenticateToken } = require('../middleware/auth');
const { getUserStudyStreak } = require('../services/streak-service');
const { evaluateUserBadges } = require('../services/badge-service');

/**
 * GET /api/profile
 */
router.get('/', authenticateToken, (req, res) => {
  try {
    const userId = req.user.id;

    // Check & trigger badges
    evaluateUserBadges(userId);

    const user = db.prepare(`
      SELECT u.id, u.name, u.email, u.daily_target_hours, u.created_at,
             COALESCE(up.theme, 'dark') as theme
      FROM users u
      LEFT JOIN user_preferences up ON u.id = up.user_id
      WHERE u.id = ?
    `).get(userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    // Study statistics
    const streakInfo = getUserStudyStreak(userId);

    const studyStats = db.prepare(`
      SELECT 
        COUNT(*) as total_sessions,
        COALESCE(SUM(duration_seconds), 0) as total_seconds
      FROM study_sessions
      WHERE user_id = ?
    `).get(userId);

    const totalHours = Number(((studyStats.total_seconds || 0) / 3600).toFixed(1));

    // Syllabus progress
    const totalTopics = db.prepare('SELECT COUNT(*) as count FROM topics').get().count || 1;
    const completedTopics = db.prepare(`
      SELECT COUNT(*) as count FROM user_topic_progress
      WHERE user_id = ? AND status = 'completed'
    `).get(userId).count || 0;
    const syllabusPercentage = Math.round((completedTopics / totalTopics) * 100);

    // Badges count
    const unlockedBadgesCount = db.prepare(`
      SELECT COUNT(*) as count FROM user_badges WHERE user_id = ?
    `).get(userId).count || 0;

    const totalBadgesCount = db.prepare('SELECT COUNT(*) as count FROM badges').get().count || 0;

    return res.json({
      user,
      stats: {
        totalHours,
        totalSessions: studyStats.total_sessions || 0,
        currentStreak: streakInfo.currentStreak,
        bestStreak: streakInfo.bestStreak,
        syllabusPercentage,
        completedTopics,
        totalTopics,
        unlockedBadgesCount,
        totalBadgesCount
      }
    });
  } catch (err) {
    console.error('Profile retrieval error:', err);
    return res.status(500).json({ error: 'Failed to load user profile.' });
  }
});

/**
 * PUT /api/profile
 */
router.put('/', authenticateToken, (req, res) => {
  try {
    const userId = req.user.id;
    const { name, daily_target_hours, theme } = req.body;

    if (name && name.trim()) {
      db.prepare(`
        UPDATE users
        SET name = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(name.trim(), userId);
    }

    if (daily_target_hours !== undefined) {
      const hours = parseFloat(daily_target_hours);
      if (!isNaN(hours) && hours > 0 && hours <= 24) {
        db.prepare(`
          UPDATE users
          SET daily_target_hours = ?, updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `).run(hours, userId);
      }
    }

    if (theme && (theme === 'light' || theme === 'dark')) {
      db.prepare(`
        INSERT INTO user_preferences (user_id, theme, updated_at)
        VALUES (?, ?, CURRENT_TIMESTAMP)
        ON CONFLICT(user_id) DO UPDATE SET
          theme = excluded.theme,
          updated_at = CURRENT_TIMESTAMP
      `).run(userId, theme);
    }

    const updatedUser = db.prepare(`
      SELECT u.id, u.name, u.email, u.daily_target_hours,
             COALESCE(up.theme, 'dark') as theme
      FROM users u
      LEFT JOIN user_preferences up ON u.id = up.user_id
      WHERE u.id = ?
    `).get(userId);

    return res.json({
      message: 'Profile updated successfully!',
      user: updatedUser
    });
  } catch (err) {
    console.error('Profile update error:', err);
    return res.status(500).json({ error: 'Failed to update profile.' });
  }
});

module.exports = router;
