const express = require('express');
const router = express.Router();
const db = require('../database/db');
const { authenticateToken } = require('../middleware/auth');
const { formatDate, addDays, getHabitStreak } = require('../services/streak-service');
const { evaluateUserBadges } = require('../services/badge-service');

/**
 * GET /api/habits
 * Fetch all habits for user with today's status & streaks
 */
router.get('/', authenticateToken, (req, res) => {
  try {
    const userId = req.user.id;
    const today = formatDate(new Date());

    const habits = db.prepare(`
      SELECT 
        h.*,
        CASE WHEN hc.id IS NOT NULL THEN 1 ELSE 0 END as is_completed_today
      FROM habits h
      LEFT JOIN habit_completions hc ON h.id = hc.habit_id AND hc.completion_date = ?
      WHERE h.user_id = ? AND h.is_active = 1
      ORDER BY h.created_at ASC
    `).all(today, userId);

    const habitsWithStreaks = habits.map(h => {
      const streakInfo = getHabitStreak(h.id, userId);
      return {
        ...h,
        is_completed_today: Boolean(h.is_completed_today),
        currentStreak: streakInfo.currentStreak,
        bestStreak: streakInfo.bestStreak,
        totalCompletions: streakInfo.totalCompletions,
        completionRate: streakInfo.completionRate
      };
    });

    const totalCount = habitsWithStreaks.length;
    const completedCount = habitsWithStreaks.filter(h => h.is_completed_today).length;
    const completionPercentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

    return res.json({
      todayDate: today,
      summary: {
        total: totalCount,
        completedToday: completedCount,
        percentageToday: completionPercentage
      },
      habits: habitsWithStreaks
    });
  } catch (err) {
    console.error('Fetch habits error:', err);
    return res.status(500).json({ error: 'Failed to fetch habits.' });
  }
});

/**
 * POST /api/habits
 * Create a new custom habit
 */
router.post('/', authenticateToken, (req, res) => {
  try {
    const userId = req.user.id;
    const { name, description, icon, frequency, target } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Please provide a habit name.' });
    }

    const insertStmt = db.prepare(`
      INSERT INTO habits (user_id, name, description, icon, frequency, target)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    const result = insertStmt.run(
      userId,
      name.trim(),
      description ? description.trim() : '',
      icon ? icon.trim() : '🎯',
      frequency ? frequency.trim() : 'daily',
      target ? target.trim() : 'Once a day'
    );

    const newHabit = db.prepare('SELECT * FROM habits WHERE id = ?').get(result.lastInsertRowid);

    return res.status(201).json({
      message: 'Habit created successfully!',
      habit: {
        ...newHabit,
        is_completed_today: false,
        currentStreak: 0,
        bestStreak: 0,
        totalCompletions: 0,
        completionRate: 0
      }
    });
  } catch (err) {
    console.error('Create habit error:', err);
    return res.status(500).json({ error: 'Failed to create habit.' });
  }
});

/**
 * PUT /api/habits/:id
 * Update an existing habit
 */
router.put('/:id', authenticateToken, (req, res) => {
  try {
    const userId = req.user.id;
    const habitId = parseInt(req.params.id, 10);
    const { name, description, icon, frequency, target } = req.body;

    const habit = db.prepare('SELECT * FROM habits WHERE id = ? AND user_id = ?').get(habitId, userId);
    if (!habit) {
      return res.status(404).json({ error: 'Habit not found.' });
    }

    db.prepare(`
      UPDATE habits
      SET name = COALESCE(?, name),
          description = COALESCE(?, description),
          icon = COALESCE(?, icon),
          frequency = COALESCE(?, frequency),
          target = COALESCE(?, target)
      WHERE id = ? AND user_id = ?
    `).run(
      name ? name.trim() : null,
      description !== undefined ? description.trim() : null,
      icon ? icon.trim() : null,
      frequency ? frequency.trim() : null,
      target ? target.trim() : null,
      habitId,
      userId
    );

    const updated = db.prepare('SELECT * FROM habits WHERE id = ?').get(habitId);
    return res.json({ message: 'Habit updated successfully.', habit: updated });
  } catch (err) {
    console.error('Update habit error:', err);
    return res.status(500).json({ error: 'Failed to update habit.' });
  }
});

/**
 * DELETE /api/habits/:id
 * Remove habit and its completion history
 */
router.delete('/:id', authenticateToken, (req, res) => {
  try {
    const userId = req.user.id;
    const habitId = parseInt(req.params.id, 10);

    const habit = db.prepare('SELECT id FROM habits WHERE id = ? AND user_id = ?').get(habitId, userId);
    if (!habit) {
      return res.status(404).json({ error: 'Habit not found.' });
    }

    db.prepare('DELETE FROM habits WHERE id = ? AND user_id = ?').run(habitId, userId);

    return res.json({ message: 'Habit deleted successfully.' });
  } catch (err) {
    console.error('Delete habit error:', err);
    return res.status(500).json({ error: 'Failed to delete habit.' });
  }
});

/**
 * POST /api/habits/:id/toggle
 * Toggle completion status for a given date (defaults to today)
 */
router.post('/:id/toggle', authenticateToken, (req, res) => {
  try {
    const userId = req.user.id;
    const habitId = parseInt(req.params.id, 10);
    const targetDate = req.body.date || formatDate(new Date());

    const habit = db.prepare('SELECT id, name FROM habits WHERE id = ? AND user_id = ?').get(habitId, userId);
    if (!habit) {
      return res.status(404).json({ error: 'Habit not found.' });
    }

    // Check if already completed on this date
    const existing = db.prepare(`
      SELECT id FROM habit_completions
      WHERE habit_id = ? AND completion_date = ?
    `).get(habitId, targetDate);

    let isCompletedNow = false;

    if (existing) {
      // Toggle off
      db.prepare('DELETE FROM habit_completions WHERE id = ?').run(existing.id);
      isCompletedNow = false;
    } else {
      // Toggle on
      db.prepare(`
        INSERT INTO habit_completions (habit_id, user_id, completion_date, value)
        VALUES (?, ?, ?, 1)
      `).run(habitId, userId, targetDate);
      isCompletedNow = true;
    }

    const streakInfo = getHabitStreak(habitId, userId);
    const newBadges = evaluateUserBadges(userId);

    // Calculate updated summary for today
    const allHabits = db.prepare(`
      SELECT h.id, CASE WHEN hc.id IS NOT NULL THEN 1 ELSE 0 END as is_done
      FROM habits h
      LEFT JOIN habit_completions hc ON h.id = hc.habit_id AND hc.completion_date = ?
      WHERE h.user_id = ? AND h.is_active = 1
    `).all(targetDate, userId);

    const total = allHabits.length;
    const completed = allHabits.filter(h => h.is_done).length;
    const pct = total > 0 ? Math.round((completed / total) * 100) : 0;

    return res.json({
      message: isCompletedNow ? `Completed: ${habit.name}!` : `Marked incomplete: ${habit.name}.`,
      isCompleted: isCompletedNow,
      streakInfo,
      summary: {
        total,
        completedToday: completed,
        percentageToday: pct
      },
      unlockedBadges: newBadges
    });
  } catch (err) {
    console.error('Toggle habit completion error:', err);
    return res.status(500).json({ error: 'Failed to update habit completion.' });
  }
});

/**
 * GET /api/habits/:id/history
 * Fetch completion history for the last 30 days
 */
router.get('/:id/history', authenticateToken, (req, res) => {
  try {
    const userId = req.user.id;
    const habitId = parseInt(req.params.id, 10);
    const today = formatDate(new Date());
    const thirtyDaysAgo = addDays(today, -29);

    const completions = db.prepare(`
      SELECT completion_date
      FROM habit_completions
      WHERE habit_id = ? AND user_id = ? AND completion_date >= ?
      ORDER BY completion_date ASC
    `).all(habitId, userId, thirtyDaysAgo);

    const completedDates = completions.map(c => c.completion_date);

    return res.json({
      habitId,
      today,
      startDate: thirtyDaysAgo,
      completedDates
    });
  } catch (err) {
    console.error('Habit history error:', err);
    return res.status(500).json({ error: 'Failed to fetch habit history.' });
  }
});

module.exports = router;
