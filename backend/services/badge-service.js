const db = require('../database/db');
const { getUserStudyStreak } = require('./streak-service');

/**
 * Check and evaluate all badges for a user.
 * Returns any newly unlocked badges.
 */
function evaluateUserBadges(userId) {
  // 1. Gather user metrics
  const streakInfo = getUserStudyStreak(userId);
  const maxStreak = Math.max(streakInfo.currentStreak, streakInfo.bestStreak);

  // Total study hours
  const totalSecondsRow = db.prepare(`
    SELECT COALESCE(SUM(duration_seconds), 0) as total_seconds
    FROM study_sessions
    WHERE user_id = ?
  `).get(userId);
  const totalHours = (totalSecondsRow.total_seconds || 0) / 3600;

  // Syllabus progress
  const totalTopicsRow = db.prepare('SELECT COUNT(*) as total FROM topics').get();
  const totalTopics = totalTopicsRow.total || 1;

  const completedTopicsRow = db.prepare(`
    SELECT COUNT(*) as completed
    FROM user_topic_progress
    WHERE user_id = ? AND status = 'completed'
  `).get(userId);
  const completedTopics = completedTopicsRow.completed || 0;
  const syllabusPercentage = Math.round((completedTopics / totalTopics) * 100);

  // 2. Fetch all badges and already unlocked badges
  const allBadges = db.prepare('SELECT * FROM badges').all();
  const unlockedBadges = db.prepare(`
    SELECT badge_id FROM user_badges WHERE user_id = ?
  `).all(userId);
  const unlockedSet = new Set(unlockedBadges.map(b => b.badge_id));

  const newlyUnlocked = [];

  const insertUserBadge = db.prepare(`
    INSERT INTO user_badges (user_id, badge_id)
    VALUES (?, ?)
    ON CONFLICT(user_id, badge_id) DO NOTHING
  `);

  for (const badge of allBadges) {
    if (unlockedSet.has(badge.id)) continue;

    let qualifies = false;

    if (badge.requirement_type === 'streak_days') {
      qualifies = maxStreak >= badge.requirement_value;
    } else if (badge.requirement_type === 'total_hours') {
      qualifies = totalHours >= badge.requirement_value;
    } else if (badge.requirement_type === 'topics_completed') {
      qualifies = completedTopics >= badge.requirement_value;
    } else if (badge.requirement_type === 'syllabus_percentage') {
      qualifies = syllabusPercentage >= badge.requirement_value;
    }

    if (qualifies) {
      insertUserBadge.run(userId, badge.id);
      newlyUnlocked.push(badge);
    }
  }

  return newlyUnlocked;
}

/**
 * Get all badges for display, annotated with unlocked status
 */
function getUserBadgesCatalog(userId) {
  // First run evaluation so fresh badges are unlocked
  evaluateUserBadges(userId);

  const badges = db.prepare(`
    SELECT b.*,
      ub.unlocked_at,
      CASE WHEN ub.id IS NOT NULL THEN 1 ELSE 0 END as is_unlocked
    FROM badges b
    LEFT JOIN user_badges ub ON b.id = ub.badge_id AND ub.user_id = ?
    ORDER BY b.requirement_value ASC
  `).all(userId);

  return badges;
}

module.exports = {
  evaluateUserBadges,
  getUserBadgesCatalog
};
