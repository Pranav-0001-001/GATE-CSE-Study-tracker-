const express = require('express');
const router = express.Router();
const db = require('../database/db');
const { authenticateToken } = require('../middleware/auth');
const { evaluateUserBadges } = require('../services/badge-service');

/**
 * GET /api/syllabus
 * Fetch all subjects with topics and current user status
 */
router.get('/', authenticateToken, (req, res) => {
  try {
    const userId = req.user.id;

    const subjects = db.prepare(`
      SELECT id, name, code, description, display_order
      FROM subjects
      ORDER BY display_order ASC
    `).all();

    const topics = db.prepare(`
      SELECT 
        t.id,
        t.subject_id,
        t.name,
        t.description,
        t.display_order,
        COALESCE(utp.status, 'not_started') as status,
        utp.updated_at
      FROM topics t
      LEFT JOIN user_topic_progress utp ON t.id = utp.topic_id AND utp.user_id = ?
      ORDER BY t.display_order ASC
    `).all(userId);

    // Group topics by subject_id
    const topicMap = {};
    for (const t of topics) {
      if (!topicMap[t.subject_id]) topicMap[t.subject_id] = [];
      topicMap[t.subject_id].push(t);
    }

    let overallTotal = 0;
    let overallCompleted = 0;
    let overallInProgress = 0;

    const subjectList = subjects.map(s => {
      const sTopics = topicMap[s.id] || [];
      const total = sTopics.length;
      const completed = sTopics.filter(t => t.status === 'completed').length;
      const inProgress = sTopics.filter(t => t.status === 'in_progress').length;
      const notStarted = total - completed - inProgress;
      const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

      overallTotal += total;
      overallCompleted += completed;
      overallInProgress += inProgress;

      return {
        ...s,
        totalTopics: total,
        completedTopics: completed,
        inProgressTopics: inProgress,
        notStartedTopics: notStarted,
        percentage,
        topics: sTopics
      };
    });

    const overallNotStarted = overallTotal - overallCompleted - overallInProgress;
    const overallPercentage = overallTotal > 0 ? Math.round((overallCompleted / overallTotal) * 100) : 0;

    return res.json({
      summary: {
        totalTopics: overallTotal,
        completedTopics: overallCompleted,
        inProgressTopics: overallInProgress,
        notStartedTopics: overallNotStarted,
        percentage: overallPercentage
      },
      subjects: subjectList
    });
  } catch (err) {
    console.error('Fetch syllabus error:', err);
    return res.status(500).json({ error: 'Failed to fetch syllabus.' });
  }
});

/**
 * GET /api/syllabus/progress
 * Overall syllabus metrics for dashboard
 */
router.get('/progress', authenticateToken, (req, res) => {
  try {
    const userId = req.user.id;

    const totalTopicsRow = db.prepare('SELECT COUNT(*) as total FROM topics').get();
    const totalTopics = totalTopicsRow.total || 0;

    const statusCounts = db.prepare(`
      SELECT 
        status, 
        COUNT(*) as count
      FROM user_topic_progress
      WHERE user_id = ?
      GROUP BY status
    `).all(userId);

    let completed = 0;
    let inProgress = 0;

    for (const row of statusCounts) {
      if (row.status === 'completed') completed = row.count;
      if (row.status === 'in_progress') inProgress = row.count;
    }

    const notStarted = Math.max(0, totalTopics - completed - inProgress);
    const percentage = totalTopics > 0 ? Math.round((completed / totalTopics) * 100) : 0;

    return res.json({
      totalTopics,
      completedTopics: completed,
      inProgressTopics: inProgress,
      notStartedTopics: notStarted,
      percentage
    });
  } catch (err) {
    console.error('Syllabus progress error:', err);
    return res.status(500).json({ error: 'Failed to calculate syllabus progress.' });
  }
});

/**
 * PUT /api/syllabus/topics/:id
 * Update status of a topic ('not_started', 'in_progress', 'completed')
 */
router.put('/topics/:id', authenticateToken, (req, res) => {
  try {
    const userId = req.user.id;
    const topicId = parseInt(req.params.id, 10);
    const { status } = req.body;

    if (!['not_started', 'in_progress', 'completed'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status. Must be not_started, in_progress, or completed.' });
    }

    // Verify topic exists
    const topicExists = db.prepare('SELECT id, subject_id, name FROM topics WHERE id = ?').get(topicId);
    if (!topicExists) {
      return res.status(404).json({ error: 'Topic not found.' });
    }

    // Upsert status
    const upsertStmt = db.prepare(`
      INSERT INTO user_topic_progress (user_id, topic_id, status, updated_at)
      VALUES (?, ?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(user_id, topic_id) DO UPDATE SET
        status = excluded.status,
        updated_at = CURRENT_TIMESTAMP
    `);
    upsertStmt.run(userId, topicId, status);

    // Evaluate badges
    const newBadges = evaluateUserBadges(userId);

    // Recalculate subject progress
    const subjectTopics = db.prepare(`
      SELECT t.id, COALESCE(utp.status, 'not_started') as status
      FROM topics t
      LEFT JOIN user_topic_progress utp ON t.id = utp.topic_id AND utp.user_id = ?
      WHERE t.subject_id = ?
    `).all(userId, topicExists.subject_id);

    const subjectTotal = subjectTopics.length;
    const subjectCompleted = subjectTopics.filter(t => t.status === 'completed').length;
    const subjectPct = subjectTotal > 0 ? Math.round((subjectCompleted / subjectTotal) * 100) : 0;

    // Recalculate total progress
    const allTopicsCount = db.prepare('SELECT COUNT(*) as total FROM topics').get().total || 1;
    const totalCompleted = db.prepare(`
      SELECT COUNT(*) as count FROM user_topic_progress
      WHERE user_id = ? AND status = 'completed'
    `).get(userId).count || 0;
    const totalPct = Math.round((totalCompleted / allTopicsCount) * 100);

    return res.json({
      message: 'Topic status updated successfully.',
      topicId,
      status,
      subjectId: topicExists.subject_id,
      subjectPercentage: subjectPct,
      overallPercentage: totalPct,
      completedTopics: totalCompleted,
      totalTopics: allTopicsCount,
      unlockedBadges: newBadges
    });
  } catch (err) {
    console.error('Topic update error:', err);
    return res.status(500).json({ error: 'Failed to update topic status.' });
  }
});

module.exports = router;
