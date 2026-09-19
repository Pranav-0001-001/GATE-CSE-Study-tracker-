const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../database/db');
const { authenticateToken, JWT_SECRET } = require('../middleware/auth');

// Default starter habits for a new GATE student
const DEFAULT_HABITS = [
  { name: 'Study 6 hours', description: 'Core GATE preparation time', icon: '⏱️', frequency: 'daily', target: '6 Hours' },
  { name: 'Solve 30 PYQs', description: 'Practice Previous Year Questions', icon: '📝', frequency: 'daily', target: '30 Questions' },
  { name: 'Revise Formulas & Notes', description: 'Quick revision of key formulas', icon: '🧠', frequency: 'daily', target: '30 Minutes' },
  { name: 'Physical Exercise / Walk', description: 'Keep mind and body fresh', icon: '🏃', frequency: 'daily', target: '30 Minutes' }
];

// Helper to create token
function createToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, name: user.name },
    JWT_SECRET,
    { expiresIn: '30d' }
  );
}

// Set auth cookie
function setAuthCookie(res, token) {
  res.cookie('gatetrack_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    sameSite: 'lax'
  });
}

/**
 * POST /api/auth/register
 */
router.post('/register', (req, res) => {
  try {
    const { name, email, password, confirmPassword } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Please enter your full name.' });
    }

    if (!email || !email.trim()) {
      return res.status(400).json({ error: 'Please enter a valid email address.' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return res.status(400).json({ error: 'Please provide a valid email format.' });
    }

    if (!password || password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long.' });
    }

    if (confirmPassword && password !== confirmPassword) {
      return res.status(400).json({ error: 'Passwords do not match.' });
    }

    const trimmedEmail = email.trim().toLowerCase();

    // Check if user already exists
    const existingUser = db.prepare('SELECT id FROM users WHERE email = ?').get(trimmedEmail);
    if (existingUser) {
      return res.status(409).json({ error: 'An account with this email already exists. Please log in.' });
    }

    // Hash password
    const salt = bcrypt.genSaltSync(10);
    const passwordHash = bcrypt.hashSync(password, salt);

    // Insert user
    const insertUser = db.prepare(`
      INSERT INTO users (name, email, password_hash)
      VALUES (?, ?, ?)
    `);
    const result = insertUser.run(name.trim(), trimmedEmail, passwordHash);
    const userId = Number(result.lastInsertRowid);

    // Create user preferences
    db.prepare(`
      INSERT INTO user_preferences (user_id, theme)
      VALUES (?, 'dark')
    `).run(userId);

    // Seed default habits for this user
    const insertHabit = db.prepare(`
      INSERT INTO habits (user_id, name, description, icon, frequency, target)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    for (const h of DEFAULT_HABITS) {
      insertHabit.run(userId, h.name, h.description, h.icon, h.frequency, h.target);
    }

    const user = {
      id: userId,
      name: name.trim(),
      email: trimmedEmail,
      daily_target_hours: 6.0,
      theme: 'dark'
    };

    const token = createToken(user);
    setAuthCookie(res, token);

    return res.status(201).json({
      message: 'Account created successfully! Welcome to GATETrack.',
      token,
      user
    });
  } catch (err) {
    console.error('Registration error:', err);
    return res.status(500).json({ error: 'An unexpected server error occurred during registration.' });
  }
});

/**
 * POST /api/auth/login
 */
router.post('/login', (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !email.trim()) {
      return res.status(400).json({ error: 'Please enter your email address.' });
    }

    if (!password) {
      return res.status(400).json({ error: 'Please enter your password.' });
    }

    const trimmedEmail = email.trim().toLowerCase();
    const userRow = db.prepare(`
      SELECT u.id, u.name, u.email, u.password_hash, u.daily_target_hours,
             COALESCE(up.theme, 'dark') as theme
      FROM users u
      LEFT JOIN user_preferences up ON u.id = up.user_id
      WHERE u.email = ?
    `).get(trimmedEmail);

    if (!userRow) {
      return res.status(401).json({ error: 'Invalid email or password. Please try again.' });
    }

    const isMatch = bcrypt.compareSync(password, userRow.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password. Please try again.' });
    }

    const user = {
      id: userRow.id,
      name: userRow.name,
      email: userRow.email,
      daily_target_hours: userRow.daily_target_hours,
      theme: userRow.theme
    };

    const token = createToken(user);
    setAuthCookie(res, token);

    return res.json({
      message: 'Login successful. Welcome back!',
      token,
      user
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ error: 'An unexpected server error occurred during login.' });
  }
});

/**
 * POST /api/auth/logout
 */
router.post('/logout', (req, res) => {
  res.clearCookie('gatetrack_token');
  return res.json({ message: 'Logged out successfully.' });
});

/**
 * GET /api/auth/me
 */
router.get('/me', authenticateToken, (req, res) => {
  try {
    const userRow = db.prepare(`
      SELECT u.id, u.name, u.email, u.daily_target_hours, u.created_at,
             COALESCE(up.theme, 'dark') as theme
      FROM users u
      LEFT JOIN user_preferences up ON u.id = up.user_id
      WHERE u.id = ?
    `).get(req.user.id);

    if (!userRow) {
      return res.status(404).json({ error: 'User not found.' });
    }

    return res.json({ user: userRow });
  } catch (err) {
    console.error('Auth check error:', err);
    return res.status(500).json({ error: 'Failed to retrieve user session.' });
  }
});

module.exports = router;
