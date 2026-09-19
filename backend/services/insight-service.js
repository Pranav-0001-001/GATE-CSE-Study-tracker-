const db = require('../database/db');
const { formatDate, addDays, getUserStudyStreak } = require('./streak-service');

/**
 * Generate accurate, data-driven improvement insights based on actual user stats.
 */
function generateInsights(userId) {
  const insights = [];
  const today = formatDate(new Date());

  // 1. Check streak insight
  const streak = getUserStudyStreak(userId);
  if (streak.currentStreak >= 3) {
    insights.push({
      type: 'streak',
      icon: '🔥',
      title: `${streak.currentStreak}-Day Study Streak`,
      message: `You have maintained an active study streak for ${streak.currentStreak} consecutive days. Consistency builds champions!`
    });
  }

  // 2. This week vs Last week study time
  const thisWeekStart = addDays(today, -6);
  const lastWeekStart = addDays(today, -13);
  const lastWeekEnd = addDays(today, -7);

  const thisWeekRow = db.prepare(`
    SELECT COALESCE(SUM(duration_seconds), 0) as seconds
    FROM study_sessions
    WHERE user_id = ? AND date(started_at) >= ? AND date(started_at) <= ?
  `).get(userId, thisWeekStart, today);

  const lastWeekRow = db.prepare(`
    SELECT COALESCE(SUM(duration_seconds), 0) as seconds
    FROM study_sessions
    WHERE user_id = ? AND date(started_at) >= ? AND date(started_at) <= ?
  `).get(userId, lastWeekStart, lastWeekEnd);

  const thisWeekHours = Number(((thisWeekRow.seconds || 0) / 3600).toFixed(1));
  const lastWeekHours = Number(((lastWeekRow.seconds || 0) / 3600).toFixed(1));

  if (thisWeekHours > 0) {
    if (lastWeekHours > 0) {
      const diff = Number((thisWeekHours - lastWeekHours).toFixed(1));
      if (diff > 0) {
        insights.push({
          type: 'study_trend',
          icon: '📈',
          title: 'Study Time Growth',
          message: `You studied ${diff} hours more over the last 7 days compared to the prior week (${thisWeekHours}h vs ${lastWeekHours}h).`
        });
      } else if (diff < 0) {
        insights.push({
          type: 'study_trend',
          icon: '⏳',
          title: 'Study Pacing',
          message: `You clocked ${thisWeekHours}h this past week (${Math.abs(diff)}h lower than previous week). Plan a solid focused session to regain momentum!`
        });
      }
    } else {
      insights.push({
        type: 'study_trend',
        icon: '🚀',
        title: 'Weekly Study Momentum',
        message: `You logged ${thisWeekHours} hours of focused preparation across the last 7 days.`
      });
    }
  }

  // 3. Most studied subject
  const topSubject = db.prepare(`
    SELECT s.name, COALESCE(SUM(ss.duration_seconds), 0) as total_seconds
    FROM study_sessions ss
    JOIN subjects s ON ss.subject_id = s.id
    WHERE ss.user_id = ?
    GROUP BY s.id
    ORDER BY total_seconds DESC
    LIMIT 1
  `).get(userId);

  if (topSubject && topSubject.total_seconds > 0) {
    const hours = (topSubject.total_seconds / 3600).toFixed(1);
    insights.push({
      type: 'subject_focus',
      icon: '📚',
      title: 'Top Focus Subject',
      message: `${topSubject.name} is your most studied subject with ${hours} hours recorded.`
    });
  }

  // 4. Syllabus completion progress
  const totalTopicsRow = db.prepare('SELECT COUNT(*) as total FROM topics').get();
  const totalTopics = totalTopicsRow.total || 1;

  const completedRow = db.prepare(`
    SELECT COUNT(*) as completed
    FROM user_topic_progress
    WHERE user_id = ? AND status = 'completed'
  `).get(userId);
  const completed = completedRow.completed || 0;

  if (completed > 0) {
    const pct = Math.round((completed / totalTopics) * 100);
    insights.push({
      type: 'syllabus',
      icon: '🎯',
      title: 'GATE Syllabus Progress',
      message: `You have completed ${completed} out of ${totalTopics} topics (${pct}% of the official GATE CSE syllabus).`
    });
  }

  // 5. Habits performance
  const userHabits = db.prepare(`
    SELECT COUNT(*) as count FROM habits WHERE user_id = ? AND is_active = 1
  `).get(userId).count;

  if (userHabits > 0) {
    const past7DaysCompletions = db.prepare(`
      SELECT COUNT(*) as count
      FROM habit_completions
      WHERE user_id = ? AND completion_date >= ? AND completion_date <= ?
    `).get(userId, thisWeekStart, today).count;

    const possibleCompletions = userHabits * 7;
    const rate = Math.round((past7DaysCompletions / possibleCompletions) * 100);

    if (past7DaysCompletions > 0) {
      insights.push({
        type: 'habit_rate',
        icon: '✅',
        title: 'Weekly Habit Discipline',
        message: `Your habit consistency is at ${rate}% over the past 7 days (${past7DaysCompletions}/${possibleCompletions} completions).`
      });
    }
  }

  // Fallback if brand new user with no data yet
  if (insights.length === 0) {
    insights.push({
      type: 'welcome',
      icon: '🌱',
      title: 'Begin Your GATE Journey',
      message: 'Start your first study session or mark a syllabus topic complete to unlock personalized insights and trend analytics!'
    });
  }

  return insights;
}

module.exports = {
  generateInsights
};
