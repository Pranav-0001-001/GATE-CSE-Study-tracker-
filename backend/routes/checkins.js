const express = require('express');
const router = express.Router();
const db = require('../database/db');
const { authenticateToken } = require('../middleware/auth');
const { formatDate } = require('../services/streak-service');

/**
 * POST /api/checkins
 * Submit or update daily preparation check-in
 */
router.post('/', authenticateToken, (req, res) => {
  try {
    const userId = req.user.id;
    const { rating, accomplishments, tomorrow_focus } = req.body;
    const date = req.body.date || formatDate(new Date());

    const numRating = parseInt(rating, 10);
    if (isNaN(numRating) || numRating < 1 || numRating > 5) {
      return res.status(400).json({ error: 'Rating must be an integer between 1 and 5.' });
    }

    const upsertStmt = db.prepare(`
      INSERT INTO daily_checkins (user_id, date, rating, accomplishments, tomorrow_focus, created_at)
      VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(user_id, date) DO UPDATE SET
        rating = excluded.rating,
        accomplishments = excluded.accomplishments,
        tomorrow_focus = excluded.tomorrow_focus,
        created_at = CURRENT_TIMESTAMP
    `);

    upsertStmt.run(
      userId,
      date,
      numRating,
      accomplishments ? accomplishments.trim() : '',
      tomorrow_focus ? tomorrow_focus.trim() : ''
    );

    const savedCheckin = db.prepare(`
      SELECT * FROM daily_checkins
      WHERE user_id = ? AND date = ?
    `).get(userId, date);

    return res.status(201).json({
      message: 'Daily check-in saved! Keep up the great work.',
      checkin: savedCheckin
    });
  } catch (err) {
    console.error('Save checkin error:', err);
    return res.status(500).json({ error: 'Failed to save daily check-in.' });
  }
});

/**
 * GET /api/checkins
 * Retrieve checkin history
 */
router.get('/', authenticateToken, (req, res) => {
  try {
    const userId = req.user.id;
    const checkins = db.prepare(`
      SELECT * FROM daily_checkins
      WHERE user_id = ?
      ORDER BY date DESC
      LIMIT 30
    `).all(userId);

    return res.json({ checkins });
  } catch (err) {
    console.error('Fetch checkins error:', err);
    return res.status(500).json({ error: 'Failed to fetch check-ins.' });
  }
});

/**
 * GET /api/checkins/today
 * Check if today's checkin is already done
 */
router.get('/today', authenticateToken, (req, res) => {
  try {
    const userId = req.user.id;
    const today = formatDate(new Date());

    const checkin = db.prepare(`
      SELECT * FROM daily_checkins
      WHERE user_id = ? AND date = ?
    `).get(userId, today);

    return res.json({
      today,
      hasCheckedIn: Boolean(checkin),
      checkin: checkin || null
    });
  } catch (err) {
    console.error('Fetch today checkin error:', err);
    return res.status(500).json({ error: 'Failed to fetch today check-in status.' });
  }
});

module.exports = router;
