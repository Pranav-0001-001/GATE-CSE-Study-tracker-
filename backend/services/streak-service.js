const db = require('../database/db');

/**
 * Format a Date object to YYYY-MM-DD in local time
 */
function formatDate(d) {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Subtract days from a date string (YYYY-MM-DD)
 */
function addDays(dateStr, days) {
  const [y, m, d] = dateStr.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  dt.setDate(dt.getDate() + days);
  return formatDate(dt);
}

/**
 * Calculate current & best streak from a sorted list of unique YYYY-MM-DD date strings
 */
function calculateConsecutiveStreaks(dateStrings) {
  if (!dateStrings || dateStrings.length === 0) {
    return { currentStreak: 0, bestStreak: 0 };
  }

  const dateSet = new Set(dateStrings);
  const today = formatDate(new Date());
  const yesterday = addDays(today, -1);

  // Calculate Current Streak
  let currentStreak = 0;
  let checkDate = null;

  if (dateSet.has(today)) {
    checkDate = today;
  } else if (dateSet.has(yesterday)) {
    checkDate = yesterday;
  }

  if (checkDate) {
    while (dateSet.has(checkDate)) {
      currentStreak++;
      checkDate = addDays(checkDate, -1);
    }
  }

  // Calculate Best Streak across history
  // Sort dates chronologically ascending
  const sortedDates = Array.from(dateSet).sort();
  let bestStreak = 0;
  let currentRun = 0;
  let prevDate = null;

  for (const dt of sortedDates) {
    if (!prevDate) {
      currentRun = 1;
    } else {
      const expectedNext = addDays(prevDate, 1);
      if (dt === expectedNext) {
        currentRun++;
      } else {
        currentRun = 1;
      }
    }
    if (currentRun > bestStreak) {
      bestStreak = currentRun;
    }
    prevDate = dt;
  }

  return { currentStreak, bestStreak };
}

/**
 * Calculate overall user study streak based on study_sessions
 */
function getUserStudyStreak(userId) {
  // Extract distinct dates where user had sessions
  const rows = db.prepare(`
    SELECT DISTINCT date(started_at) as session_date
    FROM study_sessions
    WHERE user_id = ? AND duration_seconds > 0
    ORDER BY session_date ASC
  `).all(userId);

  const dates = rows.map(r => r.session_date).filter(Boolean);
  return calculateConsecutiveStreaks(dates);
}

/**
 * Calculate streak for a specific habit
 */
function getHabitStreak(habitId, userId) {
  const rows = db.prepare(`
    SELECT DISTINCT completion_date
    FROM habit_completions
    WHERE habit_id = ? AND user_id = ?
    ORDER BY completion_date ASC
  `).all(habitId, userId);

  const dates = rows.map(r => r.completion_date).filter(Boolean);
  const streaks = calculateConsecutiveStreaks(dates);

  // Also calculate total completions and 30-day rate
  const totalCompletions = dates.length;
  const thirtyDaysAgo = addDays(formatDate(new Date()), -30);
  const recentCompletions = dates.filter(d => d >= thirtyDaysAgo).length;
  const completionRate = Math.min(100, Math.round((recentCompletions / 30) * 100));

  return {
    currentStreak: streaks.currentStreak,
    bestStreak: streaks.bestStreak,
    totalCompletions,
    completionRate
  };
}

module.exports = {
  formatDate,
  addDays,
  calculateConsecutiveStreaks,
  getUserStudyStreak,
  getHabitStreak
};
