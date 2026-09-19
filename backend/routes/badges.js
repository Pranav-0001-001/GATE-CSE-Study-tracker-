const express = require('express');
const router = express.Router();
const db = require('../database/db');
const { authenticateToken } = require('../middleware/auth');
const { getUserBadgesCatalog, evaluateUserBadges } = require('../services/badge-service');

/**
 * GET /api/badges
 * Full catalog of badges with user unlocked state
 */
router.get('/', authenticateToken, (req, res) => {
  try {
    const userId = req.user.id;
    const badges = getUserBadgesCatalog(userId);
    return res.json({ badges });
  } catch (err) {
    console.error('Fetch badges error:', err);
    return res.status(500).json({ error: 'Failed to fetch badges.' });
  }
});

/**
 * GET /api/badges/user
 * Only the badges unlocked by current user
 */
router.get('/user', authenticateToken, (req, res) => {
  try {
    const userId = req.user.id;
    evaluateUserBadges(userId);

    const unlocked = db.prepare(`
      SELECT b.*, ub.unlocked_at
      FROM user_badges ub
      JOIN badges b ON ub.badge_id = b.id
      WHERE ub.user_id = ?
      ORDER BY ub.unlocked_at DESC
    `).all(userId);

    return res.json({ badges: unlocked });
  } catch (err) {
    console.error('Fetch user badges error:', err);
    return res.status(500).json({ error: 'Failed to fetch unlocked badges.' });
  }
});

module.exports = router;
